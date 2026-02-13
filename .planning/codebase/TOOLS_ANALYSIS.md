# HiveMind Tools Analysis Report

**Analysis Date:** 2026-02-13
**Focus:** Deep analysis of 14 tools implementation in `/src/tools/`

---

## Executive Summary

This report provides a comprehensive analysis of all 14 tools in the HiveMind plugin, covering common patterns, error handling, idempotency guarantees, state file operations, and identified bugs/issues. The codebase demonstrates good overall design with consistent patterns, but has several areas for improvement particularly around error handling and type safety.

---

## 1. Tools Overview

All 14 tools follow a consistent factory pattern:

```typescript
export function createXxxTool(directory: string): ToolDefinition {
  return tool({
    description: "...",
    args: { /* schema */ },
    async execute(args, _context) { /* implementation */ }
  })
}
```

### Tools List

| Tool | File | Purpose |
|------|------|---------|
| `declare_intent` | `declare-intent.ts` | Unlock session, set mode/focus |
| `map_context` | `map-context.ts` | Update hierarchy level (trajectory/tactic/action) |
| `compact_session` | `compact-session.ts` | Archive session, reset state |
| `self_rate` | `self-rate.ts` | Agent self-assessment for drift detection |
| `scan_hierarchy` | `scan-hierarchy.ts` | Quick snapshot of session state |
| `save_anchor` | `save-anchor.ts` | Save immutable fact across compactions |
| `think_back` | `think-back.ts` | Context refresh/refocus |
| `check_drift` | `check-drift.ts` | Verify alignment with trajectory |
| `save_mem` | `save-mem.ts` | Save memory to Mems Brain |
| `list_shelves` | `list-shelves.ts` | Show Mems Brain shelf summary |
| `recall_mems` | `recall-mems.ts` | Search Mems Brain |
| `hierarchy_prune` | `hierarchy.ts` | Clean completed branches |
| `hierarchy_migrate` | `hierarchy.ts` | Convert flat to tree hierarchy |
| `export_cycle` | `export-cycle.ts` | Capture subagent results |

---

## 2. Common Patterns

### 2.1 State Management Pattern

All tools use a consistent state management approach:

```typescript
// 1. Create state manager
const stateManager = createStateManager(directory)

// 2. Load current state
let state = await stateManager.load()
if (!state) {
  return "ERROR: No active session. Call declare_intent first."
}

// 3. Modify state (pure functions)
state = updateHierarchy(state, projection)

// 4. Save state
await stateManager.save(state)
```

**Files:** 
- `src/lib/persistence.ts:20-106` - StateManager implementation

### 2.2 Error Handling Pattern

Most tools follow this error handling pattern:

```typescript
async execute(args, _context) {
  // Validation
  if (!args.content?.trim()) return "ERROR: ..."

  // State operations
  const stateManager = createStateManager(directory)
  let state = await stateManager.load()
  if (!state) {
    return "ERROR: No active session. Call declare_intent first."
  }

  // ... modify state ...

  // Save
  await stateManager.save(state)

  // Return success
  return "Success message"
}
```

### 2.3 File I/O Pattern

State file operations use async/await with error swallowing:

```typescript
// Common pattern in planning-fs.ts
try {
  const content = await readFile(filePath, "utf-8");
  return parseActiveMd(content);
} catch {
  return { frontmatter: {}, body: "" }; // Silent fallback
}
```

---

## 3. Idempotency Analysis

### 3.1 Tools with Good Idempotency

**`save_anchor`** (`src/tools/save-anchor.ts:32`)
- Uses upsert pattern: filters existing then adds new
- Safe to call multiple times with same key
- Line 30: Detects existing anchor before upsert

**`save_mem`** (`src/tools/save-mem.ts:48-54`)
- Checks for duplicate content before saving
- Returns informative message if duplicate exists

**`hierarchy_prune`** (`src/tools/hierarchy.ts:51`)
- Uses functional pattern: `pruneCompleted(tree)` returns new tree
- No side effects on repeated calls

### 3.2 Tools with Potential Idempotency Issues

**`declare_intent`** (`src/tools/declare-intent.ts:88-92`)
- Issue: Creates new session ID each call if no state exists
- Could create multiple sessions if called rapidly
- Line 90: `const sessionId = generateSessionId()`

**`map_context`** (`src/tools/map-context.ts:112-134`)
- Potential duplicate nodes if called rapidly with same content
- No check for existing identical node before adding

---

## 4. State File Operations

### 4.1 Files Modified by Tools

