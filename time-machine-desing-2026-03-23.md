I now have all the investigation results. Let me synthesize everything into a comprehensive design review package.

---

# Time-Machine / Event-Watch Auto-Export System Design Review Package

## Executive Summary

This design review analyzes the current HiveMind session intelligence export system and proposes a modular, hierarchical architecture optimized for human readability, machine parseability, LLM searchability, and long-term forensic investigation.

---

## 1. Current-State Findings

### 1.1 What the Current Plugin Is Doing

**Primary Export Channels (2):**

| Channel                      | Trigger                        | Output                                                        | Behavior                       |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------- | ------------------------------ |
| **Session-Inspection** | `experimental.text.complete` | `.hivemind/session-inspection/{ses_id}/assistant-output.md` | Per-session**overwrite** |
| **Diagnostic Log**     | `experimental.text.complete` | `.hivemind/error-log/{ses_id}-{timestamp}.md`               | Per-turn**append**       |

**Event Recording Channel:**

| Channel                     | Trigger                               | Output                                     | Behavior      |
| --------------------------- | ------------------------------------- | ------------------------------------------ | ------------- |
| **Trajectory Ledger** | `event` hook (all lifecycle events) | `.hivemind/state/trajectory-ledger.json` | Append events |

**Interception Points (17 Alive, 1 Dead):**

| Hook                                     | Status         | Purpose                                                                                |
| ---------------------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| `experimental.chat.messages.transform` | ALIVE          | Pre-send context injection (turn hierarchy, HiveMind context, skill focus, route hint) |
| `experimental.text.complete`           | ALIVE          | Post-turn export (session-inspection + diagnostic-log)                                 |
| `experimental.session.compacting`      | ALIVE          | Compaction context preservation                                                        |
| `event`                                | ALIVE          | All lifecycle event recording                                                          |
| `tool.execute.before/after`            | ALIVE          | Tool intent and result capture                                                         |
| `command.execute.before`               | ALIVE          | Command input context                                                                  |
| `permission.ask`                       | ALIVE          | Permission interception                                                                |
| `shell.env`                            | ALIVE          | Environment variable injection                                                         |
| `runtime_entry.nl_first`               | **DEAD** | Intentionally disabled                                                                 |

### 1.2 What Is Working

| Feature                          | Assessment            | Evidence                                   |
| -------------------------------- | --------------------- | ------------------------------------------ |
| Event interception               | **Operational** | All 17 lifecycle events captured           |
| Trajectory recording             | **Operational** | `recordTrajectoryEvent()` working        |
| Session inspection overwrite     | **Working**     | Per-session file updates correctly         |
| Diagnostic log append            | **Working**     | Per-turn files created                     |
| Message transformation injection | **Operational** | 4 active components injected correctly     |
| Compaction preservation          | **Working**     | Agent-work contracts survive compaction    |
| Purification command generation  | **Working**     | JSON commands created for async processing |

### 1.3 What Is Partially Working

| Feature            | Gap                                     | Impact                   |
| ------------------ | --------------------------------------- | ------------------------ |
| SessionInspection  | Overwrites only last turn, no history   | Lost intermediate states |
| Diagnostic log     | Fragmented across many files            | Search fragmentation     |
| Trajectory ledger  | Event summaries only, not full payloads | Shallow history          |
| File naming        | Timestamp-based, not session-centered   | Hierarchy confusion      |
| Content truncation | 5000 char limit loses data              | Evidence loss            |

### 1.4 What Is Dead, Missing, or Inconsistent

| Issue                                          | Location                          | Severity          |
| ---------------------------------------------- | --------------------------------- | ----------------- |
| **No error-log reading interface**       | No tool exists                    | High              |
| **No purification processor**            | JSON created but never consumed   | Medium            |
| **No cumulative session history**        | Overwrites discard prior turns    | High              |
| **No per-turn timestamps**               | In export format                  | High              |
| **Notoken accounting**                   | Missing entirely                  | Medium            |
| **No content hashing**                   | Integrity verification impossible | Medium            |
| **No sub-session relationship tracking** | Task IDs unlinked                 | Medium            |
| **Dead pathway**                         | `runtime_entry.nl_first`        | Low (intentional) |

