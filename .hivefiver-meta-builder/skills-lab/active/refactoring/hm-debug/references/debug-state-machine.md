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
| VERIFY | Reproduce + regression tests | GUARD (pass) or REVERT (fail) |
| GUARD | Add recurrence guard or documented deferred guard | DONE |

## Rules

- Only one hypothesis at a time
- Every hypothesis must be falsifiable
- Fix must be minimal
- Verification must include regression tests
- `FIX` is illegal until reproduction, isolation, and a falsified/confirmed hypothesis are recorded
- Every DONE state records the recurrence guard that catches this failure class next time

## Evidence Packet

```markdown
## Debug Session: <bug-id>
**Status:** REPRODUCE | GATHER | ISOLATE | HYPOTHESIZE | TEST | FIX | VERIFY | GUARD | DONE
**Failure Capture:** <command/input/trace/log/UI path>
**Boundary Trace:** <entry -> transformation -> exit>
**Hypotheses Considered:**
- H1: <cause> — <accepted/rejected/pending>
- H2: <cause> — <accepted/rejected/pending>
**Selected Hypothesis:** <specific mechanism>
**Prediction:** <if true, experiment shows X>
**Experiment:** <command or observation>
**Result:** <actual output>
**Fix:** <minimal change or link>
**Verification:** <fresh reproduction + regression evidence>
**Recurrence Guard:** <test/assertion/log/runbook/deferred reason>
```
