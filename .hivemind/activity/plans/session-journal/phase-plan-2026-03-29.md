# Revised Phase Plan: Session Journal Refactor

**ID:** PLAN-2026-03-29-SJ
**Spec:** SPEC-2026-03-25-001 (R1-R9) + ADR-018 (D1-D7)
**Created:** 2026-03-29
**Status:** Active
**Supersedes:** PLAN-2026-03-25-001 (prior plan phases P0-P9)

---

## Problem With Prior Plan

The prior plan (P0-P9) declared P0-P2 "Complete" but the actual implementation is broken:

| Claim | Reality |
|-------|---------|
| P3 (Consolidated Writer) complete | `consolidated-writer.ts` EXISTS and is functional, but many tests importing from it are RED-phase stubs that fail |
| P4 (Hook Migration) complete | `chat-message-handler.ts` and `tool-execution-handler.ts` EXIST but are **NOT WIRED** in `opencode-plugin.ts` |
| P5 (User Messages) complete | Handler exists, NOT wired → `userMessageCount` always 0 |
| P6 (Tool Invocations) complete | Handler exists, NOT wired → `toolCallCount` always 0 |
| P7 (Sub-Session Linking) not started | `linkSubSession` function EXISTS in consolidated-writer but is never called |
| P8 (Legacy Cleanup) not started | `writeDiagnosticLog` and `upsertSessionInspectionExport` are STILL CALLED in plugin |

**Root cause:** The prior plan focused on building writer infrastructure (which exists) but missed the wiring gap. The new plan prioritizes wiring + integration over rebuilding.

---

## Codebase State Summary

### What EXISTS and WORKS

| Component | File | Status |
|-----------|------|--------|
| Session types (V2/V3) | `src/features/event-tracker/types.ts` | ✅ Complete |
| Consolidated writer (JSON) | `src/features/event-tracker/consolidated-writer.ts` | ✅ All functions exported |
| Markdown writer (events.md) | `src/features/event-tracker/markdown-writer.ts` | ✅ TOC, turns, diagnostics |
| Path builders | `src/features/event-tracker/paths.ts` | ✅ All paths exported |
| Chat message handler | `src/hooks/chat-message-handler.ts` | ✅ Implemented, NOT wired |
| Tool execution handler | `src/hooks/tool-execution-handler.ts` | ✅ Implemented, NOT wired |
| Event handler | `src/hooks/event-handler.ts` | ✅ Wired, handles session.idle + trajectory |
| Text complete handler | `src/hooks/text-complete-handler.ts` | ✅ Wired |
| Compaction handler | `src/hooks/compaction-handler.ts` | ✅ Wired |

### What EXISTS but is BROKEN

| Issue | File | Problem |
|-------|------|---------|
| RED-phase test imports | 17+ test files | Import from modules that don't exist (parser/*, session-writer/*, writers/index-writer, writers/synthesizer) |
| Legacy calls active | `opencode-plugin.ts:234-262` | `writeDiagnosticLog` and `upsertSessionInspectionExport` still called |

### What DOESN'T EXIST (needs creation)

| Component | Target File | Purpose |
|-----------|------------|---------|
| Session resolver | `src/features/session-journal/session-resolver.ts` | Eliminate 5x duplication |
| Error log writer | `src/features/session-journal/error-log-writer.ts` | Replaces diagnostic-log.ts |
| Journey-events writer | Renamed from `markdown-writer.ts` | Enhanced format with actors, tool batches |
| Journey-events path | `getJourneyEventsPath` in paths.ts | New output directory |
| Error-logs path | `getErrorLogsPath` in paths.ts | New output directory |

### Test Landscape

- **27 test files** with ~250+ test cases total
- **~12 files** with passing tests (types, formatter, event-classifier, event-id, writer-adapter, event-handler, runtime-tools, plugin-assembly)
- **~15 files** in RED phase (import from non-existent modules — these tests ARE the spec)
- Tests that can run NOW: `types.test.ts`, `session-v3-types.test.ts`, `event-handler.test.ts`, `formatter.test.ts`, `event-classifier.test.ts`, `event-id.test.ts`, `writer-adapter.test.ts`, `runtime-tools.test.ts`, `plugin-assembly-smoke.test.ts`

