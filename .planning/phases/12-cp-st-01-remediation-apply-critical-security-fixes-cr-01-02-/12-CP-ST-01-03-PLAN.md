---
phase: "12-cp-st-01-remediation"
plan: 3
type: execute
wave: 3
depends_on: ["12-CP-ST-01-01", "12-CP-ST-01-02"]
files_modified:
  - src/features/session-tracker/index.ts
  - tests/features/session-tracker/
  - tests/tools/hivemind/
autonomous: true
requirements:
  - REQ-ST-01
  - REQ-ST-03
  - REQ-ST-06
  - REQ-ST-08
  - REQ-ST-09
  - REQ-ST-10
  - REQ-ST-11
  - REQ-ST-13

must_haves:
  truths:
    - "All 163 existing tests pass as regression baseline (zero regressions)"
    - "Fork handling: new main session from checkpoint correctly references existing child delegations"
    - "Parallel session writes do not corrupt project-continuity.json"
    - "Complete pipeline: hook event → capture handler → index writer → tool query returns correct data"
    - "Disk evidence matches expectations: project-continuity.json has correct childCount, status, lastUpdated"
    - "All 14 CP-ST-01-REVIEW.md findings resolved with evidence"
  artifacts:
    - path: "tests/features/session-tracker/integration/fork-handling.test.ts"
      provides: "Fork detection + child reference-copy test"
    - path: "tests/features/session-tracker/integration/parallel-session.test.ts"
      provides: "Concurrent write isolation test"
    - path: "tests/features/session-tracker/integration/pipeline-verification.test.ts"
      provides: "End-to-end pipeline verification"
  key_links:
    - from: "src/features/session-tracker/capture/event-capture.ts"
      to: "src/features/session-tracker/persistence/child-writer.ts"
      via: "Child event routing verified"
    - from: "src/features/session-tracker/capture/tool-capture.ts"
      to: "src/features/session-tracker/persistence/project-index-writer.ts"
      via: "Project index updates verified"
    - from: "src/tools/hivemind/session-tracker.ts"
      to: ".hivemind/session-tracker/"
      via: "Tool query returns fresh data"
</must_haves>

<objective>
Verify the complete session tracker pipeline end-to-end after Wave 1 fixes and Wave 2 tool redesign. Add fork handling logic, validate parallel session write isolation, run full regression test pass against all 163 existing tests, and confirm disk evidence matches expectations. Address remaining review findings (IN-02 through IN-05) not already covered by Wave 1/2 fixes.

**Purpose:** Prove the entire pipeline works correctly under realistic conditions — multi-session concurrency, fork scenarios, and the full hook→capture→persistence→tool chain.

**Output:** 200+ tests passing, disk evidence validated, all 14 review findings resolved, verified pipeline.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/execute-plan.md
@.agent/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md (sections 5, 6 — risk assessment + test strategy)
@.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md (locked 13 requirements)
@.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md (14 review findings)
</context>

<tasks>

