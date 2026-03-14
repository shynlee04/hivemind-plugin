# OpenCode-Native Architectural Synthesis for HiveMind

> **Purpose**: Comprehensive analysis of OpenCode's execution model, chaining patterns, plugin architecture, and value-add opportunities for HiveMind Context Governance.

---

## 1. OpenCode Execution Model Summary

### 1.1 Unique Architectural Patterns

OpenCode differs fundamentally from typical interactive AI frameworks through several key architectural decisions:

#### TUI + Server Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Instance                         │
├─────────────────────────────────────────────────────────────┤
│  TUI Client (Ink-based)  ←→  HTTP Server (OpenAPI 3.1)      │
│         ↓                           ↓                        │
│  Session Management    ←→   Event Bus (SSE)                 │
│         ↓                           ↓                        │
│  Agent Runtime         ←→   Tool Execution Engine           │
└─────────────────────────────────────────────────────────────┘
```

**Key Implications**:
- Server can run headlessly (`opencode serve`) for programmatic access
- TUI can attach to remote servers (`opencode attach`)
- Multiple clients can connect to same server instance
- OpenAPI spec enables SDK generation in any language

#### Non-Interactive Shell Environment
OpenCode's shell is **strictly non-interactive** (no TTY/PTY):
- Any command that waits for user input will hang indefinitely
- Must use explicit non-interactive flags (`-y`, `--yes`, `--no-edit`)
- Ban on editors (`vim`, `nano`), pagers (`less`, `more`), and REPLs
- Process continuity mandate: "Never stop after a tool execution unless task is complete"

**Constraint for HiveMind**: Must enforce non-interactive discipline at all execution boundaries.

#### Agent Hierarchy Model

| Agent Type | Examples | Characteristics |
|------------|----------|-----------------|
| **Primary** | Build, Plan, Compaction* | User-facing, Tab-cyclable, Full tool access |
| **Subagent** | General, Explore | Invoked via `@mention` or Task tool, Isolated contexts |
| **Hidden System** | Compaction*, Title, Summary | Auto-triggered, Not user-selectable |

*Compaction is hidden but primary-mode.

**Subagent Navigation**:
- `session_child_first` (Leader+Down): Enter first child session
- `session_child_cycle` (Right): Next sibling
- `session_parent` (Up): Return to parent

### 1.2 Session Hierarchy

```
Parent Session (Primary Agent)
├── Child Session A (Subagent @general)
│   ├── Grandchild A1 (Nested subagent)
│   └── Grandchild A2
├── Child Session B (Subagent @explore)
└── Child Session C (Command-triggered subtask)
```

**Key Properties**:
- Hierarchical isolation: Each child has independent context
- Shared state via parent session
- Fork capability: Branch from any message point
- Diff tracking: Per-session file modifications

### 1.3 Configuration Layering

```
Precedence Order (later overrides earlier):
1. Remote config (.well-known/opencode)     ← Organizational defaults
2. Global config (~/.config/opencode/)      ← User preferences
3. Custom config (OPENCODE_CONFIG)          ← Environment override
4. Project config (opencode.json)           ← Project-specific
5. .opencode directories                    ← Agents, commands, plugins
6. Inline config (OPENCODE_CONFIG_CONTENT)  ← Runtime injection
```

**Merge Semantics**: Configuration files are **merged together, not replaced**. Non-conflicting settings from all sources are preserved.

---

## 2. Leverage Opportunities for HiveMind

### 2.1 Chaining Patterns

#### Task Tool Invocation
Primary agents invoke subagents via the Task tool with permission-based access control:

```json
{
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "permission": {
        "task": {
          "*": "deny",
          "orchestrator-*": "allow",
          "code-reviewer": "ask"
        }
      }
    }
  }
}
```

**HiveMind Opportunity**: Implement task delegation router that:
1. Classifies task complexity/duration
2. Routes to appropriate subagent (explore for research, general for execution)
3. Collects results and synthesizes into parent context

#### Command-Triggered Subtasks
Commands can force subagent invocation:

```yaml
---
description: Analyze component architecture
subtask: true
agent: plan
---
```

**HiveMind Opportunity**: Define `/hivefiver` command family that:
- `/hivefiver research` → Spawns explore subagent for synthesis
- `/hivefiver spec` → Spawns plan subagent for PRD generation
- `/hivefiver audit` → Spawns subagent for governance checks

#### Session Branching
```bash
POST /session/:id/fork
Body: { messageID?: string }
```

**HiveMind Opportunity**: Use session forking to:
1. Create parallel exploratory branches
2. Test alternative approaches without polluting main context
3. Implement "undo/redo" at scale via branch switching

### 2.2 Plugin Architecture

#### Plugin Hook System

| Hook Category | Events | Timing |
|---------------|--------|--------|
| **Tool** | `tool.execute.before`, `tool.execute.after` | Pre/post tool invocation |
| **Session** | `session.created`, `session.compacted`, `session.idle` | Lifecycle events |
| **File** | `file.edited`, `file.watcher.updated` | File system changes |
| **TUI** | `tui.toast.show`, `tui.command.execute` | UI interactions |
| **Permission** | `permission.asked`, `permission.replied` | Approval flows |
| **Shell** | `shell.env` | Environment injection |
| **Compaction** | `experimental.session.compacting` | Context summarization |

**HiveMind Integration Points**:

1. **`tool.execute.before`**: Intercept tool calls for governance checks
   ```typescript
   "tool.execute.before": async (input, output) => {
     if (input.tool === "bash") {
       // HiveMind governance: Check against allowed commands
       if (!isCommandAllowed(output.args.command)) {
         throw new Error("Command denied by governance policy")
       }
     }
   }
   ```

2. **`session.compacting`**: Inject HiveMind context into compaction
   ```typescript
   "experimental.session.compacting": async (input, output) => {
     output.context.push(`
     ## HiveMind Governance State
     - Active checkpoints: ${getActiveCheckpoints()}
     - Uncommitted artifacts: ${getUncommittedArtifacts()}
     - Gate status: ${getGateStatus()}
     `)
   }
   ```

3. **`file.edited`**: Track file modifications for governance
   ```typescript
   "file.edited": async ({ event }) => {
     await hiveMind.trackEdit(event.path, event.content)
   }
   ```

#### Plugin Dependencies
Local plugins can use npm packages via `package.json` in config directory:

```json
{
  "dependencies": {
    "shescape": "^2.1.0",
    "@hivemind/governance-core": "^1.0.0"
  }
}
```

### 2.3 Skills System

#### Skill Discovery Locations
```
.opencode/skills/<name>/SKILL.md        ← Project skills
~/.config/opencode/skills/<name>/SKILL.md  ← Global skills
.claude/skills/<name>/SKILL.md          ← Claude Code compatible
.agents/skills/<name>/SKILL.md          ← Agent-agnostic
```

#### Skill Frontmatter Schema
```yaml
---
name: hivemind-governance        # Required: 1-64 chars, kebab-case
description: HiveMind governance checkpoints  # Required: 1-1024 chars
license: MIT                     # Optional
compatibility: opencode          # Optional
metadata:                        # Optional: string-to-string map
  audience: agents
  workflow: governance
