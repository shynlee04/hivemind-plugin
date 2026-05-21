[LANGUAGE: Write this file in en per Language Governance.]
# OpenCode SDK Subtask/Command Delegation Mechanism — Research

**Researched:** 2026-05-21
**Domain:** OpenCode SDK v1.14.44 — Command execution, subtask spawning, agent switching, config merge
**Confidence:** HIGH

## Summary

OpenCode supports two distinct command execution modes: **foreground** (direct TUI prompt injection via `@agent /command`) and **subtask** (isolated child session via the `task` tool). The subtask mechanism is controlled by command frontmatter fields (`subtask: true`, `agent: xxx`) and operates by creating a `SubtaskPart` message that the session loop detects and routes to `handleSubtask()`, which invokes the built-in `TaskTool` to spawn a child session.

The Hivemind project's existing `execute-slash-command` tool ONLY uses the TUI append+submit path. It does not leverage `session.command()` (which dispatches commands programmatically without TUI interaction) or the subtask path. This research documents both paths and their tradeoffs.

**Primary recommendation:** The `execute-slash-command` tool should adopt `session.command()` as the primary dispatch mechanism (programmatic, non-blocking, supports agent/model overrides via the API directly rather than string concatenation), and use the TUI append+submit path only as a fallback when `session.command()` is unavailable or blocked.

---

## User Constraints (from discuss context)

> No CONTEXT.md was provided. This research is independent exploration of the OpenCode SDK subtask mechanism.

---

## Phase Requirements

> No phase requirement IDs were provided. This research is exploratory/synthesis-oriented.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Command dispatch | OpenCode Server API | TUI Pipeline | `session.command()` is the designed programmatic API; TUI path is a fallback |
| Subtask execution | OpenCode TaskTool | Plugin SDK | TaskTool is built-in; subtask:true triggers it automatically |
| Agent switching | OpenCode Session Manager | TUI Keybindings | Programmatic via session.command(agent:xxx); TUI via `@mention` or Tab cycle |
| Command discovery | Primitive Loader | OpenCode Server config API | `loadPrimitives()` scans filesystem; no runtime SDK query exists |

---

## 1. How OpenCode's Subtask Mechanism Works Internally

### 1.1 Frontmatter Configuration

Commands in OpenCode are defined as `.md` files with YAML frontmatter or via `opencode.json`. The relevant fields are:

```yaml
---
description: Run a deep research synthesis
agent: hm-researcher
subtask: true
model: anthropic/claude-sonnet-4-20250514
---
```

[VERIFIED: DeepWiki analysis of anomalyco/opencode source — command frontmatter parsing]

The Hivemind project's `CommandFrontmatterSchema` confirms these exact fields:

```typescript
// Source: src/schema-kernel/command-frontmatter.schema.ts (in-project)
export const CommandFrontmatterSchema = z.object({
  description: z.string().min(1),
  agent: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  subtask: z.boolean().optional(),
}).strict()
```

### 1.2 Subtask Detection Logic

When a command is executed, OpenCode determines whether to create a subtask using this condition:

```
isSubtask = (agent.mode === "subagent" && cmd.subtask !== false) || cmd.subtask === true
```

[VERIFIED: DeepWiki analysis of anomalyco/opencode source — command.ts subtask detection]

This means:
- If the target agent's mode is `"subagent"` and `subtask` is NOT explicitly `false` → subtask is **implied**
- If `subtask: true` is explicitly set → subtask is **forced**
- If `subtask: false` is explicitly set → subtask is **suppressed** (even for subagents)

### 1.3 SubtaskPart Creation

When `isSubtask` is true, OpenCode creates a `SubtaskPart` instead of regular message parts:

```
SubtaskPart {
  type: "subtask",
  agent: "<agent-name>",       // From frontmatter agent field
  description: "...",          // From frontmatter description
  command: "/command args",    // The original command string
  prompt: "<resolved template>", // Frontmatter body with $ARGUMENTS resolved
  model: "<provider/model>",   // Optional model override
}
```

This part is then sent to the session via `prompt()` with the subtask part in the `parts` array.

