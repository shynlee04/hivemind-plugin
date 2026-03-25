# Slice Splitting Heuristics

## When to Split

A slice needs splitting when ANY constraint is violated:

| Constraint | Threshold | Split Trigger |
|---|---|---|
| File count | >5 files | Mandatory split |
| Concern purity | Mixed read + write, or write + verify | Mandatory split |
| Complexity | Estimated `high` and >3 files | Recommended split |
| Scope clarity | `out_of_scope` is ambiguous | Clarify scope or split |

## Splitting Priority

Apply these heuristics in order. Stop when constraint is satisfied.

### 1. Split by Authority Surface

Separate tool files from hook files from core files.

```
BEFORE: 10 files across tools + hooks
AFTER:  Slice A (6 tool files), Slice B (4 hook files)
```

### 2. Split by Concern

Separate read operations from write operations from verification.

```
BEFORE: Read config, then modify 5 files
AFTER:  Slice A (read config), Slice B (modify 5 files)
```

### 3. Split by File Cluster

Separate by import graph boundaries.

```
BEFORE: 8 files importing 3 different type modules
AFTER:  Slice A (3 files, type module X), Slice B (3 files, type module Y),
        Slice C (2 files, type module Z)
```

### 4. Split by Sub-Directory

When clusters still exceed 5 files, split by directory.

```
BEFORE: 8 files in src/features/
AFTER:  Slice A (src/features/auth/), Slice B (src/features/billing/)
```

### 5. Split by Sub-Concern

When a single directory has >5 files with mixed concerns.

```
BEFORE: 6 files in src/tools/ — some are creation, some are modification
AFTER:  Slice A (3 files — new tools), Slice B (3 files — modified tools)
```

## Splitting Anti-Patterns

| Anti-Pattern | Problem | Correct |
|---|---|---|
| Splitting single files | Creates trivially small slices | Merge adjacent small slices |
| Splitting by line count | Ignores concern boundaries | Split by concern first |
| Splitting shared types alone | Creates orphan dependency | Attach shared type to the slice that owns it |
| Never splitting | Slices too large, fail in execution | Apply heuristics in order |

## Re-Merging

If splitting creates slices with <1 file each, re-merge:

1. Find adjacent slices in the same wave
2. Check if merged slice stays ≤5 files
3. Check if concerns remain pure after merge
4. If both pass, merge and update dependency graph
