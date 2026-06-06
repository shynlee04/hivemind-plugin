# C8 Cluster Inventory: Foundation — Shared Layer + Composition Root [AUDIT-03 - Deep Inventory]

**Cluster:** C8 — Foundation (shared module layer, plugin composition root, public API surface)
**Analysis Date:** 2026-06-06
**Inventory Base:** `src/shared/` (16 files, ~2,369 LOC), `src/plugin.ts` (1,076 LOC), `src/index.ts` (30 LOC)

---

## 1. Cluster Overview

C8 is the **most cross-cutting cluster** in the Hivemind harness. Every other cluster imports from `src/shared/` — it provides the shared types, SDK wrappers, state management, runtime policy, security primitives, and tool infrastructure that all other clusters consume. The cluster also includes the **composition root** (`src/plugin.ts`) which instantiates and wires every other cluster's modules, and the **public API surface** (`src/index.ts`) which re-exports selected modules to npm consumers.

### C8's Dual Role

C8 serves two distinct roles that should be understood separately:

1. **Foundation Library (`src/shared/`)**: Leaf or near-leaf utility modules that provide shared contracts and infrastructure. These should have zero or minimal imports from other clusters.
2. **Composition Root (`src/plugin.ts` + `src/index.ts`)**: Orchestration code that imports from EVERY cluster to assemble the plugin. This is inherently cross-cutting by design.

### Files at a Glance

| Layer | Files | LOC | Role |
|-------|-------|-----|------|
| Shared library | 16 files | ~2,369 | Foundation contracts, SDK wrappers, state, security |
| Composition root | `src/plugin.ts` | 1,076 | Wires all clusters together |
| Public API | `src/index.ts` | 30 | npm package entry point |

**Total C8 source files:** 18
**Total C8 test files:** 7 (4 direct + 3 indirect)
**Total C8 LOC:** 3,475

---

## 2. Source Topology

```
src/
├── shared/                          # Foundation library (16 files, ~2,369 LOC)
│   ├── types.ts                     # 422 LOC — canonical types, 28 src consumers
│   ├── helpers.ts                   # 334 LOC — utility functions, 16 src consumers
│   ├── session-api.ts               # 432 LOC — OpenCode SDK wrappers, 47 src consumers
│   ├── state.ts                     # 251 LOC — TaskStateManager + singleton, 12 src consumers
│   ├── tool-response.ts             # 71 LOC — ToolResponse envelope, 23 src consumers
│   ├── tool-helpers.ts              # 9 LOC — renderToolResult utility, 25 src consumers
│   ├── task-status.ts               # 22 LOC — TaskStatus transitions, 1 src consumer
│   ├── session-naming.ts            # 156 LOC — session title generate/parse, 8 src consumers
│   ├── runtime-policy.ts            # 236 LOC — runtime policy resolvers, 4 src consumers
│   ├── runtime.ts                   # 95 LOC — continuity status inference, 5 src consumers
│   ├── workspace-runtime-policy.ts  # 38 LOC — workspace policy file reader, 1 src consumer
│   ├── plugin-tool-output-summary.ts # 22 LOC — tool output summarizer, 1 src consumer
│   ├── app-api.ts                   # 24 LOC — getAppAgents wrapper, 4 src consumers
│   ├── security/
│   │   ├── path-scope.ts            # 105 LOC — path traversal protection, 6 src consumers
│   │   └── redaction.ts             # 118 LOC — data redaction, 2 src consumers
│   └── errors/
│       └── commands.ts              # 34 LOC — command error classes, 3 src consumers
├── plugin.ts                        # 1,076 LOC — composition root (85 imports)
└── index.ts                         # 30 LOC — public API (23 export lines)
```

---

## 3. Shared Module Inventory

### 3.1 `src/shared/types.ts` (422 LOC) — ⭐ MOST CRITICAL

**Purpose:** Canonical type definitions for the entire harness. Contains 30+ exported types including `TaskStatus`, `SessionContinuityRecord`, `RuntimePolicy`, `DelegationMeta`, `PendingNotification`, lifecycle status types, governance types, and backward-compatible re-exports from C3 delegation types and C1 workflow types.

**What it provides:** The shared contract authority. ALL clusters import from this file.

**Consumers (28 src imports):** C1 (bootstrap, governance, hooks), C2 (continuity, lifecycle, journal, session-tracker, contracts), C3 (delegation, coordination, concurrency, command-delegation), C5 (prompt-packet), C8 (plugin, index). Imported by 26 distinct source files.

**Cluster distribution:**
| Cluster | Count | Examples |
|---------|-------|---------|
| C1 (Hooks/Governance) | 2 | `hooks/guards/tool-guard-hooks.ts`, `features/governance-engine/evaluator.ts` |
| C2 (Task Mgmt) | 7 | `continuity/index.ts`, `lifecycle/index.ts`, `journal/execution-lineage.ts` |
| C3 (Coordination) | 8 | `delegation/manager.ts`, `delegation/state-machine.ts`, `concurrency/queue.ts` |
| C5 (Tools) | 3 | `delegation-status.ts`, `run-background-command.ts`, `validate-command.ts` |

**Dead exports (12 types exported but never imported externally):**
| Type | External References | Status |
|------|-------------------|--------|
| `SessionPromptParams` | 0 | ✅ DEAD |
| `SessionToolProfile` | 0 | ✅ DEAD |
| `SessionBudgetOverride` | 0 | ✅ DEAD |
| `SessionConcurrencyOverride` | 0 | ✅ DEAD |
| `HarnessStatus` | 0 | ✅ DEAD |
| `DelegationPacketStatus` | 0 | ✅ DEAD |
| `LoopWindow` | 0 | ✅ DEAD |
| `ToolCallSummary` | 0 | ✅ DEAD |
| `CapturedResult` | 0 | ✅ DEAD |
| `PermissionAction` | 0 | ✅ DEAD |
| `SessionStatusType` | 0 | ✅ DEAD |
| `DelegationPacket` | 0 | ✅ DEAD |

