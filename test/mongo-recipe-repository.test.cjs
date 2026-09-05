const assert = require('assert');
const { ObjectId } = require('mongodb');
const {
  MongoRecipeRepository,
  MongoEmbeddedRecipeRepository,
  MongoRecipeCollectionPaginatedRepository,
} = require('../repositories/mongo/RecipeRepository.js');
const { createFakeCollection, createFakeDb, lastCall } = require('./helpers/mongo-fakes.cjs');

const RECIPE = {
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
};

describe('MongoRecipeRepository (separate collection)', () => {
  it('findByRemoteId scopes recipes to user products and maps them', async () => {
    const db = createFakeDb();
    const productId = new ObjectId();
    const recipeId = new ObjectId();
    const ingredientId = new ObjectId();
    db._collections.products = createFakeCollection({ findResult: [{ _id: productId }] });
    db._collections.recipes = createFakeCollection({
      findResult: [
        {
          _id: recipeId,
          identity_id: 'recipe-uuid-001',
          recipe_name: 'Massa',
          quantity: 2,
          total: 15,
          totalwithtax: 17.25,
          yieldvalue: 1000,
          yieldvalueunit: 1,
          products: [
            {
              _id: ingredientId,
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
    });
    const repo = new MongoRecipeRepository(db);

    const result = await repo.findByRemoteId('recipe-uuid-001', 'user-1');

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0]._id, 'recipe-uuid-001');
    assert.strictEqual(result[0].yieldValue, 1000);
    assert.strictEqual(result[0].products[0].name, 'Ovos');
    const call = lastCall(db._collections.recipes, 'find');
    assert.strictEqual(call.filter.identity_id, 'recipe-uuid-001');
    assert.deepStrictEqual(call.filter.product_id, { $in: [productId.toString()] });
  });

  it('create stores recipes with embedded ingredients and computed costs', async () => {
    const db = createFakeDb();
    db._collections.recipes = createFakeCollection();
    const repo = new MongoRecipeRepository(db);
    const productId = new ObjectId().toString();

    const result = await repo.create(productId, [RECIPE]);

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.recipes, 'insertMany');
    assert.strictEqual(call.docs[0].product_id, productId);
    assert.strictEqual(call.docs[0].identity_id, 'recipe-uuid-001');
    assert.strictEqual(call.docs[0].products[0].computed_cost, 4);
    assert.ok(call.docs[0].products[0]._id instanceof ObjectId);
  });

  it('create returns false for invalid product ids', async () => {
    assert.strictEqual(
      await new MongoRecipeRepository(createFakeDb()).create('bad-id', [RECIPE]),
      false
    );
  });

  it('deleteByProductId removes every recipe of the product', async () => {
    const db = createFakeDb();
    db._collections.recipes = createFakeCollection();

    assert.strictEqual(
      await new MongoRecipeRepository(db).deleteByProductId(new ObjectId().toString()),
      true
    );
    assert.strictEqual(lastCall(db._collections.recipes, 'deleteMany').method, 'deleteMany');
  });

  it('deleteByRemoteId scopes the delete to user products', async () => {
    const db = createFakeDb();
    const productId = new ObjectId();
    db._collections.products = createFakeCollection({ findResult: [{ _id: productId }] });
    db._collections.recipes = createFakeCollection();

    assert.strictEqual(
      await new MongoRecipeRepository(db).deleteByRemoteId('recipe-uuid-001', 'user-1'),
      true
    );
    const call = lastCall(db._collections.recipes, 'deleteOne');
    assert.strictEqual(call.filter.identity_id, 'recipe-uuid-001');
    assert.deepStrictEqual(call.filter.product_id, { $in: [productId.toString()] });
  });

  it('deleteById supports identity ids for webhook deletes', async () => {
    const db = createFakeDb();
    const productId = new ObjectId();
    db._collections.products = createFakeCollection({ findResult: [{ _id: productId }] });
    db._collections.recipes = createFakeCollection();

    assert.strictEqual(
      await new MongoRecipeRepository(db).deleteById('recipe-uuid-001', 'user-1'),
      true
    );
    const call = lastCall(db._collections.recipes, 'deleteOne');
    assert.strictEqual(call.filter.identity_id, 'recipe-uuid-001');
  });

  it('computeRecipeProductCost handles KG conversion', () => {
    const repo = new MongoRecipeRepository(createFakeDb());
    assert.strictEqual(repo.computeRecipeProductCost(12, 12, 4, 'UNID'), 4);
    assert.strictEqual(repo.computeRecipeProductCost(1000, 1, 1, 'KG'), 1);
  });
});

describe('MongoEmbeddedRecipeRepository (embedded per MONGODB_SCHEMA_PROPOSAL.md)', () => {
  it('findByRemoteId projects the matching embedded recipe', async () => {
    const db = createFakeDb();
    const recipeId = new ObjectId();
    const ingredientId = new ObjectId();
    db._collections.products = createFakeCollection({
      findOneResult: {
        _id: new ObjectId(),
        recipes: [
          {
            _id: recipeId,
            identity_id: 'recipe-uuid-001',
            recipe_name: 'Massa',
            quantity: 2,
            total: 15,
            totalwithtax: 17.25,
            yieldvalue: 1000,
            yieldvalueunit: 1,
            products: [
              {
                _id: ingredientId,
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
    const repo = new MongoEmbeddedRecipeRepository(db);

    const result = await repo.findByRemoteId('recipe-uuid-001', 'user-1');

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, recipeId.toString());
    assert.strictEqual(result[0].products[0].qtValue, 4);
    const call = lastCall(db._collections.products, 'findOne');
    assert.deepStrictEqual(call.filter, {
      userid: 'user-1',
      'recipes.identity_id': 'recipe-uuid-001',
    });
    assert.deepStrictEqual(call.options.projection.recipes, {
      $elemMatch: { identity_id: 'recipe-uuid-001' },
    });
  });

  it('findByRemoteId returns [] when nothing matches', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection({
      findOneResult: { _id: new ObjectId(), recipes: [] },
    });

    assert.deepStrictEqual(
      await new MongoEmbeddedRecipeRepository(db).findByRemoteId('missing', 'user-1'),
      []
    );
  });

  it('create replaces embedded recipes with computed ingredient costs', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const productId = new ObjectId().toString();

    const result = await new MongoEmbeddedRecipeRepository(db).create(productId, [RECIPE]);

    assert.strictEqual(result, true);
    const call = lastCall(db._collections.products, 'updateOne');
    assert.strictEqual(call.filter._id.toString(), productId);
    assert.strictEqual(call.update.$set.recipes[0].identity_id, 'recipe-uuid-001');
    assert.strictEqual(call.update.$set.recipes[0].products[0].computed_cost, 4);
    assert.strictEqual(call.update.$inc.version, 1);
  });

  it('deleteByProductId clears the embedded recipes array', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const productId = new ObjectId().toString();

    assert.strictEqual(
      await new MongoEmbeddedRecipeRepository(db).deleteByProductId(productId),
      true
    );
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.update.$set.recipes, []);
  });

  it('deleteByRemoteId pulls the recipe by identity_id', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();

    assert.strictEqual(
      await new MongoEmbeddedRecipeRepository(db).deleteByRemoteId('recipe-uuid-001', 'user-1'),
      true
    );
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.filter, { userid: 'user-1' });
    assert.deepStrictEqual(call.update.$pull, { recipes: { identity_id: 'recipe-uuid-001' } });
  });

  it('deleteById pulls by ObjectId when the id is a valid ObjectId', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();
    const recipeObjectId = new ObjectId().toString();

    assert.strictEqual(
      await new MongoEmbeddedRecipeRepository(db).deleteById(recipeObjectId, 'user-1'),
      true
    );
    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.update.$pull, { recipes: { _id: new ObjectId(recipeObjectId) } });
  });

  it('deleteById pulls by identity_id otherwise', async () => {
    const db = createFakeDb();
    db._collections.products = createFakeCollection();

    await new MongoEmbeddedRecipeRepository(db).deleteById('recipe-uuid-001', 'user-1');

    const call = lastCall(db._collections.products, 'updateOne');
    assert.deepStrictEqual(call.update.$pull, { recipes: { identity_id: 'recipe-uuid-001' } });
  });
});

describe('MongoRecipeCollectionPaginatedRepository', () => {
  it('findPaginated maps recipes with page metadata', async () => {
    const db = createFakeDb();
    db._collections.recipes = createFakeCollection({
      findResult: [
        {
          _id: new ObjectId(),
          identity_id: 'r-1',
          recipe_name: 'Massa',
          quantity: 1,
          total: 10,
          totalwithtax: 11,
          yieldvalue: 100,
          yieldvalueunit: 1,
          products: [],
        },
      ],
      countResult: 1,
    });
    const repo = new MongoRecipeCollectionPaginatedRepository(db);

    const result = await repo.findPaginated({ product_id: 'p1' }, { page: 1, limit: 20 });

    assert.strictEqual(result.total, 1);
    assert.strictEqual(result.data[0]._id, 'r-1');
    assert.strictEqual(result.data[0].yieldValue, 100);
  });
});
