# Event Tracker — Hierarchical Diagnostic Logging Design

**Date:** 2026-03-23
**Status:** Draft — Awaiting user authorization
**Scope:** Replace scattered `.hivemind/error-log/` (96 files across 15 sessions) with hierarchical, append-only, human-readable + machine-parsable event tracking

---

## Problem Statement

Current diagnostic export produces one file per assistant turn:
```
.hivemind/error-log/
  ses_2e5b7f122ffeV7HH1SjG4KMLQ0-1774262429415.md  ← 415 bytes
  ses_2e5b7f122ffeV7HH1SjG4KMLQ0-1774262444859.md  ← 380 bytes
  ...96 files across 15 sessions
```

**Issues:**
1. **File-per-turn chaos** — no hierarchy, 96+ files for 1.5 hours of usage
2. **No cross-session linkage** — parent↔sub-session relationships invisible
3. **No turn numbering** — files are anonymous timestamps
4. **Missing injection payload** — store cleared between hook calls
5. **No compaction tracking** — `session.compacted` event not logged
6. **No tool call summaries** — only assistant text captured
7. **No machine-parsable index** — grep/glob/regex inefficient

---

## Design

### Directory Structure

```
.hivemind/
  event-log/                          ← Replaces error-log/
    index.md                          ← Master session index (flat table, links)
    {sessionId}/                      ← One folder per session
      events.md                       ← Semantic event log (append-only, .md)
      diagnostics.log                 ← Verbose log (append-only, one-line-per-event)
      injection.md                    ← Injection payload history (append-only)
      delegation.md                   ← Delegation create/close events
```

**Total files per session: 4** (down from N+1 per turn)

---

### 1. Master Session Index — `event-log/index.md`

```markdown
# Session Index

| Session | Agent | Purpose | Turns | Created | Updated | Status | Parent | Children |
|---------|-------|---------|-------|---------|---------|--------|--------|----------|
| ses_2e5b | hiveminder | planning | 42 | 2026-03-23 18:00 | 2026-03-23 18:52 | active | — | ses_2e5b_sub1, ses_2e5c42a |
| ses_2e5b_sub1 | hivemaker | implementation | 6 | 2026-03-23 18:01 | 2026-03-23 18:03 | done | ses_2e5b | — |
```

**Update strategy:** On each turn completion, find the session row and update `Turns`, `Updated`, `Status`.

---

### 2. Session Events — `event-log/{sessionId}/events.md`

Append-only. Each turn is a structured markdown section with YAML frontmatter.

```markdown
---
session_id: ses_2e5b
created: 2026-03-23T18:00:00Z
updated: 2026-03-23T18:52:00Z
agent: hiveminder
purpose: planning
trajectory: traj_abc
parent_session: none
child_sessions: [ses_2e5b_sub1]
status: active
turns: 42
---

# Events

## Turn 001 — 2026-03-23T18:00:00Z [user:new]
> can you tell me the project state tons of documents without any clean up

## Turn 002 — 2026-03-23T18:00:05Z [assistant:hiveminder]
skills_injected: use-hivemind-delegation, hivemind-gatekeeping-delegation, git-continuity-memory, hivemind-atomic-commit
session_role: orchestrate

> The user is asking about the project state - they want to understand the current state of documents...

### Tool: glob
args: pattern="**/*.md"
result: 100 files found

### Tool: bash
args: command="ls -la"
result: 94 entries

## Turn 003 — 2026-03-23T18:01:30Z [user:continue]
> delegating cleanup to hivemaker

## Turn 004 — 2026-03-23T18:01:35Z [delegation:to hivemaker]
sub_session: ses_2e5b_sub1
scope: Consolidate duplicate audit folders
success_criteria: Complete file listing, duplicate analysis, recommendations

## Turn 005 — 2026-03-23T18:03:00Z [delegation:from ses_2e5b_sub1]
sub_session: ses_2e5b_sub1
status: completed
duration: 145s
artifacts: [src/sdk-supervisor/diagnostic-log.ts]
result_summary: File listing from both folders, duplicate analysis complete

## Turn 006 — 2026-03-23T18:03:05Z [assistant:hiveminder]
skills_injected: ...
session_role: orchestrate

> I see the session. The plugin IS running...

## Turn 007 — 2026-03-23T18:04:00Z [compaction]
strategy: summary
lines_before: 45000
lines_after: 35000
preserved: [contract_id, task_ids]

## Turn 008 — 2026-03-23T18:05:00Z [user:continue]
> restart the service

## Turn 009 — 2026-03-23T18:05:30Z [assistant:hiveminder]
skills_injected: ...
session_role: orchestrate

> Restarting OpenCode...
```

