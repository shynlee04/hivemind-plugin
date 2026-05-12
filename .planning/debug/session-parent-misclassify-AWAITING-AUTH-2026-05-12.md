# Debug Session: session-parent-misclassify — AWAITING AUTHORIZATION

**Status:** investigating | **Created:** 2026-05-12T16:30:00Z | **Updated:** 2026-05-12T18:15:00Z

## 5 Bugs Identified (Deep Analysis — 13 Source Files)

### Bug 1: Session Parent Misclassification
**Root cause hypothesis:** Race condition — child session events (`session.created`, `chat.message`) arrive asynchronously BEFORE `handleTask()` populates `hierarchyIndex`. When `ensureSessionReady()` runs first, the index is empty → orphan directory created. HierarchyIndex is in-memory only — no disk persistence, so restarts also lose state.

**Files:** `hierarchy-index.ts`, `index.ts:163`, `tool-capture.ts:294`

**User's specification:** Main session = turnCount == 1. ALL task-tool sessions = children. 3-level hierarchy (L0→L1→L2). L1/L2 never make top-level entries.

**⚠ User says: wrong logic — needs further investigation.**

### Bug 2: Missing Assistant Messages
**Root cause hypothesis:** Child session `chat.message` routing in `index.ts:387-391` uses message role string as content instead of extracted text.

**Files:** `index.ts:386-398`

**⚠ User says: wrong logic — needs further investigation.**

### Bug 3: Inaccurate Counters
**Root cause hypothesis:** Child turn hardcoded to 0. `incrementTurnCount` only from user messages, not tool executions.

**Files:** `tool-capture.ts:274`, `index.ts:391`, `message-capture.ts:184`

**⚠ User says: wrong logic — needs further investigation.**

### Bug 4: L1/L2 Depth Flattening
**Root cause hypothesis:** `depth = 1` hardcoded for ALL children.

**Files:** `tool-capture.ts:235`

**⚠ User says: wrong logic — needs further investigation.**

### Bug 5: Session Resume Detection Broken
**Root cause hypothesis:** No turnCount-based classification in `ensureSessionReady()`.

**Files:** `index.ts:130-205` (missing logic)

**⚠ User says: wrong logic — needs further investigation.**

---

## Live Evidence

- `ses_1e3be93f0ffeVu9H8JWzT26X18` — turnCount:0, only tool calls, orphan dir, NOT in project-continuity.json
- `ses_1e458e33dffeCL42qMdkKiON7n` — has child .json under parent BUT also own dir
- 3 additional orphan dirs exist alongside 2 legitimate main sessions

## Files That Need Deep Re-Investigation

- `src/features/session-tracker/index.ts` (655+ lines, core SessionTracker)
- `src/features/session-tracker/capture/event-capture.ts`
- `src/features/session-tracker/capture/tool-capture.ts`
- `src/features/session-tracker/capture/message-capture.ts`
- `src/features/session-tracker/persistence/*` (all writers)
- `src/plugin.ts` (event observer wiring)
- `src/shared/session-api.ts` (OpenCode SDK wrapper)

## Awaiting
- User authorization to proceed
- User may correct logic before re-delegating

---

*To resume: `/gsd-debug continue session-parent-misclassify`*
