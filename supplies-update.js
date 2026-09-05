/**
 * MongoDB Supply Update Module
 * Uses MongoEmbeddedSupplyRepository to update supplies
 */

async function updateSupplies(supplyRepository, supply, userId) {
  const data = mapSupplyBody(supply);

  try {
    const hasUpdated = await supplyRepository.update(supply.id, userId, data);
    return hasUpdated;
  } catch (err) {
    console.log("update supply error: " + err.stack);
    return false;
  }
}

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
    qtValue: supply.qtValue,
    unit: supply.unit
  };
}

module.exports = {
  updateSupplies,
  mapSupplyBody
};