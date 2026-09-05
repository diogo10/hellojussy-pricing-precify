/**
 * MongoDB recipe recalculation module.
 *
 * Replaces the PostgreSQL delete + re-insert cycle with embedded-document
 * updates on the `products` collection (see MONGODB_SCHEMA_PROPOSAL.md
 * patterns 5-6). When a product repository with `updateRecipeByIdentityId`
 * is provided, a single array-filter update is used per recipe; otherwise
 * it falls back to the legacy delete + add flow for backward compatibility.
 */

const recipeDelete = require('./recipes-delete');
const recipeAdd = require('./recipes-add');

function resolveRecipeId(recipeBody) {
  return recipeBody?.id ?? recipeBody?._id ?? recipeBody?.identity_id;
}

function resolveProductId(element) {
  return element?.product_id ?? element?.productId ?? element?.productIdString ?? null;
}

function resolveRowId(element) {
  return element?.id ?? element?._id ?? element?.identity_id ?? null;
}

/**
 * Map webhook body to embedded-recipe format.
 * @param {Object} recipeBody - Webhook payload
 * @param {*} quantity - Preserved quantity for the product
 * @returns {Object} Repository payload
 */
function mapToEmbeddedRecipe(recipeBody, quantity) {
  return {
    name: recipeBody.name,
    quantity: quantity ?? recipeBody.quantity,
    yieldValue: recipeBody.yieldValue,
    yieldValueUnit: recipeBody.yieldValueUnit,
    myprice: recipeBody.myprice ?? recipeBody.myPrice ?? 0,
    myprof: recipeBody.myprof ?? recipeBody.myProf ?? 0,
    profit: recipeBody.profit ?? 0,
    total: recipeBody.total,
    totalWithTax: recipeBody.totalWithTax,
    margemper: recipeBody.margemper ?? recipeBody.profMargemPer ?? '0',
    products: recipeBody.products ?? [],
  };
}

/**
 * Recalculate a single recipe row via legacy delete + add.
 * @param {Object} recipeBody - Webhook payload (not mutated)
 * @param {string} userId - User ID
 * @param {Object} element - Existing recipe row
 * @param {Object} dependencies - Injectable { deleteFn, addFn }
 * @returns {Promise<boolean>}
 */
async function recalSingleRecipeLegacy(recipeBody, userId, element, dependencies) {
  const deleteFn = dependencies.deleteFn ?? recipeDelete.queryDeleteRecipeById;
  const addFn = dependencies.addFn ?? recipeAdd.queryAddRecipes;

  const productId = resolveProductId(element);
  const rowId = resolveRowId(element);
  if (!productId || !rowId) return false;

  const payload = { ...recipeBody, quantity: element.quantity ?? recipeBody.quantity };

  try {
    const hasDeleted = await deleteFn(rowId, userId);
    console.log('recalRecipe: hasDeleted: ' + hasDeleted);
    if (!hasDeleted) return false;
    const hasIncluded = await addFn(productId, [payload]);
    console.log('hasIncluded: ' + hasIncluded);
    return Boolean(hasIncluded);
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

/**
 * Recalculate a recipe across products via embedded update.
 * Single array-filter update covers all products for the user when
 * quantities are uniform (the common MongoDB case where the lookup
 * returns one recipe row without a product reference).
 * @param {Object} productRepository - Repository with updateRecipeByIdentityId
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe identity ID
 * @param {Object} recipeBody - Webhook payload (not mutated)
 * @param {Array} recipeList - Existing recipe rows
 * @returns {Promise<boolean>}
 */
async function recalViaEmbeddedUpdate(productRepository, userId, recipeId, recipeBody, recipeList) {
  const quantities = new Set(recipeList.map((element) => element?.quantity ?? recipeBody?.quantity));
  if (quantities.size > 1 && typeof productRepository.updateWithEmbedded === 'function') {
    return recalPerProduct(productRepository, userId, recipeId, recipeBody, recipeList);
  }

  const quantity = recipeList[0]?.quantity ?? recipeBody?.quantity;
  const payload = mapToEmbeddedRecipe(recipeBody, quantity);
  return Boolean(await productRepository.updateRecipeByIdentityId(userId, recipeId, payload));
}

/**
 * Per-product embedded recalculation for recipes with differing quantities.
 * Loads each product, replaces the matching embedded recipe, and saves.
 * @param {Object} productRepository - Repository with findById/updateWithEmbedded
 * @param {string} userId - User ID
 * @param {string} recipeId - Recipe identity ID
 * @param {Object} recipeBody - Webhook payload (not mutated)
 * @param {Array} recipeList - Existing recipe rows
 * @returns {Promise<boolean>}
 */
async function recalPerProduct(productRepository, userId, recipeId, recipeBody, recipeList) {
  const outcomes = await Promise.all(
    recipeList.map(async (element) => {
      try {
        const productId = resolveProductId(element);
        if (!productId) return false;
        const product = await productRepository.findById(userId, productId);
        if (!product) return false;
        const recipes = (product.recipes ?? []).map((recipe) => {
          const currentId = recipe?._id ?? recipe?.id ?? recipe?.identity_id;
          if (currentId !== recipeId) return recipe;
          return { ...recipe, ...mapToEmbeddedRecipe(recipeBody, element?.quantity ?? recipe.quantity) };
        });
        return Boolean(await productRepository.updateWithEmbedded(productId, { ...product, recipes }));
      } catch (err) {
        console.log(err?.stack ?? err);
        return false;
      }
    })
  );
  return outcomes.every(Boolean);
}

/**
 * Recalculate a recipe for every product that uses it.
 * @param {Object} recipeBody - Webhook payload
 * @param {string} userId - User ID
 * @param {Array} recipeList - Existing recipe rows for the remote ID
 * @param {Object} [options] - Injectable { productRepository, deleteFn, addFn }
 * @returns {Promise<boolean>} True when every row was recalculated
 */
async function recalRecipe(recipeBody, userId, recipeList, options = {}) {
  if (!recipeBody || !userId || !Array.isArray(recipeList)) return false;
  if (recipeList.length === 0) return true;

  const recipeId = resolveRecipeId(recipeBody);
  if (!recipeId) return false;

  const productRepository = options.productRepository ?? null;

  try {
    if (productRepository?.updateRecipeByIdentityId) {
      return await recalViaEmbeddedUpdate(productRepository, userId, recipeId, recipeBody, recipeList);
    }

    const dependencies = { deleteFn: options.deleteFn, addFn: options.addFn };
    const results = await Promise.all(
      recipeList.map((element) => recalSingleRecipeLegacy(recipeBody, userId, element, dependencies))
    );
    return results.every(Boolean);
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

module.exports = {
  recalRecipe,
};
