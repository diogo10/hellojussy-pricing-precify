const SELECT_PRODUCTS_BY_USER = 'SELECT * FROM products WHERE userid = $1 ORDER BY id DESC';
const SELECT_PRODUCT_BY_ID = 'SELECT * FROM products WHERE userid = $1 AND id = $2';
const INSERT_PRODUCT = `INSERT INTO products
  (product_name, userid, profit_percentage, price, product_cost, product_cost_with_tax,
   product_cost_with_markup, product_cost_with_markup_tax, total_fichas, total_extras)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`;
const UPDATE_PRODUCT = `UPDATE products SET
  product_name=$1, userid=$2, profit_percentage=$3, price=$4, product_cost=$5,
  product_cost_with_tax=$6, product_cost_with_markup=$7, product_cost_with_markup_tax=$8,
  total_fichas=$9, total_extras=$10, updated_at=now()
  WHERE id=$11 RETURNING id`;
const DELETE_PRODUCT = 'DELETE FROM products WHERE id = $1 RETURNING id';
const DELETE_ALL_PRODUCTS = 'DELETE FROM products WHERE userid = $1';

const SELECT_SUPPLIES = 'SELECT id, supply_identity_id as _id, supply_name as name, value, qt, qtvalue, unit FROM products_supplies WHERE product_id = $1';
const SELECT_RECIPES = 'SELECT id, recipe_identity_id as _id, recipe_name as name, total, totalwithtax, yieldvalue, yieldvalueunit, quantity FROM products_recipes WHERE product_id = $1';
const SELECT_RECIPE_PRODUCTS = 'SELECT id, recipes_products_identity_id as _id, recipe_product_name as name, value, status, qt, qtvalue, unit FROM products_recipes_products WHERE products_recipes_id = $1';

class PostgresProductRepository {
  /**
   * @param {import('pg').Pool} pool - PostgreSQL connection pool
   */
  constructor(pool) {
    this.pool = pool;
  }

  async findAllByUserId(userId) {
    const result = await this.pool.query(SELECT_PRODUCTS_BY_USER, [userId]);
    return result.rows;
  }

  async findById(userId, productId) {
    const productResult = await this.pool.query(SELECT_PRODUCT_BY_ID, [userId, productId]);
    if (!productResult.rows.length) {
      return null;
    }

    const product = productResult.rows[0];
    const [suppliesResult, recipesResult] = await Promise.all([
      this.pool.query(SELECT_SUPPLIES, [productId]),
      this.pool.query(SELECT_RECIPES, [productId])
    ]);

    const recipesWithProducts = await Promise.all(
      recipesResult.rows.map(async (recipe) => {
        const productsResult = await this.pool.query(SELECT_RECIPE_PRODUCTS, [recipe.id]);
        return {
          ...recipe,
          products: productsResult.rows
        };
      })
    );

    return {
      ...product,
      supplies: suppliesResult.rows,
      recipes: recipesWithProducts
    };
  }

  async create(data) {
    const values = [
      data.name, data.userId, data.prof, data.price, data.cost,
      data.costWithTax, data.costWithMarkup, data.costWithMarkupTax,
      data.totalFichas, data.totalExtras
    ];
    const result = await this.pool.query(INSERT_PRODUCT, values);
    return result.rows[0].id;
  }

  async update(productId, data) {
    const values = [
      data.name, data.userId, data.prof, data.price, data.cost,
      data.costWithTax, data.costWithMarkup, data.costWithMarkupTax,
      data.totalFichas, data.totalExtras, productId
    ];
    const result = await this.pool.query(UPDATE_PRODUCT, values);
    return result.rowCount > 0;
  }

  async delete(productId) {
    const result = await this.pool.query(DELETE_PRODUCT, [productId]);
    return result.rowCount > 0;
  }

  async deleteAllByUserId(userId) {
    const result = await this.pool.query(DELETE_ALL_PRODUCTS, [userId]);
    return result.rowCount >= 0;
  }
}

module.exports = {
  PostgresProductRepository
};
