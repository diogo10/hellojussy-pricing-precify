const assert = require('assert');
const { ObjectId } = require('mongodb');
const { MongoProductRepository } = require('../repositories/mongo/ProductRepository.js');
const { createFakeCollection, createFakeDb, lastCall } = require('./helpers/mongo-fakes.cjs');

function productRepo(db) {
  return new MongoProductRepository(db || createFakeDb());
}

function sampleCreateData() {
  return {
    name: 'Bolo de Chocolate',
    userId: 'user-1',
    prof: '30',
    price: 45,
    cost: 22.5,
    costWithTax: 25.88,
    costWithMarkup: 29.25,
    costWithMarkupTax: 33.64,
    totalFichas: 12.3,
    totalExtras: 10.2,
    supplies: [
      { id: 'supply-uuid-001', name: 'Farinha', value: 8.5, qt: 1000, qtValue: 500, unit: 'G' },
    ],
    recipes: [
      {
        id: 'recipe-uuid-001',
        name: 'Massa Base',
        quantity: 2,
        yieldValue: 1000,
        yieldValueUnit: 1,
        total: 15,
        totalWithTax: 17.25,
        products: [
          { id: 'rp-1', name: 'Ovos', value: 12, status: 'ACTIVE', qt: 12, qtValue: 4, unit: 'UNID' },
        ],
      },
    ],
  };
}

