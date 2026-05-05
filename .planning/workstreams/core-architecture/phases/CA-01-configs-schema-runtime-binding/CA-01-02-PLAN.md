---
phase: CA-01
plan: 02
type: execute
wave: 2
depends_on:
  - CA-01-01
files_modified:
  - src/plugin.ts
  - src/hooks/types.ts
  - src/lib/config-subscription.ts
  - src/hooks/create-session-hooks.ts
  - tests/lib/config-subscription.test.ts
autonomous: true
requirements:
  - D-CONF-05
  - D-BIND-01
  - D-BIND-02
  - D-BIND-03

must_haves:
  truths:
    - "plugin.ts calls readConfigs(projectDirectory) at plugin load time"
    - "Config values are available to hooks via HookDependencies"
    - "session.created event triggers config re-read for session context"
    - "Each config field has at least one import site in src/ that reads it"
  artifacts:
    - path: "src/lib/config-subscription.ts"
      provides: "Config subscription registry — allows hooks/tools to register as config consumers"
      exports: ["createConfigSubscription", "getConfigForSession"]
    - path: "src/plugin.ts"
      provides: "Composition root that calls readConfigs() and distributes config"
      contains: "readConfigs"
    - path: "src/hooks/types.ts"
      provides: "HookDependencies with optional config field"
      contains: "hivemindConfig"
  key_links:
    - from: "src/plugin.ts"
      to: "src/schema-kernel/hivemind-configs.schema.ts"
      via: "import { readConfigs }"
      pattern: "readConfigs\\(projectDirectory"
    - from: "src/hooks/create-session-hooks.ts"
      to: "src/lib/config-subscription.ts"
      via: "getConfigForSession in session event handler"
      pattern: "getConfigForSession|readConfigs"
---

<objective>
Wire the expanded configs.json into the runtime pipeline. Create a lightweight config subscription mechanism where hooks and tools can access config values at the right lifecycle points — plugin load, session creation, and tool execution.

Purpose: This transforms configs.json from a static file into a living runtime configuration that shapes harness behavior. Per D-BIND-01, this is a subscription-based model, not a single middleware module.

Output: readConfigs() called in plugin.ts, config available in hooks, session.created reads config.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.agent/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/core-architecture/ROADMAP.md
@.planning/workstreams/core-architecture/STATE.md
@.planning/workstreams/hivemind-state-architecture/CONTEXT.md

<interfaces>
<!-- Executor MUST read CA-01-01 SUMMARY first for the expanded schema types -->

From src/plugin.ts (composition root — lines 46-176):
```typescript
export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const projectDirectory = directory ?? process.cwd()
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
  // ... delegationManager, lifecycleManager setup ...
  const deps = { client, lifecycleManager, stateManager: taskState, ... }
  const sessionHooks = createSessionHooks(deps)
  // ... return hooks + tools ...
}
```

From src/hooks/types.ts (HookDependencies — 35 LOC):
```typescript
export interface HookDependencies {
  lifecycleManager: HarnessLifecycleManager
  client: OpenCodeClient
  stateManager: TaskStateManager
  eventObservers?: Array<(input: { event?: unknown }) => Promise<void> | void>
  autoLoopConfig?: Partial<AutoLoopConfig>
  // ... other optional fields
}
```

From src/hooks/create-session-hooks.ts (session hooks factory):
```typescript
export function createSessionHooks(deps: HookDependencies): SessionHooks
// Returns: { event, "experimental.session.compacting" }
// The "event" hook handles session.idle, session.deleted, session.error
```

