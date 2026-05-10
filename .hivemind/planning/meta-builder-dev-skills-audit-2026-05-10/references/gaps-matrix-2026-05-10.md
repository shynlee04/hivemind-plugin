# Gap Matrix: All Primitive Types vs. Available Skills

**Generated:** 2026-05-10 | **Coordinator:** hm-l1-coordinator
**Primitives Assessed:** 7 (commands, agents, skills, custom-tools, plugins, MCP servers, workflows)

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Covered by >=1 skill |
| ⚠️ | Partially covered |
| ❌ | Not covered |
| 🔶 | Covered but wrong platform (CC/GSD, not OpenCode) |

---

## Commands (30 capabilities assessed)

| Capability | Docs | hf-l2-cmd-dev | Global Cmd Dev | Gap |
|-----------|------|--------------|----------------|-----|
| Create command (Markdown) | ✅ | ✅ | 🔶 | ✅ |
| Create via JSON config | ✅ | ❌ | ❌ | ❌ MEDIUM |
| $ARGUMENTS | ✅ | ✅ | ✅ | ✅ |
| Positional args ($1, $2) | ✅ | ✅ | ✅ | ✅ |
| Shell injection (!command) | ✅ | ✅ | ✅ | ✅ |
| File references (@file) | ✅ | ✅ | ✅ | ✅ |
| Agent binding (agent:) | ✅ | ✅ | ✅ | ✅ |
| Subtask isolation | ✅ | ✅ | ✅ | ✅ |
| Model override | ✅ | ❌ | ❌ | ❌ MEDIUM |
| Built-in commands | ✅ | ❌ | ❌ | ❌ LOW |
| Namespacing (subdirs) | ❌ | ❌ | 🔶 | ❌ HIGH |
| Argument validation patterns | ❌ | ❌ | 🔶 | ❌ HIGH |
| Conditional logic ($IF) | ❌ | ❌ | 🔶 | ❌ HIGH |
| **Command stacking/chaining** | ❌ | ❌ | ❌ | ❌ **CRITICAL** |
| Command→command invocation | ❌ | ❌ | ❌ | ❌ **CRITICAL** |
| Multi-command workflows | ❌ | ❌ | ❌ | ❌ **CRITICAL** |
| Command→tool→command | ❌ | ❌ | ❌ | ❌ **CRITICAL** |
| Error handling | ❌ | ❌ | ❌ | ❌ HIGH |
| Test patterns | ❌ | ❌ | ❌ | ❌ HIGH |
| Permission integration | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Interactive (AskUserQuestion) | ❌ | ❌ | 🔶 | ❌ MEDIUM |
| Command templates | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Plugin hooks for commands | ✅ | ❌ | ❌ | ❌ HIGH |
| Non-interactive safety | ❌ | ✅ | ❌ | ✅ |
| Debugging | ❌ | ❌ | ❌ | ❌ LOW |
| Logging/audit | ❌ | ❌ | ❌ | ❌ LOW |
| Env var interaction | ❌ | ❌ | ❌ | ❌ LOW |
| Profiles (dev/prod) | ❌ | ❌ | ❌ | ❌ LOW |
| Argument-hint (autocomplete) | ❌ | ❌ | 🔶 | ❌ MEDIUM |
| disable-model-invocation | ❌ | ❌ | 🔶 | ❌ LOW |

**Commands Summary:** 12 NONE gaps | 4 CRITICAL | 5 HIGH | 4 MEDIUM | 5 LOW

---

## Agents (16 capabilities assessed)

| Capability | hf-agent-comp | hf-agents-subagents | Global Agent Dev | Gap |
|-----------|--------------|-------------------|------------------|-----|
| Create agent definition | ✅ | ✅ | 🔶 | ✅ |
| Define permissions | ✅ | ✅ | 🔶 | ✅ |
| Configure temperature | ❌ | ✅ | 🔶 | ✅ |
| Subagent delegation | ✅ | ✅ | ❌ | ✅ |
| Agent-to-agent handoff | ✅ | ✅ | ❌ | ✅ |
| Worktree isolation | ❌ | ✅ | ❌ | ✅ |
| Fork sessions | ❌ | ✅ | ❌ | ✅ |
| Agent steps (prompts) | ✅ | ❌ | ❌ | ⚠️ |
| Hidden/config options | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Color/frontmatter | ❌ | ❌ | ✅ | ⚠️ |
| Task-specific config | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Model override | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Testing patterns | ❌ | ❌ | ❌ | ❌ HIGH |
| Lifecycle hooks | ❌ | ❌ | ❌ | ❌ HIGH |
| Performance optimization | ❌ | ❌ | ❌ | ❌ LOW |
| Audit trails | ❌ | ❌ | ❌ | ❌ LOW |

**Agents Summary:** 7 NONE | 2 HIGH | 3 MEDIUM | 2 LOW | 2 PARTIAL

---

## Skills (15 capabilities assessed)

| Capability | hf-use-auth | hf-skill-synth | skill-creator | writing-skills | Gap |
|-----------|------------|---------------|--------------|---------------|-----|
| Create skill (basic) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Progressive disclosure | ✅ | ❌ | ❌ | ✅ | ✅ |
| Trigger phrase optimization | ✅ | ❌ | ✅ | ✅ | ✅ |
| Skill auditing | ✅ | ✅ | ❌ | ❌ | ✅ |
| Skill scoring/evaluation | ✅ | ✅ | ✅ | ❌ | ✅ |
| TDD for skills | ✅ | ❌ | ✅ | ✅ | ✅ |
| Skill refactoring | ✅ | ❌ | ❌ | ✅ | ✅ |
| Skill synthesis from repos | ❌ | ✅ | ❌ | ❌ | ✅ |
| Cross-platform | ✅ | ❌ | ❌ | ❌ | ✅ |
| Skill-agent binding | ✅ | ❌ | ❌ | ❌ | ✅ |
| Skill kits | ✅ | ✅ | ✅ | ❌ | ✅ |
| Skill versioning | ❌ | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Skill migration (v1→v2) | ❌ | ❌ | ❌ | ❌ | ❌ MEDIUM |
| Deprecation patterns | ❌ | ❌ | ❌ | ❌ | ❌ LOW |
| Discovery optimization | ❌ | ❌ | ❌ | ✅ | ⚠️ |

