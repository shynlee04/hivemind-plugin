# Agent Work Contracts Feature Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/agent-work-contracts/` owns durable contract creation and export helpers for delegated work. `operations.ts` defines contract CRUD operations. `store.ts` manages contract persistence through `.hivemind/` authority. `types.ts` defines contract structures. This feature is consumed by `hivemind-agent-work.ts` tool. Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.

## 2. Allowed mutation authority

- Agent-work-contracts may create, read, update, and export durable work contracts.
- State writes remain explicit and rooted in `.hivemind/` authority. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Contracts may reference trajectory, delegation, and session identifiers.

## 3. Forbidden mutations / explicit no-go boundaries

- Agent-work-contracts SHALL NOT store state in `.opencode/`; `.hivemind/` is canonical. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Agent-work-contracts SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/agent-work-contract.schema.ts`.
- Agent-work-contracts SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/hivemind/hivemind-agent-work.ts` | Manages work contracts | Tools own CQRS mutation boundary; feature owns contract logic |
| `src/task-management/` | Owns delegation and trajectory state | Feature writes through `.hivemind/` authority |
| `src/schema-kernel/agent-work-contract.schema.ts` | Provides validation contracts | Schemas are leaf; feature owns behavior |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/agent-work-contracts/`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Barrel export at `index.ts`.
- Tests mirror under `tests/features/agent-work-contracts/`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped tests. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Contract changes must verify `.hivemind/` state-root compliance.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
