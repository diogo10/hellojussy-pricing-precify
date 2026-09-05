/**
 * MongoDB database utilities.
 *
 * Replaces the legacy PostgreSQL helpers (`pool.query(...)`,
 * `procedure_recalculate`, `procedure_delete_all`) with repository-based
 * operations backed by `MongoRecalculationRepository` and pure
 * application-level math (see `revenue-tax-get-util.js` and
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

function isPostgresPool(target) {
  return Boolean(target && typeof target.query === 'function');
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
 * Execute an update via repository (or legacy pg pool for backward compat).
 * @param {Object|Function} repositoryOrPool - Repository, pg pool, or async fn
 * @param {*} operationOrSql - Async fn/promise when using repositories, SQL text for legacy pool
 * @param {Array} [values] - SQL values (legacy pool only)
 * @returns {Promise<boolean>}
 */
async function executeUpdateQuery(repositoryOrPool, operationOrSql, values) {
  if (typeof repositoryOrPool === 'function' || operationOrSql instanceof Promise
    || (typeof operationOrSql === 'function')) {
    const operation = typeof operationOrSql === 'function' ? operationOrSql : repositoryOrPool;
    logOperation('executeUpdateQuery', 'repository operation');
    return runRepositoryOperation(operation, 'executeUpdateQuery result');
  }

  if (isPostgresPool(repositoryOrPool)) {
    return executeLegacyQuery(repositoryOrPool, operationOrSql, values, 'executeQuery');
  }

  logOperation('executeUpdateQuery', String(operationOrSql));
  return runRepositoryOperation(operationOrSql, 'executeUpdateQuery result');
}

/**
 * Execute a delete via repository (or legacy pg pool for backward compat).
 * @param {Object|Function} repositoryOrPool - Repository, pg pool, or async fn
 * @param {*} operationOrSql - Async fn/promise when using repositories, SQL text for legacy pool
 * @param {Array} [values] - SQL values (legacy pool only)
 * @returns {Promise<boolean>}
 */
async function executeDeleteQuery(repositoryOrPool, operationOrSql, values) {
  return executeUpdateQuery(repositoryOrPool, operationOrSql, values);
}

async function executeLegacyQuery(pool, sql, values, label) {
  try {
    logOperation(label + ' text', sql);
    const response = await pool.query(sql, values);
    const result = (response?.rowCount ?? 0) > 0;
    logResult(label + ' result', result);
    return result;
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

async function executeLegacyProcedure(pool, procedureName, values) {
  try {
    logOperation('executeProcedure procedureName', procedureName);
    const response = await pool.query(procedureName, values);
    const result = (response?.rowCount ?? 0) >= 0;
    logResult('executeProcedure result', result);
    return result;
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

/**
 * Recalculate all products for a user.
 * Preferred: pass a MongoDB recalculation repository with
 * `executeRecalculate(tax, markup, userId)` (aggregation pipeline per
 * MONGODB_SCHEMA_PROPOSAL.md). Legacy pg pool + [tax, markup, userId]
 * is still accepted for backward compatibility.
 * @param {Object} recalculationRepositoryOrPool - Mongo repo or legacy pg pool
 * @param {Array|Object} valuesOrOptions - Legacy [tax, markup, userId] or { tax, markup, userId }
 * @param {string} [userId] - User ID when values passed separately
 * @returns {Promise<boolean>}
 */
async function recalculate(recalculationRepositoryOrPool, valuesOrOptions, userId) {
  try {
    if (isPostgresPool(recalculationRepositoryOrPool)) {
      return executeLegacyProcedure(
        recalculationRepositoryOrPool,
        'call procedure_recalculate($1,$2,$3);',
        valuesOrOptions
      );
    }

    const options = Array.isArray(valuesOrOptions)
      ? { tax: valuesOrOptions[0], markup: valuesOrOptions[1], userId: valuesOrOptions[2] }
      : (valuesOrOptions ?? {});
    const tax = Number(options.tax ?? 0);
    const markup = Number(options.markup ?? 0);
    const targetUserId = options.userId ?? userId;

    if (!targetUserId) return false;
    if (typeof recalculationRepositoryOrPool?.executeRecalculate !== 'function') return false;

    logOperation('recalculate', 'user ' + targetUserId);
    const result = await recalculationRepositoryOrPool.executeRecalculate(tax, markup, targetUserId);
    logResult('recalculate result', result);
    return Boolean(result);
  } catch (err) {
    console.log(err?.stack ?? err);
    return false;
  }
}

/**
 * Delete all data for a user.
 * Accepts a recalculation repository (`deleteAll(userId)`), a product
 * repository (`deleteAllByUserId(userId)`), or a legacy pg pool.
 * @param {Object} repositoryOrPool - Mongo repository or legacy pg pool
 * @param {string|Array} userIdOrValues - User ID or legacy [userId]
 * @returns {Promise<boolean>}
 */
async function deleteAll(repositoryOrPool, userIdOrValues) {
  try {
    if (isPostgresPool(repositoryOrPool)) {
      return executeLegacyProcedure(repositoryOrPool, 'call procedure_delete_all($1);', userIdOrValues);
    }

    const userId = Array.isArray(userIdOrValues) ? userIdOrValues[0] : userIdOrValues;
    if (!userId) return false;

    if (typeof repositoryOrPool?.deleteAll === 'function') {
      return Boolean(await repositoryOrPool.deleteAll(userId));
    }
    if (typeof repositoryOrPool?.deleteAllByUserId === 'function') {
      return Boolean(await repositoryOrPool.deleteAllByUserId(userId));
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
