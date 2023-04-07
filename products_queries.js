const PRODUCT_INSERT =
  "INSERT INTO products" +
  "(product_name, userid, profit_percentage, price," +
  "product_cost, product_cost_with_tax, product_cost_with_markup, product_cost_with_markup_tax, total_fichas, total_extras) " +
  "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

const PRODUCT_DELETE_BY_ID = "DELETE FROM products WHERE id = ?";

const PRODUCT_GET_BY_ID =
  "SELECT * FROM products WHERE userid = ? ORDER BY id DESC";

const PRODUCT_UPDATE_BY_ID =
  "UPDATE products SET " +
  "product_name=?, userid=?, profit_percentage=?," +
  "price=?, product_cost=?," +
  "product_cost_with_tax=?," +
  "product_cost_with_markup=?, product_cost_with_markup_tax=?," +
  "total_fichas=?," +
  "total_extras=?, updated_at=now() " +
  "WHERE id=?;";

const PRODUCT_GET_BY_ID_AND_USER_ID =
  "SELECT * FROM products WHERE userid = ? and id = ?";

module.exports = {
  PRODUCT_INSERT,
  PRODUCT_DELETE_BY_ID,
  PRODUCT_GET_BY_ID,
  PRODUCT_UPDATE_BY_ID,
  PRODUCT_GET_BY_ID_AND_USER_ID,
};
