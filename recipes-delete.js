const utils = require('./db-util');
const recal = require('./recal');
const queries = require("./recipes_queries");

const text1 = queries.RECIPE_DELETE;
const text2 = queries.RECIPE_DELETE_BY_USER;
const text3 = queries.RECIPE_DELETE_BY_USER_RECIPE_ID;

async function queryDeleteRecipesFromProduct(pool, productId) {
    result =  await utils.executeDeleteQuery(pool, text1 ,[productId]);
    return result
}

async function queryDeleteRecipeWith(pool, recipeId, userId) {

    var result = await utils.executeDeleteQuery(pool, 
        text2 ,[recipeId, userId]);

     if (result) {
        recal.executeRecalculate(userId);
     }

    return result
}


async function queryDeleteRecipeById(pool, id, userId) {
    result =  await utils.executeDeleteQuery(pool, text3 ,[id, userId]);
    return result
}

module.exports = {
    queryDeleteRecipesFromProduct, queryDeleteRecipeWith, 
    queryDeleteRecipeById
}