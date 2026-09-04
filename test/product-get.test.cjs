const assert = require("assert");
const sinon = require("sinon");

describe("product-get MongoDB", () => {
  let mockRepo;
  let productGet;

  beforeEach(() => {
    // Create a fresh mock repository for each test
    mockRepo = {
      findAllByUserId: sinon.stub(),
    };
    
    // Clear require cache and re-require to get fresh module
    delete require.cache[require.resolve("../product-get")];
    productGet = require("../product-get");
  });

  afterEach(() => {
    sinon.restore();
    productGet.reset();
  });

  it("should return products for user", async () => {
    const mockProducts = [
      { _id: "1", product_name: "Product 1", userid: "user1" },
      { _id: "2", product_name: "Product 2", userid: "user1" },
    ];
    mockRepo.findAllByUserId.resolves(mockProducts);

    const result = await productGet.queryGetProduct("user1", { repository: mockRepo });

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].product_name, "Product 1");
    assert.strictEqual(result[1].product_name, "Product 2");
    assert.ok(mockRepo.findAllByUserId.calledWith("user1"));
  });

  it("should return empty array on error", async () => {
    mockRepo.findAllByUserId.rejects(new Error("DB error"));

    const result = await productGet.queryGetProduct("user1", { repository: mockRepo });

    assert.deepStrictEqual(result, []);
  });

  it("should return empty array for non-existent user", async () => {
    mockRepo.findAllByUserId.resolves([]);

    const result = await productGet.queryGetProduct("nonexistent", { repository: mockRepo });

    assert.deepStrictEqual(result, []);
  });
});