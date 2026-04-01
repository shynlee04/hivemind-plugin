# oh-my-openagent Architecture Patterns Investigation Report

**Generated:** 2026-04-01
**Source:** `/Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/repomix-oh-my-openagents.xml`
**Purpose:** Extract organizational lessons for HiveMind plugin restructuring

---

## Executive Summary

- **Layer Organization:** oh-my-openagent uses a strict 8-directory structure (`agents/`, `hooks/`, `tools/`, `features/`, `shared/`, `config/`, `cli/`, `plugin/`, `plugin-handlers/`) with each directory having a single, unambiguous purpose. Sorting is by **concern boundary**, not by code type.

- **Handler Pattern:** Handlers are factory functions (`createXXXHandler(deps)`) that return OpenCode hook-compatible functions. They iterate over hook records, calling each hook sequentially. `safeHook()` wrapper catches errors per-hook without breaking the chain.

- **Factory Pattern:** All tools (`createXXXTool`), hooks (`createXXXHook(deps)`), and agents (`createXXXAgent(model)`) follow the factory pattern. Factories differ from direct implementations by accepting configuration/deps and returning configurable instances.

- **Tool Registration:** Centralized in `src/plugin/tool-registry.ts` via `createToolRegistry()`. 26 tools registered through factory functions (19) or direct `ToolDefinition` objects (7). No per-agent/per-workflow catalogs — all tools flow through a single registry with `filterDisabledTools()`.

- **Hook Grouping:** 48 hooks organized into 5 tiers by lifecycle phase: Session(23) → Tool Guard(12) → Transform(4) → Continuation(7) → Skill(2). Hooks are grouped in `src/hooks/` subdirectories by feature, then composed into tiers via `create-*-hooks.ts` files.

- **Feature Boundaries:** A "feature" is a standalone module (`src/features/{name}/`) that is self-contained with own types, implementation, and tests. Features wire into plugin/ layer via handlers. Features vs tools: features manage state/lifecycle, tools expose capabilities to the agent.

- **Composition Patterns:** Three-tier hook composition via `create-*-hooks.ts` files. Each hook file iterates over hook records and calls each hook sequentially. Error isolation via `safeHook()` wrapper prevents chain breakage.

- **Selectable Runtime Build:** Not explicitly implemented as "selectable builds" — instead they use config-driven feature flags (`disabled_hooks`, `disabled_mcps`, etc.) to control what ships at runtime without rebuilding.

---

## Pattern 1: Strict Directory Ownership by Concern

### Description
Each top-level `src/` directory has exactly one purpose. No directory contains mixed concerns. The sorting rationale is **functional boundary**, not code type.

### Evidence
```
src/
├── agents/           # 11 agent factories (Sisyphus, Atlas, Prometheus, etc.)
├── hooks/            # 48 lifecycle hooks across dedicated modules
├── tools/            # 26 tools across 15 directories
├── features/         # 19 standalone feature modules
├── shared/           # 95+ utilities in 13 categories
├── config/           # Zod v4 schema system
├── cli/              # CLI: install, run, doctor, mcp-oauth
├── mcp/              # 3 built-in remote MCPs
├── plugin/           # 8 OpenCode hook handlers + hook composition
└── plugin-handlers/  # 6-phase config loading pipeline
```

**Source:** Root `AGENTS.md` (line 273886-273902)

### Applicability to HiveMind
HiveMind currently mixes concerns across directories. Adopting strict ownership would mean:
- `src/tools/` → LLM-facing tools only
- `src/hooks/` → Read-side interceptors
- `src/plugin/` → Assembly and wiring only
- `src/features/` → Stateful modules with lifecycle

### Tradeoffs
| Pros | Cons |
|------|------|
| Clear "where to look" | Requires more upfront planning |
| Enforces single responsibility | May feel restrictive for small plugins |
| Easier to reason about boundaries | Higher file count initially |

---

## Pattern 2: Handler Factory Pattern with Dependency Injection

### Description
Handlers are not direct implementations — they are factory functions that accept dependencies and return handler functions. This enables testing, configuration, and lazy initialization.

### Evidence

**Handler signature pattern** (`src/plugin/chat-headers.ts`, line 202191):
```typescript
export function createChatHeadersHandler(args: { ctx: PluginContext }): (input: unknown, output: unknown) => Promise<void>
```

**Handler iteration pattern** (`src/plugin/AGENTS.md`, line 201905):
> "Handlers iterate over hook records, calling each hook with `(input, output)` in sequence"

