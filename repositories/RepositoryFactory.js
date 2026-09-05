const { PostgresProductRepository, PostgresSupplyRepository, PostgresRecipeRepository, PostgresRecalculationRepository } = require('./postgres/index.js');
const { MongoProductRepository } = require('./mongo/ProductRepository.js');
const { MongoEmbeddedSupplyRepository } = require('./mongo/SupplyRepository.js');
const { MongoEmbeddedRecipeRepository } = require('./mongo/RecipeRepository.js');
const { MongoRecalculationRepository } = require('./mongo/RecalculationRepository.js');

class RepositoryFactory {
  /**
   * @param {Object} config - Repository configuration
   * @param {'postgres'|'mongodb'} config.type - Database type
   * @param {import('pg').Pool} [config.pgPool] - PostgreSQL pool (postgres only)
   * @param {import('mongodb').Db} [config.mongoDb] - MongoDB Db (mongodb only)
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
    switch (this.config.type) {
      case 'postgres':
        if (!this.config.pgPool) {
          throw new Error('PostgreSQL pool required for postgres repository');
        }
        return new PostgresProductRepository(this.config.pgPool);
      case 'mongodb':
        if (!this.config.mongoDb) {
          throw new Error('MongoDB database required for mongodb repository');
        }
        return new MongoProductRepository(this.config.mongoDb);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  createSupplyRepository() {
    switch (this.config.type) {
      case 'postgres':
        if (!this.config.pgPool) {
          throw new Error('PostgreSQL pool required for postgres repository');
        }
        return new PostgresSupplyRepository(this.config.pgPool);
      case 'mongodb':
        if (!this.config.mongoDb) {
          throw new Error('MongoDB database required for mongodb repository');
        }
        return new MongoEmbeddedSupplyRepository(this.config.mongoDb);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  createRecipeRepository() {
    switch (this.config.type) {
      case 'postgres':
        if (!this.config.pgPool) {
          throw new Error('PostgreSQL pool required for postgres repository');
        }
        return new PostgresRecipeRepository(this.config.pgPool);
      case 'mongodb':
        if (!this.config.mongoDb) {
          throw new Error('MongoDB database required for mongodb repository');
        }
        return new MongoEmbeddedRecipeRepository(this.config.mongoDb);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  createRecalculationRepository() {
    switch (this.config.type) {
      case 'postgres':
        if (!this.config.pgPool) {
          throw new Error('PostgreSQL pool required for postgres repository');
        }
        return new PostgresRecalculationRepository(this.config.pgPool);
      case 'mongodb':
        if (!this.config.mongoDb) {
          throw new Error('MongoDB database required for mongodb repository');
        }
        return new MongoRecalculationRepository(this.config.mongoDb);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
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
