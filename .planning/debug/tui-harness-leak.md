---
status: verifying
trigger: "TUI is leaked with terminal crash these notifications must all be wired to TOAST of TUI using SDK API of of OpenCode"
created: "2026-05-12"
updated: "2026-05-12"
---

# Debug: TUI Harness Notification Leak

## Symptoms

- **Expected:** Notifications/warnings from harness should appear as TUI toasts (via OpenCode SDK toast API)
- **Actual:** Raw text (including `[Harness]` prefixed error messages) leaks into the terminal, corrupting the TUI view and potentially causing terminal crashes
- **Errors:** `[Harness]`-prefixed messages appear as raw terminal text instead of TUI toast notifications
- **Timeline:** Started after Phase 12 (session tracker tool redesign and writer engine fixes)
- **Reproduction:** Occurs when tools or hooks fire — `[Harness]`-prefixed lines leak to terminal
- **Scope:** Introduced by Phase 12 changes — session-tracker, session-hierarchy, session-context tool refactors, or related plugin.ts changes

## Evidence

- **2026-05-12:** Searched `src/` for `console.*` calls — found 30+ `console.warn()`/`console.log()` calls in session-tracker ecosystem, 3 in plugin.ts, 1 in state-machine.ts, 1 in notification-handler.ts.
- **2026-05-12:** OpenCode SDK v2 `AppLogData` type CONFIRMED from anomalyco/opencode source: REQUIRES `body: { service, level, message, extra }` wrapper. `TuiShowToastData` requires `body: { title, message, variant, duration }`.
- **2026-05-12:** Phase 12 commits (`c16b103f`, `4e2c1d78`, `ac03c799`) confirmed as origin.
- **2026-05-12:** Three additional files discovered with remaining `console.warn()`: `project-index-writer.ts` (2), `tool-capture.ts` (2), `message-capture.ts` (3). These lacked `client` constructor injection.
- **2026-05-12:** FIX APPLIED: 37 console.* calls replaced with `client.app?.log?.({ body: {...} })` across 10 source files. 3 sub-modules received `client: OpenCodeClient` injection. 8 test files updated. `showToast` uses `{ body: {...} }` wrapper.
- **2026-05-12:** Typecheck: PASS (zero errors). Tests: 2068 passed. Console.* grep: ZERO matches in affected modules.

## Eliminated

## Current Focus

- hypothesis: (CONFIRMED) Phase 12 session-tracker uses `console.*` (raw stdout/stderr) instead of `client.app?.log?.()` / `client.tui?.showToast?.()`, causing raw `[Harness]` text to leak to terminal. Fix applied — all 37 console calls replaced with body-wrapped SDK v2 API calls.
- test: Typecheck PASS. Console.* grep CLEAN across all affected modules. Tests PASS (2068/2068). Self-verification complete.
- expecting: After fix, no more raw `[Harness]` terminal output; messages routed through TUI pipeline. Ready for human verification in real OpenCode runtime.
- next_action: Present CHECKPOINT for human verification in production workflow.

## Resolution

- root_cause: Phase 12 session-tracker feature and plugin.ts error handlers use `console.warn()`/`console.log()`/`console.error()` which write directly to stdout/stderr in the TUI environment, bypassing the OpenCode TUI rendering pipeline. The OpenCode SDK v2 `AppLogData` type requires a `body: { service, level, message, extra }` wrapper — neither was used.
- fix: Replaced all 37 `console.*` calls with `client.app?.log?.({ body: { service, level, message, extra } })` using optional-chaining for test compatibility. Added `client: OpenCodeClient` constructor injection to 3 sub-modules (project-index-writer, tool-capture, message-capture). Updated 8 test files. `showToast` uses `{ body: {...} }` wrapper.
- verification: Self-verified — typecheck PASS, console.* grep CLEAN, tests PASS (2068). Awaiting human verification in real OpenCode runtime.
- files_changed:
  - src/features/session-tracker/index.ts (8 calls + 3 constructor updates)
  - src/plugin.ts (3 calls)
  - src/features/session-tracker/capture/event-capture.ts (9 calls)
  - src/features/session-tracker/recovery/session-recovery.ts (6 calls)
  - src/coordination/delegation/state-machine.ts (1 call)
  - src/coordination/completion/notification-handler.ts (1 call)
  - src/features/session-tracker/capture/tool-capture.ts (2 calls + client injection)
  - src/features/session-tracker/capture/message-capture.ts (3 calls + client injection)
  - src/features/session-tracker/persistence/project-index-writer.ts (2 calls + client injection)
  - src/coordination/delegation/manager.ts (1 call)
  - tests/features/session-tracker/capture/message-capture.test.ts
  - tests/features/session-tracker/capture/tool-capture.test.ts
  - tests/features/session-tracker/capture/tool-capture-child.test.ts
  - tests/features/session-tracker/persistence/project-index-writer.test.ts
  - tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts
  - tests/features/session-tracker/capture/event-capture.test.ts
  - tests/lib/delegation-state-machine.test.ts
  - tests/lib/delegation-manager.test.ts
