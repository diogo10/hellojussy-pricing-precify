const { PostgresProductRepository } = require('./ProductRepository.js');
const { PostgresSupplyRepository } = require('./SupplyRepository.js');
const { PostgresRecipeRepository } = require('./RecipeRepository.js');
const { PostgresRecalculationRepository } = require('./RecalculationRepository.js');

module.exports = {
  PostgresProductRepository,
  PostgresSupplyRepository,
  PostgresRecipeRepository,
  PostgresRecalculationRepository
};
