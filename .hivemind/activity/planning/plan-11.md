# Plan #11: Session Export + Ingestion Pipeline (Unit 10)

**Goal:** Bridge the gap between runtime hooks (which write granular events) and the turn parser (which expects session markdown). On every assistant completion, produce session markdown in the format the parser consumes, then feed it through parser → classifier → writers for journal updates.

**Created:** 2026-03-24
**Estimated Steps:** 6
**Unit:** 10 — Session Export + Ingestion Pipeline
**Depends On:** Plan #10 (hook handlers wired to plugin, all writers functional)

---

## Problem Statement

The hooks → writers pipeline works for real-time granular journaling (`events.md`, `session.json`, `diagnostics.log`). The parser → classifier → writers pipeline works for post-hoc analysis of session markdown files. **No bridge exists** between them. The hooks write `## assistant_output` blocks; the parser expects `## User` / `## Assistant (Agent · model · duration)` turn pairs. User messages are not captured at all.

### Data Flow Gap (Current)

```
hooks → events.md (## assistant_output, ## compaction)
                    ✗ WRONG FORMAT — parser cannot consume
parser → ParsedTurn[] → classifier → EventEntry[] → writers
         ✗ NO INPUT — no session markdown to parse
```

### Data Flow Target

```
hooks → granular journal (events.md, session.json, diagnostics.log)   [EXISTS]
     → user message capture                                            [MISSING]
     → session-export.md (## User / ## Assistant format)               [MISSING]
     → parseSession(export) → classifyTurnEvents() → writers           [MISSING]
```

---

## Prerequisites

| Prerequisite | Status | Owner |
|-------------|--------|-------|
| `src/hooks/text-complete-handler.ts` functional | ✅ Ready | Plan #10 |
| `src/hooks/compaction-handler.ts` functional | ✅ Ready | Plan #10 |
| `src/hooks/transform-handler.ts` functional | ✅ Ready | Plan #10 |
| `src/features/event-tracker/parser/turn-parser.ts` functional | ✅ Ready | Plan #4 |
| `src/features/event-tracker/classifier/event-classifier.ts` functional | ✅ Ready | Plan #5 |
| `src/features/event-tracker/writers/` all functional | ✅ Ready | Plans #6-8 |
| `src/plugin/injection-store.ts` functional | ✅ Ready | Existing |
| `src/plugin/messages-transform-adapter.ts` captures user message text | ✅ Ready | Existing |
| `src/features/event-tracker/paths.ts` owns path resolution | ✅ Ready | Existing |

---

## Architecture Decision: Incremental Turn File + On-Completion Ingestion

**Rejected Alternatives:**

| Alternative | Why Rejected |
|-------------|-------------|
| Reconstruct session.md from events.md at export time | Events lack user messages, thinking blocks, tool I/O — reconstruction would be lossy and fragile |
| Write full session.md on every hook fire (messages.transform + text.complete) | Full rewrite every turn is O(n) disk I/O; append-only is O(1) |
| Post-session batch export | User requirement says "auto-update on every assistant completion" — batch defers too long |

**Chosen Approach: Incremental Turn Append**

1. **messages.transform** writes user message turn block to `turns.md` (append-only)
2. **text.complete** appends assistant turn block to `turns.md` (append-only)
3. **text.complete** triggers ingestion: read `session.json` + `turns.md`, parse, classify, write events
4. Session header is maintained in `session.json` (already written by text-complete-handler)

This gives O(1) writes, incremental updates, and full parser compatibility.

---

## Steps

### Step 1: User Message Capture via messages.transform

**Target Agent:** hivemaker
**Scope:** `src/hooks/user-message-writer.ts` (new, ≤100 LOC), `src/features/event-tracker/paths.ts` (add 1 function)
**Dependencies:** none (existing infrastructure)
**Success Criteria:**
- `createUserMessageWriter({ directory })` factory returns async handler
- Handler extracts user message text from `findLastUserMessage(messages)` via `getMessageText()`
- Appends `## User\n\n{messageText}\n\n---\n\n` block to `.hivemind/sessions/{sessionId}/turns.md`
- Creates parent directory if needed (via `base-writer.ts` patterns)
- Gracefully no-ops when `sessionID` or user message text is missing
- Test: `tests/hooks/user-message-writer.test.ts` — writes correct markdown block, handles missing data

**Delegation Packet:**
```
Target: hivemaker
Scope: Create src/hooks/user-message-writer.ts + add getSessionTurnsPath() to paths.ts
Context: The chat.messages.transform hook has access to user message text via getMessageText().
We need to persist it as a ## User markdown block to turns.md for later session export.
Constraints:
  - ESM .js, node:test + node:assert/strict
  - ≤100 LOC per file
  - Use appendExactUtf8Content from base-writer.ts
  - Factory pattern: createUserMessageWriter(deps) → async handler
  - Append format: "## User\n\n{text}\n\n---\n\n"
  - Do NOT modify messages-transform-adapter.ts (that's Plan #10 territory)
  - Only capture variant 'new' and 'continue' messages (skip tool results)
Return: files written, test status
```

