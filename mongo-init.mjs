import { MongoClient } from 'mongodb';
import { MongoDBConnection } from './config/mongodb.mjs';

const COLLECTION_PRODUCTS = 'products';
const COLLECTION_RECIPES = 'recipes';
const COLLECTION_SUPPLIES = 'supplies';

const PRODUCT_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['userid', 'product_name'],
    properties: {
      userid: { bsonType: 'string' },
      product_name: { bsonType: 'string', maxLength: 100 },
      profit_percentage: { bsonType: 'string' },
      price: { bsonType: 'double', minimum: 0 },
      product_cost: { bsonType: 'double', minimum: 0 },
      product_cost_with_tax: { bsonType: 'double', minimum: 0 },
      product_cost_with_markup: { bsonType: 'double', minimum: 0 },
      product_cost_with_markup_tax: { bsonType: 'double', minimum: 0 },
      total_fichas: { bsonType: 'double', minimum: 0 },
      total_extras: { bsonType: 'double', minimum: 0 },
      supplies: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['identity_id', 'name', 'value', 'qt', 'qtvalue', 'unit'],
          properties: {
            _id: { bsonType: 'objectId' },
            identity_id: { bsonType: 'string' },
            name: { bsonType: 'string', maxLength: 100 },
            value: { bsonType: 'double', minimum: 0 },
            qt: { bsonType: 'int', minimum: 1 },
            qtvalue: { bsonType: 'double', minimum: 0 },
            unit: { bsonType: 'string', enum: ['KG', 'G', 'L', 'ML', 'UNID'] },
            computed_cost: { bsonType: 'double', minimum: 0 }
          }
        }
      },
      recipes: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['identity_id', 'recipe_name', 'quantity'],
          properties: {
            _id: { bsonType: 'objectId' },
            identity_id: { bsonType: 'string' },
            recipe_name: { bsonType: 'string', maxLength: 100 },
            quantity: { bsonType: 'double', minimum: 0 },
            yieldvalue: { bsonType: 'double', minimum: 0 },
            yieldvalueunit: { bsonType: 'double', minimum: 0 },
            myprice: { bsonType: 'double', minimum: 0 },
            myprof: { bsonType: 'double', minimum: 0 },
            profit: { bsonType: 'double', minimum: 0 },
            total: { bsonType: 'double', minimum: 0 },
            totalwithtax: { bsonType: 'double', minimum: 0 },
            margemper: { bsonType: 'string' },
            products: {
              bsonType: 'array',
              items: {
                bsonType: 'object',
                required: ['identity_id', 'recipe_product_name', 'value', 'qt', 'qtvalue', 'unit'],
                properties: {
                  _id: { bsonType: 'objectId' },
                  identity_id: { bsonType: 'string' },
                  recipe_product_name: { bsonType: 'string', maxLength: 100 },
                  value: { bsonType: 'double', minimum: 0 },
                  status: { bsonType: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                  qt: { bsonType: 'int', minimum: 1 },
                  qtvalue: { bsonType: 'double', minimum: 0 },
                  unit: { bsonType: 'string', enum: ['KG', 'G', 'L', 'ML', 'UNID'] },
                  computed_cost: { bsonType: 'double', minimum: 0 }
                }
              }
            }
          }
        }
      },
      created_at: { bsonType: 'date' },
      updated_at: { bsonType: 'date' },
      version: { bsonType: 'int', minimum: 1 }
    }
  }
};

const RECIPE_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['userid', 'identity_id', 'recipe_name'],
    properties: {
      userid: { bsonType: 'string' },
      identity_id: { bsonType: 'string' },
      recipe_name: { bsonType: 'string', maxLength: 100 },
      quantity: { bsonType: 'double', minimum: 0 },
      yieldvalue: { bsonType: 'double', minimum: 0 },
      yieldvalueunit: { bsonType: 'double', minimum: 0 },
      myprice: { bsonType: 'double', minimum: 0 },
      myprof: { bsonType: 'double', minimum: 0 },
      profit: { bsonType: 'double', minimum: 0 },
      total: { bsonType: 'double', minimum: 0 },
      totalwithtax: { bsonType: 'double', minimum: 0 },
      margemper: { bsonType: 'string' },
      products: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['identity_id', 'recipe_product_name', 'value', 'qt', 'qtvalue', 'unit'],
          properties: {
            _id: { bsonType: 'objectId' },
            identity_id: { bsonType: 'string' },
            recipe_product_name: { bsonType: 'string', maxLength: 100 },
            value: { bsonType: 'double', minimum: 0 },
            status: { bsonType: 'string', enum: ['ACTIVE', 'INACTIVE'] },
            qt: { bsonType: 'int', minimum: 1 },
            qtvalue: { bsonType: 'double', minimum: 0 },
            unit: { bsonType: 'string', enum: ['KG', 'G', 'L', 'ML', 'UNID'] },
            computed_cost: { bsonType: 'double', minimum: 0 }
          }
        }
      },
      created_at: { bsonType: 'date' },
      updated_at: { bsonType: 'date' }
    }
  }
};

