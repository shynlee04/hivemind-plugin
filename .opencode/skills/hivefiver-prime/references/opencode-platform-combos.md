# OpenCode Platform Combos — How Assets Chain at Runtime

> **STATUS**: FILLED — verified via Context7 `/anomalyco/opencode` (benchmark 90.6)
> **Last synced**: 2026-03-02
> **Cross-ref**: `hivefiver-mode/references/opencode-asset-authoring.md` has individual schema details.
> This file focuses on COMBINATION PATTERNS — how the pieces work together.

---

## 1. The Runtime Asset Stack

OpenCode assembles context from 5 asset types. Each has a distinct lifecycle:

| Asset | Loads When | Persists | Can Chain With |
|-------|-----------|----------|----------------|
| **Agent body** | Session init (ONCE) | Entire session | Commands, tools, skills |
| **Skill content** | On-demand via `skill()` tool | Entire session (never pruned) | Agent context, other skills |
| **Command** | User invokes `/command` | Single execution | Agent (via `agent:` field), tools, skills |
| **Custom tool** | Plugin registration | Entire server lifetime | All other tools, agents |
| **Plugin hooks** | Server startup | Entire server lifetime | All tool calls, sessions, compaction |

### Key Insight: Loading Order Matters

1. **Server start** → Plugins register → Custom tools available → Plugin hooks wired
2. **Session start** → Agent body loaded → Walk-up discovery (`AGENTS.md`, `CLAUDE.md`) → `L1` static context assembled
3. **First turn** → Agent sees available tools + skills list (filtered by permissions)
4. **On-demand** → Agent calls `skill()` → Content injected → Persists for remainder of session
5. **Command invocation** → Template interpolated → Optionally runs as subtask (child session)

---

## 2. The Three Combination Patterns

### Pattern A: Tool + Command + Agent (The Common Case)

The most frequent pattern in framework building:

```
User invokes /hivefiver build
  → Command file (.opencode/commands/hivefiver.md) loaded
  → Template: $ARGUMENTS injected, @paths resolved, !`cmd` executed
  → agent: hivefiver specified → hivefiver agent body governs behavior
  → subtask: true → runs in CHILD session with own permission ruleset
  → hivefiver loads skills on-demand in the child session
```

**HiveFiver-specific**: Our commands use `subtask: true` to get clean child sessions with stage-specific permissions. The command body IS the delegation prompt.

### Pattern B: Plugin + Hook + Tool (The Enforcement Case)

For governance and quality enforcement:

```
Plugin registers tool.execute.before hook
  → Every tool call flows through the hook
  → Hook can: inspect args, block execution (throw Error), mutate args
  → Post-execution: tool.execute.after can mutate output

Plugin registers experimental.session.compacting hook
  → When compaction triggers, hook fires
  → Can inject additional context (output.context.push(...))
  → Can replace entire compaction prompt (output.prompt = ...)
```

**HiveFiver-specific**: Our `hiveops-governance` plugin uses these hooks for scope enforcement, delegation validation, and context injection.

### Pattern C: Custom Tool + Script + Innate Tool (The Power Case)

For extending agent capabilities:

```
Custom tool registered via tool() helper in .opencode/tools/my-tool.ts
  → Available alongside innate tools (read, edit, bash, task, skill, glob, grep)
  → Execute function receives context: { agent, sessionID, messageID, directory, worktree }
  → Custom tool can call shell commands, access filesystem, interact with APIs
  → Agent sees custom tool in tool list, uses it like any innate tool
```

**Custom tool definition** (verified from Context7):
```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute")
  },
  async execute(args, context) {
    // context.directory = session CWD
    // context.worktree = git repo root
    // context.agent = calling agent name
    // context.sessionID = current session
    return `Executed query: ${args.query}`
  }
})
```

---

## 3. Skill ↔ Command Relationship

### What Actually Happens (Verified)

Skills are loaded via the `skill` tool. They are NOT automatically slash commands. The confusion arises from two separate mechanisms:

| Mechanism | How It Works |
|-----------|-------------|
| **Skill loading** | Agent calls `skill({ name: "my-skill" })` → SKILL.md content injected into context |
| **Command invocation** | User types `/my-command` → Command file loaded → Template interpolated → Executed |

### Naming Collision Risk

If a skill and a command share the same name, the command takes precedence for slash-command invocation. The skill remains loadable via the `skill()` tool separately.

**Rule**: Use distinct names. HiveFiver skills use `hivefiver-` prefix. Commands use `/hivefiver` with stage arguments.

---

## 4. Plugin Hook Lifecycle (Verified)

| Hook | Fires When | Can Do |
|------|-----------|--------|
| `tool.execute.before` | Before any tool call | Inspect/mutate args, throw to block |
| `tool.execute.after` | After tool returns | Inspect/mutate output |
| `experimental.session.compacting` | When compaction triggers | Inject context, replace prompt |
| `experimental.chat.system.transform` | On system prompt assembly | Reshape system instructions |
| `experimental.chat.messages.transform` | On message assembly | Reshape message history |
| `chat.message` | On every new user message | Mutate content before DB commit |
| `permission.ask` | Before blocking on human approval | Auto-resolve to allow/deny |

### What Plugins CANNOT Do

- They cannot load skills on behalf of agents
- They cannot force agent body changes mid-session
- They cannot create sessions (that's SDK-level)
- They cannot access other plugins' state

---

## 5. Auto-Discovery Globs

Files are discovered automatically based on directory convention:

| Glob | Discovers |
|------|-----------|
| `{command,commands}/**/*.md` | Custom commands |
| `{agent,agents}/**/*.md` | Custom agents |
| `{plugin,plugins}/*.{ts,js}` | Custom plugins |
| `{tool,tools}/*.{ts,js}` | Custom tools |

**Discovery locations** (low → high priority):
1. Global: `~/.claude/skills/`, `~/.agents/skills/`
2. Project: `.claude/skills/`, `.agents/skills/`
3. OpenCode: `.opencode/skill/` or `.opencode/skills/`
4. Config: `config.skills.paths`
5. Remote: `config.skills.urls` (cached locally)

Later locations overwrite earlier on name collision (last-wins).

---

## 6. Framework Builder Cheat Sheet

| I Want To... | Use This Combo |
|--------------|---------------|
| Add a new stage to hivefiver | Command file (`.opencode/commands/`) + workflow (`.opencode/workflows/`) |
| Enforce scope boundaries | Plugin hook (`tool.execute.before`) in `hiveops-governance` |
| Give hivefiver domain knowledge | Skill package (`.opencode/skills/hivefiver-*/`) |
| Extend agent capabilities | Custom tool (`.opencode/tools/*.ts`) |
| Delegate to sub-agent | Command with `subtask: true` OR Task tool call |
| Inject context at compaction | Plugin hook (`experimental.session.compacting`) |
| Gate tool access per-stage | Permission ruleset in agent profile or session create |
