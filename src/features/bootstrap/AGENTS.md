# Bootstrap Feature Guidance

**Parent sector:** `src/features/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — runtime-feature (write-side: primitive loading, framework detection)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/bootstrap/` owns bootstrap structure, primitive loading, framework detection, and validation helpers. Key modules: `primitive-loader.ts` (loads OpenCode primitives), `primitive-registry.ts` (registry of discovered primitives), `primitive-scanners.ts` (filesystem scanning), `framework-detector.ts` (framework detection), `runtime-validator.ts` (runtime validation), `cross-primitive-validator.ts` (cross-primitive dependency validation), `structure.ts` (bootstrap structure). The `control-plane/` subdirectory owns deeper bootstrap control-plane logic; legacy `runtime-detection/` was removed in Phase 18 as dead code. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Bootstrap may scan filesystem, load primitives, and detect frameworks at initialization time.
- Bootstrap may maintain in-memory registries of discovered primitives.
- Bootstrap may validate cross-primitive dependencies and runtime contracts.

## 3. Forbidden mutations / explicit no-go boundaries

- Bootstrap SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Bootstrap SHALL NOT become a hidden tool implementation; tool entrypoints live in `src/tools/`.
- Bootstrap SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/config/` | Calls bootstrap for primitive loading and validation | Tools own CQRS mutation; bootstrap owns detection |
| `src/plugin.ts` | Wires bootstrap at composition time | Keeps assembly logic only |
| `src/schema-kernel/bootstrap.schema.ts` | Provides validation contracts | Schemas are leaf; bootstrap owns behavior |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/bootstrap/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Subdirectories: `control-plane/`.
- Tests mirror under `tests/features/bootstrap/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Bootstrap changes must verify primitive loading correctness.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
