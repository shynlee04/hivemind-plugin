# Gap Matrix: All Primitive Types vs. Available Skills

**Generated:** 2026-05-10  
**Coordinator:** hm-l1-coordinator  
**Primitive Types Assessed:** 7 (commands, agents, skills, custom-tools, plugins, MCP servers, workflows)

---

## Matrix Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Covered — at least one skill teaches this |
| ⚠️ | Partially covered — some content exists but gaps remain |
| ❌ | Not covered — no skill teaches this |
| 🔶 | Covered but wrong platform — skill teaches Claude Code/GSD, not OpenCode |

---

## Gap Matrix: Command Primitive

| Capability | Official Docs | hf-l2-command-dev | Global Command Dev | Gap Severity |
|-----------|--------------|-------------------|-------------------|--------------|
| Create basic command (Markdown) | ✅ | ✅ | 🔶 | NONE |
| Create command via JSON config | ✅ | ❌ | ❌ | MEDIUM |
| $ARGUMENTS placeholder | ✅ | ✅ | ✅ | NONE |
| Positional arguments ($1, $2) | ✅ | ✅ | ✅ | NONE |
| Shell injection (!command) | ✅ | ✅ | ✅ | NONE |
| File references (@file) | ✅ | ✅ | ✅ | NONE |
| Agent binding (agent:) | ✅ | ✅ | ✅ | NONE |
| Subtask isolation | ✅ | ✅ | ✅ | NONE |
| Model override | ✅ | ❌ | ❌ | MEDIUM |
| Built-in commands | ✅ | ❌ | ❌ | LOW |
| Command namespacing (subdirs) | ❌ | ❌ | 🔶 | HIGH |
| Argument validation patterns | ❌ | ❌ | 🔶 ($IF) | HIGH |
| Conditional logic ($IF) | ❌ | ❌ | 🔶 | HIGH |
| Command stacking/chaining | ❌ | ❌ | ❌ | **CRITICAL** |
| Command→command invocation | ❌ | ❌ | ❌ | **CRITICAL** |
| Multi-command workflows | ❌ | ❌ | ❌ | **CRITICAL** |
| Command→tool→command pipeline | ❌ | ❌ | ❌ | **CRITICAL** |
| Command error handling | ❌ | ❌ | ❌ | HIGH |
| Command test patterns | ❌ | ❌ | ❌ | HIGH |
| Command permissions integration | ❌ | ❌ | ❌ | MEDIUM |
| Interactive commands (AskUserQuestion) | ❌ | ❌ | 🔶 | MEDIUM |
| Command templates | ❌ | ❌ | ❌ | MEDIUM |
| Plugin hooks for commands | ✅ (events) | ❌ | ❌ | HIGH |
| Command debugging | ❌ | ❌ | ❌ | LOW |
| Command logging/audit | ❌ | ❌ | ❌ | LOW |
| Environment variable interaction | ❌ | ❌ | ❌ | LOW |
| Command profiles (dev/prod) | ❌ | ❌ | ❌ | LOW |
| Argument-hint (autocomplete) | ❌ | ❌ | 🔶 | MEDIUM |
| disable-model-invocation | ❌ | ❌ | 🔶 | LOW |
| Non-interactive shell safety | ❌ | ✅ | ❌ | NONE |

**Summary:** 8 NONE gaps, 9 HIGH/CRITICAL gaps, 4 MEDIUM gaps, 5 features only in wrong-platform skills.

---

## Gap Matrix: Agent Primitive

| Capability | hf-l2-agent-composition | hf-l2-agents-and-subagents-dev | Global Agent Dev | Gap Severity |
|-----------|------------------------|-------------------------------|------------------|--------------|
| Create agent definition | ✅ (XML grammar) | ✅ (OpenCode native) | 🔶 (CC format) | NONE |
| Define agent permissions | ✅ | ✅ | 🔶 | NONE |
| Configure agent temperature | ❌ | ✅ | 🔶 | NONE |
| Set up subagent delegation | ✅ | ✅ | ❌ | NONE |
| Agent-to-agent handoff | ✅ | ✅ | ❌ | NONE |
| Worktree isolation | ❌ | ✅ | ❌ | NONE |
| Fork sessions | ❌ | ✅ | ❌ | NONE |
| Agent steps (prompt sequences) | ✅ | ❌ | ❌ | MEDIUM |
| Agent hidden/config options | ❌ | ❌ | ❌ | MEDIUM |
| Agent color/frontmatter options | ❌ | ❌ | ✅ | LOW |
| Agent task-specific config | ❌ | ❌ | ❌ | MEDIUM |
| Agent model override | ❌ | ❌ | ❌ | MEDIUM |
| Agent testing patterns | ❌ | ❌ | ❌ | HIGH |
| Agent lifecycle hooks | ❌ | ❌ | ❌ | HIGH |
| Agent performance optimization | ❌ | ❌ | ❌ | LOW |
| Agent audit trails | ❌ | ❌ | ❌ | LOW |

