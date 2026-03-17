---
phase: 01-runtime-authority-baseline
plan: 01
subsystem: runtime-authority
tags: [opencode-sdk, runtime-lifecycle, supervisor, status-reporting, control-plane]

# Dependency graph
requires:
  - phase: none (first phase)
    provides: N/A
provides:
  - SDK-owned managed runtime lifecycle helper (createOpencode wrapper)
  - Persisted runtime authority fields (runtimeAuthority, runtimeInstanceId, serverBaseUrl)
  - Supervisor/status surfaces wired to the same authority record
  - hm-init explicitly records managed-sdk runtime ownership
  - hivemind_runtime_status reports coherent authority identity
affects:
  - 01-runtime-authority-baseline (plan 01-02 attaches to existing runtime)
  - 02-unified-runtime-operations (depends on authority seam)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SDK-first runtime lifecycle via @opencode-ai/sdk createOpencode/createOpencodeClient
    - Additive authority fields through intersection types on RuntimeAttachmentSettings
    - Supervisor instance registry as validated schema-kernel records
    - Runtime status snapshot combining attachment + supervisor + kernel state

key-files:
  created:
    - src/control-plane/sdk-runtime.ts — Official SDK runtime lifecycle helper for managed create/attach operations
  modified:
    - src/shared/runtime-attachment.ts — Added RuntimeAuthority type, AttachmentRuntimeAuthority interface, authority fields throughout settings/builder/loader/saver
    - src/sdk-supervisor/instance-registry.ts — Extended RegisterSupervisorInstanceInput with runtimeAuthority/runtimeInstanceId/serverBaseUrl
    - src/sdk-supervisor/runtime-status.ts — Extended RuntimeStatusSnapshot and buildRuntimeStatusSnapshot with authority fields
    - src/control-plane/control-plane-handler.ts — hm-init invokes createManagedRuntime and saves managed-sdk authority fields
    - src/tools/runtime/tools.ts — hivemind_runtime_status returns runtimeAuthority/runtimeInstanceId/serverBaseUrl from persisted snapshot
    - tests/runtime-entry-attachment.test.ts — Added integration test asserting consistent authority across hm-init → snapshot → status tool
    - tests/sdk-supervisor-instance.test.ts — Added tests for authority fields in registry, health summary, status report, and kernel snapshot

key-decisions:
  - "SDK-first: createOpencode/createOpencodeClient are the only runtime lifecycle entrypoints; no custom runtime creation"
  - "Authority fields use intersection types: AttachmentRuntimeAuthority composed into RuntimeAttachmentSettings via & for backward compatibility"
  - "hm-init closeAfterCreate defaults to true: creates runtime to capture identity, then closes to avoid port conflicts during init"
  - "Supervisor status reports the same authority fields from the persisted attachment snapshot — one coherent record"

patterns-established:
  - "Control-plane SDK helper pattern: thin wrapper around official SDK lifecycle, owned by control-plane not plugin"
  - "Additive field pattern: new authority fields added via intersection types, not modifying existing type definitions"

requirements-completed: [CTRL-01]

# Metrics
duration: ~15 min (continuation verification; prior work committed in 2 sessions)
completed: 2026-03-18
---

# Phase 1 Plan 01: Managed Runtime Authority Baseline Summary

**SDK-owned runtime lifecycle helper with persisted authority fields (runtimeAuthority, runtimeInstanceId, serverBaseUrl) wired consistently across attachment, supervisor, status, and hm-init surfaces**

## Performance

- **Duration:** ~15 min (continuation session; prior work in 2 earlier commits)
- **Started:** 2026-03-18T03:19:30Z (from WIP commit timestamp)
- **Completed:** 2026-03-17T20:54:36Z (UTC)
- **Tasks:** 3 (all complete)
- **Files modified:** 8 (1 created, 7 modified)