**Test coverage:** No dedicated test file (`tests/lib/types.test.ts` does not exist). Tested indirectly through many integration tests that import types from this file.

**Flaws:**
- 12 dead types increasing module size and causing maintenance confusion
- 28 direct import consumers mean any type change triggers cascade effects
- Re-exports from C3 (`DelegationStatus`, `POLL_INTERVAL_*`) create a circular dependency risk: C3 → C8 (shared/types) → C3 (delegation/types)
- The `SessionPolicyOverride` type (2 external refs) imports from C3's delegation types — tight coupling
- `as const` on `HARNESS_STATUS_TO_LIFECYCLE_PHASE` but no `satisfies` check — the mapping table can drift from actual type values
- `CheckpointData` is a type alias for `CompactionCheckpointData` — unnecessary indirection

### 3.2 `src/shared/session-api.ts` (432 LOC) — 2nd MOST IMPORTANT

**Purpose:** Complete SDK wrapper for OpenCode client operations: `createSession`, `getSession`, `getSessionMessages`, `sendPrompt`, `sendPromptAsync`, `abortSession`, `showTuiToast`, `appendTuiPrompt`, `walkParentChain`, `getEventSessionID`, `getParentID`, `getSessionBehavioralProfile`. The thickest shared module at 432 LOC.

**Consumers (47 src imports):** The MOST imported file in the entire codebase. Used by C1 (governance engine, hooks), C2 (lifecycle, session-tracker, continuation), C3 (delegation, coordination, spawner), C4 (hooks/session-hooks), C7 (sidecar registry), C8 (plugin).

**Cluster distribution:**
| Cluster | Count | Examples |
|---------|-------|----------|
| C2 (Session Tracker) | 13 | `session-tracker/index.ts`, `capture/*.ts` |
| C3 (Delegation) | 8 | `delegation/coordinator.ts`, `delegation/manager.ts`, `spawner/session-creator.ts` |
| C4 (Hooks) | 5 | `hooks/lifecycle/core-hooks.ts`, `session-hooks.ts` |
| C8 (Plugin) | 1 | `plugin.ts` |

**Test coverage:** Has a dedicated test file (`tests/lib/session-api.test.ts`). Also tested indirectly through ~20 integration tests.

**Internal dependencies:** Imports `helpers.ts`, `session-naming.ts`, C1's `routing/behavioral-profile/types.ts` and `resolve-behavioral-profile.ts`.
**⚠️ Cross-cluster import:** This foundation module imports from `routing/behavioral-profile/` (C1), making it dependent on C1's routing layer — a violation of the "shared layer should be leaf" principle.

**Flaws:**
- **Cross-cluster coupling:** Imports from `routing/behavioral-profile/resolve-behavioral-profile.js` (C1). A foundation module should NOT depend on routing logic.
- **432 LOC** — close to the 500 LOC cap for a utility wrapper
- `assertValidSessionID` uses `NODE_ENV` test check — environment-conditional validation logic
- `getSessionBehavioralProfile` is a thin delegation to C1 routing — adds no value as a shared function
- `sendPrompt` has JSON parsing fallback (`JSON.parse(trimmed)`) that may silently swallow malformed responses
- No `[Harness]` prefix on line 38 `throw new Error("Invalid ${label}")` — inconsistent with other error messages

### 3.3 `src/shared/helpers.ts` (334 LOC) — UTILITY TOOLBOX

**Purpose:** 13 exported pure functions: `isObject`, `getNestedValue`, `unwrapData`, `asString`, `extractAssistantText`, `extractAllAssistantText`, `hasAssistantWorkEvidence`, `stableStringify`, `makeToolSignature`, `buildPromptText`, `describeError`, `deepMerge`, `getPromptToolCompatibility`.

**Consumers (16 src imports):** Used by C1 (schema-kernel), C3 (command-delegation, SDK-delegation), C4 (hooks), C5 (tool suites), C8 (plugin).

**Test coverage:** Has dedicated test file (`tests/lib/helpers.test.ts`). Covers `unwrapData`, `extractAssistantText`, `stableStringify`, `deepMerge`, `buildPromptText`.

**Flaws:**
- `buildPromptText` is 48 LOC — largest function, used only in `sdk-delegation/handler.ts`
- `getPromptToolCompatibility` is used only in `agent-primitive-policy.ts` (C3) — narrow utility
- `deepMerge` serializes and re-parses JSON internally — inefficient for large objects
- No `getPromptToolCompatibility` test coverage in `tests/lib/helpers.test.ts`
- `stableStringify` is a recursive implementation that can overflow the stack for deeply nested objects

### 3.4 `src/shared/state.ts` (251 LOC) — IN-PROCESS STATE

**Purpose:** `TaskStateManager` class + `taskState` singleton + backward-compatible wrapper functions. Manages in-process session state: root budgets, session-to-root mappings, delegation metadata, subagent registry.

**Consumers (12 src imports):** C1 (governance, hooks, tmux), C3 (coordination/concurrency queue), C4 (hooks), C8 (plugin).

**Test coverage:** Dedicated test file (`tests/lib/state.test.ts`).

**Flaws:**
- **Module-level mutable singleton** (`export const taskState = new TaskStateManager()`) — shared mutable state across all imports. If two test suites import the module, they share state.
- Backward-compatible wrapper functions (L195-251) exist alongside the singleton — dual API surface
- `hydrateDelegationState` does NOT reset existing budget state — can double-count on restart
- `in-memory only` — all state is lost on process restart
- `forgetSession` iterates `subagentSessions` but doesn't clean up parent→child from children

### 3.5 `src/shared/tool-response.ts` (71 LOC) — TOOL ENVELOPE

**Purpose:** `ToolResponse<T>` generic type + `success()`, `error()`, `pending()` factories + `isSuccess()`, `isError()` type guards. The standard tool response envelope used by ALL tools.

**Consumers (23 src imports):** Every tool factory imports from this file. C1 (governance engine), C3 (delegation tools), C5 (all tools), C8 (plugin).

**Test coverage:** NO dedicated test file. Only tested indirectly through tool integration tests.

