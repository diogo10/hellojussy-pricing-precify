const assert = require("assert");
const { MongoClient, ObjectId } = require('mongodb');
const { MongoEmbeddedRecipeRepository } = require("../repositories/mongo/RecipeRepository.js");

describe("Should validate MongoDB Recipe Repository operations", () => {
  let mongoClient;
  let db;
  let recipeRepository;

  before(async function () {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      this.skip();
      return;
    }

    mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await mongoClient.connect();
    db = mongoClient.db();
    recipeRepository = new MongoEmbeddedRecipeRepository(db);
    
    // Clean up test data
    await db.collection('products').deleteMany({ userid: 'test-user-recipes' });
  });

  after(async () => {
    if (mongoClient) {
      await mongoClient.close();
    }
  });

  it("should create and find recipe by remote ID", async () => {
    // Create a test product first
    const productResult = await db.collection('products').insertOne({
      userid: 'test-user-recipes',
      product_name: 'Test Product',
      profit_percentage: '30',
      price: 100,
      product_cost: 50,
      product_cost_with_tax: 60,
      product_cost_with_markup: 65,
      product_cost_with_markup_tax: 78,
      total_fichas: 30,
      total_extras: 20,
      supplies: [],
      recipes: [],
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    });
    
    const productId = productResult.insertedId.toString();
    
    // Create recipes
    const recipes = [{
      id: 'recipe-001',
      name: 'Test Recipe',
      total: 15.00,
      totalWithTax: 17.25,
      yieldValue: 1000,
      yieldValueUnit: 1,
      quantity: 2,
      products: [{
        id: 'recipe-prod-001',
        name: 'Ingredient 1',
        value: 10.00,
        status: 'ACTIVE',
        qt: 1000,
        qtValue: 500,
        unit: 'G'
      }]
    }];
    
    const created = await recipeRepository.create(productId, recipes);
    assert.strictEqual(created, true);
    
    // Find by remote ID
    const found = await recipeRepository.findByRemoteId('recipe-001', 'test-user-recipes');
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0]._id, 'recipe-001');
    assert.strictEqual(found[0].name, 'Test Recipe');
    assert.strictEqual(found[0].products.length, 1);
  });

  it("should delete recipe by remote ID", async () => {
    const deleted = await recipeRepository.deleteByRemoteId('recipe-001', 'test-user-recipes');
    assert.strictEqual(deleted, true);
    
    // Verify deleted
    const found = await recipeRepository.findByRemoteId('recipe-001', 'test-user-recipes');
    assert.strictEqual(found.length, 0);
  });

  it("should delete all recipes by product ID", async () => {
    // Create a test product
    const productResult = await db.collection('products').insertOne({
      userid: 'test-user-recipes',
      product_name: 'Test Product 2',
      profit_percentage: '30',
      price: 100,
      product_cost: 50,
      product_cost_with_tax: 60,
      product_cost_with_markup: 65,
      product_cost_with_markup_tax: 78,
      total_fichas: 30,
      total_extras: 20,
      supplies: [],
      recipes: [{
        _id: new ObjectId(),
        identity_id: 'recipe-002',
        recipe_name: 'Test Recipe 2',
        quantity: 1,
        yieldvalue: 1000,
        yieldvalueunit: 1,
        myprice: 0,
        myprof: 0,
        profit: 0,
        total: 15.00,
        totalwithtax: 17.25,
        margemper: '25',
        products: []
      }],
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    });
    
    const productId = productResult.insertedId.toString();
    
    // Delete all recipes for product
    const deleted = await recipeRepository.deleteByProductId(productId);
    assert.strictEqual(deleted, true);
    
    // Verify deleted
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    assert.strictEqual(product.recipes.length, 0);
  });

  it("should delete recipe by ID", async () => {
    // Create a test product with recipe
    const productResult = await db.collection('products').insertOne({
      userid: 'test-user-recipes',
      product_name: 'Test Product 3',
      profit_percentage: '30',
      price: 100,
      product_cost: 50,
      product_cost_with_tax: 60,
      product_cost_with_markup: 65,
      product_cost_with_markup_tax: 78,
      total_fichas: 30,
      total_extras: 20,
      supplies: [],
      recipes: [{
        _id: new ObjectId(),
        identity_id: 'recipe-003',
        recipe_name: 'Test Recipe 3',
        quantity: 1,
        yieldvalue: 1000,
        yieldvalueunit: 1,
        myprice: 0,
        myprof: 0,
        profit: 0,
        total: 15.00,
        totalwithtax: 17.25,
        margemper: '25',
        products: []
      }],
      created_at: new Date(),
      updated_at: new Date(),
      version: 1
    });
    
    const productId = productResult.insertedId.toString();
    const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
    const recipeMongoId = product.recipes[0]._id.toString();
    
    // Delete by MongoDB ObjectId
    const deleted = await recipeRepository.deleteById(recipeMongoId, 'test-user-recipes');
    assert.strictEqual(deleted, true);
  });
});