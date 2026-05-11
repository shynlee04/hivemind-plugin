---
status: fixing
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
- **2026-05-12:** OpenCode SDK v2 provides `client.app.log({ service, level, message, extra })` for structured logging AND `client.tui.showToast({ title, message, variant, duration })` for TUI toasts.
- **2026-05-12:** SessionTracker and most submodules already receive `client: OpenCodeClient`.
- **2026-05-12:** Phase 12 commits (`c16b103f`, `4e2c1d78`, `ac03c799`) confirmed as origin.

## Eliminated

## Current Focus

- hypothesis: (CONFIRMED) Phase 12 session-tracker uses `console.*` (raw stdout/stderr) instead of `client.app.log()`/`client.tui.showToast()`, causing raw `[Harness]` text to leak to terminal.
- test: Verified OpenCode SDK APIs exist. Fix: replace all console.* with client.app.log()/client.tui.showToast().
- expecting: After fix, no more raw `[Harness]` terminal output; messages routed through TUI pipeline.
- next_action: Implement fix across all affected files. GOVERNANCE: MUST live-fetch OpenCode SDK v2 API docs for client.app.log() and client.tui.showToast() signatures — NO stale references. Check engine-level files too (state-machine, notification-handler). Target latest OpenCode compatibility.

## Resolution

- root_cause: Phase 12 session-tracker feature and plugin.ts error handlers use `console.warn()`/`console.log()`/`console.error()` which write directly to stdout/stderr in the TUI environment, bypassing the OpenCode TUI rendering pipeline. The OpenCode SDK v2 provides `client.app.log()` (structured, TUI-integrated logging) and `client.tui.showToast()` (TUI toast notifications) — neither is used.
- fix: Replace all `console.*` calls with `client.app.log()` for error/status logging and `client.tui.showToast()` for user-visible initialization notification.
- verification: PENDING — need to typecheck and verify no `console.*` calls remain in affected modules.
- files_changed:
  - src/features/session-tracker/index.ts
  - src/plugin.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/recovery/session-recovery.ts
  - src/coordination/delegation/state-machine.ts
  - src/coordination/completion/notification-handler.ts
