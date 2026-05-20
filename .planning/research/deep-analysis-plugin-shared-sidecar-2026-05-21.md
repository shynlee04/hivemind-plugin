# Deep Analysis: plugin.ts, shared/, and sidecar/

**Analysis Date:** 2026-05-21

**Scope:** Composition root (`src/plugin.ts`, 493 LOC), public API surface (`src/index.ts`, 30 LOC), shared leaf modules (14 files under `src/shared/`), sidecar read-only layer (`src/sidecar/readonly-state.ts`), and src-root placeholders (`src/kernel/.gitkeep`, `src/harness/.gitkeep`).

---

## Table of Contents

1. plugin.ts Structure Map
2. Line-by-Line Breakdown
3. Tool Registration Analysis
4. Hook Registration Analysis
5. Startup Tasks & Side Effects
6. Recovery Path Assessment
7. Delegation Wiring
8. Anti-Patterns in plugin.ts
9. shared/ File-by-File Analysis
10. shared/ Dependency Graph
11. shared/ Leaf Constraint Violations
12. types.ts: Dumping Ground Assessment
13. session-api.ts Wrapper Assessment
14. state.ts Singleton Assessment
15. sidecar/ Readiness Assessment
16. Recommendations

---

## 1. plugin.ts Structure Map (Text Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│  src/plugin.ts (493 lines)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  L001-L007   JSDoc module header                                  │
│  L008-L077   IMPORTS (32 import lines, ~70 files)                 │
│  L078        ─────────────────────────────────────────             │
│  L079-L099   Standalone helper functions (3)                      │
│              - shouldAppendParentTuiNotification()                │
│              - extractHookSessionId()                             │
│              - extractAssistantExcerpt()                          │
│              - persistPendingDelegationNotifications()            │
│  L100-L128     (continued: persistPendingDelegationNotifications) │
│  L129-L137   DelegationModuleSetupOptions interface               │
│  L138-L147   DelegationModuleSetup interface                      │
│  L148-L217   setupDelegationModules() — 7-module factory         │
│  L218        ─────────────────────────────────────────             │
│  L219-L453   HarnessControlPlane Plugin factory function          │
│  │            │                                                    │
│  │  L220-L229   Startup: project dir + app.log diagnostic         │
│  │  L230-L236   Startup: runtime policy + hivemind config load    │
│  │  L237-L243   Startup: PTY manager + delegation modules setup   │
│  │  L244-L247   Startup: delegation recovery (fire-and-forget)    │
│  │  L248-L255   Startup: session tracker + lifecycle manager      │
│  │  L256-L262   Startup: continuity hydration + notification drain│
│  │  L263-L272   Startup: completion detector wiring               │
│  │  L273-L287   Startup: session tracker init (fire-and-forget)   │
│  │  L288-L318   Startup: event-tracker migration (fire-and-forget)│
│  │  L319-L349   Startup: observer factories + consumers           │
│  │  L350-L352   Startup: tool guard hooks factory                 │
│  │            │                                                    │
│  │  L353-L453   RETURN BLOCK                                       │
│  │  │            │                                                  │
│  │  │  L354       config: async () => {} (NO-OP)                   │
│  │  │  L355-L358  ...createCoreHooks(...)                          │
│  │  │  L359       ...sessionReadHooks                              │
│  │  │  L360-L377  "tool.execute.before" hook                       │
│  │  │  L378-L396  "chat.message" hook                              │
│  │  │  L397-L425  tool: { ... }  — 23 tools                        │
│  │  │  L426-L452  "tool.execute.after" hook                        │
│  │            │                                                    │
│  L454-L491   replayPendingDelegationNotifications() — exported     │
│  L492-L493   default export                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Line-by-Line Breakdown

| Section | Lines | LOC | % of File |
|---------|-------|-----|-----------|
| Imports | 8–77 | 70 | 14.2% |
| Standalone helper functions | 80–128 | 49 | 9.9% |
| Interface definitions | 129–147 | 19 | 3.9% |
| `setupDelegationModules()` | 149–217 | 69 | 14.0% |
| Plugin factory startup (bootstrap) | 220–352 | 133 | 27.0% |
| Return block (hooks + tools) | 353–453 | 101 | 20.5% |
| `replayPendingDelegationNotifications()` | 456–491 | 36 | 7.3% |
| Default export | 492–493 | 2 | 0.4% |

**Total:** 493 lines — under the 500 LOC cap by 7 lines (within tolerance).

---

## 3. Tool Registration Analysis

### All 23 Tools, Their Factories, and Dependencies

| # | Tool Name | Factory | Dependencies Received | Lines |
|---|-----------|---------|----------------------|-------|
| 1 | `delegate-task` | `createDelegateTaskTool` | `delegationManager`, `hivemindConfig` | 398 |
| 2 | `delegation-status` | `createDelegationStatusTool` | `delegationManager`, `{getChildMessageCount, terminateChild, getEscalationLevel}` | 399–403 |
| 3 | `run-background-command` | `createRunBackgroundCommandTool` | `{delegationManager, ptyManager}` | 404 |
| 4 | `prompt-skim` | `createPromptSkimTool` | `projectDirectory` | 405 |
| 5 | `prompt-analyze` | `createPromptAnalyzeTool` | `projectDirectory` | 406 |
| 6 | `session-patch` | `createSessionPatchTool` | `projectDirectory` | 407 |
| 7 | `execute-slash-command` | `createExecuteSlashCommandTool` | `client` | 408 |
| 8 | `session-journal-export` | `createSessionJournalExportTool` | (none) | 409 |
| 9 | `hivemind-doc` | `createHivemindDocTool` | `projectDirectory` | 410 |
| 10 | `hivemind-trajectory` | `createHivemindTrajectoryTool` | `projectDirectory` | 411 |
| 11 | `hivemind-pressure` | `createHivemindPressureTool` | `projectDirectory` | 412 |
| 12 | `hivemind-sdk-supervisor` | `createHivemindSdkSupervisorTool` | (none) | 413 |
| 13 | `hivemind-command-engine` | `createHivemindCommandEngineTool` | `projectDirectory` | 414 |
| 14 | `session-tracker` | `createSessionTrackerTool` | `projectDirectory` | 415 |
| 15 | `session-hierarchy` | `createSessionHierarchyTool` | `projectDirectory` | 416 |
| 16 | `session-context` | `createSessionContextTool` | `projectDirectory` | 417 |
| 17 | `hivemind-session-view` | `createHivemindSessionViewTool` | `projectDirectory` | 418 |
| 18 | `hivemind-agent-work-create` | `createHivemindAgentWorkCreateTool` | `projectDirectory` | 419 |
| 19 | `hivemind-agent-work-export` | `createHivemindAgentWorkExportTool` | `projectDirectory` | 420 |
| 20 | `configure-primitive` | `createConfigurePrimitiveTool` | (none) | 421 |
| 21 | `validate-restart` | `createValidateRestartTool` | (none) | 422 |
| 22 | `bootstrap-init` | `createBootstrapInitTool` | (none) | 423 |
| 23 | `bootstrap-recover` | `createBootstrapRecoverTool` | (none) | 424 |

