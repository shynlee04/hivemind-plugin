---
phase: 25-trajectory-agent-work-contract-redesign
plan: 01
type: tdd
wave: 1
depends_on: []
files_modified:
  - tests/task-management/trajectory/ledger.test.ts
  - tests/task-management/trajectory/store-operations.test.ts
  - tests/task-management/trajectory/types.test.ts
  - tests/task-management/trajectory/index.test.ts
autonomous: true
requirements:
  - REQ-25-01
  - REQ-25-07
must_haves:
  truths:
    - "Trajectory module has 15-30 RED tests covering ledger.ts, store-operations.ts, types.ts"
    - "Tests run without vitest errors (npx vitest run tests/task-management/trajectory/)"
    - "Tests cover: ledger append, store read/write, type validation, event creation"
    - "Git log shows test(...) commit BEFORE any feat(...) commit"
  artifacts:
    - path: "tests/task-management/trajectory/ledger.test.ts"
      provides: "Ledger CRUD tests"
      min_lines: 40
    - path: "tests/task-management/trajectory/store-operations.test.ts"
      provides: "Store operation tests"
      min_lines: 60
    - path: "tests/task-management/trajectory/types.test.ts"
      provides: "Type validation tests"
      min_lines: 30
    - path: "tests/task-management/trajectory/index.test.ts"
      provides: "Public API re-export tests"
      min_lines: 20
  key_links:
    - from: "tests/task-management/trajectory/ledger.test.ts"
      to: "src/task-management/trajectory/ledger.ts"
      via: "import"
      pattern: "import.*from.*trajectory/ledger"
    - from: "tests/task-management/trajectory/store-operations.test.ts"
      to: "src/task-management/trajectory/store-operations.ts"
      via: "import"
      pattern: "import.*from.*trajectory/store-operations"
---

<objective>
Write RED tests for the trajectory module (414 LOC, 4 files, zero existing tests) BEFORE any code changes. per D-01 (TDD-first) and D-02 (15-30 minimum tests).

