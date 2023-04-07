const assert = require("assert");
const queries = require("../products_queries");

describe("Should validate queries for PRODUCTS", () => {
  it("PRODUCT_INSERT", () => {
    const MOCK =
      "INSERT INTO products" +
      "(product_name, userid, profit_percentage, price," +
      "product_cost, product_cost_with_tax, product_cost_with_markup, product_cost_with_markup_tax, total_fichas, total_extras) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    assert.strictEqual(MOCK, queries.PRODUCT_INSERT);
  });

  it("PRODUCT_DELETE_BY_ID", () => {
    const MOCK = "DELETE FROM products WHERE id = ?";

    assert.strictEqual(MOCK, queries.PRODUCT_DELETE_BY_ID);
  });

  it("PRODUCT_GET_BY_ID", () => {
    const MOCK = "SELECT * FROM products WHERE userid = ? ORDER BY id DESC";

    assert.strictEqual(MOCK, queries.PRODUCT_GET_BY_ID);
  });

  it("PRODUCT_UPDATE_BY_ID", () => {
    const MOCK =
      "UPDATE products SET " +
      "product_name=?, userid=?, profit_percentage=?," +
      "price=?, product_cost=?," +
      "product_cost_with_tax=?," +
      "product_cost_with_markup=?, product_cost_with_markup_tax=?," +
      "total_fichas=?," +
      "total_extras=?, updated_at=now() " +
      "WHERE id=?;";

    assert.strictEqual(MOCK, queries.PRODUCT_UPDATE_BY_ID);
  });

  it("PRODUCT_GET_BY_ID_AND_USER_ID", () => {
    const MOCK = "SELECT * FROM products WHERE userid = ? and id = ?";

    assert.strictEqual(MOCK, queries.PRODUCT_GET_BY_ID_AND_USER_ID);
  });
});
