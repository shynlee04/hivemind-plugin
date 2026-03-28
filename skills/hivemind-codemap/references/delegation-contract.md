# Delegation Contract

## Sequential First
- Start sequentially until seams are explicit.
- Do not parallelize structure discovery while family boundaries are still ambiguous.
- Do not skip straight to `low-level-proof` while `high-level-map`, `pipeline-map`, or `journey-map` is still incomplete.

## Parallel Codemap Swarm Gate
- Allowed only when all are true:
  - batches are isolated by subfolder or seam
  - no shared mutation is expected
  - scan state already exists
  - merge by synthesis is possible

## Audit-Style File Loop
- Use batches of about 20 files when the task is file-by-file review.
- Each subagent must return:
  - batch id
  - files checked
  - clean files
  - findings
  - blocked files
  - recommended next action
- Final synthesis must reconcile planned files vs `FILES CHECKED` totals.

## Required Prompt Fields
- `activity_type`
- `phase_type`
- `scan_level`
- `tool_mode`
- `batch_id`
- `must_read_artifacts`
- `user_journeys`
- `edge_cases`
- `scope`
- `out_of_scope`
- `required_artifacts`
- `required_accounting`
- `return_contract`

## Required Return Contract
- `status`
- `batch_id`
- `activity_type`
- `phase_type`
- `files_checked`
- `findings`
- `clean_files`
- `blocked_files`
- `blocked_routes`
- `coverage_gaps`
- `artifacts_written`
- `recommended_next_action`
