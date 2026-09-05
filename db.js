/**
 * MongoDB API controllers.
 *
 * All handlers use the embedded-document repositories from
 * `repositories/mongo/` (see MONGODB_SCHEMA_PROPOSAL.md). Recalculation
 * runs through `MongoRecalculationRepository.executeRecalculate`, which
 * applies the aggregation pipeline replacing `procedure_recalculate`.
 */

const { MongoClient } = require('mongodb');
const { MongoProductRepository } = require('./repositories/mongo/ProductRepository.js');
const { MongoRecalculationRepository } = require('./repositories/mongo/RecalculationRepository.js');

const productAdd = require('./product-add');
const productDelete = require('./product-delete');
const productUpdate = require('./product-update');
const suppliesUpdate = require('./supplies-update');
const suppliesDelete = require('./supplies-delete');
const recipeGet = require('./recipes-get');
const recipeDelete = require('./recipes-delete');
const recipeRecal = require('./recal-recipes');
const recal = require('./recal');

let mongoClient = null;
let mongoDb = null;
let productRepository = null;
let recalculationRepository = null;

function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/pricing_precify';
}

async function getDb() {
  if (mongoDb) return mongoDb;
  if (!mongoClient) {
    mongoClient = new MongoClient(getMongoUri());
    await mongoClient.connect();
  }
  mongoDb = mongoClient.db();
  return mongoDb;
}

/**
 * Get product repository (initializes connection if needed).
 * @param {Object} [options] - Injectable { repository } for testing
 * @returns {Promise<MongoProductRepository>}
 */
async function getProductRepository(options = {}) {
  if (options.repository) return options.repository;
  if (productRepository) return productRepository;
  const db = await getDb();
  productRepository = new MongoProductRepository(db);
  return productRepository;
}

/**
 * Get recalculation repository (initializes connection if needed).
 * @param {Object} [options] - Injectable { repository } for testing
 * @returns {Promise<MongoRecalculationRepository>}
 */
async function getRecalculationRepository(options = {}) {
  if (options.repository) return options.repository;
  if (recalculationRepository) return recalculationRepository;
  const db = await getDb();
  recalculationRepository = new MongoRecalculationRepository(db);
  return recalculationRepository;
}

/**
 * Trigger recalculation for a user; never throws.
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function triggerRecalculation(userId) {
  if (!userId) return false;
  try {
    const repo = await getRecalculationRepository();
    return await recal.executeRecalculate(repo, userId);
  } catch (err) {
    console.log('triggerRecalculation error: ' + (err?.stack ?? err));
    return false;
  }
}

/**
 * Close MongoDB connection and reset cached repositories.
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
  }
  mongoClient = null;
  mongoDb = null;
  productRepository = null;
  recalculationRepository = null;
}

function reset() {
  mongoClient = null;
  mongoDb = null;
  productRepository = null;
  recalculationRepository = null;
}

function extractToken(req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}

function sendStatus(response, ok) {
  response.status(200).json({ status: ok ? 'OK' : 'NOK' });
}

const getProductGetEdit = async (request, response) => {
  const id = extractToken(request);
  const productId = request.params.id;
  const repo = await getProductRepository();
  var result = await repo.findById(id, productId);
  response.status(200).json(result);
};

const deleteProduct = async (request, response) => {
  const { id } = request.params;
  const repo = await getProductRepository();
  const deletedProduct = await productDelete.queryDeleteProduct(repo, id);
  console.log('delete product: ' + deletedProduct);
  response.send({ status: deletedProduct ? 'OK' : 'NOK' });
};

const getProducts = async (request, response) => {
  const id = extractToken(request);
  const repo = await getProductRepository();
  const list = await repo.findAllByUserId(id);
  response.status(200).json(list || []);
};

const createProduct = async (request, response) => {
  const repo = await getProductRepository();
  const resultProductId = await productAdd.queryAddProduct(repo, request.body);

  if (resultProductId) {
    response.status(200).json({ status: 'OK', productId: resultProductId });
  } else {
    response.status(200).json({ status: 'NOK', message: 'internal error' });
  }
};

const updateProduct = async (request, response) => {
  const { id } = request.params;
  const body = request.body;
  const repo = await getProductRepository();
  const result = await productUpdate.queryUpdateProducts(repo, body, id);
  response.send({ status: result ? 'OK' : 'NOK' });
};

/**
 * Update a recipe via webhook: recalculate matching embedded recipes,
 * then refresh product costs.
 */
