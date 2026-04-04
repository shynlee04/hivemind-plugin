# Spec: HiveMind 5-Skill Architecture — Knowledge-First Rewrite

> **Date:** 2026-04-05
> **Status:** Draft v2 — rewritten from knowledge up, not pattern down
> **Author:** Coordinator (post skill-judge evaluation)

---

## Goal

Build 5 skills where each one captures knowledge that took real sessions to learn — not formatting patterns applied mechanically. Meta-builder routes to the other 4 as its team. Commands come AFTER, built by meta-builder using skills as stacking glue.

---

## What Went Wrong in v1

The first spec treated Iron Laws, rationalization tables, and Good/Bad blocks as **formatting templates** to apply to every skill. That's not what they are.

- TDD's Iron Law works because developers constantly rationalize away from it ("just this once"). The table lists **actual excuses** developers make.
- Subagent-driven-development's workflow works because it shows a **real conversation** — implementer asks, controller answers, reviewer finds gap, implementer fixes. It's a recording of how the cycle plays out.
- The brainstorming skill works because it has a HARD-GATE that stops agents from jumping to implementation.

**v1 had none of this.** It had placeholders that looked like the pattern but contained no actual knowledge. This rewrite fixes that.

---

## Skill 1: meta-builder (IMPROVE existing)

**Shape:** Navigation — thin SKILL.md that routes to stacking recipes. The value is in knowing WHICH skills combine for WHICH user intent.

### What meta-builder actually needs to know

**Not a routing table.** A routing table says "user says X → route to skill Y." That's table lookup, not intelligence.

**Stacking recipes.** Real user intents need multiple skills combined:

```
User: "Add a command that generates AGENTS.md files for every directory"
→ meta-builder recognizes: this is command + agent convention + file generation
→ Stacks: command-dev (command structure) + agents-and-subagents-dev (agent def patterns) + skill-authoring (AGENTS.md convention)
→ Dispatches: researcher (scan existing patterns) → builder (implement) → critic (verify)

User: "Create a skill that audits other skills"
→ meta-builder recognizes: skill creation + validation
→ Stacks: skill-authoring (creation) + command-dev (for /audit command)
→ Dispatches: skill-authoring subagent with audit scope

User: "Build a custom tool that validates hook configurations"
→ meta-builder recognizes: tool creation + validation logic
→ Stacks: custom-tools-dev (tool architecture) + skill-authoring (if it needs a skill too)
→ Dispatches: custom-tools-dev subagent

User: "Set up an agent that does deep research"
→ meta-builder recognizes: agent definition + research methodology
→ Stacks: agents-and-subagents-dev (agent def) + opencode-platform-reference (SDK patterns)
→ Dispatches: agents-and-subagents-dev subagent
```

### The Iron Law

```
NO STACK WITHOUT A REASON
```

Max 3 skills per stack. If you can't explain why each skill is needed, don't load it. Context window is shared — every unnecessary skill dilutes the ones that matter.

### What agents actually rationalize (from session exports)

| What agents say | What they actually did | Reality |
|-----------------|----------------------|---------|
| "I'll load all the skills to be thorough" | Loaded 6+ skills, context blown, ignored all of them | Max 3. Load order matters. |
| "The routing table says route to X, but I think Y is better" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| "I can handle this myself, no need to delegate" | Edited files directly, broke patterns | meta-builder routes. It doesn't execute. |
| "I'll just edit the skill file directly" | Created skill that doesn't trigger | Delegate to skill-authoring. Always. |

### Anti-patterns (from real sessions)

| Pattern | What it looks like | Evidence |
|---------|-------------------|----------|
| **The Hoarder** | Loads 4+ skills "to be safe" | ses_2ae8: loaded 6 skills, used 0 |
| **The Improviser** | "Routing table says X but I'll do Y" | ses_2a77: routed to wrong skill, task failed |
| **The Executor** | meta-builder edits files directly | Multiple sessions: coordinator implementing instead of routing |

### What gets removed

- All script references (graph-init.sh, validate-graph.sh, state-persist.sh, register-skill.sh, route-check.sh, graph-traverse.sh)
- graph.json and .meta-builder/ directory
- MINDNETWORK references
- "Graph structure" and "node-based graph" — this is fiction, not reality

### What stays and gets improved

- Routing table → expanded with stacking recipes (the real value)
- Skills chaining → replaced with stacking recipes section
- Question discipline → keep, it works
- Anti-patterns → replace with real session evidence

