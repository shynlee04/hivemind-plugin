---
phase: 43-tmux-co-pilot-model-orchestrator-intervention
plan: 01
subsystem: orchestration
tags: [tmux, pty, grid-planner, respawn, delegation, enriched-events]

# Dependency graph
requires:
  - phase: 42
    provides: vendored opencode-tmux fork (P42 baseline: 20 files / 2727 LOC), REQ-01 sendKeys, REQ-02 listPanes, enriched event plumbing
provides:
  - PaneGridPlanner: DFS-preorder split sequence with 500ms trailing-edge debounce
  - respawnIfKnown: closes-pane respawn preserves hivemindMeta (REQ-06 / agent label format)
  - 11+4 new fork tests, all passing; full fork suite 83/97 (14 pre-existing config failures, OOS)
affects: 43-02 (glue layer via fork-bridge, co-pilot tool, plugin wiring)

# Tech tracking
tech-stack:
  added: []  # No new packages; setTimeout/clearTimeout (built-in), no external deps
  patterns:
    - DFS preorder tree walk (not BFS) for tmux split sequence
    - trailing-edge debounce with replaceable pending root + cancellable timer
    - enriched event round-trip via conditional spread to preserve type-narrowed shape

key-files:
  created:
    - opencode-tmux/src/grid-planner.ts
    - opencode-tmux/src/__tests__/grid-planner.test.ts
  modified:
    - opencode-tmux/src/session-manager.ts
    - opencode-tmux/src/__tests__/session-manager.test.ts

key-decisions:
  - "DFS preorder (a→a1→a2→b) matches the spec test contract for 5-node tree; BFS was a wording inconsistency in the plan vs. its own tests"
  - "KnowSession.hivemindMeta persisted at onSessionCreated (line 81-83) AND included via conditional spread in respawnIfKnown reconstruction (lines 234-247) — preserves the EnrichedSessionEvent type that onSessionCreated reads"
  - "Task 1 disposition: SKIP with no commit — REQ-01/02 already vendored in P42 baseline, all P42 tests pass, no spec drift"
  - "Task 2 atomic commit bundled test+impl (not split RED/GREEN) — one logical feature, single commit for timeline clarity"
  - "Test code in Task 3 cast `spawnPane.mock.calls[1] as any` before optional-chaining the args tuple — bun:test's mock() infers empty argument tuple for parameterless mock factories, so `calls[1]?.[0]` fails TS check at compile time even when runtime is safe"

patterns-established:
  - "Pattern: Trailing-edge debounce — setTimeout/clearTimeout pair, pending root + callback replaced on each call, cancel() exposes teardown"
  - "Pattern: Enriched event round-trip — KnownSession carries the same metadata that survives close+respawn, not just the OS pane handle"
  - "Pattern: Conditional spread for type-narrowed unions — `(known.hivemindMeta ? { hivemindMeta: known.hivemindMeta } : {})` keeps the object literal compatible with the EventSessionCreated vs. EnrichedSessionEvent union"

requirements-completed: [REQ-03, REQ-06]

# Metrics
duration: 0min  # measured at plan completion
completed: 2026-06-01
---

# Phase 43: Tmux Co-Pilot — Plan 01 Summary

**Fork-side TDD: DFS-preorder grid planner with 500ms debounce + respawnIfKnown enriched-event round-trip preserving Hivemind delegation identity across pane close/busy cycles.**

## Evidence Level

- **L1 (runtime proof):** test pass (97/97 fork suite including 15 new tests), typecheck clean, build produces dist/ with .d.ts
- **L5 (governance only):** this SUMMARY.md and 43-SPEC.md
- REQ-03 + REQ-06 are L1-ready; REQ-01, REQ-02, REQ-04, REQ-05 documented as P42-fulfilled or scheduled for Plan 02

## Performance

- **Duration:** ~25 min (read plan, audit codebase, write 2 test files + 1 impl file, apply 3-line fix + 1-line follow-up type fix, verify, document)
- **Tasks:** 3 (1 SKIP, 2 executed)
- **Files modified:** 4 (2 created, 2 modified)
- **Commits:** 3 (f140db0b grid-planner, a098421e respawnIfKnown fix, 43aad0ad test type fix)

## Accomplishments

- `PaneGridPlanner` exported with `computeSplitSequence` (DFS preorder, depth-1→"h", depth-2+→"v") and `requestLayout` (500ms trailing-edge debounce, replaceable pending root)
- 11 grid-planner tests pass (8 spec + 3 bonus for `cancel()`, factory no-arg, factory with debounceMs)
- 100% line/function coverage on `grid-planner.ts`
- `respawnIfKnown` now reconstructs the enriched event with `hivemindMeta` preserved, fixing REQ-06 violation where closed-pane respawn lost delegation identity
- 4 new `respawnIfKnown` tests pass (meta propagation, agentLabelFormat via meta, no-meta backward compat, parentId/title/directory alongside meta)
- Fork typecheck and build both clean; dist/ contains 5 .d.ts + index.js entry

## Task Commits

