# Session Inspection Export

- ses_id: `ses_2e4e08b8fffe0eS5auMxWRgRgk`
- prepared_at: `2026-03-23T14:38:54.538Z`

## Assistant Output

Now I have both designs and the codebase ground truth. Let me produce the synthesis and phased TDD plan.

---

## Architecture Decision Summary

### What EXISTS in Code (Ground Truth)

| File | What It Does | Problem |
|------|--------------|---------|
| `diagnostic-log.ts` | Writes `.hivemind/error-log/{ses_id}-{timestamp}.md` per turn | **File explosion** - 92 files for ~10 sessions |
| `session-inspection.ts` | Overwrites `.hivemind/session-inspection/{ses_id}/assistant-output.md` per turn | **History loss** - overwrites discard prior turns |
| `paths.ts` | `SESSIONS_DIR = 'sessions'`, `getSessionPath()` → `.hivemind/sessions/{id}` | **Existing path is `sessions/`, NOT `event-log/`** |
| `opencode-plugin.ts` | Wires `experimental.text.complete` → writes both diagnostic-log AND session-inspection | Dual-write chaos |
| `event-handler.ts` | Routes OpenCode `event` hook to trajectory ledger | Works, but doesn't contribute to session journals |
| `injection-store.ts` | In-memory Map bridging `messages.transform` → `text.complete` | Works for single-session |

### Design Conflict Analysis

| Aspect | Time-Machine Design | Event-Tracker Design | Resolution |
|--------|---------------------|----------------------|------------|
| **Root directory** | `.hivemind/sessions/` | `.hivemind/event-log/` | **Use `sessions/`** — already exists in `paths.ts` |
| **Session metadata** | `session.json` | Frontmatter in `events.md` | **Hybrid** — `session.json` for machine-parseable, frontmatter for human |
| **Event log format** | `journal.md` | `events.md` | **Use `events.md`** — simpler name |
| **Diagnostic verbose** | `diagnostics/{turn}.log` | `diagnostics.log` single file | **Use single `diagnostics.log`** — append-only per session |
| **Sub-session linking** | `parent_ses_id`/`root_ses_id` fields | Via delegation.md | **Use delegation.md** with parent/child tracking |
| **Index** | `journal-index.json` + `index.md` | `event-log/index.md` | **Use `sessions/index.json`** — machine-parseable, created on-demand |
| **Token accounting** | Yes | No | **Omit** — not observable from hooks |
| **Content hashing** | SHA-256 | No | **Omit** — premature complexity |
| **Query tool** | `hivemind_query_sessions` | No | **Omit** — future work |

### What from Each Design Is Valid

**From Event-Tracker (applicable):**
- ✅ Replace `error-log/` with per-session `events.md` + `diagnostics.log` structure
- ✅ Append-only session event log (not overwrite like session-inspection)
- ✅ Hook integration points: `messages.transform` → injection log, `text.complete` → event log
- ✅ Master index for session discovery
- ✅ Migration from existing error-log files

**From Time-Machine (applicable):**
- ✅ Session metadata schema (`session.json`)
- ✅ Sub-session relationship tracking via delegation chain
- ✅ Structured event taxonomy for classification
- ✅ Importance scoring for pruning
- ✅ Clean separation: readable journal vs. verbose diagnostics

### What Needs to Change vs What's New

| Item | Action |
|------|--------|
| `diagnostic-log.ts` | **Replace** — consolidate into event-tracker module |
| `session-inspection.ts` | **Keep** — serves different purpose (purification commands) |
| `paths.ts` | **Extend** — add `getEventLogPath()`, keep `getSessionPath()` canonical |
| `opencode-plugin.ts` | **Refactor** — single write path, not dual-write |
| `event-handler.ts` | **Extend** — also write to event-tracker |
| New module: `src/features/event-tracker/` | **Create** — replaces diagnostic-log.ts |

### Key Constraints

1. **SDK-independent**: `src/features/event-tracker/` must use only `node:fs/promises` and `node:path` — no `@opencode-ai/sdk` imports
2. **Path stability**: Use existing `SESSIONS_DIR` path constant, don't introduce `event-log/` root
3. **Existing hooks**: Wire into existing hooks, don't add new ones
4. **No new files unnecessarily**: Extend existing files where possible