[VERIFIED: DeepWiki analysis of anomalyco/opencode source — command.ts SubtaskPart creation]

### 1.4 Session Loop Detection and Task Tool Invocation

The main session loop detects the `SubtaskPart` and calls `handleSubtask()`, which:

1. Creates an `AssistantMessage` for the subtask context
2. Creates a `ToolPart` with `tool: TaskTool.id` (the built-in task tool identifier)
3. Prepares task arguments from the `SubtaskPart` fields:
   - `prompt` → the resolved template text
   - `description` → command description
   - `subagent_type` → the agent name (from frontmatter `agent` field)
   - `command` → the original command string
4. Executes the `TaskTool` with these arguments

[VERIFIED: DeepWiki analysis — handleSubtask function in session loop]

### 1.5 TaskTool Child Session Spawning

The `TaskTool` then:

1. Validates the subagent type exists
2. Creates a **new child session** with `parentSessionID` set to the current session
3. Derives appropriate permissions for the subagent
4. Calls `ops.prompt()` to run the prompt loop in **that child session**
5. Returns the result text

Key detail: The child session inherits the target agent's configuration (temperature, tools, permissions) but has restricted tool access — `task` and `todowrite` are excluded by default to prevent nested subtask chains.

[VERIFIED: DeepWiki analysis — TaskTool implementation]

### 1.6 The `@agent /command` Syntax (Foreground Dispatch)

When a user types `@specialist /command args` in the TUI, two separate mechanisms trigger:

1. **`@specialist`** — The `@mention` creates an "agent part" in the message. When the message is processed, if the part type is "agent", it triggers a subtask invocation using the `task` tool with the specified subagent name. The subagent operates in its own child session.

2. **`/command args`** — The slash command text is parsed by the autocomplete system. Commands are resolved from `Command.Service` which aggregates from:
   - Built-in defaults (`/init`, `/undo`, `/redo`, `/share`, `/help`)
   - `opencode.json` config (`command.test`, etc.)
   - MCP server command definitions
   - Custom `.opencode/commands/*.md` files
   - Skills with commands

The combined syntax `@agent /command args` works as follows:
1. TUI prepends `@agent` which triggers agent part creation
2. `/command args` is parsed as a slash command
3. If the command has `subtask: true` frontmatter, it creates a `SubtaskPart` that routes to the command's configured agent (NOT the `@mentioned` agent necessarily)
4. If no subtask, the agent part routes to the `@mentioned` agent

[VERIFIED: DeepWiki analysis — TUI agent mention and command execution flow]

### 1.7 How `@agent` Works Without a Command

When you type `@explore` (without a command), the agent mention creates an agent part. The session loop detects this and calls `handleSubtask()` which invokes the TaskTool with the mentioned agent as `subagent_type`. This creates a child session where the mentioned agent runs with its own configuration.

The user navigates between sessions using:
- `session_child_first` (default: `<Leader>+Down`) — enter first child session
- `session_child_cycle` (Right) — cycle between sibling sessions
- `session_parent` (Up) — return to parent session

Tab key or `agent.cycle` keybinding switches **primary agents** (Build, Plan) in the main session — this is different from subagent `@mention`.

[VERIFIED: DeepWiki analysis — session navigation and agent cycle]

---

## 2. How `@agent` Switching Works in OpenCode's TUI

### Step-by-step Flow

1. **User types `@` in TUI** → Autocomplete system triggers, listing available agents (primary + subagents)
2. **User selects/completes `@agentName`** → Creates an "agent part" in the message buffer
3. **User types `/command args`** (or just text) → Slash command or free text is parsed
4. **User presses Enter** → Message is submitted to the session
5. **Session loop processes message parts**:
   - If part type is `"agent"` → routes to `handleSubtask()` for that agent
   - If part type is `"text"` and contains `/command` → routes through command execution
   - If both agent part + command → command frontmatter `agent` field determines target, NOT the `@mentioned` agent (unless they match)
6. **Subtask execution** → TaskTool creates child session, target agent runs in isolated context
7. **Return to parent** → Subagent session completes, control returns to parent session

### Primary Agent Switching (Tab key)