**Skills Summary:** 11 NONE | 2 MEDIUM | 1 LOW | 1 PARTIAL — **BEST covered primitive type**

---

## Custom Tools / Plugins (16 capabilities)

| Capability | hf-custom-tools-dev | create-gsd-ext | Gap |
|-----------|-------------------|---------------|-----|
| Tool with Zod schema | ✅ | ✅ | ✅ |
| Plugin lifecycle | ✅ | ✅ | ✅ |
| Tool registration | ✅ | ✅ | ✅ |
| CQRS boundaries | ✅ | ❌ | ✅ |
| PreToolUse/PostToolUse | ✅ | ❌ | ✅ |
| bin/ script integration | ✅ | ❌ | ✅ |
| Tool permission design | ❌ | ❌ | ❌ HIGH |
| Error handling patterns | ❌ | ❌ | ❌ HIGH |
| Testing patterns | ❌ | ❌ | ❌ HIGH |
| Multi-tool coordination | ❌ | ❌ | ❌ HIGH |
| Async/long-running | ❌ | ❌ | ❌ MEDIUM |
| Streaming responses | ❌ | ❌ | ❌ MEDIUM |
| Tool→command integration | ❌ | ❌ | ❌ HIGH |
| Schema evolution | ❌ | ❌ | ❌ MEDIUM |
| Deprecation | ❌ | ❌ | ❌ LOW |
| Governance/audit | ❌ | ❌ | ❌ LOW |

**Custom Tools Summary:** 6 NONE | 5 HIGH | 3 MEDIUM | 2 LOW

---

## MCP Servers (12 capabilities)

| Capability | create-mcp-server | Gap |
|-----------|------------------|-----|
| Create MCP server | ✅ | ✅ |
| Tool design | ✅ | ✅ |
| Testing (Inspector) | ✅ | ✅ |
| Evals | ✅ | ✅ |
| Pagination | ✅ | ✅ |
| Error handling | ✅ | ✅ |
| OpenCode integration | ❌ | ❌ HIGH |
| Command integration | ❌ | ❌ HIGH |
| Security | ❌ | ❌ HIGH |
| Deployment | ❌ | ❌ MEDIUM |
| Versioning | ❌ | ❌ LOW |
| Discovery/registry | ❌ | ❌ LOW |

**MCP Summary:** 6 NONE | 3 HIGH | 1 MEDIUM | 2 LOW

---

## Workflows (9 capabilities)

| Capability | hf-delegation-gates | create-workflow | agent-orchestrator | Gap |
|-----------|-------------------|----------------|-------------------|-----|
| Pre-delegation gates | ✅ | ❌ | ❌ | ✅ |
| Multi-agent orchestration | ✅ | ❌ | ✅ | ✅ |
| Workflow definition (YAML) | ❌ | ✅ | ❌ | ⚠️ |
| Phase-gated loops | ❌ | ❌ | ✅ | ⚠️ |
| Verification policies | ❌ | ✅ | ❌ | ⚠️ |
| Workflow→command integration | ❌ | ❌ | ❌ | ❌ HIGH |
| Workflow→skill integration | ❌ | ❌ | ❌ | ❌ HIGH |
| Recovery/rollback | ❌ | ❌ | ❌ | ❌ HIGH |
| Cross-session state | ❌ | ❌ | ❌ | ❌ HIGH |

**Workflows Summary:** 3 NONE | 1 PARTIAL | 3 PARTIAL | 4 HIGH

---

## Overall Summary

| Primitive | CRITICAL | HIGH | MEDIUM | LOW | NONE | Total |
|-----------|----------|------|--------|-----|------|-------|
| **Commands** | 4 | 5 | 4 | 5 | 12 | 30 |
| **Agents** | 0 | 2 | 3 | 2 | 9 | 16 |
| **Skills** | 0 | 0 | 2 | 1 | 12 | 15 |
| **Custom Tools** | 0 | 5 | 3 | 2 | 6 | 16 |
| **MCP Servers** | 0 | 3 | 1 | 2 | 6 | 12 |
| **Workflows** | 0 | 4 | 0 | 0 | 5 | 9 |
| **TOTAL** | 4 | 19 | 13 | 12 | 50 | 98 |

---

## Tier 1 Priority: CRITICAL (4 items)
1. Command stacking/chaining
2. Command→command invocation
3. Multi-command workflows
4. Command→tool→command pipelines

## Tier 2 Priority: HIGH (19 items)
- Commands: validation, conditional logic, error handling, test patterns, plugin hooks
- Agents: testing, lifecycle hooks
- Custom Tools: permission design, error handling, testing, multi-tool, tool→command
- MCP: OpenCode integration, command integration, security
- Workflows: command integration, skill integration, recovery, cross-session state

## Tier 3 Priority: MEDIUM (13 items)
- Commands: JSON config, model override, permissions, interactive, templates, autocomplete
- Agents: hidden options, task config, model override
- Skills: versioning, migration
- Custom Tools: async, streaming, schema evolution
- MCP: deployment

---

**Evidence:** Cross-referenced 32 skill files (read/classified) + 4 OpenCode doc pages (fetched live 2026-05-10). Every ❌ = verified absence.
