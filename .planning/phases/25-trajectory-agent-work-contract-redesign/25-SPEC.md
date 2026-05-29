# Phase 25: Trajectory + Agent-Work-Contract Redesign — Specification

**Created:** 2026-05-29
**Ambiguity score:** 0.13 (gate: ≤ 0.20)
**Requirements:** 7 locked

## Goal

Add comprehensive tests to the trajectory module (currently 0 tests for 414 LOC), implement a formal state machine for agent-work-contract lifecycle transitions, unify compaction bounds between Zod schema and runtime, and establish bidirectional cross-linking between trajectory events and contracts — all using TDD-first methodology.

## Background

### Trajectory Module (`src/task-management/trajectory/` — 414 LOC, 4 files)

The trajectory module records delegation events in an append-only ledger and stores trajectory evidence. It exports two functions: `eventTrajectory` and `attachTrajectoryEvidence`. The module has **zero test coverage** despite being 414 LOC across `ledger.ts` (93 LOC), `store-operations.ts` (190 LOC), `types.ts` (128 LOC), and `index.ts` (3 LOC re-export). Neither `continuity/index.ts` (467 LOC) nor `lifecycle/index.ts` (242 LOC) reference trajectory — the module is disconnected from the broader task-management system.

### Agent-Work-Contract Module (`src/features/agent-work-contracts/` — 400 LOC, 4 files)

The contract module manages delegation contracts with CRUD operations. It has a single creation function (`createAgentWorkContract`) but **no lifecycle management** — no state transitions, no status enforcement. The Zod schema in `src/schema-kernel/agent-work-contract.schema.ts` (148 LOC) defines the contract shape but has **no `.max()` constraints** on string fields, while `operations.ts` enforces runtime limits via local constants (`BRIEFING_LIMIT=1200`, `SUMMARY_LIMIT=1200`, `REINJECTION_LIMIT=2400`, `ANCHOR_LIMIT=20`). The schema and runtime are **disconnected** — Zod validates shape but not bounds.

### deriveSurface() Status

`deriveSurface()` is **NOT dead** — it exists at `src/task-management/continuity/delegation-persistence.ts:22` and maps `executionMode` to surface type. A separate `getToolAuthority()` exists in `src/features/runtime-pressure/authority-matrix.ts:237` for tool-level authority. These are distinct functions with distinct purposes.

## Requirements

### REQ-25-01: Trajectory RED Tests

Write failing tests for the current trajectory module BEFORE any code changes.

| Dimension | Value |
|-----------|-------|
| **Current** | ZERO test files for 414 LOC across 4 files (`ledger.ts`, `store-operations.ts`, `types.ts`, `index.ts`) |
| **Target** | 15–30 tests covering all trajectory module surface area |
| **Acceptance** | (1) Test file count ≥ 3 (one per source file minimum), (2) All tests RED (showing current failures/gaps), (3) `npx vitest run tests/task-management/trajectory/` completes without vitest errors, (4) Tests cover: ledger append operations, store read/write, type validation, event creation |

### REQ-25-02: Agent-Work-Contract Lifecycle Module

Create a standalone lifecycle module with a formal state machine for contract status transitions.

| Dimension | Value |
|-----------|-------|
| **Current** | Only `createAgentWorkContract()` exists — no transitions, no status enforcement |
| **Target** | `lifecycle.ts` with `allowedTransitions` matrix and 4 transition functions |
| **Acceptance** | (1) `src/features/agent-work-contracts/lifecycle.ts` exists, (2) State machine: `created→running`, `created→cancelled`, `running→blocked`, `running→completed`, `running→cancelled`, `blocked→running`, `blocked→cancelled`, (3) `startContract()`, `blockContract()`, `completeContract()`, `cancelContract()` all exist and export, (4) Invalid transitions throw with descriptive error, (5) Typecheck passes |

### REQ-25-03: Bidirectional Cross-Linking

Enforce trajectory↔contract linking and add query capability.

| Dimension | Value |
|-----------|-------|
| **Current** | `trajectoryId` field exists on contract type but only populated when caller explicitly passes it; no query function to find contracts by trajectory |
| **Target** | Auto-populate `trajectoryId` when trajectory context exists; `findContractsByTrajectory()` query |
| **Acceptance** | (1) Creating contract with trajectory context auto-populates `trajectoryId`, (2) `findContractsByTrajectory(trajectoryId)` returns matching contracts, (3) Both functions have tests, (4) Typecheck passes |

### REQ-25-04: Unified Bounds Constants

Single source of truth for compaction limits shared between Zod schema and runtime.

| Dimension | Value |
|-----------|-------|
| **Current** | Zod schema has NO `.max()` constraints; runtime enforces limits via local constants in `operations.ts` (briefing=1200, summary=1200, reinjection=2400, anchors=20) |
| **Target** | Constants file imported by BOTH Zod schema and runtime; Zod enforces `.max()` at validation time |
| **Acceptance** | (1) Single constants file exists (e.g., `src/features/agent-work-contracts/bounds.ts`), (2) Zod schema imports and uses `.max()` from constants, (3) `operations.ts` imports from constants (no local definitions), (4) Limits consistent: briefing=1200, summary=1200, reinjection=2400, anchors=20, (5) Typecheck passes |

### REQ-25-05: deriveSurface() Investigation

Search for renamed equivalent and reconcile ROADMAP references.

