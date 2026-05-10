# Delegation Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/coordination/delegation/` owns the DelegationManager — the WaiterModel dispatch orchestrator for delegated child sessions. It evaluates category gates, acquires per-key concurrency slots, dispatches via SDK or command execution mode, and recovers pending delegations at harness startup. Contains: `manager.ts` (DelegationManager, ~500 LOC), `types.ts` (delegation contracts), `state-machine.ts` (transition logic), `category-gates.ts` (category evaluation), `category-gate-audit.ts` (ask audit). Source evidence: `.planning/codebase/ARCHITECTURE.md:55-57`, `.planning/codebase/ARCHITECTURE.md:153-158`, `.planning/codebase/STRUCTURE.md:95-97`.

## 2. Allowed mutation authority

- DelegationManager may dispatch child sessions via `SdkDelegationHandler` or `CommandDelegationHandler`, acquire concurrency slots through `DelegationConcurrencyQueue`, and evaluate category gates. Evidence: `.planning/codebase/ARCHITECTURE.md:187-190`.
- DelegationStateMachine may validate and enforce delegation status transitions (dispatched→running→completed/error/timeout). Evidence: `.planning/codebase/ARCHITECTURE.md:153-158`.
- Category gates may resolve allow/ask decisions for agent-category dispatch pairings.

## 3. Forbidden mutations / explicit no-go boundaries

- Delegation SHALL NOT perform durable state writes directly; delegation record persistence belongs to `src/task-management/continuity/delegation-persistence.ts`. Evidence: `.planning/codebase/ARCHITECTURE.md:159`.
- Delegation SHALL NOT register tools or hooks; `src/plugin.ts` owns tool registration and hook composition.
- Delegation SHALL NOT observe OpenCode lifecycle events directly; hooks route events through the lifecycle manager injected as dependency.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/delegation/` | Dispatches delegations via DelegationManager | Tools own input validation and response shaping |
| `src/coordination/completion/` | Receives completion signals for dispatched sessions | CompletionDetector owns signal detection |
| `src/coordination/concurrency/` | Provides per-key concurrency gating | Owns queue; delegation acquires slots |
| `src/task-management/continuity/` | Persists delegation records | Owns durable state; delegation dispatches |
| `src/plugin.ts` | Wires DelegationManager at composition time | Composition root only, no business logic |

## 5. Naming and placement conventions

- `manager.ts` — DelegationManager class (~500 LOC, reference module). Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- `types.ts` — shared delegation contracts. `state-machine.ts` — DelegationStateMachine. `category-gates.ts` — gate evaluation. `category-gate-audit.ts` — ask audit trail.
- Tests mirror under `tests/lib/coordination/delegation/`.

## 6. Quality gates and evidence expectations

- Changes require `npm run typecheck` and scoped `npx vitest run tests/lib/coordination/delegation/...`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Dispatch changes require regression evidence across completion detection and concurrency gating.
- Docs-only edits remain L5 evidence. Runtime readiness requires live or authorized proof. Evidence: `.planning/ROADMAP.md:47-49`.