---

## Phase Structure

Each implementation phase follows TDD:

```
RED (hitea) → GREEN (hivemaker) → REFACTOR (hivemaker) → VERIFY (hiveq)
```

---

## Phase 0: Baseline Verification

**Goal:** Establish what currently passes/fails before any changes.

| Step | Action | Command |
|------|--------|---------|
| 0.1 | Type check baseline | `npx tsc --noEmit` |
| 0.2 | Run passing test suite | `npm test` |
| 0.3 | Document current pass/fail | Record in phase output |

**Agent:** hiveq
**Dependencies:** None
**Success Criteria:**
- `npx tsc --noEmit` exit code documented
- `npm test` pass/fail counts documented
- Baseline recorded in `.hivemind/activity/plans/session-journal/baseline-2026-03-29.json`

**Evidence Required:** JSON file with `{ tscErrors: N, testsPassed: N, testsFailed: N, testsSkipped: N }`

---

## Phase 1: Kill Redundancy (Remove Legacy Calls)

**Goal:** Remove `writeDiagnosticLog` and `upsertSessionInspectionExport` calls from `opencode-plugin.ts`. The consolidated system already has the handlers to replace them.

**Requirements:** R8 (legacy cleanup)

### RED (hitea)
- Write test: `tests/legacy-removal.test.ts`
- Assert: `opencode-plugin.ts` source does NOT contain `writeDiagnosticLog` or `upsertSessionInspectionExport`
- Assert: `npx tsc --noEmit` succeeds after removal
- Test must FAIL initially (calls still present)

### GREEN (hivemaker)
**Files to modify:**
- `src/plugin/opencode-plugin.ts` — Remove lines ~234-262 (legacy calls in `experimental.text.complete` hook)
- Remove import of `upsertSessionInspectionExport` from `../sdk-supervisor/index.js`
- Remove import of `writeDiagnosticLog` from `../sdk-supervisor/index.js`

**Files NOT modified:** Handlers already capture the same data via consolidated writer.

### REFACTOR (hivemaker)
- Remove unused imports
- Add JSDoc comments explaining the removal
- Verify no other files import the removed functions

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes (no regressions)
- Grep confirms no `writeDiagnosticLog` or `upsertSessionInspectionExport` calls in plugin
- `legacy-removal.test.ts` passes

**Dependencies:** Phase 0
**Success Criteria:**
- [ ] `writeDiagnosticLog` call removed from `opencode-plugin.ts`
- [ ] `upsertSessionInspectionExport` call removed from `opencode-plugin.ts`
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes
- [ ] No other consumers of removed imports

---

## Phase 2: Wire Existing Handlers (chat-message + tool-execution)

**Goal:** Wire the already-implemented `chat-message-handler.ts` and `tool-execution-handler.ts` into `opencode-plugin.ts`.

**Requirements:** R3 (user message capture), R6 (tool invocation tracking), R7 (counter accuracy)

### RED (hitea)
- Write test: `tests/handler-wiring.test.ts`
- Assert: `opencode-plugin.ts` imports `handleChatMessage` from `../hooks/chat-message-handler.js`
- Assert: `opencode-plugin.ts` imports `handleToolExecution` from `../hooks/tool-execution-handler.js`
- Assert: `chat.message` hook calls `handleChatMessage`
- Assert: `tool.execute.after` hook calls `handleToolExecution`
- Test must FAIL initially

### GREEN (hivemaker)
**Files to modify:**
- `src/plugin/opencode-plugin.ts`:
  - Add import: `import { handleChatMessage } from '../hooks/chat-message-handler.js'`
  - Add import: `import { handleToolExecution } from '../hooks/tool-execution-handler.js'`
  - In `chat.message` hook (line ~136): Call `handleChatMessage(messageInput, output, directory)` BEFORE existing logic
  - In `tool.execute.after` hook (line ~221): Call `handleToolExecution(toolInput, toolInput, directory)` BEFORE existing trajectory logic

**Wiring pattern (error-safe):**
```typescript
'chat.message': async (messageInput, output) => {
  // Journal: capture user message (BEFORE existing logic)
  await handleChatMessage(messageInput, output, directory)
    .catch(err => console.error('[session-journal] chat-message failed:', err))
  // Existing: reset turn snapshot + governance
  turnSnapshot.resetTurnSnapshot()
  // ...
},
```

