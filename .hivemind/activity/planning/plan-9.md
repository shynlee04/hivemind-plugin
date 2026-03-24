# Plan #9: Hook Handlers (Unit 8 — Hook Wiring)

## Objective
Wire the session journal system to three OpenCode plugin hooks by creating thin handler modules that capture hook events and delegate to existing classifier/writer infrastructure. The handlers bridge the gap between OpenCode's hook lifecycle and the event-tracker's writer layer.

## Scope Boundaries
### In Scope
- Create `src/hooks/transform-handler.ts` — capture injection payload on `system.transform` / `messages.transform` hook.
- Create `src/hooks/text-complete-handler.ts` — primary per-turn journal writer via `text.complete` hook.
- Create `src/hooks/compaction-handler.ts` — compaction event capture via `session.compacting` hook.
- Create test files for all 3 handlers under `tests/hooks/`.
- Wire handlers into `src/plugin/opencode-plugin.ts` hook registration.
- Thin handler design: each handler delegates to existing classifier/writer modules, never implements business logic.

### Out of Scope
- Changes to existing writer modules (`writers/`), classifier (`classifier/`), or parser (`parser/`).
- Migration of existing inline hook logic from plugin (Plan 10 scope).
- Any new persistence backends or data formats.
- Changes to `src/sdk-supervisor/diagnostic-log.ts` (existing diagnostic writer).
- Changes to `src/plugin/injection-store.ts` (existing cross-hook store).
- `session-writer/` RED test implementations (separate unit).

## File Artifacts
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/hooks/transform-handler.ts` | Factory: capture injection payload + trigger session init on transform hook | 60–90 |
| `src/hooks/text-complete-handler.ts` | Factory: per-turn journal write (events, diagnostics, session update) on text.complete | 80–120 |
| `src/hooks/compaction-handler.ts` | Factory: compaction event capture + write on session.compacting | 50–80 |
| `tests/hooks/transform-handler.test.ts` | Tests for transform handler | 60–90 |
| `tests/hooks/text-complete-handler.test.ts` | Tests for text-complete handler | 80–120 |
| `tests/hooks/compaction-handler.test.ts` | Tests for compaction handler | 60–90 |
| `src/plugin/opencode-plugin.ts` | Wire new handlers (minor edits, ~15 LOC added) | edit |

## Dependencies
- `src/features/event-tracker/types.ts` — `SessionMetadataInput`, `SessionEventWriteInput`, `SessionInjectionAppendInput`, `EventType`, `Importance`.
- `src/features/event-tracker/paths.ts` — path builders for session dirs.
- `src/features/event-tracker/classifier/event-classifier.ts` — `classifyTurnEvents()`.
- `src/features/event-tracker/classifier/writer-adapter.ts` — `mapEventEntriesToSessionEventInputs()`.
- `src/features/event-tracker/writers/session-writer.ts` — `initOrUpdateSessionMetadata()`, `appendSessionInjectionEntry()`.
- `src/features/event-tracker/writers/events-writer.ts` — `appendSessionEvent()`.
- `src/features/event-tracker/writers/diagnostics-writer.ts` — `appendSessionDiagnostic()`.
- `src/plugin/injection-store.ts` — `setInjectionPayload()`, `getAndClearInjectionPayload()`.
- `src/sdk-supervisor/diagnostic-log.ts` — existing `writeDiagnosticLog()` (NOT replaced).
- SDK types: `@opencode-ai/plugin` hook signatures.

## Architecture Decisions

### Handler Location (A): `src/hooks/` not `src/features/event-tracker/hooks/`
**Rationale:** Handlers are hook-layer concerns — they receive SDK hook context and delegate to feature modules. Placing them in `src/hooks/` follows the existing `event-handler.ts` precedent. The event-tracker feature module remains hook-agnostic (it has no import from SDK or hooks).

### Factory Pattern (B): `createXxxHandler(deps)` returning async `(input, output) => Promise<void>`
**Rationale:** Matches the established pattern in `messages-transform-adapter.ts` and `compaction-adapter.ts`. Dependency injection via `deps` object keeps handlers testable (mock deps instead of mocking SDK).

### Thin Handler Constraint (C): No business logic in handlers
**Rationale:** Handlers must be ≤120 LOC each. They: (1) extract data from hook input/output, (2) call existing writer/classifier functions, (3) handle errors silently (`.catch(() => undefined)`). No parsing, no classification logic, no formatting — those live in the feature module layers.

### Dual Write Strategy (D): text.complete is the primary writer; transform is a secondary capture
**Rationale:** `text.complete` fires once per completed assistant response with `sessionID + messageID + partID`. It's the natural per-turn write point. `system.transform` fires earlier (system prompt construction) and captures injection metadata for the journal. The existing `writeDiagnosticLog()` call in the plugin's inline text.complete handler is NOT replaced — the new handler ADDS journal writes alongside it.

### Compaction Handler is a Write-Only Observer (E)
**Rationale:** The existing `compaction-adapter.ts` only injects context into the compaction output. The new `compaction-handler.ts` only WRITES a compaction event to the journal. These are orthogonal concerns — one reads/transforms the output, the other records the event. Both can coexist.

## Implementation Steps

### Step 1: Create transform-handler.ts — RED tests first
Create `tests/hooks/transform-handler.test.ts`:

**Test 1: Source inspection — uses setInjectionPayload**
- Assert source imports from `injection-store.js`.

**Test 2: Source inspection — factory pattern**
- Assert source exports `createTransformHandler` function.

**Test 3: Handler calls setInjectionPayload with correct fields**
- Create mock deps with `{ directory: string }`.
- Call factory, then call returned handler with mock `(input, output)`.
- Verify `setInjectionPayload` was called (mock or spy approach — or test side-effect via `getAndClearInjectionPayload`).

**Test 4: Handler does nothing on missing sessionId**
- Pass input without `sessionID`, verify no injection set.

**Test 5: Handler returns void (Promise<void>)**
- Verify handler return type is `Promise<void>`.

### Step 2: Create transform-handler.ts — GREEN implementation
Create `src/hooks/transform-handler.ts`:

```typescript
export interface TransformHandlerDeps {
  directory: string
}

