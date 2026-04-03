---
name: coordinating-loop
description: Use when managing coordination between multiple agents or skills, dispatching parallel agents, deciding between sequential vs parallel execution, maintaining parent-child agent cycles, integrating ralph-loop patterns, or orchestrating multi-agent workflows. Triggers: "dispatch agents", "parallel agents", "coordinate agents", "agent handoff", "sequential vs parallel", "ralph loop", "agent lifecycle", "multi-agent workflow", "orchestrate", "loop until pass", "agent coordination".
metadata:
  audience: agent-coordinators
  workflow: multi-agent
  min-tasks: 2
  platforms: opencode,claude-ai,cowork,no-subagent
allowed-tools: Bash,Read,Write,Edit,Glob,Grep,todowrite,skill
---

# coordinating-loop

Central coordination hub for multi-agent workflows. Manages hand-offs, execution mode decisions, parent-child cycles, and ralph-loop integration. This is the glue that makes multi-agent work function as a system.

---

## When This Skill Loads — Do This First

1. **Count the tasks.** If there is only one task, do NOT load this skill. Execute directly.
2. **Check for `.coordination/` directory.** If it does not exist, run `scripts/init-session.sh <session-name>` to bootstrap.
3. **Load prerequisite skills in this order:**
   - `planning-with-files` — for task tracking (fallback: use `todowrite` if unavailable)
   - `dispatching-parallel-agents` — for parallel dispatch patterns
4. **Limit tool calls to 3 before first decision.** Do not explore the codebase, do not read files beyond what is needed to count and categorize tasks.
5. **Write the task inventory to disk immediately.** Create or update `.coordination/<session>/task_plan.md` with the list of tasks before any dispatch.

---

## Hierarchical Skill Loading Order

Skills must be loaded in this exact sequence. Each skill is a prerequisite for the next.

| Order | Skill | Purpose | Required? |
|-------|-------|---------|-----------|
| 1 | `planning-with-files` | Task tracking, progress files | Yes (fallback: `todowrite`) |
| 2 | `dispatching-parallel-agents` | Parallel dispatch mechanics | Yes |
| 3 | `use-authoring-skills` | If creating skills as part of coordination | Conditional |
| 4 | `skill-creator` | If building new skills | Conditional |
| 5 | `user-intent-interactive-loop` | If user intent is unclear | Conditional |

**Enforcement:** Before dispatching any child Agent, verify that skills 1 and 2 are loaded. If `planning-with-files` is unavailable, use `todowrite` for in-memory tracking and write findings to `.coordination/<session>/findings.md` manually.

---

## Core Coordination Loop — Procedural Steps

```
ASSESS → DECIDE MODE → DISPATCH → MONITOR → INTEGRATE → VERIFY → (loop or exit)
```

### Step 1: ASSESS — Build the Task Inventory

1. List every unit of work the user has requested or that you have identified.
2. For each task, write one line to `.coordination/<session>/task_plan.md`:
   ```
   - [ ] TASK-N: <one-line description> | files: <comma-separated paths> | domain: <category>
   ```
3. Group tasks by **file overlap** and **domain**. Tasks that touch the same file or related files go in the same group.
4. Count groups. If 1 group → sequential. If 2+ groups with no file overlap → candidate for parallel.

### Step 2: DECIDE MODE — Use the Fixed Flowchart

```
Multiple tasks?
  ├─ No  → Execute directly. Exit this skill.
  └─ Yes
       │
       ▼
  Any tasks share files or mutable state?
  ├─ Yes → Sequential. Go to DISPATCH.
  └─ No
       │
       ▼
  3+ independent task groups?
  ├─ Yes → Parallel dispatch. Go to DISPATCH.
  └─ No (1-2 groups)
       │
       ▼
  Are tasks exploratory (root cause unknown)?
  ├─ Yes → Sequential. Investigate first, reassess after findings.
  └─ No  → Sequential (coordination overhead exceeds benefit).
```

**Reassessment rule:** If during execution you discover tasks you thought were independent actually share state, HALT remaining parallel agents, collect results, and switch to sequential. Write the reassessment to `progress.md`.