Purpose: Establish test baseline that documents current behavior and catches regressions during future fixes.
Output: 4 test files with 15-30 tests covering all trajectory module surface area.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/25-trajectory-agent-work-contract-redesign/25-SPEC.md
@.planning/phases/25-trajectory-agent-work-contract-redesign/P25-CONTEXT.md
@src/task-management/trajectory/index.ts
@src/task-management/trajectory/ledger.ts
@src/task-management/trajectory/store-operations.ts
@src/task-management/trajectory/types.ts
@tests/lib/agent-work-contracts/store.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Write RED tests for trajectory types.ts (per D-01, D-02)</name>
  <files>tests/task-management/trajectory/types.test.ts</files>
  <behavior>
    - Test: TRAJECTORY_LEDGER_VERSION is 1 (const assertion)
    - Test: TrajectoryStatus type accepts "active" and "closed"
    - Test: EvidenceRef is string type
    - Test: TrajectoryCheckpoint shape has checkpointId, summary, evidenceRefs, createdAt
    - Test: TrajectoryEvent shape has eventId, eventType, summary, evidenceRefs, createdAt
    - Test: TrajectoryRecord shape has all required fields (id, rootSessionId, status, etc.)
    - Test: TrajectoryLedger shape has version, updatedAt, trajectories
    - Test: TrajectoryMutationInput requires projectRoot and trajectoryId
  </behavior>
  <action>Create tests/task-management/trajectory/types.test.ts. Import types from src/task-management/trajectory/types.ts. Write 8 tests validating type shapes and const values. Use vitest globals (describe, it, expect). Follow pattern from tests/lib/agent-work-contracts/store.test.ts: mkdtempSync for temp dirs, afterEach rmSync cleanup. Tests should verify: TRAJECTORY_LEDGER_VERSION === 1, type shape contracts via runtime object validation, MutationInput requires projectRoot and trajectoryId.</action>
  <verify>
    <automated>npx vitest run tests/task-management/trajectory/types.test.ts</automated>
  </verify>
  <done>8 type validation tests written and running (GREEN for type const tests, shape tests validate existing types)</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Write RED tests for trajectory ledger.ts (per D-01, D-02)</name>
  <files>tests/task-management/trajectory/ledger.test.ts</files>
  <behavior>
    - Test: getTrajectoryLedgerPath returns .hivemind/state/trajectory-ledger.json
    - Test: createEmptyTrajectoryLedger returns version 1, empty trajectories, current timestamp
    - Test: readTrajectoryLedger returns empty ledger when file doesn't exist
    - Test: writeTrajectoryLedger creates file and returns path
    - Test: readTrajectoryLedger after write returns same data
    - Test: readTrajectoryLedger throws on corrupt JSON
    - Test: readTrajectoryLedger quarantines corrupt file before throwing
    - Test: readTrajectoryLedger normalizes missing updatedAt
  </behavior>
  <action>Create tests/task-management/trajectory/ledger.test.ts. Import from src/task-management/trajectory/ledger.ts. Use mkdtempSync for isolated temp project roots. Test all exported functions: getTrajectoryLedgerPath, createEmptyTrajectoryLedger, readTrajectoryLedger, writeTrajectoryLedger. For corrupt file tests: write invalid JSON to the expected path, verify quarantine behavior. 8 tests total.</action>
  <verify>
    <automated>npx vitest run tests/task-management/trajectory/ledger.test.ts</automated>
  </verify>
  <done>8 ledger tests written covering path resolution, empty creation, read/write roundtrip, corrupt handling</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Write RED tests for trajectory store-operations.ts (per D-01, D-02)</name>
  <files>tests/task-management/trajectory/store-operations.test.ts</files>
  <behavior>
    - Test: inspectTrajectoryLedger returns empty ledger when no file exists
    - Test: inspectTrajectoryLedger returns specific trajectory when trajectoryId provided
    - Test: attachTrajectoryEvidence creates trajectory if not exists
    - Test: attachTrajectoryEvidence merges evidence refs (deduplicates)
    - Test: eventTrajectory creates event with auto-generated eventId
    - Test: eventTrajectory preserves custom eventId when provided
    - Test: checkpointTrajectory creates checkpoint with auto-generated checkpointId
    - Test: closeTrajectory sets status to "closed"
    - Test: closeTrajectory throws for non-existent trajectory
    - Test: traverseTrajectory filters by rootSessionId
    - Test: traverseTrajectory filters by sessionId
    - Test: traverseTrajectory filters by trajectoryId (includes children)
    - Test: createTrajectoryLedger returns empty ledger
    - Test: upsertTrajectory requires rootSessionId for new trajectories
    - Test: upsertTrajectory updates existing trajectory lineage fields
  </behavior>
  <action>Create tests/task-management/trajectory/store-operations.test.ts. Import all exported functions from src/task-management/trajectory/store-operations.ts. Use mkdtempSync for temp project roots. Test: inspectTrajectoryLedger (empty and with data), attachTrajectoryEvidence (create + merge), eventTrajectory (auto + custom IDs), checkpointTrajectory, closeTrajectory (success + not-found error), traverseTrajectory (3 filter modes), createTrajectoryLedger. 15 tests total. Each test creates its own temp dir for isolation.</action>
  <verify>
    <automated>npx vitest run tests/task-management/trajectory/store-operations.test.ts</automated>
  </verify>
  <done>15 store operation tests written covering all exported functions, edge cases, and error paths</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| file-system→trajectory-store | Trajectory ledger reads/writes to .hivemind/state/ — path traversal guard via assertPathWithinRoot |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-25-01 | Tampering | trajectory ledger file | mitigate | assertPathWithinRoot in getTrajectoryLedgerPath already guards path traversal |
| T-25-SC | Tampering | npm/pip/cargo installs | mitigate | No new packages added in this phase |
</threat_model>

<verification>
Run: `npx vitest run tests/task-management/trajectory/`
Expected: All tests complete (some may fail = RED state, which is correct for TDD)
Count: ≥ 29 tests across 4 files
</verification>

<success_criteria>
- 4 test files exist under tests/task-management/trajectory/
- ≥ 29 tests written (8 types + 8 ledger + 15 store-operations - per D-02: 15-30 minimum)
- `npx vitest run tests/task-management/trajectory/` completes without vitest errors
- Tests cover: ledger CRUD, store read/write, type validation, event creation, traversal
- Git log shows test(...) commit before any feat(...) commit (per D-01)
</success_criteria>

<output>
Create `.planning/phases/25-trajectory-agent-work-contract-redesign/25-01-SUMMARY.md` when done
</output>
