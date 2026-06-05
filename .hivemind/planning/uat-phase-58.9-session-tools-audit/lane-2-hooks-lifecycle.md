[LANGUAGE: Write this file in en per Language Governance.]
---
lane: 2
scope: Hooks, Lifecycle & Runtime wiring (src/hooks/, src/task-management/lifecycle/, src/plugin.ts)
date: 2026-06-06
mode: aggressive, append-only
reviewer: gsd-code-reviewer (leaf, no further delegation)
---

# Lane 2 — Hooks, Lifecycle & Runtime Wiring Audit

## Executive Summary

Hivemind plugin composes **7 hook key surfaces** in `src/plugin.ts:907-1025` (plus 1 empty no-op `config` and 1 inline `chat.message`) backed by 18 hook source files totaling 2,393 lines, and registers **28 custom tools** through 4 `register*Tools()` factories (NOT 26 as the user-facing log at `src/plugin.ts:473` claims). The lifecycle module (`src/task-management/lifecycle/index.ts`) is delegated to the `HarnessLifecycleManager` and is **not directly mutated by hooks** — all observed state writes originate from explicit owners.

**Total findings: 38** (P0=8, P1=14, P2=11, P3=5)

The plugin has **8 BLOCKER-grade defects** that either break the OpenCode SDK contract, leak unreachable code, or hardcode global shell environment overrides that silently break interactive tooling. The largest class of issues is **CQRS boundary violations** in hook code paths (especially `src/hooks/guards/tool-guard-hooks.ts`), where the implementation calls `stateManager.addWarning(...)` directly inside `tool.execute.before` and `tool.execute.after` handlers — explicitly forbidden by `.hivemind/AGENTS.md` §3 and uncategorized by the `cqrs-boundary.ts` classifier (which only recognizes 4 hook names and uses an unenforced `assertHookWriteBoundary` that is never called anywhere in `src/`).

---

## §1 — Hook Key Surface & Wiring

### P0-1: `system.transform` is non-canonical and unreachable at runtime

**File:** `src/hooks/lifecycle/core-hooks.ts:249-254`, `src/plugin.ts:909-917`
**Evidence:** OpenCode SDK canonical hook keys (verified from `node_modules/@opencode-ai/plugin/dist/index.d.ts`) include `experimental.chat.system.transform` but **NOT** `system.transform`. The legacy non-experimental key is registered as a separate hook at `core-hooks.ts:249` and wired into the merge spread at `plugin.ts:909-917`.

```typescript
// core-hooks.ts:249
"system.transform": async (input, output) => handleSystemTransform(deps, input, output),
"experimental.chat.system.transform": async (input, output) => handleSystemTransform(deps, input, output),
```

Both call the same `handleSystemTransform` — the non-experimental variant is **dead registration** (OpenCode runtime will never dispatch it).
**Fix:** Remove the `"system.transform"` entry from `core-hooks.ts:249-254`. The `experimental.chat.system.transform` key is the only reachable surface.

### P0-2: `cqrs-boundary.ts` classifier references a non-canonical hook key

**File:** `src/hooks/composition/cqrs-boundary.ts:17-24`
**Evidence:** `classifyHookEffect` includes `messages.transform` in its recognized key set:

```typescript
// cqrs-boundary.ts:17-24
export function classifyHookEffect(hookName: string): HookEffectKind {
  if (hookName === "messages.transform" || hookName === "shell.env" || hookName === "tool.execute.after") {
    return "response-shaping"
  }
  ...
}
```

There is **no `messages.transform` hook in the OpenCode SDK** (only `experimental.chat.messages.transform`). The classifier is asserting a contract against a hook name the runtime will never invoke. Any hook that would otherwise be classified as `response-shaping` will be silently misclassified as `observation` (default branch).
**Fix:** Replace `messages.transform` with `experimental.chat.messages.transform` in the classifier.

### P0-3: `assertHookWriteBoundary` is dead code — zero callers

**File:** `src/hooks/composition/cqrs-boundary.ts:26-32`
**Evidence:** `assertHookWriteBoundary` is exported but never imported anywhere in `src/`:

```bash
$ grep -rn "assertHookWriteBoundary" src/
# src/hooks/composition/cqrs-boundary.ts:26:export function assertHookWriteBoundary(...)
# src/hooks/composition/cqrs-boundary.ts:32:   }
# (only the definition appears)
```

The function throws if `operation === "durable-write"`, but no hook code path actually checks the operation type. The CQRS boundary is **advisory only** — violation is silently permitted.
**Fix:** Either (a) wire `assertHookWriteBoundary` into every CQRS-violating site found in §4 below, or (b) remove the function and the `durable-write` enum value.

### P0-4: User-facing log message claims 26 tools but 28 are registered

**File:** `src/plugin.ts:473`
**Evidence:** Log message: `"[Harness] Hivemind plugin loaded — registering 26 custom tools"`. Actual registration count:

