# Debug State Machine

## States

| State | Action | Next State |
|-------|--------|------------|
| REPRODUCE | Make it fail on demand | ISOLATE (success) or GATHER (failure) |
| GATHER | Collect logs, traces, inputs | REPRODUCE |
| ISOLATE | Binary search to narrow scope | HYPOTHESIZE |
| HYPOTHESIZE | Form one testable hypothesis | TEST |
| TEST | Run experiment | FIX (confirmed) or HYPOTHESIZE (rejected) |
| FIX | Apply minimal fix | VERIFY |
| VERIFY | Reproduce + regression tests | DONE (pass) or REVERT (fail) |

## Rules

- Only one hypothesis at a time
- Every hypothesis must be falsifiable
- Fix must be minimal
- Verification must include regression tests
