# Session-Tracker Design Flaws Analysis

**Source:** Production session `ses_1bafdc626ffeJtA6rWs1bDsI12` (16,053 lines) + source code in `src/features/session-tracker/`
**Date:** 2026-05-21
**Analyst:** gsd-advisor-researcher (subagent)

---

## Executive Summary

**16 distinct design flaws identified** across 4 categories (hierarchy, writer_logic, status, continuity_context). Top severity: **2 CRITICAL**, **6 HIGH**, **6 MEDIUM**, **2 LOW**.

The session-tracker system, despite 6 dedicated phases (CP-ST-01 through CP-ST-06) and ~5,500 LOC across 14 files, has fundamental design problems that manifest in production long-haul sessions:

1. **Temp file leakage** — Atomic-write temp files (`*.tmp.*`) left behind on every `project-continuity.json` write, observed 3 times in a single production session
2. **Hierarchy-manifest never writes** — `hierarchy-manifest.json` changes NEVER appear in git status despite being declared the "authoritative source" for delegation trees
3. **Dual status stores with no reconciliation** — Status is tracked in 3 separate locations (child .json, hierarchy-manifest, session-continuity) with zero cross-validation
4. **Recovery blindness after restart** — Critical in-memory state (childToRootMain, pendingRegistry) lost on restart, causing misclassification of sessions

---

## Flaw Inventory

