# Session Journal System — Handoff

**Date:** 2026-03-29T16:34+07:00
**Branch:** v2.9.5-detox-dev
**Status:** Context DEGRADED — 6+ rounds of failed fixes, user extremely frustrated

---

## What the User Wants

ONE append-only markdown file per orchestrator session. Subsessions embedded inline. Short file naming. Tool pruning. Concise context for continuity. This is an npm package installed at users' places across any project.

**Reference format:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/session-ses_2c9e.md` (11,363 lines, 10+ delegations — the gold standard)

---

## What's Broken (Evidence-Based)

### 1. File Naming — Wrong
- Current: `ses_2026-03-29T154947_implementation_hivemaker_ses_2c7370af1ffe0Th6nnlX4dIysI.json`
- Should be: `ses_2c7370af1ffe0Th6nnlX4dIysI.json` (SDK session ID directly)
- Root cause: `generateSessionId()` in `consolidated-writer.ts:154-167` creates semantic name, then `initSession():385` appends SDK ID

### 2. Tool Input — Shows Call ID Not Args
- Current markdown: `**Input:**` contains `call_da89d977952e4563b1e9b742`
- Should be: actual JSON args
- Root cause: `tool-execution-handler.ts:83` stores `action: input.callID` instead of `action: JSON.stringify(input.args)`
- NOTE: `input.args` IS available from SDK — it's just not being used

### 3. Tool Output — Shows Title Not Result
- Current markdown: `**Output:**` contains `Read config-groups.test.ts context` (the title)
- Should be: actual tool result content
- Root cause: `tool-execution-handler.ts:80` stores `content: output.title || input.tool` instead of `output.output`
- NOTE: `output.output` IS available from SDK

### 4. Agent/Model Attribution — "unknown"
- Current: `## Assistant (Assistant · unknown)`
- Should be: `## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 11.8s)`
- Root cause: `chat-message-handler.ts:64` hardcodes `model: 'unknown'`
- Model can be extracted from: `system.transform` injection payload (stored per-session)

### 5. Duration — Missing
- Current: no duration on any turn
- Should be: `11.8s`, `250.3s` etc
- Root cause: SDK doesn't provide duration, but CAN be measured between `tool.execute.before` (timestamp) and `tool.execute.after` (timestamp)

### 6. Noise Sections — Should Be Removed
- Current: `## Error`, `## Diagnostics`, `## Session Idle` sections everywhere
- Should be: absent — reference format has none of these
- Root cause: `markdown-writer.ts` TURN_LABELS maps these event types to output sections

### 7. Subsessions — Separate Files Instead of Embedded
- Current: each delegated sub-agent creates its own .md and .json file
- Should be: embedded inline in parent session via `**Tool: task**` with `<task_result>` wrapper
- Root cause: `session-resolver.ts:resolveOrCreate()` always creates new session files

### 8. Parent-Child Tracking — null Everywhere
- Current: `parentSessionId: null` in all sessions
- Should be: populated when sub-agents are delegated
- Root cause: SDK events for delegated agents don't populate `parentSessionId` in properties; `linkParentChildSessions()` in `event-handler.ts:118-148` exists but finds no data

### 9. Header — Too Many Fields
- Current: 12 fields (Session ID, Parent, Lineage, Purpose, Agent, Actors, Tools Used, Status...)
- Should be: 3 fields (Session ID, Created, Updated)
- Root cause: `initEventsMarkdown()` in `markdown-writer.ts:230-266` adds extra fields

---

## What the Gold Standard Looks Like

From `session-ses_2c9e.md`:

