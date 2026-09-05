const { ObjectId } = require('mongodb');

/**
 * In-memory fakes for the mongodb driver surface used by repositories/mongo/.
 * Lets unit tests assert exact filters, updates, projections and
 * arrayFilters without a running server.
 */

function createFakeCursor(result = []) {
  const cursor = {
    _result: result,
    sortValue: undefined,
    projectValue: undefined,
    skipValue: undefined,
    limitValue: undefined,
    sort(sort) {
      cursor.sortValue = sort;
      return cursor;
    },
    project(projection) {
      cursor.projectValue = projection;
      return cursor;
    },
    skip(n) {
      cursor.skipValue = n;
      return cursor;
    },
    limit(n) {
      cursor.limitValue = n;
      return cursor;
    },
    async toArray() {
      return cursor._result;
    },
  };
  return cursor;
}

function createFakeCollection(overrides = {}) {
  const collection = {
    calls: [],
    findResult: [],
    findOneResult: null,
    aggregateResult: [],
    countResult: 0,
    updateOneResult: { modifiedCount: 1 },
    updateManyResult: { modifiedCount: 1 },
    deleteOneCount: 1,
    deleteManyCount: 1,
    insertOneResult: null,
    insertManyResult: null,
    ...overrides,
    find(filter, options) {
      collection.calls.push({ method: 'find', filter, options });
      return createFakeCursor(collection.findResult);
    },
    async findOne(filter, options) {
      collection.calls.push({ method: 'findOne', filter, options });
      return collection.findOneResult;
    },
    async insertOne(doc) {
      collection.calls.push({ method: 'insertOne', doc });
      return collection.insertOneResult ?? { insertedId: new ObjectId() };
    },
    async insertMany(docs) {
      collection.calls.push({ method: 'insertMany', docs });
      return (
        collection.insertManyResult ?? {
          insertedIds: Object.fromEntries(docs.map((doc, i) => [i, new ObjectId()])),
        }
      );
    },
    async updateOne(filter, update, options) {
      collection.calls.push({ method: 'updateOne', filter, update, options });
      return collection.updateOneResult;
    },
    async updateMany(filter, update, options) {
      collection.calls.push({ method: 'updateMany', filter, update, options });
      return collection.updateManyResult;
    },
    async deleteOne(filter) {
      collection.calls.push({ method: 'deleteOne', filter });
      return { deletedCount: collection.deleteOneCount };
    },
    async deleteMany(filter) {
      collection.calls.push({ method: 'deleteMany', filter });
      return { deletedCount: collection.deleteManyCount };
    },
    async countDocuments(filter, options) {
      collection.calls.push({ method: 'countDocuments', filter, options });
      return collection.countResult;
    },
    aggregate(pipeline, options) {
      collection.calls.push({ method: 'aggregate', pipeline, options });
      return {
        async toArray() {
          return collection.aggregateResult;
        },
      };
    },
  };
  return collection;
}

function createFakeDb(collections = {}) {
  const db = {
    _collections: collections,
    collectionCalls: [],
    collection(name) {
      db.collectionCalls.push(name);
      if (!db._collections[name]) db._collections[name] = createFakeCollection();
      return db._collections[name];
    },
  };
  return db;
}

function lastCall(collection, method) {
  const matches = collection.calls.filter((call) => call.method === method);
  return matches[matches.length - 1];
}

module.exports = {
  createFakeCollection,
  createFakeCursor,
  createFakeDb,
  lastCall,
};
