# Phase 23.2: Session-Tracker Bugfix — Unified task/delegate-task

## Overview

Phase 23.1 investigation confirmed 5 bugs in the session-tracker feature, all sharing a root cause: the code was written exclusively for the `task` tool and never adapted for `delegate-task`. This phase fixes all 5 bugs to ensure the session-tracker correctly captures assistant text, compaction summaries, tool attribution, hierarchy manifest entries, and actor metadata for BOTH `task` and `delegate-task` delegation paths.

## Requirements

### REQ-23.2-01: Assistant text extraction handles all OpenCode part types

**EARS:** The system SHALL extract assistant text content from `chat.message` hook events regardless of which part type OpenCode uses to represent text content.

**Bug:** Bug 1 (HIGH) — assistant text responses missing from main .md

**Code path:** `src/features/session-tracker/capture/message-capture.ts:316-322` (`extractTextContent`)

**Root cause:** `extractTextContent()` filters parts exclusively for `p.type === "text"`. If OpenCode uses a different part schema, the function returns an empty string which is falsy at `content || undefined` (line 214) and skipped at `session-writer.ts:149` (`if (content)`).

**Acceptance criteria:**
- [ ] `extractTextContent()` handles at minimum: `p.type === "text"` with `p.text`, `p.type === "text"` with `p.content`, and any other part types observed in live OpenCode output
- [ ] When no text can be extracted from any part type, the function logs a diagnostic warning (not silent skip)
- [ ] Main session `.md` file contains assistant text for every assistant turn in a live session
- [ ] Existing tests for `extractTextContent` continue to pass
- [ ] New test cases cover: `text` part with `.text` field, `text` part with `.content` field, unknown part type (graceful skip with warning)

**Test:**
```
Given a chat.message event with assistant parts of various types
When extractTextContent processes the event
Then text content is extracted from all recognized part schemas
And unrecognized parts produce a diagnostic log, not a crash
```

---

### REQ-23.2-02: Compaction writes human-readable summary, not raw event JSON

**EARS:** The system SHALL write a human-readable compaction summary to the session `.md` file, sourced from the session's message history, rather than the raw event envelope.

**Bug:** Bug 2 (MEDIUM) — compaction only writes raw event envelope

**Code path:** `src/features/session-tracker/capture/event-capture.ts:612-626` (`renderCompactionContext`), `:634-652` (`findCompactionText`)

**Root cause:** The OpenCode `session.compacted` event contains only metadata (`sessionID`, `timestamp`), not the actual compact summary text. `findCompactionText()` searches event payload for preferred keys, finds nothing, and falls back to `stringifyEvent(event)` which dumps raw JSON.

**Acceptance criteria:**
- [ ] After receiving `session.compacted` event, the system reads the session's message history via `client.session.messages()` to extract the compact summary from the last assistant message
- [ ] The compaction block in the `.md` file contains plain-text summary content, not raw JSON
- [ ] If message history is unavailable, the system writes a fallback note (e.g., "[Compaction occurred but summary unavailable]") instead of raw JSON
- [ ] Existing event processing pipeline is not disrupted
- [ ] New test covers: session.compacted event → message history read → summary extraction → .md write

**Test:**
```
Given a session.compacted event with only metadata (no summary text)
When handleSessionCompacted processes the event
Then the system reads session.messages() to find the compact summary
And writes the summary text to the .md file, not raw JSON
And if messages() fails, writes a fallback note instead of raw JSON
```

---

### REQ-23.2-03: Tool attribution preserved across race condition for delegate-task

**EARS:** The system SHALL correctly attribute the tool name for delegated child sessions even when the `session.created` event arrives before the pending registry has been updated with the child session ID.

**Bug:** Bug 3 (MEDIUM) — delegatedBy.tool = "task" for delegate-task dispatch