---

## Skill 2: skill-authoring (IMPROVE existing use-authoring-skills)

**Shape:** Iron Law — like TDD but for skill creation. The discipline is about TRIGGERS, not structure.

### The Iron Law

```
NO SKILL WITHOUT TRIGGER PHRASES IN THE DESCRIPTION
```

The description is the ONLY thing the agent sees before deciding to load a skill. If it doesn't contain specific phrases a user would say, the skill is invisible. Dead on arrival.

**Not "the description should be good."** The description IS the skill. Without it, nothing else matters.

### What agents actually rationalize (from session exports)

| What agents say | Reality |
|-----------------|---------|
| "The description is clear enough" | It says "provides guidance for skill development." Agent will never load it. |
| "I'll add trigger phrases later" | Later never comes. The skill sits dead until someone audits it. |
| "The references are too long, I'll summarize" | References ARE the value. SKILL.md points to them. Summarizing = losing knowledge. |
| "This skill needs another skill to work" | Standalone contract. Push to load, don't require. If it can't work alone, it's not a skill — it's a chapter. |
| "The script stub exits 0 so validation passes" | A stub that always passes is a lie. Remove it or make it real. |
| "I'll keep the dead reference, it might be useful later" | Dead references are debt. The agent will try to load them, fail, and move on. |

### Good/Bad: Description (real examples from this codebase)

**Bad (current meta-builder):**
```yaml
description: "Routes meta-concept requests to the right specialist skill."
```
No trigger phrases. No scenarios. Agent sees this and thinks "maybe later."

**Good:**
```yaml
description: This skill should be used when the user asks to "create a skill", "add a skill", "write a new skill", "improve skill description", "audit this skill", "organize skill content", "create an agent", "set up a command", "build a custom tool", "configure OpenCode", "stack skills"
```
Every phrase is something a user would actually say. Agent sees "create a skill" → loads this skill.

### Good/Bad: Scripts

**Bad (current use-authoring-skills):**
```bash
#!/bin/bash
# validate-gate.sh
exit 0  # Always passes
```
This is a lie. It tells the agent "validation passed" when nothing was validated.

**Good (from coordinating-loop):**
```bash
#!/bin/bash
# validate-envelope.sh — 75 lines, actually greps for sections
grep -q "## Task Description" "$1" || { echo "MISSING: Task Description"; exit 1; }
grep -q "## Context" "$1" || { echo "MISSING: Context"; exit 1; }
# ... actual validation
```
This fails when it should fail. It tells the truth.

### Validation Gate (enforced in SKILL.md text, not scripts)

Before a skill is done:
- [ ] Description has trigger phrases (specific things users would say)
- [ ] Description uses third person
- [ ] SKILL.md body uses imperative form
- [ ] SKILL.md is lean (1,500-2,000 words, <5k max)
- [ ] All referenced files exist and have real content (not stubs)
- [ ] No script stubs that exit 0 always
- [ ] No dead references to files/scripts that don't exist
- [ ] Works standalone — doesn't require other HiveMind skills

### What gets removed

- validate-gate.sh (always exits 0 — a lie)
- check-overlaps.sh (placeholder — no content)
- Any script that doesn't actually validate something

### What stays

- All 12 reference files (01-skill-anatomy through 12-anti-deception) — these ARE the value
- templates/ directory — real templates, not stubs

---

## Skill 3: command-dev (NEW)

**Shape:** Checklist + Worked Example — like the implementer prompt. The value is non-interactive shell awareness and command anatomy.

### The Iron Law

```
EVERY COMMAND THAT RUNS SHELL OPERATIONS MUST SURVIVE CI=true
```

OpenCode runs agents in a headless non-interactive shell. No TTY. No prompts. `git commit` without `-m` hangs forever. `npm install` without `--yes` hangs forever. Every command must work with `CI=true` set.

### What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll use git commit and the agent will fill in the message" | Hangs. No TTY for interactive commit. | Always use `-m "message"`. |
| "The agent can handle the npm prompt" | Hangs. No stdin for interactive prompts. | Always use `--yes` or `npm_config_yes=true`. |
| "vim is fine for quick edits" | Hangs. No TTY for editors. | Use Write/Edit tools, never vim/nano/less. |
| "The command will work in the TUI" | Commands run in headless shell, not TUI. | Test mentally: would this hang without a terminal? |

### Non-Interactive Shell Mandates (embedded from canonical reference)

