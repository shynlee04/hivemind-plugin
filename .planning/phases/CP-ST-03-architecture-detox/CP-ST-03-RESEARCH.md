# Phase CP-ST-03: Architecture Detox — Research

**Researched:** 2026-05-13
**Domain:** TypeScript plugin refactoring — dead code excision + composition purification
**Confidence:** HIGH

## Summary

Phase CP-ST-03 has two objectives: (1) fully excise the legacy event-tracker system (source, tests, references, and runtime state paths) that was supplanted by the session-tracker in CP-ST-01/02, and (2) extract inline hook callback logic from `src/plugin.ts` into dedicated hook modules to approach the "< 150 LOC" pure-composition target.

The event-tracker was deprecated in Phase 13 (F-09) when `consumeJourneyFact` was removed from the `eventObservers` array, but its source code, tests, exports, and runtime references remain scattered across 12 source files, 10 test files, 9 test suites, 6 source files, and 5+ documentation files. The snapshot below represents a live grep of the entire codebase.

The plugin.ts purification requires extracting 6 inline callback closures (totaling ~120 LOC) into dedicated hook modules. Combined with dead-code removal, this reduces `src/plugin.ts` from 322 LOC to approximately 180-200 LOC. The < 150 LOC target requires additional extraction of the tool registration block into a factory, which is packaged as a stretch goal.

**Primary recommendation:** Execute the event-tracker excision first (lower risk, purely subtractive), then purify plugin.ts. Both are independent except for the commented `consumeJourneyFact` block that bridges them.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session event capture & persistence | API / Backend (`src/features/session-tracker/`) | — | SessionTracker is the canonical owning module |
| Legacy event-to-JSON/MD projection | **REMOVED** (was API/Backend) | — | Dead code; session-tracker replaces it |
| Read-only sidecar path enforcement | CDN / Static (`src/sidecar/`) | — | Sidecar needs canonical paths for read-only enforcement |
| Plugin composition & hook wiring | API / Backend (`src/plugin.ts`) | `src/hooks/` | plugin.ts owns assembly; hook modules own behavior |
| Hook observation & event routing | API / Backend (`src/hooks/observers/`) | — | Read-side observers; no durable writes |
| Bootstrap directory scaffolding | API / Backend (`src/features/bootstrap/`) | — | Creates `.hivemind/` subdirectories on init |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ~5.x (strict) | Source language | Project constraint — `strict: true` |
| @opencode-ai/plugin | ≥ 1.1.0 | Plugin SDK — provides `Plugin` type, hook surfaces | Peer dependency; shipped in npm package |
| Vitest | ~2.x | Test framework | Project standard; 1,765/1,767 tests pass |
| Node.js | ≥ 20.0.0 | Runtime | Project constraint |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ~3.x (via schema-kernel) | Schema validation | For new hook parameter types |

**Installation:** No new dependencies needed — this is purely subtractive + refactoring work.

## Architecture Patterns

### System Architecture — Event Flow (Post-Excision)

```
OpenCode Runtime Events
        │
        ▼
┌───────────────────────────────────────────────┐
│ src/plugin.ts (composition root, ~200 LOC)     │
│ eventObservers: [                              │
│   consumeDelegationFact,        ← extracted    │
│   sessionEventObserver,                        │
│   consumeSessionTrackerFact,    ← extracted    │
│   consumeSessionEntryFact,      ← extracted    │
│   consumeIsMainSessionFact,     ← extracted    │
│ ]                                              │
│ tool.execute.before → extracted                │
│ tool.execute.after  → extracted                │
│ chat.message        → inline (thin)            │
└──────┬─────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ src/features/session-tracker/ (canonical)     │
│ .hivemind/session-tracker/ ← persistence      │
│ ❌ .hivemind/event-tracker/ ← REMOVED         │
└──────────────────────────────────────────────┘
```

### Pattern 1: Factory Extraction (Inline Callback → Hook Module)

**What:** Move inline async callbacks from `plugin.ts` into dedicated files under `src/hooks/observers/` or `src/hooks/transforms/`, each exporting a factory function that accepts typed dependencies and returns a hook-compatible function.

**When to use:** Any closure in `plugin.ts` exceeding 5 lines that captures external dependencies.

