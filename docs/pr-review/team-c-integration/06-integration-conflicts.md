# Detailed Integration Conflict Analysis

**Analysis Date:** 2026-02-13  
**Team:** Team C - Integration Architecture  
**Focus:** Line-level conflicts, semantic issues, and resolution strategies

---

## 1. persistence.ts - Deep Dive Analysis

### Current State (Post-Revert)

The current `persistence.ts` has **blocking synchronous I/O**:

```typescript
// Lines 120-125 - CURRENT (BLOCKING)
class FileLock {
  private fd: number | null = null  // Raw file descriptor

  async acquire(): Promise<void> {
    // ...
    this.fd = openSync(this.lockPath, "wx")  // BLOCKING
  }

  async release(): Promise<void> {
    if (this.fd !== null) {
      closeSync(this.fd)  // BLOCKING
      this.fd = null
    }
  }
}
```

### PR #11: Async Lock Release - Line Analysis

**Changes:**
```typescript
// Lines 1-5: Import changes
- import { readFile, writeFile, mkdir, rename, unlink } from "fs/promises"
- import { existsSync, openSync, closeSync } from "fs"
+ import { readFile, writeFile, mkdir, rename, unlink, open, readdir, stat } from "fs/promises"
+ import type { FileHandle } from "fs/promises"
+ import { existsSync } from "fs"

// Line 22: Change to FileLock class
- private fd: number | null = null
+ private handle: FileHandle | null = null

// Lines 74, 104: Change to async operations
- this.fd = openSync(this.lockPath, "wx")
+ this.handle = await open(this.lockPath, "wx")

- closeSync(this.fd)
+ await this.handle.close()
```

**Semantic Impact:**
- **Positive:** Non-blocking I/O, better event loop throughput
- **Risk:** Changes error handling (FileHandle vs file descriptor)
- **Compatibility:** Requires Node.js 10.0+ (fs.promises.open)

**Conflict Assessment:** ✅ **LOW CONFLICT RISK**
- Changes are localized to FileLock class (lines 81-140)
- No other PRs modify FileLock directly
- Foundation change - should be applied FIRST

---

### PR #14: Concurrent Backup Cleanup - Line Analysis

**Changes:**
```typescript
// Lines 37-46: Sequential to parallel
- for (const backup of oldBackups) {
-   try {
-     await unlink(backup.path)
-   } catch (err: unknown) {
-     // Ignore errors when deleting old backups
-   }
- }

+ await Promise.all(oldBackups.map(async (backup) => {
+   try {
+     await unlink(backup.path)
+   } catch (err: unknown) {
+     // Ignore errors when deleting old backups
+   }
+ }))
```

**Semantic Impact:**
- **Performance:** ~50-65% faster cleanup (113-158ms → 54-60ms for 1000 files)
- **Risk:** Higher memory usage (all promises in flight)
- **Behavioral:** Error handling unchanged (individual errors ignored)

