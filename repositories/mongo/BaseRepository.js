const { Db, Collection, ObjectId } = require('mongodb');

/**
 * Base repository class providing common CRUD operations for MongoDB collections.
 */
class BaseRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    this.db = db;
  }

  /**
   * @abstract
   * @type {string}
   */
  get collectionName() {
    throw new Error('collectionName must be implemented by subclass');
  }

  /**
   * @returns {Collection}
   */
  get collection() {
    return this.db.collection(this.collectionName);
  }

  /**
   * Find all documents matching filter
   * @param {Object} filter - MongoDB filter
   * @param {Object} options - Find options
   * @returns {Promise<Array>}
   */
  async findAll(filter = {}, options = {}) {
    return this.collection.find(filter, options).toArray();
  }

  /**
   * Find document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!ObjectId.isValid(id)) return null;
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Find single document matching filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<Object|null>}
   */
  async findOne(filter) {
    return this.collection.findOne(filter);
  }

  /**
   * Create a new document
   * @param {Object} document - Document to create (without _id)
   * @returns {Promise<string>} Created document ID
   */
  async create(document) {
    const doc = {
      ...document,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await this.collection.insertOne(doc);
    return result.insertedId.toString();
  }

  /**
   * Create multiple documents
   * @param {Array} documents - Documents to create
   * @returns {Promise<Array<string>>} Created document IDs
   */
  async createMany(documents) {
    const docs = documents.map(doc => ({
      ...doc,
      created_at: new Date(),
      updated_at: new Date()
    }));
    const result = await this.collection.insertMany(docs);
    return Object.values(result.insertedIds).map(id => id.toString());
  }

  /**
   * Update document by ID
   * @param {string} id - Document ID
   * @param {Object} update - Update operations
   * @returns {Promise<boolean>} Whether document was modified
   */
  async updateById(id, update) {
    if (!ObjectId.isValid(id)) return false;
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...update, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update single document matching filter
   * @param {Object} filter - MongoDB filter
   * @param {Object} update - Update operations
   * @returns {Promise<boolean>} Whether document was modified
   */
  async updateOne(filter, update) {
    const result = await this.collection.updateOne(
      filter,
      { $set: { ...update, updated_at: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Update multiple documents matching filter
   * @param {Object} filter - MongoDB filter
   * @param {Object} update - Update operations
   * @returns {Promise<number>} Number of modified documents
   */
  async updateMany(filter, update) {
    const result = await this.collection.updateMany(
      filter,
      { $set: { ...update, updated_at: new Date() } }
    );
    return result.modifiedCount;
  }

  /**
   * Delete document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} Whether document was deleted
   */
  async deleteById(id) {
    if (!ObjectId.isValid(id)) return false;
    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  /**
   * Delete single document matching filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<boolean>} Whether document was deleted
   */
  async deleteOne(filter) {
    const result = await this.collection.deleteOne(filter);
    return result.deletedCount > 0;
  }

  /**
   * Delete multiple documents matching filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<number>} Number of deleted documents
   */
  async deleteMany(filter) {
    const result = await this.collection.deleteMany(filter);
    return result.deletedCount;
  }

  /**
   * Count documents matching filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<number>} Count of documents
   */
  async count(filter = {}) {
    return this.collection.countDocuments(filter);
  }

  /**
   * Check if document exists matching filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<boolean>} Whether document exists
   */
  async exists(filter) {
    const count = await this.collection.countDocuments(filter, { limit: 1 });
    return count > 0;
  }
}

/**
 * Repository with pagination support
 * @extends BaseRepository
 */
class PaginatedRepository extends BaseRepository {
  /**
   * Find documents with pagination
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
}

module.exports = {
  BaseRepository,
  PaginatedRepository
};