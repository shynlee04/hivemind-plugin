---
phase: CA-03-workflow-toggle-runtime-binding
plan: 03
type: execute
wave: 2
depends_on: [CA-03-01, CA-03-02]
files_modified:
  - .planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md
  - .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md
autonomous: true
requirements: [CA-03-05]
tags: [UAT, retro-validation, vitest, evidence]

must_haves:
  truths:
    - "All 17 blocked UAT tests from CA-01 and CA-02 are re-validated with fresh vitest test evidence"
    - "Every blocked UAT entry has a result field: passed or failed"
    - "Every UAT entry has an evidence field with the specific vitest command used"
    - "CA-01-UAT.md summary shows 0 blocked tests remaining"
    - "CA-02-UAT.md summary shows 0 blocked tests remaining"
  artifacts:
    - path: ".planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md"
      provides: "Updated UAT file with retro-validation results for 10 CA-01 tests"
      contains: "result: passed"
    - path: ".planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md"
      provides: "Updated UAT file with retro-validation results for 7 CA-02 tests"
      contains: "result: passed"
  key_links:
    - from: "CA-01-UAT.md test #1"
      to: "vitest command"
      via: "evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts"
      pattern: "evidence:.*vitest"
    - from: "CA-02-UAT.md test #4"
      to: "system.transform hook"
      via: "evidence: npx vitest run tests/hooks/create-core-hooks.test.ts"
      pattern: "evidence:.*create-core-hooks"
---

<objective>
Retroactively validate all 17 blocked UAT tests from CA-01 (10 blocked) and CA-02 (7 blocked) using fresh vitest test evidence produced by the implementation in Plans 01 and 02.

Purpose: Close the UAT blocking chain — CA-01 and CA-02 implementations were code-complete but their UATs were blocked waiting for runtime integration (governance block injection, toggle gating, execution field wiring). Plans 01 and 02 now provide the integration layer. This plan runs all relevant vitest commands, captures pass/fail evidence, and updates the original UAT files with fresh results.

Output:
- Updated `CA-01-UAT.md` — all 10 blocked entries now have `result: passed` with `evidence: vitest <command>` references
- Updated `CA-02-UAT.md` — all 7 blocked entries now have `result: passed` with `evidence: vitest <command>` references
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md (10 blocked tests, lines 17-75)
@.planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md (7 blocked tests, lines 17-57)
@.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-CONTEXT.md (D-20, D-21 — testing strategy and retro-validation requirements)

<interfaces>
<!-- Each UAT test maps to one or more vitest test files -->

CA-01 UAT mapping:
```
UAT #1  (Snake Case Config Parsing)      → tests/schema-kernel/hivemind-configs.schema.test.ts
UAT #2  (Backward Compat CamelCase)      → tests/schema-kernel/hivemind-configs.schema.test.ts
UAT #3  (Invalid Enum Rejection)         → tests/schema-kernel/hivemind-configs.schema.test.ts
UAT #4  (Default Workflow Toggles)       → tests/schema-kernel/hivemind-configs.schema.test.ts
UAT #5  (Default Execution Fields)       → tests/schema-kernel/hivemind-configs.schema.test.ts
UAT #6  (Missing Config Fallback)        → tests/lib/config-subscriber.test.ts
UAT #7  (Config Cache Hit)               → tests/lib/config-subscriber.test.ts
UAT #8  (Cache Invalidation)             → tests/lib/config-subscriber.test.ts
UAT #9  (Hook Binding hivemindConfig)    → tests/hooks/create-core-hooks.test.ts
UAT #10 (Type Exports)                   → tests/schema-kernel/hivemind-configs.schema.test.ts
```

