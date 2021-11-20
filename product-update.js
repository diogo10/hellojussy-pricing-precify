const utils = require('./db-util');

const sqlUpdateProduct = 'UPDATE products SET ' +
    'product_name=$1, userid=$2, profit_percentage=$3,' +
    'price=$4, product_cost=$5,' +
    'product_cost_with_tax=$6,' +
    'product_cost_with_markup=$7, product_cost_with_markup_tax=$8,' +
    'total_fichas=$9,' +
    'total_extras=$10, updated_at=now() ' +
    'WHERE id=$11 RETURNING id;';


async function queryUpdateProducts(pool, body, productId) {

    const { name, userId, prof, price, cost, costWithTax,
        costWithMarkup,
        costWithMarkupTax, totalFichas, totalExtras} = body;

    const values = [name, userId, prof, price, cost, costWithTax,
        costWithMarkup,
        costWithMarkupTax, totalFichas, totalExtras, productId];

    var result1 = await utils.executeUpdateQuery(pool, sqlUpdateProduct, values);
    return result1;

}

module.exports = {
    queryUpdateProducts
}