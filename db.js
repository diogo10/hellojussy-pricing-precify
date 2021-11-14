const { Pool } = require('pg');
const suppliesAdd = require('./supplies-add');
const suppliesDelete = require('./supplies-delete');
const productAdd = require('./product-add');
const productGet = require('./product-get');
const productDelete = require('./product-delete');
const recipeAdd = require('./recipes-add');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
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
  
    var deleted = await suppliesDelete.queryDeleteSuppliesFromProduct(pool, resultProductId);
    deleted = await productDelete.queryDeleteProduct(pool, resultProductId);
    response.status(200).json('NOK');
  } else {
    response.status(200).json({ status: (result && result2 ? 'OK' : 'NOK') });
  }

};



module.exports = {
  getProducts, createProduct
}