const updateRecipe = async (request, response) => {
  const body = request.body;
  const userId = extractToken(request);
  const id = body?.id ?? body?._id;

  if (!id || !userId) {
    response.status(200).json({ status: 'NOK', message: 'missing recipe id or user' });
    return;
  }

  try {
    const list = await recipeGet.queryGetRecipes(id, userId);
    if (!list?.length) {
      response.status(200).json({ status: 'NOK', message: 'no recipe found' });
      return;
    }

    const repo = await getProductRepository();
    const result = await recipeRecal.recalRecipe(body, userId, list, { productRepository: repo });
    if (result) await triggerRecalculation(userId);
    sendStatus(response, result);
  } catch (err) {
    console.log('updateRecipe error: ' + (err?.stack ?? err));
    response.status(500).json({ status: 'NOK', message: 'Internal error' });
  }
};

/**
 * Delete a recipe by remote id, then refresh product costs.
 */
const deleteRecipe = async (request, response) => {
  const recipeId = request.body?.id ?? request.body?._id;
  const userId = extractToken(request);

  if (!recipeId || !userId) {
    response.status(200).json({ status: 'NOK', message: 'missing recipe id or user' });
    return;
  }

  try {
    const hasDeleted = await recipeDelete.queryDeleteRecipeWith(recipeId, userId);
    console.log('deleteRecipe: ' + hasDeleted);
    if (hasDeleted) await triggerRecalculation(userId);
    sendStatus(response, hasDeleted);
  } catch (err) {
    console.log('deleteRecipe error: ' + (err?.stack ?? err));
    response.status(500).json({ status: 'NOK', message: 'Internal error' });
  }
};

/**
 * Update a supply via webhook, then refresh product costs.
 */
const updateSupply = async (request, response) => {
  const body = request.body;
  const userId = extractToken(request);

  if (!body || !userId) {
    response.status(200).json({ status: 'NOK', message: 'missing supply body or user' });
    return;
  }

  try {
    const db = await getDb();
    const updated = await suppliesUpdate.updateSupplies(db, body, userId);
    console.log('updateSupply: ' + updated);
    if (updated) await triggerRecalculation(userId);
    sendStatus(response, updated);
  } catch (err) {
    console.log('updateSupply error: ' + (err?.stack ?? err));
    response.status(500).json({ status: 'NOK', message: 'Internal error' });
  }
};

/**
 * Delete a supply by remote id, then refresh product costs.
 */
const deleteSupply = async (request, response) => {
  const supplyId = request.body?.id ?? request.body?._id;
  const userId = extractToken(request);

  if (!supplyId || !userId) {
    response.status(200).json({ status: 'NOK', message: 'missing supply id or user' });
    return;
  }

  try {
    const db = await getDb();
    const deleted = await suppliesDelete.queryDeleteSupplyByRemoteId(db, supplyId, userId);
    console.log('deleteSupply: ' + deleted);
    if (deleted) await triggerRecalculation(userId);
    sendStatus(response, deleted);
  } catch (err) {
    console.log('deleteSupply error: ' + (err?.stack ?? err));
    response.status(500).json({ status: 'NOK', message: 'Internal error' });
  }
};

const recalculate = async (request, response) => {
  const userId = extractToken(request);

  if (!userId) {
    response.status(200).json({ status: 'NOK', message: 'missing user' });
    return;
  }

  try {
    const result = await triggerRecalculation(userId);
    sendStatus(response, result);
  } catch (err) {
    console.log('recalculate error: ' + (err?.stack ?? err));
    response.status(500).json({ status: 'NOK', message: 'Internal error' });
  }
};

const deleteAll = async (request, response) => {
  var userId = request.body.userId;
  const repo = await getProductRepository();
  const result = await repo.deleteAllByUserId(userId);
  response.status(200).json({ status: result ? 'OK' : 'NOK' });
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
  closeConnection,
  getDb,
  getProductRepository,
  getRecalculationRepository,
  reset,
};
