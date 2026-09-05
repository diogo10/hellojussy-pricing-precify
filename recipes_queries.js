/**
 * @deprecated This module contains PostgreSQL query strings that are no longer used.
 * 
 * Recipe operations are now handled by the MongoDB Repository Pattern:
 * - MongoEmbeddedRecipeRepository (repositories/mongo/RecipeRepository.js)
 * - MongoRecipeRepository (repositories/mongo/RecipeRepository.js)
 * 
 * The following MongoDB operations replace the old PostgreSQL queries:
 * 
 * DELETE_RECIPE (DELETE FROM products_recipes WHERE product_id = $1)
 *   → MongoEmbeddedRecipeRepository.deleteByProductId(productId)
 *   → Uses $pull to remove all recipes from product document
 * 
 * DELETE_RECIPE_PRODUCTS (DELETE FROM products_recipes WHERE recipe_identity_id = $1...)
 *   → MongoEmbeddedRecipeRepository.deleteByRemoteId(recipeId, userId)
 *   → Uses $pull with identity_id filter
 * 
 * DELETE_RECIPE_WITH_USER (DELETE FROM products_recipes WHERE id = $1...)
 *   → MongoEmbeddedRecipeRepository.deleteById(id, userId)
 *   → Uses $pull with _id or identity_id filter
 * 
 * SELECT_WITH_USER (SELECT * FROM products_recipes WHERE recipe_identity_id = $1...)
 *   → MongoEmbeddedRecipeRepository.findByRemoteId(recipeId, userId)
 *   → Uses findOne with $elemMatch projection
 * 
 * For new code, use the repository pattern via RepositoryFactory:
 *   const factory = RepositoryFactory.getInstance();
 *   const recipeRepo = factory.getRecipeRepository();
 *   await recipeRepo.deleteByRemoteId(recipeId, userId);
 */

// Re-export empty object for backward compatibility (tests only)
module.exports = {
  DELETE_RECIPE: 'DEPRECATED: Use MongoEmbeddedRecipeRepository.deleteByProductId()',
  DELETE_RECIPE_PRODUCTS: 'DEPRECATED: Use MongoEmbeddedRecipeRepository.deleteByRemoteId()',
  DELETE_RECIPE_WITH_USER: 'DEPRECATED: Use MongoEmbeddedRecipeRepository.deleteById()',
  SELECT_WITH_USER: 'DEPRECATED: Use MongoEmbeddedRecipeRepository.findByRemoteId()'
};