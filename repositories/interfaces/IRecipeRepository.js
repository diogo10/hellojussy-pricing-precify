/**
 * @typedef {Object} Recipe
 * @property {string} id
 * @property {string} _id
 * @property {string} name
 * @property {number} quantity
 * @property {number} total
 * @property {number} totalWithTax
 * @property {number} yieldValue
 * @property {number} yieldValueUnit
 * @property {Array} products
 */

/**
 * @typedef {Object} RecipeProduct
 * @property {string} id
 * @property {string} _id
 * @property {string} name
 * @property {number} value
 * @property {string} status
 * @property {number} qt
 * @property {number} qtValue
 * @property {string} unit
 */

/**
 * @typedef {Object} CreateRecipeDTO
 * @property {string} id
 * @property {string} name
 * @property {number} total
 * @property {number} totalWithTax
 * @property {number} yieldValue
 * @property {number} yieldValueUnit
 * @property {number} quantity
 * @property {Array} products
 */

/**
 * @typedef {Object} CreateRecipeProductDTO
 * @property {string} id
 * @property {string} name
 * @property {number} value
 * @property {string} status
 * @property {number} qt
 * @property {number} qtValue
 * @property {string} unit
 */

module.exports = {};