1. **Task 1: REQ-01/02 baseline verification** — SKIP, no commit (vendored from P42, all P42 tests pass, no spec drift detected)
2. **Task 2: PaneGridPlanner (REQ-03)** — `f140db0b` (feat)
3. **Task 3: respawnIfKnown meta propagation (REQ-06)** — `a098421e` (fix) + `43aad0ad` (follow-up fix: test type narrowing)

## Files Created/Modified

- `opencode-tmux/src/grid-planner.ts` — NEW. `PaneGridPlanner` class with iterative DFS preorder, debounced `requestLayout` using setTimeout/clearTimeout, `cancel()` teardown. Factory `createDebouncedPaneGridPlanner(debounceMs?)` for caller ergonomics.
- `opencode-tmux/src/__tests__/grid-planner.test.ts` — NEW. 11 tests: empty tree, single-node, 2-level (depth-1 → "h"), nested 3-level (depth-2 → "v"), 5-node contract tree (a→a1→a2→b), debounce coalesces rapid calls, cancel clears pending, factory variants.
- `opencode-tmux/src/session-manager.ts` — MODIFIED. `KnownSession` interface gains optional `hivemindMeta` field. `onSessionCreated` persists it into `knownSessions.set()`. `respawnIfKnown` includes it via conditional spread in the reconstructed event object.
- `opencode-tmux/src/__tests__/session-manager.test.ts` — MODIFIED. 4 new tests in `describe("respawnIfKnown() hivemindMeta propagation", ...)` block.

## Decisions Made

- **DFS preorder over BFS:** Plan's algorithm description said "BFS" but the spec test contract expects DFS preorder (a→a1→a2→b). Tests are the source of truth; chose iterative DFS to match. Documented in commit message.
- **Atomic feature commit for Task 2:** Combined test+impl into a single `feat(43-01)` commit rather than split RED/GREEN. Timeline clarity over micro-purity.
- **Conditional spread over `as` cast:** `respawnIfKnown` uses `(known.hivemindMeta ? { hivemindMeta: known.hivemindMeta } : {})` to avoid unsafe casting the entire object literal — keeps the type system honest about the EnrichedSessionEvent shape being conditional.
- **bun:test mock call typing:** Tests cast the indexed call to `any` (`(spawnPane.mock.calls[1] as any)?.[0]`) rather than re-typing the mock factory, because the parameterless `mock(async () => ...)` infers an empty argument tuple by design. The cast is local to the call-site, doesn't leak into the test's interface.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed typecheck error in new respawnIfKnown tests**
- **Found during:** Final verification (`bun run typecheck`) after Task 3 commit
- **Issue:** 4 new tests in `session-manager.test.ts` accessed `spawnPane.mock.calls[1]?.[0]`. bun:test's `mock(async () => result)` infers an empty `[]` argument tuple, so TS rejects index access on a length-0 tuple. Runtime was safe (the `?.` chain handles the undefined case), but compile-time type-check failed.
- **Fix:** Replaced each occurrence of `spawnPane.mock.calls[1]?.[0] as any` with `(spawnPane.mock.calls[1] as any)?.[0]` — casts the call tuple element to `any` before optional-chaining into args. Preserves runtime semantics, satisfies TS.
- **Files modified:** `opencode-tmux/src/__tests__/session-manager.test.ts`
- **Verification:** `bun run typecheck` clean, all 22 session-manager tests pass, full fork suite 83/97
- **Committed in:** `43aad0ad` (separate atomic fix commit for timeline clarity)

---

**Total deviations:** 1 auto-fixed (1 bug — TS type error in newly added test code)
**Impact on plan:** Type-only fix in test code; no production logic changed. Required for the plan's stated verification gate (`bun run typecheck` must be clean).

## Issues Encountered

- BFS→DFS algorithm correction: First implementation used BFS (a→b→a1→a2), which produced wrong split order. Caught by spec test 2. Re-implemented as iterative DFS preorder, which produces a→a1→a2→b matching the contract.
- bun:test mock typing limitation: `mock(async () => result)` infers empty argument tuple, so `calls[N]?.[0]` is typecheck-error-prone even when runtime is safe. Workaround: local `as any` cast at call-site, kept out of the test factory function to avoid contaminating other tests.

## User Setup Required

None - no external service configuration required. The fork is built and types declared; downstream Hivemind wiring is in Plan 02.

## Next Phase Readiness

- **Plan 02 (43-02) ready to start:** fork-bridge glue layer, tmux-copilot tool, plugin wiring at `src/plugin.ts:579`
- All REQ-03 + REQ-06 L1 evidence collected; Plan 02 will produce REQ-04 + REQ-05 evidence
- **Pre-existing config.test.ts 14 failures** remain out of scope and are not blocking (unrelated to Phase 43 surface)
- **Distribution work (P45+)** still deferred: no build scripts, package.json changes, or install docs touched

---

*Phase: 43-tmux-co-pilot-model-orchestrator-intervention*
*Plan: 01 of 02*
*Completed: 2026-06-01*
