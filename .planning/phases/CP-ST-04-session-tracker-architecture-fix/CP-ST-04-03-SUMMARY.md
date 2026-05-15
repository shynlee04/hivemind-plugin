---
phase: CP-ST-04
plan: 03
subsystem: session-tracker
tags: [hierarchy-manifest, child-json, immediate-write, orphan-cleanup, manifest-writer]
requires: [D-06, D-07, D-08]
provides: ["hierarchy-manifest.json authority", "immediate child .json write", "hardened orphan cleanup"]
affects: [session-tracker/capture, session-tracker/persistence, session-tracker/types]
tech-stack:
  added: []
  patterns: [atomic-write, CQRS observer pattern, registry-gate classification]
key-files:
  created:
    - src/features/session-tracker/persistence/hierarchy-manifest.ts
    - tests/features/session-tracker/persistence/hierarchy-manifest.test.ts
  modified:
    - src/features/session-tracker/types.ts
    - src/features/session-tracker/capture/event-capture.ts
    - src/features/session-tracker/index.ts
    - tests/features/session-tracker/capture/event-capture.test.ts
    - tests/features/session-tracker/integration/e2e-verification.test.ts
decisions:
  - D-CP-ST-04-03: hierarchy-manifest.json coexists with session-continuity.json — manifest is a flattened, authoritative lookup; continuity index preserves the hierarchical tree
  - D-CP-ST-04-03-a: registerChild() must be called before getRootMain() in writeImmediateChildFile to resolve root main for fresh children
  - D-CP-ST-04-03-b: createChildFile in tool-capture intentionally overwrites immediate write — richer metadata from PostToolUse supersedes initial record
completed: 2026-05-15T19:00:00Z
duration: ~17 minutes
---

# Phase CP-ST-04 Plan 03: Hierarchy Manifest + Immediate I/O + Cleanup Summary

**One-liner:** Hierarchy manifest system with atomic writes, immediate child .json at session.created, and hardened orphan cleanup — closing the race window between session.created and PostToolUse.

## What Was Built

### Task 1: Hierarchy Manifest Writer (D-07)

Created `HierarchyManifestWriter` class that persists `hierarchy-manifest.json` in each root main session directory. This is the **authoritative source** for the session delegation tree, replacing ad-hoc gate decisions.

**New types** in `types.ts`:
- `HierarchyManifestChild` — per-child entry with sessionID, parentSessionID, rootMainSessionID, delegationDepth, delegatedBy, subagentType, status, turnCount, childFile
- `HierarchyManifest` — top-level manifest with version, rootMainSessionID, children map, totalChildren, maxDepth

**Writer capabilities**: `addChild()`, `updateChildStatus()`, `getChildren()`, `getChild()`. All writes use atomic write-to-tmp → rename pattern. Graceful degradation on parse failure returns empty manifest.

**10 tests**: addChild fields, correct path (next to session-continuity.json), status updates, getChildren, atomic write, getChild, multi-depth tracking, empty defaults, no-op safety, totalChildren/maxDepth counts.

### Task 2: Immediate Child .json Write + Manifest Integration (D-06)

Modified `EventCapture.handleSessionCreated()` to write child .json files **immediately** at `session.created`, not deferred to PostToolUse `handleTask()`.

**Three-gate integration**:
| Gate | Source | Behavior |
|------|--------|----------|
| Gate 1 | SDK `parentID` | Write child .json + update manifest immediately |
| Gate 2 | `HierarchyIndex.isChild()` | Resolve parent via index, write .json + manifest |
| Gate 3 | `PendingDispatchRegistry.has()` | Use registry parentID, write .json + manifest |

**New method**: `writeImmediateChildFile()` — creates child .json under root main directory (via `ChildWriter.resolveWriteParent`), populates `delegatedBy` from `PendingDispatchRegistry`, registers child in `HierarchyIndex`, and updates `hierarchy-manifest.json`.

