# TDD Loop Delegation

## Purpose

Delegate red-green-refactor loops to subagents with explicit phase boundaries and test gate enforcement.

## Red Phase Delegation

### Goal

Write failing tests that define expected behavior.

### Packet Requirements

- `tdd_phase: "red"`
- `test_files`: list of test files to create or modify
- `test_gate_command`: command that must produce expected failures
- `expected_behavior`: what the tests should verify

### Return Contract

Child must return:
- Test files written (paths)
- Test output showing failures (evidence that tests are real)
- Failure count and types

### Gate

```bash
npx jest --testPathPattern=<test_files>
```

Must produce failures — if tests pass, they are trivially true and must be rewritten.

## Green Phase Delegation

### Goal

Implement minimum code to make all tests pass.

### Packet Requirements

- `tdd_phase: "green"`
- `implementation_files`: list of files to create or modify
- `test_gate_command`: command that must show all tests pass
- `build_verify_command`: type check and build command

### Return Contract

Child must return:
- Implementation files written (paths)
- Test output showing all tests pass
- Build output showing clean compilation

### Gate

```bash
npx jest --testPathPattern=<test_files> && npx tsc --noEmit
```

All tests must pass and type check must succeed.

## Refactor Phase Delegation

### Goal

Improve code structure without changing behavior.

### Packet Requirements

- `tdd_phase: "refactor"`
- `implementation_files`: files to refactor
- `test_gate_command`: command that must still pass
- `refactor_scope`: what aspects to improve (naming, extraction, patterns)

### Return Contract

Child must return:
- Refactored files (paths)
- Test output showing all tests still pass
- Summary of structural changes

### Gate

```bash
npx jest --testPathPattern=<test_files> && npx tsc --noEmit
```

All tests must pass — behavior must not change.

## Phase Transition Matrix

| Current | Next | Condition | Failure Handling |
|---------|------|-----------|-----------------|
| Red | Green | Failing test output provided | Re-run red with clearer specs |
| Green | Refactor | All tests pass, build succeeds | Re-run green with guidance |
| Refactor | Red (next) | All tests pass after refactor | Re-run refactor — behavior changed |
| Any | Blocked | Gate fails | Return partial with evidence |
