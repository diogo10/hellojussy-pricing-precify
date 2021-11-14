const text = 'INSERT INTO products (product_name, userid, profit_percentage, price, created_at, updated_at) VALUES ($1, $2, $3, $4, now(),now()) RETURNING id';


async function queryAddProduct(pool, body) {

    const { name, userId, prof, price, supplies } = body;
    const resultToReturn = await executeQuery(pool, [name, userId, prof, price]);

    console.log("queryAddProduct: " + resultToReturn);
    return resultToReturn;
}


async function executeQuery(pool, values) {
    try {
        const response = await pool.query(text, values);
        const resultId = response.rows[0].id;
        console.log("add product id: " + resultId);
        return resultId;
    } catch (err) {
        console.log(err.stack)
        return null;
    }
}

module.exports = {
    queryAddProduct
}