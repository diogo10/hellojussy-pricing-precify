const queries = require("./supplies_queries");
const utils = require('./db-util');

async function queryDeleteSuppliesFromProduct(pool, productId) {
    return await utils.executeDeleteQuery(pool, queries.DELETE_BY_ID, [productId]);
}

async function queryDeleteSupplyByRemoteId(pool, supplyId, userId) {
    return await utils.executeDeleteQuery(pool, queries.DELETE_BY_IN_AND_USER, [supplyId, userId]);
}

module.exports = {
    queryDeleteSuppliesFromProduct, queryDeleteSupplyByRemoteId
}