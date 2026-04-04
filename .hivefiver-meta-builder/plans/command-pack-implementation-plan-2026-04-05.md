# HiveMind Command-Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build command-packs that glue agents + skills + bash output into complete orchestration cycles. Each command = one user intent → one complete flow.

**Architecture:** Commands use OpenCode's native features ($ARGUMENTS, !`bash`, @file, agent:, subtask:) to pre-load context, select the right agent, inject live state, and let the agent+skills handle execution. No framework code needed — the command IS the orchestration.

**Tech Stack:** OpenCode commands (YAML frontmatter + markdown), existing agents (coordinator, builder, critic, researcher, explore), existing skills (.skills-lab/active/refactoring-skills/)

---

## File Structure

```
.opencode/commands/
├── investigate.md          ← NEW: Deep investigation command
├── skill-doctor.md         ← NEW: Audit/improve skill packs  
├── plan.md                 ← EXISTS: Update with bash injection
├── start-work.md           ← EXISTS: Update to use correct agent
└── (keep existing: deep-research-synthesis-repomix.md, ultrawork.md, etc.)

.opencode/agents/
├── coordinator.md          ← EXISTS: Already good
├── builder.md              ← EXISTS: Already good
├── critic.md               ← EXISTS: Already good
├── researcher.md           ← EXISTS: Verify
├── explore.md              ← EXISTS: Verify
├── hivefiver.md            ← EXISTS: Keep as-is (meta-builder agent)
└── conductor.md            ← EXISTS: Keep as-is
```

---

### Task 1: Create /investigate command

**Files:**
- Create: `.opencode/commands/investigate.md`

- [ ] **Step 1: Write the command file**

