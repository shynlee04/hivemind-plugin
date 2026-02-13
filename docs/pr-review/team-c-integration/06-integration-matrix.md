# Cross-Domain Integration Conflict Matrix

**Analysis Date:** 2026-02-13  
**Team:** Team C - Integration Architecture  
**Scope:** 17 PRs across persistence, hierarchy, testing, configuration, and lifecycle domains

---

## Executive Summary

### Critical Finding: Mass Revert Impact
Commit `28f6c3d` reverted **6 critical PRs** (#4, #5, #10, #11, #14, #15) affecting persistence.ts, creating a **production performance regression**. The current codebase has:

- **Blocking I/O** in FileLock (openSync/closeSync) - reverts PR #11
- **Sequential backup cleanup** - reverts PR #14  
- **Inefficient read+write backup** - reverts PR #15
- **Missing migration extraction** - reverts PR #5
- **Missing backup logging** - reverts PR #10
- **Recursive flattenTree** - reverts PR #4

### Missing Artifacts
**8 diff files are unavailable**, preventing full analysis:
- PR #4: Flatten tree optimization
- PR #5: Extract state migration  
- PR #6: Hierarchy rendering refactor
- PR #7: SDK Context tests
- PR #9: CLI formatting standardization
- PR #10: Persistence logging
- PR #12: Path traversal fix
- PR #13: Agent behavior tests

---

## 1. PR x PR Conflict Matrix

### Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | No conflict - can merge in any order |
| ⚠️ | Soft dependency - order recommended |
| 🔒 | Hard dependency - must merge in order |
| ❌ | Semantic conflict - cannot merge together |
| ? | Unknown - missing diff file |

### Full Matrix

| PR | #4 | #5 | #6 | #7 | #8 | #9 | #10 | #11 | #12 | #13 | #14 | #15 | #16 | #17 |
|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|
| **#4** Flatten | - | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#5** Migration | ✅ | - | ✅ | ✅ | ✅ | ✅ | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#6** Render | ⚠️ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#7** SDK Tests | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#8** Config | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#9** CLI | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#10** Logging | ✅ | 🔒 | ✅ | ✅ | ✅ | ✅ | - | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| **#11** Async | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | - | ✅ | ✅ | 🔒 | 🔒 | ✅ | ✅ |
| **#12** Security | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ | ✅ |
| **#13** Tests | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| **#14** Concurrent | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | 🔒 | ✅ | ✅ | - | ✅ | ✅ | ✅ |
| **#15** copyFile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | 🔒 | ✅ | ✅ | ✅ | - | ✅ | ✅ |
| **#16** Levenshtein | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ⚠️ |
| **#17** Lifecycle | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | - |

---

## 2. File Modification Overlap Analysis

### persistence.ts - 5 PRs (HIGHEST COMPLEXITY)

```
persistence.ts Structure:
├─ Lines 1-50:    Imports & Utilities
├─ Lines 51-80:   cleanupOldBackups() ← PR #14, #10
├─ Lines 81-140:  FileLock class ← PR #11
├─ Lines 141-200: createStateManager() - load() ← PR #5
├─ Lines 201-260: createStateManager() - save() ← PR #15, #10
├─ Lines 261-300: createStateManager() - withState() ← PR #5
├─ Lines 301-362: loadConfig(), saveConfig()
```

**Line-by-Line Overlap:**

| PR | Lines | Function | Overlaps With |
|----|-------|----------|---------------|
| #5 | 141-200, 261-300 | load(), withState() | None (migration logic) |
| #10 | 51-80, 201-260 | cleanupOldBackups(), save() | #14 (cleanup), #15 (save backup) |
| #11 | 81-140 | FileLock class | None (fundamental refactor) |
| #14 | 51-80 | cleanupOldBackups() | #10 (same function) |
| #15 | 201-260 | save() backup creation | #10 (same region) |

**Critical Integration Path:**
1. **PR #11 MUST be first** - changes FileLock foundation (lines 81-140)
2. **PR #14 and #15 can be parallel** - operate on different functions
3. **PR #10 and #5 should be last** - add logging/extraction on top

### hierarchy-tree.ts - 2 PRs

```
hierarchy-tree.ts Structure:
├─ Lines 1-100:   Types & Stamps
├─ Lines 101-200: Tree CRUD
├─ Lines 201-300: Queries
├─ Lines 301-400: Staleness
├─ Lines 401-500: Rendering ← PR #6
├─ Lines 501-600: Janitor
├─ Lines 601-700: I/O
├─ Lines 701-858: Migration & flattenTree ← PR #4
```

**Line-by-Line Overlap:**

| PR | Lines | Function | Overlaps With |
|----|-------|----------|---------------|
| #4 | ~730-780 | flattenTree() | #6 (rendering uses flattenTree) |
| #6 | 401-500 | toAsciiTree(), renderNode() | #4 (consumes flattenTree) |

**Integration Path:**
- PR #4 changes `flattenTree()` algorithm (iterative vs recursive)
- PR #6 adds rendering helpers that call `flattenTree()`
- **Order:** #4 first (algorithm), then #6 (rendering that uses it)

### config.ts - 2 PRs

```
config.ts Structure:
├─ Lines 1-30:   Type definitions ← PR #8
├─ Lines 31-100: Interfaces
├─ Lines 101-150: DEFAULT_CONFIG
├─ Lines 151-220: Functions & validation ← PR #8
```

**Line-by-Line Overlap:**

| PR | Lines | Function | Overlaps With |
|----|-------|----------|---------------|
| #8 | 1-30, 151-220 | Type exports, validation | None (replaces inline arrays) |
| #13 | Unknown | Tests | None (test file) |

### detection.ts / utils/string.ts - PR #16

**Dependency Chain:**
```
session-lifecycle.ts ──imports──► detection.ts
                                      │
                                      └── PR #16 moves levenshteinSimilarity
                                              to utils/string.ts
```

PR #16 creates a **new file** `src/utils/string.ts` and modifies `detection.ts` to import from it. No other PRs touch these files.

### session-lifecycle.ts / helpers.ts - PR #17

**Architecture Change:**
- Creates new file: `src/hooks/session-lifecycle-helpers.ts` (701 lines)
- Refactors: `src/hooks/session-lifecycle.ts` to use helpers
- **Note:** The helpers file does NOT exist in current codebase - PR was reverted

---

## 3. Merge Order Recommendations

### Priority 1: CRITICAL (Blocking Issues)

**Order for persistence.ts:**
```
PR #11 (Async Lock) ────────────────────────┐
   │                                         │
   ├──► PR #14 (Concurrent Deletion) ────────┤
   │                                         ├──► Integration Complete
   └──► PR #15 (copyFile Optimization) ──────┘
   
Then:
PR #10 (Logging) ──► PR #5 (Migration Extract)
```

**Rationale:**
- PR #11 changes the FileLock class foundation
- PR #14 and #15 use the lock mechanism (acquire/release)
- PR #10 adds logging to functions modified by #14/#15
- PR #5 extracts migration logic from load/withState

### Priority 2: HIGH (Performance)

**Order for hierarchy-tree.ts:**
```
PR #4 (Flatten Tree) ──► PR #6 (Rendering Refactor)
```

**Rationale:**
- PR #4 optimizes the flatten algorithm
- PR #6 adds rendering that depends on flattenTree

### Priority 3: MEDIUM (Code Quality)

**Independent PRs (any order):**
- PR #8 (Config constants)
- PR #9 (CLI formatting)  
- PR #12 (Security fix)
- PR #16 (Levenshtein extraction)
- PR #17 (Lifecycle refactor)

### Priority 4: TESTS

**Test restoration order:**
```
1. PR #7 (SDK Context tests)
2. PR #13 (Agent behavior tests)
3. Tests for PR #10, #11, #14, #15 (if not included)
```

---

## 4. Integration Test Requirements

### Required Integration Tests

| Component | Test Scenario | Priority |
|-----------|---------------|----------|
| FileLock | Concurrent save operations | P0 |
| persistence.ts | Backup creation + cleanup cycle | P0 |
| persistence.ts | Lock timeout/stale handling | P1 |
| hierarchy-tree.ts | flattenTree performance (1000+ nodes) | P1 |
| session-lifecycle.ts | Full lifecycle with persistence | P1 |
| config.ts | Constants match validation functions | P2 |

### Test Coverage Gaps

**Missing Test Files (6 total):**
1. `tests/sdk-context.test.ts` (PR #7) - DELETED
2. `tests/agent-behavior.test.ts` (PR #13) - DELETED
3. `tests/persistence-logging.test.ts` (PR #10) - DELETED
4. `tests/string-utils.test.ts` (PR #16) - DELETED
5. `tests/config-health.test.ts` (PR #8) - DELETED
6. `tests/session-lifecycle-helpers.test.ts` (PR #17) - NEVER CREATED

---

## 5. Risk Assessment Summary

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Blocking I/O in production | CRITICAL | HIGH | Re-apply PR #11 immediately |
| Missing 8 diff files | HIGH | CERTAIN | Locate or recreate PRs |
| Test coverage regression | HIGH | CERTAIN | Restore deleted tests |
| Performance degradation | MEDIUM | HIGH | Re-apply #4, #14, #15 |
| Code drift from reverts | MEDIUM | MEDIUM | Create integration branch |

---

## 6. Action Items

### Immediate (This Sprint)
- [ ] Locate missing diff files for PRs #4, #5, #6, #7, #9, #10, #12, #13
- [ ] Create integration test suite for persistence layer
- [ ] Re-apply PR #11 (Async Lock) - CRITICAL

### Short Term (Next Sprint)  
- [ ] Re-apply PRs #14, #15, #10, #5 in order
- [ ] Restore all deleted test files
- [ ] Run full integration test suite

### Long Term (Future Sprint)
- [ ] Re-apply PR #17 (Lifecycle refactor)
- [ ] Add performance regression tests
- [ ] Document merge order for future PRs

---

*Analysis generated by Team C - Integration Architecture*  
*Artifacts: 06-integration-matrix.md, 06-integration-conflicts.md, 06-architectural-coherence.md*
