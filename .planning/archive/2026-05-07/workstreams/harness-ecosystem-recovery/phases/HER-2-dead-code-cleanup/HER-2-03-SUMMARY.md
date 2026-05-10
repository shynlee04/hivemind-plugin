---
phase: HER-2
plan: 03
type: execute
wave: 3
depends_on: [HER-2-02]
status: COMPLETE
completed: 2026-05-05T14:45:45Z
requirements: [HER-2-E, HER-2-F]
key-files:
  created: []
  modified:
    - src/hooks/plugin-event-observers.ts
    - src/plugin.ts
    - src/hooks/types.ts
    - src/hooks/create-core-hooks.ts
    - src/hooks/create-session-hooks.ts
decisions:
  - "Used consumeSessionEntryFact wrapper for type compatibility with eventObservers Promise<void> signature"
  - "Moved sessionEntryObserverFactory creation before deps bundle to avoid TS2454 block-scoped var error"
  - "Constructed full KernelPacket with defaults for compaction (not just Plan fields) for type compatibility"
  - "Used continuity.metadata.delegation.* fields instead of non-existent metadata.* shortcuts"
duration:
  started: 2026-05-05T14:15:00Z
  completed: 2026-05-05T14:45:45Z
  approximate_minutes: 30
tech-stack:
  added: []
  patterns:
    - "Event observer + cached lookup for hook injection (observer → Map → hook)"
    - "Consumer pattern for typed observers with void-sinking wrappers"
---

# Phase HER-2 Plan 03: Wire session-entry/ as hooks + prompt-packet/ compaction

Wires the highest-value dead code modules (`session-entry/`, `prompt-packet/`) as runtime hooks — an event observer on `session.created` for intake classification, a `system.transform` hook for routing context injection, and compaction preservation for intake durability across context windows.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create session-entry event observer | `a2b82106` | `src/hooks/plugin-event-observers.ts`, `src/plugin.ts` |
| 2 | Wire system.transform hook with intake injection | `6bd7289c` | `src/hooks/types.ts`, `src/hooks/create-core-hooks.ts`, `src/plugin.ts` |
| 3 | Wire prompt-packet compaction-preservation into compaction hook | `7b628d92` | `src/hooks/create-session-hooks.ts` |

## Verification Results

| Check | Status |
|-------|--------|
| `npm run typecheck` | ✅ 0 errors |
| `npm run build` | ✅ Pass |
| `npm test` | ✅ 1604 passed, 2 pre-existing failures (session-journal.test.ts) |
| `grep "sessionEntryObserver\|createSessionEntryEventObserver" src/plugin.ts` | ✅ 4 matches |
| `grep "getIntake" src/plugin.ts` | ✅ 1 match |
| `grep "toCompactionPacket" src/hooks/create-session-hooks.ts` | ✅ 2 matches |
| `grep "getIntake" src/hooks/create-core-hooks.ts` | ✅ 6 matches (combined with system.transform) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Event observer return type incompatible with eventObservers array**
- **Found during:** Task 1
- **Issue:** `createSessionEntryEventObserver().observer` returns `Promise<SessionEntryEventFact>` but `eventObservers` expects `Promise<void>`
- **Fix:** Created `consumeSessionEntryFact` consumer wrapper (matches pattern of `consumeDelegationFact` and `consumeJourneyFact`)
- **Files modified:** `src/plugin.ts`
- **Commit:** `a2b82106`

**2. [Rule 1 - Bug] Block-scoped variable used before declaration (TS2448)**
- **Found during:** Task 2
- **Issue:** `sessionEntryObserverFactory` used in `deps` line 76 but created at line 81
- **Fix:** Moved `sessionEntryObserverFactory` creation to before the `deps` assignment
- **Files modified:** `src/plugin.ts`
- **Commit:** `6bd7289c`

**3. [Rule 1 - Bug] Plan kernel packet missing required KernelPacket fields**
- **Found during:** Task 3
- **Issue:** Plan's kernel packet literal omitted 18 required fields (`packet_type`, `temperature`, `tool_allow_list`, `tool_ask_list`, `scope`, etc.)
- **Fix:** Added all required KernelPacket fields with sensible defaults
- **Files modified:** `src/hooks/create-session-hooks.ts`
- **Commit:** `7b628d92`

**4. [Rule 1 - Bug] Non-existent continuity fields referenced**
- **Found during:** Task 3
- **Issue:** Plan referenced `continuity.parentSessionID`, `continuity.metadata.title`, `continuity.metadata.agentType`, etc. which don't exist on SessionContinuityRecord
- **Fix:** Used `null` for parent ID, `"unknown"` for title, `continuity.metadata.delegation?.agent` for agent type, `continuity.metadata.delegation?.rootID` for root session ID
- **Files modified:** `src/hooks/create-session-hooks.ts`
- **Commit:** `7b628d92`

## Architecture: Integration Flow

```
session.created event
  → consumeSessionEntryFact (plugin.ts wrapper)
    → createSessionEntryEventObserver().observer
      → resolveIntake(userMessage)
      → intakeCache.set(sessionId, intake)

system.transform hook
  → deps.getIntake(sessionID) → intake (from cache)
  → injects: purpose, language, routing_target, profile, warnings
  → output.system.push(intake context lines)

compaction hook
  → deps.getIntake(sessionID) → intake (from cache)
  → builds KernelPacket from intake + continuity
  → toCompactionPacket(kernel, extras)
  → output.context.push(compaction JSON)
```

## Known Stubs

None — all wired code uses guard clauses (`if (!deps.getIntake) return`) for safety when no intake is available, which is correct behavior for a runtime hook that only activates after an observer populates the cache.