**Conflict Assessment:** ⚠️ **DEPENDS ON PR #11**
- Uses `unlink` from fs/promises (PR #11 adds this import)
- Safe to apply after #11, before or after #15

---

### PR #15: fs.copyFile Optimization - Line Analysis

**Changes:**
```typescript
// Line 4: Import copyFile
- import { readFile, writeFile, mkdir, rename, unlink, open, readdir, stat } from "fs/promises"
+ import { readFile, writeFile, mkdir, rename, unlink, open, readdir, stat, copyFile } from "fs/promises"

// Lines 199-202: Change backup creation
- await writeFile(timestampedBakPath, await readFile(brainPath, "utf-8"))
+ await copyFile(brainPath, timestampedBakPath)
```

**Semantic Impact:**
- **Performance:** ~75% reduction for 50MB files (1990ms → 505ms)
- **Memory:** Eliminates double-buffering (no read into memory)
- **Atomicity:** copyFile is atomic at OS level

**Conflict Assessment:** ⚠️ **DEPENDS ON PR #11**
- Uses fs/promises which PR #11 establishes
- Operates in same `save()` function as PR #10 logging

**Line Overlap with PR #10:**
```
PR #15 changes: Line 199 (backup creation)
PR #10 adds:    Lines 201-210 (logging around backup)
Result:         Compatible - PR #10 adds lines after PR #15
```

---

### PR #10: Persistence Logging - Line Analysis

**Note:** Diff file unavailable. Based on analysis docs, this adds logging to:
1. `cleanupOldBackups()` - log cleanup errors
2. `save()` - log backup failures
3. `withState()` - log backup rename failures

**Semantic Impact:**
- **Observability:** Better error tracking
- **Risk:** None (additive only)
- **Performance:** Minimal (only on error paths)

**Conflict Assessment:** ✅ **NO CONFLICTS**
- Additive changes only
- Should be applied AFTER #14 and #15 (logs their operations)

---

### PR #5: Migration Logic Extraction - Line Analysis

**Note:** Diff file unavailable. Based on analysis docs, this extracts inline migration logic from `load()` and `withState()` into a `migrateBrainState()` function.

**Expected Changes:**
```typescript
// BEFORE: Migration inline in load() (lines 155-193)
const parsed = JSON.parse(data) as BrainState
parsed.last_commit_suggestion_turn ??= 0
parsed.session.date ??= new Date(parsed.session.start_time).toISOString().split("T")[0]
// ... 20+ more migration lines

// AFTER: Extracted to function
const parsed = migrateBrainState(JSON.parse(data))
```

**Semantic Impact:**
- **Maintainability:** Single migration function
- **Risk:** Must ensure all 3 call sites use it (load, backup recovery, withState)

**Conflict Assessment:** ✅ **NO CONFLICTS**
- Refactoring only - no behavioral changes
- Applies to different code region than #11, #14, #15

---

## 2. hierarchy-tree.ts - Line Analysis

### PR #4: Flatten Tree Optimization

**Note:** Diff file unavailable. Based on analysis docs, this changes `flattenTree()` from recursive to iterative.

**Expected Changes:**
```typescript
// BEFORE: Recursive (lines ~730-740)
export function flattenTree(root: HierarchyNode): HierarchyNode[] {
  const result: HierarchyNode[] = [root];
  for (const child of root.children) {
    result.push(...flattenTree(child));  // Recursive
  }
  return result;
}

// AFTER: Iterative stack-based
export function flattenTree(root: HierarchyNode): HierarchyNode[] {
  const result: HierarchyNode[] = [];
  const stack: HierarchyNode[] = [root];
  
  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node);
    // Push children in reverse order for correct traversal
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }
  return result;
}
```

**Semantic Impact:**
- **Performance:** ~2x speedup, eliminates recursion limit
- **Memory:** Slightly higher (stack array vs call stack)
- **Correctness:** Identical output, different traversal order

**Conflict Assessment:** ⚠️ **PR #6 DEPENDS ON THIS**
- PR #6 adds `renderNode()` helper that calls `flattenTree()`
- Must apply #4 before #6

---

### PR #6: Hierarchy Rendering Refactor

**Note:** Diff file unavailable. Based on analysis docs, this adds `renderNode()` helper and refactors `toAsciiTree()`, `summarizeBranch()`, `toActiveMdBody()`.

**Expected Changes:**
```typescript
// NEW: renderNode helper (lines ~420-450)
function renderNode(node: HierarchyNode, prefix: string, isLast: boolean): string {
  const connector = isLast ? "\\-- " : "|-- ";
  const marker = STATUS_MARKERS[node.status];
  return `${prefix}${connector}[${marker}] ${node.content}`;
}

// MODIFIED: toAsciiTree uses renderNode
export function toAsciiTree(tree: HierarchyTree): string {
  // ... uses renderNode and flattenTree
}
```

**Semantic Impact:**
- **Maintainability:** Centralized rendering logic
- **Consistency:** All tree output uses same formatter

**Conflict Assessment:** ✅ **NO CONFLICTS (with #4 applied)**
- Uses flattenTree() which #4 optimizes
- #6 should be applied AFTER #4

---

## 3. config.ts - Line Analysis

### PR #8: Config Constants Consolidation

**Current State:**
```typescript
// Lines 8-18: BEFORE PR #8
export type GovernanceMode = "permissive" | "assisted" | "strict";
export type Language = "en" | "vi";
// ... more types

// Lines 103-121: Validation with inline arrays
export function isValidGovernanceMode(mode: string): mode is GovernanceMode {
  return ["permissive", "assisted", "strict"].includes(mode);
}
```

**PR #8 Changes:**
```typescript
// AFTER: Constants with typeof
export const GOVERNANCE_MODES = ["permissive", "assisted", "strict"] as const;
export type GovernanceMode = (typeof GOVERNANCE_MODES)[number];

// Validation uses constants
export function isValidGovernanceMode(mode: string): mode is GovernanceMode {
  return (GOVERNANCE_MODES as readonly string[]).includes(mode);
}
```

**Semantic Impact:**
- **Maintainability:** Single source of truth
- **Type Safety:** Const assertion ensures literal types

**Conflict Assessment:** ✅ **NO CONFLICTS**
- Self-contained changes
- PR #13 (tests) depends on this structure

---

## 4. detection.ts / utils/string.ts - Line Analysis

### PR #16: Levenshtein Similarity Extraction

**Current State (detection.ts lines 508-529):**
```typescript
// Function is INLINED in detection.ts
function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  // ... character overlap algorithm
}
```

**PR #16 Changes:**
```typescript
// NEW FILE: src/utils/string.ts
export function levenshteinSimilarity(a: string, b: string): number {
  // Same implementation
}

// detection.ts changes:
+ import { levenshteinSimilarity } from "../utils/string.js";

- function levenshteinSimilarity(a: string, b: string): number { ... }
```

**Semantic Impact:**
- **Reusability:** Function available for other modules
- **Organization:** Utilities in utils/

**Conflict Assessment:** ✅ **NO CONFLICTS**
- Creates new file, removes inline function
- No other PRs touch detection.ts

---

## 5. session-lifecycle.ts - Line Analysis

### PR #17: Session Lifecycle Refactor

**Note:** Diff file shows 701-line helpers file created.

**Architecture Changes:**
```
BEFORE:
session-lifecycle.ts (898 lines)
  └── All logic inline

AFTER:
session-lifecycle.ts (reduced size)
  └── Imports from session-lifecycle-helpers.ts (701 lines)
```

**Helper Functions Extracted:**
- `collectProjectSnapshot()` - Project introspection
- `formatHintList()` - Formatting utility
- `localized()` - i18n helper
- `getNextStepHint()` - UX guidance
- `generateBootstrapBlock()` - Prompt generation
- `generateSetupGuidanceBlock()` - Setup instructions
- `generateProjectBackboneBlock()` - First-run guidance
- `compileFirstTurnContext()` - Context assembly
- `handleStaleSession()` - Archival logic
- `getHierarchySection()` - Tree rendering

**Semantic Impact:**
- **Maintainability:** 701 lines moved to dedicated helpers
- **Testability:** Helpers can be unit tested
- **Complexity:** session-lifecycle.ts becomes orchestration layer

**Conflict Assessment:** ⚠️ **SOFT DEPENDENCY**
- PR #16 adds import to detection.ts which is used by session-lifecycle.ts
- Order: #16 first (creates utils/string.ts), then #17

---

## 6. Semantic Conflicts Summary

### No Semantic Conflicts Found ✅

All PRs are **technically compatible**. The "conflicts" are:
1. **Dependencies:** Some PRs depend on others (e.g., #6 needs #4)
2. **Import changes:** PR #11 changes imports that affect #14 and #15
3. **Additive changes:** PR #10 adds logging to code modified by #15

### Potential Issues

| Issue | PRs Involved | Resolution |
|-------|--------------|------------|
| Import ordering | #11, #14, #15 | Apply #11 first |
| Function dependencies | #4, #6 | Apply #4 before #6 |
| Module dependencies | #16, #17 | Apply #16 before #17 |

---

## 7. Resolution Strategies

### Strategy 1: Dependency-Ordered Application (RECOMMENDED)

```bash
# Step 1: Apply foundational changes
git apply pr11.diff  # Async lock foundation
git apply pr16.diff  # Utils extraction

# Step 2: Apply parallel-safe changes  
git apply pr14.diff  # Concurrent cleanup
git apply pr15.diff  # copyFile optimization
git apply pr8.diff   # Config constants

# Step 3: Apply dependent changes
git apply pr4.diff   # Flatten tree (missing)
git apply pr6.diff   # Rendering (depends on #4)
git apply pr17.diff  # Lifecycle refactor (depends on #16)

# Step 4: Apply additive changes
git apply pr10.diff  # Logging (depends on #15)
git apply pr5.diff   # Migration extraction

# Step 5: Apply tests
git apply pr7.diff   # SDK tests (missing)
git apply pr13.diff  # Agent tests (missing)
```

### Strategy 2: Feature Branch Integration

Create integration branch with all changes:
```bash
git checkout -b integration/all-prs
# Apply all PRs in order
npm test  # Verify no regressions
```

### Strategy 3: Phased Rollout

```
Phase 1 (Critical): #11 (Async lock)
Phase 2 (Performance): #4, #14, #15
Phase 3 (Quality): #5, #6, #8, #10
Phase 4 (Refactoring): #16, #17
Phase 5 (Tests): #7, #13
```

---

## 8. Risk Ratings

| PR | Risk Level | Risk Factors |
|----|------------|--------------|
| #11 | 🔴 HIGH | Event loop blocking if not applied; behavior change in error handling |
| #14 | 🟡 MEDIUM | Concurrent deletion increases memory pressure |
| #15 | 🟢 LOW | Standard fs operation, well-tested |
| #4 | 🟡 MEDIUM | Algorithm change - needs regression test |
| #6 | 🟢 LOW | Refactoring only |
| #8 | 🟢 LOW | Type-level changes only |
| #16 | 🟢 LOW | Code movement only |
| #17 | 🟡 MEDIUM | Large refactor - needs thorough testing |

---

*Analysis generated by Team C - Integration Architecture*
