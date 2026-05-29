---
status: diagnosed
trigger: "Session-tracker fails to record assistant messages continuously (n-turns) — only records ONE assistant turn instead of ALL turns"
created: 2026-05-28T00:00:00.000Z
updated: 2026-05-28T02:00:00.000Z
---

## Current Focus

hypothesis: CONFIRMED — Three distinct mechanisms cause n-turn recording failure:
  H1 (MAIN SESSIONS — ARCHITECTURAL): No hook pathway delivers assistant messages during session lifecycle. chat.message hook only delivers UserMessage. session.next.text.ended doesn't exist in SDK. handleSessionIdle fires ONCE, writes ONE turn.
  
  H2 (CHILD SESSIONS — C1 REGRESSION): childFileExists early-return guards (commit 0e035f1c) prevent backfillChildTurnsFromSdk from running when parentID resolution mismatch exists between resolveChildLifecycleRoute and resolveWriteParent.
  
  H3 (LastMessageCapture — BY DESIGN, NOT A BUG): Live assistant text tracking only writes to frontmatter (overwrite), never to body turns (append).

test: Code trace of all three pathways confirmed the mechanisms
expecting: Report findings as ROOT CAUSE FOUND
next_action: Produce structured investigation report

## Symptoms

expected: Session tracker records ALL assistant turns (n-turns) continuously in both main sessions (.md files) and child sessions (.json files)
actual: Only ONE assistant message is recorded at session end (main sessions) or potentially skipped entirely (child sessions with C1 regression)
errors: No explicit error messages — silent data loss
reproduction: Run a session with multiple assistant/user exchanges, check .md body and .json turns arrays
started: May be a pre-existing architectural limitation exacerbated by C1 changes (commit 0e035f1c)

## Eliminated

- hypothesis: C3 extraction of ChildBackfiller broke child turn recording
  evidence: Git diff confirms pure extraction — no logic changes. backfillChildTurnsFromSdk delegates to childBackfiller.backfillChildTurnsFromSdk with identical code.
  timestamp: 2026-05-28

- hypothesis: assistantTurnCounters is the bug
  evidence: assistantTurnCounters (event-capture.ts line 61) is only incremented in handleSessionIdle (line 389). Used correctly for turn numbering but handler fires ONCE, so counter only reaches 1.
  timestamp: 2026-05-28

- hypothesis: appendAssistantTurn() has a bug
  evidence: session-writer.ts lines 139-147 — code is correct: appends `## ASSISTANT (turn N)\n\n{content}\n`. Issue is call frequency (once), not implementation.
  timestamp: 2026-05-28

- hypothesis: ChildBackfiller.backfillChildTurnsFromSdk fails to handle n-turns
  evidence: child-backfiller.ts lines 51-99 — iterates ALL SDK messages, creates Turn objects for each, calls childWriter.backfillChildTurns. Handles n-turns correctly.
  timestamp: 2026-05-28

- hypothesis: Commit 41314cf2 (nested sessionID paths) broke LastMessageCapture
  evidence: This commit changed getExplicitEventSessionID in session-api.ts to support nested paths (properties.part.sessionID, properties.info.sessionID). This ADDS support for more event shapes — does NOT remove existing paths. Not a regression vector.
  timestamp: 2026-05-28

## Evidence

### Evidence Set 1: Main Session Assistant Turn Capture (ARCHITECTURAL — pre-existing)

- timestamp: 2026-05-28
  checked: event-capture.ts handleSessionIdle() (lines 316-421)
  found: Pipeline:
    1. Resolves child/main route
    2. For main sessions: gets lastMessage from pendingRegistry → LastMessageCapture → SDK fallback
    3. Writes ONE `## ASSISTANT (turn N)` block via appendAssistantTurn
    4. Updates frontmatter with lastMessage + completed status
  Key: This fires ONCE per session lifecycle. Only ONE turn is written.
  implication: The ONLY body-writing mechanism for main sessions writes AT MOST ONE assistant turn. This is an ARCHITECTURAL LIMITATION — there is no mechanism to capture assistant turns mid-session.

