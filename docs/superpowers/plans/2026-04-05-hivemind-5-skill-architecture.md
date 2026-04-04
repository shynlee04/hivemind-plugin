# HiveMind 5-Skill Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build/improve 5 skills (meta-builder, skill-authoring, command-dev, agents-and-subagents-dev, custom-tools-dev) where each captures real session knowledge, works standalone, and has enforcement baked into SKILL.md text — not bash stubs.

**Architecture:** Spec-driven iterative build. One skill at a time: audit current state, fix real failures, verify standalone, commit, move on. Meta-builder routes to the other 4 as its team. Each skill has a unique shape matching its domain.

**Tech Stack:** OpenCode skills (SKILL.md + references/), bash scripts (only when genuinely useful), markdown documentation

---

### Task 1: meta-builder — Remove Dead References

**Files:**
- Modify: `.skills-lab/active/refactoring-skills/meta-builder/SKILL.md`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/scripts/graph-init.sh`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/scripts/graph-traverse.sh`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/scripts/validate-graph.sh`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/scripts/state-persist.sh`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/scripts/register-skill.sh`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/scripts/route-check.sh`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/.meta-builder/graph.json`
- Delete: `.skills-lab/active/refactoring-skills/meta-builder/.meta-builder/state/` (entire directory)

- [ ] **Step 1: Read current SKILL.md**

Read `.skills-lab/active/refactoring-skills/meta-builder/SKILL.md` (78 lines). Note all references to:
- Scripts: graph-init.sh, graph-traverse.sh, validate-graph.sh, state-persist.sh, register-skill.sh, route-check.sh
- Graph: `.meta-builder/graph.json`, "node-based graph", "edge types"
- MINDNETWORK references

- [ ] **Step 2: Remove script references from "On Load" section**

Replace lines 17-18:
```markdown
3. If the task involves multi-node traversal, optionally run `scripts/graph-init.sh` and `scripts/validate-graph.sh` as fact-probes.
```
With:
```markdown
3. For skill stacking (max 3 per stack), load `references/04-skills-chaining.md`.
```

- [ ] **Step 3: Remove "Graph Structure" section entirely**

Delete lines 20-30 (the entire "## Graph Structure" section including edge types).

- [ ] **Step 4: Update routing table with new domain skills**

Replace the routing table (lines 34-43) with:
```markdown
## Routing Table

| User Says | Route To |
|-----------|----------|
| "create a skill" | `use-authoring-skills` |
| "create a skill like this @file" | `use-authoring-skills` + `skill-creator` |
| "audit this skill" | `use-authoring-skills` |
| "create an agent" | `agents-and-subagents-dev` |
| "set up a command" | `command-dev` |
| "build a custom tool" | `custom-tools-dev` |
| "configure OpenCode" | `opencode-platform-reference` |
| "stack skills" / "combine skills" | This skill + target skills (max 3) |

**Not for me:** If the request doesn't match any row above, do NOT activate this skill. Route to the appropriate specialist directly.
```

- [ ] **Step 5: Replace "Skills Chaining" with "Stacking Recipes"**

Replace lines 47-49:
```markdown
## Skills Chaining

Max 3 skills per stack. Load order matters. For skill stacking recipes and loading order, load `references/04-skills-chaining.md`.
```
With:
```markdown
## Stacking Recipes

Max 3 skills per stack. If you can't explain why each skill is needed, don't load it.

| User Intent | Stack | Why |
|-------------|-------|-----|
| "Create a skill + command for it" | skill-authoring + command-dev | Skill creation + command wrapper |
| "Build an agent + custom tool" | agents-and-subagents-dev + custom-tools-dev | Agent def + tool implementation |
| "Audit this skill" | use-authoring-skills | Domain skill for skill quality |
| "Deep research on X" | opencode-platform-reference + coordinating-loop | SDK patterns + subagent dispatch |

For loading order details, load `references/04-skills-chaining.md`.
```

- [ ] **Step 6: Update anti-patterns with real session evidence**

Replace lines 62-68:
```markdown
## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Blind Router** — routing without context | Routed before reading intent | Read planning files and relevant skill first. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |
```
With:
```markdown
## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — editing files directly | Did this skill call write/edit? | STOP. Delegate to the specialist skill. |
| **The Hoarder** — loading 4+ skills "to be safe" | Context blown, skills ignored | Max 3. If you can't explain why each is needed, don't load it. |
| **The Improviser** — "routing table says X but I'll do Y" | Routed to wrong skill, task failed | Trust the table. If it's wrong, fix the table — don't improvise. |
| **The Universal Receiver** — activating for requests owned by other skills | Request matches another skill's domain | Do NOT activate. Route directly to the owning skill. |
```

- [ ] **Step 7: Update reference map**

Replace lines 70-78:
```markdown
## Reference Map

