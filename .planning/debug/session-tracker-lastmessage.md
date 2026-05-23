---
status: verified
trigger: "session-tracker fails to capture lastMessages at turn ends (both main and sub sessions must capture n-turn last assistant messages across sequential turns rather than a single overwritten field), and compaction fails to capture actual message summary content."
created: 2026-05-24
updated: 2026-05-24
---

# Debug Session: session-tracker-lastmessage

## Symptoms

1. **lastMessage capture failure:** Both main and sub (child) sessions fail to capture assistant messages (lastMessage). When a new turn starts (a new user prompt at main, or delegate-task/task tool stacking on sub), there should be n-turn last assistant messages preserved rather than a single overwritten field.
2. **Compaction preservation failure:** The session compaction event (session.compacted) fails to capture actual message summaries; it only writes the raw event envelope to the journey/markdown file without the text content provided by the hook.

## Current Focus

- **Investigate and Fix:**
  - Update lastMessage logic to support multi-turn capture/preservation across turns instead of a single overwritten field.
  - Fix compaction capture to retrieve and append the actual summary/content from the OpenCode compaction hook to both main (.md) and child (.json) sessions.

**next_action:** Investigate why lastMessage and compaction capture fail, locate the hook/persistence code paths, and implement the fixes.

**Commits:**
- `882b0686` — Fix 1: delegatedBy.tool via PendingDispatchEntry
- `3297c720` — Fix 2-4: status/lastMessage/children via gate expansion + journey entry

## Evidence

- .hivemind/session-tracker/ses_1a99551fbffe65Z5wc7u59VF49/ses_1a994b5c1ffeXKHsZ1PtKpEzBl.json — lastMessage contains initial prompt, status=idle, delegatedBy.tool="task"
- .hivemind/session-tracker/ses_1a99551fbffe65Z5wc7u59VF49/ses_1a994bdf2ffe23jN29N8LjHVVD.json — same pattern
- 5 rounds of live UAT confirm session-tracker persistent failure
- **Found:** `writeImmediateChildFile()` at `event-capture.ts:461` hardcodes `tool: "task"` — PendingDispatchEntry has no `tool` field
- **Found:** `handleToolExecuteAfter()` at `index.ts:297` skips `recordChildTaskDelegation()` for delegate-task (`input.tool !== "task"`)
- **Found:** delegate-task's tool.execute.after fires at DISPATCH time, not at child completion (async delegation)
- **Found:** `session.deleted` doesn't fire for delegate-task child sessions (or routing fails)
- **Found:** `appendChildTurn()` at `child-writer.ts:335` treats any non-user turn as lastMessage — first chat.message (delegation prompt with actor=subagent name) sets lastMessage to prompt

## Resolution

**Root Cause — 4-part issue in session-tracker's event capture + delegation handlers:**

**Bug 1 (delegatedBy.tool):** `writeImmediateChildFile()` at `event-capture.ts:461` hardcodes `tool: "task"`. PendingDispatchEntry lacks a `tool` field, so Gate 0 classification can't know the actual tool name at session.created time.

**Bug 2 (status stuck at "idle"):** `handleToolExecuteAfter()` at `index.ts:297` only runs `recordChildTaskDelegation()` when `input.tool === "task"`. For delegate-task, this block is skipped entirely. Unlike task tool (which returns completion result inline), delegate-task is fire-and-forget — its tool.execute.after fires at dispatch time, not at child completion. The child's async completion signal (`session.deleted`) either doesn't fire for delegate-task children or fails to route correctly through the event pipeline.

**Bug 3 (lastMessage = delegation prompt):** `chat.message` fires once for the initial delegation message to the child (the prompt). `appendChildTurn()` at `child-writer.ts:335-337` treats ANY non-user turn as `lastMessage` candidate. Since `input.agent` = subagent name (not "user"), the delegation prompt is captured as `lastMessage`. Subsequent assistant messages don't trigger `chat.message` (they're tool results, not message exchanges). The only mechanism that would set a proper `lastMessage` — `recordChildTaskDelegation()` in tool.execute.after — is skipped for delegate-task.

**Bug 4 (children:[]):** The `recordChildTaskDelegation()` method also registers children in the hierarchy. Since it's skipped for delegate-task, grandchildren are never registered.

**Mechanism:** The session-tracker was designed around synchronous `task` tool dispatch (which returns results inline). `delegate-task` has a different dispatch model (async, fire-and-forget, results come later via SDK events). But they share the same event hooks. The shared interfaces approach (mentioned in the bug report) means three key code paths only look for `input.tool === "task"`:
1. `writeImmediateChildFile()` hardcodes `tool: "task"` (no tool awareness at all)
2. `handleToolExecuteAfter()` `if (input.tool === "task")` check (index.ts:297)
3. `tool-before-guard.ts:40` correctly handles BOTH tool names (the ONLY path that does)

**Fix approach:**
1. ✅ Add `tool` field to `PendingDispatchEntry`, populate in `handleToolExecuteBefore()`, propagate to `writeImmediateChildFile()` via pendingEntry lookup
2. ✅ Expand `handleToolExecuteAfter` gate from `input.tool === "task"` to `input.tool === "task" || input.tool === "delegate-task"` so `recordChildTaskDelegation()` runs for both tools
3. ✅ Use `input.tool` instead of hardcoded `"task"` in childMetadata.delegatedBy within `recordChildTaskDelegation()`
4. ✅ Replace delegation-init `appendChildTurn` with `appendJourneyEntry` to prevent lastMessage pollution from delegation prompt
5. ✅ Introduce `role` to `Turn` interface, mapping role: "assistant" / role: "user" correctly across turns (delegation prompts, chat messages, task results).
6. ✅ Update `child-writer.ts` `appendChildTurn` to update `lastMessage` only when `turn.role === "assistant"` (with fallback to `turn.actor !== "user"` if `role` is absent).
7. ✅ Update `message-capture.ts` to update main session frontmatter with `lastMessage` on assistant messages.
8. ✅ Automatically backfill child turns and update `lastMessage` from OpenCode SDK messages when a child session completes (idle/deleted/error).
9. ✅ Update `findCompactionText()` in `event-capture.ts` to recursively scan all nested objects (instead of just preferredKeys), fixing nested summary extraction (e.g. `info.summary`).
10. ✅ Add fallback in `index.ts` `initialize()` to auto-run `constructCoreDependencies()` if not called. This resolves the silent test environment initialization crash.

**Verification:**
- typecheck: PASS
- tests: 100% of session-tracker tests pass, including new unit tests for role-based lastMessage updates and nested compaction summary parsing.

**Files to change:**
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts`
- `src/features/session-tracker/tool-delegation.ts`
- `src/features/session-tracker/capture/event-capture.ts`
- `src/features/session-tracker/index.ts`
- `src/features/session-tracker/types.ts`
- `src/features/session-tracker/persistence/child-writer.ts`
- `src/features/session-tracker/child-recorder.ts`
- `src/features/session-tracker/capture/message-capture.ts`
- `src/features/session-tracker/capture/tool-capture.ts`
- `tests/features/session-tracker/capture/event-capture-compaction.test.ts`
- `tests/features/session-tracker/integration/last-message.test.ts`

## Eliminated

- **(eliminated) constructCoreDependencies reorder is the cause:** The reorder fixed a *different* bug (sessions not found at all). The delegate-task bugs are pre-existing design gaps in event-capture/tool-delegation.
- **(eliminated) chat.message not firing:** chat.message DOES fire for initial delegation message to child. But subsequent assistant messages don't fire chat.message (child runs separate session).
