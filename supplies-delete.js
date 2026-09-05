/**
 * MongoDB Supplies Delete Module
 * Uses MongoEmbeddedSupplyRepository to delete supplies
 */

const { MongoEmbeddedSupplyRepository } = require('./repositories/mongo/SupplyRepository.js');

let supplyRepository = null;

/**
 * Initialize the supply repository
 * @param {Db} db - MongoDB database instance
 */
function initializeSupplyRepository(db) {
  supplyRepository = new MongoEmbeddedSupplyRepository(db);
}

/**
 * Delete all supplies for a product
 * @param {Object} db - MongoDB database instance
 * @param {string} productId - Product ID
 * @returns {Promise<boolean>} Whether supplies were deleted
 */
async function queryDeleteSuppliesFromProduct(db, productId) {
  if (!supplyRepository) {
    initializeSupplyRepository(db);
  }

  try {
    const result = await supplyRepository.deleteByProductId(productId);
    console.log("deleteSuppliesFromProduct: Deleted supplies for product " + productId + " - " + (result ? "OK" : "NOK"));
    return result;
  } catch (err) {
    console.log("deleteSuppliesFromProduct error: " + err.stack);
    return false;
  }
}

/**
 * Delete a supply by its identity_id and user
 * @param {Object} db - MongoDB database instance
 * @param {string} supplyId - Supply identity ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether supply was deleted
 */
async function queryDeleteSupplyByRemoteId(db, supplyId, userId) {
  if (!supplyRepository) {
    initializeSupplyRepository(db);
  }

  try {
    const result = await supplyRepository.deleteByRemoteId(supplyId, userId);
    console.log("deleteSupplyByRemoteId: Deleted supply " + supplyId + " for user " + userId + " - " + (result ? "OK" : "NOK"));
    return result;
  } catch (err) {
    console.log("deleteSupplyByRemoteId error: " + err.stack);
    return false;
  }
}

module.exports = {
  queryDeleteSuppliesFromProduct,
  queryDeleteSupplyByRemoteId,
  initializeSupplyRepository
};