| File | Tools | Purpose |
|------|-------|---------|
| `.hivemind/brain.json` | All tools | Primary state |
| `.hivemind/hierarchy.json` | declare_intent, map_context, hierarchy tools, export_cycle | Tree structure |
| `.hivemind/sessions/{stamp}.md` | declare_intent, map_context | Per-session content |
| `.hivemind/sessions/manifest.json` | declare_intent, compact_session | Session registry |
| `.hivemind/active.md` | declare_intent, map_context | Legacy active session |
| `.hivemind/anchors.json` | save_anchor | Immutable facts |
| `.hivemind/mems.json` | save_mem, recall_mems, export_cycle | Long-term memory |
| `.hivemind/sessions/index.md` | compact_session, map_context | Session history |

### 4.2 Write Ordering Issues

**`declare_intent.ts:84-174`** performs 5 sequential writes:
1. `initializePlanningDirectory()` - Creates directories
2. `stateManager.save(state)` - Brain state
3. `saveTree(directory, tree)` - Hierarchy tree
4. `writeFile(join(paths.sessionsDir, sessionFileName), sessionContent)` - Session file
5. `registerSession(directory, stamp, sessionFileName)` - Manifest
6. `writeFile(paths.activePath, legacyContent)` - Legacy active.md

**Risk:** If any write fails, system may be in inconsistent state.

### 4.3 Backup Mechanism

**`src/lib/persistence.ts:78-86`**
```typescript
// Backup before overwrite — prevents silent state loss from corruption
if (existsSync(brainPath)) {
  const bakPath = brainPath + ".bak";
  try {
    await copyFile(brainPath, bakPath);
  } catch {
    // Non-fatal — proceed with save even if backup fails
  }
}
```
- Creates `.bak` file before writing
- Backup failure is silently ignored (line 83-85)

---

## 5. Issues and Bugs

### 5.1 High Impact Issues

#### Issue 1: Silent Error Swallowing in export_cycle
**File:** `src/tools/export-cycle.ts:87-88, 104-105`
```typescript
} catch {
  treeAction = "tree update failed (non-fatal)";
}
// ...
} catch {
  memAction = "mem save failed (non-fatal)";
}
```
**Impact:** Tree update or mem save failures are silently ignored. Data loss possible.
**Recommendation:** Log errors or return partial failure status to user.

#### Issue 2: Silent Error Swallowing in compact_session
**File:** `src/tools/compact-session.ts:336-337, 358-359`
```typescript
} catch {
  // Export failure is non-fatal
}
// ...
} catch {
  // Auto-mem failure is non-fatal
}
```
**Impact:** Export file creation or auto-mem save failures silently ignored.
**Recommendation:** At minimum, log the failure.

