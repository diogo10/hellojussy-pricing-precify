const ProductRepository = require('./ProductRepository.js');
const SupplyRepository = require('./SupplyRepository.js');
const RecipeRepository = require('./RecipeRepository.js');
const RecalculationRepository = require('./RecalculationRepository.js');
const BaseRepository = require('./BaseRepository.js');
const EmbeddedRepository = require('./EmbeddedRepository.js');

module.exports = {
  ...ProductRepository,
  ...SupplyRepository,
  ...RecipeRepository,
  ...RecalculationRepository,
  ...BaseRepository,
  ...EmbeddedRepository
};