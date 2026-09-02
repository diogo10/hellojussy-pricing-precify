import { Db } from 'mongodb';
import { IRecalculationRepository } from '../interfaces/index.js';

export class MongoRecalculationRepository implements IRecalculationRepository {
  constructor(private db: Db) {}

  async executeRecalculate(tax: number, markup: number, userId: string): Promise<boolean> {
    // In MongoDB, we would typically use an aggregation pipeline or update many
    // This is a placeholder implementation - actual logic depends on MongoDB schema
    const products = this.db.collection('products');
    
    // Example: Update all products for user with recalculated values
    // This is a simplified version - real implementation would compute values
    const result = await products.updateMany(
      { userid: userId },
      { 
        $set: { 
          product_cost_with_tax: { $multiply: ['$product_cost', { $divide: [tax, 100] }] },
          product_cost_with_markup: { $multiply: ['$product_cost', { $divide: [markup, 100] }] },
          updated_at: new Date()
        }
      }
    );
    return result.modifiedCount >= 0;
  }

  async deleteAll(userId: string): Promise<boolean> {
    const products = this.db.collection('products');
    const supplies = this.db.collection('supplies');
    const recipes = this.db.collection('recipes');
    const recipeProducts = this.db.collection('recipe_products');

    const productIds = await products.find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    await Promise.all([
      supplies.deleteMany({ product_id: { $in: productIdStrings } }),
      recipeProducts.deleteMany({ product_id: { $in: productIdStrings } }), // assuming we add product_id to recipe_products
      recipes.deleteMany({ product_id: { $in: productIdStrings } }),
      products.deleteMany({ userid: userId })
    ]);

    return true;
  }
}