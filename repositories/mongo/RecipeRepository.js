const { Db, Collection, ObjectId } = require('mongodb');
const { BaseRepository } = require('./BaseRepository.js');
const { EmbeddedRepository } = require('./EmbeddedRepository.js');

const COLLECTION_PRODUCTS = 'products';
const COLLECTION_RECIPES = 'recipes';

/**
 * MongoDB Recipe Repository implementing IRecipeRepository interface
 * Uses separate recipes collection pattern per MONGODB_SCHEMA_PROPOSAL.md
 * Recipes are stored in their own collection with product_id reference
 */
class MongoRecipeRepository extends BaseRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
  }

  get collectionName() {
    return COLLECTION_RECIPES;
  }

  /**
   * Find recipes by identity ID and user
   * @param {string} recipeId - Recipe identity ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of recipes with products
   */
  async findByRemoteId(recipeId, userId) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS)
      .find({ userid: userId })
      .project({ _id: 1 })
      .toArray();
    
    const productIdStrings = productIds.map(p => p._id.toString());
    
    const recipes = await this.findAll({
      identity_id: recipeId,
      product_id: { $in: productIdStrings }
    });

    return recipes.map(this.mapToRecipe);
  }

  /**
   * Create recipes for a product
   * @param {string} productId - Product ID
   * @param {Array} recipes - Array of recipe data
   * @returns {Promise<boolean>} Whether recipes were created
   */
  async create(productId, recipes) {
    if (!ObjectId.isValid(productId)) return false;

    const docs = recipes.map(recipe => ({
      product_id: productId,
      identity_id: recipe.id,
      recipe_name: recipe.name,
      quantity: recipe.quantity,
      yieldvalue: recipe.yieldValue,
      yieldvalueunit: recipe.yieldValueUnit,
      myprice: recipe.myprice ?? 0,
      myprof: recipe.myprof ?? 0,
      profit: recipe.profit ?? 0,
      total: recipe.total,
      totalwithtax: recipe.totalWithTax,
      margemper: recipe.margemper ?? '0',
      products: (recipe.products ?? []).map(p => ({
        _id: new ObjectId(),
        identity_id: p.id,
        recipe_product_name: p.name,
        value: p.value,
        status: p.status,
        qt: p.qt,
        qtvalue: p.qtValue,
        unit: p.unit,
        computed_cost: this.computeRecipeProductCost(p.value, p.qt, p.qtValue, p.unit)
      })),
      created_at: new Date(),
      updated_at: new Date()
    }));

    const ids = await this.createMany(docs);
    return ids.length === recipes.length;
  }

  /**
   * Delete all recipes for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Whether recipes were deleted
   */
  async deleteByProductId(productId) {
    if (!ObjectId.isValid(productId)) return false;

    const count = await this.deleteMany({ product_id: productId });
    return count >= 0;
  }

  /**
   * Delete recipe by identity ID and user
   * @param {string} recipeId - Recipe identity ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteByRemoteId(recipeId, userId) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS)
      .find({ userid: userId })
      .project({ _id: 1 })
      .toArray();
    
    const productIdStrings = productIds.map(p => p._id.toString());

    const result = await this.deleteOne({
      identity_id: recipeId,
      product_id: { $in: productIdStrings }
    });
    return result;
  }

  /**
   * Delete recipe by ID and user
   * @param {string} id - Recipe ID (MongoDB ObjectId or identity_id)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteById(id, userId) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS)
      .find({ userid: userId })
      .project({ _id: 1 })
      .toArray();
    
    const productIdStrings = productIds.map(p => p._id.toString());

    let query;
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id), product_id: { $in: productIdStrings } };
    } else {
      query = { identity_id: id, product_id: { $in: productIdStrings } };
    }

    const result = await this.deleteOne(query);
    return result;
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
   * Map recipe document to interface format
   * @param {Object} doc - Recipe document
   * @returns {Object}
   */
  mapToRecipe(doc) {
    return {
      id: doc._id.toString(),
      _id: doc.identity_id,
      name: doc.recipe_name,
      quantity: doc.quantity,
      total: doc.total,
      totalWithTax: doc.totalwithtax,
      yieldValue: doc.yieldvalue,
      yieldValueUnit: doc.yieldvalueunit,
      products: (doc.products ?? []).map(p => ({
        id: p._id.toString(),
        _id: p.identity_id,
        name: p.recipe_product_name,
        value: p.value,
        status: p.status,
        qt: p.qt,
        qtValue: p.qtvalue,
        unit: p.unit
      }))
    };
  }
}

/**
 * MongoDB Embedded Recipe Repository implementing IRecipeRepository interface
 * Uses embedded document pattern per MONGODB_SCHEMA_PROPOSAL.md
 * Recipes are embedded within the products collection
 */