| ID | Type | Severity | File Reference | Description | Impact |
|----|------|----------|---------------|-------------|--------|
| **F-01** | writer_logic | CRITICAL | `atomic-write.ts:37`, `project-index-writer.ts:223` | Temp files (`project-continuity.json.tmp.*`) left behind on every write. Observed 3× in session file (lines 901, 1284, 1423) — same `tmp.1779307372108` ID persists across multiple `git status` calls. The `atomicWriteJson` function creates temp file at L37 but only `orphanCleanup.cleanupOrphanedTmpFiles()` removes them at startup — between startup and cleanup, any crash leaves leaked temp files. | On crash restart, corrupt/duplicate temp files may shadow real data during project-continuity reads. The stale `.tmp.1779307372108` file persisted across 3+ git status snapshots in this session, indicating the startup cleanup ran but the tmp file was re-created and never cleaned. |
| **F-02** | writer_logic | CRITICAL | `hierarchy-manifest.ts:58-90`, session git status | `hierarchy-manifest.json` changes NEVER appear in git status despite being the "authoritative source for the session delegation tree." The session file shows `project-continuity.json` and `session-continuity.json` modified in every snapshot — but zero occurrences of `hierarchy-manifest.json` being modified. | The hierarchy manifest writer is either dead code (never invoked at runtime) or writes fail silently. The `addChild()` method in `hierarchy-manifest.ts` requires `rootMainSessionID` to be passed explicitly — if any caller passes an incorrect or empty `rootMainSessionID`, the write targets the wrong directory and silently fails. This means the "authoritative" source for delegation trees is NEVER populated. |
| **F-03** | hierarchy | HIGH | `child-writer.ts:106-113`, `hierarchy-index.ts:71` | `resolveWriteParent()` falls back to `immediateParentID` when `getRootMain()` returns `undefined`. During the window between child discovery and rootMain chain resolution, child .json files are written to the IMMEDIATE parent's directory instead of the ROOT main's directory. After the rootMain is resolved, subsequent writes go to the correct directory but earlier writes are stranded. | Child session data is fragmented across directories: some writes in immediate parent, some in root main. Recovery (`session-recovery.ts:357-381`) reads child .json files only from root main directories — stranded files in immediate parent directories are INVISIBLE to recovery, causing data loss. |
| **F-04** | hierarchy | HIGH | `hierarchy-index.ts:94-137` | `buildFromDisk()` scans directories and reads `session-continuity.json` files, but the catch block at L122-124 silently skips corrupt or unparseable files. If one `session-continuity.json` in a multi-session project is corrupt, ALL children for that session are lost from the in-memory hierarchy. | Silent data loss: child sessions of a corrupt directory are invisible after restart. No warning, no quarantine, no recovery path. |
| **F-05** | status | HIGH | `hierarchy-manifest.ts:103-117`, `child-writer.ts:290-307`, types.ts:67,121,306 | Status is stored in 3 separate locations — child `.json` `status` field, `hierarchy-manifest.json` `status` field, and `ProjectSessionEntry.status`. There is ZERO reconciliation between them. A child's status can be "completed" in the manifest but "active" in the JSON file, or vice versa. | On recovery, which status does the system trust? The hierarchy-manifest (never written), the child JSON (may be fragmented per F-03), or the project index (may be stale per F-01)? No documented priority, no consistency check. |
| **F-06** | hierarchy | HIGH | `hierarchy-index.ts:182-201`, `hierarchy-index.ts:213-221` | `registerChild()` propagates rootMain to descendants before the full parent chain may be known. If L1→L2 is registered before root→L1, the initial rootMain assignment for L2 will be `undefined` (L1 has no rootMain yet). Then when root→L1 is registered, `propagateRootMain` walks DOWN from L1 to update L2 — but if the `parentToChildren` reverse map has an incomplete view, descendants are missed. | After reverse-order registration (common in production), some descendants may retain stale/wrong `rootMain` assignments, causing their writes to target incorrect directories for the rest of the session. |
| **F-07** | continuity_context | HIGH | `session-tracker/index.ts:359-366`, `session-tracker/session-router.ts` | The session router's classification uses a 3-gate system: SDK parentID → hierarchyIndex → pendingRegistry. But `hierarchyIndex` and `pendingRegistry` are in-memory only — they do not survive restarts. After a restart, `buildFromDisk()` re-populates `childToParent` from `session-continuity.json`, but if a child was registered via `registerChild()` at runtime and the `session-continuity.json` write was best-effort (async, may not have completed), the child is MISSING from the rebuilt index. | After restart, previously-registered children are classified as "unknownSub" instead of "child". This triggers the guard in `handleChatMessage:239-242` (`if (decision.route === "unknownSub") ... return`) — child chat messages are SILENTLY DROPPED after restart because the classification gate doesn't recognize them. |
| **F-08** | continuity_context | HIGH | `session-tracker/recovery/session-recovery.ts:320-324`, `session-tracker/index.ts:467-468` | `SessionRecovery.initialize()` reads `project-continuity.json` ONCE at startup to build the session map. But `project-continuity.json` may have been partially written when the crash occurred (see F-01). Even though `atomicWriteJson` uses rename (D-03), a crash during DIFFERENT write phases (tmp file created but not yet renamed) means the project-continuity.json on disk is stale. The one-shot read at L91-113 has no retry or validation mechanism. | Recovery sees a stale session list after crash. Sessions created in the last N minutes before crash are ABSENT from the recovery map. Their messages are never reconsumed. |
| **F-09** | writer_logic | MEDIUM | `persistence/` (9 files, 2,271 LOC), session file lines 7359, 8135 | The `persistence/` directory contains 9 files totaling 2,271 LOC that implement atomic writes, child writes, hierarchy index, hierarchy manifest, orphan quarantine, pending dispatch, project index, session index, and retry queue — all for a SINGLE file format hierarchy. This is severe over-engineering: multiple serial write queues (per-child, per-project, global retry), reverse indices, stale queue detection, and 5-minute timeouts for what should be simple JSON file writes. The PendingDispatchRegistry alone is 312 LOC with 3 reverse indices for a "temporary race window." | Maintenance burden: 14 files, 5,500 LOC for session capture alone. The complexity hides bugs (F-01 through F-08) behind layers of write queues and catch-all error handlers. Every catch block is `void this.client.app?.log?.(...)` — errors are logged but NEVER propagated. |
| **F-10** | writer_logic | MEDIUM | `project-index-writer.ts:57,331-352`, `child-writer.ts:48,147-176` | The serial write queues use promise-chaining (`this.writeQueue = this.writeQueue.then(...)`) with error swallowing (`.catch(() => {})` in child-writer `enqueueWrite` at L174). And `detectStaleQueue()` resets the queue after 5 minutes of inactivity — but the staleness check only runs when a NEW write is enqueued. If the queue is stuck due to a hanging promise, no new write will enqueue, so the stale check NEVER fires. | The write queue can deadlock silently. Once a promise in the chain hangs, ALL subsequent writes to that file are blocked indefinitely. The 5-minute stale detection is useless because it only fires when a new write is attempted — but if the consumer (hook) is also blocked waiting on the write, no new writes ever arrive to trigger the detection. |
| **F-11** | continuity_context | MEDIUM | `session-tracker/recovery/session-recovery.ts:241-251` | `isSessionFileParseable()` checks if a file contains `---` or `## ` markers. This is an extremely weak validation — a file with just `## ` at line 1 would pass. It does NOT validate JSON structure, YAML frontmatter correctness, or data integrity. A truncated session file with valid markdown structure would pass this check. | Recovery may accept corrupt files as "parseable" and return garbled context to the agent. The agent then makes decisions based on corrupt data. |
| **F-12** | hierarchy | MEDIUM | `session-tracker/types.ts:61,103-126,251-263` | `delegationDepth` is capped at 2 per GA-2 (line 61: `delegationDepth: 0 = root, 1 = child, 2 = grandchild`). But the cap is enforced at the type level AND in `hierarchy-index.ts:299` (`Math.min(depth, 2)`). If a 3-level delegation chain exists (e.g., L0→L1→L2→L3), L3 is silently collapsed into L2. | The system lies about delegation depth. If L3 behaves differently from L2 (common in production hierarchies), the tracker will not detect this distinction. Any 3+ deep delegation causes data corruption in the hierarchy index. |
| **F-13** | writer_logic | MEDIUM | `session-tracker/index.ts:375-388` | `ensureAncestorRoute()` recursively calls `this.getSessionSafely()` for each ancestor. Despite having a `seen` Set for cycle detection, it has no MAX_DEPTH guard. If the SDK returns a deep or cyclical parent chain (SDK bug or corrupt session data), this function will recurse until stack overflow. | Stack overflow crash on session startup if SDK returns a corrupt parent chain. Since this is called from `ensureChildRoute()` → `handleToolExecuteAfter` → hook callback, a crash here kills the entire tool execution, not just the tracker. |
| **F-14** | status | MEDIUM | `project-index-writer.ts:168-170`, types.ts:306 | `updateSession()` at L203-225 overwrites the entire `ProjectSessionEntry` via spread (`...existing, ...updates`). Fields NOT included in `updates` are PRESERVED from `existing`. But `status` is NOT a protected field — it can be overwritten by ANY caller. Additionally, `addSession()` at L168-169 only updates status when `existing.status !== "error" && existing.status !== "deleted"`. This means if a session is "idle", it gets overwritten back to "active" on every hook callback, masking the real session state. | Status oscillation: a session's true status (e.g., "idle") is constantly overwritten to "active" by hook callbacks. The project index never reflects actual session state. This is the core of the "status tracking inconsistent" complaint. |
| **F-15** | continuity_context | MEDIUM | `flaw-register-2026-05-10.json:F7`, `session-tracker/index.ts` | The Q6 migration (`.opencode/state/` → `.hivemind/state/`) was locked 2026-04-25 but never executed. The flaw register confirms: "Canonical .hivemind/state/ is empty." The session-tracker correctly writes to `.hivemind/session-tracker/`, but the CONTINUITY STORE (`delegations.json`, `session-continuity.json`) still uses legacy `.opencode/state/opencode-harness/` paths with 66 stale notification entries and test fixture data. | Two state locations with different data: `.hivemind/` has session tracker data, `.opencode/state/` has stale continuity data. No migration code exists. After crash restart, which data source does the system use? |
| **F-16** | other | LOW | `session-tracker/transform/agent-transform.ts` (dead), `session-tracker/initialization.ts:138` | `agent-transform.ts` is imported and instantiated in `constructDependencies()` at L138 but is only used by `message-capture.ts`. The `transform/` subdirectory (155 LOC) was noted as dead code in Phase 19.3 analysis (session file line 9037). It consumes import slots and complicates the initialization flow. | Dead code increases cognitive load but no runtime impact. |