---

### Step 2: Session Header Writer Integration

**Target Agent:** hivemaker
**Scope:** `src/features/event-tracker/writers/session-markdown-writer.ts` (new, ≤150 LOC)
**Dependencies:** Step 1 (turns.md path exists)
**Success Criteria:**
- `writeSessionHeader(projectRoot, sessionId)` reads `session.json` metadata and writes header block to top of `session-export.md`
- Header format: `# {title}\n\n**Session ID:** {sessionId}\n**Created:** {created}\n**Updated:** {updated}\n\n---\n`
- `upsertSessionExport(projectRoot, sessionId)` reads `session.json` + `turns.md`, assembles full `session-export.md`
- Assembly: header from session.json + turns from turns.md
- Idempotent: rewrites session-export.md from source-of-truth files
- Test: `tests/writers/session-markdown-writer.test.ts` — assembles correct format from fixture data

**Delegation Packet:**
```
Target: hivemaker
Scope: Create src/features/event-tracker/writers/session-markdown-writer.ts
Context: We have session.json (metadata) and turns.md (## User / ## Assistant blocks).
We need a writer that assembles these into session-export.md in the exact format
the parser (turn-parser.ts) expects.
Constraints:
  - ESM .js, node:test + node:assert/strict
  - ≤150 LOC
  - Read session.json via getSessionMetadataPath()
  - Read turns.md via getSessionTurnsPath() (from Step 1)
  - Write session-export.md via getSessionExportPath() (add to paths.ts)
  - Header format must match parser/header-parser.ts expected pattern
  - Turn blocks must match parser/splitter.ts expected ## User boundary pattern
  - Must be idempotent (full rewrite from source files)
  - Export: writeSessionExport(projectRoot, sessionId): Promise<void>
Return: files written, test status
```

---

### Step 3: Ingestion Pipeline Orchestrator

**Target Agent:** hivemaker
**Scope:** `src/features/event-tracker/ingest/session-ingestor.ts` (new, ≤200 LOC)
**Dependencies:** Step 2 (session-export.md writer exists)
**Success Criteria:**
- `ingestSession(projectRoot, sessionId)` orchestrates full pipeline:
  1. Read `session-export.md` from disk
  2. Call `parseSession(markdown)` → `ParsedSession`
  3. For each turn: call `classifyTurnEvents({ sessionId, timestamp, turn })` → `EventEntry[]`
  4. Map via `mapEventEntryToSessionEventInput()` → `SessionEventWriteInput[]`
  5. Write each via `appendSessionEvent()`
  6. Update `session.json` metadata via `initOrUpdateSessionMetadata()`
- Deduplication: track last-ingested turn count in `session.json` metadata field (`lastIngestedTurns: number`)
- Skip turns already ingested (compare turn count)
- Idempotent: re-running on same session-export.md produces no duplicate events
- Error resilience: `.catch(() => undefined)` on all writer calls (matches existing pattern)
- Test: `tests/ingest/session-ingestor.test.ts` — ingests fixture session, no duplicates on re-run

**Delegation Packet:**
```
Target: hivemaker
Scope: Create src/features/event-tracker/ingest/session-ingestor.ts
Context: We have session-export.md in parser-compatible format. We need an ingestion
pipeline that reads it, parses it, classifies turns, and writes events to the journal.
The classifier, parser, writer-adapter, and writers already exist.
Constraints:
  - ESM .js, node:test + node:assert/strict
  - ≤200 LOC
  - Import parseSession from parser/turn-parser.ts
  - Import classifyTurnEvents from classifier/event-classifier.ts
  - Import mapEventEntryToSessionEventInput from classifier/writer-adapter.ts
  - Import appendSessionEvent from writers/events-writer.ts
  - Import initOrUpdateSessionMetadata from writers/session-writer.ts
  - Dedup via lastIngestedTurns field in session.json metadata
  - Error resilience: all writes wrapped in .catch(() => undefined)
  - Export: ingestSession(projectRoot, sessionId): Promise<IngestResult>
    where IngestResult = { turnsIngested: number, eventsWritten: number }
Return: files written, test status
```

---

### Step 4: Ingestion Trigger in text-complete-handler

**Target Agent:** hivemaker
**Scope:** `src/hooks/text-complete-handler.ts` (modify, add ≤20 LOC), `src/hooks/index.ts` (add export)
**Dependencies:** Steps 1-3 (all pipeline modules exist)
**Success Criteria:**
- After existing `appendSessionEvent` + `initOrUpdateSessionMetadata` + `appendSessionDiagnostic` calls, add:
  1. Call `writeSessionExport(directory, sessionId)` to refresh session-export.md
  2. Call `ingestSession(directory, sessionId)` to run parser → classifier → writers
