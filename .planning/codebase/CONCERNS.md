# Codebase Concerns

**Analysis Date:** 2026-02-13

## Critical Issues

### 1. No File Locking — Race Condition on State Saves

**Severity:** CRITICAL

**Issue:** Multiple components create independent `StateManager` instances and perform load-modify-save cycles without any locking mechanism. The soft-governance hook (`src/hooks/soft-governance.ts` line 412) saves state after EVERY tool call, creating high contention.

**Files affected:**
- `src/lib/persistence.ts` (no locking implementation)
- `src/tools/declare-intent.ts` (line 119: save after load)
- `src/tools/map-context.ts` (line 156: save after load)
- `src/tools/compact-session.ts` (line 397)
- `src/tools/self-rate.ts` (line 61)
- `src/tools/export-cycle.ts` (line 111)
- `src/hooks/soft-governance.ts` (line 412: saves on every tool call)
- `src/hooks/tool-gate.ts` (lines 246, 277)
- `src/hooks/event-handler.ts` (lines 90, 104)
- `src/hooks/session-lifecycle.ts` (lines 429, 457)
- `src/hooks/compaction.ts` (line 57)

**Impact:** When tools run in rapid succession or parallel, state writes can overwrite each other, causing:
- Lost metrics updates (turn counts, tool type counts)
- Lost governance signals
- Corrupted session state with partial updates
- Hierarchy drift between brain.json and hierarchy.json

**Fix approach:** Implement file-based locking using `fs.lockfile` or a custom lock file with PID/timestamp. Use atomic writes (write to temp file, then rename).

---

### 2. Silent Error Swallowing in Load

**Severity:** HIGH

**Issue:** `src/lib/persistence.ts` lines 70-72 swallow ALL errors and return `null`, hiding:
- JSON parse errors (corrupted brain.json)
- Permission denied errors
- File not found (handled separately at line 26-28)
- Disk I/O failures

**Code reference:**
```typescript
// Line 70-72 in src/lib/persistence.ts
} catch {
  return null;
}
```

**Impact:** 
- Corrupted state files go undetected
- No logging of failures for debugging
- Session may continue with stale/null state silently

**Fix approach:** 
- Distinguish between "file not found" (return null) and other errors (log and re-throw or return partial state)
- Add optional validation callback for loaded state

---

### 3. No Schema Validation on Load

**Severity:** HIGH

**Issue:** `src/lib/persistence.ts` line 30 parses JSON and applies migrations, but never validates against `BrainState` schema.

**Code reference:**
```typescript
// Line 30-68 in src/lib/persistence.ts
const parsed = JSON.parse(data) as BrainState;
// Migration code runs but no validation after
parsed.last_commit_suggestion_turn ??= 0;
```

**Impact:**
- Malformed data causes runtime errors later
- Partial/invalid state may be saved back
- TypeScript `as` cast is unchecked at runtime

**Fix approach:** Add Zod or similar validation after parsing/migration. Return validation errors instead of corrupted state.

---

### 4. Non-Atomic Writes — Potential State Loss

**Severity:** MEDIUM

**Issue:** `src/lib/persistence.ts` lines 77-87 perform backup and write as separate operations:

```typescript
// Line 79-86 in src/lib/persistence.ts
if (existsSync(brainPath)) {
  const bakPath = brainPath + ".bak";
  try {
    await copyFile(brainPath, bakPath);
  } catch {
    // Non-fatal — proceed with save even if backup fails
  }
}
await writeFile(brainPath, JSON.stringify(state, null, 2));
```

**Impact:**
- If write fails after successful backup → stale backup, current state lost
- If write fails after partial write → corrupted state, backup also stale
- Power failure between operations → inconsistent state

**Fix approach:** Use atomic write pattern:
1. Write to `brain.json.tmp`
2. Sync/flush to disk
3. Rename `brain.json.tmp` → `brain.json` (atomic on POSIX)

---

### 5. Dual State Files — Sync Failure Risk

**Severity:** MEDIUM

**Issue:** State is split across two files that can desync:
- `brain.json` — Flat hierarchy (trajectory/tactic/action strings)
- `hierarchy.json` — Tree structure

**Files:**
- `src/lib/persistence.ts` manages brain.json
- `src/lib/hierarchy-tree.ts` manages hierarchy.json

**Impact:**
- Tools update both files separately (e.g., `declare-intent.ts` lines 109, 119)
- If one write succeeds and other fails → inconsistent state
- Gap between saves causes drift detection to fail

**Fix approach:**
- Atomic multi-file transactions (all-or-nothing)
- Or consolidate to single source of truth (hierarchy.json with brain projection embedded)