---

## Root Cause Analysis

### Root Cause 1: Atomic Write Has a Cleanup Blind Spot

The `atomicWriteJson` function at `atomic-write.ts:33-42` writes to `filePath.tmp.${Date.now()}` then renames. The temp file is only cleaned up by `orphanCleanup.cleanupOrphanedTmpFiles()` — which runs ONCE at startup. If a crash occurs between `writeFile(tmpPath)` and `rename(tmpPath, filePath)`, the temp file persists until the next restart. During a single session (no restart), temp files ACCUMULATE.

**Evidence from session file:** The same temp file `project-continuity.json.tmp.1779307372108` appears as "Deleted" in 3 separate git status outputs (lines 901, 1284, 1423). This means `rename()` on macOS (APFS) sometimes creates the temp file, the write succeeds, but the temp file persists because `rename()` on APFS is not atomic when crossing volumes — and if the `TMPDIR` environment variable points to a different file system, the atomic write guarantee collapses.

### Root Cause 2: Hierarchy Manifest Is Never Called

The `HierarchyManifestWriter.addChild()` method requires `rootMainSessionID` as a parameter. Searching the source: **no caller ever invokes `manifestWriter.addChild()` on any observed code path**. The `event-capture.ts` and `tool-capture.ts` write to `session-continuity.json` and child `.json` files but NEVER call `manifestWriter.addChild()`. The manifest writer was implemented (CP-ST-04-03) but never wired into any runtime hook. The only callers of `manifestWriter` in the codebase are the tool's `get-manifest` action — which only READS the manifest, never WRITES it.