<!-- ========================================================================= -->
<!-- T-01: Wave 0 test scaffolding — create missing test files BEFORE verification -->
<!-- ========================================================================= -->
<task type="implement" id="T-01">
  <name>Task 1: Create Wave 0 test scaffolding (missing test files for new coverage)</name>
  <depends_on></depends_on>
  <files>
    - tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts
    - tests/features/session-tracker/capture/tool-capture-child.test.ts
    - tests/features/session-tracker/capture/event-capture-child.test.ts
    - tests/features/session-tracker/capture/event-capture-compaction.test.ts
    - tests/features/session-tracker/tools/tool-safety.test.ts
    - tests/tools/hivemind/session-hierarchy.test.ts
    - tests/tools/hivemind/session-context.test.ts
    - tests/features/session-tracker/integration/fork-handling.test.ts
  </files>
  <read_first>
    - tests/features/session-tracker/capture/tool-capture.test.ts (reason: test pattern reference — vitest globals, mock setup)
    - tests/features/session-tracker/capture/event-capture.test.ts (reason: test pattern reference for event-capture tests)
    - tests/features/session-tracker/persistence/project-index-writer.test.ts (reason: test pattern reference for index writer)
    - vitest.config.ts (reason: test framework config)
  </read_first>
  <action>
    Create missing test files that correspond to Wave 0 gaps identified in RESEARCH.md section 6. Each test file should follow existing patterns: vitest globals (`describe`, `it`, `expect`, `vi`, `beforeEach`), mock OpenCodeClient and writers, test both success and error paths.

    **Create these 8 test files with initial failing tests:**

    1. **`tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts`**
       - Test: queue unblocks after stale detection (DEFECT-02)
       - Test: getQueueHealth returns correct stalled state
       - Test: normal writes succeed after queue recovery

    2. **`tests/features/session-tracker/capture/tool-capture-child.test.ts`**
       - Test: handleTask creates child .json with initial "delegation_spawn" turn (DEFECT-03 fix)
       - Test: childWriter.appendChildTurn is called after createChildFile
       - Test: child session has status "active" and non-empty turns[]

    3. **`tests/features/session-tracker/capture/event-capture-child.test.ts`**
       - Test: session.idle routes to childWriter.updateChildStatus for child sessions (DEFECT-08)
       - Test: session.deleted routes to childWriter for child sessions
       - Test: session.error routes to childWriter for child sessions
       - Test: main session events still use sessionWriter (no regression)

    4. **`tests/features/session-tracker/capture/event-capture-compaction.test.ts`**
       - Test: session.compacted event writes ## COMPACTED block (D-10)
       - Test: compaction block includes timestamp
       - Test: session.compacted for child session is handled gracefully

    5. **`tests/features/session-tracker/tools/tool-safety.test.ts`**
       - Test: export-session rejects sessionId with "../" (CR-02, GAP-01)
       - Test: export-session rejects sessionId with "/" (path separator)
       - Test: get-children rejects invalid sessionId
       - Test: find-related rejects traversal attempts

    6. **`tests/tools/hivemind/session-hierarchy.test.ts`**
       - Test: get-children returns child list for session with delegations
       - Test: get-children returns empty array for session with no children
       - Test: get-parent-chain returns ordered chain up to root
       - Test: get-delegation-depth returns correct depth for nested children

    7. **`tests/tools/hivemind/session-context.test.ts`**
       - Test: find-related returns sessions with shared tool usage
       - Test: synthesize-context returns markdown summary with frontmatter
       - Test: cross-reference finds child sessions by tool name

    8. **`tests/features/session-tracker/integration/fork-handling.test.ts`**
       - Test: new main session from checkpoint references existing children (reference-copy, not duplication)
       - Test: fork detection via session metadata comparison

    **Pattern for each test file:**
    ```typescript
    import { describe, it, expect, vi, beforeEach } from "vitest"
    // Import the module under test
    // Set up mocks in beforeEach
    // Write focused test cases
    ```

    Tests should INITIALLY FAIL (RED phase) — they will pass after Wave 1 and Wave 2 implementations are complete. Run `npx vitest run` on each file to confirm it fails before proceeding.
  </action>
  <acceptance_criteria>
    - All 8 test files exist with at least 2 test cases each
    - `grep "describe\|it(" tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts` returns match
    - `grep "describe\|it(" tests/features/session-tracker/capture/tool-capture-child.test.ts` returns match
    - `grep "describe\|it(" tests/features/session-tracker/capture/event-capture-child.test.ts` returns match
    - `grep "describe\|it(" tests/features/session-tracker/capture/event-capture-compaction.test.ts` returns match
    - `grep "describe\|it(" tests/features/session-tracker/tools/tool-safety.test.ts` returns match
    - `grep "describe\|it(" tests/tools/hivemind/session-hierarchy.test.ts` returns match
    - `grep "describe\|it(" tests/tools/hivemind/session-context.test.ts` returns match
    - `grep "describe\|it(" tests/features/session-tracker/integration/fork-handling.test.ts` returns match
    - `npm run typecheck` passes (type-safe test imports)
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

