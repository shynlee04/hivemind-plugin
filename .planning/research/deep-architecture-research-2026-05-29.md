# Deep Architecture Research: OpenCode + Hivemind

**Date:** 2026-05-29
**Researcher:** gsd-advisor-researcher
**Scope:** OpenCode SDK hooks, tool registration, delegation architecture, session lifecycle, routing, agent hierarchy, trajectory/contract module analysis

---

## 1. OpenCode SDK Hooks and Events

### Available Hooks (from `@opencode-ai/plugin` SDK v1.14.44)

The OpenCode plugin system exposes these hook points via the `Hooks` interface returned by a `Plugin` function:

| Hook | Input | Output | Purpose |
|------|-------|--------|---------|
| `event` | `{ event: Event }` | void | **PRIMARY EVENT BUS.** Receives ALL OpenCode events: `session.created`, `session.idle`, `session.error`, `session.deleted`, `session.updated`, `message.updated`, `message.part.updated`, etc. This is the main observability surface. |
| `config` | `Config` | void | Modify OpenCode configuration at startup. |
| `chat.message` | `{ sessionID, agent?, model?, messageID?, variant? }` | `{ message: UserMessage, parts: Part[] }` | **Message capture.** Called when a new message is received. Both input and output available. Input has sessionID + metadata; output has the actual message content. |
| `chat.params` | `{ sessionID, agent, model, provider, message }` | `{ temperature, topP, topK, maxOutputTokens, options }` | **Modify LLM parameters.** Intercept and adjust model parameters per-message. |
| `chat.headers` | `{ sessionID, agent, model, provider, message }` | `{ headers }` | Modify HTTP headers sent to LLM provider. |
| `permission.ask` | `Permission` | `{ status: "ask"|"deny"|"allow" }` | Intercept tool permission requests. |
| `command.execute.before` | `{ command, sessionID, arguments }` | `{ parts: Part[] }` | Intercept command execution, modify the prompt parts. |
| `tool.execute.before` | `{ tool, sessionID, callID }` | `{ args: any }` | **Tool guard.** Called before ANY tool execution. Can inspect/modify args. Used by Hivemind for circuit breaker, budget guard, and session-tracker child discovery. |
| `tool.execute.after` | `{ tool, sessionID, callID, args }` | `{ title, output, metadata }` | **Tool result capture.** Called after tool execution. Has both input args and output. Used by Hivemind for session-tracker tool capture and delegation signal recording. |
| `shell.env` | `{ cwd, sessionID?, callID? }` | `{ env }` | Modify environment variables for shell commands. |
| `experimental.chat.messages.transform` | `{}` | `{ messages: { info, parts }[] }` | **Transform ALL messages** before sending to LLM. Can inject, modify, or remove messages. |
| `experimental.chat.system.transform` | `{ sessionID?, model }` | `{ system: string[] }` | **Transform system prompt.** Inject or modify the system prompt. Used by Hivemind for behavioral profile injection. |
| `experimental.session.compacting` | `{ sessionID }` | `{ context: string[], prompt? }` | Customize compaction prompt. |
| `experimental.compaction.autocontinue` | `{ sessionID, agent, model, provider, message, overflow }` | `{ enabled }` | Control auto-continue after compaction. |
| `experimental.text.complete` | `{ sessionID, messageID, partID }` | `{ text }` | Modify text completion output. |
| `tool.definition` | `{ toolID }` | `{ description, parameters }` | Modify tool definitions sent to LLM. |

### Key Observations

1. **The `event` hook is the primary observability bus.** It receives ALL OpenCode runtime events. Hivemind uses it for session lifecycle tracking, delegation event routing, and session-tracker consumer wiring.

2. **`chat.message` provides both input AND output.** The input has session metadata (sessionID, agent, model); the output has the actual message and parts. This is where Hivemind captures message content for delegation monitoring and session tracking.

3. **`tool.execute.before` and `tool.execute.after` are the tool lifecycle hooks.** They receive the tool name, sessionID, callID, and args. The `after` hook also receives output with title, output text, and metadata. These are critical for:
   - Circuit breaker enforcement
   - Budget tracking
   - Session-tracker tool capture
   - Delegation signal recording (child message/tool signals)

4. **`experimental.chat.system.transform` is the system prompt injection point.** Hivemind uses this to inject behavioral profiles, language instructions, and runtime context into the system prompt.

