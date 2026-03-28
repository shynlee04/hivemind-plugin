# ADR-018: Session Journey Architecture

**Date:** 2026-03-29
**Status:** proposed
**Supersedes:** Partial overlap with ADR-017 (session/v3 schema)
**Specs:** SPEC-2026-03-25-001 (R1-R9), session-journal-users-prompts.md (new requirements)

---

## Context

### Problem Landscape

Three overlapping subsystems produce session data, each writing to a different directory with a different format:

| Subsystem | Output Directory | Format | Status |
|-----------|-----------------|--------|--------|
| `event-tracker/consolidated-writer.ts` | `.hivemind/sessions/{id}/` | JSON (session/v2, v3) | Active, skeleton data |
| `sdk-supervisor/session-inspection.ts` | `.hivemind/session-inspection/{id}/` | Markdown + JSON command | Active, legacy |
| `sdk-supervisor/diagnostic-log.ts` | `.hivemind/error-log/` | Markdown | Active, deprecated |

### Current State (Evidence from Code)

1. **Skeleton sessions**: `consolidated-writer.ts` creates sessions with `agent="unknown"`, `userMessage=""`, `toolCallCount=0` because the handlers that would populate these fields are either not wired or write empty strings.

2. **Handler gap**: 5 handler files exist, but only 2 are wired in `opencode-plugin.ts`:
   - `text-complete-handler.ts` → wired (via `experimental.text.complete`)
   - `compaction-handler.ts` → wired (via `experimental.session.compacting`)
   - `chat-message-handler.ts` → EXISTS but NOT wired in plugin
   - `tool-execution-handler.ts` → EXISTS but NOT wired in plugin
   - `event-handler.ts` → wired (via `event` hook), but only `session.idle` branch writes to consolidated session

3. **Legacy still active**: `writeDiagnosticLog` and `upsertSessionInspectionExport` are called in the `experimental.text.complete` hook handler, writing to the old `error-log/` and `session-inspection/` directories.

4. **Session ID resolution duplicated 5x**: Every handler independently implements the `findSessionBySdkId → loadSession → initSession` pattern.

5. **Two output formats coexist**: `consolidated-writer.ts` (JSON) and `markdown-writer.ts` (markdown events.md) operate in parallel but are not coordinated.

### Requirements Landscape

**Prior Spec (R1-R9):**
- R1: Single consolidated file per session (JSON)
- R2: Semantic naming `ses_<ISO>_<purpose>_<agent>.json`
- R3: User message capture via `chat.message`
- R4: Turn-based structure
- R5: Sub-session linking
- R6: Tool invocation tracking via `tool.execute.after`
- R7: Counter accuracy (increment, not hardcode)
- R8: Legacy cleanup

**New Requirements (session-journal-users-prompts.md):**
- Journey-events markdown format with TOC, actors, tool batches, artifacts
- Event subscription schema (12+ event types listed)
- Clean code restructure into `features`, `tools`, `hooks`, `runtime-entry`, etc.
- Error-logs parallel subfolder
- JSON companion alongside markdown

---

## Decision

### D1: Dual-Output Architecture (Markdown + JSON Companion)

Each session produces TWO files in a session directory:

```
.hivemind/sessions/
  journey-events/
    ses_xxxx-DATE-CREATED-ISO.md      ← Human-readable journey journal
    ses_xxxx-DATE-CREATED-ISO.json    ← Machine-readable companion
  error-logs/
    ses_xxxx-DATE-CREATED-ISO.log     ← Error-only log entries
```

**Rationale**: Prior spec (R1) demands a single JSON file. New spec demands markdown with TOC. The resolution is: one canonical JSON (machine-readable, the source of truth) and one derived markdown (human-readable, regenerated from JSON). The markdown is the presentation layer; JSON is the data layer.

**Trade-off**: Two files per session vs. one. The markdown file is derivable from JSON, so it could be generated on-demand. However, the user explicitly wants "journey-events markdown" as a first-class artifact, so we write it eagerly.

### D2: Session Naming Convention

Format: `ses_{4-5 digit counter}_{ISO-date}_{purpose}_{agent}`

Example: `ses_0042_2026-03-29T143000_planning_hiveminder`

**Rationale**: Prior spec (R2) uses `ses_<ISO>_<purpose>_<agent>`. New spec uses `ses_xxxx` (4-5 digits) + `-DATE-CREATED-ISO`. The merge uses the digit prefix for ordering/disambiguation, ISO date for human scanning, and purpose+agent for semantic meaning.

**Trade-off**: Longer filenames. Accepted because filesystem limits are generous and semantic value is high.

### D3: Session Resolution Service (Extract to Shared Module)

Extract the duplicated session resolution logic into a single service:

