import { Pool } from 'pg';
import { IRecipeRepository, Recipe, CreateRecipeDTO, CreateRecipeProductDTO } from '../interfaces/index.js';

const SELECT_RECIPES_BY_REMOTE_ID = `SELECT * FROM products_recipes pr
  WHERE pr.recipe_identity_id = $1
  AND product_id IN (SELECT id FROM products WHERE userid = $2)`;
const SELECT_RECIPE_PRODUCTS = 'SELECT id, recipes_products_identity_id as _id, recipe_product_name as name, value, status, qt, qtvalue, unit FROM products_recipes_products WHERE products_recipes_id = $1';
const INSERT_RECIPE = `INSERT INTO products_recipes
  (recipe_name, total, totalwithtax, yieldvalue, yieldvalueunit, product_id, recipe_identity_id, quantity)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
const INSERT_RECIPE_PRODUCT = `INSERT INTO products_recipes_products
  (recipe_product_name, value, status, qt, qtvalue, unit, products_recipes_id, recipes_products_identity_id)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`;
const DELETE_RECIPES_BY_PRODUCT = 'DELETE FROM products_recipes WHERE product_id = $1';
const DELETE_RECIPE_BY_REMOTE_ID = `DELETE FROM products_recipes
  WHERE recipe_identity_id = $1
  AND product_id IN (SELECT id FROM products WHERE userid = $2)`;
const DELETE_RECIPE_BY_ID = `DELETE FROM products_recipes
  WHERE id = $1
  AND product_id IN (SELECT id FROM products WHERE userid = $2)`;

export class PostgresRecipeRepository implements IRecipeRepository {
  constructor(private pool: Pool) {}

  async findByRemoteId(recipeId: string, userId: string): Promise<Recipe[]> {
    const recipesResult = await this.pool.query(SELECT_RECIPES_BY_REMOTE_ID, [recipeId, userId]);
    
    const recipesWithProducts = await Promise.all(
      recipesResult.rows.map(async (recipe) => {
        const productsResult = await this.pool.query(SELECT_RECIPE_PRODUCTS, [recipe.id]);
        return {
          ...recipe,
          _id: recipe.recipe_identity_id,
          products: productsResult.rows
        };
      })
    );

    return recipesWithProducts;
  }

  async create(productId: string, recipes: CreateRecipeDTO[]): Promise<boolean> {
    for (const recipe of recipes) {
      const recipeValues = [
        recipe.name, recipe.total, recipe.totalWithTax,
        recipe.yieldValue, recipe.yieldValueUnit, productId, recipe.id, recipe.quantity
      ];
      const recipeResult = await this.pool.query(INSERT_RECIPE, recipeValues);
      const recipeDbId = recipeResult.rows[0].id;

      if (recipe.products && recipe.products.length > 0) {
        for (const product of recipe.products) {
          const productValues = [
            product.name, product.value, product.status,
            product.qt, product.qtValue, product.unit,
            recipeDbId, product.id
          ];
          await this.pool.query(INSERT_RECIPE_PRODUCT, productValues);
        }
      }
    }
    return true;
  }

  async deleteByProductId(productId: string): Promise<boolean> {
    const result = await this.pool.query(DELETE_RECIPES_BY_PRODUCT, [productId]);
    return result.rowCount >= 0;
  }

  async deleteByRemoteId(recipeId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(DELETE_RECIPE_BY_REMOTE_ID, [recipeId, userId]);
    return result.rowCount > 0;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(DELETE_RECIPE_BY_ID, [id, userId]);
    return result.rowCount > 0;
  }
}