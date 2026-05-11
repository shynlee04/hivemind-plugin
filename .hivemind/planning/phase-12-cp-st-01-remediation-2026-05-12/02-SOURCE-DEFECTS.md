# Phase 12: CP-ST-01 Remediation — Source Defects Catalog (Writer Engine)

**Date:** 2026-05-12
**Scope:** `src/features/session-tracker/` capture + persistence + transform layers
**Classification: Group A — Writer Engine Defects**

Each finding includes: file:line, mechanism, reproduction evidence, review finding cross-reference, and suggested fix direction.

---

## DEFECT-01: Project Index Update `childCount: undefined` Corrupts Entry

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts:251-253` |
| **Mechanism** | `handleTask()` calls `this.projectIndexWriter.updateSession(input.sessionID, { childCount: undefined })` |
| **Chain** | `project-index-writer.ts:166-172` — `updateSession` spreads `...updates` over existing entry. JavaScript `{ childCount: undefined }` spread **overwrites** the key with `undefined` → field effectively deleted from JSON |
| **Evidence** | 13 sessions in `project-continuity.json` are missing the `childCount` field entirely (L1) |
| **Review ref** | WR-01 — confirmed unresolved |
| **Severity** | 🔴 CRITICAL |

**Fix direction:** Either omit `childCount` from the update call, or read current count and increment.

---

## DEFECT-02: Project Index `lastUpdated` Never Advances — Serial Queue Stuck

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/project-index-writer.ts:89-91` (writeQueue) |
| **Mechanism** | The `writeQueue` Promise chain serializes index writes. If one promise in the chain never resolves (unhandled rejection, infinite await), all subsequent writes are blocked. `project-continuity.json` shows `lastUpdated: "2026-05-11T17:04:29.708Z"` — 7+ hours stale as of May 12 00:04. |
| **Evidence** | `project-continuity.json` has 83 entries all added before 17:04 but no entries added since, despite ~57 more session directories created after 17:04 (L1) |
| **Review ref** | Not in review (systemic issue discovered during disk audit) |
| **Severity** | 🔴 CRITICAL |

**Fix direction:** Add timeout/failure recovery to the write queue. Log stuck queue state. Consider per-entry locking instead of global serial queue.

---

## DEFECT-03: Child Session Records Are Write-Once, Never Updated

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts:236-240` |
| **Mechanism** | `handleTask()` calls `childWriter.createChildFile()` once at task spawn time. Never calls `childWriter.updateChildStatus()` or `childWriter.appendChildTurn()` afterward. Child session lifecycle events (created, idle, deleted) are routed to `event-capture.ts` which only handles main sessions (routes events to .md, not .json). |
| **Evidence** | All child .json files have `turns: []`, `status: "active"`, `mainAgent.model: "unknown"`, `created == updated` (L1) |
| **Review ref** | Not in review (systemic gap) |
| **Severity** | 🔴 CRITICAL |

**Fix direction:** Child session events need a separate handler path. When `event-capture` detects a child session (via `parentID !== null`), it should route to `childWriter.updateChildStatus()` and `childWriter.appendChildTurn()` instead of (or in addition to) the main session writer.

---

## DEFECT-04: `handleRead` Captures File Content via Heuristic Error Detection

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts:176-187` |
| **Mechanism** | `outputStr` is checked for substrings `"error"` or `"not found"`. If found, the **entire output string** (which IS the file content) is written as the error parameter to `appendToolBlock`. Any file containing those words triggers full content capture. |
| **Evidence** | Code analysis (L4) — direct violation of REQ-ST-05 |
| **Review ref** | CR-03 — confirmed unresolved |
| **Severity** | 🔴 CRITICAL |

**Fix direction:** Check output metadata for error status (e.g., `output.metadata?.error !== undefined`) instead of substring-matching file content. Never pass file content to error parameter.

---