---

## 2. Comparative Analysis

### 2.1 Full Session Export (`session-ses_2e5b.md`)

**Strengths:**

- Comprehensive turn-by-turn capture
- Rich reasoning blocks (`_Thinking:`)
- Complete tool invocation traces
- File content embeddings

**Weaknesses:**

- **No per-turn timestamps** (only session-level)
- **Excessive verbosity** (9,290lines for16-minute session)
- **Output truncation** (50KB cap loses data)
- **No semantic indexing** (grep-only search)
- **No deduplication** (AGENTS.md embedded multiple times)
- **No error categorization** (failures not flagged)

### 2.2 Error-Log Artifacts (`.hivemind/error-log/`)

**Strengths:**

- Timestamped files
- YAML frontmatter metadata
  -ISO8601 timestamps
- Session correlation via `session_id`

**Weaknesses:**

- **Extreme fragmentation** (92files for~10sessions)
- **Duplicate metadata** across files (same header repeated)
- **Minimal content** (most files are 13-126 lines)
- **No append logic** (new file perturn)
- **No session hierarchy** (flat directory)
- **Truncated output** (5000 char limit)

### 2.3 Session-Inspection Artifacts (`.hivemind/session-inspection/`)

**Strengths:**

- Session-centered hierarchy (`{ses_id}/`)
- Overwrite behavior preserves latest
- Purification command pattern for async processing

**Weaknesses:**

- **No history** (overwrite loses prior states)
- **Minimal metadata** (only ses_id + timestamp)
- **No injection payload** (context lost)
- **No processing** (purification commands never consumed)

### 2.4 Injection Audit Report (`INJECTION-PATHWAY-AUDIT-2026-03-23.md`)

**Key Findings:**

- Single primary pathway (`experimental.chat.messages.transform`)
- 4 active injection components
- 1 intentionally dead pathway (`runtime_entry.nl_first`)
- Clean architecture with proper guard conditions

**Relevance to Export System:**

- All injection flows through one hook
- Export system can intercept at this single point
- Injection payload storage available for metadata enrichment

---

## 3. Root Problem Diagnosis

### 3.1 Why Outputs Are Fragmented

**Primary Cause:** Two competing export channels with different granularities:

```
Session-Inspection: Overwrite (session-scoped)
Diagnostic-Log: Append (turn-scoped, timestamped)
```

**Result:**

- Session-inspection loses history
- Diagnostic-log creates file explosion
- No unified view

### 3.2 Why Outputs Are Noisy

**Primary Cause:** Verbatim assistant output capture without classification:

```yaml
# Current approach captures everything:
- Full reasoning sections (_Thinking:)
- Complete file contents (50KB+ embeds)
- Tool invocation traces (verbose JSON)
- System reminders (repeated AGENTS.md)
```

**Result:**

- Signal diluted by noise
- Search requires scanning entire content
- No importance ranking

### 3.3 Why Outputs Are Not Structured Enough

**Primary Cause:** Missing schema for semantic extraction:

```yaml
# Missing fields that would aid investigation:
- Per-turn timestamps
- Token accounting
- Error/error-resolution tracking
- Decision summaries
- Content hashes (integrity)
- Sub-session relationships
- Configuration/state snapshots
```

**Result:**

- Cannot answer "when did X happen?" within a session
- Cannot verify evidence integrity
- Cannot trace delegation chains

---

## 4. Proposed Architecture