**Code path:**
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts:109` (key: `call:{callID}`)
- `src/features/session-tracker/persistence/pending-dispatch-registry.ts:160-170` (`get()` fallback)
- `src/features/session-tracker/capture/event-capture.ts:453,472` (`writeImmediateChildFile`)

**Root cause:** Race condition. Pending dispatch is registered with key `call:{callID}` at PreToolUse time. When `session.created` fires, `get(childSessionID)` tries `dispatches.get(childID)` and `dispatches.get('call:{childID}')` — but the actual key is `call:{callID}` (a different value). If async polling hasn't called `updateWithChildID()` yet, lookup returns `undefined` → tool defaults to `"task"`.

**Acceptance criteria:**
- [ ] When `writeImmediateChildFile()` receives a `session.created` event and direct child-ID lookup fails, the system falls back to searching the pending registry by parent session ID using the existing `byParent` reverse index
- [ ] Tool attribution for `delegate-task` dispatches shows `"delegate-task"` (not `"task"`) in the hierarchy manifest and child `.md` file
- [ ] Tool attribution for `task` dispatches continues to show `"task"` (no regression)
- [ ] The fallback lookup is bounded (single search, no infinite loop or polling)
- [ ] New test covers: session.created arrives before updateWithChildID → fallback by parent → correct tool name

**Test:**
```
Given a pending dispatch registered with call:{callID} for tool "delegate-task"
And session.created fires with childID before updateWithChildID is called
When writeImmediateChildFile processes the event
Then the system falls back to searching by parent session ID
And finds the pending entry with tool "delegate-task"
And writes tool: "delegate-task" to the child metadata
```

---

### REQ-23.2-04: Hierarchy manifest populated for all delegation paths

**EARS:** The system SHALL add child entries to `hierarchy-manifest.json` for both `task` and `delegate-task` delegation paths.

**Bug:** Bug 4 (HIGH) — hierarchy-manifest.json missing delegate-task child

**Code path:**
- `src/features/session-tracker/persistence/hierarchy-manifest.ts:62-94` (`addChild` — defined but never called)
- `src/features/session-tracker/persistence/hierarchy-manifest.ts:107-121` (`updateChildStatus` — called but no-ops on missing entries)
- `src/features/session-tracker/tool-delegation.ts:303` (`sessionIndexWriter.addChild` IS called, but `manifestWriter.addChild` is NOT)
- `src/features/session-tracker/capture/event-capture.ts` (no `manifestWriter.addChild` call anywhere)

**Root cause:** `manifestWriter.addChild()` is defined at hierarchy-manifest.ts:62-94 but is **never called** anywhere in the codebase. Only `manifestWriter.updateChildStatus()` is called (4 locations), which silently no-ops when the child isn't found. Meanwhile, `sessionIndexWriter.addChild()` IS called, so `session-continuity.json` gets the child but `hierarchy-manifest.json` does not.

**Acceptance criteria:**
- [ ] `manifestWriter.addChild()` is called in `recordChildTaskDelegation()` immediately after the existing `sessionIndexWriter.addChild()` call at tool-delegation.ts:303
- [ ] `manifestWriter.addChild()` is called in `writeImmediateChildFile()` (event-capture.ts) when a new child session is detected via `session.created` event
- [ ] `hierarchy-manifest.json` contains entries for all child sessions regardless of delegation tool (`task` or `delegate-task`)
- [ ] `manifestWriter.updateChildStatus()` continues to work for status transitions (no regression)
- [ ] New test covers: delegation via delegate-task → hierarchy-manifest.json has child entry with correct metadata

**Test:**
```
Given a root main session with a child dispatched via delegate-task
When the delegation is recorded
Then hierarchy-manifest.json contains a child entry for the child session
And the entry has delegatedBy: "delegate-task", correct depth, and status: "active"
And session-continuity.json also has the child entry (existing behavior preserved)
```

---

### REQ-23.2-05: Actor field populated from correct arg key for both delegation tools

**EARS:** The system SHALL extract the agent name from the correct tool argument key, supporting both `args.subagent_type` (task tool) and `args.agent` (delegate-task tool).

**Bug:** Bug 5 (LOW) — actor: "unknown" for delegate-task children

**Code path:** `src/features/session-tracker/tool-delegation.ts:237`

**Root cause:** `recordChildTaskDelegation()` extracts `subagentType` from `args.subagent_type` (the `task` tool's argument key). The `delegate-task` tool uses `args.agent`. When dispatched via `delegate-task`, `args.subagent_type` is `undefined` → defaults to `"unknown"` → propagated to `actor` field at line 337.

**Acceptance criteria:**
- [ ] The subagentType extraction at tool-delegation.ts:237 checks BOTH `args.subagent_type` and `args.agent` (fallback order: `args.subagent_type` → `args.agent` → `"unknown"`)
- [ ] Actor field shows the actual agent name (not "unknown") for delegate-task child sessions
- [ ] Actor field continues to show correct agent name for task tool dispatches (no regression)
- [ ] New test covers: delegation with `args.agent` (no `args.subagent_type`) → actor shows agent name, not "unknown"

**Test:**
```
Given a delegate-task dispatch with args.agent = "hm-debugger" and no args.subagent_type
When recordChildTaskDelegation processes the dispatch
Then subagentType is extracted as "hm-debugger" (from args.agent fallback)
And actor field in session metadata is "hm-debugger", not "unknown"
```

---

## Dependencies

- **Phase 23.1** (COMPLETE) — investigation and root cause diagnosis
- **Phase 21** (session-tracker design fix) — architecture foundation
- **Phase 13** (session-tracker defects) — prior bugfix round

## Out of Scope

- Steps 2-4 from original Phase 23 scope (completion notification, re-activation flow, authority inheritance)
- Phase 24-38 documentation debts
- Architecture changes to the pending-dispatch-registry keying scheme (fix uses fallback, not re-architecture)
- OpenCode SDK changes (we adapt to existing hook event shapes, not change them)
- PTY/background-command integration (separate phase roadmap)

## UAT Verification

Each requirement is verified by running a live OpenCode session with both `task` and `delegate-task` delegation, then inspecting the session-tracker output files:

### REQ-23.2-01 UAT
1. Start a root session, send a message that produces an assistant response
2. Check root session `.md` file — assistant text must appear under the assistant turn block
3. Run via both normal chat and subagent delegation — both must show assistant text

### REQ-23.2-02 UAT
1. Start a session, produce enough turns to trigger compaction (or simulate `session.compacted` event)
2. Check `.md` file — compaction block must contain plain-text summary, not raw JSON
3. If summary unavailable, block must contain fallback note, not raw JSON

### REQ-23.2-03 UAT
1. Dispatch a child session via `delegate-task`
2. Check child session `.md` file and `hierarchy-manifest.json` — `delegatedBy.tool` must be `"delegate-task"`, NOT `"task"`
3. Repeat with `task` tool — must still show `"task"` (no regression)

### REQ-23.2-04 UAT
1. Dispatch a child session via `delegate-task`
2. Check `hierarchy-manifest.json` in root session directory — must contain a child entry with correct metadata
3. Repeat with `task` tool — must also populate hierarchy-manifest.json
4. Verify `session-continuity.json` still has entries (existing behavior preserved)

### REQ-23.2-05 UAT
1. Dispatch a child session via `delegate-task` with a named agent (e.g., `gsd-debugger`)
2. Check child session metadata — `actor` field must be the agent name (e.g., `"gsd-debugger"`), NOT `"unknown"`
3. Repeat with `task` tool — must still show correct agent name (no regression)

## Cross-Regression Check

After all 5 fixes, run the full test suite (`npm test`) and typecheck (`npm run typecheck`) to ensure no regressions. The session-tracker has existing tests in `tests/lib/` that must continue to pass.
