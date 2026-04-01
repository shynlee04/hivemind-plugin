# Synthesis Gates

## Purpose

Gate each iteration's output before the next iteration begins. Prevent low-quality or incomplete work from propagating through the loop.

## Gate Rules

After each iteration completes, the orchestrator (or a dedicated gate agent) runs synthesis gate checks before permitting the next iteration.

## Gate Checks

| Check | Pass Condition | Failure Action |
|-------|---------------|----------------|
| `carry_forward_populated` | carry_forward array has 1-5 items | Re-run iteration with carry-forward instruction |
| `coverage_status_updated` | coverage_status reflects actual progress | Re-run iteration with coverage instruction |
| `no_contradictions` | findings don't contradict prior iteration carry-forwards | Flag contradictions, pause loop for orchestrator decision |
| `output_written` | output_path points to a valid file | Re-run iteration — output was lost or not written |

## Gate Result Format

```json
{
  "gate_id": "gate_scan_loop_3",
  "loop_id": "scan_src_tools",
  "iteration": 3,
  "status": "pass | fail | conditional",
  "checks": {
    "carry_forward_populated": true,
    "coverage_status_updated": true,
    "no_contradictions": true,
    "output_written": true
  },
  "contradictions": [],
  "recommendation": "continue | pause | abort",
  "reason": ""
}
```

## Gate Failure Handling

1. Set gate result to `fail` or `conditional`
2. Pause the loop — `status: "paused"`
3. Emit gate failure report with specific failed checks
4. Await orchestrator decision: `continue`, `pause`, or `abort`
5. Do NOT proceed to next iteration until gate passes

### Conditional Pass

A gate may return `conditional` when:
- All critical checks pass but one minor check is weak
- Contradictions exist but are explainable (e.g., code was changed between iterations)
- Coverage updated but regression risk is noted

On conditional pass, the orchestrator may proceed but must record the condition.

## Storage

Gate results are stored at:
- `{activity}/delegation/{loop_id}-gate-{iteration}.json`