export function createTransformHandler(deps: TransformHandlerDeps) {
  return async (
    input: { sessionID?: string; model: { id: string; provider: string } },
    output: { system: string[] },
  ): Promise<void> => {
    const sessionId = input.sessionID
    if (!sessionId) return

    // Capture injection payload for journal
    setInjectionPayload({
      sessionId,
      timestamp: new Date().toISOString(),
      agent: 'system-transform',
      purposeClass: 'system',
      sessionState: 'active',
      skillBundle: [],
      sessionRole: 'standalone',
      skillFocusBlock: '',
      turnHierarchyBlock: '',
      contextBlock: output.system.join('\n'),
      variant: 'system-transform',
    })
  }
}
```

**Constraints:** ≤90 LOC. Imports only from `injection-store.js`. No SDK imports beyond types.

### Step 3: Create text-complete-handler.ts — RED tests first
Create `tests/hooks/text-complete-handler.test.ts`:

**Test 1: Source inspection — uses event-tracker writers**
- Assert source imports from `event-tracker/writers/events-writer.js`.
- Assert source imports from `event-tracker/writers/session-writer.js`.

**Test 2: Source inspection — uses classifier**
- Assert source imports from `event-tracker/classifier/`.

**Test 3: Source inspection — uses injection-store**
- Assert source imports `getAndClearInjectionPayload` from `injection-store.js`.

**Test 4: Source inspection — factory pattern**
- Assert source exports `createTextCompleteHandler` function.

**Test 5: Handler does nothing on missing sessionId**
- Pass input with empty `sessionID`, verify no writes.

**Test 6: Handler does nothing on empty text**
- Pass output with empty `text`, verify no writes.

**Test 7: Handler calls appendSessionEvent and initOrUpdateSessionMetadata**
- Create temp project dir with mock deps.
- Call handler with valid input.
- Assert events.md exists with assistant_output entry.
- Assert session.json exists with metadata.

### Step 4: Create text-complete-handler.ts — GREEN implementation
Create `src/hooks/text-complete-handler.ts`:

```typescript
import { getAndClearInjectionPayload } from '../plugin/injection-store.js'
import { appendSessionEvent } from '../features/event-tracker/writers/events-writer.js'
import { initOrUpdateSessionMetadata } from '../features/event-tracker/writers/session-writer.js'
import { appendSessionDiagnostic } from '../features/event-tracker/writers/diagnostics-writer.js'

export interface TextCompleteHandlerDeps {
  directory: string
}