## DEFECT-05: `session-index-writer.addChild` Conflates Child Count with Turn Count

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/session-index-writer.ts:137` |
| **Mechanism** | `addChild()` executes `index.turnCount++` when registering a child. A child session creation is not a conversation turn — this inflates `turnCount`. |
| **Evidence** | `ses_1e8826b7` has 2 actual user turns but `session-continuity.json` shows `turnCount: 8` (matches 8 children) (L1) |
| **Review ref** | WR-06 — confirmed unresolved |
| **Severity** | 🟡 HIGH |

**Fix direction:** Remove `index.turnCount++` from `addChild()`. Maintain separate `childCount` field. Only increment `turnCount` via `incrementTurnCount()`.

---

## DEFECT-06: `updateFrontmatter` Has Double-Read Race Condition

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/session-writer.ts:175-189` |
| **Mechanism** | `updateFrontmatter` reads the file (line 181), modifies frontmatter, then calls `atomicAppendMarkdown` (line 189) which **independently reads the file again** (atomic-write.ts:67). Between the two reads, another concurrent write can modify the file, causing lost frontmatter updates. |
| **Evidence** | Code analysis (L4) — race window exists between two file reads |
| **Review ref** | WR-02 — confirmed unresolved |
| **Severity** | 🟡 HIGH |

**Fix direction:** Either (a) use a per-session write queue to serialize all writes, or (b) extract `atomicWriteMarkdown(path, content)` that writes directly without re-reading, and use it in `updateFrontmatter`.

---

## DEFECT-07: `toolSummary` Never Populated in Session Continuity Index

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts` (all handlers) |
| **Mechanism** | `updateToolSummary(sessionID, toolName)` method exists on `SessionIndexWriter` but is never called from any capture handler. Every tool invocation should call `sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)`. |
| **Evidence** | All `session-continuity.json` files show `toolSummary: {}` (L1) |
| **Review ref** | Not in review |
| **Severity** | 🟡 HIGH |

**Fix direction:** Add `this.sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)` call in `handleSkill`, `handleRead`, `handleTask`, and `handleOther`.

---

## DEFECT-08: Child Session Events Lost (Architecture Gap)

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/event-capture.ts:105-127` |
| **Mechanism** | `handleSessionEvent` switch cases call `handleSessionIdle`, `handleSessionDeleted`, `handleSessionError` which ALL route to `sessionWriter.updateFrontmatter(sessionID, ...)`. For child sessions, no .md file exists — the record is a .json file under the parent. The write silently fails (file not found, caught by try/catch, logged as warning). |
| **Evidence** | All child .json files have `status: "active"` with zero updates (L1) |
| **Review ref** | Not in review |
| **Severity** | 🔴 CRITICAL |

**Fix direction:** `event-capture.ts` needs a routing layer: for main sessions → use `sessionWriter`; for child sessions → use `childWriter.updateChildStatus()`. Requires detecting child sessions (via `parentID` check) at the `handleSessionEvent` level, not just at `handleSessionCreated`.

---

## DEFECT-09: Lazy Bootstrap Gap — SessionEvent Handler Doesn't Bootstrap

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/index.ts:164-179, 120-149` |
| **Mechanism** | `ensureSessionReady()` (lazy bootstrap) is called from `handleChatMessage` (line 206) and `handleToolExecuteAfter` (line 241) but NOT from `handleSessionEvent` (line 164). If a `session.idle`, `session.deleted`, or `session.error` event fires BEFORE any chat or tool activity, the session directory hasn't been created yet and the event is silently dropped. |
| **Evidence** | Code analysis (L4) — missing bootstrap in event handler |
| **Review ref** | Not in review |
| **Severity** | 🟡 HIGH |

**Fix direction:** Add `await this.ensureSessionReady(event.sessionID)` as the first operation in `handleSessionEvent` (after checking initialization).

---

## DEFECT-10: Dynamic Import on Every `updateFrontmatter` Call

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/session-writer.ts:179` |
| **Mechanism** | `await import("node:fs/promises")` runs on every `updateFrontmatter` invocation. Unnecessary dynamic import overhead. |
| **Evidence** | Code analysis (L4) |
| **Review ref** | IN-01 — confirmed unresolved |
| **Severity** | 🔵 LOW |

