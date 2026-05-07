<!-- generated-by: gsd-doc-writer -->

# Development Guide

## Local Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd hivemind
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   Requires Node.js `>=20.0.0` and OpenCode `>=1.14.28` (peer dependency).

3. **Build the project:**

   ```bash
   npm run build
   ```

   This runs `clean` (removes `dist/`) then compiles TypeScript from `src/` to `dist/` with declarations and source maps.

4. **Run tests to verify:**

   ```bash
   npm test
   ```

No environment variables are required for local development. All runtime values fall back to hardcoded defaults in `src/lib/runtime-policy.ts`. For runtime overrides, see [Configuration](../configuration/settings.md).

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run clean` | Remove the `dist/` output directory |
| `npm run build` | Clean + compile TypeScript (`tsc`) to `dist/` — generates declarations, declaration maps, and source maps |
| `npm run typecheck` | Type-check without emitting files — equivalent to `tsc --noEmit` |
| `npm test` | Run all tests with Vitest (`vitest run`) |
| `npm run test:watch` | Run tests in watch mode (`vitest`) — re-runs on file changes |
| `npm run test:coverage` | Run tests with coverage report (`vitest run --coverage`) — covers `src/**/*.ts`, excludes `src/index.ts` |
| `npm run prepack` | Runs `npm run build` — triggered automatically by `npm pack` / `npm publish` |

## Code Style

The project enforces code quality through TypeScript strict mode rather than external linters or formatters. No ESLint, Prettier, or Biome configuration files exist in the repository.

**TypeScript Configuration** (`tsconfig.json`):

| Setting | Value |
|---------|-------|
| `target` | `ES2022` |
| `module` / `moduleResolution` | `NodeNext` |
| `strict` | `true` |
| `noUnusedLocals` | `true` |
| `noUnusedParameters` | `true` |
| `noImplicitReturns` | `true` |
| `noFallthroughCasesInSwitch` | `true` |
| `verbatimModuleSyntax` | `true` |
| `declaration` / `declarationMap` | `true` |
| `sourceMap` | `true` |

**Key conventions from the architecture:**

- **`[Harness]` prefix** on all thrown errors for flow control and debugging.
- **No `any` types on new code** — the `client: any` in plugin.ts is acknowledged tech debt from the SDK's opaque typing.
- **Use `import type` for type-only imports** — required by `verbatimModuleSyntax: true`.
- **Deep-clone-on-read** in `continuity.ts` — prevents mutation aliasing on persistent state.
- **Max module size: 500 LOC** — modules like `continuity.ts` (~455 LOC) and `delegation-manager.ts` (~470 LOC) are monitored for further extraction.
- **No circular dependencies** — `src/lib/types.ts` is the root leaf module.
- **Maximum dependency chain: 2 levels** — `types.ts → module_A → module_B`.
- **CQRS boundary**: Tools mutate state (command side), hooks observe events (query side). See [Architecture Overview](../architecture/overview.md) for the full component diagram.

## Branch Conventions

Branch naming follows a loose prefix convention based on the type of work:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New feature development | `feature/harness-implementation` |
| `refactor/` | Code restructuring | `refactor/framework-v3` |
| `dev-` | General development stream | `dev-v3` |
| `feat/` | Older feature branches | `feat/v2_9-c-guardrail` |

The default branch is `master`. Use descriptive kebab-case names after the prefix.

## PR Process

No pull request template (`.github/PULL_REQUEST_TEMPLATE.md`) or `CONTRIBUTING.md` file exists in the repository. When submitting a pull request:

- **Commit message format:** Conventional commit style is used — `type(scope): description` (e.g., `feat(66): implement recovery engine`, `fix(supervisor): replace tautological check`, `docs(jsdoc): add JSDoc to 15 modules`). GSD-style phase prefixes are also common (`phase: what changed — why it matters`).
- **Run tests before pushing:** `npm test` should pass with the configured coverage thresholds (statements: 85%, branches: 72%, functions: 85%, lines: 85%).
- **Type-check:** `npm run typecheck` must pass with no errors.
- **Describe what changed and why** in the PR description. Link to any related issues or phase plans.

## Architecture Rules

All code changes must respect these non-negotiable architecture rules (from the [Architecture Overview](../architecture/overview.md)):

1. **No circular dependencies** across the module graph.
2. **Maximum dependency chain depth: 2 levels**.
3. **Max module size: 500 LOC** — extract submodules when approaching this limit.
4. **`[Harness]` prefix** on all thrown errors.
5. **No `any` types** on new code (acknowledged exception: `client: any` in plugin.ts from SDK typing).
6. **`verbatimModuleSyntax: true`** — use `import type` for type-only imports.
7. **CQRS separation**: tools are write-side (commands), hooks are read-side (queries) — no hook mutates state, no tool is purely read-only.

### Module dependency rules

- `src/lib/types.ts` is the **leaf module** — it depends on nothing and is imported by nearly every module.
- `src/lib/helpers.ts` is near-leaf — pure utilities with no project-internal dependencies.
- `src/lib/concurrency.ts` and `src/lib/completion-detector.ts` are leaf/near-leaf.
- `src/lib/lifecycle-manager.ts` is the deepest consumer chain (2 levels deep).
- `src/plugin.ts` is the composition root — a thin factory (~165 LOC) with zero business logic; all logic lives in the individual hook factory modules and tool implementations.

### Where to change things

| Task | File |
|------|------|
| Change session persistence | `src/lib/continuity.ts` |
| Add a lifecycle phase | `src/lib/types.ts` + `src/lib/lifecycle-manager.ts` |
| Change SDK call patterns | `src/lib/session-api.ts` |
| Change concurrency model | `src/lib/concurrency.ts` |
| Change delegation behavior | `src/lib/delegation-manager.ts` |
| Change completion detection | `src/lib/completion-detector.ts` |
| Change tool response envelope | `src/shared/tool-response.ts` |
| Register a new tool | `src/plugin.ts` (composition registration) + `src/tools/` (implementation) |
| Add a new hook | `src/plugin.ts` (wiring) + `src/hooks/` (factory implementation) |
| Change runtime policies/defaults | `src/lib/runtime-policy.ts` |
| Add Zod validation schemas | `src/schema-kernel/` |

## Next Steps

- See [Architecture Overview](../architecture/overview.md) for the component diagram, data flow, and CQRS boundary.
- See [Configuration](../configuration/settings.md) for environment variables, runtime policies, and override mechanisms.
- See the [Testing Guide](../testing.md) for test framework details, coverage thresholds, and CI integration.
