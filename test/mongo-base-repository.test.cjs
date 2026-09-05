const assert = require('assert');
const { ObjectId } = require('mongodb');
const { BaseRepository, PaginatedRepository } = require('../repositories/mongo/BaseRepository.js');
const {
  EmbeddedRepository,
  EmbeddedRepositoryWithPagination,
} = require('../repositories/mongo/EmbeddedRepository.js');
const { createFakeDb, lastCall } = require('./helpers/mongo-fakes.cjs');

class TestRepo extends BaseRepository {
  get collectionName() {
    return 'widgets';
  }
}

class TestPaginatedRepo extends PaginatedRepository {
  get collectionName() {
    return 'widgets';
  }
}

function embeddedRepo(db) {
  return new EmbeddedRepository(db, {
    collectionName: 'products',
    parentIdField: '_id',
    childrenField: 'supplies',
  });
}

describe('MongoDB BaseRepository', () => {
  it('throws when collectionName is not implemented', () => {
    const repo = new BaseRepository(createFakeDb());
    assert.throws(() => repo.collectionName, /collectionName must be implemented/);
  });

  it('findAll passes filter and options to the driver', async () => {
    const db = createFakeDb();
    db._collections.widgets = require('./helpers/mongo-fakes.cjs').createFakeCollection({
      findResult: [{ a: 1 }],
    });
    const repo = new TestRepo(db);

    const result = await repo.findAll({ userid: 'u1' }, { projection: { a: 1 } });

    assert.deepStrictEqual(result, [{ a: 1 }]);
    const call = lastCall(db._collections.widgets, 'find');
    assert.deepStrictEqual(call.filter, { userid: 'u1' });
    assert.deepStrictEqual(call.options, { projection: { a: 1 } });
  });

  it('findById returns null for invalid ids without touching the driver', async () => {
    const db = createFakeDb();
    const repo = new TestRepo(db);

    assert.strictEqual(await repo.findById('not-an-objectid'), null);
    assert.strictEqual(db._collections.widgets, undefined);
  });

  it('findById queries by ObjectId for valid ids', async () => {
    const id = new ObjectId().toString();
    const db = createFakeDb();
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    db._collections.widgets = createFakeCollection({ findOneResult: { _id: id } });
    const repo = new TestRepo(db);

    const result = await repo.findById(id);

    assert.deepStrictEqual(result, { _id: id });
    const call = lastCall(db._collections.widgets, 'findOne');
    assert.ok(call.filter._id instanceof ObjectId);
    assert.strictEqual(call.filter._id.toString(), id);
  });

  it('create stamps created_at/updated_at and returns the id string', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.widgets = createFakeCollection();
    const repo = new TestRepo(db);

    const id = await repo.create({ name: 'w' });

    assert.strictEqual(typeof id, 'string');
    const call = lastCall(db._collections.widgets, 'insertOne');
    assert.strictEqual(call.doc.name, 'w');
    assert.ok(call.doc.created_at instanceof Date);
    assert.ok(call.doc.updated_at instanceof Date);
  });

  it('updateById returns false for invalid ids', async () => {
    const repo = new TestRepo(createFakeDb());
    assert.strictEqual(await repo.updateById('bad-id', { a: 1 }), false);
  });

  it('updateById maps modifiedCount to boolean', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.widgets = createFakeCollection({ updateOneResult: { modifiedCount: 0 } });
    const repo = new TestRepo(db);

    assert.strictEqual(await repo.updateById(new ObjectId().toString(), { a: 1 }), false);
  });

  it('deleteById returns false for invalid ids and true when deleted', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const repo = new TestRepo(createFakeDb());
    assert.strictEqual(await repo.deleteById('bad-id'), false);

    const db = createFakeDb();
    db._collections.widgets = createFakeCollection({ deleteOneCount: 1 });
    assert.strictEqual(await new TestRepo(db).deleteById(new ObjectId().toString()), true);
  });

  it('count and exists delegate to countDocuments', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.widgets = createFakeCollection({ countResult: 2 });
    const repo = new TestRepo(db);

    assert.strictEqual(await repo.count({ a: 1 }), 2);
    assert.strictEqual(await repo.exists({ a: 1 }), true);
  });

  it('exists returns false when nothing matches', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.widgets = createFakeCollection({ countResult: 0 });
    assert.strictEqual(await new TestRepo(db).exists({ a: 1 }), false);
  });
});

