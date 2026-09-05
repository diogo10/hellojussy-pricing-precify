/**
 * MongoDB recalculation module.
 *
 * Replaces `procedure_recalculate(tax, markup, userId)` with the
 * `MongoRecalculationRepository` aggregation pipeline (see
 * MONGODB_SCHEMA_PROPOSAL.md section 9). Tax/markup are fetched from
 * the external revenue/tax services, then applied to every product of
 * the user in a single repository call.
 */

const utils = require('./db-util');
const revenueTax = require('./revenue-tax-get');

/**
 * Fetch tax and markup percentages for a user.
 * @param {string} userId - User ID (used as bearer token by upstream services)
 * @param {Object} [dependencies] - Injectable fetchers for testing
 * @returns {Promise<{markup:number, tax:number}>}
 */
async function fetchTaxAndMarkup(userId, dependencies = {}) {
  const getMarkup = dependencies.getMarkup ?? revenueTax.getMarkup;
  const getTaxTotal = dependencies.getTaxTotal ?? revenueTax.getTaxTotal;

  const [markup, tax] = await Promise.all([
    getMarkup(userId).catch(() => 0),
    getTaxTotal(userId).catch(() => 0),
  ]);

  return { markup: Number(markup) || 0, tax: Number(tax) || 0 };
}

/**
 * Recalculate all products for a user.
 * @param {Object} recalculationRepository - Mongo recalculation repository
 *   (or legacy pg pool for backward compatibility)
 * @param {string} userId - User ID
 * @param {Object} [dependencies] - Injectable { getMarkup, getTaxTotal } for testing
 * @returns {Promise<boolean>} Whether recalculation succeeded
 */
async function executeRecalculate(recalculationRepository, userId, dependencies = {}) {
  if (!recalculationRepository || !userId) return false;

  try {
    const { markup, tax } = await fetchTaxAndMarkup(userId, dependencies);
    console.log('executeRecalculate: markup: ' + markup);
    console.log('executeRecalculate: tax: ' + tax);

    const result = await utils.recalculate(recalculationRepository, { tax, markup, userId });
    console.log('executeRecalculate: result: ' + result);
    return Boolean(result);
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

module.exports = {
  executeRecalculate,
  fetchTaxAndMarkup,
};
