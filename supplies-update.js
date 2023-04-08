const utils = require('./db-util');
const queries = require("./supplies_queries");
const sql = queries.SUPPLY_UPDATE;

async function updateSupplies(pool, supply, userId) {
    var values = [supply.name, supply.qt,
        supply.qtValue, supply.unit, supply.id, userId];

    var hasUpdated = await utils.executeUpdateQuery(pool, sql, values);
    return hasUpdated;
}

module.exports = {
    updateSupplies
}