---

## Phased TDD Plan

### Unit 1: Path Extensions and Types
**Scope:** Add event-log paths to `paths.ts` and define core types

**RED (test first):**
```typescript
// tests/features/event-tracker/paths.test.ts
// Test: getEventLogPath returns correct path
// Test: getSessionEventsPath returns {sessionId}/events.md
// Test: getSessionDiagnosticsPath returns {sessionId}/diagnostics.log
// Test: session folder constants are exported
```

**GREEN (minimal implementation):**
- Add to `paths.ts`:
  - `EVENT_LOG_DIR = 'event-log'` (not root — goes inside SESSIONS_DIR)
  - `getEventLogPath(projectRoot)` → `{HIVEMIND_DIR}/event-log`
  - `getSessionEventsPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/events.md`
  - `getSessionDiagnosticsPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/diagnostics.log`
  - `getSessionDelegationPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/delegation.md`
  - `getSessionInjectionPath(projectRoot, sessionId)` → `{SESSIONS_DIR}/{sessionId}/injection.md`

- Add to `src/features/event-tracker/types.ts`:
  ```typescript
  export interface SessionMetadata {
    sessionId: string
    parentSessionId?: string
    rootSessionId: string
    agent: string
    purpose: string
    createdAt: string
    updatedAt: string
    status: 'active' | 'done' | 'error'
    turnCount: number
  }

  export interface TurnEvent {
    turnNumber: number
    timestamp: string
    eventType: 'user' | 'assistant' | 'delegation' | 'compaction' | 'tool'
    role?: string
    summary: string
    skills?: string[]
    injection?: InjectionRecord
  }

  export interface DelegationRecord {
    subSessionId: string
    delegatedTo: string
    scope: string
    createdAt: string
    returnedAt?: string
    status?: 'active' | 'completed' | 'error'
    duration?: number
  }
  ```

**REFACTOR:**
- Ensure all path builders use `path.join()` correctly
- No path string concatenation with `/`

**Verification:**
- `npx tsc --noEmit` passes
- Tests confirm path structure matches design

---

### Unit 2: Session Folder Initialization
**Scope:** Ensure session folder exists with `session.json` on first event

**RED:**
```typescript
// tests/features/event-tracker/session-folder.test.ts
// Test: First event for new sessionId creates folder + session.json
// Test: Subsequent events for existing sessionId don't recreate folder
// Test: session.json contains correct metadata
```

**GREEN:**
- Create `src/features/event-tracker/session-folder.ts`:
  - `ensureSessionFolder(projectRoot, sessionId, metadata)` — creates folder + session.json
  - `updateSessionMetadata(projectRoot, sessionId, updates)` — updates turnCount, updatedAt
  - Uses `fs.mkdir` with `recursive: true`
  - Uses `fs.readFile` → parse → merge → `fs.writeFile` for updates

**REFACTOR:**
- Extract `session.json` schema to types.ts
- No duplicate folder creation on each call

**Verification:**
- Manual test: start new session, verify `.hivemind/sessions/{ses_id}/session.json` exists
- `npx tsc --noEmit` passes

---

### Unit 3: Event Writer — Append to events.md
**Scope:** Write turn events to append-only `events.md`

**RED:**
```typescript
// tests/features/event-tracker/event-writer.test.ts
// Test: appendTurnEvent writes Turn 001, 002, 003 sections correctly
// Test: First turn creates events.md with frontmatter
// Test: Subsequent turns append without overwriting
// Test: Turn numbering increments correctly
```

**GREEN:**
- Create `src/features/event-tracker/event-writer.ts`:
  - `appendTurnEvent(projectRoot, sessionId, event)` — appends turn section
  - `renderTurnSection(turn: TurnEvent)` — formats as markdown
  - Frontmatter on first write only, then append sections
  - Uses `fs.appendFile` for appends
  - Turn number derived from existing file content or start at 001

**REFACTOR:**
- Pruning rules from event-tracker design:
  - Assistant text: first 500 chars (summary)
  - Tool outputs: args + first 200 chars of result
  - Thinking blocks: suppressed
  - No duplicate tool calls in same turn