5. **`experimental.chat.messages.transform` is the message transformation point.** Can modify the entire message array before it reaches the LLM. Used for command routing, context injection, and message transforms.

### Hook Registration Pattern

```typescript
export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  // ... setup code ...
  return {
    config: async () => {},
    event: async ({ event }) => { /* event observer pipeline */ },
    "chat.message": async (input, output) => { /* message capture */ },
    "chat.params": async (input, output) => { /* param modification */ },
    "experimental.chat.system.transform": async (input, output) => { /* system prompt injection */ },
    "experimental.chat.messages.transform": async (input, output) => { /* message transform */ },
    "tool.execute.before": async (input, output) => { /* tool guard */ },
    "tool.execute.after": async (input, output) => { /* tool capture */ },
    tool: { /* custom tool definitions */ },
  }
}
```

---

## 2. Tool Registration and Lifecycle

### Tool Registration

Tools are registered via the `tool` property of the Hooks return object. Each tool is created using the `tool()` factory from `@opencode-ai/plugin/tool`:

```typescript
import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

const myTool = tool({
  description: "Tool description",
  args: {
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional(),
  },
  async execute(args, context: ToolContext): Promise<ToolResult> {
    // context.sessionID — current session
    // context.directory — project directory
    // context.worktree — worktree root
    // context.abort — AbortSignal
    // context.metadata({ title, metadata }) — set output metadata
    return "result string"
  },
})
```

### ToolContext

Every tool receives a `ToolContext` with:
- `sessionID: string` — Current session ID
- `messageID: string` — Current message ID
- `agent: string` — Current agent name
- `directory: string` — Project directory
- `worktree: string` — Worktree root
- `abort: AbortSignal` — Abort signal for cancellation
- `metadata(input)` — Set output metadata (title, custom fields)
- `ask(input)` — Request permission from user

### ToolResult

Tools return either:
- A plain `string`
- An object `{ title?, output, metadata?, attachments? }`

### Hivemind Tool Registration (23 tools)

Hivemind registers 23 custom tools across 4 domains:

**Delegation Tools (3):**
- `delegate-task` — SDK child-session dispatch with stacking support
- `delegation-status` — Status polling, find-stackable, retry guidance
- `run-background-command` — PTY/headless background command execution

**Session Tools (7):**
- `execute-slash-command` — Execute OpenCode slash commands
- `session-patch` — Patch session metadata
- `session-journal-export` — Export session journal
- `session-tracker` — Session knowledge capture and search
- `session-hierarchy` — Session hierarchy inspection
- `session-context` — Session context management
- `create-governance-session` — Create governance sessions

**Hivemind Tools (8):**
- `hivemind-doc` — Document management
- `hivemind-trajectory` — Trajectory ledger operations
- `hivemind-pressure` — Runtime pressure detection
- `hivemind-sdk-supervisor` — SDK supervision
- `hivemind-command-engine` — Command routing engine
- `hivemind-session-view` — Session view
- `hivemind-agent-work-create` — Create agent work contracts
- `hivemind-agent-work-export` — Export agent work contracts

**Config Tools (6):**
- `configure-primitive` — Configure agents/skills/commands
- `validate-restart` — Validate and restart
- `bootstrap-init` — Bootstrap initialization
- `bootstrap-recover` — Bootstrap recovery
- `prompt-skim` — Prompt skimming
- `prompt-analyze` — Prompt analysis

---

## 3. Delegation Architecture

### Two Delegation Mechanisms

#### 1. Native `task` Tool (OpenCode Built-in)

The native `task` tool is OpenCode's built-in subagent dispatch mechanism. It:
- Creates a child session with a specified `subagent_type`
- Sends a prompt to the child session
- Returns immediately (async/background)
- Supports `task_id` for resuming existing sessions
- Is the **preferred** delegation mechanism per AGENTS.md

**Usage:**
```
task(description="Investigate bug", subagent_type="hm-l2-debugger", prompt="...")
task(description="Resume work", subagent_type="hm-l2-executor", task_id="ses_abc123")
```

#### 2. Custom `delegate-task` Tool (Hivemind)

The custom `delegate-task` tool is Hivemind's delegation wrapper. It:
- Uses the `DelegationManager` → `DelegationCoordinator` pipeline
- Creates SDK child sessions via `childSessionStarter`
- Supports session stacking via `stackOnSessionId`
- Tracks delegation lifecycle (dispatched → running → completed/error/timeout)
- Provides dual-signal completion detection
- Routes notifications back to parent session

