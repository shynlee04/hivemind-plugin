<!-- generated-by: gsd-doc-writer -->

# Contributing

## Development Setup

Contributing starts with getting the harness running locally. Full setup instructions are in the [README](./README.md#build). At a minimum:

```bash
git clone <repo-url> opencode-harness
cd opencode-harness
npm install
npm run build
npm run typecheck
```

You will need **Node.js >= 20.0.0**. The harness has no database dependencies or environment variables required for development — it runs entirely in-process against OpenCode's SDK.

For detailed architecture and module layout, see [Architecture Overview](./docs/architecture/overview.md). For runtime configuration options, see [Configuration](./docs/configuration/settings.md).

## Coding Standards

Code quality is enforced through TypeScript strict mode and test coverage, not external formatters or linters.

### TypeScript

All source files must conform to the `tsconfig.json` strict settings:

- `strict: true` — no unchecked implicit conversions
- `noUnusedLocals: true` — no dead variable declarations
- `noUnusedParameters: true` — no unused function parameters
- `noImplicitReturns: true` — all code paths must return
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noFallthroughCasesInSwitch: true`

**Before committing, always run:**

```bash
npm run typecheck
```

### Module structure

- **Max module size:** 500 LOC — if a file approaches this, extract into a focused module
- **No circular dependencies** — the module graph roots at `src/lib/types.ts`, maximum dependency chain 2 levels
- **No `any` types** on new code
- **`[Harness]` prefix** on all thrown errors for identifiable flow control
- **Deep-clone-on-read** in `continuity.ts` — all `clone*()` functions prevent mutation aliasing

### Documentation

All exported functions and classes require JSDoc with descriptions, parameters, return values, and examples. Run the `jsdoc-typescript-docs` skill for assistance.

## Testing

Tests use **Vitest** with globals enabled — no imports needed for `describe`, `it`, or `expect`.

```bash
npm test                 # Run full suite
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npx vitest run tests/lib/helpers.test.ts  # Single file
npx vitest run -t "<test name>"           # Pattern match
```

### Coverage thresholds

Coverage is enforced at these minimums (from `vitest.config.ts`):

| Type | Threshold |
|------|-----------|
| Statements | 85% |
| Branches | 72% |
| Functions | 85% |
| Lines | 85% |

Coverage covers `src/**/*.ts`, excluding barrel index files.

### Test file conventions

- Test files live in `tests/lib/` and `tests/tools/`, mirroring `src/lib/` and `src/tools/`
- File naming: `tests/*/*.test.ts`
- Use vitest globals — no `import { describe, it, expect } from 'vitest'` needed

## Branch Conventions

- The default branch is `main` — the canonical `opencode-harness` v3 source
- The `legacy/v2.x` branch is a frozen forensic reference of the original `hivemind-plugin` — do not target PRs there
- No formal branch naming convention is documented; use descriptive, lowercase branch names (e.g., `fix/concurrency-leak`, `feat/auto-decompaction`)

## Pull Request Process

1. **Type-check and test first:** Run `npm run typecheck && npm test` before opening a PR — CI may not run these automatically.
2. **Commit format:** Follow the project convention: `phase: what changed — why it matters`. Prefer small, focused commits over large squashes.
3. **Keep modules under 500 LOC:** If your change adds more than a few hundred lines to any module, extract into a dedicated file.
4. **No `any` types:** Reviewers will flag any `any` on new code.
5. **JSDoc all exports:** Every exported function, class, and interface must be documented.
6. **Open a PR against `main`:** Include a description of what changed and why. Reference any related issues or phase plans.

The harness does not use a formal PR template — describe intent clearly and include verification steps when applicable.

## Issue Reporting

- **Bugs:** Describe the symptom, steps to reproduce, expected behavior, and actual behavior. Include the harness version (`opencode-harness`) and Node.js version.
- **Feature requests:** Describe the use case the feature would serve and any constraints or non-goals.
- **Questions:** Use the [GitHub Issues](https://github.com/anomalyco/opencode-harness/issues) page to start a discussion.

No issue templates are defined for this repository — provide enough context for a contributor to understand the problem without additional questioning.
