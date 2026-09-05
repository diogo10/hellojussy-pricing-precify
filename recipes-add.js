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
 * Add recipes to a product (replaces existing recipes)
 * @param {string} productId - Product ID
 * @param {Array} list - Array of recipe data
 * @returns {Promise<boolean>} Whether recipes were added
 */
async function queryAddRecipes(productId, list) {
  console.log("queryAddRecipes: " + productId);

  try {
    const repo = await getRecipeRepository();
    const result = await repo.create(productId, list);
    console.log("queryAddRecipes: " + result);
    return result;
  } catch (err) {
    console.log(err.stack);
    return false;
  }
}

module.exports = {
  queryAddRecipes,
  getRecipeRepository,
  closeConnection
};