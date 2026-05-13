# Phase CP-ST-03: Architecture Detox — SPEC

**Locked:** 2026-05-13
**Status:** 🔒 SPEC-LOCKED
**Ambiguity score:** 0.12 (well-defined)
**Source:** CP-ST-03-CONTEXT.md + CP-ST-03-RESEARCH.md

## Acceptance Criteria

### Plan 01: Event-Tracker Excision

| ID | Criterion | Format | Verification |
|----|-----------|--------|-------------|
| AC-01 | `src/task-management/journal/event-tracker/` directory does not exist | EARS-ubiquitous | `find src/task-management/journal/ -name "event-tracker" -type d \| wc -l` → 0 |
| AC-02 | `src/index.ts` has zero imports or re-exports from event-tracker | EARS-ubiquitous | `grep "event-tracker" src/index.ts \|\| echo "PASS"` |
| AC-03 | All dead commented code in `src/plugin.ts` referencing event-tracker is removed | EARS-ubiquitous | `grep "event-tracker\|EventTracker\|consumeJourneyFact\|sessionJourneyEventObserver" src/plugin.ts \|\| echo "PASS"` |
| AC-04 | `createSessionJourneyEventObserver` removed from `src/hooks/observers/event-observers.ts` | EARS-ubiquitous | `grep "createSessionJourneyEventObserver" src/hooks/observers/event-observers.ts \|\| echo "PASS"` |
| AC-05 | `removeLegacyStateFiles()` method removed from `src/features/session-tracker/index.ts` | EARS-ubiquitous | `grep "removeLegacyStateFiles\|cleanupLegacyEventTracker\|event-tracker" src/features/session-tracker/index.ts \|\| echo "PASS"` |
| AC-06 | `".hivemind/event-tracker"` removed from `CANONICAL_PREFIXES` in `src/sidecar/readonly-state.ts` | EARS-ubiquitous | `grep 'event-tracker' src/sidecar/readonly-state.ts \|\| echo "PASS"` |
| AC-07 | `"event-tracker"` removed from `TIER_1_DIRECTORIES` in `src/features/bootstrap/structure.ts` | EARS-ubiquitous | `grep '"event-tracker"' src/features/bootstrap/structure.ts \|\| echo "PASS"` |
| AC-08 | One-shot migration cleanup removes `.hivemind/event-tracker/` on init if present | EARS-event-driven | WHEN plugin initializes, IF `.hivemind/event-tracker/` directory exists, THEN it is removed once |
| AC-09 | `tests/lib/event-tracker/` directory does not exist | EARS-ubiquitous | `find tests/lib/ -name "event-tracker" -type d \| wc -l` → 0 |
| AC-10 | `tests/plugins/plugin-lifecycle.test.ts` has zero references to `event-tracker` or `.hivemind/event-tracker/` | EARS-ubiquitous | `grep "event-tracker\|eventTracker" tests/plugins/plugin-lifecycle.test.ts \|\| echo "PASS"` |
| AC-11 | All event-tracker mock imports removed from `tests/plugin/bootstrap-tools-registration.test.ts` | EARS-ubiquitous | `grep "event-tracker" tests/plugin/bootstrap-tools-registration.test.ts \|\| echo "PASS"` |
| AC-12 | 7 documentation files updated to remove event-tracker references | EARS-ubiquitous | grep each file for "event-tracker" — must be clean or have only historical references in `.planning/phases/13-*/` |
| AC-13 | `src/plugin.ts` zero dead commented code blocks referencing event-tracker | EARS-ubiquitous | `grep "consumeJourneyFact\|sessionJourneyEventObserver\|createEventTrackerArtifactsFromHook\|shouldTrackEventTrackerEvent" src/plugin.ts \|\| echo "PASS"` |

### Plan 02: Plugin.ts Composition Purification

| ID | Criterion | Format | Verification |
|----|-----------|--------|-------------|
| AC-14 | `src/hooks/observers/session-entry-consumer.ts` exists, exports factory, consumes `sessionEntryObserverFactory` | EARS-state-driven | file exists + exports `createSessionEntryConsumer` |
| AC-15 | `src/hooks/observers/session-main-consumer.ts` exists, exports factory, consumes `sessionIsMainObserverFactory` | EARS-state-driven | file exists + exports `createSessionMainConsumer` |
| AC-16 | `src/hooks/observers/delegation-consumer.ts` exists, exports factory, consumes `delegationEventObserver` | EARS-state-driven | file exists + exports `createDelegationConsumer` |
| AC-17 | `src/hooks/observers/session-tracker-consumer.ts` exists, exports factory, consumes `sessionTracker` | EARS-state-driven | file exists + exports `createSessionTrackerConsumer` |
| AC-18 | `src/hooks/transforms/tool-before-guard.ts` exists, combines tool guard + session-tracker detection | EARS-state-driven | file exists + exports `createToolBeforeGuard` |
| AC-19 | `src/hooks/transforms/chat-message-capture.ts` exists, wraps `sessionTracker.handleChatMessage` | EARS-state-driven | file exists + exports `createChatMessageCapture` |
| AC-20 | `src/hooks/transforms/tool-after-workflow.ts` exists, contains workflow config persistence logic | EARS-state-driven | file exists + exports `createToolAfterWorkflow` |
| AC-21 | `src/plugin.ts` has zero inline callback closures — all are factory imports | EARS-ubiquitous | visual inspection: no `async ({ event })` or `async (input, output)` closures in plugin.ts body |
| AC-22 | `src/plugin.ts` tool registration map is preserved (NOT extracted) — it IS composition | EARS-ubiquitous | `grep "delegate-task.*createDelegateTaskTool" src/plugin.ts` returns match |
| AC-23 | `src/plugin.ts` LOC after extraction is ≤ 220 | EARS-ubiquitous | `wc -l src/plugin.ts` — target ≤ 220; hard ceiling ≤ 250 |