### Deps Injection Pattern

All tools follow a consistent factory pattern:
- **projectDirectory only** (9 tools): `prompt-skim`, `prompt-analyze`, `session-patch`, `hivemind-doc`, `hivemind-trajectory`, `hivemind-pressure`, `hivemind-command-engine`, `session-tracker`, `session-hierarchy`, `session-context`, `hivemind-session-view`, `hivemind-agent-work-create`, `hivemind-agent-work-export`
- **client only** (1 tool): `execute-slash-command`
- **No deps** (5 tools): `session-journal-export`, `hivemind-sdk-supervisor`, `configure-primitive`, `validate-restart`, `bootstrap-init`, `bootstrap-recover`
- **Complex objects** (3 tools): `delegate-task`, `delegation-status`, `run-background-command`

**Notable:** 13 of 23 tools receive only `projectDirectory` — they are basically thin wrappers that read from `.hivemind/` state files. This suggests the tools module should be audited for whether the directory is actually used to read files or just passed through.

---

## 4. Hook Registration Analysis

### Wired Hooks

| Hook Name | Factory | Active? | Lines |
|-----------|---------|---------|-------|
| `"tool.execute.before"` | `createToolBeforeGuard` | YES — combined guard + session-tracker detection | 364–377 |
| `"chat.message"` | Inline + `createChatMessageCapture` | YES — delegation signal + message capture | 380–396 |
| (spread) `createCoreHooks` | `createCoreHooks` | YES — core lifecycle events | 355–358 |
| (spread) `sessionReadHooks` | `createSessionHooks` (minus `event`) | YES — session read hooks | 359 |
| `"tool.execute.after"` | Inline with `createToolExecuteAfterHook` + `sessionTracker.handleToolExecuteAfter` + `createToolAfterWorkflow` | YES — output summary, delegation signals, session tracker metadata | 428–452 |

### Config Hook (NO-OP)

```typescript
config: async () => {},
```
Line 354. A complete no-op. The `Plugin` type requires a `config` hook, but no configuration logic is wired. This means:
- No plugin-level configuration is surfaced to the runtime
- If any tool or module needs config, it must load it independently (which they do via `getConfig()`)

### Hook Composition (tool.execute.after)

The `tool.execute.after` hook is the most complex — it composes 4 responsibilities in sequence:
1. `createToolExecuteAfterHook` — tool guard after-hook behavior
2. `summarizePluginToolOutput` — redacted output summary for metadata
3. `sessionTracker.handleToolExecuteAfter` — capture tool metadata
4. `createToolAfterWorkflow` — workflow state persistence

This is good composition, but the nesting depth (4 levels) makes it harder to follow the error isolation boundaries.

---

## 5. Startup Tasks & Side Effects

### Startup Sequence (in order)

1. **App log diagnostic** (L223–229): `client.app.log()` — fire-and-forget via `void`. Best-effort logging.
2. **Runtime policy load** (L232): `loadRuntimePolicy(resolveWorkspaceRuntimePolicy(...))` — synchronous, reads `hivemind.runtime-policy.json` from `.hivemind/state/`. Uses `readFileSync`.
3. **Hivemind config load** (L235): `getConfig(projectDirectory)` — lazy-cached, falls back to defaults.
4. **PTY manager creation** (L236): `await createPtyManagerIfSupported()` — awaits. Creates PTY manager if bun-pty is available.
5. **Delegation modules setup** (L238): `setupDelegationModules(...)` — synchronous. Creates 7 delegation subsystem instances.
6. **Delegation recovery** (L244): `void delegationManager.recoverPending()` — fire-and-forget. Recovery runs async, does not block init.
7. **Session tracker creation** (L248): `new SessionTracker(...)` — synchronous.
8. **Lifecycle manager creation + hydration** (L250–256): `createHarnessLifecycleManager(...)` + `hydrateFromContinuity()` — synchronous.
9. **Pending notification drain** (L262): `void replayPendingDelegationNotifications(client)` — fire-and-forget.
10. **Completion detector wiring** (L272): `delegationManager.setCompletionDetector(...)` — synchronous setter call.
11. **Session tracker init + cleanup** (L276–287): `void sessionTracker.initialize().then(() => sessionTracker.cleanup())` — fire-and-forget.
12. **Event-tracker migration** (L290–318): `void (async () => { ... })()` — fire-and-forget. Contains sync I/O: `existsSync`, `rmSync`, `mkdirSync`, `writeFileSync`.

### Side Effects Summary

