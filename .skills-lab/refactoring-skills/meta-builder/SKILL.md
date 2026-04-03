---
name: meta-builder
description: Use when creating, modifying, or stacking agent skills, commands, tools, agents, workflows, or OpenCode configurations. Routes user intent to implementation skills (GROUP 1) or domain authoring skills (GROUP 2). Triggers: "build a skill", "create an agent", "set up a command", "configure OpenCode", "stack these skills", "modify my workflow", "add a custom tool", "set permissions", "add MCP server", "configure LSP", "write a rule", "meta concept", "harness framework".
---

# meta-builder

Parent orchestrator for the harness framework. Routes user intent to specialist skills, stacks concepts together, and integrates OpenCode meta concepts into coherent workflows. Deep material lives in `references/`; this body encodes routing logic, stacking rules, and concept integration.

---

## Required Skill Loads

| Purpose | Skills |
|---------|--------|
| Creating/improving skills | `skill-creator`, `skill-development`, `writing-skills` |
| Auditing/refactoring skills | `skill-judge`, `skill-review` |
| Git-backed memory | `gcc` |
| Long-running planning | `planning-with-files` |
| Skill discovery | `find-skills` |
| Parallel orchestration | `dispatching-parallel-agents` |

---

## When to Load

| User Intent | Route |
|-------------|-------|
| "Create a new skill" / "write a skill" | → GROUP 2: `use-authoring-skills` |
| "Help me figure out what I want" / "brainstorm" | → GROUP 1: `user-intent-interactive-loop` |
| "Coordinate multiple agents" / "dispatch in parallel" | → GROUP 1: `coordinating-loop` |
| "Plan this complex task" / "break it down" | → GROUP 1: `planning-with-files` |
| "Set up an agent" / "configure agents" | → GROUP 2: `use-authoring-agents` (future) |
| "Create a command" / "add /my-command" | → GROUP 2: `use-authoring-commands` (future) |
| "Build a custom tool" / "add a tool" | → GROUP 2: `use-authoring-tools` (future) |
| "Design a workflow" / "set up automation" | → GROUP 2: `use-authoring-workflows` (future) |
| "Add MCP server" / "configure LSP" / "set permissions" | → This skill (OpenCode concepts) |
| "Stack multiple skills together" | → This skill (stacking rules) |

---

## Core Pattern: The Routing Loop

```
DETECT INTENT → CLASSIFY GROUP → LOAD SKILL → EXECUTE → INTEGRATE → REPEAT
```

### Step 1: Detect Intent

Parse the user's natural language for signals:

| Signal Type | Examples | Classification |
|-------------|----------|----------------|
| Creation verbs | "create", "build", "write", "design" | GROUP 2 (authoring) |
| Exploration verbs | "figure out", "explore", "brainstorm", "what if" | GROUP 1 (implementation) |
| Coordination verbs | "coordinate", "dispatch", "parallel", "orchestrate" | GROUP 1 (implementation) |
| Planning verbs | "plan", "break down", "organize", "structure" | GROUP 1 (implementation) |
| Configuration nouns | "agent", "command", "tool", "permission", "MCP", "LSP" | GROUP 2 or this skill |
| Stacking verbs | "combine", "stack", "chain", "integrate" | This skill (stacking) |

### Step 2: Classify Group

| GROUP | Purpose | Skills |
|-------|---------|--------|
| **GROUP 1** | How-to-implement — execution methodology | `user-intent-interactive-loop`, `coordinating-loop`, `planning-with-files` |
| **GROUP 2** | Domain authoring — creating OpenCode entities | `use-authoring-skills`, `use-authoring-agents`, `use-authoring-commands`, `use-authoring-tools`, `use-authoring-workflows` |
| **GROUP 3** | Shared concepts — stackable knowledge | OpenCode meta concepts (agents, tools, commands, configs, skills, rules, permissions, custom-tools, MCP servers, LSP servers) |

### Step 3: Load and Execute

Load the target skill via the `skill` tool. Execute within that skill's methodology. The coordinator NEVER executes directly — it delegates.

### Step 4: Integrate

After execution, check if additional skills need stacking. If the task spans multiple domains, load complementary skills and re-route.

### Step 5: Repeat

Loop until the user's intent is fully satisfied. Write state to disk every turn.

→ Full routing logic: `references/01-routing-logic.md`

---

## Routing Table

```
User says: "I want to create a skill for code review"
  → GROUP 2: use-authoring-skills
  → Stack with: skill-creator, writing-skills

User says: "Help me think through this architecture"
  → GROUP 1: user-intent-interactive-loop
  → Stack with: planning-with-files

User says: "Run these 3 tasks in parallel"
  → GROUP 1: coordinating-loop
  → Stack with: dispatching-parallel-agents

User says: "Set up a custom agent with restricted tools"
  → GROUP 2: use-authoring-agents (future)
  → Stack with: OpenCode concepts (agents + permissions)

User says: "Add an MCP server and configure permissions"
  → This skill (OpenCode concepts)
  → Reference: references/02-opencode-concepts.md

User says: "Combine skill authoring with parallel dispatch"
  → This skill (stacking)
  → Load: use-authoring-skills + coordinating-loop
  → Reference: references/03-stacking-rules.md
```

→ Full routing logic: `references/01-routing-logic.md`

---

## Stacking Guide

Skills stack when a task spans multiple domains. Rules:

1. **Load the primary skill first** — the one matching the user's main intent.
2. **Load complementary skills second** — skills that support the primary workflow.
3. **Never load conflicting skills** — check for scope overlap before stacking.
4. **Maximum 3 skills active simultaneously** — beyond that, context dilutes.
5. **Write stacking decisions to disk** — record which skills are loaded and why.

