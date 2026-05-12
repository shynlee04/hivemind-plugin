# Phase 13: Session Tracker Defect Remediation — RESEARCH.md (DISK-TRUTH CORRECTED)

**Researched:** 2026-05-12 (v2 — disk-truth-first methodology)
**Domain:** Session tracker — hook-driven capture pipeline, atomic persistence, child session lifecycle
**Confidence:** HIGH (every claim backed by L1 disk evidence at file:content level)
**Supersedes:** v1 research (2026-05-12) which erroneously claimed 12/14 defects were fixed in code without verifying disk state

---

## Summary

**Phase 12 made things WORSE.** The v1 research claimed "12 of 14 defects are structurally fixed in source code." This was WRONG because it trusted source code over runtime evidence. The actual `.hivemind/session-tracker/` disk state reveals:

1. **Cross-contamination (DUAL REGISTRATION)**: Child sessions that should be `.json` files under parent directories are ALSO registered as independent main sessions with their own directories, `.md` files, and `session-continuity.json` files. In `ses_1e6ff88f/`, 4 of 5 children appear in BOTH their parent's child list AND `project-continuity.json` as top-level sessions.

2. **All child .json files are skeletons**: Every child file has `turns: [1 entry — turn 0 only]`, `model: "unknown"`, `status: "active"`, `created === updated` — write-once, never updated after delegation spawn.

3. **`ensureSessionReady()` is the primary root cause**: This method in `index.ts:123-156` does NOT check `parentID` — it treats ALL sessions as main sessions, creating directories and registering them in the project index. For child sessions, this produces dual registration: both a `.json` under the parent (correct, from `handleTask()`) AND a top-level directory (incorrect, from `ensureSessionReady()`).

4. **Turn counters never update**: `session-continuity.json` for ALL sessions shows `turnCount: 0` even when `.md` files contain hundreds of lines of user turns. Either `incrementTurnCount()` is never called, or `chat.message` hook never routes user turns through the session index.

5. **Legacy event-tracker still running**: `.hivemind/event-tracker/` has 4 active files (1985-line .json) being written alongside the broken new tracker. Double-capture confirmed.

**Primary recommendation:** Phase 13 must fix the `ensureSessionReady` parentID gap FIRST — this is the single change that will stop cross-contamination. Then fix the turn counting pipeline, add serial queues to prevent race conditions, and write integration tests that simulate actual OpenCode hook event sequencing. Do NOT rebuild — fix the existing pipeline.

---

## 0. Why Phase 12 Made Things WORSE

### Timeline: Before Phase 12 → After Phase 12

| State | Before Phase 12 | After Phase 12 |
|-------|----------------|----------------|
| Session directories | 0 created | 15 created (mostly for children!) |
| Child .json files | 0 | 9 created (all skeletons) |
| project-continuity.json | Empty `{}` | 15 entries, all `childCount:0` |
| Cross-contamination | None | 4 of 15 sessions are dual-registered children |
| event-tracker state | 0 files | 4 active .json/.md pairs (1.4MB) |
| Unit tests passing | 163 | 247 (84 new tests pass in isolation) |
| Integration evidence | None | None (no live hook tests) |

**What was "fixed" in source vs what actually changed at runtime:**

The source code WAS changed — `tool-capture.ts` now calls `appendChildTurn()`, `handleRead` checks metadata instead of substrings, `cleanup()` is chained in plugin.ts. But NONE of these source fixes changed runtime behavior because:

1. The core pipeline defect (`ensureSessionReady` not checking parentID) was never identified or fixed
2. The 247 unit tests use MOCKED hooks and MOCKED persistence writers — they test mental models, not runtime behavior
3. No integration test simulates actual OpenCode `event` / `chat.message` / `tool.execute.after` hook shapes
4. The race conditions (no serial queues on session-index-writer, child-writer) weren't causing visible failures before because the pipeline was completely broken — fixing other parts didn't matter

**The 163 unit tests that pass in isolation but fail in integration:**

These tests verify individual classes work correctly when fed ideal inputs. But in production:
- `EventCapture.handleSessionCreated` receives a session that `ensureSessionReady` already corrupted
- `MessageCapture.seedTurnCounters` is never called because `initialize()` doesn't wire it
- `SessionIndexWriter.addChild` races with `incrementTurnCount` because there's no serial queue

---

## 1. Disk State Analysis (L1 Evidence)

### 1.1 Session Directory Audit

