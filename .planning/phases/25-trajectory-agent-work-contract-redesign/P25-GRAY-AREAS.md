# Phase 25 — Trajectory + Agent-Work-Contract Redesign: Gray Areas

**Date:** 2026-05-29
**Status:** DISCUSS — awaiting user decisions before planning
**Source:** Codebase analysis of `src/task-management/trajectory/` (414 LOC), `src/features/agent-work-contracts/` (~400 LOC), `src/features/runtime-pressure/` (~625 LOC), `src/schema-kernel/agent-work-contract.schema.ts` (148 LOC), and 4 prior audits (25-AUDIT-2026-05-23 through 25-AUDIT-2026-05-25).

---

## What Exists (Code-Verified)

| Module | Files | LOC | Tests | Status |
|--------|-------|-----|-------|--------|
| `src/task-management/trajectory/` | types.ts, ledger.ts, store-operations.ts, index.ts | ~414 | **ZERO** | Schema complete, no state machine enforcement |
| `src/features/agent-work-contracts/` | types.ts, store.ts, operations.ts, index.ts | ~400 | Unknown | Create+export only, no lifecycle transitions |
| `src/features/runtime-pressure/` | types.ts, model.ts, control-plane.ts, authority-matrix.ts | ~625 | Unknown | 16 tools registered, decision engine works |
| `src/schema-kernel/agent-work-contract.schema.ts` | 1 schema file | 148 | Unknown | Zod schema complete but limits inconsistent with runtime |

## What ROADMAP Asks P25 to Deliver

1. Fix trajectory state transitions (active→closed only, no PENDING/ACTIVE/COMPLETED/ARCHIVED)
2. Add trajectory tests (zero currently)
3. Fix agent-work-contract lifecycle (created→running→blocked→completed→cancelled, no transitions implemented)
4. Deduplicate deriveSurface() (function NOT found in codebase — may be dead reference or renamed)
5. Incorporate P23-06 assessment findings (7 design errors catalogued in 25-AUDIT-2026-05-25.md)

---

## Gray Area 1: Test Coverage Scope — Zero Trajectory Tests

**Current state:** `src/task-management/trajectory/` has **zero** test files. No `tests/` directory mirrors this module. The `ledger.ts` (93 LOC), `store-operations.ts` (190 LOC), and `types.ts` (128 LOC) are completely untested.

**What needs decisions:**

- **Option A: TDD-first approach** — Write RED tests before any code changes. This means writing tests for the CURRENT broken state first (showing failures), then fixing code to make them pass. Slower but most rigorous.
- **Option B: Fix-then-test** — Fix the known design errors (7 from audit), then write comprehensive tests covering both old and new behavior. Faster but tests written against already-changed code.
- **Option C: Hybrid** — Write tests ONLY for `ledger.ts` and `types.ts` first (these are stable/read-only), then fix `store-operations.ts` design errors with TDD, then test the fixed version.

**Question for user:** Which test strategy? And what minimum test count should Phase 25 deliver? (Prior phases averaged 15-30 tests per module.)

---

## Gray Area 2: Agent-Work-Contract Lifecycle — State Machine Missing

**Current state:** The Zod schema defines 5 statuses: `created | running | blocked | completed | cancelled`. But:
- `operations.ts` only implements `createAgentWorkContract()` (→ "created" status)
- No `startContract()`, `blockContract()`, `completeContract()`, `cancelContract()` functions exist
- No state transition validation (e.g., can a "cancelled" contract be "completed"?)
- The contract store is write-once with no lifecycle management

**What needs decisions:**

- **Option A: Standalone lifecycle module** — Create `src/features/agent-work-contracts/lifecycle.ts` with a formal state machine (allowed transitions matrix). Clean separation.
- **Option B: Extend operations.ts** — Add transition functions directly in `operations.ts`. Simpler but grows the file.
- **Option C: Wire into DelegationManager** — Let the existing delegation state machine drive contract transitions. Contract follows delegation status. No separate lifecycle needed.

**Key question:** Should agent-work-contract transitions be event-driven (listen to delegation completion events) or imperative (tools explicitly call transition functions)?

---

## Gray Area 3: Bidirectional Cross-Linking (Audit Finding §1.1)

**Current state:** When a contract is created, `attachTrajectoryEvidence()` writes a ref into the trajectory ledger (trajectory knows about the contract). But the `AgentWorkContract` type has `trajectoryId` field — it DOES store the reverse reference. So this audit finding may already be partially resolved by the schema.

**However:** The `trajectoryId` field is optional and only populated when the caller explicitly passes it. There is no automatic backlink when a trajectory is created from a contract context.

**What needs decisions:**

- **Option A: Enforce bidirectional link on create** — When `createAgentWorkContract()` is called with `trajectoryId`, always populate `trajectoryId` on the contract AND call `attachTrajectoryEvidence()`. Already partially done — just needs to be mandatory when trajectoryId is present.
- **Option B: Add a `findContractsByTrajectory()` query** — Keep the current one-way link but add a scan operation that finds all contracts referencing a given trajectory. No schema change needed.
- **Option C: Both** — Enforce the link AND add the query. Most robust but more code.

**Question:** Is the current `trajectoryId` field on AgentWorkContract sufficient, or do we need a formal reverse-index?

---

## Gray Area 4: Compaction Bounds Inconsistency (Audit Finding §1.5)

