const { MongoClient } = require('mongodb');
const { MongoProductRepository } = require('./repositories/mongo/ProductRepository.js');

const COLLECTION_PRODUCTS = 'products';

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
 * Get all products for a user
 * @param {string} userId - User ID
 * @param {Object} [options] - Options for testing
 * @param {MongoProductRepository} [options.repository] - Pre-configured repository for testing
 * @returns {Promise<Array>} Array of products
 */
async function queryGetProduct(userId, options = {}) {
  try {
    const repo = await getProductRepository(options);
    const products = await repo.findAllByUserId(userId);
    return products || [];
  } catch (err) {
    console.error('Error fetching products:', err.stack);
    return [];
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
  queryGetProduct,
  closeConnection,
  reset,
  getProductRepository
};