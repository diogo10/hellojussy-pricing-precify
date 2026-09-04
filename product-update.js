/**
 * MongoDB Product Update Module
 * Uses MongoProductRepository to update product with embedded supplies and recipes atomically
 */

async function queryUpdateProducts(productRepository, body, productId) {
  const { name, userId, prof, price, cost, costWithTax,
    costWithMarkup, costWithMarkupTax, totalFichas, totalExtras, supplies, recipes } = body;

  const data = {
    name,
    userId,
    prof,
    price,
    cost,
    costWithTax,
    costWithMarkup,
    costWithMarkupTax,
    totalFichas,
    totalExtras,
    supplies: supplies ?? [],
    recipes: recipes ?? []
  };

  try {
    const result = await productRepository.updateWithEmbedded(productId, data);
    console.log("productUpdate: Updated product " + productId + " - " + (result ? "OK" : "NOK"));
    return result;
  } catch (err) {
    console.log("productUpdate error: " + err.stack);
    return false;
  }
}

module.exports = {
  queryUpdateProducts
};