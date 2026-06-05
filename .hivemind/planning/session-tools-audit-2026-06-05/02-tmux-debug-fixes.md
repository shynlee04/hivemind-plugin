[LANGUAGE: Write this file in en per Language Governance.]
# Tmux Integration Debug Fixes

**Date:** 2026-06-05
**Bug ID:** tmux-integration-race-and-observer
**Status:** RESOLVED
**Classification:** RUNTIME (race condition + wiring gap)
**Agent:** hm-debugger (subagent)

---

## Summary

Three issues were investigated in the tmux integration subsystem. Two required code fixes; one was verified as correct behavior.

| Issue | Status | File Changed |
|-------|--------|-------------|
| Persistence ENOENT race | **FIXED** | `src/features/tmux/persistence.ts` |
| spawnTmuxPanelForChild UNWIRED | **VERIFIED CORRECT** | No change needed |
| Observer Wiring Gap | **FIXED** | `src/plugin.ts` |

---

## Issue 1: Persistence ENOENT Race (persistence.ts:265)

### Root Cause

`createSessionPersistence` at line 265 fired `void mkdir(stateRoot, { recursive: true }).catch(...)` as a fire-and-forget. When `persist()` was called immediately after, the parent directory might not exist yet. While `persist()` had its own defensive `await mkdir()` at line 315, `restoreAll()` and `remove()` had no such protection.

### Hypothesis Log

**H1: Fire-and-forget mkdir races with first persist() call**
- **Predicted evidence:** ENOENT errors in logs when persist() is called immediately after factory creation
- **Test:** Read persistence.ts lines 254-325
- **Result:** CONFIRMED — fire-and-forget at line 265, no await in restoreAll() or remove()
- **Evidence:** restoreAll() does `readdir(stateRoot)` without prior mkdir; remove() does `unlink()` without prior mkdir

**H2: The `{recursive: true}` flag should handle all parent dirs**
- **Predicted evidence:** mkdir with recursive:true creates all intermediate directories
- **Test:** Read Node.js fs.mkdir docs
- **Result:** CONFIRMED — but the race is between the fire-and-forget and the first file operation
- **Evidence:** The issue is timing, not directory creation capability

### Fix Applied

**File:** `src/features/tmux/persistence.ts`

Changed the fire-and-forget `void mkdir(...)` to a stored promise `const dirReady = mkdir(...)`.

All methods that access `stateRoot` now `await dirReady` before file operations:
- `persist()` — awaits dirReady (replaced redundant `await mkdir()`)
- `restoreAll()` — awaits dirReady before `readdir()`
- `remove()` — awaits dirReady before `unlink()`

### Evidence Trail

- `persistence.ts:265` — fire-and-forget converted to stored promise
- `persistence.ts:316` — persist() awaits dirReady
- `persistence.ts:342` — remove() awaits dirReady
- `persistence.ts:369` — restoreAll() awaits dirReady

---

## Issue 2: spawnTmuxPanelForChild UNWIRED (coordinator.ts:688)

### Root Cause Analysis

Traced the full wiring chain:

1. `plugin.ts:500` — `createTmuxIntegrationIfSupported()` returns `TmuxIntegration | null`
2. `plugin.ts:606` — `tmuxIntegration` passed to `setupDelegationModules()`
3. `plugin.ts:435` — wrapped as `{ adapter: options.tmuxIntegration.adapter }` for coordinator
4. `coordinator.ts:687-691` — checks `this.deps.tmuxIntegration?.adapter`

### Finding

The wiring is **CORRECT**. The adapter is always defined when `tmuxIntegration` is non-null (see `integration.ts:411-449` — adapter is a plain object literal). The "UNWIRED" debug message is the **expected fallback** when tmux is unavailable in the environment (no tmux binary, not inside tmux session, etc.).

**No code change needed.** The silent no-op at `coordinator.ts:689` is correct D-04 graceful-fallback behavior.

---

## Issue 3: Observer Wiring Gap (plugin.ts:778-779)

### Root Cause

`sessionManager_.setObserver(adapter)` set the adapter as the SessionManager's pane observer. But the adapter's `onPaneCaptured` at `integration.ts:429-434` was intentionally a no-op:

```typescript
onPaneCaptured: (_event) => {
    // Intentionally empty: ...
},
```

This meant pane-captured events from the SessionManager's polling tick were silently dropped. The `tmuxObserver` (created at line 770-772) had registered pane-capture listeners (e.g., the pane-monitor hook), but they never received events because the adapter's no-op swallowed them.

### Hypothesis Log

**H1: Adapter's onPaneCaptured is a no-op, events are lost**
- **Predicted evidence:** pane-captured events never reach tmuxObserver's registered listeners
- **Test:** Read integration.ts:429-434 and observers.ts:173-184
- **Result:** CONFIRMED — adapter.onPaneCaptured is empty; tmuxObserver dispatches to registered listeners when called with `{ event }`
- **Evidence:** The SessionManager calls `this.observer?.onPaneCaptured(event)` which hits the no-op

**H2: The tmuxObserver should be the observer, not the adapter**
- **Predicted evidence:** tmuxObserver implements the function signature `(input: { event?: unknown }) => Promise<void>`
- **Test:** Read observers.ts:145-228
- **Result:** CONFIRMED — but PaneObserver expects `onPaneCaptured: (event) => void`, not the function signature
- **Evidence:** Need a bridge: adapter.onPaneCaptured → tmuxObserver({ event })

### Fix Applied

**File:** `src/plugin.ts`

Before calling `setObserver(adapter)`, replaced the adapter's no-op `onPaneCaptured` with a forwarder to the `tmuxObserver`:

```typescript
tmuxIntegration.adapter.onPaneCaptured = (event) => {
    void tmuxObserver({ event })
}
tmuxIntegration.sessionManager_.setObserver(tmuxIntegration.adapter)
```

This creates the event flow:
1. SessionManager captures pane → calls `observer.onPaneCaptured(event)`
2. Adapter's `onPaneCaptured` calls `tmuxObserver({ event })`
3. `tmuxObserver` dispatches to registered pane-capture listeners (pane-monitor hook)

### Evidence Trail

- `plugin.ts:783-788` — adapter.onPaneCaptured replaced with forwarder before setObserver
- `observers.ts:173-184` — tmuxObserver dispatches pane-captured events to registered listeners
- `session-manager.ts:183` — setObserver stores the PaneObserver for polling tick emission

---

## Typecheck Verification

```
$ npm run typecheck
> tsc --noEmit
(exit 0 — clean)
```

No type errors introduced by the fixes.

---

## Files Modified

| File | Change |
|------|--------|
| `src/features/tmux/persistence.ts` | Fire-and-forget mkdir → stored promise; await in persist/restoreAll/remove |
| `src/plugin.ts` | Wire adapter.onPaneCaptured → tmuxObserver forwarder before setObserver |

## Files Verified (No Change)

| File | Finding |
|------|---------|
| `src/coordination/delegation/coordinator.ts` | Wiring from plugin.ts is correct; UNWIRED is expected when tmux unavailable |
| `src/features/tmux/integration.ts` | Adapter creation is correct; factory returns null gracefully when tmux unavailable |
| `src/features/tmux/observers.ts` | PaneObserver interface and tmuxEventObserver dispatch are correct |
