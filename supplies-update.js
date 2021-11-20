const utils = require('./db-util');

const sqlUpdateSupplies = 'UPDATE products_supplies SET ' +
    'supply_name=$1, value=$2, qt=$3, qtvalue=$4, unit=$5 ' +
    'where product_id=$6 AND supply_identity_id=$7 RETURNING *;';


async function updateSupplies(pool, supplies, productId) {
    const pArray = supplies.map(async element => {

        var values = [element.name, element.value, element.qt,
        element.qtValue, element.unit,
            productId, element.id];

        var hasUpdated = await utils.executeUpdateQuery(pool, sqlUpdateSupplies, values);
        return hasUpdated;
    });

    const results = await Promise.all(pArray);

    let resultToReturn = results.every(function (e) {
        return e;
    });

    return resultToReturn;
}


module.exports = {
    updateSupplies
}