**Key Difference:** The native `task` tool is a black box to the harness — Hivemind can only observe it via hooks. The custom `delegate-task` tool gives Hivemind full control over the delegation lifecycle, but adds complexity and is considered "not production-ready" per the L0 orchestrator agent definition.

### Delegation Data Flow

```
User Prompt → L0 Orchestrator
    ↓
    ├─ Fast-path → Native `task` tool → L2/L3 Specialist
    │   ↓
    │   Hook: tool.execute.before → session-tracker detects task dispatch
    │   Hook: chat.message → delegation monitor captures child output
    │   Hook: tool.execute.after → session-tracker captures tool metadata
    │   Hook: event → session.idle/error/deleted → completion detection
    │
    └─ Coordinated-path → L1 Coordinator → Wave dispatch
        ↓
        L1 uses native `task` tool for each wave step
        ↓
        Same hook observation chain as fast-path
```

### Delegation Lifecycle States

From `src/coordination/delegation/types.ts`:

```
dispatched → running → completed
                    → error
                    → timeout
```

From `src/shared/types.ts` (HarnessStatus — superset):

```
pending → queued → dispatching → running → completed
                                      → error
                                      → failed
                                      → cancelled
                                      → interrupt
```

### Session-Tracker's Role in Delegation Observation

The `SessionTracker` observes delegations through hooks:

1. **`tool.execute.before`**: Detects when `task` tool is about to dispatch. Registers pending child session entry and starts fire-and-forget polling for the child session ID.

2. **`tool.execute.after`**: Captures tool metadata for both parent and child sessions. For `task` and `delegate-task` calls, records delegation metadata.

3. **`chat.message`**: Captures message content for both parent and child sessions. Routes to child recorder for delegated sessions.

4. **`event`**: Receives `session.created`, `session.idle`, `session.error`, `session.deleted` events. Routes to delegation manager for completion detection.

### Critical Insight: Hooks Are the Only Observation Point

**The harness cannot programmatically control agent behavior.** It can only:
1. **Observe** what agents do (via hooks)
2. **Inject** context into the system prompt (via `experimental.chat.system.transform`)
3. **Transform** messages before they reach the LLM (via `experimental.chat.messages.transform`)
4. **Guard** tool execution (via `tool.execute.before`)
5. **Capture** tool results (via `tool.execute.after`)

This means **trajectory and agent-work-contracts must be opt-in tools that agents choose to call**, not enforced by the harness. The harness can:
- Make the tools available
- Inject instructions into the system prompt telling agents to use them
- Guard against misuse (e.g., prevent writes when pressure is high)
- Capture when agents do/don't call them

---

## 4. Session and Lifecycle Management

### Session Lifecycle Phases

From `src/shared/types.ts`:

```typescript
type SessionLifecyclePhase =
  | "created"      // Session just created
  | "queued"       // Waiting for concurrency slot
  | "dispatching"  // Being dispatched to agent
  | "running"      // Agent actively processing
  | "completed"    // Successfully completed
  | "failed"       // Failed (terminal)
```

### Valid Transitions

From `src/task-management/lifecycle/index.ts`:

```
created     → queued, dispatching, running, failed
queued      → dispatching, running, failed
dispatching → running, completed, failed
running     → completed, failed
completed   → (terminal)
failed      → (terminal)
```

### HarnessLifecycleManager

The `HarnessLifecycleManager` (`src/task-management/lifecycle/index.ts`):
- Tracks session lifecycle state via `SessionContinuityRecord`
- Owns the `CompletionDetector` for dual-signal completion
- Feeds session events (idle, error, deleted) into the detector
- Manages concurrency limits
- Replays pending notifications on session events
- Provides `noteObservedActivity()` for activity tracking

### Continuity Store

The continuity store (`src/task-management/continuity/index.ts`):
- Persists to `.hivemind/state/session-continuity.json`
- Stores `SessionContinuityRecord` per session with:
  - `sessionID`, `promptParams`, `toolProfile`
  - `metadata`: status, description, delegation, lifecycle, pendingNotifications, resultCapture, compactionCheckpoint, delegationPacket, route, lastToolActivityAt, updatedAt
- Supports atomic writes (temp file + rename)
- Deep-clone-on-read for mutation safety

