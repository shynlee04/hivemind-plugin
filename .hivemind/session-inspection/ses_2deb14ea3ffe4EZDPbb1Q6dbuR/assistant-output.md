# Session Inspection Export

- ses_id: `ses_2deb14ea3ffe4EZDPbb1Q6dbuR`
- prepared_at: `2026-03-24T19:32:52.529Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Session format analysis in `.hivemind/sessions/` for consolidated session file design
**Question:** What data is captured, how it's structured, what's missing vs requirements?

### Findings

#### 1. Current File Structure

**Directory:** `.hivemind/sessions/ses_<opaqueId>/`
- 76 session folders total
- Naming scheme: `ses_<opaqueHexString>` (e.g., `ses_2dede3c79ffepAWMM565fkZF0b`)
- No semantic naming — all opaque, non-human-readable

**Files per session (varies 1-5):**

| File | Status | Lines (max) |
|------|--------|-------------|
| `events.md` | Always present | 443 |
| `session.json` | Usually present | 14 |
| `diagnostics.log` | Usually present | 41 |
| `delegation.md` | Defined in `paths.ts:46` — **never created** | 0 |
| `injection.md` | Defined in `paths.ts:55` — **never created** | 0 |
| `synthesis.md` | Defined in `paths.ts:84` — **never created** | 0 |
| `index.md` | Defined in `paths.ts:75` at root — **never created** | 0 |

Some sessions are incomplete (only `events.md` or only `diagnostics.log`).

#### 2. session.json Schema (Exact Fields)

Source: `src/features/event-tracker/writers/session-writer.ts:26-41` (createInitialSessionMetadata)

```json
{
  "sessionId": "string",
  "lineage": "hiveminder | hivefiver",
  "purposeClass": "discovery | brainstorming | research | planning | implementation | gatekeeping | tdd | course-correction",
  "agent": "string",
  "created": "ISO8601",
  "updated": "ISO8601",
  "parentSessionId": "string | null",
  "childSessionIds": "string[]",
  "status": "active | completed | abandoned",
  "userMessageCount": 0,
  "agentOutputCount": 0,
  "delegationCount": 0
}
```

**Key observation:** All 3 counters are ALWAYS 0 in every session examined. The `initOrUpdateSessionMetadata` function (`session-writer.ts:65-71`) only updates `updated` and `status` — it never increments counters.

#### 3. events.md Format (Exact Structure)

Source: `src/features/event-tracker/writers/events-writer.ts:24-39` (renderEventMarkdownBlock)

```markdown
## {type}

- **Timestamp**: {ISO8601}
- **Actor**: {string | "N/A"}
- **Title**: {string | "N/A"}
- **Summary**: {text | "N/A"}

### Details

