---
phase: C4-Performance-Optimization
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - tests/coordination/completion/detector-stability-prune.test.ts
autonomous: true
requirements:
  - REQ-03
must_haves:
  truths:
    - "pruneStaleTimers test can be run as a standalone vitest target"
    - "Test file compiles without type errors"
  artifacts:
    - path: "tests/coordination/completion/detector-stability-prune.test.ts"
      provides: "Test scaffold for pruneStaleTimers (REQ-03)"
      min_lines: 80
      exports: []
  key_links: []
user_setup: []
---

<objective>
Create the missing test file `tests/coordination/completion/detector-stability-prune.test.ts` for REQ-03 (pruneStaleTimers), ensuring Wave 1 can verify immediately after implementation without "MISSING test file" gaps.

Purpose: Blocking dependency for Wave 1 task C4-02-01. Without this test file, the `pruneStaleTimers` implementation cannot be verified via automated test.
Output: Test file containing 4 test cases covering the full pruneStaleTimers contract from SPEC.md.
</objective>

<execution_context>
@/Users/apple/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/C4-Performance-Optimization/C4-SPEC.md
@.planning/phases/C4-Performance-Optimization/C4-RESEARCH.md
@.planning/phases/C4-Performance-Optimization/C4-VALIDATION.md
@src/coordination/completion/detector.ts

# Reference for test patterns in this project
@tests/lib/coordination/completion/detector-v2.test.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create test file for pruneStaleTimers</name>
  <files>
    tests/coordination/completion/detector-stability-prune.test.ts
  </files>
  <action>
    Create the test file at `tests/coordination/completion/detector-stability-prune.test.ts` covering REQ-03 from SPEC.md. The file tests `CompletionDetector.pruneStaleTimers(maxAgeMs)`.

    Test patterns from existing `tests/lib/coordination/completion/detector-v2.test.ts`:
    - Use `import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"`
    - Use `import { CompletionDetector } from "../../../src/coordination/completion/detector.js"`
    - Instantiate `new CompletionDetector(stabilityTimeoutMs)` with constructor arg
    - Use `vi.advanceTimersByTime()` and `vi.useFakeTimers()` for timer control
    - Use `detector["stabilityTimers"]` private field access via bracket notation (existing pattern)
    - Use `detector["messageCounts"]` private field access
    - Use `detector["timerStartTimes"]` private field access (new field being added in Wave 1)
    - Import `ReturnType` from TypeScript is already available

    Four test cases required (per SPEC.md acceptance criteria):

    1. **"pruneStaleTimers removes all stale timers when maxAgeMs is 0"**:
       - Add 3 stability timers via `detector["stabilityTimers"].set("session-1", setTimeout(() => {}, 30000))` and populate `detector["messageCounts"].set("session-1", 5)` (same for session-2, session-3)
       - Set `detector["timerStartTimes"].set("session-1", Date.now() - 5000)` etc.
       - Call `const pruned = detector.pruneStaleTimers(0)`
       - Expect `pruned === 3`
       - Expect `detector["stabilityTimers"].size === 0`
       - Expect `detector["messageCounts"].size === 0`
       - Expect `detector["timerStartTimes"].size === 0`

    2. **"pruneStaleTimers prunes nothing when maxAgeMs is large and timers are recent"**:
       - Add 3 stability timers, set `timerStartTimes` to `Date.now() - 1000` (1 second ago)
       - Call `detector.pruneStaleTimers(120_000)` (120 seconds max age)
       - Expect pruned === 0
       - Expect all 3 entries still present in stabilityTimers, messageCounts, timerStartTimes

    3. **"pruneStaleTimers handles empty Maps gracefully"**:
       - Call `detector.pruneStaleTimers(5000)` on a fresh detector with no timers
       - Expect pruned === 0
       - No errors thrown

    4. **"pruneStaleTimers partially prunes when some timers are stale"**:
       - Add 3 timers: session-1 (5000ms old), session-2 (1000ms old), session-3 (10000ms old)
       - Set `timerStartTimes` accordingly
       - Call `detector.pruneStaleTimers(3000)` (prune timers older than 3 seconds)
       - Expect pruned === 2 (session-1 and session-3)
       - Expect stabilityTimers has only session-2 remaining
       - Expect messageCounts has only session-2 remaining
       - Expect timerStartTimes has only session-2 remaining
       - Clear remaining fake timers in `afterEach` via `vi.useRealTimers()`

    File location: Create `tests/coordination/completion/` directory if it doesn't exist. Register with `.gitkeep` if needed.
  </action>
  <verify>
    <automated>npx vitest run tests/coordination/completion/detector-stability-prune.test.ts -t "pruneStaleTimers" --reporter verbose</automated>
  </verify>
  <done>
    All 4 test cases pass. Typecheck passes for the test file.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
No trust boundaries — this is a test file with no runtime impact.

## STRIDE Threat Register
No threats — test-only file, no code execution paths.
</threat_model>

<verification>
- `npx vitest run tests/coordination/completion/detector-stability-prune.test.ts -t "pruneStaleTimers" --reporter verbose` passes all 4 tests
- `npx vitest run tests/coordination/completion/detector-stability-prune.test.ts` passes (all tests)
- TypeScript compilation of test file succeeds (no tsconfig issues for test directory)
</verification>

<success_criteria>
- Wave 0 test file exists at expected path
- All 4 pruneStaleTimers test cases defined and passing
- Tests compile cleanly (no type errors)
- Wave 1 can import and verify against this test file immediately
</success_criteria>

<output>
Create `.planning/phases/C4-Performance-Optimization/C4-01-SUMMARY.md` when done
</output>
