# Command Development Skills: Focused Audit Report

**Generated:** 2026-05-10 | **Coordinator:** hm-l1-coordinator
**Official Docs:** https://opencode.ai/docs/commands/ (fetched live 2026-05-10)
**Cross-refs:** /docs/agents/, /docs/plugins/, /docs/skills/

---

## Part 1: Command Skill Inventory

| # | Skill | Location | Lineage | Teaches | Strengths | Gaps |
|---|-------|----------|---------|---------|-----------|------|
| 1 | **hf-l2-command-dev** | `.opencode/skills/` | hf (project) | create, update, validate | OpenCode-native. CI=true safety. $ARGUMENTS. Agent binding. Subtask. | No JSON config. No model override. No stacking/chaining. No validation patterns. |
| 2 | **hf-l2-command-parser** | `.opencode/skills/` | hf (project) | parse, validate | $ARGUMENT propositional parsing. Flags, quoted values. 5-step procedure. | Narrow scope (parsing only). L-level mismatch (L2→L3). |
| 3 | **Command Development** | `/Users/apple/.agents/skills/` | Third-party (CC) | create, validate | 834 lines. allowed-tools, $IF(), argument-hint, namespacing. | **NOT OpenCode-compatible.** CC-only concepts. |
| 4 | **create-gsd-extension** | `/Users/apple/.agents/skills/` | Third-party (GSD) | create commands | GSD extension commands | Not OpenCode. |

**Adjacent skills touching commands:** hf-meta-builder-core (routes command requests), hf-skill-router (maps command domains), opencode-config-workflow (batch configure commands), hm-opencode-project-audit (Phase 2: Commands Audit), hf-delegation-gates (command authorization), hf-agents-and-subagents-dev (agent binding in commands), hf-custom-tools-dev (tools available from commands).

---

## Part 2: Gap Analysis — Official Docs vs. Skills

### What Official Docs Cover That Skills Don't

| Feature | Official Docs | hf-l2-command-dev | Command Dev (global) |
|---------|--------------|-------------------|---------------------|
| JSON config (opencode.json) | ✅ | ❌ | ❌ |
| Model override per command | ✅ | ❌ | ❌ |
| Built-in commands | ✅ | ❌ | ❌ |
| Custom override of built-ins | ✅ | ❌ | ❌ |
| Tab autocomplete | ✅ | ❌ | ❌ |

### What Skills Cover That Official Docs Don't

| Feature | Official Docs | hf-l2-command-dev |
|---------|--------------|-------------------|
| Non-interactive shell safety (CI=true) | ❌ | ✅ |
| Banned commands list | ❌ | ✅ |
| Shell command scope restriction | ❌ | ✅ |
| Command→skill integration patterns | ❌ | ✅ |
| Command validation methodology | ❌ | ✅ |

### What Neither Covers (CRITICAL Gaps)

| Feature | Docs | Skills | Severity |
|---------|------|--------|----------|
| **Command stacking/chaining** | ❌ | ❌ | **CRITICAL** |
| **Command→command invocation** | ❌ | ❌ | **CRITICAL** |
| **Multi-command workflows** | ❌ | ❌ | **CRITICAL** |
| **Command→tool→command pipeline** | ❌ | ❌ | **CRITICAL** |
| Command error handling | ❌ | ❌ | HIGH |
| Command test patterns | ❌ | ❌ | HIGH |
| Plugin hooks for commands | ❌ | ❌ | HIGH |
| Command namespacing (subdirs) | ❌ | ❌ | HIGH |
| Argument validation patterns | ❌ | ❌ | HIGH |
| Conditional logic ($IF) | ❌ | ❌ | HIGH |
| Interactive commands (AskUserQuestion) | ❌ | ❌ | MEDIUM |
| Command templates | ❌ | ❌ | MEDIUM |
| Command permissions integration | ❌ | ❌ | MEDIUM |
| Command debugging | ❌ | ❌ | LOW |
| Command logging/audit | ❌ | ❌ | LOW |

---

## Part 3: Cross-References — Commands as Initiator/Glue

### Command ↔ Agent

| Integration | Covered? | Depth |
|------------|----------|-------|
| agent: field binding | ✅ Docs + skill | Surface |
| subtask: isolation | ✅ Docs + skill | Surface |
| Agent tool permissions in command | ⚠️ agents-and-subagents-dev | Medium |
| Command-specific agent definition | ❌ | Gap |
| Agent temperature per command | ❌ | Gap |

### Command ↔ Skill

| Integration | Covered? |
|------------|----------|
| Skill name in command template triggers loading | ⚠️ Shallow mention |
| Skill→command→skill workflows | ❌ Gap |
| Command as skill wrapper | ❌ Gap |

### Command ↔ Custom Tools

| Integration | Covered? |
|------------|----------|
| Custom tools available from commands | ⚠️ Implicit |
| Tool→command→tool pipelines | ❌ Gap |

### Command ↔ Plugins

| Integration | Covered? |
|------------|----------|
| command.executed event | ✅ Docs (surface) |
| Pre/post command hooks | ❌ Gap |
| Plugin-registered commands | ❌ Gap |

### Command ↔ MCP Tools

| Integration | Covered? |
|------------|----------|
| MCP tools in command context | ❌ Gap |
| Command wrapping MCP server calls | ❌ Gap |

---

## Part 4: What to Port from Global `Command Development` to OpenCode

| Feature | Applicable? | Currently in hf-l2-command-dev? |
|---------|------------|-------------------------------|
| argument-hint (autocomplete) | ✅ | ❌ |
| $IF() conditional logic | ✅ | ❌ |
| Command namespacing (subdirs) | ✅ | ❌ |
| Interactive commands (AskUserQuestion) | ✅ | ❌ |
| Validation patterns | ✅ | ❌ |
| Comment documentation conventions | ✅ | ❌ |
| allowed-tools | ❌ (different paradigm) | N/A |
| CLAUDE_PLUGIN_ROOT | ❌ (CC-only) | N/A |
| disable-model-invocation | ✅ | ❌ |

---

## Part 5: Recommendations

### Immediate — Expand hf-l2-command-dev
- JSON config method (opencode.json command key)
- Model override, built-in commands, custom overrides
- Argument validation patterns ($IF() port)
- Command namespacing, interactive commands, documentation conventions

### Short-Term — New hf-l3-command-advanced skill
- Command stacking/chaining patterns
- Multi-command workflows with agent coordination
- Command→tool→command pipelines
- Error handling, recovery, test patterns

### Medium-Term
- Cross-reference docs for command↔agent/skill/tool integration
- Command templates for common patterns
- Integration test framework for commands

### The "Command as Glue" Vision
```
/deploy → validate → load skill → dispatch agent(subtask) → build with tools → chain /test → chain /ship → return
```
Requires: chaining, conditional execution, agent coordination, tool integration — **none currently documented/taught.**

---

**Evidence:** hf-l2-command-dev/SKILL.md + hf-l2-command-parser/SKILL.md + global command-development/SKILL.md read. opencode.ai/docs/commands/agents/plugins/skills fetched live 2026-05-10.
