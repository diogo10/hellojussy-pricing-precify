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