describe('MongoDB PaginatedRepository', () => {
  it('findPaginated returns data with page metadata', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.widgets = createFakeCollection({
      findResult: [{ a: 1 }],
      countResult: 45,
    });
    const repo = new TestPaginatedRepo(db);

    const result = await repo.findPaginated({ userid: 'u1' }, { page: 2, limit: 20 });

    assert.deepStrictEqual(result.data, [{ a: 1 }]);
    assert.strictEqual(result.total, 45);
    assert.strictEqual(result.page, 2);
    assert.strictEqual(result.limit, 20);
    assert.strictEqual(result.totalPages, 3);
  });
});

describe('MongoDB EmbeddedRepository', () => {
  it('throws when constructor options are missing', () => {
    const db = createFakeDb();
    assert.throws(() => new EmbeddedRepository(db).collectionName, /collectionName must be provided/);
    assert.throws(
      () => new EmbeddedRepository(db, { collectionName: 'p' }).parentIdField,
      /parentIdField must be provided/
    );
  });

  it('findParentById returns null for invalid ids', async () => {
    assert.strictEqual(await embeddedRepo(createFakeDb()).findParentById('bad'), null);
  });

  it('findChildByIdentityId finds embedded children', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const parentId = new ObjectId().toString();
    const db = createFakeDb();
    db._collections.products = createFakeCollection({
      findOneResult: {
        _id: new ObjectId(parentId),
        supplies: [{ identity_id: 's-1', name: 'Flour' }],
      },
    });

    const child = await embeddedRepo(db).findChildByIdentityId(parentId, 's-1');

    assert.deepStrictEqual(child, { identity_id: 's-1', name: 'Flour' });
  });

  it('findChildByIdentityId returns null when the child is missing', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const parentId = new ObjectId().toString();
    const db = createFakeDb();
    db._collections.products = createFakeCollection({
      findOneResult: { _id: new ObjectId(parentId), supplies: [] },
    });

    assert.strictEqual(await embeddedRepo(db).findChildByIdentityId(parentId, 'nope'), null);
  });

  it('findChildByIdentityIdAndUser returns parent and child', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    const parent = {
      _id: new ObjectId(),
      userid: 'u1',
      supplies: [{ identity_id: 's-1', name: 'Flour' }],
    };
    db._collections.products = createFakeCollection({ findOneResult: parent });

    const result = await embeddedRepo(db).findChildByIdentityIdAndUser('u1', 's-1');

    assert.deepStrictEqual(result, { parent, child: parent.supplies[0] });
    const call = lastCall(db._collections.products, 'findOne');
    assert.deepStrictEqual(call.filter, {
      userid: 'u1',
      supplies: { $elemMatch: { identity_id: 's-1' } },
    });
  });

  it('addChild pushes a child with generated _id and bumps version', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const repo = embeddedRepo(db);
    const parentId = new ObjectId().toString();

    const childId = await repo.addChild(parentId, { identity_id: 's-9', name: 'Sugar' });

    assert.ok(ObjectId.isValid(childId));
    const call = lastCall(db._collections.products, 'updateOne');
    assert.strictEqual(call.filter._id.toString(), parentId);
    assert.strictEqual(call.update.$push.supplies.identity_id, 's-9');
    assert.ok(call.update.$push.supplies._id instanceof ObjectId);
    assert.strictEqual(call.update.$inc.version, 1);
  });

  it('removeChildByIdentityIdAndUser pulls by identity_id', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.products = createFakeCollection();

    const result = await embeddedRepo(db).removeChildByIdentityIdAndUser('u1', 's-1');

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.filter, { userid: 'u1' });
    assert.deepStrictEqual(call.update.$pull, { supplies: { identity_id: 's-1' } });
  });

  it('replaceChildren assigns fresh ObjectIds', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const parentId = new ObjectId().toString();

    const result = await embeddedRepo(db).replaceChildren(parentId, [{ identity_id: 's-1' }]);

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.products, 'updateOne');
    assert.ok(call.update.$set.supplies[0]._id instanceof ObjectId);
  });
});

describe('MongoDB EmbeddedRepositoryWithPagination', () => {
  it('findParentsPaginated scopes by userid with metadata', async () => {
    const { createFakeCollection } = require('./helpers/mongo-fakes.cjs');
    const db = createFakeDb();
    db._collections.products = createFakeCollection({
      findResult: [{ userid: 'u1' }],
      countResult: 21,
    });
    const repo = new EmbeddedRepositoryWithPagination(db, {
      collectionName: 'products',
      parentIdField: '_id',
      childrenField: 'supplies',
    });

    const result = await repo.findParentsPaginated('u1', { page: 1, limit: 20 });

    assert.strictEqual(result.total, 21);
    assert.strictEqual(result.totalPages, 2);
    const call = lastCall(db._collections.products, 'find');
    assert.deepStrictEqual(call.filter, { userid: 'u1' });
  });
});
