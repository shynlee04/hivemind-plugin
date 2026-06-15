# Phase 11: session-api.ts Event-Driven Rewrite — TDD Execution Plan

**Date:** 2026-04-02
**Branch:** harness-experiment
**Validated by:** Plan audit (requirements-auditor, yagni-auditor, assumptions-auditor)

---

## Audit Findings Incorporated

1. **CONTRADICTED**: Plan claimed `client.event.subscribe()` doesn't exist — it DOES per SDK docs. However, using plugin `event` hook is still architecturally correct for plugins.
2. **YAGNI WARNING**: `hasWatcher()`, `pendingCount()` on tracker — trimmed to 3 methods (feed, watch, cancel).
3. **YAGNI WARNING**: 14 functions proposed — trimmed to 10 (6 SDK wrappers + 4 essential helpers).
4. **YAGNI CRITICAL**: Part 4 doc corrections removed from this plan scope. Separate workstream.
5. **CRITICAL GAP**: PERM-008 (delegate-tool context) is out of scope for session-api rewrite — skip.
6. **RESOLVED**: `feed()` uses primitive args `(eventType, sessionID, error?)`, NOT full Event object.
7. **RESOLVED**: "State machine" was mischaracterization — simple watcher registry is correct.
8. **RESOLVED**: Old failing tests (6 in session-api.test.ts) will be deleted; new tests written per TDD.

## Dependencies

- `src/lib/session-api.ts` imports from `helpers.ts` (asString, getNestedValue, unwrapData) and `types.ts`
- `src/lib/lifecycle-manager.ts` imports from `session-api.ts` (7 imports)
- `src/plugin.ts` imports from `session-api.ts` (4 imports: getEventSessionID, getSessionID, walkParentChain, SessionCompletionTracker)
- Tests: `tests/lib/session-api.test.ts` (deleted by user, needs rewrite)

## TDD Waves

### Wave 0: SessionCompletionTracker (NEW FILE)
**Scope:** `src/lib/session-completion-tracker.ts` + `tests/lib/session-completion-tracker.test.ts`

**TDD Cycle:**
1. RED: Write tests for `SessionCompletionTracker` class
   - watch() returns CompletionResult on idle event
   - watch() returns CompletionResult on error event
   - watch() returns CompletionResult on deleted event
   - watch() returns timeout after timeoutMs
   - cancel() resolves with "cancelled" signal
   - feed() ignores events for sessions with no watcher
   - feed() ignores events with undefined sessionID
2. GREEN: Implement `SessionCompletionTracker` class (feed, watch, cancel only — no hasWatcher/pendingCount)
3. VERIFY: typecheck + tests pass
4. COMMIT: `test(wave0): SessionCompletionTracker — TDD red-green cycle`

**API (3 methods only):**
```typescript
export type CompletionSignal = "idle" | "error" | "deleted" | "timeout" | "cancelled"
export type CompletionResult = { signal: CompletionSignal; sessionID: string; error?: string }
export class SessionCompletionTracker {
  feed(eventType: string, sessionID: string | undefined, error?: string): void
  watch(sessionID: string, timeoutMs: number): Promise<CompletionResult>
  cancel(sessionID: string): void
}
```

### Wave 1: Rewrite session-api.ts
**Scope:** `src/lib/session-api.ts`

**TDD Cycle:**
1. RED: Write new `tests/lib/session-api.test.ts`
   - createSession calls client.session.create with correct shape
   - getSession calls client.session.get with { path: { id } }
   - abortSession calls client.session.abort with { path: { id } }
   - getSessionMessages calls client.session.messages with { path: { id } }
   - sendPrompt calls client.session.prompt with { path: { id }, body }
   - sendPromptAsync calls client.session.promptAsync when available
   - sendPromptAsync falls back to sendPrompt when promptAsync missing
   - walkParentChain follows parentID chain, detects cycles
   - extractAssistantText returns last assistant text from messages
   - getEventSessionID extracts from properties.info.id or properties.sessionID
   - waitForAssistantText uses tracker.watch, fetches messages on idle