### Session Tracker

The `SessionTracker` (`src/features/session-tracker/`):
- Owns session knowledge capture under `.hivemind/session-tracker/`
- Creates per-session directories with:
  - `{sessionID}.md` — Main session knowledge file
  - `{childSessionID}.json` — Child session records
  - `session-continuity.json` — Session-local hierarchy index
  - `hierarchy-manifest.json` — Flattened child list
- Project-level index at `.hivemind/session-tracker/project-continuity.json`
- Classifies sessions as `main`, `child`, or `unknownSub`
- Routes message/tool capture to appropriate handlers
- Supports recovery from disk on restart

---

## 5. Routing and Command Engine

### Command Engine

The command engine (`src/routing/command-engine/index.ts`):
- Discovers command bundles from `.opencode/commands/`
- Analyzes command contracts (name, description, agent, arguments)
- Renders bounded context payloads
- Transforms command messages
- Previews command routing without execution
- Detects runtime pressure for context limiting

### Command Discovery

Commands are discovered via `loadPrimitives()` which reads `.opencode/commands/` and global config. Each command has:
- `name` — Command name (e.g., "plan", "start-work")
- `description` — Human-readable description
- `agent` — Target agent override
- `model` — Model override
- `subtask` — Whether to create a subtask
- `body` — Command body with `$ARGUMENTS` placeholder
- `namespace` — Command namespace
- `requires` — Dependencies
- `tools` — Tool restrictions

### Behavioral Profile Resolution

The behavioral profile system (`src/routing/behavioral-profile/`):
- Resolves per-session behavioral profiles
- Controls language, temperature, tool restrictions
- Lazy-computed and cached for session lifetime
- Injected into system prompt via `experimental.chat.system.transform`

---

## 6. Agent Hierarchy

### Agent Count

From `.opencode/agents/` directory listing: **76 agent files** total.

### Lineage Classification

| Lineage | Prefix | Count | Purpose |
|---------|--------|-------|---------|
| **hm-** | `hm-*` | ~31 | Hivemind product development agents |
| **hf-** | `hf-*` | ~11 | Meta-builder agents (agent/skill/command creation) |
| **gsd-** | `gsd-*` | ~33 | Internal developer tooling (NOT shipped) |

### Hierarchy Levels

| Level | Agents | Role |
|-------|--------|------|
| **L0** | `hm-l0-orchestrator`, `hf-l0-orchestrator` | Front-facing strategist, never executes |
| **L1** | `hm-l1-coordinator`, `hf-l1-coordinator` | Wave coordinator, multi-specialist dispatch |
| **L2** | `hm-l2-*`, `hf-l2-*` | Domain specialists (research, execute, review, etc.) |
| **L3** | `hm-l3-*`, `gate-l3-*`, `stack-l3-*` | Deep specialists, quality gates, stack references |

### Agent Definition Structure

Each agent is a `.md` file with YAML frontmatter:

```yaml
---
name: hm-l0-orchestrator
description: "Front-facing high-reasoning L0 strategist..."
mode: primary
temperature: 0.3
steps: 100
color: "#3B82F6"
permission:
  read: deny
  edit: deny
  write: deny
  bash: { "*"*": ask, "git *": allow }
  glob: allow
  grep: allow
  task:
    "*": ask
    hm-l1-*: allow
    hm-l2-*: allow
  skill:
    "*": ask
    hm-l2-*: allow
    gate-l3-*: allow
reasoningEffort: high
depth: L0
lineage: hm
domain: Multi-Domain Orchestration
delegation_routing:
  fast_path: { ... }
  coordinated_path: { ... }
  cross_lineage_path: { ... }
skills:
  - hm-l2-lineage-router
  - hm-l2-skill-router
instruction:
  - .opencode/rules/universal-rules.md
  - AGENTS.md
---
```

### Key Agent Properties

- **`permission`**: Fine-grained tool access control per agent. Controls which tools the agent can call (allow/deny/ask).
- **`depth`**: L0/L1/L2/L3 hierarchy level
- **`lineage`**: hm/hf/gate/stack/gsd lineage binding
- **`skills`**: Which skills the agent can load
- **`delegation_routing`**: Path decision criteria (fast-path vs coordinated-path vs cross-lineage)
- **`instruction`**: Additional instruction files to load

### How Agents Discover Each Other

