# src/AGENTS.md

Scope: rules that apply when reading, writing, or auditing code under `src/`. Inherits the root `AGENTS.md` rules; this file deepens the type, code, and module structure rules. Source of truth for the 9-surface model: `.planning/codebase/ARCHITECTURE.md`.

## TypeScript Compiler Contract (binding)

`tsconfig.json` is the single source of truth for type rules. The following options are enabled and required:

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`, `noFallthroughCasesInSwitch: true`.
- `verbatimModuleSyntax: true` — use `import type` for type-only imports. This is non-negotiable; `tsc` will reject the build otherwise.
- `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `target: "ES2022"`, `lib: ["ES2022"]`. Output is ESM-only.
- `rootDir: "./src"`, `outDir: "./dist"`, `include: ["src/**/*"]`, `exclude: ["node_modules", "dist", "tests"]`. Tests are not built.
- `declaration: true`, `declarationMap: true`, `sourceMap: true` — published npm package must ship `.d.ts` files.

**Public type contract:** `src/shared/types.ts` is the cross-surface type hub. It may import from `coordination/delegation/types.js` but MUST NOT import from runtime modules, plugin modules, or feature modules. If you need a runtime helper, route it through `src/shared/helpers.ts` or `src/shared/session-api.ts`.

## 9-Surface Map (CQRS split)

The plugin is partitioned into 9 surfaces, each with a clear mutation authority. Read `.planning/codebase/ARCHITECTURE.md` for the full table. Summary:

| # | Surface | Path | Role |
|---|---------|------|------|
| 1 | Tools | `src/tools/` | Public tool surface; writes via library owner |
| 2 | Hooks | `src/hooks/` | Read-only observation; may transform, may not write durable state |
| 3 | Plugin | `src/plugin.ts`, `src/plugin-registration.ts`, `src/index.ts` | Composition root only |
| 4 | Shared | `src/shared/` | Types, runtime helpers, session API, errors |
| 5 | Task-Management | `src/task-management/` | Continuity, journal, lifecycle, trajectory |
| 6 | Coordination | `src/coordination/` | Concurrency, delegation, completion detection |
| 7 | Features | `src/features/` | Domain features (session-tracker, runtime-pressure, etc.) |
| 8 | Config | `src/config/` | Workflow config, schema validation |
| 9 | Routing | `src/routing/` | Behavioral profile, command engine, session entry |

**CQRS discipline:** Tools (and tool-driven features) WRITE. Hooks READ + TRANSFORM. Plugin COMPOSES. Library owners in each surface are the only writers of their own state.

## Module Size & File Layout

- **Max module size: 500 LOC.** A module crossing 500 LOC must be split at function-boundary or per-concern seams. Counted in `wc -l src/path/to/file.ts`. `.ts` and `.d.ts` count separately.
- **No circular dependencies.** If `a.ts` imports `b.ts` and `b.ts` imports `a.ts`, refactor to a shared `types.ts` or invert via interface.
- **No barrel file overuse.** `src/index.ts` is the public surface and is hand-curated. Subdirectory `index.ts` files are allowed but must not re-export everything.
- **Tests are NOT in `src/`.** Tests live under `tests/` and are excluded from the TypeScript build (see `tsconfig.json` `exclude`).

## Naming Conventions

- **Files:** kebab-case for multi-word (`plugin-registration.ts`). Single-word lowercase is allowed (`plugin.ts`, `hooks.ts`).
- **Types/Interfaces/Classes:** PascalCase. Zod schemas use camelCase with `Schema` suffix (`AgentWorkContractSchema`).
- **Functions/variables:** camelCase. Boolean predicates use `is` / `has` / `should` prefix.
- **Constants:** UPPER_SNAKE_CASE for module-level constants; `as const` for literal types.
- **Error classes:** PascalCase ending in `Error`. All thrown errors prefixed `[Harness]` in their message.
- **Module IDs:** kebab-case strings for skill/agent/command/tool IDs (e.g., `hm-l2-spec-driven-authoring`).

## JSDoc Style

- All exported functions, types, classes, and interfaces MUST have a JSDoc block. Internal helpers (not exported) MAY have a one-line comment.
- First line: brief summary, imperative mood ("Compiles a delegation record", not "This function compiles").
- Use `@param`, `@returns`, `@throws`, `@example` where the contract is non-obvious.
- Reference types with backticks, not code blocks. Reference paths with backticks: `src/shared/types.ts`.
- JSDoc is enforced by the `tsc` build only via the `noUnusedLocals` check. Linting is not gated by a tool — keep JSDoc consistent by review.

