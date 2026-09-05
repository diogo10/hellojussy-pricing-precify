/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} product_name
 * @property {string} userid
 * @property {string} profit_percentage
 * @property {number} price
 * @property {number} product_cost
 * @property {number} product_cost_with_tax
 * @property {number} product_cost_with_markup
 * @property {number} product_cost_with_markup_tax
 * @property {number} total_fichas
 * @property {number} total_extras
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * @typedef {Object} ProductWithDetails
 * @property {string} id
 * @property {string} product_name
 * @property {string} userid
 * @property {string} profit_percentage
 * @property {number} price
 * @property {number} product_cost
 * @property {number} product_cost_with_tax
 * @property {number} product_cost_with_markup
 * @property {number} product_cost_with_markup_tax
 * @property {number} total_fichas
 * @property {number} total_extras
 * @property {Date} created_at
 * @property {Date} updated_at
 * @property {Array} supplies
 * @property {Array} recipes
 */

/**
 * @typedef {Object} CreateProductDTO
 * @property {string} name
 * @property {string} userId
 * @property {string} prof
 * @property {number} price
 * @property {number} cost
 * @property {number} costWithTax
 * @property {number} costWithMarkup
 * @property {number} costWithMarkupTax
 * @property {number} totalFichas
 * @property {number} totalExtras
 */

/**
 * @typedef {Object} UpdateProductDTO
 * @property {string} name
 * @property {string} userId
 * @property {string} prof
 * @property {number} price
 * @property {number} cost
 * @property {number} costWithTax
 * @property {number} costWithMarkup
 * @property {number} costWithMarkupTax
 * @property {number} totalFichas
 * @property {number} totalExtras
 */

module.exports = {};
