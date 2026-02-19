# HiveFiver Phase 6 - GSD and Ralph Compatibility

## Objective
Provide compatibility wrappers without replacing HiveMind internals.

## GSD Mapping
HiveFiver sections map to:
- project
- milestone
- phase
- plan
- task
- verification

## Ralph Mapping
- Export PRD markdown
- Export flat `tasks/prd.json`
- Export beads dependency chain
- Export TODO/task to user-story lineage map

## Validation Checks
Before Ralph export:
- root keys include `name` and `userStories`
- reject `prd` wrapper anti-pattern
- reject `tasks` key anti-pattern
- enforce array type for `userStories`
- enforce unique story IDs and dependency integrity

Validation script:
`skills/hivefiver-ralph-tasking/scripts/validate-prd-json.mjs`

Source helper:
`src/lib/graph-io.ts` (`buildRalphTaskGraphSnapshot`)