**Current state:**
- Zod schema: `briefing: z.string().max(1000)`, `summary: z.string().max(1000)`, `reinjectionPayload: z.string().max(2000)`, `anchors: z.array(...).max(10)`
- Runtime enforcement: `BRIEFING_LIMIT=1200`, `SUMMARY_LIMIT=1200`, `REINJECTION_LIMIT=2400`, `ANCHOR_LIMIT=20`
- Schema allows SHORTER briefing (1000) than runtime (1200) but FEWER anchors (10 vs 20)

**What needs decisions:**

- **Option A: Schema is truth** — Reduce runtime limits to match Zod (1000/1000/2000/10). Tighter bounds, safer compaction packets.
- **Option B: Runtime is truth** — Update Zod schema to match runtime (1200/1200/2400/20). Preserves current behavior.
- **Option C: Unified constants** — Export shared constants from a single source, use in BOTH schema and runtime. Most maintainable.

**Question:** Which limits should be canonical? The Zod schema limits or the runtime enforcement limits?

---

## Gray Area 5: deriveSurface() Deduplication — Function Not Found

**Current state:** ROADMAP says "Deduplicate deriveSurface()" as a P25 goal. However:
- Grep across all `src/` files for `deriveSurface` returns **zero matches**
- The function may have been renamed, inlined, or removed in a prior phase
- The P23-06 assessment may reference a function that existed at assessment time but was cleaned up

**What needs decisions:**

- **Option A: Skip** — If deriveSurface() no longer exists, this goal is already satisfied. Mark as N/A.
- **Option B: Investigate** — Search for similar surface-derivation logic that may have been refactored under a different name (e.g., `classifySurface()`, `resolveSurface()`, `getToolAuthority()`).
- **Option C: Replace with authority-matrix** — The `authority-matrix.ts` already registers tool authorities with state surfaces. Perhaps deriveSurface() was replaced by the authority matrix and this goal is obsolete.

**Question:** Is deriveSurface() a dead reference, or should we search for renamed equivalent logic?

---

## Gray Area 6: Pressure-Bypass Trajectory Evidence (Audit Finding §1.6)

**Current state:** When `detectRuntimePressure()` returns `"block"` or `"require_approval"` (and not approved), `createAgentWorkContract()` returns early with `status: "pressure-blocked"`. No trajectory event is recorded for this blocked attempt.

**Impact:** Auditors cannot distinguish "contract never attempted" from "contract blocked by pressure."

**What needs decisions:**

- **Option A: Record blocked events** — On pressure-denied paths, call `eventTrajectory()` with `eventType: "contract_blocked"`. Requires trajectory to already exist or be created.
- **Option B: Record via evidence ref** — Call `attachTrajectoryEvidence()` with a ref like `agent-work-contract:<id>:blocked`. Simpler but less structured.
- **Option C: Skip for MVP** — Blocked attempts are rare edge cases. Document the gap but don't implement until post-M36.

**Question:** Should blocked contract creation be recorded in the trajectory, or is this overkill for MVP?

---

## Gray Area 7: Concurrent Write Lock (Audit Finding §1.3)

**Current state:** The agent-work-contracts store uses atomic file rename (`writeFileSync` + `renameSync`), which prevents partial writes. But there is NO read-modify-write lock — two concurrent `createAgentWorkContract()` calls could both read the same store, both add their contract, and the second write would overwrite the first's addition.

**Impact:** In practice, parallel subagents rarely create contracts simultaneously. But the delegation system supports 10 concurrent slots.

**What needs decisions:**

- **Option A: File-level advisory lock** — Use `lockfile` package or `mkdir`-based atomicity to lock the store during read-modify-write. Most correct but adds dependency.
- **Option B: Append-only journal** — Switch from JSON array to append-only JSONL (one line per contract). No read-modify-write needed. Compaction periodically merges.
- **Option C: Accept risk** — Document the race condition as a known limitation. The atomic rename prevents corruption; at worst one contract is lost. Acceptable for MVP.

**Question:** How important is concurrent write safety for Phase 25? (It affects complexity significantly.)

---

## Recommendation Summary

| Gray Area | Recommendation | Rationale |
|-----------|---------------|-----------|
| GA-1 (Tests) | **Option C: Hybrid** | Test stable modules first, TDD the changes |
| GA-2 (Lifecycle) | **Option A: Standalone** | Clean separation, testable, follows existing patterns |
| GA-3 (Bidirectional) | **Option C: Both** | Enforce + query is cheap and prevents orphaned data |
| GA-4 (Compaction) | **Option C: Unified constants** | Single source of truth, prevents future drift |
| GA-5 (deriveSurface) | **Option A: Skip** | Likely dead reference — mark N/A unless investigation finds renamed equivalent |
| GA-6 (Blocked evidence) | **Option B: Evidence ref** | Simpler than full event, sufficient for audit trail |
| GA-7 (Concurrent lock) | **Option C: Accept risk** | Document as known limitation, atomic rename prevents corruption |

---

## Next Steps After Decisions

1. User selects options for GA-1 through GA-7
2. Write P25-SPEC.md incorporating decisions
3. Create P25-CONTEXT.md with full codebase context
4. Run gsd-plan-phase to break into implementation plans
5. Execute with TDD for trajectory tests + lifecycle implementation
