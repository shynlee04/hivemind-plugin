# Session Inspection Export

- ses_id: `ses_2e528f923ffeImCot9FIRI5wpc`
- prepared_at: `2026-03-23T13:19:22.542Z`

## Assistant Output

I now have a complete picture of the current codebase. Here is the structured validation report.

---

## Design Decision: Event-Tracker Module Interface Contract Validation

**Context:** Replacing scattered `.hivemind/error-log/` (96+ files, 15 sessions) and `.hivemind/session-inspection/` (overwrite-only) with a unified, append-only, session-centered event tracking module.

**Decision:** Validate the proposed `src/feature/event-tracker/` module contracts before implementation.

**Rationale:** Interface errors discovered after implementation are 10x more expensive to fix. The proposed module has several naming conflicts, boundary ambiguities, and missing type definitions that must be resolved first.

**Trade-off:** Delaying implementation by one design review cycle to catch contract issues early.

---

### Validated Interfaces — Final TypeScript Contracts for `types.ts`

```typescript
// ─── Core Event Classification ────────────────────────────────────────────────

/**
 * Canonical event types the tracker can classify and route.
 * Maps 1:1 to hook data sources.
 */
type EventType =
  // From text.complete hook
  | 'ASSISTANT_REPLY'
  // From event hook
  | 'SESSION_START'
  | 'SESSION_END'
  | 'MESSAGE_ADDED'
  | 'MESSAGE_UPDATED'
  | 'TOOL_INVOCATION'
  | 'COMMAND_EXECUTED'
  | 'DELEGATION_START'
  | 'DELEGATION_END'
  // From messages.transform hook
  | 'INJECTION'
  // From session.compacting hook
  | 'COMPACTION'
  // From trajectory/error classification
  | 'ERROR'
  | 'DECISION'

/**
 * Importance scoring for triage.
 */
type Importance = 'HIGH' | 'MEDIUM' | 'LOW'

// ─── Turn Entry ───────────────────────────────────────────────────────────────

/**
 * A single turn entry in the event log.
 * Represents one discrete event within a session.
 */
interface TurnEntry {
  /** Sequential turn number within session (1-indexed) */
  turnNumber: number
  /** ISO 8601 timestamp of the event */
  timestamp: string
  /** Classified event type */
  eventType: EventType
  /** Computed importance */
  importance: Importance
  /** Agent identity (e.g. 'hiveminder', 'hivemaker', 'hivexplorer') */
  agent: string
  /** Truncated text content (subject to OutputRule pruning) */
  summary: string
  /** Optional: tool name for TOOL_INVOCATION events */
  toolName?: string
  /** Optional: tool arguments (truncated) */
  toolArgs?: string
  /** Optional: tool result summary (truncated) */
  toolResult?: string
  /** Optional: sub-session ID for DELEGATION_START/END */
  subSessionId?: string
  /** Optional: delegation scope description */
  delegationScope?: string
  /** Optional: error message for ERROR events */
  errorMessage?: string
  /** Optional: compaction metadata */
  compactionMeta?: {
    strategy: string
    linesBefore?: number
    linesAfter?: number
  }
}

// ─── Session Metadata ─────────────────────────────────────────────────────────

/**
 * Session-level metadata stored in events.md YAML frontmatter.
 * Updated on each turn completion.
 */
interface SessionMeta {
  /** Session identifier */
  sessionId: string
  /** ISO 8601 creation timestamp */
  created: string
  /** ISO 8601 last-update timestamp */
  updated: string
  /** Agent identity */
  agent: string
  /** Purpose class from start-work resolution */
  purpose: string
  /** Trajectory ID if attached */
  trajectory?: string
  /** Parent session ID for sub-sessions */
  parentSession?: string
  /** Child session IDs */
  childSessions: string[]
  /** Current session status */
  status: 'active' | 'completed' | 'compacted'
  /** Total turn count */
  turns: number
}

// ─── Output Rules ─────────────────────────────────────────────────────────────

/**
 * Defines how each event type is formatted in each output file.
 */
interface OutputRule {
  /** Event type this rule applies to */
  eventType: EventType
  /** Include in events.md? */
  includeInEvents: boolean
  /** Include in diagnostics.log? */
  includeInDiagnostics: boolean
  /** Include in injection.md? (only for INJECTION type) */
  includeInInjection?: boolean
  /** Include in delegation.md? (only for DELEGATION_START/END) */
  includeInDelegation?: boolean
  /** Format strategy for events.md */
  eventsFormat: 'full' | 'summary' | 'hash_only'
  /** Max characters for summary format in events.md */
  eventsMaxLength?: number
  /** Format strategy for diagnostics.log */
  diagnosticsFormat: 'full' | 'summary'
  /** Max characters for diagnostics.log summary */
  diagnosticsMaxLength?: number
}

// ─── Injection Record ─────────────────────────────────────────────────────────

/**
 * Record for injection.md output.
 * Captures what messages.transform injected per turn.
 */
interface InjectionRecord {
  turnNumber: number
  timestamp: string
  agent: string
  purposeClass: string
  sessionState: string
  sessionRole: 'orchestrate' | 'specialist' | 'standalone'
  skills: string[]
  variant: string
  /** Was a route hint injected? */
  hasRouteHint: boolean
}

// ─── Delegation Record ────────────────────────────────────────────────────────

/**
 * Record for delegation.md output.
 * Tracks parent↔sub-session create/return events.
 */
interface DelegationRecord {
  turnNumber: number
  timestamp: string
  /** 'CREATED' = parent spawned sub-session; 'RETURNED' = sub-session completed */
  direction: 'CREATED' | 'RETURNED'
  subSessionId: string
  delegatedTo?: string
  scope?: string
  constraints?: string
  status?: string
  duration?: number
  artifacts?: string[]
  resultSummary?: string
}

// ─── Master Index Entry ───────────────────────────────────────────────────────

/**
 * One row in the master session index (index.md).
 */
interface IndexEntry {
  sessionId: string
  agent: string
  purpose: string
  turns: number
  created: string
  updated: string
  status: 'active' | 'completed' | 'compacted'
  parentSession?: string
  childSessions: string[]
}

// ─── Hook Input Shapes ────────────────────────────────────────────────────────

/**
 * Normalized input for text.complete handler.
 * Derived from the SDK hook's actual shape.
 */
interface TextCompleteInput {
  sessionId: string
  assistantText: string
  /** Snapshot context from turn-snapshot-loader */
  snapshot: {
    defaultPurposeClass?: string
    entryState?: string
    trajectoryId?: string
    workflowId?: string
    preferredUserName?: string
  }
  /** Injection payload if messages.transform ran first */
  injection?: InjectionPayload
}

/**
 * Normalized input for event hook handler.
 * Derived from the SDK Event type.
 */
interface EventHookInput {
  sessionId: string
  eventType: string  // Raw SDK event type (e.g. 'session.started', 'tool.executed')
  timestamp: string
  summary?: string
  /** Trajectory bindings from runtime snapshot */
  trajectoryId?: string
  workflowId?: string
  taskIds: string[]
}

/**
 * Normalized input for compaction handler.
 */
interface CompactionInput {
  sessionId: string
  /** Context lines being injected */
  contextLines: string[]
  /** Runtime snapshot for metadata enrichment */
  snapshot: {
    trajectoryId?: string
    workflowId?: string
  }
}

/**
 * Re-export from injection-store for handler compatibility.
 * The event-tracker does NOT own this type — it receives it.
 */
interface InjectionPayload {
  sessionId: string
  timestamp: string
  agent: string
  purposeClass: string
  sessionState: string
  skillBundle: { name: string; description: string }[]
  sessionRole: 'orchestrate' | 'specialist' | 'standalone'
  skillFocusBlock: string
  turnHierarchyBlock: string
  contextBlock: string
  routeHintBlock?: string
  variant: string
}
```

