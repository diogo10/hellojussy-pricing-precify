const RECIPE_SELECT_BY_ID =
  "SELECT id, recipe_identity_id as _id, quantity FROM products_recipes WHERE product_id = ?";

const RECIPE_PRODUCTS_SELECT_BY_ID =
  "SELECT id, recipes_products_identity_id as _id, recipe_product_name as name, value, status," +
  "qt, qtvalue,unit FROM products_recipes_products WHERE products_recipes_id = ?";

const RECIPE_UPDATE_BY_USER =
  "UPDATE products_recipes SET " +
  "recipe_name=?, myprice=?, myprof=?, profit=?, total=?," +
  "totalwithtax=?, yieldvalue=?, yieldvalueunit=?," +
  "margemper=? " +
  "FROM (SELECT id FROM products where userid = ?) AS subquery " +
  "WHERE recipe_identity_id= ?";

const RECIPE_INSERT =
  "INSERT INTO products_recipes(recipe_name, total," +
  "totalwithtax, yieldvalue, yieldvalueunit, product_id, recipe_identity_id, quantity)" +
  " VALUES(?, ?, ?, ?, ?, ?, ?, ?)";

const RECIPE_INSERT_PRODUCTS =
  "INSERT INTO products_recipes_products" +
  "(recipe_product_name, value, status, qt, qtvalue, unit, products_recipes_id, recipes_products_identity_id)" +
  " VALUES(?, ?, ?, ?, ?, ?, ?, ?)";

module.exports = {
  RECIPE_SELECT_BY_ID,
  RECIPE_PRODUCTS_SELECT_BY_ID,
  RECIPE_UPDATE_BY_USER,
  RECIPE_INSERT,
  RECIPE_INSERT_PRODUCTS,
};