### Step 3: DISPATCH — Construct and Send Task Envelopes

Every child Agent receives a **Task Envelope**. Use the filled-in template from `references/01-handoff-protocols.md`. The envelope must include:
- Task description (one sentence)
- Scope boundaries (include/exclude file lists)
- Context payload (only what is needed — see context filtering guide in `references/03-parent-child-cycles.md`)
- Expected output format
- Verification step (concrete command or check)

**Before dispatching, run:** `scripts/coordination-check.sh <session>` — this validates that task envelopes exist and scope boundaries are defined.

### Step 4: MONITOR — Check at Gates, Not Continuously

The parent Agent does NOT micromanage. It checks at defined points:
1. After each child returns — verify the output matches the expected format.
2. After all children return — check for file conflicts.
3. If a child fails — classify as retryable or escalation (see `references/03-parent-child-cycles.md`).

### Step 5: INTEGRATE — Merge Results

1. Read each child's output file.
2. Check for overlapping file modifications. If found, resolve manually or dispatch a focused integration Agent.
3. Run the full validation suite (tests, builds, or whatever the project uses).
4. Write an integration report to `.coordination/<session>/findings.md`.

### Step 6: VERIFY — Gate Check

Run `scripts/coordination-check.sh <session>`. If all gates pass, the loop exits. If any gate fails, loop back to the phase where the failure originated. **Maximum 3 full loop cycles** before escalation to the user.

---

## Worked Example: Coordinating 3 Subagents Through Skill Creation

**Scenario:** User says "Create a skill for deep-research that uses repomix to analyze codebases."

### Phase 1: ASSESS

The parent Agent identifies 3 independent tasks:
```
- [ ] TASK-1: Write SKILL.md frontmatter and trigger phrases | files: .opencode/skills/deep-research/SKILL.md | domain: skill-structure
- [ ] TASK-2: Create reference documents for repomix integration | files: .opencode/skills/deep-research/references/*.md | domain: documentation
- [ ] TASK-3: Write validation script for the skill pack | files: deep-research/scripts dir | domain: tooling
```

No file overlap. 3 independent groups → **parallel dispatch**.

### Phase 2: DISPATCH — Filled-In Task Envelopes

**Envelope for Child Agent 1 (SKILL.md author):**
```markdown
## Task
Write the SKILL.md file for a new "deep-research" skill at .opencode/skills/deep-research/SKILL.md

## Scope
- Work on: .opencode/skills/deep-research/SKILL.md only
- Do NOT touch: Any other files in the repository

## Context
The skill should trigger on: "deep research", "comprehensive analysis", "research report".
It must use YAML frontmatter with name, description, and metadata fields.
The skill body should contain procedural guidance for conducting research using repomix.
Reference existing skill patterns in .opencode/skills/use-authoring-skills/SKILL.md for structure.

## Expected Output
- A complete SKILL.md file (300+ lines) with frontmatter, procedural steps, and cross-references
- The file must pass validation via the use-authoring-skills validate-skill.sh script

## Verification
- Run: bash -n on any embedded scripts
- Run: head -5 .opencode/skills/deep-research/SKILL.md to confirm frontmatter
```

**Envelope for Child Agent 2 (Reference author):**
```markdown
## Task
Create reference documents for repomix integration patterns at .opencode/skills/deep-research/references/

## Scope
- Work on: .opencode/skills/deep-research/references/ directory only
- Do NOT touch: SKILL.md or any files outside references/

## Context
Create 3 reference files:
1. 01-repomix-patterns.md — How to use repomix for codebase analysis
2. 02-source-credibility.md — How to score and filter research sources
3. 03-synthesis-templates.md — Templates for research reports

Read .opencode/skills/repomix-exploration-guide/SKILL.md for repomix patterns.

## Expected Output
- 3 markdown files in .opencode/skills/deep-research/references/
- Each file 100+ lines with concrete examples, not just templates

## Verification
- Run: ls -la .opencode/skills/deep-research/references/ — confirm 3 files exist
- Run: wc -l .opencode/skills/deep-research/references/*.md — confirm each >100 lines
```

