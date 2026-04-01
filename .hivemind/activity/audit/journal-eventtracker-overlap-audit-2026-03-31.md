# Journal vs Event-Tracker vs Session-Journal — Overlap Audit

**Date:** 2026-03-31
**Scope:** Writer/Consumer overlap analysis across session journaling systems
**Git Commit:** Investigated at HEAD

---

## Writer Map

### 1. `hivemind_journal` Tool
**Location:** `src/tools/hivemind-journal.ts`
**Type:** OpenCode Tool (agent-callable via `hivemind_journal` tool)
**Stated Purpose:** "sole write-side entry point for session journaling" (line 5)

| Property | Value |
|----------|-------|
| File Path | `.hivemind/sessions/journey-events/{truncatedSessionId}.md` |
| Format | Markdown event blocks |
| Event Types | `assistant_output`, `user_message`, `tool_call`, `compaction`, `trajectory`, `diagnostic` |
| Calls | `appendDiagnosticToMarkdown()` from `markdown-writer.ts` (line 19) |

**Write Pattern:**
```
## {eventType}
- **Timestamp**: {timestamp}
- **Actor**: {actor}
- **Title**: {title}
- **Summary**: {summary}
### Details
{details}
```

---

### 2. `markdown-writer.ts` (Direct Hook Writers)
**Location:** `src/features/event-tracker/markdown-writer.ts`
**Type:** Low-level writer module

| Function | Purpose | Called By (hooks) |
|----------|---------|-------------------|
| `initEventsMarkdown()` | Creates header with TOC placeholder | (internal only) |
| `appendTurnToMarkdown()` | Appends turn entries | `chat-message-handler.ts` (line 81), `tool-execution-handler.ts` (line 73), `text-complete-handler.ts` (line 114, 208), `compaction-handler.ts` (line 86, 151) |
| `appendToolBatch()` | Appends tool batch tables | (test only) |
| `appendDelegation()` | Appends delegation records | (test only) |
| `generateTOC()` | Regenerates TOC (full rewrite) | — |
| `updateSessionTimestamp()` | Updates **Updated:** field | all hooks |
| `appendDiagnosticToMarkdown()` | Appends diagnostic entries | `hivemind_journal` tool (line 173) |

**CQRS Violation:** Hooks call `markdown-writer.ts` directly, bypassing the `hivemind_journal` tool.

---

### 3. `consolidated-writer.ts`
**Location:** `src/features/event-tracker/consolidated-writer.ts`
**Type:** JSON session store (V3 schema per ADR-017)

| Property | Value |
|----------|-------|
| File Path | `.hivemind/sessions/journey-events/{sessionId}.json` |
| Format | JSON (SessionV3 schema) |
| Write Operations | `initSession()`, `addTurn()`, `incrementCounter()`, `updateStatus()`, `linkSubSession()` |
| **Critical:** `addEvent()` and `addDiagnostic()` are **NO-OPs** (lines 325-348) — kept for API compatibility only |

**No-op evidence:**
```typescript
// Line 325-331
export async function addEvent(_sessionDir: string, _input: AddEventInput): Promise<void> {
  // V3 does not store events in-session; events go to separate files.
  // Kept as no-op for API compatibility.
}
```

---

### 4. `hierarchy-writer.ts`
**Location:** `src/features/session-journal/hierarchy-writer.ts`
**Type:** JSON writer

| Property | Value |
|----------|-------|
| File Path | `.hivemind/sessions/journey-events/hierarchy.json` |
| Format | JSON (`HierarchyDocument`) |
| Operations | `writeHierarchyJson()`, `appendHierarchyLink()` |
| Called By | `consolidated-writer.linkSubSession()` (line 441) |

---

### 5. `error-log-writer.ts`
**Location:** `src/features/session-journal/error-log-writer.ts`
**Type:** Log writer

| Property | Value |
|----------|-------|
| File Path | `.hivemind/sessions/error-logs/{sessionId}.log` |
| Format | Plain text log lines |
| Operations | `appendError()` |
| Called By | `event-handler.ts` on `session.error` events (line 324) |

---

### 6. `index-writer.ts`
**Location:** `src/features/event-tracker/writers/index-writer.ts`
**Type:** Index generator (full rewrite)

| Property | Value |
|----------|-------|
| File Path | `.hivemind/sessions/index.md` |
| Format | Markdown table |
| Operations | `updateMasterIndex()` |

---

### 7. `synthesizer.ts`
**Location:** `src/features/event-tracker/writers/synthesizer.ts`
**Type:** Synthesis generator

| Property | Value |
|----------|-------|
| File Path | `.hivemind/sessions/{sessionId}/synthesis.md` (deprecated) |
| Format | Markdown |
| Called By | — (generation only, no active consumers found) |

---

## File Map

