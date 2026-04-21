# src/lib — Core Library

Business logic layer for the harness control plane. All modules are imported by `src/plugin.ts` (composition root above).

## MODULE RESPONSIBILITIES

| Module | LOC | Role | Key Exports |
|--------|-----|------|-------------|
| `continuity.ts` | ~401 | Durable JSON persistence + normalization + deep-clone | `getSessionContinuity`, `recordSessionContinuity`, `patchSessionContinuity`, `hydrateFromContinuity` |
| `lifecycle-manager.ts` | ~152 | Session lifecycle state machine — STUB (launchDelegatedSession() throws, pending restoration). Currently provides: isValidTransition(), hydrateFromContinuity(), handleEvent(), cancelDelegatedSession() | `createHarnessLifecycleManager`, `launchDelegatedSession`, `handleEvent`, `cancelDelegatedSession` |
| `session-api.ts` | ~109 | Typed OpenCode SDK wrappers (no multi-path fallback, no completion detection) | `createSession`, `getSession`, `abortSession`, `getSessionMessages`, `sendPrompt`, `getSessionID`, `getParentID`, `getEventSessionID`, `getEventParentID`, `walkParentChain` |
| `completion-detector.ts` | ~120 | Two-signal completion detection: session.idle + stability timer | `CompletionDetector` class with `feed()`, `watch()`, `cancel()`, `feedMessageCount()` |
| `notification-handler.ts` | ~100 | Notification flow for async completion | `buildNotificationMessage`, `notifyParentSession` |
| `task-status.ts` | ~100 | Task status type system + transition guards | `TaskStatus`, `canTransition()`, `isTerminal()`, `VALID_TRANSITIONS` |
| `delegation-persistence.ts` | ~78 | Delegation record persistence helper (extracted from delegation-manager) | `getDelegationsFilePath`, `persistDelegations`, `readPersistedDelegations` |
| `helpers.ts` | ~107 | Pure utilities only (no agent config) | `isObject`, `asString`, `getNestedValue`, `unwrapData`, `stableStringify`, `makeToolSignature`, `buildPromptText`, `getPromptToolCompatibility`, `extractSdkErrorMessage` |
| `runtime.ts` | ~43 | Event→status mapping only (platform handles agent/model/temperature) | `inferContinuityStatusFromEvent` |
| `state.ts` | ~106 | In-memory Maps: sessionStats, rootBudgets, sessionToRoot, sessionDelegationMeta | `ensureSessionStats`, `reserveDescendant`, `getDelegationMeta`, `setDelegationMeta` |
| `concurrency.ts` | ~98 | Keyed semaphore (FIFO queue per model+agent+category key) | `DelegationConcurrencyQueue`, `buildDelegationQueueKey` |
| `types.ts` | ~155 | Shared types + constants — leaf node, imported by most modules | `VALID_AGENTS`, `VALID_DELEGATION_CATEGORIES`, `TaskStatus`, all type definitions |

## DEPENDENCY GRAPH

```
types.ts (leaf — no imports)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts (self-contained — no imports)
├── continuity.ts → types.ts
├── delegation-persistence.ts → types.ts, continuity.ts
├── session-api.ts → helpers.ts
├── runtime.ts → helpers.ts + types.ts
├── completion-detector.ts (self-contained — no imports)
├── notification-handler.ts → helpers.ts
└── lifecycle-manager.ts → concurrency.ts + continuity.ts + helpers.ts + session-api.ts + state.ts + types.ts

delegation-manager.ts → concurrency.ts + continuity.ts + delegation-persistence.ts + helpers.ts + types.ts, @opencode-ai/sdk
```

**Max chain:** 2 levels. `types.ts` changes ripple to most modules.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Change session persistence format | `continuity.ts` — `loadStoreFromDisk()`, `persistStore()`, `normalize*()` functions |
| Add a session lifecycle phase | `types.ts` (SessionLifecyclePhase) + `lifecycle-manager.ts` state machine |
| Change SDK call patterns | `session-api.ts` — typed wrappers, canonical call shapes |
| Change concurrency model | `concurrency.ts` — `DelegationConcurrencyQueue.acquire()/release()` |
| Change completion detection | `completion-detector.ts` — `feed()`, `watch()`, `cancel()`, `feedMessageCount()` |
| Change notification flow | `notification-handler.ts` — `buildNotificationMessage()`, `notifyParentSession()` |
| Change task status transitions | `task-status.ts` — `VALID_TRANSITIONS` map + `canTransition()` guard |
| Persist / read delegation records | `delegation-persistence.ts` — `persistDelegations()`, `readPersistedDelegations()` |
| Change agent temperature config | `plugin.ts` — `AGENT_DEFAULTS` constant |
| Change tool restriction for agent | `plugin.ts` — `AGENT_TOOLS` constant |
| Change circuit breaker threshold | `plugin.ts` — `CIRCUIT_BREAKER_THRESHOLD` constant |
| Change tool call budget | `plugin.ts` — `MAX_TOOL_CALLS_PER_SESSION` constant |

## CONVENTIONS

- **Deep-clone-on-read** in continuity store — all `clone*()` functions prevent mutation aliasing
- **Warning cap**: `addWarning()` in `state.ts` caps at 25 per session
- **Semaphore keys** built from `buildDelegationQueueKey()` — combines model + agent + category
- **[Harness] prefix** on all thrown errors — flow control, not bugs
- **Dual-layer state**: durable JSON file (`continuity.ts`) + in-memory Maps (`state.ts`), hydrated on startup
- **Typed SDK wrappers** in `session-api.ts` — canonical call shapes, no multi-path fallback
- **No `any` types** on new code — `client: any` is known tech debt from SDK

## CODE SMELLS

1. **`continuity.ts` (401 LOC)** — Still mixed (normalization + clone + CRUD) but under split threshold. Monitor if it grows past 500.
2. **`delegation-manager.ts` (450 LOC)** — Largest functional module. WaiterModel dispatch + stability polling + persistence. Could extract PTY-specific logic if it grows.
3. **`asString` duplicated** in `helpers.ts` and `continuity.ts` — consolidation pending
4. **`continuity.ts:26` module-level `storeCache` singleton** — prevents isolated unit testing

## NOTES

- `routing.ts` was DELETED — agent `.md` files define temperature/model/permissions natively
- `session-completion-tracker.ts` was DELETED — replaced by `CompletionDetector` with stability detection
- `session-api.ts` no longer has multi-path fallback or completion detection — just typed SDK wrappers
- `helpers.ts` no longer has agent config maps — pure utilities only
- `runtime.ts` trimmed to event inference only — platform handles agent/model resolution
- `TaskStatus` (7-value) replaces old 4-value `SessionContinuityMetadata.status` — BREAKING CHANGE to continuity JSON format
