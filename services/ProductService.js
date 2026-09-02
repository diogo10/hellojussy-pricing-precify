import { RepositoryFactory } from '../repositories/RepositoryFactory.js';
import { IProductRepository, ISupplyRepository, IRecipeRepository, IRecalculationRepository } from '../repositories/interfaces/index.js';
import { ProductWithDetails, CreateProductDTO, UpdateProductDTO, CreateSupplyDTO, CreateRecipeDTO } from '../repositories/interfaces/index.js';

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private supplyRepository: ISupplyRepository,
    private recipeRepository: IRecipeRepository,
    private recalculationRepository: IRecalculationRepository
  ) {}

  static createFromFactory(): ProductService {
    const factory = RepositoryFactory.getInstance();
    return new ProductService(
      factory.getProductRepository(),
      factory.getSupplyRepository(),
      factory.getRecipeRepository(),
      factory.getRecalculationRepository()
    );
  }

  async getAllProducts(userId: string) {
    return this.productRepository.findAllByUserId(userId);
  }

  async getProductById(userId: string, productId: string): Promise<ProductWithDetails | null> {
    return this.productRepository.findById(userId, productId);
  }

  async createProduct(data: CreateProductDTO, supplies: CreateSupplyDTO[], recipes: CreateRecipeDTO[]) {
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

  async updateProduct(productId: string, data: UpdateProductDTO, supplies: CreateSupplyDTO[], recipes: CreateRecipeDTO[]) {
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

  async deleteProduct(productId: string) {
    await this.supplyRepository.deleteByProductId(productId);
    await this.recipeRepository.deleteByProductId(productId);
    return this.productRepository.delete(productId);
  }

  async deleteAllProducts(userId: string) {
    return this.recalculationRepository.deleteAll(userId);
  }
}