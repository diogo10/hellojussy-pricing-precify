const { Pool } = require('pg');
const suppliesAdd = require('./supplies-add');
const suppliesDelete = require('./supplies-delete');
const suppliesUpdate = require('./supplies-update');
const productAdd = require('./product-add');
const productGet = require('./product-get');
const productGetEdit = require('./product-get-edit');
const productDelete = require('./product-delete');
const productUpdate = require('./product-update');
const recipeAdd = require('./recipes-add');
const recipeDelete = require('./recipes-delete');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

const getProductGetEdit = async (request, response) => {
  const id = extractToken(request);
  const productId  = request.params.id;
  var result = await productGetEdit.queryGetProductById(pool, id, productId);
  response.status(200).json(result);
};

const deleteProduct = async (request, response) => {
  const { id } = request.params;
  const deletedTheSupplies = await suppliesDelete.queryDeleteSuppliesFromProduct(pool, id);
  const deletedRecipes = await recipeDelete.queryDeleteRecipesFromProduct(pool, id);
  const deletedProduct = await productDelete.queryDeleteProduct(pool, id);

  const myResult = deletedRecipes && deletedTheSupplies && deletedProduct;
 
  response.send({status: (myResult ? 'OK' : 'NOK')});
};

const getProducts = async (request, response) => {
  const id = extractToken(request);
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


const updateProduct = async (request, response) => {
  const { id } = request.params;
  const body = request.body;
  const { supplies, recipes } = request.body;
  var result = await productUpdate.queryUpdateProducts(pool, body, id);

  if(result === true) {
    
    var hasRemovedSupplies = await suppliesDelete.queryDeleteSuppliesFromProduct(pool, id);
    console.log("hasRemovedSupplies: " + hasRemovedSupplies);
    var result1 = await suppliesAdd.queryAddSupplies(pool, id, supplies);
    console.log("has added supplies: " + result1);

    var hasRemovedRecipes = await recipeDelete.queryDeleteRecipesFromProduct(pool, id);
    console.log("hasRemovedRecipes: " + hasRemovedRecipes);
    var result2 = await recipeAdd.queryAddRecipes(pool, id, recipes);
    console.log("has added recipes: " + result2);

    response.send({status: 'OK'});
  } else {
    response.send({status: 'NOK'});
  }
};


module.exports = {
  getProducts, createProduct, deleteProduct, getProductGetEdit,
  updateProduct
}