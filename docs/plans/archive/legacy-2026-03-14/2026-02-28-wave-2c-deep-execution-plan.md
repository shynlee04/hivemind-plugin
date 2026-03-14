# Deep Wave 2C: Auto-Session Foundation — Execution Plan

> **Date**: 2026-02-28
> **Wave**: 2C (expanded scope per user authorization)
> **Parent Plan**: `docs/plans/2026-02-27-hybrid-ab-master-plan.md`
> **Branch**: v-2.9-harness-dev
> **Baseline**: 215/215 tests, 0 tsc errors, 0 FAIL framework validation
> **Estimated New Code**: ~800-1000 lines (across 3 new files + 3 modified files)
> **Estimated New Tests**: ~200-250 lines (4 new test files)

---

## Executive Summary

This plan implements the **auto-session foundation** — the #1 unbuilt mechanism per SYSTEM-DIRECTIVES §3A. It builds 4 interconnected engines:

1. **Session Intent Classifier** — classify sessions into 6 purpose categories automatically
2. **Planning Materializer** — convert live session state (trajectory, anchors, mems) into persistent SOT files (PROJECT.md, STATE.md, ROADMAP.md)
3. **Event Consumer Wiring** — connect the well-built event bus to actual handlers (currently emitting into void)
4. **Compaction→STATE.md Bridge** — materialize state before compaction so decisions survive session boundaries

These 4 engines together close **GAP-5** (Auto-Session + Context Lifecycle) from the master plan, raising its score from 2.4/10 to ~6/10.

---

## Prerequisites (Already Complete)

| Prerequisite | Status | Evidence |
|---|---|---|
| `.hivemind/project/planning/` directory exists | ✅ | Wave 1B created dir + templates |
| `src/schemas/planning.ts` Zod schemas exist | ✅ | PlanningStateSchema, RequirementSchema, etc. |
| `src/lib/event-bus.ts` singleton exists | ✅ | EventEmitter with 12 event types |
| `src/schemas/events.ts` event Zod schemas exist | ✅ | 14 event type schemas |
| `src/lib/session-memory-classifier.ts` keyword classifier exists | ✅ | 7-category artifact classifier (103 lines) |
| `src/lib/fs/planning-ops.ts` template infrastructure exists | ✅ | Templates + directory bootstrap (455 lines) |
| `src/hooks/event-handler.ts` catches `session.created` | ✅ | Line 181 — currently ONLY logs |
| `src/hooks/compaction.ts` fires post-compaction | ✅ | Injects context (246 lines) |

---

## Knot Dependency Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                        EXECUTION WAVES                           │
│                                                                  │
│  ╔═══════════════════════════════════════════════════════╗       │
│  ║  Wave α (parallel — no interdependencies)            ║       │
│  ║                                                       ║       │
│  ║  Knot 2C.1: Session Intent Classifier (NEW lib)      ║       │
│  ║  Knot 2C.2: Planning Materializer (NEW lib)          ║       │
│  ║  Knot 2C.3: Event Consumer Registry (NEW lib)        ║       │
│  ╚═══════════════════════════╦═══════════════════════════╝       │
│                              │                                   │
│  ╔═══════════════════════════▼═══════════════════════════╗       │
│  ║  Wave β (depends on α — wiring into existing hooks)  ║       │
│  ║                                                       ║       │
│  ║  Knot 2C.4: Compaction→STATE.md Bridge               ║       │
│  ║             (uses 2C.2 materializer)                  ║       │
│  ║  Knot 2C.5: Event Handler Enhancement                ║       │
│  ║             (uses 2C.1 classifier + 2C.3 consumers)  ║       │
│  ╚═══════════════════════════╦═══════════════════════════╝       │
│                              │                                   │
│  ╔═══════════════════════════▼═══════════════════════════╗       │
│  ║  Wave γ (depends on α+β — verification)              ║       │
│  ║                                                       ║       │
│  ║  Knot 2C.6: Tests + Verification Gate                ║       │
│  ╚═══════════════════════════════════════════════════════╝       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Knot 2C.1: Session Intent Classifier

**Status**: NEW file
**File**: `src/lib/session-intent-classifier.ts` (~120 lines)
**Agent**: hivemaker
**Dependencies**: None (parallel-safe)

### Purpose

Classify a session's purpose automatically using trajectory state, hierarchy, mode, and keyword signals. This is the **session-level** classifier (distinct from `session-memory-classifier.ts` which classifies individual memory artifacts).

### Design