**Environment variables that must be assumed:**
```
CI=true
DEBIAN_FRONTEND=noninteractive
GIT_TERMINAL_PROMPT=0
GIT_EDITOR=true
GIT_PAGER=cat
PAGER=cat
GCM_INTERACTIVE=never
```

**Banned commands (will hang indefinitely):**
- Editors: `vim`, `vi`, `nano`, `emacs`
- Pagers: `less`, `more`, `man`
- Interactive git: `git add -p`, `git rebase -i`, `git commit` (without -m)
- REPLs: `python`, `node` (without -c or script file)
- Interactive shells: `bash -i`, `zsh -i`

### Command Anatomy (what every command MUST have)

```markdown
---
description: "[Specific — shown in TUI. Must include what it does AND when to use it]"
agent: [which agent runs this — must match an existing agent name]
subtask: [true = spawns subagent, false = runs in main session]
---

## Current State
!`git status --short`
!`git log --oneline -5`

## Your Job
1. Load the right skills (specify which ones)
2. [Procedural steps — what to do]
3. [Verification — how to know it worked]

## Anti-Patterns (DO NOT)
- Do NOT [specific thing that breaks in non-interactive shell]
- Do NOT [specific thing that breaks the command pattern]
```

### Worked Example: /deep-tech-research

```markdown
---
description: "Deep technical research on any topic. Auto-selects investigation depth and spawns research subagents. Use when you need comprehensive research, architecture analysis, or cross-stack investigation."
agent: coordinator
subtask: true
---

You are running deep research on: $ARGUMENTS

## Current State
!`git log --oneline -5`
!`ls task_plan.md findings.md progress.md 2>/dev/null || echo "No planning files"`

## Your Job

1. **Load skills:**
   - Load `planning-with-files` — create investigation triplet
   - Load `user-intent-interactive-loop` — probe if topic is ambiguous (max 3 questions)
   - Load `coordinating-loop` — for multi-subagent dispatch

2. **Classify investigation depth:**
   - QUICK (1 subagent): narrow topic, 1-2 files → dispatch one researcher
   - STANDARD (2-3 subagents): spans multiple domains → parallel researchers, synthesize
   - DEEP (multi-cycle): cross-stack analysis → plan phases, dispatch per phase

3. **Dispatch subagents using investigator template from coordinating-loop references**

4. **After each subagent returns:**
   - Write findings to findings.md
   - Check status: DONE → continue, BLOCKED → assess and escalate

5. **Final synthesis:**
   - Combine all findings into findings.md
   - Report: summary, key findings, resources, gaps remaining

## Anti-Patterns (DO NOT)
- Do NOT investigate yourself — delegate to subagents
- Do NOT pass session history to subagents — construct exact context
- Do NOT skip writing findings to disk
- Do NOT claim completion without evidence — cite file:line or URL
```

### Validation Gate

- [ ] Frontmatter has description + agent fields
- [ ] Description is specific (not "helps with X")
- [ ] Uses $ARGUMENTS if command takes user input
- [ ] All bash uses non-interactive flags (--yes, -f, --no-pager)
- [ ] No banned commands (vim, less, git commit without -m)
- [ ] Anti-patterns section lists what NOT to do
- [ ] Skill loading section specifies which skills to load

---

## Skill 4: agents-and-subagents-dev (NEW)

**Shape:** Flow + Status Protocol — like subagent-driven-development. The value is delegation discipline and worktree control.

### The Iron Law

```
NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT
```

Never pass session history to a subagent. Never say "read the plan file." Construct exactly what they need: full task text, scene-setting context, scope boundaries. Fresh context per task = no pollution.

### What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll dispatch the subagent with the plan file path" | Subagent reads file, loses context, implements wrong thing | Paste full task text into the prompt. Always. |
| "The subagent can figure out the context" | Subagent guesses, guesses wrong, builds wrong thing | Scene-setting is the controller's job. |
| "I can run this in the main session, it's simple" | Main session context polluted, forgets original goal | Delegate. Always delegate. |
| "I'll run parallel subagents for speed" | They conflict on the same files, one overwrites the other | Parallel only for independent tasks (no shared files). |
| "The subagent said DONE, I'll trust it" | Subagent completed but missed edge cases | Two-stage review: spec compliance first, then quality. |
| "I don't need worktree isolation for this" | Changes bleed into main branch, can't rollback | Worktree is non-negotiable for implementation work. |

### Delegation Protocol (the actual cycle)

