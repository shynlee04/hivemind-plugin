# Command Development Skills: Focused Audit Report

**Generated:** 2026-05-10  
**Coordinator:** hm-l1-coordinator  
**Audit Focus:** COMMANDS as initiator/glue for OpenCode meta-concept workflows  
**Official Docs Validated Against:** https://opencode.ai/docs/commands/ (fetched live 2026-05-10)  
**Cross-referenced:** https://opencode.ai/docs/agents/, https://opencode.ai/docs/plugins/, https://opencode.ai/docs/skills/

---

## Part 1: Inventory of All Command-Related Skills

### Direct Command Skills (teach commands as primary primitive)

| # | Skill Name | Location | Lineage | L-Level | Teaches | Key Strengths | Key Gaps |
|---|-----------|----------|---------|---------|---------|---------------|----------|
| 1 | **hf-l2-command-dev** | `.opencode/skills/hf-l2-command-dev/SKILL.md` | hf (project) | L2 | create, update, validate | OpenCode-native. CI=true shell safety. Banned commands list. YAML frontmatter. $ARGUMENTS. Agent binding. Subtask flag. | No JSON config coverage. No model override. No stacking/chaining. No validation patterns. |
| 2 | **hf-l2-command-parser** | `.opencode/skills/hf-l2-command-parser/SKILL.md` | hf (project) | L3 | parse, validate | $ARGUMENT propositional parsing. Named args. Flags. Quoted values. Entity:action expressions. 5-step procedure. | Narrow scope (only parsing). Not a full command-development skill. L-level mismatch (file says L2, meta says L3). |
| 3 | **Command Development** | `/Users/apple/.agents/skills/command-development/SKILL.md` | Third-party (Claude Code plugin) | N/A | create, validate | Comprehensive CC command authoring. 834 lines. Covers: allowed-tools, argument-hint, disable-model-invocation, $IF(), CLAUDE_PLUGIN_ROOT, namespacing. | **Not OpenCode-compatible.** Teaches CC plugin format. allowed-tools vs. permission system. CLAUDE_PLUGIN_ROOT is CC-only. |

### Adjacent Command Skills (touch commands as secondary concern)

| # | Skill Name | Location | How It Relates to Commands |
|---|-----------|----------|---------------------------|
| 4 | **hf-l2-meta-builder-core** | `.opencode/skills/hf-l2-meta-builder-core/SKILL.md` | Routes command creation requests to hf-l2-command-dev. Trigger: "set up a command" |
| 5 | **hf-l2-skill-router** | `.opencode/skills/hf-l2-skill-router/SKILL.md` | Maps command-dev task domains to hf-* skill bundles |
| 6 | **opencode-config-workflow** | `.opencode/skills/opencode-config-workflow/SKILL.md` | Can configure commands via configure-primitive tool. Batch command creation. |
| 7 | **hm-l3-opencode-project-audit** | `.opencode/skills/hm-l3-opencode-project-audit/SKILL.md` | Audits commands as part of 7-phase project audit (Phase 2: Commands Audit) |
| 8 | **hf-l2-delegation-gates** | `.opencode/skills/hf-l2-delegation-gates/SKILL.md` | Command dispatch authorization gates |
| 9 | **hf-l2-agents-and-subagents-dev** | `.opencode/skills/hf-l2-agents-and-subagents-dev/SKILL.md` | Agent binding in commands (`agent:`, `subtask:`) |
| 10 | **hf-l2-custom-tools-dev** | `.opencode/skills/hf-l2-custom-tools-dev/SKILL.md` | Custom tools are accessible from commands |
| 11 | **create-gsd-extension** | `/Users/apple/.agents/skills/create-gsd-extension/SKILL.md` | Teaches creating commands in GSD extensions. NOT OpenCode. |

---

## Part 2: Gap Analysis Against Official OpenCode Command Documentation

### What Official OpenCode Docs (https://opencode.ai/docs/commands/) Cover

| Topic | Covered? | Details |
|-------|----------|---------|
| Command file locations | ✅ | `.opencode/commands/` (project) or `~/.config/opencode/commands/` (global) |
| JSON config method | ✅ | `opencode.json` with `command` key. Fields: `template`, `description`, `agent`, `model`, `subtask` |
| Markdown config method | ✅ | `.md` files with YAML frontmatter in commands/ directory |
| `$ARGUMENTS` placeholder | ✅ | Captures all arguments as single string |
| Positional arguments | ✅ | `$1`, `$2`, `$3` for individual args |
| Shell output injection | ✅ | `` `!command` `` syntax to inject bash output into prompt |
| File references | ✅ | `@src/components/Button.tsx` to include file content |
| `template` field | ✅ | Required — the prompt content |
| `description` field | ✅ | Brief description shown in TUI |
| `agent` field | ✅ | Optional — specifies which agent executes the command |
| `subtask` field | ✅ | Boolean — forces subagent invocation to isolate context |
| `model` field | ✅ | Optional — override model for command |
| Built-in commands | ✅ | `/init`, `/undo`, `/redo`, `/share`, `/help` |
| Custom override of built-ins | ✅ | Custom commands can override built-in command names |