---

### Module Boundary Contract

#### Exports (what the module exposes)

```typescript
// src/features/event-tracker/index.ts (barrel)
export { 
  // Types
  type EventType,
  type Importance,
  type TurnEntry,
  type SessionMeta,
  type OutputRule,
  type InjectionRecord,
  type DelegationRecord,
  type IndexEntry,
  type TextCompleteInput,
  type EventHookInput,
  type CompactionInput,
  
  // Default output rules
  DEFAULT_OUTPUT_RULES,
  
  // Handler factories (for plugin wiring)
  createTextCompleteEventHandler,
  createTransformEventHandler,
  createEventHookHandler,
  createCompactionEventHandler,
  
  // Writer functions (for direct use or testing)
  appendTurnEntry,
  appendDiagnosticLine,
  appendInjectionRecord,
  appendDelegationRecord,
  updateSessionMeta,
  updateMasterIndex,
  
  // Path helpers
  getEventLogPath,
  getSessionEventDir,
} from './index.js'
```

#### Imports (what the module may use)

| Import | Allowed | Source |
|--------|---------|--------|
| `node:fs/promises` | ✅ | Node built-in |
| `node:path` | ✅ | Node built-in |
| `node:crypto` | ✅ | For content hashing (SHA-256) |
| Own types (`./types.js`) | ✅ | Self-referential |
| `../shared/paths.ts` | ✅ | For `getHivemindPath()` only |

