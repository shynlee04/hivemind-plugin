# TDD Delegation Test

## Scenario: Full Red-Green-Refactor Cycle

A subagent is delegated through a complete TDD cycle for a new utility function.

### Setup

- Target: `src/shared/validators.ts` (new file)
- Test file: `tests/shared/validators.test.ts`
- Framework: jest
- Gate command: `npx jest --testPathPattern=validators`

### Validation Table

| Step | Action | Expected | Gate |
|------|--------|----------|------|
| 1 | Red phase — write tests | 3 failing tests written | `npx jest` shows 3 failures |
| 2 | Gate check red | Tests fail as expected — phase valid | — |
| 3 | Green phase — implement | Minimum code to pass all tests | `npx jest` shows 3 passing |
| 4 | Build-verify green | `tsc --noEmit` clean, `npm test` passes | — |
| 5 | Gate check green | All tests pass, build clean | — |
| 6 | Refactor phase — improve | Code structure improved | `npx jest` still shows 3 passing |
| 7 | Build-verify refactor | `tsc --noEmit` clean, `npm test` passes | — |
| 8 | Gate check refactor | All tests pass, no behavior change | — |

### Phase Transition Rules

| Transition | Condition | Failure Handling |
|-----------|-----------|-----------------|
| Red → Green | Failing test output provided | Re-run red with clearer specs |
| Green → Refactor | All tests pass, build succeeds | Re-run green with guidance |
| Refactor → Complete | All tests pass after refactor | Re-run refactor — behavior changed |

### Anti-Pattern Test

| Step | Action | Expected |
|------|--------|----------|
| 1 | Combine red+green in one packet | Rejected — phases must be separate |
| 2 | Claim green without running gate | Partial return — no gate evidence |
| 3 | Write integration tests with failing unit | Rejected — unit must pass first |
