---
phase: C4-Performance-Optimization
plan: 02
type: execute
wave: 1
depends_on:
  - C4-01
files_modified:
  - src/coordination/completion/detector.ts
  - src/tools/delegation/delegation-status.ts
  - tests/coordination/completion/detector-stability-prune.test.ts
autonomous: true
requirements:
  - REQ-03
  - REQ-01
must_haves:
  truths:
    - "pruneStaleTimers can be called on CompletionDetector and removes stale timers"
    - "hierarchy-manifest.json is parsed at most once per delegation-status tool invocation"
    - "Existing detector tests still pass after timerStartTimes field addition"
    - "Existing delegation-status tests still pass after cache addition"
  artifacts:
    - path: "src/coordination/completion/detector.ts"
      provides: "pruneStaleTimers method + timerStartTimes companion Map"
      min_lines: 230
      exports: ["CompletionDetector"]
    - path: "src/tools/delegation/delegation-status.ts"
      provides: "Per-invocation Map cache for hierarchy-manifest.json parsing"
      min_lines: 690
      exports: ["createDelegationStatusTool"]
  key_links:
    - from: "detector.ts"
      to: "timerStartTimes Map"
      via: "set at startStabilityTimer, delete at clearStabilityTimer, read at pruneStaleTimers"
      pattern: "(timerStartTimes)"
    - from: "delegation-status.ts"
      to: "readManifest cache function"
      via: "Both getSessionTrackerChildren and getHierarchyContext call readManifest instead of readFile+JSON.parse directly"
      pattern: "(readManifest)"
user_setup: []
---

<objective>
Fix the two highest-severity performance concerns: REQ-03 (unbounded timer accumulation in CompletionDetector — a memory leak) and REQ-01 (redundant JSON.parse of hierarchy-manifest.json in delegation-status.ts).

Purpose: REQ-03 prevents memory leaks from unbounded stabilityTimers Map growth when delegations stall. REQ-01 eliminates duplicate file reads within a single tool invocation.
Output: Modified detector.ts with pruneStaleTimers method, modified delegation-status.ts with per-invocation cache.
</objective>

<execution_context>
@/Users/apple/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/C4-Performance-Optimization/C4-SPEC.md
@.planning/phases/C4-Performance-Optimization/C4-RESEARCH.md
@.planning/phases/C4-Performance-Optimization/C4-VALIDATION.md
@.planning/phases/C4-Performance-Optimization/C4-01-PLAN.md
@src/coordination/completion/detector.ts
@src/tools/delegation/delegation-status.ts

