# oh-my-openagent — Organizational Patterns Investigation Report

**Investigation Date:** 2026-04-01
**Source:** `.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml`
**Purpose:** Extract architectural patterns from oh-my-openagent for HiveMind plugin restructuring

---

## Executive Summary

oh-my-openagent is a mature OpenCode plugin (~276K LOC, v3.14.0) with clear architectural boundaries. It implements a **6-phase config loading pipeline** via `plugin-handlers/`, uses **factory functions** for tool/hook creation, and maintains **strict layer separation** enforced via convention (not tooling). The most transferrable pattern is the **plugin-handlers composition pattern** — a pipeline of pure config-transformation functions that transform raw config into resolved plugin components.

---

## 1. Directory Structure Map

```
src/
├── index.ts                    # Single plugin entry point
├── plugin-config.ts            # JSONC multi-level config → Zod v4 validation
├── create-hooks.ts            # Hook composition entry
├── create-managers.ts          # Manager instantiation (Tmux, Background, SkillMcp, Config)
├── create-tools.ts             # Tool registry orchestration
├── plugin-interface.ts         # PluginInterface assembly
├── plugin-dispose.ts          # Cleanup handling
├── plugin-state.ts            # Runtime state (model cache)
│
├── agents/                    # 11 agents + builtin-agents/
│   ├── atlas/                 # Named agent subdirectories
│   ├── sisyphus-junior/      # With own index.ts, factory
│   └── types.ts               # Shared agent types
│
├── hooks/                     # 48 hooks in dedicated + standalone
│   ├── agent-usage-reminder/
│   ├── atlas/                 # Large orchestration hook
│   ├── runtime-fallback/      # Recovery hook
│   └── [standalone hooks]      # e.g., openclaw.ts, preemptive-compaction.ts
│
├── tools/                     # 26 tools across 15 directories
│   ├── background-task/
│   ├── delegate-task/
│   ├── hashline-edit/
│   ├── skill/
│   └── [others]
│
├── features/                   # 19 feature modules
│   ├── background-agent/
│   ├── builtin-commands/
│   ├── builtin-skills/
│   ├── claude-code-agent-loader/
│   ├── claude-code-plugin-loader/
│   ├── opencode-skill-loader/
│   ├── skill-mcp-manager/
│   ├── tmux-subagent/
│   └── [others]
│
├── config/                     # Zod v4 schema system (24 files)
│   └── schema/
│
├── shared/                     # 95+ utilities in 13 categories
│   ├── agent-display-names.ts
│   ├── deep-merge.ts
│   ├── model-capabilities.ts
│   └── [many others]
│
├── plugin/                     # 8 OpenCode hook handlers
│   ├── hooks/                  # Hook factory functions
│   │   ├── create-core-hooks.ts
│   │   ├── create-session-hooks.ts
│   │   └── create-transform-hooks.ts
│   ├── tool-registry.ts        # Tool assembly
│   └── types.ts
│
├── plugin-handlers/            # 6-phase config loading pipeline
│   ├── config-handler.ts       # Phase coordinator
│   ├── agent-config-handler.ts
│   ├── tool-config-handler.ts
│   ├── mcp-config-handler.ts
│   ├── command-config-handler.ts
│   ├── provider-config-handler.ts
│   ├── plugin-components-loader.ts
│   └── [support files]
│
├── cli/                        # Commander.js CLI (install, run, doctor)
│   ├── config-manager/
│   ├── doctor/checks/          # Modular check system
│   └── run/
│
└── mcp/                        # 3 built-in remote MCPs
```

### Key Structural Annotations

| Directory | Count | Purpose | Key Pattern |
|----------|-------|---------|-------------|
| `src/agents/` | 11 agents | Agent definitions | Factory `createBuiltinAgents()` |
| `src/hooks/` | 48 hooks | Lifecycle interception | `createXXXHook()` factories |
| `src/tools/` | 26 tools | Tool implementations | `createXXXTool()` factories |
| `src/features/` | 19 modules | Standalone capabilities | Self-contained with own `index.ts` |
| `src/plugin-handlers/` | 6 phases | Config resolution pipeline | Pure config-transform functions |
| `src/shared/` | 95+ files | Cross-cutting utilities | Barrel exports via `index.ts` |
| `src/config/` | 24 files | Zod v4 schemas | Hierarchical schema composition |

---

## 2. Plugin-Handlers Pattern (Detailed Analysis)

### What Is a Plugin-Handler?

A **plugin-handler** is a pure config-transformation function that takes raw plugin configuration and produces resolved, merged configuration for a specific domain (agents, tools, MCPs, commands, providers).

**Key Insight:** Plugin-handlers do NOT execute side effects. They transform data structures.

### The 6-Phase Config Loading Pipeline

