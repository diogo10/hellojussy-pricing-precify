/**
 * MongoDB Supplies Add Module
 * Uses MongoEmbeddedSupplyRepository to create supplies for a product
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
 * Add supplies to a product
 * @param {Object} db - MongoDB database instance
 * @param {string} productId - Product ID
 * @param {Array} list - Array of supply objects
 * @returns {Promise<boolean>} Whether all supplies were created
 */
async function queryAddSupplies(db, productId, list) {
  if (!supplyRepository) {
    initializeSupplyRepository(db);
  }

  const supplies = list.map(element => ({
    id: element.id ?? element._id,
    name: element.name,
    value: element.value,
    qt: element.qt,
    qtValue: element.qtValue ?? element.qtvalue,
    unit: element.unit
  }));

  try {
    const result = await supplyRepository.create(productId, supplies);
    console.log("addSupplies: Created supplies for product " + productId + " - " + (result ? "OK" : "NOK"));
    return result;
  } catch (err) {
    console.log("addSupplies error: " + err.stack);
    return false;
  }
}

module.exports = {
  queryAddSupplies,
  initializeSupplyRepository
};