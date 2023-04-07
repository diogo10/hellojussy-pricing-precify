const queries = require("./products_queries");
async function queryDeleteProduct(pool, productId) {
    const list = await executeQuery(pool, [productId]);
    return list;
}

async function executeQuery(pool, values) {
    try {
        const response = await pool.query(queries.PRODUCT_DELETE_BY_ID, values);
        return response.affectedRows !== null;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

module.exports = {
    queryDeleteProduct
}