---
```

**HiveMind Opportunity**: Define skill catalogue:
- `hivemind-session-lifecycle` — Session declare/update/close discipline
- `hivemind-decision-records` — ADR generation and tracking
- `hivemind-verification` — Pre-commit verification protocols
- `hivemind-anticipatory-state` — Predictive state management

### 2.4 Custom Tools

#### Tool Definition Pattern
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Verify HiveMind governance checkpoint",
  args: {
    checkpoint: tool.schema.string().describe("Checkpoint ID to verify"),
    evidence: tool.schema.string().optional().describe("Evidence to validate"),
  },
  async execute(args, context) {
    const { directory, worktree, sessionID } = context
    // Governance verification logic
    return { verified: true, evidence: args.evidence }
  },
})
```

**Context Available**:
- `agent`: Current agent name
- `sessionID`: Active session ID
- `messageID`: Current message ID
- `directory`: Session working directory
- `worktree`: Git worktree root

**HiveMind Opportunity**: Create governance tools:
- `hivemind_checkpoint` — Register/verify checkpoints
- `hivemind_gate` — Run quality gates
- `hivemind_export` — Session handoff generation
- `hivemind_anchor` — Immutable memory operations

---

## 3. Deterministic Support Patterns

### 3.1 Zod-Based Tool Schemas

OpenCode uses Zod for tool argument validation:

```typescript
args: {
  query: tool.schema.string().describe("Search query"),
  maxResults: tool.schema.number().min(1).max(100).default(20),
  filters: tool.schema.record(tool.schema.string()).optional(),
}
```

**HiveMind Application**: Define all governance operations with Zod schemas for:
- Type-safe plugin interfaces
- Automatic validation
- LLM-friendly descriptions

### 3.2 Structured Output

Request JSON-validated responses from models:

