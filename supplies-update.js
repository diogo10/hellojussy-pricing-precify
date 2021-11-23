const utils = require('./db-util');
const recal = require('./recal');

const sql = 'UPDATE products_supplies SET ' +
    'supply_name=$1, qt=$2, qtvalue=$3, unit=$4 ' +
    'where supply_identity_id=$5 ' +
    'AND product_id in (select id from products where userid = $6';

async function updateSupplies(pool, supply, userId) {
    var values = [supply.name, supply.qt,
        supply.qtValue, supply.unit, supply.id, userId];

    var hasUpdated = await utils.executeUpdateQuery(pool, sql, values);
    return hasUpdated;
}

module.exports = {
    updateSupplies
}