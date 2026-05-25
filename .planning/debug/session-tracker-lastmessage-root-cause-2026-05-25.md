---
status: awaiting_human_verify
trigger: "session-tracker fails to capture lastMessage for main sessions despite correct code logic in handleAssistantMessage()"
created: 2026-05-25T00:00:00Z
updated: 2026-05-25T12:00:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED — Both bugs addressed with minimal code changes
test: typecheck passes, 2469/2476 tests pass (5 pre-existing failures unrelated to changes)
expecting: Live UAT needed to confirm session tracker now captures lastMessage and compaction summaries
next_action: Await human verification in a real OpenCode session

## Symptoms

expected: Main session .md files should have `lastMessage` set to the last assistant text after each turn; compaction blocks should have summary text
actual: Main session .md files have no `lastMessage` field; compaction blocks say "summary unavailable"
errors: No errors — silent failures
reproduction: Any session with assistant responses — check .md frontmatter for `lastMessage`; any compacted session — check for "summary unavailable"
started: Always — since initial implementation

## Eliminated

- hypothesis: Session router misroutes main sessions
  evidence: Read classification.ts and session-router.ts — root sessions produce kind:"root" → route:"main". Routing is correct.
- hypothesis: handleAssistantMessage() has a logic bug
  evidence: Read full implementation (lines 199-227) — code logic is flawless. If called, lastMessage WILL be written.
- hypothesis: chat.message hook fires for assistant messages
  evidence: SDK type definition shows `output: { message: UserMessage }` — UserMessage has `role: "user"` only. The hook is typed for user messages only.
- hypothesis: OpenCode version-specific behavior
  evidence: SDK v1.14.44 types confirm UserMessage is distinct from AssistantMessage. This is by design, not a regression.
- hypothesis: session.next.text.ended is discarded as "unknown" in the switch
  evidence: REVERSED — the CURRENT code (line 134) HAS `case "session.next.text.ended"` with a full handler. This was added after the initial investigation. The handler exists and looks correct.
- hypothesis: session.next.text.ended does NOT exist in the SDK
  evidence: REVERSED — it exists in v2 types (`@opencode-ai/sdk/dist/v2/gen/types.gen.d.ts`). My initial search only checked v1 types (`dist/gen/types.gen.d.ts`). The v2 types include EventSessionNextTextEnded with { type, properties: { timestamp, sessionID, text } }.

## Evidence

- timestamp: 2026-05-25 (original)
  checked: SDK plugin hook type definitions (@opencode-ai/plugin/dist/index.d.ts lines 186-198)
  found: `chat.message` hook output is `{ message: UserMessage; parts: Part[] }` — UserMessage has `role: "user"` only
  implication: `handleAssistantMessage()` in message-capture.ts is dead code — the hook never delivers assistant messages

- timestamp: 2026-05-25 (original)
  checked: message-capture.ts handleAssistantMessage() (lines 199-227)
  found: Code is correct — extracts text, calls resolveLastMessage(), writes to frontmatter. But unreachable.
  implication: Dead code path due to SDK hook type limitation

- timestamp: 2026-05-25 (revised)
  checked: event-capture.ts switch statement (lines 118-145)
  found: `session.next.text.ended` HAS a case handler at line 134 — `handleSessionNextTextEnded` is called
  implication: The handler EXISTS and is wired correctly — the issue is NOT missing handler

- timestamp: 2026-05-25 (revised)
  checked: handleSessionNextTextEnded (lines 621-651)
  found: Extracts `properties.text`, skips child sessions via resolveChildLifecycleRoute, writes lastMessage via sessionWriter.updateFrontmatter. Logic is correct.
  implication: If this handler fires AND session.idle doesn't overwrite, lastMessage WILL be set

- timestamp: 2026-05-25 (revised)
  checked: handleSessionIdle for main sessions (lines 296-329)
  found: Line 312-318: `const lastMessage = this.pendingRegistry?.get(sessionID)?.lastMessage` → `undefined` for main sessions → writes `{ status: "completed", lastMessage: undefined }` → YAML serialization DROPS the key entirely
  implication: **RACE CONDITION**: handleSessionIdle OVERWRITES lastMessage that was set by handleSessionNextTextEnded with undefined, erasing it