**Flaws:**
- 23 consumers but zero dedicated tests — the response envelope is the most fundamental contract in the tool system
- `isSuccess()` and `isError()` type guards exist but no tool consumer uses them for type narrowing (all use `.kind` directly)
- `pending(<T>)` factory is defined but no tool actually returns `kind: "pending"` — dead code path

### 3.6 `src/shared/tool-helpers.ts` (9 LOC) — TINY UTILITY

**Purpose:** Single function `renderToolResult()`. JSON-stringifies tool output.

**Consumers (25 src imports):** Every tool file.

**Test coverage:** No dedicated test. Used indirectly through tool tests.

**Flaws:**
- Only 9 lines of code but 25 consumers import it — the most widely imported small utility
- `JSON.stringify(result, null, 2)` always produces pretty-printed output — wastes tokens on tool responses
- Could be a one-liner but lives in its own file

### 3.7 `src/shared/task-status.ts` (22 LOC) — STATUS TRANSITIONS

**Purpose:** `VALID_TASK_STATUSES`, `VALID_TRANSITIONS`, `canTransition()`, `isTerminal()`. Pure transition table for the 8-value TaskStatus enum.

**Consumers (1 src import):** `src/index.ts` (public API re-export). Also imported by test files. **Not directly imported by any runtime module** — the transition table appears to be unused by runtime code.

**Test coverage:** Has dedicated test file (`tests/lib/task-status.test.ts`).

**Flaws:**
- **Dead at runtime:** No runtime module imports `task-status.ts` directly. Only re-exported via `src/index.ts` for npm consumers. The `VALID_TRANSITIONS` table is not consulted by any state machine in the codebase — each subsystem defines its own transitions.

### 3.8 `src/shared/session-naming.ts` (156 LOC) — SESSION TITLES

**Purpose:** `generateSessionTitle()`, `parseSessionTitle()`, `sanitizePurpose()`. Machine-parsable session title format: `{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}`.

**Consumers (8 src imports):** C2 (session-tracker/tool-delegation-utils, child-recorder, tool-capture), C3 (spawner, delegation), C8 (session-api).

**Test coverage:** Has dedicated test file (`tests/shared/session-naming.test.ts`).

**Flaws:**
- Pure logic module with no dependencies — well-designed
- `NamingInput.classification` is typed as literal union but `ParsedNaming.classification` is typed as `string` — type asymmetry between generation and parsing
- `sanitizePurpose` strips ALL non-alphanumeric characters except hyphens — Unicode titles may be illegible

### 3.9 `src/shared/runtime-policy.ts` (236 LOC) — POLICY RESOLVER

**Purpose:** `DEFAULT_RUNTIME_POLICY`, `loadRuntimePolicy()`, `getRuntimePolicyForSession()`, `resolveConcurrencyForKey()`, `resolveBudgetForSession()`. Policy validation and merging.

**Consumers (4 src imports):** C3 (delegation/manager-runtime), C4 (hooks/tool-guard-hooks), C8 (plugin, index).

**Test coverage:** Has dedicated test file (`tests/lib/runtime-policy.test.ts`).

**Flaws:**
- 236 LOC for a policy resolver — validation is verbose (6 functions, 4 validate* helpers)
- `validateTrustedRuntimePolicy(_policy)` is a no-op function — accepts `_policy` parameter but does nothing
- `builtinAsyncBackgroundChildSessions` is marked `@deprecated` in `types.ts` but still actively validated and merged here
- `getRuntimePolicyForSession` calls `loadRuntimePolicy(resolvedWorkspacePolicy)` — a redundant validation step that re-parses already-validated data

### 3.10 `src/shared/runtime.ts` (95 LOC) — STATUS INFERENCE

**Purpose:** `inferContinuityStatusFromEvent()` — maps transport event signals to continuity status values. Handles 20+ status signal strings across 14 path variations.

**Consumers (5 src imports):** C3 (manager-runtime), C4 (tool-guard-hooks), C8 (plugin, index). Also imported by agent-frontmatter.schema.ts.

**Test coverage:** Has dedicated test file (`tests/lib/runtime.test.ts`).

**Flaws:**
- The status inference logic is complex but well-tested — 14 status signal paths, 20+ recognized strings
- `getStatusSignal()` iterates 14 paths in order — if a signal appears at multiple paths, the first wins, which may be wrong
- The `"idle"` / `"completed"` branch (L73-81) has an unintuitive condition: preserves `failed`/`error` but maps `pending` to `running`

### 3.11 `src/shared/security/path-scope.ts` (105 LOC) — ⚠️ UNTESTED

**Purpose:** `resolveScopedPath()`, `assertPathWithinRoot()`. Path traversal protection with lexical containment check + symlink-resolved realpath check.

**Consumers (6 src imports):** C1 (configure-primitive), C2 (continuity, trajectory, work-contracts, session-patch), C5 (doc-intelligence).

**Test coverage:** **ZERO tests.** No test file references any symbol from this module. The 6 importers have no way to validate path security behavior.

**Flaws:**
- **Critical security concern:** Zero test coverage for the path-traversal enforcement layer
- `assertRelativePathInsideRoot` checks `..` at start or segments — but `../..` inside a path could be missed if normalization hasn't occurred
- `resolveExistingPath` walks up directories to find an existing parent for symlink resolution — but if the entire path doesn't exist (common for new file creation), the realpath check is skipped entirely (L79 returns null)
- Sync I/O (`existsSync`, `realpathSync`) — blocks event loop
- `realpathSync` on the root every invocation may be slow on FUSE/Virtual filesystems

### 3.12 `src/shared/security/redaction.ts` (118 LOC) — ⚠️ UNTESTED

**Purpose:** `redactTextSecrets()`, `redactBoundaryFields()`. Field-based and text-based credential redaction with deterministic placeholders.

**Consumers (2 src imports):** C2 (journal/index.ts), C3 (delegation-status.ts).

**Test coverage:** **ZERO tests.** No test file references any symbol from this module.

