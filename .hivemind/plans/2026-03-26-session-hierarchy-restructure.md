# Architecture Decision Record: Session Data Hierarchy Restructuring

**Date:** 2026-03-26
**Status:** proposed
**ADR:** ADR-017

---

## Context

The session journal system creates hundreds of flat JSON files with no hierarchy, no relationships, and no human/LLM readability. The current structure at `.hivemind/sessions/` is:

```
.hivemind/sessions/
├── ses_*.json                           ← Flat JSON files (current)
├── ses_2026-03-25T205858_implementation_unknown.json
├── ses_2026-03-25T225908_implementation_unknown_ses_*.json
└── ses_2e54729a6ffetGIdz8lMtXFumK/     ← Legacy directories (mixed formats)
```

### Current Schema Issues

| Issue | Impact | Evidence |
|-------|--------|----------|
| **No hierarchy** | Parent and sub-sessions are flat siblings | `parentSessionId` exists in schema but never populated |
| **No relationships** | Can't trace delegation chains | No way to know which subsession belongs to which parent |
| **No readability** | Raw JSON dumps with tool call trash | Sample file shows `events` array with full JSON payloads |
| **Mixed formats** | Directories + JSON files coexist | `.hivemind/sessions/` has both |
| **Purpose class unknown** | No semantic differentiation | All sessions show `purposeClass: "implementation"` or `implementation_unknown` |

### Current Data Flow

1. **chat-message-handler.ts** → Creates/updates session via `consolidated-writer.ts`
2. **text-complete-handler.ts** → Adds turns and assistant outputs
3. **event-handler.ts** → Captures session.idle, tool calls
4. **consolidated-writer.ts** → Atomic JSON writes to flat files

---

## Decision

Implement a hierarchical session storage system with human-readable markdown exports.

### 1. New Directory Structure

```
.hivemind/sessions/
└── {semanticSessionId}/              ← Directory per session (root or sub)
    ├── session.json                  ← Metadata + TOC + summary (atomic write)
    ├── events.md                     ← Chronological log (append-only)
    ├── diagnostics.log               ← Error/diagnostic entries
    └── subsessions/
        └── {subsessionId}/           ← Nested sub-sessions
            ├── session.json
            └── events.md
```

**Rationale:** Directory-per-session enables: (1) natural nesting of subsessions, (2) separate append-only files vs atomic JSON, (3) easier debugging by folder inspection.

### 2. Session Record Schema (session.json)

```typescript
interface SessionRecord {
  _schema: 'session/v3'
  sessionId: string              // Raw SDK session ID
  semanticSessionId: string      // Human-readable: ses_2026-03-26T185316_implementation_hiveminder
  parentSessionId: string | null // null for root, ID for sub-sessions
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass: PurposeClass     //discovery | brainstorming | research | planning | implementation | gatekeeping | tdd | course-correction
  agent: string
  startedAt: string              // ISO timestamp (session start)
  endedAt: string | null         // ISO timestamp (session end)
  turnCount: number
  status: 'active' | 'completed' | 'errored'
  summary: string                // Condensed 2-3 sentence summary
  keyFindings:string[]           // ≤5 important findings/resolutions
  subsessionIds: string[]        // Array of child session IDs
  resumable: boolean             // Can orchestrator resume?

  // Counters
  counters: {
    userMessageCount: number
    assistantOutputCount: number
    toolCallCount: number
    delegationCount: number
    compactionCount: number
  }

  // Legacy arrays DEPRECATED (moving to events.md)
  // turns: unknown[]     ← DEPRECATED - data moved to events.md
  // events: unknown[]    ← DEPRECATED - data moved to events.md
  // diagnostics: unknown[] ← DEPRECATED - moved to diagnostics.log

  // Table of Contents (auto-generated)
  toc: TableOfContentsEntry[]
}

interface TableOfContentsEntry {
  turnNumber: number
  timestamp: string
  type: 'user_message' | 'assistant_output' | 'delegation' | 'compaction' | 'error'
  summary: string           // 1-line summary
}
```

