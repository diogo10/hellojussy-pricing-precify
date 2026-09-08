const { MongoProductRepository } = require('./mongo/ProductRepository.js');
const { MongoEmbeddedSupplyRepository } = require('./mongo/SupplyRepository.js');
const { MongoEmbeddedRecipeRepository } = require('./mongo/RecipeRepository.js');
const { MongoRecalculationRepository } = require('./mongo/RecalculationRepository.js');

const POSTGRES_REMOVED_MESSAGE = "PostgreSQL support was removed. Use { type: 'mongodb', mongoDb }.";

class RepositoryFactory {
  /**
   * @param {Object} config - Repository configuration
   * @param {'mongodb'} config.type - Database type (only 'mongodb' is supported)
   * @param {import('mongodb').Db} [config.mongoDb] - MongoDB Db handle
   */
  constructor(config) {
    this.config = config;
    this.productRepository = null;
    this.supplyRepository = null;
    this.recipeRepository = null;
    this.recalculationRepository = null;
  }

  static initialize(config) {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(config);
    }
    return RepositoryFactory.instance;
  }

  static getInstance() {
    if (!RepositoryFactory.instance) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return RepositoryFactory.instance;
  }

  /**
   * Reset the singleton instance (intended for tests).
   */
  static resetInstance() {
    RepositoryFactory.instance = null;
  }

  assertMongodb() {
    if (this.config?.type === 'postgres') {
      throw new Error(POSTGRES_REMOVED_MESSAGE);
    }
    if (this.config?.type && this.config.type !== 'mongodb') {
      throw new Error(`Unsupported database type: ${this.config.type}`);
    }
    if (!this.config?.mongoDb) {
      throw new Error('MongoDB database required for mongodb repository');
    }
  }

  getProductRepository() {
    if (!this.productRepository) {
      this.productRepository = this.createProductRepository();
    }
    return this.productRepository;
  }

  getSupplyRepository() {
    if (!this.supplyRepository) {
      this.supplyRepository = this.createSupplyRepository();
    }
    return this.supplyRepository;
  }

  getRecipeRepository() {
    if (!this.recipeRepository) {
      this.recipeRepository = this.createRecipeRepository();
    }
    return this.recipeRepository;
  }

  getRecalculationRepository() {
    if (!this.recalculationRepository) {
      this.recalculationRepository = this.createRecalculationRepository();
    }
    return this.recalculationRepository;
  }

  createProductRepository() {
    this.assertMongodb();
    return new MongoProductRepository(this.config.mongoDb);
  }

  createSupplyRepository() {
    this.assertMongodb();
    return new MongoEmbeddedSupplyRepository(this.config.mongoDb);
  }

  createRecipeRepository() {
    this.assertMongodb();
    return new MongoEmbeddedRecipeRepository(this.config.mongoDb);
  }

  createRecalculationRepository() {
    this.assertMongodb();
    return new MongoRecalculationRepository(this.config.mongoDb);
  }

  reset() {
    this.productRepository = null;
    this.supplyRepository = null;
    this.recipeRepository = null;
    this.recalculationRepository = null;
  }
}

RepositoryFactory.instance = null;

module.exports = {
  RepositoryFactory
};