| Side Effect | Sync/Async | Location | Blocking? |
|-------------|------------|----------|-----------|
| `client.app.log()` | Async | L223–229 | No (void) |
| `readFileSync` on `.hivemind/state/hivemind.runtime-policy.json` | **Sync** | L232 → `workspace-runtime-policy.ts:27` | Yes |
| `existsSync`/`rmSync`/`mkdirSync`/`writeFileSync` for event-tracker migration | **Sync** | L294–299 | No (fire-and-forget IIFE) |
| `await createPtyManagerIfSupported()` | Async | L236 | Yes |
| `void delegationManager.recoverPending()` | Async | L244 | No (void) |
| `void replayPendingDelegationNotifications()` | Async | L262 | No (void) |
| `void sessionTracker.initialize().then(...)` | Async | L276 | No (void) |

**Anti-pattern:** Sync I/O (`readFileSync`) in the startup path for runtime policy loading blocks plugin init. The event-tracker migration's sync I/O is inside a fire-and-forget IIFE so it doesn't block, but uses sync APIs asynchronously.

---

## 6. Recovery Path Assessment

### What Runs During Recovery

1. **`delegationManager.recoverPending()`** (L244):
   - Fire-and-forget via `void`
   - Recovers pending/in-flight delegations from persisted state
   - Depends on continuity store being available
   - Runs ASYNC — does not block plugin init
   - **Risk:** If a second OpenCode instance starts, recovery awaits SDK calls for sessions belonging to the first instance (documented in comment L241–243)

2. **`lifecycleManager.hydrateFromContinuity()`** (L256):
   - Synchronous
   - Restores lifecycle state from continuity file
   - Runs BEFORE notification drain (priority: continuity first, then drain)

3. **`replayPendingDelegationNotifications()`** (L262):
   - Fire-and-forget via `void`
   - Drians notification queue from continuity records
   - Clears pending notifications after replay to prevent duplicates
   - Double-notification prevention documented (L464–469)

### Recovery Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Delegation recovery | **Partial** | Runs async, incomplete sessions may still be in-flight |
| Continuity hydration | **Complete** | Synchronous, restores all persistence |
| Notification replay | **Partial** | Best-effort (fails silently on first error) |
| Session tracker recovery | **None** | `sessionTracker.initialize()` runs but is immediately `.cleanup()`'d — effectively no-op from a recovery standpoint |
| Event tracker migration | **Complete** | One-shot migration for deprecated directory |

### Missing Recovery Paths

- No recovery for the `TaskStateManager` singleton (in-memory only — lost on restart)
- No recovery for subagent registries (in-memory `Map<string, Set<string>>`)
- No recovery for root budget tracking (in-memory `Map<string, RootBudget>`)
- The session tracker's `initialize()` + `cleanup()` pattern seems contradictory — what does `cleanup()` do immediately after `initialize()`?

---

## 7. Delegation Wiring

### The 7 Delegation Modules Created in `setupDelegationModules()`

```
setupDelegationModules()
│
├── records (Map<string, Delegation>) — in-memory delegation store
├── SlotManager — concurrency slots
├── AgentResolver (needs: client, projectRoot)
├── DelegationDispatcher (needs: agentResolver, slotManager)
├── CompletionDetector — dual-signal completion
├── NotificationRouter (needs: deliver fn, persistPending fn)
├── DelegationLifecycle (needs: CRUD + transition functions)
├── DelegationMonitor (needs: lifecycle hooks, notificationRouter ref)
├── DelegationRetryHandler (needs: persist fn)
├── childSessionStarter (SDK or undefined)
├── DelegationCoordinator (needs: 7 dependencies)
└── DelegationManager (needs: client, 5 dependencies)
```

### Dependencies Flow

```
records(Map)
    ├── DelegationLifecycle (get/getAll/register/transition/transitionToTerminal)
    │       ├── DelegationMonitor (getDelegationRecord, getStatus, getActionCount)
    │       │       └── DelegationCoordinator (monitor)
    │       └── DelegationCoordinator (lifecycle)
    │               ├── DelegationDispatcher (dispatcher)
    │               ├── CompletionDetector (detector)
    │               ├── NotificationRouter (notificationRouter)
    │               ├── DelegationRetryHandler (retryHandler)
    │               ├── childSessionStarter
    │               └── client
    │
    ├── SlotManager ──→ DelegationDispatcher (slotManager)
    ├── AgentResolver ──→ DelegationDispatcher (agentResolver)
    └── NotificationRouter ──→ DelegationManager (notificationRouter)
            └── DelegationCoordinator (notificationRouter)

DelegationManager
    ├── DelegationCoordinator (coordinator)
    ├── DelegationLifecycle (lifecycle)
    ├── DelegationMonitor (monitor)
    ├── NotificationRouter (notificationRouter)
    ├── ptyManager (optional)
    ├── runtimePolicy
    └── sendPromptAsync closure
```

### The 18 Delegation Files (count from imports)

From the import section (lines 12–24):
1. `src/coordination/delegation/agent-resolver.ts`
2. `src/coordination/delegation/coordinator.ts`
3. `src/coordination/delegation/dispatcher.ts`
4. `src/coordination/delegation/lifecycle.ts`
5. `src/coordination/delegation/manager.ts`
6. `src/coordination/delegation/monitor.ts`
7. `src/coordination/delegation/notification-router.ts`
8. `src/coordination/delegation/retry-handler.ts`
9. `src/coordination/delegation/sdk-child-session-starter.ts`
10. `src/coordination/delegation/slot-manager.ts`
11. `src/coordination/delegation/types.ts` (type-only import)

Plus from separate imports:
12. `src/coordination/completion/detector.ts`
13. `src/coordination/spawner/auto-loop.ts`
14. `src/coordination/spawner/ralph-loop.ts`

That's 14 files, not 18. The "18 delegation files" claim in the prompt appears slightly overstated unless counting sub-modules. The delegation subsystem is actually 11 functional modules + 1 types file + 2 spawner files + 1 completion file = 15 files total referenced from plugin.ts.