**Envelope for Child Agent 3 (Script author):**
```markdown
## Task
Write a validation script for the deep-research skill pack

## Scope
- Work on: the validation script file in the deep-research skill's scripts directory only
- Do NOT touch: Any other files

## Context
The script should validate:
1. SKILL.md exists with valid frontmatter
2. references/ directory has at least 2 files
3. All referenced files in SKILL.md exist
4. No banned terminology (CLAUDE.md, "Claude" as agent name)

Use the pattern from the use-authoring-skills validation script as a template.

## Expected Output
- A bash script that exits 0 on success, 1 on failure
- Script must pass bash syntax check

## Verification
- Run: bash -n on the validation script
- Run: the validation script against the deep-research skill directory
```

### Phase 3: MONITOR

Each child Agent returns independently. The parent checks:
- Child 1: SKILL.md exists, frontmatter valid, 300+ lines → PASS
- Child 2: 3 reference files exist, each >100 lines → PASS
- Child 3: Script passes `bash -n`, runs without error → PASS

### Phase 4: INTEGRATE

The parent reads all outputs, confirms no file overlap (each child touched different paths), runs the full validation:
```bash
bash the use-authoring-skills validation script against the deep-research skill directory
```

### Phase 5: VERIFY

All gates pass. Loop exits. Parent reports success to user.

---

## Hand-off Protocol — Filled-In Example

See `references/01-handoff-protocols.md` for the complete protocol. Here is the minimum viable hand-off, filled in:

```markdown
## Task
Fix the 3 failing tests in tests/lib/session-api.ts

## Scope
- Include: tests/lib/session-api.ts, src/lib/session-api.ts
- Exclude: All other test files, all production code outside session-api.ts

## Context
Error: "TypeError: client.waitForSession is not a function"
The SDK call pattern changed in the latest version. The multi-path fallback at
src/lib/session-api.ts:142-168 needs updating. Tests fail at lines 45, 78, 112.

## Expected Output
- Summary of root cause
- List of changes made (file:line format)
- Confirmation that all 3 tests pass

## Verification
Run: npm test -- tests/lib/session-api.ts — all must pass

## Constraints
- Do NOT modify files outside session-api.ts
- Do NOT change existing behavior except where specified
- Do NOT introduce new dependencies
- Return summary even if task cannot be completed
```

**Receipt confirmation** (what the child should return before starting):
```markdown
## Confirmation
- Task understood: Fix 3 failing tests in session-api.ts caused by SDK API change
- Scope boundaries: Only session-api.ts (test and source), nothing else
- Verification step: npm test -- tests/lib/session-api.ts must pass
- Any ambiguities: None — proceeding
```

---

## Decision Flowchart — Fixed

The previous flowchart had a logical contradiction (redundant independence check). The corrected version above eliminates the dead end and adds a reassessment path.

**Key changes from the broken version:**
1. Removed the redundant "tasks touch same files" check — it was already covered by "share files or mutable state."
2. Added the "exploratory" branch — if root cause is unknown, investigate sequentially first.
3. Added the reassessment rule — if parallel agents discover shared state, halt and switch to sequential.

---

## Gate System — Measurable Criteria

Every gate has a concrete, measurable pass criterion. No subjective judgment.

| Gate | Phase | Pass Criterion | How to Verify |
|------|-------|----------------|---------------|
| G1 | ASSESS | All tasks identified, grouped, and written to `task_plan.md` | `grep -c "TASK-" .coordination/<session>/task_plan.md` > 0 |
| G2 | DISPATCH | Every task has a Task Envelope with all 5 required sections | `scripts/coordination-check.sh <session>` exits 0 |
| G3 | MONITOR | All dispatched agents returned output; no orphans | `scripts/loop-status.sh <session>` shows all children "complete" |
| G4 | INTEGRATE | No file conflicts; full validation suite passes | Run project tests/build; exit code 0 |
| G5 | VERIFY | All acceptance criteria met; integration report written | `grep -c "complete\|passed" .coordination/<session>/progress.md` matches gate count |

**Loop termination:** Maximum 3 full cycles through G1→G5. If G5 fails on the 3rd cycle, escalate to the user with a summary of what was attempted and what failed.

