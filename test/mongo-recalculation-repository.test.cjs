const assert = require('assert');
const { ObjectId } = require('mongodb');
const {
  MongoRecalculationRepository,
} = require('../repositories/mongo/RecalculationRepository.js');
const { createFakeCollection, createFakeDb, lastCall } = require('./helpers/mongo-fakes.cjs');

describe('MongoRecalculationRepository', () => {
  describe('executeRecalculate', () => {
    it('runs the aggregation pipeline scoped to the user and merges into products', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      const repo = new MongoRecalculationRepository(db);

      const result = await repo.executeRecalculate(10, 20, 'user-1');

      assert.strictEqual(result, true);
      const call = lastCall(db._collections.products, 'aggregate');
      assert.deepStrictEqual(call.pipeline[0], { $match: { userid: 'user-1' } });
      const last = call.pipeline[call.pipeline.length - 1];
      assert.deepStrictEqual(last, { $merge: { into: 'products', on: '_id', whenMatched: 'merge' } });
    });

    it('embeds tax and markup percentages in the pipeline', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      await new MongoRecalculationRepository(db).executeRecalculate(10, 20, 'user-1');

      const call = lastCall(db._collections.products, 'aggregate');
      const serialized = JSON.stringify(call.pipeline);
      assert.ok(serialized.includes('"$divide":[10,100]'));
      assert.ok(serialized.includes('"$divide":[20,100]'));
    });

    it('defaults non-numeric tax/markup to zero', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      await new MongoRecalculationRepository(db).executeRecalculate('bad', undefined, 'user-1');

      const call = lastCall(db._collections.products, 'aggregate');
      const serialized = JSON.stringify(call.pipeline);
      assert.ok(serialized.includes('"$divide":[0,100]'));
      assert.ok(!serialized.includes('NaN'));
    });

    it('guards division by zero for qt and yieldvalue', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      await new MongoRecalculationRepository(db).executeRecalculate(5, 5, 'user-1');

      const call = lastCall(db._collections.products, 'aggregate');
      const serialized = JSON.stringify(call.pipeline);
      assert.ok(serialized.includes('total_extras'));
      assert.ok(serialized.includes('total_fichas'));
      assert.ok(serialized.includes('product_cost_with_markup_tax'));
    });
  });

  describe('deleteAll', () => {
    it('cleans supplies, recipes and products for the user', async () => {
      const db = createFakeDb();
      const productId = new ObjectId();
      db._collections.products = createFakeCollection({ findResult: [{ _id: productId }] });
      db._collections.supplies = createFakeCollection();
      db._collections.recipes = createFakeCollection();
      const repo = new MongoRecalculationRepository(db);

      const result = await repo.deleteAll('user-1');

      assert.strictEqual(result, true);
      const suppliesCall = lastCall(db._collections.supplies, 'deleteMany');
      assert.deepStrictEqual(suppliesCall.filter, {
        product_id: { $in: [productId.toString()] },
      });
      const recipesCall = lastCall(db._collections.recipes, 'deleteMany');
      assert.deepStrictEqual(recipesCall.filter, {
        product_id: { $in: [productId.toString()] },
      });
      const productsCall = lastCall(db._collections.products, 'deleteMany');
      assert.deepStrictEqual(productsCall.filter, { userid: 'user-1' });
    });
  });
});