**Error isolation** (`src/plugin/AGENTS.md`, line 201906):
> "`safeHook()` wrapper in composition files catches errors per-hook without breaking the chain"

### Applicability to HiveMind
HiveMind's `src/plugin/` currently has business logic mixed with wiring. Applying this pattern:
- Create `createXXXHandler(deps)` factories for each hook type
- Accept `PluginContext` and config as deps
- Return the actual hook function
- Use `safeHook()` equivalent for error isolation

### Tradeoffs
| Pros | Cons |
|------|------|
| Testable in isolation | More indirection |
| Configurable per invocation | Requires proper dependency management |
| Lazy initialization | Slight runtime overhead |

---

## Pattern 3: Tool Registry with Centralized Registration

### Description
All 26 tools are registered in a single `tool-registry.ts` file via `createToolRegistry()`. This is the only place tools are assembled. Tools follow either factory (`createXXXTool`) or direct `ToolDefinition` pattern.

### Evidence

**Tool registry** (`src/plugin/tool-registry.ts`, line 207253):
> "26 tools registered via `createToolRegistry()`. Two patterns: factory functions (`createXXXTool`) for 19 tools, direct `ToolDefinition` for 7 (LSP + interactive_bash)"

**Registry composition** (`src/tools/index.ts`, line 269832):
```typescript
import { createToolRegistry } from "./plugin/tool-registry"
```

**Registration flow** (`src/plugin/AGENTS.md`, line 201875):
> "`tool-registry.ts` — 26 tools assembled from factories"

### Applicability to HiveMind
HiveMind currently distributes tool registration across multiple files. A centralized registry would:
- Make it obvious what tools exist
- Enable `filterDisabledTools()` per config
- Simplify tool auditing

### Tradeoffs
| Pros | Cons |
|------|------|
| Single source of truth | All tools load even if unused |
| Easy to audit/remove | Central file could grow large |
| Simple overlap detection | Requires disciplined updates |

---

## Pattern 4: Five-Tier Hook Organization by Lifecycle Phase

### Description
48 hooks are organized into 5 tiers based on **when** they fire in the lifecycle, not **what** they do:

| Tier | Count | Event Type | Composition File |
|------|-------|------------|-----------------|
| Session | 23 | `session.created`, `session.idle`, `session.error` | `create-session-hooks.ts` |
| Tool Guard | 12 | `tool.execute.before/after` | `create-tool-guard-hooks.ts` |
| Transform | 4 | `messages.transform` | `create-transform-hooks.ts` |
| Continuation | 7 | `session.compacted`, `event` | `create-continuation-hooks.ts` |
| Skill | 2 | `chat.message` | `create-skill-hooks.ts` |

### Evidence

**Hook tier definition** (`src/hooks/AGENTS.md`, lines 194021-194142):
```
### Tier 1: Session Hooks (23) — `create-session-hooks.ts`
### Tier 2: Tool Guard Hooks (12) — `create-tool-guard-hooks.ts`
### Tier 3: Transform Hooks (4) — `create-transform-hooks.ts`
### Tier 4: Continuation Hooks (7) — `create-continuation-hooks.ts`
### Tier 5: Skill Hooks (2) — `create-skill-hooks.ts`
```

**Hook composition** (`src/plugin/AGENTS.md`, lines 201879-201886):
```
| File | Tier | Count |
| `create-session-hooks.ts` | Session | 23 |
| `create-tool-guard-hooks.ts` | Tool Guard | 12 |
| `create-skill-hooks.ts` | Skill | 2 |
| `create-core-hooks.ts` | Aggregator | Session + Guard + Transform = 39 |
```

### Applicability to HiveMind
HiveMind's hooks are not grouped by lifecycle phase. Applying this:
- Group hooks by when they fire (event type)
- Compose via tier files (e.g., `create-session-hooks.ts`)
- Enables predictable execution order

### Tradeoffs
| Pros | Cons |
|------|------|
| Predictable execution order | May force artificial categorization |
| Easier to find hook groups | Some hooks span multiple concerns |
| Clear tier boundaries | More files to maintain |

---

## Pattern 5: Feature Modules as Self-Contained Stateful Units

### Description
A "feature" is a standalone module in `src/features/{name}/` that manages its own state, types, and lifecycle. Features are wired into the plugin layer via plugin-handlers.

### Evidence