```typescript
// 6 session intent categories (maps to SYSTEM-DIRECTIVES §4B)
type SessionIntentCategory =
  | "discovery"    // brainstorming, ideation, exploration
  | "research"     // synthesis, comparison, evaluation
  | "planning"     // roadmap, task breakdown, architecture decisions
  | "implementing" // coding, patching, wiring
  | "debug"        // bug hunting, root cause analysis
  | "testing"      // verification, gatekeeping, validation

interface SessionIntentClassification {
  intent: SessionIntentCategory
  confidence: number           // 0.0 - 1.0
  reasons: string[]            // audit trail
  recommended_mode: "plan_driven" | "quick_fix" | "exploration"
  recommended_output_style: number  // 1-4 per SYSTEM-DIRECTIVES §3B
}

function classifySessionIntent(params: {
  trajectoryIntent?: string    // from trajectory.json
  hierarchyLevel?: string      // trajectory | tactic | action
  mode?: string                // plan_driven | quick_fix | exploration
  focusContent?: string        // user's declared focus
  recentAnchors?: string[]     // anchor values for signal
}): SessionIntentClassification
```

### Keyword Strategy

Adapts `session-memory-classifier.ts` approach but with session-level keywords:

| Category | Keywords | Mode Signal | Output Style |
|---|---|---|---|
| discovery | brainstorm, ideate, explore, options, compare | exploration | 1 (Supportive) |
| research | research, analyze, evaluate, benchmark, survey | exploration | 1 (Supportive) |
| planning | plan, roadmap, milestone, phase, architecture, design | plan_driven | 2 (Architecture) |
| implementing | implement, build, wire, create, refactor, add | plan_driven | 4 (Execution) |
| debug | debug, fix, error, failure, broken, root cause | quick_fix | 3 (Problem Solving) |
| testing | test, verify, validate, gate, assert, regression | plan_driven | 3 (Problem Solving) |

### Acceptance Criteria

- [ ] Classifies all 6 categories with keyword matching + tool/mode signals
- [ ] Returns confidence 0.0-1.0 based on signal strength
- [ ] Returns recommended_mode and recommended_output_style
- [ ] Falls back to "planning" with 0.2 confidence when no signals match
- [ ] Pure function — no side effects, no file I/O
- [ ] Exported from `src/lib/index.ts`

### Constraints

- MUST NOT import from hooks/ (lib is subconscious layer)
- MUST NOT perform file I/O (caller provides inputs)
- MUST NOT exceed 150 lines
- MUST export types for use by event-handler.ts

---

## Knot 2C.2: Planning Materializer

**Status**: NEW file
**File**: `src/lib/planning-materializer.ts` (~250 lines)
**Agent**: hivemaker
**Dependencies**: None (parallel-safe)

### Purpose

Convert live session state into persistent SOT planning files. This is the "auto-parsed-into mechanism" described in SYSTEM-DIRECTIVES §1 as "game-changing-and-measurable-factor".

### Design

```typescript
interface MaterializationResult {
  file: string                // relative path within .hivemind/project/planning/
  action: "created" | "updated" | "unchanged"
  linesWritten: number
}

// Core materializer functions:

async function materializeProjectMd(
  directory: string,
  params: {
    trajectoryIntent?: string
    currentPosition?: string
    scope?: string
    keyDecisions?: string[]
  }
): Promise<MaterializationResult>

async function materializeStateMd(
  directory: string,
  params: {
    currentPosition?: string
    activeBlockers?: string[]
    recentDecisions?: Array<{ decision: string; date: string; session_id?: string }>
    sessionEntry?: { session_id: string; summary: string; date: string }
  }
): Promise<MaterializationResult>

async function materializeRoadmapMd(
  directory: string,
  params: {
    phases?: Array<{ number: number; name: string; status: string; progress: number }>
  }
): Promise<MaterializationResult>

// Composite: materialize all from brain state
async function materializeFromSessionState(
  directory: string,
  params: {
    sessionId: string
    summary: string
    trajectoryIntent?: string
    anchors?: Array<{ key: string; value: string }>
    hierarchy?: { trajectory?: string; tactic?: string; action?: string }
  }
): Promise<MaterializationResult[]>
```

### File Writing Strategy

**Critical**: Does NOT overwrite user content. Uses **section-append** strategy:

1. **PROJECT.md**: Only updates if `<!-- hivemind-auto -->` marker not found, or appends to `## Key Decisions` section
2. **STATE.md**: Appends to `## Session History` section, updates `## Current Position`, iterates `## Recent Decisions`
3. **ROADMAP.md**: Updates phase table rows (merge by phase number)

Each write uses `readFile → parse sections → merge/append → writeFile` pattern (NOT full overwrite).

