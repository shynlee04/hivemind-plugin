# OpenCode Platform Mechanics

**CONDITIONAL LOAD**: When platform detected as OpenCode via `Task()`, `skill()`, `bash`, `read`, `write`, `patch`, `glob` tools.

## Tool Mapping

| Universal Concept | OpenCode Mechanic | Notes |
|-------------------|-------------------|-------|
| Load a skill | `skill("name")` | Loads from skill registry |
| Delegate to subagent | `Task(subagent_type, prompt)` | Creates subagent with typed context |
| Run shell command | `bash` | **Non-interactive only** — no TTY, no prompts |
| Read file | `read` | Returns file content |
| Write file | `write` | Creates or overwrites file |
| Patch file | `patch` | Applies targeted edits |
| Search files | `glob` | Pattern-based file discovery |
| Search content | `grep` | Content search within files |
| Memory/state | Internal state management | Framework-managed persistence |

## Non-Interactive Shell Rules

> [!CAUTION]
> OpenCode bash is **non-interactive**. No TTY. No stdin prompts. No interactive editors.

| Pattern | ❌ Don't | ✅ Do |
|---------|---------|------|
| Install packages | `npm install` (prompts) | `npm install --yes` or `npm ci` |
| Git operations | `git commit` (opens editor) | `git commit -m "msg"` |
| Confirmations | `rm -i file` | `rm file` (or `rm -f file`) |
| Editors | `vim file`, `nano file` | `write` tool instead |
| Pagination | `less`, `more` | `cat` or `head -n` |

## Delegation Model

```
Orchestrator calls Task(type, prompt)
  → Subagent spawns with typed context
  → Subagent completes → returns result
  → Orchestrator validates result
```

## Key Differences from Other Platforms

- **Skill loading is explicit**: `skill("name")` must be called, skills don't auto-load
- **Subagent typing**: `Task()` accepts a type parameter that determines subagent capabilities
- **State is framework-managed**: No file-system artifacts for state (unlike Claude Code task_boundary)
- **Registry-driven**: Skills resolved via `skills/registry.yaml` → `skills/{name}/SKILL.md`
