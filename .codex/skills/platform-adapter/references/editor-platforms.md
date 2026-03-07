# Editor Platform Mechanics

**CONDITIONAL LOAD**: When platform detected as an editor-based AI agent (not agentic CLI like OpenCode, not full-stack like Antigravity).

## Config Directory Detection

When a project workspace is loaded, detect the platform from its config directories:

| Config Directory | Platform | Classification | Agent Model |
|-----------------|----------|----------------|-------------|
| `.cursor/` | Cursor | Editor (VS Code fork) | Single-agent |
| `.windsurf/` | Windsurf | Editor (VS Code fork) | Single-agent |
| `.kilocode/` | Kilo Code | Editor (VS Code extension) | Single-agent |
| `.claude/` | Claude Code | Agentic CLI | Multi-agent → load `agentic-platforms.md` |
| `.agent/` | Claude Code / Antigravity | Agentic adapter surface | Multi-agent → load `agentic-platforms.md` |
| `.agents/` | Codex | Agentic adapter surface | Multi-agent → load `agentic-platforms.md` |
| `.gemini/` | Antigravity / Gemini | Agentic | Multi-agent → load `agentic-platforms.md` |
| `.roo/` | Roo Code | Editor (VS Code extension) | Single-agent |
| `.trae/` | Trae | Editor (VS Code fork) | Single-agent |
| `.qwen/` | Qwen Code | Editor | Single-agent |
| `.qoder/` | Qoder | Editor | Single-agent |
| `.crush/` | Crush | Editor | Single-agent |
| `.factory/` | Factory | Editor | Single-agent |
| `.iflow/` | iFlow | Editor | Single-agent |

> [!IMPORTANT]
> If multiple config dirs exist (e.g., `.cursor/` + `.claude/`), the ACTIVE RUNTIME determines classification, not filesystem presence. Check which tools are actually available.

## Universal Tool Mapping

| Universal Concept | Editor Platform Mechanic | Notes |
|-------------------|------------------------|-------|
| Load a skill | Read file via editor | Open SKILL.md, paste to chat or auto-read |
| Delegate to subagent | N/A | No subagent dispatch — single-agent model |
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
- Spawning guard is N/A — flag if task requires delegation

### 2. Skill Loading
No skill registry API. Skills loaded by:
1. User pastes SKILL.md content into chat
2. Agent reads files from workspace (if file-read tool available)
3. Extension auto-loads skill files from configured paths
4. User references skill via @-mention or slash command

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

### 5. Mixed Config Directories
When a project has `.cursor/`, `.agent/`, `.opencode/` etc. co-existing:
- Each directory may contain platform-specific skill adaptations
- Root `skills/` is ALWAYS source of truth
- Platform dirs may contain adapted copies — these are consumers, not sources
- Skill content in platform dirs may lag behind root — root wins conflicts

## When to Suggest Platform Switch

If a task requires:
- **Subagent delegation** → suggest OpenCode, Claude Code, or Antigravity
- **Non-interactive automation** → suggest OpenCode
- **Browser testing** → suggest Antigravity
- **Quick inline edits** → current editor platform is fine
- **Long multi-phase workflows** → suggest agentic platform (better state management)
