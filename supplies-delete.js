/**
 * MongoDB Supply Delete Module
 * Uses MongoEmbeddedSupplyRepository to delete supplies
 */

async function queryDeleteSuppliesFromProduct(supplyRepository, productId) {
  try {
    const result = await supplyRepository.deleteByProductId(productId);
    console.log("delete supplies from product result: " + result);
    return result;
  } catch (err) {
    console.log("delete supplies from product error: " + err.stack);
    return false;
  }
}

async function queryDeleteSupplyByRemoteId(supplyRepository, supplyId, userId) {
  try {
    const result = await supplyRepository.deleteByRemoteId(supplyId, userId);
    console.log("delete supply by remote id result: " + result);
    return result;
  } catch (err) {
    console.log("delete supply by remote id error: " + err.stack);
    return false;
  }
}

module.exports = {
  queryDeleteSuppliesFromProduct,
  queryDeleteSupplyByRemoteId
};