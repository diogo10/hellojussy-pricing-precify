const utils = require('./db-util');
const queries = require("./products_queries");


async function queryUpdateProducts(pool, body, productId) {

    const { name, userId, prof, price, cost, costWithTax,
        costWithMarkup,
        costWithMarkupTax, totalFichas, totalExtras} = body;

    const values = [name, userId, prof, price, cost, costWithTax,
        costWithMarkup,
        costWithMarkupTax, totalFichas, totalExtras, productId];

    const result1 = await utils.executeUpdateQuery(pool, 
        queries.PRODUCT_UPDATE_BY_ID, values);
    return result1;

}

module.exports = {
    queryUpdateProducts
}