---

### 6. Backup Without Restore Mechanism

**Severity:** LOW

**Issue:** `.bak` files are created (`src/lib/persistence.ts` line 80-86) but never used for recovery.

**Impact:**
- No way to recover from corrupted state
- Backup files accumulate without purpose
- No cleanup of old backups

**Fix approach:** Add `stateManager.restoreFromBackup()` method and automatic restore on detect corruption.

---

## Data Loss Scenarios

### Scenario 1: Rapid Tool Execution
```
T1: tool-A loads state (turn_count=5)
T2: soft-governance saves (turn_count=6)  
T3: tool-A modifies state (adds hierarchy)
T4: soft-governance saves (overwrites tool-A changes)
Result: tool-A's hierarchy changes lost
```

### Scenario 2: Write Failure Mid-Save
```
1. copyFile brain.json → brain.json.bak (success)
2. writeFile starts...
3. Disk full / power failure / process killed
Result: bak has old state, brain.json corrupted or empty
```

### Scenario 3: JSON Corruption
```
1. User manually edits brain.json with invalid JSON
2. load() catches error, returns null
3. Session starts fresh with no history
Result: Silent data loss, no warning to user
```

---

## Missing Critical Features

### 1. State Migration Testing
**Problem:** Migration code (`src/lib/persistence.ts` lines 31-68) runs on every load but isn't tested for all version paths.

### 2. Integrity Checksums
**Problem:** No way to detect if brain.json was partially written.

### 3. State Version Rollback
**Problem:** No mechanism to downgrade state if new format causes issues.

---

## Test Coverage Gaps

**Untested area:** Concurrent state modifications
- `tests/integration.test.ts` tests sequential flows
- No concurrent tool execution tests
- No race condition detection tests

**Untested area:** Corrupted state recovery
- Tests assume valid state files
- No invalid JSON tests
- No partial write tests

---

## Architectural Smells

### 7. Console.error in Library Code (Architecture Violation)

**Severity:** HIGH

**Issue:** `src/hooks/sdk-context.ts` line 94 contains `console.error` inside the `withClient` function, violating the documented architecture rule that only `cli.ts` should contain console output.

**Code reference:**
```typescript
// Line 93-95 in src/hooks/sdk-context.ts
} catch (err: unknown) {
  // Temporary error logging for Phase 1
  console.error("SDK client error:", err);
  return fallback ?? undefined;
}
```

**Impact:** 
- Logs appear in production environments where file-based logging is expected
- Inconsistent output handling
- Violates explicit architecture contract

**Fix approach:** Use the injected Logger pattern or return errors via proper return values instead of console.error.

---

### 8. Self-Reference in package.json Dependencies

**Severity:** MEDIUM

**Issue:** `package.json` line 64 has a self-reference in dependencies:

```json
"dependencies": {
  "@clack/prompts": "^1.0.0",
  "hivemind-context-governance": "^2.6.0",
  "yaml": "^2.3.4"
}
```

**Files:** `package.json:64`

**Impact:** Unusual pattern that could cause circular dependency issues or build problems in some environments.

**Fix approach:** Remove the self-reference - it's unclear why it's present and appears unnecessary.

---

### 9. Large Monolithic Files — Maintainability Issues

**Severity:** MEDIUM

**Issue:** Multiple files exceed reasonable single-file complexity:

| File | Lines | Sections |
|------|-------|----------|
| `src/lib/detection.ts` | 891 | 5 distinct concerns |
| `src/lib/hierarchy-tree.ts` | 809 | 9 distinct concerns |
| `src/hooks/session-lifecycle.ts` | 769 | System prompt + warnings |
| `src/lib/planning-fs.ts` | 682 | Multiple I/O operations |

**Impact:**
- High cognitive load for maintainers
- Difficult to test individual components
- Navigation becomes cumbersome
- Risk of introducing bugs when modifying unrelated sections

**Fix approach:** 
- detection.ts: Split into `detection/types.ts`, `detection/classifier.ts`, `detection/counters.ts`, `detection/keywords.ts`, `detection/compiler.ts`
- hierarchy-tree.ts: Split into `hierarchy-tree/types.ts`, `hierarchy-tree/stamps.ts`, `hierarchy-tree/crud.ts`, `hierarchy-tree/io.ts`
- session-lifecycle.ts: Extract warning compilation into separate strategy modules

---

### 10. In-Memory Toast Cooldown Not Persistent

**Severity:** LOW

**Issue:** The toast cooldown system in `src/hooks/soft-governance.ts` lines 50-51 uses an in-memory Map:

