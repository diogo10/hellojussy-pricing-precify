const text1 = 'SELECT * FROM products WHERE userid = $1 and id = $2';
const text2 = 'SELECT id, supply_identity_id as _id, supply_name as name, value, qt, qtvalue, unit FROM products_supplies WHERE product_id = $1';
const text3 = 'SELECT id, recipe_identity_id as _id, quantity FROM products_recipes WHERE product_id = $1';

const text4 = 'SELECT id, recipes_products_identity_id as _id, recipe_product_name as name, value, status,' +
'qt, qtvalue,unit FROM products_recipes_products WHERE products_recipes_id = $1';

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
        if (newResult === undefined) {
            return [];
        }
        newResult.supplies = supplies;
        newResult.recipes = productRecipes;
    
        return newResult;
    } else {
        return [];
    }

   
}

async function newQueryGetProductById(pool, userId, productId) {
    var result = await executeProductQuery(pool, [userId, productId]);
    var supplies = [];
    var recipes = [];

    if (result !== null) {
        supplies = await executeProductSuppliesQuery(pool, [productId]);
        var recipesDb = await executeProductRecipesQuery(pool, [productId]);

        recipesDb.forEach(async element => {
            var recipesProducts = await executeProductRecipesProductsQuery(pool, [element.id]);
            element.products = recipesProducts;
            recipes.push(element);
        });
    }

    var newResult = result[0];
    newResult.supplies = supplies;
    newResult.recipes = recipes;

    return newResult;
}


async function executeProductQuery(pool, values) {
    try {
        const response = await pool.query(text1, values);
        return response.rows;
    } catch (err) {
        console.log(err.stack)
        return null;
    }
}

async function executeProductSuppliesQuery(pool, values) {
    try {
        const response = await pool.query(text2, values);
        return response.rows;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

async function executeProductRecipesQuery(pool, values) {
    try {
        const response = await pool.query(text3, values);
        return response.rows;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

async function executeProductRecipesProductsQuery(pool, values) {
    try {
        const response = await pool.query(text4, values);
        return response.rows;
    } catch (err) {
        console.log(err.stack)
        return [];
    }
}

module.exports = {
    queryGetProductById
}