**Trade-off:** Maintaining backward compatibility with existing API while adding new schema fields. The old `turns`/`events`/`diagnostics` arrays are retained but deprecated; new data goes to markdown files.

### 3. Events Format (events.md)

Must be human/LLM readable markdown:

```markdown
# Session: ses_2026-03-26T185316_implementation_hiveminder

**Session ID:** ses_2d60283f5ffeYyXmUj5jJWqkbn
**Parent:** null
**Lineage:** hiveminder
**Purpose:** implementation
**Agent:** hiveminder
**Status:** active

---

## Table of Contents

| Turn | Timestamp | Type | Summary |
|------|-----------|------|---------|
| 1 | 2026-03-26T11:53:16Z | user_message | User asks about session errors... |
| 2 | 2026-03-26T11:53:45Z | assistant_output | Resolved import issue... |
| 3 | 2026-03-26T12:01:22Z | delegation | Delegated to code-skeptic... |

---

## Turn 1 — User Message

**Timestamp:** 2026-03-26T11:53:16.525Z
**Agent:** hiveminder

```
ok it is going to be a very complex and tedious work run use-hivemind...
```

---

## Turn 2 — Assistant Output

**Timestamp:** 2026-03-26T11:53:45.112Z
**Model:** claude-sonnet-4-20250514
**Duration:** 1523ms

The import on line 33 only imports `resolveDefaultAgent`. I need to add `initSkillInjection` to that import and call it at plugin initialization.

---

## Turn 3 — Tool Invocation

**Timestamp:** 2026-03-26T11:54:02.334Z
**Tool:** hivemind_task
**Action:** create
**Result:** task_created:task_implementation_001

---

### Decision Point: Turn 3

**Question:** Should I continue with remaining features?
**Decision:** Pausing for review — Feature complete per Gate 4 criteria.

---

## Diagnostics

| Timestamp | Level | Message |
|-----------|-------|---------|
| 2026-03-26T11:53:16.525Z | info | turn_complete agent=hiveminder text_len=170 |
| 2026-03-26T11:54:02.334Z | error | ENOENT: no such file or directory |

---

## Key Findings

1. Session idle events failing due to missing session file paths
2. Import resolution issue found in plugin initialization
3. 32/32 tests passing after consolidated writer implementation

---

## Summary

Session investigated session journal ENOENT errors. Resolved import issue in plugin initialization. All TDD phase 9 criteria met with 32 passing tests.
```

### 4. Pruning Rules

| Category | Action | Rationale |
|----------|--------|-----------|
| **Keep** | User messages (full) | Required for context reconstruction |
| **Keep** | Assistant final outputs (full) | Core conversation content |
| **Keep** | Decision points + rationale | Investigation support |
| **Keep** | Error states + resolutions | Debug traceability |
| **Keep** | Session start/end metadata | Timeline reconstruction |
| **Prune** | Intermediate tool call JSON dumps | Replace with tool name + key result only |
| **Prune** | Repetitive status messages | Summarize to one entry |
| **Prune** | Internal SDK noise | Filter via importance level |
| **Prune** | Duplicate entries | Deduplicate sequential entries |

### 5. Migration Strategy

**Phase 1: New Schema (Backward-Compatible)**
- Add `session.json` inside directory structure
- Maintain existing API (`initSession`, `addTurn`, `addEvent`) — just change storage location
- Create `.symlink` compatibility mapping (existing JSON files → new directories)

**Phase 2: Markdown Generation (Sidecar)**
- Add `events.md` as append-only sidecar to JSON
- Generate TOC on session close (not every write)
- Prune tool payloads during write

**Phase 3: Legacy Migration (One-time)**
- One-time migration script to move flat JSON files into directory structure
- Generate `events.md` from existing JSON data
- Prune historical data during migration

