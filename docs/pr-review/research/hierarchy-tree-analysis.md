# Hierarchy/Tree Analysis

## PRs Analyzed
- **PR #4:** Flatten tree optimization (perf/flatten-tree-optimization)
- **PR #6:** Hierarchy rendering refactor (refactor/hierarchy-rendering)
- **PR #16:** Extract levenshteinSimilarity (refactor/extract-levenshtein-similarity)

## Current State: MIXED ⚠️

---

## PR #4 - Flatten Tree Optimization

### Original Change
- Converted recursive `flattenTree` to iterative stack-based approach
- Eliminated recursion depth limits
- Avoided O(N^2) intermediate array allocations
- Benchmark: 2x speedup (64ms -> 32ms for 1000 iterations on 781 nodes)

### Current State
**REVERTED** - Recursive implementation restored:

```typescript
// Current (recursive - less efficient)
export function flattenTree(root: HierarchyNode): HierarchyNode[] {
  const result: HierarchyNode[] = [root];
  for (const child of root.children) {
    result.push(...flattenTree(child));
  }
  return result;
}
```

### Impact
- Stack overflow risk for deep trees
- Slower performance for large hierarchies
- Memory inefficient due to spread operator

### Recommendation
Re-implement iterative version with dedicated performance tests

---

## PR #6 - Hierarchy Rendering Refactor

### Original Change
- Implemented `renderNode` helper function
- Centralized node string formatting
- Updated `summarizeBranch`, `toAsciiTree`, `toActiveMdBody`

### Current State
**PARTIALLY INTACT** - Helper exists but may have been affected by PR #4 revert

### Analysis
The `renderNode` functions exist in current code but:
1. No dedicated tests for the helper
2. Interaction with flattenTree (reverted) may cause inconsistency
3. Need to verify all formatting requirements preserved

### Recommendation
Add unit tests specifically for `renderNode` helper

---

## PR #16 - Extract Levenshtein Similarity

### Original Change
- Extracted `levenshteinSimilarity` to `src/utils/string.ts`
- Added unit tests

### Current State
**PARTIALLY REVERTED:**
- Function exists in `src/lib/detection.ts` (line 508) - still present
- Test file `tests/string-utils.test.ts` - DELETED

### Impact
- Core utility remains but without test coverage
- Risk of regression in similarity detection

### Recommendation
Restore test coverage for the utility function

---

## Usage Analysis

`flattenTree` is used in:
1. `getTreeStats()` - line 641
2. `computeCurrentGap()` - line 542  
3. `countCompleted()` - line 675
4. `summarizeBranch()` - line 684
5. `pruneCompleted()` - line 716
6. `compact-session.ts` - lines 46, 107, 175

All these consumers will benefit from the optimization when re-implemented.

---

## Conclusion

| PR | Original | Current | Priority |
|----|----------|---------|----------|
| #4 | Iterative DFS | Recursive | Re-implement P1 |
| #6 | renderNode helper | Partially intact | Add tests |
| #16 | Utility + tests | Utility present, tests deleted | Restore tests |