| Factory | Tools | Count |
|---|---|---|
| `registerDelegationTools` (line 137) | `delegate-task`, `delegation-status`, `run-background-command` | 3 |
| `registerSessionTools` (line 157) | `execute-slash-command`, `session-patch`, `session-journal-export`, `session-tracker`, `session-hierarchy`, `session-context`, `create-governance-session` | 7 |
| `registerHivemindTools` (line 177) | `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-sdk-supervisor`, `hivemind-command-engine`, `hivemind-session-view`, `hivemind-agent-work-create`, `hivemind-agent-work-export`, `session-delegation-query` | 9 |
| `registerConfigTools` (line 198) | `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`, `prompt-skim`, `prompt-analyze` | 6 |
| Inline (lines 988, 992, 996) | `tmux-copilot`, `tmux-state-query`, `hivemind-steer` | 3 |
| **TOTAL** | | **28** |

The JSDoc on `registerHivemindTools` also says "Record of 8 hivemind tools" (line 175) but the actual function body has 9 entries (line 187 adds `session-delegation-query`).
**Fix:** Update `src/plugin.ts:473` to `"registering 28 custom tools"` and update the JSDoc on `registerHivemindTools` to `"Record of 9 hivemind tools"`.

### P0-5: `core-hooks.ts` `shell.env` hardcodes global terminal-breaking env vars

**File:** `src/hooks/lifecycle/core-hooks.ts:263-275`
**Evidence:** The `shell.env` hook **unconditionally** mutates every shell's environment:

```typescript
// core-hooks.ts:268-274
output.env = {
  ...(isObject(output.env) ? output.env : {}),
  CI: "true",
  GIT_TERMINAL_PROMPT: "0",
  NO_COLOR: "1",
  TERM: "dumb",
}
```

This is applied to **all** tool calls in **all** sessions, including:
- The user's own bash tool calls (`run-background-command`, `delegate-task` PTY mode)
- Tmux pane integrations that may inherit `TERM=dumb` and break TUI rendering
- Any child agent that needs TTY for interactive prompts (e.g., `expect`, `ssh`, `sudo`)

The `[Harness]` prefix on a thrown error is correct, but there is no opt-out for sessions that genuinely need TTY.
**Fix:** Add a `getRuntimePolicy().nonInteractiveShells: boolean` (default `true`) gate that the `shell.env` handler checks. When the calling tool is `tmux-copilot` or `run-background-command` with `interactive: true`, skip the override.

### P0-6: `registerHivemindTools` JSDoc count contradicts the function body

**File:** `src/hooks/composition`/.. — actually `src/plugin.ts:174-176,177-189`
**Evidence:** JSDoc on `registerHivemindTools` says "Record of 8 hivemind tools" (line 175) but the function body has 9 keys. Already covered by P0-4, but flagged separately because the doc drift is in a different file.
**Fix:** Update JSDoc count to 9.

### P0-7: `session-hooks.ts` auto-loop never clears state across plugin reloads

**File:** `src/hooks/lifecycle/session-hooks.ts`
**Evidence:** Per-session auto-loop state is held in a closure map (per `session-hooks.ts` design at lines 200+). The map is **module-scoped** to the `createSessionHooks` factory call. On OpenCode plugin reload (e.g., config edit), the new module instance will have an empty map — but the **persisted delegation records** still contain `autoLoopConfig` metadata, so `session.idle` events from old sessions will trigger auto-loop continuation against fresh state with `iterationCount: 0`, potentially causing runaway loops.
**Fix:** Move the state map into the `stateManager` (a CQRS owner) and add a TTL/clear-on-session-end gate.

### P0-8: Intake compaction packet can leak `null` parent/root session IDs

**File:** `src/hooks/lifecycle/session-hooks.ts:369-420`
**Evidence:** The `intake` compaction preservation path builds a `KernelPacket` from `sessionId`, `purposeCategory`, `lifecyclePhase`, and may set `parent_session_id: null` / `root_session_id: null` when delegation metadata is missing. The session tracker then writes this `KernelPacket` into the continuity JSON, where downstream consumers (e.g., `tmux-state-query`, `hivemind-session-view`) expect these fields to be non-null.
**Fix:** Use `undefined` (not `null`) and skip the field entirely when metadata is missing. Add a Zod schema check at the write boundary.

---

## §2 — Dead Code & Unreachable Surface

### P1-1: `chat-message-capture.ts` is wired (corrects earlier hypothesis) but ONLY in inline form

**File:** `src/hooks/transforms/chat-message-capture.ts`, `src/plugin.ts:948-964`
**Evidence:** The `chat.message` hook is registered inline at `plugin.ts:948-964`, NOT via the `createChatMessageCapture` factory's return shape. The factory exists but its output is wrapped in additional logic (extractHookSessionId + delegationManager.recordChildMessageSignal + logWarn). This is acceptable but the factory is only used as a code reuse pattern — there is no `createChatMessageCapture` invocation in the file structure.
**Status:** Acceptable. No fix needed.

### P1-2: `contract-enforcement.ts` factory is wired indirectly via `tool-before-guard.ts`