| File | When to Read |
|------|-------------|
| `references/01-mindsnetwork-graph.md` | Graph structure, node types, edge semantics |
| `references/02-deterministic-control.md` | Execution protocol, rollback rules, retry logic |
| `references/03-long-horizon-persistence.md` | Session recovery, cross-session state, checkpoints |
| `references/04-skills-chaining.md` | Multi-skill stacks, loading order, composition |
| `references/05-hivefiver-agent.md` | Hivefiver orchestrator agent definition |
```
With:
```markdown
## Reference Map

| File | When to Read |
|------|-------------|
| `references/04-skills-chaining.md` | Multi-skill stacks, loading order, composition |
| `references/05-hivefiver-agent.md` | Hivefiver orchestrator agent definition |

**Removed:** 01-mindsnetwork-graph.md, 02-deterministic-control.md, 03-long-horizon-persistence.md — these reference the deleted graph structure. Delete them in the next step.
```

- [ ] **Step 8: Delete dead script files**

```bash
rm -f .skills-lab/active/refactoring-skills/meta-builder/scripts/graph-init.sh
rm -f .skills-lab/active/refactoring-skills/meta-builder/scripts/graph-traverse.sh
rm -f .skills-lab/active/refactoring-skills/meta-builder/scripts/validate-graph.sh
rm -f .skills-lab/active/refactoring-skills/meta-builder/scripts/state-persist.sh
rm -f .skills-lab/active/refactoring-skills/meta-builder/scripts/register-skill.sh
rm -f .skills-lab/active/refactoring-skills/meta-builder/scripts/route-check.sh
```

- [ ] **Step 9: Delete dead graph files and reference files**

```bash
rm -rf .skills-lab/active/refactoring-skills/meta-builder/.meta-builder/
rm -f .skills-lab/active/refactoring-skills/meta-builder/references/01-mindsnetwork-graph.md
rm -f .skills-lab/active/refactoring-skills/meta-builder/references/02-deterministic-control.md
rm -f .skills-lab/active/refactoring-skills/meta-builder/references/03-long-horizon-persistence.md
```

- [ ] **Step 10: Verify no dead references remain**

Run: `grep -r "graph-init\|graph-traverse\|validate-graph\|MINDNETWORK\|graph.json\|mindsnetwork\|deterministic-control\|long-horizon" .skills-lab/active/refactoring-skills/meta-builder/`
Expected: No output (no matches)

- [ ] **Step 11: Commit**

```bash
git add .skills-lab/active/refactoring-skills/meta-builder/
git commit -m "fix(meta-builder): remove dead graph refs, add stacking recipes, update anti-patterns with session evidence"
```

---

### Task 2: skill-authoring — Remove Stub Scripts, Add Iron Law

**Files:**
- Modify: `.skills-lab/active/refactoring-skills/use-authoring-skills/SKILL.md`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/validate-gate.sh`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/check-overlaps.sh`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/gate-enforce.sh`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/init-session.sh`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/register-skill.sh`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/check-complete.sh`
- Delete: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/verify-hierarchy.sh`
- Keep: `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/validate-skill.sh` (verify it has real content first)

- [ ] **Step 1: Audit each script for real content vs stub**

Run for each script:
```bash
for f in .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/*.sh; do
  echo "=== $(basename $f) ==="
  wc -l "$f"
  echo "--- First 20 lines ---"
  head -20 "$f"
  echo "--- Last 10 lines ---"
  tail -10 "$f"
  echo ""
done
```

**Decision criteria:**
- DELETE if: exits 0 always, has placeholder text, has `TODO` or `FIXME`, no actual validation logic
- KEEP if: greps for real sections, checks frontmatter, exits non-zero on failure, has real logic

Note: Scripts are 1-7KB — size alone doesn't mean they're real. Check for actual validation logic, not just line count.

- [ ] **Step 2: Delete scripts that fail the audit**

Based on Step 1 audit results, delete scripts that:
- Exit 0 without checking anything
- Have placeholder/TODO text
- Don't actually validate skill structure

