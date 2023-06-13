const utils = require("./db-util");
const recal = require("./recal");
const queries = require("./recipes_queries");

async function queryDeleteRecipesFromProduct(pool, productId) {
  result = await utils.executeDeleteQuery(pool, queries.DELETE_RECIPE, [
    productId,
  ]);
  return result;
}

async function queryDeleteRecipeWith(pool, recipeId, userId) {
  var hasDeleted = await utils.executeDeleteQuery(
    pool,
    queries.DELETE_RECIPE_PRODUCTS,
    [recipeId, userId]
  );

  return hasDeleted;
}

async function queryDeleteRecipeById(pool, id, userId) {
  result = await utils.executeDeleteQuery(
    pool,
    queries.DELETE_RECIPE_WITH_USER,
    [id, userId]
  );
  return result;
}

module.exports = {
  queryDeleteRecipesFromProduct,
  queryDeleteRecipeWith,
  queryDeleteRecipeById,
};