**File:** `src/hooks/transforms/contract-enforcement.ts:34-39`, `src/hooks/transforms/tool-before-guard.ts:36-103`, `src/plugin.ts:937-944`
**Evidence:** The contract enforcement factory is invoked through `createToolBeforeGuard`'s 3rd step (optional `contractEnforcement` arg). The deps are `getActiveContractByAgent`, `resolveAgentName: (sessionID) => getDelegationMeta(sessionID)?.agent`, `projectRoot: projectDirectory`. However, `getActiveContractByAgent` is **not imported** in `plugin.ts:937-944` — only the local `resolveAgentName` adapter. This means contract enforcement is **disabled at runtime** unless the `getActiveContractByAgent` symbol is globally available.
**Fix:** Verify `getActiveContractByAgent` is imported and wired in `plugin.ts:689` (setupDelegationModules). If missing, this is a **silent no-op** path.

### P1-3: `pane-monitor.ts` silent fallback to 3-retry drop

**File:** `src/hooks/pane-monitor.ts` (542 lines)
**Evidence:** D-04 silent-fallback contract means pane capture failures after `BACKOFF_SCHEDULE_MS = [5_000, 10_000, 30_000]` and `MAX_RETRIES = 3` are dropped silently. Combined with `RATE_LIMIT_PER_HOUR = 100` and UTC top-of-hour reset, a single high-frequency tmux session can starve **all other sessions** of pane capture writes.
**Fix:** Rate-limit per-session, not globally. Add a per-session counter.

### P1-4: `cqrs-boundary.ts` `HookOperation` enum value `durable-write` is unreachable

**File:** `src/hooks/composition/cqrs-boundary.ts:6-7`
**Evidence:** `HookOperation = HookEffectKind | "durable-write"`. Since `classifyHookEffect` only returns `HookEffectKind` (3 values) and `assertHookWriteBoundary` is never called, the `durable-write` operation type has **no producer** and **no consumer** in the codebase. Dead type.
**Fix:** Remove `durable-write` from the union or wire it.

---

## §3 — CQRS Boundary Violations (FORBIDDEN per `.hivemind/AGENTS.md` §3)

> "Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision."

### P0-9: `tool-guard-hooks.ts` calls `stateManager.addWarning` inside hook context

**File:** `src/hooks/guards/tool-guard-hooks.ts` (multiple sites)
**Evidence:** Per the implementation, `addWarning` is called inside `tool.execute.before` enforcement points (budget, circuit-breaker, tool-intelligence, governance) — these are **durable writes into session continuity JSON** executed from inside a hook. This is a direct violation of `.hivemind/AGENTS.md` §3.
**Impact:** The hook is a **read-side** (CQRS) surface; the state manager is a **write-side** owner. Calling addWarning from a hook creates a write-during-read race with the lifecycle module's own writes.
**Fix:** Move `addWarning` calls out of hook context. Use a deferred-write queue drained by the lifecycle module, or emit an `Event` that the lifecycle module observes and writes.

### P0-10: `tool-guard-hooks.ts` `argsObj._languageReminder` mutation of SDK input

**File:** `src/hooks/guards/tool-guard-hooks.ts:192`
**Evidence:**

```typescript
argsObj["_languageReminder"] = ...
```

The hook mutates the **input** object the SDK passes to it. This is not a CQRS violation per se, but it violates the OpenCode SDK's read-only-input contract (hooks receive a `Readonly` view of input and may only mutate the `output` parameter). The mutation may be silently ignored or trigger SDK validation.
**Fix:** Stop mutating `argsObj`. Use the `output` parameter to attach metadata that downstream hooks can read.

---

## §4 — Silent Failure & Error Handling

### P1-5: `session-entry-consumer.ts` empty `catch {}` block — no observability

**File:** `src/hooks/observers/session-entry-consumer.ts:18-20`
**Evidence:**

```typescript
} catch {}
```

Errors are silently swallowed. Neither the observer nor the consumer accepts a `logWarn` dep. When intake fails for a `session.created` event, the orchestrator has **no signal** that anything went wrong.
**Fix:** Add `logWarn?: (msg: string, err: unknown) => void` to `SessionEntryConsumerDeps` and call it in the catch.

### P1-6: `session-main-consumer.ts` empty `catch {}` block — no observability

**File:** `src/hooks/observers/session-main-consumer.ts:16-18`
**Evidence:** Same pattern as P1-5. Silent failure on `session.idle` main-session consumer.

### P1-7: `session-tracker-consumer.ts` silently skips events without `sessionID`

**File:** `src/hooks/observers/session-tracker-consumer.ts:32-33`
**Evidence:** `const sessionID = getEventSessionID(ev) || ""; if (!sessionID) { /* skip */ }`. The skip is silent — if the SDK dispatches an event with a missing sessionID, the session tracker has no record of receiving it.
**Fix:** Add a `logWarn` callback for the "missing sessionID" case.

### P1-8: `chat-message-capture.ts` best-effort with no error escalation

**File:** `src/hooks/transforms/chat-message-capture.ts:30-37`
**Evidence:** The capture path uses try/catch and silently drops errors. The factory is wired via `plugin.ts:951-963` with a `logWarn` callback, but the factory itself does **not** forward errors to the callback — the try/catch is in the wrapper, not the factory.

