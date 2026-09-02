import { Db, Collection, ObjectId } from 'mongodb';
import { IRecipeRepository, Recipe, CreateRecipeDTO, CreateRecipeProductDTO } from '../interfaces/index.js';

const COLLECTION_RECIPES = 'recipes';
const COLLECTION_RECIPE_PRODUCTS = 'recipe_products';
const COLLECTION_PRODUCTS = 'products';

export class MongoRecipeRepository implements IRecipeRepository {
  constructor(private db: Db) {}

  private get recipes(): Collection {
    return this.db.collection(COLLECTION_RECIPES);
  }

  private get recipeProducts(): Collection {
    return this.db.collection(COLLECTION_RECIPE_PRODUCTS);
  }

  private get products(): Collection {
    return this.db.collection(COLLECTION_PRODUCTS);
  }

  async findByRemoteId(recipeId: string, userId: string): Promise<Recipe[]> {
    const productIds = await this.products.find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const recipes = await this.recipes.find({
      recipe_identity_id: recipeId,
      product_id: { $in: productIdStrings }
    }).toArray() as Promise<Recipe[]>;

    const recipesWithProducts = await Promise.all(
      recipes.map(async (recipe) => {
        const products = await this.recipeProducts.find({ products_recipes_id: recipe._id.toString() }).toArray() as Promise<RecipeProduct[]>;
        return { ...recipe, _id: recipe.recipe_identity_id, products };
      })
    );

    return recipesWithProducts;
  }

  async create(productId: string, recipes: CreateRecipeDTO[]): Promise<boolean> {
    for (const recipe of recipes) {
      const recipeDoc = {
        recipe_name: recipe.name,
        total: recipe.total,
        totalwithtax: recipe.totalWithTax,
        yieldvalue: recipe.yieldValue,
        yieldvalueunit: recipe.yieldValueUnit,
        product_id: productId,
        recipe_identity_id: recipe.id,
        quantity: recipe.quantity
      };
      const recipeResult = await this.recipes.insertOne(recipeDoc);
      const recipeDbId = recipeResult.insertedId.toString();

      if (recipe.products && recipe.products.length > 0) {
        const productDocs = recipe.products.map(product => ({
          recipe_product_name: product.name,
          value: product.value,
          status: product.status,
          qt: product.qt,
          qtValue: product.qtValue,
          unit: product.unit,
          products_recipes_id: recipeDbId,
          recipes_products_identity_id: product.id
        }));
        await this.recipeProducts.insertMany(productDocs);
      }
    }
    return true;
  }

  async deleteByProductId(productId: string): Promise<boolean> {
    const recipes = await this.recipes.find({ product_id: productId }).project({ _id: 1 }).toArray();
    const recipeIds = recipes.map(r => r._id.toString());

    await this.recipeProducts.deleteMany({ products_recipes_id: { $in: recipeIds } });
    const result = await this.recipes.deleteMany({ product_id: productId });
    return result.deletedCount >= 0;
  }

  async deleteByRemoteId(recipeId: string, userId: string): Promise<boolean> {
    const productIds = await this.products.find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const recipes = await this.recipes.find({
      recipe_identity_id: recipeId,
      product_id: { $in: productIdStrings }
    }).project({ _id: 1 }).toArray();
    const recipeIds = recipes.map(r => r._id.toString());

    await this.recipeProducts.deleteMany({ products_recipes_id: { $in: recipeIds } });
    const result = await this.recipes.deleteMany({
      recipe_identity_id: recipeId,
      product_id: { $in: productIdStrings }
    });
    return result.deletedCount > 0;
  }

  async deleteById(id: string, userId: string): Promise<boolean> {
    const productIds = await this.products.find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const recipe = await this.recipes.findOne({
      _id: new ObjectId(id),
      product_id: { $in: productIdStrings }
    });
    if (!recipe) return false;

    await this.recipeProducts.deleteMany({ products_recipes_id: recipe._id.toString() });
    const result = await this.recipes.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
}