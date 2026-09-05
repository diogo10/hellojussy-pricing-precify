const { RepositoryFactory } = require('../repositories/RepositoryFactory.js');

class ProductService {
  /**
   * @param {Object} productRepository - IProductRepository implementation
   * @param {Object} supplyRepository - ISupplyRepository implementation
   * @param {Object} recipeRepository - IRecipeRepository implementation
   * @param {Object} recalculationRepository - IRecalculationRepository implementation
   */
  constructor(productRepository, supplyRepository, recipeRepository, recalculationRepository) {
    this.productRepository = productRepository;
    this.supplyRepository = supplyRepository;
    this.recipeRepository = recipeRepository;
    this.recalculationRepository = recalculationRepository;
  }

  static createFromFactory() {
    const factory = RepositoryFactory.getInstance();
    return new ProductService(
      factory.getProductRepository(),
      factory.getSupplyRepository(),
      factory.getRecipeRepository(),
      factory.getRecalculationRepository()
    );
  }

  async getAllProducts(userId) {
    return this.productRepository.findAllByUserId(userId);
  }

  async getProductById(userId, productId) {
    return this.productRepository.findById(userId, productId);
  }

  async createProduct(data, supplies, recipes) {
    const productId = await this.productRepository.create(data);

    if (supplies.length > 0) {
      const suppliesCreated = await this.supplyRepository.create(productId, supplies);
      if (!suppliesCreated) {
        await this.productRepository.delete(productId);
        throw new Error('Failed to create supplies');
      }
    }

    if (recipes.length > 0) {
      const recipesCreated = await this.recipeRepository.create(productId, recipes);
      if (!recipesCreated) {
        await this.supplyRepository.deleteByProductId(productId);
        await this.productRepository.delete(productId);
        throw new Error('Failed to create recipes');
      }
    }

    return productId;
  }

  async updateProduct(productId, data, supplies, recipes) {
    const updated = await this.productRepository.update(productId, data);
    if (!updated) {
      throw new Error('Product not found or update failed');
    }

    await this.supplyRepository.deleteByProductId(productId);
    if (supplies.length > 0) {
      await this.supplyRepository.create(productId, supplies);
    }

    await this.recipeRepository.deleteByProductId(productId);
    if (recipes.length > 0) {
      await this.recipeRepository.create(productId, recipes);
    }

    return true;
  }

  async deleteProduct(productId) {
    await this.supplyRepository.deleteByProductId(productId);
    await this.recipeRepository.deleteByProductId(productId);
    return this.productRepository.delete(productId);
  }

  async deleteAllProducts(userId) {
    return this.recalculationRepository.deleteAll(userId);
  }
}

module.exports = {
  ProductService
};