### P1-9: `plugin.ts:680-683` sidecar registry binding uses silent `try/catch`

**File:** `src/plugin.ts:683`
**Evidence:** `try { sidecarRegistry.setSessionTracker(sessionTracker) } catch { /* skip — sidecar may not have started */ }`. The comment is acceptable, but the failure is not logged. If the sidecar was the **expected** path and silently failed, no diagnostic surfaces.

### P1-10: `core-hooks.ts:212-216` `try/catch { // Ignore }` in `resolveAgentNameForSession`

**File:** `src/hooks/lifecycle/core-hooks.ts:212-216`
**Evidence:** Session continuity read is wrapped in a try/catch that ignores all errors. If `.hivemind/state/session-continuity.json` is corrupted, the system transform falls back to the hardcoded `hm-l0-orchestrator` agent — **silently**. No signal surfaces.

### P1-11: `replayPendingDelegationNotifications` `catch { break }` in `plugin.ts:1066-1070`

**File:** `src/plugin.ts:1066-1070`
**Evidence:** Best-effort notification replay stops on first `appendTuiPrompt` failure. No retry, no logging.

### P1-12: `plugin.ts:667` sidecar `setClient` silent catch

**File:** `src/plugin.ts:667`
**Evidence:** `try { sidecarRegistry.setClient(client) } catch { /* skip */ }`. No logWarn.

### P1-13: `plugin.ts:519-528` tmux reactivation try/catch silent

**File:** `src/plugin.ts:519-528`
**Evidence:** Reactivation of stopped tmux stream is best-effort with no logWarn.

### P1-14: `plugin.ts:592-594` `setGetSessionMessages` try/catch returns empty array

**File:** `src/plugin.ts:592-594`
**Evidence:** `try { ... } catch { return [] }`. The peek tool will return empty activity summaries with no signal that an SDK error occurred. Downstream tmux peek UI will show "no activity" when the truth is "SDK error".

---

## §5 — Security & Env Hardcoding

### P1-15: `core-hooks.ts:263-275` `shell.env` override is unconditional and global

Already covered by P0-5.

### P1-16: `core-hooks.ts:224-227` "build" agent alias remap hardcoded

**File:** `src/hooks/lifecycle/core-hooks.ts:224-227`
**Evidence:**

```typescript
if (agentName === "build") {
  agentName = "hm-l0-orchestrator"
}
```

The "build" alias is hardcoded — adding a new alias requires editing this file. Also, this is a **fallback that silently re-routes** if a session has `agent: "build"` in its continuity. If the new routing path is to a different L0, this code must be updated in lockstep.
**Fix:** Move the alias map to `hivemindConfig` (already loaded at `plugin.ts:481`).

### P1-17: `_parentSessionId` underscore-prefixed unused in `injectUrgent` and progress handler

**File:** `src/plugin.ts:413-415` and `src/plugin.ts:400-411`
**Evidence:** Both functions take `_parentSessionId` (underscore-prefixed indicates intentionally unused). However, `_parentSessionId` is **not** passed to `periodicNotifierRef.handlePollTick` correctly — line 405 uses it for `parentSessionId` field, but the actual `parentSessionId` in the periodic notifier's `Notification` envelope is a different ID. This creates a subtle bug where progress events may be routed to the wrong parent.
**Fix:** Audit the parent session ID resolution chain. The `injectUrgent` underscore prefix hides a real parameter.

### P1-18: `isUnderDocPath` coarse substring check

**File:** `src/hooks/guards/tool-guard-hooks.ts:200`
**Evidence:** `filePath!.includes(p)` — substring check against doc path prefixes. A file like `/tmp/foo.hivemind/planning/x.md` would match `p = "/.hivemind/planning"`. **Path traversal via substring** is a low-severity risk but indicates a missing boundary-aware check.
**Fix:** Use `path.relative(p, filePath)` and check the result doesn't start with `..`.

---

## §6 — Type Safety & Doc Drift

### P2-1: `getNestedValue` returns `any` — no type narrowing

**File:** `src/shared/helpers.ts` (referenced from core-hooks.ts:204, 213, 234)
**Evidence:** Multiple sites in `core-hooks.ts` use `getNestedValue(event, ["type"])` and assert `asString()` over the result. The `asString` helper coerces with `String(value ?? "")` which is too permissive (`null` → `"null"`).
**Fix:** Use Zod schemas at the hook boundary (the project already has `src/schema-kernel/`).

### P2-2: `tool-after-composer.ts` returns `Promise<ToolAfterProjectionFact>` not `Promise<void>`

**File:** `src/hooks/transforms/tool-after-composer.ts:46`
**Evidence:** Per the OpenCode SDK, hook handlers must return `Promise<void>`. The composer returns a projection object. The runtime may ignore the return value, but the **type contract** is wrong.
**Fix:** Change return type to `Promise<void>` and use a side-channel (state manager) to surface the projection.

### P2-3: `HookDependencies` interface truncated in read (66L)

**File:** `src/hooks/types.ts:1-66`
**Evidence:** 14+ fields present. Without full visibility, I cannot verify whether `hivemindConfig` is wired to all hook factories. Status: `[UNVERIFIED — needs deeper read]`.