**Flaws:**
- **No tests for credential redaction** — the most security-sensitive module
- `SENSITIVE_FIELD_PATTERN` uses `/api[_-]?key|token|password|secret|authorization|credential/i` — case-insensitive, which may cause false positives on field names like `tokenizedName` or `passwordResetLink`
- `placeholderForField` uses `if/return` chain instead of a lookup table — duplicate of logic in `SENSITIVE_FIELD_PATTERN`
- `redactTextSecrets` uses case-insensitive regex patterns but only matches `[A-Z0-9_]*` prefix — mixed-case patterns like `MyApiKey` are missed
- `DEFAULT_PRESERVE_FIELDS` has 17 fields but uses a `Set` — well-designed

### 3.13 `src/shared/app-api.ts` (24 LOC) — SDK THIN WRAPPER

**Purpose:** `getAppAgents(client)`. Reads the OpenCode agent registry through the SDK wrapper. Handles both array and `{ agents }` response shapes.

**Consumers (4 src imports):** C3 (agent-resolver, manager-runtime, dispatch-command, execute-slash-command).

**Test coverage:** Has dedicated test file (`tests/lib/app-api.test.ts`).

**Flaws:**
- Clean design — small, single-responsibility
- The `{ agents }` fallback is defensive but never observed in practice — may be dead code

### 3.14 `src/shared/errors/commands.ts` (34 LOC) — COMMAND ERRORS

**Purpose:** 5 error classes: `CommandNotFoundError`, `AgentNotFoundError`, `DelegationTimeoutError`, `InvalidCommandError`, `DelegationContextError`. All extend `Error` with readonly `name` property.

**Consumers (3 src imports):** C1 (resolve-command.ts), C5 (dispatch-command.ts, execute-slash-command.ts).

**Test coverage:** Has dedicated test file (`tests/shared/commands-errors.test.ts`).

**Flaws:**
- No custom error properties beyond message — all 5 classes are structurally identical
- `message` parameter defaults are weak (`"Command not found"`) — lack context

### 3.15 `src/shared/workspace-runtime-policy.ts` (38 LOC) — POLICY READER

**Purpose:** `resolveWorkspaceRuntimePolicy()`. Reads `.hivemind/state/hivemind.runtime-policy.json` from disk.

**Consumers (1 src import):** `src/plugin.ts`.

**Test coverage:** Has dedicated test file (`tests/lib/workspace-runtime-policy.test.ts`).

**Flaws:**
- Uses sync I/O (`existsSync`, `readFileSync`) — blocks event loop at plugin init
- File path is hardcoded (`POLICY_FILE_NAME`) — not configurable

### 3.16 `src/shared/plugin-tool-output-summary.ts` (22 LOC) — OUTPUT SUMMARIZER

**Purpose:** `summarizePluginToolOutput()`. Redacts secrets and truncates tool output to 240 chars for plugin metadata.

**Consumers (1 src import):** `src/plugin.ts`.

**Test coverage:** Has dedicated test file (`tests/lib/plugin-tool-output-summary.test.ts`).

**Flaws:**
- Relies on `redactTextSecrets` from `redaction.ts` — no direct test of the combined behavior
- 22 LOC, clean single-purpose module

---

## 4. plugin.ts — Composition Root Analysis

### 4.1 Size Assessment

**1,076 LOC — 115% over the 500 LOC module cap.** This is the largest single file in the entire codebase.

| Metric | Value |
|--------|-------|
| Total lines | 1,076 |
| Import statements | 85 |
| Distinct imported modules | ~62 |
| Exported functions/interfaces | 12 |
| Inline functions | 6 |
| `as any` casts | 2 |

### 4.2 Import Analysis

The 85 import statements pull from every cluster:

| Cluster | Import Count | Examples |
|---------|-------------|---------|
| **C8 (shared/)** | 12 | `helpers`, `state`, `types`, `session-api`, `runtime-policy`, `workspace-runtime-policy`, `plugin-tool-output-summary` |
| **C3 (coordination/)** | 17 | `DelegationManager`, `DelegationCoordinator`, `CompletionDetector`, `runAutoLoop`, etc. |
| **C4 (hooks/)** | 9 | `createCoreHooks`, `createSessionHooks`, `createToolGuardHooks`, etc. |
| **C5 (tools/)** | 24 | All `create*Tool` factories for delegation, session, hivemind, config, prompt tools |
| **C2 (task-management/)** | 5 | `createHarnessLifecycleManager`, `getSessionContinuity`, `listSessionContinuity`, etc. |
| **C2 (features/)** | 6 | `SessionTracker`, `getManualOverrideState`, `getActiveContractByAgent`, etc. |
| **C7 (sidecar/)** | 3 | `createSidecarServer`, `SidecarDependencyRegistry`, `SseConnectionPool` |
| **C1 (config/)** | 2 | `getConfig`, `getFreshConfig` |
| **C1 (routing/)** | 1 | `resolveBehavioralProfile` |
| **C1 (schema-kernel/)** | 1 | `HivemindConfigs` (type-only) |
| **External** | 3 | `@opencode-ai/plugin`, `@opencode-ai/plugin/tool`, `node:fs`, `node:path` |

### 4.3 Internal Structure

The file has a relatively well-organized structure:

| Lines | Section | Purpose |
|-------|---------|---------|
| 1-96 | Imports + constant | 85 imports, `WATCH_TIMEOUT_MS` |
| 97-127 | Dependency types | 5 domain-specific dep interfaces |
| 128-207 | Registration functions | 4 `register*Tools()` functions |
| 208-286 | Helper functions | `shouldAppendParentTuiNotification`, `buildInTreeSessionManager`, `extractHookSessionId`, `persistPendingDelegationNotifications` |
| 287-463 | Delegation module setup | `setupDelegationModules()` — largest function (91 lines) |
| 465-826 | Plugin factory (Part 1) | `HarnessControlPlane` — tmux setup, sidecar, session tracker, delegation wiring |
| 827-1025 | Plugin factory (Part 2) | Hooks, tool registration, return value |
| 1026-1076 | Replay function | `replayPendingDelegationNotifications()` |

### 4.4 Flaws

