# Red-First Protocol

## The Rule

```
No implementation code shall be written until tests fail for the RIGHT reason.
A passing test before implementation = lying evidence. Stop and fix.
```

## Purpose

This protocol governs the RED phase of cross-cutting changes. It ensures that the test failure is caused by the intended behavioral change — not by compilation errors, import path mistakes, test setup errors, or mock poisoning. A test that fails for a wrong reason is as dangerous as a test that passes deceptively: both create false confidence.

Adapted from `addyosmani/agent-skills@test-driven-development` Prove-It pattern and `helderberto/skills@tdd` one-test-at-a-time discipline, extended for multi-pan verification.

## Protocol Steps

### Step 1: Write the Failing Test

Write the smallest test that captures the new or changed behavior. Follow test-size conventions:

| Size | Scope | Example |
|------|-------|---------|
| **Small** | Single function, no I/O, no network | Unit test of a pure function |
| **Medium** | Module + dep, filesystem or DB OK, no network | Service test with test database |
| **Large** | Full integration, network OK, realistic deps | End-to-end API test |

For cross-cutting changes, write at least one medium or large test that spans the affected pans. Small tests alone cannot detect pan-boundary mismatches.

### Step 2: Run the Test — Confirm RED

Execute the exact test command and capture output:

```bash
# Capture full output including stderr
npm test -- --reporter=verbose -- test-file.test.ts 2>&1 | tee red-evidence-$(date +%s).log
```

### Step 3: Verify the Failure Reason

This is the critical gate. Read the failure output and classify:

```yaml
failure_classification:
  type: "behavioral" | "compilation" | "setup" | "mock" | "import" | "unrelated"
  reason: "<exact failure message>"
  valid_red: true | false
```

**Valid RED (behavioral) — Proceed:**

```
AssertionError: expected engine.process(input) to return 'new-value'
     but got 'old-value'
```

The failure is directly about the behavior being changed. The old code returns the old value — correct failure.

**Invalid RED (compilation) — STOP and fix test:**

```
error TS2339: Property 'newMethod' does not exist on type 'Engine'.
```

This is a type error, not a behavior test. The test file has a compilation issue. Fix the test to use the current interface shape and assert on behavioral output.

**Invalid RED (setup) — STOP and fix test:**

```
Error: Cannot find module '../helpers/setup'
```

Test infrastructure is broken. Fix the import or setup before counting this as RED evidence.

**Invalid RED (mock) — STOP and fix test:**

```
AssertionError: expected mockEngine.process to have been called once
```

This tests mock interaction, not real behavior. The real engine might produce wrong output but the test would still pass. Use `references/mock-honesty-detection.md` to redesign this test.

**Invalid RED (import) — STOP and fix test:**

```
Error: Cannot resolve './new-module'
```

The module path doesn't exist. This is a file structure error, not behavior evidence.

### Step 4: Record RED Evidence

For each test-pan file, produce a RED evidence record:

```yaml
test_file: tests/engine.test.ts
pan: test
command: "npm test -- tests/engine.test.ts"
timestamp: "2026-04-28T10:30:00Z"
red_output_summary: |
  AssertionError: expected engine.process('input') to return 'new-value'
  but got 'old-value'
  at Object.<anonymous> (tests/engine.test.ts:42:15)
failure_classification:
  type: behavioral
  reason: "Engine returns old behavior — new value not yet implemented"
  valid_red: true
```

Store evidence in `.hivemind/evidence/red-<change_id>-<test_file>.log`.

### Step 5: Verify All Test-Pan Files

After all test-pan files have RED evidence, verify:

- [ ] Every test-pan file identified in Phase 2 (Scan) has RED evidence
- [ ] Every RED failure is `type: behavioral` and `valid_red: true`
- [ ] No test passes before implementation begins

**Gate:** If ANY test-pan file lacks valid RED evidence, or if ANY test passes, do not proceed to implementation.

## Common RED Protocol Failures

| Failure | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| **Premature GREEN** | Test passes on first run | Test is testing existing behavior, not new behavior | Rewrite test to assert on the NEW expected behavior |
| **Abstract RED** | Test fails but failure is vague ("expected truthy, got falsy") | Assertion too weak | Use specific assertions comparing exact values |
| **Batch RED** | Multiple tests written before any implementation | Violates one-change-at-a-time discipline | Pick ONE test, implement for it, then write next test |
| **Stale RED** | Test fails now but would have failed with old code too | Test is testing a pre-existing bug, not the new change | Narrow test to the delta only; open a separate bug ticket for the pre-existing issue |
| **Incomplete RED** | Only small tests have RED; medium/large tests skipped | Cross-pan verification missing | Add at least one medium or large test exercising pan boundaries |
| **Logger RED** | Test "fails" because a mock logger wasn't called | Test is testing logging, not behavior | Remove mock assertions on logging; test behavioral outputs |

## RED Protocol for Bug Fixes

When the cross-cutting change is a bug fix (not a feature), follow the Prove-It pattern:

1. Write a test that reproduces the bug (must fail with current code)
2. Capture the exact bug reproduction — error message, stack trace, expected vs actual
3. Record as RED evidence with `failure_classification.type: behavioral`
4. Prove the fix makes the test pass
5. Add regression tests for related paths that might have the same bug class

If the bug cannot be reproduced in a test, the fix is speculative — label it as such and do not claim TDD.

## RED Protocol for Multi-Pan Changes

When tests span multiple pans, run RED verification in this order:

1. **Interface tests first** — API contract tests fail because new routes/types don't exist
2. **Deep module tests second** — Logic tests fail because behavior hasn't changed
3. **Consumer tests third** — Integration tests fail because consumer expectations are unmet

This ordering mirrors the implementation ordering. Interface RED proves the contract gap. Deep module RED proves the behavior gap. Consumer RED proves the integration gap.

## Post-RED Checklist

Before moving to implementation:

- [ ] RED evidence logged for every test-pan file
- [ ] Every failure classified as `type: behavioral`
- [ ] Every failure recorded with exact command + timestamp
- [ ] No test passes before implementation
- [ ] At least one medium/large test included
- [ ] For bug fixes: bug reproduction test written and failing
- [ ] For multi-pan: interface, deep module, and consumer tests all show RED
- [ ] RED evidence files stored in `.hivemind/evidence/`