### 4.1 Modular Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPORT SYSTEM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       INTERCEPTION LAYER                              │   │
│  │                                                                       │   │
│  │  experimental.text.complete ────────────────────────► SessionWriter  │   │
│  │  experimental.chat.messages.transform ──────────────► ContextEnricher│   │
│  │  event (all lifecycle) ─────────────────────────────► EventClassifier│   │
│  │  session.compacting ────────────────────────────────► CompactionPreserver │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       CLASSIFICATION LAYER                            │   │
│  │                                                                       │   │
│  │  EventClassifier ─► TurnClassifier ─► ImportanceScorer ─► Summarizer │   │
│  │       │                    │                │                 │      │   │
│  │       ├─ USER_INPUT        ├─ HIGH          ├— Triage         │      │   │
│  │       ├─ ASSISTANT_REPLY   ├─ MEDIUM        ├─ Extract        │      │   │
│  │       ├─ TOOL_INVOCATION   ├─ LOW           └─ Condense      │      │   │
│  │       ├─ ERROR            │                 └─ (optional)     │      │   │
│  │       └─ DECISION         │                                    │      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         STORAGE LAYER                                 │   │
│  │                                                                       │   │
│  │  SessionWriter ─► SessionJournal ─► ReadableExport ─► .md Reports   │   │
│  │       │                │                  │                          │   │
│  │       │                └─► DiagnosticLog ─► .log Files              │   │
│  │       │                                   │        │                       │   │
│  │       │                                   └─► SidecarJSON ─► .json Metadata│   │
│  │       │                                                                     │   │
│  │       └─► TrajectoryLedger ─► .json State                               │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       QUERY LAYER (NEW)                               │   │
│  │                                                                       │   │
│  │  Tool: hivemind_query_sessions                                        │   │
│  │       ├─ ses_id: required                                            │   │
│  │       ├─ start_ts: ISO 8601                                          │   │
│  │       ├─ end_ts: ISO8601                                             │   │
│  │       ├─ event_type: USER_INPUT | ASSISTANT_REPLY | ERROR | ...   │   │
│  │       └─ format: readable | diagnostic | json                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Event Model

| Event Type           | Category            | Import Level | Export Destinations                    |
| -------------------- | ------------------- | ------------ | -------------------------------------- |
| `USER_INPUT`       | Primary Interaction | HIGH         | Readable + Diagnostic                  |
| `ASSISTANT_REPLY`  | Primary Interaction | HIGH         | Readable + Diagnostic                  |
| `TOOL_INVOCATION`  | Operation           | MEDIUM       | Diagnostic only (unless error)         |
| `ERROR`            | Critical            | HIGH         | Readable (summary) + Diagnostic (full) |
| `DECISION`         | Milestone           | HIGH         | Readable (summary) + Diagnostic        |
| `FILE_READ`        | Evidence            | LOW          | Diagnostic only (hash + path)          |
| `FILE_WRITE`       | Mutation            | MEDIUM       | Readable (summary) + Diagnostic        |
| `DELEGATION_START` | Sub-session         | HIGH         | Readable + Diagnostic                  |
| `DELEGATION_END`   | Sub-session         | HIGH         | Readable + Diagnostic                  |
| `COMPACTION`       | Lifecycle           | LOW          | Diagnostic only                        |
| `HANDOFF`          | Continuity          | HIGH         | Readable + Diagnostic                  |

### 4.3 Summarization/Pruning Logic

```typescript
interface OutputRule {
  event_type: EventType;
  include_in_readable: boolean;
  include_in_diagnostic: boolean;
  format: 'full' | 'summary' | 'hash_only';
  max_length?: number;  // characters
  truncate_strategy?: 'end' | 'middle' | 'hash_ref';
}

const OUTPUT_RULES: OutputRule[] = [
  // High-value events: full in readable
  { event_type: 'USER_INPUT', include_in_readable: true, include_in_diagnostic: true, format: 'full' },
  { event_type: 'ASSISTANT_REPLY', include_in_readable: true, include_in_diagnostic: true, format: 'summary', max_length: 2000 },
  { event_type: 'ERROR', include_in_readable: true, include_in_diagnostic: true, format: 'full' },
  { event_type: 'DECISION', include_in_readable: true, include_in_diagnostic: true, format: 'summary' },
  
  // Medium-value events: summary or hash
  { event_type: 'FILE_READ', include_in_readable: false, include_in_diagnostic: true, format: 'hash_only' },
  { event_type: 'FILE_WRITE', include_in_readable: true, include_in_diagnostic: true, format: 'summary' },
  { event_type: 'TOOL_INVOCATION', include_in_readable: false, include_in_diagnostic: true, format: 'summary', max_length: 500 },
  
  // Lifecycle events: diagnostic only
  { event_type: 'COMPACTION', include_in_readable: false, include_in_diagnostic: true, format: 'summary' },
];
```

