# PRD JSON Rules

## Required Root Keys
- `name`
- `userStories`

Optional root keys:
- `branchName`
- `description`

## Required User Story Keys
- `id`
- `title`

Recommended user story keys:
- `description`
- `status` (`pending` | `in_progress` | `completed` | `blocked`)
- `dependencies` (array of story IDs)
- `acceptanceCriteria` (array of strings)
- `relatedEntities` (session/plan/phase/task lineage hints)

## Forbidden Anti-Patterns
- Wrapper root object `prd`
- Root `tasks` replacing `userStories`
- Nested milestone/phase wrappers inside root JSON
- Duplicate story IDs
- Self-dependencies and broken dependency references

## Determinism Rules
- Keep user stories in stable execution order.
- Every dependency must refer to a prior or known story ID.
- Preserve traceability from TODO/task source IDs when available.