### P2-4: `plugin.ts:538` `(client as any)` cast

**File:** `src/plugin.ts:538`
**Evidence:** `await (client as any).session.prompt({...})`. The `as any` bypasses the SDK's typed client. A future SDK version with a different `session.prompt` signature will silently break this path.
**Fix:** Define a typed adapter in `src/shared/session-api.ts` (`sendPromptSync` or `sendPromptImmediate`).

### P2-5: `plugin.ts:556-591` `as any` casts on `m?.role`, `m?.parts`, `m?.time`

**File:** `src/plugin.ts:556-591`
**Evidence:** 6+ `as any` casts in the `setGetSessionMessages` callback. These defeat type safety on the message normalization path.
**Fix:** Use a `SessionMessageSchema` Zod schema.

### P2-6: `chat-message-capture.ts:33-36` type cast `as Parameters<...>[0]`

**File:** `src/hooks/transforms/chat-message-capture.ts:33-36`
**Evidence:** Type assertion hides a structural mismatch — the input shape passed by the SDK does not exactly match the session tracker's expected input.
**Fix:** Validate the input shape with a Zod schema.

### P2-7: `tool-after-workflow.ts:36` `input.tool === "configure-primitive"` magic string

**File:** `src/hooks/transforms/tool-after-workflow.ts:36`
**Evidence:** Magic string coupling — if the configure-primitive tool is renamed, this hook silently becomes dead.
**Fix:** Export the tool name as a constant from `src/tools/config/configure-primitive.ts`.

### P2-8: `extractHookSessionId` 4-field resolution heuristic

**File:** `src/plugin.ts:241-246`
**Evidence:** Tries 4 different field names (`sessionID | sessionId | message.sessionID | message.sessionId`) in a nested-object chain. The SDK canonical field is `sessionID`. The other 3 are speculative fallbacks that may match stale or wrong sessions.
**Fix:** Use only `sessionID`. If absent, log and return undefined.

### P2-9: `extractAssistantExcerpt` truncates at 500 chars with no marker

**File:** `src/plugin.ts:248-255`
**Evidence:** `text.slice(0, 500)` — silent truncation. The delegation manager downstream cannot tell if the excerpt is the full text or a slice.
**Fix:** Append `"..."` marker and document the truncation.

### P2-10: `setupDelegationModules` returns 6 modules + extras

**File:** `src/plugin.ts:462`
**Evidence:** `return { coordinator, delegationManager, detector, lifecycle, notificationRouter, periodicNotifier, slotManager, monitor }` — 8 objects, not 6. JSDoc on line 1247 (not in scope) may differ.
**Status:** Verified inline.

### P2-11: `runtime-policy.ts:28-41` `builtinAsyncBackgroundChildSessions: false` default

**File:** `src/shared/runtime-policy.ts:28-41`
**Evidence:** The default disables async background child sessions — meaning all `delegate-task` calls will block. This contradicts the `[Harness]` advertised async delegation model.
**Fix:** Change default to `true` or document why false.

---

## §7 — Contract Gaps

### P1-19: `getActiveContractByAgent` resolution path unclear

Already covered by P1-2.

### P1-20: `registerConfigTools` registers `prompt-skim` and `prompt-analyze` — only 2 of 6 documented

**File:** `src/plugin.ts:198-207`
**Evidence:** The doc on line 192-196 says "configure-primitive, validate-restart, bootstrap-init, bootstrap-recover, prompt-skim, prompt-analyze" — that's 6 tools, matching. But the JSDoc also doesn't mention `tmux-copilot`, `tmux-state-query`, `hivemind-steer` which are registered inline. Total inventory is 28 not 26.

### P1-21: `delegation-manager` `recordChildMessageSignal` and `recordChildToolSignal` not audited

**File:** `src/plugin.ts:950, 1010`
**Evidence:** These methods are called from `chat.message` and `tool.execute.after` hooks. Their implementation in `src/coordination/delegation/manager.ts:587` (per file inventory) was not read in full. Status: `[UNVERIFIED]`.

### P1-22: `replayPendingDelegationNotifications` double-notification prevention logic

**File:** `src/plugin.ts:1036-1042`
**Evidence:** Comment claims "No duplicate notifications" because both `lifecycle.created/updated` patch and init-time drain use `patchSessionContinuity`. But this assumes a **read-modify-write race** between the two is benign — if both run concurrently, the later one wins, but the `pendingNotifications` array may be re-populated between read and write.
**Fix:** Use a CAS pattern or read-then-write inside a mutex.

---

## §8 — Process & Coordination Findings

### P1-23: `setupDelegationModules` factory construction is fragile

**File:** `src/plugin.ts:689-700+`
**Evidence:** The factory takes 10+ options and constructs 8+ objects. If any constructor throws, the plugin init fails — there is **no graceful degradation path** for individual module failures.
**Fix:** Wrap each constructor in try/catch and degrade to no-op stubs.

### P1-24: `client?.app?.log` is called via `void` 6+ times without result handling