{details content}
```

**Event types found in practice across all 76 sessions:**

| Event Type | Count | Source Hook |
|------------|-------|-------------|
| `assistant_output` | ~900+ | `text-complete-handler.ts:51-58` |
| `session.idle` | ~50+ | `event-handler.ts:112-117` |
| `compaction` | ~2 | `compaction-handler.ts:36-43` |
| Various titles (Implementation Complete, Codebase Investigation Report, etc.) | ~20 | Same as assistant_output but with custom titles |

**NOT found in any session:**
- `user_message` — defined in `types.ts:16` but never written
- `tool_invocation` — defined in `types.ts:18` but never written
- `delegation_created` — defined in `types.ts:19` but never written
- `delegation_returned` — defined in `types.ts:20` but never written
- `session_start` — defined in `types.ts:22` but never written
- `session_end` — defined in `types.ts:23` but never written
- `injection` — defined in `types.ts:24` but never written
- `error` — defined in `types.ts:25` but never written

#### 4. diagnostics.log Format (Exact Structure)

Source: `src/features/event-tracker/writers/diagnostics-writer.ts:28-37` (renderDiagnosticLogLine)

```
{timestamp} | session={sessionId} | level={info|warn|error} | actor={N/A|system} | source={N/A|string} | message={turn_complete agent={name} text_len={number}} | details=
```

**All entries observed are:** `level=info`, `actor=N/A`, `source=N/A`, `message=turn_complete agent=unknown text_len={N}`

#### 5. Counter Analysis

Source: `src/features/event-tracker/parser/counter.ts:10-30`

Three counters defined in `parser/types.ts:37-41`:
```typescript
interface TurnCounters {
  userMessageCount: number
  agentOutputCount: number
  delegationCount: number
}
```

**Why all counters are 0:**
1. `initOrUpdateSessionMetadata` (`session-writer.ts:37-39`) initializes all to 0
2. The update path (`session-writer.ts:65-71`) only touches `updated` and `status` — never counters
3. The `text-complete-handler.ts` calls `writeMeta` every turn but passes no counter data
4. The `counter.ts` parser exists but is never called by any writer

#### 6. Missing Features vs Requirements

| Requirement | Status | Evidence |
|-------------|--------|----------|
| **User message capture** | MISSING | `text.complete` hook only fires for assistant output. No hook captures user input. `user_message` event type defined in `types.ts:16` but zero callers. |
| **Sub-session linking** | MISSING | `parentSessionId` is always `null` in every session. `childSessionIds` is always `[]`. No writer ever passes `parentSessionId`. |
| **Semantic naming** | MISSING | Folder names are `ses_<opaqueHex>`. No timestamp, no purpose, no agent name in path. |
| **Tool selection filtering** | MISSING | `tool_invocation` event type exists (`types.ts:18`) but no hook wires tool.execute events to session writers. |
| **Counter incrementation** | BROKEN | Counters initialized to 0, never incremented. `counter.ts` parser exists for read-side but write-side never updates session.json. |
| **Status transitions** | BROKEN | Sessions always stay "active". No hook ever writes "completed" or "abandoned". |
| **Agent identification** | BROKEN | `agent` field is always "unknown". The injection store (`injection-store.ts`) is the intended source but doesn't consistently populate it. |

#### 7. Writer Architecture

Source: `src/internal/session-writers.ts:88-129`

Three writer methods exposed via `SessionWriters` interface:
```typescript
interface SessionWriters {
  writeEvent(event: SessionEventInput): Promise<void>     // → events.md
  writeMeta(meta: SessionMetaInput): Promise<void>        // → session.json
  writeDiagnostic(diag: DiagnosticInput): Promise<void>   // → diagnostics.log
```

**Callers:**
- `text-complete-handler.ts` → `writeEvent` (assistant_output), `writeMeta`, `writeDiagnostic`
- `compaction-handler.ts` → `writeEvent` (compaction)
- `event-handler.ts` → `writeEvent` (session.idle only)

#### 8. Type System (Full EventType Union)

Source: `src/features/event-tracker/types.ts:15-25`

```typescript
type EventType =
  | 'user_message'        // NEVER WRITTEN
  | 'assistant_output'    // Written by text-complete-handler
  | 'tool_invocation'     // NEVER WRITTEN
  | 'delegation_created'  // NEVER WRITTEN
  | 'delegation_returned' // NEVER WRITTEN
  | 'compaction'          // Written by compaction-handler
  | 'session_start'       // NEVER WRITTEN
  | 'session_end'         // NEVER WRITTEN
  | 'injection'           // NEVER WRITTEN
  | 'error'               // NEVER WRITTEN
```

8 out of 10 event types are dead.

### Structure Map

```
.hivemind/sessions/
├── ses_<opaqueId>/                    # 76 folders
│   ├── session.json                   # Always present, counters always 0
│   ├── events.md                      # Always present, only assistant_output + session.idle
│   ├── diagnostics.log                # Usually present, only turn_complete entries
│   ├── delegation.md                  # NEVER EXISTS (writer defined, never called)
│   ├── injection.md                   # NEVER EXISTS (writer defined, never called)
│   └── synthesis.md                   # NEVER EXISTS (writer defined, never called)
├── index.md                           # NEVER EXISTS
└── session-inspection/                # 20 inspection folders (different concern)
```

### Target Format Design (Based on Requirements)

**Consolidated single-file format** that addresses all missing features:

```json
{
  "_schema": "session/v2",
  "sessionId": "ses_<timestamp>_<purpose>_<agent>",
  "lineage": "hiveminder",
  "purposeClass": "implementation",
  "agent": "hiveminder",
  "created": "2026-03-24T18:35:59.350Z",
  "updated": "2026-03-24T18:41:10.551Z",
  "status": "completed",
  "parentSessionId": "ses_<parentId>" | null,
  "childSessionIds": ["ses_<child1>", "ses_<child2>"],
  "counters": {
    "userMessageCount": 3,
    "assistantOutputCount": 26,
    "toolCallCount": 15,
    "delegationCount": 2,
    "compactionCount": 1,
    "turnCount": 26
  },
  "turns": [
    {
      "turnNumber": 1,
      "timestamp": "2026-03-24T18:35:59.350Z",
      "userMessage": "Implement the session writer facade...",
      "assistantContent": "I'll implement the internal writer interface...",
      "toolCalls": [
        {
          "toolName": "rg",
          "args": {"pattern": "export", "include": "*.ts"},
          "timestamp": "2026-03-24T18:36:01.123Z"
        }
      ],
      "delegations": [
        {
          "packetId": "pkt_abc123",
          "delegatedTo": "explore",
          "subagentType": "read-only",
          "description": "Audit src/tools directory",
          "status": "completed"
        }
      ]
    }
  ],
  "events": [
    {
      "type": "compaction",
      "timestamp": "2026-03-24T18:24:31.527Z",
      "actor": "system",
      "summary": "Compaction triggered. Context length: 1 segments."
    },
    {
      "type": "session_end",
      "timestamp": "2026-03-24T18:41:10.551Z",
      "actor": "system",
      "summary": "Session completed"
    }
  ],
  "diagnostics": [
    {
      "timestamp": "2026-03-24T18:35:59.350Z",
      "level": "info",
      "message": "turn_complete agent=hiveminder text_len=148"
    }
  ]
}
```

**Key design decisions:**
1. **Single JSON file** replaces 3 files — eliminates redundancy
2. **Semantic naming**: `ses_<ISO-timestamp>_<purpose>_<agent>` instead of opaque hex
3. **Turn-based structure** captures user messages and assistant output together
4. **Tool calls array** per turn with tool name, args, timestamp
5. **Delegation tracking** with packet IDs and status
6. **Proper counters** computed from actual turn/event data
7. **Events array** for lifecycle events (compaction, start, end, error)
8. **Diagnostics array** preserves the log format for grep-ability

**What needs to change in hooks:**
- `text-complete-handler.ts` must capture user message from the preceding message in the session
- A new `tool.execute` hook handler must write tool_invocation events
- `session.json` update must compute and persist counters from actual data
- `parentSessionId` must be passed when creating sub-sessions

### Git Context

- **Working directory:** `/Users/apple/hivemind-plugin/.worktrees/product-detox` (product-detox branch)
- **HEAD:** `4724eed feat: Introduce new skills, agents, and session management, while deprecating older GSD and skill-related files, and updating package-lock.`
- **Status:** Clean (no uncommitted changes affecting session format)

---

**Status:** `completed`
**Evidence:** 76 session folders examined, 3 representative sessions read in full, all writer source files reviewed, event types and counter logic traced through code
**Output path for delegation:** `.hivemind/activity/delegation/phase-p2-session-format-assessment.json`