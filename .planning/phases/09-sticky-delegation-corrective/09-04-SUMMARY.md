---
phase: 09
plan: 09-04
status: complete
started: 2026-04-10T19:30:00Z
completed: 2026-04-10T19:46:00Z
key_files:
  created:
    - .planning/phases/09-sticky-delegation-corrective/09-04-SUMMARY.md
  modified:
    - src/tools/delegate-task.ts
    - src/lib/types.ts
    - src/lib/lifecycle-manager.ts
    - tests/tools/delegate-task.test.ts
    - tests/tools/delegate-task-overflow.test.ts
---

## Plan 09-04: Async Dispatch Contract Renaming

### What was built
Renamed the `run_in_background` parameter to `async_dispatch` across the delegate-task tool schema and eliminated the naming collision with the OS-level `background` tool. Added explicit launch-time dispatch configuration fields (`defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs`) to the tool schema, with auto-derived defaults when not specified. Wired these values through to the lifecycle manager's `launchDelegatedSession` and persisted them in session continuity metadata.

### Changes made
1. **src/tools/delegate-task.ts**: 
   - Renamed `run_in_background` → `async_dispatch` in `DelegateTaskArgs` type and Zod schema
   - Updated tool description text to reference `async_dispatch` 
   - Added optional schema fields: `defaultDispatchMode` ("async"|"sync"), `tmuxAvailability` ("auto"|"enabled"|"disabled"), `pollIntervalMs` (3000|5000|15000)
   - `buildTaskCharacteristics` now reads `args.async_dispatch` instead of `args.run_in_background`
   - Computes effective defaults before calling `launchDelegatedSession`: dispatch mode from async_dispatch flag, tmux availability from env detection, poll interval defaults to 3000ms

2. **src/lib/types.ts**: 
   - Added `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs` to `SessionContinuityMetadata`

3. **src/lib/lifecycle-manager.ts**: 
   - Extended `LaunchDelegatedSessionArgs` with the three new config fields
   - Persists dispatch config into continuity record on session creation

4. **tests/tools/delegate-task.test.ts**: 
   - All `run_in_background` calls replaced with `async_dispatch`
   - Added assertions verifying `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs` are present in launch args with valid enum values
   - Added negation test: tool description must not contain "run_in_background"

5. **tests/tools/delegate-task-overflow.test.ts**: 
   - All `run_in_background` calls replaced with `async_dispatch`

### Verification
- `npx vitest run tests/tools/delegate-task.test.ts tests/tools/delegate-task-overflow.test.ts` — **20/20 passed**
- Zero `run_in_background` references remain in touched source files (test negation assertion confirms)

### Self-Check
- [x] All tasks executed
- [x] Each task committed individually
- [x] SUMMARY.md created
- [x] No `run_in_background` in src/tools/delegate-task.ts
- [x] Schema includes `defaultDispatchMode`, `tmuxAvailability`, `pollIntervalMs`
- [x] Lifecycle manager receives and stores launch-time config values
- [x] Tests pass with new arg names only