**Phase 4: Deprecation Cleanup**
- Remove legacy `turns`/`events`/`diagnostics` arrays from session.json
- Keep only metadata + counters + summary + keyFindings + toc

---

## Implementation Plan

### Files to Change (in order)

| Phase | File | Change |
|-------|------|--------|
| **1** | `src/features/event-tracker/consolidated-writer.ts` | Add `initSessionV3()`, update path generation to create directories |
| **1** | `src/features/event-tracker/types.ts` | Add `SessionV3` interface, deprecate `SessionV2` |
| **2** | `src/features/event-tracker/markdown-writer.ts` | NEW: Append-only events.md generation |
| **2** | `src/features/event-tracker/session-structure.ts` | NEW: Directory creation, subsession management |
| **3** | `src/hooks/chat-message-handler.ts` | Update to call new structure API |
| **3** | `src/hooks/text-complete-handler.ts` | Update to call new structure API |
| **3** | `src/hooks/event-handler.ts` | Update to call new structure API |
| **3** | `src/hooks/tool-execution-handler.ts` | NEW: Tool invocation logging to events.md |
| **3** | `src/hooks/compaction-handler.ts` | Update to call new structure API |
| **4** | `scripts/migrate-session-hierarchy.ts` | NEW: One-time migration script |
| **4** | `tests/integration/session-hierarchy.test.ts` | NEW: Integration tests |

### Dependency Order

```
1. types.ts (add SessionV3)
2. consolidated-writer.ts (extend, not replace)
3. session-structure.ts (NEW - mkdir, directory paths)
4. markdown-writer.ts (NEW - append to events.md)
5. all *-handler.ts (update to use new structure)
6. migration script (verify after handlers)
7. tests (verify after migration)
```

---

## Verification Criteria

Hiveq can verify implementation matches design by checking:

1. **Directory Structure**: After `initSession()`, verify `{semanticId}/session.json` exists
2. **Subsession Nesting**: After `linkSubSession()`, verify `{parent}/subsessions/{child}/` exists  
3. **Human-Readable**: events.md isParsable markdown with TOC and turn boundaries
4. **Backward-Compat**: Old API (`initSession`, `addTurn`, `addEvent`) still works
5. **Pruning**: Tool payloads are NOT full JSON dumps in events.md
6. **Migration**: Existing flat JSON files are moved to directories

---

## Alternatives Considered

### Option A: Keep Flat JSON, Add Index (Rejected)
- Would add an index.json mapping parent→children
- **Why rejected:** Still no human-readable format, file clutter persists

### Option B: Markdown-Only (Rejected)
- **Why rejected:** Breaks existing API compatibility, loses structured query capability

### Option C: Directory-per-session + JSON + Markdown (Chosen)
- **Why chosen:** Backward-compatible, human-readable, preserves query capability

---

## Consequences

### Easier
- Time-machine debugging via folder inspection
- Tracing delegation chains via subsession directory
- LLM-readable events.md for session summarization
- Visual hierarchy in file explorer

### Harder
- Migration of existing flat files
- Two write paths (atomic JSON + append-only markdown)
- Maintaining sync between session.json and events.md

### Reversibility
- Old API remains functional throughout migration
- Can fall back to old behavior via feature flag
- Migration script is idempotent and can be re-run

---

## Open Questions

1. **TOC Generation Timing**: Generate on-session-close only? Or incremental? (Recommendation: close-only for performance)
2. **events.md Rotation**: What happens when events.md exceeds N MB? (Future: rotate to events.001.md)
3. **Legacy Cleanup**: When to delete old flat JSON files after migration? (Recommendation: after v3 adoption confirmed)

---

## Reference

- Current schema: `consolidated-writer.ts` → `SessionV2` interface
- Current handlers: `chat-message-handler.ts`, `text-complete-handler.ts`, `event-handler.ts`
- Desired format: `session-ses_2dad.md` (user manual export)