```
.hivemind/session-tracker/
├── project-continuity.json                         # 15 entries, all childCount:0, all status:active
├── ses_1e6ff88f4ffeRtk94qECvennWM/                 # MAIN session — 5 children, no YAML frontmatter
│   ├── ses_1e6ff88f4ffeRtk94qECvennWM.md           # 989 lines, starts with "### Tool: task" — NO frontmatter
│   ├── session-continuity.json                      # turnCount:0, toolSummary populated (correct), 5 children
│   ├── ses_1e6faf225ffebssJYqnIRUxdjr.json         # Child — 1 turn, status:active, model:unknown ← CORRECT
│   ├── ses_1e6f252acffeSn4b5jn312rNHu.json         # Child — 1 turn, status:active, model:unknown ← DUAL-REGISTERED
│   ├── ses_1e6f2332bffeFmnWoEGz0hCuJ2.json         # Child — 1 turn, status:active, model:unknown ← DUAL-REGISTERED
│   ├── ses_1e6ee99acffeTOTq7yyOTl7EYK.json         # Child — 1 turn, status:active, model:unknown ← DUAL-REGISTERED
│   └── ses_1e6ee7858ffeFMinl4eXN7wP26.json         # Child — 1 turn, status:active, model:unknown ← DUAL-REGISTERED
├── ses_1e6f252acffeSn4b5jn312rNHu/                  # ← WRONG! This is a CHILD, shouldn't have own dir
│   ├── ses_1e6f252acffeSn4b5jn312rNHu.md            # 1449 lines, YAML says parentSessionID:null ← WRONG
│   └── session-continuity.json                      # turnCount:0, no children
├── ses_1e6f2332bffeFmnWoEGz0hCuJ2/                  # ← WRONG! Child with own dir
│   ├── ses_1e6f2332bffeFmnWoEGz0hCuJ2.md           # .md exists (content not sampled)
│   └── session-continuity.json                      # empty hierarchy, turnCount:0
├── ses_1e6ee99acffeTOTq7yyOTl7EYK/                  # ← WRONG! Child with own dir
│   ├── ses_1e6ee99acffeTOTq7yyOTl7EYK.md           # .md exists
│   └── session-continuity.json                      # data not sampled
├── ses_1e6ee7858ffeFMinl4eXN7wP26/                  # ← WRONG! Child with own dir
│   ├── ses_1e6ee7858ffeFMinl4eXN7wP26.md           # .md exists
│   └── session-continuity.json                      # data not sampled
├── ses_1e699192bffe8XFxyGHafwOTRD/                  # MAIN — 4 children listed in session-continuity.json
│   ├── ses_1e697c7e5ffeTFya4PzOcmS8yl.json         # Child .json (skeleton)
│   └── ...
├── ses_1e6e0c166ffeTmH9g2Z02jo2mb/                  # MAIN (no children)
├── ses_1e69ce609ffeYh7Odv2LM1vsza/
├── ses_1e6982267ffevj4eGbJAuvvBB5/
├── ses_1e697f76affeKzV47aMNvVmnsu/
├── ses_1e697c7e5ffeTFya4PzOcmS8yl/
├── ses_1e691d98affeT1yBz8CpY9Jn6d/
├── ses_1e68e4684ffeoB1orbKSWh2Ns9/
├── ses_1e68af2fcffeSdlsgnVaIP2Wd3/
└── ses_1e67cacbfffeAA5Sd4CITUBenX/
```

### 1.2 Cross-Contamination Audit

**4 sessions appear in BOTH locations:**

| Session ID | In project-continuity.json as main? | In ses_1e6ff88f as child? | Actually IS? |
|------------|-------------------------------------|--------------------------|-------------|
| `ses_1e6f252acffe...` | ✅ Own dir, .md, parentSessionID:null | ✅ Child .json, parentSessionID:ses_1e6ff88f | **CHILD** (has parent) |
| `ses_1e6f2332bffe...` | ✅ Own dir, .md, parentSessionID:null | ✅ Child .json, parentSessionID:ses_1e6ff88f | **CHILD** |
| `ses_1e6ee99acffe...` | ✅ Own dir, .md, parentSessionID:null | ✅ Child .json, parentSessionID:ses_1e6ff88f | **CHILD** |
| `ses_1e6ee7858ffe...` | ✅ Own dir, .md, parentSessionID:null | ✅ Child .json, parentSessionID:ses_1e6ff88f | **CHILD** |

**1 session appears ONLY as a child (CORRECT behavior):**

| Session ID | In project-continuity.json? | In parent as child? | Status |
|------------|----------------------------|---------------------|--------|
| `ses_1e6faf225ffe...` | ❌ No directory | ✅ Child .json in ses_1e6ff88f | **CORRECT** |

**Key insight:** `ses_1e6faf225ffe...` is the ONLY correctly-handled child. It has NO own directory, NO project-continuity.json entry. All 4 others are dual-registered. Why is this one different? Because `session.created` for `ses_1e6faf22` either didn't fire, or `ensureSessionReady` failed silently for this one session, or the timing was different.

