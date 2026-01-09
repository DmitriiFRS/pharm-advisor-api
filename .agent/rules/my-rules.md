---
trigger: always_on
---

# Antigravity Rules — Backend (Nest.js, MySQL, Prisma ORM)

## 1. Tech Stack

- **Framework:** Nest.js (Standard Express adapter).
- **Language:** TypeScript (Strict mode).
- **Database:** MySQL.
- **ORM:** Prisma ORM.
- **Validation:** `class-validator`, `class-transformer`.

## 2. Architecture & Code Structure

- **Layers:** Strict 3-layer architecture: `Controller` -> `Service` -> `Prisma (DB)`.
- **Business Logic:**
  - All logic must reside **ONLY** in Services.
  - Controllers are responsible ONLY for request handling, input validation (via DTO), and calling services.
  - NO business logic in Controllers.
- **Modularity:** Feature-based structure (folders organized by function: `users`, `auth`, `orders`).
- **Imports:** Use relative paths (e.g., `../../dto/create-user.dto`).

## 3. Resource Generation (Workflow)

When requested to create a new folder/resource (Feature), strictly follow this algorithm:

1.  Execute command: `nest g res ./modules/<resource_name>`.
2.  Select: **REST API**.
3.  Select: **No** (do not generate CRUD entry points).
4.  **Immediately after generation:**
    - In `*.module.ts`: Add `PrismaService` to the `providers` array.
    - In `*.service.ts`: Add the constructor:
      ```typescript
      constructor(private readonly prisma: PrismaService) {}
      ```

## 4. Prisma & Database

- **Schema (schema.prisma):**
  - Model fields: `camelCase`.
  - DB Columns: `@map("snake_case")`.
  - Relations: Use native `relation` fields.
  - Deletion: Use `onDelete: Cascade`.
- **Queries:**
  - Priority 1: `prisma.model.action()` methods (findMany, create, etc.).
  - Priority 2: `prisma.$queryRaw` (only if standard methods are insufficient).

## 5. TypeScript & Typing

- **Strict Mode:** Strictly NO `any` type.
- **Return Types:** All methods (Controllers and Services) MUST have explicit return types.
- **DTO:** All input data must be validated via DTO classes using `class-validator` decorators.

## 6. Response Format & Errors

- **Response Wrapper:** All successful responses must match the interface:
  ```json
  {
    "data": <Payload>,
    "meta": <Pagination/Extra info or null>,
    "error": null
  }
  ```
  _Return the Prisma object wrapped in this structure._
- **Error Handling:** Use standard `HttpException` from `@nestjs/common` (e.g., `NotFoundException`, `BadRequestException`).

## 7. Authentication & Current User

- **Decorator:** To access current user data (from `req.user`) in Controller methods, ALWAYS use the custom decorator `@GetUser()`.
- **Path:** `src/decorators/get-user.decorator.ts`.
- **Prohibition:** DO NOT access `req` or `req.user` directly in Controllers.
- **Example:**
  ```typescript
  getProfile(@GetUser('id') userId: number) { ... }
  // or for a specific field
  getEmail(@GetUser('email') email: string) { ... }
  ```

## 8. Agent Behavior

- **Response Style:** Provide code first, followed by a brief explanation in **Russian** ("Why this solution was chosen").
- **JSDoc:** Do NOT write JSDoc comments for methods. Code must be self-documenting.