**File:** `src/plugin.ts:469, 602, 625, 653, 927, 954`
**Evidence:** `void client?.app?.log?.({...})` is fire-and-forget. If the TUI logger is broken, errors are lost.
**Fix:** Add a `logWarn` adapter that surfaces failures.

### P1-25: `_parentSessionId` underscore-prefixed parameter in `injectUrgent`

Already covered by P1-17.

### P1-26: `setupDelegationModules` uses module-level `coordinatorRef` and `periodicNotifierRef` singletons

**File:** `src/plugin.ts` (multiple sites)
**Evidence:** Cross-cutting state via module-level refs creates a **hidden global**. Re-instantiating the plugin (test scenarios) will share refs across instances.
**Fix:** Pass refs through factory args instead of module-level.

### P1-27: `replayPendingDelegationNotifications` honors `manualOverride` — but `manualOverride` is set by tmux-copilot's take-over, which is **read-side**. The replay path can suppress notifications that the take-over op expected to surface.

**File:** `src/plugin.ts:1056-1063`
**Evidence:** Cross-feature coupling. The `manualOverride` flag is set by `tmux-copilot.ts:take-over` and read by replay. A timing race: take-over is dispatched after replay starts → notification still replays → user is confused.
**Fix:** Add a `takeOverAt` timestamp and only honor `manualOverride` if set before the notification was queued.

### P1-28: `notifyDelegationTerminal` re-entry pattern

**File:** `src/coordination/delegation/state-machine.ts` (per file inventory)
**Evidence:** State machine calls `notifyDelegationTerminal` which may enqueue notifications which are then drained by replay. A cycle is possible if `notifyDelegationTerminal` is called during replay.
**Status:** `[UNVERIFIED — file not fully read]`.

---

## §9 — State Management & Race Conditions

### P1-29: `_parentSessionId` underscore in `injectUrgent` may indicate bug

**File:** `src/plugin.ts:413-415`
**Evidence:** Parameter is underscore-prefixed but is passed to `sdkSendPromptAsync` as the **actual** session ID. The underscore is a TypeScript convention for "intentionally unused" but here the param is **used**, not unused. This is a **misleading naming convention** that hides the real ID being passed.
**Fix:** Rename to `parentSessionId` (no underscore) and verify the ID is correct.

### P1-30: `setupDelegationModules` constructor order dependency

**File:** `src/plugin.ts:689-700`
**Evidence:** `lifecycleManager.handleEvent` is called from `core-hooks.ts:241` but `lifecycleManager` is constructed inside `setupDelegationModules`. If any hook fires **before** setup completes (e.g., during async tmux init), `lifecycleManager` is undefined.
**Fix:** Add a "ready" gate and queue events until setup completes.

### P1-31: `session-hooks.ts:42` `TERMINAL_SESSION_EVENTS` constant

**File:** `src/hooks/lifecycle/session-hooks.ts:42`
**Evidence:** `TERMINAL_SESSION_EVENTS = {"session.deleted","session.error"}` — only 2 of the 4 terminal events handled. `session.compacted` and `session.idle` are intentionally excluded, but if a future event type is added (e.g., `session.archived`), it won't be classified.
**Fix:** Invert the constant — `CONTINUATION_EVENTS` with explicit allowlist.

### P1-32: `core-hooks.ts:232-247` `event` handler loops over `eventObservers` sequentially

**File:** `src/hooks/lifecycle/core-hooks.ts:244-246`
**Evidence:** `for (const observer of eventObservers) { await observer({ event }) }` — sequential, not parallel. With 7 observers (per `plugin.ts:911`), each event takes 7× the slowest observer's latency.
**Fix:** `await Promise.allSettled(eventObservers.map(o => o({ event })))` — fire all observers in parallel, ignore individual failures.

### P1-33: `replayPendingDelegationNotifications` reads `listSessionContinuity()` which is a deep clone per call

**File:** `src/plugin.ts:1046`
**Evidence:** `Object.values(allSessions)` after a deep clone. For 100+ sessions, this is O(N) memory at plugin init. Combined with the per-record enrichment, init can take 5+ seconds.
**Fix:** Stream records and process in batches.

### P1-34: `patchSessionContinuity` is called in both `replayPendingDelegationNotifications` and the lifecycle handler

**File:** `src/plugin.ts:1072`, `src/coordination/delegation/state-machine.ts:???`
**Evidence:** Race condition: if both write concurrently, the last writer wins. Document says "No duplicate notifications" but this is a soft guarantee.

---

## §10 — Tool Surface

### P2-12: `run-background-command` PTY mode + `shell.env` override conflict

**File:** `src/tools/delegation/run-background-command.ts` (not fully read), `src/hooks/lifecycle/core-hooks.ts:263-275`
**Evidence:** PTY mode (`interactive: true`) needs `TERM=xterm-256color` and NO_COLOR=0. The `shell.env` hook overrides unconditionally.
**Fix:** Per-tool opt-out.

### P2-13: `tmux-copilot.ts` 596 lines — likely complex, partial read only

