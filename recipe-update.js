const utils = require('./db-util');

const sqlUpdate =
    'UPDATE products_recipes SET ' +
    'recipe_name=$1, myprice=$2, myprof=$3, profit=$4, total=$5,' +
    'totalwithtax=$6, yieldvalue=$7, yieldvalueunit=$8,' +
    'margemper=$9 ' +
    'FROM (SELECT id FROM products where userid = $10) AS subquery ' +
    'WHERE recipe_identity_id= $11 RETURNING products_recipes.id;';


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