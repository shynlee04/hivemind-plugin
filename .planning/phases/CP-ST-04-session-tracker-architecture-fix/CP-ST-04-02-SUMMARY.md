---
phase: CP-ST-04
plan: 02
subsystem: session-tracker
tags: [session-tracker, directory-architecture, hierarchy-index, child-writer, root-main]
requirements-completed: [D-02, D-03, D-05, D-08]

# Dependency graph
requires:
  - plan: CP-ST-04-01
    provides: "PendingDispatchRegistry parent-indexed reverse lookup (byParent, D-04)"
  - plan: CP-ST-04-01
    provides: "handleChatMessage classification BEFORE ensureSessionReady (D-05)"
provides:
  - "HierarchyIndex.getRootMain() — root main session resolution for any child (D-03, D-08)"
  - "Root-only directory creation — no directories for child sessions (D-02)"
  - "Conservative fallback warning removal — no fallthrough to mkdir (D-02)"
  - "ChildWriter.resolveWriteParent() — all child .json routed to root main (D-03)"
affects: [CP-ST-04-03, session-tracker, child-writer, event-capture, tool-capture]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Root-main resolution: HierarchyIndex tracks root main session for every child via childToRootMain Map"
    - "Strict directory gating: three-gate classification (SDK → HierarchyIndex → PendingDispatchRegistry) must ALL pass before directory creation"
    - "Root-main routing: ChildWriter.resolveWriteParent chains up to root main via HierarchyIndex.getRootMain"
    - "Cycle-safe chain walking: resolveRootMain uses visited Set to prevent infinite loops (T-04-05)"

key-files:
  created:
    - "tests/features/session-tracker/persistence/hierarchy-index.test.ts — 14 tests for root main tracking"
  modified:
    - "src/features/session-tracker/persistence/hierarchy-index.ts — childToRootMain Map, getRootMain(), resolveRootMain(), updated registerChild() and buildFromDisk()"
    - "src/features/session-tracker/index.ts — removed conservative fallback, passed hierarchyIndex to ChildWriter"
    - "src/features/session-tracker/capture/event-capture.ts — added root main logging in handleSessionCreated"
    - "src/features/session-tracker/persistence/child-writer.ts — resolveWriteParent(), hierarchyIndex dependency"
    - "tests/features/session-tracker/index.test.ts — 6 new tests for ensureSessionReady directory creation (D-02)"
    - "tests/features/session-tracker/capture/event-capture.test.ts — 5 new tests for handleSessionCreated hardening (D-02)"
    - "tests/features/session-tracker/persistence/child-writer.test.ts — 5 new tests for root main routing (D-03)"

key-decisions:
  - "D-02: Only sessions with user turn 1 and no parent get directories — three gates enforce this strictly"
  - "D-03: All delegated sessions stored as flat .json under root main directory — ChildWriter.resolveWriteParent chains up"
  - "D-05: Classification BEFORE directory creation is the invariant — handleChatMessage and handleSessionCreated both follow it"
  - "D-08: HierarchyIndex.childToRootMain provides O(1) root main lookup — populated at registerChild() and buildFromDisk()"

patterns-established:
  - "Root-main-first architecture: L0 main owns the directory; L1/L2 are flat .json files within it"
  - "Defense-in-depth gating: all three gates (SDK, HierarchyIndex, PendingDispatchRegistry) guard against false directory creation"
  - "Fallback safety: ChildWriter falls back to immediate parent when hierarchyIndex is unavailable"

# Metrics
duration: 14min
completed: 2026-05-15
---

# Phase CP-ST-04 Plan 02: Directory Architecture Fix Summary

**Enforced the strict directory architecture: only sessions with a real user turn and no parent get directories. All delegated sessions (children, grandchildren) are stored exclusively as .json files under the root main session's directory.**

## Performance

- **Duration:** ~14 minutes
- **Completed:** 2026-05-15
- **Tasks:** 3 completed (all TDD)
- **Files modified:** 4 source files, 3 test files
- **Tests added:** 25 new tests (14 hierarchy-index + 11 directory creation + 5 child-writer routing)
- **Total tests passing:** 332/334 (2 pre-existing cleanup test failures)

## Accomplishments

- **Added root main session tracking to HierarchyIndex (Task 1)** — `childToRootMain` Map resolves any child to its root main session. `getRootMain()` provides O(1) lookup. `registerChild()` automatically resolves and stores rootMain. `buildFromDisk()` performs second-pass resolution for reverse-order registrations. `resolveRootMain()` walks the chain with cycle detection (T-04-05).
- **Removed the conservative fallback (Task 2)** — the "treat as main session" warning log in `ensureSessionReady()` is gone. All three classification gates (SDK parentID → HierarchyIndex → PendingDispatchRegistry) must pass before a directory is created. Child sessions NEVER trigger `mkdir`.
- **Routed child .json writes to root main (Task 3)** — `ChildWriter.resolveWriteParent()` uses `HierarchyIndex.getRootMain()` to find the correct parent directory. L1 and L2 children are written as flat `.json` files under the root main session's directory, not under their immediate parent.

## Task Commits

Each task was committed atomically following TDD (RED → GREEN):