# Existing test references for regression
@tests/lib/coordination/completion/detector-v2.test.ts
@tests/tools/delegation/delegation-status-v2.test.ts
@tests/tools/delegation-status.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add pruneStaleTimers + timerStartTimes to CompletionDetector</name>
  <files>
    src/coordination/completion/detector.ts
    tests/coordination/completion/detector-stability-prune.test.ts
  </files>
  <behavior>
    - Given a CompletionDetector with 3 stability timers where timerStartTimes indicates they are all older than maxAgeMs, calling pruneStaleTimers(maxAgeMs) returns the count of pruned timers and removes them from stabilityTimers, messageCounts, and timerStartTimes
    - Given a CompletionDetector with timers younger than maxAgeMs, pruneStaleTimers returns 0 and leaves all Maps unchanged
    - Given an empty CompletionDetector, pruneStaleTimers returns 0 without errors
    - Given a CompletionDetector with mixed-age timers, pruneStaleTimers only removes entries older than maxAgeMs
    - After pruneStaleTimers removes a timer, clearTimeout was called on it (timers don't fire)
  </behavior>
  <action>
    Modify `src/coordination/completion/detector.ts` to add:

    1. **New private field** `timerStartTimes` (Map<string, number>) — companion to stabilityTimers that records when each stability timer was started. Declared at line 35 alongside the other Map fields:
       ```
       private timerStartTimes = new Map<string, number>()
       ```

    2. **Modify `startStabilityTimer`** (line 184-200): Add `this.timerStartTimes.set(sessionID, Date.now())` after setting the stability timer.

    3. **Modify `clearStabilityTimer`** (line 202-209): Add `this.timerStartTimes.delete(sessionID)` to clean up when a timer is cleared normally.

    4. **Add public method `pruneStaleTimers(maxAgeMs: number): number`**: Iterates `this.stabilityTimers.entries()`, for each sessionId checks `this.timerStartTimes.get(sessionId)`. If the timer has been running longer than maxAgeMs, calls `clearTimeout(timerId)`, deletes from `stabilityTimers`, `messageCounts`, and `timerStartTimes`, increments pruned counter. Returns pruned count.

    Update the Wave 0 test file `tests/coordination/completion/detector-stability-prune.test.ts` to make test 4 include a `vi.spyOn(global, "clearTimeout")` check: verify `clearTimeout` is called for each pruned timer.

    Preserve all existing public API signatures. No new exports. No changes to any other method signatures.
  </action>
  <verify>
    <automated>npx vitest run tests/coordination/completion/detector-stability-prune.test.ts -t "pruneStaleTimers" --reporter verbose && npx vitest run tests/lib/coordination/completion/detector-v2.test.ts --reporter verbose && npx vitest run tests/lib/completion-detector.test.ts --reporter verbose</automated>
  </verify>
  <done>
    All 4 pruneStaleTimers tests pass. All existing detector tests pass (detector-v2, completion-detector, completion-detector-crash). Typecheck passes.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add per-invocation cache for hierarchy-manifest.json parsing</name>
  <files>
    src/tools/delegation/delegation-status.ts
  </files>
  <behavior>
    - Given a module-level cache, calling readManifest with the same (projectRoot, rootSessionId) twice within TTL returns the cached result without reading the file
    - Given a module-level cache at capacity (>= 10 entries), adding a new entry evicts the oldest entry
    - Given a module-level cache where TTL has expired, readFile + JSON.parse is called again
    - Existing delegation-status functions still return correct data with cache in place
  </behavior>
  <action>
    Modify `src/tools/delegation/delegation-status.ts` to add a per-invocation cache for `hierarchy-manifest.json` parsing.

    1. **Add module-level cache** after the imports (before `DelegationControlSchema`):
       ```typescript
       // Per-invocation cache for hierarchy-manifest.json — prevents redundant parsing
       // within a single tool execution. Keyed by `${projectRoot}::${rootSessionId}`.
       const manifestCache = new Map<string, { data: HierarchyManifest; ts: number }>()
       const CACHE_TTL = 5_000 // 5 seconds
       const MAX_CACHE_ENTRIES = 10
       ```

    2. **Add private helper `readManifest`** before `getSessionTrackerChildren`:
       ```typescript
       async function readManifest(projectRoot: string, rootSessionId: string): Promise<HierarchyManifest> {
         const cacheKey = `${projectRoot}::${rootSessionId}`
         const cached = manifestCache.get(cacheKey)
         if (cached && Date.now() - cached.ts < CACHE_TTL) {
           return cached.data
         }
         const manifestPath = safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")
         const raw = await readFile(manifestPath, "utf-8")
         const data = JSON.parse(raw) as HierarchyManifest
         // Evict oldest entry if at capacity
         if (manifestCache.size >= MAX_CACHE_ENTRIES) {
           const oldest = manifestCache.entries().next().value
           if (oldest) manifestCache.delete(oldest[0])
         }
         manifestCache.set(cacheKey, { data, ts: Date.now() })
         return data
       }
       ```

    3. **Replace duplicate parsing in `getSessionTrackerChildren`** (lines 170-172): Change from:
       ```typescript
       const manifestPath = safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")
       const raw = await readFile(manifestPath, "utf-8")
       const manifest = JSON.parse(raw) as HierarchyManifest
       ```
       To:
       ```typescript
       const manifest = await readManifest(projectRoot, rootSessionId)
       ```

    4. **Replace duplicate parsing in `getHierarchyContext`** (lines 251-253): Change from:
       ```typescript
       const manifestPath = safeSessionPath(projectRoot, rootSessionId, "hierarchy-manifest.json")
       const raw = await readFile(manifestPath, "utf-8")
       const manifest = JSON.parse(raw) as HierarchyManifest
       ```
       To:
       ```typescript
       const manifest = await readManifest(projectRoot, rootSessionId)
       ```

    Note: The import for `readFile` from `node:fs/promises` (line 3) is still needed for other potential uses in this file. Do NOT remove it — just add the cache helper alongside existing imports.

    No public API changes. All exported symbols remain the same. The `readManifest` function is module-private (not exported).
  </action>
  <verify>
    <automated>npx vitest run tests/tools/delegation/delegation-status-v2.test.ts --reporter verbose && npx vitest run tests/tools/delegation-status.test.ts --reporter verbose</automated>
  </verify>
  <done>
    All existing delegation-status tests pass (delegation-status-v2 and delegation-status). Typecheck passes. Both getSessionTrackerChildren and getHierarchyContext use readManifest instead of direct readFile+JSON.parse.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| delegation-status tool output | No new untrusted input — cache operates on existing parsed data |
| detector.ts | No new untrusted input — timer cleanup operates on internal state only |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-C4-01 | Tampering | manifestCache Map | accept | Cache stores data already parsed from trusted local filesystem. Stale data risk is bounded by 5s TTL. CLI sync path unchanged. |
| T-C4-02 | Denial of Service | pruneStaleTimers | mitigate | maxAgeMs is caller-controlled, bounded by the method's iteration — already O(n) over active timers. Caller is responsible for appropriate invocation frequency. |
</threat_model>

<verification>
- `npx vitest run tests/coordination/completion/detector-stability-prune.test.ts --reporter verbose` — all 4 tests pass
- `npx vitest run tests/lib/coordination/completion/detector-v2.test.ts --reporter verbose` — all existing detector tests pass
- `npx vitest run tests/lib/completion-detector.test.ts --reporter verbose` — regression
- `npx vitest run tests/lib/completion-detector-crash.test.ts --reporter verbose` — regression
- `npx vitest run tests/tools/delegation/delegation-status-v2.test.ts --reporter verbose` — all delegation-status tests pass
- `npx vitest run tests/tools/delegation-status.test.ts --reporter verbose` — regression
- `npm run typecheck` — no type errors
</verification>

<success_criteria>
- `pruneStaleTimers(maxAgeMs)` method exists on `CompletionDetector` and returns pruned count
- `timerStartTimes` companion Map tracks when each stability timer was created
- `clearTimeout` is called for each pruned timer
- `readManifest` cache function exists in delegation-status.ts
- `getSessionTrackerChildren` and `getHierarchyContext` both use `readManifest` instead of direct `readFile` + `JSON.parse`
- Cache has 5s TTL and max 10 entries, LRU-style eviction
- All existing tests pass, typecheck clean
</success_criteria>

<output>
- `.planning/phases/C4-Performance-Optimization/C4-02-SUMMARY.md` when done
</output>
