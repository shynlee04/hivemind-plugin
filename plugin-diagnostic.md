# Harness Plugin Diagnostic Report

**Date:** 2026-04-09
**Issue:** Tools not executing, hooks not running

## ✅ Verified Working

1. **Build:** TypeScript compiles cleanly, zero errors
2. **Tests:** 533 tests pass (34 files)
3. **Plugin Export:** `HarnessControlPlane` function exported correctly
4. **Plugin Init:** Returns correct shape with all hooks and tools:
   - Hooks: `event`, `system.transform`, `experimental.chat.system.transform`, `messages.transform`, `shell.env`, `experimental.session.compacting`, `tool.execute.before`, `tool.execute.after`
   - Tools: `background`, `delegate-task`, `prompt-skim`, `prompt-analyze`, `session-patch`
5. **Zod Schema:** Using correct v4 API (`tool.schema.string()`)
6. **opencode.json:** Plugin registered as `./dist/plugin.js`

## 🔍 Potential Issues

### 1. Hook Early Returns
Hooks have multiple guard conditions that cause them to return without doing anything:

**create-core-hooks.ts:**
```typescript
// Event hook
if (!eventType || !sessionID) return  // Line 135

// system.transform
if (!sessionID) return               // Line 99
if (!continuity) return              // Line 103
if (!hasAnyInjection(evaluation.injections)) return  // Line 118
```

**create-session-hooks.ts:**
```typescript
// session.compacting
if (!sessionID) return               // Similar pattern
```

**Root Cause:** If session continuity data doesn't exist or session ID is missing, hooks exit silently.

### 2. Missing Continuity State
The plugin calls `lifecycleManager.hydrateFromContinuity()` on startup. If the continuity file doesn't exist or is empty, lifecycle manager may not have proper state to work with.

### 3. Tool Execution Path
Tools are registered but may not be called if:
- Agent instructions don't reference them
- Permission model blocks them (though opencode.json shows all allowed)
- Tools require specific session context that isn't being set up

## 🎯 Recommended Next Steps

1. **Add Debug Logging:** Add console.log to hook entry points to verify they're being called
2. **Check Continuity File:** Verify `.opencode/state/opencode-harness/` exists and has data
3. **Test Tool Invocation:** Manually try to call a tool from an OpenCode session
4. **Check OpenCode Logs:** Look for plugin loading errors or hook execution traces

## Files Created
- `.opencode/plugins/harness-control-plane.ts` - Thin wrapper for dev loading