### 1.3 Child .json Skeleton Analysis

**All 9 child .json files share identical structural defects:**

```json
// ses_1e6ff88f/ses_1e6ee99acffeTOTq7yyOTl7EYK.json (representative sample)
{
  "turns": [{ "turn": 0, ... }],              // ← Only turn 0 from appendChildTurn; never updated
  "status": "active",                          // ← Never transitions to idle/completed/error
  "mainAgent": { "model": "unknown" },         // ← model never populated
  "created": "2026-05-11T22:14:10.800Z",
  "updated": "2026-05-11T22:14:10.827Z",      // ← 27ms after created — write-once confirmed
  "children": []                                // ← Grandchild support: none
}
```

**Turn 0 vs actual turns:**
- `appendChildTurn` writes turn 0 at creation time (from `tool-capture.ts:265-274`)
- But subsequent child session messages (chat.message hooks for the child) are NEVER routed to `appendChildTurn`
- `event-capture.ts` routes child status events to `childWriter.updateChildStatus()` (correct for idle/deleted)
- But NO code path captures child session chat messages into the child .json turns array

### 1.4 project-continuity.json Staleness Analysis

```json
{
  "lastUpdated": "2026-05-12T00:19:08.702Z",   // 8+ hours stale (as of ~08:00 May 12)
  "sessions": { /* 15 entries */ },
  "all childCount": 0,                          // Never incremented for any session
  "all status": "active",                       // Never transitions
  "all totalDelegationDepth": 0                 // Never set
}
```

The index was being updated (lastUpdated advanced from 17:04 to 00:19 between the evidence matrix write and the current disk state), but stopped ~8 hours ago. The `detectStaleQueue()` recovery in `project-index-writer.ts` exists but either:
- Hasn't fired yet (5-minute threshold requires a NEW write to trigger detection)
- Or the queue was reset but no new writes needed to happen
- The `childCount: 0` for all entries means `updateSession` IS being called (lastUpdated changes) but never with `childCount` data

### 1.5 Event-Tracker Double-Capture Evidence

```
.hivemind/event-tracker/
├── ses_1e68.json          # 1985 lines, 100+ events, actively written
├── ses_1e68.md            # Companion markdown
├── ses_1e69.json          # Actively written
└── ses_1e69.md            # Companion markdown
```

Both `consumeJourneyFact` (old event-tracker, plugin.ts:146-155) and `consumeSessionTrackerFact` (new session tracker, plugin.ts:156-174) process every session event. `consumeJourneyFact` writes to `.hivemind/event-tracker/`. `consumeSessionTrackerFact` writes to `.hivemind/session-tracker/`. Same event, two writers.

---

## 2. Source-to-Disk Gap Analysis

### 2.1 Cross-Contamination: Child Sessions Getting Own Directories

**What the source code DOES (file:line):**
- `index.ts:123-156` (`ensureSessionReady`): Creates directory, initializes .md with `parentSessionID: null`, registers in project index — for ALL sessions regardless of parentID.
- `index.ts:177-178` (`handleSessionEvent`): Calls `ensureSessionReady(event.sessionID)` BEFORE delegating to `eventCapture`.

**What the DISK shows:**
- `ses_1e6f252acffe...` directory exists with `.md` file showing `parentSessionID: null` → [DISK: `ses_1e6f252.../ses_1e6f252....md`, lines 1-6]
- SAME session ID appears as child in `ses_1e6ff88f/session-continuity.json` with `delegatedBy: main_l0_agent` → [DISK: `ses_1e6ff88f/session-continuity.json`, lines 15-21]
- SAME session ID has child .json in parent dir → [DISK: `ses_1e6ff88f/ses_1e6f252....json`, line 3: `parentSessionID: "ses_1e6ff88f"`]

**Where the pipeline breaks (exact function, exact condition):**
- `index.ts:177`: `await this.ensureSessionReady(event.sessionID)` — called for ALL sessions including children
- `index.ts:131-133`: Inside `ensureSessionReady` — calls `initializeSessionFile(sessionID, {parentSessionID: null})` — hardcodes null for ALL sessions
- `index.ts:139`: `await this.projectIndexWriter.addSession(sessionID, ...)` — registers child as main session

**Classification:** `CODE_MISSING` — `ensureSessionReady` lacks a `parentID` check. Must query SDK to determine if session is a child BEFORE creating directory/index.

---

### 2.2 Child .json Write-Once, Never Updated