---

## 8. Anti-Patterns in plugin.ts

### AP-01: Fire-and-Forget Promises (5 instances)

```typescript
void client?.app?.log?.(...)                              // L223
void delegationManager.recoverPending()                    // L244
void replayPendingDelegationNotifications(client)          // L262
void sessionTracker.initialize().then(...).catch(...)     // L276
void (async () => { ... })()                               // L290
```

**Impact:** Fire-and-forget means errors are silently swallowed (except the session tracker one, which has a `.catch`). The migration IIFE (L290) has a try/catch inside, so internal errors are logged, but the IIFE itself is still fire-and-forget.

**Mitigation for some:** The session tracker `.catch` at L278–287 does log the error. The migration IIFE at L308–316 also catches and logs. But the other 3 have no error recovery at all.

### AP-02: Synchronous I/O in Startup Path

```typescript
// In workspace-runtime-policy.ts (called from plugin.ts L232):
readFileSync(policyPath, "utf-8")

// In the migration IIFE (L294-299):
existsSync(sentinelPath), existsSync(legacyDir), rmSync(legacyDir, ...), mkdirSync(stateDir, ...), writeFileSync(sentinelPath, ...)
```

**Impact:** `readFileSync` blocks the event loop during plugin initialization. If the policy file is large or the filesystem is slow (NFS, CI), this adds latency. The migration sync I/O inside a fire-and-forget IIFE blocks the event loop for other async operations during startup.

### AP-03: Direct State Mutation in `setupDelegationModules`

```typescript
const records = new Map<string, Delegation>()  // line 156
// ...
registerDelegation: (delegation) => { records.set(delegation.id, delegation) },  // line 174
transition: (delegationId, status) => {
  const record = records.get(delegationId)
  if (!record || record.status === status) return false
  record.status = status  // MUTATION
  return true
},
```

The `transition` function directly mutates the `status` property of the delegation record object. Since `records` is a `Map<string, Delegation>` and `Delegation` is likely an interface, this works, but it bypasses any immutability guarantees. The record is stored **by reference** and mutated in-place.

### AP-04: Circular Reference via `coordinatorRef`

```typescript
let coordinatorRef: DelegationCoordinator | undefined   // L170
// ...
const coordinator = new DelegationCoordinator(...)       // L203
coordinatorRef = coordinator                              // L204
// ...
monitor.onFirstActionDeadline = (id, sec) => coordinatorRef?.markExecutionUnconfirmed(id, sec)  // L197
```

The `coordinatorRef` pattern is a **forward reference** — the monitor is created before the coordinator, then the coordinator's reference is patched in. This is a mild anti-pattern: the monitor has a reference to `coordinatorRef` that is `undefined` between construction and assignment (L197–204). If the `onFirstActionDeadline` callback fires during that window, it would silently no-op.

### AP-05: Complex Inline Hook Function (tool.execute.after)

Lines 428–452 define a single async function that:
1. Calls `createToolExecuteAfterHook` (returns listener)
2. Calls that listener with input/output
3. Extracts child session ID
4. Records child tool signal
5. Calls `sessionTracker.handleToolExecuteAfter`
6. Calls `createToolAfterWorkflow`

This is 25 lines of inline logic that could be a named function. It's harder to test and harder to maintain.

### AP-06: Type Casting

```typescript
input as Parameters<typeof sessionTracker.handleToolExecuteAfter>[0]  // L443–444
```

Used to sidestep strict type checking in the `tool.execute.after` hook. The `input` and `_output` types don't perfectly match `sessionTracker.handleToolExecuteAfter`'s expected types, so casts are used instead of adapter functions.

### AP-07: Import Casing Inconsistency

- L26: `sendPromptAsync as sdkSendPromptAsync` — alias import
- L9: `mkdirSync` vs Node.js docs typically use `mkdirSync` (same)
- L67-68: `import { loadRuntimePolicy }` then `import { resolveWorkspaceRuntimePolicy }` — two separate import lines for related functions. Minor.

### AP-08: Late Setter for Completion Detector (L272)

```typescript
delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())
```

A setter is called 50 lines after construction to close a dependency loop. This indicates the constructor ordering is fragile — the `DelegationManager` must exist before the `LifecycleManager` (because LifecycleManager takes DelegationManager as a constructor arg), but the completion detector lives on the LifecycleManager. The setter unwinds this circular dependency at the cost of having a temporarily incomplete DelegationManager.

---

## 9. shared/ File-by-File Analysis

### `/src/shared/types.ts` (381 lines)

**Role:** Central type authority for the entire harness. Contains:
- TaskStatus, SessionStats, DelegationMeta, RootBudget, LoopWindow, ToolCallSummary, CapturedResult
- Runtime policy types (ConcurrencyPolicy, BudgetPolicy, TrustedRuntimePolicy, RuntimePolicy, SessionPolicyOverride, etc.)
- Lifecycle types (SessionLifecyclePhase, SessionLifecycleState)
- Continuity store types (SessionContinuityMetadata, SessionContinuityRecord, ContinuityStoreFile)
- Governance types (GovernanceRule, GovernanceViolation, GovernancePersistenceState)
- Re-exports from `../coordination/delegation/types.js` (DelegationStatus, Delegation, etc.)
- Re-exports from `../config/workflow/workflow-types.js` (ConfigWorkflowState, etc.)

