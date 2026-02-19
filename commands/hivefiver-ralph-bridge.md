---
name: "hivefiver-ralph-bridge"
description: "Convert HiveFiver v2 output into Ralph-compatible PRD JSON and beads mapping with enriched related entities and anti-pattern checks."
---

# HiveFiver Ralph Bridge

## Required Exports
1. PRD markdown
2. `tasks/prd.json` flat-root schema
3. beads dependency map
4. TODO-to-story node map

## Required Skill Integrations
- `ralph-tui-prd`
- `ralph-tui-create-json`
- `ralph-tui-create-beads`
- `hivefiver-ralph-tasking`

## Validation Rules
- reject wrapper roots
- reject legacy root keys
- enforce deterministic story IDs/order
- preserve related entities from task model:
  - `workflow_id`
  - `requirement_node_id`
  - `mcp_provider_id`
  - `export_id`

## Required Checkpoint
```ts
map_context({ level: "action", content: "Ralph export conversion + TODO-node lineage validation" })
```

## Output Contract
Return:
- `prd_json_path`
- `beads_dependency_map`
- `todo_story_node_map`
- `validation_report`