Located at `src/plugin-handlers/config-handler.ts` lines 1-50:

```typescript
// Phase 1: Provider config (model cache initialization)
applyProviderConfig({ config, modelCacheState });
clearFormatterCache()

// Phase 2: Plugin components (loads external plugin components)
const pluginComponents = await loadPluginComponents({ pluginConfig });

// Phase 3: Agent config (most complex - handles overrides, skills, priority)
const agentResult = await applyAgentConfig({
  config,
  pluginConfig,
  ctx,
  pluginComponents,
});

// Phase 4: Tool config (depends on agent config for skill context)
applyToolConfig({ config, pluginConfig, agentResult });

// Phase 5: MCP config (merges built-in + external MCPs)
await applyMcpConfig({ config, pluginConfig, pluginComponents });

// Phase 6: Command config (depends on plugin components)
await applyCommandConfig({ config, pluginConfig, ctx, pluginComponents });
```

### Difference from Hooks

| Aspect | Plugin-Handler | Hook |
|--------|---------------|------|
| **Execution time** | Plugin initialization | Runtime (per message/event) |
| **Side effects** | None (pure transforms) | Yes (context injection, recovery, etc.) |
| **Input** | `OhMyOpenCodeConfig` + raw config | OpenCode lifecycle events |
| **Output** | Transformed config objects | Modified context/messages |
| **Examples** | `applyAgentConfig`, `applyToolConfig` | `runtime-fallback`, `atlas` |

### Handler Implementation Example

From `src/plugin-handlers/tool-config-handler.ts`:

```typescript
export function applyToolConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  agentResult: Record<string, AgentConfig>;
}): void {
  // Pure transformation - no async, no side effects
  const toolConfig = params.pluginConfig.tools ?? {};
  const mergedTools = {
    ...builtinTools,
    ...params.agentResult, // agents can contribute tools
    ...toolConfig,
  };
  params.config.tools = mergedTools;
}
```

### How Plugin-Handlers Group Handlers

The `src/plugin-handlers/index.ts` barrel exports all handlers:

```typescript
export { createConfigHandler, type ConfigHandlerDeps } from "./config-handler";
export * from "./provider-config-handler";
export * from "./agent-config-handler";
export * from "./tool-config-handler";
export * from "./mcp-config-handler";
export * from "./command-config-handler";
export * from "./plugin-components-loader";
export * from "./category-config-resolver";
export * from "./prometheus-agent-config-builder";
export * from "./agent-priority-order";
```

### Applicability to HiveMind

**HIGH APPLICABILITY.** HiveMind needs a similar config resolution pipeline. The pattern could map:

- `agent-config-handler` → `trajectory-config-resolver`
- `tool-config-handler` → `tool-config-resolver`
- `mcp-config-handler` → `mcp-config-resolver`
- `command-config-handler` → `command-config-resolver`

The key principle: **separate config resolution (pipeline) from runtime hooks (execution)**.

---

## 3. Tool Registration Strategy

### Central Registry Pattern

All tools register via `src/plugin/tool-registry.ts` (`createToolRegistry()` function, lines 100-225):

```typescript
export function createToolRegistry(args: {
  ctx: PluginContext
  pluginConfig: OhMyOpenCodeConfig
  managers: Pick<Managers, "backgroundManager" | "tmuxSessionManager" | "skillMcpManager">
  skillContext: SkillContext
  availableCategories: AvailableCategory[]
}): ToolRegistryResult
```

### Two Tool Creation Patterns

**Pattern A: Factory Functions (19 tools)**
```typescript
// Example from src/tools/delegate-task/tools.ts
export function createDelegateTask(args: DelegateTaskArgs): ToolDefinition {
  return {
    name: "task",
    description: "...",
    schema: z.object({...}),
    async execute(args, ctx) { /* ... */ }
  }
}
```

**Pattern B: Direct ToolDefinition Objects (7 tools)**
```typescript
// Example - LSP tools registered directly
const lspRenameTool: ToolDefinition = { name: "lsp_rename", ... }
const lspGotoDefinitionTool: ToolDefinition = { name: "lsp_goto_definition", ... }
```

### Tool Assembly in createToolRegistry

```typescript
const allTools: Record<string, ToolDefinition> = {
  ...builtinTools,
  ...createGrepTools(ctx),
  ...createGlobTools(ctx),
  ...createAstGrepTools(ctx),
  ...createSessionManagerTools(ctx),
  ...backgroundTools,
  call_omo_agent: callOmoAgent,
  ...(lookAt ? { look_at: lookAt } : {}),  // Conditional spread
  task: delegateTask,
  skill_mcp: skillMcpTool,
  skill: skillTool,
  interactive_bash,
  ...taskToolsRecord,
  ...hashlineToolsRecord,
}

// Post-processing
const filteredTools = filterDisabledTools(allTools, pluginConfig.disabled_tools)
```