**Fix direction:** Add static `import { readFile } from "node:fs/promises"` at top of file.

---

## DEFECT-11: `computeThinkingDuration` Returns Hardcoded "present"

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/transform/agent-transform.ts:117-118` |
| **Mechanism** | Method returns `"present"` instead of computing actual thinking duration from timing data. |
| **Evidence** | Code analysis (L4) |
| **Review ref** | Not in review |
| **Severity** | 🟢 MEDIUM |

**Fix direction:** Either remove this method and return `undefined` (honesty) or compute from actual timing data if available in hook metadata.

---

## DEFECT-12: `SessionTracker.cleanup()` Never Called

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/index.ts:324-334`, `src/plugin.ts` (no call site) |
| **Mechanism** | `cleanup()` method exists but is never invoked. `removeLegacyStateFiles()` inside it also never runs. |
| **Evidence** | 1.4MB of legacy event-tracker state persists (L1) |
| **Review ref** | WR-05 — confirmed unresolved |
| **Severity** | 🔴 CRITICAL |

**Fix direction:** In `plugin.ts`, chain `void sessionTracker.initialize().then(() => sessionTracker.cleanup())` or add a disable hook.

---

## DEFECT-13: Turn Counters Reset on Restart (No Seeding)

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/message-capture.ts:65` |
| **Mechanism** | `turnCounters` Map is in-memory only. On plugin restart, all counters reset to 0. Existing .md files with turns 1-N will get duplicate `## USER (turn 1)` appends. |
| **Evidence** | Code analysis (L4) |
| **Review ref** | WR-04 — confirmed unresolved |
| **Severity** | 🟡 HIGH |

**Fix direction:** During initialization, parse existing .md file to count `## USER (turn N)` headers and seed `turnCounters` map.

---

## DEFECT-14: Incomplete Non-`ses_` Session ID Handling

| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/types.ts:270` |
| **Mechanism** | `isValidSessionID` regex `/^ses_[a-zA-Z0-9]{6,}$/` rejects any session ID that doesn't start with `ses_` followed by 6+ alphanumeric chars. If OpenCode changes format, all capture silently skips. |
| **Evidence** | Code analysis (L4) |
| **Review ref** | WR-03 — confirmed unresolved |
| **Severity** | 🟡 HIGH |

**Fix direction:** Loosen validation to accept any non-empty string without path separators. Use `safeSessionPath` for path safety, not session ID format validation.

---

## Summary

| ID | File | Severity | Review Ref | Resolved? |
|----|------|----------|------------|-----------|
| DEFECT-01 | tool-capture.ts:251 | 🔴 CRITICAL | WR-01 | No |
| DEFECT-02 | project-index-writer.ts:89 | 🔴 CRITICAL | — | — |
| DEFECT-03 | tool-capture.ts:236 | 🔴 CRITICAL | — | — |
| DEFECT-04 | tool-capture.ts:176 | 🔴 CRITICAL | CR-03 | No |
| DEFECT-05 | session-index-writer.ts:137 | 🟡 HIGH | WR-06 | No |
| DEFECT-06 | session-writer.ts:175 | 🟡 HIGH | WR-02 | No |
| DEFECT-07 | tool-capture.ts (all) | 🟡 HIGH | — | — |
| DEFECT-08 | event-capture.ts:105 | 🔴 CRITICAL | — | — |
| DEFECT-09 | index.ts:164 | 🟡 HIGH | — | — |
| DEFECT-10 | session-writer.ts:179 | 🔵 LOW | IN-01 | No |
| DEFECT-11 | agent-transform.ts:117 | 🟢 MEDIUM | — | — |
| DEFECT-12 | index.ts:324 + plugin.ts | 🔴 CRITICAL | WR-05 | No |
| DEFECT-13 | message-capture.ts:65 | 🟡 HIGH | WR-04 | No |
| DEFECT-14 | types.ts:270 | 🟡 HIGH | WR-03 | No |

**14 source defects identified.** 6 critical, 6 high, 1 medium, 1 low. 0 review findings resolved.