Common candidates (verify in Step 1 before deleting):
```bash
# Only delete if audit confirms they are stubs/fakes:
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/validate-gate.sh
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/check-overlaps.sh
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/gate-enforce.sh
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/init-session.sh
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/register-skill.sh
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/check-complete.sh
rm -f .skills-lab/active/refactoring-skills/use-authoring-skills/scripts/verify-hierarchy.sh
```

- [ ] **Step 3: Verify validate-skill.sh has real content**

Read `.skills-lab/active/refactoring-skills/use-authoring-skills/scripts/validate-skill.sh`. If it has real validation logic (greps for sections, checks frontmatter, exits non-zero on failure), keep it. If it's a stub, delete it too.

- [ ] **Step 4: Read current SKILL.md**

Read `.skills-lab/active/refactoring-skills/use-authoring-skills/SKILL.md` (205 lines). Note current structure.

- [ ] **Step 5: Add Iron Law section near the top (after the opening paragraph)**

Insert after the first paragraph of SKILL.md:
```markdown
## The Iron Law

```
NO SKILL WITHOUT TRIGGER PHRASES IN THE DESCRIPTION
```

The description is the ONLY thing the agent sees before deciding to load a skill. If it doesn't contain specific phrases a user would say, the skill is invisible. Dead on arrival.

**Not "the description should be good."** The description IS the skill. Without it, nothing else matters.

### What agents actually rationalize

| What agents say | Reality |
|-----------------|---------|
| "The description is clear enough" | It says "provides guidance for skill development." Agent will never load it. |
| "I'll add trigger phrases later" | Later never comes. The skill sits dead until someone audits it. |
| "The references are too long, I'll summarize" | References ARE the value. SKILL.md points to them. Summarizing = losing knowledge. |
| "This skill needs another skill to work" | Standalone contract. Push to load, don't require. If it can't work alone, it's not a skill — it's a chapter. |
| "The script stub exits 0 so validation passes" | A stub that always passes is a lie. Remove it or make it real. |
| "I'll keep the dead reference, it might be useful later" | Dead references are debt. The agent will try to load them, fail, and move on. |
```

- [ ] **Step 6: Update "Scripts" section to reflect reality**

Find any section referencing scripts. Update to:
```markdown
## Scripts

Only keep scripts that actually validate something. Stubs that exit 0 always are lies — remove them.

**Kept:** `validate-skill.sh` — real validation (greps for sections, checks frontmatter)
**Removed:** validate-gate.sh (always exits 0), check-overlaps.sh (placeholder), and 5 other stubs.

Enforcement lives in SKILL.md text (Iron Law + Validation Gate), not in bash.
```

- [ ] **Step 7: Add Validation Gate section**

Add before the references section:
```markdown
## Validation Gate

Before a skill is done:
- [ ] Description has trigger phrases (specific things users would say)
- [ ] Description uses third person
- [ ] SKILL.md body uses imperative form
- [ ] SKILL.md is lean (1,500-2,000 words, <5k max)
- [ ] All referenced files exist and have real content (not stubs)
- [ ] No script stubs that exit 0 always
- [ ] No dead references to files/scripts that don't exist
- [ ] Works standalone — doesn't require other HiveMind skills
```

- [ ] **Step 8: Verify no dead script references remain**

Run: `grep -r "validate-gate\|check-overlaps\|gate-enforce\|init-session\|check-complete\|verify-hierarchy" .skills-lab/active/refactoring-skills/use-authoring-skills/`
Expected: No output

- [ ] **Step 9: Commit**

```bash
git add .skills-lab/active/refactoring-skills/use-authoring-skills/
git commit -m "fix(skill-authoring): remove 7 stub scripts, add Iron Law for trigger phrases, add validation gate"
```

---

### Task 3: command-dev — New Skill (Non-Interactive Shell + Command Anatomy)

**Files:**
- Create: `.skills-lab/active/refactoring-skills/command-dev/SKILL.md`
- Create: `.skills-lab/active/refactoring-skills/command-dev/references/non-interactive-shell.md`
- Create: `.skills-lab/active/refactoring-skills/command-dev/references/command-anatomy.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p .skills-lab/active/refactoring-skills/command-dev/references
```

- [ ] **Step 2: Create SKILL.md**

