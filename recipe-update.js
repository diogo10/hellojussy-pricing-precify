const utils = require('./db-util');
const queries = require("./recipes_queries");
const sqlUpdate = queries.RECIPE_UPDATE_BY_USER;

async function queryUpdateRecipes(pool, body, userId) {

    var values = [body.name, body.myPrice, body.myProf,
    body.profit, body.total, body.totalWithTax, body.yieldValue,
    body.yieldValueUnit, body.profMargemPer, userId, body.id];

    var result1 = await utils.executeUpdateQuery(pool, sqlUpdate, values);
    console.log("queryUpdateRecipes: " + result1);
    return result1;
}

module.exports = {
    queryUpdateRecipes
}