### What hf-l2-command-dev Teaches That Official Docs Don't

| Feature | Skill Teaches | Official Docs | Gap |
|---------|--------------|---------------|-----|
| Non-interactive shell safety | ✅ CI=true enforcement, banned commands list | ❌ | Docs don't mention shell safety guardrails for commands |
| Shell command scope restriction | ✅ `Bash(git:*)` patterns | Partially (permission system) | Different mechanism (skill teaches direct restriction, docs use permission system) |
| Command + skill integration | ✅ Commands referencing skill names | ❌ | No documentation on command→skill invocation patterns |
| Command + agent integration deep | ✅ `agent:` binding, temperature, tool assignments | ✅ (surface only) | Docs mention `agent` and `subtask` fields but don't explain integration depth |
| Command validation patterns | ✅ | ❌ | No validation methodology for commands |
| Shell injection via `!command` | ✅ (via references) | ✅ | Both cover this |

### What Official OpenCode Docs Cover That hf-l2-command-dev Doesn't

| Feature | Official Docs | hf-l2-command-dev | Gap |
|---------|--------------|-------------------|-----|
| JSON config method | ✅ `opencode.json` command key | ❌ | Skill only covers Markdown .md files |
| Model override per command | ✅ `model` field | ❌ | Not mentioned in skill |
| Built-in commands | ✅ `/init`, `/undo`, `/redo`, `/share`, `/help` | ❌ | Not covered |
| Custom override of built-ins | ✅ | ❌ | Not covered |
| Tab autocomplete | ✅ | ❌ | Not mentioned |

### What Neither Covers (Critical Gaps)

| Feature | Official Docs | hf-l2-command-dev | Command Development (global) | Severity |
|---------|--------------|-------------------|------------------------------|----------|
| **Command stacking/chaining** | ❌ | ❌ | ❌ | HIGH |
| **Command → Command invocation** | ❌ | ❌ | ❌ | HIGH |
| **Multi-command workflows** | ❌ | ❌ | ❌ | HIGH |
| **Command → Tool → Command pipelines** | ❌ | ❌ | ❌ | HIGH |
| **Command error handling** | ❌ | ❌ | ❌ | MEDIUM |
| **Command argument validation patterns** | ❌ | ❌ | Partially ($IF()) | MEDIUM |
| **Command templates / snippets** | ❌ | ❌ | ❌ | MEDIUM |
| **Command test patterns** | ❌ | ❌ | ❌ | MEDIUM |
| **Command permissions integration** | ❌ | ❌ | ❌ | MEDIUM |
| **Debugging commands** | ❌ | ❌ | ❌ | LOW |
| **Command performance optimization** | ❌ | ❌ | ❌ | LOW |
| **Command logging/audit trail** | ❌ | ❌ | ❌ | LOW |

---

## Part 3: Cross-References — Command ↔ Other Primitives

### Command ↔ Agent Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| `agent:` field in command config | Official docs, hf-l2-command-dev | Surface only — specifies agent name |
| `subtask:` boolean | Official docs, hf-l2-command-dev | Surface only — forces subagent isolation |
| Agent tool permissions in command context | hf-l2-agents-and-subagents-dev | Medium — covers agent permission profiles |
| Command-specific agent definition | ❌ Not covered | Gap — no skill teaches creating agents optimized for specific commands |
| Agent temperature for command execution | ❌ Not covered | Gap — no guidance on tuning agent temperature per command |

### Command ↔ Skill Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| Command triggering skill loading | hf-l2-command-dev (mention) | Shallow — "skills can be referenced from commands" |
| Skill→command→skill chaining | ❌ Not covered | Gap — no workflow for complex skill/command chains |
| Command as skill entry point | ❌ Not covered | Gap — no pattern for commands serving as skill invocation wrappers |
| Skill preloading in commands | ❌ Not covered | Gap — no mechanism to preload skills for command execution |

### Command ↔ Custom Tools Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| Custom tools accessible from commands | hf-l2-custom-tools-dev (implicit) | Shallow — tools created via plugins are available |
| Command-specific custom tool creation | ❌ Not covered | Gap — no pattern for creating tools that are command-optimized |
| Tool→command→tool workflows | ❌ Not covered | Gap |

### Command ↔ MCP Tools Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| MCP tools in command context | ❌ Not covered | Gap — no documentation on MCP tool availability in command execution |
| Command wrapping MCP server calls | ❌ Not covered | Gap |

### Command ↔ Plugin Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| Plugin events for commands | Official docs (command.executed, tui.command.execute) | Surface — events listed but not explained |
| Plugin hooks for command lifecycle | ❌ Not covered | Gap — no pre-command/post-command hook documentation |
| Plugin-registered commands | ❌ Not covered | Gap — can plugins register commands dynamically? |

### Command ↔ Configuration Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| opencode.json command key | Official docs | Covered |
| Environment variable overrides | ❌ Not covered | Gap — can env vars influence command behavior? |
| Command profiles (dev/prod) | ❌ Not covered | Gap |

### Command ↔ File References Integration

