# Subagent Delegation Patterns for Research

How to dispatch, control, and chain research subagents in Opencode.

---

## Task Tool — Subagent Delegation

The `task` tool is how orchestrators spawn subagents.

### Concurrent Subagent Launch (Single Message, Multiple Tasks)

Launch multiple agents in parallel by putting multiple `task` calls in one message:

```
Task(description="Map hivemind-plugin architecture", prompt="...", subagent_type="explore")
Task(description="Map openagent MCP layer", prompt="...", subagent_type="explore")
Task(description="Map opencode SDK plugin system", prompt="...", subagent_type="explore")
```

All three launch simultaneously. Results return as each completes.

### Session Resumption via `task_id`

Continue a subagent's work across turns:

```
Task(task_id="ses_abc123", prompt="Continue from where you left off. Now trace the delegation chain...", subagent_type="explore")
```

### Research vs Code Distinction

Always tell the subagent explicitly:

```
Task(
  description="Research hivemind delegation layer",
  prompt="This is a RESEARCH-ONLY task. Do NOT modify any files. 
  Use grep, glob, read, and bash (git log only) to:
  1. Find all files in src/delegation/
  2. Map the class hierarchy
  3. Identify all public APIs
  Return a structured summary with file paths and key function signatures.",
  subagent_type="explore"
)
```

---

## Permission Control

Configure which subagents an orchestrator can invoke:

```json
{
  "agent": {
    "orchestrator": {
      "mode": "primary",
      "permission": {
        "task": {
          "*": "deny",
          "explore": "allow",
          "general": "allow",
          "researcher-*": "allow"
        }
      }
    }
  }
}
```

Last matching rule wins. When set to `deny`, the subagent is removed from the Task tool description entirely.

---

## Batch Tool vs Task Tool — When to Use Each

| Dimension | `batch` tool | `task` tool |
|-----------|-------------|-------------|
| Scope | **Intra-agent** — parallel tool calls within one agent | **Inter-agent** — separate agent sessions |
| State | Shared (same agent context) | Isolated (each subagent has its own context) |
| Cost | Cheap (no new agent spawned) | Higher (new agent session) |
| Use when | 3+ independent reads/greps | Complex multi-step research per module |
| Limit | 1-25 calls per batch | Depends on config |
| Results | Immediate (same turn) | Asynchronous (notification when done) |

**Rule of thumb:**
- Need to read 5 files and grep 3 patterns? → `batch` tool
- Need to map an entire module's architecture? → `task` tool with `explore` agent
- Need both? → `batch` for quick scans, then `task` for deep dives

---

## Research-Only Agent Configuration

### Dedicated Researcher Agent

```json
{
  "agent": {
    "researcher": {
      "mode": "subagent",
      "description": "Deep codebase researcher. Use for comprehensive architecture analysis, cross-repo dependency tracing, and synthesis document generation.",
      "permission": {
        "edit": { "*": "deny", ".opencode/research/*": "allow" },
        "task": { "explore": "allow" }
      }
    }
  }
}
```

### Research Mode (Restrict Tools)

```json
{
  "mode": {
    "research": {
      "prompt": "{file:./prompts/research-protocol.txt}",
      "tools": {
        "write": false, "edit": false, "bash": true,
        "read": true, "grep": true, "glob": true,
        "list": true, "webfetch": true, "websearch": true
      }
    }
  }
}
```

---

## Delegation Decision Tree

```
Is the task multi-step and self-contained?
├── Yes → Can it be split into independent subtasks?
│   ├── Yes → Launch parallel `task` agents (one per subtask)
│   └── No → Launch single `task` agent with full context
└── No → Can it be parallelized with `batch` tool?
    ├── Yes → Use `batch` for parallel reads/greps
    └── No → Execute sequentially in current agent
```

---

## Subagent Return Format

Instruct subagents to return structured reports for easy synthesis:

```
Return a structured report:
- File tree with descriptions
- Key exports and their types
- Import dependencies (what this module depends on)
- Exported APIs (what other modules consume)
- Patterns observed (singleton, factory, observer, etc.)
```

This makes it easy for the orchestrator to combine outputs from multiple subagents into a synthesis document.

---

## Multi-Cycle Chaining

For research spanning multiple turns:

**Cycle 1:** Launch parallel explore agents → write results to disk
**Cycle 2:** Read Cycle 1 outputs → launch trace agents (LSP, codesearch) → write to disk
**Cycle 3:** Read Cycle 2 outputs → synthesize → generate_skill

Use `task_id` to resume agents if a cycle is interrupted. Use `todowrite` to track which cycles are complete.
