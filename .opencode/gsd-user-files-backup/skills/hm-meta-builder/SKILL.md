---
name: hm-meta-builder
description: "Routes requests about OpenCode meta-concepts (skills, agents, commands, tools) to specialist authors. Classifies intent, navigates step-by-step, reports back. Use when creating, auditing, stacking, or configuring any OpenCode meta-concept. Triggers on: 'create a skill', 'audit this skill', 'build an agent', 'set up a command', 'stack skills', 'configure OpenCode', 'fix skill trigger', '/hf-create', '/hf-audit', '/hf-stack'."
metadata:
  layer: "0"
  role: "router"
  pattern: Navigation
  version: "4.0.0"
  lineage: "hivefiver"
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

## Overview

Routes requests about OpenCode meta-concepts (skills, agents, commands, tools) to the right specialist. Receives intent → classifies → navigates step-by-step → reports back. Does NOT create, edit, or execute domain work.

**When to load this skill:** The user wants to create, audit, stack, or configure any OpenCode meta-concept but hasn't gone directly to the specialist. This skill figures out what they need and routes them.

**When NOT to load this skill:** The user's request already matches a specialist skill directly (e.g., they said "audit this skill" and `use-authoring-skills` is available). Route directly instead.

### What This Skill Handles

| Concept | What Gets Produced (per agentskills.io spec) | Where It Lives |
|---------|---------------------------------------------|----------------|
| **Skills** | `SKILL.md` (required) + `scripts/` (optional) + `references/` (optional) + `assets/` (optional) | `.hivefiver-meta-builder/skills-lab/` → symlinked to `.opencode/skills/` |
| **Agents** | `.md` with YAML frontmatter, permissions, execution flows | `.hivefiver-meta-builder/agents-lab/` → symlinked to `.opencode/agents/` |
| **Commands** | Thin shells with `$ARGUMENTS` parsing, agent binding, CI=true safety | `.hivefiver-meta-builder/commands-lab/` → symlinked to `.opencode/commands/` |
| **Tools** | Zod schema designs, plugin hook patterns, lifecycle management | `.opencode/` config + `src/lib/` for custom tools |

### What This Skill Does NOT Handle

| Not This Skill | Route To Instead |
|----------------|-----------------|
| "Build a NextJS app" / "Add an API endpoint" | Project-building agents (Hiveminder lineage) |
| "Fix a TypeScript bug in src/" | Builder or critic agents |
| "Run the test suite" | Direct execution — no routing needed |
| "Explain how React hooks work" | Web search or direct answer |

## The Subject Matter

Meta-concepts are the building blocks of an OpenCode project. Skills teach expertise. Agents execute. Commands force action. Tools interact with the environment. This skill teaches agents how to create, audit, stack, and manage those building blocks effectively.

## Principles

- **Iterative few-step interactive** — one step, validate, show user, confirm, proceed. NOT autonomous long-horizon execution.
- **No direct execution** — route to specialists. Never create skills/agents/commands yourself.
- **Max 3 skills per stack** — context window is shared. If you can't explain why each skill is needed in one sentence, don't load it.
- **Standalone-first** — every meta-concept works with OpenCode alone. HiveMind runtime is bonus, not required.
- **Edit in labs, test via symlinks** — source of truth is `.hivefiver-meta-builder/**-lab/`. `.opencode/` is a symlink for live testing. Never edit `.opencode/` directly.

## On Load

1. **Load background skill** per the conditional table below — NOT all of them.

   | If user asks about... | Load this ONE skill |
   |----------------------|---------------------|
   | Agents, commands, tools, permissions | `opencode-platform-reference` |
   | Codebase analysis, repo exploration | `repomix-exploration-guide` |
   | Shell safety, non-interactive execution | `opencode-non-interactive-shell` |
   | Ambiguous intent, unclear scope | `user-intent-interactive-loop` |
   | Multi-step planning needed | `planning-with-files` |
   | Nothing specific yet | None — wait for routing decision |

