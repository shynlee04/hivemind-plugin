# Routing Logic

How to detect user intent and classify it into GROUP 1 (implementation) or GROUP 2 (domain authoring). This is the core decision engine for the meta-builder orchestrator.

---

## The Detection Pipeline

```
User Input → Signal Extraction → Intent Classification → Group Assignment → Skill Selection
```

Each stage narrows the possibility space. The goal is not perfect classification on the first pass — it is adaptive routing with constraints that corrects through probing.

---

## Stage 1: Signal Extraction

Extract signals from natural language. Signals fall into four categories:

### Action Signals (Verbs)

| Verb | Strength | Likely Group |
|------|----------|--------------|
| create, build, write, design | Strong | GROUP 2 |
| figure out, explore, brainstorm | Strong | GROUP 1 |
| coordinate, dispatch, orchestrate | Strong | GROUP 1 |
| plan, break down, organize | Strong | GROUP 1 |
| configure, set up, add | Medium | Ambiguous — needs context |
| combine, stack, chain | Medium | This skill (stacking) |
| improve, refactor, audit | Medium | GROUP 2 (if skill-related) |
| fix, debug, investigate | Medium | GROUP 1 (if process-related) |

### Entity Signals (Nouns)

| Noun | Maps To | Group |
|------|---------|-------|
| skill, SKILL.md, frontmatter | use-authoring-skills | GROUP 2 |
| agent, subagent, primary agent | use-authoring-agents | GROUP 2 |
| command, /my-command, template | use-authoring-commands | GROUP 2 |
| tool, custom tool, tool() | use-authoring-tools | GROUP 2 |
| workflow, automation, pipeline | use-authoring-workflows | GROUP 2 |
| session, context, memory | user-intent-interactive-loop | GROUP 1 |
| parallel, dispatch, handoff | coordinating-loop | GROUP 1 |
| plan, phase, checkpoint | planning-with-files | GROUP 1 |
| MCP, LSP, permission, config | OpenCode concepts | This skill |

### Modifier Signals (Adjectives/Adverbs)

| Modifier | Effect |
|----------|--------|
| "iterative", "loop", "keep going" | Reinforces GROUP 1 |
| "from scratch", "new", "first time" | Reinforces GROUP 2 |
| "multiple", "several", "batch" | Suggests coordinating-loop |
| "complex", "multi-step", "large" | Suggests planning-with-files |
| "quick", "simple", "just" | May skip routing — execute directly |

### Context Signals (Surrounding Phrases)

| Phrase | Interpretation |
|--------|----------------|
| "I'm not sure what I want" | → user-intent-interactive-loop (probe first) |
| "I have a clear spec" | → Skip probing, route to execution |
| "This will take a while" | → planning-with-files (persistent memory) |
| "Run these independently" | → coordinating-loop (parallel dispatch) |
| "Make it work across platforms" | → Universal terminology enforcement |

---

## Stage 2: Intent Classification

Combine signals into an intent classification. Use weighted scoring:

### Scoring Formula

```
GROUP 1 score = (action_signals × 2) + (entity_signals × 1) + (modifier_signals × 1)
GROUP 2 score = (action_signals × 2) + (entity_signals × 1) + (modifier_signals × 1)
```

The entity with the highest score wins. If scores are within 1 point of each other, the intent is ambiguous — probe the user.

### Classification Outcomes

| Outcome | Action |
|---------|--------|
| GROUP 1 wins by 2+ | Route to GROUP 1 skill |
| GROUP 2 wins by 2+ | Route to GROUP 2 skill |
| Tie or within 1 | Probe user for clarification |
| No clear signals | Default to user-intent-interactive-loop |

---

## Stage 3: Group Assignment

### GROUP 1: Implementation Skills

These skills govern HOW work gets done. They are process-oriented, not domain-oriented.

| Skill | When to Route | Key Trigger Phrases |
|-------|---------------|---------------------|
| `user-intent-interactive-loop` | User intent is unclear, session is long, brainstorming needed | "help me think", "what do you think", "keep going", "stay focused" |
| `coordinating-loop` | Multiple agents/tasks need coordination, parallel vs sequential decision | "run in parallel", "coordinate", "dispatch", "hand off" |
| `planning-with-files` | Task is complex, needs persistent memory, >5 tool calls | "plan this", "break it down", "multi-step", "complex" |

### GROUP 2: Domain Authoring Skills