**Importers:** 22 files import from `./shared/types.js` (or `../../shared/types.js` from deeper modules):
- `src/plugin.ts` (2 imports)
- `src/index.ts` (re-export)
- `src/shared/helpers.ts`, `src/shared/runtime.ts`, `src/shared/state.ts`, `src/shared/task-status.ts`, `src/shared/workspace-runtime-policy.ts`, `src/shared/runtime-policy.ts`
- `src/task-management/continuity/index.ts`, `src/task-management/continuity/store-cache.ts`, `src/task-management/continuity/delegation-persistence.ts`
- `src/task-management/lifecycle/index.ts`
- `src/task-management/journal/execution-lineage.ts`
- `src/coordination/delegation/manager.ts`, `src/coordination/delegation/dispatcher.ts`, `src/coordination/delegation/state-machine.ts`, `src/coordination/delegation/manager-runtime.ts`
- `src/coordination/concurrency/queue.ts`
- `src/coordination/command-delegation/handler.ts`
- `src/coordination/sdk-delegation/handler.ts`
- `src/coordination/completion/notification-handler.ts`
- `src/tools/delegation/delegation-status.ts`
- `src/tools/hivemind/run-background-command.ts`
- `src/hooks/guards/tool-guard-hooks.ts`
- `src/features/prompt-packet/kernel-packet.ts`
- `src/features/prompt-packet/delegation-packet.ts`

**Assessment:** types.ts is effectively a **type hub** with 22 importers. The file is 381 lines and contains 25+ type/interface/const declarations plus re-exports. It spans 5 distinct concern areas: task status, runtime policy, lifecycle, continuity, and governance. This violates single-responsibility across concerns, though it does not appear to exceed the 500 LOC limit.

### `/src/shared/helpers.ts` (295 lines)

**Role:** Pure utility functions. Contains:
- `isObject`, `getNestedValue`, `asString`, `stableStringify`, `makeToolSignature`
- `extractSdkErrorMessage`, `unwrapData`
- `extractAssistantText`, `extractAllAssistantText`, `hasAssistantWorkEvidence`
- `buildPromptText`, `getPromptToolCompatibility`, `describeError`

**Importers:** 11 files import from helpers.

**Leaf check:** Only imports `PermissionRule` from `./types.js`. True leaf.

**Assessment:** Well-structured. 295 lines is moderate. The file mixes error handling (extractSdkErrorMessage, unwrapData), type utilities (isObject, getNestedValue, asString), text extraction (extractAssistantText, etc.), prompt building, and serialization. Could potentially be split into `helpers/error.ts`, `helpers/text.ts`, `helpers/prompt.ts` but not urgent.

### `/src/shared/session-api.ts` (311 lines)

**Role:** SDK wrapper seam for all OpenCode SDK interactions. Wraps:
- `client.session.create()`, `client.session.get()`, `client.session.status()`, `client.session.abort()`
- `client.session.messages()`, `client.session.prompt()`, `client.session.promptAsync()`
- `client.tui.appendPrompt()`, `client.tui.showToast()`
- Session ID parsing: `getSessionID`, `getParentID`, `getEventSessionID`, `getEventParentID`
- Event parsing: `getEventSessionInfo`, `getEventType`
- `walkParentChain`, `getSessionBehavioralProfile`

**Importers:** 32 import references across src/ (heaviest-used shared file).

**Leaf constraint violation:** Imports from `../routing/behavioral-profile/types.js` and `../routing/behavioral-profile/resolve-behavioral-profile.js` (lines 4–5). This violates the `shared/` leaf constraint that shared should not import from other src/ sectors.

**Assessment:** The violation is caused by the `getSessionBehavioralProfile` function at lines 305–311, which delegates to `resolveBehavioralProfile`. This circular-reference-like pattern could be resolved by moving the behavioral profile function to `routing/` and having callers import from there directly.

### `/src/shared/state.ts` (251 lines)

**Role:** `TaskStateManager` class (singleton) that manages in-process session/budget state. Contains:
- Session stats (total, byTool, loop, warnings)
- Root budget tracking (descendants, reserved)
- Session-to-root mapping
- Delegation metadata
- Subagent registry (OMO Pattern 10)
- Cleanup methods
- Backward-compatible wrapper functions delegating to singleton

**Importers:** 6 files + `src/index.ts` re-export.

**Leaf check:** Only imports types from `./types.js`. True leaf.

**Singleton assessment:** The `TaskStateManager` singleton (`export const taskState = new TaskStateManager()`) stores ALL in-memory state. Since it's module-level, it persists for the lifetime of the process but is lost on restart. No recovery path exists for its contents. See state.ts section below for detailed assessment.

### `/src/shared/runtime-policy.ts` (236 lines)

**Role:** Runtime policy validation and merging. Provides:
- `DEFAULT_RUNTIME_POLICY`
- `loadRuntimePolicy()` — validate + merge workspace policy
- `getRuntimePolicyForSession()` — resolve per-session overrides
- `resolveConcurrencyForKey()` — per-key concurrency
- `resolveBudgetForSession()` — budget resolution

**Importers:** 4 files.

**Leaf check:** Only imports types from `./types.js`. True leaf.

**Assessment:** Well-structured with clear validation boundaries. The separation between workspace-level and session-level policy is clean.

### `/src/shared/runtime.ts` (95 lines)

**Role:** Status inference from SDK transport events. Contains single function `inferContinuityStatusFromEvent()`.

**Importers:** Not directly imported outside shared/ (re-exported through index.ts).

**Leaf check:** Imports from `./helpers.js` and `./types.js`. True leaf.

**Assessment:** Small, focused, well-contained. The `requireEvidence` parameter for gating running status is a good design choice.

### `/src/shared/tool-response.ts` (71 lines)

**Role:** Standard tool-response envelope. Provides `ToolResponse<T>` type, `success()`, `error()`, `pending()` constructors, `isSuccess()` and `isError()` type guards.

**Importers:** 21 tools import from this file. Heaviest-used shared utility.

**Leaf check:** No imports from any file (only type definitions). True leaf.

**Assessment:** Clean, minimal, well-designed. The type discriminator pattern (`kind: "success" | "error" | "pending"`) is sound.

### `/src/shared/tool-helpers.ts` (9 lines)

**Role:** Single function `renderToolResult()` that JSON-stringifies tool output.

**Importers:** 17 tools import this.

