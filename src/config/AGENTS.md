# Config Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/config/` owns config compilation, subscription, and configuration workflow state machines. The compiler transforms workspace config into runtime policy; the subscriber observes config changes and notifies dependents; the workflow module manages turn-based OpenCode primitive configuration state. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`. Classification: Hard Harness — config modules compile `.opencode/` Soft Meta-Concepts primitives into runtime policy within the npm package. `.opencode/` IS the config surface; `src/config/` IS the config compiler. Internal state persists to `.hivemind/`.

## 2. Allowed mutation authority

- Config modules may compile workspace configuration into runtime policy objects.
- The subscriber may register and notify config change listeners.
- The workflow module may manage configuration workflow state transitions and persistence through `.hivemind/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 3. Forbidden mutations / explicit no-go boundaries

- Config modules SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Config modules SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/`.
- Config modules SHALL NOT become tool implementations; tool entrypoints live in `src/tools/`.
- Config modules SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/config/` | Calls config modules for primitive configuration and validation | Tools own CQRS mutation boundary |
| `src/plugin.ts` | Loads compiled config at composition time | Keeps assembly logic only |
| `src/schema-kernel/` | Provides validation contracts for config shapes | Schemas are leaf; config modules own behavior |
| Tests | Validate config compilation and workflow transitions | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Config modules use `kebab-case.ts` at `src/config/{module-name}.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- The workflow subdirectory uses `src/config/workflow/index.ts` as barrel export.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Workflow state transitions must have test coverage for guard conditions.
- Docs-only edits remain L5 evidence and must not alter readiness status. Source evidence: `.planning/ROADMAP.md:47-49`.
