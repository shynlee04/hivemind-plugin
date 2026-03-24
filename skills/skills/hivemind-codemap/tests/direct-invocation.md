# Direct Invocation

## Scenario 1 - Deep Scan On Critical Slices
- A polluted framework has overlapping governance, git-memory, and delegation surfaces.
- The structure is unclear enough that refactor or debugging would be premature.

### Expected Behavior
- `hivemind-codemap` runs the high-level pass first.
- It selects `deep` scan level.
- It emits a scan plan, seam inventory, and codemap synthesis.
- It returns bounded slices for the router to send into `delegation`, `system-debug`, or refactor stages.

## Scenario 2 - Repomix Available But Optional
- The repo is large and a pack-first overview would accelerate structure discovery.
- Repomix is available, but line-level verification is still required.

### Expected Behavior
- `hivemind-codemap` selects `hybrid` mode.
- It emits a Repomix extraction report.
- It performs native verification on critical slices before claiming seam ownership.

## Scenario 3 - Parallel Audit-Style File Loop
- The codemap task becomes a file-by-file review across many markdown or routing files.

### Expected Behavior
- The family splits files into batches of about 20.
- Each batch returns `FILES CHECKED` accounting.
- Final synthesis is blocked until total planned files equal the sum of checked files.
