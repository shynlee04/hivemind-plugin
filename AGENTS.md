# AGENTS.md — HiveMind V3 Platform Harness Governance

**Project:** HiveMind V3 Platform Harness
**Scope:** Full runtime framework for building, composing, and executing AI agent meta-concepts on OpenCode. Encompasses: agents, commands, permissions, tools, hooks, plugins, configs, rules, MCP/LSP, Node.js CLI substrate, eval harness, and runtime composition engine. NOT just skill packs.
**Authority:** This file overrides ALL default agent behavior. Non-negotiable.

---

## USER INTENT IS THE ENFORCEMENT OF EVERY ENTRY

If you cannot trace an action to confirmed user intent → STOP.

---

## PROJECT IDENTITY

This is the **HiveMind V3 Platform Harness** — a complete runtime framework superior to both GSD and oh-my-openagent. It is NOT a collection of static `.md` files.

### What This Project IS
- Runtime build-on-demand: agents call agents to compose prompts, parse commands, and build configurations dynamically
- Centralized Node.js CLI (`bin/hivemind-tools.cjs`) with domain modules in `bin/lib/`
- Full OpenCode concept coverage: agents, commands, permissions, tools, hooks, plugins, configs, rules, MCP/LSP
- Dual packaging: `@hivemind/hivemind-plugin` (npm SDK) + `npx skills add owner/repo --skill name` (git-based)
- Eval harness integrated into CLI (`hivemind-tools eval run`)

### What This Project is NOT
- Static `.md` files acting as agent definitions (templates/references only)
- Bash scripts scattered across directories (replaced by CLI substrate)
- Skill-pack-only project (skills are one component, not the whole)

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

## RUNTIME PRINCIPLES

### Build-on-Demand (NOT Static .md)
Static `.md` files are templates and references. The harness BUILDS agent configurations at runtime by:
- Composing prompts from template fragments + context
- Parsing commands dynamically via CLI router
- Assembling meta-concepts (agents calling agents) at execution time
- Loading only SKILL.md + dependency summaries + relevant code snippets per execution

### Clean Context Windows
Each skill/subagent execution occurs in a fresh, minimal context window. No context pollution from chat history or irrelevant project docs. Load exactly what is needed, nothing more.

### Runtime Features (from oh-my-openagent)
- **Background agents**: Run agents in background, continue working, retrieve results when ready
- **Auto-loop / Ralph-loop**: Self-referential dev loop that runs until task completion
- **Delegation chain with task persistence**: Tasks persist across sessions via planning triplet
- **Task queuing (full autonomy)**: Agents queue tasks, manage their own execution order
- **Category system**: Agent configuration presets optimized for specific domains (visual-engineering, deep, quick, ultrabrain, etc.)
- **Session recovery**: Automatic recovery from tool failures, thinking block violations, empty messages, context overflow

### CLI Architecture (from GSD research)
Central Node.js CLI router with domain modules:

| Module | Purpose |
|--------|---------|
| `bin/hivemind-tools.cjs` | Central router (modeled after gsd-tools.cjs) |
| `bin/lib/core.cjs` | Core utilities, cross-cutting concerns |
| `bin/lib/state.cjs` | State management, planning triplet I/O |
| `bin/lib/skill.cjs` | Skill discovery, validation, loading |
| `bin/lib/eval.cjs` | Eval harness, benchmarking, scoring |
| `bin/lib/scaffold.cjs` | Project scaffolding, template generation |
| `bin/lib/config.cjs` | Configuration management, platform detection |

CLI flags: `--raw` (JSON output), `--cwd` (sandboxed execution), `--pick` (field extraction).

### Dual Packaging
- **Full SDK:** `@hivemind/hivemind-plugin` (npm) — CLI + SDK + all skills
- **Individual skills:** `npx skills add owner/repo --skill name` (git-based)
- **Skill contract:** SKILL.md with YAML frontmatter, portable across Claude Code, OpenCode, Codex, Cursor

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

## HARNESS ECOSYSTEM — Enforced Loading Order

The harness is NOT just skills — it is the full platform composition engine. The hierarchy below is built at RUNTIME by the harness, not loaded as static files.

### Background Skills (Load FIRST — Before Any Core Skill)
These 3 skills MUST be loaded before any core skill can function:

| Skill | Purpose | Load Trigger |
|-------|---------|-------------|
| `opencode-platform-reference` | SDK, agents, commands, tools, configs, permissions | Always first |
| `repomix-exploration-guide` | Codebase exploration patterns | Always first |
| `opencode-non-interactive-shell` | Shell execution strategy | Always first |

### Core Skills (Hierarchical Loading — Runtime Composition)

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

**Enforcement:** The harness builds each layer at runtime. Each layer verifies its prerequisites before executing. Missing prerequisites = immediate block.

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
| **The Static Thinker** | Building agents as static .md files | Use runtime build-on-demand. Templates are references only. |
| **The Bash Scattered** | Adding bash scripts outside bin/ | All scripts go through CLI substrate (bin/hivemind-tools.cjs). |

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
| Harness | Framework, system |
| Runtime composition | Static definition |

---

## PLATFORM ADAPTATION

| Platform | Skill Tool | Skill Path | Config |
|----------|-----------|------------|--------|
| OpenCode | `skill` tool | `.opencode/skills/` | `opencode.json` |
| Claude Code | `Skill` tool | `.claude/skills/` | `CLAUDE.md` |
| Codex | `Skill` tool | `.agents/skills/` | `AGENTS.md` |
| Cursor | `Skill` tool | `.cursor/skills/` | `.cursor/rules/` |

**This AGENTS.md is the source of truth for this project regardless of platform.**
