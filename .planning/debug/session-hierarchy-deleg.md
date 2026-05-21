---
slug: session-hierarchy-deleg
status: root_cause_found
trigger: "Phase 21 regression — consecutive delegations create separate root directories instead of children under same parent"
created: 2026-05-21T22:45:00Z
updated: 2026-05-21T23:45:00Z
tdd_mode: true
specialist_dispatch_enabled: true
---

## Current Focus

**Hypothesis:** `pendingCount > 1` guard at Gate 0 (event-capture.ts:181-189) bails when multiple tasks are dispatched consecutively, consuming session.created without classification — causing the child session to receive NO tracking from EventCapture but later get a root directory from a secondary code path.

**Next action:** Present root cause report with 3 solution options for user review.

**Test:** Simulate 2 consecutive task dispatches from same parent within same turn. Verify Gate 0 does not bail and both children are classified correctly.

**Expecting:** Both children get child .json written via Gate 0 without orphan root directories.

## Symptoms

1. **Expected behavior:** When parent delegates 2+ children consecutively via task/delegate-task, ALL children should be written as child `.json` files under the parent's `.hivemind/session-tracker/{parentID}/` directory.

2. **Actual behavior:** First child is written correctly under parent's dir. Second child (or subsequent) creates a SEPARATE root session directory with its own `.md` + `session-continuity.json`, instead of a `.json` child file under the parent.

3. **Evidence paths:**
   - `.hivemind/session-tracker/project-continuity.json` — shows `ses_1b4bfe25...` as root with child `ses_1b4bd91c...`
   - `.hivemind/session-tracker/ses_1b4bd7f8.../session-continuity.json` — partial root (NO .md, NOT in project-continuity.json)
   - `.hivemind/session-tracker/ses_1b4bfe25.../` — has .md + continuity + child .json
   - `/Users/apple/hivemind-plugin-private/session-ses_1b4b.md` — real main session file
   - `/Users/apple/hivemind-plugin-private/session-ses_1b4b-sub.md` — sub session with FAKE `## USER` (created by task tool)

4. **Key architectural insight from user:** Task tool / delegate-task created sessions have `## USER` metadata that is FAKE — injected by the tool, not from a real human. These sessions should NEVER be registered as root/main sessions. Only sessions verified as originating from a true user prompt (turn count === 1) should be root sessions.

5. **Timeline:** First seen during live OpenCode runtime testing. The `event-capture.ts` Gate 0 (`pendingCount > 1` guard at line 181-189) may be bailing on the second delegation, causing it to fall through to root creation path.

6. **Edge cases to investigate:**
   - User deletes `.hivemind/session-tracker/` and rebuilds, resuming from old main sessions
   - User forks from an N-turn message → new main session with new ID, SHARES dependencies with all pre-fork sub-sessions

## Evidence

1. **Gate 0 bail trace (event-capture.ts:166-189):**
   - `pendingCount = this.pendingRegistry?.size ?? 0` — counts ALL pending dispatch entries
   - `anyPending = pendingCount === 1 ? registry.getAnyActiveEntry() : undefined` — only classifies when EXACTLY 1 pending
   - `if (pendingCount > 1) { return }` at line 181-189 — **bails without classification**
   - Result: `session.created` consumed as no-op; no child .json, no root dir, no hierarchy registration

2. **Normal consecutive dispatch state (PendingDispatchRegistry at runtime):**
   - Task 1 PreToolUse: `dispatches = {call:call1}`, `byParent = {ses_parent: {call1}}`, `size = 1`
   - Task 2 PreToolUse: `dispatches = {call:call1, call:call2}`, `byParent = {ses_parent: {call1, call2}}`, `size = 2`
   - session.created for child 1 fires: `size = 2` → **BAIL** (child 1 unclassified)
   - session.created for child 2 fires: `size = 1` (after PostToolUse removed call1) → classified correctly

3. **Double-classification result:**
   - Child 2 (`ses_1b4bd7f8`): child .json created by PostToolUse ✅
   - Child 2 (`ses_1b4bd7f8`): ALSO root directory at `ses_1b4bd7f8/session-continuity.json` ❌
   - The root session-continuity.json INCORRECTLY declares `ses_1b4bd91c` (sibling) as its child

4. **Confirmation from user:** Tasks fire 1-2 seconds apart; 10+ tasks can fire consecutively. `pendingCount > 1` is NORMAL behavior, not exceptional.

5. **`byParent` index (pending-dispatch-registry.ts:80-86) ALREADY EXISTS** for reverse parent lookup — can be used for correct classification: if `byParent.size > 0`, the session IS a child.

## Eliminated

1. **NOT a race condition with SDK parentID.** The SDK parentID IS set correctly on child sessions. The issue is Gate 0 bailing before the SDK check runs.
2. **NOT a PostToolUse failure.** PostToolUse (tool-capture.ts) correctly creates child .json files under the parent directory. The child file has proper tracking data.
3. **NOT a hierarchy index corruption during runtime.** The hierarchy index registers children correctly when PostToolUse fires. The orphan hierarchy comes from `buildFromDisk()` reading the orphan session-continuity.json on startup.
4. **NOT a double-firing of session.created.** The event hook only fires once per event. The issue is the SINGLE event being consumed but not handled.

## Resolution

### Root Cause (file:line)

**`src/features/session-tracker/capture/event-capture.ts:181-189`** — Gate 0 returns when `pendingCount > 1`, consuming `session.created` without classifying the session. This is triggered when a parent dispatches 2+ consecutive task tools (normal behavior for rapid delegation).

### Why it happens
- `pendingCount` counts ALL pending dispatch entries (size of the dispatches Map)
- When `pendingCount > 1`, Gate 0 assumes "ambiguous" and bails
- But ALL sessions created by task tool are children — there's nothing ambiguous
- The `byParent` index already exists and provides the correct signal

### Solution Options

**Option A (Recommended): Use `byParent` instead of `pendingCount === 1`**
- Change Gate 0 to check `this.pendingRegistry?.byParent.size > 0` instead of `pendingCount === 1`
- The `byParent` index maps `parentSessionID → Set<callID>` and exists when ANY dispatch was recorded
- If `byParent.size > 0`, a task was recently dispatched and this session IS a child
- Benefit: Single change, minimal blast radius, correct for N concurrent dispatches
- File: `event-capture.ts` lines 166-169, and expose `byParent` via `PendingDispatchRegistry`

**Option B: Fall through to SDK parentID + remaining gates**
- Remove the `pendingCount > 1` return at line 189
- Let Gate 0 only handle the `pendingCount === 1` fast path (as optimization)
- For `pendingCount > 1`, fall through to SDK parentID retry + Gates 2/3
- The SDK will return the correct parentID after its retry loop
- Benefit: Simpler logic, leverages existing gates
- Tradeoff: Slightly slower classification (100ms SDK retry delay)

**Option C: Use `getAnyActiveEntry()` unconditionally**
- Call `getAnyActiveEntry()` regardless of `pendingCount` value
- If any pending entry exists, classify as child
- The `byParent` >= 0 check is already inside `getAnyActiveEntry()`
- Benefit: Most aggressive classification, works for all counts