**Feature self-containment** (`src/features/AGENTS.md`, lines 100637-100639):
> "Standalone feature modules wired into plugin/ layer. Each is self-contained with own types, implementation, and tests."

**Feature examples:**
- `background-agent/` — 31 files, ~10k LOC, task lifecycle management
- `opencode-skill-loader/` — 33 files, ~3.2k LOC, YAML frontmatter skill loading
- `tmux-subagent/` — 30 files, ~3.6k LOC, tmux pane management

**Feature wiring** (`src/plugin-handlers/AGENTS.md`, lines 209631):
> "13 non-test files implementing the `ConfigHandler`... Executes 6 sequential phases to register agents, tools, MCPs, and commands with OpenCode."

### Applicability to HiveMind
HiveMind's `src/features/` is already similar but needs stricter self-containment:
- Each feature should own its types and state
- Features should not import from other features directly
- Cross-feature communication via plugin-handlers only

### Tradeoffs
| Pros | Cons |
|------|------|
| Clear ownership boundaries | Potential code duplication |
| Independent testability | Feature interop requires care |
| Enables feature flags | More indirection for small features |

---

## Pattern 6: Six-Phase Sequential Config Pipeline

### Description
Plugin configuration loading happens in 6 strictly sequential phases via `plugin-handlers/`. Each phase has exactly one responsibility.

### Evidence

**6-phase pipeline** (`src/plugin-handlers/AGENTS.md`, lines 209633-209642):
```
| Phase | Handler | Purpose |
| 1 | `applyProviderConfig` | Cache model context limits, detect anthropic-beta headers |
| 2 | `loadPluginComponents` | Discover Claude Code plugins (10s timeout, error isolation) |
| 3 | `applyAgentConfig` | Load agents from 5 sources, skill discovery, plan demotion |
| 4 | `applyToolConfig` | Agent-specific tool permissions |
| 5 | `applyMcpConfig` | Merge builtin + CC + plugin MCPs |
| 6 | `applyCommandConfig` | Merge commands/skills from 9 parallel sources |
```

**Pipeline orchestrator** (`src/plugin-handlers/config-handler.ts`, lines 211373-211403):
```typescript
export function createConfigHandler(deps: ConfigHandlerDeps) {
  return async (config: Record<string, unknown>) => {
    applyProviderConfig({ config, modelCacheState });
    const pluginComponents = await loadPluginComponents({ pluginConfig });
    const agentResult = await applyAgentConfig({ ... });
    applyToolConfig({ config, pluginConfig, agentResult });
    await applyMcpConfig({ config, pluginConfig, pluginComponents });
    await applyCommandConfig({ config, pluginConfig, ctx, pluginComponents });
  };
}
```

### Applicability to HiveMind
HiveMind lacks a structured config loading pipeline. Implementing this:
- Creates predictable initialization order
- Enables error isolation per phase
- Simplifies debugging (know exactly which phase failed)

### Tradeoffs
| Pros | Cons |
|------|------|
| Predictable initialization | Must maintain phase order |
| Error isolation | Harder to parallelize |
| Easy to debug | More files for small configs |

---

## Pattern 7: Factory Pattern for Tools, Hooks, and Agents

### Description
All public surface areas (tools, hooks, agents) are created via factory functions, not direct instantiation. Factories accept configuration and return configured instances.

### Evidence

**Tool factory** (`src/tools/index.ts`, line 269936):
> "26 tools registered via `createToolRegistry()`. Two patterns: factory functions (`createXXXTool`) for 19 tools"

**Hook factory** (`src/hooks/AGENTS.md`, line 194019):
> "All hooks follow `createXXXHook(deps) → HookFunction` factory pattern"

**Agent factory** (`src/agents/types.ts`, line 41328):
```typescript
export type AgentFactory = ((model: string) => AgentConfig) & {
  mode: AgentMode;
}
```

### Applicability to HiveMind
HiveMind mixes direct tool definitions with factories. Standardizing:
- All tools via `createXXXTool(deps)` pattern
- All hooks via `createXXXHook(deps)` pattern
- Enables per-agent/per-feature configuration

### Tradeoffs
| Pros | Cons |
|------|------|
| Consistent creation pattern | More boilerplate |
| Configurable instances | Must maintain factory functions |
| Easier mocking in tests | Slight runtime overhead |

---

## Pattern 8: AGENTS.md as Directory-Level Documentation

### Description
Every significant directory has an `AGENTS.md` file that documents:
- Purpose of the directory
- File catalog with purposes
- Key patterns used
- Anti-patterns to avoid