```markdown
---
description: "Deep investigation of any topic: codebase, framework, architecture, or external system. Auto-selects investigation depth and spawns research subagents."
agent: coordinator
subtask: true
---

You are running an investigation. The topic is: $ARGUMENTS

## Current State
!`git log --oneline -5`
!`ls -la`

## Your Job

1. **Load the right skills:**
   - Load `planning-with-files` — create investigation triplet (task_plan.md, findings.md, progress.md)
   - Load `user-intent-interactive-loop` — if the topic is ambiguous, probe (max 3 questions)
   - Load `coordinating-loop` — if investigation requires multiple subagents

2. **Classify the investigation depth:**
   - **QUICK** (single subagent): Topic is narrow, 1-2 files, clear scope → dispatch one researcher subagent
   - **STANDARD** (2-3 subagents): Topic spans multiple domains → dispatch parallel researchers, synthesize
   - **DEEP** (multi-cycle): Topic requires cross-stack analysis → plan phases, dispatch per phase, review between

3. **For each subagent dispatch — use this template:**

```
Task tool (researcher or explore):
  description: "Investigate: [specific sub-topic]"
  prompt: |
    You are investigating: [SPECIFIC SUB-TOPIC — full text, not file path]

    ## Context
    [Scene-setting: where this fits, why it matters, what to look for]

    ## Scope
    - Include: [specific files/paths/domains]
    - Exclude: [what NOT to touch]

    ## Questions to Answer
    1. [Question 1]
    2. [Question 2]
    3. [Question 3]

    ## Output Format
    Return:
    - **Status:** DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - **Findings:** [numbered list with file:line references]
    - **Resources:** [URLs and file paths discovered]
    - **Gaps:** [what you couldn't answer and why]

    ## Constraints
    - Do NOT modify any files (read-only investigation)
    - Do NOT spawn further subagents (report gaps instead)
    - Return structured findings even if investigation is incomplete
```

4. **After each subagent returns:**
   - Write findings to `findings.md`
   - Check status: DONE → continue, DONE_WITH_CONCERNS → review, NEEDS_CONTEXT → provide and re-dispatch, BLOCKED → assess and escalate
   - If new questions emerged, dispatch additional subagent

5. **Final synthesis:**
   - Combine all subagent findings into `findings.md`
   - Write structured report to `progress.md`
   - Report to user with: summary, key findings, resources discovered, gaps remaining

## Anti-Patterns (DO NOT)
- Do NOT investigate yourself — delegate to subagents
- Do NOT pass session history to subagents — construct exact context they need
- Do NOT skip writing findings to disk — persistence beats memory
- Do NOT claim completion without evidence — cite file:line or URL for every finding
```

- [ ] **Step 2: Verify the command file**

Run: `head -5 .opencode/commands/investigate.md`
Expected: Shows `---` frontmatter with description, agent, subtask fields

- [ ] **Step 3: Test the command loads**

Run: `cat .opencode/commands/investigate.md | grep "description:"`
Expected: Shows the description string

- [ ] **Step 4: Commit**

```bash
git add .opencode/commands/investigate.md
git commit -m "feat: add /investigate command for deep investigation orchestration"
```

---

### Task 2: Create /skill-doctor command

**Files:**
- Create: `.opencode/commands/skill-doctor.md`

- [ ] **Step 1: Write the command file**

```markdown
---
description: "Audit, diagnose, and improve skill packs. Reads skill files, validates structure, checks references, and produces improvement report."
agent: coordinator
subtask: true
---

You are running a skill doctor session on: $ARGUMENTS

## Current State
!`find .skills-lab/active -name "SKILL.md" -type f 2>/dev/null | head -20`

## Your Job

1. **Load required skills:**
   - Load `use-authoring-skills` — this is the domain skill for skill authoring
   - Load `planning-with-files` — track findings

2. **Identify target skills:**
   - If $ARGUMENTS is a path → audit that specific skill directory
   - If $ARGUMENTS is "all" → audit all skills in .skills-lab/active/refactoring-skills/
   - If $ARGUMENTS is a name → find and audit that named skill

3. **For each skill, dispatch an auditor subagent:**

```
Task tool (critic):
  description: "Audit skill: [skill-name]"
  prompt: |
    You are auditing the skill at: [FULL PATH TO SKILL DIRECTORY]

    ## What to Check

    Read SKILL.md first. Then check:

    ### 1. Frontmatter
    - Has `name` field?
    - Has `description` field starting with "Use when"?
    - Description is a trigger condition (not a workflow summary)?

    ### 2. Content Quality
    - SKILL.md has procedural steps (not just theory)?
    - Has anti-patterns section?
    - Has worked examples?
    - References exist and have real content (not stubs)?

    ### 3. Scripts (if any)
    - Script files exist and have real content (>20 lines)?
    - Scripts handle errors (set -euo pipefail)?
    - Scripts exit non-zero on failure?

    ### 4. Self-Containedness
    - Can this skill work without other HiveMind skills?
    - Does it reference files/scripts that don't exist?
    - Does it have dead references to "graph.json" or "MINDNETWORK"?

    ## Output Format
    Return:
    - **Status:** DONE
    - **Score:** [1-10 overall quality]
    - **Issues Found:** [critical/important/minor with file:line]
    - **Recommendations:** [specific fixes to make]
```

4. **Synthesize all audit results:**
   - Write to `findings.md` with per-skill scores and issues
   - Prioritize: fix critical issues first, then important, then minor
   - Produce actionable improvement list sorted by impact

5. **Report to user with:**
   - Per-skill health summary (score + top issue)
   - Cross-cutting issues (affecting multiple skills)
   - Top 5 improvements by impact
```

- [ ] **Step 2: Verify the command file**

Run: `head -5 .opencode/commands/skill-doctor.md`
Expected: Shows `---` frontmatter

- [ ] **Step 3: Commit**

```bash
git add .opencode/commands/skill-doctor.md
git commit -m "feat: add /skill-doctor command for skill pack auditing"
```

---

### Task 3: Update /start-work command

**Files:**
- Modify: `.opencode/commands/start-work.md`

- [ ] **Step 1: Rewrite with bash injection and skill loading**

Replace the entire file with:

```markdown
---
description: "Start a complete work cycle: probe intent, plan, delegate, verify. Reads existing plan or creates one from your description."
agent: coordinator
subtask: false
---

You are starting a work cycle. The user wants: $ARGUMENTS

## Current State
!`git status --short`
!`git log --oneline -5`
!`ls task_plan.md findings.md progress.md 2>/dev/null || echo "No planning files found"`

## Your Job

1. **Check for existing plan:**
   - If `task_plan.md` exists → read it, resume from current phase
   - If no plan → proceed to create one

2. **Load skills in order:**
   - Load `user-intent-interactive-loop` — probe intent if unclear (max 3 questions)
   - Load `planning-with-files` — create 3-file plan (task_plan.md, findings.md, progress.md)
   - Load `coordinating-loop` — for multi-task execution

3. **Create plan (if needed):**
   - Write task_plan.md with bite-sized tasks (2-5 min each)
   - Each task must have: files to touch, exact steps, verification command
   - Get user approval before any execution

4. **Execute via delegation:**
   - For each task in task_plan.md:
     - Dispatch builder subagent with FULL TASK TEXT (not file path)
     - Builder returns: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
     - Handle status appropriately
     - Run verification command before marking complete
     - Update progress.md after each task

5. **Completion:**
   - All tasks verified → update progress.md with evidence
   - Report: what changed, what's verified, what's remaining

## Anti-Patterns (DO NOT)
- Do NOT implement directly — delegate to builder subagents
- Do NOT skip verification — run the command before claiming done
- Do NOT proceed without plan approval — user must confirm
- Do NOT batch-complete tasks — one at a time, verify each
```

- [ ] **Step 2: Verify the updated file**

Run: `head -10 .opencode/commands/start-work.md`
Expected: Shows updated frontmatter with bash injection

- [ ] **Step 3: Commit**

```bash
git add .opencode/commands/start-work.md
git commit -m "fix: update /start-work with bash injection, skill loading, and delegation protocol"
```

---

### Task 4: Update /plan command

**Files:**
- Modify: `.opencode/commands/plan.md`

- [ ] **Step 1: Read current content**

Run: `cat .opencode/commands/plan.md`

- [ ] **Step 2: Rewrite with skill loading and bash state injection**

```markdown
---
description: "Create an implementation plan from a description. Loads writing-plans skill, produces bite-sized task plan."
agent: coordinator
subtask: false
---

You are creating an implementation plan for: $ARGUMENTS

## Current State
!`git status --short`
!`ls task_plan.md 2>/dev/null && echo "Plan exists — will update" || echo "No plan found — will create"`

## Your Job

1. **Load planning skills:**
   - Load `planning-with-files` — the primary planning skill
   - If the request involves creating new concepts (skills, agents, commands) → also load `use-authoring-skills`

2. **Probe intent (if needed):**
   - If the description is vague, ask clarifying questions (max 3)
   - Confirm scope before planning

3. **Create the plan:**
   - Write `task_plan.md` following planning-with-files format
   - Each task = bite-sized (2-5 min), with: exact file paths, code in steps, verification commands
   - No placeholders — every step has complete content

4. **Self-review the plan:**
   - Check: does every requirement have a task?
   - Check: does every step have exact code/commands?
   - Check: are file paths correct?

5. **Present to user for approval:**
   - Show the plan summary
   - Wait for confirmation before proceeding to execution
   - If approved → suggest running `/start-work` to execute
```

- [ ] **Step 3: Commit**

```bash
git add .opencode/commands/plan.md
git commit -m "fix: update /plan with skill loading and state injection"
```

---

### Task 5: Add prompt templates to coordinating-loop

**Files:**
- Create: `.skills-lab/active/refactoring-skills/coordinating-loop/implementer-prompt.md`
- Create: `.skills-lab/active/refactoring-skills/coordinating-loop/reviewer-prompt.md`
- Create: `.skills-lab/active/refactoring-skills/coordinating-loop/investigator-prompt.md`

- [ ] **Step 1: Create implementer-prompt.md**

```markdown
# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent via coordinating-loop.

```
Task tool (builder):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Task Description
    [FULL TEXT of task from task_plan.md — paste it here, don't make subagent read file]

    ## Context
    [Scene-setting: where this fits, dependencies, architectural context]

    ## Before You Begin
    If you have questions about requirements, approach, or dependencies — ask now.

    ## Your Job
    1. Read every file you will modify (you MUST NOT edit unread files)
    2. Implement exactly what the task specifies
    3. Run verification command from the task
    4. Commit your work
    5. Self-review (completeness, quality, discipline, testing)
    6. Report back

    ## When You're Stuck
    It is OK to stop and say "this is too hard" or "I need more context".
    Report: BLOCKED or NEEDS_CONTEXT with specifics.

    ## Report Format
    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What you implemented
    - What you tested and results
    - Files changed (file:line format)
    - Self-review findings (if any)
    - Issues or concerns
```
```

- [ ] **Step 2: Create reviewer-prompt.md**

```markdown
# Reviewer Subagent Prompt Template

Use this template when dispatching a reviewer subagent via coordinating-loop.

```
Task tool (critic):
  description: "Review: [task name]"
  prompt: |
    You are reviewing work that was just completed.

    ## What Was Requested
    [FULL TEXT of task requirements]

    ## What Was Built
    [From implementer's report]

    ## CRITICAL: Do Not Trust the Report
    Read the actual code. Compare to requirements line by line.

    ## Your Job

    **Spec compliance (check FIRST):**
    - Did they implement everything requested?
    - Did they build things NOT requested? (flag as extra)
    - Did they misunderstand requirements?

    **Code quality (check SECOND, only after spec passes):**
    - Does code follow existing patterns?
    - Is error handling adequate?
    - Are there magic numbers, dead code, or orphaned imports?

    ## Report Format
    - ✅ Approved (if everything checks out)
    - ❌ Issues: [list specifically with file:line references]
```
```

- [ ] **Step 3: Create investigator-prompt.md**

```markdown
# Investigator Subagent Prompt Template

Use this template when dispatching an investigation/research subagent.

```
Task tool (researcher or explore):
  description: "Investigate: [topic]"
  prompt: |
    You are investigating: [TOPIC — full text, not file reference]

    ## Context
    [Scene-setting: where this fits, why it matters]

    ## Questions to Answer
    1. [Question 1]
    2. [Question 2]
    3. [Question 3]

    ## Scope
    - Include: [specific files/paths/domains]
    - Exclude: [what NOT to touch]
    - Max files to read: 5
    - Max LOC to consume: 5000

    ## Output Format
    Return:
    - **Status:** DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
    - **Findings:** [numbered list with file:line references]
    - **Resources:** [URLs and file paths discovered]
    - **Gaps:** [what you couldn't answer and why]

    ## Constraints
    - READ ONLY — do not modify any files
    - Do NOT spawn further subagents — report gaps instead
    - Return structured findings even if investigation is incomplete
```
```

- [ ] **Step 4: Update coordinating-loop SKILL.md to reference the templates**

Add after the existing "Hand-off Protocol" section:

```markdown
## Prompt Templates

When dispatching subagents, use these templates to construct their prompts:

- `./implementer-prompt.md` — For implementation tasks (builder subagents)
- `./reviewer-prompt.md` — For review tasks (critic subagents)
- `./investigator-prompt.md` — For investigation tasks (researcher subagents)

Each template follows the superpowers pattern: controller fills the template with full task text, subagent receives crafted context (never session history).
```

- [ ] **Step 5: Commit**

```bash
git add .skills-lab/active/refactoring-skills/coordinating-loop/implementer-prompt.md
git add .skills-lab/active/refactoring-skills/coordinating-loop/reviewer-prompt.md
git add .skills-lab/active/refactoring-skills/coordinating-loop/investigator-prompt.md
git add .skills-lab/active/refactoring-skills/coordinating-loop/SKILL.md
git commit -m "feat: add prompt templates to coordinating-loop for implementer, reviewer, investigator"
```

---

### Task 6: Clean up dead references in meta-builder

**Files:**
- Modify: `.skills-lab/active/refactoring-skills/meta-builder/SKILL.md`

- [ ] **Step 1: Read current meta-builder SKILL.md**

Run: `cat .skills-lab/active/refactoring-skills/meta-builder/SKILL.md`

- [ ] **Step 2: Remove references to non-existent scripts**

Remove any lines referencing:
- `graph-init.sh`
- `graph-traverse.sh`
- `validate-graph.sh`
- `state-persist.sh`
- `graph.json`
- `MINDNETWORK`

Replace with direct routing table (keep what works).

- [ ] **Step 3: Commit**

```bash
git add .skills-lab/active/refactoring-skills/meta-builder/SKILL.md
git commit -m "fix: remove dead script references from meta-builder SKILL.md"
```

---

### Task 7: Delete stale copy directory

**Files:**
- Delete: `.skills-lab/active/refactoring-skills/oh-my-openagent-reference copy/`

- [ ] **Step 1: Remove the stale copy**

```bash
rm -rf ".skills-lab/active/refactoring-skills/oh-my-openagent-reference copy"
```

- [ ] **Step 2: Commit**

```bash
git add -A .skills-lab/active/refactoring-skills/
git commit -m "chore: remove stale oh-my-openagent-reference copy directory"
```

---

## Execution Order

Tasks 1-4 can run in any order (independent commands).
Task 5 (prompt templates) is independent but should run before Task 6.
Task 6 (meta-builder cleanup) should run after Task 5.
Task 7 (delete copy) can run anytime.

**Recommended order:** 7 → 1 → 2 → 3 → 4 → 5 → 6

## Verification

After all tasks complete:

```bash
# All commands exist and have valid frontmatter
for cmd in investigate skill-doctor start-work plan; do
  echo "=== $cmd ==="
  head -5 .opencode/commands/$cmd.md
  echo ""
done

# Prompt templates exist
ls -la .skills-lab/active/refactoring-skills/coordinating-loop/*-prompt.md

# No dead copy
ls ".skills-lab/active/refactoring-skills/oh-my-openagent-reference copy" 2>/dev/null && echo "FAIL: copy still exists" || echo "PASS: copy removed"

# Meta-builder has no dead script refs
grep -c "graph-init\|graph-traverse\|validate-graph\|MINDNETWORK" .skills-lab/active/refactoring-skills/meta-builder/SKILL.md && echo "FAIL: dead refs remain" || echo "PASS: no dead refs"
```
