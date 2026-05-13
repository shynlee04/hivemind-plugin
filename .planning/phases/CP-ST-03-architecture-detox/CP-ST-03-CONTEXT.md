# Phase CP-ST-03: Architecture Detox — Context

**Created:** 2026-05-13
**Status:** Research complete → Proceeding to SPEC
**Scope:** Event-tracker excision + plugin.ts composition purification

## Phase Goal

Remove all legacy event-tracker code, tests, and references. Extract inline hook callback logic from `plugin.ts` into dedicated hook modules. `plugin.ts` becomes a thin composition assembly point.

## Decisions

### D-01: LOC Target is Flexible — Structural Integrity First

**Decision:** Do NOT mechanically force `plugin.ts` below 150 LOC. The tool registration map (~25 LOC) is **composition/wiring**, not business logic — it stays in `plugin.ts`. The target is structural clarity: all inline callback bodies are extracted, leaving `plugin.ts` as a pure assembly of imports + dependency instantiation + wiring.

**Extract:**
- 4 inline observer callbacks (`consumeSessionTrackerFact`, `consumeSessionEntryFact`, `consumeIsMainSessionFact`, `consumeDelegationFact`) — ~55 LOC → `src/hooks/observers/`
- 2 inline hook handlers (`tool.execute.before`, `chat.message`) — ~57 LOC → `src/hooks/transforms/`
- 1 `tool.execute.after` workflow-config persistence logic — ~30 LOC → `src/hooks/transforms/`

**Keep in plugin.ts:**
- All imports (~55 LOC)
- Dependency instantiation: DelegationManager, SessionTracker, LifecycleManager, PTY (~30 LOC)
- Tool registration map (~27 entries, ~25 LOC) — this IS composition
- Observer array wiring (~5 LOC)
- Return statement assembly (~5 LOC)

**Expected:** ~200-220 LOC clean composition root. Not 150. Good architecture.

### D-02: Full Event-Tracker Excision — Zero Runtime References

**Decision:** Delete all source code under `src/task-management/journal/event-tracker/` (12 files). Remove the only active import (`src/index.ts:19`). Remove `createSessionJourneyEventObserver` from `src/hooks/observers/event-observers.ts` (was only used by dead code). Remove `removeLegacyStateFiles()` from `src/features/session-tracker/index.ts` (now that source is deleted, runtime state cleanup is handled by one-shot migration).

**Evidence:** RESEARCH.md confirmed zero active runtime consumers beyond `src/index.ts:19` re-export. All plugin.ts references are dead commented code.

### D-03: One-Shot Migration Cleanup

**Decision:** Add a one-time cleanup on plugin init that removes `.hivemind/event-tracker/` directory if it exists. This handles existing users who have stale state files. The cleanup runs once, records completion in `.hivemind/state/` to avoid running again.

### D-04: Sidecar Prefix Removal

**Decision:** Remove `".hivemind/event-tracker"` from `CANONICAL_PREFIXES` in `src/sidecar/readonly-state.ts`. The sidecar no longer needs to recognize this path as canonical.

### D-05: Bootstrap Structure Removal

**Decision:** Remove `"event-tracker"` from `TIER_1_DIRECTORIES` in `src/features/bootstrap/structure.ts`. The bootstrap-init tool no longer creates this directory.

### D-06: Test Strategy

**Decision:** Three categories of test changes:

| Category | Action | Files |
|----------|--------|-------|
| **Delete** (dead tests) | Remove entirely | `tests/lib/event-tracker/` (10 files) |
| **Rewrite** (event-tracker assertions) | Replace event-tracker assertions with session-tracker equivalents | `tests/plugins/plugin-lifecycle.test.ts` (6 tests) |
| **Edit** (references) | Remove event-tracker references, update paths | `tests/lib/state-root-migration.test.ts`, `tests/lib/security/path-scope.test.ts`, `tests/features/session-tracker/integration/e2e-verification.test.ts`, `tests/tools/bootstrap-init.test.ts`, `tests/tools/hivemind-pressure.test.ts`, `tests/plugin/bootstrap-tools-registration.test.ts`, `tests/sidecar/readonly-state.test.ts` |

### D-07: Documentation Sync

**Decision:** Update 7 files:
- `AGENTS.md:93` — change `/.hivemind/event-tracker/` to `/.hivemind/session-tracker/`
- `src/task-management/journal/AGENTS.md` — remove event-tracker section
- `src/task-management/AGENTS.md` — remove EventTracker mention
- `src/features/session-tracker/AGENTS.md` — remove event-tracker boundary clause
- `sidecar/README.md` — remove event-tracker from canonical path docs
- `.planning/ROADMAP.md:124` — update session-tracker description to reflect completed migration
- `src/plugin.ts` — remove all dead commented code referencing event-tracker

## Extraction Map

| Plugin.ts Lines | Content | Target File |
|-----------------|---------|-------------|
| 125-131 | `consumeSessionEntryFact` callback | `src/hooks/observers/session-entry-consumer.ts` |
| 132-138 | `consumeIsMainSessionFact` callback | `src/hooks/observers/session-main-consumer.ts` |
| 139-147 | `consumeDelegationFact` callback | `src/hooks/observers/delegation-consumer.ts` |
| 162-180 | `consumeSessionTrackerFact` callback | `src/hooks/observers/session-tracker-consumer.ts` |
| 194-235 | `tool.execute.before` handler | `src/hooks/transforms/tool-before-guard.ts` |
| 238-254 | `chat.message` handler | `src/hooks/transforms/chat-message-capture.ts` |
| 281-318 | `tool.execute.after` handler (workflow config part) | `src/hooks/transforms/tool-after-workflow.ts` |
| 281-299 | `tool.execute.after` handler (session-tracker part) | merge into `src/hooks/transforms/tool-after-capture.ts` |

## Non-Goals (Explicit)

- Do NOT move tool registration map out of plugin.ts
- Do NOT add new dependencies
- Do NOT change any runtime behavior
- Do NOT modify session-tracker capture logic — only remove legacy event-tracker references
- Do NOT create `src/plugin/` directory (not authorized per ARCHITECTURE.md)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Circular imports from extraction | MEDIUM | Verify dependency graph before each extraction commit |
| Test breakage from deletion | LOW | Run full suite after each wave |
| Stale `.hivemind/event-tracker/` on existing installs | LOW | D-03 one-shot migration cleanup |
| Sidecar read-only path enforcement | LOW | D-04 removes prefix; sidecar tests verify |

## Downstream

- CP-ST-03-01-PLAN.md — Event-Tracker Excision + Documentation Sync
- CP-ST-03-02-PLAN.md — Plugin.ts Composition Purification (extract 7 inline callbacks)
- CP-ST-03-03-PLAN.md — Verification + Migration Cleanup

## References

- `CP-ST-03-RESEARCH.md` — complete inventory of all 372+ references
- `.planning/codebase/ARCHITECTURE.md:70-82` — plugin.ts thin composition root rule
- `.planning/codebase/ARCHITECTURE.md:339-353` — CQRS hook boundary
- `src/AGENTS.md` — Hard Harness sector guidance §2
