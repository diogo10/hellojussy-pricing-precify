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
 * Get recipes by remote ID and user ID
 * @param {string} recipeId - Recipe identity ID
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of recipes with products
 */
async function queryGetRecipes(recipeId, userId) {
  const repo = await getRecipeRepository();
  return repo.findByRemoteId(recipeId, userId);
}

module.exports = {
  queryGetRecipes,
  getRecipeRepository,
  closeConnection
};