import { Db, Collection, ObjectId } from 'mongodb';
import { IProductRepository, Product, ProductWithDetails, CreateProductDTO, UpdateProductDTO, Supply, RecipeWithProducts, RecipeProduct } from '../interfaces/index.js';

const COLLECTION_PRODUCTS = 'products';
const COLLECTION_SUPPLIES = 'supplies';
const COLLECTION_RECIPES = 'recipes';
const COLLECTION_RECIPE_PRODUCTS = 'recipe_products';

export class MongoProductRepository implements IProductRepository {
  constructor(private db: Db) {}

  private get products(): Collection {
    return this.db.collection(COLLECTION_PRODUCTS);
  }

  private get supplies(): Collection {
    return this.db.collection(COLLECTION_SUPPLIES);
  }

  private get recipes(): Collection {
    return this.db.collection(COLLECTION_RECIPES);
  }

  private get recipeProducts(): Collection {
    return this.db.collection(COLLECTION_RECIPE_PRODUCTS);
  }

  async findAllByUserId(userId: string): Promise<Product[]> {
    return this.products.find({ userid: userId }).sort({ _id: -1 }).toArray() as Promise<Product[]>;
  }

  async findById(userId: string, productId: string): Promise<ProductWithDetails | null> {
    const product = await this.products.findOne({ _id: new ObjectId(productId), userid: userId });
    if (!product) return null;

    const [supplies, recipes] = await Promise.all([
      this.supplies.find({ product_id: productId }).toArray() as Promise<Supply[]>,
      this.recipes.find({ product_id: productId }).toArray() as Promise<RecipeWithProducts[]>
    ]);

    const recipesWithProducts = await Promise.all(
      recipes.map(async (recipe) => {
        const products = await this.recipeProducts.find({ products_recipes_id: recipe._id.toString() }).toArray() as Promise<RecipeProduct[]>;
        return { ...recipe, products };
      })
    );

    return {
      ...product,
      supplies,
      recipes: recipesWithProducts
    } as ProductWithDetails;
  }

  async create(data: CreateProductDTO): Promise<string> {
    const doc = {
      product_name: data.name,
      userid: data.userId,
      profit_percentage: data.prof,
      price: data.price,
      product_cost: data.cost,
      product_cost_with_tax: data.costWithTax,
      product_cost_with_markup: data.costWithMarkup,
      product_cost_with_markup_tax: data.costWithMarkupTax,
      total_fichas: data.totalFichas,
      total_extras: data.totalExtras,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await this.products.insertOne(doc);
    return result.insertedId.toString();
  }

  async update(productId: string, data: UpdateProductDTO): Promise<boolean> {
    const doc = {
      product_name: data.name,
      userid: data.userId,
      profit_percentage: data.prof,
      price: data.price,
      product_cost: data.cost,
      product_cost_with_tax: data.costWithTax,
      product_cost_with_markup: data.costWithMarkup,
      product_cost_with_markup_tax: data.costWithMarkupTax,
      total_fichas: data.totalFichas,
      total_extras: data.totalExtras,
      updated_at: new Date()
    };
    const result = await this.products.updateOne(
      { _id: new ObjectId(productId) },
      { $set: doc }
    );
    return result.modifiedCount > 0;
  }

  async delete(productId: string): Promise<boolean> {
    const result = await this.products.deleteOne({ _id: new ObjectId(productId) });
    return result.deletedCount > 0;
  }

  async deleteAllByUserId(userId: string): Promise<boolean> {
    const result = await this.products.deleteMany({ userid: userId });
    return result.deletedCount >= 0;
  }
}