- Both calls wrapped in `.catch(() => undefined)` (error resilience)
- Existing behavior preserved — new calls are additive, not replacing
- No new imports from outside event-tracker/ and hooks/ domains
- Test: existing `tests/hooks/text-complete-handler.test.ts` still passes; new test verifies ingestion trigger fires

**Delegation Packet:**
```
Target: hivemaker
Scope: Modify src/hooks/text-complete-handler.ts to trigger ingestion after journal writes
Context: The text-complete-handler already writes events + metadata + diagnostics.
We add two calls after the existing writes: writeSessionExport() and ingestSession().
These are fire-and-forget (.catch(() => undefined)).
Constraints:
  - ≤20 LOC added to existing file (file stays ≤104 LOC total)
  - Imports from writers/session-markdown-writer.js and ingest/session-ingestor.js
  - Both calls wrapped in .catch(() => undefined)
  - Existing test suite must still pass
  - Add new test verifying ingestion is triggered
Return: diff, test status
```

---

### Step 5: Plugin Wiring for user-message-writer

**Target Agent:** hivemaker
**Scope:** `src/plugin/opencode-plugin.ts` (modify, add ≤15 LOC), `src/hooks/index.ts` (add export)
**Dependencies:** Step 1 (user-message-writer exists)
**Success Criteria:**
- Import `createUserMessageWriter` from `../hooks/user-message-writer.js`
- Instantiate: `const userMessageWriter = createUserMessageWriter({ directory })`
- In `chat.message` hook: call `await userMessageWriter(messageInput, output).catch(() => undefined)` (or call after snapshot logic)
- chat.message hook behavior preserved — user message write is additive
- No interference with existing turnSnapshot.resetTurnSnapshot() logic
- Test: verify chat.message hook fires user message write

**Delegation Packet:**
```
Target: hivemaker
Scope: Wire createUserMessageWriter into opencode-plugin.ts chat.message hook
Context: The chat.message hook currently resets turn snapshot and shows governance toasts.
We add a user message writer call to capture user text to turns.md.
Constraints:
  - ≤15 LOC added to plugin file
  - Import from hooks/index.js (barrel)
  - Fire-and-forget: .catch(() => undefined)
  - Do NOT modify existing chat.message logic — add after it
  - User message writer must handle the full chat.message hook signature
Return: diff, test status
```

---

### Step 6: Integration Test — Full Pipeline E2E

**Target Agent:** hivemaker
**Scope:** `tests/ingest/pipeline-e2e.test.ts` (new, ≤250 LOC)
**Dependencies:** Steps 1-5 (all modules wired)
**Success Criteria:**
- Test fixture: hand-written session markdown with 2 user/assistant turns
- Test writes fixture to turns.md + session.json metadata
- Calls `writeSessionExport()` → verifies session-export.md matches expected format
- Calls `ingestSession()` → verifies events.md contains classified events
- Verifies no duplicate events on re-ingestion
- Verifies session.json metadata updated with correct turn count
- All assertions use `node:assert/strict`
- Test passes with `npx tsx --test tests/ingest/pipeline-e2e.test.ts`

**Delegation Packet:**
```
Target: hivemaker
Scope: Create tests/ingest/pipeline-e2e.test.ts — end-to-end pipeline test
Context: All pipeline modules exist. We need an integration test that exercises
user message capture → session export → ingestion → journal update in one flow.
Constraints:
  - ESM .js, node:test + node:assert/strict
  - ≤250 LOC
  - Use temporary directory for test artifacts (fs.mkdtemp)
  - Fixture: 2 user/assistant turn pairs in turns.md format
  - Verify: session-export.md format, events.md content, session.json metadata
  - Verify: idempotent re-ingestion (no duplicate events)
  - Clean up temp directory after test
Return: test file, pass/fail status
```

---

## Parallelism Analysis

| Group | Steps | Can Parallelize? | Rationale |
|-------|-------|------------------|-----------|
| A | Step 1 (user-message-writer) | Yes | No dependencies on other new modules |
| B | Step 2 (session-markdown-writer) | Partially — needs Step 1 paths | Needs `getSessionTurnsPath` from Step 1, but can start with inline path |
| C | Step 3 (ingestor) | Yes | Depends only on existing parser/classifier/writers |
| D | Step 4 (handler modification) | No | Needs Steps 1-3 complete |
| E | Step 5 (plugin wiring) | No | Needs Step 1 complete |
| F | Step 6 (E2E test) | No | Needs Steps 1-5 complete |