| File | Writers | Notes |
|------|---------|-------|
| `.hivemind/sessions/journey-events/{id}.md` | `markdown-writer.ts` (hooks), `hivemind_journal` (tool) | **DUAL WRITE** |
| `.hivemind/sessions/journey-events/{id}.json` | `consolidated-writer.ts` | V3 schema, events are NO-OP |
| `.hivemind/sessions/journey-events/hierarchy.json` | `hierarchy-writer.ts` | Parent-child relationships |
| `.hivemind/sessions/error-logs/{id}.log` | `error-log-writer.ts` | Error entries only |
| `.hivemind/sessions/index.md` | `index-writer.ts` | Master session list |
| `.hivemind/sessions/{id}/synthesis.md` | `synthesizer.ts` | **DEPRECATED** per `paths.ts` |

---

## Consumer Map

### Journey-events Markdown (`.md`)
| Consumer | Purpose | Location |
|----------|---------|----------|
| **NONE FOUND** | Debugging, human review | `intelligence/doc` only reads user project files |

### Journey-events JSON (`.json`)
| Consumer | Purpose |
|----------|---------|
| `consolidated-writer.loadSession()` | Reads V3 session data |
| Hooks (`chat-message-handler`, etc.) | Load existing session to calculate turn numbers |
| `session-resolver.resolve()` | Session ID resolution |

### Hierarchy JSON
| Consumer | Purpose |
|----------|---------|
| **NONE FOUND** | Written but never read |

### Error Logs
| Consumer | Purpose |
|----------|---------|
| **NONE FOUND** | Append-only diagnostic logs |

---

## Purpose Analysis

### `hivemind_journal` Tool
- **Stated Purpose:** "sole write-side entry point for session journaling"
- **Trigger:** Agent calls via `hivemind_journal` tool
- **Cycle:** Per-event, append-only
- **What Breaks if Removed:** Agent-perceived journaling (but hooks still write!)

### `markdown-writer.ts` (Hooks)
- **Stated Purpose:** "Human-readable events.md generation (ADR-017)"
- **Trigger:** OpenCode hooks (`chat.message`, `tool.execute.after`, `text.complete`, `session.compacting`)
- **Cycle:** Per-turn or per-event
- **What Breaks if Removed:** Actual event capture (tool path would be sole remaining writer)

### `consolidated-writer.ts`
- **Stated Purpose:** "single JSON file per session using V3 schema (ADR-017)"
- **Trigger:** Hooks call its functions
- **Cycle:** Atomic counter updates, session init
- **What Breaks if Removed:** Counter tracking, session metadata would be lost

### `hierarchy-writer.ts`
- **Stated Purpose:** "parent-child session relationships"
- **Trigger:** `linkSubSession()` from `consolidated-writer`
- **Cycle:** On delegation/subagent creation
- **What Breaks if Removed:** Session tree visualization

### `error-log-writer.ts`
- **Stated Purpose:** "append session error logs"
- **Trigger:** `session.error` events
- **Cycle:** On error events only
- **What Breaks if Removed:** Error audit trail lost

---

## Overlap Findings

### Finding 1: DUAL WRITE PATH — Markdown (CRITICAL)

**Both** `hivemind_journal` tool **AND** hooks write to the **same** `.md` file.

| Path | Writer | Called By |
|------|--------|-----------|
| `journey-events/{id}.md` | `hivemind_journal` tool | Agents |
| `journey-events/{id}.md` | `markdown-writer.ts` | Hooks (`chat-message-handler`, `tool-execution-handler`, `text-complete-handler`, `compaction-handler`) |

**Problem:** The tool claims to be the "ONLY write-side entry point" (line 5 of `hivemind-journal.ts`), but hooks write directly via `markdown-writer.ts`, bypassing the tool entirely.

---

### Finding 2: CONSOLIDATED-WRITER Events are NO-OP

`consolidated-writer.addEvent()` and `addDiagnostic()` are **no-ops** in V3:
```typescript
// Lines 325-348
export async function addEvent(_sessionDir: string, _input: AddEventInput): Promise<void> {
  // V3 does not store events in-session; events go to separate files.
  // Kept as no-op for API compatibility.
}
```

**Problem:** Hooks call `addEvent()` which does nothing. Events actually land in markdown via `appendTurnToMarkdown()`. The JSON store lost its event data purpose mid-migration.

---

### Finding 3: Hierarchy JSON Has No Consumer

`hierarchy.json` is written by `hierarchy-writer.appendHierarchyLink()` but **never read** by any module.

---

### Finding 4: Error Logs Have No Consumer

`error-logs/{id}.log` is written by `error-log-writer.appendError()` but **never read** by any module.

---

### Finding 5: Tool-Exclusive Events Bypass Tool

The `hivemind_journal` tool handles `diagnostic` events by calling `appendDiagnosticToMarkdown()` directly (line 173):
```typescript
case 'diagnostic': {
  const diagPayload = payload as DiagnosticPayload
  await appendDiagnosticToMarkdown(filePath, { ... })
}
```

This means the tool directly imports and calls `markdown-writer.ts` functions, rather than hooks providing a unified write path.

---

## Data Flow Diagram

