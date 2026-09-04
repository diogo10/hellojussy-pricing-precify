const { MongoClient } = require('mongodb');
const { MongoEmbeddedRecipeRepository } = require('./repositories/mongo/RecipeRepository.js');

let mongoClient = null;
let recipeRepository = null;

/**
 * Initialize MongoDB connection and recipe repository
 * @returns {Promise<MongoEmbeddedRecipeRepository>}
 */
async function getRecipeRepository() {
  if (recipeRepository) return recipeRepository;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pricing_precify';

  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
  }

  const db = mongoClient.db();
  recipeRepository = new MongoEmbeddedRecipeRepository(db);
  return recipeRepository;
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
async function closeConnection() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    recipeRepository = null;
  }
}

/**
 * Delete all recipes for a product
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Whether recipes were deleted
 */
async function queryDeleteRecipesFromProduct(productId) {
  const repo = await getRecipeRepository();
  return repo.deleteByProductId(productId);
}

/**
 * Delete recipe by remote ID and user ID
 * @param {string} recipeId - Recipe identity ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether recipe was deleted
 */
async function queryDeleteRecipeWith(recipeId, userId) {
  const repo = await getRecipeRepository();
  return repo.deleteByRemoteId(recipeId, userId);
}

/**
 * Delete recipe by ID and user ID
 * @param {string} id - Recipe ID (MongoDB ObjectId or identity_id)
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether recipe was deleted
 */
async function queryDeleteRecipeById(id, userId) {
  const repo = await getRecipeRepository();
  return repo.deleteById(id, userId);
}

module.exports = {
  queryDeleteRecipesFromProduct,
  queryDeleteRecipeWith,
  queryDeleteRecipeById,
  getRecipeRepository,
  closeConnection
};