**Leaf check:** No imports. True leaf.

**Assessment:** Trivially small. Could be merged into `tool-response.ts` but not urgent.

### `/src/shared/app-api.ts` (24 lines)

**Role:** Wraps `client.app.agents()` SDK call.

**Importers:** 2 files (`delegation/agent-resolver.ts`, `delegation/manager-runtime.ts`).

**Leaf check:** Imports `OpenCodeClient` type from `./session-api.ts` and helpers from `./helpers.js`. True leaf within shared/ hierarchy.

### `/src/shared/workspace-runtime-policy.ts` (38 lines)

**Role:** Reads optional `hivemind.runtime-policy.json` from `.hivemind/state/`.

**Importers:** 1 file (`src/plugin.ts`).

**Leaf check:** Imports `RuntimePolicy` type from `./types.js`. Uses `readFileSync` (sync I/O). True leaf by import graph, but contains sync I/O.

### `/src/shared/plugin-tool-output-summary.ts` (22 lines)

**Role:** Builds redacted single-line summary for tool completion metadata.

**Importers:** 1 file (`src/plugin.ts`).

**Leaf check:** Imports `redactTextSecrets` from `./security/redaction.js`. True leaf.

### `/src/shared/task-status.ts` (22 lines)

**Role:** Task status type, valid transitions, and terminal status check.

**Importers:** Re-exported via `src/index.ts`.

**Leaf check:** Imports `TaskStatus` from `./types.js`. True leaf.

### `/src/shared/security/path-scope.ts` (105 lines)

**Role:** Path containment validation — ensures file operations stay within a trust boundary root.

**Importers:** Used by continuity and config tools.

**Leaf check:** No imports from other shared/ files. True leaf. Uses `node:fs` and `node:path`.

### `/src/shared/security/redaction.ts` (118 lines)

**Role:** Secret redaction for API keys, tokens, passwords. Provides `redactTextSecrets()`, `redactBoundaryFields()`.

**Importers:** Imported by `plugin-tool-output-summary.ts`, tool hooks, and various tools.

**Leaf check:** No imports. True leaf.

**Assessment:** Good coverage of common secret patterns. The recursive `redactUnknown()` function correctly handles nested objects and arrays.

---

## 10. shared/ Dependency Graph

```
                    ┌──────────────────┐
                    │  @opencode-ai/sdk │ (external)
                    └────────┬─────────┘
                             │ import type
                             ▼
┌────────────┐      ┌───────────────┐     ┌──────────────────┐
│  session-  │──────│  helpers.ts   │─────│    types.ts      │
│  api.ts    │      │  (295 LOC)    │     │   (381 LOC)      │
│  (311 LOC) │      └───────────────┘     └────────┬─────────┘
└─────┬──────┘                                      │
      │ imports from                                │ imports from
      │ src/routing/ (LEAF VIOLATION)               │ src/coordination/
      │                                             │ src/config/
      ▼                                             ▼
┌────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  app-api   │     │  runtime.ts  │     │  runtime-policy.ts   │
│  (24 LOC)  │     │  (95 LOC)    │     │   (236 LOC)          │
└────────────┘     └──────────────┘     └──────────────────────┘
                         │                       │
                         │                       ▼
                    ┌────────────┐     ┌──────────────────────┐
                    │  state.ts  │     │workspace-runtime-    │
                    │ (251 LOC)  │     │policy.ts (38 LOC)    │
                    └────────────┘     └──────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │           security/                      │
                    │  ┌─────────────────┐                     │
                    │  │  path-scope.ts  │  redaction.ts       │
                    │  │  (105 LOC)      │  (118 LOC)          │
                    │  └─────────────────┘                     │
                    └─────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────────┐
                    │ plugin-tool-output-     │
                    │ summary.ts (22 LOC)     │
                    └─────────────────────────┘

                    ┌──────────────────────┐
                    │  tool-response.ts    │
                    │  (71 LOC) + tool-    │
                    │  helpers.ts (9 LOC)  │
                    └──────────────────────┘
                    (True leaves — no imports)

                    ┌─────────────────────┐
                    │  task-status.ts      │
                    │  (22 LOC)            │
                    └─────────────────────┘
                    (True leaf — imports only from types.ts)
```

### Legend
- **Solid lines**: Types or function imports
- **Dashed red**: Leaf constraint violation
- **Box**: shared/ internal file
- **Total shared files**: 14 (12 in root + 2 in security/)

---

## 11. shared/ Leaf Constraint Violations

### Violation V1: session-api.ts imports from src/routing/

`src/shared/session-api.ts` lines 4–5:

```typescript
import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"
import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"
```

**Impact:** `session-api.ts` is no longer a leaf module. Any module that imports from `session-api.ts` transitively depends on `src/routing/behavioral-profile/`, which may create circular dependency chains.

**Root cause:** The `getSessionBehavioralProfile()` function at lines 305–311 delegates to `resolveBehavioralProfile()` in routing. This function is only called from one place — it should live in `routing/` directly.

**Fix approach:** Move `getSessionBehavioralProfile()` to `src/routing/behavioral-profile/` and have callers import from there. Remove the import from `session-api.ts`.

### Violation V2: types.ts re-exports from src/coordination/delegation/ and src/config/workflow/

`src/shared/types.ts` line 1:
```typescript
import type { DelegationRecoveryGuarantee, DelegationStatus } from "../coordination/delegation/types.js"
```

And lines 340–365 re-export types and constants from delegation/types.

Lines 373–381 re-export types and constants from config/workflow.

**Impact:** `types.ts` imports and re-exports from non-shared modules. While these are type-only imports (erased at compile time), they create a conceptual dependency from shared/ to deep modules.

**Technical note:** TypeScript type-only imports (`import type`) are erased during compilation, so there is **no runtime import cycle**. However, the conceptual dependency exists: any module importing delegation types from `shared/types.ts` now has a transitive reference to `coordination/delegation/types.ts`, making `shared/types.ts` a re-export hub rather than a leaf type authority.

