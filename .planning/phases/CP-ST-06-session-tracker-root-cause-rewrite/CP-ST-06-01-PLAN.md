---
phase: CP-ST-06-session-tracker-root-cause-rewrite
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md
  - tests/features/session-tracker/persistence/hierarchy-index.test.ts
  - tests/features/session-tracker/persistence/session-index-writer.test.ts
  - tests/features/session-tracker/persistence/child-writer.test.ts
  - tests/features/session-tracker/integration/default-sub.test.ts
  - tests/features/session-tracker/integration/last-message.test.ts
  - tests/features/session-tracker/integration/parallel-children.test.ts
  - tests/features/session-tracker/persistence/retry-queue.test.ts
autonomous: true
requirements:
  - RC-1
  - RC-2
  - RC-3
  - RC-4
  - RC-5
  - RC-6
  - GA-1
  - GA-2
  - GA-3
  - GA-5
must_haves:
  truths:
    - "Mỗi failing/stale test được audit riêng trước khi xóa hoặc rewrite per GA-3."
    - "Có failing integration coverage cho default-to-sub, full lastMessage, retry queue, nested hierarchy, reverse-order root, và parallel children."
    - "New tests dùng real temp filesystem cho persistence, không mock private persistence internals per GA-3."
  artifacts:
    - path: "tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md"
      provides: "Per-test audit matrix with keep/rewrite/delete/future classification and rationale"
    - path: "tests/features/session-tracker/integration/default-sub.test.ts"
      provides: "RC-3 default-sub integration coverage"
    - path: "tests/features/session-tracker/persistence/retry-queue.test.ts"
      provides: "GA-1 retry queue RED tests"
    - path: "tests/features/session-tracker/integration/parallel-children.test.ts"
      provides: "GA-5 parallel hierarchy and write coverage"
  key_links:
    - from: "CP-ST-06-TEST-AUDIT.md"
      to: "source test files"
      via: "one row per stale/failing test before deletion"
      pattern: "tests/features/session-tracker/.*\.test\.ts"
    - from: "integration tests"
      to: ".hivemind/session-tracker temp dirs"
      via: "real fs assertions"
      pattern: "mkdtemp|tmpdir|readFile|existsSync"
---

<objective>
Create the CP-ST-06 test audit and failing/spec-locked integration tests before runtime rewrite.

Purpose: Lock the RED side of the rewrite so implementers cannot silently delete stale mocks or patch symptoms without proving the 6 root causes and GA decisions.

Output: A per-test audit artifact plus focused tests that fail before the implementation and pass only when CP-ST-06 behavior is delivered.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-RESEARCH.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
@src/features/session-tracker/AGENTS.md
@src/features/session-tracker/index.ts
@src/features/session-tracker/classification.ts
@src/features/session-tracker/persistence/hierarchy-index.ts
@src/features/session-tracker/persistence/session-index-writer.ts
@src/features/session-tracker/persistence/child-writer.ts
@src/features/session-tracker/persistence/session-writer.ts
@src/features/session-tracker/capture/event-capture.ts
@tests/features/session-tracker/

