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

## 5. Repository Pattern & Database Abstraction Layer

### Overview
This project implements a **Repository Pattern** with a **Database Abstraction Layer** to support both **PostgreSQL** and **MongoDB** without coupling business logic to specific database drivers.

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
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│  PostgreSQL Implementation  │   │  MongoDB Implementation  │
│  repositories/postgres/     │   │  repositories/mongo/     │
└─────────────────────────┘   └─────────────────────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
              ┌─────────────────────────┐
              │   RepositoryFactory     │
              │   (Database Selection)  │
              └─────────────────────────┘
```

### Directory Structure
```
repositories/
├── interfaces/           # Domain contracts (TypeScript interfaces)
│   ├── IProductRepository.ts
│   ├── ISupplyRepository.ts
│   ├── IRecipeRepository.ts
│   ├── IRecalculationRepository.ts
│   └── index.ts
├── postgres/             # PostgreSQL implementations
│   ├── ProductRepository.ts
│   ├── SupplyRepository.ts
│   ├── RecipeRepository.ts
│   ├── RecalculationRepository.ts
│   └── index.ts
├── mongo/                # MongoDB implementations
│   ├── ProductRepository.ts
│   ├── SupplyRepository.ts
│   ├── RecipeRepository.ts
│   ├── RecalculationRepository.ts
│   └── index.ts
├── RepositoryFactory.ts  # Factory for DB-agnostic instantiation
└── index.ts              # Barrel exports
```

### Key Principles

1. **Interface Segregation**: Each repository interface defines only the methods needed by its consumers.

2. **Dependency Inversion**: Services depend on interfaces (`IProductRepository`), not concrete implementations (`PostgresProductRepository`).

3. **Factory Pattern**: `RepositoryFactory` creates the correct implementation based on configuration (`postgres` | `mongodb`).

4. **Constructor Injection**: Services receive repositories via constructor, enabling easy testing with mocks.

### Usage

#### Configuration (at application bootstrap)
```typescript
import { RepositoryFactory } from './repositories/RepositoryFactory.js';
import { Pool } from 'pg';
import { Db } from 'mongodb';

// For PostgreSQL
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
RepositoryFactory.initialize({ type: 'postgres', pgPool });

// For MongoDB
const mongoClient = new MongoClient(process.env.MONGODB_URI);
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

### Adding a New Database Implementation

1. Create a new folder under `repositories/` (e.g., `repositories/mysql/`)
2. Implement all four repository interfaces:
   - `IProductRepository`
   - `ISupplyRepository`
   - `IRecipeRepository`
   - `IRecalculationRepository`
3. Export implementations from `repositories/mysql/index.ts`
4. Add a case in `RepositoryFactory.createXxxRepository()` methods
5. Add the new type to `DatabaseType` union in `RepositoryFactory.ts`

### Testing Strategy

- **Unit Tests**: Mock repository interfaces using `vitest`/`jest` mocks
- **Integration Tests**: Use testcontainers for PostgreSQL and MongoDB
- **Contract Tests**: Verify all implementations satisfy interface contracts

```typescript
// Example: Unit test with mocked repository
import { vi } from 'vitest';
import { ProductService } from './ProductService.js';
import { IProductRepository } from '../repositories/interfaces/index.js';

const mockProductRepo = vi.fn() as unknown as IProductRepository;
mockProductRepo.findAllByUserId.mockResolvedValue([...]);

const service = new ProductService(mockProductRepo, ...);
```

### Current Implementation Status

| Repository | PostgreSQL | MongoDB | Interface |
|------------|:----------:|:-------:|:---------:|
| Product    | ✅         | ✅      | ✅        |
| Supply     | ✅         | ✅      | ✅        |
| Recipe     | ✅         | ✅      | ✅        |
| Recalculation | ✅      | ⚠️ Partial | ✅     |

**Note**: MongoDB `RecalculationRepository` has a simplified implementation. Full parity requires MongoDB aggregation pipelines matching PostgreSQL stored procedures.

### Migration Guide (PostgreSQL → MongoDB)

1. Set `MONGODB_URI` environment variable
2. Change `RepositoryFactory.initialize({ type: 'mongodb', mongoDb })`
3. Run MongoDB schema migration (create collections, indexes)
4. Verify all integration tests pass
5. Deploy with feature flag for gradual rollout

### Best Practices

- **Never** import `pg` or `mongodb` directly in services/controllers
- **Always** use repository interfaces for type hints
- **Prefer** `Promise.all()` for parallel queries in `findById` methods
- **Handle** `ObjectId` conversion explicitly in MongoDB implementations
- **Use** transactions in PostgreSQL for multi-table operations (create product + supplies + recipes)
- **Avoid** singleton `RepositoryFactory` in tests; use `reset()` or create fresh instances