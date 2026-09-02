# MongoDB Schema Proposal: Products, Recipes, and Supplies

## Executive Summary

This document proposes an optimized MongoDB document structure for migrating from the current PostgreSQL schema. The design leverages **embedding** for frequently co-accessed data and **referencing** for independently accessed entities, optimizing for the observed access patterns.

---

## Current PostgreSQL Schema Analysis

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────────────┐
│  Products   │ 1:N   │ Products_Supplies │       │   Products_Recipes      │
├─────────────┤◄──────┤                  │       ├─────────────────────────┤
│ id (PK)     │       │ id (PK)           │       │ id (PK)                 │
│ product_name│       │ supply_name       │       │ recipe_name             │
│ userid      │       │ value             │       │ myprice, myprof         │
│ profit_pct  │       │ qt, qtvalue       │       │ profit, total           │
│ price       │       │ unit              │       │ totalwithtax            │
│ cost fields │       │ product_id (FK)   │       │ yieldvalue, yieldunit   │
│ total_fichas│       │ supply_identity_id│       │ product_id (FK)         │
│ total_extras│       └──────────────────┘       │ recipe_identity_id      │
│ timestamps  │                                  │ quantity                │
└─────────────┘                                  └───────────┬─────────────┘
                                                             │ 1:N
                                              ┌──────────────┴──────────────┐
                                              │ Products_Recipes_Products   │
                                              ├─────────────────────────────┤
                                              │ id (PK)                     │
                                              │ recipe_product_name         │
                                              │ value, status               │
                                              │ qt, qtvalue, unit           │
                                              │ products_recipes_id (FK)    │
                                              │ recipes_products_identity_id│
                                              └─────────────────────────────┘