```typescript
const result = await client.session.prompt({
  path: { id: sessionId },
  body: {
    parts: [{ type: "text", text: "Analyze the architecture" }],
    format: {
      type: "json_schema",
      schema: {
        type: "object",
        properties: {
          components: { type: "array", items: { type: "string" } },
          dependencies: { type: "object" },
          risks: { type: "array" },
        },
        required: ["components"],
      },
    },
  },
})
```

**HiveMind Application**: All governance outputs should use structured schemas:
- Checkpoint reports
- Gate verdicts
- Session handoffs
- Decision records

### 3.3 Non-Interactive Shell Discipline

**Canonical Environment Variables**:
```bash
CI=true
DEBIAN_FRONTEND=noninteractive
GIT_TERMINAL_PROMPT=0
GIT_PAGER=cat
PAGER=cat
npm_config_yes=true
```

**Pattern Reference Table**:

| Tool | Interactive (BAD) | Non-Interactive (GOOD) |
|------|-------------------|------------------------|
| npm | `npm init` | `npm init -y` |
| git | `git commit` | `git commit -m "msg"` |
| git | `git merge branch` | `git merge --no-edit branch` |
| docker | `docker run -it image` | `docker run image` |

**Cognitive Pattern**: Use "Explicit Action Framing":
```
BAD: npm init          ← Model identifies failure pattern
GOOD: npm init -y      ← Model receives executable instruction
```

### 3.4 LSP Integration

Built-in LSP servers for 30+ languages with auto-install:
- Diagnostics fed to LLM for code quality feedback
- Custom LSP servers configurable via `lsp` config
- Experimental features: `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`

---

## 4. Context Engineering Constraints

### 4.1 Context Compaction

**Triggers**: Automatic when context window fills
**Hooks**: `experimental.session.compacting`
**Options**:
```json
{
  "compaction": {
    "auto": true,       // Enable auto-compaction
    "prune": true,      // Remove old tool outputs
    "reserved": 10000   // Token buffer
  }
}
```

**HiveMind Constraint**: Governance state must survive compaction:
- Use `experimental.session.compacting` hook to inject governance summary
- Store critical state in anchors (persistent across compaction)
- Track compaction events for audit trail

### 4.2 Skills Loading Discipline

Skills are loaded **on-demand** via the skill tool:
1. Agent sees available skills in tool description
2. Agent calls `skill({ name: "skill-name" })` to load content
3. Content injected into conversation context

**Constraint**: Skill descriptions must be specific enough for correct agent selection.

**HiveMind Pattern**: Define skill hierarchy:
```
hivemind-core (always available)
├── hivemind-session
├── hivemind-gates
└── hivemind-exports

hivemind-advanced (context-expensive)
├── hivemind-tdd-workflow
├── hivemind-architecture-review
└── hivemind-deep-research
```

### 4.3 MCP Context Cost

**Warning**: MCP servers add to context proportional to tool count.
**Mitigation**: 
- Enable MCP per-agent (disable globally)
- Use glob patterns for selective enablement
- Consider tool count when selecting MCP servers

```json
{
  "tools": { "my-mcp*": false },
  "agent": {
    "mcp-heavy-agent": {
      "tools": { "my-mcp*": true }
    }
  }
}
```

### 4.4 Permission System

**Action Types**: `"allow"` | `"ask"` | `"deny"`

**Pattern Matching**:
- `*` matches zero or more characters
- `?` matches exactly one character
- Last matching rule wins

**Key Permissions**:
- `read`, `edit`, `glob`, `grep`, `list`
- `bash` (matches parsed commands)
- `task` (subagent invocation)
- `skill` (skill loading)
- `external_directory` (paths outside working directory)
- `doom_loop` (repeated identical calls)

**HiveMind Application**: Define governance-enforcing permissions:
```json
{
  "permission": {
    "edit": {
      "*": "ask",
      ".hivemind/**": "allow",
      "*.env": "deny"
    },
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git commit*": "ask"
    },
    "external_directory": {
      "~/.hivemind/**": "allow"
    }
  }
}
```

---

## 5. Integration Points HiveMind Should Use

### 5.1 Primary Integration Surfaces

| Surface | Mechanism | Purpose |
|---------|-----------|---------|
| **Plugins** | `.opencode/plugins/hivemind.ts` | Hook into all tool execution, session lifecycle |
| **Skills** | `.opencode/skills/hivemind-*/SKILL.md` | Instruction injection for governance workflows |
| **Commands** | `.opencode/commands/hivefiver-*.md` | Slash commands for agent operations |
| **Custom Tools** | `.opencode/tools/hivemind-*.ts` | Governance operations exposed to LLM |
| **Agents** | `.opencode/agents/hivemind-*.md` | Specialized governance agents |

