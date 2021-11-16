const text1 = 'SELECT * FROM products WHERE userid = $1 and id = $2';
const text2 = 'SELECT * FROM products_supplies WHERE product_id = $1';
const text3 = 'SELECT * FROM products_recipes WHERE product_id = $1';
//TODO add products_recipes_products 

async function queryGetProductById(pool, userId, productId) {
    var result = await executeProductQuery(pool, [userId, productId]);
    var supplies = [];
    var recipes = [];

    if (result !== null) {
        supplies = await executeProductSuppliesQuery(pool, [productId]);
        recipes = await executeProductRecipesQuery(pool, [productId]);
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

module.exports = {
    queryGetProductById
}