1. **1,076 LOC — 115% over the 500 LOC module cap.** This is the most significant architectural violation in the codebase.

2. **2 `as any` casts:**
   - L538: `await (client as any).session.prompt(...)` — bypasses SDK type safety for the steer mode emergency prompt
   - L581: `role: role as any` — in the `setGetSessionMessages` mapper, the `role` field is cast because the normalized type is `string` but the return type expects the SDK message interface

3. **`setupDelegationModules()` is 91 lines** — the largest standalone function in the file. It captures 8 dependencies in closures and instantiates 11 delegation subsystem objects.

4. **Two one-shot migrations inline** (L757-825) — legacy file cleanup logic lives alongside composition root logic. These are side effects that belong in a `scripts/` or `migrations.ts` module.

5. **`void` usage pattern** — 10+ promise expressions prefixed with `void` for fire-and-forget operations. This is a deliberate pattern but makes error handling invisible.

6. **Comment-to-code ratio is exceptionally high** — the file has extensive JSDoc and inline comments (~250 lines of comments), which is appropriate for a composition root but contributes to the 1,076 LOC.

7. **9 exported functions/interfaces** — `registerDelegationTools`, `registerSessionTools`, `registerHivemindTools`, `registerConfigTools`, `DelegationModuleSetupOptions`, `buildTuiTmuxLogger`, `DelegationModuleSetup`, `setupDelegationModules`, `replayPendingDelegationNotifications` — most are public API for integration testing.

### 4.5 Code Duplication

The two one-shot migration functions (`legacy event-tracker` and `legacy delegations.json`) share 85% of their structure:
- Sentinel file check
- `existsSync` guard
- `rmSync` + `mkdirSync` + `writeFileSync`
- `client.app.log` with error handling

---

## 5. index.ts — Public API Analysis

**File:** `src/index.ts` (30 LOC)

```
export { HarnessControlPlane } from "./plugin.js"
export { HarnessControlPlane as default } from "./plugin.js"
export * from "./coordination/concurrency/queue.js"       // C3
export * from "./task-management/continuity/index.js"      // C2
export * from "./shared/helpers.js"                        // C8
export * from "./task-management/lifecycle/index.js"       // C2
export * from "./shared/runtime.js"                        // C8
export * from "./shared/session-api.js"                    // C8
export * from "./shared/state.js"                          // C8
export * from "./shared/types.js"                          // C8
export * from "./shared/task-status.js"                    // C8
export * from "./coordination/completion/detector.js"      // C3
export * from "./shared/runtime-policy.js"                 // C8
export * from "./task-management/journal/index.js"         // C2
export * from "./task-management/journal/query.js"         // C2
export * from "./task-management/journal/replay.js"        // C2
export * from "./task-management/journal/execution-lineage.js" // C2
export * from "./features/doc-intelligence/index.js"       // C5
export * from "./task-management/trajectory/index.js"      // C2
export * from "./features/runtime-pressure/index.js"       // C3
export * from "./features/agent-work-contracts/index.js"   // C2
export * from "./features/sdk-supervisor/index.js"         // C2
export { executeCommandEngineAction, listCommands, discoverCommandBundles } from "./routing/command-engine/index.js"  // C1
export * from "./features/bootstrap/primitive-registry.js" // C1
export * from "./features/bootstrap/control-plane/index.js" // C1
```

### Analysis

**23 export statements** covering 24 distinct modules across ALL clusters.

**What's exposed:**
- C1 (4): `routing/command-engine`, `bootstrap/primitive-registry`, `bootstrap/control-plane`
- C2 (10): `continuity`, `lifecycle`, `journal` (4 files), `trajectory`, `agent-work-contracts`, `sdk-supervisor`
- C3 (2): `concurrency/queue`, `completion/detector`, `runtime-pressure`
- C5 (1): `doc-intelligence`
- C8 (7): `helpers`, `runtime`, `session-api`, `state`, `types`, `task-status`, `runtime-policy`

### Flaws

1. **Too broad — leaking internal modules.** `export * from "./coordination/concurrency/queue.js"` exposes the entire concurrency queue module's API, including internal types like `QueuePriority`, `QueueKey`, `QueueStatus`. These are C3 implementation details that become part of the public contract.

2. **No versioning or deprecation mechanism.** Once a symbol is exported from `index.ts`, removing it is a breaking change.

3. **`coordination/completion/detector.js` exports `CompletionDetector` class** — consumers can instantiate their own detector, which could conflict with the harness-managed instance.

4. **`task-management/continuity/index.js` re-exports** includes write-side functions (`recordSessionContinuity`, `patchSessionContinuity`, `deleteSessionContinuity`, `migrateLegacyContinuityFiles`) — these mutate persistence state and should not be public API without guards.

---

## 6. Test Gap Analysis

### 6.1 Coverage by Module

| Module | Dedicated Tests? | Test Files | Coverage Quality |
|--------|-----------------|------------|-----------------|
| `shared/types.ts` | ❌ No | None (indirect only) | ❌ Untested directly |
| `shared/helpers.ts` | ✅ Yes | `tests/lib/helpers.test.ts` | ✅ Good (9 of 13 functions) |
| `shared/session-api.ts` | ✅ Yes | `tests/lib/session-api.test.ts` | ✅ Good (~20 indirect tests) |
| `shared/state.ts` | ✅ Yes | `tests/lib/state.test.ts` | ✅ Good |
| `shared/tool-response.ts` | ❌ No | None (indirect only) | ❌ Untested directly |
| `shared/tool-helpers.ts` | ❌ No | None (indirect only) | ❌ Untested directly |
| `shared/task-status.ts` | ✅ Yes | `tests/lib/task-status.test.ts` | ✅ Good |
| `shared/session-naming.ts` | ✅ Yes | `tests/shared/session-naming.test.ts` | ✅ Good |
| `shared/runtime-policy.ts` | ✅ Yes | `tests/lib/runtime-policy.test.ts` | ✅ Good |
| `shared/runtime.ts` | ✅ Yes | `tests/lib/runtime.test.ts` | ✅ Good |
| `shared/path-scope.ts` | ❌ No | None | **❌ ZERO** — security critical |
| `shared/redaction.ts` | ❌ No | None | **❌ ZERO** — security critical |
| `shared/app-api.ts` | ✅ Yes | `tests/lib/app-api.test.ts` | ✅ Good |
| `shared/errors/commands.ts` | ✅ Yes | `tests/shared/commands-errors.test.ts` | ✅ Good |
| `shared/workspace-runtime-policy.ts` | ✅ Yes | `tests/lib/workspace-runtime-policy.test.ts` | ✅ Good |
| `shared/plugin-tool-output-summary.ts` | ✅ Yes | `tests/lib/plugin-tool-output-summary.test.ts` | ✅ Good |
| `plugin.ts` | ⚠️ Partial | 2 test files | ❌ 1,076 LOC barely tested |
| `index.ts` | ❌ No | None | ❌ Untested |