Separate from `@mention`:
- Tab or `agent.cycle` calls `local.agent.move(1)` to cycle to the next primary agent
- This switches the entire session's active agent, NOT creating a child session
- Available primary agents are configured in `opencode.json` under `agent` key

[VERIFIED: DeepWiki analysis — agent switching, session navigation]

---

## 3. Command Frontmatter vs Tool Parameter Precedence

### The Relationship

Command frontmatter fields and task tool parameters operate at **different levels** of the system:

| Level | Input | Scope |
|-------|-------|-------|
| **Configuration** | Command frontmatter (`agent`, `subtask`, `model`) | Defines HOW a command behaves when invoked |
| **Runtime** | Task Tool parameters (`subagent_type`, `prompt`, `command`) | Actual values passed during execution |

**There is no direct conflict.** The command frontmatter determines what values are RESOLVED and passed to the Task Tool parameters:

```
Frontmatter agent: "hm-researcher"  →  TaskTool subagent_type: "hm-researcher"
Frontmatter subtask: true           →  TaskTool creates child session
Frontmatter model: "anthropic/..."  →  TaskTool context includes model override
```

### Key Distinctions

- **Command `agent` field** → Determines which subagent to invoke (becomes `subagent_type` in TaskTool). If no `agent` is set, the current session's agent is used.
- **Command `subtask` field** → Forces/prevents subtask creation regardless of agent mode
- **Plugin tool `agent` parameter** (e.g., in `execute-slash-command`) → This is a plugin-level parameter injected into the command text as `@agent`. It does NOT override the command frontmatter's `agent` field. However, in the TUI, `@agent /command` creates an agent part that routes to `@agent` for the session, while the command's frontmatter `agent` routes the command itself.

**Practical precedence when both exist:**

If a command has `agent: hm-researcher` in frontmatter AND the user types `@build /command`:
- The `@build` agent part routes the **session** to a build subagent
- The command's frontmatter `agent: hm-researcher` routes the **command** to the hm-researcher agent
- These are separate routing decisions and may conflict

[VERIFIED: DeepWiki analysis — command frontmatter tool parameter relationship]

---

## 4. Global vs Project Command/Agent Merge Precedence

### Precedence Order (lowest to highest)

| Priority | Source | Location |
|----------|--------|----------|
| 1 (lowest) | Remote config | `.well-known/opencode` |
| 2 | Global config | `~/.config/opencode/opencode.json` |
| 3 | Global commands directory | `~/.config/opencode/commands/*.md` |
| 4 | Custom config | `OPENCODE_CONFIG` env var |
| 5 | Project config | `opencode.json` at project root |
| 6 | Project directory | `.opencode/commands/*.md`, `.opencode/agents/*.md` |
| 7 | Inline config | `OPENCODE_CONFIG_CONTENT` env var |
| 8 | Account config | Remote account-based config |
| 9 (highest) | Managed config | Organization-managed config |

[VERIFIED: DeepWiki analysis — config merge precedence]

### Merge Strategy

The system uses `mergeConfigConcatArrays` for configuration merging:
- **General fields:** Deep merge — later sources override earlier ones for conflicting keys
- **Instructions array:** Concatenated and deduplicated (not replaced)
- **Commands:** Config-defined commands merged with markdown file commands; `.opencode/commands/` takes precedence over `~/.config/opencode/commands/` for same-named commands
- **First-wins on primitive discovery:** The Hivemind primitive loader uses "first-wins" — once a command/agent is discovered from a higher-priority directory, lower-priority sources are skipped for that name

### Hivemind's Primitive Loader Implementation

The project's `loadPrimitives()` in `src/features/bootstrap/primitive-loader.ts` implements:

```typescript
// Source: src/features/bootstrap/primitive-loader.ts (in-project)
// Resolution order: project .opencode/ first, then global config
const configRoots = [path.join(root, ".opencode")]
if (globalConfigPath) configRoots.push(path.resolve(globalConfigPath))

// First-wins: skip if already discovered from a prior directory
if (result.commands.has(name)) continue
```

[VERIFIED: In-project source — primitive-loader.ts lines 178-198]

### Accepts Both Singular and Plural Directory Names