Create `.skills-lab/active/refactoring-skills/command-dev/SKILL.md`:
```markdown
---
name: command-dev
description: This skill should be used when the user asks to "create a command", "add a command", "write a custom command", "update a command", "set up a command with arguments", "create a command with bash injection", "configure command agent", mentions $ARGUMENTS, !bash, @file, agent:, subtask: in command context, or needs guidance on OpenCode command structure and non-interactive shell safety.
---

# command-dev

Create and update OpenCode commands with non-interactive shell safety. Commands are human entry points — they select the right agent, load skills, inject bash state, and the agent+skills handle the rest.

## The Iron Law

```
EVERY COMMAND THAT RUNS SHELL OPERATIONS MUST SURVIVE CI=true
```

OpenCode runs agents in a headless non-interactive shell. No TTY. No prompts. `git commit` without `-m` hangs forever. `npm install` without `--yes` hangs forever. Every command must work with `CI=true` set.

## On Load

1. **MANDATORY - READ ENTIRE FILE**: Read [`non-interactive-shell.md`](references/non-interactive-shell.md) for the full list of banned commands, environment variables, and non-interactive flags.
2. **MANDATORY - READ ENTIRE FILE**: Read [`command-anatomy.md`](references/command-anatomy.md) for command structure, $ARGUMENTS, !bash, @file, agent:, subtask: patterns.
3. **Do NOT load** other skills unless the command specifically needs them (e.g., skill-authoring if the command creates skills).

## Command Anatomy

Every command MUST have:
- YAML frontmatter with `description` (specific, with trigger scenarios) and `agent` fields
- `subtask: true` if it should spawn a subagent, `false` if it runs in main session
- `!bash` blocks for state injection (git status, git log, ls planning files)
- `$ARGUMENTS` if the command takes user input
- Skill loading section (which skills to load and why)
- Anti-patterns section (what NOT to do)

For the full command template and worked example, load `references/command-anatomy.md`.

## What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll use git commit and the agent will fill in the message" | Hangs. No TTY for interactive commit. | Always use `-m "message"`. |
| "The agent can handle the npm prompt" | Hangs. No stdin for interactive prompts. | Always use `--yes` or `npm_config_yes=true`. |
| "vim is fine for quick edits" | Hangs. No TTY for editors. | Use Write/Edit tools, never vim/nano/less. |
| "The command will work in the TUI" | Commands run in headless shell, not TUI. | Test mentally: would this hang without a terminal? |

## Non-Interactive Shell Mandates

**Banned commands (will hang indefinitely):**
- Editors: `vim`, `vi`, `nano`, `emacs`
- Pagers: `less`, `more`, `man`
- Interactive git: `git add -p`, `git rebase -i`, `git commit` (without -m)
- REPLs: `python`, `node` (without -c or script file)

**Always use:**
- `git commit -m "message"` (never interactive commit)
- `npm install --yes` (never interactive install)
- `rm -f` (never interactive rm)
- `git log --no-pager` or `git log -n 10` (never pager)

For the complete list, load `references/non-interactive-shell.md`.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Interactive Assumption** — using commands that need TTY | Command has vim, less, git commit without -m | Use non-interactive flags always |
| **The Vague Description** — "helps with X" | Description doesn't have trigger phrases | Include specific phrases users would say |
| **The Missing Skill Load** — command doesn't specify skills | No "Load skills" section | Always specify which skills to load |
| **The Self-Executor** — command does everything itself | No delegation to subagents | Commands select agents. Agents delegate. |
```

- [ ] **Step 3: Create non-interactive-shell.md reference**

Copy the canonical reference from `/Users/apple/hivemind-plugin/.worktrees/product-detox/docs/prompts/how-to-write-audit-skill/opencode-knowledge/non-interactive-shell.md` to `.skills-lab/active/refactoring-skills/command-dev/references/non-interactive-shell.md`.

- [ ] **Step 4: Create command-anatomy.md reference**

Create `.skills-lab/active/refactoring-skills/command-dev/references/command-anatomy.md` with:
- Full command template (frontmatter + body structure)
- $ARGUMENTS usage examples
- !bash injection examples
- @file reference examples
- agent: and subtask: usage
- Worked example: /deep-tech-research command (from the spec)

- [ ] **Step 5: Verify skill structure**

Run:
```bash
ls -la .skills-lab/active/refactoring-skills/command-dev/
ls -la .skills-lab/active/refactoring-skills/command-dev/references/
head -5 .skills-lab/active/refactoring-skills/command-dev/SKILL.md
```
Expected: SKILL.md exists with valid frontmatter, references/ has 2 files

- [ ] **Step 6: Commit**

```bash
git add .skills-lab/active/refactoring-skills/command-dev/
git commit -m "feat: add command-dev skill — non-interactive shell safety and command anatomy"
```

---