| Dimension | Value |
|-----------|-------|
| **Current** | `deriveSurface()` EXISTS at `src/task-management/continuity/delegation-persistence.ts:22` — maps `executionMode` to surface type. `getToolAuthority()` at `src/features/runtime-pressure/authority-matrix.ts:237` is a distinct function for tool-level authority |
| **Target** | Document findings; update ROADMAP if references are stale |
| **Acceptance** | (1) Investigation documented in SUMMARY.md, (2) ROADMAP updated if Phase 25 references point to wrong location, (3) No code changes unless a genuine gap is found |

### REQ-25-06: Lifecycle Transitions Functional

State machine works end-to-end with proper error handling.

| Dimension | Value |
|-----------|-------|
| **Current** | No lifecycle management exists |
| **Target** | All transition functions work correctly; invalid transitions are rejected |
| **Acceptance** | (1) `startContract(id)` transitions `created→running`, (2) `blockContract(id, reason)` transitions `running→blocked`, (3) `completeContract(id, proof?)` transitions `running→completed`, (4) `cancelContract(id, reason)` transitions from any active state to `cancelled`, (5) Invalid transitions (e.g., `completed→running`) throw `[Harness]`-prefixed error, (6) Each transition persists updated contract to store, (7) ≥ 10 tests covering valid and invalid transitions |

### REQ-25-07: TDD Loop Completed

RED→GREEN→REFACTOR cycle for trajectory module.

| Dimension | Value |
|-----------|-------|
| **Current** | No tests, untested module with potential bugs |
| **Target** | All RED tests from REQ-25-01 now GREEN; module fixed to pass tests |
| **Acceptance** | (1) All 15–30 trajectory tests pass (`npx vitest run tests/task-management/trajectory/`), (2) `npm run typecheck` passes with no new errors, (3) No regressions in existing tests (`npm test` passes), (4) Git log shows `test(...)` commit before `feat(...)` commit (TDD gate compliance) |

## Boundaries

### In Scope

- Trajectory module test coverage (RED tests → GREEN fixes)
- Agent-work-contract lifecycle state machine (`lifecycle.ts`)
- Bidirectional trajectory↔contract linking
- Unified compaction bounds constants
- deriveSurface() investigation and ROADMAP reconciliation
- TDD loop completion for trajectory module

### Out of Scope

| Item | Reason |
|------|--------|
| Concurrent write lock | Non-issue — contracts keyed by delegation ID, no concurrent write to same file (D-14) |
| Blocked contract evidence | Deferred to post-M36 — pressure-blocked contracts are rare edge cases (D-12, D-13) |
| deriveSurface() replacement | Investigation only — function exists and works; no replacement needed (D-10, D-11) |
| Continuity↔trajectory wiring | Future phase — trajectory events don't currently sync with continuity state |
| Lifecycle↔trajectory wiring | Future phase — no lifecycle phase triggers trajectory recording |
| New user-facing features | Pure infrastructure — no behavioral changes to tools or hooks |

## Constraints

| Constraint | Description |
|------------|-------------|
| **TDD-first** | Write RED tests before any code changes (D-01). Git log must show `test(...)` commit before `feat(...)` commit |
| **Existing patterns** | Follow vitest patterns from `tests/lib/` and `tests/tools/`; follow atomic rename pattern from `store.ts` |
| **No regressions** | `npm test` must pass after each task; `npm run typecheck` must pass |
| **Module size** | New files must stay under 500 LOC (project convention from AGENTS.md) |
| **Error format** | All thrown errors must use `[Harness]` prefix (project convention) |
| **Type safety** | No `any` types on new code; `verbatimModuleSyntax: true` compliance |
| **Zod v4** | Schema changes must follow Zod v4 patterns (per `stack-l3-zod` skill) |

## Acceptance Criteria

- [ ] `npx vitest run tests/task-management/trajectory/` — all trajectory tests pass (≥ 15 tests)
- [ ] `npx vitest run tests/features/agent-work-contracts/` — all contract tests pass (≥ 10 lifecycle tests)
- [ ] `npm run typecheck` — zero errors
- [ ] `npm test` — zero regressions
- [ ] `src/features/agent-work-contracts/lifecycle.ts` exists with state machine and 4 transition functions
- [ ] `src/features/agent-work-contracts/bounds.ts` exists and is imported by both Zod schema and operations.ts
- [ ] `findContractsByTrajectory()` exported and tested
- [ ] Git log shows TDD gate: `test(...)` commit before `feat(...)` commit
- [ ] deriveSurface() investigation documented; ROADMAP updated if needed

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.90 | 0.75 | ✓ | Specific modules, LOC counts, test ranges, TDD methodology all stated |
| Boundary Clarity | 0.85 | 0.70 | ✓ | 6 out-of-scope items with explicit reasons; in-scope list matches decisions |
| Constraint Clarity | 0.80 | 0.65 | ✓ | 7 constraints with specific tool/config references |
| Acceptance Criteria | 0.85 | 0.70 | ✓ | 9 pass/fail criteria with specific commands and counts |
| **Ambiguity** | 0.13 | ≤0.20 | ✓ | Low — all requirements trace to locked decisions D-01 through D-15 |

## Interview Log

Interview was skipped — ambiguity gate passed from CONTEXT.md analysis. All 15 decisions (D-01 through D-15) were locked during `/gsd-discuss-phase 25`. No open questions remain.

---

*Phase: 25-trajectory-agent-work-contract-redesign*
*Spec created: 2026-05-29*
*Next step: /gsd-plan-phase 25*