### 6.2 Summary

| Metric | Count |
|--------|-------|
| Total source files | 18 |
| With dedicated tests | 9 (50%) |
| Without any tests | 7 (39%) |
| Security-critical untested | 2 (path-scope, redaction) |
| Indirectly tested | 2 (types, tool-response) |
| Untested source LOC | ~326 LOC |

**Coverage gap:** 7 of 18 C8 files have zero dedicated tests. The two security-critical modules (`path-scope.ts`, `redaction.ts`) are completely untested. `plugin.ts` at 1,076 LOC has only 2 test files covering registration logic — the composition logic is untested.

---

## 7. Cross-Cluster Integration Map

### 7.1 Foundation Layer → Consumer Clusters

| Shared Module | C1 | C2 | C3 | C4 | C5 | C7 |
|---------------|----|----|----|----|----|-----|
| `types.ts` | ✅ bootstrap, governance | ✅ continuity, lifecycle, journal | ✅ delegation, coordination | ✅ tool-guard-hooks | ✅ delegation-status | ❌ |
| `helpers.ts` | ✅ schema-kernel | ❌ | ✅ handler, completion-detector | ✅ all hooks | ✅ execute-slash-command | ❌ |
| `session-api.ts` | ✅ governance, hooks | ✅ session-tracker (13 files) | ✅ delegation (8 files) | ✅ lifecycle hooks | ✅ execute-slash-command | ✅ sidecar registry |
| `state.ts` | ✅ governance, tmux | ❌ | ✅ coordinator, queue | ✅ hooks | ❌ | ❌ |
| `tool-response.ts` | ✅ create-governance-session | ❌ | ✅ all delegation tools | ❌ | ✅ ALL tool files | ❌ |
| `tool-helpers.ts` | ✅ bootstrap tools | ❌ | ✅ all delegation tools | ❌ | ✅ ALL tool files | ❌ |
| `runtime-policy.ts` | ❌ | ❌ | ✅ manager-runtime | ✅ tool-guard-hooks | ❌ | ❌ |
| `runtime.ts` | ✅ agent-frontmatter | ❌ | ✅ manager-runtime | ✅ tool-guard-hooks | ❌ | ❌ |
| `path-scope.ts` | ✅ configure-primitive | ✅ continuity, trajectory, contracts | ❌ | ❌ | ✅ doc-intelligence | ❌ |
| `redaction.ts` | ❌ | ✅ journal | ✅ delegation-status | ❌ | ❌ | ❌ |
| `session-naming.ts` | ✅ governance | ✅ session-tracker | ✅ spawner | ❌ | ❌ | ❌ |
| `app-api.ts` | ❌ | ❌ | ✅ agent-resolver, execute-slash-command | ❌ | ❌ | ❌ |

### 7.2 Key Integration Insights

1. **`session-api.ts` is THE convergence point** — consumed by every cluster except C5. It's the single most cross-cutting module.
2. **`tool-response.ts` and `tool-helpers.ts` serve the exact same consumers** — every tool file imports both. They could be merged.
3. **`path-scope.ts` is consumed by C1, C2, and C5 but not C3 or C4** — the path security boundary is used by persistence and config modules but not by delegation or hooks.
4. **C7 (Sidecar) only imports `session-api.ts`** — the sidecar is isolated from most shared infrastructure.

---

## 8. Gaps & Flaws

### 8.1 `plugin.ts` Exceeds 500 LOC Module Cap by 115% (HIGH)

**File:** `src/plugin.ts` (1,076 LOC)

**Issue:** The project's max module size is 500 LOC. `plugin.ts` is 1,076 lines — more than double the limit. The 4 registration functions (`registerDelegationTools`, `registerSessionTools`, `registerHivemindTools`, `registerConfigTools`) could be extracted to separate files. The two one-shot migration functions (L757-825) should be extracted to a `migrations/` module.

**Impact:** Refactoring requires understanding the entire file. Splitting risks circular dependencies since every function references the same `client` and `delegationManager` objects.

**Fix approach:** Extract `register*Tools()` functions to `src/plugin-registration.ts`. Extract migration functions to `src/one-shot-migrations.ts`. Keep only the `HarnessControlPlane` factory + `setupDelegationModules` in `plugin.ts` (~600 LOC remaining).

### 8.2 `path-scope.ts` and `redaction.ts` Have Zero Tests (HIGH)

**Files:** `src/shared/security/path-scope.ts` (105 LOC), `src/shared/security/redaction.ts` (118 LOC)

**Issue:** The two security-critical modules have zero dedicated tests. `path-scope.ts` implements path traversal protection — the critical enforcement layer for all file writes through the harness. `redaction.ts` implements credential redaction — failures here could leak API keys in tool outputs or journals.

**Impact:** A bug in `assertPathWithinRoot` could allow path escapes for ANY tool that uses it (6 consumers across 3 clusters). A bug in `redactBoundaryFields` could expose secrets in journals or delegation status outputs.

**Fix approach:** Add `tests/lib/security/path-scope.test.ts` covering: normal paths, `..` escapes, symlink escapes, non-existent paths, root boundary, `includes` false positives. Add `tests/lib/security/redaction.test.ts` covering: API keys, tokens, passwords, field name patterns, `DEFAULT_PRESERVE_FIELDS`, JSON-body redaction.

