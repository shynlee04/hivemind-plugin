# Agentic Platform Mechanics

**CONDITIONAL LOAD**: When platform detected as Claude Code, Antigravity, or Codex via `run_command`, `view_file`, `write_to_file`, `task_boundary`, `browser_subagent` tools.

## Platform Detection

| Tool Signature | Platform |
|---------------|----------|
| `run_command` + `view_file` + `write_to_file` + `task_boundary` (no `browser_subagent`) | Claude Code |
| `run_command` + `view_file` + `write_to_file` + `task_boundary` + `browser_subagent` | Antigravity |
| `run_command` + `view_file` + `write_to_file` (no `task_boundary`) | Codex |

## Universal Tool Mapping

| Universal Concept | Claude Code / Antigravity | Codex | Notes |
|-------------------|--------------------------|-------|-------|
| Load a skill | `view_file SKILL.md` | `view_file SKILL.md` | Manual read, no registry call |
| Delegate to subagent | `browser_subagent` (Antigravity only) | N/A | Claude Code lacks subagent tool |
| Run shell command | `run_command` | `run_command` | Both support interactive with approval |
| Read file | `view_file` | `view_file` | Line-range supported |
| Write file | `write_to_file` | `write_to_file` | Full file write |
| Edit file | `replace_file_content` / `multi_replace_file_content` | Inline edit tools | Targeted edits |
| Search files | `find_by_name` | File search tools | Pattern-based |
| Search content | `grep_search` | Content search tools | Regex supported |
| Task tracking | `task_boundary` | N/A | Antigravity/Claude Code only |

## Skill Loading Pattern

These platforms have NO `skill()` function. Skills are loaded by reading the SKILL.md file:

```
1. Identify skill directory: skills/{name}/SKILL.md
2. Read SKILL.md via view_file
3. If SKILL.md references bundled resources:
   a. Check conditional triggers
   b. Load ONLY triggered references
4. Follow skill instructions
```

## Delegation Patterns

### Antigravity (has browser_subagent)
```
Orchestrator defines task prompt
  → browser_subagent(task, recording_name)
  → Subagent executes in browser context
  → Returns result
  → Orchestrator validates
```

### Claude Code / Codex (no subagent tool)
```
Orchestrator breaks work into sequential steps
  → Executes each step directly
  → Uses run_command for shell operations
  → Validates after each step
NO parallel delegation possible without subagent tool
```

## Key Differences from OpenCode

- **No `skill()` function**: Skills loaded by reading files, not calling registry
- **No `Task()` dispatch**: Delegation is tool-based (browser_subagent) or sequential
- **Interactive shell possible**: `run_command` can be interactive (with user approval)
- **File-system artifacts**: Task tracking via file artifacts, not framework state
- **No explicit skill registry resolution**: Agent discovers skills via file system
