---
phase: WS1-06
plan: 02
type: execute
wave: 2
depends_on: ["WS1-06-01"]
status: superseded
superseded_by: CA-01-02-PLAN.md
superseded_date: 2026-05-06
files_modified:
  - src/plugin.ts
  - src/lib/config-subscriber.ts
  - src/hooks/create-core-hooks.ts
  - tests/lib/config-subscriber.test.ts
autonomous: true
requirements:
  - REQ-WS1-05

must_haves:
  truths:
    - "plugin.ts calls readConfigs() at composition root during HarnessControlPlane init"
    - "readConfigs() failure (missing/invalid file) does not crash the plugin — defaults apply"
    - "session.created event reads config mode + userExpertLevel for session context"
    - "Config values are accessible to downstream consumers via getConfig() subscription helper"
    - "Every config field has at least one concrete consumer path in src/ (D-BIND-03)"
  artifacts:
    - path: "src/lib/config-subscriber.ts"
      provides: "Config subscription helper — getConfig() with lazy-load + cache + fallback-to-defaults"
      exports: ["getConfig", "getCachedConfig", "invalidateConfigCache"]
    - path: "src/plugin.ts"
      provides: "Composition root reads configs at init, passes config to hook factories"
      contains: "readConfigs"
    - path: "tests/lib/config-subscriber.test.ts"
      provides: "Test coverage for config subscription helper"
      contains: "describe.*ConfigSubscriber"
  key_links:
    - from: "src/plugin.ts"
      to: "src/schema-kernel/hivemind-configs.schema.ts"
      via: "import readConfigs, calls in HarnessControlPlane init"
      pattern: "import.*readConfigs.*hivemind-configs"
    - from: "src/lib/config-subscriber.ts"
      to: "src/schema-kernel/hivemind-configs.schema.ts"
      via: "imports readConfigs, HivemindConfigs type"
      pattern: "import.*readConfigs"
    - from: "src/hooks/create-core-hooks.ts"
      to: "src/lib/config-subscriber.ts"
      via: "session.created event reads config via getConfig()"
      pattern: "getConfig"
---

<objective>
Wire readConfigs() into the plugin composition root and session lifecycle so config values flow to runtime consumers. Create a lightweight config-subscriber module that provides getConfig() with lazy-load, caching, and graceful fallback.

Purpose: Per D-BIND-01 and D-BIND-02, the subscription-based binding model means different features react to config values at different lifecycle points. This plan creates the foundation binding — plugin.ts reads configs at init, session hooks consume config values on session.created. Per D-BIND-03, every config field must have at least one concrete consumer.

Output: Config subscriber module, wired plugin.ts, session hook config consumption, tests.
</objective>

<execution_context>
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/Documents/coding-projects/hivemind-plugin-1/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/workstreams/hivemind-state-architecture/CONTEXT.md
@src/plugin.ts
@src/hooks/create-core-hooks.ts
@src/hooks/plugin-event-observers.ts
@src/lib/state.ts
@src/schema-kernel/hivemind-configs.schema.ts

<interfaces>
<!-- From Plan 01 output (WS1-06-01) — executor MUST read these after Plan 01 completes -->
From src/schema-kernel/hivemind-configs.schema.ts (expanded):
```typescript
export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"
export type HivemindConfigs = {
  conversation_language: SupportedLanguage
  documents_and_artifacts_language: SupportedLanguage
  mode: HivemindMode
  user_expert_level: UserExpertLevel
  delegation_systems: DelegationSystems
  parallelization: boolean
  atomic_commit: boolean
  commit_docs: boolean
  workflow: WorkflowConfig
}
export function readConfigs(projectRoot: string): HivemindConfigs
export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs
export function getDefaultConfigs(): HivemindConfigs
export function getConfigsPath(projectRoot: string): string
```

