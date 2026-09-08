# Agent Instructions: Node.js & Clean Architecture

This file provides technical instructions, strict coding boundaries, and clean-code constraints for AI coding agents working on this Node.js repository.

## 1. Project Stack & Commands
- **Runtime:** Node.js (v20+), ES Modules (`"type": "module"`), TypeScript.
- **Verification Commands:**
  - Build check: `npm run build`
  - Linting & Formatting: `npm run lint` / `npm run format`
  - Test runner: `npm test`

## 2. Architecture & Clean Code Rules
Follow strict Clean Architecture and SOLID principles.

### Dependency Inversion & Injection
- Never instantiate dependencies inside a class or controller (e.g., no `new UserRepository()`).
- Always use Constructor Injection to inject dependencies as interfaces/types.
- Keep business logic completely decoupled from Express/fastify routing or database ORMs.

### Functions & Control Flow
- **Single Responsibility (SRP):** Functions must do one thing. Keep them under 25 lines.
- **Fail Fast & Guard Clauses:** Return early to eliminate deeply nested `if/else` statements.
- **Error Handling:** Always wrap asynchronous blocks in explicit `try/catch` blocks or leverage a global async error middleware. Never swallow errors (`catch (e) {}` is forbidden).

## 3. Style & Syntax Conventions
- **Naming:** `camelCase` for variables/functions, `PascalCase` for classes/interfaces, `UPPER_SNAKE_CASE` for constants, `kebab-case` for files.
- **Variables:** Use `const` by default. Never use `var`. Use `let` only for re-assigned loop counters or accumulators.
- **Null Safety:** Prefer Optional Chaining (`?.`) and Nullish Coalescing (`??`) over manual falsy checks.

## 4. Code Pattern Example (The Standard)

### DO NOT (Anti-pattern):
```typescript
// Fat controller tightly coupled to database and framework
app.post('/user', async (req, res) => {
  if (req.body.email) {
    const user = await db.save(req.body);
    res.status(201).json(user);
  } else {
    res.status(400).send('No email');
  }
});
```

### DO (Clean Pattern):
```typescript
// Pure business logic service relying on dependency injection
export class CreateUserService {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: CreateUserDTO): Promise<User> {
    if (!data.email) throw new ValidationError('Email is required.');
    
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) throw new ConflictError('Email already exists.');

    return this.userRepository.create(data);
  }
}
```

## 5. Repository Pattern & Database Layer (MongoDB only)

### Overview
This project implements a **Repository Pattern** on **MongoDB only** (PostgreSQL support was removed). Products store supplies and recipes as embedded documents in the `products` collection, without coupling business logic to the `mongodb` driver.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                        │
│  Services (ProductService, SupplyService, RecipeService)       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Constructor Injection (Interfaces)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Layer (Interfaces)                    │
│  IProductRepository, ISupplyRepository, IRecipeRepository,     │
│  IRecalculationRepository                                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Implementation
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB Implementation (embedded documents)                    │
│  repositories/mongo/                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │   RepositoryFactory     │
              │   (MongoDB wiring)      │
              └─────────────────────────┘
```

### Directory Structure
```
repositories/
├── interfaces/           # Domain contracts (JSDoc interfaces)
│   ├── IProductRepository.js
│   ├── ISupplyRepository.js
│   ├── IRecipeRepository.js
│   ├── IRecalculationRepository.js
│   └── index.js
├── mongo/                # MongoDB implementations (only backend)
│   ├── ProductRepository.js
│   ├── SupplyRepository.js
│   ├── RecipeRepository.js
│   ├── RecalculationRepository.js
│   ├── BaseRepository.js
│   ├── EmbeddedRepository.js
│   └── index.js
├── RepositoryFactory.js  # Factory for MongoDB instantiation
└── index.js              # Barrel exports
```

### Key Principles

1. **Interface Segregation**: Each repository interface defines only the methods needed by its consumers.

2. **Dependency Inversion**: Services depend on interfaces (`IProductRepository`), not concrete implementations (`MongoProductRepository`).

3. **Factory Pattern**: `RepositoryFactory` wires the MongoDB implementations from a `mongoDb` handle. Passing `type: 'postgres'` throws a removal error.

4. **Constructor Injection**: Services receive repositories via constructor, enabling easy testing with mocks.

### Usage

#### Configuration (at application bootstrap)
```javascript
const { RepositoryFactory } = require('./repositories/RepositoryFactory.js');
const { MongoClient } = require('mongodb');

// MongoDB only
const mongoClient = new MongoClient(process.env.MONGODB_URI);
await mongoClient.connect();
const mongoDb = mongoClient.db('pricing');
RepositoryFactory.initialize({ type: 'mongodb', mongoDb });
```

#### In Services (Constructor Injection)
```typescript
export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private supplyRepository: ISupplyRepository,
    private recipeRepository: IRecipeRepository,
    private recalculationRepository: IRecalculationRepository
  ) {}

  // Factory helper for convenient instantiation
  static createFromFactory(): ProductService {
    const factory = RepositoryFactory.getInstance();
    return new ProductService(
      factory.getProductRepository(),
      factory.getSupplyRepository(),
      factory.getRecipeRepository(),
      factory.getRecalculationRepository()
    );
  }
  
  async getAllProducts(userId: string) {
    return this.productRepository.findAllByUserId(userId);
  }
}
```

### Testing Strategy

- **Unit Tests**: Mock repository interfaces using `sinon` stubs with the fake Mongo collections in `test/helpers/mongo-fakes.cjs`; run with `npm test` (mocha)
- **Integration Tests**: Set `MONGODB_URI` to run the Mongo integration suites (e.g. `recipes_queries.test.cjs`); they skip without it
- **Contract Tests**: Verify the Mongo implementations satisfy the interface contracts in `repositories/interfaces/`

```javascript
// Example: Unit test with mocked repository
const sinon = require('sinon');
const { ProductService } = require('./services/ProductService.js');

const productRepository = { findAllByUserId: sinon.stub().resolves([...]) };

const service = new ProductService(productRepository, ...);
```

### Current Implementation Status

| Repository | MongoDB | Interface |
|------------|:-------:|:---------:|
| Product    | ✅      | ✅        |
| Supply     | ✅      | ✅        |
| Recipe     | ✅      | ✅        |
| Recalculation | ✅   | ✅        |

Recalculation runs as a MongoDB aggregation pipeline in `MongoRecalculationRepository.executeRecalculate`.

### Best Practices

- **Never** import `mongodb` directly in services/controllers (wiring lives in `db.js` and the repositories)
- **Always** use repository interfaces for type hints
- **Prefer** `Promise.all()` for parallel queries in `findById` methods
- **Handle** `ObjectId` conversion explicitly in MongoDB implementations
- **Avoid** singleton `RepositoryFactory` in tests; use `reset()` or create fresh instances