### Evidence

**Directory AGENTS.md locations:**
- `src/agents/AGENTS.md` (line 43008)
- `src/features/AGENTS.md` (line 100633)
- `src/hooks/AGENTS.md` (line 194013)
- `src/plugin/AGENTS.md` (line 201857)
- `src/plugin-handlers/AGENTS.md` (line 209625)

**AGENTS.md content example** (`src/features/AGENTS.md`, lines 100637-100639):
> "Standalone feature modules wired into plugin/ layer. Each is self-contained with own types, implementation, and tests."

### Applicability to HiveMind
HiveMind already uses this pattern but inconsistently. Emphasizing:
- Every `src/` subdirectory needs AGENTS.md
- AGENTS.md should explain sorting rationale
- AGENTS.md should be machine-generated or kept in sync

### Tradeoffs
| Pros | Cons |
|------|------|
| Self-documenting structure | Must keep in sync |
| Enables "where to look" | Can become stale |
| Captures decisions | Adds file count |

---

## Key Differences from HiveMind's Current Structure

| Aspect | oh-my-openagent | HiveMind (Current) |
|--------|-----------------|-------------------|
| **Directory count** | 10 top-level `src/` dirs | Mixed concerns across `features/`, `tools/`, `hooks/` |
| **Plugin layer** | `plugin/` (wiring) + `plugin-handlers/` (config pipeline) | `plugin/` contains business logic |
| **Tool registration** | Single `tool-registry.ts` | Distributed across feature modules |
| **Hook grouping** | 5 tiers by lifecycle phase | Flat structure in `hooks/` |
| **Feature isolation** | Self-contained with own types/state | Features import from each other |
| **Config pipeline** | 6 sequential phases | Config loaded ad-hoc |
| **Directory docs** | Every dir has AGENTS.md | Inconsistent documentation |

---

## Recommended Patterns to Adopt

### 1. Centralized Tool Registry
**Rationale:** HiveMind's distributed tool registration makes it hard to audit what tools exist and what they depend on. A single `tool-registry.ts` with `filterDisabledTools()` would make tool management predictable.

**Implementation:** Create `src/plugin/tool-registry.ts` that assembles all tools. Each tool follows `createXXXTool(deps)` factory.

### 2. Handler Factory Pattern
**Rationale:** HiveMind's `src/plugin/` mixes wiring with business logic. Factory pattern (`createXXXHandler(deps)`) would separate configuration from execution.

**Implementation:** Refactor each plugin hook into a factory that accepts deps and returns the hook function.

### 3. Five-Tier Hook Organization
**Rationale:** Hooks currently have no clear execution order. Grouping by lifecycle phase (Session → Tool Guard → Transform → Continuation → Skill) would make execution predictable.

**Implementation:** Move hooks into `src/hooks/{tier}/` directories and compose via `create-{tier}-hooks.ts` files.

### 4. Six-Phase Config Pipeline
**Rationale:** Config loading is currently implicit and hard to debug. A sequential pipeline with clear phases would make initialization predictable.

**Implementation:** Create `src/plugin-handlers/config-handler.ts` with 6 phases: Provider → Components → Agents → Tools → MCPs → Commands.

### 5. Self-Contained Feature Modules
**Rationale:** Features currently import from each other, creating coupling. Each feature should own its state and communicate via the plugin layer.

**Implementation:** Features get own types/, state/, and lifecycle management. Cross-feature calls go through handlers.

---

## Patterns to Explicitly Avoid

### 1. "catch-all" files (`utils.ts`, `helpers.ts`, `service.ts`)
**Rationale:** oh-my-openagent explicitly bans these (`AGENTS.md` line 11994: "Never create catch-all files (`utils.ts`, `helpers.ts`, `service.ts`)"). They become dumping grounds for unrelated code.

**HiveMind status:** `src/shared/` contains several utility files that could be decomposed.

### 2. Direct imports across feature boundaries
**Rationale:** Features should not import from other features directly. All cross-feature communication should go through the plugin layer.

**HiveMind status:** Features currently import from each other (e.g., `runtime-entry` imports from `session-journal`).

### 3. Hooks without error isolation
**Rationale:** oh-my-openagent uses `safeHook()` wrapper to catch errors per-hook without breaking the chain. HiveMind hooks currently throw on error, potentially breaking the session.

**HiveMind status:** No error isolation in hook execution.