These skills govern WHAT gets created. They are domain-oriented, not process-oriented.

| Skill | When to Route | Key Trigger Phrases |
|-------|---------------|---------------------|
| `use-authoring-skills` | Creating, auditing, or improving agent skills | "write a skill", "create SKILL.md", "skill authoring" |
| `use-authoring-agents` | Creating or configuring agents (future) | "create agent", "configure subagent", "agent definition" |
| `use-authoring-commands` | Creating custom commands (future) | "add command", "custom /command", "command template" |
| `use-authoring-tools` | Creating custom tools (future) | "build tool", "custom tool", "tool()" |
| `use-authoring-workflows` | Designing workflows (future) | "design workflow", "automation", "pipeline" |

### GROUP 3: Shared Concepts (This Skill)

These concepts are stackable knowledge that any skill can reference. They are not skills themselves — they are reference material.

| Concept | When to Reference |
|---------|-------------------|
| Agents | User asks about agent configuration, modes, permissions |
| Commands | User asks about command templates, arguments, shell output |
| Tools | User asks about built-in tools, permissions, custom tools |
| Skills | User asks about skill discovery, loading, permissions |
| Permissions | User asks about allow/deny/ask, patterns, external directories |
| Custom Tools | User asks about tool() helper, TypeScript tools, context |
| MCP Servers | User asks about MCP configuration, OAuth, local/remote |
| LSP Servers | User asks about language servers, code intelligence |
| Rules | User asks about AGENTS.md, instructions, precedence |
| Configs | User asks about opencode.json, precedence, variables |

---

## Stage 4: Skill Selection

Once the group is assigned, select the specific skill:

### Decision Tree

```
Is user intent clear?
  No → user-intent-interactive-loop (probe first)
  Yes → What domain?
    Skill creation → use-authoring-skills
    Agent configuration → use-authoring-agents
    Command creation → use-authoring-commands
    Tool creation → use-authoring-tools
    Workflow design → use-authoring-workflows
    Multi-agent coordination → coordinating-loop
    Complex planning → planning-with-files
    OpenCode config → This skill (reference concepts)
    Skill stacking → This skill (stacking rules)
```

### Stacking Decision

After selecting the primary skill, ask: does this task need complementary skills?

```
Does the task span multiple domains?
  No → Load primary skill only
  Yes → Are domains compatible?
    No → Handle sequentially, not stacked
    Yes → Load complementary skills (max 3 total)
```

---

## Probing Protocol

When intent is ambiguous, probe with targeted questions:

### Single-Question Probes

| Ambiguity | Probe |
|-----------|-------|
| Unclear domain | "Are you looking to create something new, or figure out how to approach existing work?" |
| Unclear scope | "Is this a single task or does it involve multiple pieces?" |
| Unclear urgency | "Should I start executing, or would you like to plan first?" |
| Unclear delegation | "Should I handle this directly, or would you prefer I coordinate subagents?" |

### Probe Discipline

- One question per turn unless the user invites more.
- Stop probing when the Agent can articulate intent back and the user confirms.
- Never probe more than 3 times — after that, make a best-effort classification and state assumptions.

---

## Routing Validation

After routing, validate the decision:

1. **Run `scripts/route-check.sh`** — confirms the target skill exists and is loadable.
2. **Check for conflicts** — ensure no other loaded skill claims the same trigger.
3. **Verify stacking compatibility** — if stacking, confirm no shared state mutation.
4. **Record the decision** — write routing decision to `progress.md` with timestamp.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User says "do everything" | Route to user-intent-interactive-loop first — scope is undefined |
| User references a skill that doesn't exist | Inform user, suggest closest match, offer to create it |
| User wants to modify an existing skill | Route to use-authoring-skills with audit mode |
| User wants platform-specific config | Route to this skill, apply universal terminology, note platform |
| User changes mid-session | Re-classify intent, update routing, log the change |
| Multiple users, multiple intents | Handle sequentially, not in parallel — each intent gets its own routing cycle |

---

## Cross-References

| Reference | Relationship |
|-----------|-------------|
| `references/02-opencode-concepts.md` | The 10 concepts that inform GROUP 3 routing |
| `references/03-stacking-rules.md` | How to combine skills after routing |
| `SKILL.md` (parent) | The routing table and core pattern |
| `user-intent-interactive-loop` | Sibling skill for probing when routing is ambiguous |
