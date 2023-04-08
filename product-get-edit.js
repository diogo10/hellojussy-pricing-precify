const queries = require("./products_queries");
const queriesSupplies = require("./supplies_queries");
const queriesRecipes = require("./recipes_queries");

const text1 = queries.PRODUCT_GET_BY_ID_AND_USER_ID;
const text2 = queriesSupplies.SUPPLY_SELECT_BY_PRODUCT_ID;
const text3 = queriesRecipes.RECIPE_SELECT_BY_ID;
const text4 = queriesRecipes.RECIPE_PRODUCTS_SELECT_BY_ID;

async function queryGetProductById(pool, userId, productId) {
    var supplies = [];

    var result = await executeProductQuery(pool, [userId, productId]);

    if (result !== null) {
        supplies = await executeProductSuppliesQuery(pool, [productId]);
        var recipesDb = await executeProductRecipesQuery(pool, [productId]);

        const pArray = recipesDb.map(async element => {
            var item = element;
            var recipesProducts = await executeProductRecipesProductsQuery(pool, [element.id]);
            item.products = recipesProducts;
            return item;
        });

        const productRecipes = await Promise.all(pArray);

        var newResult = result[0];
        newResult.supplies = supplies;
        newResult.recipes = productRecipes;
    
        return newResult;
    } else {
        return [];
    }

   
}


async function executeProductQuery(pool, values) {
    try {
        const response = await pool.query(text1, values);
        return response;
    } catch (err) {
        console.log(err.stack)
        return null;
    }
}

async function executeProductSuppliesQuery(pool, values) {
    try {
        const response = await pool.query(text2, values);
        return response;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

async function executeProductRecipesQuery(pool, values) {
    try {
        const response = await pool.query(text3, values);
        return response;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

async function executeProductRecipesProductsQuery(pool, values) {
    try {
        const response = await pool.query(text4, values);
        return response;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

module.exports = {
    queryGetProductById
}