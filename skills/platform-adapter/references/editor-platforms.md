# Editor Platform Mechanics

**CONDITIONAL LOAD**: When platform detected as Cursor, Windsurf, or Kilo Code via integrated terminal patterns, inline edit tools, or extension-based tool signatures.

## Platform Detection

| Characteristic | Cursor | Windsurf | Kilo Code |
|---------------|--------|----------|-----------|
| IDE base | VS Code fork | VS Code fork | VS Code extension |
| AI integration | Cursor Tab, Cmd+K | Cascade | Extension panel |
| Terminal | Integrated (interactive) | Integrated (interactive) | Integrated (interactive) |
| File editing | Inline diff + apply | Inline diff + apply | Inline diff + apply |

## Universal Tool Mapping

| Universal Concept | Editor Platform Mechanic | Notes |
|-------------------|------------------------|-------|
| Load a skill | Read file via editor | Open SKILL.md, paste to chat |
| Delegate to subagent | N/A | No subagent dispatch — single-agent |
| Run shell command | Terminal integration | Fully interactive, TTY available |
| Read file | Workspace file access | Full IDE file system |
| Write file | Inline edit + apply | Diff-based with user approval |
| Search files | Workspace search | IDE search integration |
| Search content | Full-text search | IDE-native search |
| Task tracking | N/A | Manual via comments or TODO |

## Key Adaptations for Editor Platforms

### 1. Single-Agent Model
Editor platforms run a single AI agent. No delegation, no subagents.
- All orchestration concepts → sequential self-directed steps
- Entry-resolution still applies but routes to SELF, not subagents
- Spawning guard is N/A — flag if task needs delegation

### 2. Skill Loading
No skill registry. No `skill()` function. Skills loaded by:
1. User pastes SKILL.md content into chat
2. Agent reads files from workspace
3. Extension loads skill files from configured paths

### 3. Interactive Shell
Unlike OpenCode, editor terminals support full TTY:
- Interactive prompts work
- Editors (vim, nano) work — but prefer inline edit tools
- Pagination works — but prefer direct output

### 4. Context Window Pressure
Editor AI agents typically have smaller context windows:
- Bundle references become critical — load ONLY what's triggered
- Prefer references over inline content in SKILL.md
- Templates should be self-contained, not require cross-reference

## When to Suggest Platform Switch

If a task requires:
- **Subagent delegation** → suggest OpenCode or Antigravity
- **Non-interactive automation** → suggest OpenCode
- **Browser testing** → suggest Antigravity
- **Quick inline edits** → current editor platform is fine