### Task 4: agents-and-subagents-dev — New Skill (Delegation + Worktree)

**Files:**
- Create: `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/SKILL.md`
- Create: `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/references/delegation-protocol.md`
- Create: `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/references/worktree-control.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p .skills-lab/active/refactoring-skills/agents-and-subagents-dev/references
```

- [ ] **Step 2: Create SKILL.md**

Create `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/SKILL.md`:
```markdown
---
name: agents-and-subagents-dev
description: This skill should be used when the user asks to "create an agent", "add an agent", "define agent permissions", "set up subagent delegation", "configure agent temperature", "create agent definition", mentions agent: in command context, subtask: flag, delegation patterns, worktree isolation, fork sessions, parallel tasks, or needs guidance on OpenCode agent architecture and subagent dispatch protocols.
---

# agents-and-subagents-dev

Define agents, configure delegation, and manage worktree isolation. Agents are role definitions with permissions, temperature, and model settings. Subagents are dispatched with constructed context — never session history.

## The Iron Law

```
NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT
```

Never pass session history to a subagent. Never say "read the plan file." Construct exactly what they need: full task text, scene-setting context, scope boundaries. Fresh context per task = no pollution.

## On Load

1. **MANDATORY - READ ENTIRE FILE**: Read [`delegation-protocol.md`](references/delegation-protocol.md) for the dispatch envelope pattern, status handling, and two-stage review.
2. **MANDATORY - READ ENTIRE FILE**: Read [`worktree-control.md`](references/worktree-control.md) for git worktree isolation, fork sessions, and parallel task management.
3. **Do NOT load** other skills unless the agent specifically needs them.

## Delegation Protocol

The actual cycle:
1. Before dispatch: Extract full task text (not file path), construct context
2. Dispatch envelope: Task tool with role, task text, context, scope, output format
3. After return: Check status (DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED), handle appropriately
4. Review (two-stage): Spec compliance first, then code quality. Stage 1 MUST pass before Stage 2.

For the full protocol with worked examples, load `references/delegation-protocol.md`.

## Status Protocol

| Status | What it means | Controller action |
|--------|--------------|-------------------|
| DONE | Task complete, verified | Proceed to spec review |
| DONE_WITH_CONCERNS | Complete but has doubts | Read concerns. If about correctness → address before review. If observation → note and proceed. |
| NEEDS_CONTEXT | Hit a knowledge gap | Provide missing context. Re-dispatch. |
| BLOCKED | Cannot proceed | Assess: context gap? needs stronger model? task too big? plan wrong? |

**Never** force the same model to retry without changes. If the subagent said it's stuck, something needs to change.

## Worktree Control

From session evidence, agents fail when they can't control isolation:
- Fork a session to multiple → start at any turn
- Start in parallel different kinds of task
- If not controlling git worktree → mostly failure

**The rule:** Implementation work happens in worktrees. Main branch is for integration only.

For worktree commands and patterns, load `references/worktree-control.md`.

## What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll dispatch the subagent with the plan file path" | Subagent reads file, loses context, implements wrong thing | Paste full task text into the prompt. Always. |
| "The subagent can figure out the context" | Subagent guesses, guesses wrong, builds wrong thing | Scene-setting is the controller's job. |
| "I can run this in the main session, it's simple" | Main session context polluted, forgets original goal | Delegate. Always delegate. |
| "I'll run parallel subagents for speed" | They conflict on the same files, one overwrites the other | Parallel only for independent tasks (no shared files). |
| "The subagent said DONE, I'll trust it" | Subagent completed but missed edge cases | Two-stage review: spec compliance first, then quality. |
| "I don't need worktree isolation for this" | Changes bleed into main branch, can't rollback | Worktree is non-negotiable for implementation work. |

## Validation Gate

Before an agent definition or delegation pattern is done:
- [ ] Agent has clear role (one sentence)
- [ ] Permissions are explicit (read/edit/write/bash/task/skill)
- [ ] Temperature and model are specified
- [ ] No overlap with existing agents' responsibilities
- [ ] Delegation envelope pattern is documented
- [ ] Status protocol is embedded (not referenced externally)
- [ ] Worktree control is addressed

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Context Polluter** — passing session history to subagent | Subagent prompt includes "earlier in the conversation" | Construct fresh context: task text + scene-setting + scope |
| **The File Referrer** — "read the plan file" | Subagent told to read file path instead of getting task text | Paste full task text into the prompt. Always. |
| **The Parallel Crasher** — parallel tasks on shared files | Subagents conflict, one overwrites the other | Parallel only for independent tasks (no shared files) |
| **The Trusting Controller** — accepting DONE without review | Subagent missed edge cases | Two-stage review: spec compliance first, then quality |
```