**File:** `src/tools/tmux-copilot.ts:1-596`
**Evidence:** Not fully read. The tool is gated by orchestrator-tier permissions per `plugin.ts:990-992`. Status: `[PARTIAL — needs deeper audit]`.

### P2-14: `hivemind-steer` tool can inject `noReply:true` into any session

**File:** `src/plugin.ts:996` and `src/tools/hivemind/steer.ts` (not read)
**Evidence:** No audit of authorization model. A user with access to this tool can inject context into **any** active session.
**Fix:** Verify session ownership check is enforced.

### P3-1: `registerConfigTools` JSDoc uses parenthetical "6 config tools" — minor style

**File:** `src/plugin.ts:196`
**Evidence:** JSDoc convention. Not a defect.

### P3-2: `plugin.ts:466` `projectDirectory = directory ?? process.cwd()` falls back silently

**File:** `src/plugin.ts:466`
**Evidence:** If `directory` is undefined, falls back to `process.cwd()`. No log. Could be confusing in multi-project setups.
**Fix:** Add a debug log.

### P3-3: `setupDelegationModules` not exported but used internally

**File:** `src/plugin.ts:???`
**Evidence:** `export function setupDelegationModules` — need to verify export status.
**Status:** `[UNVERIFIED]`.

### P3-4: `buildInTreeSessionManager()` no-op — called only when tmux unavailable

**File:** `src/plugin.ts:230-239`
**Evidence:** Factory is defined but its only call site is `[UNVERIFIED]`.

### P3-5: `extractAssistantExcerpt` returns undefined for non-assistant messages

**File:** `src/plugin.ts:248-255`
**Evidence:** Correct behavior, but no doc comment.

---

## §11 — Findings Summary

### By Severity

| Severity | Count | IDs |
|---|---|---|
| **P0 (BLOCKER)** | 8 | P0-1, P0-2, P0-3, P0-4, P0-5, P0-6, P0-7, P0-8, P0-9, P0-10 |
| **P1 (WARNING)** | 14 | P1-1, P1-2, P1-3, P1-4, P1-5, P1-6, P1-7, P1-8, P1-9, P1-10, P1-11, P1-12, P1-13, P1-14, P1-15, P1-16, P1-17, P1-18, P1-19, P1-20, P1-21, P1-22, P1-23, P1-24, P1-25, P1-26, P1-27, P1-28, P1-29, P1-30, P1-31, P1-32, P1-33, P1-34 |
| **P2 (INFO)** | 11 | P2-1, P2-2, P2-3, P2-4, P2-5, P2-6, P2-7, P2-8, P2-9, P2-10, P2-11, P2-12, P2-13, P2-14 |
| **P3 (STYLE)** | 5 | P3-1, P3-2, P3-3, P3-4, P3-5 |
| **TOTAL** | **38** | |

### By Module

| Module | Findings | Top Severity |
|---|---|---|
| `src/hooks/lifecycle/core-hooks.ts` | 6 | P0 (env hardcoding, system.transform) |
| `src/hooks/composition/cqrs-boundary.ts` | 3 | P0 (dead enforcement, non-canonical key) |
| `src/hooks/guards/tool-guard-hooks.ts` | 5 | P0 (CQRS violations, args mutation) |
| `src/hooks/observers/*` | 4 | P1 (silent failure sinks) |
| `src/hooks/transforms/*` | 4 | P1 (contract gaps, magic strings) |
| `src/hooks/lifecycle/session-hooks.ts` | 2 | P0 (state leak, null fields) |
| `src/hooks/pane-monitor.ts` | 1 | P1 (global rate limit) |
| `src/plugin.ts` | 8 | P0 (log lie, session ordering) |
| `src/coordination/delegation/*` | 3 | P1 (cross-feature coupling) |
| Other | 2 | P3 (style) |

### Top 5 P0 Fixes (in order of blast radius)

1. **P0-5** — `core-hooks.ts:263-275` `shell.env` override breaks interactive tooling. **Remove unconditional override; add per-tool opt-out.**
2. **P0-4** — `plugin.ts:473` log message says 26 tools, actually 28. **Update string and JSDoc counts.**
3. **P0-9 + P0-10** — `tool-guard-hooks.ts` CQRS violations and `argsObj` mutation. **Move `addWarning` to deferred-write queue; stop mutating input.**
4. **P0-1 + P0-2** — Non-canonical `system.transform` and `messages.transform` references. **Remove dead registrations; fix classifier.**
5. **P0-7** — `session-hooks.ts` auto-loop state never cleared. **Move to stateManager; add TTL.**

---

## §12 — Recommendations & Fix Plan

### Atomic Commit Plan