**Verification:**
- Run session with 3 turns, verify `events.md` has 3 turn sections
- Each turn section has correct timestamp and turn number
- `npx tsc --noEmit` passes

---

### Unit 4: Diagnostic Log Writer — Append to diagnostics.log
**Scope:** Write one-line-per-event to `diagnostics.log`

**RED:**
```typescript
// tests/features/event-tracker/diagnostic-writer.test.ts
// Test: appendDiagnosticEntry writes single line with timestamp, turn, event type
// Test: Line format matches grep-optimized pattern: [ISO8601] T{n} type> summary
// Test: Delegation events include sub_session id
```

**GREEN:**
- Create `src/features/event-tracker/diagnostic-writer.ts`:
  - `appendDiagnosticEntry(projectRoot, sessionId, entry)` — single line append
  - `renderDiagnosticLine(entry)` — one-line format
  - Format: `[{timestamp}] T{turnNumber} {eventType}:{role} {summary}> {details}`
  - Uses `fs.appendFile`

**REFACTOR:**
- Grep-optimized format from event-tracker design
- No duplicate lines for same tool+args in same turn

**Verification:**
- Run session, verify `diagnostics.log` has greppable lines
- `grep "T001"` returns all events for turn 1
- `grep "delegation:"` returns delegation events

---

### Unit 5: Injection Log Writer
**Scope:** Log injection payload from messages.transform

**RED:**
```typescript
// tests/features/event-tracker/injection-writer.test.ts
// Test: appendInjectionEntry writes injection payload for turn
// Test: Records purposeClass, sessionRole, skillBundle
// Test: Only records when injection exists (not all turns)
```

**GREEN:**
- Create `src/features/event-tracker/injection-writer.ts`:
  - `appendInjectionEntry(projectRoot, sessionId, injection)` — writes injection.md section
  - Reads current `injection.md`, appends new section or creates new file
  - Only called when `injection` payload exists (guarded in plugin)

**REFACTOR:**
- Minimal format — just the payload, no duplication with events.md

**Verification:**
- Run with skills injection, verify `injection.md` has skill list
- `npx tsc --noEmit` passes

---

### Unit 6: Delegation Log Writer
**Scope:** Track parent↔sub-session relationships

**RED:**
```typescript
// tests/features/event-tracker/delegation-writer.test.ts
// Test: appendDelegationCreated writes CREATED event
// Test: appendDelegationReturned writes RETURNED event with duration
// Test: Delegation chain is queryable from diagnostics.log
```

**GREEN:**
- Create `src/features/event-tracker/delegation-writer.ts`:
  - `appendDelegationCreated(projectRoot, sessionId, delegation)` — logs sub-session creation
  - `appendDelegationReturned(projectRoot, sessionId, subSessionId, result)` — logs return
  - Delegation record includes: subSessionId, delegatedTo, scope, constraints, duration, artifacts

**REFACTOR:**
- Delegation records are queryable via `grep "delegation:"` in diagnostics.log
- Parent↔child linkage via delegation.md

**Verification:**
- Delegate to subagent, verify delegation.md has both CREATED and RETURNED entries
- `grep "ses_xxx_sub1"` finds both creation and return

---

### Unit 7: Plugin Wiring — Replace writeDiagnosticLog Call
**Scope:** Wire event-tracker into opencode-plugin.ts, remove dual-write

**RED:**
```typescript
// tests/features/event-tracker/integration.test.ts
// Test: text.complete calls event-writer, not writeDiagnosticLog
// Test: messages.transform calls injection-writer
// Test: event hook calls event-writer for session events
```

**GREEN:**
- Modify `opencode-plugin.ts`:
  - Import event-writer, diagnostic-writer, injection-writer, delegation-writer from `src/features/event-tracker/`
  - In `experimental.text.complete` handler:
    - Call `appendTurnEvent()` for the assistant turn
    - Call `appendDiagnosticEntry()` for the diagnostic line
  - In `experimental.chat.messages.transform` handler (already stores injection):
    - After `setInjectionPayload()`, also call `appendInjectionEntry()`
  - In `event` hook handler (via event-handler.ts):
    - For `session.compacted`: call `appendTurnEvent()` with compaction event type
    - For delegation events: call `appendDelegationCreated/Returned()`
  - **Remove** the `writeDiagnosticLog()` call (replaced by event-tracker)
  - **Keep** `upsertSessionInspectionExport()` — separate purpose