```typescript
// src/features/session-journal/session-resolver.ts
export interface SessionResolver {
  resolve(sdkSessionId: string): Promise<string>  // returns semantic session ID
  resolveOrCreate(sdkSessionId: string, defaults: SessionDefaults): Promise<string>
}
```

All handlers inject this service instead of reimplementing the `findSessionBySdkId → loadSession → initSession` pattern.

**Rationale**: 5 copies of the same logic is a maintenance hazard and CQRS violation (handlers doing write-path resolution).

**Trade-off**: Adds a dependency to all handlers. Accepted because the alternative (5 copies) is worse.

### D4: Event Wiring via SDK Hooks (Not Custom Bus)

Use the 8 available SDK plugin hooks for event capture. Map only the events that have real SDK hooks:

| User-Specified Event | SDK Hook Available | Handler |
|---------------------|-------------------|---------|
| `session.created` | `event` (session.started) | `event-handler.ts` |
| `session.compacted` | `experimental.session.compacting` | `compaction-handler.ts` |
| `session.deleted` | `event` (session.ended) | `event-handler.ts` |
| `session.error` | `event` (session.ended with error) | `event-handler.ts` |
| `session.idle` | `event` (session.idle) | `event-handler.ts` |
| `tool.execute.before` | `tool.execute.before` | `tool-execution-handler.ts` |
| `tool.execute.after` | `tool.execute.after` | `tool-execution-handler.ts` |
| `command.executed` | `command.execute.before` (limited) | `event-handler.ts` |
| `message.updated` | — | Not available (no SDK hook) |
| `file.edited` | — | Not available |
| `lsp.client.diagnostics` | — | Not available |
| `todo.updated` | — | Not available |
| `tui.*` | — | Not available |
| `shell.env` | `shell.env` | `event-handler.ts` (environment only) |