#### Forbidden Imports (boundary violations)

| Import | Forbidden | Reason |
|--------|-----------|--------|
| `@opencode-ai/sdk` | ❌ | Control-plane only; would create infinite recursion risk |
| `@opencode-ai/plugin` | ❌ | Plugin execution plane only |
| `src/hooks/*` | ❌ | Hooks are read-side; event-tracker is write-side |
| `src/plugin/*` | ❌ | Plugin assembly layer; event-tracker is a feature module |
| `src/core/*` | ❌ | State management; event-tracker owns its own I/O |

**Critical design note:** The `src/shared/paths.ts` `getHivemindPath()` function is the ONLY allowed cross-module import. The event-tracker should define its own `getEventLogPath()` and `getSessionEventDir()` functions that resolve paths under `.hivemind/event-log/`. It should NOT import `getErrorLogPath()` or `getSessionInspectionPath()` — those are the old system being replaced.

---

### Hook Integration Contract

#### Handler 1: `text-complete-handler.ts`

```typescript
/**
 * Handles experimental.text.complete hook data.
 * Writes to: events.md, diagnostics.log
 * 
 * @param projectRoot - Workspace root for path resolution
 * @param input - Normalized text.complete data
 */
async function handleTextComplete(
  projectRoot: string,
  input: TextCompleteInput,
): Promise<void>
```

**Data flow from plugin:**
```
opencode-plugin.ts (text.complete hook)
  ├─ Extracts: input.sessionID, output.text
  ├─ Loads: turnSnapshot.getSnapshot()
  ├─ Reads: getAndClearInjectionPayload(sessionId)  ← cross-hook bridge
  └─ Calls: handleTextComplete(projectRoot, { sessionId, assistantText, snapshot, injection })
```

**Behavior:**
1. Ensure session dir exists: `mkdir -p .hivemind/event-log/{sessionId}/`
2. Read current turn count from events.md header (or 0 if new)
3. Increment turn number
4. Classify as `ASSISTANT_REPLY` (importance: MEDIUM, or HIGH if snapshot contains error)
5. Append turn entry to events.md (pruned per OutputRule)
6. Append diagnostic line to diagnostics.log
7. If injection present, append injection record to injection.md
8. Update events.md YAML frontmatter (turns count, updated timestamp)
9. Update master index.md (turns, updated, status)

**Important:** The handler receives the injection payload as a parameter. The `getAndClearInjectionPayload()` call happens in `opencode-plugin.ts` BEFORE calling the handler. This preserves the existing cross-hook bridge pattern.

#### Handler 2: `transform-handler.ts`

```typescript
/**
 * Handles experimental.chat.messages.transform hook data.
 * Writes to: injection.md, events.md
 * 
 * @param projectRoot - Workspace root for path resolution
 * @param input - Injection payload from messages.transform
 */
async function handleTransform(
  projectRoot: string,
  input: InjectionPayload,
): Promise<void>
```

