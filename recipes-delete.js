const utils = require('./db-util');

const text1 = 'DELETE FROM products_recipes WHERE product_id = $1 RETURNING id';

const text2 = 'DELETE FROM products_recipes ' +
'WHERE products_recipes.recipe_identity_id = $1 ' +
'AND product_id in (select id from products where userid = $2);'

const text3 = 'DELETE FROM products_recipes ' +
'WHERE products_recipes.id = $1 ' +
'AND product_id in (select id from products where userid = $2);'

async function queryDeleteRecipesFromProduct(pool, productId) {
    result =  await utils.executeDeleteQuery(pool, text1 ,[productId]);
    return result
}

async function queryDeleteRecipeWith(pool, recipeId, userId) {

    var result =  await utils.executeDeleteQuery(pool, 
        text2 ,[recipeId, userId]);

    return result
}


async function queryDeleteRecipeById(pool, id, userId) {
    result =  await utils.executeDeleteQuery(pool, text3 ,[id, userId]);
    return result
}

module.exports = {
    queryDeleteRecipesFromProduct, queryDeleteRecipeWith, queryDeleteRecipeById
}