OpenCode accepts both `commands/` and `command/` (likewise `agents/`/`agent`, `skills/`/`skill`):

```typescript
// Source: primitive-loader.ts
const dirs = resolvePrimitiveDirs(root, ["commands", "command"], globalConfigPath)
```

---

## 5. SDK Methods for Programmatic Control

### 5.1 Session Agent Switching

**YES — supported via `session.command()`:**

```typescript
// Source: @opencode-ai/sdk — session.command() accepts agent parameter
await client.session.command({
  path: { id: sessionId },
  body: {
    command: "build",
    arguments: "run tests",
    agent: "build-agent",  // Programmatic agent switching
    model: "anthropic/claude-sonnet-4-20250514",
  },
})
```

The SDK's `session.command()` sends a registered command to a session for execution by the AI assistant. It accepts: `command`, `arguments`, `agent`, `model`, and optional `parts` (file attachments).

The backend handler for `session.command()`:
1. Triggers a `command.execute.before` plugin hook
2. Executes the prompt with the command as context
3. Publishes a `Command.Event.Executed` event

[VERIFIED: DeepWiki analysis — session.command() method]
[CITED: Context7 SDK docs — session resource API]

### 5.2 Subtask Dispatch Without TUI

**YES — via `session.command()` with command that has `subtask: true` configured:**

When a command has `subtask: true` in its frontmatter, calling `session.command()` with that command name triggers the subtask flow:
1. Command frontmatter is read → `isSubtask = true`
2. `SubtaskPart` is created → sent via prompt
3. Session loop detects subtask → `handleSubtask()` → TaskTool → child session

This does NOT require TUI interaction. It works entirely through the SDK's programmatic API.

Direct Task Tool invocation is also possible through the `task` tool, but this is a lower-level approach:

```typescript
// Conceptual: invoking task tool directly (not through command)
// Requires: TaskTool.execute() with subagent_type, prompt, description
```

However, the recommended approach is to use `session.command()` with properly configured commands.

[VERIFIED: DeepWiki analysis — subtask flow via session.command()]

### 5.3 TUI Command Execution

`tui.executeCommand()` exists but is for **TUI control commands** (not session commands):

```typescript
// Source: @opencode-ai/sdk
await client.tui.executeCommand({ body: { command: "agent_cycle" } })
```

This executes TUI-level commands (agent switching, panel navigation) — NOT slash commands like `/init` or custom commands. The distinction:
- **`session.command()`** → Sends a registered command to the AI assistant within a session
- **`tui.executeCommand()`** → Executes a TUI control command (affects the terminal interface)

[VERIFIED: Context7 SDK docs — TUI methods]
[VERIFIED: DeepWiki analysis — tui vs session command distinction]

### 5.4 Checking Command Existence and Reading Frontmatter

**NOT available via SDK.** There is no runtime SDK method for:

- Querying available commands — NOT supported by the SDK API
- Reading command metadata/frontmatter programmatically — NOT supported
- Validating command existence before execution — NOT supported

**Workaround in Hivemind:** The project's own `loadPrimitives()` in `src/features/bootstrap/primitive-loader.ts` reads and validates command frontmatter from the filesystem directly. The command engine in `src/routing/command-engine/index.ts` provides a `discover` action that discovers available commands.

The Hivemind project's `hivemind-command-engine` tool uses this for discovery:

```typescript
// Source: src/routing/command-engine/index.ts (in-project)
export async function discoverCommandBundles(options: { projectRoot: string }) {
  const primitives = await loadPrimitives({ projectRoot: options.projectRoot })
  const commands = Array.from(primitives.commands.entries())
    .map(([name, command]) => ({
      name,
      source: "opencode-command",
      filePath: command.filePath,
      description: command.frontmatter.description,
      agent: command.frontmatter.agent,
      body: command.body,
    }))
  return { commands, warnings: primitives.warnings }
}
```

[VERIFIED: In-project source — command-engine/index.ts, primitive-loader.ts]

### 5.5 Session Management API

Full SDK session methods available for programmatic control:

