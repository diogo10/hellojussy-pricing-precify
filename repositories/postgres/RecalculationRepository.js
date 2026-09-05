const RECALCULATE_PROC = 'CALL procedure_recalculate($1, $2, $3)';
const DELETE_ALL_PROC = 'CALL procedure_delete_all($1)';

class PostgresRecalculationRepository {
  /**
   * @param {import('pg').Pool} pool - PostgreSQL connection pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  async executeRecalculate(tax, markup, userId) {
    const result = await this.pool.query(RECALCULATE_PROC, [tax, markup, userId]);
    return result.rowCount >= 0;
  }

  async deleteAll(userId) {
    const result = await this.pool.query(DELETE_ALL_PROC, [userId]);
    return result.rowCount >= 0;
  }
}

module.exports = {
  PostgresRecalculationRepository
};