### 8.3 12 Dead Types in `shared/types.ts` (MEDIUM)

**Issue:** 12 exported types have zero external references outside `shared/types.ts` and `src/index.ts`:
- `SessionPromptParams`, `SessionToolProfile`, `SessionBudgetOverride`, `SessionConcurrencyOverride`, `HarnessStatus`, `DelegationPacketStatus`, `LoopWindow`, `ToolCallSummary`, `CapturedResult`, `PermissionAction`, `SessionStatusType`, `DelegationPacket`

**Impact:** These types bloat the file by ~80 lines. They appear in IDE autocomplete and confuse developers about what's actually used. Removing them would require verifying no npm consumers depend on them.

**Fix approach:** Audit each type. Most were likely moved to domain-specific modules but never removed from the shared barrel. Delete dead types and verify the project still compiles.

### 8.4 `session-api.ts` Cross-Cluster Import Violation (MEDIUM)

**File:** `src/shared/session-api.ts:5-6`

**Issue:** `session-api.ts` — a shared foundation module — imports from C1's routing layer:
```typescript
import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"
import { resolveBehavioralProfile } from "../routing/behavioral-profile/resolve-behavioral-profile.js"
```

**Impact:** This creates a dependency from the shared layer to the routing layer. If routing/behavioral-profile is refactored, session-api.ts must also change. `getSessionBehavioralProfile()` (L426-432) is a thin delegation adding zero value — it simply calls `resolveBehavioralProfile()`.

**Fix approach:** Remove `getSessionBehavioralProfile` from `session-api.ts`. Have C4's `core-hooks.ts` import `resolveBehavioralProfile` directly.

### 8.5 `task-status.ts` is Dead at Runtime (MEDIUM)

**File:** `src/shared/task-status.ts` (22 LOC)

**Issue:** No runtime module imports `task-status.ts` directly. The `VALID_TRANSITIONS` table is never consulted by any state machine. The `canTransition()` and `isTerminal()` functions are unused. The file only exists as a public API re-export via `index.ts`.

**Impact:** The task status transition table is aspirational — all actual state machines in the codebase define their own transitions.

**Fix approach:** Either (a) wire the lifecycle and trajectory state machines to use `VALID_TRANSITIONS`, or (b) deprecate the file and remove from public API.

### 8.6 `tool-response.ts` Has No Tests Despite 23 Consumers (MEDIUM)

**File:** `src/shared/tool-response.ts` (71 LOC)

**Issue:** The standard tool response envelope is used by 23 tool files across 3 clusters but has zero dedicated tests. The `isSuccess()` and `isError()` type guards are defined but rarely used — most consumers check `.kind` directly.

**Fix approach:** Add `tests/lib/tool-response.test.ts` covering: all 3 factory functions, both type guards, JSON serialization compatibility.

### 8.7 `session-api.ts` Close to 500 LOC Cap (MEDIUM)

**File:** `src/shared/session-api.ts` (432 LOC — 86% of cap)

**Issue:** At 432 LOC, `session-api.ts` is the largest shared module. It has 18 exported functions. The `sendPrompt()` function alone is 34 lines with JSON parsing fallback logic.

**Fix approach:** Extract `sendPrompt`, `sendPromptAsync`, `appendTuiPrompt`, `showTuiToast` to `src/shared/session-prompt.ts`. Extract `getEventSessionID`, `getEventParentID`, `walkParentChain` to `src/shared/session-events.ts`.

### 8.8 `plugin.ts` Has 2 `as any` Casts (LOW)

**File:** `src/plugin.ts:538, 581`

**Issue:** Two `as any` casts bypass TypeScript type safety:
- L538: `(client as any).session.prompt(...)` — for the steer mode emergency prompt path
- L581: `role: role as any` — in the session messages mapper

**Fix approach:** Add proper type definitions for the SDK operations. The `client` cast suggests the SDK type may be missing the sync `prompt` method signature.

### 8.9 `index.ts` Exposes Internal Modules (LOW)

**File:** `src/index.ts` (30 LOC)

**Issue:** `export * from "./coordination/concurrency/queue.js"` exposes C3 internals (`QueuePriority`, `QueueKey`) as public API. `export * from "./task-management/continuity/index.js"` exposes write-side functions (`recordSessionContinuity`, `patchSessionContinuity`, `migrateLegacyContinuityFiles`) that mutate persistence state without guards.

**Fix approach:** Audit each `export *` for internal symbols. Use explicit re-exports (`export { Queue } from ...`) instead of wildcards.

### 8.10 `shared/helpers.ts` Missing `getPromptToolCompatibility` Test (LOW)

**File:** `src/shared/helpers.ts:129-142`

**Issue:** The `getPromptToolCompatibility` function is exported and used by C3's `agent-primitive-policy.ts` but has no test coverage in `tests/lib/helpers.test.ts`.

**Fix approach:** Add test cases for: empty rules, no `ask` actions, mixed actions.

### 8.11 `runtime-policy.ts` Has No-Op Validation Function (LOW)

**File:** `src/shared/runtime-policy.ts:87-89`

**Issue:** `validateTrustedRuntimePolicy(_policy: TrustedRuntimePolicy): void` accepts a parameter and does nothing with it. The deprecation notice on `builtinAsyncBackgroundChildSessions` means the entire `TrustedRuntimePolicy` type is vestigial.

**Fix approach:** Remove `validateTrustedRuntimePolicy` entirely. The type-level validation through TypeScript is sufficient for boolean-only policies.

### 8.12 `state.ts` Module-Level Singleton Causes Test Pollution (LOW)

**File:** `src/shared/state.ts:189`

**Issue:** `export const taskState = new TaskStateManager()` creates a process-wide singleton. If test A calls `taskState.setDelegationMeta(...)` and test B reads it without resetting, tests share state. The `clear()` method (L175) must be called in `afterEach`.