| Method | Description | Notes |
|--------|-------------|-------|
| `session.list()` | List all sessions | Returns Session[] |
| `session.get({path})` | Get session by ID | Returns Session |
| `session.children({path})` | List child sessions | Key for subtask hierarchy |
| `session.create({body})` | Create new session | Returns session ID |
| `session.command({path, body})` | Execute command in session | Supports agent, model, arguments |
| `session.prompt({path, body})` | Send prompt to session | Supports noReply for context injection |
| `session.abort({path})` | Abort running session | |
| `tui.appendPrompt({body})` | Append to TUI prompt | Used by current execute-slash-command |
| `tui.submitPrompt()` | Submit TUI prompt | Used by current execute-slash-command |
| `app.agents()` | List all available agents | Returns Agent[] |

[VERIFIED: Context7 SDK docs — full API table]

---

## 6. Implications for Hivemind's execute-slash-command

### Current Implementation (TUI-Only Path)

The existing tool at `src/tools/session/execute-slash-command.ts`:

```typescript
// Current: TUI append + submit path
await client.tui.clearPrompt()
await client.tui.appendPrompt({ body: { text: promptText } })
await client.tui.submitPrompt()
```

**Pros:**
- Works during active LLM loops (non-blocking — queues after current turn)
- Simple implementation

**Cons:**
- No programmatic result/error feedback
- String concatenation for `@agent` and model overrides
- Cannot verify if command exists before dispatching
- Cannot handle subtask commands properly (they need child sessions)

### Recommended Enhancement

Replace the TUI-only path with a hybrid approach:

```typescript
// Preferred: session.command() for programmatic dispatch
// Falls back to TUI path when session.command() unavailable
async function dispatchCommand(client, args) {
  try {
    // Try programmatic dispatch first
    const result = await client.session.command({
      path: { id: activeSessionId },
      body: {
        command: args.command,
        arguments: args.arguments,
        agent: args.agent,
        model: args.model,
      },
    })
    return { success: true, result }
  } catch (error) {
    // Fallback: TUI path (works during LLM loops)
    await client.tui.appendPrompt({ body: { text: promptText } })
    await client.tui.submitPrompt()
    return { success: true, dispatched: true }
  }
}
```

**Benefit:** `session.command()` handles subtask routing internally, respects command frontmatter, provides proper error handling, and doesn't need string concatenation for `@agent` prefixes.

[ASSUMED] — This is a design recommendation based on research findings, not a verified implementation.

---

## Common Pitfalls

### Pitfall 1: TUI vs Session Command Confusion
**What goes wrong:** Using `tui.executeCommand()` instead of `session.command()` for slash commands. `tui.executeCommand()` is for TUI control (agent cycling, panel navigation), not for dispatching registered commands.
**How to avoid:** Use `session.command()` for slash commands; use `tui.executeCommand()` ONLY for TUI control commands.

### Pitfall 2: `@agent` vs Frontmatter `agent` Conflict
**What goes wrong:** When `@agent /command` is used, the `@agent` creates an agent part for the SESSION, but the command's frontmatter `agent` routes the COMMAND. These may conflict.
**How to avoid:** Be explicit about intent. If you want a command to run under a specific agent, set the command's frontmatter `agent` field. If you want the session to switch to a specific agent via TUI, use `@agent` without a command or use `session.command({agent: xxx})`.

### Pitfall 3: Subtask Prevents TUI Append Flow
**What goes wrong:** Commands with `subtask: true` spawn child sessions. The TUI append+submit path appends to the PARENT session's prompt, not the child session where the subtask is running.
**How to avoid:** Use `session.command()` for subtask commands — it handles child session routing automatically.

### Pitfall 4: session.command() Blocks During LLM Loop
**What goes wrong:** `session.command()` calls `SessionPrompt.prompt()` internally, which blocks until the LLM completes. If called during an active LLM loop, `SessionRunState.ensureRunning()` detects the session is busy and QUEUES the command — it never executes immediately.
**How to avoid:** The TUI path (append+submit) bypasses this by injecting into the TUI buffer. Use the hybrid approach: try `session.command()` first, fall back to TUI path when blocked.