## Accomplishments
- Created `src/control-plane/sdk-runtime.ts` — the sole Phase 1 helper wrapping official `@opencode-ai/sdk` `createOpencode()` and `createOpencodeClient()` lifecycle entrypoints
- Added `RuntimeAuthority` type and `AttachmentRuntimeAuthority` interface to `src/shared/runtime-attachment.ts`, persisted throughout settings load/save/builder paths
- Extended supervisor instance registry and runtime-status snapshots with authority fields so reporting surfaces carry one coherent record
- Wired `hm-init` to invoke `createManagedRuntime()` and persist `runtimeAuthority: 'managed-sdk'` alongside the generated instance ID and server URL
- Extended `hivemind_runtime_status` tool payload to expose `runtimeAuthority`, `runtimeInstanceId`, and `serverBaseUrl` from the same persisted source
- Wrote integration test asserting consistent authority across the full hm-init → snapshot → status-tool pipeline

## Task Commits

1. **Task 1: Add SDK-owned managed runtime lifecycle helper** — `0e17bf8` (feat)
2. **Task 2: Rewire hm-init and runtime status to managed authority seam** — `c0bcaff` (feat)
3. **Task 3: Run Phase 1 baseline verification gate** — Verified (tests pass, tsc clean)

**WIP marker:** `8502d22` (paused at task 3/3 — resumed and completed in this session)

## Files Created/Modified
- `src/control-plane/sdk-runtime.ts` — New SDK lifecycle helper with `createManagedRuntime()` and `attachManagedRuntime()`
- `src/shared/runtime-attachment.ts` — `RuntimeAuthority` type, `AttachmentRuntimeAuthority` interface, authority fields in defaults/builder/loader/saver
- `src/sdk-supervisor/instance-registry.ts` — Extended `RegisterSupervisorInstanceInput` with authority fields
- `src/sdk-supervisor/runtime-status.ts` — `RuntimeStatusSnapshot` includes authority fields; `buildRuntimeStatusSnapshot` passes them through
- `src/control-plane/control-plane-handler.ts` — `runInit` calls `createManagedRuntime()` and saves authority via `saveRuntimeAttachmentSettings`
- `src/tools/runtime/tools.ts` — `runtimeState` payload includes `runtimeAuthority`, `runtimeInstanceId`, `serverBaseUrl`
- `tests/runtime-entry-attachment.test.ts` — Integration test for managed runtime authority consistency
- `tests/sdk-supervisor-instance.test.ts` — Tests for authority fields in registry/health/status/kernel snapshot

## Decisions Made
- SDK-first runtime lifecycle: `createOpencode()`/`createOpencodeClient()` are the only entrypoints — no custom runtime creation
- Authority fields use intersection types for backward-compatible extension of `RuntimeAttachmentSettings`
- `hm-init` creates runtime to capture identity then closes (`closeAfterCreate: true` default) to avoid port conflicts
- Supervisor status reports the same persisted authority — one coherent record across all surfaces

## Deviations from Plan

None — plan executed exactly as written. Pre-existing TypeScript errors that blocked the previous session were resolved in the intervening commits (unrelated tool module typing fixes), allowing `npx tsc --noEmit` to pass cleanly.

## Issues Encountered

None in this session. Previous session was blocked by pre-existing repo-wide TypeScript errors outside plan scope (documented in `deferred-items.md`). Those errors were subsequently resolved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Managed-runtime authority baseline is established and verified
- Ready for Plan 01-02: Normalize attach semantics and prevent competing runtime instances
- Plan 01-02 will use `attachManagedRuntime()` to bind to existing runtimes via `attached-sdk` authority mode
- The authority seam (`runtimeAuthority`, `runtimeInstanceId`, `serverBaseUrl`) is now available across all Phase 1 surfaces

## Self-Check: PASSED

All key files verified on disk. All task commits verified in git history.

---
*Phase: 01-runtime-authority-baseline*
*Completed: 2026-03-18*