**Rationale**: The user specified 12+ event types, but the SDK only provides hooks for ~8 of them. We wire what exists and document the gaps. We do NOT create a custom event bus (that's an anti-pattern per AGENTS.md).

**Trade-off**: Incomplete event coverage. Accepted because the SDK is the authority; custom event buses are forbidden.

### D5: Wire Existing Handlers (chat-message, tool-execution)

The `chat-message-handler.ts` and `tool-execution-handler.ts` already exist and implement the correct logic. They need to be:

1. Imported in `opencode-plugin.ts`
2. Registered in the `chat.message` and `tool.execute.after` hook handlers
3. Called BEFORE the existing hook logic (so journal writes happen first)

**Rationale**: The code is already written and tested. The gap is purely wiring.

**Trade-off**: None — this is a pure wiring change.

### D6: Deprecate and Remove Legacy Subsystems

Phase 1 (this refactor):
- Mark `sdk-supervisor/session-inspection.ts` as `@deprecated`
- Mark `sdk-supervisor/diagnostic-log.ts` as `@deprecated` (already done)
- Remove calls to `upsertSessionInspectionExport` and `writeDiagnosticLog` from `opencode-plugin.ts`

Phase 2 (follow-up):
- Remove the modules entirely
- Remove `session-inspection` and `error-log` path builders from `shared/paths.ts`

**Rationale**: R8 requires legacy cleanup. The new consolidated system replaces both.

**Trade-off**: Breaking change for any code that reads from `session-inspection/` or `error-log/`. Mitigated by phased removal.

### D7: Markdown Writer as Journey-Events Generator

Rename/refactor `markdown-writer.ts` to produce the journey-events format:

```
# Session: ses_xxxx-DATE

**Session ID:** ...
**Actors:** hiveminder, hitea, hiveq
**Tools Used:** hivemind_task, hivemind_trajectory
**Status:** active

---

## Table of Contents

| # | Timestamp | Type | Summary |
|---|-----------|------|---------|
| 1 | 2026-03-29T14:30:00Z | user_message | "Write tests for..." |
| 2 | 2026-03-29T14:30:05Z | assistant_output | Created TDD test suite |
| 3 | 2026-03-29T14:30:10Z | tool_invocation | hivemind_task:create |

---

## Turn 1 — User Message
...

## Turn 2 — Assistant Output
...

## Tool Batch: hivemind_task (Turn 2)
| Tool | Action | Result |
|------|--------|--------|
| hivemind_task | create | task_id: abc123 |

---

## Delegations
...
```

**Rationale**: The current `markdown-writer.ts` already has the right structure (TOC, turn-based sections). It needs enhancement for actors, tool batches, and artifact links per the new spec.

**Trade-off**: More complex markdown generation. Accepted because the user explicitly wants this format.

---

## Consequences

### What Breaks

1. **Nothing immediately** — this is a design-only document.
2. **Phase 1 implementation** will break `experimental.text.complete` hook temporarily while the `writeDiagnosticLog` call is removed (diagnostic data moves to consolidated session).
3. **External consumers of `session-inspection/`** will lose data after Phase 2 removal.

### What Improves

1. **Single source of truth**: One JSON file per session replaces 3-file triplets + legacy directories.
2. **User messages captured**: Wiring `chat-message-handler.ts` solves R3.
3. **Tool calls tracked**: Wiring `tool-execution-handler.ts` solves R6.
4. **Counters accurate**: Handlers already increment counters; wiring them makes R7 true.
5. **Human-readable journals**: Journey-events markdown provides the TOC-driven format the user wants.
6. **Reduced code duplication**: Session resolver extraction eliminates 5 copies.

### Migration Path

1. Wire existing handlers (low risk, high impact)
2. Extract session resolver (refactor, no behavior change)
3. Enhance markdown writer for journey-events format
4. Move error events to `error-logs/` subfolder
5. Remove legacy `writeDiagnosticLog` calls
6. Remove legacy `upsertSessionInspectionExport` calls
7. Verify all R1-R9 acceptance criteria pass

---

## Alternatives Considered

### A1: Keep JSON-Only Format (Reject New Markdown)

**Pros**: Simpler, single file per session (R1 clean).
**Cons**: User explicitly wants markdown journey-events. Rejecting this loses the human-readable audit trail.
**Decision**: Rejected. User requirement is clear.

### A2: Use SDK Client API Instead of Plugin Hooks

**Pros**: Could poll for session state instead of reacting to hooks.
**Cons**: Violates event-driven architecture. Would require polling loops. SDK hooks are the official mechanism.
**Decision**: Rejected. Hooks are the correct SDK pattern.

### A3: Create Custom Event Bus for Missing Events

**Pros**: Would cover all 12+ user-specified event types.
**Cons**: Explicitly forbidden by AGENTS.md anti-patterns. Would create a parallel execution path competing with OpenCode.
**Decision**: Rejected. Use only SDK hooks.

### A4: Generate Markdown On-Demand (Not Eagerly Written)

**Pros**: One file per session (JSON only). Markdown generated when requested.
**Cons**: User wants markdown as a first-class artifact. On-demand generation adds latency and complexity.
**Decision**: Rejected in favor of eager write. The markdown file is small and append-only, so write cost is minimal.

---

## Interface Contracts

### SessionResolver

```typescript
/** Defaults for new session creation. */
export interface SessionDefaults {
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass: PurposeClass
  agent: string
  parentSessionId?: string | null
}

/** Resolves SDK session IDs to semantic session IDs. */
export interface SessionResolver {
  /** Find existing session or return null. */
  resolve(sdkSessionId: string): Promise<string | null>

  /** Find existing session or create new one with defaults. */
  resolveOrCreate(sdkSessionId: string, defaults: SessionDefaults): Promise<string>

  /** Get the sessions directory path. */
  getSessionsDir(): string
}
```

### JourneyEventsWriter

```typescript
/** Writes journey-events markdown files. */
export interface JourneyEventsWriter {
  /** Initialize the markdown file with session header and TOC. */
  init(sessionDir: string, session: SessionV3): Promise<void>

  /** Append a turn entry (user message, assistant output, tool call, etc). */
  appendTurn(sessionDir: string, turn: TurnEntry): Promise<void>

  /** Append a tool batch summary. */
  appendToolBatch(sessionDir: string, batch: ToolBatchEntry): Promise<void>

  /** Regenerate the TOC from current session state. */
  regenerateTOC(sessionDir: string, session: SessionV3): Promise<void>

  /** Append a delegation summary. */
  appendDelegation(sessionDir: string, delegation: DelegationRecord): Promise<void>
}
```

### ErrorLogWriter

```typescript
/** Writes error-only log entries to the error-logs subfolder. */
export interface ErrorLogWriter {
  /** Append an error entry to the session's .log file. */
  appendError(sessionId: string, entry: ErrorLogEntry): Promise<void>
}
```

---

## Verification Criteria (for hiveq)

1. **R1**: `ls .hivemind/sessions/journey-events/*.json | wc -l` equals number of sessions
2. **R2**: Filenames match pattern `ses_\d{4,5}_\d{4}-\d{2}-\d{2}T\d+_\w+_\w+`
3. **R3**: `chat.message` hook is wired; at least one session has `userMessageCount > 0`
4. **R4**: Each session has `turns[]` with `userMessage`, `assistantContent`, `toolInvocations`
5. **R5**: At least one delegation session has `parentSessionId !== null`
6. **R6**: `tool.execute.after` hook is wired; at least one session has `toolCallCount > 0`
7. **R7**: All counters are incremented by handlers, not hardcoded 0
8. **R8**: `session-inspection/` and `error-log/` directories are empty or removed
9. **New**: Journey-events markdown has TOC, actors, tool batches sections
10. **New**: Error-logs subfolder has `.log` files for error events
