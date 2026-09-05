const assert = require('assert');
const { ObjectId } = require('mongodb');
const {
  MongoSupplyRepository,
  MongoEmbeddedSupplyRepository,
} = require('../repositories/mongo/SupplyRepository.js');
const { createFakeCollection, createFakeDb, lastCall } = require('./helpers/mongo-fakes.cjs');

const SUPPLY = { id: 'supply-uuid-001', name: 'Farinha', value: 8.5, qt: 1000, qtValue: 500, unit: 'G' };

describe('MongoSupplyRepository (separate collection)', () => {
  it('findByProductId maps documents to the supply interface format', async () => {
    const db = createFakeDb();
    const docId = new ObjectId();
    db._collections.supplies = createFakeCollection({
      findResult: [
        {
          _id: docId,
          supply_identity_id: 'supply-uuid-001',
          supply_name: 'Farinha',
          value: 8.5,
          qt: 1000,
          qtvalue: 500,
          unit: 'G',
        },
      ],
    });
    const repo = new MongoSupplyRepository(db);

    const result = await repo.findByProductId('product-1');

    assert.deepStrictEqual(result, [
      {
        id: docId.toString(),
        _id: 'supply-uuid-001',
        name: 'Farinha',
        value: 8.5,
        qt: 1000,
        qtValue: 500,
        unit: 'G',
      },
    ]);
    const call = lastCall(db._collections.supplies, 'find');
    assert.deepStrictEqual(call.filter, { product_id: 'product-1' });
  });

  it('create inserts one document per supply and requires all to succeed', async () => {
    const db = createFakeDb();
    db._collections.supplies = createFakeCollection();
    const repo = new MongoSupplyRepository(db);

    const result = await repo.create('product-1', [SUPPLY, { ...SUPPLY, id: 's-2' }]);

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.supplies, 'insertMany');
    assert.strictEqual(call.docs.length, 2);
    assert.strictEqual(call.docs[0].product_id, 'product-1');
    assert.strictEqual(call.docs[0].supply_identity_id, 'supply-uuid-001');
    assert.strictEqual(call.docs[0].supply_name, 'Farinha');
  });

  it('update scopes by user products and sets supply fields', async () => {
    const db = createFakeDb();
    const productId = new ObjectId();
    db._collections.products = createFakeCollection({ findResult: [{ _id: productId }] });
    db._collections.supplies = createFakeCollection();
    const repo = new MongoSupplyRepository(db);

    const result = await repo.update('supply-uuid-001', 'user-1', {
      name: 'Farinha',
      qt: 1000,
      qtValue: 250,
      unit: 'G',
    });

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.supplies, 'updateOne');
    assert.strictEqual(call.filter.supply_identity_id, 'supply-uuid-001');
    assert.deepStrictEqual(call.filter.product_id, { $in: [productId.toString()] });
    assert.strictEqual(call.update.$set.qtvalue, 250);
  });

  it('deleteByProductId removes every supply of the product', async () => {
    const db = createFakeDb();
    db._collections.supplies = createFakeCollection();
    const repo = new MongoSupplyRepository(db);

    assert.strictEqual(await repo.deleteByProductId('product-1'), true);
    const call = lastCall(db._collections.supplies, 'deleteMany');
    assert.deepStrictEqual(call.filter, { product_id: 'product-1' });
  });

  it('deleteByRemoteId scopes the delete to user products', async () => {
    const db = createFakeDb();
    const productId = new ObjectId();
    db._collections.products = createFakeCollection({ findResult: [{ _id: productId }] });
    db._collections.supplies = createFakeCollection();
    const repo = new MongoSupplyRepository(db);

    assert.strictEqual(await repo.deleteByRemoteId('supply-uuid-001', 'user-1'), true);
    const call = lastCall(db._collections.supplies, 'deleteOne');
    assert.strictEqual(call.filter.supply_identity_id, 'supply-uuid-001');
    assert.deepStrictEqual(call.filter.product_id, { $in: [productId.toString()] });
  });

  it('findPaginated returns page metadata', async () => {
    const db = createFakeDb();
    db._collections.supplies = createFakeCollection({
      findResult: [{ supply_name: 'A' }],
      countResult: 41,
    });
    const repo = new MongoSupplyRepository(db);

    const result = await repo.findPaginated({ product_id: 'p1' }, { page: 3, limit: 20 });

    assert.strictEqual(result.total, 41);
    assert.strictEqual(result.totalPages, 3);
    assert.strictEqual(result.page, 3);
  });
});