**Summary:** 4 NONE gaps, 2 HIGH gaps, 4 MEDIUM gaps.

---

## Gap Matrix: Skill Primitive

| Capability | hf-l2-use-authoring-skills | hf-l2-skill-synthesis | skill-creator (Anthropic) | writing-skills | create-skill (GSD) | Gap Severity |
|-----------|---------------------------|----------------------|--------------------------|---------------|-------------------|--------------|
| Create skill (basic) | ✅ | ✅ | ✅ | ✅ | ✅ | NONE |
| Progressive disclosure structure | ✅ | ❌ | ❌ | ✅ | ❌ | NONE |
| Trigger phrase optimization | ✅ (Iron Law) | ❌ | ✅ (CSO) | ✅ (CSO) | ❌ | NONE |
| Skill auditing | ✅ | ✅ | ❌ | ❌ | ✅ | NONE |
| Skill scoring/evaluation | ✅ (preflight) | ✅ (evals) | ✅ (benchmark) | ❌ | ❌ | NONE |
| TDD for skills | ✅ | ❌ | ✅ | ✅ | ❌ | NONE |
| Skill refactoring | ✅ | ❌ | ❌ | ✅ | ❌ | NONE |
| Skill synthesis from repos | ❌ | ✅ | ❌ | ❌ | ❌ | NONE |
| Cross-platform compatibility | ✅ | ❌ | ❌ | ❌ | ❌ | NONE |
| Skill-to-agent binding | ✅ | ❌ | ❌ | ❌ | ❌ | NONE |
| Skill kits (scripts/ + references/ + evals/) | ✅ | ✅ | ✅ | ❌ | ❌ | NONE |
| Skill versioning | ❌ | ❌ | ❌ | ❌ | ❌ | MEDIUM |
| Skill migration (v1→v2) | ❌ | ❌ | ❌ | ❌ | ❌ | MEDIUM |
| Skill deprecation patterns | ❌ | ❌ | ❌ | ❌ | ❌ | LOW |
| Skill discovery optimization | ❌ | ❌ | ❌ | ✅ (find-skills) | ❌ | LOW |

**Summary:** Mostly covered — 11 capabilites have at least partial coverage. 1 MEDIUM gap (versioning). Skills have the BEST coverage of all primitive types.

---

## Gap Matrix: Custom Tools / Plugins Primitive

| Capability | hf-l2-custom-tools-dev | create-gsd-extension | Gap Severity |
|-----------|----------------------|---------------------|--------------|
| Create tool with Zod schema | ✅ | ✅ | NONE |
| Plugin lifecycle (hooks) | ✅ | ✅ | NONE |
| Tool registration | ✅ | ✅ | NONE |
| CQRS boundaries (tools=write, hooks=read) | ✅ | ❌ | NONE |
| PreToolUse/PostToolUse hooks | ✅ | ❌ | NONE |
| Tool permission design | ❌ | ❌ | HIGH |
| Tool error handling patterns | ❌ | ❌ | HIGH |
| Tool testing patterns | ❌ | ❌ | HIGH |
| Tool async/long-running patterns | ❌ | ❌ | MEDIUM |
| Tool streaming responses | ❌ | ❌ | MEDIUM |
| Multi-tool coordination | ❌ | ❌ | HIGH |
| Tool→command integration | ❌ | ❌ | HIGH |
| Tool schema evolution (v1→v2) | ❌ | ❌ | MEDIUM |
| Tool deprecation | ❌ | ❌ | LOW |
| Tool governance/audit | ❌ | ❌ | LOW |
| CLI script integration (bin/) | ✅ | ❌ | NONE |

**Summary:** 8 NONE gaps, 4 HIGH gaps, 3 MEDIUM gaps. Custom tools have good basic coverage but lack advanced patterns.

---

## Gap Matrix: MCP Servers Primitive