---

## Parent-Child Cycle — Filled-In Prompt Template

See `references/03-parent-child-cycles.md` for the complete lifecycle. Here is a filled-in prompt template:

```markdown
You are a specialized Agent tasked with: Writing the SKILL.md file for a new "deep-research" skill

## Context
The skill lives at .opencode/skills/deep-research/SKILL.md. It must have YAML frontmatter
with name, description, and metadata fields. The body should contain procedural guidance
for conducting research. The skill should be 300+ lines.

Existing skill patterns to follow:
- .opencode/skills/use-authoring-skills/SKILL.md (structure reference)
- .opencode/skills/skill-creator/SKILL.md (frontmatter reference)

## Scope
- Work on: .opencode/skills/deep-research/SKILL.md only
- Do NOT touch: Any other files in the repository

## Expected Output
- A complete SKILL.md file with valid frontmatter and procedural body content
- Summary of sections created and line count

## Verification
- Run: head -5 .opencode/skills/deep-research/SKILL.md — confirm frontmatter opens with ---
- Run: wc -l .opencode/skills/deep-research/SKILL.md — confirm >300 lines

## Constraints
- Do NOT modify files outside scope
- Do NOT introduce new dependencies
- Return summary even if task cannot be completed
```

### Context Filtering Guide

When constructing a child Agent's context, apply these rules:

| Include | Exclude |
|---------|---------|
| File paths the child will modify | Full session history |
| Error messages or failure output | Unrelated test failures |
| Relevant code snippets (max 50 lines) | Design debates or alternatives |
| Expected output format | Internal coordination decisions |
| Verification commands | Speculative hypotheses |
| Existing patterns to follow (1-2 examples) | Other skills' internal content |

**Rule of thumb:** If the child does not need a piece of information to complete its task, do not include it.

---

## Recovery Protocol — When Nothing Exists

When coordination state is lost or the session was interrupted:

### Step 1: Git-Based Recovery
```bash
git log --oneline -10
git status
git diff --name-only HEAD~1
```
Read the last 10 commits and any uncommitted changes. Identify what work was done.

### Step 2: Filesystem Scan
```bash
find . -name "*.md" -mmin -60 -not -path "*/node_modules/*" -not -path "*/.git/*"
find . -name "task_plan.md" -o -name "findings.md" -o -name "progress.md" 2>/dev/null
```
Find all markdown files modified in the last 60 minutes. Look for coordination state files.

### Step 3: Phase Detection
Based on observable artifacts, determine your phase:
- **ASSESS:** No task files exist, or only a user request exists → start from ASSESS.
- **DISPATCH:** `task_plan.md` exists with tasks listed but no child output files → resume at DISPATCH.
- **MONITOR:** Child output files exist but integration report is missing → resume at MONITOR.
- **INTEGRATE:** Integration report exists but validation has not been run → resume at INTEGRATE.
- **VERIFY:** Validation was run but gates did not all pass → resume at the failed gate.

### Step 4: Bootstrap If Nothing Exists
If no artifacts exist at all:
1. Run `scripts/init-session.sh <session-name>` to create the coordination directory.
2. Re-read the user's original request.
3. Start from ASSESS with fresh context.

---

## Anti-Patterns — Detection and Correction

| Anti-Pattern | Detection Procedure | Corrective Action |
|-------------|-------------------|-------------------|
| **The Broadcast** — Sending full session history to every child | Check child prompt length. If >500 characters of context, you are broadcasting. | Rewrite the prompt. Include only file paths, error messages, and expected output. |
| **The Fire-and-Forget** — Dispatching with no monitoring plan | Before dispatch, ask: "What will I check when the child returns?" If no answer, you are fire-and-forget. | Write the verification step into the Task Envelope before dispatching. |
| **The False Parallel** — Parallel agents for tasks that share state | Run the independence criteria from the flowchart above. If any criterion fails, do not dispatch in parallel. | Switch to sequential execution. |
| **The Orphan Loop** — Ralph-loop with no exit condition | Before starting a loop, write: "Loop exits when: <specific criteria>." If you cannot fill this in, do not start the loop. | Define acceptance criteria first. |
| **The Context Leak** — Child modifying files outside scope | After child returns, run: `git diff --name-only` and compare against the scope boundaries in the Task Envelope. | Revert out-of-scope changes. Re-dispatch with clearer boundaries. |
| **The Silent Failure** — Child fails but parent does not detect | After each child returns, check: did it run its verification step? If not, the child failed silently. | Require receipt confirmation. Re-dispatch with clearer instructions. |
| **The Coordinator Executor** — Parent doing the child's work | Count how many files the parent modified directly. If >0 files that were assigned to a child, you are executing. | Stop. Delegate. Only integrate, never implement. |
| **The Infinite Retry** — Retrying without changing approach | Track retry count per task. If retry count > 1, stop. | Escalate to the user with a summary of what was attempted. |