### Conditional Registration

Tools can be conditionally included:

```typescript
// Multimodal looker conditionally registered
const isMultimodalLookerEnabled = !(pluginConfig.disabled_agents ?? []).some(
  (agent) => agent.toLowerCase() === "multimodal-looker",
)
const lookAt = isMultimodalLookerEnabled ? createLookAt(ctx) : null

// Hashline tools gated on config
const hashlineEnabled = pluginConfig.hashline_edit ?? false
const hashlineToolsRecord: Record<string, ToolDefinition> = hashlineEnabled
  ? { edit: createHashlineEditTool(ctx) }
  : {}
```

### Tool Priority/Trimming

When `max_tools` limit is set, low-priority tools are removed first:

```typescript
const LOW_PRIORITY_TOOL_ORDER = [
  "session_list",
  "session_read",
  "interactive_bash",
  "look_at",
  "call_omo_agent",
  // ... more tools
]

function trimToolsToCap(filteredTools: ToolsRecord, maxTools: number): void {
  // Removes tools in order until under cap
}
```

### Applicability to HiveMind

**MEDIUM-HIGH APPLICABILITY.** HiveMind has `src/tools/` but lacks a central `createToolRegistry()`. We should adopt:

1. A central `createToolRegistry()` function in `src/plugin/tool-registry.ts`
2. Factory functions `createXXXTool()` for all tools
3. Conditional registration based on config
4. A `LOW_PRIORITY_TOOL_ORDER` array for trimming

---

## 4. Feature Boundary Rules

### What Defines a Feature

A **feature** in oh-my-openagent is a self-contained module that:
1. Implements a standalone capability
2. Has its own directory with `index.ts` barrel
3. Can be wired into the plugin without modifying core plugin logic
4. May have its own state, managers, or utilities

### Feature Examples

**`background-agent`** (`src/features/background-agent/`):
- Contains: `manager.ts`, `spawner.ts`, `task-poller.ts`, `loop-detector.ts`
- Manages: Background task lifecycle, concurrency, notification
- Wired via: `BackgroundManager` injected into managers

**`opencode-skill-loader`** (`src/features/opencode-skill-loader/`):
- Contains: `loader.ts`, `skill-discovery.ts`, `skill-deduplication.ts`, `merger/`
- Manages: Skill loading, merging, deduplication
- Wired via: `SkillContext` passed to tools/hooks

**`tmux-subagent`** (`src/features/tmux-subagent/`):
- Contains: `manager.ts`, `spawn-action-decider.ts`, `grid-planning.ts`
- Manages: Tmux grid layout for subagent panes
- Wired via: `TmuxSessionManager` in managers

### Feature Interaction with Hooks and Tools

Features do NOT directly contain hooks or tools. Instead:

```
Feature Module
    │
    ├── Provides state/manager to tools (via dependency injection)
    │   └── e.g., BackgroundManager → createDelegateTask()
    │
    └── Hooks interact with feature state independently
        └── e.g., background-notification hook → BackgroundManager
```

### Feature Discovery Pattern

Features are NOT auto-discovered. They are explicitly imported and instantiated in `create-managers.ts` or `create-tools.ts`:

```typescript
// From src/create-managers.ts
const backgroundManager = new BackgroundManager(
  ctx,
  pluginConfig.background_task,
  { tmuxConfig, onSubagentSessionCreated: async (event) => { /* ... */ } }
)

const skillMcpManager = new SkillMcpManager()
```

### Applicability to HiveMind

**MEDIUM APPLICABILITY.** HiveMind already has `src/features/` but the feature boundaries are less clear. We should:

1. Define features as self-contained modules with clear interfaces
2. Feature managers are injected into tools (not hooks)
3. Hooks interact with feature state independently
4. No auto-discovery — explicit wiring in creation functions

---

## 5. Factory/Composition Patterns

### Hook Factory Pattern

Every hook follows the `createXXXHook()` factory pattern:

```typescript
// From src/hooks/atlas/atlas-hook.ts
export function createAtlasHook(input: PluginInput) {
  return {
    onSessionStart: async (session) => { /* ... */ },
    onSessionIdle: async (session) => { /* ... */ },
    onToolExecuteBefore: async (tool, args) => { /* ... */ },
  }
}
```

### Hook Composition in createHooks.ts

```typescript
// From src/create-hooks.ts (conceptual)
export function createHooks(args: HooksArgs): HooksResult {
  return {
    ...createCoreHooks(args),        // 39 core hooks
    ...createContinuationHooks(args), // 7 continuation hooks
    ...createSkillHooks(args),       // 2 skill hooks
    disposeHooks: [/* cleanup functions */]
  }
}
```