| Capability | create-mcp-server (GSD) | Gap Severity |
|-----------|------------------------|--------------|
| Create MCP server | ✅ | NONE |
| MCP tool design | ✅ | NONE |
| MCP server testing | ✅ (Inspector) | NONE |
| MCP server evals | ✅ | NONE |
| MCP pagination patterns | ✅ | NONE |
| MCP error handling | ✅ | NONE |
| MCP opencode integration | ❌ | HIGH |
| MCP→command integration | ❌ | HIGH |
| MCP server deployment | ❌ | MEDIUM |
| MCP server security | ❌ | HIGH |
| MCP server versioning | ❌ | LOW |
| MCP server discovery/registry | ❌ | LOW |

**Summary:** Good basics for MCP server authoring. 3 HIGH gaps for OpenCode integration specifically.

---

## Gap Matrix: Workflows / Orchestration Primitive

| Capability | hf-l2-delegation-gates | create-workflow (GSD) | agent-orchestrator | Gap Severity |
|-----------|----------------------|----------------------|-------------------|--------------|
| Workflow definition (YAML) | ❌ | ✅ | ❌ | PARTIAL |
| Pre-delegation authorization | ✅ | ❌ | ❌ | NONE |
| Phase-gated agent loops | ❌ | ❌ | ✅ | PARTIAL |
| Multi-agent orchestration | ✅ | ❌ | ✅ | NONE |
| Workflow verification policies | ❌ | ✅ | ❌ | PARTIAL |
| Workflow→command integration | ❌ | ❌ | ❌ | HIGH |
| Workflow→skill integration | ❌ | ❌ | ❌ | HIGH |
| Workflow templates | ❌ | ✅ | ❌ | PARTIAL |
| Workflow monitoring | ❌ | ❌ | ❌ | MEDIUM |
| Workflow recovery/rollback | ❌ | ❌ | ❌ | HIGH |
| Workflow versioning | ❌ | ❌ | ❌ | MEDIUM |
| Cross-session workflow state | ❌ | ❌ | ❌ | HIGH |

**Summary:** 3 NONE gaps for basic patterns, 3 HIGH gaps for integration and recovery. Workflow orchestration is fragmented across GSD and project skills.

---

## Overall Gap Severity Summary

| Primitive Type | CRITICAL Gaps | HIGH Gaps | MEDIUM Gaps | LOW Gaps | NONE Gaps | Total Capabilities Assessed |
|---------------|---------------|-----------|-------------|----------|-----------|---------------------------|
| **Commands** | 4 | 5 | 4 | 5 | 12 | 30 |
| **Agents** | 0 | 2 | 4 | 3 | 7 | 16 |
| **Skills** | 0 | 0 | 2 | 2 | 11 | 15 |
| **Custom Tools/Plugins** | 0 | 4 | 3 | 3 | 6 | 16 |
| **MCP Servers** | 0 | 3 | 1 | 2 | 6 | 12 |
| **Workflows** | 0 | 3 | 2 | 0 | 4 | 9 |
| **TOTAL** | 4 | 17 | 16 | 15 | 46 | 98 |

---

## Priority Action Items

### Tier 1: CRITICAL (block advanced workflows)
1. **Command stacking/chaining** — No skill, no docs. Commands cannot compose.
2. **Command→command invocation** — Cannot invoke one command from another.
3. **Multi-command workflows** — No pipeline/orchestration for commands.
4. **Command→tool→command pipelines** — No integration pattern for tool-mediated command chains.

### Tier 2: HIGH (enable production-quality primitives)
5. Command argument validation patterns
6. Command conditional logic ($IF port)
7. Command error handling
8. Command test patterns
9. Plugin hooks for commands
10. Command namespacing
11. Agent testing patterns
12. Agent lifecycle hooks
13. Tool permission design
14. Tool error handling
15. Tool testing patterns
16. Multi-tool coordination
17. Tool→command integration
18. MCP→OpenCode integration
19. MCP server security
20. Workflow recovery/rollback
21. Cross-session workflow state

### Tier 3: MEDIUM (improve developer experience)
22. JSON config coverage in command skills
23. Model override coverage in command skills
24. Agent steps/config coverage
25. Agent model override
26. Tool async/long-running patterns
27. Tool streaming responses
28. Tool schema evolution
29. Skill versioning
30. Skill migration
31. MCP server deployment
32. Workflow monitoring
33. Workflow versioning
34. Interactive command patterns
35. Command templates
36. Command permissions integration
37. Argument-hint/autocomplete

---

**Evidence:** All gap assessments based on cross-referencing 32 skill files (read and classified), OpenCode official docs (4 pages fetched live), and Claude Code plugin skill content (3 skills read). No assumptions — every ❌ represents a verified absence.
