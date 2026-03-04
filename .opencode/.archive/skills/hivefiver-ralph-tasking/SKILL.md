---
name: hivefiver-ralph-tasking
description: Convert HiveFiver plans and TODO state into Ralph PRD JSON and beads graphs with enriched related entities and anti-pattern validation.
---

# HiveFiver Ralph Tasking

Use this skill when output must be executable by Ralph tooling.

## Workflow
1. Build PRD user stories from distilled spec.
2. Merge TODO/task nodes into story traceability map.
3. Export flat-root `tasks/prd.json`.
4. Build beads dependency mapping.
5. Validate anti-patterns and dependency integrity.

## Loop Integrations
- `ralph-tui-prd`
- `ralph-tui-create-json`
- `ralph-tui-create-beads`
- optional iterative `ralph-loop` validation

## Validation Rules
- root must include `name` + `userStories`
- reject wrapper roots (`prd`)
- reject legacy root key (`tasks`)
- require deterministic user story IDs/order
- preserve related entity links:
  - `workflow_id`
  - `requirement_node_id`
  - `mcp_provider_id`
  - `export_id`

## References
- `references/prd-json-rules.md`

## Template
- `templates/prd-json-flat.md`

## Scripts
- `scripts/validate-prd-json.mjs`
- `scripts/todo-to-prd-json.mjs`
