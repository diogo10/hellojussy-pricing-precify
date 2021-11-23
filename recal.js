const utils = require('./db-util');
const revenueTax = require('./revenue-tax-get');

async function executeRecalculate(pool, userId) {

    var markup = await revenueTax.getMarkup(userId); //percentage
    var tax = await revenueTax.getTaxTotal(userId); //percentage
    console.log("executeRecalculate: markup: " + markup);
    console.log("executeRecalculate: tax: " + tax);

    var result = await utils.recalculate(pool, [tax, markup, userId]);
    console.log("executeRecalculate: result: " + result);
    return result;
}

module.exports = {
    executeRecalculate
}