Now I have all the data needed for a comprehensive analysis. Here are my structured findings:

---

## Structured Architecture Analysis

### File Inventory & Line Counts

| File | Lines | Role |
|------|-------|------|
| `src/plugin.ts` | 483 | Plugin entry point, hook handlers, `delegate-task` tool |
| `src/lib/continuity.ts` | **635** | Durable file-based session continuity store |
| `src/lib/lifecycle-manager.ts` | **628** | Orchestrates session lifecycle (create, queue, dispatch, observe) |
| `src/lib/session-api.ts` | **473** | OpenCode client SDK adapter (multi-path fallback API calls) |
| `src/lib/types.ts` | 155 | Shared type definitions and constants |
| `src/lib/helpers.ts` | 141 | Utility functions |
| `src/lib/routing.ts` | 113 | Category-to-agent/model/temperature routing logic |
| `src/lib/runtime.ts` | 154 | Effective prompt state resolution & event status inference |
| `src/lib/state.ts` | 106 | In-memory session state (stats, budgets, delegation metadata) |
| `src/lib/concurrency.ts` | 98 | Semaphore-based concurrency queue |

**Total: ~2,986 lines across 10 files.**

---

### 1. Architecture Pattern

**Pattern: Plugin-based Event-Driven Middleware with Hierarchical Delegation.**

This is an **OpenCode plugin** that implements a *control plane* for orchestrating delegated agent sessions. It registers as a `Plugin` and hooks into the OpenCode lifecycle via named middleware hooks:

- `"tool.execute.before"` -- pre-tool middleware (circuit breaker, budget enforcement, permission checks)
- `"tool.execute.after"` -- post-tool middleware (metadata injection)
- `"event"` -- event consumer (session lifecycle tracking)
- `"experimental.session.compacting"` -- context preservation during compaction
- `"chat.params"` -- parameter override (model, temperature)
- `"shell.env"` -- environment hardening
- `tool["delegate-task"]` -- custom tool (session creation, delegation, polling)

The architecture is **not a pure middleware pipeline** -- it is a **hierarchical delegation orchestrator** that manages a tree of parent->child agent sessions with budgets, concurrency, and durable state continuity.

---

### 2. Key Abstractions & How They Connect

```
                    plugin.ts (entry point)
                         |
            [lifecycle-manager.ts]  <--- central orchestrator
            /        |          \         (owns the delegation flow)
           /         |          \
   [continuity.ts] [state.ts] [concurrency.ts]
   (durable store)  (in-mem)   (semaphore queue)
          |
   [session-api.ts]  <--- SDK adapter (multi-path fallback)
          |
   [routing.ts]  <--- resolves category -> agent/model/temperature
          |
   [runtime.ts]  <--- computes effective prompt state from multiple sources
          |
   [helpers.ts]  <--- shared utilities
   [types.ts]    <--- shared type definitions
```

**Key abstractions in detail:**

| Abstraction | Location | Responsibility |
|---|---|---|
| `HarnessControlPlane` (Plugin) | `plugin.ts:104` | Entry factory. Registers hooks, owns configuration constants, wires everything together. |
| `HarnessLifecycleManager` | `lifecycle-manager.ts:114` | State machine for session lifecycle (created -> queued -> dispatching -> running -> completed/failed). Owns the concurrency queue. |
| `DelegationConcurrencyQueue` | `concurrency.ts:36` | Semaphore per concurrency key (model/agent/category). Pending queue with FIFO release. |
| `ContinuityStoreFile` | `continuity.ts` / `types.ts:151` | Durable JSON file store at `.opencode/state/hivemind/session-continuity.json`. Survives restarts. |
| `SessionStats` / `RootBudget` / `DelegationMeta` | `state.ts` (in-memory Maps) | Ephemeral runtime state: tool call counters, descendant budgets, delegation metadata. |
| `EffectivePromptState` | `runtime.ts:8` | Merged view of agent/model/temperature/tools from continuity, route, delegation, or chat input. Resolution priority chain. |
| `DelegationRouteResolution` | `routing.ts:69` / `types.ts:55` | Resolves a (category?, agent?, model?) triple into a concrete agent + model + temperature + guidance. |
| `Session API functions` | `session-api.ts` | Polyfill/adapter over OpenCode SDK with multi-path fallback for API instability. |

---

### 3. Module Boundaries

