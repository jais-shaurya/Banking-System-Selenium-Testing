# Repository Guidelines

## Project Structure & Module Organization

This repository contains the banking application’s React frontend. Application code lives in `src/`: `App.tsx` and `main.tsx` provide the app entry points, while feature components such as `Accounts.tsx`, `Dashboard.tsx`, `Register.tsx`, `Transactions.tsx`, and `Transfers.tsx` implement the screens. Keep feature-specific styles alongside their components (for example, `Accounts.css`); shared styles are in `index.css` and `App.css`. `api.ts` contains API integration. Put static files in `public/` and imported assets in `src/assets/`.

## Build, Test, and Development Commands

- `npm install` installs dependencies from the lockfile.
- `npm run dev` starts the Vite development server with hot reload.
- `npm run build` runs the TypeScript project build, then creates the production bundle in `dist/`.
- `npm run lint` runs Oxlint.
- `npm run preview` serves the built bundle locally; run `npm run build` first.

There is currently no test script or test suite configured. For UI or API changes, run the build and lint commands and manually exercise the affected flow in the dev server.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Follow the existing two-space indentation, semicolon use, and double-quoted strings. Name React components and component files in PascalCase (`Dashboard.tsx`); use lower camel case for functions, variables, and API helpers. Keep component styles in the matching `.css` file and prefer existing shared styles before adding duplicates. Run `npm run lint` and `npm run build` before submitting changes.

## Testing Guidelines

No automated testing framework, test naming pattern, or coverage threshold is configured. Do not add tests that rely on an assumed framework; if introducing one, document its setup and commands. Until then, manually check relevant screens and interactions, including API-backed states where practical.

## Commit & Pull Request Guidelines

Recent history uses short, descriptive commit subjects, but does not show a consistent formal prefix. Keep commits focused and explain the change in the subject (for example, `Fix transfer form validation`). Pull requests should summarize user-visible changes, list validation performed, link any related issue, and include screenshots for UI changes when useful.

## Security & Configuration

Use `.env.example` to understand required frontend configuration. Keep credentials and environment-specific secrets out of source control; use local environment files for development and avoid exposing private values in browser-side configuration.
