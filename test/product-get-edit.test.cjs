const assert = require("assert");
const sinon = require("sinon");
const { ObjectId } = require('mongodb');

describe("product-get-edit MongoDB", () => {
  let mockRepo;
  let productGetEdit;

  beforeEach(() => {
    // Create a fresh mock repository for each test
    mockRepo = {
      findById: sinon.stub(),
    };
    
    // Clear require cache and re-require to get fresh module
    delete require.cache[require.resolve("../product-get-edit")];
    productGetEdit = require("../product-get-edit");
  });

  afterEach(() => {
    sinon.restore();
    productGetEdit.reset();
  });

  it("should return product with supplies and recipes for valid ID", async () => {
    const mockProduct = {
      id: "507f1f77bcf86cd799439011",
      product_name: "Test Product",
      userid: "user1",
      profit_percentage: "30",
      price: 45.00,
      product_cost: 22.50,
      product_cost_with_tax: 25.88,
      product_cost_with_markup: 29.25,
      product_cost_with_markup_tax: 33.64,
      total_fichas: 12.30,
      total_extras: 10.20,
      created_at: new Date(),
      updated_at: new Date(),
      supplies: [
        {
          id: "507f1f77bcf86cd799439012",
          _id: "supply-001",
          name: "Supply 1",
          value: 8.50,
          qt: 1000,
          qtValue: 500,
          unit: "G"
        }
      ],
      recipes: [
        {
          id: "507f1f77bcf86cd799439013",
          _id: "recipe-001",
          name: "Recipe 1",
          value: 0,
          status: "",
          qt: 0,
          qtValue: 0,
          unit: "",
          quantity: 2,
          total: 15.00,
          totalWithTax: 17.25,
          yieldValue: 1000,
          yieldValueUnit: 1,
          products: [
            {
              id: "507f1f77bcf86cd799439014",
              _id: "recipe-prod-001",
              name: "Ingredient 1",
              value: 12.00,
              status: "ACTIVE",
              qt: 12,
              qtValue: 4,
              unit: "UNID"
            }
          ]
        }
      ]
    };

    mockRepo.findById.resolves(mockProduct);

    const result = await productGetEdit.queryGetProductById("user1", "507f1f77bcf86cd799439011", { repository: mockRepo });

    assert.ok(result !== null);
    assert.strictEqual(result.product_name, "Test Product");
    assert.strictEqual(result.supplies.length, 1);
    assert.strictEqual(result.supplies[0].name, "Supply 1");
    assert.strictEqual(result.recipes.length, 1);
    assert.strictEqual(result.recipes[0].name, "Recipe 1");
    assert.strictEqual(result.recipes[0].products.length, 1);
    assert.strictEqual(result.recipes[0].products[0].name, "Ingredient 1");
    assert.ok(mockRepo.findById.calledWith("user1", "507f1f77bcf86cd799439011"));
  });

  it("should return null for invalid ObjectId", async () => {
    // The actual ObjectId.isValid check happens in the repository, but we can test that
    // the function handles null from repository
    mockRepo.findById.resolves(null);

    const result = await productGetEdit.queryGetProductById("user1", "invalid-id", { repository: mockRepo });

    assert.strictEqual(result, null);
  });

  it("should return null for non-existent product", async () => {
    mockRepo.findById.resolves(null);

    const result = await productGetEdit.queryGetProductById("user1", "507f1f77bcf86cd799439011", { repository: mockRepo });

    assert.strictEqual(result, null);
  });

  it("should return null on database error", async () => {
    mockRepo.findById.rejects(new Error("DB error"));

    const result = await productGetEdit.queryGetProductById("user1", "507f1f77bcf86cd799439011", { repository: mockRepo });

    assert.strictEqual(result, null);
  });

  it("should return product with empty supplies and recipes arrays when not present", async () => {
    const mockProduct = {
      id: "507f1f77bcf86cd799439011",
      product_name: "Test Product",
      userid: "user1",
      profit_percentage: "30",
      price: 45.00,
      product_cost: 22.50,
      product_cost_with_tax: 25.88,
      product_cost_with_markup: 29.25,
      product_cost_with_markup_tax: 33.64,
      total_fichas: 12.30,
      total_extras: 10.20,
      created_at: new Date(),
      updated_at: new Date(),
      supplies: [],
      recipes: []
    };

    mockRepo.findById.resolves(mockProduct);

    const result = await productGetEdit.queryGetProductById("user1", "507f1f77bcf86cd799439011", { repository: mockRepo });

    assert.ok(result !== null);
    assert.strictEqual(result.product_name, "Test Product");
    assert.deepStrictEqual(result.supplies, []);
    assert.deepStrictEqual(result.recipes, []);
  });
});