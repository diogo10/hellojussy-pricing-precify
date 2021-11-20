const utils = require('./db-util');

const text1 = 'DELETE FROM products_recipes WHERE product_id = $1 RETURNING id';

const text2 = 'DELETE FROM products_recipes_products B ' +
'USING products_recipes C ' +
'WHERE C.product_id = $1 AND B.products_recipes_id = C.id;';

async function queryDeleteRecipesFromProduct(pool, productId) {

    //Remove childrens
    var result =  await utils.executeDeleteQuery(pool, text2 ,[productId]);
    result =  await utils.executeDeleteQuery(pool, text1 ,[productId]);
    return result
}

module.exports = {
    queryDeleteRecipesFromProduct
}