**Assessment:** This is a **mild violation** given the `import type` guard. The types re-exported are core delegation types that conceptually belong at the shared level anyway. But it violates the letter of the leaf constraint.

---

## 12. types.ts: Dumping Ground Assessment

### Findings

- **381 lines** — not over the 500 LOC limit
- **22 importers** across the entire codebase
- **5 distinct concern areas**: Task status, Runtime policy, Session continuity, Governance, Delegation re-exports

### Is it a dumping ground?

**Partial yes.** The file serves as a single hub for all shared types, which is reasonable in moderation. However:

1. **Runtime policy types** (lines 161–220, 60 lines) could live in their own `runtime-policy-types.ts`
2. **Continuity store types** (lines 247–326, 80 lines) could live in `continuity-types.ts`
3. **Governance types** (lines 300–319, 20 lines) could live in `governance-types.ts`
4. **Re-exports** (lines 340–381, 42 lines) are a code smell — types should be imported from their source, not re-exported through `types.ts`

### Recommendation

Split `types.ts` into:
- `types/task-status.ts` — TaskStatus, SessionStats, DelegationMeta, RootBudget, LoopWindow, etc.
- `types/runtime-policy.ts` — RuntimePolicy, ConcurrencyPolicy, BudgetPolicy, etc.
- `types/continuity.ts` — SessionContinuityMetadata, SessionContinuityRecord, ContinuityStoreFile, etc.
- `types/governance.ts` — GovernanceRule, GovernanceViolation, GovernancePersistenceState
- `types/index.ts` — Facade re-exports for backward compatibility

**Priority:** Low. Not urgent, but would improve maintainability.

---

## 13. session-api.ts Wrapper Assessment

### SDK Methods Wrapped

| SDK Method | Wrapper | Line | Status |
|------------|---------|------|--------|
| `client.session.create()` | `createSession` | 43 | ✅ Wrapped with validation |
| `client.session.get()` | `getSession` | 56 | ✅ Basic |
| `client.session.status()` | `getSessionStatusMap` | 65 | ✅ Typed return |
| `client.session.abort()` | `abortSession` | 73 | ✅ Basic |
| `client.session.messages()` | `getSessionMessages` | 78 | ✅ Supports limit param |
| `client.session.prompt()` | `sendPrompt` | 145 | ✅ Complex — fallback polling |
| `client.session.promptAsync()` | `sendPromptAsync` | 183 | ✅ Minimal |
| `client.tui.appendPrompt()` | `appendTuiPrompt` | 204 | ✅ Basic |
| `client.tui.showToast()` | `showTuiToast` | 216 | ✅ Basic |

### Additional Functions

| Function | Purpose | Line |
|----------|---------|------|
| `getSessionMessageCount` | Count messages via messages() | 94 |
| `getSessionID` | Extract session ID from SDK response | 221 |
| `getParentID` | Extract parent ID from SDK response | 230 |
| `getEventSessionID` | Extract session ID from event | 260 |
| `getEventParentID` | Extract parent ID from event | 272 |
| `walkParentChain` | Walk parent chain up to root | 276 |
| `getSessionBehavioralProfile` | Resolve behavioral profile | 305 |

### Missing Wrappers

These SDK surfaces appear to be **unwrapped**:
- `client.session.list()` — session listing
- `client.session.delete()` — session deletion
- `client.app.*` — app-level operations (except `agents()` wrapped in `app-api.ts`)
- `client.tui.*` — other TUI operations (only appendPrompt and showToast wrapped)
- `client.server.*` — any server operations

### Assessment: Good coverage for delegation-essential operations. The `sendPrompt` function (L145–174) has good complexity handling — it does fallback polling when the synchronous prompt returns empty. The `syncPromptFallbackTimeoutMs` is 30 seconds with 1-second polling, which is reasonable.

### Verification Pattern

The `assertValidSessionID` function (L29–41) validates session IDs start with `"ses"` (or test patterns like `"child-"`/`"parent-"` in test env). This is a runtime guard against malformed session IDs.

---

## 14. state.ts Singleton Assessment

### What TaskStateManager Stores

| Map | Type | Purpose |
|-----|------|---------|
| `rootBudgets` | `Map<string, RootBudget>` | Per-root descendant budgets |
| `sessionToRoot` | `Map<string, string>` | Session → root mapping |
| `sessionStats` | `Map<string, SessionStats>` | Per-session tool stats |
| `sessionDelegationMeta` | `Map<string, DelegationMeta>` | Per-session delegation metadata |
| `subagentSessions` | `Map<string, Set<string>>` | Parent → children registry |

### Is the Singleton Necessary?

**Assessment:** The singleton is architecturally intentional but has trade-offs.

**Arguments for:**
- Matches OMO Pattern 10 (subagent registry)
- Provides a single in-memory process-wide state store
- Backward-compatible wrapper functions (L195–251) allow gradual migration
- All hook consumers (`toolGuardHooks`, `lifecycleManager`, etc.) share the same instance

**Arguments against:**
- **No recovery path** — all state is lost on restart
- **No serialization** — budgets and stats cannot be persisted
- **Process-scoped** — doesn't work across process boundaries (if OpenCode runs multiple plugin instances)
- **Test coupling** — tests that use the singleton must carefully reset state between test runs

### Risk Assessment

| Risk | Severity | Notes |
|------|----------|-------|
| Process restart loses all state | **Medium** | Session stats and delegation metadata are in-memory only |
| Cross-test contamination | **High** | Tests must call `taskState.clear()` between runs or will share state |
| Multi-instance conflicts | **Low** | Each OpenCode process gets its own module instance |
| Memory leak | **Low** | `forgetSession()` removes entries, but ensure it's always called |

### Recommendation

