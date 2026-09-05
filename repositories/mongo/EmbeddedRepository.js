const { Db, Collection, ObjectId } = require('mongodb');

/**
 * Base repository for embedded document patterns (arrays within documents)
 */
class EmbeddedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   * @param {Object} options - Configuration options
   * @param {string} options.collectionName - Name of the parent collection
   * @param {string} options.parentIdField - Field name for parent ID
   * @param {string} options.childrenField - Field name for children array
   */
  constructor(db, options = {}) {
    this.db = db;
    this._collectionName = options.collectionName;
    this._parentIdField = options.parentIdField;
    this._childrenField = options.childrenField;
  }

  /**
   * @type {string}
   */
  get collectionName() {
    if (!this._collectionName) {
      throw new Error('collectionName must be provided in constructor options');
    }
    return this._collectionName;
  }

  /**
   * @type {string}
   */
  get parentIdField() {
    if (!this._parentIdField) {
      throw new Error('parentIdField must be provided in constructor options');
    }
    return this._parentIdField;
  }

  /**
   * @type {string}
   */
  get childrenField() {
    if (!this._childrenField) {
      throw new Error('childrenField must be provided in constructor options');
    }
    return this._childrenField;
  }

  /**
   * @returns {Collection}
   */
  get collection() {
    return this.db.collection(this.collectionName);
  }

  /**
   * Find parent by ID
   * @param {string} parentId - Parent document ID
   * @returns {Promise<Object|null>}
   */
  async findParentById(parentId) {
    if (!ObjectId.isValid(parentId)) return null;
    return this.collection.findOne({ _id: new ObjectId(parentId) });
  }

  /**
   * Find parents by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async findParentByUserId(userId) {
    return this.collection.find({ userid: userId }).sort({ _id: -1 }).toArray();
  }

  /**
   * Find child by identity ID within parent
   * @param {string} parentId - Parent document ID
   * @param {string} childIdentityId - Child identity ID
   * @returns {Promise<Object|null>}
   */
  async findChildByIdentityId(parentId, childIdentityId) {
    const parent = await this.findParentById(parentId);
    if (!parent) return null;

    const children = parent[this.childrenField];
    if (!children) return null;

    return children.find(child => child.identity_id === childIdentityId) ?? null;
  }

  /**
   * Find child by identity ID and user
   * @param {string} userId - User ID
   * @param {string} childIdentityId - Child identity ID
   * @returns {Promise<{parent: Object, child: Object}|null>}
   */
  async findChildByIdentityIdAndUser(userId, childIdentityId) {
    const parent = await this.collection.findOne({
      userid: userId,
      [this.childrenField]: { $elemMatch: { identity_id: childIdentityId } }
    });

    if (!parent) return null;

    const children = parent[this.childrenField];
    if (!children) return null;

    const child = children.find(c => c.identity_id === childIdentityId);
    if (!child) return null;

    return { parent, child };
  }

  /**
   * Add child to parent
   * @param {string} parentId - Parent document ID
   * @param {Object} child - Child document (without _id)
   * @returns {Promise<string>} Created child ID
   */
  async addChild(parentId, child) {
    const childDoc = {
      ...child,
      _id: new ObjectId()
    };

    const result = await this.collection.updateOne(
      { _id: new ObjectId(parentId) },
      {
        $push: { [this.childrenField]: childDoc },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0 ? childDoc._id.toString() : '';
  }

  /**
   * Update child by identity ID within parent
   * @param {string} parentId - Parent document ID
   * @param {string} childIdentityId - Child identity ID
   * @param {Object} update - Update operations
   * @returns {Promise<boolean>} Whether child was modified
   */
  async updateChildByIdentityId(parentId, childIdentityId, update) {
    const result = await this.collection.updateOne(
      {
        _id: new ObjectId(parentId),
        [this.childrenField]: { $elemMatch: { identity_id: childIdentityId } }
      },
      {
        $set: {
          [`${this.childrenField}.$[elem]`]: update,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      {
        arrayFilters: [{ 'elem.identity_id': childIdentityId }]
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Update child by identity ID and user
   * @param {string} userId - User ID
   * @param {string} childIdentityId - Child identity ID
   * @param {Object} update - Update operations
   * @returns {Promise<boolean>} Whether child was modified
   */
  async updateChildByIdentityIdAndUser(userId, childIdentityId, update) {
    const result = await this.collection.updateOne(
      {
        userid: userId,
        [this.childrenField]: { $elemMatch: { identity_id: childIdentityId } }
      },
      {
        $set: {
          [`${this.childrenField}.$[elem]`]: update,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      },
      {
        arrayFilters: [{ 'elem.identity_id': childIdentityId }]
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Remove child by identity ID from parent
   * @param {string} parentId - Parent document ID
   * @param {string} childIdentityId - Child identity ID
   * @returns {Promise<boolean>} Whether child was removed
   */
  async removeChildByIdentityId(parentId, childIdentityId) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(parentId) },
      {
        $pull: { [this.childrenField]: { identity_id: childIdentityId } },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Remove child by identity ID and user
   * @param {string} userId - User ID
   * @param {string} childIdentityId - Child identity ID
   * @returns {Promise<boolean>} Whether child was removed
   */
  async removeChildByIdentityIdAndUser(userId, childIdentityId) {
    const result = await this.collection.updateOne(
      { userid: userId },
      {
        $pull: { [this.childrenField]: { identity_id: childIdentityId } },
        $set: { updated_at: new Date() },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Replace all children of parent
   * @param {string} parentId - Parent document ID
   * @param {Array} children - Array of child documents
   * @returns {Promise<boolean>} Whether children were replaced
   */
  async replaceChildren(parentId, children) {
    const childrenWithIds = children.map(child => ({
      ...child,
      _id: new ObjectId()
    }));

    const result = await this.collection.updateOne(
      { _id: new ObjectId(parentId) },
      {
        $set: {
          [this.childrenField]: childrenWithIds,
          updated_at: new Date()
        },
        $inc: { version: 1 }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Increment parent version
   * @param {string} parentId - Parent document ID
   * @returns {Promise<boolean>} Whether version was incremented
   */
  async incrementVersion(parentId) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(parentId) },
      {
        $inc: { version: 1 },
        $set: { updated_at: new Date() }
      }
    );

    return result.modifiedCount > 0;
  }
}

/**
 * Embedded repository with pagination support
 * @extends EmbeddedRepository
 */
class EmbeddedRepositoryWithPagination extends EmbeddedRepository {
  /**
   * Find parents with pagination
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findParentsPaginated(userId, options = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const sort = options.sort ?? { _id: -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collection.find({ userid: userId }, { sort, skip, limit }).toArray(),
      this.collection.countDocuments({ userid: userId })
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
  EmbeddedRepository,
  EmbeddedRepositoryWithPagination
};