```typescript
const TOAST_COOLDOWN_MS = 30_000
const lastToastAt = new Map<string, number>()
```

**Files:** `src/hooks/soft-governance.ts:50-51`

**Impact:** Users may see repeated toasts after:
- Plugin restart/reload
- Session recovery after crash
- Hot module replacement during development

**Fix approach:** Persist last toast timestamps to brain.json or config, or use a simpler time-based throttle at the prompt level.

---

### 11. Migration Logic Encapsulated in load() Function

**Severity:** MEDIUM

**Issue:** Migration logic for brain.json schema versions is embedded in `StateManager.load()` (`src/lib/persistence.ts` lines 31-68). This creates a large function with many conditional migrations that is:
- Hard to test individual migrations
- Easy to miss migrations when adding new fields
- Difficult to rollback specific version migrations

**Code reference:** `src/lib/persistence.ts:24-72`

**Impact:**
- Each new field requires editing the load function
- No clear version tracking for applied migrations
- Testing requires creating state for each version

**Fix approach:** 
- Implement migration registry pattern
- Each migration is a separate function with version tags
- Apply migrations in order based on version field

---

## Performance Concerns

### 12. Full State Save on Every Tool Execution

**Severity:** MEDIUM

**Issue:** Both `tool-gate.ts` and `soft-governance.ts` save the entire brain.json state after every execution:

- `src/hooks/tool-gate.ts:246` — saves on drift/complexity updates
- `src/hooks/soft-governance.ts:412` — saves on EVERY tool call

**Impact:** 
- For sessions with large history (many files_touched, ratings array), serialization becomes expensive
- Disk I/O on every tool call slows down responsiveness
- Contributes to race condition risk (concern #1)

**Improvement path:** 
- Implement delta updates
- Use database instead of JSON file for large state
- Batch updates with debouncing

---

### 13. Config Re-read on Every Hook Invocation

**Severity:** LOW

**Issue:** Per "Rule 6" documented in code, config is re-read from disk on every hook invocation:

- `src/hooks/tool-gate.ts:112-113`
- `src/hooks/soft-governance.ts:155`

```typescript
// Rule 6: Re-read config from disk each invocation
const config = await loadConfig(directory)
```

**Impact:** 
- Ensures correctness (never stale config)
- But adds disk I/O overhead on every tool call
- Could be exploited with rapid calls (DoS vector)

**Improvement path:** Cache config with short TTL (e.g., 1 second) rather than reading every call.

---

## Scalability Concerns

### 14. File-Based State Storage Limits

**Severity:** LOW

**Issue:** State is stored in JSON file (`brain.json`) with unbounded growth:

- `files_touched` array grows without limit
- `ratings` array grows without limit  
- `cycle_log` capped at 10 but other arrays unbounded

**Current capacity:** 
- Single JSON file per project
- JSON parsing slows around 10MB+
- File size grows linearly with session duration

**Scaling path:**
- Implement session archival to separate files
- Consider SQLite for larger deployments
- Add state size warnings
- Sliding window for metric arrays

---

### 15. No Rollback Mechanism for Tool Operations

**Severity:** MEDIUM

**Issue:** If a tool operation fails mid-execution after state has been modified, there's no rollback:

```typescript
// In declare-intent.ts
await stateManager.save(state)           // line 119 - saved
await saveTree(directory, tree)          // line 109 - tree saved
await writeFile(sessionFile, content)    // line 135 - file written
```

**Impact:** 
- Failed operations leave state in inconsistent intermediate state
- No transactional guarantees
- Cannot reliably retry failed operations

**Blocks:** Reliable tool chains, atomic operations, safe retries.

---

## Testing Gaps

### 16. No Concurrent Hook Execution Tests

**What's not tested:**
- `tests/integration.test.ts` tests sequential flows only
- No concurrent tool execution simulation
- No race condition detection tests

**Risk:** Race conditions (concern #1) may go undetected until production.

---

### 17. No Corrupted State Recovery Tests

**What's not tested:**
- Invalid JSON handling
- Partial write detection
- Permission error handling

**Risk:** Unhandled exceptions could crash plugin in edge cases.

---

## Dependencies

### 18. Peer Dependencies on Ink/React (Optional Dashboard)

**Severity:** LOW

**Issue:** Dashboard requires ink and react as peer dependencies, but they're optional. Error handling in `src/cli.ts` lines 240-266 has fallbacks but could be clearer.

**Current handling:** Try-catch with module-not-found detection and helpful error message.

**Recommendation:** Document dashboard requirements more prominently in README.

---

*Concerns audit: 2026-02-13*