**Example (consumeSessionTrackerFact extraction):**
```typescript
// src/hooks/observers/session-tracker-consumer.ts
import { getEventSessionID } from "../../shared/session-api.js"
import type { SessionTracker } from "../../features/session-tracker/index.js"

export function createSessionTrackerConsumer(
  sessionTracker: SessionTracker,
  logWarn?: (msg: string, err: unknown) => void,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      const ev = event as Record<string, unknown> | undefined
      const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
      const sessionID = getEventSessionID(ev) || ""
      if (sessionID) {
        await sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
      }
    } catch (err) {
      logWarn?.("[Harness] Session tracker event observer failed", err)
    }
  }
}
```

### Anti-Patterns to Avoid
- **New `src/hooks/event-tracker/` module:** Do NOT create any new event-tracker code. The session-tracker replaced it.
- **Moving event-tracker code to `src/features/`:** Do NOT relocate. The session-tracker already lives at `src/features/session-tracker/`; the event-tracker is dead.
- **Preserving `.hivemind/event-tracker/` runtime directory:** Remove from all code paths. The session-tracker can still clean it as part of migration, but no new code should create or reference it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fact consolidation from hook events | Custom `consumeJourneyFact` clone | `sessionTracker.handleSessionEvent()` | Already built; event-tracker projection was double-capture |
| Session artifact persistence | Event-tracker JSON/MD writer | Session-tracker's atomic write pipeline | Already built; proven in CP-ST-01/02 |
| Path safety for `.hivemind/` access | Custom path validation | `src/sidecar/readonly-state.ts` (updated) | Already built; only needs CANONICAL_PREFIXES update |

**Key insight:** The event-tracker has been dead code since Phase 13 (F-09). Every capability it provided is now served by `src/features/session-tracker/`. Removing the code does not remove functionality — it removes an atrophied limb that was already disconnected.

---

## TASK 1: Event-Tracker Excision — Complete Inventory

### 1A. Source Files to DELETE (12 files)

All under `src/task-management/journal/event-tracker/`:
```
src/task-management/journal/event-tracker/types.ts
src/task-management/journal/event-tracker/parser.ts
src/task-management/journal/event-tracker/writer.ts
src/task-management/journal/event-tracker/markdown-renderer.ts
src/task-management/journal/event-tracker/index.ts
src/task-management/journal/event-tracker/hook-event.ts
src/task-management/journal/event-tracker/document-store.ts
src/task-management/journal/event-tracker/dual-persistence.ts
src/task-management/journal/event-tracker/classifier.ts
src/task-management/journal/event-tracker/delegation-evidence.ts
src/task-management/journal/event-tracker/artifact-writer.ts
src/task-management/journal/event-tracker/.gitkeep
```

