const { MongoClient } = require('mongodb');
const { MongoProductRepository } = require('./repositories/mongo/ProductRepository.js');

let mongoClient = null;
let productRepository = null;

/**
 * Initialize MongoDB connection and repository
 * @param {Object} [options] - Options for testing
 * @param {MongoProductRepository} [options.repository] - Pre-configured repository for testing
 * @returns {Promise<MongoProductRepository>}
 */
async function getProductRepository(options = {}) {
  if (options.repository) return options.repository;
  if (productRepository) return productRepository;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pricing_precify';
  
  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
  }

  const db = mongoClient.db();
  productRepository = new MongoProductRepository(db);
  return productRepository;
}

/**
 * Get product by ID with embedded supplies and recipes
 * @param {string} userId - User ID
 * @param {string} productId - Product ID
 * @param {Object} [options] - Options for testing
 * @param {MongoProductRepository} [options.repository] - Pre-configured repository for testing
 * @returns {Promise<Object|null>} Product with details or null
 */
async function queryGetProductById(userId, productId, options = {}) {
  try {
    const repo = await getProductRepository(options);
    const product = await repo.findById(userId, productId);
    return product || null;
  } catch (err) {
    console.error('Error fetching product by ID:', err.stack);
    return null;
  }
}

/**
 * Close MongoDB connection (for cleanup)
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    productRepository = null;
  }
}

/**
 * Reset module state (for testing)
 */
function reset() {
  mongoClient = null;
  productRepository = null;
}

module.exports = {
  queryGetProductById,
  closeConnection,
  reset,
  getProductRepository
};