### REFACTOR (hivemaker)
- Ensure error handling follows existing `.catch(err => console.error(...))` pattern
- Add JSDoc to new import lines
- Verify handler call order (journal first, then existing logic)

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `handler-wiring.test.ts` passes
- Grep confirms `handleChatMessage` and `handleToolExecution` are called in plugin

**Test commands:**
```bash
npx tsx --test tests/handler-wiring.test.ts
npx tsc --noEmit
npm test
```

**Dependencies:** Phase 1 (legacy removal must be done first to avoid merge conflicts in plugin)
**Success Criteria:**
- [ ] `handleChatMessage` imported and called in `chat.message` hook
- [ ] `handleToolExecution` imported and called in `tool.execute.after` hook
- [ ] Both calls use `.catch()` error safety
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes
- [ ] `handler-wiring.test.ts` passes

---

## Phase 3: Wire Session Lifecycle Events

**Goal:** Extend `event-handler.ts` to handle `session.started` and `session.ended` events, creating/completing sessions in the consolidated writer.

**Requirements:** R1 (consolidated format), R4 (turn-based structure), R7 (counter accuracy)

### RED (hitea)
- Write test: `tests/session-lifecycle.test.ts`
- Assert: `event-handler.ts` handles `session.started` → calls `initSession` or `findSessionBySdkId`+`initSession`
- Assert: `event-handler.ts` handles `session.ended` → calls `updateStatus(sessionId, 'completed')`
- Assert: `session.error` event → calls `updateStatus(sessionId, 'errored')` + writes error event
- Tests must FAIL initially (only `session.idle` is handled)

### GREEN (hivemaker)
**Files to modify:**
- `src/hooks/event-handler.ts`:
  - In the event dispatch (after `session.idle` branch), add:
    ```typescript
    if (event.type === 'session.started') {
      const sessionId = extractSessionId(event)
      if (sessionId) {
        await findSessionBySdkId(sessionsDir, sessionId)
          .then(existing => !existing && initSession(sessionsDir, { sdkSessionId: sessionId, agent: 'unknown', lineage: 'hiveminder', purposeClass: 'implementation' }))
          .catch(err => console.error('[session-journal] session.started failed:', err))
      }
    }
    if (event.type === 'session.ended') {
      const sessionId = extractSessionId(event)
      if (sessionId) {
        const semanticId = await findSessionBySdkId(sessionsDir, sessionId)
        if (semanticId) {
          await updateStatus(sessionsDir, semanticId, 'completed')
            .catch(err => console.error('[session-journal] session.ended failed:', err))
        }
      }
    }
    ```

### REFACTOR (hivemaker)
- Extract `extractSessionId(event)` helper if not already present
- Ensure consistent error handling pattern

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `session-lifecycle.test.ts` passes

**Dependencies:** Phase 2 (handlers must be wired first)
**Success Criteria:**
- [ ] `session.started` creates session entry via consolidated writer
- [ ] `session.ended` updates status to `completed`
- [ ] `session.error` updates status to `errored` + writes error event
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes

---

## Phase 4: Restructure Output Paths (journey-events/ + error-logs/)

**Goal:** Move session output from flat `.hivemind/sessions/` to `.hivemind/sessions/journey-events/` and `.hivemind/sessions/error-logs/` per ADR-018 D1.

**Requirements:** R1 (consolidated format), R2 (semantic naming), R8 (legacy cleanup)

### RED (hitea)
- Write test: `tests/output-structure.test.ts`
- Assert: `paths.ts` exports `getJourneyEventsPath(projectRoot)` returning `{sessionsDir}/journey-events`
- Assert: `paths.ts` exports `getErrorLogsPath(projectRoot)` returning `{sessionsDir}/error-logs`
- Assert: Session files are written to `journey-events/` subdirectory
- Assert: Error entries are written to `error-logs/` subdirectory
- Tests must FAIL initially

