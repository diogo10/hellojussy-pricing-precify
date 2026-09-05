const { RepositoryFactory } = require('../repositories/RepositoryFactory.js');

class RecipeService {
  /**
   * @param {Object} recipeRepository - IRecipeRepository implementation
   * @param {Object} recalculationRepository - IRecalculationRepository implementation
   */
  constructor(recipeRepository, recalculationRepository) {
    this.recipeRepository = recipeRepository;
    this.recalculationRepository = recalculationRepository;
  }

  static createFromFactory() {
    const factory = RepositoryFactory.getInstance();
    return new RecipeService(
      factory.getRecipeRepository(),
      factory.getRecalculationRepository()
    );
  }

  async getRecipeByRemoteId(recipeId, userId) {
    return this.recipeRepository.findByRemoteId(recipeId, userId);
  }

  async updateRecipe(recipeId, userId, recipeData) {
    const recipes = await this.recipeRepository.findByRemoteId(recipeId, userId);
    if (!recipes.length) {
      throw new Error('Recipe not found');
    }

    // In a real implementation, we would update the recipe
    // For now, we'll trigger recalculation
    return this.triggerRecalculation(userId);
  }

  async deleteRecipeByRemoteId(recipeId, userId) {
    const deleted = await this.recipeRepository.deleteByRemoteId(recipeId, userId);
    if (deleted) {
      await this.triggerRecalculation(userId);
    }
    return deleted;
  }

  async deleteRecipeById(id, userId) {
    const deleted = await this.recipeRepository.deleteById(id, userId);
    if (deleted) {
      await this.triggerRecalculation(userId);
    }
    return deleted;
  }

  async triggerRecalculation(userId) {
    // These values would come from external services
    const tax = 0; // await revenueTaxService.getTaxTotal(userId);
    const markup = 0; // await revenueTaxService.getMarkup(userId);
    return this.recalculationRepository.executeRecalculate(tax, markup, userId);
  }
}

module.exports = {
  RecipeService
};
