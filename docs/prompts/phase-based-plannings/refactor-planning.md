# Metrics Refactor Planning — Brain State Governance Signals

**Created**: 2026-03-04
**Status**: Validated, Ready for Implementation
**Scope**: Surgical refactor operation (whole project)

---

## Executive Summary

The brain.json metrics system has cascading bugs that poison governance signals. This plan addresses the issues systematically with **evidence-based validation** against current codebase state.

### Current State (Validated 2026-03-04)

| Component | Status | Evidence |
|-----------|--------|----------|
| `turn_count` | Counts tool calls, not turns | `soft-governance.ts:259` calls `incrementTurnCount()` on every tool call |
| `user_turn_count` | EXISTS but UNUSED in drift | `brain-state.ts:38` defined, `brain-state.ts:397` has `incrementUserTurnCount()` |
| `drift_score` | Uses `turn_count * 5` | `brain-state.ts:459` — saturates at 50 after 10 tool calls |
| `GovernanceCounters` | REDUCED to `{drift, compaction}` | `detection.ts:87-90` — Fix 1.5B already done |
| `keyword_flags` | Append-only, never reset | `detection.ts:530` — accumulates entire session |
| Zombie fields | STILL PRESENT in defaults | `brain-state.ts:307-317` — `first_turn_confirmation`, `selected_output_style_v29`, `memory_governance` |

---

## Phase 1: Fix `turn_count` Semantics (ROOT CAUSE)

### Problem
`turn_count` increments on **every tool call**, not every user turn. With 183 tool calls in a session, drift_score saturates immediately.

### Current Code Paths
```
soft-governance.ts:259 → incrementTurnCount(state) → brain-state.ts:382
  └── Called on EVERY tool.execute.after

brain-state.ts:459 → calculateDriftScore(state)
  └── Uses state.metrics.turn_count * 5 (tool calls, not user turns)

brain-state.ts:464 → shouldTriggerDriftWarning(state, maxTurns)
  └── Uses state.metrics.turn_count >= maxTurns
```

### Fix Strategy

**Option A: Semantic Rename (Recommended)**
1. Rename `turn_count` → `tool_call_count` everywhere
2. Rename `user_turn_count` → `turn_count` (semantic shift)
3. Update all consumers to use correct counter

**Option B: Dual Counter Fix**
1. Keep both counters as-is
2. Update `calculateDriftScore()` to use `user_turn_count`
3. Update `shouldTriggerDriftWarning()` to use `user_turn_count`

### Files to Modify

| File | Line | Change |
|------|------|--------|
| `src/schemas/brain-state.ts` | 36-38 | Add JSDOC clarifying semantics; consider rename |
| `src/schemas/brain-state.ts` | 459 | Change `turn_count` → `user_turn_count` |
| `src/schemas/brain-state.ts` | 468 | Change `turn_count` → `user_turn_count` |
| `src/hooks/session-lifecycle.ts` | ~93 | Check `isBootstrapActive` uses correct counter |
| `src/lib/session-boundary.ts` | ~34 | Check `estimateContextPercent` uses correct counter |
| `src/lib/session-governance.ts` | ~284 | Update drift calculations |
| `src/hooks/messages-transform.ts` | ~492 | Update context percent calculation |
| `src/tools/check-drift.ts` | ~61 | Display both counters |
| `src/tools/scan-hierarchy.ts` | ~191 | Display both counters |

### Verification
```bash
npx tsc --noEmit
npm test -- tests/soft-governance.test.ts
```

---

## Phase 2: Fix `drift_score` Formula

### Problem
Current formula: `100 - min(50, turn_count * 5) + min(20, context_updates * 2)`
- `turn_count` is tool calls → saturates at 50 after 10 tool calls
- `context_updates` can be gamed by calling `map_context` repeatedly

### Current Code
```typescript
// brain-state.ts:458-462
export function calculateDriftScore(state: BrainState): number {
  const turnsPenalty = Math.min(50, state.metrics.turn_count * 5);
  const updatesBonus = Math.min(20, state.metrics.context_updates * 2);
  return Math.max(0, Math.min(100, 100 - turnsPenalty + updatesBonus));
}
```

### Fix Strategy
```typescript
export function calculateDriftScore(state: BrainState): number {
  // Use user_turn_count (actual conversation turns), not tool_call_count
  const userTurns = state.metrics.user_turn_count;
  const lastUpdateTurn = state.metrics.last_context_update_turn ?? 0;
  const turnsSinceUpdate = userTurns - lastUpdateTurn;
  
  // Decay based on turns since last context update
  // 100 → 90 → 80 → ... → 0 over 10 turns without update
  const decayPenalty = Math.min(100, turnsSinceUpdate * 10);
  
  return Math.max(0, 100 - decayPenalty);
}
```

