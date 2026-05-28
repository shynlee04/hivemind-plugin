# Phase C4: Performance Optimization — Specification

**Created:** 2026-05-28
**Ambiguity score:** 0.07 (gate: ≤ 0.20)
**Requirements:** 4 locked

## Goal

Fix 4 distinct Node.js performance issues across 4 source files — replacing synchronous/blocking patterns with async equivalents, adding a per-invocation cache for redundant JSON parsing, and preventing unbounded timer accumulation — without changing any public API surface or adding external dependencies.

## Background

The project uses Node.js v26.0.0. Four performance concerns were identified during Phase 17 src/ audit and documented in CONCERNS.md (lines 159-189). Each concern is an isolated, measurable hotspot in source code that has been running in production-like conditions:

1. **4.1 (Redundant JSON.parse):** `delegation-status.ts` — two functions (`getSessionTrackerChildren`, `getHierarchyContext`) independently parse the same `hierarchy-manifest.json` file on every call. Under repeated delegation-status polling, this means 2× `readFile` + `JSON.parse` per poll cycle.

2. **4.2 (Synchronous FS in tool path):** `bootstrap-init.ts` — the tool-exposed `bootstrapInit` function uses `mkdirSync`/`writeFileSync`/`readFileSync` in loops and helpers. Tool execution runs in OpenCode's event loop — sync FS blocks all concurrent operations.

3. **4.3 (Unbounded timer accumulation):** `detector.ts` — `CompletionDetector.stabilityTimers` is a `Map<string, timer>` that grows without bound. When delegations don't complete cleanly, timers accumulate and eventually leak memory.

4. **4.4 (execSync blocking):** `create-governance-session.ts` — the governance session creation tool uses `execSync` for git commit. `execSync` blocks the event loop for the full duration of the child process.

Each fix follows a proven pattern: identify hotspot → replace with async/lean equivalent → verify via existing tests + new targeted tests.

## Requirements

1. **[REQ-01 — 4.1] Cache redundant JSON.parse in delegation-status.ts**: Add a per-invocation Map cache with TTL to avoid parsing `hierarchy-manifest.json` more than once per tool execution.
   - **Current:** Two functions independently call `readFile` + `JSON.parse` on the same file path within a single delegation-status call chain.
   - **Target:** A module-level `Map` cache (keyed by `projectRoot::rootSessionId`) with 5-second TTL and max 10 entries prevents redundant parses. Cache is implicitly scoped per invocation.
   - **Acceptance:** Calling both `getSessionTrackerChildren` and `getHierarchyContext` with the same `(projectRoot, rootSessionId)` within 5 seconds results in exactly 1 `readFile` + `JSON.parse` call.

2. **[REQ-02 — 4.2] Convert sync FS to async in bootstrap-init tool path**: Replace `mkdirSync`/`writeFileSync`/`readFileSync` calls with `fs.promises` equivalents in the tool-exposed bootstrap path, preserving sync helpers for CLI-only functions.
   - **Current:** `bootstrapInit` function uses `mkdirSync`, `writeFileSync`, `readFileSync` for directory creation, gitkeep writing, and file reading. The CLI `init` command and the tool handler share the same code path.
   - **Target:** Tool-exposed path uses `mkdir`, `writeFile`, `readFile` from `node:fs/promises`. CLI-only helper functions (`readInstalledPackageVersion`, `shouldRefreshSchemaArtifact`) remain sync since they're only called from CLI context.
   - **Acceptance:** The `bootstrapInit` function (called by the tool handler) contains zero calls to `mkdirSync`, `writeFileSync`, or `readFileSync`. No public API signature changes. CLI `hivemind init` command continues to work.

3. **[REQ-03 — 4.3] Add pruneStaleTimers to prevent timer leak in CompletionDetector**: Add a `pruneStaleTimers(maxAgeMs)` method that removes stability timers older than a configurable threshold, preventing unbounded Map growth.
   - **Current:** `stabilityTimers` Map grows without bound. Timers are only removed via `cancel` or timeout handler execution — neither is guaranteed when delegations stall.
   - **Target:** `CompletionDetector` has a `pruneStaleTimers(maxAgeMs)` method that iterates `stabilityTimers`, clears timers older than `maxAgeMs`, removes them from `stabilityTimers`, `messageCounts`, and a new companion `timerStartTimes` Map. Returns count of pruned timers.
   - **Acceptance:** After adding 3 stability timers and calling `pruneStaleTimers(0)`, all 3 timers are cleared and the method returns 3. After adding 3 timers and calling `pruneStaleTimers(120_000)` within 1 second, 0 timers are pruned.