**Pruning rules:**
- Assistant text: first 500 chars (summary, not full response)
- Tool outputs: args + result summary (first 200 chars of result)
- Thinking blocks: suppressed entirely
- Tool calls: only logged when they produce meaningful output
- No duplicate tool calls — if same tool + args used twice in same turn, log once

---

### 3. Diagnostic Log — `event-log/{sessionId}/diagnostics.log`

Append-only. One line per event. Grep-optimized.

```
[2026-03-23T18:00:00.000Z] T001 user:new hiveminder> can you tell me the project state...
[2026-03-23T18:00:05.000Z] T002 assistant:hiveminder role:orchestrate skills:4 inst:3
[2026-03-23T18:00:05.000Z] T002 tool:glob pattern="**/*.md" -> 100 files
[2026-03-23T18:00:09.000Z] T002 tool:ls .hivemind/ -> 7 dirs, 4 files
[2026-03-23T18:00:15.000Z] T002 assistant:stop len:5000
[2026-03-23T18:01:30.000Z] T003 user:continue delegating cleanup to hivemaker
[2026-03-23T18:01:35.000Z] T004 delegation:to hivemaker scope:"Consolidate duplicate audit folders" sub:ses_2e5b_sub1
[2026-03-23T18:03:00.000Z] T005 delegation:from ses_2e5b_sub1 status:completed dur:145s artifacts:3
[2026-03-23T18:03:05.000Z] T006 assistant:stop len:2000
[2026-03-23T18:04:00.000Z] T007 compaction strategy:summary before:45000 after:35000
```

**Grep patterns:**
- `grep "T002"` — all events in turn 2
- `grep "delegation:"` — all delegation events
- `grep "compaction"` — all compaction events
- `grep "hivemaker"` — all events involving hivemaker agent
- `grep "user:"` — all user turns

---

### 4. Injection Log — `event-log/{sessionId}/injection.md`

Append-only. Log what `messages.transform` injects per user turn.

```markdown
# Injection Log — ses_2e5b

## Turn 001 — 2026-03-23T18:00:00Z
agent: hiveminder
purpose: planning
session_state: fresh
session_role: orchestrate
variant: new
skills: [use-hivemind-delegation, hivemind-gatekeeping-delegation, git-continuity-memory, hivemind-atomic-commit]

## Turn 003 — 2026-03-23T18:01:30Z
agent: hiveminder
purpose: planning
session_state: ongoing
session_role: orchestrate
variant: continue
skills: [use-hivemind-delegation, hivemind-gatekeeping-delegation, git-continuity-memory, hivemind-atomic-commit]
```

---

### 5. Delegation Log — `event-log/{sessionId}/delegation.md`

Append-only. Track parent↔sub-session relationships.

```markdown
# Delegation Log — ses_2e5b

## Turn 004 — 2026-03-23T18:01:35Z → CREATED
sub_session: ses_2e5b_sub1
delegated_to: hivemaker
scope: Consolidate duplicate audit folders in docs directory
constraints: Report only, do not make changes

## Turn 005 — 2026-03-23T18:03:00Z ← RETURNED
sub_session: ses_2e5b_sub1
status: completed
duration: 145s
artifacts: [src/sdk-supervisor/diagnostic-log.ts]
result: File listing from both folders, duplicate analysis complete

## Turn 010 — 2026-03-23T18:10:00Z → CREATED
sub_session: ses_2e5c42a
delegated_to: hivemaker
scope: Remove console.log from messages-transform-adapter.ts
constraints: Preserve injection logic, remove debug statements

## Turn 011 — 2026-03-23T18:15:00Z ← RETURNED
sub_session: ses_2e5c42a
status: completed
duration: 300s
artifacts: [src/plugin/messages-transform-adapter.ts]
result: Console.log statements removed. Type-check passed.
```