### Agent Factory Pattern

```typescript
// From src/agents/index.ts
export async function createBuiltinAgents(
  // ... many args including discovered skills
): Promise<Record<string, AgentConfig>> {
  return {
    sisyphus: createSisyphusAgent(),
    oracle: createOracleAgent(),
    // ...
  }
}
```

### Manager Composition Pattern

```typescript
// From src/create-managers.ts
export function createManagers(args: ManagersArgs): Managers {
  const tmuxSessionManager = new TmuxSessionManager(ctx, tmuxConfig)
  const backgroundManager = new BackgroundManager(ctx, config, callbacks)
  const skillMcpManager = new SkillMcpManager()
  const configHandler = createConfigHandler(deps)

  return { tmuxSessionManager, backgroundManager, skillMcpManager, configHandler }
}
```

### Applicability to HiveMind

**HIGH APPLICABILITY.** We should adopt:

1. `createXXXTool()` factories for all tools
2. `createXXXHook()` factories for all hooks
3. `createManagers()` composition in HiveMind
4. Clear dependency injection via constructor args

---

## 6. Layer Separation Rules

### oh-my-openagent Layer Hierarchy

```
Layer 0: External Interface (OpenCode plugin contract)
    ↓
Layer 1: Plugin Entry (index.ts - wires everything)
    ↓
Layer 2: Creation Functions (createHooks, createManagers, createTools)
    ↓
Layer 3: Plugin Handlers (config transformation pipeline)
    ↓
Layer 4: Feature Modules (background-agent, skill-loader, etc.)
    ↓
Layer 5: Shared Utilities (src/shared/)
    ↓
Layer 6: Config Schema (Zod v4)
```

### Import Rules (What Imports What)

| From | Can Import |
|------|-----------|
| `src/index.ts` | `create-hooks`, `create-managers`, `create-tools`, `plugin-config` |
| `create-managers.ts` | `features/`, `shared/`, `config/` |
| `create-tools.ts` | `tools/`, `features/`, `shared/`, `plugin/` |
| `create-hooks.ts` | `hooks/`, `features/`, `shared/` |
| `plugin-handlers/` | `config/`, `features/`, `shared/` |
| `hooks/` | `shared/`, `config/` (no tools, no other hooks) |
| `tools/` | `shared/`, `config/` (no hooks, no agents) |
| `features/` | `shared/`, `config/` (isolated modules) |
| `shared/` | Nothing (leaf layer) |

### How Violations Are Prevented

**Convention-based enforcement** (not tooling):
- No path aliases (`@/`) — relative imports only
- Kebab-case file naming
- Index.ts barrel exports only
- No catch-all files (`utils.ts`, `helpers.ts` banned)
- 200 LOC soft limit

### Multi-Level Config Merge Rules

```
Project (.opencode/oh-my-opencode.jsonc)
    ↓ Deep merge with
User (~/.config/opencode/oh-my-opencode.jsonc)
    ↓ Deep merge with
Defaults (Zod schema defaults)

Special rules:
- agents, categories, claude_code: deep merged recursively
- disabled_* arrays: Set union (concatenated + deduplicated)
- All other fields: override replaces base value
```

### Applicability to HiveMind

**CRITICAL APPLICABILITY.** We MUST establish similar layer rules:

1. **Define clear layer hierarchy** in HiveMind architecture
2. **No cross-layer imports** except via explicit interfaces
3. **Plugin handlers** should be pure transform functions (no side effects)
4. **Hooks** should not import tools directly
5. **Shared** is the leaf layer — nothing else depends on it

---

## 7. Their AGENTS.md — Key Architectural Rationale

From `src/AGENTS.md` (lines 273880-274032):

### Initialization Flow

```
OhMyOpenCodePlugin(ctx)
  ├─→ loadPluginConfig()     # JSONC parse → project/user merge → Zod validate → migrate
  ├─→ createManagers()        # TmuxSessionManager, BackgroundManager, SkillMcpManager, ConfigHandler
  ├─→ createTools()           # SkillContext + AvailableCategories + ToolRegistry (26 tools)
  ├─→ createHooks()            # 3-tier: Core(39) + Continuation(7) + Skill(2) = 48 hooks
  └─→ createPluginInterface() # 8 OpenCode hook handlers → PluginInterface
```

### 8 OpenCode Hook Handlers

| Handler | Purpose |
|---------|---------|
| `config` | 6-phase: provider → plugin-components → agents → tools → MCPs → commands |
| `tool` | 26 registered tools |
| `chat.message` | First-message variant, session setup, keyword detection |
| `chat.params` | Anthropic effort level adjustment |
| `chat.headers` | Copilot x-initiator header injection |
| `event` | Session lifecycle (created, deleted, idle, error) |
| `tool.execute.before` | Pre-tool hooks (file guard, label truncator, rules injector) |
| `tool.execute.after` | Post-tool hooks (output truncation, metadata store) |
| `experimental.chat.messages.transform` | Context injection, thinking block validation |