<!-- ========================================================================= -->
<!-- T-02: Full regression test pass + fix failures                             -->
<!-- ========================================================================= -->
<task type="verify" id="T-02">
  <name>Task 2: Run full regression test suite — fix any failures</name>
  <depends_on>T-01</depends_on>
  <files>
    - tests/features/session-tracker/**/*.test.ts
    - tests/tools/hivemind/session-tracker.test.ts
    - tests/tools/hivemind/session-hierarchy.test.ts
    - tests/tools/hivemind/session-context.test.ts
  </files>
  <read_first>
    - tests/features/session-tracker/ (reason: all 17 existing test files with 163 tests)
    - tests/tools/hivemind/session-tracker.test.ts (reason: existing tool tests — may need updates for rewritten tool)
  </read_first>
  <action>
    **Step 1: Run full test suite**
    ```bash
    npx vitest run tests/features/session-tracker/
    ```
    Expected: all 163 existing tests pass (regression baseline). If any failures:
    - For each failure, read the failing test to understand what changed
    - Fix the test (if the test was testing wrong behavior that our fix corrected)
    - Fix the implementation (if the fix introduced a regression)

    **Step 2: Run tool tests**
    ```bash
    npx vitest run tests/tools/hivemind/
    ```
    Fix any failures in the rewritten session-tracker tool tests. Update existing test assertions if the tool API changed (e.g., new Zod schema shape, new action names).

    **Step 3: Run new test files**
    ```bash
    npx vitest run tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts
    npx vitest run tests/features/session-tracker/capture/tool-capture-child.test.ts
    npx vitest run tests/features/session-tracker/capture/event-capture-child.test.ts
    npx vitest run tests/features/session-tracker/capture/event-capture-compaction.test.ts
    npx vitest run tests/features/session-tracker/tools/tool-safety.test.ts
    npx vitest run tests/tools/hivemind/session-hierarchy.test.ts
    npx vitest run tests/tools/hivemind/session-context.test.ts
    npx vitest run tests/features/session-tracker/integration/fork-handling.test.ts
    ```
    Each test file should pass. Fix any implementation or test issues.

    **Step 4: Full project test suite**
    ```bash
    npm test
    ```
    Expected: 0 failures across all test suites (163 existing + new tests).

    **Step 5: Typecheck + Build**
    ```bash
    npm run typecheck && npm run build
    ```
  </action>
  <acceptance_criteria>
    - `npx vitest run tests/features/session-tracker/` passes (163+ tests, 0 failures)
    - `npx vitest run tests/tools/hivemind/` passes (0 failures)
    - `npm test` passes (0 failures across all project tests — 1978+ tests)
    - `npm run typecheck` passes (0 errors)
    - `npm run build` succeeds
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

<!-- ========================================================================= -->
<!-- T-03: Fork handling + parallel session isolation + disk evidence verification -->
<!-- ========================================================================= -->
<task type="verify" id="T-03">
  <name>Task 3: Implement fork handling, verify parallel session isolation, validate disk evidence</name>
  <depends_on>T-02</depends_on>
  <files>
    - src/features/session-tracker/index.ts
    - .hivemind/session-tracker/project-continuity.json
  </files>
  <read_first>
    - src/features/session-tracker/index.ts (reason: SessionTracker.initialize, SessionRecovery integration)
    - src/features/session-tracker/recovery/session-recovery.ts (reason: fork detection logic)
    - .hivemind/session-tracker/project-continuity.json (reason: CURRENT live disk evidence — verify after fixes)
    - src/features/session-tracker/persistence/project-index-writer.ts (reason: updated queue — verify writes work)
    - tests/features/session-tracker/integration/concurrency.test.ts (reason: existing parallel session tests)
  </read_first>
  <action>
    **Part A: Fork Handling (Wave 3 requirement)**

    When OpenCode forks a session (creates a new main session from a checkpoint message), the new session shares the parent's child delegation records. Implement fork detection:

    In `src/features/session-tracker/index.ts`, add to `handleSessionEvent` → `session.created` handling:
    ```typescript
    // After session creation, check if this is a fork (child references from parent)
    if (session.parentID && this.projectIndexWriter) {
      // Reference-copy children from parent session (not deep copy — they share the same .json files)
      const parentIndexPath = safeSessionPath(this.projectRoot, session.parentID, "session-continuity.json")
      try {
        const parentRaw = await readFile(parentIndexPath, "utf-8")
        const parentIndex = JSON.parse(parentRaw)
        // If parent has children, create reference entries in the new session's project index
        const parentChildren = parentIndex?.hierarchy?.children
        if (parentChildren && Object.keys(parentChildren).length > 0) {
          // Reference-copy (not duplication — same child .json files referenced)
          for (const [childId, childEntry] of Object.entries(parentChildren)) {
            await this.sessionIndexWriter.addChild(
              sessionID,
              childId,
              (childEntry as { file: string }).file || `${childId}.json`,
              (childEntry as { depth: number }).depth || 1,
              (childEntry as { delegatedBy: string }).delegatedBy || "forked",
            )
          }
        }
      } catch {
        // Parent index may not exist — that's fine
      }
    }
    ```

    **Part B: Parallel Session Write Isolation**

    Verify that the project-index-writer serial queue handles concurrent writes without corruption. The existing test at `tests/features/session-tracker/integration/concurrency.test.ts` should already pass after DEFECT-02 fix. If it doesn't:
    - Add per-entry locking (narrower than global queue)
    - Verify `atomicWriteJson` uses temp-file + rename (prevents partial writes)

    **Part C: Disk Evidence Validation**

    After Wave 1 and Wave 2 fixes are applied:
    1. Run the harness in a live OpenCode session (or simulate with test hooks)
    2. Verify `project-continuity.json`:
       - `lastUpdated` is within the last few minutes (not 7+ hours stale)
       - Session entries have numeric `childCount` (not absent)
       - Status fields transition (active → idle/completed/error)
    3. Verify child `.json` files:
       - `turns[]` is populated (not empty)
       - `status` reflects lifecycle events
       - `mainAgent.model` is not "unknown" (if populated by message capture)
    4. Verify `session-continuity.json`:
       - `turnCount` reflects actual turns (not child count)
       - `toolSummary` is populated (not empty `{}`)
       - `hierarchy.children` entries have correct depth

    **Validate with:**
    ```bash
    # Check project-continuity.json
    node -e "
    const j = require('./.hivemind/session-tracker/project-continuity.json');
    const entries = Object.entries(j.sessions);
    console.log('Total entries:', entries.length);
    const stale = entries.filter(([_,e]) => e.childCount === undefined || e.childCount === 0);
    console.log('Entries missing childCount:', stale.length);
    console.log('lastUpdated:', j.lastUpdated);
    "
    ```
    Expected: `lastUpdated` within 5 minutes, zero entries missing childCount.
  </action>
  <acceptance_criteria>
    - `grep "fork\|reference-copy\|shared child" src/features/session-tracker/index.ts` returns match (fork handling present)
    - `npx vitest run tests/features/session-tracker/integration/fork-handling.test.ts` passes
    - `npx vitest run tests/features/session-tracker/integration/concurrency.test.ts` passes (parallel session isolation)
    - `npm test` passes (full suite, 0 failures)
    - If `.hivemind/session-tracker/project-continuity.json` exists: `node -e "const j=require('./.hivemind/session-tracker/project-continuity.json'); console.log(j.lastUpdated)"` shows recent timestamp
    - `npm run typecheck` passes
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Forked session → child references | New main session from checkpoint shares child delegation records from parent — must be reference-copy, not deep-copy, to prevent data inconsistency |
| Parallel sessions → project index | Concurrent session writes to shared project-continuity.json — serial queue enforces isolation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-11 | Tampering | Fork handler — child reference duplication | mitigate | Reference-copy (not deep-copy) child entries. Both sessions point to the same child .json files. Prevents split-brain where two copies of child data diverge. |
| T-12-12 | Tampering | Parallel session writes to project-continuity.json | mitigate | Serial queue in project-index-writer enforces write ordering. Atomic rename (temp file → target) prevents partial writes. Stale detection recovers stuck queue. |
| T-12-13 | Information Disclosure | Test files contain mock session data | accept | Test fixtures use synthetic data, no production session IDs or content exposed. |
</threat_model>