### Data Sources

| SOT File | Data Source | Brain Entity |
|---|---|---|
| PROJECT.md | `trajectory.intent` | TrajectoryState.intent |
| STATE.md `Current Position` | `hierarchy.trajectory + tactic` | BrainState.hierarchy |
| STATE.md `Active Blockers` | anchors with "blocker" tag | AnchorsState |
| STATE.md `Recent Decisions` | anchors with "decision" pattern | AnchorsState |
| STATE.md `Session History` | compact_session summary | closeSession() args |
| ROADMAP.md | hierarchy tree phases | HierarchyTree nodes |

### Acceptance Criteria

- [ ] `materializeStateMd` appends session entry without destroying existing content
- [ ] `materializeProjectMd` sets trajectory intent as project purpose
- [ ] `materializeFromSessionState` composes all three
- [ ] Section-append strategy: never overwrites user-authored content
- [ ] Uses `getEffectivePaths()` for all path resolution
- [ ] Handles missing `.hivemind/project/planning/` gracefully (creates via `initializePlanningProjectDir`)
- [ ] Exported from `src/lib/index.ts`

### Constraints

- MUST use `src/lib/paths.ts` getEffectivePaths() for paths
- MUST use `src/lib/fs/planning-ops.ts` initializePlanningProjectDir() for directory bootstrap
- MUST NOT exceed 300 lines
- MUST handle concurrent write safety (read-merge-write, not blind overwrite)

---

## Knot 2C.3: Event Consumer Registry

**Status**: NEW file
**File**: `src/lib/event-consumers.ts` (~100 lines)
**Agent**: hivemaker
**Dependencies**: None (parallel-safe)

### Purpose

Register actual consumers for the event bus. Currently, `event-bus.ts` emits into void — 0 consumers registered. This knot wires handlers for key event types.

### Design

```typescript
import { eventBus } from "./event-bus.js"
import type { Unsubscribe } from "./event-bus.js"

interface ConsumerRegistry {
  unsubscribers: Unsubscribe[]
  registered: boolean
}

// Register all consumers — called once on plugin activation
function registerEventConsumers(directory: string): ConsumerRegistry

// Cleanup — called on plugin deactivation
function unregisterEventConsumers(registry: ConsumerRegistry): void
```

### Consumers to Wire

| Event Type | Consumer Action | Side Effect |
|---|---|---|
| `memory:classified` | Log classification stats | Updates brain.metrics via queueStateMutation |
| `context:consolidated` | Track consolidation count | Updates brain.memory_governance |
| `context:purged` | Track purge count | Updates brain.memory_governance |
| `pending_change:verified` | Log verification completion | None (informational) |

### Acceptance Criteria

- [ ] `registerEventConsumers()` subscribes to 4+ event types
- [ ] `unregisterEventConsumers()` cleanly unsubscribes all
- [ ] All consumers use `queueStateMutation` for state writes (CQRS compliant)
- [ ] No consumer throws — all wrapped in try/catch
- [ ] Exported from `src/lib/index.ts`

### Constraints

- MUST follow CQRS: consumers queue mutations, never direct-save
- MUST be idempotent — calling registerEventConsumers twice doesn't double-subscribe
- MUST NOT exceed 120 lines

---

## Knot 2C.4: Compaction→STATE.md Bridge

**Status**: MODIFY existing files
**Files**:
  - `src/tools/hivemind-session.ts` (modify `close` action, ~15 lines added)
  - `src/hooks/compaction.ts` (add materialization call, ~10 lines added)
**Agent**: hivemaker
**Dependencies**: Knot 2C.2 (planning-materializer)

### Purpose

When `compact_session` runs, materialize current anchors/decisions/trajectory into STATE.md **before** the session closes. This is the bridge that makes session intelligence survive compaction.

### Design Changes

#### `src/tools/hivemind-session.ts` — close action (around line 306-331)

```typescript
// BEFORE closeSession(), add materialization:
case "close": {
  // ... existing strict_gate check ...
  // ... existing auto-purge ...

  // NEW: Materialize session state to planning SOT before close
  try {
    const preCloseState = await stateManager.load()
    if (preCloseState) {
      const anchorsState = await loadAnchors(directory)
      await materializeFromSessionState(directory, {
        sessionId: preCloseState.session.id,
        summary: args.summary || "Session closed",
        trajectoryIntent: preCloseState.hierarchy.trajectory || undefined,
        anchors: anchorsState.anchors,
        hierarchy: preCloseState.hierarchy,
      })
    }
  } catch (err) {
    // P3: Never block close on materialization failure
    // Log but don't fail
  }

  result = await closeSession(directory, args.summary)
  // ... existing syncTrajectoryToGraph ...
}
```