### Hook Tier System

| Tier | Count | Purpose |
|------|-------|---------|
| Session | 23 | Lifecycle events |
| Tool-Guard | 12 | Pre/post tool execution |
| Transform | 4 | Context transformation |
| Continuation | 7 | Session continuation |
| Skill | 2 | Skill-specific hooks |

### Anti-Patterns They Enforce

```markdown
## ANTI-PATTERNS

- Never use `as any`, `@ts-ignore`, `@ts-expect-error`
- Never suppress lint/type errors
- Never add emojis to code/comments unless user explicitly asks
- Never commit unless explicitly requested
- Never run `bun publish` directly — use GitHub Actions
- Never modify `package.json` version locally
- Test: given/when/then — never use Arrange-Act-Assert comments
- Comments: avoid AI-generated comment patterns
- Never create catch-all files (`utils.ts`, `helpers.ts`, `service.ts`)
- Empty catch blocks `catch(e) {}` — always handle errors
- Never use em dashes (—), en dashes (–), or AI filler phrases
- index.ts is entry point ONLY — never dump business logic there
```

### Where to Look (Developer Guide)

```markdown
## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new agent | `src/agents/` + `src/agents/builtin-agents/` | Follow createXXXAgent factory pattern |
| Add new hook | `src/hooks/{name}/` + register in `src/plugin/hooks/create-*-hooks.ts` | Match event type to tier |
| Add new tool | `src/tools/{name}/` + register in `src/plugin/tool-registry.ts` | Follow createXXXTool factory |
| Add new feature module | `src/features/{name}/` | Standalone module, wire in plugin/ |
| Add new MCP | `src/mcp/` + register in `createBuiltinMcps()` | Remote HTTP only |
| Add new skill | `src/features/builtin-skills/skills/` | Implement BuiltinSkill interface |
| Add new command | `src/features/builtin-commands/` | Template in templates/ |
| Add new CLI command | `src/cli/cli-program.ts` | Commander.js subcommand |
| Add new doctor check | `src/cli/doctor/checks/` | Register in checks/index.ts |
| Modify config schema | `src/config/schema/` + update root schema | Zod v4, add to OhMyOpenCodeConfigSchema |
| Add new category | `src/tools/delegate-task/constants.ts` | DEFAULT_CATEGORIES + CATEGORY_MODEL_REQUIREMENTS |
```

---

## 8. Applicable Takeaways for HiveMind

### Pattern 1: Plugin-Handler Config Pipeline

**What:** A 6-phase config loading pipeline where each phase is a pure transform function.

**How to adopt:**
```
src/delegation/
├── config-handler.ts          # Phase coordinator
├── agent-config-resolver.ts   # Phase 1: resolve agents
├── tool-config-resolver.ts    # Phase 2: resolve tools  
├── hook-config-resolver.ts    # Phase 3: resolve hooks
├── feature-config-resolver.ts # Phase 4: resolve features
└── mcp-config-resolver.ts    # Phase 5: resolve MCPs
```

**Evidence:** `src/plugin-handlers/config-handler.ts` lines 20-50

### Pattern 2: Central Tool Registry

**What:** A single `createToolRegistry()` function that assembles all tools with conditional registration and priority trimming.

**How to adopt:**
```typescript
// src/plugin/tool-registry.ts
export function createToolRegistry(args: ToolRegistryArgs): ToolRegistryResult {
  const allTools = {
    ...createTrajectoryTools(ctx),
    ...createHandoffTools(ctx),
    ...createTaskTools(ctx),
    ...createJournalTools(ctx),
    ...(featureFlags.docIntelligence ? createDocTools(ctx) : {}),
  }
  return filterDisabledTools(allTools, config.disabled_tools)
}
```

**Evidence:** `src/plugin/tool-registry.ts` lines 100-225

### Pattern 3: Factory Functions for All Constructibles

**What:** Every hook, tool, and agent uses a `createXXX()` factory pattern.

**How to adopt:**
```typescript
// Tools
export function createTrajectoryTool(ctx: PluginContext): ToolDefinition
export function createHandoffTool(ctx: PluginContext): ToolDefinition

// Hooks
export function createTrajectoryHook(input: PluginInput): TrajectoryHook
export function createSessionJournalHook(input: PluginInput): SessionHook

// Managers  
export function createManagers(ctx: PluginContext): Managers
```

**Evidence:** `src/tools/delegate-task/tools.ts`, `src/hooks/atlas/atlas-hook.ts`