### 4. Index.ts as business logic dump
**Rationale:** oh-my-openagent rule: "index.ts is entry point ONLY — never dump business logic there" (`AGENTS.md` line 23997).

**HiveMind status:** Several `index.ts` files contain logic beyond barrel exports.

### 5. Lazy loading of critical paths
**Rationale:** oh-my-openagent loads plugin components with 10s timeout and error isolation. HiveMind may have silent failures in config loading.

**HiveMind status:** Config errors may not surface clearly.

---

## Appendix: Directory Structure Comparison

### oh-my-openagent Full Structure
```
src/
├── index.ts                    # Plugin entry
├── plugin-config.ts            # JSONC multi-level config
├── agents/                     # 11 agent factories
│   ├── atlas/
│   ├── builtin-agents/
│   ├── hephaestus/
│   ├── prometheus/
│   ├── sisyphus/
│   ├── sisyphus-junior/
│   ├── agent-builder.ts
│   ├── types.ts
│   └── AGENTS.md
├── hooks/                      # 48 hooks in tiered subdirs
│   ├── atlas/
│   ├── ralph-loop/
│   ├── session-recovery/
│   ├── create-session-hooks.ts
│   ├── create-tool-guard-hooks.ts
│   ├── create-transform-hooks.ts
│   ├── create-continuation-hooks.ts
│   ├── create-skill-hooks.ts
│   └── AGENTS.md
├── tools/                       # 26 tools
│   ├── ast-grep/
│   ├── background-task/
│   ├── delegate-task/
│   ├── tool-registry.ts
│   └── AGENTS.md
├── features/                    # 19 feature modules
│   ├── background-agent/
│   ├── opencode-skill-loader/
│   ├── tmux-subagent/
│   ├── builtin-skills/
│   └── AGENTS.md
├── plugin/                      # 8 hook handlers + composition
│   ├── hooks/
│   ├── chat-message.ts
│   ├── chat-params.ts
│   ├── event.ts
│   ├── tool-execute-before.ts
│   ├── tool-execute-after.ts
│   ├── messages-transform.ts
│   ├── tool-registry.ts
│   ├── chat-headers.ts
│   └── AGENTS.md
├── plugin-handlers/             # 6-phase config pipeline
│   ├── config-handler.ts
│   ├── agent-config-handler.ts
│   ├── tool-config-handler.ts
│   ├── mcp-config-handler.ts
│   ├── command-config-handler.ts
│   ├── provider-config-handler.ts
│   └── AGENTS.md
├── shared/                       # 95+ utilities
├── config/                       # Zod v4 schemas
├── cli/                          # CLI commands
└── mcp/                          # Built-in MCPs
```

### HiveMind Current Structure (for reference)
```
src/
├── tools/                        # Mixed: tools + task + trajectory + etc.
├── hooks/                        # Flat, no tier organization
├── plugin/                       # Mixed: wiring + business logic
├── features/                     # Some self-contained, some coupled
├── shared/                       # Utilities + contracts
├── schema-kernel/               # Contract schemas
├── core/                         # State management
├── sdk-supervisor/               # Runtime inspection
├── recovery/                      # State repair
├── governance/                    # Planning projection
├── delegation/                   # Handoff packaging
├── commands/                     # Slash command registry
├── intelligence/                 # Document intelligence
├── context/                     # Session prompt compilation
├── control-plane/               # CLI primitive registry
├── cli/                         # Command routing
└── (various feature dirs)
```

---

## Evidence Index

| Pattern | Source File | Lines |
|---------|------------|-------|
| Directory structure | `repomix-oh-my-openagents.xml` | 244-500 |
| Root AGENTS.md | `repomix-oh-my-openagents.xml` | 273876-274031 |
| src/hooks/AGENTS.md | `repomix-oh-my-openagents.xml` | 194013-194159 |
| src/plugin/AGENTS.md | `repomix-oh-my-openagents.xml` | 201857-201906 |
| src/plugin-handlers/AGENTS.md | `repomix-oh-my-openagents.xml` | 209625-209682 |
| src/features/AGENTS.md | `repomix-oh-my-openagents.xml` | 100633-100702 |
| Handler pattern | `src/plugin/chat-headers.ts` | 202191 |
| Tool registry | `src/plugin/tool-registry.ts` | 207253 |
| Config pipeline | `src/plugin-handlers/config-handler.ts` | 211373-211403 |
| Agent factory | `src/agents/types.ts` | 41328 |
