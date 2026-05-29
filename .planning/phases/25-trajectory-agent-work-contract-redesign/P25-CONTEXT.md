# Phase 25: Trajectory + Agent-Work-Contract Redesign - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the trajectory module (src/task-management/trajectory/) and agent-work-contract module
(src/features/agent-work-contracts/) to implement formal state machines, add comprehensive tests,
fix cross-linking, and unify bounds configuration. Pure infrastructure — no user-facing changes.
</domain>

<decisions>
## Implementation Decisions

### Test Coverage (GA-1)
- **D-01:** TDD-first approach — write RED tests for current broken trajectory before any fixes
- **D-02:** Minimum 15-30 tests covering ledger.ts (93 LOC), store-operations.ts (190 LOC), types.ts (128 LOC)

### Contract Lifecycle (GA-2)
- **D-03:** Create standalone lifecycle module at src/features/agent-work-contracts/lifecycle.ts
- **D-04:** Formal state machine with allowed transitions: created→running→blocked→completed→cancelled
- **D-05:** Implement startContract(), blockContract(), completeContract(), cancelContract()

### Bidirectional Linking (GA-3)
- **D-06:** Enforce trajectoryId population on contract creation when trajectory context exists
- **D-07:** Add findContractsByTrajectory() query function

### Compaction Bounds (GA-4)
- **D-08:** Create unified constants file shared between Zod schema and runtime enforcement
- **D-09:** Reconcile limits: briefing 1200, summary 1200, reinjection 2400, anchors 20

### deriveSurface() Dedup (GA-5)
- **D-10:** Investigate renamed equivalent logic (classifySurface, resolveSurface, getToolAuthority)
- **D-11:** If NOT found, mark as N/A — update ROADMAP accordingly

### Blocked Evidence (GA-6)
- **D-12:** Skip for MVP — document gap but do not implement
- **D-13:** Revisit post-M36

### Concurrent Write Lock (GA-7)
- **D-14:** Non-issue — contracts keyed by delegation ID, no concurrent write to same file
- **D-15:** Current atomic rename pattern is sufficient

### the agent's Discretion
- Implementation ordering within the phase
- Specific test structure and file naming
- Error handling style (follow existing patterns)

</decisions>

<canonical_refs>
## Canonical References

### Prior audits
- `.planning/phases/25-trajectory-agent-work-contract-redesign/25-AUDIT-*.md` — Prior audit findings (5 files)
- `.planning/phases/25-trajectory-agent-work-contract-redesign/P25-GRAY-AREAS.md` — Gray area analysis

### Trajectory module
- `src/task-management/trajectory/index.ts` — Public API (2 exports: eventTrajectory, attachTrajectoryEvidence)
- `src/task-management/trajectory/ledger.ts` — Append-only event ledger (93 LOC)
- `src/task-management/trajectory/store-operations.ts` — Read/write operations (190 LOC)
- `src/task-management/trajectory/types.ts` — TrajectoryEvent, TrajectoryTarget types (128 LOC)

### Agent-work-contract module
- `src/features/agent-work-contracts/index.ts` — Public API
- `src/features/agent-work-contracts/types.ts` — Contract types
- `src/features/agent-work-contracts/store.ts` — Contract store
- `src/features/agent-work-contracts/operations.ts` — CRUD operations
- `src/schema-kernel/agent-work-contract.schema.ts` — Zod schema (148 LOC)

### Related modules
- `src/features/runtime-pressure/authority-matrix.ts` — Tool authority mapping
- `src/features/runtime-pressure/control-plane.ts` — Session state enforcement
- `src/task-management/continuity/index.ts` — Continuity persistence (no trajectory refs currently)
- `src/task-management/lifecycle/index.ts` — Lifecycle manager (no trajectory refs currently)
- `src/shared/task-status.ts` — Task status definitions
- `src/shared/types.ts` — Core types

### Project docs
- `.planning/ROADMAP.md` §Phase 25 — Phase description and dependencies
- `.planning/PROJECT.md` — Project vision and principles
- `.planning/REQUIREMENTS.md` — Acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/agent-work-contracts/store.ts` — Atomic rename pattern for contract persistence
- `src/task-management/trajectory/ledger.ts` — Append-only event recording (reusable pattern)
- `src/features/runtime-pressure/authority-matrix.ts` — Tool authority mapping (for deriveSurface investigation)

### Established Patterns
- Atomic file writes with renameSync for data persistence
- Zod schemas in src/schema-kernel/ for type validation
- Vitest for testing (existing test patterns in tests/lib/ and tests/tools/)

### Integration Points
- trajectory ↔ continuity: Currently disconnected — trajectory events and continuity state don't sync
- trajectory ↔ lifecycle: Currently disconnected — no lifecycle phase triggers trajectory recording
- agent-work-contracts ↔ delegation: Contracts created from DelegationManager context
</code_context>

<specifics>
## Specific Ideas

- TDD-first approach: write failing tests before any code changes
- Follow existing vitest patterns from tests/lib/ and tests/tools/
- State machine should be explicit (allowedTransitions matrix), not implicit
- Unified constants should be exported from a single file imported by both Zod schema and runtime
</specifics>

<deferred>
## Deferred Ideas

### GA-6 (Blocked Evidence)
- Blocked contract creation leaves no trajectory event — revisit post-M36
- Low priority: pressure-blocked contracts are rare edge cases

### GA-7 (Concurrent Write Lock)
- Dismissed as non-issue — contracts keyed by delegation ID, no concurrent write to same file
- Current atomic rename pattern is sufficient
</deferred>

---

*Phase: 25-trajectory-agent-work-contract-redesign*
*Context gathered: 2026-05-29*