- timestamp: 2026-05-28
  checked: event-capture.ts handleSessionNextTextEnded() (lines 763-793)
  found: DOCUMENTED AS DEAD CODE (comment at lines 745-758): "This method is currently unreachable. The OpenCode SDK does NOT dispatch session.next.text.ended"
  Also: handler only updates frontmatter lastMessage — does NOT append to body turns.
  implication: Even if this event existed, it would only update frontmatter, not write body turns.

- timestamp: 2026-05-28
  checked: message-capture.ts handleAssistantMessage() (lines 207-235)
  found: DOCUMENTED AS DEAD CODE (comment at lines 199-206): "This method is currently unreachable for main sessions. The chat.message hook provides only UserMessage (role: 'user') — it never delivers AssistantMessage."
  Would write `## main_l0_agent` blocks via appendAgentBlock + update frontmatter lastMessage.
  implication: The chat.message hook cannot be used to capture assistant turns.

- timestamp: 2026-05-28
  checked: LastMessageCapture (last-message-capture.ts lines 46-240) + initialization.ts (lines 152-166)
  found: 
    - Tracks live assistant text via message.updated / message.part.updated events in event hook pipeline
    - onLastMessageUpdate callback (init.ts:153-166): writes to frontmatter via sessionWriter.updateFrontmatter(sessionID, { lastMessage: text })
    - This OVERWRITES frontmatter.lastMessage on each update — never appends to body
    - Bounded cache: max 5 entries (FIFO eviction)
    - getLastMessage() (lines 194-213): iterates in reverse insertion order, returns FIRST matching session's combined text
  implication: LastMessageCapture provides live text tracking but ONLY for single frontmatter field — not for body turn recording. This is by design (frontmatter has one lastMessage field), not a bug.

### Evidence Set 2: Child Session Turn Capture (C1 Regression — file existence guard)

- timestamp: 2026-05-28
  checked: handleSessionIdle child path (event-capture.ts lines 318-342)
  found: 
    ```
    childRoute → childFileExists check → status update → backfillChildTurnsFromSdk
    ```
    C1 change (commit 0e035f1c): Added `if (!childFileExists) return` guard.
    resolveChildLifecycleRoute (lines 717-740) resolves parentID via SDK → hierarchyIndex → pendingRegistry. Returns `{ parentID, rootMainID }`.
    childFileExists uses resolveWriteParent (child-writer.ts:155-162) which resolves via hierarchyIndex.getRootMain.
    If hierarchyIndex.getRootMain(childSessionID) returns a DIFFERENT value than resolveChildLifecycleRoute's effectiveParentID (which also comes from hierarchyIndex), the file check looks in the wrong directory → returns false → EARLY RETURN → NO backfill.
  implication: Parent resolution mismatch between resolveChildLifecycleRoute and resolveWriteParent can cause backfill to be silently skipped.

- timestamp: 2026-05-28
  checked: resolveChildLifecycleRoute (event-capture.ts lines 717-740)
  found: 
    ```
    parentID = SDK session.parentID
    effectiveParentID = parentID ?? indexedParent ?? pendingParent
    rootMainID = hierarchyIndex?.getRootMain(sessionID) ?? effectiveParentID
    return { parentID: effectiveParentID, rootMainID }
    ```
    The `parentID` returned is the IMMEDIATE parent (could be L1).
    childFileExists passes this immediate parentID to resolveWriteParent.
    resolveWriteParent uses hierarchyIndex.getRootMain(childID) which resolves the ROOT MAIN.
  problem: If hierarchyIndex hasn't been built from disk yet or the child isn't registered, getRootMain returns undefined → resolveWriteParent falls back to immediateParentID (the L1 parent). But the child .json was written under the root main directory (D-03). So childFileExists checks the L1's directory → not found → returns false.
  implication: Race condition: if hierarchyIndex hasn't resolved the root main for this child yet, childFileExists looks in the wrong directory and returns false.