### New Fields Required
Add to `MetricsState`:
```typescript
last_context_update_turn: number; // user_turn_count at last context update
```

### Files to Modify
| File | Change |
|------|--------|
| `src/schemas/brain-state.ts` | Add `last_context_update_turn` field |
| `src/schemas/brain-state.ts` | Rewrite `calculateDriftScore()` |
| `src/hooks/soft-governance.ts` | Update `last_context_update_turn` when `map_context` called |

---

## Phase 3: Fix `keyword_flags` Cascade

### Problem
1. Keywords scanned on ALL tool output (including read/grep results)
2. When agent reads code with "error" in it, keyword fires
3. `keyword_flags` is append-only, never resets
4. Once set, flags persist for entire session

### Current Code Paths
```
soft-governance.ts:361 → scanForKeywords(outputText, detection.keyword_flags)
  └── Scans EVERY tool output

detection.ts:530 → keyword_flags: [...state.keyword_flags, ...additions]
  └── Append-only, no reset
```

### Fix Strategy

**3A: Filter Tool Categories**
```typescript
// Only scan write/edit tool outputs, NOT read/grep/glob
const READ_TOOLS = ['read', 'glob', 'grep', 'repomix_*', 'fetcher_*'];
const shouldScan = !READ_TOOLS.some(t => input.tool.startsWith(t));
if (shouldScan) {
  const newKeywords = scanForKeywords(outputText, detection.keyword_flags);
  // ...
}
```

**3B: Add Decay/Reset**
```typescript
// Reset keyword_flags on intent declaration
if (input.tool === "declare_intent") {
  detection = { ...detection, keyword_flags: [] };
}
```

### Files to Modify
| File | Line | Change |
|------|------|--------|
| `src/hooks/soft-governance.ts` | 360-366 | Add tool category filter before scanning |
| `src/hooks/soft-governance.ts` | 356-358 | Reset keyword_flags on declare_intent |
| `src/lib/detection.ts` | 517-531 | Consider adding decay mechanism |

---

## Phase 4: Remove Zombie Fields

### Problem
Default state creation includes fields not in TypeScript interface:
- `first_turn_confirmation` (complex object)
- `selected_output_style_v29`
- `memory_governance`

### Current Code (brain-state.ts:307-317)
```typescript
first_turn_confirmation: {
  required: true,
  confirmed: false,
  rationale_option: null,
  selected_output_style: null,
  confirmed_at: null,
},
selected_output_style_v29: config.agent_behavior.output_style_v29 ?? null,
memory_governance: {
  last_classified_at: 0,
},
```

### Fix Strategy

**4A: Remove from Default State**
Delete these from `createDefaultBrainState()`.

**4B: Add Migration Cleanup**
```typescript
// persistence.ts - stateManager.load()
function migrateBrainState(parsed: unknown): BrainState {
  // Remove unknown fields from old state files
  delete parsed.first_turn_confirmation;
  delete parsed.selected_output_style_v29;
  delete parsed.memory_governance;
  return parsed as BrainState;
}
```

### Files to Modify
| File | Line | Change |
|------|------|--------|
| `src/schemas/brain-state.ts` | 307-317 | Remove zombie field initializations |
| `src/lib/persistence.ts` | load() | Add migration cleanup |

---

## Phase 5: Fix Redundant Counters

### Problem
- `auto_health_score` always 100 (hook only fires on success)
- `total_tool_calls` / `successful_tool_calls` redundant with `turn_count`

### Current Code
```typescript
// brain-state.ts:42-44
auto_health_score: number; // always 100
total_tool_calls: number;
successful_tool_calls: number;
```

### Fix Strategy
**Option A**: Remove entirely
**Option B**: Wire actual failure detection

For surgical refactor, recommend **Option A** (remove noise).

### Files to Modify
| File | Change |
|------|--------|
| `src/schemas/brain-state.ts` | Remove fields from interface |
| `src/hooks/soft-governance.ts` | Remove counter increments |

---

## Phase 6: Fix `write_without_read_count`

### Problem
Only fires when `tool_type_counts.read === 0` for ENTIRE session. After one read, never fires again.

### Current Code (inferred)
```typescript
// Only checks session-level read count
if (state.metrics.tool_type_counts.read === 0 && toolCategory === "write") {
  // increment write_without_read_count
}
```

### Fix Strategy
Track per-file read-before-write:
```typescript
// Add to MetricsState
files_read_this_session: string[];

// On write, check if file was read
if (!state.metrics.files_read_this_session.includes(targetFile)) {
  newState = incrementWriteWithoutRead(newState);
}
```

