---
phase: 23
plan: 01
wave: 1
subsystem: notification, session-api
tags: [synthetic, notification, stream-reactivation, noReply]
tech-stack:
  added: []
  patterns: [two-mechanism-notification, stream-reactivation, silent-injection]
key-files:
  modified:
    - src/coordination/completion/notification-handler.ts
    - src/shared/session-api.ts
    - tests/lib/notification-handler.test.ts
decisions:
  - D1: STALL_TIMEOUT_MS = 60000 fixed constant (no env var/config)
  - D2: Urgent notification = appendTuiPrompt() + synthetic:true body context
  - D3: Stream reactivation = send empty synthetic:true prompt before notification
metrics:
  duration: ~5 minutes
  completed_at: 2026-05-23
---

# Phase 23 Plan 01: Fix Notification Delivery Architecture — Two-Mechanism System + Stream Reactivation

**One-liner:** Two-mechanism notification delivery (silent injection + urgent TUI prompt) with stream reactivation using `synthetic: true` on all notification parts, `STALL_TIMEOUT_MS = 60000` constant, and typed `noReply` parameter in `sendPrompt()`.

## Changes Made

### `src/coordination/completion/notification-handler.ts`
- Added `export const STALL_TIMEOUT_MS = 60000` constant at module level (D1)
- Added `export async function reactivateSessionStream()` — sends empty `{ type: "text", text: "", synthetic: true }` with `noReply: true`. Best-effort try/catch (D3)
- Refactored `notifyParentSession()` to support two-mechanism delivery with `options?: { urgent?: boolean }`:
  - **Silent (non-terminal):** `noReply: true`, `parts: [{ type: "text", text, synthetic: true }]`
  - **Urgent (terminal):** calls `appendTuiPrompt()` + `showTuiToast()`, then `noReply: false`, `parts: [{ type: "text", text, synthetic: true }]`
  - Auto-determine urgency from `task.status === "failed" || task.status === "completed"` (D2)
- Updated `notifyDelegationTerminal()`: added `synthetic: true` to inline body + stream reactivation before delivery
- Imported `appendTuiPrompt` from `session-api.ts`

### `src/shared/session-api.ts`
- Added `noReply?: boolean` parameter to `sendPrompt()` function signature
- Merged `noReply` into `SessionPromptData.body` via spread when provided

### `tests/lib/notification-handler.test.ts`
- Extended fake client with `tui.appendPrompt` and `app.log` mocks
- Added `synthetic: true` assertion to existing send prompt test
- Added silent delivery test (non-terminal status → `noReply:true` + `synthetic:true`)
- Added urgent delivery test (terminal status → `appendTuiPrompt` + `noReply:false` + `synthetic:true`)
- Added explicit silent override test (`urgent: false`)
- Added `reactivateSessionStream()` test (empty synthetic prompt)
- Added `notifyDelegationTerminal()` body construction test

## Deviations from Plan

None — plan executed exactly as written.

## Verification

| Check | Result |
|-------|--------|
| `npx vitest run tests/lib/notification-handler.test.ts` | PASS (18/18) |
| `npm run typecheck` | PASS |
| `grep -c "synthetic: true" src/coordination/completion/notification-handler.ts` | 3 (≥ 2) |
| `grep -c "STALL_TIMEOUT_MS = 60000" notification-handler.ts` | 1 |
| `grep -c "reactivateSessionStream" notification-handler.ts` | 3 (definition + 2 calls) |
| `grep -c "appendTuiPrompt" notification-handler.ts` | 2 (import + call) |
| `grep -c "synthetic" tests/lib/notification-handler.test.ts` | 16 (≥ 3) |
| `message-capture.ts` line 356 | UNCHANGED (still filters synthetic correctly) |

## Self-Check: PASSED