### 4.4 Session/Sub-session Linkage Model

```typescript
interface SessionRecord {
  ses_id: string;
  parent_ses_id?: string;  // For delegated sub-sessions
  root_ses_id: string;      // Always points to main session
  created_at: ISO8601;
  updated_at: ISO8601;
  purpose: string;
  agent: string;
  state: SessionState;
  delegation_chain: string[];  // [root → ... → current]
}

interface TurnRecord {
  turn_id: string;
  ses_id: string;
  turn_number: number;
  timestamp: ISO8601;
  duration_ms: number;
  event_type: EventType;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;             // Auto-generated or extracted
  token_usage?: TokenUsage;
  error?: ErrorRecord;
  references: Reference[];      // Files, tools, decisions
}
```

---

## 5. Proposed File/Folder Design

### 5.1 Hierarchy

```
.hivemind/
├── sessions/                          # Session-centered hierarchy
│   ├── ses_{root_id}/                  # Main session directory
│   │   ├── session.json               # Session metadata
│   │   ├── journal.md                  # Append-only readable journal
│   │   ├── journal-index.json         # Event index for fast lookup
│   │   ├── diagnostics/               # Verbose diagnostic logs
│   │   │   ├── turn-001-2026-03-23T10-33-14.log
│   │   │   ├── turn-002-2026-03-23T10-33-55.log
│   │   │   └── ...
│   │   ├── exports/                   # Generated exports
│   │   │   ├── summary-2026-03-23.md   # Daily summary
│   │   │   └── full-2026-03-23.md     # Full readable export
│   │   └── sub-sessions/              # Delegated sessions
│   │       ├── ses_{sub_id_1}/
│   │       │   └── ...                # Same structure
│   │       └── ses_{sub_id_2}/
│   │           └── ...
│   └── index.json                      # Session directory index
├── state/                              # Runtime state
│   ├── trajectory-ledger.json          # Event ledger (existing)
│   └── recovery-checkpoints/           # Checkpoint storage
└── config/                              # Configuration (existing)
```

### 5.2 Naming Conventions

| Artifact          | Pattern                    | Example                              |
| ----------------- | -------------------------- | ------------------------------------ |
| Session directory | `ses_{id}/`              | `ses_2e5be9ff6ffejqR3nxHH16P0FY/`  |
| Session metadata  | `session.json`           | `session.json`                     |
| Readable journal  | `journal.md`             | `journal.md`                       |
| Journal index     | `journal-index.json`     | `journal-index.json`               |
| Diagnostic log    | `turn-{n}-{ISO8601}.log` | `turn-003-2026-03-23T10-35-42.log` |
| Daily export      | `summary-{date}.md`      | `summary-2026-03-23.md`            |

### 5.3 Append Strategy

```typescript
// NEW APPROACH: Append to existing journal
function appendToJournal(ses_id: string, turn: TurnRecord): void {
  const journalPath = `.hivemind/sessions/${ses_id}/journal.md`;
  const indexPath = `.hivemind/sessions/${ses_id}/journal-index.json`;
  
  // Append turn to journal
  const entry = formatJournalEntry(turn);
  fs.appendFileSync(journalPath, entry);
  
  // Update index
  const index = JSON.parse(fs.readFileSync(indexPath));
  index.turns.push({
    turn_id: turn.turn_id,
    timestamp: turn.timestamp,
    event_type: turn.event_type,
    importance: turn.importance,
    line_start: index.last_line,
    line_end: index.last_line + entry.split('\n').length,
  });
  index.last_line = index.last_line + entry.split('\n').length;
  fs.writeFileSync(indexPath, JSON.stringify(index));
}
```

---

## 6. Proposed Export Schemas

### 6.1 Readable Markdown Export (`journal.md`)