### Pattern 4: Strict Layer Hierarchy with No Cross-Layer Imports

**What:** Clear layer separation where `shared/` is the leaf layer, and higher layers can only import from lower layers or adjacent modules.

**How to adopt:**
```
Layer 0: Plugin Entry (index.ts)
Layer 1: Creation (createHooks, createManagers, createTools)
Layer 2: Config Handlers (delegation/)
Layer 3: Features (features/)
Layer 4: Hooks + Tools (hooks/, tools/)
Layer 5: Shared (shared/) ← LEAF
Layer 6: Config Schema (schema-kernel/)
```

**Rules:**
- `hooks/` can import `shared/` only
- `tools/` can import `shared/` only  
- `features/` can import `shared/` + `schema-kernel/`
- `delegation/` can import `features/`, `shared/`, `schema-kernel/`
- No `hooks/` → `tools/` or `tools/` → `hooks/` imports

**Evidence:** `src/AGENTS.md` conventions section

### Pattern 5: Feature = Self-Contained Module with Clear Interface

**What:** Features are isolated modules that provide state/managers to tools via dependency injection, not via hooks.

**How to adopt:**
```typescript
// src/features/trajectory/
// ✓ Self-contained
// ✓ Has own index.ts barrel
// ✓ Exposes manager/state interface
// ✓ Wired explicitly in createManagers()

export class TrajectoryManager {
  constructor(ctx: PluginContext, config: TrajectoryConfig)
  // ...
}

// Wire in create-managers.ts
const trajectoryManager = new TrajectoryManager(ctx, config.trajectory)
```

**Evidence:** `src/features/background-agent/` lines 500-560

---

## 9. Lessons for HiveMind — Specific, Actionable Organizational Patterns

### 9.1 Adopt: `safeHook()` Error Isolation Wrapper

**Evidence:** `src/plugin/hooks/create-session-hooks.ts` lines 75-77
```typescript
const safeHook = <T>(hookName: HookName, factory: () => T): T | null =>
  safeCreateHook(hookName, factory, { enabled: safeHookEnabled })
```

**What it does:** Wraps every hook factory in a try/catch so one failing hook doesn't crash the entire plugin. The `safeHookEnabled` flag (from `pluginConfig.experimental?.safe_hook_creation`) allows toggling this at runtime.

**How to adopt for HiveMind:**
```typescript
// src/plugin/hooks/create-core-hooks.ts
const safeHook = <T>(hookName: string, factory: () => T): T | null => {
  if (!safeHookEnabled) return factory()
  try { return factory() }
  catch (e) { log(`[safeHook] ${hookName} failed:`, e); return null }
}
```

**Why this matters:** With 48 hooks, any single hook failure would crash the entire plugin. This pattern ensures graceful degradation.

### 9.2 Adopt: Conditional Hook Instantiation via `isHookEnabled()`

**Evidence:** `src/plugin/hooks/create-session-hooks.ts` lines 78-81
```typescript
const contextWindowMonitor = isHookEnabled("context-window-monitor")
  ? safeHook("context-window-monitor", () =>
      createContextWindowMonitorHook(ctx, modelCacheState))
  : null
```

**What it does:** Hooks are only instantiated if enabled in config. Disabled hooks return `null` and are filtered out during plugin interface assembly.

**How to adopt for HiveMind:**
```typescript
// src/create-hooks.ts
const disabledHooks = new Set(pluginConfig.disabled_hooks ?? [])
const isHookEnabled = (name: string) => !disabledHooks.has(name)

const trajectoryHook = isHookEnabled("trajectory")
  ? createTrajectoryHook(ctx, managers.trajectoryManager)
  : null
```

### 9.3 Adopt: `Managers` Type as Interface Boundary Between Layers

**Evidence:** `src/create-managers.ts` lines 15-20
```typescript
export type Managers = {
  tmuxSessionManager: TmuxSessionManager
  backgroundManager: BackgroundManager
  skillMcpManager: SkillMcpManager
  configHandler: ReturnType<typeof createConfigHandler>
}
```

**What it does:** Defines a single typed interface that all downstream layers (tools, hooks) receive. Features don't import from each other — they receive managers as constructor args.

**How to adopt for HiveMind:**
```typescript
// src/create-managers.ts
export type Managers = {
  trajectoryManager: TrajectoryManager
  workflowManager: WorkflowManager
  handoffManager: HandoffManager
  configHandler: ReturnType<typeof createConfigHandler>
}
```

### 9.4 Adopt: `disposeCreatedHooks()` Cleanup Pattern