| Module | Boundary Description |
|---|---|
| **`plugin.ts`** | **Composition root.** Imports from all lib modules. Defines hook handlers and the `delegate-task` tool. Does NOT contain business logic -- delegates to lifecycle-manager and state modules. |
| **`lifecycle-manager.ts`** | **Session orchestration.** Manages the full lifecycle: create -> queue -> dispatch -> observe -> complete. Reads/writes continuity, state, and uses session-api. |
| **`continuity.ts`** | **Durable persistence layer.** JSON file read/write with normalization. Deep-clone-on-read to prevent aliasing. Cache-first with disk fallback. No business logic. |
| **`session-api.ts`** | **SDK adapter.** Wraps `client.session.*` calls with multi-path fallback (path-param variants, body-param variants). Handles polling, SSE, message extraction. |
| **`state.ts`** | **In-memory ephemeral state.** Four `Map` stores for stats, budgets, delegation metadata, session-to-root mapping. No disk I/O. |
| **`routing.ts`** | **Routing table.** Static category configs map to agent/model/temperature/guidance. Pure computation, no side effects. |
| **`runtime.ts`** | **Prompt state resolver.** Merges multiple state sources (continuity, route, delegation, chat input) into a single effective prompt state. Also infers session status from events. |
| **`concurrency.ts`** | **Concurrency control.** Keyed semaphore implementation. No external dependencies. |
| **`helpers.ts`** | **Shared utilities.** `isObject`, `asString`, `getNestedValue`, `unwrapData`, `stableStringify`, `makeToolSignature`, `buildPromptText`, tool restriction lookup. |
| **`types.ts`** | **Type definitions and constants.** Zero logic. All shared interfaces, type aliases, and const arrays. |

---

### 4. Import Graph

```
plugin.ts
  --> continuity.ts (getSessionContinuity, getContinuityStoragePath)
  --> helpers.ts (asString, buildPromptText, getNestedValue, ...)
  --> routing.ts (isDelegationCategory, listDelegationCategories, resolveDelegationRoute)
  --> lifecycle-manager.ts (createHarnessLifecycleManager)
  --> runtime.ts (getEffectivePromptState)
  --> session-api.ts (getEventSessionID, getSessionID, walkParentChain)
  --> state.ts (addWarning, ensureSessionStats, getDelegationMeta, getSessionStats, reserveDescendant)
  --> types.ts (DelegationCategory, PermissionRule, SpecialistAgent, MAX_DESCENDANTS_PER_ROOT, VALID_AGENTS)

lifecycle-manager.ts
  --> concurrency.ts (buildDelegationQueueKey, DelegationConcurrencyQueue)
  --> continuity.ts (recordSessionContinuity, patchSessionContinuity, ...)
  --> state.ts (commitDescendant, forgetSession, hydrateDelegationState, ...)
  --> runtime.ts (inferContinuityStatusFromEvent)
  --> session-api.ts (createSessionByAnyPath, promptSessionByAnyPath, waitForAssistantText, ...)
  --> types.ts (multiple types)

runtime.ts
  --> continuity.ts (getSessionContinuity)
  --> helpers.ts (asString, getNestedValue)
  --> routing.ts (getTemperatureForAgent)
  --> state.ts (getDelegationMeta)
  --> types.ts (VALID_AGENTS, types)

session-api.ts
  --> helpers.ts (asString, getNestedValue, isObject, sleep, stableStringify, unwrapData)
  --> types.ts (SessionStatus)

continuity.ts
  --> types.ts (many types, VALID_DELEGATION_CATEGORIES)

routing.ts
  --> types.ts (VALID_DELEGATION_CATEGORIES, types)

state.ts
  --> types.ts (DelegationMeta, RootBudget, SessionStats)

helpers.ts
  --> types.ts (PermissionRule)

concurrency.ts
  --> (no imports -- fully self-contained)

types.ts
  --> (no imports -- leaf node)
```

**Dependency depth (longest chain):** `plugin.ts -> lifecycle-manager.ts -> continuity.ts -> types.ts` (4 levels)

**Coupling hotspots:** `plugin.ts` and `lifecycle-manager.ts` are the most heavily importing modules (8 and 6 modules respectively). `types.ts` is imported by everything except `concurrency.ts`.

---

### 5. State Management Approach

The codebase uses a **dual-layer state architecture**:

| Layer | Storage | Persistence | Module | Purpose |
|---|---|---|---|---|
| **Ephemeral** | `Map<string, T>` (4 maps) | In-memory, lost on restart | `state.ts` | Tool call stats, loop detection, root budgets, delegation metadata |
| **Durable** | JSON file on disk | Survives restarts | `continuity.ts` | Full session continuity records with lifecycle, permissions, routing |

