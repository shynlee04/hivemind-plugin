# Batching Loop

## Validated Transfer
- Deep and exhaustive scans should batch by subfolder or bounded slice.
- Each batch must be processed independently and written out immediately.
- When directory boundaries hide runtime behavior, batch by pipeline, journey, or authority seam instead of folder alone.

## Core Loop
1. Identify the active phase and read the prior phase synthesis if it exists.
2. Identify batches.
3. Read or pack one batch.
4. Extract required findings.
5. Immediately write the batch output.
6. Validate the written output.
7. Update state with batch completion.
8. Purge detailed batch findings from working context.
9. Keep only a short summary.
10. Move to the next batch.

## Batch Sources
- `deep`: critical directories, family-specific hotspots, or router-selected seams
- `exhaustive`: all recursive subfolders excluding ignored paths
- `pipeline-map`: execution paths and state transitions
- `journey-map`: happy path, degraded path, resume path, and edge-case slices
- audit-like file review: file batches of about 20

## Required State Fields
- `scan_level`
- `tool_mode`
- `current_batch`
- `batches_planned`
- `batches_completed`
- `batches_blocked`
- `files_total`
- `files_checked`
- `coverage_gaps`
- `outputs_generated`
- `resume_instructions`

## Completion Rule
- Do not mark the codemap pass complete until every planned batch is accounted for.
- For parallel file-review batches, reconcile `FILES CHECKED` totals against planned totals before final synthesis.