**Data flow from plugin:**
```
messages-transform-adapter.ts (messages.transform hook)
  ├─ Builds injection payload
  ├─ Calls: setInjectionPayload(payload)  ← existing bridge
  └─ Calls: handleTransform(projectRoot, payload)  ← NEW: direct write
```

**Behavior:**
1. Ensure session dir exists
2. Append injection record to injection.md
3. Append `INJECTION` event to events.md (summary format, low importance)

**Conflict resolution:** Currently `messages-transform-adapter.ts` calls `setInjectionPayload()` which is read by `text.complete`. The new handler adds a second write path (injection.md). Both patterns must coexist:
- `setInjectionPayload()` → bridge for text.complete (retained)
- `handleTransform()` → direct write to injection.md (new)

#### Handler 3: `event-hook-handler.ts`

```typescript
/**
 * Handles the event hook lifecycle events.
 * Writes to: events.md, diagnostics.log
 * 
 * @param projectRoot - Workspace root for path resolution
 * @param input - Normalized event data
 */
async function handleEvent(
  projectRoot: string,
  input: EventHookInput,
): Promise<void>
```

**Data flow from plugin:**
```
event-handler.ts (event hook)
  ├─ Existing: recordTrajectoryEvent() ← KEEP (CQRS write-side)
  └─ NEW: handleEvent(projectRoot, { sessionId, eventType, timestamp, ... })
```

**Behavior:**
1. Map raw SDK event type to EventType:
   - `session.started` → `SESSION_START` (HIGH)
   - `session.ended` → `SESSION_END` (HIGH)
   - `session.compacted` → `COMPACTION` (LOW)
   - `message.added` → `MESSAGE_ADDED` (MEDIUM)
   - `message.updated` → `MESSAGE_UPDATED` (LOW)
   - `tool.executed` → `TOOL_INVOCATION` (LOW, HIGH if failed)
   - `command.executed` → `COMMAND_EXECUTED` (MEDIUM)
   - `agent.created` → `DELEGATION_START` (HIGH)
   - `trajectory.started` → `DECISION` (MEDIUM)
   - `trajectory.ended` → `DECISION` (MEDIUM)
2. Append to events.md and diagnostics.log

**Important:** This handler is ADDITIVE to the existing event handler. The existing `recordTrajectoryEvent()` call must NOT be removed. The event-tracker handler adds a second write path.

#### Handler 4: `compaction-handler.ts`

```typescript
/**
 * Handles experimental.session.compacting hook data.
 * Writes to: events.md, diagnostics.log
 * 
 * @param projectRoot - Workspace root for path resolution
 * @param input - Compaction event data
 */
async function handleCompaction(
  projectRoot: string,
  input: CompactionInput,
): Promise<void>
```

**Data flow from plugin:**
```
compaction-adapter.ts (session.compacting hook)
  ├─ Existing: output.context.push(renderedContext) ← KEEP
  └─ NEW: handleCompaction(projectRoot, { sessionId, contextLines, snapshot })
```

**Behavior:**
1. Append `COMPACTION` event to events.md
2. Include: strategy, lines_before/after (if available from context length)
3. Append diagnostic line to diagnostics.log

---

### Output Format Contracts

#### `events.md` — Semantic Event Log

```markdown
---
session_id: {sessionId}
created: {ISO8601}
updated: {ISO8601}
agent: {agent}
purpose: {purpose}
trajectory: {trajectoryId | "none"}
parent_session: {parentSessionId | "none"}
child_sessions: [{childIds}]
status: {active | completed | compacted}
turns: {count}
---

# Events

## Turn {NNN} — {ISO8601} [{eventType}:{importance}]
> {summary first 500 chars}

### Tool: {toolName}
args: {truncated args}
result: {truncated result}

## Turn {NNN} — {ISO8601} [delegation:{direction}]
sub_session: {subSessionId}
scope: {scope}
status: {status}

## Turn {NNN} — {ISO8601} [compaction]
strategy: {strategy}
lines_before: {count}
lines_after: {count}
```

**Rules:**
- YAML frontmatter updated in-place on each turn
- Turn sections are append-only
- Assistant text truncated to 500 chars (per event-tracker-design)
- Tool outputs: args + result summary (first 200 chars)
- Thinking blocks: suppressed entirely
- No duplicate tool calls in same turn