---

## Platform Adaptation

### OpenCode (Full Access)
- Use all scripts as written.
- Dispatch subagents via `@general` or `@<custom-agent>`.
- Use `skill` tool to load prerequisite skills.
- Write coordination state to `.coordination/` directory.

### Claude.ai (No Subagents, No Bash)
- **Cannot dispatch subagents.** Execute tasks sequentially within the same conversation.
- **Cannot run scripts.** Perform gate checks manually:
  - G1: Count tasks in your response. Write task list as markdown.
  - G2: Verify each task has all 5 envelope sections before starting.
  - G3: After each task, confirm the verification step passed.
  - G4: Review all changes for conflicts before declaring done.
  - G5: Check all acceptance criteria are met.
- **No `.coordination/` directory.** Use the conversation itself as state. Write progress as numbered sections in your response.
- **Maximum 5 tool calls per decision point** to avoid context overflow.

### Cowork (Subagents, No Bash)
- Dispatch subagents via the platform's subagent mechanism.
- **Cannot run scripts.** Perform gate checks manually (same as Claude.ai above).
- Write coordination state to files if the platform allows file writes.
- If file writes are not allowed, use the platform's feedback mechanism to track progress.

### No-Subagent Fallback (Any Platform)
When subagent dispatch is unavailable:
1. **Execute sequentially.** Do one task at a time.
2. **Write state to disk** after each task completes.
3. **Use the same gate system** — verify each gate manually before proceeding.
4. **Limit scope per task** — even without subagents, treat each task as if it were a separate Agent with its own boundaries.

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `dispatching-parallel-agents` | This skill builds ON TOP of it. Use for parallel dispatch patterns. |
| `user-intent-interactive-loop` | Captures user intent before coordination begins. |
| `planning-with-files` | Maintains task_plan.md, findings.md, progress.md for long-running coordination. |
| `skill-creator` | Use when creating new skills as part of coordinated workflows. |
| `gcc` | Git-backed memory for coordination state across sessions. |

---

## Kit Bundle Contents

| Component | Purpose |
|-----------|---------|
| `SKILL.md` | Entry point with decision flowcharts, worked example, and procedural guidance |
| `references/01-handoff-protocols.md` | Context transfer patterns with filled-in examples |
| `references/02-sequential-vs-parallel.md` | Fixed execution mode decision framework with reassessment |
| `references/03-parent-child-cycles.md` | Nested agent lifecycle with filled-in prompt templates |
| `references/04-ralph-loop-integration.md` | Skill-authoring workflow mapping with shipped hooks |
| `scripts/init-session.sh` | Creates `.coordination/` directory and session structure |
| `scripts/coordination-check.sh` | Validates coordination state and gate passage (with bootstrap mode) |
| `scripts/loop-status.sh` | Reports current loop phase and progress (with bootstrap mode) |

---

## Recovery Protocol

When coordination state is lost or session interrupted:

1. **Git recovery:** `git log --oneline -10` and `git status` — what was committed?
2. **Filesystem scan:** `find . -name "*.md" -mmin -60` — what was modified?
3. **Phase detection:** Based on artifacts (see Phase Detection table above), determine your phase.
4. **Bootstrap if needed:** Run `scripts/init-session.sh <session-name>` if `.coordination/` does not exist.
5. **Resume from last passed gate.** Do not restart from scratch unless no artifacts exist.
