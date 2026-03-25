# Cascading Failure Test

## Scenario: Parallel Slices with >50% Failure

Three parallel slices dispatched; two fail, triggering cascading failure detection.

### Setup

- 3 parallel slices: module A, module B, module C
- Expected: all complete
- Actual: module A complete, module B fails, module C fails

### Validation Table

| Step | Action | Expected |
|------|--------|----------|
| 1 | Dispatch 3 parallel slices | 3 packets emitted |
| 2 | Module A returns complete | `status: "complete"` |
| 3 | Module B returns partial | `status: "partial"`, `blocked_routes` populated |
| 4 | Module C returns blocked | `status: "blocked"`, failure evidence |
| 5 | Cascade detection | >50% failure detected (2/3) |
| 6 | Stop remaining work | All slices stopped |
| 7 | Root cause analysis | Shared root cause identified or ruled out |
| 8 | Re-plan decision | Re-plan if shared cause, re-delegate if independent |

### Multi-Iteration Failure Test

| Step | Action | Expected |
|------|--------|----------|
| 1 | Same failure type in iteration 1 | Recorded |
| 2 | Same failure type in iteration 2 | Pattern noted |
| 3 | Same failure type in iteration 3 | Loop stopped — `status: "blocked"` |
| 4 | Escalation | Orchestrator receives failure pattern evidence |
