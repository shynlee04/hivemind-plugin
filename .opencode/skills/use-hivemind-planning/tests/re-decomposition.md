# Scenario: Re-Decomposition After Failure

## Initial State

Slice `migrate-shared-types` fails twice:

- Attempt 1: `status: "partial"`, `blocked_routes: ["requires changes to 8 files across 3 directories"]`
- Attempt 2: `status: "blocked"`, `blocked_routes: ["circular import between core/trajectory.ts and shared/types.ts"]`

## Re-Decomposition Procedure

### Phase 1: Failure Analysis

Blocker classification: **scope_too_large** + **circular dependency**

- 8 files exceed 5-file limit
- Circular import creates unresolvable dependency within one slice

### Phase 2: Re-Decomposition

**Step 1: Authority Surface**

| File | Surface |
|---|---|
| `core/trajectory.ts` | core |
| `core/pressure.ts` | core |
| `shared/types.ts` | shared |
| `tools/trajectory.ts` | tool |
| `tools/handoff.ts` | tool |
| `tests/trajectory.test.ts` | test |
| `tests/handoff.test.ts` | test |
| `tests/types.test.ts` | test |

**Step 2: Concern Separation**

| Concern | Files |
|---|---|
| write | 5 source files |
| write | 3 test files |
| verify | gate |

**Step 3: File Clusters**

Break the circular import:

| Cluster | Files | Resolution |
|---|---|---|
| shared-types-first | `shared/types.ts` | Extract shared types — write first |
| core-after-shared | `core/trajectory.ts`, `core/pressure.ts` | Depends on shared |
| tools-after-core | `tools/trajectory.ts`, `tools/handoff.ts` | Depends on core |
| tests-all | 3 test files | Depends on all writes |

**Step 4: New Slices**

| New Slice ID | Files | Concern | Depends On |
|---|---|---|---|
| `extract-shared-types` | 1 | write | [] |
| `migrate-core-trajectory` | 2 | write | extract-shared-types |
| `migrate-core-pressure` | 1 | write | extract-shared-types |
| `migrate-tools-trajectory` | 2 | write | migrate-core-trajectory |
| `update-tests-shared` | 1 | write | extract-shared-types |
| `update-tests-core` | 1 | write | migrate-core-trajectory |
| `update-tests-tools` | 1 | write | migrate-tools-trajectory |
| `verify-full-suite` | 0 | verify | all above |

**Step 5: Wave Assignment**

```
Wave 0: [extract-shared-types]
Wave 1: [migrate-core-trajectory, migrate-core-pressure] (parallel)
Wave 2: [migrate-tools-trajectory, update-tests-shared] (parallel)
Wave 3: [update-tests-core, update-tests-tools] (parallel)
Wave 4: [verify-full-suite]
```

### Phase 4: Log Entry

```json
{
  "original_slice_id": "migrate-shared-types",
  "failed_count": 2,
  "blocker_type": "scope_too_large",
  "blocker_detail": "8 files with circular import between core/trajectory.ts and shared/types.ts",
  "new_slices": [
    "extract-shared-types",
    "migrate-core-trajectory",
    "migrate-core-pressure",
    "migrate-tools-trajectory",
    "update-tests-shared",
    "update-tests-core",
    "update-tests-tools",
    "verify-full-suite"
  ],
  "graph_updated": true,
  "timestamp": "2026-03-24T10:00:00Z"
}
```

## Validation

- [ ] Original slice removed from graph
- [ ] 8 new slices inserted
- [ ] All new slices ≤5 files (largest is 2)
- [ ] No mixed concerns
- [ ] Circular dependency broken by extracting shared types first
- [ ] Dependency graph is acyclic
- [ ] Re-decomposition logged with full evidence
