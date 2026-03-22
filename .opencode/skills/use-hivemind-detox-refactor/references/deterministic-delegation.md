# Deterministic Delegation

## Purpose
- Define exactly when the router may use sequential or parallel subagents.
- Keep Stage 4 as the only stage that authorizes parallel swarms.

## Decision Rules
- Default to `sequential`.
- Use `sequential` when:
  - one slice depends on another slice's output
  - two slices touch the same authority surface
  - debugging/root cause is unresolved
  - one slice is gathering evidence for another
  - failure in one slice changes the validity of the next slice
- Use `parallel` only when all are true:
  - slices are already isolated by family or seam
  - no shared-state mutation is expected
  - outputs can merge by synthesis rather than conflicting edits
  - failure isolation is acceptable
  - scan or batch accounting is explicit

## Agent Choice
- Use `explore` for read-only synthesis, code scans, asset extraction, and evidence gathering.
- Use `general` with `mode=all` only for bounded reasoning tasks that may need deeper synthesis and are not pure exploration.
- Do not use `general` as the default for narrow read-only repo scans.
- Route repo-wide map creation through the `codemap` family.
- Route breakage investigation through the `system-debug` family.

## Required Prompt Fields
- `stage_id`
- `concern`
- `family`
- `objective`
- `scope`
- `out_of_scope`
- `execution_mode`
- `agent_type`
- `scan_level`
- `tool_mode`
- `batch_id`
- `constraints`
- `memory_scope`
- `success_metrics`
- `required_evidence`
- `required_accounting`
- `return_contract`
- `return_gate`
- optional: `input_artifacts`, `known_blockers`, `escalation_rule`, `follow_on_dependency`

## Required Output Contract
- `status`
- `stage_id`
- `family`
- `slice_id`
- `batch_id`
- `files_checked`
- `findings`
- `evidence`
- `blocked_routes`
- `recommended_next_action`
- `safe_follow_on_mode`
- if `general` was used, whether it invoked deeper `explore`

## Stage Fit
- Stage 2: set constraints and authority boundaries.
- Stage 4: decide sequential vs parallel and emit `templates/partition-plan.md` after codemap slices exist.
- Stages 5-8: reuse the partition plan instead of inventing new swarm rules ad hoc.

## Codemap Loop Rules
- for subfolder-based deep or exhaustive scans, process one subfolder or seam batch at a time unless the parallel gate is satisfied
- for audit-style file review, prefer batches of about 20 files
- do not declare the codemap pass complete until planned file totals match returned `files_checked` or `FILES CHECKED` totals