```markdown
# Phase 0 baseline verification

**Session ID:** ses_2c9e2a691ffeot94wojh6DWh6b
**Created:** 3/29/2026, 3:23:06 AM
**Updated:** 3/29/2026, 4:11:27 PM

---

## Assistant (Hiveminder · xiaomi/mimo-v2-pro:free · 11.8s)

_Thinking:_

{reasoning}

**Tool: bash**

**Input:**
```json
{"command": "ls -la", "description": "List files"}
```

**Output:**
```
{actual command output}
```

---

## User

{user message content}

---

## Assistant (Hivefiver · xiaomi/mimo-v2-pro:free · 250.3s)

_Thinking:_

{reasoning}

**Tool: task**

**Input:**
```json
{
  "description": "Investigate runtime dir writes",
  "prompt": "## Delegation Packet...",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_2c976019effeG2dmd2x2xquLYp

<task_result>
## Codebase Investigation Report
{full sub-agent output embedded here}
</task_result>
```

---
```

---

## Files to Fix

### Core (HIGH PRIORITY)
- `src/features/event-tracker/markdown-writer.ts` — header format, turn format, noise removal
- `src/features/event-tracker/paths.ts` — use SDK ID for filenames
- `src/features/event-tracker/consolidated-writer.ts` — remove generateSessionId, remove createSdkSymlink, use SDK ID
- `src/hooks/tool-execution-handler.ts` — fix tool input (use args), fix tool output (use output.output)
- `src/hooks/chat-message-handler.ts` — extract model from injection payload

### Secondary
- `src/hooks/event-handler.ts` — skip noise event types, fix parent-child linking
- `src/hooks/compaction-handler.ts` — keep (compaction is useful)
- `src/hooks/text-complete-handler.ts` — extract model info
- `src/features/session-journal/session-resolver.ts` — remove createSdkSymlink call
- `src/features/event-tracker/markdown-writer.test.ts` — update tests
- `src/features/event-tracker/paths.test.ts` — update tests

### DO NOT TOUCH
- `src/features/event-tracker/writers/session-writer.ts` — deprecated
- `src/features/event-tracker/writers/events-writer.ts` — deprecated
- `src/features/event-tracker/writers/diagnostics-writer.ts` — deprecated

---

## SDK Hook Data Available (What We Can Use)

| Hook | Provides | Currently Used |
|------|----------|----------------|
| `chat.message` | `{sessionID, agent?, message: {role, content}, parts}` | sessionID, content only |
| `tool.execute.before` | `{tool, sessionID, callID, args}` | tool, callID only — args IGNORED |
| `tool.execute.after` | `{tool, sessionID, callID, args, output: {title, output, metadata}}` | title only — output IGNORED |
| `event` | `{event: {type, properties}}` | partially used |
| `text.complete` | `{sessionID?, messageID, partID, text}` | text only |
| `session.compacting` | `{sessionID, context[], prompt?}` | context.length only |
| `system.transform` | `{sessionID?, system[]}` | stored but not used for model extraction |

---

## Session Groups Found (8 files in journey-events/)

**Chain 1 — Phase 1 Legacy Cleanup:**
- `ses_2c7884d` (hiveminder, 16 turns) — orchestrator
- `ses_2c7386e` (explore, 2 turns) — delegated read
- `ses_2c7370a` (hivemaker, 3 turns) — delegated fix
- `ses_2c73492` (hivemaker, 2 turns) — delegated fix
- `ses_2c73278` (explore, 1 turn) — FAILED

**Chain 2 — Session Journal Bug Investigation:**
- `ses_2c9e2a6` (hiveminder, 15 turns) — orchestrator
- `ses_2c72e0b` (explore, 3 turns) — delegated analysis
- `ses_2c72c02` (hiveminder, 1 turn) — FAILED

---

## Build/Test Commands

```bash
npx tsc --noEmit          # Type check
npm run build             # Compile to dist/
npm test                  # Full test suite
npx tsx --test src/features/event-tracker/markdown-writer.test.ts  # Single test
```

**Note:** 2 pre-existing tsc errors in `config-groups.test.ts` — unrelated to this work.

---

## Critical Rule

**This is an npm package.** It runs in ANY user's OpenCode installation. Changes must be backward-compatible, well-tested, and follow the SDK contract. No custom hacks.