**REFACTOR:**
- Remove `writeDiagnosticLog` from `sdk-supervisor/index.ts` exports
- Keep `diagnostic-log.ts` file but it becomes unused (can delete in cleanup phase)

**Verification:**
- New session creates `.hivemind/sessions/{ses_id}/events.md`
- Diagnostic lines appear in `diagnostics.log`
- Old `error-log/` files stop being created for new sessions

---

### Unit 8: Master Session Index
**Scope:** Maintain `sessions/index.json` for session discovery

**RED:**
```typescript
// tests/features/event-tracker/index-writer.test.ts
// Test: First session creates index.json with session entry
// Test: New turns update turnCount and updatedAt
// Test: Sub-sessions appear in parent's children array
```

**GREEN:**
- Create `src/features/event-tracker/index-writer.ts`:
  - `upsertSessionIndex(projectRoot, sessionId, metadata)` — create or update index entry
  - Index format from event-tracker design: table with Session|Agent|Purpose|Turns|Created|Updated|Status|Parent|Children
  - Stored as `sessions/index.json` (not separate `event-log/`)

**REFACTOR:**
- Update index on every turn completion (cheap single-row update)
- Sub-sessions linked via parentSessionId field

**Verification:**
- Multiple sessions appear in index.json
- `grep` finds sessions by agent or status

---

### Unit 9: Migration from error-log
**Scope:** One-time migration script to convert existing error-log files

**RED:**
```typescript
// tests/features/event-tracker/migration.test.ts
// Test: Parse existing error-log file and extract turn data
// Test: Group by sessionId correctly
// Test: Generate events.md structure from error-log content
```

**GREEN:**
- Create `src/features/event-tracker/migration.ts`:
  - `migrateErrorLog(projectRoot)` — reads all `{ses_id}-{timestamp}.md` files
  - Groups by sessionId
  - Creates session folders with `events.md` and `session.json`
  - Writes to new structure
  - **Does NOT delete** old error-log files (user confirms first)
  - Reports: files migrated, sessions processed, errors

**REFACTOR:**
- Migration is idempotent (can run multiple times safely)
- Reports what was done, not destructive

**Verification:**
- Run migration, verify `sessions/` has converted sessions
- Old `error-log/` still exists until user deletes

---

## Open Questions

1. **Should session-inspection overwrite be preserved?**
   - Current `session-inspection/` serves purification commands
   - The overwrite behavior (latest assistant text only) may be intentional for quick inspection
   - **Recommendation:** Keep `session-inspection/` separate, event-tracker is additive

2. **Should old error-log files be deleted after migration?**
   - Event-tracker design recommends delete after migration
   - But some users may want to keep for comparison
   - **Recommendation:** Don't auto-delete. Migration script reports what would be deleted. User manually deletes.

3. **Turn numbering scope — per session or per main session?**
   - Sub-sessions have their own turn numbers
   - Should main session's turn number include sub-session turns?
   - **Recommendation:** Per-session turn numbers. Main session counts its own turns. Sub-session has independent count.

4. **Should we keep the `events.md` format vs `journal.md`?**
   - Event-tracker uses `events.md`, time-machine uses `journal.md`
   - `events.md` is more descriptive of content
   - **Recommendation:** Use `events.md`

5. **How to handle compaction events?**
   - Current: `session.compacted` triggers recovery checkpoint + trajectory event
   - Should it also write to event-tracker?
   - **Recommendation:** Yes — compaction is a lifecycle event, should appear in diagnostics.log and events.md

6. **Delegation tracking — when does CREATED fire?**
   - At delegation handoff (when sub-session is spawned)
   - Which hook captures this?
   - **Recommendation:** Delegation CREATED fires from `hivemind_handoff` tool execution. RETURNED fires when sub-session ends. Need to ensure event-handler can classify delegation tool calls.