Also remove the parent directory `src/task-management/journal/event-tracker/` (if it's the only dir; the `.gitkeep` under `journal/` should keep the parent registered).

### 1B. Test Files to DELETE (10 files)

All under `tests/lib/event-tracker/`:
```
tests/lib/event-tracker/session-v3-schema.test.ts
tests/lib/event-tracker/session-journey-events.test.ts
tests/lib/event-tracker/writer.test.ts
tests/lib/event-tracker/document-store.test.ts
tests/lib/event-tracker/dual-persistence.test.ts
tests/lib/event-tracker/event-types.test.ts
tests/lib/event-tracker/session-artifact-parser.test.ts
tests/lib/event-tracker/artifact-writer.test.ts
tests/lib/event-tracker/delegation-evidence.test.ts
tests/lib/event-tracker/classifier.test.ts
```

Also remove the parent directory `tests/lib/event-tracker/`.

### 1C. Source Files to EDIT

| File | Lines | Change | Detail |
|------|-------|--------|--------|
| `src/plugin.ts` | 46-54 | DELETE | Commented import block (`createEventTrackerArtifactsFromHook`, `shouldTrackEventTrackerEvent`) + all surrounding commentary |
| `src/plugin.ts` | 17 | EDIT | Remove `createSessionJourneyEventObserver` mention from comment on line 17 |
| `src/plugin.ts` | 123-124 | DELETE | Commented `sessionJourneyEventObserver` instantiation |
| `src/plugin.ts` | 148-161 | DELETE | Commented `consumeJourneyFact` block (14 lines) |
| `src/index.ts` | 19 | DELETE | `export * from "./task-management/journal/event-tracker/index.js"` |
| `src/hooks/observers/event-observers.ts` | 11-13 | DELETE | `SessionJourneyEventFact` type (unused since F-09) |
| `src/hooks/observers/event-observers.ts` | 39-51 | DELETE | `createSessionJourneyEventObserver()` function (unused since F-09) |
| `src/hooks/observers/event-observers.ts` | 42 | EDIT | Remove `@param shouldTrack` from JSDoc (now dead reference) |
| `src/features/session-tracker/index.ts` | 787-795 | EDIT | Update `cleanup()` JSDoc — remove event-tracker references |
| `src/features/session-tracker/index.ts` | 798-799 | DELETE | Remove `removeLegacyStateFiles()` call from `cleanup()` method |
| `src/features/session-tracker/index.ts` | 979-1018 | DELETE | Remove `removeLegacyStateFiles()` private method entirely (40 LOC) |
| `src/sidecar/readonly-state.ts` | 10 | EDIT | Remove `.hivemind/event-tracker/` from comment |
| `src/sidecar/readonly-state.ts` | 34 | EDIT | Remove `".hivemind/event-tracker"` from `CANONICAL_PREFIXES` array |
| `src/shared/plugin-tool-output-summary.ts` | 9 | EDIT | Change `"plugin event-tracker limit"` → `"plugin tool output summary limit"` |
| `src/features/bootstrap/structure.ts` | 58 | DELETE | Remove `"event-tracker"` from `TIER_1_DIRECTORIES` array |

### 1D. Test Files to EDIT

| File | Lines | Change | Detail |
|------|-------|--------|--------|
| `tests/plugins/plugin-lifecycle.test.ts` | 77-93 | DELETE | `"automatically writes event-tracker artifacts for canonical OpenCode lifecycle events"` test |
| `tests/plugins/plugin-lifecycle.test.ts` | 95-115 | DELETE | `"automatically routes parent-linked sub-session lifecycle events to the parent event-tracker artifact"` test |
| `tests/plugins/plugin-lifecycle.test.ts` | 117-138 | DELETE | `"does not write event-tracker artifacts for message firehose plugin events"` test |
| `tests/plugins/plugin-lifecycle.test.ts` | 139-186 | EDIT | `"keeps lifecycle notification replay independent from event-tracker admission"` — remove event-tracker assertions |
| `tests/plugins/plugin-lifecycle.test.ts` | 195-210 | EDIT | `"session tracker and tool metadata"` — remove any event-tracker assertions |
| `tests/plugins/plugin-lifecycle.test.ts` | 222-239 | EDIT | `"composes tool-guard metadata injection with plugin event-tracker after-hook work"` — remove event-tracker assertion |
| `tests/lib/state-root-migration.test.ts` | 13 | DELETE | Import of `getEventTrackerArtifactPaths` |
| `tests/lib/state-root-migration.test.ts` | 55-62 | DELETE | `"event-tracker writes to .hivemind/event-tracker/"` test |
| `tests/lib/state-root-migration.test.ts` | 108-110 | DELETE | `.hivemind/event-tracker` gitignore assertion |
| `tests/lib/security/path-scope.test.ts` | 26-30 | DELETE | `"allows canonical .hivemind state and event-tracker paths"` test (or edit to remove event-tracker sub-assertion) |
| `tests/features/session-tracker/integration/e2e-verification.test.ts` | 595-630 | DELETE | All 3 legacy event-tracker tests (`"removes stale .json/.md files"`, `"old event-tracker source code is preserved"`, `"no new files written to legacy event-tracker"`) |
| `tests/features/session-tracker/integration/cleanup.test.ts` | 36 | DELETE | `"removes .json and .md files from .hivemind/event-tracker/"` test |
| `tests/tools/bootstrap-init.test.ts` | 12 | EDIT | Remove `"event-tracker"` from expected directory list |
| `tests/tools/hivemind-pressure.test.ts` | 56, 61 | EDIT | Replace `"event-tracker:ses_root"` → use session-tracker reference or generic |
| `tests/plugin/bootstrap-tools-registration.test.ts` | 41 | DELETE | `vi.mock("../../src/task-management/journal/event-tracker/index.js", ...)` |
| `tests/sidecar/readonly-state.test.ts` | 18 | DELETE | `mkdirSync(join(projectRoot, ".hivemind", "event-tracker"), ...)` |
| `tests/sidecar/readonly-state.test.ts` | 36-38 | DELETE | `"recognizes paths under .hivemind/event-tracker/"` test |

### 1E. Documentation Files to EDIT

| File | Lines | Change | Detail |
|------|-------|--------|--------|
| `AGENTS.md` (root) | 93 | EDIT | Remove/replace `/.hivemind/event-tracker/*` reference → point to `.hivemind/session-tracker/` |
| `src/task-management/journal/AGENTS.md` | 7, 12, 34 | EDIT | Remove event-tracker references from purpose, mutation authority, naming sections |
| `src/task-management/AGENTS.md` | 13 | EDIT | Remove `EventTracker may project audit events to .hivemind/event-tracker/` |
| `src/features/session-tracker/AGENTS.md` | 9 | OK | Already states replacement — no change needed |
| `src/features/session-tracker/AGENTS.md` | 19 | OK | Already forbids writing to event-tracker — no change needed |
| `sidecar/README.md` | 9, 42 | EDIT | Remove `.hivemind/event-tracker/` from line 9 and line 42 table |
| `.planning/ROADMAP.md` | 124, 130 | OK | Already documents the CP-ST-03 task — no change needed (it's the description of this phase) |

### 1F. Risk Assessment — Event-Tracker Excision

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Broken imports in non-test source files** | LOW | MEDIUM | Only `src/index.ts` line 19 actively re-exports event-tracker. All other source imports are internal to the event-tracker itself. [VERIFIED: grep across all src/*.ts files] |
| **Runtime consumers of event-tracker exports** | NONE | NONE | No runtime source (other than the event-tracker itself) imports from event-tracker. The `createSessionJourneyEventObserver` and `shouldTrackEventTrackerEvent` functions are only called from commented-out code in `plugin.ts`. [VERIFIED: grep for `from.*event-tracker` in src/] |
| **Test failures after removal** | HIGH | MEDIUM | ~10 test files reference event-tracker paths/imports. All must be updated or deleted. This is expected and the test edit table above covers every match. |
| **Plugin init failure if `.hivemind/event-tracker/` creation is attempted** | LOW | LOW | The bootstrap `TIER_1_DIRECTORIES` creates the dir but it's best-effort. Removal of the entry means it won't be created. The `SessionTracker.cleanup()` method currently calls `removeLegacyStateFiles()` which handles missing directories gracefully — removing that call is safe. |
| **Documentation drift** | LOW | LOW | Doc edits are listed in Section 1E. Phase 13 docs are historical and intentionally preserved. |

---

## TASK 2: Plugin.ts Composition Purification

### 2A. Current State

`src/plugin.ts` is 322 lines. The `HarnessControlPlane` function body (lines 64-318) is ~255 lines containing:
- 55 lines of imports (1-55)
- ~8 lines of dead commented code (46-54, 123-124, 148-161)
- ~120 lines of inline callback closures that belong in hook modules
- ~25 lines of tool registration (255-278)
- ~50 lines of dependency wiring and initialization

### 2B. Extraction Targets

| Inline Block | Lines | LOC | Target Module | Dependencies |
|-------------|-------|-----|---------------|-------------|
| **Dead commented code** (imports + consumeJourneyFact) | 46-54, 123-124, 148-161 | ~25 | DELETE | None — already dead |
| `consumeSessionEntryFact` | 125-131 | 7 | `src/hooks/observers/session-entry-consumer.ts` | `sessionEntryObserverFactory` |
| `consumeIsMainSessionFact` | 132-138 | 7 | `src/hooks/observers/session-main-consumer.ts` | `sessionIsMainObserverFactory` |
| `consumeDelegationFact` | 139-147 | 9 | `src/hooks/observers/delegation-consumer.ts` | `delegationEventObserver`, `delegationManager` |
| `consumeSessionTrackerFact` | 162-180 | 19 | `src/hooks/observers/session-tracker-consumer.ts` | `sessionTracker`, `client` (for logging) |
| `tool.execute.before` handler | 194-235 | 41 | `src/hooks/transforms/tool-before-guard.ts` | `toolGuardHooks`, `sessionTracker`, `client` |
| `chat.message` handler | 238-254 | 16 | KEEP INLINE | Already thin; just delegates to `sessionTracker.handleChatMessage` |
| `tool.execute.after` handler | 281-318 | 37 | `src/hooks/transforms/tool-after-capture.ts` | `createToolExecuteAfterHook`, `sessionTracker`, workflow persistence |

### 2C. Proposed Module Structure After Extraction

```
src/hooks/
├── lifecycle/
│   ├── core-hooks.ts
│   └── session-hooks.ts
├── guards/
│   └── tool-guard-hooks.ts
├── observers/
│   ├── event-observers.ts           ← keep (SessionJourneyEventFact removed)
│   ├── session-entry-consumer.ts     ← NEW: consumeSessionEntryFact
│   ├── session-main-consumer.ts      ← NEW: consumeIsMainSessionFact
│   ├── delegation-consumer.ts        ← NEW: consumeDelegationFact
│   └── session-tracker-consumer.ts   ← NEW: consumeSessionTrackerFact
├── transforms/
│   ├── tool-after-composer.ts        ← existing
│   ├── tool-before-guard.ts          ← NEW: tool.execute.before handler
│   └── tool-after-capture.ts         ← NEW: tool.execute.after handler
└── types.ts                          ← existing
```

### 2D. Plugin.ts After Extraction (Estimated)

```typescript
// plugin.ts — after purification (~180-200 LOC)
// 55 lines of imports (reduced by 4 commented imports)
// ~45 lines of dependency initialization (unchanged)
// ~25 lines of tool registration (unchanged)
// ~15 lines of inline consumers (factories called, results used)
// ~40 lines of hook wiring (spread-merging, eventObservers array)
// → ~180-200 LOC total
```

To reach < 150 LOC: Extract tool registration into `src/hooks/tool-registry.ts` (factory returning `{ tool: {...} }`). This would drop ~25 LOC from plugin.ts → ~155-175 LOC.

### 2E. Risk Assessment — Plugin.ts Purification

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Breaking hook signature compatibility** | MEDIUM | HIGH | Each extracted factory must return the EXACT same function signature that `eventObservers` and hook surfaces expect. Type-check before completing. |
| **Dependency injection getting lost** | MEDIUM | HIGH | Inline closures capture `sessionTracker`, `delegationManager`, `client`, etc. by closure. Extraction means these must be passed as factory parameters. |
| **Test breakage from changed module paths** | LOW | LOW | Tests mock plugin.ts directly; extraction changes imports but not behavior. No test asserts that inline closures live in plugin.ts. |
| **Circular dependency risk** | LOW | MEDIUM | New hook modules may import from `src/shared/` or `src/features/session-tracker/`. Must not import from `src/plugin.ts` or create circular chains. [ASSUMED] |
| **chat.message stays inline** | NONE | NONE | Intentional — it's 3 lines of actual logic + error handling. Extracting would add boilerplate without clarity gain. |

---

## Runtime State Inventory

> CP-ST-03 involves removing a legacy runtime state directory. This inventory covers what's stored there.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data** | `.hivemind/event-tracker/ses_*.{json,md}` — legacy session journey files. The session-tracker's `cleanup()` method already removes these. | After source removal, these files will accumulate if not cleaned. **Recommendation:** Keep a one-time cleanup call on plugin init that deletes `.hivemind/event-tracker/` contents (not the source dir). |
| **Live service config** | None — verified by grep of src/ and config files | No action needed |
| **OS-registered state** | None — no OS-level registrations reference event-tracker | No action needed |
| **Secrets/env vars** | None — no env vars or secrets reference event-tracker | No action needed |
| **Build artifacts** | None — event-tracker is TypeScript source only, not a build artifact | No action needed |

**Nothing found in category:** Documented explicitly above. The only runtime concern is `.hivemind/event-tracker/` on users' filesystems — which the session-tracker already attempts to clean.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Update `src/index.ts` Exports

**What goes wrong:** After deleting `src/task-management/journal/event-tracker/`, `npm run typecheck` fails with "Cannot find module" because `src/index.ts` line 19 still re-exports it.

**Why it happens:** The event-tracker is deeply embedded in the public API barrel export.

**How to avoid:** Delete line 19 FIRST, then run `npm run typecheck` before deleting source files. This catches all downstream import breakages.

**Warning signs:** `error TS2307: Cannot find module './task-management/journal/event-tracker/index.js'`

### Pitfall 2: Leaving Orphaned `.hivemind/event-tracker/` on User Filesystems

**What goes wrong:** Users who ran previous versions of the harness will have `.hivemind/event-tracker/ses_*.json` and `.md` files on disk. After CP-ST-03, no code removes them.

**Why it happens:** The `removeLegacyStateFiles()` method in `SessionTracker` is being deleted as part of Task 1C.

**How to avoid:** Replace the deleted `removeLegacyStateFiles()` with a simpler, one-shot `cleanLegacyEventTrackerDir()` method that runs once on plugin init and marks completion so it doesn't re-run. Or keep a minimal cleanup that removes `.hivemind/event-tracker/` recursively.

### Pitfall 3: Sidecar Breaking After CANONICAL_PREFIXES Change

**What goes wrong:** The sidecar's `isCanonicalStatePath()` function uses `CANONICAL_PREFIXES` to determine which directories are readable. Removing `.hivemind/event-tracker` means the sidecar can no longer read from that path — but since the path is now dead, this is correct behavior.

**Why it happens:** If any sidecar code (deferred to SIDECAR-01/02) references `.hivemind/event-tracker/`, it will break.

**How to avoid:** Verify no sidecar code references event-tracker before removing the prefix. [VERIFIED: sidecar/README.md and tests/sidecar/ only — both updated in this phase]

### Pitfall 4: plugin.ts < 150 LOC Target May Be Unrealistic

**What goes wrong:** Even after extracting all 6 inline callbacks, plugin.ts stays at ~180-200 LOC due to imports, dependency wiring, and tool registration.

**Why it happens:** The ROADMAP.md target (< 150 LOC) was set before the full extraction map was calculated. The file needs imports (~55 LOC), initialization (~45 LOC), tool registration (~25 LOC), and hook assembly (~40 LOC) — these are the minimum for a composition root.

**How to avoid:** Accept ~180 LOC as the realistic target. If < 150 is required, extract tool registration into `src/hooks/tool-registry.ts` (creates a factory that returns the `tool: {...}` object). This would add a file but reduce plugin.ts by ~25 LOC.

---

## Code Examples

### Example 1: Extracting consumeSessionTrackerFact

```typescript
// src/hooks/observers/session-tracker-consumer.ts
import { getEventSessionID } from "../../shared/session-api.js"
import type { SessionTracker } from "../../features/session-tracker/index.js"

export interface SessionTrackerConsumerDeps {
  sessionTracker: SessionTracker
  logWarn?: (msg: string, extra: unknown) => void
}

/**
 * Creates an event observer that routes lifecycle events to the session tracker.
 * Best-effort — never blocks the OpenCode runtime.
 */
export function createSessionTrackerConsumer(
  deps: SessionTrackerConsumerDeps,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      const ev = event as Record<string, unknown> | undefined
      const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
      const sessionID = getEventSessionID(ev) || ""
      if (sessionID) {
        await deps.sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
      }
    } catch (err) {
      deps.logWarn?.("[Harness] Session tracker event observer failed", err)
    }
  }
}
```

### Example 2: Updated plugin.ts After Extraction

```typescript
// In plugin.ts after extraction (relevant section only):
import { createSessionTrackerConsumer } from "./hooks/observers/session-tracker-consumer.js"
import { createDelegationConsumer } from "./hooks/observers/delegation-consumer.js"
// ... other imports

export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  // ... initialization (unchanged) ...

  // Hook factory instantiation
  const consumeSessionTrackerFact = createSessionTrackerConsumer({
    sessionTracker,
    logWarn: (msg, err) => {
      void client.app?.log?.({
        body: { service: "session-tracker", level: "warn", message: msg, extra: { error: String(err) } },
      })
    },
  })

  const consumeDelegationFact = createDelegationConsumer({
    delegationEventObserver,
    delegationManager,
  })

  // ... tool registration (unchanged) ...

  return {
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact],
    }),
    // ... other hooks ...
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dual event-tracker/session-tracker capture | Single session-tracker capture | Phase 13 (F-09) — consumeJourneyFact removed from observers | No double-writes; one canonical persistence path |
| Event-tracker JSON/MD dual persistence | Session-tracker atomic JSON write | CP-ST-01 (complete) | Better reliability, no markdown sync issues |
| `.hivemind/event-tracker/` state directory | `.hivemind/session-tracker/` (canonical) | CP-ST-01 (complete) | Single source of truth for session data |
| Inline hook callbacks in plugin.ts | Extracted hook modules | CP-ST-03 (this phase) | Cleaner composition, testable in isolation |

