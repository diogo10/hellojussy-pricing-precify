const queries = require("./recipes_queries");

async function queryGetRecipes(pool, recipeId ,userId) {
    const list = await executeQuery(pool, [recipeId, userId]);
    return list;
}

async function executeQuery(pool, values) {
    try {
        const response = await pool.query(queries.SELECT_WITH_USER, values);
        return response.rows;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

module.exports = {
    queryGetRecipes
}