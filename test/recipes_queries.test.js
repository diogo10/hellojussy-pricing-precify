const assert = require("assert");
const queries = require("../recipes_queries");

describe("Should validate queries for RECIPES", () => {
  it("RECIPE_SELECT_BY_ID", () => {
    const MOCK =
      "SELECT id, recipe_identity_id as _id, quantity FROM products_recipes WHERE product_id = ?";

    assert.strictEqual(MOCK, queries.RECIPE_SELECT_BY_ID);
  });

  it("RECIPE_PRODUCTS_SELECT_BY_ID", () => {
    const MOCK =
      "SELECT id, recipes_products_identity_id as _id, recipe_product_name as name, value, status," +
      "qt, qtvalue,unit FROM products_recipes_products WHERE products_recipes_id = ?";

    assert.strictEqual(MOCK, queries.RECIPE_PRODUCTS_SELECT_BY_ID);
  });
});
