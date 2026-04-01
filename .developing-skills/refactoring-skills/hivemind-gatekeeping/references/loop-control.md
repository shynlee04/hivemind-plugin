# Iterative Loop Control

## Loop Setup
- Set `max_iterations` (default: 10)
- Define `stop_conditions` (≥2 required)
- Initialize checkpoint at `.hivemind/activity/delegation/{loop_id}-checkpoint.json`

## Iteration Rules
- Each iteration MUST produce `carry_forward` (≤5 items)
- Read checkpoint before next iteration
- Stop when any stop condition fires
- Never run parallel iterations

## Bead Tracking
Fine-grained progress within iterations (file-by-file, batch-by-batch).