**Evidence:** `src/create-hooks.ts` lines 16-26
```typescript
export type DisposableCreatedHooks = {
  runtimeFallback?: DisposableHook
  todoContinuationEnforcer?: DisposableHook
  autoSlashCommand?: DisposableHook
}

export function disposeCreatedHooks(hooks: DisposableCreatedHooks): void {
  hooks.runtimeFallback?.dispose?.()
  hooks.todoContinuationEnforcer?.dispose?.()
  hooks.autoSlashCommand?.dispose?.()
}
```

**What it does:** Some hooks return disposable objects (with `dispose()` methods). The cleanup function iterates and calls dispose on each, preventing resource leaks.

**How to adopt for HiveMind:** Track which hooks/features need cleanup and provide a unified `dispose()` function called during plugin shutdown.

### 9.5 Adopt: Tool Priority Ordering for Context Trimming

**Evidence:** `src/plugin/tool-registry.ts` lines 43-71
```typescript
const LOW_PRIORITY_TOOL_ORDER = [
  "session_list", "session_read", "session_search", "session_info",
  "interactive_bash", "look_at", "call_omo_agent",
  "task_create", "task_get", "task_list", "task_update",
  "background_output", "background_cancel", "hashline_edit",
  "ast_grep_replace", "ast_grep_search", "glob", "grep",
  "skill_mcp", "skill", "task",
  "lsp_rename", "lsp_prepare_rename", "lsp_find_references",
  "lsp_goto_definition", "lsp_symbols", "lsp_diagnostics",
] as const
```

**What it does:** When `max_tools` config limit is set, tools are removed in this priority order (least important first) to stay under the cap.

**How to adopt for HiveMind:**
```typescript
const LOW_PRIORITY_TOOL_ORDER = [
  "doc_read", "doc_chunk", "doc_search",
  "handoff_create", "handoff_read",
  "journal_write",
  "trajectory_inspect", "trajectory_checkpoint",
  "task_create", "task_list", "task_get", "task_update",
  "runtime_status", "runtime_command",
] as const
```

### 9.6 Adopt: 4-Scope Skill Discovery Pattern

**Evidence:** `src/features/opencode-skill-loader/AGENTS.md` (lines 45-49)

**What it does:** Skills are discovered from 4 scopes with priority ordering:
```
Project (.opencode/skills/) > OpenCode (.opencode/skills/) > User (~/.config/) > Global (plugin builtin)
```

**How to adopt for HiveMind:** Apply the same scope priority for HiveMind skills, commands, and agents.

### 9.7 Adopt: Spawner Pattern for Complex Features

**Evidence:** `src/features/background-agent/spawner/` (8 files)

**What it does:** The background-agent feature uses a `SpawnerContext` interface to compose 8 focused files:
- `parent-directory-resolver.ts` — where to spawn
- `spawner.ts` — spawn orchestration
- Plus 6 supporting files

Each file has a single responsibility. The spawner receives a context interface, not individual args.

**How to adopt for HiveMind:** Complex features (like trajectory management) should use the same spawner pattern — compose multiple focused files via a context interface.

### 9.8 Adopt: Per-Feature AGENTS.md for Large Modules

**Evidence:** `src/features/background-agent/AGENTS.md`, `src/features/tmux-subagent/AGENTS.md`, `src/features/mcp-oauth/AGENTS.md`, `src/features/opencode-skill-loader/AGENTS.md`

**What it does:** Large features (>10 files) get their own AGENTS.md documenting internal structure, key modules, and patterns.

**How to adopt for HiveMind:** Add AGENTS.md to:
- `src/features/agent-work-contract/` (22 files)
- `src/features/event-tracker/` (20 files)
- `src/features/runtime-entry/` (24 files)
- `src/features/session-entry/` (12 files)

---

## 10. Anti-Patterns to Avoid — What NOT to Copy

### 10.1 DON'T Copy: Flat `hooks/` Directory Structure

**Evidence:** `src/hooks/` has 40+ directories at the root level

**Why it's bad:** Hard to navigate, no grouping by event type, no visual hierarchy. Finding a specific hook requires scanning 40+ directory names.

**Better approach:** Group hooks by runtime event type into subdirectories:
```
hooks/
├── session/          # session.created, session.idle, session.error
├── tool/             # tool.execute.before, tool.execute.after
├── chat/             # chat.message, chat.params, chat.headers
├── transform/        # messages.transform, system.transform
└── compaction/       # session.compacting
```

### 10.2 DON'T Copy: 654-Line `constants.ts` Anti-Pattern

**Evidence:** `src/tools/delegate-task/constants.ts` was 654 lines with 6 distinct responsibilities

**Why it's bad:** Violates single-responsibility principle. They had to refactor it into 4 separate files (`default-categories.ts`, `category-prompt-appends.ts`, `plan-agent-prompt.ts`, `plan-agent-names.ts`).