### GREEN (hivemaker)
**Files to modify:**
- `src/features/event-tracker/paths.ts`:
  - Add `getJourneyEventsPath(projectRoot: string): string` → `join(getEventTrackerSessionDir(projectRoot, ''), 'journey-events')`
  - Add `getErrorLogsPath(projectRoot: string): string` → `join(getEventTrackerSessionDir(projectRoot, ''), 'error-logs')`
- `src/features/event-tracker/consolidated-writer.ts`:
  - Update `getSessionPath` to use `journey-events/` subdirectory
- `src/features/event-tracker/markdown-writer.ts`:
  - Update output path to use `journey-events/` subdirectory

**Files to create:**
- `src/features/session-journal/error-log-writer.ts`:
  ```typescript
  export interface ErrorLogEntry {
    sessionId: string
    timestamp: string
    level: 'error' | 'warn'
    message: string
    context?: Record<string, unknown>
  }
  export async function appendError(projectRoot: string, entry: ErrorLogEntry): Promise<void>
  ```

### REFACTOR (hivemaker)
- Ensure `shared/paths.ts` `getEffectivePaths()` includes new paths
- Update any hardcoded paths in tests

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `output-structure.test.ts` passes
- Directory structure verified: `ls .hivemind/sessions/journey-events/` and `ls .hivemind/sessions/error-logs/`

**Dependencies:** Phase 3 (lifecycle events must be wired)
**Success Criteria:**
- [ ] `getJourneyEventsPath` exported from `paths.ts`
- [ ] `getErrorLogsPath` exported from `paths.ts`
- [ ] `error-log-writer.ts` created with `appendError` function
- [ ] Session JSON files go to `journey-events/` subdirectory
- [ ] Error log files go to `error-logs/` subdirectory
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes

---

## Phase 5: Journey-Events Markdown Writer (TOC, Actors, Tool Batches)

**Goal:** Enhance `markdown-writer.ts` to produce the journey-events format with TOC, actors, tool batches, and delegation sections per ADR-018 D7.

**Requirements:** R4 (turn-based structure), R5 (sub-session linking), NEW (journey-events markdown)