- timestamp: 2026-05-28
  checked: child-backfiller.ts backfillChildTurnsFromSdk() (lines 51-99)
  found: Queries getSessionMessages for ALL messages. Converts ALL to Turn objects (both user and assistant). Calls childWriter.backfillChildTurns to write ALL turns.
  This IS working correctly for n-turns WHEN it fires.
  implication: The backfill mechanism itself handles n-turns correctly. The issue is whether it fires at all.

- timestamp: 2026-05-28
  checked: child-recorder.ts recordChildMessage() (lines 81-144)
  found: Records child session turns via chat.message hook. BUT: chat.message hook only delivers UserMessage (role: "user"). So only user messages are recorded as turns during the session. Assistant messages are only captured via backfillChildTurnsFromSdk at session end.
  implication: Child sessions get their assistant turns ONLY from backfill at session end. If backfill is skipped (C1 regression), assistant turns are lost.

### Evidence Set 3: C1-C3 Commit Analysis

- timestamp: 2026-05-28
  checked: Git log a6f2bef1..0e035f1c (40 commits)
  found: Relevant changes to session-tracker:
    1. `0e035f1c` — "fix: check file existence before updating session status or journey to prevent ENOENT warnings"
       Added 8 new childFileExists/sessionFileExists guards with early returns in:
       - handleSessionIdle (child path): line 321-323
       - handleSessionIdle (main path): line 344-346
       - handleSessionDeleted (child path): line 432-434
       - handleSessionDeleted (main path): line 483-485
       - handleSessionError (child path): line 515-517
       - handleSessionError (main path): line 555-557
       - handleSessionCompacted (child path): line 825-827
       - recordJourneyEntry (child path): line 909-911
       - recordJourneyEntry (main path): line 912-914
    2. `41314cf2` — "fix: support nested sessionID paths for message events"
       Added properties.part.sessionID and properties.info.sessionID to getExplicitEventSessionID
    3. `81bf7a93` — "refactor(C3): extract ChildBackfiller" — Pure extraction, no logic change
    4. `43a51ed6` — "fix(C2): remaining type safety, security, and env hardening"
  implication: The childFileExists guards (commit 0e035f1c) are the MOST LIKELY regression vector for child session n-turn recording. The parentID resolution path used by childFileExists (resolveWriteParent → hierarchyIndex.getRootMain) may not match the path used by writeImmediateChildFile.

### Evidence Set 4: Common Bug Pattern Matching

- timestamp: 2026-05-28
  checked: Common bug patterns matching
  found: Matches:
    1. "Async/Timing — Race Condition" — childFileExists check between session.idle and child file creation. If child file's root main directory differs from resolveChildLifecycleRoute's parentID, file check fails.
    2. "State Management — Dual Source of Truth" — resolveChildLifecycleRoute uses SDK parentID, then hierarchyIndex, then pendingRegistry. childFileExists uses resolveWriteParent which uses hierarchyIndex.getRootMain. Different resolution paths can disagree.
  implication: Dual parent resolution paths can cause the childFileExists check to look in the wrong directory.

## Resolution