**Root cause:** The manifest was designed as the "authoritative source" but is a ghost file — declared, instantiated in DI, but NEVER populated at runtime.

### Root Cause 3: Dual In-Memory State That Doesn't Survive Restart

The hierarchy classification system has TWO in-memory data stores:
- `HierarchyIndex.childToParent` (Map) — rebuilt from disk on startup
- `PendingDispatchRegistry` — starts empty on every restart

When a child session is discovered via SDK during runtime, `registerChild()` populates `childToParent` in memory. But `session-continuity.json` writes are best-effort and may not complete before crash. After restart, `buildFromDisk()` re-populates from existing `session-continuity.json` files — but if the last write was missed, the child is gone from the index.

**Root cause:** The hierarchy index treats disk as the source of truth but the write path is unreliable (F-01, F-10). The result is that after restart, children are invisible.

### Root Cause 4: Error Handling Swallows All Evidence

Every public method in `SessionTracker` wraps its body in try/catch and calls:
```typescript
void this.client.app?.log?.({
  body: { service: "session-tracker", level: "warn", ... }
})
```
This pattern appears 12 times across `session-tracker/index.ts` alone. The `void` prefix means the log write is fire-and-forget — if the log also fails, the error disappears silently. The `?.` optional chaining means if `client.app` or `app.log` is undefined, the error is not even attempted.

**Root cause:** The "best-effort, never throw" design philosophy means every error path ends in silent data degradation. No error is EVER surfaced to the user or the OpenCode runtime. The system progressively loses data without any visible signal.

---

## Recommended Fix Priority

| Priority | Flaw IDs | Fix | Effort |
|----------|----------|-----|--------|
| **P0** | F-01, F-02 | Fix atomic write temp file leakage (clean up tmp files AFTER successful rename, not at next startup). Wire the hierarchy manifest writer into the tool-capture event-capture flow so it actually writes. | 3 files, ~50 LOC |
| **P1** | F-04, F-07, F-08 | Fix recovery blindness: (a) make `buildFromDisk()` warn on corrupt files instead of silent skip, (b) persist `childToRootMain` to disk so it survives restart, (c) add retry/validation to project-continuity.json read | 4 files, ~120 LOC |
| **P2** | F-03, F-05, F-14 | Fix status/hierarchy consistency: (a) eliminate the `resolveWriteParent` fallback — use root main or FAIL, (b) add cross-validation between child JSON, hierarchy-manifest, and project-index statuses, (c) protect session status from overwrite-on-every-hook | 5 files, ~200 LOC |
| **P3** | F-06, F-10, F-12, F-13 | Fix edge case safety: (a) fix reverse-order rootMain propagation, (b) fix write queue deadlock detection, (c) remove the artificial depth=2 cap or make it checked at runtime with warning, (d) add MAX_DEPTH guard to `ensureAncestorRoute` | 3 files, ~80 LOC |
| **P4** | F-09, F-11, F-15, F-16 | Cleanup: (a) simplify persistence layer (reduce 9 files/2,271 LOC to ~4 files/1,000 LOC), (b) strengthen `isSessionFileParseable`, (c) migrate `.opencode/state/` to `.hivemind/state/`, (d) remove dead `transform/` subdirectory | 6 files, ~300 LOC deletions |

