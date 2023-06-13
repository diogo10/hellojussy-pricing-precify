const DELETE_RECIPE =
  "DELETE FROM products_recipes WHERE product_id = $1 RETURNING id";

const DELETE_RECIPE_PRODUCTS =
  "DELETE FROM products_recipes " +
  "WHERE products_recipes.recipe_identity_id = $1 " +
  "AND product_id in (select id from products where userid = $2);";

const DELETE_RECIPE_WITH_USER =
  "DELETE FROM products_recipes " +
  "WHERE products_recipes.id = $1 " +
  "AND product_id in (select id from products where userid = $2);";

const SELECT_WITH_USER =
  "select * from products_recipes pr " +
  "WHERE pr.recipe_identity_id = $1 " +
  "AND product_id in (select id from products where userid = $2)";

module.exports = {
  DELETE_RECIPE,
  DELETE_RECIPE_PRODUCTS,
  DELETE_RECIPE_WITH_USER,
  SELECT_WITH_USER
};