**Status update integration**: `handleSessionIdle/Deleted/Error` now update `hierarchy-manifest.json` via `manifestWriter.updateChildStatus()` in addition to existing `childWriter` and `sessionIndexWriter` updates.

**Wiring**: `HierarchyManifestWriter` instantiated in `SessionTracker.initialize()` and passed to `EventCapture` constructor.

**6 new tests + integration**: immediate write verification, manifest sync, root exclusion, delegatedBy metadata flow, Gate 2/3 coverage.

### Task 3: Hardened Orphan Cleanup + E2E Verification (D-08)

Enhanced `cleanupOrphanDirectories()` with dual-check logic:
1. **Primary**: `HierarchyIndex.isChild()` → classify as orphan
2. **Secondary**: Missing `session-continuity.json` + classified as child → likely race-condition orphan

Audit logging includes the reason for each removal.

**4 new E2E scenarios**:
- Child .json written immediately, no directory created
- `hierarchy-manifest.json` created with correct content in root main directory
- Orphan directories cleaned up on re-initialization
- All 3 children .json files stored under root main directory

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing `registerChild` mock in test setup**
- **Found during:** Task 2 test verification
- **Issue:** `writeImmediateChildFile()` calls `hierarchyIndex.registerChild()` before `getRootMain()`, but the test mock didn't include `registerChild`
- **Fix:** Added `registerChild: vi.fn()` to the mock `hierarchyIndex` object in `event-capture.test.ts`
- **Files modified:** `tests/features/session-tracker/capture/event-capture.test.ts`
- **Commit:** `de9f25cd`

**2. [Rule 1 - Bug] Fixed root main resolution for fresh children**
- **Found during:** E2E test failure (`writes hierarchy-manifest.json in root main directory`)
- **Issue:** `getRootMain(childID)` returned `undefined` for newly created children because `registerChild()` had not been called yet
- **Fix:** Added `this.hierarchyIndex.registerChild(parentID, sessionID)` call before `getRootMain()` in `writeImmediateChildFile()`
- **Files modified:** `src/features/session-tracker/capture/event-capture.ts`
- **Commit:** `de9f25cd`

## Verification Results

| Check | Result |
|-------|--------|
| `npm run typecheck` | ✅ PASS (zero errors) |
| `npx vitest run tests/features/session-tracker/` | ✅ 338/340 pass (2 pre-existing cleanup.test.ts failures) |
| Hierarchy manifest creation | ✅ hierarchy-manifest.json written in root main directory |
| Immediate child .json write | ✅ Child .json exists after session.created, no orphan directory |
| Orphan cleanup | ✅ Orphan directories removed on re-initialization |
| Multi-child routing | ✅ All 3 children .json under root main directory |

## Commits

| Hash | Message |
|------|---------|
| `1ba685ce` | feat(CP-ST-04-03): implement hierarchy-manifest.json writer (D-07) |
| `bddca2dd` | feat(CP-ST-04-03): immediate child .json write at session.created + manifest integration (D-06, D-07) |
| `de9f25cd` | feat(CP-ST-04-03): harden orphan directory cleanup + e2e verification (D-08) |

## Known Stubs

None — all created files have complete implementations. No placeholder values, TODO markers, or mock-only implementations exist in the delivered code.

## Threat Flags

None — threat model mitigations (T-04-09 through T-04-12) implemented: atomic write for manifest corruption prevention, `isValidSessionID` guard for path injection, `delegatedBy` sourced from `PendingDispatchRegistry` (not untrusted input).

## Self-Check: PASSED

- [x] `src/features/session-tracker/persistence/hierarchy-manifest.ts` exists
- [x] `tests/features/session-tracker/persistence/hierarchy-manifest.test.ts` exists
- [x] `1ba685ce` commit confirmed in git log
- [x] `bddca2dd` commit confirmed in git log
- [x] `de9f25cd` commit confirmed in git log
- [x] `npm run typecheck` passes
- [x] 338/340 session-tracker tests pass
