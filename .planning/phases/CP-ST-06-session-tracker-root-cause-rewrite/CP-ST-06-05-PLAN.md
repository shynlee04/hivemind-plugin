---
phase: CP-ST-06-session-tracker-root-cause-rewrite
plan: 05
type: execute
wave: 4
depends_on:
  - CP-ST-06-02
  - CP-ST-06-03
  - CP-ST-06-04
files_modified:
  - tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md
  - tests/features/session-tracker/integration/default-sub.test.ts
  - tests/features/session-tracker/integration/last-message.test.ts
  - tests/features/session-tracker/integration/parallel-children.test.ts
  - tests/features/session-tracker/integration/pipeline.test.ts
  - tests/features/session-tracker/integration/cleanup.test.ts
  - tests/features/session-tracker/index.test.ts
  - tests/features/session-tracker/session-tracker.test.ts
  - tests/features/session-tracker/ensure-session-ready-classification.test.ts
  - tests/features/session-tracker/persistence/hierarchy-index.test.ts
  - tests/features/session-tracker/persistence/session-index-writer.test.ts
  - tests/features/session-tracker/persistence/child-writer.test.ts
autonomous: true
requirements:
  - RC-1
  - RC-2
  - RC-3
  - RC-4
  - RC-5
  - RC-6
  - GA-3
  - GA-5
must_haves:
  truths:
    - "Every stale test disposition from the audit has been applied one-by-one."
    - "Scoped session-tracker tests pass with real filesystem integration coverage."
    - "Full phase verification passes: typecheck, scoped Vitest, full npm test, LOC gates."
  artifacts:
    - path: "tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md"
      provides: "Final audit with applied disposition status"
    - path: "tests/features/session-tracker/integration/parallel-children.test.ts"
      provides: "Parallel child regression coverage"
    - path: "CP-ST-06-05-SUMMARY.md"
      provides: "Execution verification evidence and remaining-risk report"
  key_links:
    - from: "test audit rows"
      to: "actual test file changes"
      via: "applied status and rationale"
      pattern: "applied|kept|rewritten|deleted|future-phase"
    - from: "phase verification"
      to: "source modules"
      via: "typecheck + vitest + LOC gates"
      pattern: "npm run typecheck|npm test|wc -l"
---

<objective>
Apply the audited stale-test rewrite and run final phase verification.

Purpose: CP-ST-06 is only complete when stale private mocks are removed/replaced individually, parallel children are proven, and all root-cause tests pass with full verification.

Output: Final test suite cleanup, applied audit status, and verification evidence.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-RESEARCH.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-01-SUMMARY.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-02-SUMMARY.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-03-SUMMARY.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-04-SUMMARY.md
@tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md
@tests/features/session-tracker/
@src/features/session-tracker/
</context>

<tasks>

<task type="auto">
  <name>Task 1: Apply per-test audit dispositions without bulk deletion</name>
  <files>tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md, tests/features/session-tracker/**/*.test.ts</files>
  <read_first>
    - tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - tests/features/session-tracker/**/*.test.ts
  </read_first>
  <action>For each audit row, apply exactly one disposition: keep valid tests, rewrite stale private-mock tests into public/temp-fs integration tests, delete only rows classified `delete`, and flag `future-phase` rows without asserting them in CP-ST-06. Update the audit row status to `applied` with the actual commit hash when available and the final rationale in the summary. Do not delete files wholesale unless every test in that file has an audit row supporting deletion.</action>
  <acceptance_criteria>
    - `grep -v '^#' tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md | grep -c 'applied'` equals the number of audited test rows.
    - No remaining test imports paths under removed `src/lib/session-tracker` or `event-tracker` internals.
    - Any deleted test name appears in `CP-ST-06-TEST-AUDIT.md` with classification `delete` and a rationale.
  </acceptance_criteria>
  <verify>
    <automated>grep -v '^#' tests/features/session-tracker/CP-ST-06-TEST-AUDIT.md | grep 'applied'</automated>
  </verify>
  <done>Every stale test decision is applied individually and traceably.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Prove parallel hierarchy and child writes with integration tests</name>
  <files>tests/features/session-tracker/integration/parallel-children.test.ts, tests/features/session-tracker/integration/pipeline.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - tests/features/session-tracker/integration/parallel-children.test.ts
    - tests/features/session-tracker/integration/pipeline.test.ts
    - src/features/session-tracker/index.ts
    - src/features/session-tracker/persistence/hierarchy-index.ts
    - src/features/session-tracker/persistence/child-writer.ts
    - src/features/session-tracker/persistence/session-index-writer.ts
  </read_first>
  <behavior>
    - GA-5: three parallel children from one parent preserve all child records.
    - GA-5: nested parallel L1/L2 hierarchy remains root-owned and complete.
    - GA-5: concurrent child writes preserve all turns and no data loss.
  </behavior>
  <action>Run and repair only the integration assertions needed to prove GA-5 against the implemented modules. Keep tests on public API/temp filesystem where possible. Do not add private mocks to make parallel tests pass.</action>
  <acceptance_criteria>
    - `npx vitest run tests/features/session-tracker/integration/parallel-children.test.ts` passes.
    - Test file asserts actual disk JSON content for all parallel child IDs.
    - Test file includes nested parallel L1/L2 case and concurrent writes case.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/integration/parallel-children.test.ts</automated>
  </verify>
  <done>Parallel child safety is verified by integration tests, not documentation only.</done>