**Optimal sequence:**
- Parallel: Steps 1 + 3 (user-message-writer and ingestor are independent)
- Sequential: Step 2 after Step 1 (paths dependency)
- Sequential: Step 4 after Steps 1-3 (handler imports new modules)
- Sequential: Step 5 after Step 1 (plugin wires user-message-writer)
- Sequential: Step 6 after Steps 1-5 (E2E needs everything)

---

## File Map

| File | Type | LOC | Step |
|------|------|-----|------|
| `src/hooks/user-message-writer.ts` | New | ≤100 | 1 |
| `src/features/event-tracker/paths.ts` | Modify (+2 functions) | +12 | 1 |
| `src/features/event-tracker/writers/session-markdown-writer.ts` | New | ≤150 | 2 |
| `src/features/event-tracker/ingest/session-ingestor.ts` | New | ≤200 | 3 |
| `src/hooks/text-complete-handler.ts` | Modify (+15 LOC) | +15 | 4 |
| `src/hooks/index.ts` | Modify (+1 export) | +1 | 4 |
| `src/plugin/opencode-plugin.ts` | Modify (+15 LOC) | +15 | 5 |
| `tests/hooks/user-message-writer.test.ts` | New | ≤150 | 1 |
| `tests/writers/session-markdown-writer.test.ts` | New | ≤150 | 2 |
| `tests/ingest/session-ingestor.test.ts` | New | ≤200 | 3 |
| `tests/ingest/pipeline-e2e.test.ts` | New | ≤250 | 6 |

**Total new LOC:** ~810 (within bounds)
**Total modified LOC:** ~43 (minimal, additive)

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **User message not available in chat.message hook** — `getMessageText()` returns empty for tool-result messages | Medium | High | Guard: only write when text length > 0. Parser handles empty `## User` blocks gracefully (userMessage = '') |
| **Race condition: messages.transform and text.complete fire concurrently** — user message write and assistant write interleave | Low | Medium | Node.js is single-threaded; appendExactUtf8Content is synchronous write. Turn ordering is guaranteed by hook firing order (messages.transform → LLM → text.complete) |
| **Duplicate events on re-ingestion** — if session-export.md is re-read without dedup | Medium | Medium | `lastIngestedTurns` counter in session.json. Skip turns ≤ lastIngestedTurns. Counter increments after successful ingestion |
| **session.json metadata staleness** — ingestion reads old metadata | Low | Low | Ingestion runs after text-complete-handler already updates session.json. Timing is guaranteed by sequential hook execution |
| **Parser format mismatch** — turns.md blocks don't match parser expectations | Medium | High | Integration test (Step 6) validates round-trip: write → parse → classify. Any format drift is caught immediately |
| **Ingestion latency adds to text.complete hook time** — parse + classify + write on every turn | Low | Medium | Ingestion is fire-and-forget (.catch). Even if it takes 100ms, it's async and doesn't block OpenCode |

---

## Architect Decisions Needed

| Decision | Context | Urgency |
|----------|---------|---------|
| **User message source: chat.message vs messages.transform vs text.complete** | chat.message fires first but may lack text. messages.transform has text but fires for injection, not capture. text.complete fires last but doesn't have user text. | Before Step 1 |
| **Session export path: session-export.md vs session.md** | session-export.md is clearer (it's an export, not the canonical session). But session.md is shorter and matches parser convention. | Before Step 2 |
| **Dedup strategy: turn counter vs content hash vs timestamp** | Turn counter is simplest but fragile if turns.md is manually edited. Content hash is robust but adds complexity. Timestamp is middle-ground. | Before Step 3 |
| **When to trigger ingestion: every text.complete vs on-demand vs both** | User requirement says "auto-update on every assistant completion." On-demand (via hivemind_runtime_command) is useful for backfill. | Before Step 4 |

---

## Success Criteria (Plan-Level)

1. ✅ On every assistant completion, `session-export.md` is refreshed with latest turns
2. ✅ Parser can consume `session-export.md` without errors (`parseSession()` returns valid `ParsedSession`)
3. ✅ Classifier produces `EventEntry[]` from parsed turns
4. ✅ Events are written to `events.md` via existing writers
5. ✅ No duplicate events on re-ingestion
6. ✅ All existing tests still pass
7. ✅ New tests cover: user-message-writer, session-markdown-writer, session-ingestor, E2E pipeline
8. ✅ Each new file ≤300 LOC
9. ✅ Error resilience: no hook failure can break the OpenCode lifecycle

---

## Verification Gate

Before marking plan complete:
- [ ] Every step has a target agent
- [ ] Every step has verifiable success criteria
- [ ] Dependencies correctly sequenced (no circular deps)
- [ ] Each step small enough for single delegation
- [ ] File map covers all touchpoints
- [ ] Risks have mitigations
- [ ] Architect decisions flagged where needed