#### `diagnostics.log` — Grep-Optimized Verbose Log

```
[{ISO8601ms}] T{NNN} {eventType}:{importance} {agent}> {summary first 200 chars}
[{ISO8601ms}] T{NNN} tool:{toolName} args="{truncated}" -> {result first 100 chars}
[{ISO8601ms}] T{NNN} delegation:{direction} sub:{subSessionId} scope:"{scope}"
[{ISO8601ms}] T{NNN} compaction strategy:{strategy} before:{n} after:{n}
[{ISO8601ms}] T{NNN} injection agent:{agent} role:{sessionRole} skills:{count}
```

**Rules:**
- One line per discrete event
- `fs.appendFile` (not rewrite)
- Millisecond precision timestamps
- Grep-optimized prefixes: `T{NNN}`, `tool:`, `delegation:`, `compaction:`, `injection:`
- Max line length: 300 chars (truncate beyond)

#### `injection.md` — Injection Payload History

```markdown
# Injection Log — {sessionId}

## Turn {NNN} — {ISO8601}
agent: {agent}
purpose: {purposeClass}
session_state: {sessionState}
session_role: {sessionRole}
variant: {variant}
skills: [{skill names}]
route_hint: {yes | no}
```

**Rules:**
- Append-only
- One section per user turn (when messages.transform fires)
- Skills listed as flat array, not full bundle
- No content blocks (skillFocusBlock, turnHierarchyBlock, contextBlock) — those are too verbose

#### `delegation.md` — Delegation Create/Close Events

```markdown
# Delegation Log — {sessionId}

## Turn {NNN} — {ISO8601} → CREATED
sub_session: {subSessionId}
delegated_to: {agent}
scope: {scope}
constraints: {constraints}

## Turn {NNN} — {ISO8601} ← RETURNED
sub_session: {subSessionId}
status: {status}
duration: {durationMs}s
artifacts: [{artifact paths}]
result: {resultSummary first 300 chars}
```

**Rules:**
- Append-only
- Only DELEGATION_START and DELEGATION_END events
- Duration in seconds (not milliseconds) for readability

#### `index.md` — Master Session Index

```markdown
# Session Index

| Session | Agent | Purpose | Turns | Created | Updated | Status | Parent | Children |
|---------|-------|---------|-------|---------|---------|--------|--------|----------|
| {id} | {agent} | {purpose} | {n} | {ISO8601} | {ISO8601} | {status} | {parent | —} | {children | —} |
```

**Rules:**
- One row per session
- Updated on each turn completion (single row update)
- Session IDs truncated to first 8 chars in display (full ID in code)
- Children listed as comma-separated truncated IDs

---

### Issues Found

#### Issue 1: Directory Naming Conflict — SEVERITY: HIGH

**Problem:** The proposed module path is `src/feature/event-tracker/` (singular "feature") but the existing codebase uses `src/features/` (plural "features"). All 8 existing feature modules live under `src/features/`.

**Evidence:**
- `src/features/agent-work-contract/`
- `src/features/doc-intelligence/`
- `src/features/handoff/`
- `src/features/runtime-entry/`
- `src/features/runtime-observability/`
- `src/features/session-entry/`
- `src/features/trajectory/`
- `src/features/workflow/`

**Impact:** Import paths would break. TypeScript module resolution would fail. Build would break.

**Fix:** Change to `src/features/event-tracker/` (plural).

#### Issue 2: `shared/paths.ts` Not Updated — SEVERITY: MEDIUM

**Problem:** The design proposes `getEventLogPath()` and `getSessionEventDir()` as new path helpers, but does not specify where they live. The existing `src/shared/paths.ts` exports `getErrorLogPath()` and `getSessionInspectionPath()` which are the OLD system.

**Options:**
1. Add new path helpers to `src/shared/paths.ts` alongside old ones (recommended: keeps path authority centralized)
2. Define them in `src/features/event-tracker/paths.ts` (acceptable: feature-local, no cross-module coupling)