2. **Read planning files if they exist:** `task_plan.md`, `findings.md`, `progress.md`.

3. **For skill stacking (max 3 per stack), MANDATORY** — read `references/04-skills-chaining.md` for loading order and composition rules.

4. **Understand the Hivefiver workspace:**

   | File | Why It Matters |
   |------|---------------|
   | `.hivefiver-meta-builder/AGENTS.md` | Agent team, delegation protocol, iron laws |
   | `.hivefiver-meta-builder/distinguish-hivefiver-meta-builder.md` | Entity boundaries (OpenCode / HiveMind / Hivefiver / Hiveminder) |
   | `.hivefiver-meta-builder/GENERAL-KNOWLEDGE.md` | Platform synthesis requirements, skill lineages |
   | `.hivefiver-meta-builder/ONBOARDING-WORKFLOW-PROTOCOL.md` | Onboarding protocol, skill stack, routing tree |
   | `.hivefiver-meta-builder/SKILLS-AGENTS-COMMANDS-TOOLS.md` | Core lexicon, execution dynamics |
   | `.hivefiver-meta-builder/updating-for-hivefiver-onboarding.md` | Misconceptions, prevention mechanisms |
   | `.hivefiver-meta-builder/workflows-lab/active/refactoring/` | Workflow source of truth |

## The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you can't explain why each skill is needed in one sentence, don't load it. Context window is shared — every unnecessary skill dilutes the ones that matter.

### What Agents Actually Rationalize

| What agents say | What they actually did | Reality |
|-----------------|----------------------|---------|
| "I'll load all the skills to be thorough" | Loaded 6+ skills, context blown, ignored all of them | Max 3. Load order matters. |
| "The routing table says route to X, but I think Y is better" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| "I can handle this myself, no need to delegate" | Edited files directly, broke patterns | meta-builder routes. It doesn't execute. |
| "I'll just edit the skill file directly" | Created skill that doesn't trigger | Delegate to skill-authoring. Always. |
| "I'll load find-skills to find similar skills first" | Spent context budget on vague self-referential search | Never use find-skills as a pre-creation rabbit hole. |
| "I'll read all 20 skill files at once for the audit" | Blew context, produced unusable report | Chunk audits. One phase at a time. |

## OpenCode Meta Concepts — Mind Map

Skills teach expertise. Agents execute. Commands force action. Tools interact with the environment. Workflows sequence steps. Permissions gate access. Rules constrain behavior. Configs wire it all together.

**Key relationships:**
- Skills are loaded by agents via the `skill` tool — progressive disclosure in action
- Commands bind to agents via `agent:` frontmatter — deterministic entry points
- Tools are invoked by agents during execution — bash, read, write, grep, glob, etc.
- Workflows are procedural files that agents execute step-by-step
- Permissions (in `opencode.json`) gate which tools each agent can use
- Rules (in `.opencode/rules/`) constrain agent behavior globally

### Example: An Agentic Workflow in Action

```
User: "Create a skill for deep research"
  ↓
Command: /hf-create skill=deep-research
  ↓
Agent: hivefiver-orchestrator loads meta-builder skill
  ↓
meta-builder routes to: use-authoring-skills (hivefiver-skill-author)
  ↓
Step 1: Write frontmatter → validate-skill.sh → show user → confirm
  ↓
Step 2: Write body → validate-skill.sh → show user → confirm
  ↓
Step 3: Create references/ → check-overlaps.sh → show user → confirm
  ↓
Step 4: Critic subagent review → fix issues → final validate → commit
  ↓
Result: Skill at .hivefiver-meta-builder/skills-lab/active/refactoring/deep-research/
        Symlinked to .opencode/skills/deep-research/ for live testing
```

## Domain Routing — When to Create What

