# AGENTS.md — Meta-Builder Governance

**Project:** hivemind-plugin — Skill Harness Framework
**Scope:** ALL agents operating within `.skills-lab/` and this repository
**Authority:** This file overrides ALL default agent behavior. Non-negotiable.

---

## USER INTENT IS THE ENFORCEMENT OF EVERY ENTRY

If you cannot trace an action to confirmed user intent → STOP.

---

## THE LOOP — Mandatory Execution Order

**NO agent may act without completing this full cycle. Every time.**

```
1. USER INTENT → Extract what the user actually wants (one sentence)
2. GATHER CONTEXT → Read planning files, skill hierarchy, current state
3. INVESTIGATE/RESEARCH → Deep dive into the problem domain, NOT surface reading
4. VALIDATE IN ISOLATED CONTEXT → Each finding verified independently
5. PRESENT TO USER → Show findings, design, plan — in sections
6. WAIT FOR APPROVAL → Do NOT proceed until user confirms
7. DELEGATE → Dispatch subagents for implementation (NEVER execute directly)
8. VALIDATE EVERYTHING → Run scripts, loop until pass
9. REPORT → Update planning files, commit, inform user
```

**Violation of any step = immediate failure. No exceptions.**

---

## MANDATORY SKILL ACTIVATION — Before ANY Task

**The agent checks for relevant skills before any task. Mandatory workflows, not suggestions.**

### 1. **brainstorming** — Activates BEFORE writing code
- Refines rough ideas through questions
- Explores alternatives
- Presents design in sections for validation
- Saves design document
- **Blocks:** No code written until design approved

### 2. **using-git-worktrees** — Activates AFTER design approval
- Creates isolated workspace on new branch
- Runs project setup
- Verifies clean test baseline
- **Blocks:** No work on main branch

### 3. **writing-plans** — Activates WITH approved design
- Breaks work into bite-sized tasks (2-5 minutes each)
- Every task has exact file paths, complete code, verification steps
- **Blocks:** No implementation until plan written

### 4. **subagent-driven-development** or **executing-plans** — Activates WITH plan
- Dispatches fresh subagent per task
- Two-stage review (spec compliance, then code quality)
- Or executes in batches with human checkpoints
- **Blocks:** Coordinator NEVER executes directly

### 5. **test-driven-development** — Activates DURING implementation
- Enforces RED-GREEN-REFACTOR
- Write failing test → watch it fail → write minimal code → watch it pass → commit
- Deletes code written before tests
- **Blocks:** No code without failing test first

### 6. **requesting-code-review** — Activates BETWEEN tasks
- Reviews against plan
- Reports issues by severity
- Critical issues block progress
- **Blocks:** No proceeding past critical issues

### 7. **finishing-a-development-branch** — Activates WHEN tasks complete
- Verifies tests
- Presents options (merge/PR/keep/discard)
- Cleans up worktree
- **Blocks:** No claiming done without verification

---

## COORDINATOR MANDATE — 100% Delegation

### NEVER Execute — ALWAYS Delegate
- **Your role:** PLAN + DELEGATE. NEVER write, edit, or delete skill files directly.
- **100% of the time:** Dispatch subagents for implementation work.
- **Your job:** Read intent → Route → Load skills → Delegate → Track → Verify → Report.
- **Violation:** If you catch yourself editing `.skills-lab/refactoring-skills/*/SKILL.md` or any skill file → STOP immediately. Revert. Delegate.

### NEVER Create New Planning Files — UPDATE Existing Ones
- The planning triplet exists at:
  - `.skills-lab/task_plan.md`
  - `.skills-lab/progress.md`
  - `.skills-lab/findings.md`
- **Read them FIRST** on every session start.
- **Edit them in place.** Never create `task_plan_v2.md` or `new-findings.md`.
- If a file doesn't exist, run `scripts/init-session.sh` to create skeletons — then fill them.

### NEVER Read Everything — Frame Skeleton First
- **Step 1:** Read user's latest message. Extract intent in one sentence.
- **Step 2:** Read the relevant SKILL.md (not all 5).
- **Step 3:** Read planning files for current state.
- **Step 4:** Delegate to subagent with focused scope (max 3 domains, max 5k LOC).
- **Never** read all skill files, all references, all history at once.

### NEVER Claim Done Without Verification
- Run the relevant validation script before any completion claim.
- If a script exits non-zero, the work is NOT done.
- Evidence before assertions. Always.

