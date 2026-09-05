const assert = require('assert');
const sinon = require('sinon');
const { ProductService } = require('../services/ProductService.js');
const { SupplyService } = require('../services/SupplyService.js');
const { RecipeService } = require('../services/RecipeService.js');
const { RepositoryFactory } = require('../repositories/RepositoryFactory.js');

const PRODUCT_DATA = {
  name: 'Bolo',
  userId: 'user-1',
  prof: '30',
  price: 45,
  cost: 22.5,
  costWithTax: 25.88,
  costWithMarkup: 29.25,
  costWithMarkupTax: 33.64,
  totalFichas: 12.3,
  totalExtras: 10.2,
};
const SUPPLIES = [{ id: 's-1', name: 'Farinha', value: 8.5, qt: 1000, qtValue: 500, unit: 'G' }];
const RECIPES = [
  {
    id: 'r-1',
    name: 'Massa',
    quantity: 1,
    total: 15,
    totalWithTax: 17.25,
    yieldValue: 1000,
    yieldValueUnit: 1,
    products: [],
  },
];

function stubRepositories() {
  return {
    productRepository: {
      findAllByUserId: sinon.stub(),
      findById: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
    },
    supplyRepository: {
      create: sinon.stub(),
      update: sinon.stub(),
      deleteByProductId: sinon.stub(),
      deleteByRemoteId: sinon.stub(),
    },
    recipeRepository: {
      findByRemoteId: sinon.stub(),
      create: sinon.stub(),
      deleteByProductId: sinon.stub(),
      deleteByRemoteId: sinon.stub(),
      deleteById: sinon.stub(),
    },
    recalculationRepository: {
      executeRecalculate: sinon.stub(),
      deleteAll: sinon.stub(),
    },
  };
}