| User Need | Create | Why | Example |
|-----------|--------|-----|---------|
| Persistent behavioral change across sessions | **Skill** | Teaches expertise, loaded on demand | "Teach the agent how to audit skills" |
| Autonomous execution with specific permissions | **Agent** | LLM + tools + permissions + memory | "Create a researcher that can web search but not edit files" |
| Deterministic one-shot action | **Command** | Bypasses reasoning, forces action | "Run the audit pipeline" |
| Environment interaction (API, DB, filesystem) | **Tool** | External function the LLM invokes | "Add a tool that queries our internal API" |
| Multi-step procedural logic | **Workflow** | Sequential steps executed by agents | "Onboarding flow: context load → skill activation → intent classification" |

## Power Tools — Built-in Capabilities Often Misused

These OpenCode built-in tools are the most powerful primitives for meta-builder work. Know them. Use them correctly. Reference their depth-skill files when needed.

### `question` — Gate Execution Before Acting

**What it does:** Presents structured choices to the user during execution. Each question has a header, text, and options. Users can select or type custom answers.

**Why it matters:** Setting `question: allow` in agent permissions **prevents execution before user approval**. The agent MUST stop and ask. This is the primary guardrail against autonomous long-horizon execution.

```json
{
  "permission": {
    "question": "allow",
    "edit": "ask",
    "bash": "ask"
  }
}
```

**When to use:** Before routing to a specialist, before committing changes, before loading skills beyond the max-3 limit.

### `todowrite` — Track Progress Visibly

**What it does:** Creates and updates task lists during complex operations.

**Why it matters:** Every meta-concept workflow ends with a TODO list showing completion status. This is Step 5 of the 5-step workflow.

```
- [ ] Frontmatter written and validated
- [ ] Body content complete
- [ ] References created
- [ ] Validation loop passed
- [ ] Committed to git
```

**Note:** Disabled for subagents by default. Enable manually when needed.

### `patch` — Apply Diffs Safely

**What it does:** Applies patch files to your codebase. Controlled by the `edit` permission (along with `edit`, `write`, `multiedit`).

**Why it matters:** When auditing and fixing skills across multiple files, patches are safer than full rewrites. They show exactly what changed.

**When to use:** Applying critic review fixes, syncing lab changes to `.opencode/` copies, updating frontmatter across multiple skills.

### `grep` + `glob` — Find Before You Read

**What they do:** `grep` searches file contents with regex. `glob` finds files by pattern. Both use ripgrep under the hood, respecting `.gitignore`.

**Why it matters:** Never read full files when frontmatter or specific sections are needed. Grep first, read only what's necessary.

```bash
# Find all skills with missing trigger phrases
grep -r "description:" .opencode/skills/*/SKILL.md | grep -v "Use when"

# Find all agent definitions with task: ask
grep -r '"task"' .opencode/agents/*.md
```

### `lsp` (experimental) — Code Intelligence

**What it does:** Interacts with LSP servers for definitions, references, hover info, call hierarchy. Requires `OPENCODE_EXPERIMENTAL_LSP_TOOL=true`.

**Why it matters:** When auditing TypeScript harness code (`src/`), use LSP to find all references to a function, trace imports, understand dependencies without reading every file.

### `skill` — Load Skills On Demand

**What it does:** Loads a SKILL.md file and returns its content in the conversation. This IS the routing mechanism.

**Why it matters:** When meta-builder routes to `use-authoring-skills`, it calls `skill({ name: "use-authoring-skills" })`. This is progressive disclosure in action.

### `webfetch` + `websearch` — External Knowledge

**What they do:** `webfetch` retrieves content from a specific URL. `websearch` searches the web via Exa AI.

**Why it matters:** Fetch canonical specs (agentskills.io/llms.txt), research GitHub repos for skill patterns, verify platform documentation is current.

**Tip:** Use `websearch` when you need to FIND information (discovery). Use `webfetch` when you need to RETRIEVE content from a known URL (retrieval).

---

### Quick Reference: Built-in Tool → Meta-Builder Use Case

