---
name: "hivefiver-ralph-bridge"
description: "Convert HiveFiver output into Ralph-compatible PRD, flat prd.json, and beads dependencies with TODO-node lineage validation."
---

# HiveFiver Ralph Bridge

## Purpose
Create deterministic artifacts for Ralph execution and loop validation.

## Required Artifacts
1. PRD markdown
2. `tasks/prd.json` (flat root schema)
3. Beads mapping (epic + dependency chain)
4. TODO-to-story node map (for traceability)

## Upgraded Loop Targets
Include compatibility for:
- `ralph-tui-prd`
- `ralph-tui-create-json`
- `ralph-tui-create-beads`
- `ralph-loop` style iterative validation (if available in environment)

## CRITICAL JSON Validation Rules
Reject export if any anti-pattern is found:
- wrapped root object (e.g. `{ "prd": { ... } }`)
- using `tasks` instead of `userStories`
- missing root keys: `name`, `userStories`
- nested milestone/phase wrappers not flattened into `userStories`

## Validation Execution
Use:
- `skills/hivefiver-ralph-tasking/scripts/validate-prd-json.mjs`
- `src/lib/graph-io.ts` lifecycle/task snapshot helpers for lineage checks

## Required Checkpoint
```ts
map_context({ level: "action", content: "Ralph export conversion + TODO-node lineage validation" })
export_cycle({ outcome: "success", findings: "Ralph artifacts generated and validated" })
```

## Output Contract
- `prd_markdown_path`
- `prd_json_path`
- `beads_dependency_map`
- `todo_story_node_map`
- `validation_report`