describe('MongoEmbeddedSupplyRepository (embedded per MONGODB_SCHEMA_PROPOSAL.md)', () => {
  it('findByProductId returns mapped embedded supplies', async () => {
    const db = createFakeDb();
    const supplyId = new ObjectId();
    db._collections.products = createFakeCollection({
      findOneResult: {
        _id: new ObjectId(),
        supplies: [
          {
            _id: supplyId,
            identity_id: 'supply-uuid-001',
            name: 'Farinha',
            value: 8.5,
            qt: 1000,
            qtvalue: 500,
            unit: 'G',
          },
        ],
      },
    });
    const repo = new MongoEmbeddedSupplyRepository(db);
    const productId = new ObjectId().toString();
    db._collections.products.findOneResult._id = new ObjectId(productId);

    const result = await repo.findByProductId(productId);

    assert.strictEqual(result[0]._id, 'supply-uuid-001');
    assert.strictEqual(result[0].qtValue, 500);
  });

  it('findByProductId returns [] for invalid ids or missing products', async () => {
    const repo = new MongoEmbeddedSupplyRepository(createFakeDb());
    assert.deepStrictEqual(await repo.findByProductId('bad-id'), []);

    const db = createFakeDb();
    db._collections.products = createFakeCollection({ findOneResult: null });
    assert.deepStrictEqual(
      await new MongoEmbeddedSupplyRepository(db).findByProductId(new ObjectId().toString()),
      []
    );
  });

  it('create replaces embedded supplies with computed costs', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const repo = new MongoEmbeddedSupplyRepository(db);
    const productId = new ObjectId().toString();

    const result = await repo.create(productId, [SUPPLY]);

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.products, 'updateOne');
    assert.strictEqual(call.filter._id.toString(), productId);
    assert.strictEqual(call.update.$set.supplies[0].identity_id, 'supply-uuid-001');
    assert.strictEqual(call.update.$set.supplies[0].computed_cost, 4.25);
    assert.ok(call.update.$set.supplies[0]._id instanceof ObjectId);
  });

  it('create returns false for invalid product ids', async () => {
    assert.strictEqual(
      await new MongoEmbeddedSupplyRepository(createFakeDb()).create('bad-id', [SUPPLY]),
      false
    );
  });

  it('update applies arrayFilters and recomputes cost from stored value', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection({
      findOneResult: {
        _id: new ObjectId(),
        userid: 'user-1',
        supplies: [{ identity_id: 'supply-uuid-001', value: 8.5 }],
      },
    });
    const repo = new MongoEmbeddedSupplyRepository(db);

    const result = await repo.update('supply-uuid-001', 'user-1', {
      name: 'Farinha Nova',
      qt: 1000,
      qtValue: 250,
      unit: 'G',
    });

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.filter, {
      userid: 'user-1',
      'supplies.identity_id': 'supply-uuid-001',
    });
    assert.strictEqual(call.update.$set['supplies.$[supply].name'], 'Farinha Nova');
    assert.strictEqual(call.update.$set['supplies.$[supply].computed_cost'], 2.125);
    assert.deepStrictEqual(call.options, {
      arrayFilters: [{ 'supply.identity_id': 'supply-uuid-001' }],
    });
  });

  it('update returns false when the supply does not exist', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection({ findOneResult: null });

    assert.strictEqual(
      await new MongoEmbeddedSupplyRepository(db).update('missing', 'user-1', {
        name: 'x',
        qt: 1,
        qtValue: 1,
        unit: 'G',
      }),
      false
    );
  });

  it('deleteByProductId clears the embedded array', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const productId = new ObjectId().toString();

    assert.strictEqual(
      await new MongoEmbeddedSupplyRepository(db).deleteByProductId(productId),
      true
    );
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.update.$set.supplies, []);
  });

  it('deleteByRemoteId pulls the supply by identity_id', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();

    assert.strictEqual(
      await new MongoEmbeddedSupplyRepository(db).deleteByRemoteId('supply-uuid-001', 'user-1'),
      true
    );
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.update.$pull, { supplies: { identity_id: 'supply-uuid-001' } });
  });

  it('computeSupplyCost matches function_total_supplies.sql semantics', () => {
    const repo = new MongoEmbeddedSupplyRepository(createFakeDb());
    assert.strictEqual(repo.computeSupplyCost(8.5, 1000, 500, 'G'), 4.25);
    assert.strictEqual(repo.computeSupplyCost(1000, 1, 1, 'KG'), 1);
    assert.strictEqual(repo.computeSupplyCost(12, 12, 4, 'UNID'), 4);
  });
});