```
1. Before dispatch:
   - Ensure task_plan.md has the subagent's scope as a phase
   - Extract full task text (not file path)
   - Construct context: where this fits, dependencies, what to look for

2. Dispatch envelope:
   Task tool (builder/researcher/critic):
     description: "Task N: [name]"
     prompt: |
       You are [role]. Your task: [FULL TASK TEXT]
       
       ## Context
       [Scene-setting — where this fits, why it matters]
       
       ## Scope
       - Include: [specific files/paths]
       - Exclude: [what NOT to touch]
       
       ## Output Format
       - Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
       - [Specific output requirements]

3. After return:
   - Check status
   - DONE → proceed to review
   - DONE_WITH_CONCERNS → read concerns, address before review
   - NEEDS_CONTEXT → provide missing context, re-dispatch
   - BLOCKED → assess: context? reasoning? size? plan wrong?

4. Review (two-stage):
   - Stage 1: Spec compliance — does it match requirements?
   - Stage 2: Code quality — is it well-built?
   - Stage 1 MUST pass before Stage 2
```

### Status Protocol (what each status actually means)

| Status | What it means | Controller action |
|--------|--------------|-------------------|
| DONE | Task complete, verified by subagent | Proceed to spec review |
| DONE_WITH_CONCERNS | Complete but subagent has doubts | Read concerns. If about correctness → address before review. If observation → note and proceed. |
| NEEDS_CONTEXT | Subagent hit a knowledge gap | Provide the missing context. Re-dispatch. |
| BLOCKED | Subagent cannot proceed | Assess: context gap? needs stronger model? task too big? plan wrong? |

**Never** force the same model to retry without changes. If the subagent said it's stuck, something needs to change.

### Worktree Control

From session evidence, agents fail when they can't control isolation:

- Fork a session to multiple → start at any turn
- Start in parallel different kinds of task
- If not controlling git worktree → mostly failure

**The rule:** Implementation work happens in worktrees. Main branch is for integration only.

### Validation Gate

- [ ] Agent has clear role (one sentence)
- [ ] Permissions are explicit (read/edit/write/bash/task/skill)
- [ ] Temperature and model are specified
- [ ] No overlap with existing agents' responsibilities
- [ ] Delegation envelope pattern is documented
- [ ] Status protocol is embedded (not referenced externally)
- [ ] Worktree control is addressed

---

## Skill 5: custom-tools-dev (NEW)

**Shape:** Good/Bad + Verification — like TDD but for tools. The value is Zod schemas, plugin lifecycle, and the script rule.

### The Iron Law

```
NO TOOL WITHOUT A ZOD SCHEMA
```

Every custom tool validates arguments with Zod. No `any` types. No unvalidated input. Schema first, implementation second. If you can't define the schema, you don't understand the tool.

### What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll use z.any() and validate in the function" | Type safety lost. Agent can't see what the tool expects. | Zod schema IS the interface. If it's z.any(), there's no interface. |
| "The tool does many things, one schema won't cover it" | Tool is too broad. Split it. | One tool = one thing. Multiple things = multiple tools. |
| "I'll put business logic in the plugin layer" | Plugin layer becomes the app. Violates architecture. | Plugin layer is assembly only (<100 LOC). Business logic goes in tools. |
| "The script can mutate state directly" | State mutation outside CQRS tools = unpredictable behavior. | Scripts report facts. Tools mutate state. Never the reverse. |
| "I'll hardcode the state directory path" | Breaks on different machines, different users. | Use environment variables or config. No hardcoded paths. |

### Good/Bad: Tool Definition

**Bad:**
```typescript
const myTool = tool({
  name: "my-tool",
  description: "Does many things",
  parameters: z.any(),
  execute: async (args: any) => {
    // implementation with no type safety
  },
});
```

**Good:**
```typescript
const myTool = tool({
  name: "audit-skill",
  description: "Audit a skill at the given path and return findings",
  parameters: z.object({
    skillPath: z.string().min(1).describe("Path to the skill directory"),
    checks: z.array(z.enum(["frontmatter", "triggers", "references", "scripts"])).optional(),
  }),
  execute: async ({ skillPath, checks = ["frontmatter", "triggers", "references", "scripts"] }) => {
    // implementation
  },
});
```

### Plugin Lifecycle

```
init → register tools/hooks → event loop → shutdown
```

- Tools are write-side (mutate state)
- Hooks are read-side (observe events)
- Plugin layer is thin (<100 LOC assembly only)
- No business logic in plugin layer