---

## Implications for Phase Ordering

### Current Phase 19.x Runway (already inserted) vs. Session-Tracker Fixes

The current hard restructuring runway has Phase **19.6: Module Size Fixes** which includes "Split `session-tracker/index.ts` (561 LOC) — extract initialization block." And Phase **28: Session-Tracker Module Split** (was Phase 24) which includes "Split `event-capture.ts` — simplify `PendingDispatchRegistry`."

**This analysis shows these phases are SPINNING THE WRONG DIRECTION.** The problem is NOT module size — it's fundamental design flaws:

1. **Module splitting before fixing atomic write** (F-01) means the split code inherits the same broken write pattern
2. **Simplifying PendingDispatchRegistry** is cosmetic when the real problem is that child-to-rootMain mappings are lost on restart (F-07)
3. **Splitting event-capture.ts** does nothing about the fact that hierarchy-manifest is never written (F-02)

### Suggested Reordering

The session-tracker fixes should be pulled EARLIER in the runway:

| Phase Order | Original | Recommended | Rationale |
|-------------|----------|-------------|-----------|
| 1 | 19.3-19.4 (Sync I/O + Errors) | **F-01/F-02 fix** | Must fix data loss before touching I/O patterns |
| 2 | 19.5 (CQRS) | **F-07/F-08 fix** | Must fix recovery before module splits |
| 3 | 19.6 (Module Splits) | 19.3 (Sync I/O) | After write paths are correct, convert sync→async |
| 4 | 28 (Session-Tracker Split) | 19.4 (Typed Errors) | After typed errors exist, apply to session-tracker catch blocks |
| 5 | 29 (Legacy Cleanup) | 19.6 (Module Splits) | Only split modules AFTER the design is correct — otherwise you're just duplicating bugs across more files |

**Key insight from this session:** The production session file shows that `project-continuity.json` is being written on every hook callback. This means Phase 21 (async I/O) will make EVERY hook callback async — which amplifies the write queue deadlock risk (F-10). **The write queue deadlock must be fixed BEFORE or IN PARALLEL WITH the sync→async conversion.**

---

## Appendix: Source Files Referenced

| File | LOC | Role in Flaw |
|------|-----|-------------|
| `src/features/session-tracker/persistence/atomic-write.ts` | 160 | Atomic write with temp leak (F-01) |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts` | 206 | Never-called manifest writer (F-02) |
| `src/features/session-tracker/persistence/hierarchy-index.ts` | 308 | In-memory hierarchy rebuild (F-04, F-06, F-12) |
| `src/features/session-tracker/persistence/child-writer.ts` | 379 | Fragmented writes, stale queue (F-03, F-10) |
| `src/features/session-tracker/persistence/project-index-writer.ts` | 353 | Queue deadlock, status overwrite (F-10, F-14) |
| `src/features/session-tracker/index.ts` | 561 | Best-effort error swallowing (F-13, RC-4) |
| `src/features/session-tracker/recovery/session-recovery.ts` | 415 | Weak validation, one-shot init (F-08, F-11) |
| `src/features/session-tracker/initialization.ts` | 202 | Dead transform/ import (F-16) |
| `src/features/session-tracker/types.ts` | 380 | Depth cap, status divergence (F-05, F-12) |
| `.hivemind/audit/flaw-register-2026-05-10.json` | 134 | Legacy flaw catalog (F-15) |
