const { Pool } = require('pg');
const suppliesAdd = require('./supplies-add');
const suppliesDelete = require('./supplies-delete');
const productAdd = require('./product-add');
const productGet = require('./product-get');
const productDelete = require('./product-delete');
const recipeAdd = require('./recipes-add');
const recipeDelete = require('./recipes-delete');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const getProducts = async (request, response) => {
  const id = request.query.id;
  const list = await productGet.queryGetProduct(pool, id);
  response.status(200).json(list);
};


const createProduct = async (request, response) => {
  const { supplies, recipes } = request.body;

  const resultProductId = await productAdd.queryAddProduct(pool, request.body);
  var result = await suppliesAdd.queryAddSupplies(pool, resultProductId, supplies);
  const result2 = await recipeAdd.queryAddRecipes(pool, resultProductId, recipes);

  if (result && !result2) {

    const deletedTheSupplies = await suppliesDelete.queryDeleteSuppliesFromProduct(pool, resultProductId);
    const deletedRecipes = await recipeDelete.queryDeleteRecipesFromProduct(pool, resultProductId);
    const deletedProduct = await productDelete.queryDeleteProduct(pool, resultProductId);

    response.status(200).json({
      status: 'NOK', message: "internal error",
      deletedSupplies: deletedTheSupplies,
      deletedRecipes: deletedRecipes,
      deletedProduct: deletedProduct
    });
    
  } else {
    response.status(200).json({ status: (result && result2 ? 'OK' : 'NOK') });
  }

};



module.exports = {
  getProducts, createProduct
}