---

## Phase 7: Add Hierarchy String Validation

### Problem
Hierarchy strings (`trajectory`, `tactic`, `action`) are free-text, no length limit, injected into every prompt.

### Fix Strategy
```typescript
const MAX_HIERARCHY_LENGTH = 200;

function validateHierarchyString(s: string): string {
  if (s.length > MAX_HIERARCHY_LENGTH) {
    return s.substring(0, MAX_HIERARCHY_LENGTH) + "...";
  }
  // Reject paragraphs (too many words)
  if (s.split(' ').length > 30) {
    return s.split(' ').slice(0, 20).join(' ') + "...";
  }
  return s;
}
```

### Files to Modify
| File | Change |
|------|--------|
| `src/lib/session-engine.ts` | Add validation on `declare_intent`/`map_context` |
| `src/schemas/hierarchy.ts` | Add length constraints |

---

## Phase 8: Entity Checklist Signal Fix

### Problem (From soft-governance.ts:381-416)
Entity checklist increments `out_of_order` or `evidence_pressure` on failure, but `evidence_pressure` counter was removed in Fix 1.5B.

### Current Code
```typescript
// soft-governance.ts:403-406
if (hasStructuralFailure) {
  counters = registerGovernanceSignal(counters, "out_of_order")
} else {
  counters = registerGovernanceSignal(counters, "evidence_pressure") // BROKEN
}
```

### Fix Strategy
Since `GovernanceCounters` now only has `{drift, compaction}`:
```typescript
// Register all failures as drift signal
counters = registerGovernanceSignal(counters, "drift");
```

### Files to Modify
| File | Line | Change |
|------|------|--------|
| `src/hooks/soft-governance.ts` | 403-406 | Use "drift" instead of "evidence_pressure" |

---

## Phase 9: Update Tests

### Test Files Requiring Updates
```
tests/soft-governance.test.ts
tests/integration.test.ts
tests/detection.test.ts
tests/session-boundary.test.ts
tests/messages-transform.test.ts
tests/auto-hooks-pure.test.ts
tests/compact-purification.test.ts
```

### Test Update Strategy
1. Update test expectations for renamed fields
2. Update mock state objects with new schema
3. Add tests for new drift score formula
4. Add tests for keyword filtering

---

## Priority Execution Order

| Priority | Phase | Reason | Estimated Impact |
|----------|-------|--------|------------------|
| **P0** | Phase 1 | Root cause of most cascading issues | HIGH |
| **P0** | Phase 8 | Broken signal registration | HIGH |
| **P1** | Phase 2 | Depends on Phase 1 | MEDIUM |
| **P1** | Phase 3 | Stops false positive cascade | MEDIUM |
| **P2** | Phase 4 | Cleanup, stops context pollution | LOW |
| **P2** | Phase 5 | Cleanup, reduces noise | LOW |
| **P3** | Phase 6 | Enhancement | LOW |
| **P3** | Phase 7 | Prevents future pollution | LOW |
| **P4** | Phase 9 | Must run alongside each phase | ONGOING |

---

## Verification Protocol

After each phase:
```bash
# Type check
npx tsc --noEmit

# Run affected tests
npm test -- tests/<affected>.test.ts

# Full test suite
npm test
```

Before claiming completion:
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No new zombie fields introduced
- [ ] Evidence of fix in test output

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing sessions | Migration cleanup in persistence.ts |
| Test failures from schema changes | Update tests incrementally per phase |
| Drift warnings stop firing | Verify with integration test after Phase 1 |
| Keyword detection too aggressive | Phase 3 filter validation |

---

## Evidence Log

### Code Evidence (Validated 2026-03-04)

1. **turn_count increments on every tool call**
   - `soft-governance.ts:259`: `let newState = incrementTurnCount(state)`
   - `brain-state.ts:382-394`: `incrementTurnCount()` function

2. **drift_score uses wrong counter**
   - `brain-state.ts:459`: `state.metrics.turn_count * 5`

3. **GovernanceCounters reduced** (Fix 1.5B done)
   - `detection.ts:87-90`: Only `{drift, compaction}`

4. **Zombie fields in defaults**
   - `brain-state.ts:307-317`: `first_turn_confirmation`, `selected_output_style_v29`, `memory_governance`

5. **keyword_flags append-only**
   - `detection.ts:530`: `[...state.keyword_flags, ...additions]`

6. **broken evidence_pressure reference**
   - `soft-governance.ts:405`: `registerGovernanceSignal(counters, "evidence_pressure")`