```markdown
# Session Journal: ses_2e5be9ff6ffejqR3nxHH16P0FY

**Purpose:** Time-machine export system investigation
**Agent:**Hiveminder
**Created:** 2026-03-23T17:33:14.559Z
**Updated:** 2026-03-23T17:49:19.842Z
**Root Session:** ses_2e5be9ff6ffejqR3nxHH16P0FY

---

## Turn 001| 2026-03-23T17:33:14.559Z | USER_INPUT | HIGH

**User:** Investigate the time-machine / event-watch auto-export system...

**Decision Points:** 
- Identified need for parallel investigation
- Spawned 5 exploration subagents

**Delegations:**- `hivexplorer` → event-watch codebase investigation
- `hivexplorer` → session export analysis
- `hivexplorer` → error-log artifact analysis
- `hivexplorer` → injection pathway audit
- `hivexplorer` → session-inspection artifact analysis

---

## Turn 002 | 2026-03-23T17:33:55.255Z | ASSISTANT_REPLY | HIGH**Duration:** 10.2s**Tokens:** input=1234, output=567, total=1801

**Summary:** Dispatched 5parallel investigation agents to analyze codebase, session exports, error-logs, injection audit, and session-inspection artifacts.

**Key Findings:**
- Event system uses CQRS pattern
- 17 active hooks, 1 dead pathway
- Two export channels: session-inspection (overwrite) + diagnostic-log (append)

**Files Referenced:**
- `src/hooks/event-handler.ts` (SHA-256: a1b2c3...)
- `src/sdk-supervisor/session-inspection.ts` (SHA-256: d4e5f6...)

**Errors:** None

---

## Turn 003 | 2026-03-23T17:34:12.123Z | ERROR | HIGH

**Error Type:** tool_execution_failed
**Tool:** hivemind_doc
**Message:** Failed to read file: permission denied

**Recovery:** Retried with elevated permissions

---

## Turn 004 | 2026-03-23T17:34:45.456Z | DELEGATION_END | HIGH

**Sub-session:** ses_2e56f426dffehPBHp9fw6j56Bf
**Status:** completed
**Summary:** Codebase investigation complete. Found 17 active hooks, 1 dead pathway.*Key Findings:*
- Primary injection pathway: `experimental.chat.messages.transform`
- Export channels: session-inspection + diagnostic-log

---
```

### 6.2 Diagnostic Log Export (`turn-003-2026-03-23T10-35-42.log`)

```
================================================================================
DIAGNOSTIC LOG
Session: ses_2e5be9ff6ffejqR3nxHH16P0FY
Turn: 003
Timestamp: 2026-03-23T17:34:12.123Z
EventType: ERROR
Duration: 1.2s
================================================================================

--- INJECTION PAYLOAD ---
{
  "turn_hierarchy": { "trajectory": "none", "workflow": "none", "task": "none" },
  "hivemind_context": {
    "purpose": "planning",
    "session_state": "ready",
    "agent": "Hiveminder"
  },
  "skill_focus": { "skills": [...], "role": "orchestrator" }
}

--- ERROR DETAILS ---
Type: tool_execution_failed
Tool: hivemind_doc
Message: Failed to read file: permission denied
Stack: Error: EACCES: permission denied...

--- RECOVERY ATTEMPT ---
Action: Retry with elevated permissions
Result: SUCCESS

--- FULL ASSISTANT OUTPUT (5000 chars max) ---
[... truncated ...]

--- FILES ACCESSED ---
1. src/hooks/event-handler.ts (SHA-256: a1b2...)
2. src/sdk-supervisor/session-inspection.ts (SHA-256: d4e5...)

================================================================================
```

### 6.3 Session Metadata (`session.json`)

