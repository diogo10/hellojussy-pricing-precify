const text = 'INSERT INTO products' +
'(product_name, userid, profit_percentage, price,' +
'product_cost, product_cost_with_tax, product_cost_with_markup, product_cost_with_markup_tax, total_fichas, total_extras) ' +
'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

async function queryAddProduct(pool, body) {

    const { name, userId, prof, price, cost, costWithTax, totalFichas,
        totalExtras, costWithMarkup, costWithMarkupTax } = body;

    const values = [name, userId, prof, price, cost, costWithTax, 
        costWithMarkup, costWithMarkupTax, totalFichas, totalExtras];

    const resultToReturn = await executeQuery(pool, values);

    console.log("queryAddProduct: " + resultToReturn);
    return resultToReturn;
}


async function executeQuery(pool, values) {
    try {
        const response = await pool.query(text, values);
        const resultId = response.insertId;
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