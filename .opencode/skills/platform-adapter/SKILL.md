---
name: platform-adapter
description: Use when a skill needs to map universal concepts to
  platform-specific mechanics, when any skill references platform-specific tool
  usage, when building platform-agnostic instructions, or when the current
  platform's mechanics are unknown. Detects the host platform and conditionally
  loads only the matching mechanics reference. Supports OpenCode, Claude Code,
  Antigravity, Cursor, Windsurf, Codex, Kilo Code, Roo, Trae, Qwen, Qoder,
  Crush, Factory, and iFlow.
---

# Platform Adapter

**Core principle:** The CONCEPT matters. The mechanic is interchangeable. Every skill expresses universal concepts; this adapter maps them to the current platform's tools.

## Platform Detection

Detect the platform ONCE at session start, then load only the matching reference.

```
Available tools include Task() or skill()?
  → OpenCode
  → MANDATORY: load references/opencode-mechanics.md

Available tools include run_command + view_file + browser_subagent?
  → Antigravity
  → MANDATORY: load references/agentic-platforms.md

Available tools include run_command + view_file + task_boundary (no browser_subagent)?
  → Claude Code
  → MANDATORY: load references/agentic-platforms.md

Available tools include run_command + view_file (no task_boundary)?
  → Codex
  → MANDATORY: load references/agentic-platforms.md

Integrated terminal + inline edit + IDE workspace?
  → Cursor / Windsurf / Kilo Code
  → MANDATORY: load references/editor-platforms.md

Cannot determine?
  → Default to general principles below
  → Ask user to confirm platform
```

> [!IMPORTANT]
> Load ONLY the matching reference. Never load all three. Context budget matters.

## Universal Concepts (Platform-Independent)

These concepts are constant across ALL platforms:

| Concept | Meaning |
|---------|---------|
| **Load a skill** | Read and follow a skill's instructions |
| **Delegate** | Hand off a subtask to another agent/process |
| **Execute** | Run a command or modification |
| **Verify** | Prove work was done correctly with output evidence |
| **Persist state** | Save information that survives session boundaries |
| **Search** | Find files or content in the workspace |

## Philosophy Regulation Layer

When platform mechanics conflict with framework philosophy, **philosophy wins:**

| Conflict | Platform Says | Philosophy Says | Resolution |
|----------|--------------|----------------|------------|
| Auto-execute | "Run immediately" | "Gate first" | Gate before execution |
| Skip verification | "Trust the output" | "Prove with evidence" | Always verify |
| Bypass delegation guard | "Delegate freely" | "Pre-spawn checklist" | Guard before spawn |
| Override user intent | "Infer what they meant" | "Ask ONE question" | Clarify, don't infer |

## Bundled References (Conditional Loading)

| Reference | Trigger | Platforms Covered |
|-----------|---------|-------------------|
| [opencode-mechanics.md](references/opencode-mechanics.md) | `Task()` or `skill()` detected | OpenCode |
| [agentic-platforms.md](references/agentic-platforms.md) | `run_command` + `view_file` + `write_to_file` detected | Claude Code, Antigravity, Codex |
| [editor-platforms.md](references/editor-platforms.md) | IDE integration detected | Cursor, Windsurf, Kilo Code |

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| **Loading all references** | Wastes context — load only the matching platform |
| **Hardcoding mechanics** | Makes skill platform-specific — use universal concepts |
| **Ignoring philosophy** | Platform runtime wraps; philosophy regulates |
| **Platform guessing** | Detect via tool signatures, don't assume |
| **Mechanic in SKILL.md** | SKILL.md has concepts; references have mechanics |
