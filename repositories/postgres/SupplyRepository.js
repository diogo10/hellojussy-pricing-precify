import { Pool } from 'pg';
import { ISupplyRepository, Supply, CreateSupplyDTO, UpdateSupplyDTO } from '../interfaces/index.js';

const SELECT_SUPPLIES = 'SELECT id, supply_identity_id as _id, supply_name as name, value, qt, qtvalue, unit FROM products_supplies WHERE product_id = $1';
const INSERT_SUPPLY = `INSERT INTO products_supplies
  (supply_name, value, qt, qtvalue, unit, product_id, supply_identity_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`;
const DELETE_SUPPLIES_BY_PRODUCT = 'DELETE FROM products_supplies WHERE product_id = $1';
const DELETE_SUPPLY_BY_REMOTE_ID = `DELETE FROM products_supplies
  WHERE supply_identity_id = $1
  AND product_id IN (SELECT id FROM products WHERE userid = $2)`;
const UPDATE_SUPPLY = `UPDATE products_supplies SET
  supply_name=$1, qt=$2, qtvalue=$3, unit=$4
  WHERE supply_identity_id=$5
  AND product_id IN (SELECT id FROM products WHERE userid = $6)`;

export class PostgresSupplyRepository implements ISupplyRepository {
  constructor(private pool: Pool) {}

  async findByProductId(productId: string): Promise<Supply[]> {
    const result = await this.pool.query(SELECT_SUPPLIES, [productId]);
    return result.rows;
  }

  async create(productId: string, supplies: CreateSupplyDTO[]): Promise<boolean> {
    const promises = supplies.map(supply => {
      const values = [supply.name, supply.value, supply.qt, supply.qtValue, supply.unit, productId, supply.id];
      return this.pool.query(INSERT_SUPPLY, values);
    });

    const results = await Promise.all(promises);
    return results.every(r => r.rowCount > 0);
  }

  async update(supplyId: string, userId: string, data: UpdateSupplyDTO): Promise<boolean> {
    const values = [data.name, data.qt, data.qtValue, data.unit, supplyId, userId];
    const result = await this.pool.query(UPDATE_SUPPLY, values);
    return result.rowCount > 0;
  }

  async deleteByProductId(productId: string): Promise<boolean> {
    const result = await this.pool.query(DELETE_SUPPLIES_BY_PRODUCT, [productId]);
    return result.rowCount >= 0;
  }

  async deleteByRemoteId(supplyId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(DELETE_SUPPLY_BY_REMOTE_ID, [supplyId, userId]);
    return result.rowCount > 0;
  }
}