---

### Module Architecture

```
src/feature/event-tracker/
├── index.ts                    ← Barrel: export writer, formatter, types
├── types.ts                    ← Event types, turn types, log entry types
├── session-writer.ts           ← Write to per-session event/log/injection/delegation files
├── event-classifier.ts         ← Classify incoming data into event types
├── index-writer.ts             ← Maintain master session index
├── formatter.ts                ← Format as markdown section or log line
└── hooks/
    ├── transform-handler.ts    ← Wires to messages.transform
    ├── text-complete-handler.ts ← Wires to text.complete
    ├── event-hook-handler.ts   ← Wires to event hook
    └── compaction-handler.ts   ← Wires to session.compacting
```

**Standalone rule:** The `src/feature/event-tracker/` module does NOT import from `@opencode-ai/sdk`. It uses:
- `node:fs/promises` for file I/O
- `node:path` for path resolution
- Its own types (no SDK types)

The plugin hooks in `src/plugin/opencode-plugin.ts` import from `src/feature/event-tracker/` and pass data to it. The event tracker is a pure file-writing module.

---

### Hook Integration Points

| Hook | Source | Target | Data |
|------|--------|--------|------|
| `messages.transform` | `messages-transform-adapter.ts` | `transform-handler.ts` | injection payload → `injection.md`, `events.md` |
| `text.complete` | `opencode-plugin.ts` | `text-complete-handler.ts` | assistant text, tool calls → `events.md`, `diagnostics.log` |
| `event` | `event-handler.ts` | `event-hook-handler.ts` | session start/stop, tool calls, commands → `events.md`, `diagnostics.log` |
| `session.compacting` | `compaction-adapter.ts` | `compaction-handler.ts` | compaction state → `events.md`, `diagnostics.log` |

---

### File Operations

| Operation | Strategy |
|-----------|----------|
| Create session folder | `mkdir -p` on first event for session |
| Append to events.md | Read last turn number, increment, append section |
| Append to diagnostics.log | `fs.appendFile` with timestamped line |
| Update session header | `fs.readFile` → replace YAML frontmatter → `fs.writeFile` |
| Update master index | `fs.readFile` → find row → update fields → `fs.writeFile` |
| Cleanup old logs | Delete `.hivemind/error-log/` after migration |

---

### Migration Plan

1. Create `.hivemind/event-log/` structure
2. For each existing `.hivemind/error-log/{sessionId}-*.md`, parse and group by sessionId
3. Create per-session folders and `events.md` with Turn entries
4. Delete `.hivemind/error-log/` after migration
5. Remove `src/sdk-supervisor/diagnostic-log.ts` and its export
6. Wire new event tracker module to plugin hooks

---

## Verification

After implementation:
1. `npx tsc --noEmit` passes
2. New session creates `.hivemind/event-log/{sessionId}/events.md`
3. Assistant completion appends turn entry with tool calls
4. Delegation events show parent↔child linkage
5. Master index shows all sessions with turns/status
6. Diagnostic log greppable for turn numbers and events

---

## Decision Points

1. **Should `.hivemind/error-log/` be deleted or archived?**
   Recommendation: Delete after migration — the new system is strictly better.

2. **Should `.hivemind/session-inspection/` be migrated too?**
   Recommendation: Keep separate for now — it serves a different purpose (purification commands).

3. **Should the master index be auto-updated on every turn or batched?**
   Recommendation: Update on every assistant completion — it's a single row update, cheap.

4. **Should sub-sessions inherit parent session's delegation.md?**
   Recommendation: No — each session has its own delegation.md. The master index connects them.