#### `src/hooks/compaction.ts` — after context injection (around line 234)

```typescript
// NEW: After injecting compaction context, also update STATE.md
try {
  await materializeStateMd(directory, {
    currentPosition: state.hierarchy.trajectory || state.hierarchy.tactic || "",
    sessionEntry: {
      session_id: state.session.id,
      summary: `Compaction #${state.compaction_count ?? 0 + 1}`,
      date: new Date().toISOString().split("T")[0],
    },
  })
} catch {
  // P3: Never break compaction for materialization
}
```

### Acceptance Criteria

- [ ] `compact_session` materializes state BEFORE session close
- [ ] Compaction hook updates STATE.md with compaction entry
- [ ] Materialization failure does NOT block close or compaction (P3 try/catch)
- [ ] STATE.md is readable and valid after materialization
- [ ] No regression on existing 215 tests

### Constraints

- MUST wrap all materialization in try/catch (P3: never break close/compaction)
- MUST NOT add more than 30 lines to either file
- MUST import materializer from `../lib/planning-materializer.js`

---

## Knot 2C.5: Event Handler Enhancement

**Status**: MODIFY existing file
**File**: `src/hooks/event-handler.ts` (modify `session.created` case, ~20 lines added)
**Agent**: hivemaker
**Dependencies**: Knot 2C.1 (session-intent-classifier), Knot 2C.3 (event-consumers)

### Purpose

Wire `session.created` event to the session intent classifier. Currently line 181 only logs the event. After this knot, it also classifies the session intent and emits a `memory:classified` event.

### Design Changes

#### `src/hooks/event-handler.ts` — session.created case (line 180-182)

```typescript
case "session.created": {
  const sessionInfo = (event as EventSessionCreated).properties.info
  await log.info(`[event] session.created: ${sessionInfo.id}`)

  // NEW: Classify session intent from available signals
  try {
    const classification = classifySessionIntent({
      mode: state?.session.mode,
      focusContent: state?.hierarchy.trajectory || state?.hierarchy.tactic,
      hierarchyLevel: state?.hierarchy.action ? "action"
        : state?.hierarchy.tactic ? "tactic"
        : state?.hierarchy.trajectory ? "trajectory"
        : undefined,
    })

    await log.debug(
      `[event] session.created: classified intent=${classification.intent} ` +
      `confidence=${classification.confidence} style=${classification.recommended_output_style}`
    )

    // Emit classification event for consumers
    eventBus.emitEvent(createEvent("memory:classified", {
      category: classification.intent,
      confidence: classification.confidence,
      sessionId: sessionInfo.id,
    }, "session-intent-classifier"))

    // Queue state mutation with classification result
    if (state) {
      queueStateMutation({
        type: "UPDATE_STATE",
        payload: {
          session_intent: {
            category: classification.intent,
            confidence: classification.confidence,
            recommended_output_style: classification.recommended_output_style,
            classified_at: new Date().toISOString(),
          },
        },
        source: "event-handler.session.created:intent-classified",
      })
    }
  } catch (err) {
    await log.debug(`[event] session.created: classification failed: ${err}`)
  }
  break
}
```

### New Imports (event-handler.ts)

```typescript
import { classifySessionIntent } from "../lib/session-intent-classifier.js"
import { eventBus, createEvent } from "../lib/event-bus.js"
```

### Brain State Schema Extension

Add `session_intent` field to `BrainStateSchema` in `src/schemas/brain-state.ts`:

```typescript
session_intent: z.object({
  category: z.string(),
  confidence: z.number(),
  recommended_output_style: z.number(),
  classified_at: z.string(),
}).optional(),
```

### Acceptance Criteria

- [ ] `session.created` triggers intent classification
- [ ] Classification result stored in brain state via queueStateMutation
- [ ] `memory:classified` event emitted on event bus
- [ ] Classification failure does NOT break event handling (try/catch)
- [ ] Brain state schema extended with `session_intent` optional field
- [ ] No regression on existing 215 tests

### Constraints

- MUST use queueStateMutation (CQRS compliant — hooks are read-auto, not write)
- MUST wrap classification in try/catch (P3: never break event handling)
- MUST NOT modify event-handler.ts beyond the session.created case + imports
- session_intent field MUST be optional (backward compatible)

---

## Knot 2C.6: Tests + Verification Gate

**Status**: NEW files + verification
**Files**:
  - `tests/session-intent-classifier.test.ts` (~80 lines)
  - `tests/planning-materializer.test.ts` (~100 lines)
  - `tests/event-consumers.test.ts` (~40 lines)
  - `tests/compaction-state-bridge.test.ts` (~50 lines)
**Agent**: hivemaker
**Dependencies**: Knots 2C.1-2C.5

### Test Coverage Matrix

| Test File | Tests | What's Verified |
|---|---|---|
| session-intent-classifier.test.ts | 8-10 | All 6 categories, fallback, confidence scoring, pure function |
| planning-materializer.test.ts | 8-10 | PROJECT.md creation, STATE.md append, ROADMAP.md update, section-append safety, missing dir handling |
| event-consumers.test.ts | 4-5 | Registration, unregistration, idempotency, error resilience |
| compaction-state-bridge.test.ts | 4-5 | STATE.md updated on compact, P3 failure safety, content survives |

### Verification Gate Commands

```bash
# MUST ALL PASS before Wave 2C is considered complete:
npx tsc --noEmit                                    # 0 errors
npm test                                            # 215+ tests, 0 failures
bash .opencode/skills/hivemind-framework-auditor/scripts/structural-audit.sh   # No new FAILs
```

### Acceptance Criteria

- [ ] 24+ new tests across 4 test files
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm test` passes with 0 failures (215+ total, was 215)
- [ ] No regression on any existing test
- [ ] Framework structural audit: no new FAIL items