**Ephemeral state (`state.ts`):**
- `sessionStats: Map<sessionID, SessionStats>` -- tool call counts, loop window, warnings
- `rootBudgets: Map<rootID, RootBudget>` -- descendant tracking (Set of child IDs + reservation counter)
- `sessionToRoot: Map<sessionID, rootID>` -- reverse lookup
- `sessionDelegationMeta: Map<sessionID, DelegationMeta>` -- delegation metadata

**Durable state (`continuity.ts`):**
- Single JSON file at `.opencode/state/hivemind/session-continuity.json`
- Module-level `storeCache` variable -- lazy-loaded, cache-first
- Deep clone on read (`cloneContinuityRecord`) to prevent mutation aliasing
- Write-through on every mutation (`persistStore()` called in `recordSessionContinuity`, `patchSessionContinuity`, `deleteSessionContinuity`)
- On startup, `hydrateFromContinuity()` re-populates in-memory maps from disk

**Hydration flow:** `continuity.ts` (disk) -> `lifecycle-manager.hydrateFromContinuity()` -> `state.ts` (in-memory maps)

**Notable:** The `storeCache` in `continuity.ts` is a module-level singleton with no invalidation mechanism beyond process restart. There is no lock file or concurrent-write protection for the JSON file.

---

### 6. Error Handling Patterns

**Pattern A: Throw with `[Harness]` prefix (expected flow control)**
Used throughout as intentional flow control -- budget exceeded, circuit breaker tripped, invalid agent, depth exceeded. The prefix allows callers to distinguish harness-originated errors.
- `plugin.ts:128-130` -- tool call budget exceeded
- `plugin.ts:146-149` -- circuit breaker tripped
- `plugin.ts:158-161` -- tool restricted for agent
- `plugin.ts:411` -- invalid agent
- `plugin.ts:439` -- depth exceeded

**Pattern B: Multi-path fallback with last-error throw**
`session-api.ts` tries multiple SDK call signatures (path variants), catches all errors, and only throws the last one if all attempts fail. Used in `getSessionByAnyPath`, `createSessionByAnyPath`, `promptSessionByAnyPath`, `getMessagesByAnyPath`.

**Pattern C: Silent catch / graceful degradation**
- `continuity.ts:85-87` -- `loadStoreFromDisk()` catches JSON parse failures and returns empty store
- `lifecycle-manager.ts:231-233` -- `cancelDelegatedSession()` catches abort failures silently
- `session-api.ts:87-93` -- `getDirectSessionStatus()` catches and returns `undefined`
- `session-api.ts:414-416` -- SSE failure falls back to polling

**Pattern D: State rollback on failure**
- `lifecycle-manager.ts:451-454` -- `rollbackReservation()` if child session creation fails
- `lifecycle-manager.ts:358-372` -- queue release + lifecycle patch to "failed" on dispatch failure

**Pattern E: Warning accumulation (non-fatal)**
- `state.ts:addWarning()` -- caps at 25 warnings per session, stored in `SessionStats.warnings`
- `plugin.ts:127,143,156` -- adds warnings before throwing errors

---

### 7. Code Smells

#### 7a. Files Over 200 LOC That Should Be Split

| File | Lines | Concern |
|---|---|---|
| **`continuity.ts`** | **635** | **Critical smell.** This file does three distinct jobs: (1) normalization/defensive parsing (~300 lines of `normalize*` functions), (2) deep-clone helpers (~70 lines of `clone*` functions), (3) CRUD persistence operations (~130 lines). The normalization layer alone could be `continuity-normalizer.ts`. The clone helpers could be `continuity-clone.ts`. |
| **`lifecycle-manager.ts`** | **628** | **Borderline smell.** The `launchDelegatedSession` method alone is ~210 lines (247-457). The queue management (`acquireQueue`), background observation (`observeBackgroundCompletion`), and event handling (`handleEvent`) are distinct concerns. The `patchLifecycle` private method is called 11 times -- it is the God Method bottleneck. |
| **`session-api.ts`** | **473** | **Borderline smell.** The multi-path fallback pattern is copy-pasted 5 times with slight variations. The polling/waiting functions (`waitForSessionCompletion`, `waitForAssistantText`, `waitForSessionCompletionWithFallback`, `waitForSessionCompletionViaSSE`) could be extracted to a `session-waiter.ts` module (~180 lines). |
| **`plugin.ts`** | **483** | **Borderline smell.** The `"experimental.session.compacting"` handler (lines 221-333) is a 112-line block of string concatenation. This could be extracted to a `compaction-formatter.ts`. The permission rules factory (`getPermissionRulesForAgent`, lines 67-102) could live in a `permissions.ts` module. |

