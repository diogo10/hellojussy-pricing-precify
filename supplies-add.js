/**
 * MongoDB Supply Add Module
 * Uses MongoEmbeddedSupplyRepository to add supplies to a product
 */

async function queryAddSupplies(supplyRepository, parentId, list) {
  if (!list || list.length === 0) {
    return true;
  }

  const supplies = list.map(element => ({
    id: element.id,
    name: element.name,
    value: element.value,
    qt: element.qt,
    qtValue: element.qtValue,
    unit: element.unit
  }));

  try {
    const result = await supplyRepository.create(parentId, supplies);
    console.log("add supplies result: " + result);
    return result;
  } catch (err) {
    console.log("add supplies error: " + err.stack);
    return false;
  }
}

module.exports = {
  queryAddSupplies
};