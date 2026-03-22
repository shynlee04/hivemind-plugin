# Activity Mapper

## Dependency Types

| Type | Detection Method | Strength |
|------|-----------------|----------|
| `import` | `grep -n "import.*from.*'"$file"'` or relative path resolution | Strong — must commit first |
| `type-ref` | `grep -n "import type\|:.*=.*"` matching exported type names | Medium — should commit first |
| `config` | `grep -n "process.env\|config\|\.env"` referencing config files | Medium — should commit first |
| `generate` | File header contains `@generated` or path matches `*.generated.*` | Strong — source must commit first |
| `test-of` | Filename pattern `*.test.ts` or `*.spec.ts` with base name match | Weak — test can commit with or after source |

## Activity Map JSON Structure

```json
{
  "_meta": {
    "created_at": "2026-03-23T10:00:00Z",
    "updated_at": "2026-03-23T10:00:00Z"
  },
  "concern": "Add hivemind-atomic-commit skill",
  "total_files": 5,
  "activity_classes": ["code", "meta"],
  "dependencies": [
    {
      "source": "src/tools/commit/classify.ts",
      "target": "src/shared/paths.ts",
      "type": "import",
      "strength": "strong"
    }
  ],
  "commit_batches": [
    {
      "batch_id": "batch_1",
      "files": ["src/shared/paths.ts"],
      "activity_class": "code",
      "reason": "No dependencies — commits first"
    },
    {
      "batch_id": "batch_2",
      "files": ["src/tools/commit/classify.ts"],
      "activity_class": "code",
      "reason": "Depends on batch_1"
    }
  ],
  "ordering_violations": [],
  "circular_dependencies": []
}
```

## Ordering Rules

1. **Strong dependencies first.** Files with `import` or `generate` dependencies on other changed files must be in later batches.
2. **No interleaved classes within a batch.** Each batch contains files of one activity class.
3. **Cross-class ordering.** `meta` commits before `code` if code depends on config. `code` commits before `projection` if projection is generated from code.
4. **Circular dependency handling.** If circular `import` dependencies exist among changed files, they MUST be in the same batch (one atomic commit).

## Batch Detection

Files are grouped into batches using topological sort:

```
1. Build dependency graph from changed files
2. Find files with zero in-degree → batch_1
3. Remove batch_1 files from graph
4. Find new zero in-degree files → batch_2
5. Repeat until all files assigned
6. Detect cycles: remaining unassigned files form cycles → combine into one batch
```

Maximum batch size: 20 files. If a batch exceeds 20 files, split by subdirectory.

## Ordering Violations

An ordering violation occurs when:
- A file depends on a file in a later batch (graph error)
- A batch mixes activity classes with cross-class dependencies
- A circular dependency is split across batches

Violations are recorded in `ordering_violations` and must be resolved before committing.

## Multi-Class Batches

When a concern spans multiple activity classes (e.g., code + docs + config), the mapper produces separate batches per class, respecting cross-class dependency order:

```
config/meta → code → artifact → runtime → projection
```