### Cross-Cutting

| ID | Criterion | Format | Verification |
|----|-----------|--------|-------------|
| AC-24 | TypeScript compiles cleanly throughout | EARS-ubiquitous | `npm run typecheck` → exit 0 |
| AC-25 | Full test suite passes (minus deleted event-tracker test files) | EARS-ubiquitous | `npm test` → all passing files ≥ 164 of 167 |
| AC-26 | All 276 session-tracker tests pass | EARS-ubiquitous | `npx vitest run tests/features/session-tracker/` → all pass |
| AC-27 | Zero new dependencies added | EARS-ubiquitous | `git diff package.json` → no new entries |
| AC-28 | No circular imports introduced | EARS-ubiquitous | `npm run typecheck` catches circular refs (ESM strict) |
| AC-29 | `src/plugin/` directory does NOT exist | EARS-ubiquitous | `test -d src/plugin && echo "FAIL" \|\| echo "PASS"` |

## Structural Rules

| Rule | Description | Enforcement |
|------|-------------|------------|
| SR-01 | Extracted hook modules are pass-through wrappers only — zero business logic | Review: each module calls existing APIs, no new algorithms |
| SR-02 | Extracted modules live under existing `src/hooks/observers/` or `src/hooks/transforms/` directories | File placement check |
| SR-03 | Each extracted module exports exactly one factory function named `createXxxConsumer` or `createXxxGuard` | Export count check |
| SR-04 | Factory functions accept typed dependencies as parameters (not global imports) | Type check: dependencies are function params |
| SR-05 | Error handling preserves existing try/catch + `client.app?.log?.()` pattern | Code review: catch blocks unchanged |
| SR-06 | plugin.ts tool registration map stays intact — 27 tool entries preserved | Grep count: 27 `createXxxTool` calls |
| SR-07 | Doc sync replaces event-tracker references with session-tracker equivalents where applicable | Per-file grep after edits |
| SR-08 | One-shot migration uses `.hivemind/state/event-tracker-migration-done` sentinel file | File exists check after first init |

## Anti-Patterns (Blocking)

| Anti-Pattern | Why Blocked | Detection |
|-------------|-------------|-----------|
| AP-01: Extracting tool registration map | Tool registration IS composition/wiring, not business logic. Extracting it fragments the assembly point without benefit. | If `src/plugin.ts` tool registry drops below 27 entries |
| AP-02: Creating `src/plugin/` directory | Not authorized by ARCHITECTURE.md. plugin.ts is the single composition root. | `test -d src/plugin` check |
| AP-03: Introducing business logic in extracted modules | Extracted modules must be pass-through wrappers. New logic belongs in `src/features/` or `src/hooks/` with proper authority. | Code review: new algorithms, new state mutations |
| AP-04: Renaming or restructuring existing modules | This is a subtraction + extraction task. Do not reorganize working code. | `git diff --name-only` shows only deletions + new hook files + plugin.ts edits |
| AP-05: Changing session-tracker capture behavior | Session-tracker is the canonical capture system. Only remove its legacy event-tracker cleanup code. | `git diff src/features/session-tracker/` shows only AC-05 removal |
| AP-06: Chasing arbitrary LOC targets | 150 LOC is NOT a hard target. Extracting tool registration to hit a number is mechanical fragmentation. Architecture quality > LOC count. | If new extraction proposals exist beyond the 7 callbacks in CONTEXT.md |

## Verification Methods

| Level | Method | Covers |
|-------|--------|--------|
| L1 (runtime) | `npm test` full suite | AC-24, AC-25, AC-26 |
| L2 (integration) | `npm run typecheck` | AC-24, AC-28 |
| L3 (structural) | grep/glob assertions per AC | AC-01 through AC-23, AC-27, AC-29 |
| L4 (review) | Code review of extracted modules | SR-01 through SR-04, AP-01 through AP-06 |
| L5 (doc) | Documentation grep sweep | AC-12, SR-07 |

## Gate Conditions

```
Pre-execute gate:
  - [ ] CONTEXT.md exists with 7 decisions
  - [ ] RESEARCH.md exists with complete inventory
  - [ ] SPEC.md exists with 29 ACs
  - [ ] Ambiguity score ≤ 0.20 (current: 0.12)
  
Post-execute gate:
  - [ ] All 29 ACs verified
  - [ ] All 8 structural rules enforced
  - [ ] Zero anti-pattern violations
  - [ ] Typecheck passes
  - [ ] 276 session-tracker tests pass
  - [ ] Full suite passes minus deleted event-tracker tests
```
