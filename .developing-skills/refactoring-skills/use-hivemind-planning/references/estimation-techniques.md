# Estimation Techniques

Use Fibonacci-based relative estimation for effort scoring during decomposition. Absolute hours are unreliable — compare to known tasks instead.

## Fibonacci Sequence

| Points | Meaning |
|--------|---------|
| **1** | Trivial — change a constant, rename a variable, fix a typo |
| **2** | Small — add a field to a type, update a config, write a simple test |
| **3** | Moderate — implement a new function, add validation logic |
| **5** | Standard — create a new tool/hook, migrate a pattern across files |
| **8** | Large — implement a multi-file feature, refactor a subsystem |
| **13** | Very large — approach the boundary of what's estimable; split if possible |
| **21** | Epic — almost certainly too big; must split before delegation |
| **∞** | Cannot estimate — scope is unknown; requires discovery first |

## Relative Estimation

Estimate by comparison, not by hours:

1. **Anchor task** — pick one completed slice whose effort is well-understood (typically a "3" or "5")
2. **Compare** — is this slice simpler, similar, or harder than the anchor?
3. **Assign** — pick the Fibonacci number that matches the relative size
4. **Calibrate** — if two slices both feel like "5s" but one is clearly larger, one of them is probably an "8"

Never estimate in hours or days. Fibonacci encodes *relative complexity*, not wall-clock time.

## Velocity Calculation

After a planning cycle completes, calculate velocity to improve future estimates:

```
velocity = sum(completed_points) / number_of_iterations
```

| Velocity Range | Interpretation |
|---------------|----------------|
| <10 | Small team or complex work — keep slices at 5 or below |
| 10–25 | Normal cadence — mix of 3s and 5s |
| >25 | High throughput — can accept occasional 8s |

Velocity is retrospective only. Do not use it to pressure faster estimates.

## When to Re-Estimate

| Trigger | Action |
|---------|--------|
| Feasibility validation reveals unknowns | Re-estimate affected slices upward or split |
| Blocker found during execution | Re-estimate downstream slices |
| Completed slice took significantly more/less than estimated | Re-calibrate anchor task |
| Scope change from user | Re-estimate all affected slices |

Re-estimation is not failure — it's learning. Record the delta in the plan record's `carry_forward`.

## Anti-Patterns

### Anchoring

The first estimate biases all subsequent ones. If someone says "this looks like a 13," the next estimate will cluster near 13 regardless of actual size.

**Fix:** Estimate independently first, then compare. Use planning-poker style blind assignment when multiple agents contribute.

### Precision Illusion

Assigning "exactly 5.5 points" or "4 hours" implies precision that doesn't exist. Fibonacci's gaps (3→5→8) are intentional — they force honest uncertainty.

**Fix:** Round up when uncertain. A "5 or maybe 8" is an 8.

### Ignoring Unknowns

Estimating a slice that touches unfamiliar code without a discovery pass first.

**Fix:** If the agent cannot confidently compare to a known task, assign ∞ and insert a read/feasibility slice before it.

### Velocity Pressure

Using velocity to demand higher throughput next sprint.

**Fix:** Velocity is a planning input, not a performance target. It should inform realistic scheduling, not ambitious deadlines.

## Integration with Planning

Estimation happens during Decomposition (Step 4) — after concern separation and file cluster grouping, before dependency ordering.

```
Decomposition Step 4 (Slice Sizing)
  → Assign Fibonacci points per slice
    → Slice >8? Split it.
      → All slices ≤8? Proceed to dependency ordering.
```

The `estimated_complexity` field in the slice template uses `low | medium | high` as a human-readable summary. Map it: low = 1–3, medium = 5–8, high = 13+.
