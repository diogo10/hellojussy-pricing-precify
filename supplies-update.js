const utils = require('./db-util');

const sql = 'UPDATE products_supplies SET ' +
    'supply_name=$1, value=$2, qt=$3, qtvalue=$4, unit=$5 ' +
    'where supply_identity_id=$6' +
    'AND product_id in (select id from products where userid = $7';

async function updateSupplies(pool, supply, userId) {
    var values = [supply.name, supply.value, supply.qt,
        supply.qtValue, supply.unit, userId.id, userId];

    var hasUpdated = await utils.executeUpdateQuery(pool, sql, values);

    return hasUpdated;
}

module.exports = {
    updateSupplies
}