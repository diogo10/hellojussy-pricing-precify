const text = 'DELETE FROM products_supplies WHERE product_id = $1';

async function queryDeleteSuppliesFromProduct(pool, productId) {
    const list = await executeQuery(pool, [productId]);
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
    queryDeleteSuppliesFromProduct
}