export function createTextCompleteHandler(deps: TextCompleteHandlerDeps) {
  const { directory } = deps

  return async (
    input: { sessionID: string; messageID: string; partID: string },
    output: { text: string },
  ): Promise<void> => {
    const sessionId = input.sessionID
    const assistantText = typeof output.text === 'string' ? output.text : ''

    if (!sessionId || assistantText.length === 0) {
      return
    }

    const timestamp = new Date().toISOString()
    const injection = getAndClearInjectionPayload(sessionId)

    // 1. Write event entry (assistant output)
    await appendSessionEvent(directory, {
      sessionId,
      timestamp,
      type: 'assistant_output',
      actor: injection?.agent ?? 'unknown',
      title: 'Assistant response',
      summary: assistantText.slice(0, 200),
    }).catch(() => undefined)

    // 2. Update session metadata
    await initOrUpdateSessionMetadata(directory, {
      sessionId,
      lineage: 'hiveminder',
      purposeClass: (injection?.purposeClass as any) ?? 'implementation',
      agent: injection?.agent ?? 'unknown',
      timestamp,
      status: 'active',
    }).catch(() => undefined)

    // 3. Write diagnostic log line
    await appendSessionDiagnostic(directory, {
      sessionId,
      timestamp,
      level: 'info',
      message: `turn_complete agent=${injection?.agent ?? 'unknown'} text_len=${assistantText.length}`,
    }).catch(() => undefined)
  }
}
```

**Constraints:** ≤120 LOC. Delegates to existing writers. Uses `.catch(() => undefined)` for resilience. Does NOT replace existing `writeDiagnosticLog` call in plugin.

### Step 5: Create compaction-handler.ts — RED tests first
Create `tests/hooks/compaction-handler.test.ts`:

**Test 1: Source inspection — uses event-tracker writers**
- Assert source imports from `event-tracker/writers/events-writer.js`.

**Test 2: Source inspection — factory pattern**
- Assert source exports `createCompactionJournalHandler` function.

**Test 3: Handler writes compaction event**
- Create temp project dir.
- Call handler with `{ sessionID: 'ses_test' }`.
- Assert events.md exists with `compaction` type entry.

**Test 4: Handler does nothing on missing sessionId**
- Pass empty sessionID, verify no writes.

### Step 6: Create compaction-handler.ts — GREEN implementation
Create `src/hooks/compaction-handler.ts`:

```typescript
import { appendSessionEvent } from '../features/event-tracker/writers/events-writer.js'

export interface CompactionJournalHandlerDeps {
  directory: string
}

export function createCompactionJournalHandler(deps: CompactionJournalHandlerDeps) {
  const { directory } = deps

  return async (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ): Promise<void> => {
    const sessionId = input.sessionID
    if (!sessionId) return

    const timestamp = new Date().toISOString()

    await appendSessionEvent(directory, {
      sessionId,
      timestamp,
      type: 'compaction',
      actor: 'system',
      title: 'Session compaction',
      summary: `Compaction triggered. Context length: ${output.context.length} segments.`,
    }).catch(() => undefined)
  }
}
```

**Constraints:** ≤80 LOC. Only writes event entry. Does NOT modify compaction output (existing `compaction-adapter.ts` owns that).

### Step 7: Wire handlers into opencode-plugin.ts
Edit `src/plugin/opencode-plugin.ts`:

1. Import the 3 new handlers:
   ```typescript
   import { createTransformHandler } from '../hooks/transform-handler.js'
   import { createTextCompleteHandler } from '../hooks/text-complete-handler.js'
   import { createCompactionJournalHandler } from '../hooks/compaction-handler.js'
   ```

2. Instantiate handlers (alongside existing deps):
   ```typescript
   const transformJournal = createTransformHandler({ directory })
   const textCompleteJournal = createTextCompleteHandler({ directory })
   const compactionJournal = createCompactionJournalHandler({ directory })
   ```

3. Register handlers in the returned hooks object:
   - Add `'experimental.chat.system.transform'` hook calling `transformJournal`.
   - In the existing `'experimental.text.complete'` hook, add `await textCompleteJournal(input, output)` BEFORE the existing logic (journal writes first, then diagnostic log).
   - In the existing `'experimental.session.compacting'` hook, add `await compactionJournal(compactionInput, output)` BEFORE the existing `compactionHandler` call.

**Constraints:** Plugin edits are additive only — existing inline logic is preserved. New calls added before existing ones.

### Step 8: Run full verification
```bash
npx tsc --noEmit
npx tsx --test tests/hooks/transform-handler.test.ts
npx tsx --test tests/hooks/text-complete-handler.test.ts
npx tsx --test tests/hooks/compaction-handler.test.ts
```

Then verify no regressions:
```bash
npx tsx --test tests/
npx tsx --test src/features/event-tracker/
```

### Step 9: Commit
```bash
git add src/hooks/transform-handler.ts \
        src/hooks/text-complete-handler.ts \
        src/hooks/compaction-handler.ts \
        tests/hooks/transform-handler.test.ts \
        tests/hooks/text-complete-handler.test.ts \
        tests/hooks/compaction-handler.test.ts \
        src/plugin/opencode-plugin.ts