### 5.2 Recommended Plugin Architecture

```typescript
// .opencode/plugins/hivemind.ts
import type { Plugin } from "@opencode-ai/plugin"

export const HiveMindPlugin: Plugin = async ({ client, directory }) => {
  return {
    // Governance checks before tool execution
    "tool.execute.before": async (input, output) => {
      // Check governance policies
    },
    
    // Track state after tool execution
    "tool.execute.after": async (input, output) => {
      // Record governance artifacts
    },
    
    // Survive compaction
    "experimental.session.compacting": async (input, output) => {
      output.context.push(generateGovernanceSummary())
    },
    
    // Handle session lifecycle
    "session.created": async ({ event }) => {
      await initializeGovernanceState(event.sessionID)
    },
    
    "session.idle": async ({ event }) => {
      await checkPendingCheckpoints(event.sessionID)
    },
    
    // Add custom tools
    tool: {
      hivemind_checkpoint: createCheckpointTool(),
      hivemind_gate: createGateTool(),
      hivemind_export: createExportTool(),
    },
  }
}
```

### 5.3 SDK Integration

```typescript
import { createOpencode } from "@opencode-ai/sdk"

const opencode = await createOpencode({
  config: {
    plugin: ["@hivemind/governance-plugin"],
    agent: {
      "hivemind-orchestrator": {
        mode: "primary",
        description: "HiveMind governance orchestrator",
        model: "anthropic/claude-sonnet-4-20250514",
      },
    },
  },
})

// Programmatic governance
const session = await opencode.client.session.create({
  body: { title: "Governance Session" },
})

const result = await opencode.client.session.prompt({
  path: { id: session.id },
  body: {
    parts: [{ type: "text", text: "Run governance check" }],
  },
})
```

### 5.4 Server Events Subscription

```typescript
const events = await client.event.subscribe()
for await (const event of events.stream) {
  switch (event.type) {
    case "session.compacted":
      await handleCompaction(event.properties)
      break
    case "permission.asked":
      await autoApproveIfNeeded(event.properties)
      break
  }
}
```

---

## 6. Value-Add Opportunities

### 6.1 Governance Layer (HiveMind > OpenCode Native)

| Capability | OpenCode Native | HiveMind Value-Add |
|------------|-----------------|-------------------|
| **Session State** | Manual context management | Automatic checkpoint/restore |
| **Decision Tracking** | Conversation history only | Structured ADRs with artifacts |
| **Quality Gates** | Manual verification | Automated pass/fail gates |
| **Cross-Session Memory** | Skills (instruction only) | Anchors + SOT registry |
| **Delegation** | Task tool + subagents | Intelligent router with dependency tracking |
| **Verification** | Manual review | Pre-commit verification protocol |
| **Handoff** | Session share | Structured export with downstream instructions |

### 6.2 Specific Value-Add Features

#### 6.2.1 Checkpoint Governance
**OpenCode Native**: No checkpoint concept
**HiveMind Value-Add**: 
- Named checkpoints with verification
- Automatic rollback to last checkpoint
- Gate enforcement at checkpoint boundaries

#### 6.2.2 Anticipatory State Management
**OpenCode Native**: Reactive context management
**HiveMind Value-Add**:
- Predict resource needs before execution
- Pre-load context (skills, artifacts) proactively
- Compact strategically before hitting limits

#### 6.2.3 Structured Handoffs
**OpenCode Native**: Session sharing (opaque JSON)
**HiveMind Value-Add**:
- Schema-validated export format
- Downstream agent instructions
- Evidence coupling for traceability
- SOT registration for cross-session discovery

#### 6.2.4 Decision Record Automation
**OpenCode Native**: Manual documentation
**HiveMind Value-Add**:
- Auto-capture decisions during execution
- Link decisions to code changes
- Status tracking (proposed/accepted/superseded)
- Searchable decision registry

#### 6.2.5 Parallel Execution Intelligence
**OpenCode Native**: Manual subagent spawning
**HiveMind Value-Add**:
- Dependency graph analysis
- Automatic parallelization of independent tasks
- Result reconciliation and conflict resolution
- Progress tracking across subagents

---

## 7. Constraints to Respect

### 7.1 Non-Negotiable Constraints

