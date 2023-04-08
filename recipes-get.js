const queries = require("./recipes_queries");

const text = queries.RECIPE_SELECT_GET_BY_ID;

async function queryGetRecipes(pool, recipeId, userId) {
  const list = await executeQuery(pool, [recipeId, userId]);
  return list;
}

async function executeQuery(pool, values) {
  try {
    const response = await pool.query(text, values);
    return response;
  } catch (err) {
    console.log(err.stack);
    return [];
  }
}

module.exports = {
  queryGetRecipes,
};