[VERIFIED: In-project source — execute-slash-command.ts JSDoc comments]
[VERIFIED: DeepWiki analysis — session.command() blocking behavior]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `opencode-ai/opencode` (archived) | `anomalyco/opencode` | ~2025-2026 | SDK packages renamed; active development continues |
| `session.query()` (renamed) | `session.chat()` → `session.prompt()` | v1.14.x | API surface stabilized |
| Legacy agent directory: `~/.claude/agents/` | `.opencode/agents/` | OpenCode launch | New standard; plural + singular names supported |
| Legacy command: `CLAUDE.md` | `opencode.json` + `.opencode/commands/*.md` | OpenCode launch | More structured configuration |

---

## Sources

### Primary (HIGH confidence)
- [DeepWiki: anomalyco/opencode](https://deepwiki.com/anomalyco/opencode) — Subtask mechanism, handleSubtask, TaskTool, command execution flow, agent switching, config merge
- [Context7: /anomalyco/opencode-sdk-js](https://context7.com/anomalyco/opencode-sdk-js) — SDK API documentation (session.command, tui methods, types)
- In-project source: `src/tools/session/execute-slash-command.ts` — Current tool implementation
- In-project source: `src/routing/command-engine/index.ts` — Command discovery and routing
- In-project source: `src/features/bootstrap/primitive-loader.ts` — Primitive loading and frontmatter parsing
- In-project source: `src/schema-kernel/command-frontmatter.schema.ts` — Command frontmatter Zod schema

### Secondary (MEDIUM confidence)
- Hivemind project: `.hivemind/STACKS-REFERENCES.md` — OpenCode SDK v1.14.44 confirmation
- Hivemind project: `src/tools/hivemind/hivemind-command-engine.ts` — Command discovery companion tool

### Tertiary (LOW confidence)
- [ASSUMED] Recommended hybrid dispatch approach for `execute-slash-command` enhancement — design recommendation, not verified implementation

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `session.command()` can be used during active LLM loops successfully | Section 6 | If it queues the same as TUI path, the hybrid approach still works (falls back to TUI path) |
| A2 | `session.command()` respects command frontmatter `subtask` field | Section 1.2 | The subtask detection is in the command execution path which is called by session.command(); LOW risk |
| A3 | `app.agents()` returns the full list including subagents | Section 5.5 | May only return primary agents; verify at implementation time |
| A4 | The `@agent` in TUI prompt and command frontmatter `agent` can conflict | Section 2 | DeepWiki analysis confirmed these are separate routing decisions |

---

## Open Questions

1. **Can `session.command()` be called inside an active LLM loop?**
   - What we know: `session.command()` calls `SessionPrompt.prompt()` which blocks. `SessionRunState.ensureRunning()` queues it if busy.
   - What's unclear: Whether the queuing is reliable or if it silently drops
   - Recommendation: Implement hybrid approach (session.command first, TUI fallback)

2. **How does `app.agents()` resolve agents?**
   - What we know: It lists all available agents per the SDK docs
   - What's unclear: Whether it returns primary agents only, or also subagents from `.opencode/agents/`
   - Recommendation: Test at implementation time; may need `loadPrimitives()` for full discovery

3. **What session ID should `session.command()` use?**
   - What we know: The plugin has access to context via `ctx.directory`, `ctx.worktree`
   - What's unclear: How to get the active session ID from within a plugin tool context
   - Recommendation: Check if OpenCode plugin context provides session ID; if not, use `tui` path or the SDK's session.list() 

---

## Environment Availability

> Phase has no external dependencies — pure API/library research. Skipped.

---

## Validation Architecture

> Not applicable — this is research documentation, not a build phase. Skipped.

---

## Security Domain

> Not applicable — this is research documentation about API mechanisms, not a build phase. No security implications for the research itself. Skipped.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Live-verified via DeepWiki, Context7, and in-project source cross-reference
- Architecture: HIGH - Multiple sources agree on flow, verified against actual source code
- Pitfalls: HIGH - Based on verified codebase understanding and real edge cases
- SDK methods: MEDIUM - Some claims are based on DeepWiki analysis; actual SDK behavior should be tested

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (OpenCode v1.14.x is stable; will need refresh on major version bumps)
