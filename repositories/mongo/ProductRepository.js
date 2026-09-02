const { Db, Collection, ObjectId } = require('mongodb');
const { EmbeddedRepositoryWithPagination } = require('./EmbeddedRepository.js');

const COLLECTION_PRODUCTS = 'products';

/**
 * MongoDB Product Repository implementing IProductRepository interface
 * Uses embedded document pattern per MONGODB_SCHEMA_PROPOSAL.md
 */
class MongoProductRepository extends EmbeddedRepositoryWithPagination {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
    this.collectionName = COLLECTION_PRODUCTS;
    this.parentIdField = '_id';
    this.childrenField = 'supplies';
  }

  /**
   * Find all products for a user (without embedded supplies/recipes for performance)
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async findAllByUserId(userId) {
    return this.collection
      .find({ userid: userId })
      .sort({ _id: -1 })
      .project({ supplies: 0, recipes: 0 })
      .toArray();
  }

  /**
   * Find product by ID with embedded supplies and recipes
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>}
   */
  async findById(userId, productId) {
    if (!ObjectId.isValid(productId)) return null;

    const product = await this.collection.findOne({
      _id: new ObjectId(productId),
      userid: userId
    });

    if (!product) return null;

    return this.mapToProductWithDetails(product);
  }

  /**
   * Create a new product with embedded supplies and recipes (atomic)
   * @param {Object} data - Product data including supplies and recipes
   * @returns {Promise<string>} Created product ID
   */
  async create(data) {
    const doc = {
      product_name: data.name,
      userid: data.userId,
      profit_percentage: data.prof,
      price: data.price,
      product_cost: data.cost,
      product_cost_with_tax: data.costWithTax,
      product_cost_with_markup: data.costWithMarkup,
      product_cost_with_markup_tax: data.costWithMarkupTax,
      total_fichas: data.totalFichas,
      total_extras: data.totalExtras,
      supplies: (data.supplies ?? []).map(s => ({
        ...s,
        _id: new ObjectId(),
        identity_id: s.id ?? s.identity_id,
        name: s.name,
        value: s.value,
        qt: s.qt,
        qtvalue: s.qtValue ?? s.qtvalue,
        unit: s.unit,
        computed_cost: this.computeSupplyCost(s.value, s.qt, s.qtValue ?? s.qtvalue, s.unit)
      })),
      recipes: (data.recipes ?? []).map(r => ({
        ...r,
        _id: new ObjectId(),
        identity_id: r.id ?? r.identity_id,
        recipe_name: r.name,
        quantity: r.quantity,
        yieldvalue: r.yieldValue,
        yieldvalueunit: r.yieldValueUnit,
        myprice: r.myprice ?? 0,
        myprof: r.myprof ?? 0,
        profit: r.profit ?? 0,
        total: r.total,
        totalwithtax: r.totalWithTax,
        margemper: r.margemper ?? '0',
        products: (r.products ?? []).map(p => ({
          ...p,
          _id: new ObjectId(),
          identity_id: p.id ?? p.identity_id,
          recipe_product_name: p.name,
          value: p.value,
          status: p.status,
          qt: p.qt,
          qtvalue: p.qtValue ?? p.qtvalue,
          unit: p.unit,
          computed_cost: this.computeRecipeProductCost(p.value, p.qt, p.qtValue ?? p.qtvalue, p.unit)
        }))
      })),
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    };

    const result = await this.collection.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Update product (replace all fields including embedded supplies/recipes)
   * @param {string} productId - Product ID
   * @param {Object} data - Updated product data
   * @returns {Promise<boolean>} Whether product was modified
   */
  async update(productId, data) {
    if (!ObjectId.isValid(productId)) return false;

    const updateDoc = {
      product_name: data.name,
      profit_percentage: data.prof,
      price: data.price,
      product_cost: data.cost,
      product_cost_with_tax: data.costWithTax,
      product_cost_with_markup: data.costWithMarkup,
      product_cost_with_markup_tax: data.costWithMarkupTax,
      total_fichas: data.totalFichas,
      total_extras: data.totalExtras,
      updated_at: new Date()
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateDoc, $inc: { version: 1 } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update product with embedded supplies and recipes (full replace)
   * @param {string} productId - Product ID
   * @param {Object} data - Updated product data including supplies and recipes
   * @returns {Promise<boolean>} Whether product was modified
   */
  async updateWithEmbedded(productId, data) {
    if (!ObjectId.isValid(productId)) return false;

    const updateDoc = {
      product_name: data.name,
      profit_percentage: data.prof,
      price: data.price,
      product_cost: data.cost,
      product_cost_with_tax: data.costWithTax,
      product_cost_with_markup: data.costWithMarkup,
      product_cost_with_markup_tax: data.costWithMarkupTax,
      total_fichas: data.totalFichas,
      total_extras: data.totalExtras,
      supplies: (data.supplies ?? []).map(s => ({
        ...s,
        _id: new ObjectId(),
        identity_id: s.id ?? s.identity_id,
        name: s.name,
        value: s.value,
        qt: s.qt,
        qtvalue: s.qtValue ?? s.qtvalue,
        unit: s.unit,
        computed_cost: this.computeSupplyCost(s.value, s.qt, s.qtValue ?? s.qtvalue, s.unit)
      })),
      recipes: (data.recipes ?? []).map(r => ({
        ...r,
        _id: new ObjectId(),
        identity_id: r.id ?? r.identity_id,
        recipe_name: r.name,
        quantity: r.quantity,
        yieldvalue: r.yieldValue,
        yieldvalueunit: r.yieldValueUnit,
        myprice: r.myprice ?? 0,
        myprof: r.myprof ?? 0,
        profit: r.profit ?? 0,
        total: r.total,
        totalwithtax: r.totalWithTax,
        margemper: r.margemper ?? '0',
        products: (r.products ?? []).map(p => ({
          ...p,
          _id: new ObjectId(),
          identity_id: p.id ?? p.identity_id,
          recipe_product_name: p.name,
          value: p.value,
          status: p.status,
          qt: p.qt,
          qtvalue: p.qtValue ?? p.qtvalue,
          unit: p.unit,
          computed_cost: this.computeRecipeProductCost(p.value, p.qt, p.qtValue ?? p.qtvalue, p.unit)
        }))
      })),
      updated_at: new Date()
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateDoc, $inc: { version: 1 } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Whether product was deleted
   */
  async delete(productId) {
    if (!ObjectId.isValid(productId)) return false;
    const result = await this.collection.deleteOne({ _id: new ObjectId(productId) });
    return result.deletedCount > 0;
  }

  /**
   * Delete all products for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async deleteAllByUserId(userId) {
    const result = await this.collection.deleteMany({ userid: userId });
    return result.deletedCount >= 0;
  }

  /**
   * Update single supply by identity_id (webhook endpoint)
   * @param {string} userId - User ID
   * @param {string} supplyIdentityId - Supply identity ID
   * @param {Object} data - Updated supply data
   * @returns {Promise<boolean>} Whether supply was modified
   */
  async updateSupplyByIdentityId(userId, supplyIdentityId, data) {
    const result = await this.collection.updateOne(
      {
        userid: userId,
        'supplies.identity_id': supplyIdentityId
      },
      {
        $set: {
          'supplies.$[supply].name': data.name,
          'supplies.$[supply].value': data.value,
          'supplies.$[supply].qt': data.qt,
          'supplies.$[supply].qtvalue': data.qtValue ?? data.qtvalue,
          'supplies.$[supply].unit': data.unit,
          'supplies.$[supply].computed_cost': this.computeSupplyCost(data.value, data.qt, data.qtValue ?? data.qtvalue, data.unit),
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      {
        arrayFilters: [{ 'supply.identity_id': supplyIdentityId }]
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete single supply by identity_id (webhook endpoint)
   * @param {string} userId - User ID
   * @param {string} supplyIdentityId - Supply identity ID
   * @returns {Promise<boolean>} Whether supply was deleted
   */
  async deleteSupplyByIdentityId(userId, supplyIdentityId) {
    const result = await this.collection.updateOne(
      { userid: userId },
      {
        $pull: { supplies: { identity_id: supplyIdentityId } },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update single recipe by identity_id (webhook endpoint)
   * @param {string} userId - User ID
   * @param {string} recipeIdentityId - Recipe identity ID
   * @param {Object} data - Updated recipe data
   * @returns {Promise<boolean>} Whether recipe was modified
   */
  async updateRecipeByIdentityId(userId, recipeIdentityId, data) {
    const result = await this.collection.updateOne(
      {
        userid: userId,
        'recipes.identity_id': recipeIdentityId
      },
      {
        $set: {
          'recipes.$[recipe].recipe_name': data.name,
          'recipes.$[recipe].quantity': data.quantity,
          'recipes.$[recipe].yieldvalue': data.yieldValue,
          'recipes.$[recipe].yieldvalueunit': data.yieldValueUnit,
          'recipes.$[recipe].myprice': data.myprice ?? 0,
          'recipes.$[recipe].myprof': data.myprof ?? 0,
          'recipes.$[recipe].profit': data.profit ?? 0,
          'recipes.$[recipe].total': data.total,
          'recipes.$[recipe].totalwithtax': data.totalWithTax,
          'recipes.$[recipe].margemper': data.margemper ?? '0',
          'recipes.$[recipe].products': (data.products ?? []).map(p => ({
            ...p,
            _id: new ObjectId(),
            identity_id: p.id ?? p.identity_id,
            recipe_product_name: p.name,
            value: p.value,
            status: p.status,
            qt: p.qt,
            qtvalue: p.qtValue ?? p.qtvalue,
            unit: p.unit,
            computed_cost: this.computeRecipeProductCost(p.value, p.qt, p.qtValue ?? p.qtvalue, p.unit)
          })),
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      {
        arrayFilters: [{ 'recipe.identity_id': recipeIdentityId }]
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete single recipe by identity_id (webhook endpoint)
   * @param {string} userId - User ID
   * @param {string} recipeIdentityId - Recipe identity ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteRecipeByIdentityId(userId, recipeIdentityId) {
    const result = await this.collection.updateOne(
      { userid: userId },
      {
        $pull: { recipes: { identity_id: recipeIdentityId } },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Compute supply cost based on value, quantity, and unit
   * @param {number} value - Price per unit
   * @param {number} qt - Quantity in package
   * @param {number} qtvalue - Quantity used
   * @param {string} unit - Unit (KG, G, L, ML, UNID)
   * @returns {number} Computed cost
   */
  computeSupplyCost(value, qt, qtvalue, unit) {
    const baseCost = (value * qtvalue) / qt;
    return unit === 'KG' ? baseCost / 1000 : baseCost;
  }

  /**
   * Compute recipe product cost
   * @param {number} value - Price per unit
   * @param {number} qt - Quantity in package
   * @param {number} qtvalue - Quantity used
   * @param {string} unit - Unit
   * @returns {number} Computed cost
   */
  computeRecipeProductCost(value, qt, qtvalue, unit) {
    const baseCost = (value * qtvalue) / qt;
    return unit === 'KG' ? baseCost / 1000 : baseCost;
  }

  /**
   * Map embedded product document to ProductWithDetails format
   * @param {Object} product - Embedded product document
   * @returns {Object}
   */
  mapToProductWithDetails(product) {
    return {
      id: product._id.toString(),
      product_name: product.product_name,
      userid: product.userid,
      profit_percentage: product.profit_percentage,
      price: product.price,
      product_cost: product.product_cost,
      product_cost_with_tax: product.product_cost_with_tax,
      product_cost_with_markup: product.product_cost_with_markup,
      product_cost_with_markup_tax: product.product_cost_with_markup_tax,
      total_fichas: product.total_fichas,
      total_extras: product.total_extras,
      created_at: product.created_at,
      updated_at: product.updated_at,
      supplies: product.supplies?.map(s => ({
        id: s._id.toString(),
        _id: s.identity_id,
        name: s.name,
        value: s.value,
        qt: s.qt,
        qtValue: s.qtvalue,
        unit: s.unit
      })) ?? [],
      recipes: product.recipes?.map(r => ({
        id: r._id.toString(),
        _id: r.identity_id,
        name: r.recipe_name,
        value: r.myprice,
        status: '',
        qt: 0,
        qtValue: 0,
        unit: '',
        quantity: r.quantity,
        total: r.total,
        totalWithTax: r.totalwithtax,
        yieldValue: r.yieldvalue,
        yieldValueUnit: r.yieldvalueunit,
        products: r.products?.map(p => ({
          id: p._id.toString(),
          _id: p.identity_id,
          name: p.recipe_product_name,
          value: p.value,
          status: p.status,
          qt: p.qt,
          qtValue: p.qtvalue,
          unit: p.unit
        })) ?? []
      })) ?? []
    };
  }

  /**
   * Find products with pagination
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>}
   */
  async findAllByUserIdPaginated(userId, page = 1, limit = 20) {
    return this.findParentsPaginated(userId, { page, limit });
  }
}

module.exports = {
  MongoProductRepository
};