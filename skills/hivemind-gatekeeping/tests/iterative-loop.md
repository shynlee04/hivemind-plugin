# Iterative Loop Test

## Scenario: Multi-Pass Code Scan with Gate Enforcement

A loop scans `src/tools/` across 3 iterations, with synthesis gates between each.

### Setup

- `loop_id`: `test_scan_loop`
- `max_iterations`: 3
- `stop_conditions`: ["Coverage reaches 80%", "No new findings", "Max iterations"]

### Validation Table

| Step | Action | Expected | Gate |
|------|--------|----------|------|
| 1 | Init checkpoint | `status: "running"`, `current_iteration: 0` | — |
| 2 | Iteration 1 — scan top-level | `carry_forward` has 1-5 items, `coverage_status: "partial"` | Gate: pass |
| 3 | Gate check iteration 1 | All 4 checks pass | — |
| 4 | Iteration 2 — scan subdirs | `carry_forward` updated, `coverage_status: "improving"` | Gate: pass |
| 5 | Gate check iteration 2 | All 4 checks pass | — |
| 6 | Iteration 3 — final pass | `carry_forward` finalized, `coverage_status: "complete"` | Gate: pass |
| 7 | Stop condition fires | `status: "complete"`, loop ends | — |

### Anti-Pattern Test

| Step | Action | Expected |
|------|--------|----------|
| 1 | Skip gate check | Gate failure — loop paused |
| 2 | Carry full output | Gate failure — carry_forward too large |
| 3 | Exceed max_iterations | `status: "exceeded_max"` |
