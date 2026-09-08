/**
 * MongoDB database utilities.
 *
 * Repository-based operations backed by `MongoRecalculationRepository`
 * and pure application-level math (see `revenue-tax-get-util.js` and
 * MONGODB_SCHEMA_PROPOSAL.md section 9).
 */

const calc = require('./revenue-tax-get-util');

function logOperation(label, detail) {
  console.log('---------------------');
  console.log('\u001b[1;34m ' + label + ': ' + detail);
  console.log('');
}

function logResult(label, result) {
  console.log('\u001b[1;34m ' + label + ': ' + result);
  console.log('');
  console.log('---------------------');
}

/**
 * Run an async repository operation with logging.
 * @param {Function|Promise} operation - Async function or promise resolving to truthy/falsy
 * @param {string} label - Log label
 * @returns {Promise<boolean>} Whether the operation succeeded
 */
async function runRepositoryOperation(operation, label) {
  try {
    const result = typeof operation === 'function' ? await operation() : await operation;
    logResult(label, Boolean(result));
    return Boolean(result);
  } catch (err) {
    console.log(err && err.stack ? err.stack : err);
    return false;
  }
}

/**
 * Execute an update via repository operation.
 * @param {Function|Promise} operation - Async function or promise
 * @returns {Promise<boolean>}
 */
async function executeUpdateQuery(operation) {
  logOperation('executeUpdateQuery', 'repository operation');
  return runRepositoryOperation(operation, 'executeUpdateQuery result');
}

/**
 * Execute a delete via repository operation.
 * @param {Function|Promise} operation - Async function or promise
 * @returns {Promise<boolean>}
 */
async function executeDeleteQuery(operation) {
  return executeUpdateQuery(operation);
}

/**
 * Recalculate all products for a user.
 * @param {Object} recalculationRepository - MongoDB recalculation repository
 *   with `executeRecalculate(tax, markup, userId)` (aggregation pipeline per
 *   MONGODB_SCHEMA_PROPOSAL.md).
 * @param {Object|Array} valuesOrOptions - { tax, markup, userId } or legacy [tax, markup, userId]
 * @param {string} [userId] - User ID when values passed separately
 * @returns {Promise<boolean>}
 */
async function recalculate(recalculationRepository, valuesOrOptions, userId) {
  try {
    const options = Array.isArray(valuesOrOptions)
      ? { tax: valuesOrOptions[0], markup: valuesOrOptions[1], userId: valuesOrOptions[2] }
      : (valuesOrOptions ?? {});
    const tax = Number(options.tax ?? 0);
    const markup = Number(options.markup ?? 0);
    const targetUserId = options.userId ?? userId;

    if (!targetUserId) return false;
    if (typeof recalculationRepository?.executeRecalculate !== 'function') return false;

    logOperation('recalculate', 'user ' + targetUserId);
    const result = await recalculationRepository.executeRecalculate(tax, markup, targetUserId);
    logResult('recalculate result', result);
    return Boolean(result);
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

/**
 * Delete all data for a user.
 * Accepts a recalculation repository (`deleteAll(userId)`) or a product
 * repository (`deleteAllByUserId(userId)`).
 * @param {Object} repository - Mongo repository
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
async function deleteAll(repository, userId) {
  try {
    if (!userId || typeof userId !== 'string') return false;

    if (typeof repository?.deleteAll === 'function') {
      return Boolean(await repository.deleteAll(userId));
    }
    if (typeof repository?.deleteAllByUserId === 'function') {
      return Boolean(await repository.deleteAllByUserId(userId));
    }
    return false;
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

module.exports = {
  executeUpdateQuery,
  executeDeleteQuery,
  recalculate,
  deleteAll,
  calculateSupplyCost: calc.calculateSupplyCost,
  calculateSuppliesTotal: calc.calculateSuppliesTotal,
  calculateRecipeCost: calc.calculateRecipeCost,
  calculateRecipesTotal: calc.calculateRecipesTotal,
  calculateProductCosts: calc.calculateProductCosts,
};