| Tool | Meta-Builder Use Case | Permission |
|------|----------------------|------------|
| `question` | Gate execution before user approval | `allow` |
| `todowrite` | Track workflow completion (Step 5) | `allow` |
| `patch` | Apply audit fixes safely | `ask` |
| `grep` | Find patterns across skills/agents/commands | `allow` |
| `glob` | Locate files by pattern | `allow` |
| `skill` | Load specialist skills for routing | `allow` |
| `webfetch` | Fetch canonical specs, platform docs | `allow` |
| `websearch` | Research GitHub repos for patterns | `allow` |
| `lsp` | Trace references in TypeScript harness code | `allow` (experimental) |
| `read` | Read specific file sections (offset/limit) | `allow` |
| `bash` | Run validation scripts (`validate-skill.sh`) | `allow` |
| `edit` | Modify skill/agent/command files | `ask` |
| `write` | Create new skill/agent/command files | `ask` |

## 5-Step Workflow

Every meta-builder request follows this workflow. Set up a TODO list as the final step.

```
Step 1: RECEIVE INTENT
  - Classify against routing table below
  - If ambiguous → load user-intent-interactive-loop
  - If clear → proceed to Step 2

Step 2: LOAD BACKGROUND SKILLS
  - Load ONE skill per the On Load conditional table
  - Load ONE specialist skill matching the intent
  - Max 3 total skills loaded (including meta-builder)
  - Document WHY each skill is needed in one sentence

Step 3: NAVIGATE TO SPECIALIST
  - Route to the specialist agent per routing table
  - Construct exact context: task text + scene-setting + scope
  - NEVER pass session history to subagents
  - Await specialist output

Step 4: VALIDATE OUTPUT
  - Stage 1: Spec compliance — does output match requirements?
  - Stage 2: Quality — well-built? clean? following patterns?
  - If FAIL → return to specialist with specific feedback
  - If PASS → proceed to Step 5

Step 5: TODO LIST + DESIGN SPEC
  - Create todowrite list showing completion status
  - Write design spec: what was done, where it lives, how to test
  - Commit to git with descriptive message
  - Report to user: what was created, next steps
  - Await user confirmation before advancing
```

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
| "help me figure out", "I'm not sure", ambiguous | `user-intent-interactive-loop` | `intent-loop` | Clarify before routing |
| `/hf-create` | `use-authoring-skills` | `hivefiver-skill-author` | Hivefiver command |
| `/hf-audit` | `use-authoring-skills` | `hivefiver-skill-author` | Hivefiver command |
| `/hf-stack` | `meta-builder` + target skills | self (orchestrate) | Hivefiver command |

**Fallback:** If a specialist skill is missing or broken → use `opencode-platform-reference` for research, report findings, recommend manual creation.

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.

## Stacking Recipes

Max 3 skills per stack. If you can't explain why each skill is needed in one sentence, don't load it.

| User Intent | Stack | Why |
|-------------|-------|-----|
| "Create a skill + command for it" | use-authoring-skills + command-dev | Skill creation + command wrapper |
| "Build an agent + custom tool" | agents-and-subagents-dev + custom-tools-dev | Agent def + tool implementation |
| "Audit this skill" | use-authoring-skills | Domain skill for skill quality |
| "Deep research on X" | opencode-platform-reference + coordinating-loop | SDK patterns + subagent dispatch |
| "Synthesize a skill + validate it" | skill-synthesis + use-authoring-skills | Synthesis + validation gate |
| "Analyze a GitHub repo for skill patterns" | repomix-explorer + skill-synthesis + coordinating-loop | Repo packing + pattern extraction + parallel audit |

