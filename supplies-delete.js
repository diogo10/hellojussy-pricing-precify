const utils = require('./db-util');

const text1 = 'DELETE FROM products_supplies WHERE product_id = $1 RETURNING id';

const text2 = 'DELETE FROM products_supplies WHERE supply_identity_id = $1 ' +
'AND product_id in (select id from products where userid = $2);';

async function queryDeleteSuppliesFromProduct(pool, productId) {
    return await utils.executeDeleteQuery(pool, text1, [productId]);
}

async function queryDeleteSupplyByRemoteId(pool, supplyId, userId) {
    return await utils.executeDeleteQuery(pool, text2, [supplyId, userId]);
}

module.exports = {
    queryDeleteSuppliesFromProduct, queryDeleteSupplyByRemoteId
}