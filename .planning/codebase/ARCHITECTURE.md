<!-- refreshed: 2026-05-07 -->
# Architecture

**Analysis Date:** 2026-05-07

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Hard Harness (npm package)                         │
│                             `src/`  (~23k LOC)                            │
├──────────────────┬──────────────────────┬────────────────────────────────┤
│   Tools (Write)  │   Hooks (Read)       │   Kernel (Shared)              │
│  `src/tools/`    │  `src/hooks/`        │  `src/lib/`                    │
│  CQRS: mutation  │  CQRS: observation   │  types, state, concurrency,    │
│  authority only  │  only (no durable    │  continuity, lifecycle,        │
│                  │   writes allowed)    │  delegation, session-api       │
├──────────────────┼──────────────────────┼────────────────────────────────┤
│            Plugin Composition Root (`src/plugin.ts` — 183 LOC)            │
│            Wires deps → instantiates hooks → registers 17 tools           │
└────────┬─────────┴──────────────────────┴───────────┬────────────────────┘
         │                                              │
         ▼                                              ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐
│   Soft Meta-Concepts (configurable)  │  │   Deep Module State (internal)        │
│   `.opencode/`                       │  │   `.hivemind/`                        │
│                                      │  │                                       │
│   • 89 agents (33 gsd + 45 hm +     │  │   • Continuity JSON (session state)   │
│     11 hf)                          │  │   • Delegation records                │
│   • 123 skills (35 hm + 13 hf +     │  │   • Event tracker artifacts           │
│     3 gate + 6 stack + 65 gsd-* ×  │  │   • Runtime policy config             │
│   • 19 commands                     │  │   • Config workflow state             │
│   • Permission rules                │  │   • Poor prompts archive              │
│   • Plugin loader                   │  │                                       │
└──────────────────────────────────────┘  └──────────────────────────────────────┘
```

## Two Halves (never confuse them)

| Half | What | Where |
|------|------|-------|
| **Hard Harness** (npm package) | Tools (write-side), Hooks (read-side), Plugin (assembly), Shared (leaf), Schema Kernel (validation) | `src/` |
| **Soft Meta-Concepts** (user-configurable) | Skills, Agents, Commands, Rules, Permissions | `.opencode/` |
| **Internal State** (deep module persistence) | Session journals, execution lineage, runtime state, delegation records | `.hivemind/` |

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `HarnessControlPlane` | Composition root — instantiates deps, wires hooks, registers 17 tools, loads runtime policy, recovers pending delegations | `src/plugin.ts` |
| `DelegationManager` | Core delegation orchestrator — WaiterModel dispatch, concurrency, status polling, recovery, PTY coordination, category gate resolution | `src/lib/delegation-manager.ts` (500 LOC) |
| `HarnessLifecycleManager` | Session lifecycle state machine — transition guards, activity tracking, event routing, hydration | `src/lib/lifecycle-manager.ts` (243 LOC) |
| `CompletionDetector` | Two-signal completion detection (session.idle + stability timer) | `src/lib/completion-detector.ts` (157 LOC) |
| `TaskStateManager` | In-memory Maps for sessionStats, rootBudgets, sessionToRoot, sessionDelegationMeta | `src/lib/state.ts` (251 LOC) |
| `DelegationConcurrencyQueue` | Keyed semaphore (FIFO per provider+model+agent+category) with priority queuing | `src/lib/concurrency.ts` (310 LOC) |
| `NotificationHandler` | Terminal-state delegation notifications — fire-and-forget with durable pending queue | `src/lib/notification-handler.ts` (238 LOC) |
| Continuity Store | Durable JSON persistence with deep-clone, normalization, quarantine | `src/lib/continuity.ts` (465 LOC) |
| Session API | Typed OpenCode SDK wrappers (create, get, abort, messages, prompt, walkParentChain) | `src/lib/session-api.ts` (285 LOC) |
| Runtime Policy | Policy loading, validation, per-session overrides (concurrency, budget, category gates) | `src/lib/runtime-policy.ts` (267 LOC) |
| Session Journal | Append-only event timeline — independent of continuity.ts (Q3 decision) | `src/lib/session-journal.ts` |
| Execution Lineage | Derived projection combining continuity + delegations + journal entries | `src/lib/execution-lineage.ts` |
| Schema Kernel | Zod v4 schemas for agent/command/skill frontmatter, permissions, MCP servers, prompt-enhance pipeline, trajectory, pressure, SDK supervisor | `src/schema-kernel/` (16 files) |
| Spawner | Agent primitive policy, concurrency key resolution, parent directory, session creation, request building | `src/lib/spawner/` |
| PTY Manager | bun-pty pseudo-terminal integration for background command execution — lazy-loaded with graceful fallback | `src/lib/pty/` |
| Config Workflow | Turn-based workflow state persistence for configure-primitive (Discover→Investigate→Collect→Proposal→Validate→Compile→Test→Save) | `src/lib/config-workflow/` |
| Control Plane | Gatekeeper and gate-decision logic for governance enforcement | `src/lib/control-plane/` |
| Recovery | State assessment, failure classification, checkpoint creation, repair | `src/lib/recovery/` |
| Security | Path-scope validation (`assertPathWithinRoot`) and boundary-field redaction | `src/lib/security/` |

## Pattern Overview

**Overall:** CQRS Plugin Architecture with WaiterModel Delegation

**Key Characteristics:**
- **CQRS separation**: Tools are the only write-side mutation surface; hooks are read-side observers — enforced by `src/hooks/hook-cqrs-boundary.ts` (`assertHookWriteBoundary`)
- **WaiterModel delegation**: `delegate-task` tool returns immediately with delegation ID; polling via `delegation-status` tool; dual-signal completion detection (session.idle + stability timer)
- **Dual-layer state**: Durable JSON file (`continuity.ts`) for persistence across restarts + in-memory Maps (`state.ts`) for hot runtime access, hydrated on startup
- **Keyed semaphore concurrency**: `DelegationConcurrencyQueue` with per-key (provider:model, agent:category) FIFO lanes, high/normal priority queuing
- **Trusted runtime policy**: Configurable concurrency limits, tool budgets, category gates loaded from `.hivemind/runtime-policy.json` (workspace-level) with per-session overrides via delegation metadata
- **Hybrid delegation**: SDK child-session dispatch (resumable) + PTY command-process dispatch (best-effort) + headless process dispatch (non-resumable) — unified under `DelegationManager`
- **Zero business logic in plugin layer**: `plugin.ts` is a thin composition root (183 LOC); all logic lives in individual hook factories and tool implementations
- **`[Harness]` error prefix**: All thrown errors use this prefix for flow control identification
- **Deep-clone-on-read**: All continuity reads clone data to prevent mutation aliasing

## Layers

### Tools Layer (Write-Side / CQRS Command)
- Purpose: Expose mutation operations to agents via OpenCode tool system — delegation dispatch, status polling, background commands, prompt enhancement, configuration, validation, journal export, trajectory tracking, pressure classification, SDK supervision, command engine, agent work contracts
- Location: `src/tools/`
- Contains: 17 tool implementations (13 single-file + 2 multi-file directories: prompt-skim, prompt-analyze, session-patch), each wrapping a Zod schema and `execute()` function
- Depends on: `src/lib/` (types, delegation-manager, continuity), `@opencode-ai/plugin/tool`, `src/shared/`
- Used by: OpenCode runtime — agents invoke tools via plugin tool registry

**Tools registered (in `plugin.ts:127-143`):**

| Tool | Purpose | File |
|------|---------|------|
| `delegate-task` | Dispatch work to specialist agents via SDK child-session (WaiterModel) | `src/tools/delegate-task.ts` |
| `delegation-status` | Poll delegation status by ID or list all (optionally filtered by status) | `src/tools/delegation-status.ts` |
| `run-background-command` | Run CLI commands in shared PTY sessions with queue-governed dispatch | `src/tools/run-background-command.ts` |
| `prompt-skim` | Fast scan of prompt content (words/lines/tokens, URLs, file paths, complexity score) | `src/tools/prompt-skim/` |
| `prompt-analyze` | Deep analysis for contradictions, vagueness, missing scope, clarity signals | `src/tools/prompt-analyze/` |
| `session-patch` | Patch specific sections in session files with backup | `src/tools/session-patch/` |
| `session-journal-export` | Export session journal and execution lineage as JSON or Markdown | `src/tools/session-journal-export.ts` |
| `configure-primitive` | Configure, read, list, or inspect OpenCode primitives (agent, command, skill) | `src/tools/configure-primitive.ts` |
| `validate-restart` | Validate compiled primitives are discoverable after restart | `src/tools/validate-restart.ts` |
| `hivemind-doc` | Search and retrieve Hivemind documentation artifacts | `src/tools/hivemind-doc.ts` |
| `hivemind-trajectory` | Track and export execution trajectory for audit | `src/tools/hivemind-trajectory.ts` |
| `hivemind-pressure` | Runtime pressure classification and authority matrix | `src/tools/hivemind-pressure.ts` |
| `hivemind-sdk-supervisor` | SDK supervision and health monitoring | `src/tools/hivemind-sdk-supervisor.ts` |
| `hivemind-command-engine` | Command execution engine with queue governance | `src/tools/hivemind-command-engine.ts` |
| `hivemind-agent-work-create` | Create agent work contracts with task boundary, evidence level, verification commands | `src/tools/hivemind-agent-work.ts` |
| `hivemind-agent-work-export` | Export agent work contracts for audit | `src/tools/hivemind-agent-work.ts` |

### Hooks Layer (Read-Side / CQRS Query)
- Purpose: Observe and react to OpenCode lifecycle events — event routing, auto-loop, session compaction, tool guarding, message transformation, shell env injection
- Location: `src/hooks/`
- Contains: 10 hook factory modules organized by concern
- Depends on: `src/lib/` (session-api, lifecycle-manager, continuity, types)
- Used by: `plugin.ts` composition root — spread-merged into plugin return object

**Hook factories:**

| Factory | Produces | File |
|---------|----------|------|
| `createCoreHooks` | `event`, `messages.transform`, `system.transform`, `experimental.chat.system.transform`, `shell.env` | `src/hooks/create-core-hooks.ts` |
| `createSessionHooks` | `event` (auto-loop/ralph-loop), `experimental.session.compacting` | `src/hooks/create-session-hooks.ts` |
| `createToolGuardHooks` | `tool.execute.before` (guard), `tool.execute.after` (audit) | `src/hooks/create-tool-guard-hooks.ts` |
| Plugin Event Observers | `event` observers for delegation lifecycle tracking (idle/deleted), session entry intake, and session journey tracking | `src/hooks/plugin-event-observers.ts` |
| `createToolExecuteAfterHook` | `tool.execute.after` composer that chains tool-guard after-hook with output summarization + event tracker artifact creation | `src/hooks/tool-after-composer.ts` |
| `createMessagesTransformHook` | `messages.transform` — hook for message-level transformations | `src/hooks/messages-transform.ts` |
| CQRS Boundary | `classifyHookEffect()`, `assertHookWriteBoundary()` — classifies hooks as observation/response-shaping/guard-decision; prevents durable writes from hooks | `src/hooks/hook-cqrs-boundary.ts` |
| Governance Block | Governance enforcement hook — blocks disallowed actions at hook level | `src/hooks/governance-block.ts` |
| Toggle Gates | Feature toggle gate enforcement for runtime configuration | `src/hooks/toggle-gates.ts` |

### Library Layer (Deep Modules / Shared Kernel)
- Purpose: All business logic — types, state, concurrency, persistence, lifecycle, delegation, SDK wrappers, completion detection, runtime policy, session journal, execution lineage, event tracking, spawner, PTY, security, recovery, configuration
- Location: `src/lib/`
- Contains: 55 entries (flat files + 20 subdirectories)
- Depends on: `zod` (v4.3.6), `@opencode-ai/sdk` (v1.14.28), `bun-pty` (optional, v0.4.8), `gray-matter`, `yaml`, `fast-glob`, `commander`, Node.js built-ins (fs, crypto, path, child_process)
- Used by: `plugin.ts` composition root, all tools, all hooks

**Core module metrics:**

| Module | LOC | Role | Dependency Chain |
|--------|-----|------|-----------------|
| `types.ts` | 415 | Shared types + constants — leaf node | 0 (leaf) |
| `delegation-manager.ts` | 500 | Core delegation orchestrator | 2 (deepest consumer) |
| `continuity.ts` | 465 | Durable JSON persistence + normalization | 1 |
| `concurrency.ts` | 310 | Keyed semaphore (FIFO queue) | 0 (self-contained) |
| `session-api.ts` | 285 | Typed OpenCode SDK wrappers | 1 |
| `runtime-policy.ts` | 267 | Policy loading, validation, overrides | 2 |
| `helpers.ts` | 257 | Pure utilities only | 1 |
| `state.ts` | 251 | In-memory Maps for runtime stats | 1 |
| `lifecycle-manager.ts` | 243 | Session lifecycle state machine | 2 |
| `notification-handler.ts` | 238 | Terminal-state delegation notifications | 1 |
| `delegation-persistence.ts` | 197 | Delegation record I/O | 2 |
| `auto-loop.ts` | 146 | Autonomous loop orchestration | - |
| `completion-detector.ts` | 157 | Two-signal completion detection | 0 (self-contained) |
| `runtime.ts` | 95 | Event→status mapping | 1 |
| `task-status.ts` | 22 | Task status transition guards | 1 |

**Dependency graph (simplified):**
```
types.ts (leaf — imports from delegation-types.ts only)
├── task-status.ts → types.ts
├── state.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts (self-contained)
├── completion-detector.ts (self-contained)
├── continuity.ts → types.ts + security/
├── delegation-persistence.ts → types.ts + continuity.ts
├── session-api.ts → helpers.ts
├── runtime.ts → helpers.ts + types.ts
├── notification-handler.ts → helpers.ts
├── category-gates.ts → types.ts
├── category-gate-audit.ts → types.ts
├── runtime-policy.ts → types.ts + category-gates.ts
├── workspace-runtime-policy.ts → (fs-based config loading)
├── session-journal.ts → security/
├── execution-lineage.ts → types.ts + session-journal.ts
├── lifecycle-manager.ts → concurrency + continuity + helpers + session-api + state + types + completion-detector + notification-handler
└── delegation-manager.ts → concurrency + delegation-persistence + notification-handler + command-delegation + sdk-delegation + category-gates + category-gate-audit + session-api + runtime-policy + spawner/ + app-api + types
```

**Max chain depth:** 2 levels. `types.ts` changes ripple to most modules. `delegation-manager.ts` and `lifecycle-manager.ts` sit at the deepest import depth.

### Shared Layer (Cross-Cutting Tool Utilities)
- Purpose: Standard tool response envelope and rendering for consistent tool output
- Location: `src/shared/`
- Files: `tool-response.ts` (success/error/pending envelope with type guards), `tool-helpers.ts` (JSON rendering)
- Depends on: Nothing (leaf modules)
- Used by: All tool implementations

### Schema Kernel Layer
- Purpose: Zod v4 validation schemas for OpenCode meta-concept validation — agent/command/skill frontmatter, permissions, MCP server configs, prompt-enhance pipeline, config precedence, agent work contracts, runtime pressure, SDK supervision, command engine, doc intelligence, trajectory
- Location: `src/schema-kernel/`
- Files: 16 `.schema.ts` files + `index.ts` barrel
- Depends on: `zod` (v4.3.6)
- Used by: `configure-primitive` tool, `validate-restart` tool, config-workflow, hivemind-* tools

### CLI Layer
- Purpose: Standalone CLI interface for Hivemind harness operations — command routing, discovery, rendering
- Location: `src/cli/`
- Files: `index.ts`, `router.ts`, `discovery.ts`, `renderer.ts`, `commands/help.ts`
- Entry: `hivemind/cli` export — provides `hivemind` binary
- Depends on: `commander` (v14.0.3)

### Soft Meta-Concepts Layer
- Purpose: User-configurable OpenCode primitives — agents, skills, commands, rules — compose the runtime behavior from outside the npm package
- Location: `.opencode/`
- Contains: 89 agents, 123 skills, 19 commands, permission rules, plugin loader, deny-prompts, hivefiver integration
- Relationship: Loaded at OpenCode startup; harness tools reference these primitives at runtime
- **Canonical skill location:** `.opencode/skills/` is the ONLY canonical location. IDE-managed directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) are third-party sync artifacts — not project deliverables.
- **Source-of-truth for skills:** `.hivefiver-meta-builder/skills-lab/active/refactoring/` → reflected in `.opencode/skills/` via directory-level symlink

#### Agent Lineages

| Lineage | Count | Purpose |
|---------|-------|---------|
| **hm-\*** (Harness Module) | 45 | Product-dev specialists: architect, auditor, brainstormer, builder, critic, debugger, executor, researcher, reviewer, etc. |
| **hf-\*** (HiveFiver) | 11 | Meta-concept builders: agent-builder, skill-builder, command-builder, tool-builder, auditor, prompter, refactorer, meta-builder, synthesizer |
| **gsd-\*** (GSD Internal) | 33 | Internal build tool agents — NOT shipped as harness primitives |

#### Skill Lineages

| Lineage | Count | Purpose |
|---------|-------|---------|
| **hm-\*** (Product-Dev) | 35 | brainstorm, spec-driven-authoring, test-driven-execution, debug, refactor, deep-research, detective, synthesis, coordinating-loop, phase-execution, gate-orchestrator, etc. |
| **hf-\*** (Meta-Builder) | 13 | agent-composition, agents-and-subagents-dev, command-dev, custom-tools-dev, skill-synthesis, delegation-gates, meta-builder, use-authoring-skills, etc. |
| **gate-\*** (Quality) | 3 | evidence-truth, lifecycle-integration, spec-compliance — internal quality triad, THIS PROJECT ONLY |
| **stack-\*** (Reference) | 6 | bun-pty, json-render, nextjs, opencode, vitest, zod — framework/stack reference skills |
| **gsd-\*** (GSD Internal) | 65 | Internal workflow utilities — NOT shipped |

**Delegation hierarchy:**
```
L0 (Orchestrator) → hm-l0-orchestrator (human-facing, routes only, never implements)
  └── L1 (Coordinator) → hm-l1-coordinator (wave-based dispatch, checkpoint gates)
       └── L2 (Specialist) → 45 hm-l2-* agents (domain specialists: researcher, builder, critic, reviewer, etc.)
            └── L3 (Reference) → skills at hm-l3-*, stack-l3-*, gate-l3-* (consumed by L2 agents)

L0 (Orchestrator) → hf-l0-orchestrator (meta-builder routing)
  └── L1 (Coordinator) → hf-l1-coordinator (meta-concept creation waves)
       └── L2 (Specialist) → 11 hf-l2-* agents (agent-builder, skill-builder, command-builder, etc.)
```

### Deep Module State Layer (Q6)
- Purpose: Internal runtime state persistence — session continuity, delegation records, execution lineage, event tracker artifacts, session journals, runtime policy configuration
- Location: `.hivemind/`
- Contains: 4 subdirectories
  - `state/` — `session-continuity.json`, `delegations.json`, `config-workflows.json`
  - `event-tracker/` — hook-driven audit artifacts
  - `poor-prompts/` — archived poor prompt examples
- Relationship: Written by `continuity.ts`, `delegation-persistence.ts`, event tracker, `session-journal.ts`; read at hydration time
- **Q6 rule:** `.hivemind/` is canonical state root. `.opencode/` is ONLY for OpenCode primitives. One-way migration from legacy `.opencode/state/opencode-harness/`.

### Source-of-Truth Layer (`.hivefiver-meta-builder/`)
- Purpose: Authoring environment for soft meta-concepts before they're reflected to `.opencode/`
- Location: `.hivefiver-meta-builder/`
- Contains:
  - `agents-lab/` — agent source files (active/refactoring/, orchestrator/)
  - `skills-lab/` — skill source files (active/refactoring/, .archive/, retired/)
  - `commands-lab/` — command source files
  - `workflows-lab/` — workflow definitions
  - `references-lab/` — reference materials
  - `plans/` — meta-builder implementation plans
  - `research/` — research artifacts
  - `rules/` — meta-builder rules
- Relationship: Author here → symlink or copy to `.opencode/` for runtime consumption

## Data Flow

### Primary Request Path: Delegation (WaiterModel)

1. **Agent invokes `delegate-task` tool** — passes agent name, prompt, title, safetyCeilingMs (`src/tools/delegate-task.ts`)
2. **Schema validation** — `DelegateTaskInputSchema.parse()` via Zod (`src/tools/delegate-task.ts`)
3. **Runtime detection** — checks `context.sessionID` / `OPENCODE_SESSION_ID` for OpenCode context
4. **DelegationManager.dispatch()** — validates agent, resolves category gate, checks depth limit, acquires concurrency slot, builds spawn request (`src/lib/delegation-manager.ts:500 LOC`)
5. **Spawner resolves agent policy** — loads agent `.md` frontmatter, resolves permissions, tools, temperature from primitives (`src/lib/spawner/`)
6. **Session creation** — SDK `client.session.create()` with parentID, agent, model, tools, permissions (`src/lib/spawner/session-creator.ts`, `src/lib/session-api.ts`)
7. **Prompt dispatch** — SDK `sendPrompt()` sends task prompt to child session (`src/lib/session-api.ts`)
8. **Concurrency release** — release queue slot, persist delegation record (`src/lib/delegation-manager.ts`)
9. **Status polling** — agent periodically calls `delegation-status` tool to check completion (`src/tools/delegation-status.ts`)
10. **Completion detection** — `CompletionDetector` watches for `session.idle` events + stability timer (`src/lib/completion-detector.ts`)
11. **Result capture** — messages retrieved via `getSessionMessages()`, result returned as JSON tool response (`src/lib/sdk-delegation.ts`, `src/tools/delegation-status.ts`)

### Secondary Flow: Background Command Execution (PTY)

1. Agent invokes `run-background-command` tool with `action: "run"` (`src/tools/run-background-command.ts`)
2. Tool routes to `DelegationManager` → `CommandDelegationHandler` (`src/lib/command-delegation.ts`)
3. PTY session spawned via `PtyManager` — lazy-loaded bun-pty with graceful fallback to `node:child_process` (`src/lib/pty/`)
4. Output polled via `action: "output"`, input sent via `action: "input"`, terminated via `action: "terminate"`
5. Queue-governed dispatch with key-based concurrency

**CP-PTY runway note (2026-05-08):** This flow is now tracked by CP-PTY-00 as a cross-cutting control-plane spike. Future implementation must preserve lane separation between SDK child sessions, PTY command sessions, headless command fallback, and read-only projection surfaces. PTY/headless command sessions must not be represented as resumable after parent runtime restart unless a later phase proves that behavior.

### Tertiary Flow: Prompt Enhancement Pipeline

1. Agent invokes `prompt-skim` → fast scan (words, lines, tokens, URLs, file paths, complexity) (`src/tools/prompt-skim/`)
2. Agent invokes `prompt-analyze` → deep analysis (contradictions, vagueness, clarity) (`src/tools/prompt-analyze/`)
3. Agent invokes `session-patch` → apply fixes to session files (`src/tools/session-patch/`)
4. All use shared `ToolResponse<T>` envelope (`success`/`error`/`pending`) from `src/shared/tool-response.ts`

### Event Observation Flow (Hook Side)

1. OpenCode emits session lifecycle events (start, idle, error, deleted, compacting, message)
2. `createCoreHooks` → `event` handler routes to `lifecycleManager.handleEvent()` + 4 event observers (`src/hooks/create-core-hooks.ts`)
3. `createSessionHooks` → `event` handler drives auto-loop/ralph-loop on `session.idle` (`src/hooks/create-session-hooks.ts`)
4. `createToolGuardHooks` → `tool.execute.before` guards tool calls against budget/tool restrictions; `tool.execute.after` records audit events (`src/hooks/create-tool-guard-hooks.ts`)
5. Plugin event observers → delegation lifecycle tracking (`delegation-session-idle`, `delegation-session-deleted`), session intake classification, session journey tracking (`src/hooks/plugin-event-observers.ts`)
6. Event tracker → parses hook events, writes artifacts to `.hivemind/event-tracker/` (best-effort, never blocks canonical event handling) (`src/lib/event-tracker/`)

**State Management:**
- Durable state: `continuity.ts` writes `session-continuity.json` to `.hivemind/state/` (canonical per Q6); deep-clone-on-read, normalize-on-write, quarantine-on-corruption
- In-memory state: `state.ts` `TaskStateManager` with 4 Maps (rootBudgets, sessionToRoot, sessionStats, sessionDelegationMeta + subagentSessions)
- Delegation state: `delegation-persistence.ts` writes `delegations.json` to `.hivemind/state/`
- Hydration: `lifecycleManager.hydrateFromContinuity()` at startup

## Key Abstractions

**RuntimePolicy:**
- Purpose: Configurable concurrency limits, tool budgets, category gates — loaded from workspace-level JSON or defaults
- Examples: `src/lib/runtime-policy.ts` (loading, validation, per-session overrides), `src/lib/workspace-runtime-policy.ts` (filesystem resolution)
- Pattern: Layered defaults with per-key overrides; supplements OpenCode-native enforcement (never duplicates)

**Delegation (WaiterModel):**
- Purpose: Unified abstraction for all delegation modes (SDK child-session, PTY command, headless process)
- Examples: `src/lib/delegation-manager.ts` (orchestrator, 500 LOC), `src/lib/sdk-delegation.ts` (SDK polling), `src/lib/command-delegation.ts` (PTY/process)
- Pattern: dispatch → return ID immediately → poll for status via delegation-status tool

**Shell / PTY Control-Plane:**
- Purpose: Future CP-PTY phases harden background shell, PTY, and headless command sessions with permission gates, bounded output, cleanup, and restart-truth semantics.
- Examples: `src/tools/run-background-command.ts`, `src/lib/command-delegation.ts`, `src/lib/pty/`, and future tests.
- Pattern: start/read/write/list/terminate must remain explicit; read-only sidecar/tmux projections must not mutate canonical state.

**HookDependencies:**
- Purpose: Shared dependency bundle injected into all hook factories via `deps` object
- Examples: `src/hooks/types.ts` — `lifecycleManager`, `client`, `stateManager`, `runAutoLoop`, `runRalphLoop`, `hivemindConfig`, `getBehavioralProfile`
- Pattern: Constructor injection via factory functions; hooks receive only what they need

**ToolResponse<T>:**
- Purpose: Standardized tool output envelope with kind (success/error/pending), message, optional data/metadata
- Examples: `src/shared/tool-response.ts`
- Pattern: All tools return `renderToolResult(success(...))` or `renderToolResult(error(...))`

**9-Surface Mutation Authority:**
- Tools (`src/tools/`) → write-side (CQRS mutation authority)
- Hooks (`src/hooks/`) → read-side only (observation, response-shaping, guard-decisions — no durable writes)
- `assertHookWriteBoundary()` in `src/hooks/hook-cqrs-boundary.ts` enforces this at the boundary
- `classifyHookEffect()` categorizes each hook as: observation | response-shaping | guard-decision

## Architectural Constraints

- **Threading:** Single-threaded Node.js event loop. Concurrency managed via `DelegationConcurrencyQueue` (keyed semaphore, not threads). Background processes via `child_process.spawn` or `bun-pty` PTY sessions.
- **Global state:** `storeCache` singleton at `continuity.ts` — prevents isolated unit testing. `taskState` singleton at `state.ts` — multiple Maps accessible from anywhere.
- **Circular imports:** No known circular dependencies. Dependency graph max depth is 2 levels (`types.ts` → `lifecycle-manager.ts` → `delegation-manager.ts`).
- **Module size cap:** Target 500 LOC per module. `delegation-manager.ts` at 500 LOC is at threshold. `continuity.ts` at 465 LOC is near threshold.
- **CQRS enforcement:** `hook-cqrs-boundary.ts` `assertHookWriteBoundary()` rejects durable writes from hooks. Only tools (write-side) may mutate state.
- **No `any` types:** Policy enforced for new code. Known tech debt: `client: any` in some SDK type positions.
- **State root separation (Q6):** `.hivemind/` is canonical state root; `.opencode/` is only for OpenCode primitives. One-way migration from legacy `.opencode/state/opencode-harness/`.
- **`verbatimModuleSyntax`:** Type-only imports must use `import type` syntax (`tsconfig.json`).
- **Node.js ≥ 20.0.0:** Runtime requirement. ES2022 target, NodeNext module resolution.
- **Peer dependency:** `@opencode-ai/plugin` ≥ 1.14.28.

## Anti-Patterns

### State Accumulation in Singleton Maps

**What happens:** `TaskStateManager` stores session stats, root budgets, and delegation meta in Maps that accumulate indefinitely — no automatic eviction for completed/terminal sessions.
**Why it's wrong:** Memory leak potential in long-running sessions with many delegations. Completed session data remains in memory.
**Do this instead:** Prune terminal sessions after configurable TTL; leverage `TASK_CLEANUP_DELAY_MS` already defined in `types.ts`.

### Module-Level Singleton Cache

**What happens:** `continuity.ts` `let storeCache: ContinuityStoreFile | undefined` — file-level mutable state prevents isolated unit testing of continuity functions.
**Why it's wrong:** Tests can't mock or reset the cache without modules reloading; parallel tests may observe each other's cache.
**Do this instead:** Encapsulate cache inside a class instance; inject via constructor or factory.

### DelegationManager at Size Threshold

**What happens:** `delegation-manager.ts` at 500 LOC mixes orchestration, concurrency management, status transitions, recovery, persistence, PTY coordination, category gate resolution, and agent validation.
**Why it's wrong:** Sits at the module size cap; single change risk surface; hard to test individual concerns.
**Do this instead:** PTY-specific delegation already extracted to `command-delegation.ts` and `sdk-delegation.ts`. Agent validation partially moved to spawner. Recovery could be extracted to dedicated module.

### `asString` Duplication

**What happens:** `asString` utility function duplicated in both `helpers.ts` and `continuity.ts`.
**Why it's wrong:** Divergent implementations risk; maintenance burden.
**Do this instead:** Consolidate to `helpers.ts`; re-import in `continuity.ts`.

## Error Handling

**Strategy:** All thrown errors use `[Harness]` prefix for flow control identification. Errors propagate through Promise chains and are caught at the outermost tool `execute()` layer, where they're wrapped in `ToolResponse` error envelopes.

**Patterns:**
- **Validate-early:** `assertValidSessionID()` in `session-api.ts` throws before any SDK call
- **Graceful degradation:** `bun-pty` lazy-loaded with fallback; `createPtyManagerIfSupported()` returns undefined if unavailable; `hivemindConfig` load failure falls back to defaults
- **Best-effort audit:** Event tracker writes use try/catch — never block canonical OpenCode event handling
- **Quarantine on corruption:** `continuity.ts` `quarantineCorruptFile()` renames corrupt JSON files for audit visibility
- **Idempotent operations:** `SpawnReservation.release()` and `.rollback()` are idempotent (settled flag)
- **Timeout with fallback:** `sendPrompt()` has fallback polling if SDK returns empty response
- **Recovery runs async:** `delegationManager.recoverPending()` is `void`-invoked — must not block plugin init

## Cross-Cutting Concerns

**Logging:** No structured logging framework. Errors thrown with `[Harness]` prefix. Event tracker writes markdown artifacts to `.hivemind/event-tracker/`. Session journal provides append-only event timeline. Config workflow persists turn state as JSON.

**Validation:** Zod v4 schemas in `schema-kernel/` for agent/command/skill frontmatter, permissions, MCP servers. `validateWithFallback()` performs strict-first then lenient validation, stripping unknown keys with warnings.

**Authentication:** Not applicable — this is a plugin within OpenCode's process. No external auth beyond OpenCode's own session management.

**Persistence (four surfaces):**
1. `continuity.ts` → session continuity as JSON (`session-continuity.json`) — `.hivemind/state/`
2. `delegation-persistence.ts` → delegation records as JSON (`delegations.json`) — `.hivemind/state/`
3. `config-workflow/` → turn-based workflow state as JSON (`config-workflows.json`) — `.hivemind/state/`
4. `session-journal.ts` → append-only event timeline — `.hivemind/journal/`

**Migration (Q6):** Legacy state at `.opencode/state/opencode-harness/` supported via compatibility bridge during one-way migration. No dual-write.

**Plugin load order:**
1. OpenCode discovers `.opencode/plugins/prompt-enhance.ts` (thin re-export of `dist/plugin.js`)
2. `HarnessControlPlane` async factory runs: (a) load runtime policy, (b) load hivemind configs, (c) create PTY manager, (d) instantiate DelegationManager, (e) async-recover pending delegations, (f) instantiate lifecycle manager, (g) wire completion detector, (h) create hooks + register tools → return plugin object

---

*Architecture analysis: 2026-05-07; CP-PTY runway note added 2026-05-08*