For loading order details, MANDATORY — read `references/04-skills-chaining.md`.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Hoarder** — loading 4+ skills "to be safe" | Context blown, skills ignored | Max 3. If you can't explain why each is needed, don't load it. |
| **The Improviser** — "routing table says X but I'll do Y" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |
| **The Dead Referrer** — routing to a skill that doesn't exist | `ls .opencode/skills/<name>/SKILL.md` fails | Check file exists before routing. Use fallback. |
| **The Lab Ignorer** — editing `.opencode/` directly | Changes not in `.hivefiver-meta-builder/**-lab/` | Edit in labs → test via symlinks → commit. |
| **The Script Forgetter** — having scripts but never running them | `ls scripts/` has files, SKILL.md never references them | Reference scripts in workflow steps. Run them. |
| **The Long-Horizon Drifter** — running 10 steps autonomously | No user confirmation between steps | One step → validate → show → confirm → proceed. |

## Question Discipline

- **Max 3 questions per session.** Not 4. Not "just one more."
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- After 3 questions, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- Never ask questions when the routing table already determines a clear path.

## Reference Map

| File | Loading Trigger | What It Contains |
|------|-----------------|-----------------|
| `references/01-mindsnetwork-graph.md` | **MANDATORY** for 3-skill stacks with cross-dependencies | Node types, edge types, graph traversal algorithm, JSON schema |
| `references/02-deterministic-control.md` | **MANDATORY** when routing decision is ambiguous between 2+ table entries | Pre/during/post execution protocol, rollback rules, retry strategy |
| `references/03-long-horizon-persistence.md` | Read when task spans sessions or involves subagent delegation | Session recovery, checkpoint protocol, context handoff |
| `references/04-skills-chaining.md` | **MANDATORY** before any stack operation | Loading order, composition rules, anti-patterns, worked examples |
| `assets/skill-frontmatter.md` | When creating a new skill | YAML skeleton + description formula + trigger phrase template |
| `assets/agent-frontmatter.md` | When creating a new agent | YAML skeleton + permissions model + delegation config |
| `assets/command-frontmatter.md` | When creating a new command | YAML skeleton + $ARGUMENTS pattern + bash injection safety |
| `workflows/skill-creation-flow.md` | When routing to skill creation | Step-by-step: intent → pattern → frontmatter → body → validate |
| `workflows/agent-creation-flow.md` | When routing to agent creation | Step-by-step: role → tools → permissions → delegation → validate |
| `workflows/command-creation-flow.md` | When routing to command creation | Step-by-step: intent → arguments → agent binding → shell safety → validate |
| `references/depth-built-in-tools.md` | Read when needing specific built-in tool usage patterns for meta-builder work | Tool-specific guides with examples and permission recommendations |
| `references/depth-github-stacks.md` | Read when composing skills from GitHub repos into stacks | GitHub stacking patterns, loading order, composition rules |
| `references/depth-repo-analysis.md` | Read when analyzing repos for meta-concept extraction | repomix patterns, grep strategies, token efficiency |
| `references/depth-skill-synthesis.md` | Read when ingesting skills from remote repos | GitHub ingestion pipeline, error handling, shell safety |

**Do NOT load** references/01-03 for simple routing tasks. Only load when the task requires graph traversal, state machine execution, or cross-session persistence.

## Pattern Research (Deferred)

**Deferred to implementation plan.** The agent executing the refactor will run `find-skills` to discover 3 collaborative meta-skills, extract their patterns, and adapt them to meta-builder's context. Do NOT run this during normal meta-builder operation.

---

## Validation Gate

Before declaring any meta-concept task complete:

- [ ] Output matches requirements (nothing extra, nothing missing)
- [ ] Route-check passes (`bash scripts/route-check.sh`)
- [ ] Graph validation passes (`bash scripts/validate-graph.sh`)
- [ ] No dead references (all referenced files exist on disk)
- [ ] No stub scripts (all scripts have real validation logic)
- [ ] Trigger phrases present in description (for skills)
- [ ] Non-interactive shell safe (for commands)
- [ ] Permissions explicit (for agents)
- [ ] Committed to git with descriptive message
- [ ] TODO list created showing completion status
- [ ] User has confirmed delivery