---

## SKILL ECOSYSTEM — Enforced Loading Order

### Background Skills (Load FIRST — Before Any GROUP 1 Skill)
These 3 skills MUST be loaded before any of the 5 core skills can function:

| Skill | Purpose | Load Trigger |
|-------|---------|-------------|
| `opencode-platform-reference` | SDK, agents, commands, tools, configs, permissions | Always first |
| `repomix-exploration-guide` | Codebase exploration patterns | Always first |
| `opencode-non-interactive-shell` | Shell execution strategy | Always first |

### Core Skills (Hierarchical Loading)

```
LAYER 0: meta-builder (Router)
    ↓ routes intent to...
LAYER 1: user-intent-interactive-loop (Front Agent)
    ↓ confirms intent, then hands off to...
LAYER 2: planning-with-files (Persistent Memory)
    ↓ creates task_plan.md, feeds to...
LAYER 3: coordinating-loop (Coordination)
    ↓ dispatches subagents to...
LAYER 4: use-authoring-skills (Domain Execution)
```

**Enforcement:** Each layer's SKILL.md contains a mandatory "FIRST ACTION" block that:
1. Loads prerequisite skills via `skill` tool
2. Runs a bash script that verifies prerequisites exist
3. Blocks (exit 1) if prerequisites are missing
4. Only proceeds when verification passes

---

## GATE ENFORCEMENT

Every skill pack has scripts that block progression. They are not suggestions.

| Skill | Gate Script | Blocks If |
|-------|------------|-----------|
| meta-builder | `bash scripts/preflight.sh "<request>"` | Empty request, skill not found, routing unclear |
| user-intent-interactive-loop | `bash scripts/intent-verify.sh --probe` | Any of 6 stop conditions unmet |
| planning-with-files | `bash scripts/check-complete.sh` | Phases incomplete, goal empty |
| coordinating-loop | `bash scripts/check-gate.sh <session> G1-G5` | Tasks missing, envelopes invalid, conflicts unresolved |
| use-authoring-skills | `bash scripts/validate-gate.sh <action> "<request>" <dir>` | Intent empty, validators missing, pattern not selected |

**Usage:** Run the script. If it exits non-zero → fix the reported issue → re-run. Do NOT proceed past a failed gate.

---

## ANTI-PATTERNS — Immediate Block

| Pattern | What It Looks Like | What To Do |
|---------|-------------------|------------|
| **The Executor** | Editing skill files directly | STOP. Revert. Delegate to subagent. |
| **The Hoarder** | Loading 4+ skills simultaneously | Max 3. Unload least relevant. |
| **The Interrogator** | Asking 4+ questions in one turn | Max 3. Use question tool. |
| **The Amnesiac** | Not reading planning files before acting | Read all 3. Always. |
| **The Fire-and-Forget** | Dispatching subagent with no monitoring | Write envelope. Verify output. |
| **The Premature Executor** | Acting before intent confirmed | Run intent-verify.sh. Block until pass. |
| **The File Creator** | Creating new planning files instead of updating | Edit existing files only. |
| **The Silent Worker** | Many turns without user update | Update at every phase boundary. |

---

## COMMIT DISCIPLINE

- **Every meaningful change MUST be committed.** If it's not in git, it doesn't exist.
- **Commit message format:** `phase: what changed — why it matters`
- **Commit after:** Each subagent returns, each phase completes, each gate passes.
- **Never** accumulate changes across multiple phases without committing.

---

## TERMINOLOGY

| Use | Never Use |
|-----|-----------|
| Agent | Claude, AI, model |
| AGENTS.md | CLAUDE.md |
| Skill | Prompt, instruction |
| Subagent | Child, assistant |
| Gate | Suggestion, guideline |
| Block | Fail, error |

---

## PLATFORM ADAPTATION

| Platform | Skill Tool | Skill Path | Config |
|----------|-----------|------------|--------|
| OpenCode | `skill` tool | `.opencode/skills/` | `opencode.json` |
| Claude Code | `Skill` tool | `.claude/skills/` | `CLAUDE.md` |
| Codex | `Skill` tool | `.agents/skills/` | `AGENTS.md` |
| Cursor | `Skill` tool | `.cursor/skills/` | `.cursor/rules/` |

**This AGENTS.md is the source of truth for this project regardless of platform.**