## Build & Deploy (npm scripts)

| Command | Effect |
|---------|--------|
| `npm run clean` | Delete `dist/` directory |
| `npm run build` | clean → sync-assets.js → tsc → generate-config-json-schema.js |
| `npm run typecheck` | `tsc --noEmit` — no output, validates types only |
| `npm test` | `vitest run` — full test suite, single pass |
| `npm run test:watch` | `vitest` watch mode for TDD |
| `npm run test:coverage` | `vitest run --coverage` — outputs coverage report |
| `npm run prepack` | `npm run build` (auto-runs before npm publish) |
| `postinstall` | `node scripts/sync-assets.js --mode=install` (auto-runs on `npm install`) |

**Build order matters:** Edit `assets/` first, then `node scripts/sync-assets.js` to mirror to `.opencode/`, then `npm run build` to compile + regenerate JSON schema. Do not skip the sync step — `.opencode/` is regenerable but is also the runtime that tests run against.

## Project Structure Excerpt

```
src/
├── cli/                    # CLI binary entry (hivemind command)
├── config/                 # Workflow config + Zod schemas
├── coordination/           # Concurrency, delegation, completion, spawner
│   ├── command-delegation/
│   ├── completion/
│   ├── concurrency/
│   ├── delegation/
│   ├── sdk-delegation/
│   └── spawner/
├── features/               # Domain features
│   ├── agent-work-contracts/
│   ├── auto-loop/
│   ├── background-command/
│   ├── bootstrap/          # Primitive registry + control plane
│   ├── capability-gate/
│   ├── doc-intelligence/
│   ├── governance/
│   ├── governance-engine/
│   ├── prompt-packet/
│   ├── ralph-loop/
│   ├── runtime-pressure/
│   ├── sdk-supervisor/
│   ├── session-tracker/
│   ├── tmux/
│   └── tool-intelligence/
├── hooks/                  # Lifecycle, guards, observers, transforms, composition
├── routing/                # Behavioral profile, command engine, session entry
├── schema-kernel/          # Zod-driven config JSON schema generator
├── shared/                 # Cross-surface types, runtime helpers, session API
├── sidecar/                # Local HTTP sidecar server + catalog
├── task-management/        # Continuity, journal, lifecycle, trajectory
├── tools/                  # Public tool surface (config, delegation, hivemind, prompt, session)
├── index.ts                # Public entry point (hand-curated re-exports)
├── plugin.ts               # HarnessControlPlane composition root
└── plugin-registration.ts  # Tool/hook registration sequence
```

Full tree: `.planning/codebase/STRUCTURE.md`.

## Public API Surface

The published package exports are declared in `package.json` `exports`:

- `hivemind` (or `hivemind-3.0`) → `dist/index.js` (default)
- `hivemind/plugin` → `dist/plugin.js`
- `hivemind/cli` → `dist/cli/index.js`

`src/index.ts` is the **public API contract**. Any change to a re-export here is a breaking change. Additions are allowed in minor versions; removals require a major version bump.

## Dependency Rules

- `@opencode-ai/plugin` is a `peerDependency` (and devDependency for tests). Importing from `@opencode-ai/plugin` is allowed; importing from `@opencode-ai/sdk` is also allowed.
- Optional dependencies (`@json-render/*`, `react`, `ws`, `bun-pty`) are loaded lazily via dynamic import. Do NOT add a static `import` from these — bundle size and runtime availability will be wrong.
- No `node:*` imports without checking Node.js >= 20.0.0 compatibility.
- Zod is the only schema library. Do not introduce `joi`, `yup`, `ajv`, or `valibot`.

## Error Handling

- All thrown errors are `Error` subclasses. Prefer named subclasses (e.g., `HarnessStateError`).
- Error message MUST start with `[Harness]` for grep-ability.
- For user-facing errors, include a stable `code` field and a human-readable `message`. Stack trace goes in `cause`.
- Never `throw new Error("...")` with a string-only message — use a typed error class.

## Where to Find More

- 9-surface authority table + CQRS rules: `.planning/codebase/ARCHITECTURE.md`
- File tree + placement conventions: `.planning/codebase/STRUCTURE.md`
- Source plane ownership (where each surface writes): `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md`
- Test discipline: `tests/AGENTS.md`
- State mutation authority: `.hivemind/AGENTS.md`
- OpenCode SDK surface compliance: `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md`