git commit -m "feat(hook-handlers): wire session journal to OpenCode plugin hooks"
```

## Test Requirements
| Test Scenario | Expected Behavior |
|---------------|-------------------|
| `createTransformHandler` returns async function | Factory produces `(input, output) => Promise<void>` |
| Transform handler captures injection payload | `getAndClearInjectionPayload(sessionId)` returns captured data |
| Transform handler skips missing sessionId | No injection set, no errors |
| `createTextCompleteHandler` returns async function | Factory produces `(input, output) => Promise<void>` |
| Text-complete handler writes events.md | File contains `## assistant_output` block |
| Text-complete handler updates session.json | File exists with session metadata |
| Text-complete handler writes diagnostic | `diagnostics.log` contains turn_complete line |
| Text-complete handler skips empty text | No files written |
| Text-complete handler skips missing sessionId | No files written |
| `createCompactionJournalHandler` returns async function | Factory produces `(input, output) => Promise<void>` |
| Compaction handler writes compaction event | `events.md` contains `## compaction` block |
| Compaction handler skips missing sessionId | No files written |
| Plugin registers system.transform hook | `opencode-plugin.ts` imports and calls transformHandler |
| Plugin calls text-complete handler on text.complete | Handler invoked before existing logic |
| Plugin calls compaction journal handler on session.compacting | Handler invoked before existing adapter |
| All handlers use `.catch(() => undefined)` | No unhandled promise rejections |
| `npx tsc --noEmit` passes | No type errors |
| Existing plugin tests still pass | No regression |

## Verification Criteria
- `npx tsc --noEmit` passes — no type errors.
- All 3 handler test files pass under `npx tsx --test`.
- All 3 handler source files ≤ 120 LOC.
- `opencode-plugin.ts` still ≤ 300 LOC after edits.
- All imports use ESM `.js` suffixes.
- Handlers import only from `event-tracker/writers/`, `event-tracker/classifier/`, `plugin/injection-store.js` — never from parser or core.
- Factory pattern consistent: all 3 export `createXxxHandler(deps)`.
- Error resilience: all writer calls wrapped in `.catch(() => undefined)`.
- Existing test suite passes (no regressions from plugin edits).

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| text.complete fires multiple times per turn (streaming parts) | Medium | Medium | Handler writes per-part; journal may have duplicate assistant_output entries. Mitigate by checking partID uniqueness or debouncing in a future revision. Accept for v1 — duplicates are non-destructive (append-only). |
| system.transform hook is experimental and unregistered | Medium | Low | If SDK doesn't fire it, handler is a no-op. Safe to register — no side effects if never called. |
| Compaction handler and existing compaction-adapter both fire on same event | Low | Low | They operate on different concerns (write vs. transform). Both fire, neither conflicts. |
| Handler imports break event-tracker's hook-agnostic boundary | Medium | Medium | Handlers live in `src/hooks/` (hook layer), not in `src/features/event-tracker/`. The dependency direction is hooks → features, not features → hooks. |
| `getAndClearInjectionPayload` race between transform and text.complete | Low | High | Both fire in same turn lifecycle (transform before text.complete). Sequential by SDK design. If race occurs, injection is undefined — handler falls back to defaults. |
| Plugin LOC exceeds 300 after wiring | Low | Low | Added code is ~15 LOC (3 imports + 3 instantiations + 3 calls). Current file is 212 LOC. Safe margin. |

## Architect Decisions Needed
| Decision | Context | Urgency |
|----------|---------|---------|
| Handler test location: `tests/hooks/` vs `src/hooks/*.test.ts` | Existing writer tests are in `tests/features/event-tracker/writers/`. Handler tests could follow either convention. Recommend `tests/hooks/` for separation of concerns. | Before Step 1 |
| text.complete deduplication strategy | Streaming may fire text.complete per-part. Should handlers deduplicate by messageID? Current plan accepts duplicates (append-only, non-destructive). | Before Step 4 |
| Whether to also capture `messageID` and `partID` in journal events | The handler receives these IDs but currently doesn't write them. Could be useful for debugging. | Before Step 4 |

---

**Plan created:** 2026-03-24
**Plan author:** hiveplanner
**Unit:** 8 — Hook Handlers
**Status:** Ready for execution
