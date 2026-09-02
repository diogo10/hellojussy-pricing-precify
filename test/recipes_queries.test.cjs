const assert = require("assert");
const queries = require("../recipes_queries");

describe("Should validate queries for recipes", () => {
  it("DELETE_RECIPE", () => {
    const MOCK =
      "DELETE FROM products_recipes WHERE product_id = $1 RETURNING id";

    assert.strictEqual(MOCK, queries.DELETE_RECIPE);
  });

  it("DELETE_RECIPE_PRODUCTS", () => {
    const MOCK =
      "DELETE FROM products_recipes " +
      "WHERE products_recipes.recipe_identity_id = $1 " +
      "AND product_id in (select id from products where userid = $2);";

    assert.strictEqual(MOCK, queries.DELETE_RECIPE_PRODUCTS);
  });

  it("DELETE_RECIPE_PRODUCTS", () => {
    const MOCK =
      "DELETE FROM products_recipes " +
      "WHERE products_recipes.id = $1 " +
      "AND product_id in (select id from products where userid = $2);";

    assert.strictEqual(MOCK, queries.DELETE_RECIPE_WITH_USER);
  });

  it("SELECT_WITH_USER", () => {
    const MOCK =
      "select * from products_recipes pr " +
      "WHERE pr.recipe_identity_id = $1 " +
      "AND product_id in (select id from products where userid = $2)";

    assert.strictEqual(MOCK, queries.SELECT_WITH_USER);
  });
});