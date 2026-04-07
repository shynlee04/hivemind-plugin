---
name: meta-builder
description: >
  Use when creating, editing, auditing, or combining agent skills, commands,
  tools, or platform configurations. Routes user intent to specialist skills
  through step-by-step navigation. Triggers on "create a skill", "build an
  agent", "build me a skill like this @file", "configure OpenCode", "stack
  skills", "synthesize skills", "create skills from GitHub repos", "audit
  skill", "fix skill trigger", "my skill doesn't load", "help me figure out",
  "I'm not sure what I need", "convert this to a skill", "migrate this command",
  "customize my meta concepts", "fix my agents, commands, and skills".
metadata:
  layer: "0"
  role: "router"
  pattern: Navigation
  version: "3.2.0"
  lineage: "meta-builder"
  hierarchy: "coordinator"
  orientation: "how-to-process"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
---

# meta-builder

Routes meta-concept requests to the right specialist skill through step-by-step navigation. This skill navigates — it does not execute domain work. If you catch yourself editing skill files directly, STOP and delegate to `use-authoring-skills`.

## On Load

1. **If user provided @file:** READ it first. Extract patterns, structure, intent. THEN classify.
2. **Load background skill** relevant to the routing decision (e.g. `opencode-platform-reference` for agent/command/tool questions).
3. **Read planning files if they exist:** `task_plan.md`, `findings.md`, `progress.md`.
4. For skill stacking (max 3 per stack), MANDATORY — READ `references/04-skills-chaining.md` for loading order and composition rules.

## Navigation Protocol — Multi-Step, Not One-Hop

```
INGEST → CLASSIFY → ROUTE → MONITOR → REPORT
```

### Step 1: INGEST — Read What the User Provided

- If @file referenced: READ it. Extract: what meta-concept type, what patterns, what's missing.
- If wall of text: SKIM. Count entities, identify structure. Do NOT read everything.
- If folder dump: LIST files. Identify types (SKILL.md, agent .md, command .md).
- If no file: Ask what they're working with.

### Step 2: CLASSIFY — Match to Routing Table

Classify the request. If ambiguous, the routing is to `user-intent-interactive-loop` for clarification.

### Step 3: ROUTE — Dispatch to Specialist

Build full context packet: user intent + file content (if any) + constraints.
Delegate to specialist with complete context. Never pass "read the file yourself."

### Step 4: MONITOR — Track Progress

After delegation: check status (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED).
If specialist fails: read the error, identify what went wrong, either fix and retry or take over.

### Step 5: REPORT — What Was Done, What's Next

Summarize: what was accomplished, what's next, any blockers.
Commit atomically: each completed step gets its own git commit.

### Standalone Fallback — When Specialist Skills Don't Exist

If the target specialist skill is not available:
1. Read the specialist's reference files directly from the lab directory
2. Follow the procedures in those references
3. Report findings to the user
4. Do NOT block. Do NOT error. Navigate with what you have.

## The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you can't explain why each skill is needed, don't load it. Context window is shared — every unnecessary skill dilutes the ones that matter.

### What agents actually rationalize

| What agents say | What they actually did | Reality |
|-----------------|----------------------|---------|
| "I'll load all the skills to be thorough" | Loaded 6+ skills, context blown, ignored all of them | Max 3. Load order matters. |
| "The routing table says route to X, but I think Y is better" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| "I can handle this myself, no need to delegate" | Edited files directly, broke patterns | meta-builder routes. It doesn't execute. |
| "I'll just edit the skill file directly" | Created skill that doesn't trigger | Delegate to skill-authoring. Always. |

## Routing Table

| User Intent | Route To | Specialist Agent | Notes |
|-------------|----------|-----------------|-------|
| "create a skill" | `use-authoring-skills` | `hivefiver-skill-author` | |
| "create a skill like this @file" | `use-authoring-skills` + `skill-creator` | `hivefiver-skill-author` | File-referenced creation |
| "audit this skill" | `use-authoring-skills` | `hivefiver-skill-author` | |
| "create an agent" | `agents-and-subagents-dev` | `hivefiver-agent-builder` | |
| "set up a command" | `command-dev` | `hivefiver-command-builder` | |
| "build a custom tool" | `custom-tools-dev` | `hivefiver-tool-builder` | |
| "configure OpenCode" | `opencode-platform-reference` | self (research + report) | |
| "stack skills" / "combine skills" | `meta-builder` + target skills | self (orchestrate) | Max 3 per stack |
| "synthesize skills" / "create skills from GitHub" | `skill-synthesis` | `meta-synthesis-agent` | Synthesis from repos |
| "help me figure out", "I'm not sure", ambiguous intent | `user-intent-interactive-loop` | `intent-loop` | Clarify before routing |

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.

## Stacking Recipes

Max 3 skills per stack. If you can't explain why each skill is needed, don't load it.

| User Intent | Stack | Why |
|-------------|-------|-----|
| "Create a skill + command for it" | use-authoring-skills + command-dev | Skill creation + command wrapper |
| "Build an agent + custom tool" | agents-and-subagents-dev + custom-tools-dev | Agent def + tool implementation |
| "Audit this skill" | use-authoring-skills | Domain skill for skill quality |
| "Deep research on X" | opencode-platform-reference + coordinating-loop | SDK patterns + subagent dispatch |
| "Synthesize a skill + validate it" | skill-synthesis + use-authoring-skills | Synthesis + validation gate |

For loading order details, MANDATORY — READ `references/04-skills-chaining.md`.

## Question Discipline

- **Max 3 questions per session.**
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- After 3 questions, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- Never ask questions when the routing table already determines a clear path.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Hoarder** — loading 4+ skills "to be safe" | Context blown, skills ignored | Max 3. If you can't explain why each is needed, don't load it. |
| **The Improviser** — "routing table says X but I'll do Y" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |

## Reference Map

| File | Loading Trigger |
|------|-----------------|
| `references/01-mindsnetwork-graph.md` | MANDATORY before any multi-skill stack or routing synthesis requests — dependency context |
| `references/02-deterministic-control.md` | Read when deterministic routing is needed |
| `references/03-long-horizon-persistence.md` | Read for multi-session tasks |
| `references/04-skills-chaining.md` | MANDATORY before any stack operation — loading order, composition rules |