**Lesson:** Enforce LOC limits per file. Our 200 LOC rule is correct. If a constants file exceeds 100 lines, split it.

### 10.3 DON'T Copy: Generated AGENTS.md Automation

**Evidence:** All AGENTS.md files show `**Generated:** 2026-03-06`

**Why it's bad:** Generated docs become stale immediately after any code change. They reflect a point-in-time snapshot, not current truth.

**Better approach:** Hand-maintained AGENTS.md updated with code changes. Use the structure (Overview, Inventory, Structure, Patterns, How to Add) but update manually.

### 10.4 DON'T Copy: Generated JSON in `src/`

**Evidence:** `src/generated/model-capabilities.generated.json` is 1.4MB (361K tokens)

**Why it's bad:** Bloats the codebase, makes git diffs unreadable, couples source to external API.

**Better approach:** External data source or build-time generation. Keep generated artifacts out of `src/`.

### 10.5 DON'T Copy: Test Files Larger Than Implementation

**Evidence:** 
- `src/features/background-agent/manager.test.ts` — 206KB vs `manager.ts` — 89KB
- `src/tools/delegate-task/tools.test.ts` — 183KB vs implementation files
- `src/hooks/runtime-fallback/index.test.ts` — 113KB

**Why it's bad:** Tests that are 2x larger than implementation indicate testing implementation details rather than behavior. This makes refactoring painful.

**Better approach:** Tests should be proportional to implementation complexity. Focus on behavior testing, not implementation detail testing.

### 10.6 DON'T Copy: Barrel Export `export * from` Pattern

**Evidence:** `src/plugin-handlers/index.ts` uses `export * from` for all 10 handler files

**Why it's bad:** Creates implicit dependencies, makes it hard to trace where symbols come from, and can cause circular dependency issues.

**Better approach:** Explicit named exports only:
```typescript
export { createConfigHandler, type ConfigHandlerDeps } from "./config-handler"
export { applyProviderConfig } from "./provider-config-handler"
// ... explicit exports only
```

### 10.7 DON'T Copy: 48 Hooks for All Lifecycle Events

**Evidence:** 48 hooks across 40+ directories

**Why it's bad:** Excessive for HiveMind's scope. Many hooks are OpenCode-specific (anthropic-effort, no-sisyphus-gpt, prometheus-md-only) and don't apply to HiveMind.

**Better approach:** Start with the hooks HiveMind actually needs (trajectory, workflow, handoff, journal) and add more only when justified by user needs.

### 10.8 DON'T Copy: `as any` and Type Suppression

**Evidence:** Their AGENTS.md explicitly bans `as any`, `@ts-ignore`, `@ts-expect-error` — but the codebase still contains instances

**Why it's bad:** Undermines type safety. If the rule exists but isn't enforced, it's worse than having no rule.

**Better approach:** Enforce type safety through CI/CD gates, not just documentation.

---

## 11. Summary Table

| Pattern | Transferability | Complexity | Priority | Evidence |
|---------|----------------|------------|----------|----------|
| Plugin-Handler Config Pipeline | HIGH | Medium | P0 | `src/plugin-handlers/config-handler.ts` L20-49 |
| Central Tool Registry | HIGH | Low | P0 | `src/plugin/tool-registry.ts` L100-225 |
| Factory Functions (`createXXX()`) | HIGH | Low | P0 | All layers |
| `safeHook()` Error Isolation | HIGH | Low | P0 | `src/plugin/hooks/create-session-hooks.ts` L75-77 |
| Conditional Hook Instantiation | HIGH | Low | P0 | `src/plugin/hooks/create-session-hooks.ts` L78-81 |
| `Managers` Type Interface | HIGH | Low | P0 | `src/create-managers.ts` L15-20 |
| Layer Hierarchy | HIGH | Medium | P1 | `src/AGENTS.md` conventions |
| Feature = Self-Contained Module | MEDIUM | Medium | P1 | `src/features/AGENTS.md` L1-70 |
| Tool Priority Ordering | MEDIUM | Low | P1 | `src/plugin/tool-registry.ts` L43-71 |
| Hook Tier System | MEDIUM | Low | P2 | `src/plugin/hooks/create-core-hooks.ts` L1-46 |
| Dispose Cleanup Pattern | MEDIUM | Low | P2 | `src/create-hooks.ts` L16-26 |
| 4-Scope Skill Discovery | LOW | High | P3 | `src/features/opencode-skill-loader/` |
| Config Multi-Level Merge | LOW | High | P3 | `src/plugin-config.ts` |

---

**Report Generated:** 2026-04-01
**Source File:** `.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml`
**Report Path:** `.hivemind/activity/agents/hivexplorer/oh-my-openagent-patterns-2026-04-01.md`
**Commit:** 7da1d535
