---
phase: 02-unified-runtime-operations
plan: 00
subsystem: ui
tags: [bun, opentui, runtime-status, zod, workspace]

# Dependency graph
requires:
  - phase: 01-runtime-authority-baseline
    provides: managed and attached runtime authority seams plus the Phase 1 status snapshot builder
provides:
  - Bun-owned `apps/opentui` workspace boundary for runtime operations work
  - Shared runtime-status contract for backend and OpenTUI consumers
  - Minimal OpenTUI runtime status screen bound to backend-owned data
affects: [02-unified-runtime-operations, 08-tui-stabilization-on-backend-truth]

# Tech tracking
tech-stack:
  added: [bun]
  patterns:
    - Bun app boundary isolated under `apps/opentui` while the shipped package stays Node-based
    - Shared runtime status contract in `src/shared/contracts` parsed at the TUI adapter boundary

key-files:
  created:
    - docs/plans/bun-bootstrap-2026-03-18.md
    - apps/opentui/package.json
    - apps/opentui/tsconfig.json
    - apps/opentui/src/main.tsx
    - apps/opentui/src/adapters/runtime-client.ts
    - apps/opentui/src/views/runtime-status.tsx
    - apps/opentui/tests/runtime-status.test.tsx
    - src/shared/contracts/runtime-status.ts
  modified:
    - package.json

key-decisions:
  - "Use `apps/opentui` as the Bun-owned app boundary while leaving the root package on the shipped Node runtime."
  - "Keep the first OpenTUI screen limited to parsed backend-owned runtime status fields instead of reviving the old mock-heavy dashboard spike."

patterns-established:
  - "Runtime contract parsing happens in the app adapter via `runtimeStatusSchema.parse(...)`."
  - "OpenTUI app verification uses `bun test` and app-local TypeScript config, not the legacy Node OpenTUI lane."

requirements-completed: [CTRL-03]

# Metrics
duration: 9 min
completed: 2026-03-17
---

# Phase 2 Plan 00: TUI Infrastructure Foundation Summary

**Bun-backed `apps/opentui` workspace with a shared runtime-status contract and a minimal backend-driven operator status screen**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-17T23:10:36Z
- **Completed:** 2026-03-17T23:20:13Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Bootstrapped Bun locally and documented the Wave 0 prerequisite before any OpenTUI app work.
- Created a real `apps/opentui` Bun workspace boundary with `dev`, `test`, and `typecheck` scripts.
- Added `src/shared/contracts/runtime-status.ts` so backend and TUI code share one runtime status contract.
- Replaced the old spike path for this slice with a minimal `RuntimeStatusView` that renders runtime authority, server URL, entry state, QA state, and workflow identifiers.

## Task Commits

Each task was committed atomically:

1. **Task 0: Add Bun bootstrap preflight before any app-boundary work** - `2f80905` (docs)
2. **Task 1 RED: Create the Bun/OpenTUI workspace boundary and Bun test lane** - `0bc3212` (test)
3. **Task 1 GREEN: Create the Bun/OpenTUI workspace boundary and Bun test lane** - `16a2cc8` (feat)
4. **Task 2: Define shared runtime-status contracts and the minimal status app** - `5cd4191` (feat)

**Plan metadata:** pending

## Files Created/Modified
- `docs/plans/bun-bootstrap-2026-03-18.md` - Wave 0 Bun install and verification gate for Phase 2.
- `package.json` - Workspace declaration for `apps/*` without changing the shipped Node package runtime.
- `apps/opentui/package.json` - Bun-owned OpenTUI app scripts and dependencies.
- `apps/opentui/tsconfig.json` - Isolated app typecheck configuration.
- `apps/opentui/src/main.tsx` - OpenTUI renderer bootstrap entrypoint.
- `apps/opentui/src/adapters/runtime-client.ts` - Thin adapter that parses backend-owned runtime status through the shared schema.
- `apps/opentui/src/views/runtime-status.tsx` - Minimal status screen bound to authoritative runtime fields.
- `apps/opentui/tests/runtime-status.test.tsx` - Bun test lane covering workspace boundary and contract parsing.
- `src/shared/contracts/runtime-status.ts` - Shared Zod runtime status contract plus inferred TypeScript type.

## Decisions Made
- `apps/opentui` becomes the authoritative Bun app boundary for OpenTUI work; `src/tui` remains migration source material only.
- The first screen stays intentionally small and renders parsed backend-owned runtime status instead of tabs, SSE streams, or mock wiki structures.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed the app typecheck lane to avoid unresolved Bun-only type libraries**
- **Found during:** Task 2 (Define shared runtime-status contracts and the minimal status app)
- **Issue:** The first `apps/opentui/tsconfig.json` draft referenced Bun type libraries that were not installed locally, which broke the `typecheck` script.
- **Fix:** Narrowed app typechecking to `src/**` and kept only Node typings so the app compile lane stays runnable while Bun owns test execution.
- **Files modified:** `apps/opentui/tsconfig.json`
- **Verification:** `bun x tsc --noEmit -p apps/opentui/tsconfig.json`
- **Committed in:** `5cd4191`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix kept the Bun app verification lane operational without expanding scope beyond the infrastructure slice.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `apps/opentui` now exists as a real Bun boundary, so `02-01` can deepen the backend inspection seam instead of reviving the orphan dashboard spike.
- Shared runtime status contracts are in place for later runtime-tool and workflow-event expansion.
- Ready for `02-01-PLAN.md`.

## Self-Check: PASSED

- Verified `.planning/phases/02-unified-runtime-operations/02-00-SUMMARY.md` exists on disk.
- Verified task commits `2f80905`, `0bc3212`, `16a2cc8`, and `5cd4191` exist in git history.

---
*Phase: 02-unified-runtime-operations*
*Completed: 2026-03-17*
