# Quality Gates

Multi-granularity quality gates with entry/exit criteria. Each gate must pass before proceeding to the next level of work.

## Gate Hierarchy

```
Unit Gate (function) → Integration Gate (module) → E2E Gate (phase) → Deployment Gate (handoff)
     ↑                      ↑                           ↑                      ↑
  After each           After each                  After each            Before
  function             module                      phase                 handoff
```

Gates are cumulative. Deployment gate requires all prior gates to have passed.

## Unit Gate

**Scope:** Single function or method.
**Trigger:** After implementing a function in a RED→GREEN cycle.

### Entry Criteria
- Test file exists for the function
- Test contains meaningful assertions (not `assert(true)`)
- Implementation function exists

### Exit Criteria
- Targeted test passes: `npx jest --testPathPattern=<target>`
- Type check clean: `npx tsc --noEmit`
- No import errors in test file

### Pass Command
```bash
npx jest --testPathPattern=<function-name> 2>&1
npx tsc --noEmit 2>&1
```

### Failure Action
- Test fails → Fix implementation. Do not proceed.
- Type errors → Fix types. Re-run gate.
- Import errors → Fix imports. Re-run gate.
- After 3 fix attempts → STOP, investigate root cause.

## Integration Gate

**Scope:** Module or feature area.
**Trigger:** After completing all unit tests for a module.

### Entry Criteria
- All unit gates for the module passed
- Module has integration test file (or justification for skipping)
- Module interfaces are type-clean

### Exit Criteria
- All unit tests in module pass
- Integration tests pass
- No circular import errors
- Type check clean across module
- No cross-module regressions

### Pass Command
```bash
npx jest --testPathPattern=<module> 2>&1
npx tsc --noEmit 2>&1
```

### Failure Action
- Unit test regression → Find which integration test broke it. Fix.
- Integration test fails → Check module interfaces, mock configurations.
- Cross-module regression → Check for shared state, side effects.
- After 3 fix attempts → STOP, return `blocked`.

## E2E Gate

**Scope:** Full phase deliverables.
**Trigger:** After completing all modules in a phase (Gate 4 in TDD lifecycle).

### Entry Criteria
- All integration gates in the phase passed
- Full test suite was run at least once during phase
- Build succeeds independently

### Exit Criteria
- Full test suite passes: `npm test`
- Type check clean: `npx tsc --noEmit`
- Build succeeds: `npm run build`
- Lint clean: `npm run lint`
- Prior phase tests still pass (no regressions)

### Pass Command
```bash
npm test 2>&1 | tail -5
npx tsc --noEmit 2>&1
npm run build 2>&1 | tail -3
npm run lint 2>&1 | tail -3
```

### Failure Action
- Test fails → Fix. This is a completion blocker.
- Type error → Fix. Cannot claim phase complete.
- Build fails → Fix build configuration or imports.
- Lint error → Fix style violations.
- Prior phase regression → Current phase introduced a bug. Fix before advancing.

## Deployment Gate

**Scope:** Complete work ready for handoff.
**Trigger:** Before returning work to orchestrator or claiming completion.

### Entry Criteria
- All E2E gates for all phases passed
- No known failing tests
- No skipped tests without justification

### Exit Criteria
- All tests pass: `npm test`
- Types clean: `npx tsc --noEmit`
- Build succeeds: `npm run build`
- Lint clean: `npm run lint`
- Documentation updated (if applicable)
- No TODO/FIXME in new code (unless tracked)

### Pass Command
```bash
npm test 2>&1
npx tsc --noEmit 2>&1
npm run build 2>&1
npm run lint 2>&1
```

### Failure Action
- ANY failure → Work is NOT complete. Fix all issues.
- Do not hand off broken work.
- Do not claim partial completion without explicit `partial` status.

## Gate Skipping Policy

**Gates may NEVER be skipped.** However, scope may be reduced:

| Gate | Allowed Reduction | Never Skip |
|------|------------------|------------|
| Unit | None | Test execution |
| Integration | Skip integration tests if module has no external deps | Unit tests + type check |
| E2E | None | Full suite + build + types |
| Deployment | None | All checks |

## Gate Evidence

Every gate produces evidence. Claims without evidence are void.

```json
{
  "gate": "unit",
  "scope": "tool-executor/validate-args",
  "timestamp": "2026-03-24T10:00:00Z",
  "entry_met": true,
  "checks": {
    "test_passes": { "command": "npx jest validate-args", "exit_code": 0 },
    "types_clean": { "command": "npx tsc --noEmit", "exit_code": 0 }
  },
  "exit_met": true,
  "gate_result": "pass"
}
```

## Gate Frequency

| Development Activity | Minimum Gate |
|---------------------|-------------|
| New function | Unit Gate |
| New module | Integration Gate |
| Bug fix | Unit Gate |
| Refactor | Unit Gate (same tests must pass) |
| Phase completion | E2E Gate |
| Handoff | Deployment Gate |