1. **Non-Interactive Shell**: All bash operations must use non-interactive flags
2. **Context Budget**: MCP tools and skills count against context window
3. **Permission Model**: Must work within OpenCode's allow/ask/deny framework
4. **Session Isolation**: Child sessions don't automatically share parent context
5. **Compaction Survival**: Critical state must be injected via hooks or anchors
6. **Tool Naming**: Custom tools prefixed with `hivemind_` to avoid collisions

### 7.2 Recommended Constraints

1. **Skill Size**: Keep descriptions <200 chars, content <500 lines
2. **Plugin Performance**: Hooks should complete in <100ms to avoid latency
3. **Gate Complexity**: Max 5 gates per checkpoint for practical execution
4. **Export Size**: Target <10KB JSON for session handoffs
5. **Anchor Count**: Limit to 10-20 persistent anchors per project

### 7.3 Compatibility Considerations

1. **Claude Code Compatibility**: Support `.claude/` directory structure
2. **Agent-Agnostic**: Support `.agents/` directory structure
3. **OpenCode-Specific**: Use `.opencode/` for platform-specific features
4. **Version Stability**: Gate new OpenCode features behind `experimental` config

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Create `.opencode/plugins/hivemind-core.ts` with lifecycle hooks
- [ ] Define `hivemind-session-lifecycle` skill
- [ ] Implement `hivemind_checkpoint` custom tool
- [ ] Create `/hivefiver` command family

### Phase 2: Governance Core (Week 3-4)
- [ ] Implement `hivemind_gate` tool with Zod schemas
- [ ] Create `hivemind-orchestrator` agent
- [ ] Add `experimental.session.compacting` hook
- [ ] Define permission templates

### Phase 3: Memory & Handoff (Week 5-6)
- [ ] Implement `hivemind_export` tool with structured output
- [ ] Create `hivemind_anchor` tool for persistent memory
- [ ] Build SOT registry integration
- [ ] Add cross-session search capabilities

### Phase 4: Advanced Features (Week 7-8)
- [ ] Parallel execution intelligence
- [ ] Anticipatory state management
- [ ] Decision record automation
- [ ] Verification protocol implementation

---

## Appendix A: Key Configuration Reference

### A.1 Minimal HiveMind Config

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@hivemind/core"],
  "agent": {
    "hivemind": {
      "description": "HiveMind governance orchestrator",
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514"
    }
  },
  "permission": {
    "external_directory": {
      "~/.hivemind/**": "allow"
    }
  }
}
```

### A.2 Complete Plugin Template

```typescript
import { tool, type Plugin } from "@opencode-ai/plugin"

export const HiveMindCorePlugin: Plugin = async ({ client, directory }) => {
  
  // Initialize governance state
  await client.app.log({
    body: { service: "hivemind", level: "info", message: "Plugin initialized" }
  })

  return {
    
    // Tool execution governance
    "tool.execute.before": async (input, output) => {
      if (input.tool === "bash") {
        // Validate command against governance policies
      }
    },
    
    "tool.execute.after": async (input, output) => {
      // Track execution for audit trail
    },
    
    // Context survival
    "experimental.session.compacting": async (input, output) => {
      output.context.push(await generateGovernanceSummary())
    },
    
    // Session lifecycle
    "session.created": async ({ event }) => {
      await initializeGovernance(event.sessionID)
    },
    
    // Custom tools
    tool: {
      hivemind_checkpoint: tool({
        description: "Create or verify a governance checkpoint",
        args: {
          name: tool.schema.string().describe("Checkpoint identifier"),
          verify: tool.schema.boolean().default(false),
        },
        async execute(args, ctx) {
          return { checkpoint: args.name, session: ctx.sessionID }
        },
      }),
    },
    
  }
}
```

---

## Appendix B: Bad vs Good Patterns

### B.1 Shell Commands

| BAD | GOOD |
|-----|------|
| `npm install` | `npm install --yes` |
| `git commit` | `git commit -m "message"` |
| `git add -p` | `git add .` |
| `docker run -it image` | `docker run image` |

### B.2 Configuration

| BAD | GOOD |
|-----|------|
| `"edit": "deny"` (too broad) | `"edit": { "*": "ask", ".hivemind/**": "allow" }` |
| `"mcp": { "server": {...} }` (always loaded) | `"tools": { "server_*": false }, "agent": { "mcp-agent": { "tools": { "server_*": true } } }` |

---

*Document Version: 1.0.0*
*Last Updated: 2025-01-13*
*Authors: HiveMind Context Governance Analysis*
