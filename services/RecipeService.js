import { RepositoryFactory } from '../repositories/RepositoryFactory.js';
import { IRecipeRepository, IRecalculationRepository } from '../repositories/interfaces/index.js';
import { Recipe } from '../repositories/interfaces/index.js';

export class RecipeService {
  constructor(
    private recipeRepository: IRecipeRepository,
    private recalculationRepository: IRecalculationRepository
  ) {}

  static createFromFactory(): RecipeService {
    const factory = RepositoryFactory.getInstance();
    return new RecipeService(
      factory.getRecipeRepository(),
      factory.getRecalculationRepository()
    );
  }

  async getRecipeByRemoteId(recipeId: string, userId: string): Promise<Recipe[]> {
    return this.recipeRepository.findByRemoteId(recipeId, userId);
  }

  async updateRecipe(recipeId: string, userId: string, recipeData: any): Promise<boolean> {
    const recipes = await this.recipeRepository.findByRemoteId(recipeId, userId);
    if (!recipes.length) {
      throw new Error('Recipe not found');
    }

    // In a real implementation, we would update the recipe
    // For now, we'll trigger recalculation
    return this.triggerRecalculation(userId);
  }

  async deleteRecipeByRemoteId(recipeId: string, userId: string): Promise<boolean> {
    const deleted = await this.recipeRepository.deleteByRemoteId(recipeId, userId);
    if (deleted) {
      await this.triggerRecalculation(userId);
    }
    return deleted;
  }

  async deleteRecipeById(id: string, userId: string): Promise<boolean> {
    const deleted = await this.recipeRepository.deleteById(id, userId);
    if (deleted) {
      await this.triggerRecalculation(userId);
    }
    return deleted;
  }

  private async triggerRecalculation(userId: string): Promise<boolean> {
    // These values would come from external services
    const tax = 0; // await revenueTaxService.getTaxTotal(userId);
    const markup = 0; // await revenueTaxService.getMarkup(userId);
    return this.recalculationRepository.executeRecalculate(tax, markup, userId);
  }
}