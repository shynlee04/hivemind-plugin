---
phase: P44
plan: "01"
subsystem: capability-gate
tags: [test-fix, deduplication, constants, capability-map]
dependency_graph:
  requires: [P44-SPEC]
  provides: [capability-map-test-passing, single-source-tool-constants]
  affects: [src/features/capability-gate, src/coordination/spawner]
tech_stack:
  added: []
  patterns: [single-source-constant-import, enum-re-export]
key_files:
  created: []
  modified:
    - src/features/capability-gate/index.ts
    - src/coordination/spawner/spawn-request-builder.ts
    - tests/features/capability-gate/capability-map.test.ts
decisions:
  - Constants live in capability-gate as single source of truth; spawn-request-builder imports them
  - ToolCategory re-exported via `export { ToolCategory } from "./types.js"` pattern
  - Snapshot grant assertions use `.includes()` on arrays, not `.has()` on Sets
  - Stale index.js deleted — only index.ts remains
metrics:
  duration: 6m
  completed: 2026-05-31T20:20:26Z
  tasks: 2
  files: 3
---

# Phase 44 Plan 01: Fix Capability-Map Test & Deduplicate Constants Summary

Fix failing capability-map test and remove duplicated tool constants from spawn-request-builder by importing from the canonical capability-gate module.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 (Wave 1) | Fix capability-map test assertions and re-export ToolCategory | `59901351` | `src/features/capability-gate/index.ts`, `tests/features/capability-gate/capability-map.test.ts` |
| 2 (Wave 2) | Deduplicate READ_ONLY_TOOLS/WRITE_CAPABLE_TOOLS/WRITE_TOOLS in spawn-request-builder | `c2369357` | `src/coordination/spawner/spawn-request-builder.ts` |

## What Changed

### Wave 1 — Test Fix + Re-export
- **Test import path:** Changed from `../src/` to `../../../src/features/capability-gate/index.ts` (correct relative path)
- **Map size assertion:** Updated from 25 to 31 (7 built-in + 14 orphaned + 10 session-category tools)
- **6 new tool assertions added:** `session-delegation-query`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `hivemind-sdk-supervisor`, `session-patch`, `prompt-skim`
- **ToolCategory re-export:** Added `export { ToolCategory } from "./types.js"` to `index.ts`
- **Snapshot assertions fixed:** Changed `.has("read")` to `.includes("read")` (grants are arrays, not Sets)
- **Revoke assertion fixed:** Uses optional chaining + undefined check since `revokeCapability` cleans up empty agent entries
- **Stale file deleted:** Removed `src/features/capability-gate/index.js` (was exact copy of `.ts`, caused parse errors)

### Wave 2 — Constant Deduplication
- **Removed duplicates:** Deleted `READ_ONLY_TOOLS`, `WRITE_CAPABLE_TOOLS`, `WRITE_TOOLS` constant definitions from `spawn-request-builder.ts` lines 28-30
- **Added import:** `import { READ_ONLY_TOOLS, WRITE_CAPABLE_TOOLS, WRITE_TOOLS } from "../../features/capability-gate/index.js"`
- Single source of truth established in capability-gate module

## Verification

- `npx vitest run tests/features/capability-gate/capability-map.test.ts` — 7/7 passed
- `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts` — 7/7 passed
- `npm test` — 3037 passed, 2 skipped, 2 failed (pre-existing `state-root-migration.test.ts`)
- `grep -c "const READ_ONLY_TOOLS" src/coordination/spawner/spawn-request-builder.ts` — returns 0 (no duplicates)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

- `src/features/capability-gate/index.ts` — FOUND (in commit 59901351)
- `src/coordination/spawner/spawn-request-builder.ts` — FOUND (in commit c2369357)
- `tests/features/capability-gate/capability-map.test.ts` — FOUND (in commit 59901351)
- Commit `59901351` — FOUND in git log
- Commit `c2369357` — FOUND in git log
