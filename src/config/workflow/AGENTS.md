# Config Workflow Guidance

**Parent sector:** `src/config/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — write-side (workflow state transitions, `.hivemind/` persistence)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/config/workflow/` owns turn-based OpenCode primitive configuration workflow state and guards. `workflow-state.ts` manages workflow state transitions. `workflow-guards.ts` enforces guard conditions on transitions. `workflow-persistence.ts` persists workflow state through `.hivemind/`. `workflow-types.ts` defines workflow contracts. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Workflow may manage configuration workflow state transitions.
- Workflow may persist state through `.hivemind/` authority surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Workflow may enforce guard conditions on state transitions.

## 3. Forbidden mutations / explicit no-go boundaries

- Workflow SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Workflow SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/`.
- Workflow SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/config/configure-primitive.ts` | Invokes workflow for primitive configuration | Tools own CQRS mutation boundary; workflow owns state |
| `src/schema-kernel/` | Provides validation contracts for workflow shapes | Schemas are leaf; workflow owns behavior |
| Tests | Validate workflow state transitions and guards | Must test guard conditions explicitly |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/config/workflow/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/config/workflow/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Workflow state changes must verify guard condition enforcement.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
