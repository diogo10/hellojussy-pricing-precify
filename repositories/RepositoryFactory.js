import { Pool } from 'pg';
import { Db } from 'mongodb';
import { IProductRepository, ISupplyRepository, IRecipeRepository, IRecalculationRepository } from '../interfaces/index.js';
import { PostgresProductRepository, PostgresSupplyRepository, PostgresRecipeRepository, PostgresRecalculationRepository } from '../postgres/index.js';
import { MongoProductRepository, MongoEmbeddedSupplyRepository, MongoEmbeddedRecipeRepository, MongoRecalculationRepository } from '../mongo/index.js';

export type DatabaseType = 'postgres' | 'mongodb';

export interface RepositoryConfig {
  type: DatabaseType;
  pgPool?: Pool;
  mongoDb?: Db;
}

export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private config: RepositoryConfig;
  private productRepository: IProductRepository | null = null;
  private supplyRepository: ISupplyRepository | null = null;
  private recipeRepository: IRecipeRepository | null = null;
  private recalculationRepository: IRecalculationRepository | null = null;

  private constructor(config: RepositoryConfig) {
    this.config = config;
  }

  static initialize(config: RepositoryConfig): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(config);
    }
    return RepositoryFactory.instance;
  }

  static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      throw new Error('RepositoryFactory not initialized. Call initialize() first.');
    }
    return RepositoryFactory.instance;
  }

  getProductRepository(): IProductRepository {
    if (!this.productRepository) {
      this.productRepository = this.createProductRepository();
    }
    return this.productRepository;
  }

  getSupplyRepository(): ISupplyRepository {
    if (!this.supplyRepository) {
      this.supplyRepository = this.createSupplyRepository();
    }
    return this.supplyRepository;
  }

  getRecipeRepository(): IRecipeRepository {
    if (!this.recipeRepository) {
      this.recipeRepository = this.createRecipeRepository();
    }
    return this.recipeRepository;
  }

  getRecalculationRepository(): IRecalculationRepository {
    if (!this.recalculationRepository) {
      this.recalculationRepository = this.createRecalculationRepository();
    }
    return this.recalculationRepository;
  }

  private createProductRepository(): IProductRepository {
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

  private createSupplyRepository(): ISupplyRepository {
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

  private createRecipeRepository(): IRecipeRepository {
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
        return new MongoRecipeRepository(this.config.mongoDb);
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`);
    }
  }

  private createRecalculationRepository(): IRecalculationRepository {
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

  reset(): void {
    this.productRepository = null;
    this.supplyRepository = null;
    this.recipeRepository = null;
    this.recalculationRepository = null;
  }
}