```

### Key Access Patterns (from API Layer)

| Pattern | Frequency | Tables Involved |
|---------|-----------|-----------------|
| Get all products for user | High | Products |
| Get product with supplies + recipes + recipe-products | High | All 4 tables |
| Create product + supplies + recipes (atomic) | Medium | All 4 tables |
| Update product (replace all supplies/recipes) | Medium | All 4 tables |
| Update single recipe by `recipe_identity_id` | Medium | Products_Recipes, Products_Recipes_Products |
| Delete single recipe by `recipe_identity_id` | Low | Products_Recipes, Products_Recipes_Products |
| Update single supply by `supply_identity_id` | Medium | Products_Supplies |
| Delete single supply by `supply_identity_id` | Low | Products_Supplies |
| Recalculate all products for user (aggregation) | Low | All tables via stored procs |

---

## Proposed MongoDB Schema

### Design Principles

1. **Embed what is read together**: Supplies and Recipes are always fetched with Products
2. **Reference what is updated independently**: Recipes and Supplies have independent webhook endpoints
3. **Denormalize computed fields**: Store `total_fichas` (recipes total) and `total_extras` (supplies total) on Product
4. **Use `identity_id` as shard-friendly natural keys**: Enables efficient partial updates

---

### Collection: `products`

```javascript
{
  _id: ObjectId("..."),
  userid: "3DtXXvgec9SBYtgT3whh1fsfaTC3",           // Partition key / shard key candidate
  product_name: "Bolo de Chocolate",
  
  // Pricing configuration
  profit_percentage: "30",
  price: 45.00,
  
  // Computed cost fields (updated by recalculation)
  product_cost: 22.50,
  product_cost_with_tax: 25.88,
  product_cost_with_markup: 29.25,
  product_cost_with_markup_tax: 33.64,
  
  // Aggregated totals (denormalized for fast reads)
  total_fichas: 12.30,      // Sum of recipe costs
  total_extras: 10.20,      // Sum of supply costs
  
  // Embedded Supplies (1:N, always read with product)
  supplies: [
    {
      _id: ObjectId("..."),              // MongoDB internal ID
      identity_id: "supply-uuid-001",    // External reference key (for webhooks)
      name: "Farinha de Trigo",
      value: 8.50,                       // Price per unit
      qt: 1000,                          // Quantity in package (e.g., 1000g)
      qtvalue: 500,                      // Quantity used in recipe (e.g., 500g)
      unit: "G",                         // KG, G, L, ML, UNID
      // Computed: (value * qtvalue) / qt, with KG→G conversion
      computed_cost: 4.25
    },
    {
      _id: ObjectId("..."),
      identity_id: "supply-uuid-002",
      name: "Açúcar",
      value: 5.00,
      qt: 1000,
      qtvalue: 200,
      unit: "G",
      computed_cost: 1.00
    }
  ],
  
  // Embedded Recipes (1:N, always read with product)
  recipes: [
    {
      _id: ObjectId("..."),
      identity_id: "recipe-uuid-001",    // External reference key (for webhooks)
      recipe_name: "Massa Base",
      quantity: 2,                       // How many times this recipe is used
      yieldvalue: 1000,                  // Recipe yield amount
      yieldvalueunit: 1,                 // Yield unit multiplier
      myprice: 0,
      myprof: 0,
      profit: 0,
      total: 15.00,                      // Recipe total cost
      totalwithtax: 17.25,
      margemper: "25",
      
      // Embedded Recipe Products (Ingredients) - 1:N from Recipe
      products: [
        {
          _id: ObjectId("..."),
          identity_id: "recipe-prod-uuid-001",
          recipe_product_name: "Ovos",
          value: 12.00,                  // Price per unit (dozen)
          status: "ACTIVE",
          qt: 12,                        // Units per package (12 eggs)
          qtvalue: 4,                    // Units used (4 eggs)
          unit: "UNID",
          computed_cost: 4.00            // (value * qtvalue) / qt
        },
        {
          _id: ObjectId("..."),
          identity_id: "recipe-prod-uuid-002",
          recipe_product_name: "Leite",
          value: 6.00,
          status: "ACTIVE",
          qt: 1000,
          qtvalue: 250,
          unit: "ML",
          computed_cost: 1.50
        }
      ]
    }
  ],
  
  // Metadata
  created_at: ISODate("2024-01-15T10:30:00Z"),
  updated_at: ISODate("2024-01-20T14:45:00Z"),
  
  // Versioning for optimistic locking (optional)
  version: 15
}
```

### Collection: `recipes` (Optional - for independent access)

> **Only create if recipes need to be queried/updated independently of products.**
> Current webhook endpoints (`/api/product/update/recipe`, `/api/product/delete/recipe`) operate via `recipe_identity_id` + `userid`, which can be served by querying the `products` collection with `userid` + `recipes.identity_id`. A separate collection adds complexity without benefit unless recipes are shared across products.

If needed for shared recipes across products:

```javascript
{
  _id: ObjectId("..."),
  identity_id: "recipe-uuid-001",        // Unique across all products
  userid: "3DtXXvgec9SBYtgT3whh1fsfaTC3",
  recipe_name: "Massa Base",
  quantity: 1,
  yieldvalue: 1000,
  yieldvalueunit: 1,
  myprice: 0,
  myprof: 0,
  profit: 0,
  total: 15.00,
  totalwithtax: 17.25,
  margemper: "25",
  products: [ /* same as embedded above */ ],
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

### Collection: `supplies` (Optional - for independent access)

> **Only create if supplies need to be queried/updated independently.**
> Current webhook endpoints (`/api/product/update/supply`, `/api/product/delete/supply`) operate via `supply_identity_id` + `userid`, served by querying `products` collection.

If needed for shared supplies catalog:

```javascript
{
  _id: ObjectId("..."),
  identity_id: "supply-uuid-001",
  userid: "3DtXXvgec9SBYtgT3whh1fsfaTC3",
  name: "Farinha de Trigo",
  value: 8.50,
  qt: 1000,
  unit: "G",
  created_at: ISODate("..."),
  updated_at: ISODate("...")
}
```

---

## Indexing Strategy

### Primary Collection: `products`

```javascript
// 1. Primary query: Get all products for user (sorted by created_at desc)
db.products.createIndex({ userid: 1, created_at: -1 });

// 2. Get single product by ID (with user verification)
db.products.createIndex({ _id: 1, userid: 1 });

// 3. Webhook: Find product containing recipe by identity_id
db.products.createIndex({ userid: 1, "recipes.identity_id": 1 });

// 4. Webhook: Find product containing supply by identity_id
db.products.createIndex({ userid: 1, "supplies.identity_id": 1 });

// 5. Recalculation: Scan all products for user
// Covered by index #1
```

### Optional Collections

```javascript
// recipes collection (if created)
db.recipes.createIndex({ userid: 1, identity_id: 1 }, { unique: true });
db.recipes.createIndex({ userid: 1, created_at: -1 });

// supplies collection (if created)
db.supplies.createIndex({ userid: 1, identity_id: 1 }, { unique: true });
db.supplies.createIndex({ userid: 1, name: 1 });
```

---

## Migration Mapping

| PostgreSQL | MongoDB | Notes |
|------------|---------|-------|
| `products.id` | `products._id` | Auto-generated ObjectId |
| `products.userid` | `products.userid` | Partition/shard key |
| `products.product_name` | `products.product_name` | |
| `products.profit_percentage` | `products.profit_percentage` | |
| `products.price` | `products.price` | |
| `products.product_cost` | `products.product_cost` | Computed field |
| `products.product_cost_with_tax` | `products.product_cost_with_tax` | Computed field |
| `products.product_cost_with_markup` | `products.product_cost_with_markup` | Computed field |
| `products.product_cost_with_markup_tax` | `products.product_cost_with_markup_tax` | Computed field |
| `products.total_fichas` | `products.total_fichas` | Denormalized sum of recipes |
| `products.total_extras` | `products.total_extras` | Denormalized sum of supplies |
| `products.created_at` | `products.created_at` | |
| `products.updated_at` | `products.updated_at` | |
| `products_supplies.id` | `products.supplies[i]._id` | Embedded ObjectId |
| `products_supplies.supply_identity_id` | `products.supplies[i].identity_id` | **Critical for webhooks** |
| `products_supplies.supply_name` | `products.supplies[i].name` | |
| `products_supplies.value` | `products.supplies[i].value` | |
| `products_supplies.qt` | `products.supplies[i].qt` | |
| `products_supplies.qtvalue` | `products.supplies[i].qtvalue` | |
| `products_supplies.unit` | `products.supplies[i].unit` | |
| `products_recipes.id` | `products.recipes[i]._id` | Embedded ObjectId |
| `products_recipes.recipe_identity_id` | `products.recipes[i].identity_id` | **Critical for webhooks** |
| `products_recipes.recipe_name` | `products.recipes[i].recipe_name` | |
| `products_recipes.myprice` | `products.recipes[i].myprice` | |
| `products_recipes.myprof` | `products.recipes[i].myprof` | |
| `products_recipes.profit` | `products.recipes[i].profit` | |
| `products_recipes.total` | `products.recipes[i].total` | |
| `products_recipes.totalwithtax` | `products.recipes[i].totalwithtax` | |
| `products_recipes.yieldvalue` | `products.recipes[i].yieldvalue` | |
| `products_recipes.yieldvalueunit` | `products.recipes[i].yieldvalueunit` | |
| `products_recipes.quantity` | `products.recipes[i].quantity` | |
| `products_recipes.margemper` | `products.recipes[i].margemper` | |
| `products_recipes_products.id` | `products.recipes[i].products[j]._id` | Embedded ObjectId |
| `products_recipes_products.recipes_products_identity_id` | `products.recipes[i].products[j].identity_id` | |
| `products_recipes_products.recipe_product_name` | `products.recipes[i].products[j].recipe_product_name` | |
| `products_recipes_products.value` | `products.recipes[i].products[j].value` | |
| `products_recipes_products.status` | `products.recipes[i].products[j].status` | |
| `products_recipes_products.qt` | `products.recipes[i].products[j].qt` | |
| `products_recipes_products.qtvalue` | `products.recipes[i].products[j].qtvalue` | |
| `products_recipes_products.unit` | `products.recipes[i].products[j].unit` | |

---

## Query Patterns in MongoDB

### 1. Get All Products for User
```javascript
// PostgreSQL: SELECT * FROM products WHERE userid = $1 ORDER BY id DESC
db.products.find({ userid: userId }).sort({ created_at: -1 }).toArray();
```

### 2. Get Product with Supplies & Recipes
```javascript
// PostgreSQL: 4 queries with JOINs
// MongoDB: Single document fetch
db.products.findOne({ _id: ObjectId(productId), userid: userId });
```

### 3. Create Product with Supplies & Recipes
```javascript
// PostgreSQL: 4 INSERT statements in transaction
// MongoDB: Single atomic insert
const productDoc = {
  userid: userId,
  product_name: name,
  profit_percentage: prof,
  price: price,
  product_cost: cost,
  product_cost_with_tax: costWithTax,
  product_cost_with_markup: costWithMarkup,
  product_cost_with_markup_tax: costWithMarkupTax,
  total_fichas: totalFichas,
  total_extras: totalExtras,
  supplies: supplies.map(s => ({ ...s, _id: new ObjectId() })),
  recipes: recipes.map(r => ({
    ...r,
    _id: new ObjectId(),
    products: r.products.map(p => ({ ...p, _id: new ObjectId() }))
  })),
  created_at: new Date(),
  updated_at: new Date(),
  version: 1
};
db.products.insertOne(productDoc);
```

### 4. Update Product (Replace Supplies & Recipes)
```javascript
// PostgreSQL: UPDATE product + DELETE/INSERT supplies + DELETE/INSERT recipes
// MongoDB: Single atomic update with $set
db.products.updateOne(
  { _id: ObjectId(productId), userid: userId },
  {
    $set: {
      product_name: name,
      profit_percentage: prof,
      price: price,
      product_cost: cost,
      product_cost_with_tax: costWithTax,
      product_cost_with_markup: costWithMarkup,
      product_cost_with_markup_tax: costWithMarkupTax,
      total_fichas: totalFichas,
      total_extras: totalExtras,
      supplies: supplies.map(s => ({ ...s, _id: new ObjectId() })),
      recipes: recipes.map(r => ({
        ...r,
        _id: new ObjectId(),
        products: r.products.map(p => ({ ...p, _id: new ObjectId() }))
      })),
      updated_at: new Date(),
      version: { $inc: 1 }
    }
  }
);
```

### 5. Update Single Recipe (Webhook)
```javascript
// PostgreSQL: Complex UPDATE with subquery + DELETE/INSERT recipe_products
// MongoDB: Array filter update
db.products.updateOne(
  { userid: userId, "recipes.identity_id": recipeId },
  {
    $set: {
      "recipes.$[recipe].recipe_name": body.name,
      "recipes.$[recipe].myprice": body.myPrice,
      "recipes.$[recipe].myprof": body.myProf,
      "recipes.$[recipe].profit": body.profit,
      "recipes.$[recipe].total": body.total,
      "recipes.$[recipe].totalwithtax": body.totalWithTax,
      "recipes.$[recipe].yieldvalue": body.yieldValue,
      "recipes.$[recipe].yieldvalueunit": body.yieldValueUnit,
      "recipes.$[recipe].margemper": body.profMargemPer,
      "recipes.$[recipe].quantity": body.quantity,
      "recipes.$[recipe].products": body.products.map(p => ({
        ...p,
        _id: new ObjectId()
      })),
      updated_at: new Date()
    },
    $inc: { version: 1 }
  },
  { arrayFilters: [{ "recipe.identity_id": recipeId }] }
);
```

### 6. Delete Single Recipe (Webhook)
```javascript
// PostgreSQL: DELETE FROM products_recipes WHERE recipe_identity_id = $1...
// MongoDB: $pull from array
db.products.updateOne(
  { userid: userId },
  {
    $pull: { recipes: { identity_id: recipeId } },
    $inc: { version: 1 },
    $set: { updated_at: new Date() }
  }
);
```

### 7. Update Single Supply (Webhook)
```javascript
// PostgreSQL: UPDATE products_supplies WHERE supply_identity_id = $1...
// MongoDB: Array filter update
db.products.updateOne(
  { userid: userId, "supplies.identity_id": supplyId },
  {
    $set: {
      "supplies.$[supply].name": supply.name,
      "supplies.$[supply].qt": supply.qt,
      "supplies.$[supply].qtvalue": supply.qtValue,
      "supplies.$[supply].unit": supply.unit,
      "supplies.$[supply].value": supply.value,
      updated_at: new Date()
    },
    $inc: { version: 1 }
  },
  { arrayFilters: [{ "supply.identity_id": supplyId }] }
);
```

### 8. Delete Single Supply (Webhook)
```javascript
db.products.updateOne(
  { userid: userId },
  {
    $pull: { supplies: { identity_id: supplyId } },
    $inc: { version: 1 },
    $set: { updated_at: new Date() }
  }
);
```

### 9. Recalculate All Products (Aggregation Pipeline)
```javascript
// PostgreSQL: Stored procedure with loop + function calls
// MongoDB: Aggregation pipeline (can be run as background job)

db.products.aggregate([
  { $match: { userid: userId } },
  {
    $set: {
      total_extras: {
        $sum: {
          $map: {
            input: "$supplies",
            as: "s",
            in: {
              $let: {
                vars: {
                  baseCost: { $multiply: ["$$s.value", { $divide: ["$$s.qtvalue", "$$s.qt"] }] }
                },
                in: {
                  $cond: [
                    { $eq: ["$$s.unit", "KG"] },
                    { $divide: ["$$baseCost", 1000] },
                    "$$baseCost"
                  ]
                }
              }
            }
          }
        }
      },
      total_fichas: {
        $sum: {
          $map: {
            input: "$recipes",
            as: "r",
            in: {
              $multiply: [
                { $divide: ["$$r.total", "$$r.yieldvalue"] },
                "$$r.quantity"
              ]
            }
          }
        }
      }
    }
  },
  {
    $set: {
      product_cost: { $add: ["$total_extras", "$total_fichas"] },
      product_cost_with_tax: {
        $add: ["$product_cost", { $multiply: ["$product_cost", { $divide: [tax, 100] }] }]
      },
      product_cost_with_markup: {
        $add: ["$product_cost", { $multiply: ["$product_cost", { $divide: [markup, 100] }] }]
      },
      product_cost_with_markup_tax: {
        $add: [
          "$product_cost_with_markup",
          { $multiply: ["$product_cost_with_markup", { $divide: [tax, 100] }] }
        ]
      },
      updated_at: new Date()
    }
  },
  { $merge: { into: "products", on: "_id", whenMatched: "merge" } }
]);
```

---

## Data Validation Rules

### Product Document Validation
```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userid", "product_name"],
      properties: {
        userid: { bsonType: "string" },
        product_name: { bsonType: "string", maxLength: 100 },
        profit_percentage: { bsonType: "string" },
        price: { bsonType: "double", minimum: 0 },
        product_cost: { bsonType: "double", minimum: 0 },
        product_cost_with_tax: { bsonType: "double", minimum: 0 },
        product_cost_with_markup: { bsonType: "double", minimum: 0 },
        product_cost_with_markup_tax: { bsonType: "double", minimum: 0 },
        total_fichas: { bsonType: "double", minimum: 0 },
        total_extras: { bsonType: "double", minimum: 0 },
        supplies: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["identity_id", "name", "value", "qt", "qtvalue", "unit"],
            properties: {
              identity_id: { bsonType: "string" },
              name: { bsonType: "string", maxLength: 100 },
              value: { bsonType: "double", minimum: 0 },
              qt: { bsonType: "int", minimum: 1 },
              qtvalue: { bsonType: "double", minimum: 0 },
              unit: { bsonType: "string", enum: ["KG", "G", "L", "ML", "UNID"] }
            }
          }
        },
        recipes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["identity_id", "recipe_name", "quantity"],
            properties: {
              identity_id: { bsonType: "string" },
              recipe_name: { bsonType: "string", maxLength: 100 },
              quantity: { bsonType: "double", minimum: 0 },
              yieldvalue: { bsonType: "double", minimum: 0 },
              yieldvalueunit: { bsonType: "double", minimum: 0 },
              total: { bsonType: "double", minimum: 0 },
              totalwithtax: { bsonType: "double", minimum: 0 },
              products: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  required: ["identity_id", "recipe_product_name", "value", "qt", "qtvalue", "unit"],
                  properties: {
                    identity_id: { bsonType: "string" },
                    recipe_product_name: { bsonType: "string", maxLength: 100 },
                    value: { bsonType: "double", minimum: 0 },
                    status: { bsonType: "string", enum: ["ACTIVE", "INACTIVE"] },
                    qt: { bsonType: "int", minimum: 1 },
                    qtvalue: { bsonType: "double", minimum: 0 },
                    unit: { bsonType: "string", enum: ["KG", "G", "L", "ML", "UNID"] }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});
```

---

## Sharding Strategy

For multi-tenant scale, shard on `userid`:

```javascript
sh.shardCollection("pricing.products", { userid: "hashed" });
```

This ensures:
- All data for a user resides on same shard
- Webhook queries (`userid` + `identity_id`) are targeted
- Recalculation scans single shard per user

---

## Trade-offs & Considerations

### Advantages
| Aspect | Benefit |
|--------|---------|
| Read Performance | Single document fetch for product + supplies + recipes |
| Write Atomicity | Product + supplies + recipes in single atomic operation |
| No JOINs | Eliminates expensive cross-table joins |
| Flexible Schema | Recipe products vary per recipe naturally |
| Horizontal Scaling | Sharding on `userid` scales linearly |

### Considerations
| Concern | Mitigation |
|---------|------------|
| Document Size | Max 16MB; typical product < 100KB. Monitor if recipes grow large. |
| Array Updates | Use `$position` / arrayFilters for precise updates. |
| Concurrent Updates | Use `version` field for optimistic locking. |
| Recipe Sharing | If recipes shared across products, extract to separate collection. |
| Supply Catalog | If supplies reused, extract to separate collection with references. |

---

## Migration Checklist

- [ ] Create `products` collection with validation schema
- [ ] Create indexes per strategy above
- [ ] Write migration script (PostgreSQL → MongoDB)
- [ ] Implement MongoDB data access layer (replace `db.js` modules)
- [ ] Update API controllers to use new data layer
- [ ] Add optimistic locking (`version` field) to update operations
- [ ] Implement aggregation-based recalculation job
- [ ] Load test with production data volumes
- [ ] Plan rollback strategy (dual-write period)

---

## Appendix: Example Document (JSON)

```json
{
  "_id": { "$oid": "65a1b2c3d4e5f6789012345" },
  "userid": "3DtXXvgec9SBYtgT3whh1fsfaTC3",
  "product_name": "Bolo de Chocolate Premium",
  "profit_percentage": "35",
  "price": 55.00,
  "product_cost": 28.50,
  "product_cost_with_tax": 32.78,
  "product_cost_with_markup": 38.48,
  "product_cost_with_markup_tax": 44.25,
  "total_fichas": 15.30,
  "total_extras": 13.20,
  "supplies": [
    {
      "_id": { "$oid": "65a1b2c3d4e5f6789012346" },
      "identity_id": "sup-001",
      "name": "Cacau em Pó",
      "value": 45.00,
      "qt": 1000,
      "qtvalue": 100,
      "unit": "G",
      "computed_cost": 4.50
    },
    {
      "_id": { "$oid": "65a1b2c3d4e5f6789012347" },
      "identity_id": "sup-002",
      "name": "Manteiga",
      "value": 28.00,
      "qt": 500,
      "qtvalue": 200,
      "unit": "G",
      "computed_cost": 11.20
    }
  ],
  "recipes": [
    {
      "_id": { "$oid": "65a1b2c3d4e5f6789012348" },
      "identity_id": "rec-001",
      "recipe_name": "Massa de Chocolate",
      "quantity": 1,
      "yieldvalue": 1000,
      "yieldvalueunit": 1,
      "myprice": 0,
      "myprof": 0,
      "profit": 0,
      "total": 18.50,
      "totalwithtax": 21.28,
      "margemper": "30",
      "products": [
        {
          "_id": { "$oid": "65a1b2c3d4e5f6789012349" },
          "identity_id": "rpi-001",
          "recipe_product_name": "Ovos",
          "value": 18.00,
          "status": "ACTIVE",
          "qt": 12,
          "qtvalue": 6,
          "unit": "UNID",
          "computed_cost": 9.00
        },
        {
          "_id": { "$oid": "65a1b2c3d4e5f6789012350" },
          "identity_id": "rpi-002",
          "recipe_product_name": "Farinha",
          "value": 8.00,
          "status": "ACTIVE",
          "qt": 1000,
          "qtvalue": 300,
          "unit": "G",
          "computed_cost": 2.40
        }
      ]
    }
  ],
  "created_at": { "$date": "2024-01-15T10:30:00Z" },
  "updated_at": { "$date": "2024-01-20T14:45:00Z" },
  "version": 12
}
```