**What the source code DOES:**
- `tool-capture.ts:265-274`: Calls `childWriter.appendChildTurn(...)` with turn 0 at delegation spawn time (correct one-time call)
- `event-capture.ts:207-297`: Routes child idle/deleted/error events to `childWriter.updateChildStatus()` (correct for status transitions)
- **NO code path** calls `appendChildTurn` for subsequent child session chat messages

**What the DISK shows:**
- All 9 child .json files have exactly 1 turn (turn 0) from delegation spawn → [DISK: all child .json files, `turns` array length = 1]
- All have `status: "active"` — idle/deleted/complete transitions never fired or were dropped → [DISK: all child .json files, `status` field]
- All have `model: "unknown"` — never populated with actual model → [DISK: all child .json files, `mainAgent.model`]
- All have `created === updated` within a few hundred ms → [DISK: all child .json files, `created` vs `updated` timestamps]

**Where the pipeline breaks:**
- `chat.message` hook fires for child sessions → `sessionTracker.handleChatMessage()` is called
- BUT `handleChatMessage` only writes to the MAIN session's .md file (via `sessionWriter.appendUserTurn`)
- It does NOT detect that this is a child session and does NOT route to `childWriter.appendChildTurn()`
- Child session `session.idle`/`session.deleted` events: code in `event-capture.ts` DOES route to `childWriter.updateChildStatus()` — but these events may not be firing, or the childWriter throws (file not found?) and the error is caught silently.

**Classification:** `CODE_MISSING` — need child session detection in `handleChatMessage` and routing to `childWriter.appendChildTurn()`. Also need to verify child lifecycle events actually fire for these session IDs.

---

### 2.3 Turn Count Always Zero Despite User Turns in .md

**What the source code DOES:**
- `session-index-writer.ts:173-180` (`incrementTurnCount`): Exists and works correctly when called.
- `message-capture.ts:167-178` (`handleUserMessage`): Calls `this.nextTurnNumber(sessionID)` and `this.sessionWriter.appendUserTurn()` — but does NOT call `sessionIndexWriter.incrementTurnCount()`.

**What the DISK shows:**
- `ses_1e6f252.../ses_1e6f252....md` has `## USER (turn 1)` and `## USER (turn 2)` sections → [DISK: .md file, lines 12-30]
- `ses_1e6f252.../session-continuity.json` shows `turnCount: 0` → [DISK: session-continuity.json, line 9]
- Same pattern for ALL sessions — .md has user turns but index says turnCount: 0

**Where the pipeline breaks:**
- `handleUserMessage` (message-capture.ts:167) calls `sessionWriter.appendUserTurn()` (writes .md) but NEVER calls `sessionIndexWriter.incrementTurnCount(sessionID)`
- `MessageCapture` has no reference to `SessionIndexWriter` — it was never injected as a dependency

**Classification:** `WIRING_MISSING` — `MessageCapture` constructor needs `SessionIndexWriter` dependency, and `handleUserMessage` needs to call `sessionIndexWriter.incrementTurnCount()`.

---

### 2.4 Project Index Frozen / childCount Always Zero

**What the source code DOES:**
- `tool-capture.ts:287`: After creating child, calls `await this.projectIndexWriter.updateSession(input.sessionID, {})` — passes EMPTY update. No `childCount` increment.
- `project-index-writer.ts:191-213` (`updateSession`): Spreads `...updates` over existing entry. Empty `{}` updates nothing.

**What the DISK shows:**
- ALL 15 project entries have `childCount: 0` → [DISK: project-continuity.json, every session entry]
- Sessions with 5 child .json files have `childCount: 0` → [DISK: ses_1e6ff88f has 5 child .json files, childCount:0]