### The Script Rule

```
A script should REPORT FACTS and LEAVE JUDGMENT TO THE AGENT.
```

Pure helpers only (exit 0, no governance). No hardcoded paths. No state mutation outside CQRS tools. If a script makes decisions, it's not a script — it's an agent, and agents belong in SKILL.md.

### Validation Gate

- [ ] Tool has Zod schema for all parameters
- [ ] No `any` types in tool definition
- [ ] Tool does one thing (name matches behavior)
- [ ] Plugin layer is thin (<100 LOC)
- [ ] No business logic in plugin layer
- [ ] CLI scripts report facts only (exit 0, no governance)
- [ ] No hardcoded paths in scripts

---

## Execution Order

1. **meta-builder** — remove dead refs, add stacking recipes, fix anti-patterns with real evidence
2. **skill-authoring** — remove stub scripts, add Iron Law for triggers, fix rationalization table with real excuses
3. **command-dev** — new skill, non-interactive shell mandates, worked command example
4. **agents-and-subagents-dev** — new skill, delegation protocol, status handling, worktree control
5. **custom-tools-dev** — new skill, Zod schemas, plugin lifecycle, script rule

One skill at a time. Fix, verify, commit, move on.

---

## Per-Skill Build Cycle

```
1. Audit current state — what's real vs fake (from session exports, not assumptions)
2. Load stack: skill-creator + skill-judge + skill-development
3. Delegate to subagent with focused scope
4. Subagent identifies real failures
5. Fix iteratively, one at a time
6. Verify: standalone, no dead refs, enforcement in SKILL.md text
7. Commit → move to next
```

Stacking pattern: `[P## User /Skill Development (load together with skill-creator, skill-judge, writing skills)`

---

## What Commands Look Like (AFTER skills are built)

Commands are human entry points. Built by meta-builder using the 4 domain skills as building blocks.

**Example: /deep-tech-research** — shown in command-dev section above.

**Example: /investigate-codebase**
```markdown
---
description: "Investigate any part of the codebase. Auto-selects depth and spawns exploration subagents. Use when you need to understand architecture, find patterns, or trace dependencies."
agent: coordinator
subtask: true
---

You are investigating: $ARGUMENTS

## Current State
!`git log --oneline -5`
!`find . -name "*.ts" -not -path "*/node_modules/*" | wc -l`

## Your Job
1. Load planning-with-files, user-intent-interactive-loop, coordinating-loop
2. Classify: QUICK (1-2 files) / STANDARD (module) / DEEP (cross-stack)
3. Dispatch explore subagents with investigator template
4. Synthesize findings → findings.md
5. Report: summary, file:line references, gaps
```

The command IS the stacking glue. Meta-builder builds it using the skills.

---

## Anti-Patterns (Global — from real session evidence)

| Pattern | What it looks like | Evidence |
|---------|-------------------|----------|
| **The Copy-Paster** | Every SKILL.md has same Iron Law + rationalization table structure | v1 of this spec — mechanical pattern application |
| **The Bash Relier** | Enforcement in scripts that don't run or always pass | validate-gate.sh exits 0, check-overlaps.sh is placeholder |
| **The Dead Referrer** | References files/scripts that don't exist | meta-builder: graph-init.sh, validate-graph.sh, MINDNETWORK |
| **The Assumption Maker** | "This should work" without checking session exports | Multiple sessions: agents assuming skills work, then ignoring them |
| **The Big-Bang Rewriter** | Rewrite everything at once | Rejected spec v1 (448 lines, overengineered) |
| **The Hoarder** | Loads 4+ skills "to be safe" | ses_2ae8: loaded 6 skills, used 0 |
| **The Executor** | Router implements instead of routing | Multiple sessions: coordinator editing files directly |

---

## Success Criteria

- [ ] All 5 skills work standalone (drop into `.opencode/skills/` and function)
- [ ] No dead references (no scripts/files that don't exist)
- [ ] No bash stubs that exit 0 always
- [ ] Enforcement in SKILL.md text (Iron Laws with real rationalizations, not placeholders)
- [ ] Each skill has unique shape (meta-builder=Navigation, skill-authoring=Iron Law, command-dev=Checklist+Example, agents-dev=Flow+Status, custom-tools=Good/Bad+Verification)
- [ ] meta-builder has stacking recipes (not just routing table)
- [ ] Rationalization tables contain REAL excuses from session exports, not imagined ones
- [ ] Commands can be built using skills as building blocks