### Valid Combinations

| Primary | Complementary | Purpose |
|---------|--------------|---------|
| `use-authoring-skills` | `skill-creator` | Creating skills with TDD |
| `user-intent-interactive-loop` | `planning-with-files` | Long sessions with persistent memory |
| `coordinating-loop` | `dispatching-parallel-agents` | Multi-agent orchestration |
| `meta-builder` | Any GROUP 1 + GROUP 2 | Full-stack meta work |

### Invalid Combinations

| Conflict | Reason |
|----------|--------|
| Two skills with same trigger | Scope overlap — pick one |
| Depth skill + routing skill | Identity crisis — pick a lane |
| Skills writing to same file | Shared state mutation |

→ Full stacking rules: `references/03-stacking-rules.md`

---

## OpenCode Concept Integration

The 10 OpenCode meta concepts map to skill triggers:

| Concept | Maps To | Trigger Signal |
|---------|---------|----------------|
| **Agents** | `use-authoring-agents` (future) | "create agent", "configure agent", "subagent" |
| **Commands** | `use-authoring-commands` (future) | "custom command", "/my-command", "command bundle" |
| **Tools** | `use-authoring-tools` (future) | "custom tool", "built-in tool", "tool access" |
| **Skills** | `use-authoring-skills` | "write a skill", "skill authoring", "SKILL.md" |
| **Permissions** | This skill + `use-authoring-tools` | "permission", "allow", "deny", "ask" |
| **Custom Tools** | `use-authoring-tools` (future) | "tool()", ".opencode/tools/", "custom function" |
| **MCP Servers** | This skill | "MCP", "Model Context Protocol", "external tool" |
| **LSP Servers** | This skill | "LSP", "language server", "code intelligence" |
| **Rules** | This skill | "AGENTS.md", "instructions", "custom rules" |
| **Configs** | This skill | "opencode.json", "config", "settings" |

→ Full concept guide: `references/02-opencode-concepts.md`

---

## HiveMind v3 Alignment

This skill aligns with the clean architecture:

| HiveMind Principle | meta-builder Implementation |
|--------------------|---------------------------|
| Skills as config | Skills are markdown — declarative, not code |
| Tools as write side | Custom tools mutate state; skills guide how |
| Hooks as read side | Hooks observe; skills instruct what to observe |
| Code vs config boundary | Business logic in TypeScript; workflows in markdown |
| CQRS enforcement | Skills read (guide); tools write (execute) |
| Zero runtime deps | Pure markdown + shell scripts |
| Non-breaking changes | Progressive disclosure, additive only |

→ Full compatibility: `references/04-hivemind-compatibility.md`

---

## Operating Discipline

1. **Coordinator NEVER executes directly** — PLAN + DELEGATE only.
2. **Write-to-disk every turn** — coherence is lost by default.
3. **Record and commit ALL changes** — if it's not in git, it doesn't exist.
4. **Frame skeleton first** — map architecture before deep work.
5. **Max 3 domains, max 5k LOC per subagent** — split when compare-and-contrast is needed.
6. **Sequential preference** — favor sequential over parallel when possible.
7. **Disk-based synthesis** — ALL subagent outputs written to disk.

---

## Terminology Mandate

| Refer to | Use | NOT |
|----------|-----|-----|
| The AI entity | "Agent" | Claude, GPT, Gemini |
| The config file | "AGENTS.md" | CLAUDE.md |
| Platform | Universal | OpenCode-specific only |

OpenCode is the closest measurement, but ALL agentic platforms must work.

---

## Anti-Patterns

1. **The Coordinator Executor** — Coordinator edits files directly. Delegate.
2. **The Skill Hoarder** — Loading 5+ skills at once. Max 3.
3. **The Routing Blind Spot** — Missing natural language triggers. Detect intent, don't wait for explicit skill names.
4. **The Stack Overflow** — Stacking conflicting skills. Check for overlap first.
5. **The Concept Duplicator** — Repeating OpenCode docs in skill content. Reference, don't duplicate.
6. **The Platform Loyalist** — Hardcoding platform-specific commands. Stay universal.
7. **The Silent Worker** — Executing for many turns without updates. Update at phase boundaries.
8. **The Context Amnesiac** — Losing state between turns. Write to disk every turn.
9. **The Premature Router** — Routing before understanding intent. Probe first.
10. **The Orphan Stack** — Loading skills without integration plan. Always define handoff paths.

---

## Reference Map

| File | Purpose |
|------|---------|
| `references/01-routing-logic.md` | How to detect and classify user intent into GROUP 1 vs GROUP 2 |
| `references/02-opencode-concepts.md` | All 10 OpenCode meta concepts — what they are, how they map to triggers |
| `references/03-stacking-rules.md` | How to combine multiple skills without conflicts or cycles |
| `references/04-hivemind-compatibility.md` | HiveMind v3 alignment — skills as config, tools as write, hooks as read |

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `use-authoring-skills` | GROUP 2 — skill authoring domain. This skill routes to it. |
| `user-intent-interactive-loop` | GROUP 1 — iterative user engagement. This skill routes to it. |
| `coordinating-loop` | GROUP 1 — multi-agent orchestration. This skill routes to it. |
| `planning-with-files` | GROUP 1 — persistent memory. This skill routes to it. |
| `skill-creator` | Supporting — creates skills. Loaded alongside GROUP 2. |
| `gcc` | Supporting — git-backed memory. Loaded for long sessions. |

---

## Scripts

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `scripts/route-check.sh` | Validates routing decision against available skills | After classifying user intent |
| `scripts/stack-validate.sh` | Checks if a skill combination is valid | Before loading multiple skills |