```json
{
  "ses_id": "ses_2e5be9ff6ffejqR3nxHH16P0FY",
  "parent_ses_id": null,
  "root_ses_id": "ses_2e5be9ff6ffejqR3nxHH16P0FY",
  "created_at": "2026-03-23T17:33:14.559Z",
  "updated_at": "2026-03-23T17:49:19.842Z",
  "purpose": "planning",
  "agent": "Hiveminder",
  "state": "active",
  "delegation_chain": [],
  "sub_sessions": [
    {
      "ses_id": "ses_2e56f426dffehPBHp9fw6j56Bf",
      "purpose": "investigation",
      "agent": "hivexplorer",
      "status": "completed"
    }
  ],
  "token_usage": {
    "total_input": 45678,
    "total_output": 12345,
    "total":58023
  },
  "turn_count": 47,
  "error_count": 3,
  "decision_count": 12
}
```

### 6.4 Journal Index (`journal-index.json`)

```json
{
  "session_id": "ses_2e5be9ff6ffejqR3nxHH16P0FY",
  "last_line": 2847,
  "turns": [
    {
      "turn_id": "turn-001",
      "timestamp": "2026-03-23T17:33:14.559Z",
      "event_type": "USER_INPUT",
      "importance": "HIGH","line_start": 1,
      "line_end": 23,
      "summary": "User requested investigation of time-machine export system"
    },
    {
      "turn_id": "turn-002",
      "timestamp": "2026-03-23T17:33:55.255Z",
      "event_type": "ASSISTANT_REPLY",
      "importance": "HIGH",
      "line_start": 24,
      "line_end": 89,
      "summary": "Dispatched 5 investigation agents"
    }
  ],
  "errors": ["turn-003", "turn-047"],
  "decisions": ["turn-001", "turn-005", "turn-012"]
}
```

---

## 7. Event Model and Taxonomy

### 7.1 Event Types

```typescript
type EventType =
  // Primary Interactions
  | 'USER_INPUT'           // User message received
  | 'ASSISTANT_REPLY'      // Assistant response sent
  // Operations
  | 'TOOL_INVOCATION'     // Tool called
  | 'FILE_ACCESS'          // File read/write
  | 'COMMAND_EXECUTED' // Slash command ran
  // Workflow
  | 'DELEGATION_START'     // Sub-session started
  | 'DELEGATION_END'       // Sub-session ended
  | 'HANDOFF'               // Continuity packet exchanged
  // Lifecycle
  | 'SESSION_START'    // Session created
  | 'SESSION_END'          // Session closed
  | 'COMPACTION'           // Context compacted
  | 'CHECKPOINT'           // State checkpoint created
  // Critical
  | 'ERROR'                // Error occurred
  | 'DECISION'             // Decision point reached
  | 'MILESTONE'            // Progress milestone;
```

###7.2 Importance Scoring

```typescript
function scoreImportance(event: EventType, metadata: EventMetadata): Importance {
  switch (event) {
    case 'ERROR':
      return 'HIGH';
    case 'DECISION':
      return 'HIGH';
    case 'USER_INPUT':
      return 'HIGH';
    case 'ASSISTANT_REPLY':
      return metadata.contains_error ? 'HIGH' : 'MEDIUM';
    case 'DELEGATION_START':
    case 'DELEGATION_END':
      return 'HIGH';
    case 'TOOL_INVOCATION':
      return metadata.tool_failed ? 'HIGH' : 'LOW';
    case 'FILE_ACCESS':
      return 'LOW';
    case 'COMPACTION':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}
```

### 7.3 Export Destinations by Event Type

| Event Type       | Readable Export      | Diagnostic Export   | Index Entry   |
| ---------------- | -------------------- | ------------------- | ------------- |
| USER_INPUT       | Full                 | Full                | Yes           |
| ASSISTANT_REPLY  | Summary (2000 chars) | Full                | Yes           |
| TOOL_INVOCATION  | Summary (if error)   | Summary (500 chars) | Yes           |
| ERROR            | Full                 | Full                | Yes (flagged) |
| DECISION         | Summary              | Summary             | Yes (flagged) |
| FILE_ACCESS      | Hash only            | Full                | Yes           |
| DELEGATION_START | Summary              | Full                | Yes           |
| DELEGATION_END   | Summary              | Full                | Yes           |

---

## 8. Hook/Interception Mapping

### 8.1 Current Hook Points

