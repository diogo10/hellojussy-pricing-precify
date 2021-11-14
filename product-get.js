const text = 'SELECT * FROM products WHERE userid = $1';

async function queryGetProduct(pool, userId) {
    const list = await executeQuery(pool, [userId]);
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
    queryGetProduct
}