<interfaces>
Required behavioral contracts from locked context:
- GA-1: failed child writes must create retry records and retry; no silent data loss.
- GA-2: max supported depth is L2 (L0 main, L1 sub, L2 sub-sub); do not implement L3 despite SPEC stale line.
- GA-3: audit stale tests individually; no bulk deletion.
- GA-5: verify parallel children with integration tests.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create individual stale-test audit matrix</name>
  <files>tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-RESEARCH.md
    - tests/features/session-tracker/**/*.test.ts
  </read_first>
  <action>Create `CP-ST-06-TEST-AUDIT.md` with one row per currently failing or stale test case. Required columns: test file, test name, current failure category, classification (`keep`, `rewrite`, `delete`, `future-phase`), root-cause link (`RC-1`..`RC-6` or `out-of-scope`), and exact rationale. Per GA-3, do not delete or rewrite any test until it has an audit row.</action>
  <acceptance_criteria>
    - `grep -v '^#' tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md | grep -c '|'` returns at least 31 data/table lines.
    - `grep -E 'delete|rewrite|future-phase|keep' tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md` returns one classification per audited test row.
    - No audited row has an empty rationale cell.
  </acceptance_criteria>
  <verify>
    <automated>test -f tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md && grep -v '^#' tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md | grep -E 'keep|rewrite|delete|future-phase'</automated>
  </verify>
  <done>Every stale/failing test has an individual disposition before implementation changes begin.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add RED root-cause tests for hierarchy, default-sub, retry, and lastMessage</name>
  <files>tests/features/session-tracker/persistence/hierarchy-index.test.ts, tests/features/session-tracker/persistence/session-index-writer.test.ts, tests/features/session-tracker/persistence/child-writer.test.ts, tests/features/session-tracker/integration/default-sub.test.ts, tests/features/session-tracker/integration/last-message.test.ts, tests/features/session-tracker/persistence/retry-queue.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - src/features/session-tracker/persistence/hierarchy-index.ts
    - src/features/session-tracker/persistence/session-index-writer.ts
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/persistence/session-writer.ts
    - tests/features/session-tracker/integration/pipeline.test.ts
  </read_first>
  <behavior>
    - RC-1/GA-2: reverse-order L2→L1→L0 registration resolves root main while keeping L2 as supported max depth.
    - RC-2: nested L2 status updates mutate `l1.children[l2].status`, not a flattened root child.
    - RC-3: `gate:"none"` creates no rogue root directory and routes to the first known root as child/default-sub; if zero root exists, record degraded/default-sub failure without creating root.
    - RC-4: main `.md` and child `.json` retain full non-user lastMessage content with no truncation.
    - RC-5/GA-1: failed child write creates a retry record and the caller observes the failure.
  </behavior>
  <action>Add or adjust tests so they express the locked behaviors above and fail before implementation. Use real temp directories for persistence tests. Do not mock `ChildWriter`, `SessionIndexWriter`, `HierarchyIndex`, or `SessionWriter` persistence internals in new integration tests.</action>
  <acceptance_criteria>
    - `npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts` includes a reverse-order L2 root resolution case.
    - `npx vitest run tests/features/session-tracker/integration/default-sub.test.ts` fails before RC-3 implementation and asserts no rogue root directory for unknown sessions.
    - `npx vitest run tests/features/session-tracker/persistence/retry-queue.test.ts` fails before retry queue implementation and asserts persisted retry records.
    - Test files contain no `vi.spyOn(..., "private")`-style private persistence mock for new CP-ST-06 behaviors.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts tests/features/session-tracker/persistence/session-index-writer.test.ts tests/features/session-tracker/persistence/child-writer.test.ts tests/features/session-tracker/integration/default-sub.test.ts tests/features/session-tracker/integration/last-message.test.ts tests/features/session-tracker/persistence/retry-queue.test.ts</automated>
  </verify>
  <done>RED tests exist for RC-1 through RC-5 and encode GA-1/GA-2/GA-3 constraints.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Add RED parallel children integration tests</name>
  <files>tests/features/session-tracker/integration/parallel-children.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - tests/features/session-tracker/integration/concurrency.test.ts
    - src/features/session-tracker/persistence/hierarchy-index.ts
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/persistence/session-index-writer.ts
  </read_first>
  <behavior>
    - GA-5 case 1: three L1 children created in parallel from the same L0 root produce three child JSON files under the root directory.
    - GA-5 case 2: nested parallel L1/L2 creation preserves root-owned hierarchy for all L2 children.
    - GA-5 case 3: concurrent writes from two children preserve all turns with no data loss.
  </behavior>
  <action>Create `parallel-children.test.ts` using temp filesystem setup, `Promise.all`, and disk assertions against child `.json`, `session-continuity.json`, and/or `hierarchy-manifest.json`. This is required by GA-5; do not replace it with unit mocks.</action>
  <acceptance_criteria>
    - File contains tests named for `three children`, `nested parallel`, and `concurrent writes`.
    - Test file uses `Promise.all` and real `readFile`/`existsSync` assertions.
    - `npx vitest run tests/features/session-tracker/integration/parallel-children.test.ts` fails before implementation and passes after implementation.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/integration/parallel-children.test.ts</automated>
  </verify>
  <done>Parallel child behavior is locked by integration tests before production rewrite.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test temp fs → production code | Tests must exercise real persistence without mutating project `.hivemind/` state. |
| stale private mocks → rewrite authority | Old mocks can falsely validate dead behavior; audit must classify each test. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-06-01 | Repudiation | CP-ST-06-TEST-AUDIT.md | mitigate | Require one audit row and rationale before deleting/replacing each stale test per GA-3. |
| T-CP-ST-06-02 | Tampering | temp filesystem tests | mitigate | Use temp directories only and assert paths stay under temp `.hivemind/session-tracker/`. |
</threat_model>

<verification>
Run scoped tests listed in task verify blocks. RED failures are acceptable before downstream implementation only if they fail on the expected missing behavior, not syntax/import errors.
</verification>

<success_criteria>
- Test audit file exists and covers every stale/failing test individually.
- RED tests cover RC-1 through RC-5 plus GA-5.
- No source runtime file is modified by this plan.
</success_criteria>

<source_audit>
GOAL: covered by RED tests for all six root causes.
REQ: RC-1..RC-6 covered; GA-1, GA-2, GA-3, GA-5 covered.
RESEARCH: Wave 0 gaps at RESEARCH lines 406-412 covered.
CONTEXT: locked decisions GA-1..GA-5 are either directly tested here or scheduled in later plans; no deferred idea included.
</source_audit>

<output>
After completion, create `.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-01-SUMMARY.md`.
</output>