</task>

<task type="auto">
  <name>Task 3: Run phase verification and LOC gates</name>
  <files>src/features/session-tracker/index.ts, src/features/session-tracker/session-router.ts, src/features/session-tracker/child-recorder.ts, src/features/session-tracker/initialization.ts, src/features/session-tracker/persistence/child-writer.ts, src/features/session-tracker/persistence/session-index-writer.ts, src/features/session-tracker/persistence/hierarchy-index.ts, src/features/session-tracker/persistence/retry-queue.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - package.json
    - src/features/session-tracker/AGENTS.md
    - src/features/session-tracker/index.ts
    - src/features/session-tracker/session-router.ts
    - src/features/session-tracker/child-recorder.ts
    - src/features/session-tracker/initialization.ts
  </read_first>
  <action>Run the final gates and fix only CP-ST-06-owned failures: `npm run typecheck`, scoped session-tracker Vitest, full `npm test`, and LOC checks for all touched modules. If full `npm test` exposes unrelated pre-existing failures, record them with evidence in the summary and still prove all CP-ST-06 scoped tests pass.</action>
  <acceptance_criteria>
    - `npm run typecheck` passes.
    - `npx vitest run tests/features/session-tracker/` passes with 0 failures.
    - `npm test` passes, or any non-pass is documented as unrelated with exact failing test names and CP-ST-06 scoped pass evidence.
    - `wc -l` for touched session-tracker source modules shows every file <=500 LOC.
  </acceptance_criteria>
  <verify>
    <automated>npm run typecheck && npx vitest run tests/features/session-tracker/ && npm test && wc -l src/features/session-tracker/index.ts src/features/session-tracker/session-router.ts src/features/session-tracker/child-recorder.ts src/features/session-tracker/initialization.ts src/features/session-tracker/persistence/child-writer.ts src/features/session-tracker/persistence/session-index-writer.ts src/features/session-tracker/persistence/hierarchy-index.ts src/features/session-tracker/persistence/retry-queue.ts</automated>
  </verify>
  <done>Phase verification evidence is complete and honest.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| test cleanup → regression confidence | Deleting stale tests can hide behavior gaps unless replacements pass. |
| scoped tests → full suite | Session-tracker fixes must not regress broader harness tests. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-06-10 | Repudiation | test audit | mitigate | Audit row status must show applied disposition for every deleted/reworked test. |
| T-CP-ST-06-11 | Denial of service | full test suite | mitigate | Run `npm test`; document unrelated failures only with exact evidence. |
</threat_model>

<verification>
Final phase commands: `npm run typecheck`, `npx vitest run tests/features/session-tracker/`, `npm test`, and LOC gates for every touched source module.
</verification>

<success_criteria>
- 6 root causes have passing scoped tests.
- Stale tests are audited and applied individually.
- Parallel child integration coverage passes.
- `index.ts` and all touched modules are <=500 LOC.
</success_criteria>

<source_audit>
GOAL: covers stale test rewrite and full phase gate.
REQ: RC-1..RC-6, GA-3, GA-5 covered.
RESEARCH: current failure matrix and phase gate commands covered.
CONTEXT: GA-3 and GA-5 implemented exactly; no deferred scope included.
</source_audit>

<output>
After completion, create `.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-05-SUMMARY.md`.
</output>
