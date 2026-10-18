# Repository Guidelines

## Project Structure & Module Organization

This repository contains a TypeScript backend built with Express 5 and Prisma 8. Application code lives in `src/`: request handlers in `controllers/`, HTTP endpoints in `routes/`, authentication and API key checks in `middleware/`, request schemas in `validation/`, and shared declarations in `types/`. Prisma's contract and generated artifacts are in `src/prisma/`; migration plans and snapshots are under `migrations/`. Keep new code in the corresponding existing module rather than adding unrelated root-level files.

## Build, Test, and Development Commands

- `npm install` installs dependencies from the lockfile.
- `npm run contract:emit` runs `prisma contract emit` to regenerate contract artifacts after editing `src/prisma/contract.prisma`.
- `npx tsc --noEmit` checks TypeScript using the repository's `tsconfig.json`.

There is currently no configured server start or build script. `npm test` is a placeholder that intentionally exits with an error because no test suite is configured yet; do not treat it as a passing test command. Set `DATABASE_URL` in a local `.env` based on `.env.example` before database-backed Prisma operations.

## Coding Style & Naming Conventions

Use TypeScript ESM imports, including `.js` extensions in relative imports as in `src/app.ts`. Follow the existing two-space indentation and semicolon style. Use `camelCase` for variables and functions, `PascalCase` for types, and descriptive lowercase dotted filenames such as `account.controller.ts` and `api.routes.ts`. Keep request validation in Zod schemas and preserve the strict compiler settings in `tsconfig.json`.

## Testing Guidelines

No test files or test framework configuration are present. When adding behavior, add focused tests alongside an established test setup or propose the required scripts and configuration in the same change. Until then, use `npx tsc --noEmit` for a static type check; database changes should also regenerate and review the Prisma contract artifacts and migration output.

## Commit & Pull Request Guidelines

The available Git history contains only an `Initial commit`, so no established commit convention can be inferred. Use short, imperative commit subjects (for example, `Add account balance validation`). Pull requests should explain the behavior change, note any API or database contract impact, list validation performed, and link the related issue when one exists. Include request/response examples when changing endpoints.

## Security & Configuration

Keep credentials and local environment values in `.env`; never commit secrets. Update `.env.example` when adding required configuration, using safe placeholders. Treat authentication, API key handling, and database migrations as security-sensitive changes and describe their impact in the pull request.