4. **[REQ-04 — 4.4] Replace execSync with async execFile in create-governance-session.ts**: Replace `execSync` for git operations with `execFile` (async) to avoid blocking the event loop during governance session creation.
   - **Current:** `createGovernanceSessionTool` uses `execSync` for `git add -A` and `git commit`. This blocks the OpenCode event loop for the full duration of git operations.
   - **Target:** `execFileAsync` (via `util.promisify(child_process.execFile)`) replaces `execSync`. Git commands are split into separate `execFileAsync("git", ["add", "-A"])` and `execFileAsync("git", ["commit", "-m", msg, "--no-verify"])` calls. Best-effort semantics are preserved (empty catch on failure).
   - **Acceptance:** Test verifies that `execFile` is called instead of `execSync` by checking the mock's call arguments. Empty catch block handles rejection gracefully (no unhandled promise rejections).

## Boundaries

**In scope:**
- `delegation-status.ts` — add per-invocation Map cache for `hierarchy-manifest.json` parsing (REQ-01)
- `bootstrap-init.ts` — convert tool-exposed sync FS calls to `fs.promises` equivalents (REQ-02)
- `detector.ts` — add `pruneStaleTimers` method + `timerStartTimes` companion map (REQ-03)
- `create-governance-session.ts` — replace `execSync` with async `execFile` for git operations (REQ-04)
- New targeted tests for each fix (4 new test files or test additions)
- Existing test regression: all tests must still pass

**Out of scope:**
- Full async rewrite of `bootstrapInit` — only the tool-exposed path needs async; CLI path sync helpers are preserved intentionally
- LRU cache library or any external npm package — all fixes use built-in Node.js APIs only
- Refactoring `delegation-status.ts` architecture — only the cache addition
- Adding a periodic monitor loop for `pruneStaleTimers` — the method is callable but calling it is deferred to the consumer (coordination layer)
- Changing the governance session API or git command behavior — only the execution mechanism changes
- Performance benchmarking or profiling — acceptance is functional correctness, not benchmark numbers
- Other source files or performance concerns beyond these 4

## Constraints

- **No external packages:** All fixes must use built-in Node.js APIs only (`node:fs/promises`, `node:child_process`, `node:util`)
- **No public API changes:** Function signatures, export names, and parameter shapes must remain unchanged
- **Node.js >= 20.0.0:** Verified v26.0.0 available on target — `fs.promises` is stable since Node 14
- **Best-effort semantics preserved:** Empty catch blocks in git operations and async FS calls must not propagate failures to callers (non-critical paths)
- **CLI bootstrap path must remain usable:** The `hivemind init` CLI command (via `bin/hivemind.cjs`) continues to use sync FS — only the tool handler path needs async

## Acceptance Criteria

- [ ] REQ-01: `delegation-status.ts` — repeated call to `getSessionTrackerChildren` + `getHierarchyContext` with same `(projectRoot, rootSessionId)` within 5 seconds produces exactly 1 file read
- [ ] REQ-01: Existing `delegation-status-v2.test.ts` (257 LOC) and `delegation-status.test.ts` (571 LOC) continue to pass
- [ ] REQ-02: `bootstrapInit` function contains zero `mkdirSync`/`writeFileSync`/`readFileSync` calls (grep-verifiable)
- [ ] REQ-02: Sync helper functions (`readInstalledPackageVersion`, `shouldRefreshSchemaArtifact`) remain unchanged
- [ ] REQ-02: Existing `bootstrap-init.test.ts` (210 LOC) continues to pass
- [ ] REQ-03: `pruneStaleTimers(0)` clears 3 timers and returns 3
- [ ] REQ-03: `pruneStaleTimers(120_000)` called within 1 second of adding 3 timers returns 0
- [ ] REQ-03: Existing `detector-v2.test.ts` (100 LOC) continues to pass
- [ ] REQ-04: Test confirms `execFile` is called instead of `execSync` for git operations
- [ ] REQ-04: Empty catch block does not produce unhandled promise rejections
- [ ] REQ-04: Existing `create-governance-session.test.ts` (425 LOC) continues to pass
- [ ] `npm run typecheck` passes (no type errors)
- [ ] `npm test` passes with no regressions (full suite green)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | 4 specific concerns, 4 source files|
| Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit in/out of scope lists     |
| Constraint Clarity | 0.90  | 0.65 | ✓      | No external deps, no API changes   |
| Acceptance Criteria| 0.90  | 0.70 | ✓      | 12 pass/fail criteria, per-concern |
| **Ambiguity**      | 0.07  | ≤0.20| ✓      | Requirements fully locked          |

Status: ✓ = met minimum

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| —     | (auto-mode) | Skipped — initial ambiguity 0.07 ≤ 0.20 gate | All requirements derived from RESEARCH.md (CONCERNS.md lines 159-189) and verified source code |

*Phase requirements sourced from `.planning/codebase/CONCERNS.md` lines 159-189, verified against 4 source files via grep/glob, and validated by RESEARCH.md with HIGH confidence.*

---

*Phase: C4-Performance-Optimization*
*Spec created: 2026-05-28*
*Next step: /gsd-discuss-phase C4 — implementation decisions (fix ordering, test strategy, commit boundaries)*
