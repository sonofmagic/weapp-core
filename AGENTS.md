# Repository Guidelines

## Project Structure & Module Organization
The repo is a PNPM/Turbo monorepo. Runtime clients live under `packages/*`, each with `src/`, `test/`, `tsconfig.json`, and optional `vitest.config.ts`. Build artifacts stay in `dist/`. Shared demos or integration apps sit in `apps/*`. Root configuration (e.g., `turbo.json`, `eslint.config.js`, `vitest.config.ts`, `monorepo.config.ts`) applies workspace-wide. Keep new packages aligned with this layout and register them in `pnpm-workspace.yaml` plus relevant Turbo pipelines.

## Build, Test, and Development Commands
- `pnpm install` keeps workspace dependencies in sync (requires Node >=16).
- `pnpm dev` runs `turbo run dev --parallel` to start package-specific watchers or demos.
- `pnpm build` executes `turbo run build --filter=@weapp-core/escape`; extend with `pnpm turbo run build --filter=<pkg>` for additional targets.
- `pnpm test` triggers the Vitest suite with coverage; ensure a clean run before pushing.
- `pnpm lint` fans out ESLint/Stylelint tasks via Turbo.
- `pnpm script:clean` removes generated output across workspaces.

## Coding Style & Naming Conventions
TypeScript with ES modules is the default. Use 2-space indentation, single quotes, and trailing commas—the shared `@icebreakers/eslint-config` enforces these rules. Prefer `camelCase` for functions and variables, `PascalCase` for classes/types, and kebab-case for package folders. Run `pnpm lint --filter <pkg>` or configure your editor for ESLint/Prettier on save. Stylesheets follow Stylelint defaults from `@icebreakers/stylelint-config`.

## Testing Guidelines
Vitest drives unit tests; place files in a co-located `test` folder and suffix them `.spec.ts`. Seed any fixtures under `fixtures/` (ignored by lint). Use `pnpm test:dev` for watch mode with coverage and `pnpm vitest --filter <pkg> --run` to isolate a workspace. Maintain or raise the coverage percentages reported in the CLI prior to merging.

## Commit & Pull Request Guidelines
Commit linting relies on `@icebreakers/commitlint-config` (Conventional Commits). Structure messages as `type(optional-scope): imperative summary`—for example, `feat(http): add request throttling`. Keep bodies wrapped at 100 characters and reference issues via `Refs #123` when applicable. Pull requests should explain motivation and approach, note test evidence (`pnpm test`), update docs or changelog entries where relevant, and include screenshots/GIFs for UI-facing changes under `apps/`.
