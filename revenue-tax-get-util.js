/**
 * Revenue/Tax calculation utilities.
 *
 * Pure functions that re-implement the logic previously handled by
 * PostgreSQL stored functions:
 * - `function_total_supplies.sql` -> calculateSupplyCost / calculateSuppliesTotal
 * - `function_total_recipes.sql`  -> calculateRecipeCost / calculateRecipesTotal
 * - `procedure_recal.sql`         -> calculateProductCosts
 *
 * All functions are side-effect free and safe to use in MongoDB
 * aggregation pipelines or application-level recalculation.
 */

const KG_DIVISOR = 1000;

/**
 * Convert any value to a safe finite number.
 * @param {*} value - Value to convert
 * @param {number} [fallback=0] - Fallback when value is not numeric
 * @returns {number} Safe number
 */
function toSafeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Round to 2 decimal places (matches SQL ROUND(..., 2)).
 * @param {*} value - Value to round
 * @returns {number} Rounded value
 */
function round2(value) {
  const num = toSafeNumber(value);
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Markup percentage: (expenses / revenue) * 100.
 * Kept backward compatible with existing callers/tests.
 * @param {*} expenses - Total expenses
 * @param {*} revenue - Total revenue
 * @returns {number} Markup percentage (0 on invalid input)
 */
function calculateMarkup(expenses, revenue) {
  try {
    var newExpense = 0.0;
    if (!isNaN(expenses)) {
      newExpense = Number(expenses);
    }

    if (isNaN(revenue)) {
      return 0;
    }

    var result = Number((newExpense / revenue) * 100);
    if (isNaN(result)) {
      return 0;
    } else {
      return result;
    }
  } catch (error) {
    return 0;
  }
}

/**
 * Cost of a single supply row.
 * Re-implements `function_total_supplies.sql` per-row logic:
 *   (value * qtvalue) / qt, divided by 1000 when unit is KG.
 * @param {*} value - Price per package
 * @param {*} qt - Quantity in package
 * @param {*} qtvalue - Quantity used
 * @param {string} unit - Unit (KG, G, L, ML, UNID)
 * @returns {number} Row cost (0 on invalid input)
 */
function calculateSupplyCost(value, qt, qtvalue, unit) {
  const price = toSafeNumber(value);
  const packQty = toSafeNumber(qt);
  const usedQty = toSafeNumber(qtvalue);
  if (packQty <= 0) return 0;
  const baseCost = (price * usedQty) / packQty;
  if (!Number.isFinite(baseCost)) return 0;
  return unit === 'KG' ? baseCost / KG_DIVISOR : baseCost;
}

/**
 * Total cost of all supplies (replaces `total_supply(productId)`).
 * @param {Array} [supplies=[]] - Supply rows
 * @returns {number} Rounded total
 */
function calculateSuppliesTotal(supplies = []) {
  if (!Array.isArray(supplies) || supplies.length === 0) return 0;
  const total = supplies.reduce((sum, supply) => {
    if (!supply) return sum;
    return (
      sum +
      calculateSupplyCost(supply.value, supply.qt, supply.qtValue ?? supply.qtvalue, supply.unit)
    );
  }, 0);
  return round2(total);
}

/**
 * Cost contribution of a single recipe row.
 * Re-implements `function_total_recipes.sql` per-row logic:
 *   (total * quantity) / yieldvalue
 * @param {*} total - Recipe total cost
 * @param {*} quantity - Times the recipe is used
 * @param {*} yieldvalue - Recipe yield amount
 * @returns {number} Row cost (0 on invalid input)
 */
function calculateRecipeCost(total, quantity, yieldvalue) {
  const recipeTotal = toSafeNumber(total);
  const qty = toSafeNumber(quantity);
  const yieldValue = toSafeNumber(yieldvalue);
  if (yieldValue <= 0) return 0;
  const cost = (recipeTotal * qty) / yieldValue;
  return Number.isFinite(cost) ? cost : 0;
}

/**
 * Total cost of all recipes (replaces `total_recipes(productId)`).
 * @param {Array} [recipes=[]] - Recipe rows
 * @returns {number} Rounded total
 */
function calculateRecipesTotal(recipes = []) {
  if (!Array.isArray(recipes) || recipes.length === 0) return 0;
  const total = recipes.reduce((sum, recipe) => {
    if (!recipe) return sum;
    return sum + calculateRecipeCost(recipe.total, recipe.quantity, recipe.yieldvalue ?? recipe.yieldValue);
  }, 0);
  return round2(total);
}

/**
 * Apply a percentage on top of a base value: base + (base * pct / 100).
 * @param {*} base - Base value
 * @param {*} percentage - Percentage to apply
 * @returns {number} Result
 */
function applyPercentage(base, percentage) {
  const baseNum = toSafeNumber(base);
  const pctNum = toSafeNumber(percentage);
  return baseNum + (baseNum * pctNum) / 100;
}

/**
 * Product cost breakdown.
 * Re-implements the core math of `procedure_recalculate`:
 *   productCost = totalSupplies + totalRecipes
 *   withTax = productCost + productCost * tax / 100
 *   withMarkup = productCost + productCost * markup / 100
 *   withMarkupTax = withMarkup + withMarkup * tax / 100
 * @param {*} totalSupplies - Aggregated supplies total
 * @param {*} totalRecipes - Aggregated recipes total
 * @param {*} tax - Tax percentage
 * @param {*} markup - Markup percentage
 * @returns {Object} Rounded cost breakdown
 */
function calculateProductCosts(totalSupplies, totalRecipes, tax, markup) {
  const supplies = round2(totalSupplies);
  const recipes = round2(totalRecipes);
  const productCost = round2(supplies + recipes);
  const productCostWithTax = round2(applyPercentage(productCost, tax));
  const productCostWithMarkup = round2(applyPercentage(productCost, markup));
  const productCostWithMarkupTax = round2(applyPercentage(productCostWithMarkup, tax));
  return {
    totalSupplies: supplies,
    totalRecipes: recipes,
    productCost,
    productCostWithTax,
    productCostWithMarkup,
    productCostWithMarkupTax,
  };
}

module.exports = {
  calculateMarkup,
  toSafeNumber,
  round2,
  calculateSupplyCost,
  calculateSuppliesTotal,
  calculateRecipeCost,
  calculateRecipesTotal,
  applyPercentage,
  calculateProductCosts,
};
