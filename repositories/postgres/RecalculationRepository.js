import { Pool } from 'pg';
import { IRecalculationRepository } from '../interfaces/index.js';

const RECALCULATE_PROC = 'CALL procedure_recalculate($1, $2, $3)';
const DELETE_ALL_PROC = 'CALL procedure_delete_all($1)';

export class PostgresRecalculationRepository implements IRecalculationRepository {
  constructor(private pool: Pool) {}

  async executeRecalculate(tax: number, markup: number, userId: string): Promise<boolean> {
    const result = await this.pool.query(RECALCULATE_PROC, [tax, markup, userId]);
    return result.rowCount >= 0;
  }

  async deleteAll(userId: string): Promise<boolean> {
    const result = await this.pool.query(DELETE_ALL_PROC, [userId]);
    return result.rowCount >= 0;
  }
}