<verification>
Wave 3 completion gate — **FULL PIPELINE VERIFICATION:**

1. `npm test` — ALL tests pass (163 existing + new Wave 0 tests, 0 failures)
2. `npm run typecheck` — passes
3. `npm run build` — succeeds
4. All 14 CP-ST-01-REVIEW.md findings resolved:
   - CR-01: Recovery path traversal fixed (safeSessionPath in session-recovery.ts)
   - CR-02: Tool path traversal fixed (safeSessionPath in all 3 tools)
   - CR-03: handleRead content capture fixed (structured error detection)
   - WR-01: childCount corruption fixed
   - WR-02: frontmatter race condition fixed
   - WR-03: session ID regex loosened
   - WR-04: turn counter seeding implemented
   - WR-05: cleanup() wired in plugin.ts
   - WR-06: turnCount/childCount conflation fixed
   - IN-01: dynamic import removed
   - IN-02: fork handling implemented
   - IN-03: compaction capture implemented
   - IN-04: statSync/existsSync replaced with async
   - IN-05: tool summary populated
5. Disk evidence: project-continuity.json has advancing lastUpdated, numeric childCount, correct statuses
6. Child .json files have populated turns, updated statuses
7. session-continuity.json has populated toolSummary, correct turnCount
</verification>

<success_criteria>
1. **Regression baseline:** All 163 existing tests pass (zero regressions introduced by 14 fixes)
2. **New test coverage:** 8 new test files created, all passing
3. **Fork handling:** New session from checkpoint correctly references parent's child delegations
4. **Parallel isolation:** Concurrent session writes do not corrupt shared index
5. **Disk evidence:** Live `.hivemind/session-tracker/` data matches expected structures after fixes applied
6. **Review closure:** All 14 CP-ST-01-REVIEW.md findings resolved with verifiable evidence
7. **Pipeline integrity:** Complete hook→capture→index→tool chain verified end-to-end
</success_criteria>

<output>
After completion, create `.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-03-SUMMARY.md`
</output>
