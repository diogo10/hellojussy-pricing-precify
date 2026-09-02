const { Db, Collection, ObjectId } = require('mongodb');
const { EmbeddedRepositoryWithPagination } = require('./EmbeddedRepository.js');

const COLLECTION_PRODUCTS = 'products';

/**
 * MongoDB Product Repository implementing IProductRepository interface
 * Supports both embedded document pattern (new schema) and separate collections (legacy)
 */
class MongoProductRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    this.db = db;
    this.collection = db.collection(COLLECTION_PRODUCTS);
    this.embeddedRepo = new EmbeddedRepositoryWithPagination(db);
    this.embeddedRepo.collectionName = COLLECTION_PRODUCTS;
    this.embeddedRepo.parentIdField = '_id';
    this.embeddedRepo.childrenField = 'supplies';
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
   * Create a new product
   * @param {Object} data - Product data
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
      supplies: [],
      recipes: [],
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    };

    const result = await this.collection.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Update product
   * @param {string} productId - Product ID
   * @param {Object} data - Updated product data
   * @returns {Promise<boolean>} Whether product was modified
   */
  async update(productId, data) {
    if (!ObjectId.isValid(productId)) return false;

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
      updated_at: new Date()
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: doc, $inc: { version: 1 } }
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
   * Find products with pagination
   * @param {string} userId - User ID
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>}
   */
  async findAllByUserIdPaginated(userId, page = 1, limit = 20) {
    return this.embeddedRepo.findParentsPaginated(userId, { page, limit });
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
}

/**
 * Alternative Product Repository using EmbeddedRepository base class directly
 * Use this for the new embedded document schema (MONGODB_SCHEMA_PROPOSAL.md)
 */
class MongoProductEmbeddedRepository extends EmbeddedRepositoryWithPagination {
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
   * Create a new product
   * @param {Object} data - Product data
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
      supplies: [],
      recipes: [],
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    };

    const result = await this.collection.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Update product
   * @param {string} productId - Product ID
   * @param {Object} data - Updated product data
   * @returns {Promise<boolean>} Whether product was modified
   */
  async update(productId, data) {
    if (!ObjectId.isValid(productId)) return false;

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
      updated_at: new Date()
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: doc, $inc: { version: 1 } }
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
}

module.exports = {
  MongoProductRepository,
  MongoProductEmbeddedRepository
};