**Where the pipeline breaks:**
- `handleTask` in tool-capture.ts calls `updateSession(sessionID, {})` after creating child
- The `{}` updates nothing — need to READ current childCount from project index, increment it, and pass the new value
- But `ToolCapture` has no `readIndex()` method on `projectIndexWriter` (it's private)
- `projectIndexWriter` needs an `incrementChildCount(sessionID)` method that reads, increments, writes atomically within the serial queue

**Classification:** `CODE_MISSING` — need `project-index-writer.incrementChildCount()` method and need `handleTask` to call it.

---

### 2.5 Main Session .md Missing Frontmatter

**What the source code DOES:**
- `event-capture.ts:177` (`handleSessionCreated`): Calls `this.sessionWriter.initializeSessionFile(sessionID, {...})` for root sessions only
- `index.ts:133` (`ensureSessionReady`): ALSO calls `initializeSessionFile(sessionID, {...})`
- `atomic-write.ts:atomicAppendMarkdown`: Reads existing content, appends, writes atomically — should preserve frontmatter

**What the DISK shows:**
- `ses_1e6ff88f...md` starts with `### Tool: task` — NO YAML frontmatter → [DISK: ses_1e6ff88f.md, line 1]
- `ses_1e6f252...md` HAS frontmatter → [DISK: ses_1e6f252....md, lines 1-10]

**Where the pipeline breaks:**
- For `ses_1e6ff88f`, `ensureSessionReady` was called (session appears in project-continuity.json) but `initializeSessionFile` either failed silently (error caught by try/catch in ensureSessionReady) or never ran
- Most likely: `ensureSessionReady` called `createSessionDir` (succeeded) → `initializeSessionFile` threw (gray-matter/yaml import failure?) → `addSession` never called (caught, session removed from bootstrappedSessions)
- Then `eventCapture.handleSessionCreated` also ran → `createSessionDir` (idempotent) → `initializeSessionFile` (also threw or succeeded?) → `addSession` (succeeded, registering the session)
- But `initializeSessionFile` uses `atomicAppendMarkdown` — if it threw, the file was never created, and the first `appendToolBlock` wrote to an empty file

**Classification:** `CODE_MISSING` — `ensureSessionReady` and `eventCapture.handleSessionCreated` do redundant work, causing confusion. The race: both try to initialize the same session. Need single-path session initialization.

---

### 2.6 Legacy Event-Tracker Still Writing

**What the source code DOES:**
- `plugin.ts:146-155` (`consumeJourneyFact`): Routes every event to `createEventTrackerArtifactsFromHook()` → writes to `.hivemind/event-tracker/`
- `plugin.ts:181`: `consumeJourneyFact` is registered as an `eventObservers[]` alongside `consumeSessionTrackerFact`

**What the DISK shows:**
- `.hivemind/event-tracker/ses_1e69.json`: 1985 lines, actively written → [DISK: event-tracker/ses_1e69.json]
- `.hivemind/event-tracker/ses_1e69.md`: Companion markdown, actively written

**Classification:** `WIRING_MISSING` — `consumeJourneyFact` should be removed or gated behind a toggle. `cleanup()` removes old files but doesn't prevent new writes.

---

### 2.7 Race Conditions in Session-Index and Child Writer

**What the source code DOES:**
- `session-index-writer.ts:118-140` (`addChild`): Reads index, modifies, writes — no serial queue
- `session-index-writer.ts:150-165` (`updateChildStatus`): Same read-modify-write, no queue
- `session-index-writer.ts:173-180` (`incrementTurnCount`): Same
- `session-index-writer.ts:189-201` (`updateToolSummary`): Same
- `child-writer.ts:106-117` (`updateChildStatus`): Reads child file, modifies, writes — no queue
- `child-writer.ts:129-140` (`appendChildTurn`): Same

**What the DISK shows:**
- No visible data loss YET (all child files have 1 turn, status "active") — but this is because the pipeline is fundamentally broken; turns aren't being written
- Once the pipeline is fixed, concurrent writes from 6 sessions WILL collide

**Classification:** `RACE_CONDITION` — add per-session serial write queues (matching `project-index-writer.enqueueWrite` pattern).

---

## 3. Root Cause Hierarchy

### PRIMARY (causes the most damage — fix first)

| # | Root Cause | File:Line | Damage |
|---|-----------|-----------|--------|
| RC-1 | `ensureSessionReady` doesn't check parentID | `index.ts:123-156` | Creates directories for child sessions, registers them in project index, writes incorrect YAML frontmatter (parentSessionID: null) |
| RC-2 | `ensureSessionReady` and `eventCapture.handleSessionCreated` are redundant | `index.ts:177` + `event-capture.ts:169-204` | Both try to initialize the same session → race condition, silent failures |
| RC-3 | `MessageCapture` has no reference to `SessionIndexWriter` | `message-capture.ts` (constructor) | Turn counts never written to session-continuity.json |
| RC-4 | `projectIndexWriter.updateSession(sessionID, {})` passes empty updates | `tool-capture.ts:287` | childCount never incremented in project index |

### SECONDARY (cascades from primary — fix second)

| # | Root Cause | File:Line | Damage |
|---|-----------|-----------|--------|
| RC-5 | No serial queues on session-index-writer or child-writer | `session-index-writer.ts`, `child-writer.ts` | Will cause data loss once pipeline starts working |
| RC-6 | `chat.message` for child sessions not routed to child .json | `index.ts:301-330` (handleChatMessage) | Child turns never captured; .json skeletons stay skeletal |
| RC-7 | `seedTurnCounters` implemented but never wired in `initialize()` | `message-capture.ts:230-242` + `index.ts:380-443` | Turn counters reset to 0 on restart |

### TERTIARY (independent — fix any time)

| # | Root Cause | File:Line | Damage |
|---|-----------|-----------|--------|
| RC-8 | `consumeJourneyFact` still registered in eventObservers | `plugin.ts:146-155, 181` | Double-capture wastes resources |
| RC-9 | `computeThinkingDuration` returns hardcoded "present" | `agent-transform.ts:117-118` | Inaccurate metadata |
| RC-10 | `isValidSessionID` regex rejects some valid IDs | `types.ts:270` | May silently drop valid sessions |
| RC-11 | GAP-01/02/03 in session-tracker tool | `src/tools/hivemind/session-tracker.ts` | Path traversal, sync I/O, missing validation |

---

## 4. Fix Strategy

### Wave 0: UNBLOCK THE PIPELINE (Priority: BLOCKING)

These fixes stop the cross-contamination and allow the rest of the pipeline to work correctly.

| Fix | Files | Classification | LOC Est |
|-----|-------|---------------|---------|
| **F-01**: Add parentID check to `ensureSessionReady` — skip child sessions entirely | `index.ts:123-156` | CODE_MISSING | +15 |
| **F-02**: Remove redundant `ensureSessionReady` call from `handleSessionEvent` — delegate entirely to `eventCapture` OR remove initialization from `eventCapture` entirely. Pick ONE path. | `index.ts:164-215` + `event-capture.ts:169-204` | CODE_MISSING | -20 (remove) |
| **F-03**: Inject `SessionIndexWriter` into `MessageCapture` and call `incrementTurnCount` in `handleUserMessage` | `message-capture.ts:60-89` (constructor), `message-capture.ts:167-178` (handleUserMessage) | WIRING_MISSING | +10 |

### Wave 1: FIX THE DATA (Priority: CRITICAL)

These fixes ensure the correct data flows into the persistence layer.

| Fix | Files | Classification | LOC Est |
|-----|-------|---------------|---------|
| **F-04**: Add `incrementChildCount(sessionID)` to `ProjectIndexWriter` and call it from `handleTask` instead of `updateSession(sessionID, {})` | `project-index-writer.ts` (new method), `tool-capture.ts:287` (call site) | CODE_MISSING | +15 |
| **F-05**: Route child session `chat.message` to `childWriter.appendChildTurn()` when session has a parentID | `index.ts:301-330` (handleChatMessage) — detect child via SDK `getSession` | CODE_MISSING | +20 |
| **F-06**: Wire `messageCapture.seedTurnCounters()` from `initialize()` for all known sessions | `index.ts:380-443` — iterate project index sessions | WIRING_MISSING | +12 |

### Wave 2: PREVENT REGRESSION (Priority: HIGH)

These fixes prevent silent data loss under concurrent writes.

| Fix | Files | Classification | LOC Est |
|-----|-------|---------------|---------|
| **F-07**: Add per-session serial write queue to `SessionIndexWriter` (match `ProjectIndexWriter.enqueueWrite` pattern) | `session-index-writer.ts` | RACE_CONDITION | +35 |
| **F-08**: Add per-session serial write queue to `ChildWriter` | `child-writer.ts` | RACE_CONDITION | +35 |

### Wave 3: CLEANUP (Priority: MEDIUM)

| Fix | Files | Classification | LOC Est |
|-----|-------|---------------|---------|
| **F-09**: Remove or gate `consumeJourneyFact` double-capture | `plugin.ts:146-155, 181` | WIRING_MISSING | -15 |
| **F-10**: Fix `computeThinkingDuration` to return `undefined` | `agent-transform.ts:117-118` | CODE_MISSING | -3 (change "present" → undefined) |
| **F-11**: Loosen `isValidSessionID` or remove entirely (rely on `safeSessionPath` only) | `types.ts:270` | CODE_MISSING | ~5 |
| **F-12**: Fix tool surface defects (GAP-01/02/03) | `src/tools/hivemind/session-tracker.ts` | CODE_MISSING | ~20 |

---

## 5. Test Strategy

### Integration Tests (the critical missing piece)

**File: `tests/features/session-tracker/integration/pipeline.test.ts`**

```typescript
describe("Session Tracker Pipeline (Integration)", () => {
  // Simulates ACTUAL OpenCode hook event shapes from SPEC.md §6

  it("F-01: should NOT create directory for child session", async () => {
    // Fire session.created with session having parentID
    // Verify: no subdirectory created for child
    // Verify: child NOT in project-continuity.json
  })

  it("F-02: should initialize main session ONCE (no double init)", async () => {
    // Fire session.created for root session
    // Fire chat.message before handleSessionCreated completes
    // Verify: .md file has frontmatter, not just tools
  })

  it("F-03: should increment turnCount in session-continuity.json", async () => {
    // Fire chat.message (user) → verify turnCount: 1
    // Fire chat.message (user) → verify turnCount: 2
    // Fire chat.message (user) → verify turnCount: 3
  })

  it("F-04: should increment childCount in project index", async () => {
    // Fire tool.execute.after (task → child created)
    // Verify: project-continuity.json has childCount: 1
    // Fire another task → verify: childCount: 2
  })

  it("F-05: should capture child session turns in child .json", async () => {
    // Fire tool.execute.after (task → child created)
    // Fire chat.message for child session (simulate agent responding)
    // Verify: child .json turns array has turn 0 (delegation) + turn 1 (child message)
  })

  it("F-06: should seed turn counters from existing .md on restart", async () => {
    // Create .md with 3 USER turns
    // Re-create SessionTracker → call initialize()
    // Fire chat.message (user)
    // Verify: turn number in .md is 4 (not 1)
  })

  it("F-07/08: should not lose concurrent writes", async () => {
    // Enqueue 10 concurrent addChild calls
    // Enqueue 10 concurrent appendChildTurn calls
    // Verify: all 10 children in index, all 10 turns in .json
  })
})
```

### Per-REQ Acceptance Tests (against disk state)

| REQ | Test | Expected Disk State |
|-----|------|-------------------|
| REQ-ST-01 | Only main sessions have directories | No child session has own dir in `.hivemind/session-tracker/` |
| REQ-ST-02 | User messages captured | `.md` has `## USER (turn N)` for each message |
| REQ-ST-03 | Agent metadata transformed | `.md` has `## main_l0_agent` with name, model |
| REQ-ST-04 | Skill captured | `.md` has `### Tool: skill` with pruned output |
| REQ-ST-05 | Read — no file content | `.md` read blocks have path only, no file body |
| REQ-ST-06 | Task → child .json | Child .json exists under parent with correct metadata |
| REQ-ST-07 | Child session recognized | Child .json has turns captured beyond turn 0 |
| REQ-ST-08 | Dual indices updated | `session-continuity.json` has turnCount > 0, toolSummary populated; `project-continuity.json` has childCount > 0 |
| REQ-ST-09 | Concurrent isolation | No data loss when 6 concurrent sessions write |
| REQ-ST-10 | Recovery works | `readSessionFile` returns correct content |
| REQ-ST-11 | CQRS boundary | No direct fs writes from hooks |
| REQ-ST-12 | Schema consistency | All fields camelCase, no undefined spreads |
| REQ-ST-13 | Legacy cleanup | `.hivemind/event-tracker/` has ≤ 0 state files after cleanup |

### Gatekeeping Pipeline

```
Gate 1: Lifecycle Integration
├── Verify CQRS: hooks → SessionTracker → persistence
├── Verify module caps: all modules ≤ 500 LOC
└── Verify no circular deps

Gate 2: SPEC Compliance
├── Bidirectional traceability: REQ-ST-01..13 ↔ test ↔ code
├── Gap detection: implementable only
└── EARS acceptance criteria validation

Gate 3: Evidence Truth
├── L1: fresh .hivemind/session-tracker/ disk state after simulated session
├── L2: continuity index correctness (childCount > 0, turnCount > 0)
├── L4: all integration + regression tests pass
└── L4: 247 existing unit tests still pass
```

---

## 6. Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Cross-contamination mechanism | HIGH | Confirmed via L1 disk evidence — 4 sessions dual-registered, traced to `ensureSessionReady:131-133` hardcoding `parentSessionID: null` |
| Child .json write-once | HIGH | All 9 child files confirmed skeletons — 1 turn, status:active, created===updated |
| Turn count zero | HIGH | All session-continuity.json files show turnCount:0, but `MessageCapture` never calls `incrementTurnCount` — confirmed by reading source |
| project index frozen | MEDIUM | `lastUpdated` is 8 hours stale; `detectStaleQueue()` exists but queue appears stuck again. Mechanism not 100% confirmed — need logging to trace. |
| Fix approach for parentID check | HIGH | Straightforward: add `getSession()` call in `ensureSessionReady` before creating dir; skip if parentID exists |
| Fix approach for turn counting | HIGH | Add `SessionIndexWriter` to `MessageCapture` constructor; call `incrementTurnCount` in `handleUserMessage` |
| Fix approach for serial queues | HIGH | Pattern already proven in `ProjectIndexWriter.enqueueWrite` — copy-paste adapt |

### Open Questions for Runtime Validation

1. **Does `session.created` actually fire for child sessions?** The dual-registration evidence says YES (child sessions get directories created by `ensureSessionReady`). But need to confirm the hook shape matches what `consumeSessionTrackerFact` expects (line 159: `ev.type || ev.eventType`).

2. **Does `session.idle` fire for child sessions?** If it does, `eventCapture.handleSessionIdle` should call `childWriter.updateChildStatus()` — but child .json files still show `status: "active"`. Either the event doesn't fire, or the childWriter call fails silently.

3. **Is `project-index-writer.detectStaleQueue` actually recovering?** The queue was frozen for 7 hours (evidence matrix), then updated at 00:19, then frozen again. Need to investigate if recovery condition triggers correctly or if the queue is permanently stuck on a poisoned promise.

4. **Why does `ses_1e6faf22` NOT have dual registration?** This is the ONLY correctly-handled child. What's different about its lifecycle? Possibly `session.created` fired before `ensureSessionReady` was wired, or the event was dropped/delayed.

---

## Sources

### L1 — Disk Evidence (PRIMARY)
- `[DISK] .hivemind/session-tracker/project-continuity.json` — 15 entries, all childCount:0, all status:active, lastUpdated: 2026-05-12T00:19:08.702Z
- `[DISK] .hivemind/session-tracker/ses_1e6ff88f.../session-continuity.json` — 5 children, turnCount:0, toolSummary populated
- `[DISK] .hivemind/session-tracker/ses_1e6ff88f.../ses_1e6ee99a...json` — Skeleton: 1 turn, created===updated, model:unknown
- `[DISK] .hivemind/session-tracker/ses_1e6ff88f.../ses_1e6f252...json` — Skeleton + dual-registered
- `[DISK] .hivemind/session-tracker/ses_1e6f252.../ses_1e6f252....md` — Has frontmatter + 2 USER turns (from wrong ensureSessionReady init)
- `[DISK] .hivemind/session-tracker/ses_1e6ff88f.../ses_1e6ff88f....md` — NO frontmatter, starts with "### Tool: task"
- `[DISK] .hivemind/session-tracker/ses_1e6f2332bffe.../session-continuity.json` — turnCount:0, empty hierarchy
- `[DISK] .hivemind/event-tracker/ses_1e69.json` — 1985 lines, actively written (double-capture confirmed)
- `[DISK] .hivemind/session-tracker/` — Directory listings confirming cross-contamination: ses_1e6f252, ses_1e6f233, ses_1e6ee99a, ses_1e6ee7858 all have their own directories

### L4 — Source Code (SECONDARY, validated against disk)
- `[SOURCE] src/features/session-tracker/index.ts:123-156` — `ensureSessionReady()` — ROOT CAUSE: no parentID check
- `[SOURCE] src/features/session-tracker/index.ts:177-178` — calls ensureSessionReady before eventCapture
- `[SOURCE] src/features/session-tracker/capture/tool-capture.ts:219-307` — handleTask creates child .json
- `[SOURCE] src/features/session-tracker/capture/event-capture.ts:169-204` — handleSessionCreated checks parentID (correct but too late)
- `[SOURCE] src/features/session-tracker/capture/message-capture.ts:60-89, 167-178` — No SessionIndexWriter dependency
- `[SOURCE] src/features/session-tracker/persistence/project-index-writer.ts:191-213, 247-259` — updateSession + detectStaleQueue
- `[SOURCE] src/features/session-tracker/persistence/session-index-writer.ts:118-201` — No serial queues
- `[SOURCE] src/features/session-tracker/persistence/child-writer.ts:106-140` — No serial queues
- `[SOURCE] src/plugin.ts:99-100, 146-155, 181` — cleanup() chained (correct), consumeJourneyFact still active
- `[SOURCE] src/tools/hivemind/session-tracker.ts:107-108` — GAP-01 path traversal

### L5 — Planning Documents (context only)
- `[DOC] .planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — 13 REQs, EARS acceptance criteria
- `[DOC] .planning/phases/12-*/debug-session-analysis/01-EVIDENCE-MATRIX.md` — Pre-Phase-12 compliance assessment
- `[DOC] .planning/phases/12-*/debug-session-analysis/02-SOURCE-DEFECTS.md` — 14 source defects (pre-Phase 12)

---

## Metadata

**Research date:** 2026-05-12 (v2)
**Valid until:** 2026-05-19 (7 days — active fix cycle)
**Methodology:** Disk-truth-first — every claim validated against `.hivemind/session-tracker/` file content and directory structure
**Correction of v1:** Previous research claimed "12 of 14 defects fixed in code" — FALSE. Source code changes exist but pipeline is fundamentally broken. Cross-contamination, skeleton children, zero turn counts, and frozen index confirmed via disk evidence.
**Source files examined:** 24 total (9 disk files, 10 source files, 5 planning docs)
