# Scenario: Parallel Candidate Identification

## Input

Decomposition plan with 6 slices:

```
Slices: {read-config, migrate-tool-a, migrate-tool-b, migrate-hooks,
         update-tests, verify-suite}
```

Dependency graph:

```
read-config    → migrate-tool-a
read-config    → migrate-tool-b
read-config    → migrate-hooks
migrate-tool-a → update-tests
migrate-tool-b → update-tests
migrate-hooks  → update-tests
update-tests   → verify-suite
```

## Expected Analysis

### In-Degrees

| Slice | In-Degree |
|---|---|
| read-config | 0 |
| migrate-tool-a | 1 |
| migrate-tool-b | 1 |
| migrate-hooks | 1 |
| update-tests | 3 |
| verify-suite | 1 |

### Wave Assignment

| Wave | Slices | Parallel? | Independence Proof |
|---|---|---|---|
| 0 | read-config | N/A (single) | — |
| 1 | migrate-tool-a, migrate-tool-b, migrate-hooks | YES | No shared files (different tools/hooks directories) |
| 2 | update-tests | N/A (single) | — |
| 3 | verify-suite | N/A (single) | — |

### Independence Proof for Wave 1

```
migrate-tool-a.in_scope = ["src/tools/a.ts"]
migrate-tool-b.in_scope = ["src/tools/b.ts"]
migrate-hooks.in_scope  = ["src/hooks/env.ts"]

Intersection check:
  tool-a ∩ tool-b = ∅ ✓
  tool-a ∩ hooks  = ∅ ✓
  tool-b ∩ hooks  = ∅ ✓

Type check: no shared types modified ✓
Output chain: none (all are write, no read feeds) ✓
Directory conflict: tools/ vs hooks/ — no overlap ✓

Conclusion: Wave 1 is parallel-safe.
```

## Validation

- [ ] 4 waves identified
- [ ] Wave 1 has 3 parallel candidates
- [ ] Independence proof covers all 4 checks (files, types, output, directory)
- [ ] No false parallel claims (every pair verified)
- [ ] verify-suite correctly placed in final wave
