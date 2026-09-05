const assert = require('assert');
const { RepositoryFactory } = require('../repositories/RepositoryFactory.js');
const { MongoProductRepository } = require('../repositories/mongo/ProductRepository.js');
const {
  MongoEmbeddedSupplyRepository,
} = require('../repositories/mongo/SupplyRepository.js');
const {
  MongoEmbeddedRecipeRepository,
} = require('../repositories/mongo/RecipeRepository.js');
const {
  MongoRecalculationRepository,
} = require('../repositories/mongo/RecalculationRepository.js');
const {
  PostgresProductRepository,
} = require('../repositories/postgres/ProductRepository.js');
const { createFakeDb } = require('./helpers/mongo-fakes.cjs');

describe('RepositoryFactory', () => {
  beforeEach(() => {
    RepositoryFactory.resetInstance();
  });

  afterEach(() => {
    RepositoryFactory.resetInstance();
  });

  it('throws when getInstance is called before initialize', () => {
    assert.throws(() => RepositoryFactory.getInstance(), /not initialized/);
  });

  it('creates MongoDB repositories from a mongoDb handle', () => {
    const db = createFakeDb();
    const factory = RepositoryFactory.initialize({ type: 'mongodb', mongoDb: db });

    assert.ok(factory.getProductRepository() instanceof MongoProductRepository);
    assert.ok(factory.getSupplyRepository() instanceof MongoEmbeddedSupplyRepository);
    assert.ok(factory.getRecipeRepository() instanceof MongoEmbeddedRecipeRepository);
    assert.ok(factory.getRecalculationRepository() instanceof MongoRecalculationRepository);
  });

  it('caches repository instances between calls', () => {
    const factory = RepositoryFactory.initialize({ type: 'mongodb', mongoDb: createFakeDb() });

    assert.strictEqual(factory.getProductRepository(), factory.getProductRepository());
    factory.reset();
    assert.notStrictEqual(factory.getProductRepository(), factory.getProductRepository());
  });

  it('throws for mongodb without a mongoDb handle', () => {
    const factory = RepositoryFactory.initialize({ type: 'mongodb' });

    assert.throws(() => factory.getProductRepository(), /MongoDB database required/);
    assert.throws(() => factory.getSupplyRepository(), /MongoDB database required/);
    assert.throws(() => factory.getRecipeRepository(), /MongoDB database required/);
    assert.throws(() => factory.getRecalculationRepository(), /MongoDB database required/);
  });

  it('creates Postgres repositories from a pg pool', () => {
    const pool = { query: async () => ({ rows: [], rowCount: 0 }) };
    const factory = RepositoryFactory.initialize({ type: 'postgres', pgPool: pool });

    assert.ok(factory.getProductRepository() instanceof PostgresProductRepository);
  });

  it('throws for postgres without a pool', () => {
    const factory = RepositoryFactory.initialize({ type: 'postgres' });
    assert.throws(() => factory.getProductRepository(), /PostgreSQL pool required/);
  });

  it('throws for unsupported database types', () => {
    const factory = RepositoryFactory.initialize({ type: 'mysql' });
    assert.throws(() => factory.getProductRepository(), /Unsupported database type/);
  });

  it('keeps the first configuration on repeated initialize calls', () => {
    const first = RepositoryFactory.initialize({ type: 'mongodb', mongoDb: createFakeDb() });
    const second = RepositoryFactory.initialize({ type: 'postgres', pgPool: {} });

    assert.strictEqual(first, second);
    assert.ok(second.getProductRepository() instanceof MongoProductRepository);
  });
});
