const text = 'select * from products_recipes pr ' +
'WHERE pr.recipe_identity_id = $1 ' +
'AND product_id in (select id from products where userid = $2)';

async function queryGetRecipes(pool, recipeId ,userId) {
    const list = await executeQuery(pool, [recipeId, userId]);
    return list;
}

async function executeQuery(pool, values) {
    try {
        const response = await pool.query(text, values);
        return response.rows;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

module.exports = {
    queryGetRecipes
}