### RED (hitea)
- Write test: `tests/journey-events-writer.test.ts`
- Assert: Markdown output contains `# Session: ses_xxxx` header
- Assert: Markdown output contains `**Actors:**` metadata line
- Assert: Markdown output contains `**Tools Used:**` metadata line
- Assert: Markdown output contains `## Table of Contents` with `| # | Timestamp | Type | Summary |` table
- Assert: Tool batches rendered as `## Tool Batch: {toolName} (Turn N)` with table
- Assert: Delegations rendered in `## Delegations` section
- Tests must FAIL initially (current markdown-writer doesn't produce this format)

### GREEN (hivemaker)
**Files to modify:**
- `src/features/event-tracker/markdown-writer.ts` (or rename to `journey-events-writer.ts`):
  - Enhance `initEventsMarkdown` to include `**Actors:**` and `**Tools Used:**` metadata
  - Add `appendToolBatch(sessionDir, batch: ToolBatchEntry)` function
  - Add `appendDelegation(sessionDir, delegation: DelegationRecord)` function
  - Enhance `generateTOC` to include type column
  - Add actor extraction from session metadata

**New interfaces to add:**
```typescript
export interface ToolBatchEntry {
  turnNumber: number
  toolName: string
  invocations: Array<{ action: string; result: string }>
}

export interface DelegationRecord {
  parentSessionId: string
  childSessionId: string
  actor: string
  summary: string
}
```

### REFACTOR (hivemaker)
- Rename file if needed: `markdown-writer.ts` → `journey-events-writer.ts`
- Update all imports referencing the old name
- Ensure append-only writes (no full file rewrites)

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `journey-events-writer.test.ts` passes
- Generated markdown matches expected format

**Test commands:**
```bash
npx tsx --test tests/journey-events-writer.test.ts
npx tsc --noEmit
npm test
```

**Dependencies:** Phase 4 (output paths must be restructured)
**Success Criteria:**
- [ ] Journey-events markdown has TOC with timestamp/type/summary columns
- [ ] Journey-events markdown has Actors metadata
- [ ] Journey-events markdown has Tools Used metadata
- [ ] Tool batches rendered as tables
- [ ] Delegations rendered with sub-session links
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes

---

## Phase 6: Session Resolver Extraction

**Goal:** Extract the 5x-duplicated session resolution pattern into a single `SessionResolver` service per ADR-018 D3.

**Requirements:** R9 (clean code / CQRS compliance)

### RED (hitea)
- Write test: `tests/session-resolver.test.ts`
- Assert: `SessionResolver.resolve(sdkSessionId)` returns existing semantic ID or null
- Assert: `SessionResolver.resolveOrCreate(sdkSessionId, defaults)` returns semantic ID (creates if needed)
- Assert: All 5 handlers use `SessionResolver` instead of inline `findSessionBySdkId → loadSession → initSession`
- Tests must FAIL initially

### GREEN (hivemaker)
**Files to create:**
- `src/features/session-journal/session-resolver.ts`:
  ```typescript
  export interface SessionDefaults {
    lineage: 'hivefiver' | 'hiveminder'
    purposeClass: PurposeClass
    agent: string
    parentSessionId?: string | null
  }
  export interface SessionResolver {
    resolve(sdkSessionId: string): Promise<string | null>
    resolveOrCreate(sdkSessionId: string, defaults: SessionDefaults): Promise<string>
    getSessionsDir(): string
  }
  export function createSessionResolver(projectRoot: string): SessionResolver
  ```

**Files to modify:**
- `src/hooks/text-complete-handler.ts` — Inject `SessionResolver`, remove inline resolution
- `src/hooks/event-handler.ts` — Inject `SessionResolver`, remove inline resolution
- `src/hooks/compaction-handler.ts` — Inject `SessionResolver`, remove inline resolution
- `src/hooks/chat-message-handler.ts` — Inject `SessionResolver`, remove inline resolution
- `src/hooks/tool-execution-handler.ts` — Inject `SessionResolver`, remove inline resolution

### REFACTOR (hivemaker)
- Ensure no `findSessionBySdkId`, `loadSession`, `initSession` direct calls remain in handlers
- Update barrel exports in `src/hooks/index.ts`

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `session-resolver.test.ts` passes
- Grep confirms no direct `findSessionBySdkId` calls in handler files (only in resolver)

**Dependencies:** Phase 5 (markdown writer must be done to avoid merge conflicts)
**Success Criteria:**
- [ ] `session-resolver.ts` created with `SessionResolver` interface
- [ ] All 5 handlers refactored to use `SessionResolver`
- [ ] No direct `findSessionBySdkId`/`loadSession`/`initSession` calls in handlers
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes

---

## Phase 7: Sub-Session Linking + Hierarchy JSON

**Goal:** Wire delegation tracking so `linkSubSession` is actually called and hierarchy data is populated.

**Requirements:** R5 (sub-session linking)

### RED (hitea)
- Write test: `tests/sub-session-linking.test.ts`
- Assert: When delegation occurs, child session gets `parentSessionId` set
- Assert: Parent session gets `childSessionIds` appended
- Assert: Hierarchy JSON written to `.hivemind/sessions/journey-events/hierarchy.json`
- Tests must FAIL initially

### GREEN (hivemaker)
**Files to modify:**
- `src/hooks/event-handler.ts` — Handle `agent.created` or delegation events to call `linkSubSession`
- `src/features/event-tracker/consolidated-writer.ts` — Ensure `linkSubSession` writes hierarchy

**Files to create:**
- `src/features/session-journal/hierarchy-writer.ts` (optional — may integrate into consolidated writer):
  ```typescript
  export async function writeHierarchyJson(sessionsDir: string): Promise<void>
  ```

### REFACTOR (hivemaker)
- Ensure hierarchy JSON is append-only (read existing, add new link, write back)

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `sub-session-linking.test.ts` passes
- At least one session has `parentSessionId !== null`

**Dependencies:** Phase 6 (session resolver must be extracted)
**Success Criteria:**
- [ ] `linkSubSession` called when delegation occurs
- [ ] `parentSessionId` populated on child sessions
- [ ] `childSessionIds` populated on parent sessions
- [ ] Hierarchy JSON written
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes

---

## Phase 8: Legacy Module Deprecation + Path Cleanup

**Goal:** Mark legacy modules as deprecated, remove from barrel exports, clean up path builders.

**Requirements:** R8 (legacy cleanup), R9 (clean code)

### RED (hitea)
- Write test: `tests/legacy-deprecation.test.ts`
- Assert: `sdk-supervisor/index.ts` does NOT export `session-inspection` or `diagnostic-log`
- Assert: `shared/paths.ts` does NOT export `getSessionInspectionPath` or `getErrorLogPath`
- Assert: `getEffectivePaths()` does NOT include `sessionInspectionDir` or `errorLogDir`
- Tests must FAIL initially

### GREEN (hivemaker)
**Files to modify:**
- `src/sdk-supervisor/index.ts` — Remove exports for `session-inspection` and `diagnostic-log`
- `src/shared/paths.ts` — Remove `getSessionInspectionPath`, `getErrorLogPath`, and related constants
- `src/shared/paths.ts` — Remove `sessionInspectionDir` and `errorLogDir` from `getEffectivePaths()`

**Files to delete (or mark for deletion):**
- `src/sdk-supervisor/session-inspection.ts` — Add `@deprecated` header, leave for 1 release
- `src/sdk-supervisor/diagnostic-log.ts` — Already `@deprecated`, leave for 1 release

### REFACTOR (hivemaker)
- Verify no remaining imports of removed functions
- Update `shared/paths.ts` JSDoc

### VERIFY (hiveq)
- `npx tsc --noEmit` succeeds
- `npm test` passes
- `legacy-deprecation.test.ts` passes
- Grep confirms no imports of removed functions

**Dependencies:** Phase 7 (sub-session linking must be complete)
**Success Criteria:**
- [ ] `session-inspection` and `diagnostic-log` removed from `sdk-supervisor/index.ts`
- [ ] `getSessionInspectionPath` and `getErrorLogPath` removed from `shared/paths.ts`
- [ ] `getEffectivePaths()` no longer includes legacy dirs
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm test` passes

---

## Phase 9: Final Integration Verification

**Goal:** End-to-end verification that all requirements are met.

**Requirements:** ALL (R1-R9 + NEW)

### Verification Checklist

| # | Requirement | Evidence Command | Pass Criteria |
|---|------------|-----------------|---------------|
| 1 | R1: Consolidated format | `ls .hivemind/sessions/journey-events/*.json \| wc -l` | Count > 0 |
| 2 | R2: Semantic naming | `ls .hivemind/sessions/journey-events/` | Filenames match `ses_\d+_\d{4}-\d{2}-\d{2}` |
| 3 | R3: User messages | Grep `userMessageCount` in session JSON | `userMessageCount > 0` |
| 4 | R4: Turn structure | Read session JSON | `turns[]` array with entries |
| 5 | R5: Sub-session linking | Grep `parentSessionId` in session JSON | At least one non-null |
| 6 | R6: Tool invocations | Grep `toolCallCount` in session JSON | `toolCallCount > 0` |
| 7 | R7: Counter accuracy | Compare counters to actual data | All match |
| 8 | R8: Legacy cleanup | `find .hivemind/session-inspection .hivemind/error-log -type f \| wc -l` | Returns 0 |
| 9 | R9: Clean code | `npx tsc --noEmit` | 0 errors |
| 10 | NEW: Journey-events MD | `head -20 .hivemind/sessions/journey-events/*.md` | TOC present, actors present |
| 11 | NEW: Error-logs | `ls .hivemind/sessions/error-logs/` | `.log` files exist |

### Agent: hiveq

**Commands:**
```bash
npx tsc --noEmit
npm test
npx tsx --test tests/legacy-removal.test.ts
npx tsx --test tests/handler-wiring.test.ts
npx tsx --test tests/session-lifecycle.test.ts
npx tsx --test tests/output-structure.test.ts
npx tsx --test tests/journey-events-writer.test.ts
npx tsx --test tests/session-resolver.test.ts
npx tsx --test tests/sub-session-linking.test.ts
npx tsx --test tests/legacy-deprecation.test.ts
```

**Dependencies:** ALL prior phases (1-8)
**Success Criteria:**
- [ ] All 11 verification checks pass
- [ ] All new test files pass
- [ ] All existing test files pass (no regressions)
- [ ] `npx tsc --noEmit` succeeds
- [ ] `npm run build` succeeds

---

## Dependency Graph

```
Phase 0 (Baseline)
  │
  ▼
Phase 1 (Kill Redundancy — remove legacy calls)
  │
  ▼
Phase 2 (Wire Handlers — chat-message + tool-execution)
  │
  ▼
Phase 3 (Wire Session Lifecycle — started/ended/error)
  │
  ▼
Phase 4 (Restructure Output Paths — journey-events/ + error-logs/)
  │
  ▼
Phase 5 (Journey-Events Markdown Writer — TOC, actors, tool batches)
  │
  ▼
Phase 6 (Session Resolver Extraction — eliminate 5x duplication)
  │
  ▼
Phase 7 (Sub-Session Linking + Hierarchy JSON)
  │
  ▼
Phase 8 (Legacy Module Deprecation + Path Cleanup)
  │
  ▼
Phase 9 (Final Integration Verification)
```

**Note:** Phases 1-3 are sequential (all modify `opencode-plugin.ts`). Phases 4-6 could theoretically be parallelized but are kept sequential to reduce merge risk. Phase 6 (resolver extraction) is placed after Phase 5 because both modify handlers — doing the functional changes first, then the refactor, reduces risk.

---

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| RED-phase test imports fail to compile | HIGH | LOW | Expected — these tests ARE the spec. Fix imports in GREEN phase. |
| Legacy removal breaks text.complete hook | MEDIUM | HIGH | Consolidated writer already handles same data. Verify with `npm test` after removal. |
| Handler wiring causes duplicate writes | MEDIUM | MEDIUM | Call journal handlers BEFORE existing logic. Use `.catch()` to prevent blocking. |
| Session resolver refactor breaks handlers | MEDIUM | HIGH | Extract resolver FIRST, then migrate handlers one at a time. Run tests after each. |
| Path restructuring breaks existing sessions | LOW | MEDIUM | Keep backward compatibility: if old path exists, read from it. New writes go to new path. |

---

## Agent Assignment Summary

| Phase | RED Agent | GREEN Agent | REFACTOR Agent | VERIFY Agent |
|-------|-----------|-------------|----------------|-------------|
| 0 | — | — | — | hiveq |
| 1 | hitea | hivemaker | hivemaker | hiveq |
| 2 | hitea | hivemaker | hivemaker | hiveq |
| 3 | hitea | hivemaker | hivemaker | hiveq |
| 4 | hitea | hivemaker | hivemaker | hiveq |
| 5 | hitea | hivemaker | hivemaker | hiveq |
| 6 | hitea | hivemaker | hivemaker | hiveq |
| 7 | hitea | hivemaker | hivemaker | hiveq |
| 8 | hitea | hivemaker | hivemaker | hiveq |
| 9 | — | — | — | hiveq |

---

## Architect Decisions Needed

| Decision | Context | Urgency |
|----------|---------|---------|
| Rename `event-tracker/` → `session-journal/`? | Module rename is cosmetic. Prior plan had it as Phase 6. ADR-018 mentions it. | Before Phase 6 |
| Delete or deprecate legacy modules? | ADR-018 D6 says "Phase 2: remove entirely". Risk of breaking consumers. | Before Phase 8 |
| Hierarchy JSON format | ADR-018 doesn't specify exact format. Need schema decision. | Before Phase 7 |
| Handle existing 76+ session directories | Neither spec addresses migration of existing data. | Before Phase 4 |

---

## Output Paths

| Artifact | Path |
|----------|------|
| This plan | `.hivemind/activity/plans/session-journal/phase-plan-2026-03-29.md` |
| Baseline data | `.hivemind/activity/plans/session-journal/baseline-2026-03-29.json` |
| Architecture decision | `.hivemind/activity/plans/session-journal/architecture-decision-2026-03-29.md` |
| Module dependency map | `.hivemind/activity/plans/session-journal/module-dependency-map-2026-03-29.md` |
| Event wiring matrix | `.hivemind/activity/plans/session-journal/event-wiring-matrix-2026-03-29.md` |
| Requirement traceability | `.hivemind/activity/plans/session-journal/requirement-traceability-2026-03-29.md` |