**Deprecated/outdated:**
- `createSessionJourneyEventObserver` — removed in this phase (was only used by consumeJourneyFact, which was commented out in Phase 13)
- `SessionJourneyEventFact` type — unused since F-09
- `shouldTrackEventTrackerEvent` — only referenced from within event-tracker source (deleted)
- `.hivemind/event-tracker/` directory — replaced by `.hivemind/session-tracker/`

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No external consumers import from event-tracker barrel export (`src/task-management/journal/event-tracker/index.js`) | 1F Risk | TypeScript compilation failure if any file outside tests imports from it. Mitigation: run `npm run typecheck` after removing export but before deleting files. |
| A2 | The `createSessionJourneyEventObserver` function is only referenced in comments and tests | 2B Extraction | If any non-commented runtime code calls it, removal breaks runtime. [VERIFIED by grep: only references are in event-observers.ts (definition), plugin.ts (commented), and event-tracker source (internal)] |
| A3 | Extracting inline callbacks to separate modules does not create circular dependencies | 2E Risk | If a new module imports from plugin.ts or from a module that imports plugin.ts, we create a cycle. Mitigation: verify dependency graph before extraction. |
| A4 | The ROADMAP.md < 150 LOC target is aspirational, not blocking | 2D Plugin.ts After | If < 150 is a hard requirement, additional extraction (tool registry) is needed. The current estimate is 180-200 LOC. |