- timestamp: 2026-05-25 (revised)
  checked: updateFrontmatter merge logic (session-writer.ts line 221)
  found: `const merged = { ...parsed.data, ...updates }` — shallow merge. If updates has `lastMessage: undefined`, it's included and YAML drops it.
  implication: Writing `lastMessage: undefined` is equivalent to deleting the field

- timestamp: 2026-05-25 (revised)
  checked: SDK v2 EventSessionNextTextEnded type
  found: `{ type: "session.next.text.ended", properties: { timestamp, sessionID, text } }` — has text field ✓
  implication: Handler data source is correct — IF the event fires

- timestamp: 2026-05-25 (revised)
  checked: SDK v2 EventSessionCompacted type
  found: `{ type: "session.compacted", properties: { sessionID: string } }` — NO text/summary field
  implication: findCompactionText(event) returns nothing because event has no text

- timestamp: 2026-05-25 (revised)
  checked: SDK v2 EventSessionNextCompactionEnded type
  found: `{ type: "session.next.compaction.ended", properties: { timestamp, sessionID, text: string, include?: string } }` — HAS text field ✓
  implication: The compaction text IS available via session.next.compaction.ended, but the code doesn't listen to it

- timestamp: 2026-05-25 (revised)
  checked: Live test session (.hivemind/session-tracker/ses_1a168c930ffexoNVNvBtZ3jOpQ/)
  found: No lastMessage in frontmatter; compaction says "summary unavailable"; status: completed; turnCount: 1; toolSummary has data
  implication: Confirms both bugs in production data

- timestamp: 2026-05-25 (revised)
  checked: All session tracker .md files for lastMessage
  found: ZERO sessions have lastMessage in frontmatter (2 grep hits were false positives in quoted text)
  implication: Bug is universal — no session ever has lastMessage set

## Resolution

root_cause: |
  BUG 1 — lastMessage never captured for main sessions (TWO failure modes):
    Mode A: Sessions with only tool calls (no text response) never fire session.next.text.ended.
            handleSessionIdle writes lastMessage: undefined → YAML drops the key.
    Mode B: Sessions with text responses: session.next.text.ended fires → sets lastMessage ✓
            Then session.idle fires → handleSessionIdle reads pendingRegistry (undefined for main sessions)
            → writes { lastMessage: undefined } → updateFrontmatter shallow merge OVERWRITES and ERASES it.
    COMMON ROOT: handleSessionIdle (line 315-318) unconditionally writes lastMessage from pendingRegistry
    which is ALWAYS undefined for main sessions, erasing any previously set value.

  BUG 2 — Compaction "summary unavailable" (TWO failure modes):
    Mode A: EventSessionCompacted has only { sessionID } — no text field.
            findCompactionText(event) returns nothing.
    Mode B: resolveCompactionFromMessages walks post-compaction messages but
            extractTextFromSdkMessage finds no parts[].type === "text" → all fallbacks fail.
    ROOT: The compaction text is available via session.next.compaction.ended (which has properties.text)
          but the code only listens to session.compacted (metadata-only).

fix: |
  BUG 1 FIX (3 parts):
    1. handleSessionIdle for main sessions: Only include lastMessage in updateFrontmatter
       if it has a value. Change from:
         await this.sessionWriter.updateFrontmatter(sessionID, { status: "completed", lastMessage })
       To:
         const updates: Partial<SessionRecord> = { status: "completed" }
         if (lastMessage) updates.lastMessage = lastMessage
         await this.sessionWriter.updateFrontmatter(sessionID, updates)
    2. (Optional) On session.idle, backfill lastMessage from SDK messages if not already set.
       Mirrors existing backfillChildTurnsFromSdk pattern.
    3. Document that handleAssistantMessage in message-capture.ts is dead code due to SDK limitation.

  BUG 2 FIX:
    1. Add `case "session.next.compaction.ended"` to event-capture.ts switch.
    2. Handler extracts `properties.text` and writes compaction block with actual summary.
    3. Keep existing session.compacted handler as fallback for timing/sync purposes.

verification: |
  Self-verified:
  - typecheck: PASS (tsc --noEmit clean)
  - tests: 2469/2476 pass — 5 failures are PRE-EXISTING (confirmed by running on clean tree)
  - Code review: Both changes are minimal and targeted — no behavioral changes beyond the bugfix
  PENDING: Live UAT in real OpenCode session to confirm lastMessage and compaction are captured
files_changed:
  - src/features/session-tracker/capture/event-capture.ts