const SUPPLY_VALIDATOR = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['userid', 'identity_id', 'name'],
    properties: {
      userid: { bsonType: 'string' },
      identity_id: { bsonType: 'string' },
      name: { bsonType: 'string', maxLength: 100 },
      value: { bsonType: 'double', minimum: 0 },
      qt: { bsonType: 'int', minimum: 1 },
      qtvalue: { bsonType: 'double', minimum: 0 },
      unit: { bsonType: 'string', enum: ['KG', 'G', 'L', 'ML', 'UNID'] },
      created_at: { bsonType: 'date' },
      updated_at: { bsonType: 'date' }
    }
  }
};

async function createProductsCollection(db) {
  console.log('Creating products collection...');
  
  try {
    await db.createCollection(COLLECTION_PRODUCTS, { validator: PRODUCT_VALIDATOR, validationLevel: 'moderate' });
    console.log('✓ products collection created with validation schema');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✓ products collection already exists, updating validator...');
      await db.command({ collMod: COLLECTION_PRODUCTS, validator: PRODUCT_VALIDATOR, validationLevel: 'moderate' });
      console.log('✓ products collection validator updated');
    } else {
      throw error;
    }
  }

  console.log('Creating indexes on products collection...');
  
  const indexes = [
    { key: { userid: 1, created_at: -1 }, name: 'idx_userid_created_at' },
    { key: { _id: 1, userid: 1 }, name: 'idx_id_userid' },
    { key: { userid: 1, 'recipes.identity_id': 1 }, name: 'idx_userid_recipe_identity' },
    { key: { userid: 1, 'supplies.identity_id': 1 }, name: 'idx_userid_supply_identity' }
  ];

  for (const index of indexes) {
    try {
      await db.collection(COLLECTION_PRODUCTS).createIndex(index.key, { name: index.name });
      console.log(`✓ Index created: ${index.name}`);
    } catch (error) {
      if (error.codeName === 'IndexOptionsConflict' || error.codeName === 'IndexAlreadyExists') {
        console.log(`✓ Index already exists: ${index.name}`);
      } else {
        throw error;
      }
    }
  }
}

async function createRecipesCollection(db) {
  console.log('Creating recipes collection...');
  
  try {
    await db.createCollection(COLLECTION_RECIPES, { validator: RECIPE_VALIDATOR, validationLevel: 'moderate' });
    console.log('✓ recipes collection created with validation schema');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✓ recipes collection already exists, updating validator...');
      await db.command({ collMod: COLLECTION_RECIPES, validator: RECIPE_VALIDATOR, validationLevel: 'moderate' });
      console.log('✓ recipes collection validator updated');
    } else {
      throw error;
    }
  }

  console.log('Creating indexes on recipes collection...');
  
  const indexes = [
    { key: { userid: 1, identity_id: 1 }, name: 'idx_userid_identity_id', unique: true },
    { key: { userid: 1, created_at: -1 }, name: 'idx_userid_created_at' }
  ];

  for (const index of indexes) {
    try {
      await db.collection(COLLECTION_RECIPES).createIndex(index.key, { name: index.name, unique: index.unique });
      console.log(`✓ Index created: ${index.name}`);
    } catch (error) {
      if (error.codeName === 'IndexOptionsConflict' || error.codeName === 'IndexAlreadyExists') {
        console.log(`✓ Index already exists: ${index.name}`);
      } else {
        throw error;
      }
    }
  }
}

async function createSuppliesCollection(db) {
  console.log('Creating supplies collection...');
  
  try {
    await db.createCollection(COLLECTION_SUPPLIES, { validator: SUPPLY_VALIDATOR, validationLevel: 'moderate' });
    console.log('✓ supplies collection created with validation schema');
  } catch (error) {
    if (error.codeName === 'NamespaceExists') {
      console.log('✓ supplies collection already exists, updating validator...');
      await db.command({ collMod: COLLECTION_SUPPLIES, validator: SUPPLY_VALIDATOR, validationLevel: 'moderate' });
      console.log('✓ supplies collection validator updated');
    } else {
      throw error;
    }
  }

  console.log('Creating indexes on supplies collection...');
  
  const indexes = [
    { key: { userid: 1, identity_id: 1 }, name: 'idx_userid_identity_id', unique: true },
    { key: { userid: 1, name: 1 }, name: 'idx_userid_name' }
  ];

  for (const index of indexes) {
    try {
      await db.collection(COLLECTION_SUPPLIES).createIndex(index.key, { name: index.name, unique: index.unique });
      console.log(`✓ Index created: ${index.name}`);
    } catch (error) {
      if (error.codeName === 'IndexOptionsConflict' || error.codeName === 'IndexAlreadyExists') {
        console.log(`✓ Index already exists: ${index.name}`);
      } else {
        throw error;
      }
    }
  }
}

async function initializeCollections() {
  console.log('Initializing MongoDB collections...');
  console.log('=====================================');
  
  const db = await MongoDBConnection.getInstance().connect();
  
  try {
    await createProductsCollection(db);
    console.log('');
    
    await createRecipesCollection(db);
    console.log('');
    
    await createSuppliesCollection(db);
    console.log('');
    
    console.log('=====================================');
    console.log('All collections initialized successfully!');
  } finally {
    await MongoDBConnection.getInstance().disconnect();
  }
}

initializeCollections().catch(console.error);