- [ ] **Step 3: Create delegation-protocol.md reference**

Create `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/references/delegation-protocol.md` with:
- Full dispatch envelope template (from the spec)
- Worked example of the full cycle (dispatch → return → review → fix → re-review)
- Status handling details with examples
- Two-stage review protocol

- [ ] **Step 4: Create worktree-control.md reference**

Create `.skills-lab/active/refactoring-skills/agents-and-subagents-dev/references/worktree-control.md` with:
- git worktree commands (add, list, remove, prune)
- Fork session patterns
- Parallel task isolation rules
- When to use worktrees vs main branch

- [ ] **Step 5: Verify skill structure**

Run:
```bash
ls -la .skills-lab/active/refactoring-skills/agents-and-subagents-dev/
ls -la .skills-lab/active/refactoring-skills/agents-and-subagents-dev/references/
head -5 .skills-lab/active/refactoring-skills/agents-and-subagents-dev/SKILL.md
```

- [ ] **Step 6: Commit**

```bash
git add .skills-lab/active/refactoring-skills/agents-and-subagents-dev/
git commit -m "feat: add agents-and-subagents-dev skill — delegation protocol, status handling, worktree control"
```

---

### Task 5: custom-tools-dev — New Skill (Zod Schemas + Plugin Lifecycle)

**Files:**
- Create: `.skills-lab/active/refactoring-skills/custom-tools-dev/SKILL.md`
- Create: `.skills-lab/active/refactoring-skills/custom-tools-dev/references/plugin-lifecycle.md`
- Create: `.skills-lab/active/refactoring-skills/custom-tools-dev/references/zod-patterns.md`

- [ ] **Step 1: Create skill directory**

```bash
mkdir -p .skills-lab/active/refactoring-skills/custom-tools-dev/references
```

- [ ] **Step 2: Create SKILL.md**

Create `.skills-lab/active/refactoring-skills/custom-tools-dev/SKILL.md`:
```markdown
---
name: custom-tools-dev
description: This skill should be used when the user asks to "create a custom tool", "build an OpenCode plugin", "write a tool with Zod schema", "add a plugin hook", "create CLI script", "build a tool for agent", mentions tool() helper, Zod validation, plugin lifecycle, hooks (PreToolUse, PostToolUse), bin/ scripts, or needs guidance on OpenCode plugin SDK and custom tool architecture.
---

# custom-tools-dev

Build OpenCode plugins, custom tools, and CLI scripts. Tools are write-side (mutate state), hooks are read-side (observe events). Plugin layer is thin assembly only — no business logic.

## The Iron Law

```
NO TOOL WITHOUT A ZOD SCHEMA
```

Every custom tool validates arguments with Zod. No `any` types. No unvalidated input. Schema first, implementation second. If you can't define the schema, you don't understand the tool.

## On Load

1. **MANDATORY - READ ENTIRE FILE**: Read [`plugin-lifecycle.md`](references/plugin-lifecycle.md) for init → register → event loop → shutdown pattern.
2. **MANDATORY - READ ENTIRE FILE**: Read [`zod-patterns.md`](references/zod-patterns.md) for Zod schema patterns, Good/Bad examples, and common mistakes.
3. **Do NOT load** other skills unless the tool specifically needs them.

## Plugin Lifecycle

```
init → register tools/hooks → event loop → shutdown
```

- Tools are write-side (mutate state)
- Hooks are read-side (observe events)
- Plugin layer is thin (<100 LOC assembly only)
- No business logic in plugin layer

For the full lifecycle with code examples, load `references/plugin-lifecycle.md`.

## The Script Rule

```
A script should REPORT FACTS and LEAVE JUDGMENT TO THE AGENT.
```

Pure helpers only (exit 0, no governance). No hardcoded paths. No state mutation outside CQRS tools. If a script makes decisions, it's not a script — it's an agent, and agents belong in SKILL.md.

## What agents actually rationalize

| What agents say | What happens | Reality |
|-----------------|-------------|---------|
| "I'll use z.any() and validate in the function" | Type safety lost. Agent can't see what the tool expects. | Zod schema IS the interface. If it's z.any(), there's no interface. |
| "The tool does many things, one schema won't cover it" | Tool is too broad. Split it. | One tool = one thing. Multiple things = multiple tools. |
| "I'll put business logic in the plugin layer" | Plugin layer becomes the app. Violates architecture. | Plugin layer is assembly only (<100 LOC). Business logic goes in tools. |
| "The script can mutate state directly" | State mutation outside CQRS tools = unpredictable behavior. | Scripts report facts. Tools mutate state. Never the reverse. |
| "I'll hardcode the state directory path" | Breaks on different machines, different users. | Use environment variables or config. No hardcoded paths. |

## Validation Gate

Before a tool or plugin is done:
- [ ] Tool has Zod schema for all parameters
- [ ] No `any` types in tool definition
- [ ] Tool does one thing (name matches behavior)
- [ ] Plugin layer is thin (<100 LOC)
- [ ] No business logic in plugin layer
- [ ] CLI scripts report facts only (exit 0, no governance)
- [ ] No hardcoded paths in scripts

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Schema Dodger** — using z.any() | Tool parameters are z.any() or any type | Zod schema IS the interface. Define it properly. |
| **The Swiss Army Tool** — one tool does many things | Tool description says "does many things" | One tool = one thing. Split into multiple tools. |
| **The Fat Plugin** — business logic in plugin layer | Plugin layer >100 LOC, has business logic | Plugin layer is assembly only. Business logic in tools. |
| **The State Mutator** — scripts mutate state directly | Script writes to state files, modifies config | Scripts report facts. Tools mutate state. Never the reverse. |
| **The Path Hardcoder** — hardcoded directory paths | Script has `/Users/apple/...` or absolute paths | Use environment variables or config. No hardcoded paths. |
```

