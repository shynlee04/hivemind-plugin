# Test Gate Enforcement

## Purpose

Enforce that no TDD phase completes without passing its test gate.

## Gate Definition

A test gate is a command + expected output pattern that proves phase completion.

## Gate Rules

1. Every delegation packet MUST include `test_gate_command`
2. Child CANNOT claim `status: "complete"` without running the gate
3. Gate failure → return `status: "partial"` with test output as evidence
4. Gate must be runnable in the child's environment

## Gate Types

| Gate | Command Pattern | Pass Condition | Phase |
|------|----------------|----------------|-------|
| Failing test | `npx jest --testPathPattern=<files>` | Expected failures | Red |
| Passing test | `npx jest --testPathPattern=<files>` | All pass | Green |
| Type check | `npx tsc --noEmit` | No errors | Green, Refactor |
| Build | `npm run build` | Exit code 0 | Green, Refactor |
| Lint | `npm run lint` | No errors | Refactor |
| Full suite | `npm test` | All pass | Green, Refactor |

## Gate Execution

### In Delegation Packet

```json
{
  "test_gate_command": "npx jest --testPathPattern=src/tools/runtime",
  "build_verify_command": "npx tsc --noEmit",
  "gate_expected": "fail"
}
```

### In Return Contract

```json
{
  "gate_result": {
    "command": "npx jest --testPathPattern=src/tools/runtime",
    "exit_code": 1,
    "output_summary": "5 tests, 5 failures",
    "passed": false
  }
}
```

## Gate Failure Handling

1. Child returns `status: "partial"` with `gate_result` evidence
2. Orchestrator reads failure output
3. If red phase: failures expected — if all pass, tests are trivially true, re-run
4. If green phase: re-delegate with more specific implementation guidance
5. If refactor phase: re-delegate — refactor changed behavior

## Build-Verify Extension

Green and refactor phases include a build-verify gate:

```json
{
  "build_verify_result": {
    "tsc": { "exit_code": 0, "errors": 0 },
    "test": { "exit_code": 0, "passed": 12, "failed": 0 },
    "build": { "exit_code": 0 }
  }
}
```

All three must pass for the phase to be considered complete.