**Recommendation:** Option 1 — add `getEventLogPath()` and `getSessionEventDir()` to `src/shared/paths.ts` and also add `eventLogDir` to the `getEffectivePaths()` return object. This preserves the Authority Principle: `shared/paths.ts` owns path resolution.

#### Issue 3: Hook Wiring Ambiguity — SEVERITY: HIGH

**Problem:** The design shows 4 hook handlers but does not clearly specify WHERE in `opencode-plugin.ts` each handler is wired. The existing plugin has specific wiring points:

- `text.complete` → lines 165-201: calls `upsertSessionInspectionExport` and `writeDiagnosticLog`
- `messages.transform` → line 203: calls `messagesTransform`
- `event` → line 63: calls `eventHandler`
- `session.compacting` → line 204: calls `compactionHandler`

**Missing specification:** The design does not state whether the new handlers REPLACE or AUGMENT the existing wiring. For `text.complete`, the old `writeDiagnosticLog` should be replaced. For `event`, the handler should be additive. For `messages.transform`, the existing `setInjectionPayload()` bridge must be retained.

**Fix:** Add explicit wiring instructions per hook:
- `text.complete`: REPLACE `writeDiagnosticLog` call with event-tracker handler. KEEP `upsertSessionInspectionExport` (session-inspection is separate per design doc decision point #2).
- `messages.transform`: ADD event-tracker handler call AFTER `setInjectionPayload()`.
- `event`: ADD event-tracker handler call AFTER `recordTrajectoryEvent()`.
- `session.compacting`: ADD event-tracker handler call AFTER `output.context.push()`.

#### Issue 4: Missing `output-rules.ts` Content — SEVERITY: MEDIUM

**Problem:** The proposed structure lists `output-rules.ts` but neither design document defines the `DEFAULT_OUTPUT_RULES` constant as a complete array. The time-machine design shows a partial `OUTPUT_RULES` array (line 293-307) with 7 rules, but the event-tracker design references pruning rules for events.md (line 138-144) that differ slightly.

**Conflict:** 
- Time-machine: `ASSISTANT_REPLY` gets `summary` with `max_length: 2000`
- Event-tracker: Assistant text gets first 500 chars

**Fix:** Unify to 500 chars for events.md (event-tracker wins — it's the primary design). Keep 2000 chars as a configurable option for future exports.

#### Issue 5: `session-inspection/` Coexistence Not Addressed — SEVERITY: LOW

**Problem:** The design doc decision point #2 says "Keep separate for now" for session-inspection, but the proposed event-tracker does not account for the fact that `text.complete` currently writes to BOTH `session-inspection` and `error-log`. If the event-tracker replaces `error-log` writes, does `session-inspection` still write in parallel?

**Current behavior (from opencode-plugin.ts lines 173-201):**
```typescript
void upsertSessionInspectionExport(directory, { sessionId, assistantText })  // session-inspection
void writeDiagnosticLog(directory, { ... })                                  // error-log (OLD)
```

**Fix:** The event-tracker handler should REPLACE `writeDiagnosticLog` but NOT touch `upsertSessionInspectionExport`. Both can coexist — they serve different purposes.

#### Issue 6: Turn Number Recovery — SEVERITY: MEDIUM

**Problem:** The design says "Read last turn number from events.md header, increment" but does not specify how to parse the turn number from the YAML frontmatter or handle the case where events.md doesn't exist yet.

**Missing logic:**
- How to extract `turns: N` from YAML frontmatter (regex? YAML parser?)
- What happens when the file is first created (turns: 0 → 1)
- What happens if the file is corrupted (fallback to 1)

**Fix:** Define a `readCurrentTurnCount(sessionDir: string): Promise<number>` function that:
1. Returns 0 if events.md doesn't exist
2. Parses `turns: (\d+)` regex from frontmatter
3. Returns 0 on parse failure (safe default)

#### Issue 7: Atomic Write Concern — SEVERITY: MEDIUM

**Problem:** The design uses `fs.appendFile` for diagnostics.log and `fs.writeFile` for events.md header updates. Concurrent writes from multiple hooks could corrupt files.

**Scenario:** `text.complete` and `event` hooks fire simultaneously for the same session. Both try to write to events.md.

**Fix:** Implement a per-session write queue (simple `Map<string, Promise<void>>`) or use `fs.appendFile` exclusively for events.md (append-only, no header rewrite — move metadata to a separate `session-meta.json`).

**Recommendation:** Move session metadata from YAML frontmatter in events.md to a separate `session-meta.json` file. This eliminates read-modify-write cycles on events.md and makes all writes append-only.

---

### Recommendations

#### Recommendation 1: Add `session-meta.json` (break out frontmatter)

Instead of YAML frontmatter in events.md, store session metadata in a separate JSON file:

```
.hivemind/event-log/{sessionId}/
├── session-meta.json    ← NEW: SessionMeta as JSON (read/write, not append)
├── events.md            ← Pure append-only turn entries
├── diagnostics.log      ← Pure append-only log lines
├── injection.md         ← Pure append-only injection records
└── delegation.md        ← Pure append-only delegation records
```

**Rationale:** Eliminates the read-modify-write anti-pattern. All markdown/log files become pure append. Only `session-meta.json` and `index.md` require rewrite, and they're small.

#### Recommendation 2: Use `src/features/` (plural)

All existing feature modules use `src/features/`. The event-tracker must follow the same convention.

#### Recommendation 3: Add path helpers to `src/shared/paths.ts`

```typescript
// In src/shared/paths.ts
export function getEventLogPath(projectRoot: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, 'event-log')
}

export function getSessionEventDir(projectRoot: string, sessionId: string): string {
  return path.join(projectRoot, HIVEMIND_DIR, 'event-log', sessionId)
}
```

And add to `getEffectivePaths()`:
```typescript
eventLogDir: path.join(root, 'event-log'),
```

#### Recommendation 4: Define explicit wiring contract in design doc

Add a section to the design doc specifying exact insertion points in `opencode-plugin.ts` for each handler, with before/after context for additive hooks.

#### Recommendation 5: Unify pruning rules

Create a single `DEFAULT_OUTPUT_RULES` array in `output-rules.ts` that covers all 13 event types. The time-machine design covers 7; the event-tracker design references more. Merge both into one canonical array.

#### Recommendation 6: Do NOT create `output-rules.ts` as a separate file

The `OutputRule` interface and `DEFAULT_OUTPUT_RULES` constant are small (~80 LOC combined). They should live in `types.ts` rather than a separate file. This follows the Interface Decomposition principle (no unnecessary splitting of small concerns).

---

### Verification Criteria for hiveq

After implementation, verify:

1. `npx tsc --noEmit` passes — no type errors
2. `src/features/event-tracker/` contains exactly the files in the proposed structure (with `features` plural)
3. `grep -r "@opencode-ai" src/features/event-tracker/` returns ZERO matches — no SDK imports
4. `grep -r "src/hooks" src/features/event-tracker/` returns ZERO matches — no hook imports
5. New session creates `.hivemind/event-log/{sessionId}/events.md` with correct YAML frontmatter
6. Assistant completion appends a turn entry with tool calls
7. `diagnostics.log` is greppable: `grep "T002" .hivemind/event-log/*/diagnostics.log` returns turn 2 events
8. `index.md` shows all sessions with correct turn counts and status
9. `injection.md` captures the injection payload from `messages.transform`
10. `delegation.md` captures delegation create/return events with parent↔child linkage
11. Existing `session-inspection/` writes are NOT affected
12. Existing `recordTrajectoryEvent()` calls are NOT affected

---

### Summary of Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | `feature/` vs `features/` naming | HIGH | Must fix before implementation |
| 2 | Path helpers not in `shared/paths.ts` | MEDIUM | Should fix — preserves Authority Principle |
| 3 | Hook wiring ambiguity | HIGH | Must fix — specify exact insertion points |
| 4 | Missing DEFAULT_OUTPUT_RULES | MEDIUM | Must fix — unify time-machine + event-tracker rules |
| 5 | session-inspection coexistence | LOW | Document decision, no code change |
| 6 | Turn number recovery logic | MEDIUM | Must specify parse/fallback logic |
| 7 | Atomic write concurrency | MEDIUM | Recommend session-meta.json separation |