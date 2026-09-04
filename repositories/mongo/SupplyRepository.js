const { Db, Collection, ObjectId } = require('mongodb');
const { BaseRepository, PaginatedRepository } = require('./BaseRepository.js');
const { EmbeddedRepository } = require('./EmbeddedRepository.js');

const COLLECTION_SUPPLIES = 'supplies';
const COLLECTION_PRODUCTS = 'products';

/**
 * MongoDB Supply Repository implementing ISupplyRepository interface
 * Uses separate supplies collection (legacy pattern)
 */
class MongoSupplyRepository extends BaseRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
    this.collectionName = COLLECTION_SUPPLIES;
  }

  /**
   * Find supplies by product ID
   * @param {string} productId - Product ID
   * @returns {Promise<Array>}
   */
  async findByProductId(productId) {
    const docs = await this.findAll({ product_id: productId });
    return docs.map(this.mapToSupply);
  }

  /**
   * Create supplies for a product
   * @param {string} productId - Product ID
   * @param {Array} supplies - Array of supply data
   * @returns {Promise<boolean>} Whether all supplies were created
   */
  async create(productId, supplies) {
    const docs = supplies.map(supply => ({
      supply_name: supply.name,
      value: supply.value,
      qt: supply.qt,
      qtvalue: supply.qtValue,
      unit: supply.unit,
      product_id: productId,
      supply_identity_id: supply.id
    }));
    const ids = await this.createMany(docs);
    return ids.length === supplies.length;
  }

  /**
   * Update supply by identity ID and user
   * @param {string} supplyId - Supply identity ID
   * @param {string} userId - User ID
   * @param {Object} data - Updated supply data
   * @returns {Promise<boolean>} Whether supply was modified
   */
  async update(supplyId, userId, data) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS).find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const result = await this.updateOne(
      {
        supply_identity_id: supplyId,
        product_id: { $in: productIdStrings }
      },
      {
        supply_name: data.name,
        qt: data.qt,
        qtvalue: data.qtValue,
        unit: data.unit
      }
    );
    return result;
  }

  /**
   * Delete all supplies for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>}
   */
  async deleteByProductId(productId) {
    const count = await this.deleteMany({ product_id: productId });
    return count >= 0;
  }

  /**
   * Delete supply by identity ID and user
   * @param {string} supplyId - Supply identity ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether supply was deleted
   */
  async deleteByRemoteId(supplyId, userId) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS).find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const result = await this.deleteOne({
      supply_identity_id: supplyId,
      product_id: { $in: productIdStrings }
    });
    return result;
  }

  /**
   * Find supplies with pagination
   * @param {Object} filter - MongoDB filter
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Map supply document to interface format
   * @param {Object} doc - Supply document
   * @returns {Object}
   */
  mapToSupply(doc) {
    return {
      id: doc._id.toString(),
      _id: doc.supply_identity_id,
      name: doc.supply_name,
      value: doc.value,
      qt: doc.qt,
      qtValue: doc.qtvalue,
      unit: doc.unit
    };
  }
}

/**
 * MongoDB Embedded Supply Repository implementing ISupplyRepository interface
 * Uses embedded document pattern per MONGODB_SCHEMA_PROPOSAL.md
 * Supplies are embedded within the products collection
 */
class MongoEmbeddedSupplyRepository extends EmbeddedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db, {
      collectionName: COLLECTION_PRODUCTS,
      parentIdField: '_id',
      childrenField: 'supplies'
    });
  }

  /**
   * Find supplies by product ID (embedded)
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Array of supplies
   */
  async findByProductId(productId) {
    const product = await this.findParentById(productId);
    if (!product || !product.supplies) return [];
    
    return product.supplies.map(this.mapToSupply);
  }

  /**
   * Create supplies for a product (replace existing supplies)
   * @param {string} productId - Product ID
   * @param {Array} supplies - Array of supply data
   * @returns {Promise<boolean>} Whether supplies were created
   */
  async create(productId, supplies) {
    if (!ObjectId.isValid(productId)) return false;

    const suppliesWithIds = supplies.map(supply => ({
      _id: new ObjectId(),
      identity_id: supply.id,
      name: supply.name,
      value: supply.value,
      qt: supply.qt,
      qtvalue: supply.qtValue,
      unit: supply.unit,
      computed_cost: this.computeSupplyCost(supply.value, supply.qt, supply.qtValue, supply.unit)
    }));

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          supplies: suppliesWithIds,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Update supply by identity ID and user (webhook endpoint)
   * @param {string} supplyId - Supply identity ID
   * @param {string} userId - User ID
   * @param {Object} data - Updated supply data
   * @returns {Promise<boolean>} Whether supply was modified
   */
  async update(supplyId, userId, data) {
    const supply = await this.findChildByIdentityIdAndUser(userId, supplyId);
    if (!supply) return false;

    const currentValue = supply.child.value;
    const qt = data.qt;
    const qtvalue = data.qtValue;
    const unit = data.unit;

    const result = await this.collection.updateOne(
      {
        userid: userId,
        'supplies.identity_id': supplyId
      },
      {
        $set: {
          'supplies.$[supply].name': data.name,
          'supplies.$[supply].qt': qt,
          'supplies.$[supply].qtvalue': qtvalue,
          'supplies.$[supply].unit': unit,
          'supplies.$[supply].computed_cost': this.computeSupplyCost(currentValue, qt, qtvalue, unit),
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      {
        arrayFilters: [{ 'supply.identity_id': supplyId }]
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete all supplies for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Whether supplies were deleted
   */
  async deleteByProductId(productId) {
    if (!ObjectId.isValid(productId)) return false;

    const result = await this.collection.updateOne(
      { _id: new ObjectId(productId) },
      {
        $set: {
          supplies: [],
          updated_at: new Date()
        },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete supply by identity ID and user (webhook endpoint)
   * @param {string} supplyId - Supply identity ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether supply was deleted
   */
  async deleteByRemoteId(supplyId, userId) {
    const result = await this.removeChildByIdentityIdAndUser(userId, supplyId);
    return result;
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
   * Map embedded supply document to interface format
   * @param {Object} doc - Embedded supply document
   * @returns {Object}
   */
  mapToSupply(doc) {
    return {
      id: doc._id.toString(),
      _id: doc.identity_id,
      name: doc.name,
      value: doc.value,
      qt: doc.qt,
      qtValue: doc.qtvalue,
      unit: doc.unit
    };
  }
}

/**
 * Paginated Supply Repository (separate collection)
 * @extends PaginatedRepository
 */
class MongoSupplyPaginatedRepository extends PaginatedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
    this.collectionName = COLLECTION_SUPPLIES;
  }
}

/**
 * Paginated Embedded Supply Repository
 * @extends EmbeddedRepository
 */
class MongoEmbeddedSupplyPaginatedRepository extends EmbeddedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db, {
      collectionName: COLLECTION_PRODUCTS,
      parentIdField: '_id',
      childrenField: 'supplies'
    });
  }
}

module.exports = {
  MongoSupplyRepository,
  MongoEmbeddedSupplyRepository,
  MongoSupplyPaginatedRepository,
  MongoEmbeddedSupplyPaginatedRepository
};