**Fix approach:** The test file (`tests/lib/state.test.ts`) should call `taskState.clear()` in `afterEach` — verify this is done. Document the singleton pattern in the module JSDoc.

### 8.13 `session-naming.ts` Type Asymmetry (LOW)

**File:** `src/shared/session-naming.ts:25, 42`

**Issue:** `NamingInput.classification` is typed as `"root" | "child" | "grandchild" | "fork"` but `ParsedNaming.classification` is typed as `string`. The parse function returns a generic string, losing the literal type information.

**Fix approach:** Make `ParsedNaming.classification` use the same literal union as `NamingInput`.

### 8.14 `security/path-scope.ts` Realpath Check Skipped for New Paths (MEDIUM)

**File:** `src/shared/security/path-scope.ts:73-87`

**Issue:** The `assertRealPathInsideRoot` function checks symlink-resolved realpaths, but ONLY if the candidate path (or its nearest existing parent) exists (L79 returns null). For NEW file paths (the common case for `write` tools), the symlink protection is skipped entirely — only the lexical `relative()` check protects against escapes.

**Impact:** An attacker could create a symlink after the lexical check passes but before the file write occurs (TOCTOU race condition). This is a fundamental limitation of the `existsSync` guard.

**Fix approach:** Document the TOCTOU limitation in the JSDoc. For existing files, add a `readlinkSync` check to verify the candidate's containment before the nearest existing parent exists.

---

## 9. Conflicts

### 9.1 `session-api.ts` Cross-Cluster Dependency on C1 Routing

**Conflict:** `src/shared/session-api.ts:5-6` imports from `src/routing/behavioral-profile/` (C1). The CLUSTER-INVENTORY assigns `src/shared/` to C8 (foundation layer) and `src/routing/` to C1 (governance). A foundation module should not depend on a governance module.

**Impact:** This import chain means C1 cannot be extracted independently — any C1 refactoring must consider C8's dependency on C1. The `getSessionBehavioralProfile()` function adds no value beyond calling `resolveBehavioralProfile()`.

**Resolution:** Remove `getSessionBehavioralProfile()` from `session-api.ts`. Have C4's `core-hooks.ts` call `resolveBehavioralProfile()` directly.

### 9.2 `types.ts` Re-Exports from C3 Creating Circular Dependency Risk

**Conflict:** `src/shared/types.ts:374-399` re-exports types and constants from `src/coordination/delegation/types.ts` (C3). If C3 ever imports from `src/shared/types.ts` for one of these types (which it does — `Delegation` is used by C3 and re-exported by C8), the dependency chain is:

```
C3 → C8 (shared/types) → C3 (delegation/types)
```

At runtime, TypeScript/ESM resolves circular re-exports without crashing (the module has already been evaluated), but this creates a fragile dependency graph.

**Impact:** Any refactoring of C3 delegation types must consider that they're part of the C8 public API via re-export.

**Resolution:** Document the re-export as a "backward compatibility bridge" per the existing comment (L370-372). Consider removing the re-exports in a future breaking change.

### 9.3 `index.ts` Exposes Both Write-Side and Read-Side as Public API

**Conflict:** `src/index.ts` exports:
- Write-side: `recordSessionContinuity`, `patchSessionContinuity`, `deleteSessionContinuity` (from continuity/index.js)
- Read-side: `getSessionContinuity`, `listSessionContinuity` (from continuity/index.js)
- Internal singletons: `taskState` (from state.js)
- Internal classes: `CompletionDetector` (from completion/detector.js)

The public API should expose only the plugin surface (`HarnessControlPlane`) and read-only consumer utilities. Write-side functions and internal singletons are not correct public API.

**Resolution:** Audit each `export *` and replace with explicit re-exports of only intended public symbols.

### 9.4 `plugin.ts` 1,076 LOC vs 500 LOC Cap

**Conflict:** The project rule ("Max module size: 500 LOC") is violated by `plugin.ts` (1,076 LOC). The composition root is inherently the largest file because it wires all modules, but 2x the cap is excessive.

**Resolution:** Extract registration functions and migrations to separate files. Target ~600 LOC.

---

## 10. Key Findings

1. **`plugin.ts` is the largest file in the codebase at 1,076 LOC — 115% over the 500 LOC module cap.** It contains 85 import statements pulling from 62 distinct modules across all clusters. The 4 registration functions and 2 one-shot migration functions could be extracted to reduce it to ~600 LOC. Despite its size, the internal structure is well-organized with clear section boundaries. The 2 `as any` casts are limited and documented.

2. **Two security-critical modules have zero tests.** `security/path-scope.ts` (105 LOC, 6 consumers) enforces path traversal protection — a bug could allow arbitrary file system access. `security/redaction.ts` (118 LOC, 2 consumers) implements credential redaction — a failure could leak API keys. Neither has a single dedicated test. These are the most dangerous untested modules in the entire codebase.

3. **`session-api.ts` is the most imported module (47 consumers) but has a cross-cluster coupling violation.** It imports from C1's `routing/behavioral-profile/`, creating a dependency from the foundation layer to the governance layer. The `getSessionBehavioralProfile()` function adds zero value — it's a thin wrapper around `resolveBehavioralProfile()` that should be removed.

4. **`shared/types.ts` has 12 dead types** (22% of its exported types are unused externally). These bloat the file by ~80 lines and confuse developers. Types like `HarnessStatus`, `CapturedResult`, `DelegationPacket`, `SessionPromptParams`, and `ToolCallSummary` have zero external references — they exist as documentation or aspirational contracts but are never consumed.

5. **`index.ts` exposes internal modules and write-side functions as public API.** `export * from "./coordination/concurrency/queue.js"` exposes C3 implementation details. `export * from "./task-management/continuity/index.js"` exposes write-side persistence mutation functions. The public API surface needs an audit to replace wildcard re-exports with explicit symbol lists.

6. **4 of 18 C8 files have zero test coverage: `types.ts`, `tool-response.ts`, `tool-helpers.ts`, and the two security modules** (34% of the 3,475 LOC). While `types.ts` and `tool-response.ts` are tested indirectly, the security modules are completely untested in any form.
