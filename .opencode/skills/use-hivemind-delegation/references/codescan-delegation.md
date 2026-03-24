# Codescan Delegation

## Purpose

Define how to delegate code scanning work to subagents — choosing the right agent type, structuring the scan passes, and tracking results through JSON checkpoints.

## Agent Selection

| Task | Preferred Agent | Reason |
|------|----------------|--------|
| File listing, structure extraction | `explore` | Read-only, fast, low context cost |
| Scoped grep/pattern search | `explore` | Read-only pattern matching |
| Barrel export analysis | `explore` | Structural read, no reasoning needed |
| Seam and boundary discovery | `explore` | Pattern extraction from file reads |
| Complex cross-file analysis | `general` with `mode=plan` | Needs deeper reasoning about relationships |
| Architecture inference from multi-file evidence | `general` with `mode=all` | Broad synthesis from read evidence |
| File-by-file audit (lint, convention check) | `explore` in batched loops | Parallel-safe read-only review |

**Rule:** Use `explore` first. Escalate to `general` only when `explore` cannot synthesize across multiple findings.

## Scan Pass Structure

Each delegation for code scanning follows this pattern:

1. **Plan the phase.** Choose `high-level-map`, `pipeline-map`, `journey-map`, `low-level-proof`, or `cross-pass-synthesis`.
2. **Read the prior phase synthesis** if one exists. Deeper phases never start blind.
3. **Emit a batch plan** to `{activity}/codescan/{pass_id}/plan.json`.
4. **Delegate each batch** as a separate subagent call with explicit scope and return contract.
5. **Collect batch results** at `{activity}/codescan/{pass_id}/{batch_id}.json`.
6. **Synthesize** after all batches complete at `{activity}/codescan/{pass_id}/synthesis.json`.

## Delegation Packet for Codescan

Extend the standard delegation packet with scan-specific fields:

```json
{
  "packet_id": "deleg_1711072800_codemap",
  "concern": "codescan",
  "objective": "Scan src/tools/ for export/import patterns and seam boundaries",
  "mode": "research",
  "execution_mode": "sequential",
  "agent_type": "explore",
  "activity_type": "codescan",
  "phase_type": "pipeline-map",
  "scan_level": "deep",
  "pass_id": "pass_src_tools",
  "batch_id": "batch_1",
  "branch": "refactor/product-detox-concerns",
  "worktree": "/repo/.worktrees/product-detox",
  "worktree_role": "linked",
  "authority_surfaces": ["src/tools", "src/plugin"],
  "high_level_inputs": [
    ".hivemind/activity/codescan/pass_high_level/synthesis.json"
  ],
  "must_read_artifacts": [
    ".hivemind/activity/codescan/pass_high_level/synthesis.json"
  ],
  "user_journeys": [
    "tool execution from request to result",
    "resume after interrupted scan"
  ],
  "edge_cases": [
    "generated mirror mistaken for source authority",
    "shared seam owned by multiple families"
  ],
  "scope": ["src/tools/runtime/", "src/tools/doc/", "src/tools/task/"],
  "out_of_scope": ["node_modules/", "dist/", ".git/"],
  "constraints": [
    "Read-only — no file mutations",
    "Write batch output to .hivemind/activity/codescan/pass_src_tools/batch_1.json"
  ],
  "success_metrics": [
    "All files in scope checked",
    "Export count and import map extracted per file",
    "Seam boundaries identified"
  ],
  "required_evidence": [
    "files_checked count matches scope file count",
    "JSON output written to designated path"
  ],
  "required_accounting": [
    "coverage_gaps listed",
    "blocked_routes listed when scope cannot be closed"
  ],
  "return_contract": [
    "status",
    "batch_id",
    "activity_type",
    "phase_type",
    "files_checked",
    "clean_files",
    "findings",
    "blocked_files",
    "blocked_routes",
    "coverage_gaps",
    "artifacts_written",
    "recommended_next_action"
  ],
  "return_gate": "all files in scope checked OR blocked_files documented"
}
```

## Resumable Scans

If a scan pass is interrupted:
1. Read `{activity}/codescan/{pass_id}/plan.json` for the full batch plan.
2. Read completed batch files to determine which batches are done.
3. Resume from the next incomplete batch.
4. Do not re-scan completed batches unless results are suspect.

## Bash Helper Integration

When using `scripts/hm-codescan.sh` from `hivemind-codemap`:
- Use `batch-plan` command to generate `plan.json`.
- Use `structure`, `exports`, `imports`, `seams`, `hotspots` for targeted scans without full batch planning.
- Batch execution itself remains a delegation workflow convention; the helper currently plans batches but does not execute a dedicated `scan-batch` command.

## Multi-Pass Chaining

For iterative scanning:
1. `high-level-map`: `structure` + `seams` to get the broad map.
2. `pipeline-map`: `exports` + `imports` on boundaries and hot spots.
3. `journey-map`: targeted reads to connect pipelines to user-visible journeys and degraded paths.
4. `low-level-proof`: batch review on the specific slices that still need proof.
5. `cross-pass-synthesis`: reconcile coverage, risks, and next slices at `{activity}/codescan/cross-pass-synthesis.json`.

## Related

- `delegation-modes.md` for mode selection
- `failure-recovery.md` for scan failure handling
- `hivemind-codemap` for scan mechanics
- `hivemind-gatekeeping-delegation` for multi-pass scan loop control
