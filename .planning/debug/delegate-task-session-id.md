---
status: investigating
trigger: delegate-task blocks on sessionID check even though OpenCode Plugin SDK always injects sessionID
created: 2026-05-20
updated: 2026-05-20
---

## Symptoms

- Agent cannot call `delegate-task` tool in live UAT — tool errors with "requires OpenCode plugin runtime environment"
- Session log (ses_1be9) shows agent loads skills, reads code, but NEVER invokes delegate-task
- `ToolContext` in delegate-task.ts declares `sessionID?: string` (optional) but OpenCode Plugin SDK type has `sessionID: string` (required)

## Current Focus

**Hypothesis:** `delegate-task.ts` line 46-53 checks `if (!parentSessionId)` and errors, but `context.sessionID` from OpenCode Plugin SDK is ALWAYS a required string. The check is dead code that triggers a misleading error message.

**Evidence collected:**
1. DeepWiki verified `anomalyco/opencode/packages/plugin/src/tool.ts` → `ToolContext = { sessionID: string, ... }` — sessionID is REQUIRED, NOT optional
2. `delegate-task.ts:16-20` declares `type ToolContext = { sessionID?: string }` — WRONG, should be `sessionID: string`
3. `delegate-task.ts:46-53` checks `if (!parentSessionId)` → this NEVER fails in real OpenCode runtime because sessionID is always injected
4. `isOpenCodeRuntimeAvailable()` function (lines 22-24) is dead code — no longer referenced after removing the error path
5. Test at line 307 checks `"requires an OpenCode plugin runtime environment"` — test asserts WRONG behavior
6. Test at lines 357-375 checks `"framework-level context injection failure"` — also asserts WRONG behavior

**Prediction:** If we fix the type to `sessionID: string` and remove the `if (!parentSessionId)` block, the tool will always succeed in getting parentSessionId from context without error.

**next_action:** Apply fix: (1) fix ToolContext type, (2) remove sessionID check block, (3) remove dead functions, (4) update tests

## Eliminated

- _Not the issue: plugin not loading._ Plugin IS loaded (configured in opencode.json, dist/plugin.js exists). Root cause is the type+check itself.
- _Not the issue: env vars._ `process.env.OPENCODE_SESSION_ID` not being set is expected — the SDK injects via context, not env.

## Resolution

_root_cause:_
_fix:_
_verification:_
_files_changed:_