---

## File Surface Summary

### New Files (3)

| File | Lines | Knot |
|---|---|---|
| `src/lib/session-intent-classifier.ts` | ~120 | 2C.1 |
| `src/lib/planning-materializer.ts` | ~250 | 2C.2 |
| `src/lib/event-consumers.ts` | ~100 | 2C.3 |

### Modified Files (4)

| File | Lines Added | Knot |
|---|---|---|
| `src/tools/hivemind-session.ts` | ~15 | 2C.4 |
| `src/hooks/compaction.ts` | ~10 | 2C.4 |
| `src/hooks/event-handler.ts` | ~25 | 2C.5 |
| `src/schemas/brain-state.ts` | ~6 | 2C.5 |

### New Test Files (4)

| File | Tests | Knot |
|---|---|---|
| `tests/session-intent-classifier.test.ts` | ~10 | 2C.6 |
| `tests/planning-materializer.test.ts` | ~10 | 2C.6 |
| `tests/event-consumers.test.ts` | ~5 | 2C.6 |
| `tests/compaction-state-bridge.test.ts` | ~5 | 2C.6 |

### Untouched Files (must not regress)

- `src/lib/session-memory-classifier.ts` — existing artifact classifier stays intact
- `src/lib/event-bus.ts` — no modifications, just consumed
- `src/schemas/events.ts` — no modifications, event types sufficient
- `src/lib/fs/planning-ops.ts` — templates stay, materializer builds on top
- `src/schemas/planning.ts` — schemas stay, materializer uses them

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| STATE.md content corruption on concurrent writes | MEDIUM | HIGH | Read-merge-write pattern, not blind overwrite |
| Brain state schema change breaks existing state | LOW | HIGH | `session_intent` is optional field with `.optional()` |
| Materialization slows down compact_session | LOW | MEDIUM | P3 try/catch + async, failure doesn't block |
| Event consumer memory leak | LOW | MEDIUM | Unsubscribe registry, cleanup on deactivation |
| Classifier false positives | MEDIUM | LOW | Default fallback + confidence scoring |

---

## Execution Protocol

1. **Wave α**: Delegate Knots 2C.1 + 2C.2 + 2C.3 in parallel (3 hivemaker agents)
2. **Checkpoint α**: Verify all 3 new files compile (`npx tsc --noEmit`)
3. **Wave β**: Delegate Knots 2C.4 + 2C.5 in parallel (2 hivemaker agents)
4. **Checkpoint β**: Verify no regressions (`npm test`)
5. **Wave γ**: Delegate Knot 2C.6 (1 hivemaker agent for tests)
6. **Final Gate**: Full verification (`npm test` + `tsc` + structural audit)
7. **Update master plan**: Mark Wave 2C complete, update scores

---

## Decision Locks

1. Session intent classifier is a PURE FUNCTION — no file I/O, no side effects
2. Planning materializer uses SECTION-APPEND — never overwrites user content
3. All event consumers use CQRS queueStateMutation — no direct state writes
4. All hook modifications wrapped in P3 try/catch — never break core flows
5. Brain state `session_intent` field is OPTIONAL — backward compatible
6. STATE.md is the ONLY planning file materialized on compaction (PROJECT.md and ROADMAP.md on explicit close only)
