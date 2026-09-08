/**
 * MongoDB Product Delete Module
 * Uses MongoProductRepository to delete product (cascades to embedded supplies and recipes)
 */

async function queryDeleteProduct(productRepository, productId) {
  if (!productId) {
    console.log("productDelete: missing product id - NOK");
    return false;
  }
  try {
    const result = await productRepository.delete(productId);
    if (result) {
      console.log("productDelete: Deleted product " + productId + " - OK");
      return true;
    }
    console.log("productDelete: product " + productId + " not found or invalid id - NOK");
    return false;
  } catch (err) {
    console.log("productDelete error for " + productId + ": " + (err?.stack ?? err));
    return false;
  }
}

module.exports = {
  queryDeleteProduct
};