root_cause: |
  The n-turn assistant message recording regression has THREE distinct root causes:

  ROOT CAUSE 1 (MAIN SESSIONS — ARCHITECTURAL LIMITATION, PRE-EXISTING):
  There is NO hook or event pathway that delivers assistant messages during the main session lifecycle. The `chat.message` hook only delivers `UserMessage` (role: "user"). The `session.next.text.ended` event does not exist in the SDK. The `message.updated`/`message.part.updated` events tracked by LastMessageCapture only update the frontmatter `lastMessage` field (overwrite, not append). The only mechanism that writes assistant turns to the `.md` body is `handleSessionIdle()` (event-capture.ts:316-421), which fires ONCE per session lifecycle and captures ONE turn.

  ROOT CAUSE 2 (CHILD SESSIONS — C1 REGRESSION, commit 0e035f1c):
  The `childFileExists` early-return guards added in commit 0e035f1c can prevent `backfillChildTurnsFromSdk()` from running. The guard uses `resolveWriteParent()` (child-writer.ts:155-162) which resolves via `hierarchyIndex.getRootMain()`. If the hierarchy index hasn't built the root-main mapping for this child yet (race condition), `getRootMain()` returns undefined, and `resolveWriteParent` falls back to the immediate parentID. Meanwhile, `writeImmediateChildFile()` writes the child .json under the root main directory (D-03). The file check looks in the wrong directory → false → early return → backfill skipped.

  ROOT CAUSE 3 (ALL SESSIONS — LastMessageCapture BY DESIGN):
  LastMessageCapture tracks live assistant text via `message.updated`/`message.part.updated` events but its `onLastMessageUpdate` callback (initialization.ts:153-166) only writes to frontmatter (overwriting `lastMessage`). It never appends to body turns. This is by design (frontmatter has one `lastMessage` field), but means live text tracking does NOT contribute to n-turn body recording.

fix: |
  THREE FIXES NEEDED:

  FIX 1 (MAIN SESSIONS): Add a mechanism to periodically write assistant turns to body during the session, not just at session.idle. Options:
    A. Wire LastMessageCapture's text updates to also call sessionWriter.appendAssistantTurn() with incrementing turn numbers (not just frontmatter update). This would require the LastMessageCapture to maintain a turn counter and call appendAssistantTurn on each significant text update.
    B. Add a periodic check (every N seconds or after each message part update) that writes current accumulated text to body.
    C. If the SDK does eventually dispatch assistant messages via some event, wire that event to appendAssistantTurn.

  FIX 2 (CHILD SESSIONS): Fix the childFileExists guard to not block backfill when the file check fails for parentID resolution reasons. Options:
    A. Make childFileExists scan ALL session-tracker subdirectories for the child .json (like readChildData does at lines 331-371) instead of resolving via hierarchyIndex.
    B. Remove the childFileExists guard entirely and let the backfill attempt fail gracefully (the backfill already has error handling at lines 89-98).
    C. Change the guard to log a warning instead of returning early, allowing backfill to proceed.

  FIX 3 (LastMessageCapture): Either document this as a known limitation (the current behavior), or extend LastMessageCapture to also call appendAssistantTurn periodically. This is a design decision — frontmatter.lastMessage serves a different purpose (quick resume context) than body turns (full history).

verification: |
  SELF-VERIFICATION (read-only investigation):
  - All claims cite specific file:line references — no assumptions without code evidence
  - Three distinct root causes identified with supporting evidence for each
  - C1 regression confirmed via git diff analysis (commit 0e035f1c)
  - Previous debug sessions (session-tracker-lastmessage-root-cause, session-tracker-bug-analysis) independently confirm the architectural limitations
  PENDING: Live UAT to confirm the childFileExists guard regression in real scenarios

files_changed:
  - src/features/session-tracker/capture/event-capture.ts (handleSessionIdle:316-421, resolveChildLifecycleRoute:717-740) — root cause locations
  - src/features/session-tracker/capture/child-backfiller.ts (backfillChildTurnsFromSdk:51-99) — n-turn mechanism that gets skipped
  - src/features/session-tracker/persistence/child-writer.ts (childFileExists:262-274, resolveWriteParent:155-162) — parentID resolution path that may mismatch
  - src/features/session-tracker/capture/last-message-capture.ts (handleMessagePartUpdated:143-182, onLastMessageUpdate callback) — live tracking that only updates frontmatter
  - src/features/session-tracker/initialization.ts (onLastMessageUpdate:152-166) — callback that only writes to frontmatter