| Integration Point | Covered By | Depth |
|------------------|-----------|-------|
| `@file` references in commands | Official docs, hf-l2-command-dev | Covered — basic syntax |
| Multiple file references | ❌ Not covered | Gap — `@src/**/*.ts` patterns? |
| Template file references | ❌ Not covered | Gap |
| Output file directives | ❌ Not covered | Gap |

---

## Part 4: What the Global `Command Development` Skill Teaches vs. What's Needed

The global `Command Development` skill (834 lines, Claude Code plugin format) teaches many patterns that the OpenCode-native `hf-l2-command-dev` does NOT cover:

| Feature From Global Skill | Applicable to OpenCode? | Covered in hf-l2-command-dev? |
|--------------------------|------------------------|-------------------------------|
| `allowed-tools` field | ❌ Different paradigm (permission system) | ❌ |
| `argument-hint` for autocomplete | ✅ Valuable — OpenCode could benefit | ❌ |
| `disable-model-invocation` | ✅ Valuable | ❌ |
| `$IF()` conditional logic | ✅ Valuable for argument handling | ❌ |
| Command namespacing (subdirs) | ✅ Valuable — `commands/ci/test.md` | ❌ |
| `CLAUDE_PLUGIN_ROOT` | ❌ CC-only, not applicable | N/A |
| Multi-component workflows | ✅ Valuable | Partially |
| Comment documentation conventions | ✅ Valuable | ❌ |
| Validation patterns | ✅ Valuable | ❌ |
| Interactive commands (AskUserQuestion) | ✅ Valuable | ❌ |

---

## Part 5: Recommendations for Command Development Skills

### Immediate (Fill Critical Gaps)

1. **Expand hf-l2-command-dev** to cover:
   - JSON config method (`opencode.json` command key)
   - Model override per command
   - Built-in commands and custom overrides
   - Command argument validation patterns (port `$IF()` logic)
   - Command namespacing with subdirectories
   - Interactive commands with AskUserQuestion
   - Comment documentation conventions

2. **Create hf-l3-command-advanced skill** for:
   - Command stacking/chaining patterns
   - Multi-command workflows with agent coordination
   - Command→Tool→Command pipelines
   - Command error handling and recovery
   - Command test patterns and verification
   - Command performance and optimization
   - Command logging and audit trails

3. **Fix L-level mismatch** on hf-l2-command-parser → rename to hf-l3-command-parser

### Medium-Term

4. **Create cross-reference documentation** showing command↔agent, command↔skill, command↔tool integration patterns
5. **Port valuable patterns** from global `Command Development` skill (argument-hint, namespacing, $IF() logic) into OpenCode-native format
6. **Create command templates** for common patterns (CRUD operations, CI/CD pipelines, code generation)

### Long-Term

7. **Create integration test framework** for command validation
8. **Build command composition engine** for declarative command pipelines
9. **Document plugin-based command extensions** with `@opencode-ai/plugin` SDK hooks

---

## Part 6: Summary — Commands as Initiator/Glue

### Current State
Commands are the **entry point** for user interaction in OpenCode. They initiate agent sessions, load skills, reference files, and execute shell commands. However, the documentation and skills ecosystem treats commands as **isolated triggers** rather than as **workflow initiators** that can chain, stack, and integrate with the full primitive ecosystem.

### What's Working
- Basic command creation (Markdown + YAML) is well documented in both official docs and skills
- $ARGUMENTS, positional args, file references, and shell injection are covered
- Agent binding (`agent:`, `subtask:`) is supported
- Non-interactive shell safety is enforced in hf-l2-command-dev

### What's Missing (Critical)
- **Command stacking**: No way to chain `/cmd1` → `/cmd2` → `/cmd3` as a pipeline
- **Command composition**: No way to build commands from sub-commands
- **Multi-primitive workflows**: No documented pattern for command→skill→agent→tool→command loops
- **Advanced argument handling**: No conditional logic, validation, or transformation patterns
- **Command testing**: No framework for testing command behavior
- **Plugin integration**: No documented hooks for command lifecycle events

### The "Command as Glue" Vision Gap
A mature command system should act as the **universal initiator** for all OpenCode primitives:
```
User types /deploy
  → Command validates args
  → Command loads deploy skill
  → Command dispatches build agent (subtask: true)
  → Build agent uses custom tools to compile
  → On success, command chains to /test
  → Test agent runs, returns results
  → On pass, command chains to /ship
  → Ship agent creates PR, merges
  → Command returns summary to user
```

This requires: command chaining, conditional execution, agent coordination, tool integration, and result propagation — **none of which are currently documented or taught** in any skill.

---

**Evidence chains:**
- `hf-l2-command-dev/SKILL.md` — read and classified, 2026-05-10
- `hf-l2-command-parser/SKILL.md` — read and classified, 2026-05-10
- `/Users/apple/.agents/skills/command-development/SKILL.md` — read and classified, 2026-05-10
- https://opencode.ai/docs/commands/ — fetched live, 2026-05-10
- https://opencode.ai/docs/agents/ — fetched live, 2026-05-10
- https://opencode.ai/docs/plugins/ — fetched live, 2026-05-10
- https://opencode.ai/docs/skills/ — fetched live, 2026-05-10