2. GREEN: Rewrite `session-api.ts` — delete ALL multi-path/fake SSE/polling, implement 6 typed wrappers + 4 helpers
3. VERIFY: typecheck + ALL tests pass
4. COMMIT: `refactor(session-api): replace multi-path fallback with typed SDK wrappers`

**Exports (10 functions):**
```
createSession, getSession, abortSession, getSessionMessages, sendPrompt, sendPromptAsync
walkParentChain, extractAssistantText, waitForAssistantText
getEventSessionID (used by plugin.ts)
```

**Removed exports (dead code):**
```
getSessionByAnyPath, createSessionByAnyPath, promptSessionByAnyPath, promptSessionAsyncByAnyPath
getMessagesByAnyPath, getStatusMap, waitForSessionCompletionViaSSE, waitForSessionCompletionWithFallback
waitForSessionCompletion, waitForAssistantText (old signature), normalizeSessionStatus
formatSessionStatus, getDirectSessionStatus, getSessionStatusCandidate, getNestedValueAsString
```

**Kept exports (needed by lifecycle-manager/plugin):**
```
getSessionID, getParentID, getEventParentID (unchanged signatures)
```

### Wave 2: Migrate lifecycle-manager.ts
**Scope:** `src/lib/lifecycle-manager.ts`

**TDD Cycle:**
1. RED: Write `tests/lib/lifecycle-manager.test.ts` (lifecycle-manager tests)
   - cancelDelegatedSession calls client.session.abort with { path: { id } }
   - launchDelegatedSession creates session with correct shape
   - launchDelegatedSession dispatches via sendPrompt (sync) or sendPromptAsync (async)
   - observeBackgroundCompletion uses tracker.watch
   - tracker is injected via options, not created internally
2. GREEN: Update imports, change `client: any` to typed, wire tracker
3. VERIFY: typecheck + ALL tests pass
4. COMMIT: `refactor(lifecycle-manager): migrate to typed session-api + tracker injection`

**Key changes:**
- Options type: `{ client, tracker: SessionCompletionTracker, pollTimeoutMs }` (remove pollIntervalMs)
- `createSessionByAnyPath` → `createSession`
- `promptSessionByAnyPath` → `sendPrompt`
- `promptSessionAsyncByAnyPath` → `sendPromptAsync`
- `waitForAssistantText(client, id, interval, timeout)` → `waitForAssistantText(client, tracker, id, timeout)`
- `waitForSessionCompletion(client, id, interval, timeout)` → `tracker.watch(id, timeout)`

### Wave 3: Wire plugin.ts
**Scope:** `src/plugin.ts`

**TDD Cycle:**
1. RED: No new tests needed — plugin.ts is composition root, wiring only
2. GREEN: Update plugin.ts
   - Import `SessionCompletionTracker` from session-api
   - Create tracker instance at plugin factory scope
   - Wire `event` hook: call `tracker.feed(eventType, sessionID, error)` alongside existing `lifecycleManager.handleEvent()`
   - Pass tracker to `createHarnessLifecycleManager({ client, tracker, pollTimeoutMs })`
3. VERIFY: typecheck + ALL tests pass
4. COMMIT: `feat(plugin): wire SessionCompletionTracker to event hook`

### Wave 4: Verification Gate
1. `npm run typecheck` — must pass with 0 errors
2. `npm run test` — all tests green
3. `npm run build` — clean build
4. No uncommitted source changes

### Wave 5: Code Review + AGENTS.md
1. Dispatch critic subagent to review all changed files
2. Update AGENTS.md:
   - Remove "Multi-path SDK fallback" from conventions
   - Remove "client: any" known tech debt note
   - Update session-api.ts description
   - Update dependency graph
   - Update code smell register

## Rollback Plan
If any wave fails verification:
1. `git stash` the broken changes
2. Review the failure output
3. Fix and re-run verification before committing
4. Never commit broken code

## Constraints
- ESM only (.js extensions in imports)
- [Harness] prefix on all thrown errors
- Zero runtime deps
- No `any` types on new code
- Every wave must pass typecheck before commit