| Hook                                     | Current Behavior                    | Export Responsibility                     |
| ---------------------------------------- | ----------------------------------- | ----------------------------------------- |
| `experimental.text.complete`           | Session-inspection + diagnostic-log | **Keep** but refactor               |
| `experimental.chat.messages.transform` | Context injection                   | **No change**                       |
| `event`                                | Trajectory ledger                   | **Extend** for classification       |
| `experimental.session.compacting`      | Compaction context                  | **Extend** for checkpoint           |
| `tool.execute.before`                  | Tool intent recording               | **Extend** for event classification |
| `tool.execute.after`                   | Tool result capture                 | **Extend** for event classification |

### 8.2 Proposed Interception Points

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ PROPOSED EXPORT INTERCEPTION POINTS                                          │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  experimental.text.complete                                                   │
│  └── SessionWriter.turnComplete(event)                                       │
│       ├── classifyEvent(event)                      → EventClassifier       │
│       ├── appendToJournal(turnRecord)               → SessionJournal       │
│       ├── updateIndex(turnRecord)                    → JournalIndex         │
│       └── writeDiagnosticLog(turnRecord)             → DiagnosticLog       │
│                                                                               │
│  event (lifecycle events)                                                    │
│  └── EventCollector.record(event)                                            │
│       ├── storeEvent(event)                         → TrajectoryLedger      │
│       └── indexEvent(event)                          → JournalIndex         │
│                                                                               │
│  session.compacting                                                          │
│  └── CompactionHandler.beforeCompaction(session)                              │
│       ├── writeCheckpoint(session)                  → CheckpointStore      │
│       └── preserveEssentialState(session)            → CompactionPreserver │
│                                                                               │
│  tool.execute.before/after                                                   │
│  └── ToolEventCollector.record(toolCall)                                      │
│       ├── classifyImportance(toolCall)               → EventClassifier      │
│       └── appendToDiagnostic(toolCall)                → DiagnosticLog       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Before/After Examples

### 9.1 Current Output (Fragmented)

**Error-log file (one of 92):**

```yaml
---
session_id: ses_2e5be9ff6ffejqR3nxHH16P0FY
timestamp: 2026-03-23T10:33:14.559Z
purpose: planning
session_state: ready
trajectory: none
workflow: none
agent: unset
---

## Assistant Output

I'll conduct a comprehensive codebase audit...
(13 lines total)
```

**Problems:**

- 92 separate files for 1 session
- Duplicate metadata across files
- No chronology within file
- Truncated output (5000 chars)
- No error categorization

### 9.2 Improved Output (Unified)

**Session journal:**

```markdown
# Session Journal: ses_2e5be9ff6ffejqR3nxHH16P0FY

**Purpose:** Time-machine export system investigation
**Agent:** Hiveminder
**Created:** 2026-03-23T17:33:14.559Z
**Updated:** 2026-03-23T17:49:19.842Z

---

## Turn 001 | 2026-03-23T17:33:14.559Z | USER_INPUT | HIGH

**User:** Investigate the time-machine / event-watch auto-export system...

---

## Turn 002 | 2026-03-23T17:33:55.255Z | ASSISTANT_REPLY | HIGH

**Duration:** 10.2s
**Summary:** Dispatched 5 parallel investigation agents...

**Key Findings:**
- Event system uses CQRS pattern
- 17 active hooks identified

**Errors:** None

---

## Turn 003 | 2026-03-23T17:34:12.123Z | ERROR | HIGH

**Error:** tool_execution_failed
**Recovery:** Retried with elevated permissions

---

(2847 lines total, searchable, appendable)
```

**Benefits:**

- Single file per session
- Chronological structure
- Error categorization
- Token accounting
- Fast index-based search

### 9.3 Sub-Session Output