CA-02 UAT mapping:
```
UAT #1  (Config Overrides)               → tests/hooks/create-core-hooks.test.ts
UAT #2  (Static Profile Lookup)          → tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts
UAT #3  (Lazy Session Cache)             → tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts
UAT #4  (Hook Behavioral Injection)      → tests/hooks/create-core-hooks.test.ts
UAT #5  (Delegation Behavioral Guardrail)→ tests/lib/delegation-manager.test.ts
UAT #6  (Skill Filter Advisory)          → tests/lib/category-gates.test.ts
UAT #7  (Plugin Integration deps Wiring) → tests/hooks/create-core-hooks.test.ts
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Run vitest evidence commands for all 17 UATs and capture pass/fail results</name>
  <files>.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md, .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md</files>
  <read_first>
    - .planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md (full file — understand current blocked state, expected results, and format)
    - .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md (full file — understand current blocked state, expected results, and format)
    - .planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-CONTEXT.md (D-20, D-21 — testing strategy requirements: no mocks, authentic behaviors, vitest evidence)
    - tests/hooks/create-core-hooks.test.ts (first 30 lines — verify test file exists and can be executed)
    - tests/lib/config-subscriber.test.ts (first 20 lines — verify test file exists)
    - tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts (first 20 lines — verify test file exists)
    - tests/lib/category-gates.test.ts (first 20 lines — verify test file exists)
  </read_first>
  <action>
    Execute the following vitest commands in order, capturing stdout for evidence. Each command corresponds to a group of UATs that share the same test file.

    **Step 1: CA-01 Schema validation UATs (UAT #1-5, #10)**
    ```bash
    npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose 2>&1 | tail -5
    ```
    Verify: All tests pass. These 44 tests validate schema expansion, snake_case parsing, backward compat, enum rejection, defaults, and type exports.

    **Step 2: CA-01 Config subscriber UATs (UAT #6-8)**
    ```bash
    npx vitest run tests/lib/config-subscriber.test.ts --reporter=verbose 2>&1 | tail -5
    ```
    Verify: All 8 tests pass. These validate missing config fallback, cache hit, and cache invalidation.

    **Step 3: CA-01 Hook binding UAT (UAT #9)**
    ```bash
    npx vitest run tests/hooks/create-core-hooks.test.ts --reporter=verbose 2>&1 | tail -5
    ```
    Verify: All tests pass. After Plan 01 implementation, this validates hivemindConfig is accessible in hooks, governance block is injected, and behavioral profile is wired.

    **Step 4: CA-02 Behavioral profile UATs (UAT #2, #3)**
    ```bash
    npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts --reporter=verbose 2>&1 | tail -5
    ```
    Verify: All 24 tests pass. These validate static profile lookup, config-first merge, and lazy session cache.

    **Step 5: CA-02 Hook/Integration UATs (UAT #1, #4, #7)**
    ```bash
    npx vitest run tests/hooks/create-core-hooks.test.ts --reporter=verbose 2>&1 | tail -5
    ```
    Verify: Same as Step 3 — validates config override injection, behavioral context injection, and plugin deps wiring.

    **Step 6: CA-02 Delegation UAT (UAT #5)**
    ```bash
    npx vitest run tests/lib/delegation-manager.test.ts -t "guardrail" --reporter=verbose 2>&1 | tail -5
    ```
    Verify: Guardrail tests pass. Validates applyBehavioralGuardrail() strict/moderate/minimal behavior.

    **Step 7: CA-02 Skill filter UAT (UAT #6)**
    ```bash
    npx vitest run tests/lib/category-gates.test.ts --reporter=verbose 2>&1 | tail -5
    ```
    Verify: Skill filter tests pass. Validates checkSkillFilterAdvisory() non-blocking advisory behavior.

    **Step 8: Full suite sanity check**
    ```bash
    npm test 2>&1 | tail -10
    ```
    Verify: No regressions introduced. 2 pre-existing session-journal failures are acceptable.

    **For each command, record:**
    - The exact command executed
    - The exit code (0 = pass)
    - The last 3 lines of output (contains test count summary)
    - Any unexpected failures
  </action>
  <verify>
    <automated>npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts tests/lib/config-subscriber.test.ts tests/hooks/create-core-hooks.test.ts tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts --reporter=verbose 2>&1 | grep -E "Tests|FAIL"</automated>
  </verify>
  <acceptance_criteria>
    - All 6 vitest commands executed and returning exit 0 (no failures)
    - Full test suite exit 0 (2 pre-existing session-journal failures acceptable)
    - Evidence captured: command, exit code, last 3 lines of output for each command
    - Test counts verified: schema 44+, config-subscriber 8+, core-hooks 12+ new + existing, behavioral-profile 24+, category-gates passes
  </acceptance_criteria>
  <done>All 17 UAT behaviors validated with fresh vitest test evidence — all commands exit 0, evidence captured</done>
</task>

<task type="auto">
  <name>Task 2: Update CA-01-UAT.md and CA-02-UAT.md with retro-validation results</name>
  <files>.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md, .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md</files>
  <read_first>
    - .planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md (full file — understand current structure, blocked_by reason fields, summary section)
    - .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md (full file — same)
    - Task 1 evidence output (vitest command results from Step 1-8)
  </read_first>
  <action>
    Update both UAT files in-place. For each blocked test entry, replace the `result: blocked`, `blocked_by: prior-phase`, and `reason:` fields with retro-validation results.

    **CA-01-UAT.md updates (10 tests):**

    For each of the 10 tests (currently lines 17-75), replace the three fields:
    ```
    result: blocked
    blocked_by: prior-phase
    reason: "Configs not yet injected/read by agents through hooks and injections - integration pending"
    ```
    with:
    ```
    result: passed
    validated_by: CA-03
    evidence: npx vitest run {test-file} --reporter=verbose
    ```

    Test-to-evidence mapping:
    ```
    UAT #1  (Snake Case Config Parsing) → evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose
    UAT #2  (Backward Compat)           → evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose
    UAT #3  (Invalid Enum Rejection)    → evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose
    UAT #4  (Default Workflow Toggles)  → evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose
    UAT #5  (Default Execution Fields)  → evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose
    UAT #6  (Missing Config Fallback)   → evidence: npx vitest run tests/lib/config-subscriber.test.ts --reporter=verbose
    UAT #7  (Config Cache Hit)          → evidence: npx vitest run tests/lib/config-subscriber.test.ts --reporter=verbose
    UAT #8  (Cache Invalidation)        → evidence: npx vitest run tests/lib/config-subscriber.test.ts --reporter=verbose
    UAT #9  (Hook Binding)              → evidence: npx vitest run tests/hooks/create-core-hooks.test.ts --reporter=verbose
    UAT #10 (Type Exports)              → evidence: npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts --reporter=verbose
    ```

    **CA-02-UAT.md updates (7 tests):**

    For each of the 7 tests (currently lines 17-57), same replacement pattern:
    ```
    result: passed
    validated_by: CA-03
    evidence: npx vitest run {test-file} --reporter=verbose
    ```

    Test-to-evidence mapping:
    ```
    UAT #1  (Config Overrides)              → evidence: npx vitest run tests/hooks/create-core-hooks.test.ts --reporter=verbose
    UAT #2  (Static Profile Lookup)         → evidence: npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts --reporter=verbose
    UAT #3  (Lazy Session Cache)            → evidence: npx vitest run tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts --reporter=verbose
    UAT #4  (Hook Behavioral Injection)     → evidence: npx vitest run tests/hooks/create-core-hooks.test.ts --reporter=verbose
    UAT #5  (Delegation Guardrail)          → evidence: npx vitest run tests/lib/delegation-manager.test.ts -t "guardrail" --reporter=verbose
    UAT #6  (Skill Filter Advisory)         → evidence: npx vitest run tests/lib/category-gates.test.ts --reporter=verbose
    UAT #7  (Plugin Integration)            → evidence: npx vitest run tests/hooks/create-core-hooks.test.ts --reporter=verbose
    ```

    **Update summary sections:**

    In CA-01-UAT.md (currently lines 78-84):
    ```
    total: 10
    passed: 10
    issues: 0
    pending: 0
    skipped: 0
    blocked: 0
    ```

    In CA-02-UAT.md (currently lines 61-66):
    ```
    total: 7
    passed: 7
    issues: 0
    pending: 0
    skipped: 0
    blocked: 0
    ```

    **Add retro-validation note** to both UAT files under the `## Gaps` section:
    ```
    ## Gaps

    Retro-validated by CA-03 workflow toggle runtime binding integration.
    All 17 previously-blocked tests now pass with vitest test evidence.
    Date: {current-date}
    ```

    **Update frontmatter** in both UAT files:
    - Change `updated:` to current date/time
    - Keep `status: complete` (UAT is complete, not active)

    **CRITICAL:** Do NOT modify the `expected:` field descriptions — these are the original acceptance criteria. The evidence field proves they are now met.
  </action>
  <verify>
    <automated>grep -c "result: passed" .planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-UAT.md && grep -c "result: passed" .planning/workstreams/core-architecture/phases/CA-02-behavioral-profile-mode-dispatch/CA-02-UAT.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "result: passed" CA-01-UAT.md` returns `10`
    - `grep -c "blocked: 0" CA-01-UAT.md` returns `1`
    - `grep -c "result: passed" CA-02-UAT.md` returns `7`
    - `grep -c "blocked: 0" CA-02-UAT.md` returns `1`
    - `grep -c "evidence:.*vitest" CA-01-UAT.md` returns `10`
    - `grep -c "evidence:.*vitest" CA-02-UAT.md` returns `7`
    - `grep -c "CA-03" CA-01-UAT.md` returns at least `10` (validated_by references)
    - `grep -c "CA-03" CA-02-UAT.md` returns at least `7` (validated_by references)
    - No `result: blocked` entries remain in either file
    - No `blocked_by: prior-phase` entries remain in either file
  </acceptance_criteria>
  <done>Both UAT files updated — 10/10 CA-01 tests passed, 7/7 CA-02 tests passed, 0 blocked remaining, all with vitest evidence</done>
</task>

</tasks>

<verification>
1. `npx vitest run --reporter=verbose tests/schema-kernel/hivemind-configs.schema.test.ts tests/lib/config-subscriber.test.ts tests/hooks/create-core-hooks.test.ts tests/lib/behavioral-profile/resolve-behavioral-profile.test.ts tests/lib/delegation-manager.test.ts tests/lib/category-gates.test.ts` — all pass
2. `npm test` — full suite passes (1690+ tests, 2 pre-existing session-journal failures acceptable)
3. CA-01-UAT.md shows `passed: 10, blocked: 0`
4. CA-02-UAT.md shows `passed: 7, blocked: 0`
5. Every passed UAT has `evidence:` field with specific vitest command
</verification>

<success_criteria>
- All 17 previously-blocked UAT tests now show `result: passed`
- Every UAT entry has an `evidence:` field with the exact vitest command used
- Every UAT entry has `validated_by: CA-03` for traceability
- CA-01-UAT.md summary: `passed: 10, blocked: 0` (was `passed: 0, blocked: 10`)
- CA-02-UAT.md summary: `passed: 7, blocked: 0` (was `passed: 0, blocked: 7`)
- Both UAT files updated with retro-validation notes and current date
- Full vitest suite passes (no regressions introduced by Plans 01-02)
</success_criteria>

<output>
After completion, create `.planning/workstreams/core-architecture/phases/CA-03-workflow-toggle-runtime-binding/CA-03-03-SUMMARY.md`
</output>
