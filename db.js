const { MongoClient } = require('mongodb');
const { MongoProductRepository } = require('./repositories/mongo/ProductRepository.js');
const { RepositoryFactory } = require('./repositories/RepositoryFactory.js');
const { SupplyService } = require('./services/SupplyService.js');

const productAdd = require("./product-add");
const productDelete = require("./product-delete");
const productUpdate = require("./product-update");
const recipeRecal = require("./recal-recipes");
const recal = require("./recal");

let mongoClient = null;
let productRepository = null;
let supplyService = null;

/**
 * Initialize MongoDB connection and repositories
 * @returns {Promise<{productRepository: MongoProductRepository, supplyService: SupplyService}>}
 */
async function initializeRepositories() {
  if (productRepository && supplyService) {
    return { productRepository, supplyService };
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pricing_precify';
  
  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
  }

  const db = mongoClient.db();
  
  // Initialize RepositoryFactory with MongoDB
  RepositoryFactory.initialize({ type: 'mongodb', mongoDb: db });
  
  productRepository = new MongoProductRepository(db);
  supplyService = SupplyService.createFromFactory();
  
  return { productRepository, supplyService };
}

/**
 * Get product repository (initializes if needed)
 * @returns {Promise<MongoProductRepository>}
 */
async function getProductRepository() {
  const { productRepository: repo } = await initializeRepositories();
  return repo;
}

/**
 * Get supply service (initializes if needed)
 * @returns {Promise<SupplyService>}
 */
async function getSupplyService() {
  const { supplyService: service } = await initializeRepositories();
  return service;
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    productRepository = null;
    supplyService = null;
    RepositoryFactory.getInstance().reset();
  }
}

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
  const repo = await getProductRepository();
  var result = await repo.findById(id, productId);
  response.status(200).json(result);
};

const deleteProduct = async (request, response) => {
  const { id } = request.params;
  const repo = await getProductRepository();
  const deletedProduct = await productDelete.queryDeleteProduct(repo, id);
  console.log("delete product: " + deletedProduct);
  response.send({ status: deletedProduct ? "OK" : "NOK" });
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
    response.status(200).json({ status: "OK", productId: resultProductId });
  } else {
    response.status(200).json({ status: "NOK", message: "internal error" });
  }
};

const updateProduct = async (request, response) => {
  const { id } = request.params;
  const body = request.body;
  const repo = await getProductRepository();
  const result = await productUpdate.queryUpdateProducts(repo, body, id);
  response.send({ status: result ? "OK" : "NOK" });
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

  // Note: This still uses PostgreSQL for recipe recalculation
  // Should be migrated to use MongoDB repository
  response.status(200).json({ status: "NOK", message: "Not yet migrated to MongoDB" });
};

/**
 * Should delete a recipe by his remote id.
 * @param {*} request - id
 * @param {*} response - OK or NOK(it does not mean bad in this situation)
 */
const deleteRecipe = async (request, response) => {
  const recipeId = request.body.id;
  const userId = extractToken(request);
  // Note: This still uses PostgreSQL for recipe deletion
  // Should be migrated to use MongoDB repository
  response.status(200).json({ status: "NOK", message: "Not yet migrated to MongoDB" });
};

// Webhooks - Supply

/**
 * Should update a supply using the actual supply items.
 * @param {*} request - supply body
 * @param {*} response - OK or NOK(it does not mean bad in this situation)
 */
const updateSupply = async (request, response) => {
  const body = request.body;
  const userId = extractToken(request);
  
  try {
    const service = await getSupplyService();
    const updated = await service.updateSupply(body.id ?? body._id, userId, body);
    response.status(200).json({ status: updated ? "OK" : "NOK" });
  } catch (err) {
    console.log("updateSupply error: " + err.stack);
    response.status(500).json({ status: "NOK", message: "Internal error" });
  }
};

/**
 * Should delete a supply by his remote id.
 * @param {*} request - id
 * @param {*} response - OK or NOK(it does not mean bad in this situation)
 */
const deleteSupply = async (request, response) => {
  const supplyId = request.body.id ?? request.body._id;
  const userId = extractToken(request);
  
  try {
    const service = await getSupplyService();
    const deleted = await service.deleteSupply(supplyId, userId);
    response.status(200).json({ status: deleted ? "OK" : "NOK" });
  } catch (err) {
    console.log("deleteSupply error: " + err.stack);
    response.status(500).json({ status: "NOK", message: "Internal error" });
  }
};

const recalculate = async (request, response) => {
  const userId = extractToken(request);
  // Note: This still uses PostgreSQL for recalculation
  // Should be migrated to use MongoDB repository
  response.status(200).json({ status: "NOK", message: "Not yet migrated to MongoDB" });
};

const deleteAll = async (request, response) => {
  var userId = request.body.userId;
  const repo = await getProductRepository();
  const result = await repo.deleteAllByUserId(userId);
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
  closeConnection
};