```markdown
# Sub-Session Journal: ses_2e56f426dffehPBHp9fw6j56Bf

**Parent:** ses_2e5be9ff6ffejqR3nxHH16P0FY
**Root:** ses_2e5be9ff6ffejqR3nxHH16P0FY
**Purpose:** Codebase investigation
**Agent:** hivexplorer
**Status:** completed

---

## Handoff Summary

**Task:** Investigate event-watch export implementation
**Findings:** 17 active hooks, 1 dead pathway, CQRS pattern
**Files Analyzed:** 23
**Key Artifacts:**
  - `src/hooks/event-handler.ts` (primary event flow)
  - `src/sdk-supervisor/session-inspection.ts` (session export)

**Return Contract:** ✅ Completed with findings
```

---

## 10. Implementation Roadmap

### Phase 1: Immediate Practical Changes (1-2 days)

| Task                               | File                         | Impact |
| ---------------------------------- | ---------------------------- | ------ |
| Add per-turn timestamps            | `session-inspection.ts`    | High   |
| Add content hashing                | `session-inspection.ts`    | Medium |
| Rename error-log to diagnostics    | `diagnostic-log.ts`        | Low    |
| Create session directory structure | `paths.ts`                 | High   |
| Implement append logic             | `session-journal.ts` (new) | High   |

### Phase 2: Medium-Term Refactor (1 week)

| Task                              | Description                          |
| --------------------------------- | ------------------------------------ |
| Create `SessionJournal` module  | Handles append-only journal writing  |
| Create `EventClassifier` module | Classifies events by type/importance |
| Create `JournalIndex` module    | Maintains searchable index           |
| Implement query tool              | `hivemind_query_sessions` tool     |
| Migrate existing diagnostics      | Convert error-log to new structure   |

### Phase 3: Long-Term Architecture (2-4 weeks)

| Task                                       | Description                     |
| ------------------------------------------ | ------------------------------- |
| Extract export system as standalone module | `src/export-system/`          |
| Implement sub-session linking              | Parent/root tracking            |
| Add post-compaction handlers               | Checkpoint preservation         |
| Create summary generation                  | Auto-generate session summaries |
| Build forensic query interface             | Complex query support           |

---

## 11. Risks and Decisions

### 11.1 Tradeoffs

| Tradeoff             | Option A                | Option B            | Recommendation                                             |
| -------------------- | ----------------------- | ------------------- | ---------------------------------------------------------- |
| Journal longevity    | Single file per session | Time-based rotation | **Option A** - Simpler for AI agents                 |
| Content preservation | Full output capture     | Summarized output   | **Hybrid** - Full in diagnostic, summary in readable |
| Index storage        | In-fileJSON             | Separate index file | **Option B** - Faster queries                        |
| Sub-session depth    | Unlimited nesting       | Max depth 3         | **Option B** - Prevent complexity explosion          |
| Diagnostic retention | Permanent               | Time-based cleanup  | **Hybrid** - Configurable retention                  |

### 11.2 Risks

| Risk                      | Mitigation                          |
| ------------------------- | ----------------------------------- |
| File corruption on append | Atomic writes, backup before append |
| Index desync              | Rebuild command, integrity check    |
| Performance degradation   | Index pagination, lazy loading      |
| Storage growth            | Retention policy, compression       |

### 11.3 Decisions Needed

| Decision                   | Options                            | Default    |
| -------------------------- | ---------------------------------- | ---------- |
| Max turns per journal file | Unlimited / 100 / 500              | Unlimited  |
| Diagnostic log retention   | Permanent / 30 days / configurable | 30 days    |
| Sub-session linking depth  | 1 / 3 / unlimited                  | 3          |
| Content hash algorithm     | SHA-256 / SHA-512                  | SHA-256    |
| Summary max length         | 500 / 2000 / 5000 chars            | 2000 chars |

---

## Approval Request

This design review presents a comprehensive analysis of the current export system and a proposed architecture that addresses:

1. **Fragmentation** → Unified session-centered hierarchy
2. **Noise** → Event classification and summarization
3. **Missing structure** → Standardized schemas and per-turn timestamps
4. **Searchability** → Journal index for fast lookups
5. **Long-term memory** → Sub-session linking and continuity

**Next Steps:**

1. Review and approve architecture decisions
2. Confirm priority order for implementation phases
3. Identify any additional requirements not captured

**Approval required before implementation.**