#### 7b. Duplicated Utility Functions

**`asString` is defined identically in two places:**
- `helpers.ts:48-50` (exported)
- `continuity.ts:110-112` (file-private)

**`isRecord` / `isObject` are near-identical:**
- `helpers.ts:14-16` -- `isObject()` (checks for null, Array)
- `continuity.ts:106-108` -- `isRecord()` (checks for null, Array, identical logic but different name)

These should use the shared version from `helpers.ts`.

#### 7c. Mixed Responsibilities

**`plugin.ts` mixes:**
1. Plugin hook registration (middleware)
2. Permission rule definitions (should be in `permissions.ts` or `routing.ts`)
3. Configuration constants (`MAX_DEPTH`, `POLL_INTERVAL_MS`, etc.) scattered at file top
4. Validation logic (`isValidAgent`, `normalizeCategory` -- these belong in `routing.ts` or `types.ts`)

**`helpers.ts` has two distinct responsibilities:**
1. Generic utility functions (`isObject`, `asString`, `getNestedValue`, `stableStringify`) -- truly "helpers"
2. Agent-specific business logic (`isToolRestrictedForAgent`, `RESTRICTED_TOOLS_PER_AGENT`, `AGENT_REQUIRED_TOOLS`, `AGENT_MUST_NOT`, `buildPromptText`) -- these are agent configuration/prompt building, not "helpers"

The tool restriction lookup tables (`RESTRICTED_TOOLS_PER_AGENT`, `AGENT_REQUIRED_TOOLS`, `AGENT_MUST_NOT`) are duplicated conceptually with the `PermissionRule` system -- the `RESTRICTED_TOOLS_PER_AGENT` map in `helpers.ts` and the `getPermissionRulesForAgent()` in `plugin.ts` encode overlapping restrictions.

#### 7d. Catch-All Utils

**`helpers.ts` is a catch-all.** It contains 10 exports spanning: type guards (`isObject`, `asString`), safe navigation (`getNestedValue`), serialization (`stableStringify`, `makeToolSignature`), SDK response handling (`unwrapData`), prompt text building (`buildPromptText`), tool compatibility mapping (`getPromptToolCompatibility`), and tool restriction lookups (`isToolRestrictedForAgent`). At minimum, the prompt-building and tool-restriction logic should be extracted.

#### 7e. `any` Type Pervasiveness

The `client` parameter flows through as `any` in:
- `plugin.ts:104` -- `client` parameter
- `session-api.ts` -- every function takes `client: any`
- `lifecycle-manager.ts:118` -- stored as `options.client: any`

This defeats TypeScript's type safety across the SDK boundary. A `OpenCodeClient` interface (even a minimal one) would catch API misuse at compile time.

#### 7f. Module-Level Singleton State

`continuity.ts:26` declares `let storeCache: ContinuityStoreFile | undefined` at module scope. This makes the module stateful and prevents testing in isolation. The store should be an instance passed through or a class.

#### 7g. No `index.ts` Barrel Export

There is no `src/lib/index.ts` re-exporting the public API. `plugin.ts` imports directly from individual files using deep paths (`./lib/continuity.js`, `./lib/state.js`). This is not necessarily a smell -- it makes dependencies explicit -- but it means there is no encapsulation boundary for the lib package. Every consumer can reach into any module.

---

### Summary Assessment

| Dimension | Rating | Notes |
|---|---|---|
| **Architecture clarity** | Strong | Clear plugin/hook pattern. Well-defined delegation lifecycle. |
| **Module cohesion** | Moderate | `continuity.ts` and `helpers.ts` have low cohesion (mixed concerns). `lifecycle-manager.ts` is cohesive but oversized. |
| **Coupling** | Moderate | `plugin.ts` is a God import site (8 modules). `types.ts` is a good shared leaf. `lifecycle-manager.ts` couples to 6 modules. |
| **State management** | Adequate | Dual-layer (in-memory + durable) is reasonable. Hydration flow is clean. Lack of write locking and singleton cache are risks. |
| **Error handling** | Good | Consistent `[Harness]` prefix, graceful fallbacks, rollback on failure. Silent catches are justified. |
| **Testability** | Weak | Module-level singletons, `any`-typed clients, no dependency injection for continuity store. Would require monkey-patching for unit tests. |
| **Code duplication** | Minor | `asString`/`isRecord` duplicated. Tool restriction tables overlap with permission rules. Multi-path fallback copy-pasted 5x. |