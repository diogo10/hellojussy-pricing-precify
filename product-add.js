/**
 * MongoDB Product Add Module
 * Uses MongoProductRepository to create product with embedded supplies and recipes atomically
 */

async function queryAddProduct(productRepository, body) {
  const { name, userId, prof, price, cost, costWithTax, totalFichas,
    totalExtras, costWithMarkup, costWithMarkupTax, supplies, recipes } = body;

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
    const productId = await productRepository.create(data);
    console.log("productAdd: Created product with ID: " + productId);
    return productId;
  } catch (err) {
    console.log("productAdd error: " + err.stack);
    return null;
  }
}

module.exports = {
  queryAddProduct
};