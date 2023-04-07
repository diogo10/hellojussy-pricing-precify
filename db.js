const mysql = require("promise-mysql");

const suppliesAdd = require("./supplies-add");
const suppliesDelete = require("./supplies-delete");
const suppliesUpdate = require("./supplies-update");

const productAdd = require("./product-add");
const productGet = require("./product-get");
const productGetEdit = require("./product-get-edit");
const productDelete = require("./product-delete");
const productUpdate = require("./product-update");

const recipeAdd = require("./recipes-add");
const recipeDelete = require("./recipes-delete");
const recipeGet = require("./recipes-get");
const recipeRecal = require("./recal-recipes");

const recal = require("./recal");

const deleteAllPro = require("./delete-all");

const getDbConnection = async () => {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });
};

function extractToken(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

const getProductGetEdit = async (request, response) => {
  const id = extractToken(request);
  const productId = request.params.id;
  const pool = await getDbConnection();
  const result = await productGetEdit.queryGetProductById(pool, id, productId);
  await pool.end();
  response.status(200).json(result);
};

const deleteProduct = async (request, response) => {
  const { id } = request.params;
  const pool = await getDbConnection();
  const deletedTheSupplies =
    await suppliesDelete.queryDeleteSuppliesFromProduct(pool, id);
  const deletedRecipes = await recipeDelete.queryDeleteRecipesFromProduct(
    pool,
    id
  );
  const deletedProduct = await productDelete.queryDeleteProduct(pool, id);

  console.log("delete supplies: " + deletedTheSupplies);
  console.log("delete recipes: " + deletedRecipes);
  console.log("delete product: " + deletedProduct);

  const myResult = deletedProduct;
  await pool.end();
  response.send({ status: myResult ? "OK" : "NOK" });
};

const getProducts = async (request, response) => {
  const id = extractToken(request);
  const db = await getDbConnection();
  const list = await productGet.queryGetProduct(db, id);
  await db.end();
  response.status(200).json(list);
};

const createProduct = async (request, response) => {
  const { supplies, recipes } = request.body;
  const db = await getDbConnection();

  const resultProductId = await productAdd.queryAddProduct(db, request.body);
  const result = await suppliesAdd.queryAddSupplies(db, resultProductId, supplies);
  const result2 = await recipeAdd.queryAddRecipes(db, resultProductId, recipes);

  if (result && !result2) {
    const deletedTheSupplies = await suppliesDelete.queryDeleteSuppliesFromProduct(db, resultProductId);
    const deletedRecipes = await recipeDelete.queryDeleteRecipesFromProduct(db, resultProductId);
    const deletedProduct = await productDelete.queryDeleteProduct(db, resultProductId);
    await db.end();
    response.status(200).json({
      status: "NOK",
      message: "internal error",
      deletedSupplies: deletedTheSupplies,
      deletedRecipes: deletedRecipes,
      deletedProduct: deletedProduct,
    });
  } else {
    await db.end();
    response.status(200).json({ status: result && result2 ? "OK" : "NOK" });
  }
};

const updateProduct = async (request, response) => {
  const { id } = request.params;
  const body = request.body;
  const { supplies, recipes } = request.body;
  const pool = await getDbConnection();
  var result = await productUpdate.queryUpdateProducts(pool, body, id);

  if (result === true) {
    var hasRemovedSupplies =
      await suppliesDelete.queryDeleteSuppliesFromProduct(pool, id);
    console.log("hasRemovedSupplies: " + hasRemovedSupplies);
    var result1 = await suppliesAdd.queryAddSupplies(pool, id, supplies);
    console.log("has added supplies: " + result1);

    var hasRemovedRecipes = await recipeDelete.queryDeleteRecipesFromProduct(
      pool,
      id
    );
    console.log("hasRemovedRecipes: " + hasRemovedRecipes);
    var result2 = await recipeAdd.queryAddRecipes(pool, id, recipes);
    console.log("has added recipes: " + result2);

    await pool.end();
    response.send({ status: "OK" });
  } else {
    response.send({ status: "NOK" });
  }
};

// Webhooks - Recipe

/**
 * This method will update a recipe.
 * First, it will get all recipes by the remote id and then:
 *  - Remove old data
 *  - Save old data such as product_id and quantity
 *  - Add the new recipe along with old row data
 * @param {*} request - recipe body
 * @param {*} response OK or NOK(it does not mean bad in this situation)
 */
const updateRecipe = async (request, response) => {
  const body = request.body;
  const userId = extractToken(request);
  const id = body.id;

  var list = await recipeGet.queryGetRecipes(pool, id, userId);
  var result = await recipeRecal.recalRecipe(pool, body, userId, list);

  if (result) {
    recal.executeRecalculate(pool, userId);
  }

  response.status(200).json({ status: result ? "OK" : "NOK" });
};

/**
 * Should delete a recipe by his remote id.
 * @param {*} request - id
 * @param {*} response - OK or NOK(it does not mean bad in this situation)
 */
const deleteRecipe = async (request, response) => {
  const recipeId = request.body.id;
  const userId = extractToken(request);
  var hasDeleted = await recipeDelete.queryDeleteRecipeWith(
    pool,
    recipeId,
    userId
  );
  console.log("deleteRecipe: " + hasDeleted);

  if (hasDeleted) {
    recal.executeRecalculate(pool, userId);
  }

  response.status(200).json({ status: hasDeleted ? "OK" : "NOK" });
};

// Webhooks - Supply

/**
 * Should update a supply using the remote id.
 * @param {*} request - id
 * @param {*} response - OK or NOK(it does not mean bad in this situation)
 */
const updateSupply = async (request, response) => {
  const supply = request.body;
  const userId = extractToken(request);

  var hasUpdated = await suppliesUpdate.updateSupplies(pool, supply, userId);
  console.log("updateSupply: " + hasUpdated);

  if (hasUpdated) {
    recal.executeRecalculate(pool, userId);
  }

  response.status(200).json({ status: hasUpdated ? "OK" : "NOK" });
};

/**
 * Should delete a supply by his remote id.
 * @param {*} request - id
 * @param {*} response - OK or NOK(it does not mean bad in this situation)
 */
const deleteSupply = async (request, response) => {
  const supplyId = request.body.id;
  const userId = extractToken(request);
  var hasDeleted = await suppliesDelete.queryDeleteSupplyByRemoteId(
    pool,
    supplyId,
    userId
  );
  console.log("deleteSupply: " + hasDeleted);

  if (hasDeleted) {
    recal.executeRecalculate(pool, userId);
  }

  response.status(200).json({ status: hasDeleted ? "OK" : "NOK" });
};

const recalculate = async (request, response) => {
  const userId = extractToken(request);
  var result = await recal.executeRecalculate(pool, userId);
  response.status(200).json({ status: result ? "OK" : "NOK" });
};

const deleteAll = async (request, response) => {
  var userId = request.body.userId;
  const pool = await getDbConnection();
  var result = await deleteAllPro.executeDeleteAll(pool, userId);
  await pool.end();
  response.status(200).json({ status: result ? "OK" : "NOK" });
};

module.exports = {
  getProducts,
  createProduct,
  deleteProduct,
  getProductGetEdit,
  updateProduct,
  updateRecipe,
  deleteRecipe,
  updateSupply,
  deleteSupply,
  recalculate,
  deleteAll,
};