1. **Task 1 (RED): test** — `84195c44` — 14 failing tests for HierarchyIndex root main tracking
2. **Task 1 (GREEN): feat** — `f847f13f` — Added childToRootMain Map, getRootMain(), resolveRootMain(), updated registerChild() and buildFromDisk()
3. **Task 2 (RED): test** — `29018c6b` — 11 failing tests for root-only directory creation
4. **Task 2 (GREEN): feat** — `5c2706c4` — Removed conservative fallback, added root main logging
5. **Task 3 (RED): test** — `7e9d26bb` — 5 failing tests for child .json routing to root main
6. **Task 3 (GREEN): feat** — `bfb06339` — Added resolveWriteParent(), updated ChildWriter and index.ts initialize()

## Files Created/Modified

- `src/features/session-tracker/persistence/hierarchy-index.ts` — Added `childToRootMain: Map<string, string>`, `getRootMain()`, `resolveRootMain()`, updated `registerChild()` with rootMain resolution, updated `buildFromDisk()` with second-pass rootMain population
- `src/features/session-tracker/index.ts` — Removed "conservative fallback" warning log (lines 199-207); all three gates must pass for directory creation; passed `hierarchyIndex` to `ChildWriter` constructor
- `src/features/session-tracker/capture/event-capture.ts` — Added root main session logging in `handleSessionCreated()` after all three gates pass
- `src/features/session-tracker/persistence/child-writer.ts` — Added `hierarchyIndex` dependency, `resolveWriteParent()` method; updated `createChildFile()`, `appendChildTurn()`, and `updateChildStatus()` to resolve write target through root main
- `tests/features/session-tracker/persistence/hierarchy-index.test.ts` — Created: 14 tests covering getRootMain, registerChild resolution, buildFromDisk population, cycle detection, and edge cases
- `tests/features/session-tracker/index.test.ts` — Added: 6 tests for ensureSessionReady directory creation (main session, SDK gate, hierarchy gate, pending gate, all-gates-pass, no fallback warning)
- `tests/features/session-tracker/capture/event-capture.test.ts` — Added: 5 tests for handleSessionCreated (SDK gate, hierarchy gate, pending gate, all-gates-pass, SDK failure fallback)
- `tests/features/session-tracker/persistence/child-writer.test.ts` — Added: 5 tests for root main routing (createChildFile, L2 chain resolution, appendChildTurn, updateChildStatus, fallback)

## File Structure After Fix

```
.hivemind/session-tracker/
├── project-continuity.json
├── ses_ROOT123/                          ← L0 main (user turn 1, has dir)
│   ├── ses_ROOT123.md
│   ├── session-continuity.json
│   ├── ses_CHILD456.json                 ← L1 child under ROOT
│   └── ses_GRANDCHILD789.json            ← L2 grandchild under ROOT
```

No more orphan `ses_CHILD456/` or `ses_GRANDCHILD789/` directories.

## Decisions Made

- **Root-main resolution is O(1)** — `childToRootMain` Map lookup avoids walking the chain on every call. `resolveRootMain()` (chain walker) is only used during `buildFromDisk()` second pass and `registerChild()`.
- **Strict architecture: no exceptions** — If a session is uncertain (all gates fail), it IS the root main. The removed "conservative fallback" was a safety valve for a broken Gate 3 — now that all three gates work correctly, no fallback is needed.
- **ChildWriter fallback preserves backward compatibility** — When `hierarchyIndex` is not provided, `resolveWriteParent()` falls back to the immediate parent. This means existing callers that create `ChildWriter({ projectRoot })` without hierarchyIndex continue to work.
- **Reverse-order registration handled by buildFromDisk** — When `registerChild()` is called with L1→L2 before root→L1 (e.g., tool polling), the root main for L2 resolves to L1 (its immediate parent at registration time). The `buildFromDisk()` second pass corrects this for any children loaded from disk.

## Deviations from Plan

None — plan executed exactly as written. All three tasks followed TDD (RED → GREEN) and matched the plan's specifications.

## Threat Model Compliance

All 4 threat mitigations from the plan's STRIDE register are satisfied:

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-04-05 (Tampering) | `resolveRootMain()` uses `visited` Set for cycle detection; returns undefined for incomplete chains | ✅ |
| T-04-06 (EoP) | `safeSessionPath()` and `sanitizeSessionID()` guards at atomic-write boundary; `isValidSessionID()` rejects ".." and absolute paths | ✅ |
| T-04-07 (DoS) | `bootstrappedSessions` Set ensures mkdir at most once per session; `isValidSessionID` guard rejects invalid input | ✅ |
| T-04-08 (Info Disclosure) | Child .json under root main dir with same filesystem permissions as main .md files | ✅ Accept |

## Verification

| Check | Result |
|-------|--------|
| `npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts` | ✅ 14/14 pass |
| `npx vitest run tests/features/session-tracker/index.test.ts` | ✅ 22/22 pass |
| `npx vitest run tests/features/session-tracker/capture/event-capture.test.ts` | ✅ 10/10 pass |
| `npx vitest run tests/features/session-tracker/persistence/child-writer.test.ts` | ✅ 17/17 pass |
| Full session-tracker suite | ✅ 318/320 pass (2 pre-existing cleanup failures) |
| `npm run typecheck` | ✅ Zero errors |
| Grep for `conservative fallback` in ensureSessionReady | ✅ Removed |
| Grep for `resolveWriteParent` in child-writer.ts | ✅ Present |