class MongoEmbeddedRecipeRepository extends EmbeddedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db, {
      collectionName: COLLECTION_PRODUCTS,
      parentIdField: '_id',
      childrenField: 'recipes'
    });
  }

  /**
   * Find recipes by identity ID and user
   * @param {string} recipeId - Recipe identity ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of recipes with products
   */
  async findByRemoteId(recipeId, userId) {
    const product = await this.collection.findOne({
      userid: userId,
      'recipes.identity_id': recipeId
    }, {
      projection: {
        _id: 1,
        recipes: {
          $elemMatch: { identity_id: recipeId }
        }
      }
    });

    if (!product || !product.recipes || product.recipes.length === 0) {
      return [];
    }

    const recipe = product.recipes[0];
    return [{
      id: recipe._id.toString(),
      _id: recipe.identity_id,
      name: recipe.recipe_name,
      quantity: recipe.quantity,
      total: recipe.total,
      totalWithTax: recipe.totalwithtax,
      yieldValue: recipe.yieldvalue,
      yieldValueUnit: recipe.yieldvalueunit,
      products: (recipe.products ?? []).map(p => ({
        id: p._id.toString(),
        _id: p.identity_id,
        name: p.recipe_product_name,
        value: p.value,
        status: p.status,
        qt: p.qt,
        qtValue: p.qtvalue,
        unit: p.unit
      }))
    }];
  }

  /**
   * Create recipes for a product (replace existing recipes)
   * @param {string} productId - Product ID
   * @param {Array} recipes - Array of recipe data
   * @returns {Promise<boolean>} Whether recipes were created
   */
  async create(productId, recipes) {
    if (!ObjectId.isValid(productId)) return false;

    const recipesWithIds = recipes.map(recipe => ({
      _id: new ObjectId(),
      identity_id: recipe.id,
      recipe_name: recipe.name,
      quantity: recipe.quantity,
      yieldvalue: recipe.yieldValue,
      yieldvalueunit: recipe.yieldValueUnit,
      myprice: recipe.myprice ?? 0,
      myprof: recipe.myprof ?? 0,
      profit: recipe.profit ?? 0,
      total: recipe.total,
      totalwithtax: recipe.totalWithTax,
      margemper: recipe.margemper ?? '0',
      products: (recipe.products ?? []).map(p => ({
        _id: new ObjectId(),
        identity_id: p.id,
        recipe_product_name: p.name,
        value: p.value,
        status: p.status,
        qt: p.qt,
        qtvalue: p.qtValue,
        unit: p.unit,
        computed_cost: this.computeRecipeProductCost(p.value, p.qt, p.qtValue, p.unit)
      }))
    }));

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          recipes: recipesWithIds,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete all recipes for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Whether recipes were deleted
   */
  async deleteByProductId(productId) {
    if (!ObjectId.isValid(productId)) return false;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          recipes: [],
          updated_at: new Date()
        },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete recipe by identity ID and user
   * @param {string} recipeId - Recipe identity ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteByRemoteId(recipeId, userId) {
    const result = await this.collection.updateOne(
      { userid: userId },
      {
        $pull: { recipes: { identity_id: recipeId } },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete recipe by ID and user
   * @param {string} id - Recipe ID (MongoDB ObjectId or identity_id)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteById(id, userId) {
    let query;
    if (ObjectId.isValid(id)) {
      query = { userid: userId, 'recipes._id': new ObjectId(id) };
    } else {
      query = { userid: userId, 'recipes.identity_id': id };
    }

    const result = await this.collection.updateOne(
      query,
      {
        $pull: { recipes: ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { identity_id: id } },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
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
}

/**
 * Paginated Recipe Repository (Embedded)
 * @extends EmbeddedRepository
 */
class MongoRecipePaginatedRepository extends EmbeddedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db, {
      collectionName: COLLECTION_PRODUCTS,
      parentIdField: '_id',
      childrenField: 'recipes'
    });
  }
}

/**
 * Paginated Recipe Repository (Separate Collection)
 * @extends BaseRepository
 */
class MongoRecipeCollectionPaginatedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    this.db = db;
    this.collectionName = COLLECTION_RECIPES;
  }

  get collection() {
    return this.db.collection(this.collectionName);
  }

  async findPaginated(filter, options = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const sort = options.sort ?? { _id: -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collection.find(filter, { sort, skip, limit }).toArray(),
      this.collection.countDocuments(filter)
    ]);

    return {
      data: data.map(this.mapToRecipe),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  mapToRecipe(doc) {
    return {
      id: doc._id.toString(),
      _id: doc.identity_id,
      name: doc.recipe_name,
      quantity: doc.quantity,
      total: doc.total,
      totalWithTax: doc.totalwithtax,
      yieldValue: doc.yieldvalue,
      yieldValueUnit: doc.yieldvalueunit,
      products: (doc.products ?? []).map(p => ({
        id: p._id.toString(),
        _id: p.identity_id,
        name: p.recipe_product_name,
        value: p.value,
        status: p.status,
        qt: p.qt,
        qtValue: p.qtvalue,
        unit: p.unit
      }))
    };
  }
}

module.exports = {
  MongoRecipeRepository,
  MongoEmbeddedRecipeRepository,
  MongoRecipePaginatedRepository,
  MongoRecipeCollectionPaginatedRepository
};