---

## Open Questions

1. **Should we keep a one-time `.hivemind/event-tracker/` cleanup on plugin init?**
   - What we know: The `removeLegacyStateFiles()` method currently does this. Removing it completely means stale files accumulate on user filesystems.
   - What's unclear: Whether the session-tracker's `cleanup()` should retain a migration path.
   - Recommendation: Keep a simplified version. Replace `removeLegacyStateFiles()` with a one-shot cleanup that runs once, deletes the entire `.hivemind/event-tracker/` directory recursively, and sets a flag to never run again.

2. **Is the < 150 LOC target for plugin.ts a hard requirement or aspirational?**
   - What we know: ROADMAP.md line 130 says "plugin.ts → pure composition (< 150 LOC)".
   - What's unclear: Whether the target includes import statements.
   - Recommendation: Realistic target after extraction is ~180 LOC. If < 150 is hard, extract tool registration into a separate factory. This should be confirmed in the discuss phase.

3. **Does the sidecar test need a migration for CANONICAL_PREFIXES removal?**
   - What we know: The test creates a `.hivemind/event-tracker/` directory and tests path recognition.
   - What's unclear: Whether SIDECAR-01/02 phases depend on that path being in CANONICAL_PREFIXES.
   - Recommendation: Remove the test assertion. Sidecar has no `.hivemind/event-tracker/` data to read — the session-tracker replaced it.

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies identified. This phase involves only code changes (deletion + extraction), no new tools, services, or runtimes.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project-standard) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run tests/lib/event-tracker/` (for verifying removal) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DETOX-01 | No event-tracker source files remain in src/ | unit | `ls src/task-management/journal/event-tracker/ 2>/dev/null && echo "FAIL" \|\| echo "PASS"` | N/A (deletion check) |
| DETOX-02 | `npm run typecheck` passes after event-tracker removal | typecheck | `npm run typecheck` | N/A (project-level) |
| DETOX-03 | No event-tracker exports from `src/index.ts` | grep | `grep "event-tracker" src/index.ts \|\| echo "PASS"` | N/A (text search) |
| DETOX-04 | Plugin.ts is ≤ 200 LOC after extraction | wc | `wc -l src/plugin.ts` | N/A (filesystem check) |
| DETOX-05 | Extracted hook modules pass their existing tests | unit | `npx vitest run tests/hooks/` | ✅ (may need path updates) |
| DETOX-06 | Session-tracker tests still pass | integration | `npx vitest run tests/features/session-tracker/` | ✅ (after removing legacy cleanup tests) |
| DETOX-07 | Full test suite passes (minus deleted event-tracker tests) | suite | `npm test` | ✅ (after test file deletions) |

### Wave 0 Gaps
- [ ] `tests/hooks/observers/session-tracker-consumer.test.ts` — unit test for extracted consumer (new file)
- [ ] `tests/hooks/observers/delegation-consumer.test.ts` — unit test for extracted consumer (new file)
- [ ] `tests/hooks/observers/session-entry-consumer.test.ts` — unit test for extracted consumer (new file)
- [ ] `tests/hooks/observers/session-main-consumer.test.ts` — unit test for extracted consumer (new file)
- [ ] `tests/hooks/transforms/tool-before-guard.test.ts` — unit test for extracted guard (new file)
- [ ] `tests/hooks/transforms/tool-after-capture.test.ts` — unit test for extracted capture (new file)
- [ ] Remove `tests/lib/event-tracker/` — 10 test files (deletion)

*(Wave 0 gap exceptions: The extraction itself is the testable change — extracted modules should have basic unit tests proving they wire correctly)*

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (no auth changes) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes (minor) | Extracted hook modules should validate input types before processing; current pattern uses `as Record<string, unknown>` casts |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for TypeScript Plugin Refactoring

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Broken try/catch causing unhandled promise rejections | Denial of Service | Preserve existing try/catch patterns in extracted callbacks |
| Type narrowing loss during extraction | Tampering | Maintain `as Record<string, unknown>` casts; add Zod validation if needed |
| Circular import after extraction | Denial of Service | Verify dependency graph before and after extraction |

---

## Sources

### Primary (HIGH confidence)
- `src/plugin.ts` — live file read, confirmed 322 LOC with inline callbacks at identified line ranges
- `src/index.ts` — live file read, confirmed line 19 is the only active event-tracker export
- `src/hooks/observers/event-observers.ts` — live file read, confirmed `createSessionJourneyEventObserver` at lines 45-51
- `src/features/session-tracker/index.ts` — live file read, confirmed `removeLegacyStateFiles()` at lines 985-1018
- `src/sidecar/readonly-state.ts` — live file read, confirmed `CANONICAL_PREFIXES` at line 34
- `src/features/bootstrap/structure.ts` — live file read, confirmed `"event-tracker"` in `TIER_1_DIRECTORIES` at line 58
- Glob + grep scan of all `src/**/*.ts` files — verified only 1 active import of event-tracker (src/index.ts line 19)

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` lines 124-130 — confirmed CP-ST-03 READY status and target description
- `.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-CONTEXT.md` — confirmed F-09 deprecation and REQ-ST-13 safety net
- `src/task-management/journal/AGENTS.md` — confirmed documented event-tracker purpose and structure

### Tertiary (LOW confidence)
- [ASSUMED] No external consumers import from event-tracker barrel — verified via grep but market/production environments may differ
- [ASSUMED] Extraction does not create circular dependencies — graph not yet built

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies needed; project stack confirmed via package.json
- Architecture: HIGH — patterns verified against live codebase
- Pitfalls: MEDIUM — 4 pitfalls identified from codebase patterns, but extraction-side risks are partially assumed
- Event-tracker inventory: HIGH — complete grep of all source and test files; every reference mapped

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (30 days — stable refactoring domain)

**File inventory verified by:**
- `glob("src/task-management/journal/event-tracker/**/*")` → 12 files
- `glob("tests/lib/event-tracker/**/*")` → 10 files
- `grep("event-tracker", src/**/*.ts)` → 47 matches, all mapped
- `grep("event-tracker", tests/**/*.ts)` → 157 matches, all mapped
