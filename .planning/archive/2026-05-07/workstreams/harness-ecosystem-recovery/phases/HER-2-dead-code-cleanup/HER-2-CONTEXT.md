# Phase HER-2: Dead Code Cleanup - Context

**Gathered:** 2026-05-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove or wire orphan modules in `src/lib/`. Reduce 13.7% dead code ratio to <5%. No module with zero consumers remains. All wired subsystems pass `npm run typecheck && npm run build`.

**Scope anchor:** 28 orphan modules (2,447 LOC confirmed) + partial orphans (runtime-detection: 407 LOC) = ~2,959 LOC of fully implemented but unwired code. Plus boundary violations (notification-handler DEPRECATED tag, recovery-engine facade).

</domain>

<decisions>
## Implementation Decisions

### auto-loop + ralph-loop (328 LOC)
- **D-01:** Wire both as runtime features in plugin.ts
- **D-02:** auto-loop (146 LOC) — pure async orchestrator for self-referential dev loops. Register as a hook-integrated capability enabling autonomous multi-iteration agent workflows
- **D-03:** ralph-loop (182 LOC) — pure async orchestrator for validate-fix-redispatch cycles (default 3 iterations). Register alongside auto-loop as a correction cycle primitive
- Both are DI-based with no side effects — safe to wire directly

### supervisor/ + recovery-engine.ts (491 LOC)
- **D-04:** Remove supervisor/ entirely (5 files, 419 LOC) — fully superseded:
  - Health checks → `sdk-supervisor/` (already wired to plugin.ts line 33)
  - Command routing → `command-engine/` (already wired to plugin.ts line 34)
  - Context rendering → `command-engine/renderCommandContext()` (already wired)
  - Message transforms → explicitly stripped in Phase 35 (no-op hook)
- **D-05:** Remove `recovery-engine.ts` facade (72 LOC) — zero consumers. The underlying `recovery/` modules ARE wired directly through their own tools

### notification-handler.ts (290 LOC)
- **D-06:** Remove DEPRECATED tag — the module is actively used in the hot path
- **D-07:** Fix stale comment in `create-core-hooks.ts:8` ("notification-handler removed (dead code)") — incorrect, re-activated in Phase 16.2
- **D-08:** Remove unused export `buildTaskNotificationFromContinuity` — has tests but zero production callers
- **D-09:** Keep all other exports — `notifyDelegationTerminal` and `replayPendingNotifications` are on the runtime hot path

### session-entry/ (667 LOC)
- **D-10:** Wire as hooks (event observer + system.transform injection), NOT tools
- **D-11:** Event observer on `session.created` → `resolveIntake()` → store IntakeResult in memory
- **D-12:** System.transform hook injects routing context (purpose class, language, profile) into agent prompt
- **D-13:** Compaction hook preserves intake result across context window compaction
- **D-14:** Fills the empty `system.transform` stub at `create-core-hooks.ts:68-74`
- **D-15:** Comprehensive tool wrappers deferred to later phases, following `.planning/CUSTOM-TOOLS-CRITERIA-2026-05-05.md`

### work-contract/ (613 LOC)
- **D-16:** Remove entirely — superseded by `agent-work-contracts/` (4 files, ~400 LOC, actively wired)

### runtime-detection/ partial orphans (407 LOC)
- **D-17:** Remove dead files: `codemap.ts`, `codescan.ts`, `file-watcher.ts` (407 LOC)
- **D-18:** Keep `stack-synthesizer.ts` (90 LOC) — consumed by `framework-detector.ts`
- **D-19:** Keep `index.ts` — update barrel to export only stack-synthesizer

### Agent's Discretion
- Exact wiring pattern for auto-loop/ralph-loop (hooks vs standalone registration)
- Whether to extract intake cache into a shared module or keep it observer-local
- Test strategy for newly wired modules (unit vs integration)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Dead Code Inventory
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md` — HER-2 routing table (6 actions, LOC counts, strategies)
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix-2026-05-05.md` — Module classification (116 modules, 28 orphans, boundary violations)
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-pattern-lineage-2026-05-05.md` — Legacy patterns (84 concepts, 7 DEAD subsystems)
- `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md` — Unified ecosystem map with dead code locations

### Wiring Targets
- `src/plugin.ts` — Plugin composition root (tool + hook registration surface)
- `src/hooks/create-core-hooks.ts` — Core hook factory (system.transform stub at line 68-74)
- `src/hooks/create-session-hooks.ts` — Session hooks (compaction hook at line 220-283)
- `src/hooks/plugin-event-observers.ts` — Event observer pattern reference (line 19-35)

### Tool Design Standard
- `.planning/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10-criterion tool design standard (deferred tool wrappers must follow this)

### Boundary Violations
- `src/lib/notification-handler.ts` — DEPRECATED tag is wrong (re-activated Phase 16.2)
- `src/lib/recovery-engine.ts` — Dead facade (zero consumers)
- `src/lib/lifecycle-manager.ts:9` — Imports notification-handler (valid, keep)
- `src/lib/delegation-state-machine.ts:22` — Imports notification-handler (valid, keep)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/auto-loop.ts` (146 LOC) — Pure DI orchestrator, ready to wire
- `src/lib/ralph-loop.ts` (182 LOC) — Pure DI orchestrator, ready to wire
- `src/lib/session-entry/intake-gate.ts` — `resolveIntake()` entry point, pure function
- `src/lib/session-entry/purpose-classifier.ts` — 8-class intent classifier, enables F-04c
- `src/lib/session-entry/language-resolution.ts` — Unicode-based language detection
- `src/lib/session-entry/profile-resolver.ts` — Developer profile inference

### Established Patterns
- Event observer pattern: `src/hooks/plugin-event-observers.ts:19-35` — factory returns observer function
- System.transform hook: `src/hooks/create-core-hooks.ts:68-74` — currently empty stub, ready for injection
- Compaction preservation: `src/hooks/create-session-hooks.ts:261` — continuity snapshot pattern to follow

### Integration Points
- `src/plugin.ts:74-106` — deps bundle (add sessionEntryObserver)
- `src/plugin.ts:104` — eventObservers array (add sessionEntryObserver.observe)
- `src/hooks/create-core-hooks.ts:68-74` — system.transform stub (wire intake injection)
- `src/hooks/create-session-hooks.ts:220-283` — compaction hook (add intake preservation)

</code_context>

<specifics>
## Specific Ideas

- session-entry tool wrappers should follow `.planning/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10-criterion standard
- The delegation subsystem needs a major revamp (F-06) — notification-handler cleanup is a prerequisite, not a substitute
- auto-loop + ralph-loop enable "keep trying until it works" autonomous agent workflows

</specifics>

<deferred>
## Deferred Ideas

- session-entry/ tool wrappers — later phases, must follow CUSTOM-TOOLS-CRITERIA
- F-06 delegation revamp — notification-handler is part of this larger effort
- supervisor/ health checks (system-level) could complement sdk-supervisor (SDK-level) if observability gaps emerge — revisit after HER-3

</deferred>

---

*Phase: HER-2-dead-code-cleanup*
*Context gathered: 2026-05-05*