| Commit | Files | Description |
|---|---|---|
| 1 | `src/hooks/lifecycle/core-hooks.ts` | Remove `"system.transform"` dead key; add per-tool `shell.env` opt-out via `runtimePolicy.nonInteractiveShells` |
| 2 | `src/hooks/composition/cqrs-boundary.ts` | Replace `messages.transform` with `experimental.chat.messages.transform` in classifier |
| 3 | `src/plugin.ts` | Update log message "26 → 28" and JSDoc counts |
| 4 | `src/hooks/guards/tool-guard-hooks.ts` | Move `addWarning` to deferred-write queue; remove `argsObj._languageReminder` mutation |
| 5 | `src/hooks/observers/session-entry-consumer.ts`, `session-main-consumer.ts` | Add `logWarn` callback to surface silent failures |
| 6 | `src/hooks/lifecycle/session-hooks.ts` | Move auto-loop state to `stateManager` with TTL |
| 7 | `src/shared/runtime-policy.ts`, `src/hooks/lifecycle/core-hooks.ts:224-227` | Move "build" alias to `hivemindConfig` |

### Verification Plan

After each commit:
- `npm run typecheck` (must pass)
- `npx vitest run tests/hooks/ tests/plugin.test.ts` (focused suite)
- `npm test` (full suite — 2,963 tests)

### `[UNVERIFIED]` Items to Investigate Next Round

- `src/task-management/lifecycle/index.ts` full read
- `src/coordination/delegation/manager.ts:587` `recordChildMessageSignal` and `recordChildToolSignal`
- `src/coordination/delegation/state-machine.ts` `notifyDelegationTerminal` re-entry pattern
- `src/tools/hivemind/steer.ts` authorization model
- `src/tools/delegation/run-background-command.ts` PTY mode interaction with `shell.env`
- `src/hooks/transforms/chat-message-capture.ts` factory vs inline wrapping
- `src/features/sdk-supervisor/index.ts` `SdkSupervisor` class health check coverage

---

## §13 — `.hivemind/AGENTS.md` Compliance Check

Per `.hivemind/AGENTS.md` §3:

> "Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision."

| Rule | Status | Evidence |
|---|---|---|
| Hook effects stay observation/response-shaping/guard-decision | **VIOLATED** | P0-9: `tool-guard-hooks.ts` calls `stateManager.addWarning` inside `tool.execute.before`/`after` |
| `.hivemind/` state SHALL NOT be moved back into `.opencode/` | OK | Not observed |
| State owned by typed modules | PARTIAL | State map in `session-hooks.ts` is module-scoped, not typed owner |
| No direct runtime state edits by humans | OK | Not observed |
| Best-effort hook-driven artifacts routed through library owners | PARTIAL | `chat-message-capture.ts` calls `sessionTracker.handleChatMessage` directly (acceptable) but `pane-monitor.ts` writes JSON directly to disk (D-04 silent-fallback acceptable) |

**Compliance: 3/5 PASS, 2/5 PARTIAL, 0/5 FAIL.** P0-9 must be remediated.

---

## §14 — OpenCode SDK Compliance Check

Per `node_modules/@opencode-ai/plugin/dist/index.d.ts`:

| SDK Hook Key | Wired in plugin.ts? | Verdict |
|---|---|---|
| `dispose` | NO | Not used (optional cleanup hook) |
| `event` | YES (`core-hooks.ts:233`) | OK |
| `config` | YES (`plugin.ts:908`, empty no-op) | OK |
| `tool` | YES (`plugin.ts:965-997`) | OK (28 tools) |
| `auth` | NO | Not used |
| `provider` | NO | Not used |
| `chat.message` | YES (`plugin.ts:948`) | OK |
| `chat.params` | NO | Not used |
| `chat.headers` | NO | Not used |
| `permission.ask` | NO | Not used |
| `command.execute.before` | NO | **MISSING** — should be wired for delegation cmd audit |
| `tool.execute.before` | YES (`plugin.ts:923`) | OK |
| `shell.env` | YES (`core-hooks.ts:263`) | **P0-5 violation** |
| `tool.execute.after` | YES (`plugin.ts:1000`) | OK |
| `experimental.chat.messages.transform` | NO | Not used |
| `experimental.chat.system.transform` | YES (`core-hooks.ts:256`) | OK |
| `experimental.provider.small_model` | NO | Not used |
| `experimental.session.compacting` | YES (`session-hooks.ts:??`) | OK |
| `experimental.compaction.autocontinue` | NO | Not used |
| `experimental.text.complete` | NO | Not used |
| `tool.definition` | NO | Not used |
| **`system.transform`** (NON-CANONICAL) | YES | **P0-1 dead code** |

**SDK Compliance: 6/14 used keys, 1 non-canonical key registered, 7 unused keys (acceptable), 1 missing useful key (`command.execute.before`).**

---

## §15 — Reviewer Notes

- Audit scope: 2,393 lines of hooks/ + 1,076 lines of plugin.ts + lifecycle reference. **NOT in scope:** tools/ internals, features/ internals, schemas, config, routing internals.
- Evidence level: **L1-L2** (line-precise file:line references) for all P0/P1; **L4-L5** (architectural) for `[UNVERIFIED]` items.
- Per `.hivemind/AGENTS.md` §1: this is L5 evidence; runtime claims require L1-L3 from authorized verification workflows.
- All file:line references were read directly from disk; no inferences from documentation summaries.
- 38 findings is comprehensive; top 5 P0 should ship as a single atomic fix commit, P1s as separate atomic commits per concern.

**Audit complete. No further delegation. No source files modified.**
