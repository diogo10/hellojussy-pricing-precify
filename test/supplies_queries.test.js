const assert = require("assert");
const queries = require("../supplies_queries");

describe("Should validate queries for supplies", () => {
  it("SUPPLY_INSERT", () => {
    const MOCK =
      "INSERT INTO products_supplies(supply_name, value, qt, qtvalue, unit, product_id, supply_identity_id) " +
      "VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id";

    assert.strictEqual(MOCK, queries.SUPPLY_INSERT);
  });

  it("DELETE_BY_ID", () => {
    const MOCK = "DELETE FROM products_supplies WHERE product_id = $1";

    assert.strictEqual(MOCK, queries.DELETE_BY_ID);
  });

  it("DELETE_BY_IN_AND_USER", () => {
    const MOCK =
      "DELETE FROM products_supplies WHERE supply_identity_id = $1 " +
      "AND product_id in (select id from products where userid = $2);";

    assert.strictEqual(MOCK, queries.DELETE_BY_IN_AND_USER);
  });

  it("SUPPLY_SELECT_BY_PRODUCT_ID", () => {
    const MOCK =
      "SELECT id, supply_identity_id as _id, supply_name as name, value, qt, qtvalue, unit FROM products_supplies WHERE product_id = $1";
    assert.strictEqual(MOCK, queries.SUPPLY_SELECT_BY_PRODUCT_ID);
  });

  it("SUPPLY_UPDATE", () => {
    const MOCK =
      "UPDATE products_supplies SET " +
      "supply_name=$1, qt=$2, qtvalue=$3, unit=$4 " +
      "where supply_identity_id=$5 " +
      "AND product_id in (select id from products where userid = $6)";
    assert.strictEqual(MOCK, queries.SUPPLY_UPDATE);
  });
});
