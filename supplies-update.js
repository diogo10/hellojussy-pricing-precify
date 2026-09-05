/**
 * MongoDB Supplies Update Module
 * Uses MongoEmbeddedSupplyRepository to update a supply by identity_id
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
 * Update a supply by its identity_id
 * @param {Object} db - MongoDB database instance
 * @param {Object} supply - Supply data to update
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether supply was updated
 */
async function updateSupplies(db, supply, userId) {
  if (!supplyRepository) {
    initializeSupplyRepository(db);
  }

  const supplyId = supply.id ?? supply._id;
  const data = {
    name: supply.name,
    qt: supply.qt,
    qtValue: supply.qtValue ?? supply.qtvalue,
    unit: supply.unit
  };

  try {
    const result = await supplyRepository.update(supplyId, userId, data);
    console.log("updateSupplies: Updated supply " + supplyId + " for user " + userId + " - " + (result ? "OK" : "NOK"));
    return result;
  } catch (err) {
    console.log("updateSupplies error: " + err.stack);
    return false;
  }
}

/**
 * Map supply body to object format
 * @param {Object} supply - Supply data
 * @returns {Object} Mapped values object
 */
function mapSupplyBody(supply) {
  var id = supply.id;

  if (id === undefined) {
    id = supply._id;
  }

  if (id === undefined) {
    id = "";
  }

  return {
    name: supply.name,
    qt: supply.qt,
    qtValue: supply.qtValue ?? supply.qtvalue,
    unit: supply.unit
  };
}

module.exports = {
  updateSupplies,
  initializeSupplyRepository,
  mapSupplyBody
};