From src/plugin.ts (current):
```typescript
export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const projectDirectory = directory ?? process.cwd()
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
  // ... delegation manager, lifecycle manager, hooks ...
  return {
    ...createCoreHooks({ ...deps, eventObservers: [...] }),
    ...sessionReadHooks,
    ...toolGuardHooks,
    tool: { /* registered tools */ },
    "tool.execute.after": async (...) => { /* ... */ },
  }
}
```

From src/lib/state.ts:
```typescript
export const taskState = {
  sessionStats: new Map<string, SessionStats>()
  rootBudgets: new Map<string, RootBudget>()
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create config-subscriber module with lazy-load + cache + fallback</name>
  <files>src/lib/config-subscriber.ts, tests/lib/config-subscriber.test.ts</files>
  <behavior>
    - Test 1: getConfig(projectRoot) returns valid HivemindConfigs when configs.json exists
    - Test 2: getConfig(projectRoot) returns defaults when configs.json is missing
    - Test 3: getConfig(projectRoot) returns defaults when configs.json has invalid JSON
    - Test 4: getCachedConfig() returns cached config without re-reading from disk
    - Test 5: invalidateConfigCache() clears the cache, next getConfig() reads from disk
    - Test 6: getConfig() called multiple times returns same object (cache hit)
    - Test 7: After invalidateConfigCache(), getConfig() returns fresh config from disk
  </behavior>
  <action>
    RED phase — Write failing tests first:

    1. Create `tests/lib/config-subscriber.test.ts` with all test cases from `<behavior>`.

    2. GREEN phase — Create `src/lib/config-subscriber.ts`:

    a. Module provides a lightweight config subscription helper:
    ```typescript
    import { readConfigs, getDefaultConfigs } from "../schema-kernel/hivemind-configs.schema.js"
    import type { HivemindConfigs } from "../schema-kernel/hivemind-configs.schema.js"

    let cachedConfig: HivemindConfigs | null = null
    let cachedProjectRoot: string | null = null

    /**
     * Reads configs from disk with caching. First call reads from disk,
     * subsequent calls return cached value unless invalidateConfigCache() is called.
     */
    export function getConfig(projectRoot: string): HivemindConfigs {
      if (cachedConfig !== null && cachedProjectRoot === projectRoot) {
        return cachedConfig
      }
      cachedConfig = readConfigs(projectRoot)
      cachedProjectRoot = projectRoot
      return cachedConfig
    }

    /**
     * Returns the cached config without disk read. Returns defaults if no cache.
     */
    export function getCachedConfig(): HivemindConfigs {
      return cachedConfig ?? getDefaultConfigs()
    }

    /**
     * Invalidates the in-memory config cache. Next getConfig() reads from disk.
     */
    export function invalidateConfigCache(): void {
      cachedConfig = null
      cachedProjectRoot = null
    }
    ```

    b. Module MUST stay under 100 LOC. It is intentionally thin — a cache wrapper around readConfigs().

    c. All functions MUST have JSDoc with `@param`, `@returns`, `@example`.

    3. Run tests: `npx vitest run tests/lib/config-subscriber.test.ts` — all MUST pass.

    4. REFACTOR — Ensure no `any` types, proper type exports, max LOC under 100.
  </action>
  <verify>
    <automated>npx vitest run tests/lib/config-subscriber.test.ts</automated>
  </verify>
  <done>
    - config-subscriber.ts exports getConfig(), getCachedConfig(), invalidateConfigCache()
    - Lazy-load: first call reads from disk, subsequent calls use cache
    - Fallback: missing/invalid file returns defaults (never crashes)
    - Cache invalidation: invalidateConfigCache() forces re-read on next getConfig()
    - All 7 test cases pass
    - Module under 100 LOC
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire readConfigs into plugin.ts and session.created hook</name>
  <files>src/plugin.ts, src/hooks/create-core-hooks.ts, tests/lib/config-subscriber.test.ts</files>
  <action>
    <read_first>
    - src/plugin.ts (composition root — see where runtimePolicy is loaded, that's where configs go)
    - src/hooks/create-core-hooks.ts (session.created handler — where config values get consumed)
    - src/hooks/plugin-event-observers.ts (session entry observer — where mode/expert-level are useful)
    - src/lib/config-subscriber.ts (the module created in Task 1)
    </read_first>

    1. **Wire plugin.ts composition root:**

    In `HarnessControlPlane`, after `const projectDirectory = directory ?? process.cwd()` and after `const runtimePolicy = ...`, add config loading:

    ```typescript
    import { getConfig } from "./lib/config-subscriber.js"
    import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"

    // Inside HarnessControlPlane:
    const hivemindConfig = getConfig(projectDirectory)
    ```

    This gives the composition root access to the full config. Pass `hivemindConfig` to hook factories that need it. Do NOT pass to all factories — only those that consume specific fields (per D-BIND-02 binding points).

    2. **Wire session.created hook:**

    In `createCoreHooks` (or its deps), add config consumption on `session.created`. The session entry event observer already classifies intake — augment it to read `hivemindConfig.mode` and `hivemindConfig.user_expert_level` for session context.

    The wiring should:
    - Read `hivemindConfig.mode` → include in session entry fact (for downstream consumption by messages.transform hook in future phase)
    - Read `hivemindConfig.user_expert_level` → include in session entry fact
    - NOT modify the existing intake classification logic — just enrich the fact with config data

    3. **Add acceptance test:**

    Add a test that verifies `getConfig` integration:
    - Test: "getConfig is callable with project root and returns valid config shape"
    - This ensures the wiring path is testable.

    4. **Run full test suite:** `npm test` — zero regressions.

    IMPORTANT CONSTRAINTS:
    - Do NOT change the existing hook signature interfaces unless adding optional config param
    - Do NOT break backward compatibility — existing hook factories must work without config
    - Keep plugin.ts under 200 LOC total (currently ~176 LOC)
    - All new imports must use `import type` for type-only imports (verbatimModuleSyntax)
  </action>
  <verify>
    <automated>npm test</automated>
  </verify>
  <done>
    - plugin.ts calls getConfig(projectDirectory) at composition root
    - Config values are accessible to session.created hook via getConfig()
    - readConfigs failure (missing/invalid file) does NOT crash plugin — defaults apply gracefully
    - Session entry observer enriches facts with config.mode and config.user_expert_level
    - No regressions: npm test passes with 0 failures
    - plugin.ts stays under 200 LOC
    - npm run typecheck passes with 0 errors
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| plugin init → config load | Config loading happens at plugin init — failure must not crash OpenCode |
| session.created → config read | Config values flow to session context — stale cache risk |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-WS1-06-05 | D | plugin.ts init | mitigate | getConfig() returns defaults on failure — plugin init never blocks on config |
| T-WS1-06-06 | T | config-subscriber cache | accept | Cache is in-memory, per-process — no cross-session tampering risk |
| T-WS1-06-07 | I | session context | accept | Config values (mode, expert_level) are not secrets — disclosure risk minimal |
</threat_model>

<verification>
- `npm test` passes with 0 regressions
- `npm run typecheck` passes with 0 errors
- `npm run build` succeeds
- grep -c "readConfigs\|getConfig" src/plugin.ts → ≥ 1
- grep -c "getConfig\|hivemindConfig" src/hooks/create-core-hooks.ts → ≥ 1
- grep -c "hivemind-configs.schema" src/lib/config-subscriber.ts → ≥ 1
</verification>

<success_criteria>
- plugin.ts reads configs at composition root via getConfig()
- session.created hook consumes config.mode and config.user_expert_level
- Config loading failure does not crash the plugin
- config-subscriber module provides lazy-load, cache, and invalidation
- Zero regressions across all 1604+ tests
- All new code has JSDoc documentation
- All modules under 500 LOC
</success_criteria>

<output>
After completion, create `.planning/workstreams/hivemind-state-architecture/phases/WS1-06-configs-schema-runtime-binding/WS1-06-02-SUMMARY.md`
</output>