describe('ProductService', () => {
  let repos;
  let service;

  beforeEach(() => {
    repos = stubRepositories();
    service = new ProductService(
      repos.productRepository,
      repos.supplyRepository,
      repos.recipeRepository,
      repos.recalculationRepository
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it('getAllProducts delegates to the product repository', async () => {
    repos.productRepository.findAllByUserId.resolves([{ id: 'p1' }]);

    const result = await service.getAllProducts('user-1');

    assert.deepStrictEqual(result, [{ id: 'p1' }]);
    assert.ok(repos.productRepository.findAllByUserId.calledOnceWith('user-1'));
  });

  it('getProductById delegates to the product repository', async () => {
    repos.productRepository.findById.resolves(null);

    assert.strictEqual(await service.getProductById('user-1', 'p1'), null);
    assert.ok(repos.productRepository.findById.calledOnceWith('user-1', 'p1'));
  });

  it('createProduct orchestrates product, supplies and recipes creation', async () => {
    repos.productRepository.create.resolves('product-1');
    repos.supplyRepository.create.resolves(true);
    repos.recipeRepository.create.resolves(true);

    const id = await service.createProduct(PRODUCT_DATA, SUPPLIES, RECIPES);

    assert.strictEqual(id, 'product-1');
    assert.ok(repos.productRepository.create.calledOnceWith(PRODUCT_DATA));
    assert.ok(repos.supplyRepository.create.calledOnceWith('product-1', SUPPLIES));
    assert.ok(repos.recipeRepository.create.calledOnceWith('product-1', RECIPES));
  });

  it('createProduct skips empty supplies and recipes', async () => {
    repos.productRepository.create.resolves('product-1');

    const id = await service.createProduct(PRODUCT_DATA, [], []);

    assert.strictEqual(id, 'product-1');
    assert.strictEqual(repos.supplyRepository.create.callCount, 0);
    assert.strictEqual(repos.recipeRepository.create.callCount, 0);
  });

  it('createProduct rolls back the product when supplies fail', async () => {
    repos.productRepository.create.resolves('product-1');
    repos.supplyRepository.create.resolves(false);
    repos.productRepository.delete.resolves(true);

    await assert.rejects(service.createProduct(PRODUCT_DATA, SUPPLIES, []), /Failed to create supplies/);
    assert.ok(repos.productRepository.delete.calledOnceWith('product-1'));
  });

  it('createProduct rolls back supplies and product when recipes fail', async () => {
    repos.productRepository.create.resolves('product-1');
    repos.supplyRepository.create.resolves(true);
    repos.recipeRepository.create.resolves(false);
    repos.supplyRepository.deleteByProductId.resolves(true);
    repos.productRepository.delete.resolves(true);

    await assert.rejects(
      service.createProduct(PRODUCT_DATA, SUPPLIES, RECIPES),
      /Failed to create recipes/
    );
    assert.ok(repos.supplyRepository.deleteByProductId.calledOnceWith('product-1'));
    assert.ok(repos.productRepository.delete.calledOnceWith('product-1'));
  });

  it('updateProduct replaces supplies and recipes after updating the product', async () => {
    repos.productRepository.update.resolves(true);
    repos.supplyRepository.deleteByProductId.resolves(true);
    repos.supplyRepository.create.resolves(true);
    repos.recipeRepository.deleteByProductId.resolves(true);
    repos.recipeRepository.create.resolves(true);

    const result = await service.updateProduct('product-1', PRODUCT_DATA, SUPPLIES, RECIPES);

    assert.strictEqual(result, true);
    assert.ok(repos.productRepository.update.calledOnceWith('product-1', PRODUCT_DATA));
    assert.ok(repos.supplyRepository.deleteByProductId.calledOnceWith('product-1'));
    assert.ok(repos.recipeRepository.deleteByProductId.calledOnceWith('product-1'));
  });

  it('updateProduct throws when the product does not exist', async () => {
    repos.productRepository.update.resolves(false);

    await assert.rejects(
      service.updateProduct('missing', PRODUCT_DATA, [], []),
      /Product not found/
    );
    assert.strictEqual(repos.supplyRepository.deleteByProductId.callCount, 0);
  });

  it('deleteProduct cascades to supplies and recipes first', async () => {
    repos.supplyRepository.deleteByProductId.resolves(true);
    repos.recipeRepository.deleteByProductId.resolves(true);
    repos.productRepository.delete.resolves(true);

    assert.strictEqual(await service.deleteProduct('product-1'), true);
    sinon.assert.callOrder(
      repos.supplyRepository.deleteByProductId,
      repos.recipeRepository.deleteByProductId,
      repos.productRepository.delete
    );
  });

  it('deleteAllProducts delegates to the recalculation repository', async () => {
    repos.recalculationRepository.deleteAll.resolves(true);

    assert.strictEqual(await service.deleteAllProducts('user-1'), true);
    assert.ok(repos.recalculationRepository.deleteAll.calledOnceWith('user-1'));
  });

  it('createFromFactory wires repositories from the RepositoryFactory', () => {
    RepositoryFactory.resetInstance();
    const { createFakeDb } = require('./helpers/mongo-fakes.cjs');
    RepositoryFactory.initialize({ type: 'mongodb', mongoDb: createFakeDb() });

    const fromFactory = ProductService.createFromFactory();

    assert.ok(fromFactory instanceof ProductService);
    RepositoryFactory.resetInstance();
  });
});

describe('SupplyService', () => {
  let repos;
  let service;

  beforeEach(() => {
    repos = stubRepositories();
    service = new SupplyService(repos.supplyRepository, repos.recalculationRepository);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('updateSupply updates then recalculates on success', async () => {
    repos.supplyRepository.update.resolves(true);
    repos.recalculationRepository.executeRecalculate.resolves(true);

    const result = await service.updateSupply('s-1', 'user-1', {
      name: 'Farinha',
      qt: 1000,
      qtValue: 500,
      unit: 'G',
    });

    assert.strictEqual(result, true);
    assert.ok(
      repos.supplyRepository.update.calledOnceWith('s-1', 'user-1', {
        name: 'Farinha',
        qt: 1000,
        qtValue: 500,
        unit: 'G',
      })
    );
    assert.ok(repos.recalculationRepository.executeRecalculate.calledOnceWith(0, 0, 'user-1'));
  });

  it('updateSupply skips recalculation when the update fails', async () => {
    repos.supplyRepository.update.resolves(false);

    assert.strictEqual(await service.updateSupply('s-1', 'user-1', { name: 'x' }), false);
    assert.strictEqual(repos.recalculationRepository.executeRecalculate.callCount, 0);
  });

  it('deleteSupply deletes then recalculates on success', async () => {
    repos.supplyRepository.deleteByRemoteId.resolves(true);
    repos.recalculationRepository.executeRecalculate.resolves(true);

    assert.strictEqual(await service.deleteSupply('s-1', 'user-1'), true);
    assert.ok(repos.supplyRepository.deleteByRemoteId.calledOnceWith('s-1', 'user-1'));
    assert.ok(repos.recalculationRepository.executeRecalculate.calledOnceWith(0, 0, 'user-1'));
  });

  it('deleteSupply skips recalculation when nothing was deleted', async () => {
    repos.supplyRepository.deleteByRemoteId.resolves(false);

    assert.strictEqual(await service.deleteSupply('s-1', 'user-1'), false);
    assert.strictEqual(repos.recalculationRepository.executeRecalculate.callCount, 0);
  });
});

describe('RecipeService', () => {
  let repos;
  let service;

  beforeEach(() => {
    repos = stubRepositories();
    service = new RecipeService(repos.recipeRepository, repos.recalculationRepository);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('getRecipeByRemoteId delegates to the recipe repository', async () => {
    repos.recipeRepository.findByRemoteId.resolves([{ id: 'r-1' }]);

    assert.deepStrictEqual(await service.getRecipeByRemoteId('r-1', 'user-1'), [{ id: 'r-1' }]);
    assert.ok(repos.recipeRepository.findByRemoteId.calledOnceWith('r-1', 'user-1'));
  });

  it('updateRecipe throws when the recipe is missing', async () => {
    repos.recipeRepository.findByRemoteId.resolves([]);

    await assert.rejects(service.updateRecipe('missing', 'user-1', {}), /Recipe not found/);
    assert.strictEqual(repos.recalculationRepository.executeRecalculate.callCount, 0);
  });

  it('updateRecipe triggers recalculation when the recipe exists', async () => {
    repos.recipeRepository.findByRemoteId.resolves([{ id: 'r-1' }]);
    repos.recalculationRepository.executeRecalculate.resolves(true);

    assert.strictEqual(await service.updateRecipe('r-1', 'user-1', { name: 'Massa' }), true);
    assert.ok(repos.recalculationRepository.executeRecalculate.calledOnceWith(0, 0, 'user-1'));
  });

  it('deleteRecipeByRemoteId recalculates only on success', async () => {
    repos.recipeRepository.deleteByRemoteId.resolves(true);
    repos.recalculationRepository.executeRecalculate.resolves(true);

    assert.strictEqual(await service.deleteRecipeByRemoteId('r-1', 'user-1'), true);
    assert.ok(repos.recalculationRepository.executeRecalculate.calledOnceWith(0, 0, 'user-1'));

    repos.recipeRepository.deleteByRemoteId.resolves(false);
    repos.recalculationRepository.executeRecalculate.resetHistory();
    assert.strictEqual(await service.deleteRecipeByRemoteId('r-1', 'user-1'), false);
    assert.strictEqual(repos.recalculationRepository.executeRecalculate.callCount, 0);
  });

  it('deleteRecipeById recalculates only on success', async () => {
    repos.recipeRepository.deleteById.resolves(true);
    repos.recalculationRepository.executeRecalculate.resolves(true);

    assert.strictEqual(await service.deleteRecipeById('row-1', 'user-1'), true);
    assert.ok(repos.recipeRepository.deleteById.calledOnceWith('row-1', 'user-1'));
    assert.ok(repos.recalculationRepository.executeRecalculate.calledOnceWith(0, 0, 'user-1'));
  });
});
