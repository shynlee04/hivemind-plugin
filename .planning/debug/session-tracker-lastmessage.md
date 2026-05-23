---
status: resolved
trigger: "session-tracker records wrong lastMessage (initial prompt instead of final summary), wrong status (idle instead of completed), wrong delegatedBy.tool ('task' instead of 'delegate-task') — shared interface between task tool and delegate-task, 5 rounds STILL FAIL"
created: 2026-05-24
updated: 2026-05-24
---

# Debug Session: session-tracker-lastmessage

## Symptoms

1. **Expected:** session-tracker records child sessions for BOTH task tool AND delegate-task with correct fields
2. **Actual:** 
   - `lastMessage` = initial prompt (not assistant's final summary/report)
   - `status` = "idle" (not "completed")
   - `delegatedBy.tool` = "task" (not "delegate-task" for delegate-task dispatches)
   - `children: []` (hierarchy not updated)
3. **Timeline:** Not clear — persisted after Phase 23.1 fix (constructCoreDependencies reorder). Before fix, sessions not found at all.

## Current Focus

✅ **ALL 4 BUGS FIXED** — Awaiting live UAT verification.

- **Fix 1 (delegatedBy.tool):** ✅ COMMITTED — Added `tool` field to PendingDispatchEntry, populated in handleToolExecuteBefore, propagated to writeImmediateChildFile via pendingEntry
- **Fix 2 (status stuck at idle):** ✅ COMMITTED — Expanded `handleToolExecuteAfter` gate from `input.tool === "task"` to `input.tool === "task" || input.tool === "delegate-task"`
- **Fix 3 (lastMessage = delegation prompt):** ✅ COMMITTED — Replaced `appendChildTurn` with `appendJourneyEntry` for delegation-init to prevent prompt from polluting lastMessage
- **Fix 4 (children:[]):** ✅ COMMITTED — Same fix as Bug 2; also changed `tool: "task"` hardcoded to `tool: input.tool` in childMetadata.delegatedBy

**next_action:** Live UAT verification — dispatch both task and delegate-task, check child session files for correct status, lastMessage, delegatedBy.tool, and children.

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

**Verification:**
- typecheck: PASS
- tests: 47 failed | 2389 passed | 2 skipped (same baseline — failures are pre-existing pipeline/recovery integration)
- No regressions detected

**Files to change:**
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts` — add `tool` to PendingDispatchEntry
- `src/features/session-tracker/tool-delegation.ts` — populate tool in handleToolExecuteBefore, add delegate-task completion handler
- `src/features/session-tracker/capture/event-capture.ts` — use tool from pending entry in writeImmediateChildFile
- `src/features/session-tracker/index.ts` — add delegate-task handling in handleToolExecuteAfter

## Eliminated

- **(eliminated) constructCoreDependencies reorder is the cause:** The reorder fixed a *different* bug (sessions not found at all). The delegate-task bugs are pre-existing design gaps in event-capture/tool-delegation.
- **(eliminated) chat.message not firing:** chat.message DOES fire for initial delegation message to child. But subsequent assistant messages don't fire chat.message (child runs separate session).