#### Issue 3: Silent Failure in planning-fs.ts
**File:** `src/lib/planning-fs.ts:366-369, 406-408`
```typescript
} catch {
  // File doesn't exist — create with just the log entry
  const minimal = `---\nsession_id: "${stamp}"\n---\n\n## Log\n${logEntry}\n`;
  await writeFile(filePath, minimal);
}
// ...
} catch {
  // Silently fail — file may not exist yet
}
```
**Impact:** Missing sections cause silent data loss.
**Recommendation:** Return error or create proper fallback content.

#### Issue 4: JSON Parse Errors Return Null
**File:** `src/lib/persistence.ts:70-72`
```typescript
} catch {
  return null;
}
```
**Impact:** Corrupted brain.json returns null, masking file corruption issues.
**Recommendation:** Log the error and consider creating backup before parsing.

---

### 5.2 Medium Impact Issues

#### Issue 5: Type Safety - Any Cast in export_cycle
**File:** `src/tools/export-cycle.ts:130`
```typescript
return { ...node, status: status as any };
```
**Impact:** Bypasses TypeScript type checking.
**Recommendation:** Use proper type guard or update `ContextStatus` type.

#### Issue 6: Type Safety - Any Cast in map_context
**File:** `src/tools/map-context.ts:247`
```typescript
const cursorNode = getCursorNode(tree as any)
```
**Impact:** Hides potential type mismatch.
**Recommendation:** Fix the type issue rather than casting.

#### Issue 7: No File Locking
**Files:** All tools that write state

**Impact:** Race condition if multiple tool calls happen simultaneously.
**Recommendation:** Implement file locking or use atomic write operations.

#### Issue 8: Multiple Async Operations Without Transaction
**Files:** 
- `src/tools/declare-intent.ts:84-174`
- `src/tools/map-context.ts:82-216`
- `src/tools/compact-session.ts:256-397`

**Impact:** Partial failure leaves inconsistent state.
**Recommendation:** Implement write-ahead logging or rollback mechanism.

---

### 5.3 Low Impact Issues

#### Issue 9: Undefined Check Missing in map_context
**File:** `src/tools/map-context.ts:91`
```typescript
if (tree.root) {
  // ...
}
```
**Impact:** If tree.root is undefined, falls back to flat update (line 142-145). This is actually handled correctly but the code path is confusing.

#### Issue 10: Potential Null Pointer in findParentId
**File:** `src/tools/map-context.ts:227-251`
```typescript
function findParentId(
  tree: { root: import("../lib/hierarchy-tree.js").HierarchyNode | null; cursor: string | null },
  level: HierarchyLevel
): string | null {
  if (!tree.root || !tree.cursor) {
    return level === "trajectory" ? tree.root?.id ?? null : null;
  }
  // ...
}
```
**Impact:** Complex fallback logic, some edge cases may not work as expected.
**Recommendation:** Add more explicit tests for edge cases.

#### Issue 11: Duplicate Detection Race Condition
**File:** `src/tools/save-mem.ts:48-54`
```typescript
const isDuplicate = memsState.mems.some(
  m => m.shelf === args.shelf && m.content === args.content
);
if (isDuplicate) {
  return `Memory already exists...`;
}
memsState = addMem(memsState, args.shelf, args.content, tagList, sessionId);
```
**Impact:** Between check and add, another call could add duplicate.
**Recommendation:** Use database transaction or check in addMem itself.

---

## 6. Type Safety Concerns

### 6.1 Explicit Type Casts (2 instances)

| Location | File | Line | Cast |
|----------|------|------|------|
| export_cycle | `src/tools/export-cycle.ts` | 130 | `status as any` |
| map_context | `src/tools/map-context.ts` | 247 | `tree as any` |

### 6.2 Implicit Any in Catch Blocks

All catch blocks use implicit `any`:
```typescript
} catch {
  // err is implicit any
}
```

**Recommendation:** Use `catch (err: unknown)` pattern per AGENTS.md guidelines.

### 6.3 State Migration Pattern

**`src/lib/persistence.ts:31-66`** shows good migration pattern:
```typescript
parsed.last_commit_suggestion_turn ??= 0;
parsed.session.date ??= new Date(parsed.session.start_time).toISOString().split("T")[0];
// ... many migrations
```

---

## 7. Edge Cases

### 7.1 Handled Edge Cases

| Edge Case | Handling Location |
|-----------|------------------|
| No brain.json exists | `src/lib/persistence.ts:26-28` - Returns null |
| Config missing | `src/tools/declare-intent.ts:71-79` - Returns error |
| No active session | Most tools check `if (!state)` and return error |
| Tree doesn't exist | `src/lib/hierarchy-tree.ts:752` - Returns empty tree |
| Corrupt JSON | `src/lib/persistence.ts:70` - Returns null |
| No hierarchy set | `src/tools/map-context.ts:84-86` - Returns error |

### 7.2 Unhandled Edge Cases

| Edge Case | Potential Issue |
|-----------|-----------------|
| Very large files_touched array | No limit, memory growth |
| Very long hierarchy tree | No depth limit in `addChild` |
| Rapid successive calls | Race conditions possible |
| Disk full | No handling, write will throw |
| Permission denied | Silent failure in some places |

---

## 8. Recommendations

### 8.1 High Priority

1. **Replace silent catch blocks with proper error handling**
   - At minimum, log errors
   - Consider returning partial failure status

2. **Implement file locking for concurrent access**
   - Use `fs.flock` or similar mechanism
   - Or implement optimistic locking with version numbers

3. **Add proper catch error typing**
   - Change `catch {` to `catch (err: unknown)` per project guidelines

### 8.2 Medium Priority

1. **Remove type casts**
   - Fix underlying type issues instead of casting

2. **Implement transaction-like writes**
   - Write to temp file first, then rename
   - Or implement rollback on failure

3. **Add edge case tests**
   - Rapid successive calls
   - Concurrent access
   - Disk full scenarios

### 8.3 Low Priority

1. **Add file size limits**
   - Cap files_touched array
   - Limit tree depth

2. **Improve error messages**
   - Return specific error details to user
   - Include file paths in errors

---

## 9. Code Statistics

| Metric | Value |
|--------|-------|
| Total tool files | 14 |
| Total tool lines (avg per file) | ~150 lines |
| State file types | 8 |
| Common catch blocks | 33 instances |
| Type casts (as any) | 2 instances |

---

## 10. Conclusion

The HiveMind tools implementation demonstrates solid architecture with consistent patterns. The main areas for improvement are:

1. **Error handling** - Too many silent failures that could mask real issues
2. **Type safety** - A few `as any` casts that should be fixed properly
3. **Concurrency** - No file locking for simultaneous access
4. **Idempotency** - Some tools could have duplicate issues under race conditions

The code is well-structured and maintainable. The identified issues are mostly around defensive programming rather than fundamental design flaws.

---

*Analysis completed: 2026-02-13*
*Tools analyzed: declare-intent.ts, map-context.ts, compact-session.ts, self-rate.ts, scan-hierarchy.ts, save-anchor.ts, think-back.ts, check-drift.ts, save-mem.ts, list-shelves.ts, recall-mems.ts, hierarchy.ts, export-cycle.ts*