- [ ] **Step 3: Create plugin-lifecycle.md reference**

Create `.skills-lab/active/refactoring-skills/custom-tools-dev/references/plugin-lifecycle.md` with:
- Plugin init pattern
- Tool registration with tool() helper
- Hook registration (PreToolUse, PostToolUse, etc.)
- Event loop patterns
- Shutdown/cleanup
- Code examples for each phase

- [ ] **Step 4: Create zod-patterns.md reference**

Create `.skills-lab/active/refactoring-skills/custom-tools-dev/references/zod-patterns.md` with:

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

### Common Zod Patterns
- `z.object({...})` for structured parameters
- `z.enum([...])` for fixed option sets
- `.optional()` for optional fields
- `.describe("...")` for agent-readable field descriptions
- `z.string().min(1)` for required non-empty strings

### Anti-Patterns
- `z.any()` — no interface, agent can't see what's expected
- `any` types in execute function — loses type safety
- Missing `.describe()` on fields — agent doesn't know what each param means
- Overly broad schemas — if the schema accepts everything, it validates nothing

- [ ] **Step 5: Verify skill structure**

Run:
```bash
ls -la .skills-lab/active/refactoring-skills/custom-tools-dev/
ls -la .skills-lab/active/refactoring-skills/custom-tools-dev/references/
head -5 .skills-lab/active/refactoring-skills/custom-tools-dev/SKILL.md
```

- [ ] **Step 6: Commit**

```bash
git add .skills-lab/active/refactoring-skills/custom-tools-dev/
git commit -m "feat: add custom-tools-dev skill — Zod schemas, plugin lifecycle, script rule"
```

---

### Task 6: Delete Stale Copy Directory

**Files:**
- Delete: `.skills-lab/active/refactoring-skills/oh-my-openagent-reference copy/` (if exists)

- [ ] **Step 1: Check if stale copy exists**

```bash
ls -d ".skills-lab/active/refactoring-skills/oh-my-openagent-reference copy" 2>/dev/null && echo "EXISTS" || echo "NOT FOUND"
```

- [ ] **Step 2: Delete if exists**

```bash
rm -rf ".skills-lab/active/refactoring-skills/oh-my-openagent-reference copy"
```

- [ ] **Step 3: Commit**

```bash
git add -A .skills-lab/active/refactoring-skills/
git commit -m "chore: remove stale oh-my-openagent-reference copy directory"
```

---

### Task 7: Final Verification — All 5 Skills Standalone Check

**Files:**
- Verify: All 5 skill directories

- [ ] **Step 1: Verify all skills have valid frontmatter**

```bash
for skill in meta-builder use-authoring-skills command-dev agents-and-subagents-dev custom-tools-dev; do
  echo "=== $skill ==="
  head -5 ".skills-lab/active/refactoring-skills/$skill/SKILL.md"
  echo ""
done
```

