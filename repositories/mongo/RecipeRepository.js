const { Db, Collection, ObjectId } = require('mongodb');
const { BaseRepository, PaginatedRepository } = require('./BaseRepository.js');

const COLLECTION_RECIPES = 'recipes';
const COLLECTION_RECIPE_PRODUCTS = 'recipe_products';
const COLLECTION_PRODUCTS = 'products';

/**
 * MongoDB Recipe Repository implementing IRecipeRepository interface
 * Extends BaseRepository for common CRUD operations
 */
class MongoRecipeRepository extends BaseRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
    this.collectionName = COLLECTION_RECIPES;
  }

  /**
   * Find recipes by identity ID and user
   * @param {string} recipeId - Recipe identity ID
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async findByRemoteId(recipeId, userId) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS).find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const recipes = await this.findAll({
      recipe_identity_id: recipeId,
      product_id: { $in: productIdStrings }
    });

    const recipesWithProducts = await Promise.all(
      recipes.map(async (recipe) => {
        const products = await this.db.collection(COLLECTION_RECIPE_PRODUCTS).find({
          products_recipes_id: recipe._id.toString()
        }).toArray();
        return { ...this.mapToRecipe(recipe), products: products.map(this.mapToRecipeProduct) };
      })
    );

    return recipesWithProducts;
  }

  /**
   * Create recipes for a product
   * @param {string} productId - Product ID
   * @param {Array} recipes - Array of recipe data
   * @returns {Promise<boolean>} Whether all recipes were created
   */
  async create(productId, recipes) {
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

      const recipeResult = await this.create(recipeDoc);
      const recipeDbId = recipeResult;

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
        await this.db.collection(COLLECTION_RECIPE_PRODUCTS).insertMany(productDocs);
      }
    }
    return true;
  }

  /**
   * Delete all recipes for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>}
   */
  async deleteByProductId(productId) {
    const recipes = await this.findAll({ product_id: productId }, { projection: { _id: 1 } });
    const recipeIds = recipes.map(r => r._id.toString());

    await this.db.collection(COLLECTION_RECIPE_PRODUCTS).deleteMany({ products_recipes_id: { $in: recipeIds } });
    const count = await this.deleteMany({ product_id: productId });
    return count >= 0;
  }

  /**
   * Delete recipe by identity ID and user
   * @param {string} recipeId - Recipe identity ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteByRemoteId(recipeId, userId) {
    const productIds = await this.db.collection(COLLECTION_PRODUCTS).find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const recipes = await this.findAll({
      recipe_identity_id: recipeId,
      product_id: { $in: productIdStrings }
    }, { projection: { _id: 1 } });
    const recipeIds = recipes.map(r => r._id.toString());

    await this.db.collection(COLLECTION_RECIPE_PRODUCTS).deleteMany({ products_recipes_id: { $in: recipeIds } });
    const count = await this.deleteMany({
      recipe_identity_id: recipeId,
      product_id: { $in: productIdStrings }
    });
    return count > 0;
  }

  /**
   * Delete recipe by ID and user
   * @param {string} id - Recipe ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Whether recipe was deleted
   */
  async deleteById(id, userId) {
    if (!ObjectId.isValid(id)) return false;

    const productIds = await this.db.collection(COLLECTION_PRODUCTS).find({ userid: userId }).project({ _id: 1 }).toArray();
    const productIdStrings = productIds.map(p => p._id.toString());

    const recipe = await this.findOne({
      _id: new ObjectId(id),
      product_id: { $in: productIdStrings }
    });

    if (!recipe) return false;

    await this.db.collection(COLLECTION_RECIPE_PRODUCTS).deleteMany({ products_recipes_id: recipe._id.toString() });
    const result = await this.deleteById(id);
    return result;
  }

  /**
   * Find recipes with pagination
   * @param {Object} filter - MongoDB filter
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async findPaginated(filter, options = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const sort = options.sort ?? { _id: -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.collection.find(filter, { sort, skip, limit }).toArray(),
      this.collection.countDocuments(filter)
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Map recipe document to interface format
   * @param {Object} doc - Recipe document
   * @returns {Object}
   */
  mapToRecipe(doc) {
    return {
      id: doc._id.toString(),
      _id: doc.recipe_identity_id,
      name: doc.recipe_name,
      quantity: doc.quantity,
      total: doc.total,
      totalWithTax: doc.totalwithtax,
      yieldValue: doc.yieldvalue,
      yieldValueUnit: doc.yieldvalueunit,
      products: []
    };
  }

  /**
   * Map recipe product document to interface format
   * @param {Object} doc - Recipe product document
   * @returns {Object}
   */
  mapToRecipeProduct(doc) {
    return {
      id: doc._id.toString(),
      _id: doc.recipes_products_identity_id,
      name: doc.recipe_product_name,
      value: doc.value,
      status: doc.status,
      qt: doc.qt,
      qtValue: doc.qtValue,
      unit: doc.unit
    };
  }
}

/**
 * Paginated Recipe Repository
 * @extends PaginatedRepository
 */
class MongoRecipePaginatedRepository extends PaginatedRepository {
  /**
   * @param {Db} db - MongoDB database instance
   */
  constructor(db) {
    super(db);
    this.collectionName = COLLECTION_RECIPES;
  }
}

module.exports = {
  MongoRecipeRepository,
  MongoRecipePaginatedRepository
};