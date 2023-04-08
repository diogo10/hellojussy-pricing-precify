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

  it("RECIPE_UPDATE_BY_USER", () => {
    const MOCK =
      "UPDATE products_recipes SET " +
      "recipe_name=?, myprice=?, myprof=?, profit=?, total=?," +
      "totalwithtax=?, yieldvalue=?, yieldvalueunit=?," +
      "margemper=? " +
      "FROM (SELECT id FROM products where userid = ?) AS subquery " +
      "WHERE recipe_identity_id= ?";

    assert.strictEqual(MOCK, queries.RECIPE_UPDATE_BY_USER);
  });

  it("RECIPE_INSERT", () => {
    const MOCK =
      "INSERT INTO products_recipes(recipe_name, total," +
      "totalwithtax, yieldvalue, yieldvalueunit, product_id, recipe_identity_id, quantity)" +
      " VALUES(?, ?, ?, ?, ?, ?, ?, ?)";

    assert.strictEqual(MOCK, queries.RECIPE_INSERT);
  });

  it("RECIPE_INSERT_PRODUCTS", () => {
    const MOCK =
      "INSERT INTO products_recipes_products" +
      "(recipe_product_name, value, status, qt, qtvalue, unit, products_recipes_id, recipes_products_identity_id)" +
      " VALUES(?, ?, ?, ?, ?, ?, ?, ?)";

    assert.strictEqual(MOCK, queries.RECIPE_INSERT_PRODUCTS);
  });
});