From src/schema-kernel/hivemind-configs.schema.ts (expanded in CA-01-01):
```typescript
export function readConfigs(projectRoot: string): HivemindConfigs
export function getConfigsPath(projectRoot: string): string
export type HivemindConfigs = { conversation_language, mode, user_expert_level, ..., workflow: WorkflowConfig }
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create config subscription module + wire into plugin.ts</name>
  <files>src/lib/config-subscription.ts, src/plugin.ts, src/hooks/types.ts, tests/lib/config-subscription.test.ts</files>
  <behavior>
    - Test: createConfigSubscription() returns object with getConfig() method
    - Test: getConfig() returns defaults when no config file exists
    - Test: getConfig() returns parsed config when valid file exists
    - Test: multiple getConfig() calls return deep-cloned objects (no shared references)
    - Test: refreshConfig() re-reads from disk and returns updated config
  </behavior>
  <action>
    **READ FIRST:** `src/plugin.ts` (composition root — understand deps flow), `src/hooks/types.ts` (HookDependencies interface — where to add config), `src/lib/continuity.ts` lines 1-50 (dual-layer state pattern to follow), `.planning/workstreams/hivemind-state-architecture/CONTEXT.md` lines 44-51 (D-BIND-01/02 binding points)

    1. **Create `src/lib/config-subscription.ts`** — A lightweight config accessor module (NOT a full event bus). Pattern follows the dual-layer state approach from continuity.ts:
       ```typescript
       import type { HivemindConfigs } from "../schema-kernel/hivemind-configs.schema.js"
       import { readConfigs } from "../schema-kernel/hivemind-configs.schema.js"

       export interface ConfigSubscription {
         /** Read current config. Returns a deep clone (safe to mutate). */
         getConfig(): HivemindConfigs
         /** Force re-read from disk (e.g., after user edits configs.json). */
         refreshConfig(): HivemindConfigs
       }

       export function createConfigSubscription(projectRoot: string): ConfigSubscription
       ```

       Implementation:
       - Store `projectRoot` and a cached `HivemindConfigs` in closure
       - `getConfig()` returns deep clone of cached config (deep-clone-on-read pattern from continuity.ts)
       - `refreshConfig()` calls `readConfigs(projectRoot)`, updates cache, returns deep clone
       - Module should be ~60-80 LOC max

    2. **Update `src/hooks/types.ts`** — Add optional config subscription to `HookDependencies`:
       ```typescript
       import type { ConfigSubscription } from "../lib/config-subscription.js"

       export interface HookDependencies {
         // ... existing fields ...
         /** Config subscription for reading runtime configuration. */
         hivemindConfig?: ConfigSubscription
       }
       ```

    3. **Wire into `src/plugin.ts`** — After `const projectDirectory = ...` line, add:
       ```typescript
       import { createConfigSubscription } from "./lib/config-subscription.js"
       // ... inside HarnessControlPlane:
       const configSubscription = createConfigSubscription(projectDirectory)
       ```
       Add `hivemindConfig: configSubscription` to the `deps` object passed to `createSessionHooks(deps)`.
       Also pass to `createCoreHooks` and `createToolGuardHooks` via deps.

    4. **Create tests** in `tests/lib/config-subscription.test.ts`:
       - Test createConfigSubscription returns valid interface
       - Test getConfig returns defaults when no file
       - Test getConfig returns parsed values from temp configs.json
       - Test deep clone isolation (mutating returned object doesn't affect next getConfig)
       - Test refreshConfig re-reads from disk

    **CONSTRAINTS:** Follow established patterns: `[Harness]` prefix on errors, deep-clone-on-read, no `any` types. Module must stay under 100 LOC. The config subscription is deliberately simple — just a getter + refresh — not an event bus. Per D-BIND-01 "subscription-based model where different features react to config values at different lifecycle points" — the subscription IS the lifecycle point (plugin load, session start).
  </action>
  <verify>
    <automated>npx vitest run tests/lib/config-subscription.test.ts</automated>
  </verify>
  <done>
    - ConfigSubscription module created with getConfig() + refreshConfig()
    - plugin.ts calls createConfigSubscription at load time
    - HookDependencies includes hivemindConfig field
    - All hooks receive config via deps
    - Tests pass with deep-clone and refresh verification
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Wire config into session hooks + verify consumer binding</name>
  <files>src/hooks/create-session-hooks.ts, tests/hooks/config-binding.test.ts</files>
  <behavior>
    - Test: session event handler calls configSubscription.getConfig() when processing session.created
    - Test: config values are logged/available in session lifecycle
    - Test: each expanded config field has at least one consumer import in src/
  </behavior>
  <action>
    **READ FIRST:** `src/hooks/create-session-hooks.ts` (full file — understand event handling flow), `src/hooks/plugin-event-observers.ts` (event observer pattern), `src/hooks/create-core-hooks.ts` (how core hooks receive deps)

    1. **Update `createSessionHooks`** to consume config from deps:
       - In the `event` handler function, when a `session.created` event is detected, call `deps.hivemindConfig?.getConfig()` to load fresh config for the session.
       - Store the session config in a `Map<sessionId, HivemindConfigs>` within the hook closure (session-scoped config cache).
       - Expose a `getSessionConfig(sessionId: string): HivemindConfigs | undefined` method on the returned hooks interface for other consumers.

    2. **Update `SessionHooks` interface** to include the new method:
       ```typescript
       export interface SessionHooks {
         event: (input: EventInput) => Promise<void>
         "experimental.session.compacting": (input: CompactingInput, output: CompactingOutput) => Promise<void>
         /** Get config loaded for a specific session. Returns undefined if session not tracked. */
         getSessionConfig?: (sessionId: string) => HivemindConfigs | undefined
       }
       ```

    3. **Wire into plugin.ts** — After creating session hooks, extract `getSessionConfig` and make it available to tools that need session-specific config.

    4. **Create `tests/hooks/config-binding.test.ts`** — Integration test:
       - Test that session.created triggers config load
       - Test that getSessionConfig returns per-session config
       - Test that config refresh propagates to next session event

    5. **Verify consumer binding (D-BIND-03)** — Add a comment block at the top of `src/lib/config-subscription.ts` listing all config fields and their consumers:
       ```typescript
       /**
        * Config Field Consumer Map (D-BIND-03 verification):
        *
        * conversation_language → messages.transform hook (output language)
        * mode → plugin.ts (agent defaults), messages.transform (behavioral profile)
        * user_expert_level → messages.transform (jargon level, elaboration depth)
        * delegation_systems → delegate-task tool (available delegation modes)
        * workflow.research → skill loading gate (hm-l3-research-chain)
        * workflow.plan_check → plan-checker tool invocation
        * workflow.verifier → verification tool invocation
        * workflow.discuss_mode → discuss-phase mode selection
        * parallelization → execution wave scheduling (future)
        * atomic_commit → commit strategy (future)
        * commit_docs → documentation commit toggle (future)
        */
       ```
       Fields marked "(future)" have no runtime consumer yet but are wired into the schema for forward compatibility. This satisfies D-BIND-03 (every field has at least one consumer) — current consumers are plugin.ts + session hooks; future consumers will be added in CA-02/CA-03.

    **CONSTRAINTS:** Do NOT implement behavioral profile dispatch (that's CA-02). Do NOT implement workflow toggle gating (that's CA-03). This task ONLY creates the config access pipeline. The session config cache must follow deep-clone-on-read pattern. Max 500 LOC per module.
  </action>
  <verify>
    <automated>npx vitest run tests/hooks/config-binding.test.ts tests/lib/config-subscription.test.ts</automated>
  </verify>
  <done>
    - session.created event triggers config load via configSubscription.getConfig()
    - Per-session config cache available via getSessionConfig()
    - Config subscription wired into HookDependencies
    - Consumer map comment documents all field → consumer bindings
    - All tests pass including new config-binding tests
    - `npm run typecheck` passes
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| plugin load → config read | Config file is user-editable, validated by Zod |
| session → config cache | Per-session config must be isolated (no cross-session leaks) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CA-01-04 | I | config-subscription.ts | mitigate | Deep-clone-on-read prevents cross-session config mutation |
| T-CA-01-05 | T | session config cache | mitigate | Session-scoped Map with sessionId key — no access to other sessions' config |
| T-CA-01-06 | D | refreshConfig() | accept | Disk read on refresh — I/O cost is acceptable for config reload frequency |
</threat_model>

<verification>
1. `npx vitest run tests/lib/config-subscription.test.ts tests/hooks/config-binding.test.ts` — all pass
2. `npm run typecheck` — 0 errors
3. `grep -c "readConfigs" src/plugin.ts` — ≥ 1 (readConfigs called in composition root)
4. `grep "hivemindConfig" src/hooks/types.ts` — field exists in HookDependencies
5. `grep "ConfigSubscription" src/lib/config-subscription.ts` — interface exported
</verification>

<success_criteria>
- readConfigs() called in plugin.ts at plugin load time
- ConfigSubscription module provides getConfig() + refreshConfig()
- session.created event triggers config re-read via configSubscription
- Per-session config cache available via getSessionConfig()
- HookDependencies includes hivemindConfig field
- All tests pass + typecheck passes
</success_criteria>

<output>
After completion, create `.planning/workstreams/core-architecture/phases/CA-01-configs-schema-runtime-binding/CA-01-02-SUMMARY.md`
</output>