Agents discover each other through:
1. **Agent pool definitions** in L0/L1 agent definitions (hardcoded routing tables)
2. **Skill routing** via `hm-l2-lineage-router` and `hm-l2-skill-router` skills
3. **Command routing** via the command engine
4. **Runtime context** via session-tracker, trajectory, and pressure tools

---

## 7. External Patterns (OMO, opencode-pty, background-agents)

### OMO (oh-my-openagent)

Key patterns from the reference skill:
- **Plugin system**: Tools registered via `tool()` factory, hooks via Plugin return object
- **Hook system**: `PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd` — similar to OpenCode's `tool.execute.before`, `tool.execute.after`, `event`
- **Agent definitions**: YAML frontmatter with permissions, tools, temperature
- **Background task manager**: Async task execution with status tracking
- **Circuit breaker**: Prevents runaway tool calls
- **Concurrency manager**: Limits parallel delegations

### Key Takeaways

1. **The hook model is observation-first.** Both OMO and OpenCode follow the same pattern: hooks observe runtime events, they don't control them.
2. **Tools are the action surface.** Agents call tools to do work. The harness can guard tools but can't force agents to call specific tools.
3. **System prompt injection is the primary influence mechanism.** The harness injects instructions, context, and behavioral profiles into the system prompt to guide agent behavior.

---

## 8. Current Trajectory/Contract Problems

### Trajectory Module (`src/task-management/trajectory/`)

**Current Design:**
- Stores a ledger at `.hivemind/state/trajectory-ledger.json`
- Each trajectory has: id, rootSessionId, sessionId, parentTrajectoryId, status, evidenceRefs, checkpoints, events
- Operations: inspect, traverse, attach, checkpoint, event, close
- All operations are **tool-initiated** — agents must call `hivemind-trajectory` tool explicitly

**Problems:**
1. **No automatic capture.** Trajectory only updates when an agent explicitly calls the tool. If an agent doesn't call it, trajectory is stale.
2. **No hook integration.** Trajectory doesn't observe any OpenCode hooks. It's a pure file-based store.
3. **No delegation integration.** Delegation lifecycle events don't automatically update trajectory.
4. **No session-tracker integration.** Session-tracker captures rich data but trajectory doesn't consume it.
5. **Agents must know to call it.** The tool exists but agents may not use it, leading to incomplete trajectory data.

### Agent Work Contracts Module (`src/features/agent-work-contracts/`)

**Current Design:**
- Stores contracts at `.hivemind/state/agent-work-contracts.json`
- Each contract has: id, status, owner, scope, evidence, compaction
- Lifecycle: created → running → blocked/completed/cancelled
- Operations: create, export, start, block, complete, cancel
- Pressure-aware writes (blocks when runtime pressure is high)

**Problems:**
1. **Same opt-in problem.** Agents must call `hivemind-agent-work-create` to create contracts.
2. **No automatic lifecycle tracking.** Contract status doesn't update when delegation status changes.
3. **No hook integration.** Contract lifecycle is disconnected from OpenCode session lifecycle.
4. **No delegation integration.** When a delegation completes/fails, the associated contract isn't updated.
5. **Compaction payload is agent-provided.** The agent must provide briefing, summary, anchors — but agents may not know what's needed.

### Core Problem: Both Modules Are Opt-In Tools

The fundamental issue is that both trajectory and agent-work-contracts are **tools that agents must voluntarily call**. The harness has no mechanism to force agents to use them. This means:

1. **Data completeness depends on agent compliance.** If an agent doesn't call the tools, the data is missing.
2. **Lifecycle events are disconnected.** When a delegation completes via hooks, the trajectory/contract modules don't know about it.
3. **No automatic state propagation.** OpenCode lifecycle events (session.idle, session.error) don't propagate to trajectory/contract state.

---

## 9. Design Implications for Redesign

### Constraint: Hook-Only Observation

The redesign must work within OpenCode's hook model:
- **Observe** via `event`, `chat.message`, `tool.execute.before/after`
- **Inject** via `experimental.chat.system.transform`
- **Guard** via `tool.execute.before`
- **Capture** via `tool.execute.after`

### Architecture Requirements

1. **Hook-Driven State Updates.** Trajectory and contract state must update automatically when OpenCode events fire, not just when agents call tools.

2. **Delegation Lifecycle Integration.** When `DelegationCoordinator` transitions a delegation (dispatched → running → completed/error), the trajectory and contract modules must be notified.