The singleton pattern is acceptable for in-memory session tracking (which is inherently transient). The risk is mitigated by:
1. The continuity store (`continuity.ts`) providing the durable layer for recovery
2. The session stats being advisory (budget enforcement can re-derive from scratch)

---

## 15. sidecar/ Readiness Assessment

### File: `src/sidecar/readonly-state.ts` (120 lines)

### What It Provides

1. **`isCanonicalStatePath()`** — path containment check against `.hivemind/state/` and `.planning/` prefixes
2. **`readCanonicalState()`** — read-only file access with containment enforcement
3. **`refuseCanonicalWrite()`** — write denial guard (always throws)

### Is It Used?

**No.** The grep for `sidecar/readonly-state` across all of `src/` returned zero matches. This module is **designed-but-unwired**.

### What Would Need to Change to Make It Functional

1. **Plugin.ts integration**: `src/plugin.ts` must create a sidecar state reader and expose it to tools or hooks. Something like:
   ```typescript
   const readOnlyState = { projectRoot, isCanonicalStatePath, readCanonicalState, refuseCanonicalWrite }
   ```

2. **Sidecar tool(s)**: There are no tools that call `readCanonicalState()`. A new tool (e.g., `read-sidecar-state`) or integration into existing tools (like `hivemind-doc`) would be needed.

3. **Sidecar server integration**: The `src/sidecar/` directory implies a Next.js sidecar application (per Q2 in the validation decisions). The sidecar app would import `readonly-state.ts` to guard its state reads, but no sidecar server code exists yet.

4. **npm package export**: `src/sidecar/` is not exported from `src/index.ts` (which only exports plugin + shared + coordination + task-management + features modules). The sidecar would need its own export path or be imported directly.

5. **Readiness Score: 2/10**
   - ✅ Path containment logic is correct and handles symlinks
   - ✅ Error messages are clear and use `[Harness]` prefix
   - ✅ TypeScript type is properly exported
   - ❌ **Not imported anywhere in the codebase**
   - ❌ **No tools consume it**
   - ❌ **No sidecar server exists**
   - ❌ **Not exported from package entrypoint**
   - ❌ **No tests exist** (confirmed by absence in `tests/`)

### Assessment

`readonly-state.ts` appears to be a **spec-driven placeholder** — written during Phase 42 planning as a contract surface, but never wired into the actual runtime. It is correct code that cannot currently do anything useful.

---

## 16. Recommendations

### Immediate (High Priority)

| # | Finding | Recommendation | Effort |
|---|---------|---------------|--------|
| R1 | `session-api.ts` imports from `routing/` (leaf violation) | Move `getSessionBehavioralProfile()` to `routing/` and remove the import from `session-api.ts` | Small |
| R2 | 5 fire-and-forget promises with no error handling | Add `.catch()` handlers to all `void` promises, at minimum logging the error | Small |
| R3 | Singleton `TaskStateManager` has no cleanup hook | Ensure `forgetSession()` is called in session lifecycle cleanup (or add a guard) | Medium |

### Short-term (Medium Priority)

| # | Finding | Recommendation | Effort |
|---|---------|---------------|--------|
| R4 | `types.ts` has 22 importers across 5 concern areas | Split into `types/` directory with sub-modules and facade re-exports | Medium |
| R5 | `setupDelegationModules` mutates delegation records in-place | Use immutable update pattern with spread operators | Small |
| R6 | No sidecar tools or integration exist | Either wire `readonly-state.ts` into a tool or formally document it as deferred | Medium |
| R7 | 13 tools receive only `projectDirectory` | Audit whether these tools read files directly or could share a state reader abstraction | Small |

### Long-term (Lower Priority)

| # | Finding | Recommendation | Effort |
|---|---------|---------------|--------|
| R8 | `helpers.ts` (295 LOC) mixes 5 concern areas | Split into `helpers/error.ts`, `helpers/text.ts`, `helpers/prompt.ts` | Medium |
| R9 | Sync I/O in startup path | Convert `readFileSync` to `readFile` with graceful fallback | Medium |
| R10 | `coordinatorRef` forward reference pattern | Refactor `setupDelegationModules()` to use builder pattern or pass coordinator to monitor after construction | Small |
| R11 | `config: async () => {}` no-op | Either implement config wiring or document why it's intentionally no-op | Small |

---

## Appendix: LOC Summary

| File | LOC | Role |
|------|-----|------|
| `src/plugin.ts` | 493 | Composition root |
| `src/index.ts` | 30 | Public API re-exports |
| `src/shared/types.ts` | 381 | Type authority |
| `src/shared/helpers.ts` | 295 | Utility functions |
| `src/shared/session-api.ts` | 311 | SDK wrapper |
| `src/shared/state.ts` | 251 | TaskStateManager singleton |
| `src/shared/runtime-policy.ts` | 236 | Policy validation |
| `src/shared/runtime.ts` | 95 | Status inference |
| `src/shared/tool-response.ts` | 71 | Response envelope |
| `src/shared/security/path-scope.ts` | 105 | Path containment |
| `src/shared/security/redaction.ts` | 118 | Secret redaction |
| `src/shared/workspace-runtime-policy.ts` | 38 | Policy file reader |
| `src/shared/app-api.ts` | 24 | App agent reader |
| `src/shared/plugin-tool-output-summary.ts` | 22 | Output summary |
| `src/shared/tool-helpers.ts` | 9 | Result renderer |
| `src/shared/task-status.ts` | 22 | Status transitions |
| `src/sidecar/readonly-state.ts` | 120 | Sidecar guards (unwired) |
| `src/kernel/.gitkeep` | 0 | Placeholder |
| `src/harness/.gitkeep` | 0 | Placeholder |
| **Total** | **2,481** | |

---

**Analysis by:** mimo-v2.5-pro-precision / GSD codebase mapper
**Evidence level:** L4 (source-backed analysis, all claims traceable to read file contents and grep results)