Expected: Each shows `---` frontmatter with `name:` and `description:` fields.

- [ ] **Step 2: Verify no dead script references**

```bash
grep -r "graph-init\|graph-traverse\|validate-graph\|MINDNETWORK\|graph.json" .skills-lab/active/refactoring-skills/meta-builder/ && echo "FAIL: meta-builder has dead refs" || echo "PASS: meta-builder clean"
grep -r "validate-gate\|check-overlaps\|gate-enforce\|init-session\|check-complete\|verify-hierarchy" .skills-lab/active/refactoring-skills/use-authoring-skills/ && echo "FAIL: use-authoring-skills has dead refs" || echo "PASS: use-authoring-skills clean"
```

- [ ] **Step 3: Verify all skills have Iron Laws**

```bash
for skill in meta-builder use-authoring-skills command-dev agents-and-subagents-dev custom-tools-dev; do
  grep -q "Iron Law" ".skills-lab/active/refactoring-skills/$skill/SKILL.md" && echo "PASS: $skill has Iron Law" || echo "FAIL: $skill missing Iron Law"
done
```

- [ ] **Step 4: Verify all skills have anti-patterns**

```bash
for skill in meta-builder use-authoring-skills command-dev agents-and-subagents-dev custom-tools-dev; do
  grep -q "Anti-Pattern" ".skills-lab/active/refactoring-skills/$skill/SKILL.md" && echo "PASS: $skill has anti-patterns" || echo "FAIL: $skill missing anti-patterns"
done
```

- [ ] **Step 5: Verify all skills have unique shapes**

```bash
for skill in meta-builder use-authoring-skills command-dev agents-and-subagents-dev custom-tools-dev; do
  lines=$(wc -l < ".skills-lab/active/refactoring-skills/$skill/SKILL.md")
  echo "$skill: $lines lines"
done
```

Expected: Different line counts (not identical templates).

- [ ] **Step 6: Verify reference files have real content (not empty)**

```bash
for skill in command-dev agents-and-subagents-dev custom-tools-dev; do
  for ref in ".skills-lab/active/refactoring-skills/$skill/references/"*.md; do
    lines=$(wc -l < "$ref")
    echo "$ref: $lines lines"
    if [ "$lines" -lt 10 ]; then
      echo "WARNING: $ref has very few lines ($lines) — may be empty/stub"
    fi
  done
done
```

Expected: All reference files have substantial content (>50 lines).

- [ ] **Step 7: Verify meta-builder has stacking recipes (not just routing table)**

```bash
grep -c "Stacking Recipes\|stacking recipe\|User Intent" .skills-lab/active/refactoring-skills/meta-builder/SKILL.md
```
Expected: >0 (stacking recipes section exists)

- [ ] **Step 8: Commit verification results**

If all checks pass:
```bash
git add -A
git commit -m "verify: all 5 skills pass standalone check — valid frontmatter, no dead refs, Iron Laws, anti-patterns, unique shapes, reference content"
```

---

## Execution Order

Tasks are sequential — one skill at a time, verify, commit, move on:

1. Task 1: meta-builder (dead refs removal)
2. Task 2: skill-authoring (stub script removal + Iron Law)
3. Task 3: command-dev (new skill)
4. Task 4: agents-and-subagents-dev (new skill)
5. Task 5: custom-tools-dev (new skill)
6. Task 6: delete stale copy
7. Task 7: final verification

## Verification

After all tasks complete:

```bash
# All 5 skills exist with valid SKILL.md
for skill in meta-builder use-authoring-skills command-dev agents-and-subagents-dev custom-tools-dev; do
  test -f ".skills-lab/active/refactoring-skills/$skill/SKILL.md" && echo "PASS: $skill exists" || echo "FAIL: $skill missing"
done

# No dead references
! grep -rq "graph-init\|MINDNETWORK\|validate-gate\|check-overlaps" .skills-lab/active/refactoring-skills/ && echo "PASS: no dead refs" || echo "FAIL: dead refs remain"

# All skills have Iron Laws
for skill in meta-builder use-authoring-skills command-dev agents-and-subagents-dev custom-tools-dev; do
  grep -q "Iron Law" ".skills-lab/active/refactoring-skills/$skill/SKILL.md" && echo "PASS: $skill Iron Law" || echo "FAIL: $skill no Iron Law"
done

# Stale copy removed
! test -d ".skills-lab/active/refactoring-skills/oh-my-openagent-reference copy" && echo "PASS: copy removed" || echo "FAIL: copy still exists"
```