```
                    ┌─────────────────────────────────────────────────────┐
                    │                    AGENTS                            │
                    │  ┌─────────────────────────────────────────────┐   │
                    │  │  hivemind_journal tool                     │   │
                    │  │  (SRROle write-side entry point CLAIM)     │   │
                    │  └──────────┬──────────────────────────────────┘   │
                    └─────────────┼───────────────────────────────────────┘
                                  │ (claims to be sole writer)
                                  ▼
                    ┌─────────────────────────────────────────────────────┐
                    │              OPENCODE HOOKS                         │
                    │  chat.message ──► chat-message-handler              │
                    │  tool.execute.after ──► tool-execution-handler       │
                    │  text.complete ──► text-complete-handler             │
                    │  session.compacting ──► compaction-handler           │
                    │  event ──► event-handler                             │
                    └──────────┬──────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ markdown-     │  │ consolidated-   │  │ error-log-writer   │
│ writer.ts     │  │ writer.ts       │  │                     │
│ (DIRECT CALL) │  │                 │  │                     │
└───────┬───────┘  └────────┬────────┘  └─────────────────────┘
        │                    │
        │                    │ (addEvent/addDiagnostic = NO-OP)
        ▼                    ▼
┌─────────────────────────────────────────────┐
│  journey-events/{id}.md                     │
│  (APPEND-ONLY + Diagnostic writes)          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  journey-events/{id}.json                  │
│  (counters, metadata only; events NO-OP)   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  journey-events/hierarchy.json              │
│  (written, NO CONSUMER)                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  error-logs/{id}.log                       │
│  (written, NO CONSUMER)                    │
└─────────────────────────────────────────────┘
```

---

## Recommendations

### 1. **RESOLVE — Tool vs Hook Dual Write (CRITICAL)**

**Problem:** Both `hivemind_journal` tool and hooks claim to write journey-events, but hooks bypass the tool entirely.

**Options:**

| Option | Action | Pros | Cons |
|--------|--------|------|------|
| **A. Keep Hooks, Kill Tool** | Remove `hivemind_journal` tool, hooks remain sole writer | Clean CQRS, no duplication | Agents lose direct journaling capability |
| **B. Keep Tool, Kill Hook Direct Writes** | Refactor hooks to call `hivemind_journal` tool | Tool becomes true sole writer | Adds async IPC overhead per hook event |
| **C. Merge Both** | Consolidate into one writer with clear ownership | Unified write path | Migration effort |

**Recommended:** **Option B** — The tool should be the sole write-side entry point. Hooks should call `hivemind_journal` tool (or a shared internal service) rather than `markdown-writer.ts` directly. This enforces CQRS.

---

### 2. **RESOLVE — Consolidate Writers (HIGH)**

**Problem:** Multiple writers for session data (markdown, JSON, error logs, hierarchy) with unclear ownership and orphaned outputs.

**Recommended:** Audit each writer's consumer count:
- **0 consumers** (`hierarchy.json`, error logs): Either add consumers or remove writer
- **1 consumer** (markdown has no internal consumer): Consider if machine-readable output is needed
- **Multiple writers for same data** (markdown written by both tool AND hooks): Deduplicate

---

### 3. **RESOLVE — V3 Migration Incomplete (MEDIUM)**

**Problem:** `consolidated-writer.addEvent()` and `addDiagnostic()` are no-ops but hooks still call them. Events flow to markdown instead.

**Recommended:** Complete the V3 migration or revert. Current state is confusing and violates least surprise.

---

## Summary Table

| Component | Purpose | Consumers | Redundancy |
|-----------|---------|-----------|------------|
| `hivemind_journal` tool | Agent-side journaling | Agents | DUAL with hooks |
| `markdown-writer.ts` | Hook-side event capture | Hooks only | DUAL with tool |
| `consolidated-writer.ts` | JSON metadata/counters | Hooks | Events are NO-OP |
| `hierarchy-writer.ts` | Session tree | **NONE** | Orphaned writer |
| `error-log-writer.ts` | Error logging | **NONE** | Orphaned writer |
| `index-writer.ts` | Session index | Unknown | May be useful |
| `synthesizer.ts` | Session synthesis | **NONE** | Deprecated |

---

## Conclusion

**Not three things with unclear boundaries — one thing with schizoform evolution.**

`hivemind_journal`, `event-tracker`, and `session-journal` share DNA but represent **three eras of session journaling**:

1. **Era 1 (event-tracker):** Hooks → `markdown-writer.ts` → `.md` files
2. **Era 2 (session-journal):** Added `hierarchy-writer`, `error-log-writer`, `synthesizer`
3. **Era 3 (hivemind_journal):** Tool added as "sole write-side entry" but hooks weren't refactored

**The overlap is real but not malicious — it's architectural debt from iterative development without full migration.**

**Action items:**
1. Choose one write path (tool OR hooks, not both) for markdown
2. Kill orphaned writers (hierarchy, error logs) or find them consumers
3. Complete V3 migration — either make consolidated-writer the authority or revert to markdown-only
