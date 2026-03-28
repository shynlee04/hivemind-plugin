# Re-Decomposition Protocol

## Trigger Condition

A slice returns `status: "partial"` or `status: "blocked"` **twice** on the same `slice_id`.

## Procedure

### Phase 1: Failure Analysis

1. Collect both return packets from `{project}/.hivemind/activity/delegation/`
2. Identify the actual blocker from `blocked_routes` field
3. Classify the blocker:

| Blocker Type | Example | Resolution |
|---|---|---|
| External dependency | Needs config file not in scope | Add dependency slice |
| Scope too large | Cannot complete in one pass | Split further |
| Missing context | Needs analysis before writing | Add read slice before write slice |
| Conflicting with peer | Two slices modify same file | Merge into sequential pair |
| Architectural | Needs new module/structure | STOP → escalate to user |
| Environment | Missing tool, wrong version | Fix environment, re-delegate same slice |

### Phase 2: Re-Decomposition

Apply all 6 decomposition steps to the failed slice:

1. Authority surface analysis — re-classify the slice's targets
2. Concern separation — confirm concern purity
3. File cluster grouping — re-cluster with actual file relationships
4. Slice sizing — apply splitting heuristic from the decision tree
5. Dependency ordering — update graph with new slices
6. Gate definition — update gate commands for new slices

### Phase 3: Graph Update

1. Remove the failed `slice_id` from the dependency graph
2. Insert new `slice_id`s with updated dependencies
3. Update `blocks` fields for slices that depended on the failed one
4. Recompute wave assignments

### Phase 4: Logging

Record the re-decomposition in:

```
{project}/.hivemind/activity/delegation/{original_slice_id}-re-decomposition.json
```

Contents:

```json
{
  "original_slice_id": "tool-schema-migration",
  "failed_count": 2,
  "blocker_type": "scope_too_large",
  "blocker_detail": "6 files exceeded single-pass limit; runtime tools import shared types not in scope",
  "new_slices": [
    "tool-schema-migration-runtime",
    "tool-schema-migration-doc",
    "tool-schema-migration-shared-types"
  ],
  "graph_updated": true,
  "timestamp": "2026-03-24T10:00:00Z"
}
```

## Decision Tree (Visual)

```
Slice failed 2x
  │
  ├── Blocker is external dependency?
  │     YES → Add a read slice or expand scope of existing read slice
  │            Update dependency graph
  │            Re-delegate
  │
  ├── Blocker is scope too large?
  │     YES → Apply splitting heuristics:
  │            1. Split by authority surface
  │            2. If still >5 files → split by concern
  │            3. If still >5 files → split by file cluster
  │            4. If still >5 files → split by sub-directory
  │            5. If still >5 files → escalate (plan too coarse)
  │            Re-delegate new slices
  │
  ├── Blocker is missing context?
  │     YES → Insert a read slice before the write slice
  │            Read slice produces analysis that write slice consumes
  │            Update dependency: read → write
  │
  ├── Blocker is conflicting with peer?
  │     YES → Merge conflicting slices into sequential pair
  │            Slice A (first concern) → Slice B (second concern)
  │            Remove old slices, add merged pair
  │
  └── Blocker is architectural?
        YES → STOP
              Return blocked to orchestrator with evidence
              Orchestrator escalates to user
              Do NOT attempt further decomposition
```

## Limits

- Maximum 3 re-decomposition attempts per original slice
- After 3rd failure → escalate unconditionally
- Each re-decomposition must produce strictly smaller slices than the previous