3. **Session-Tracker as Data Source.** The session-tracker already captures rich session data. Trajectory should consume session-tracker data rather than maintaining a separate store.

4. **System Prompt Injection.** Inject trajectory/contract instructions into the system prompt so agents know these tools exist and when to use them.

5. **Graceful Degradation.** If agents don't call the tools, the harness should still capture basic lifecycle data via hooks. The tools provide richer data when used.

### Redesign Direction

| Component | Current | Redesign |
|-----------|---------|----------|
| **Trajectory** | Pure file store, tool-initiated only | Hook-driven lifecycle tracking + tool for rich data |
| **Agent Work Contracts** | Pure file store, tool-initiated only | Hook-driven status tracking + tool for scope/evidence |
| **Delegation Integration** | None | DelegationManager notifies trajectory/contract on state changes |
| **Session-Tracker Integration** | None | Trajectory consumes session-tracker data |
| **System Prompt** | No trajectory/contract guidance | Inject instructions for when/how to use tools |
| **Hook Wiring** | None | `event` and `tool.execute.after` drive automatic updates |

### Data Flow (Proposed)

```
OpenCode Runtime Events
    ↓
event hook → SessionTracker → Trajectory (automatic lifecycle)
    ↓
tool.execute.after hook → SessionTracker → Contract (automatic status)
    ↓
DelegationManager state change → Trajectory checkpoint + Contract update
    ↓
Agent calls hivemind-trajectory/hivemind-agent-work → Rich data attachment
    ↓
system.transform hook → Inject trajectory/contract context into prompt
```

### Key Design Decisions Needed

1. **Should trajectory be a separate store or merge with session-tracker?**
   - Session-tracker already captures session hierarchy, tool calls, messages
   - Trajectory adds: checkpoints, events, evidence references, parent-child lineage
   - Option A: Merge trajectory into session-tracker (single source of truth)
   - Option B: Keep separate but auto-sync from session-tracker hooks
   - Recommendation: Keep separate but auto-sync — trajectory has different query patterns (by root session, by evidence)

2. **Should contracts auto-create on delegation dispatch?**
   - Currently contracts are agent-created with explicit scope/evidence
   - Option A: Auto-create skeleton contract on delegation, agent enriches later
   - Option B: Keep agent-only creation, hook-driven status updates only
   - Recommendation: Auto-create skeleton with delegation metadata, agent enriches scope/evidence via tool

3. **How to handle agents that don't call the tools?**
   - Option A: Inject strong instructions in system prompt
   - Option B: Accept incomplete data, fill gaps from hooks
   - Option C: Both — inject instructions AND accept graceful degradation
   - Recommendation: Option C — the system prompt should strongly encourage tool use, but the harness must produce useful data even without it

4. **How to propagate delegation completion to trajectory/contracts?**
   - Option A: DelegationManager calls trajectory/contract directly
   - Option B: DelegationManager emits events, trajectory/contract subscribe
   - Option C: Hook pipeline captures delegation events and routes to trajectory/contract
   - Recommendation: Option A (direct call) — simplest, most reliable, already has the dependency chain

---

## Summary

### What We Now Know

1. **OpenCode exposes 15+ hooks** covering events, messages, tools, system prompt, messages transform, permissions, and more.

2. **Tools are registered via `tool()` factory** with Zod schemas, typed execute functions, and ToolContext providing session/directory/abort metadata.

3. **The `event` hook is the primary observability bus** — receives ALL runtime events including session lifecycle, message updates, and tool execution.

4. **Delegation has two paths**: native `task` tool (preferred, black-box) and custom `delegate-task` (full control, not production-ready).

5. **Session-tracker already captures rich data** from hooks — session hierarchy, tool calls, messages, delegation metadata.

6. **Trajectory and contracts are currently opt-in tools** with no hook integration, leading to incomplete data.

7. **The harness can only observe and inject, not control** — trajectory/contract adoption depends on system prompt guidance and graceful degradation.

### What the Redesign Must Account For

1. Hook-driven automatic state updates (not just tool-initiated)
2. Delegation lifecycle integration (DelegationManager → trajectory/contract)
3. Session-tracker as primary data source (consume, don't duplicate)
4. System prompt injection for agent guidance
5. Graceful degradation when agents don't call tools
6. Separate stores with auto-sync (trajectory has different query patterns than session-tracker)
