const text = 'DELETE FROM products WHERE id = $1 RETURNING id';

async function queryDeleteProduct(pool, productId) {
    const list = await executeQuery(pool, [productId]);
    return list;
}

async function executeQuery(pool, values) {
    try {
        const response = await pool.query(text, values);
        return response.rows[0].id !== null;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

module.exports = {
    queryDeleteProduct
}