const text = 'DELETE FROM products_recipes WHERE product_id = $1 RETURNING id';

async function queryDeleteRecipesFromProduct(pool, productId) {
    return await executeQuery(pool, [productId]);
}

async function executeQuery(pool, values) {
    try {
        const response = await pool.query(text, values);
        return response.rows[0].id !== null;
    } catch (err) {
        console.log(err.stack)
        return false;
    }
}

module.exports = {
    queryDeleteRecipesFromProduct
}