describe('MongoProductRepository', () => {
  describe('findAllByUserId', () => {
    it('queries by userid sorted by _id desc excluding embedded arrays', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection({ findResult: [{ product_name: 'A' }] });
      const repo = productRepo(db);

      const result = await repo.findAllByUserId('user-1');

      assert.deepStrictEqual(result, [{ product_name: 'A' }]);
      const call = lastCall(db._collections.products, 'find');
      assert.deepStrictEqual(call.filter, { userid: 'user-1' });
    });
  });

  describe('findById', () => {
    it('returns null for invalid product ids without querying', async () => {
      const db = createFakeDb();
      assert.strictEqual(await productRepo(db).findById('user-1', 'bad-id'), null);
      assert.strictEqual(db._collections.products, undefined);
    });

    it('returns null when the product does not exist', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection({ findOneResult: null });

      assert.strictEqual(
        await productRepo(db).findById('user-1', new ObjectId().toString()),
        null
      );
    });

    it('maps the embedded document to ProductWithDetails', async () => {
      const productId = new ObjectId();
      const db = createFakeDb();
      db._collections.products = createFakeCollection({
        findOneResult: {
          _id: productId,
          product_name: 'Bolo',
          userid: 'user-1',
          profit_percentage: '30',
          price: 45,
          product_cost: 22.5,
          product_cost_with_tax: 25.88,
          product_cost_with_markup: 29.25,
          product_cost_with_markup_tax: 33.64,
          total_fichas: 12.3,
          total_extras: 10.2,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-20'),
          supplies: [
            {
              _id: new ObjectId(),
              identity_id: 'supply-uuid-001',
              name: 'Farinha',
              value: 8.5,
              qt: 1000,
              qtvalue: 500,
              unit: 'G',
            },
          ],
          recipes: [
            {
              _id: new ObjectId(),
              identity_id: 'recipe-uuid-001',
              recipe_name: 'Massa',
              quantity: 2,
              yieldvalue: 1000,
              yieldvalueunit: 1,
              myprice: 0,
              total: 15,
              totalwithtax: 17.25,
              products: [
                {
                  _id: new ObjectId(),
                  identity_id: 'rp-1',
                  recipe_product_name: 'Ovos',
                  value: 12,
                  status: 'ACTIVE',
                  qt: 12,
                  qtvalue: 4,
                  unit: 'UNID',
                },
              ],
            },
          ],
        },
      });

      const result = await productRepo(db).findById('user-1', productId.toString());

      assert.strictEqual(result.id, productId.toString());
      assert.strictEqual(result.supplies[0]._id, 'supply-uuid-001');
      assert.strictEqual(result.supplies[0].qtValue, 500);
      assert.strictEqual(result.recipes[0]._id, 'recipe-uuid-001');
      assert.strictEqual(result.recipes[0].yieldValue, 1000);
      assert.strictEqual(result.recipes[0].products[0].name, 'Ovos');

      const call = lastCall(db._collections.products, 'findOne');
      assert.strictEqual(call.filter.userid, 'user-1');
      assert.strictEqual(call.filter._id.toString(), productId.toString());
    });
  });

  describe('create', () => {
    it('inserts a single atomic document with embedded supplies and recipes', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      const repo = productRepo(db);

      const id = await repo.create(sampleCreateData());

      assert.strictEqual(typeof id, 'string');
      const call = lastCall(db._collections.products, 'insertOne');
      assert.strictEqual(call.doc.userid, 'user-1');
      assert.strictEqual(call.doc.product_name, 'Bolo de Chocolate');
      assert.strictEqual(call.doc.version, 1);

      const supply = call.doc.supplies[0];
      assert.strictEqual(supply.identity_id, 'supply-uuid-001');
      assert.strictEqual(supply.computed_cost, 4.25);
      assert.ok(supply._id instanceof ObjectId);

      const recipe = call.doc.recipes[0];
      assert.strictEqual(recipe.identity_id, 'recipe-uuid-001');
      assert.strictEqual(recipe.recipe_name, 'Massa Base');
      assert.strictEqual(recipe.products[0].recipe_product_name, 'Ovos');
      assert.strictEqual(recipe.products[0].computed_cost, 4);
    });

    it('creates products without supplies or recipes', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      await productRepo(db).create({ ...sampleCreateData(), supplies: [], recipes: [] });

      const call = lastCall(db._collections.products, 'insertOne');
      assert.deepStrictEqual(call.doc.supplies, []);
      assert.deepStrictEqual(call.doc.recipes, []);
    });

    it('applies the KG conversion to computed costs', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      await productRepo(db).create({
        ...sampleCreateData(),
        supplies: [{ id: 's-kg', name: 'Bulk', value: 1000, qt: 1, qtValue: 1, unit: 'KG' }],
        recipes: [],
      });

      const call = lastCall(db._collections.products, 'insertOne');
      assert.strictEqual(call.doc.supplies[0].computed_cost, 1);
    });
  });

  describe('update / updateWithEmbedded', () => {
    it('update returns false for invalid ids', async () => {
      assert.strictEqual(await productRepo().update('bad-id', {}), false);
      assert.strictEqual(await productRepo().updateWithEmbedded('bad-id', {}), false);
    });

    it('update sets scalar fields and bumps version', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      const productId = new ObjectId().toString();

      const result = await productRepo(db).update(productId, {
        name: 'New',
        prof: '35',
        price: 50,
        cost: 20,
        costWithTax: 23,
        costWithMarkup: 27,
        costWithMarkupTax: 31,
        totalFichas: 1,
        totalExtras: 2,
      });

      assert.strictEqual(result, true);
      const call = lastCall(db._collections.products, 'updateOne');
      assert.strictEqual(call.filter._id.toString(), productId);
      assert.strictEqual(call.update.$set.product_name, 'New');
      assert.strictEqual(call.update.$inc.version, 1);
    });

    it('updateWithEmbedded replaces supplies and recipes atomically', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      const productId = new ObjectId().toString();

      const result = await productRepo(db).updateWithEmbedded(productId, sampleCreateData());

      assert.strictEqual(result, true);
      const call = lastCall(db._collections.products, 'updateOne');
      assert.strictEqual(call.update.$set.supplies.length, 1);
      assert.strictEqual(call.update.$set.recipes.length, 1);
      assert.ok(call.update.$set.updated_at instanceof Date);
    });

    it('update returns false when nothing was modified', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection({
        updateOneResult: { modifiedCount: 0 },
      });

      assert.strictEqual(
        await productRepo(db).update(new ObjectId().toString(), sampleCreateData()),
        false
      );
    });
  });

  describe('delete', () => {
    it('returns false for invalid ids and deletes valid ones', async () => {
      assert.strictEqual(await productRepo().delete('bad-id'), false);

      const db = createFakeDb();
      db._collections.products = createFakeCollection();
      const productId = new ObjectId().toString();

      assert.strictEqual(await productRepo(db).delete(productId), true);
      const call = lastCall(db._collections.products, 'deleteOne');
      assert.strictEqual(call.filter._id.toString(), productId);
    });

    it('deleteAllByUserId removes every product of the user', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      assert.strictEqual(await productRepo(db).deleteAllByUserId('user-1'), true);
      const call = lastCall(db._collections.products, 'deleteMany');
      assert.deepStrictEqual(call.filter, { userid: 'user-1' });
    });
  });

  describe('supply webhooks (embedded array filters)', () => {
    it('updateSupplyByIdentityId uses arrayFilters on identity_id', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      const result = await productRepo(db).updateSupplyByIdentityId('user-1', 'supply-1', {
        name: 'Farinha',
        value: 9,
        qt: 1000,
        qtValue: 500,
        unit: 'G',
      });

      assert.strictEqual(result, true);
      const call = lastCall(db._collections.products, 'updateOne');
      assert.deepStrictEqual(call.filter, {
        userid: 'user-1',
        'supplies.identity_id': 'supply-1',
      });
      assert.strictEqual(call.update.$set['supplies.$[supply].name'], 'Farinha');
      assert.strictEqual(call.update.$set['supplies.$[supply].computed_cost'], 4.5);
      assert.deepStrictEqual(call.options, {
        arrayFilters: [{ 'supply.identity_id': 'supply-1' }],
      });
    });

    it('deleteSupplyByIdentityId pulls the embedded supply', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      assert.strictEqual(
        await productRepo(db).deleteSupplyByIdentityId('user-1', 'supply-1'),
        true
      );
      const call = lastCall(db._collections.products, 'updateOne');
      assert.deepStrictEqual(call.filter, { userid: 'user-1' });
      assert.deepStrictEqual(call.update.$pull, { supplies: { identity_id: 'supply-1' } });
    });
  });

  describe('recipe webhooks (embedded array filters)', () => {
    it('updateRecipeByIdentityId replaces the embedded recipe products', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      const result = await productRepo(db).updateRecipeByIdentityId('user-1', 'recipe-1', {
        name: 'Massa',
        quantity: 2,
        yieldValue: 1000,
        yieldValueUnit: 1,
        total: 15,
        totalWithTax: 17.25,
        products: [
          { id: 'rp-1', name: 'Ovos', value: 12, status: 'ACTIVE', qt: 12, qtValue: 6, unit: 'UNID' },
        ],
      });

      assert.strictEqual(result, true);
      const call = lastCall(db._collections.products, 'updateOne');
      assert.deepStrictEqual(call.filter, {
        userid: 'user-1',
        'recipes.identity_id': 'recipe-1',
      });
      assert.strictEqual(call.update.$set['recipes.$[recipe].recipe_name'], 'Massa');
      assert.strictEqual(call.update.$set['recipes.$[recipe].products'][0].computed_cost, 6);
      assert.deepStrictEqual(call.options, {
        arrayFilters: [{ 'recipe.identity_id': 'recipe-1' }],
      });
    });

    it('deleteRecipeByIdentityId pulls the embedded recipe', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection();

      assert.strictEqual(
        await productRepo(db).deleteRecipeByIdentityId('user-1', 'recipe-1'),
        true
      );
      const call = lastCall(db._collections.products, 'updateOne');
      assert.deepStrictEqual(call.update.$pull, { recipes: { identity_id: 'recipe-1' } });
    });
  });

  describe('cost helpers and pagination', () => {
    it('computeSupplyCost handles KG conversion', () => {
      const repo = productRepo();
      assert.strictEqual(repo.computeSupplyCost(8.5, 1000, 500, 'G'), 4.25);
      assert.strictEqual(repo.computeSupplyCost(1000, 1, 1, 'KG'), 1);
      assert.strictEqual(repo.computeRecipeProductCost(12, 12, 4, 'UNID'), 4);
    });

    it('findAllByUserIdPaginated delegates to the paginated helper', async () => {
      const db = createFakeDb();
      db._collections.products = createFakeCollection({
        findResult: [{ product_name: 'A' }],
        countResult: 1,
      });

      const result = await productRepo(db).findAllByUserIdPaginated('user-1', 1, 20);

      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.page, 1);
    });
  });
});
