# Injection Conflict Fix Plan

## Context
This plan addresses between-turn injection conflicts in HiveMind v3.0 hooks. Must integrate with Team A Phase 4 backend (graph/ directory).

## Issues to Fix

### Issue 1: Duplicate Cognitive XML (CRITICAL)
- **Location A**: `session-lifecycle.ts` line 75 - calls `packCognitiveState()`
- **Location B**: `messages-transform.ts` line 303 - calls `packCognitiveState()`
- **Conflict**: Same data injected twice per turn
- **Fix**: Remove from session-lifecycle, keep in messages-transform

### Issue 2: Duplicate First-Turn Context (CRITICAL)
- **Location A**: `session_coherence/main_session_start.ts` - unregistered hook
- **Location B**: `messages-transform.ts` line 242-294 - first-turn logic
- **Conflict**: Two first-turn injections
- **Fix**: Remove session_coherence hook, use messages-transform only

### Issue 3: Duplicate Anchor Formats (HIGH)
- **Location A**: `session-lifecycle.ts` line 84 - builds `<immutable-anchors>` block
- **Location B**: `messages-transform.ts` line 309 - builds `[SYSTEM ANCHOR: ...]` short format
- **Conflict**: Anchors injected in two formats
- **Fix**: Consolidate to one format in messages-transform

### Issue 4: Duplicate Drift Toasts (HIGH)
- **Location A**: `soft-governance.ts` line 212-214 - drift detection
- **Location B**: `event-handler.ts` line 77-98 - drift toast on idle
- **Conflict**: Drift toasts can fire twice
- **Fix**: Centralize in one place with throttling

## Integration with Team A Phase 4

Team A's Phase 4 (US-018-022) implements:
- graph-migrate.ts - flat to graph migration
- session-swarm.ts - 80% splitter + headless researchers
- Trajectory write-through in tools

Our fixes must NOT break their backend:
1. graph/ directory will be primary, state/ is fallback
2. Trajectory write-through requires tools to call graph-io
3. Session swarms need file mutex (proper-lockfile)

## Sub-Tasks

### Task 1: Remove Duplicate Cognitive XML
**File**: `src/hooks/session-lifecycle.ts`
- Remove `packCognitiveState` call (line 75)
- Remove cognitiveXml from assembleSections (line 90)
- Keep governance signals, bootstrap, anchors
- Test: `npm test` passes

### Task 2: Remove Duplicate First-Turn Hook
**File**: `src/hooks/session_coherence/main_session_start.ts`
- Delete this unregistered hook file
- Or disable in `src/hooks/index.ts`
- Test: First-turn works via messages-transform only

### Task 3: Consolidate Anchor Format
**File**: `src/hooks/messages-transform.ts`
- Keep `[SYSTEM ANCHOR: ...]` short format (line 309)
- Remove `<immutable-anchors>` from session-lifecycle (line 84)
- Test: Anchors appear once in output

### Task 4: Consolidate Drift Toasts
**Files**: `soft-governance.ts`, `event-handler.ts`
- Keep drift detection in soft-governance (post-tool)
- Remove from event-handler.ts idle check
- Or vice versa - choose one location
- Test: Drift toasts fire once per threshold

## Quality Gates
- `npm test` passes
- `npx tsc --noEmit` passes
- No duplicate content in synthetic parts (verify via debug log)

## Dependencies
- None blocking - these are isolated fixes
- Must verify with Team A Phase 4 graph/ integration works after

## Execution Order
1. Task 1 (remove cognitive XML duplication) - CRITICAL
2. Task 2 (remove duplicate first-turn) - CRITICAL  
3. Task 3 (consolidate anchors)
4. Task 4 (consolidate drift toasts)
