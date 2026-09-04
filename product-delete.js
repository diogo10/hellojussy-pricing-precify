/**
 * MongoDB Product Delete Module
 * Uses MongoProductRepository to delete product (cascades to embedded supplies and recipes)
 */

async function queryDeleteProduct(productRepository, productId) {
  try {
    const result = await productRepository.delete(productId);
    console.log("productDelete: Deleted product " + productId + " - " + (result ? "OK" : "NOK"));
    return result;
  } catch (err) {
    console.log("productDelete error: " + err.stack);
    return false;
  }
}

module.exports = {
  queryDeleteProduct
};