# Improvement Packages Spec — HiveMind Skill Refactoring

**Created:** 2026-04-05
**Status:** DRAFT — Awaiting user approval
**Source:** Superpowers chaining analysis + .skills-lab audit + session-ses_2a77 export + advanced-use-cases-2026-04-04

---

## What This Document Is

Actionable improvement packages. Each package: what to change, why, how it chains, what guardrails it adds. No jargon. No "MINDNETWORK graphs." Just: fix this, in this order, with these patterns.

---

## Diagnosis Summary

### What Works (Keep These)
| Skill | Why It Works | Superpowers Equivalent |
|-------|-------------|----------------------|
| planning-with-files | 3-file persistence, tiered response, session recovery | writing-plans (different scope — planning-with-files is broader) |
| user-intent-interactive-loop | Probing questions, intent confirmation, max-3 discipline | brainstorming (different — intent probing vs design-first) |
| opencode-platform-reference | Massive reference docs, SDK, configs, source code | No equivalent — unique value |
| repomix-exploration-guide | Codebase exploration patterns, CLI commands | No equivalent — unique value |
| opencode-non-interactive-shell | Shell execution strategy for headless agents | No equivalent — unique value |

### What's Broken (Fix These)
| Skill | Issue | Priority |
|-------|-------|----------|
| meta-builder | Routes but never executes; references graph.json/scripts that don't exist; no real handoff protocol | HIGH |
| coordinating-loop | Thin dispatch without review loops, no status protocol, no escalation | HIGH |
| use-authoring-skills | Has scripts but many are stubs; validate-gate.sh exits 0 always; check-overlaps.sh is placeholder | MEDIUM |
| repomix-explorer | Works but thin; no chaining to other skills | LOW |
| oh-my-openagent-reference | 87MB reference bloat; copy/ directory is stale | LOW |
| hivefiver agent | Single agent doing too much; no team; wrong permissions (skill: "*" ask by default) | HIGH |

### What's Missing (Superpowers Has, We Don't)
| Capability | Superpowers Pattern | .skills-lab Gap |
|-----------|-------------------|-----------------|
| Design-first enforcement | brainstorming → hard gate → no implementation without approved spec | No brainstorming skill |
| TDD discipline | Iron Law: no production code without failing test | No TDD skill |
| Review loops | 3-iteration review with escalation | coordinating-loop has no review loop |
| Context isolation | Subagents get crafted context, never session history | coordinating-loop passes everything |
| Implementer status protocol | DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED | No structured status |
| Two-stage review | Spec compliance FIRST → then code quality | No staged review |
| Verification gate | No completion claims without fresh evidence | No verification skill |
| Git worktree integration | Isolated workspace before execution | No worktree skill |
| Branch finishing | 4 structured options after implementation | No finishing skill |
| Description-as-trigger | Descriptions = triggering conditions only | Some .skills-lab descriptions are workflow summaries |

---

## Package A: Command Stacking — Replicate Superpowers Natural Handoff

**Goal:** Create 4 commands that chain skills the way superpowers chains naturally — without requiring the user to know which skill to invoke.

### Command A1: `/start-work <description>`
**What it does:** Complete delegation cycle — intent → plan → execute → verify → deliver

**Skill chain:**
```
user-intent-interactive-loop (probe intent, max 3 questions)
  → planning-with-files (create 3-file plan)
    → [subagent dispatch per task]
      → verification-before-completion (per task)
    → finishing report
```

**Handoff protocol:**
1. Intent skill writes `findings.md` with confirmed requirements
2. Planning skill reads `findings.md`, writes `task_plan.md`
3. Coordinator reads `task_plan.md`, dispatches builder subagents per task
4. Each subagent must pass verification before marking complete
5. Final report in `progress.md`

**Guardrails:**
- Max 3 intent questions (from user-intent-interactive-loop)
- Plan review gate (planning-with-files checkpoint)
- No "done" without evidence (verification pattern)
- 3-iteration retry per task, then escalate to user

**Command frontmatter:**
```yaml
---
description: "Start a complete work cycle: probe intent, plan, delegate, verify. Use for any implementation task."
arguments:
  - name: description
    description: "What you want built, fixed, or investigated"
---
```

### Command A2: `/investigate <topic>`
**What it does:** Deep research cycle — gather context → synthesize → deliver findings

**Skill chain:**
```
opencode-platform-reference (load SDK/docs context)
  → repomix-exploration-guide (explore codebase)
    → planning-with-files (track findings)
      → deliver to findings.md
```

**Key difference from /start-work:** Investigation never delegates to builder subagents. It's read-only research that produces a document, not code.

### Command A3: `/doctor-skills`
**What it does:** Diagnostic cycle — scan skills → find issues → report fixes

**Skill chain:**
```
use-authoring-skills (doctor/audit path)
  → validate-gate.sh (check each skill)
    → check-overlaps.sh (find duplicates)
      → report in findings.md
```

### Command A4: `/review <target>`
**What it does:** Two-stage review — spec compliance → code quality

**Skill chain:**
```
Stage 1: Spec reviewer subagent (does output match requirements?)
  → IF FAIL: fix → re-run Stage 1
  → IF PASS: Stage 2: Code quality reviewer
    → IF FAIL: fix → re-run Stage 2
    → IF PASS: mark complete
```

**This is the superpowers two-stage review pattern, adapted as a command.**

---

## Package B: Skill Improvements — Fix the Broken Ones

### B1: Fix coordinating-loop (HIGH PRIORITY)

**Current state:** Thin dispatch, no review loops, no status protocol, no escalation.
**Target state:** Match superpowers subagent-driven-development pattern.

**Changes needed:**
1. Add implementer status protocol: DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED
2. Add two-stage review order: spec compliance FIRST, then code quality
3. Add context isolation rule: "Subagents get crafted context, never session history"
4. Add 3-iteration escalation rule: same approach fails 3× → change approach or escalate
5. Add "same agent fixes own work" rule: reviewer finds issue → original creator fixes it

**Guardrail additions:**
```
ANTI-PATTERN: Dispatching subagent without monitoring
FIX: Write delegation envelope in progress.md before dispatch. Check output on return.

ANTI-PATTERN: Parallel implementers on same files
FIX: Never dispatch two implementers to same file domain. Use file ownership locks in task_plan.md.

ANTI-PATTERN: Skipping spec review
FIX: Spec compliance MUST pass before code quality review starts.
```

### B2: Fix meta-builder (HIGH PRIORITY)

**Current state:** References non-existent scripts (graph-init.sh, validate-graph.sh), has routing table but no handoff protocol.

**Changes needed:**
1. Remove references to non-existent scripts (graph-init.sh, validate-graph.sh, validate-graph.sh)
2. Add handoff protocol: when routing to use-authoring-skills, what gets passed
3. Add "max 3 skills per stack" enforcement with actual mechanism (not just a claim)
4. Add routing verification: after routing, check that target skill exists before activating

**Simplified routing (remove graph complexity):**
```
User says...                    → Route to
──────────────────────────────────────────────
"create/edit/audit a skill"     → use-authoring-skills
"create an agent"               → opencode-platform-reference (agents section)
"create a command"              → opencode-platform-reference (commands section)
"configure opencode"            → opencode-platform-reference (configs section)
"build a custom tool"           → opencode-platform-reference (custom-tools section)
"stack skills" / "combine"      → This skill + target skills (max 3)
"investigate" / "research"      → repomix-exploration-guide + planning-with-files
"something's broken" / "doctor" → use-authoring-skills (doctor path)
```

### B3: Fix use-authoring-skills scripts (MEDIUM PRIORITY)

**Current state:** Scripts exist but are stubs. validate-gate.sh exits 0 always. check-overlaps.sh is placeholder.

**Changes needed:**
1. Make validate-gate.sh actually validate: check SKILL.md exists, frontmatter has name+description, description follows trigger pattern
2. Make check-overlaps.sh actually scan: grep all SKILL.md descriptions for overlapping trigger phrases
3. Make validate-skill.sh check: frontmatter format, no banned fields, description is trigger-based not workflow-based
4. Add description-as-trigger validation: descriptions must start with "Use when..." not "This skill handles..."

---

## Package C: Agent Team — Replace Single Hivefiver

**Current state:** One agent (hivefiver) does everything. Permissions are wrong (skill: "*" ask by default).

**Target state:** 3 specialized agents that mirror superpowers chain.

### Agent C1: coordinator (replaces hivefiver)
**Role:** Route intent, dispatch subagents, never execute directly
**Temperature:** 0.2
**Permissions:**
```yaml
skill:
  "*": ask
  "planning-with-files": allow
  "user-intent-interactive-loop": allow
  "coordinating-loop": allow
  "meta-builder": allow
bash:
  "git status*": allow
  "git diff*": allow
  "git log*": allow
  "npm run typecheck": allow
  "npm run build": allow
  "npm test": allow
task: allow
```

### Agent C2: builder
**Role:** Execute implementation tasks delegated by coordinator
**Temperature:** 0.4
**Permissions:**
```yaml
bash:
  "*": ask
  "git add*": allow
  "git commit*": allow
  "npm test*": allow
  "npm run typecheck": allow
  "npm run build": allow
skill:
  "*": ask
  "opencode-platform-reference": allow
  "opencode-non-interactive-shell": allow
edit: allow
write: allow
read: allow
```

### Agent C3: critic
**Role:** Two-stage review — spec compliance then code quality
**Temperature:** 0.1
**Permissions:**
```yaml
bash:
  "git diff*": allow
  "git log*": allow
  "npm test*": allow
  "npm run typecheck": allow
  "npm run build": allow
read: allow
grep: allow
glob: allow
skill:
  "*": ask
  "opencode-platform-reference": allow
task: ask  # critic never dispatches further
```

---

## Package D: Guardrail Loop Improvements

### D1: Spec-Driven Research→Plan→Build→Verify Loop

This is the core loop that superpowers gets right and we need to replicate.

**The Loop:**
```
RESEARCH phase:
  1. Load opencode-platform-reference (SDK context)
  2. Load repomix-exploration-guide (exploration patterns)
  3. Investigate codebase → write findings.md
  4. Gate: findings.md must have >= 3 concrete findings before proceeding

PLAN phase:
  1. Read findings.md
  2. Load planning-with-files
  3. Create task_plan.md with bite-sized tasks (2-5 min each)
  4. Plan review: coordinator re-reads, checks for gaps
  5. Gate: user approves plan before any execution

BUILD phase:
  1. Read task_plan.md
  2. For each task:
     a. Dispatch builder subagent with FULL TASK TEXT (not file path)
     b. Builder returns status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
     c. IF DONE: proceed to verify
     d. IF DONE_WITH_CONCERNS: coordinator reviews concerns
     e. IF NEEDS_CONTEXT: coordinator provides, re-dispatch
     f. IF BLOCKED: coordinator assesses, escalates if needed
  3. After each task: run verification (see D2)

VERIFY phase:
  1. Run npm test → must pass
  2. Run npm run typecheck → must pass
  3. Run npm run build → must pass
  4. IF any fail: fix → re-run all 3
  5. Gate: all 3 pass before "done"
  6. Update progress.md with evidence
```

### D2: Verification Gate Function

**Adapted from superpowers verification-before-completion:**

```
IDENTIFY: What command proves this claim?
RUN: Execute the FULL command (fresh, complete)
READ: Full output, check exit code, count failures
VERIFY: Does output confirm the claim?
  - If NO: State actual status with evidence. Do NOT claim done.
  - If YES: State claim WITH evidence (paste command output).
ONLY THEN: Make the claim.
```

**Applied everywhere:**
- Before marking any task_plan.md task as complete
- Before claiming a build passes
- Before claiming tests pass
- Before claiming a skill is fixed
- Before claiming refactoring is done

### D3: 3-Iteration Escalation Rule

```
Same approach fails 3 times → CHANGE APPROACH
  - Different tool
  - Different method
  - Different decomposition
If 3 different approaches all fail → ESCALATE to user
  - Present what was tried
  - Present what is needed
  - Ask for direction
Never silently retry the same failing action.
```

### D4: Context Isolation Rule

```
Subagents get CRAFTED CONTEXT, never session history.
  - Implementer subagent: full task text + scene-setting + file structure
  - Reviewer subagent: document path + reference spec (never author's thought process)
  - Researcher subagent: scope definition + output format (never other investigation state)
```

**Anti-pattern this prevents:**
- Subagent getting confused by coordinator's reasoning
- Reviewer being influenced by author's intent instead of work product
- Context bloat from passing entire session history

---

## Package E: New Skills to Create

### E1: verification-skill (New)
**Model:** superpowers verification-before-completion
**Trigger:** Before claiming any work is done

**Core content:**
```
IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

Gate function:
1. IDENTIFY what proves the claim
2. RUN the full command fresh
3. READ full output + exit code
4. VERIFY output confirms claim
5. ONLY THEN make the claim

Red flags (means STOP):
- "should work" / "probably passes" / "seems like"
- Claiming done without pasting command output
- Using old test results (stale > 5 min)

Rationalization table:
| Thought | Reality |
|---------|---------|
| "I just ran this" | Run it again. Fresh evidence. |
| "The tests passed earlier" | Earlier ≠ now. Run again. |
| "It's a simple change" | Simple changes break too. Verify. |
| "I can see it's correct" | Eyes ≠ execution. Run the command. |
```

### E2: brainstorming-skill (New)
**Model:** superpowers brainstorming
**Trigger:** Before any creative/architectural work

**Core content:**
```
HARD GATE: No implementation until design is presented and approved.

Process:
1. Explore user intent (one sentence)
2. Ask clarifying questions (one at a time, max 3)
3. Propose 2-3 approaches with tradeoffs
4. Present recommended approach with rationale
5. Wait for user approval
6. Write spec to docs/specs/YYYY-MM-DD-<topic>-design.md
7. Spec review loop (subagent reviewer, max 3 iterations)
8. ONLY after approval: invoke planning-with-files

YAGNI enforcement:
- If approach includes "we might need X later" → remove X
- If scope is > 1 subsystem → decompose into separate specs
- If spec > 200 lines → too complex, split it
```

---

## Implementation Priority Order

| Priority | Package | Effort | Impact |
|----------|---------|--------|--------|
| 1 | D1-D4: Guardrail loops | LOW (patterns, not code) | HIGH — these are what make everything else work |
| 2 | B1: Fix coordinating-loop | MEDIUM | HIGH — this is the dispatch core |
| 3 | B2: Fix meta-builder | LOW | MEDIUM — routing is simpler than it thinks |
| 4 | A1: /start-work command | MEDIUM | HIGH — user's primary entry point |
| 5 | C1-C3: Agent team | LOW (YAML files) | HIGH — replaces broken hivefiver |
| 6 | E1: verification-skill | LOW | HIGH — the ultimate guardrail |
| 7 | A2-A4: Other commands | LOW each | MEDIUM — additional entry points |
| 8 | E2: brainstorming-skill | MEDIUM | MEDIUM — prevents premature execution |
| 9 | B3: Fix use-authoring-skills scripts | HIGH (real bash) | MEDIUM — scripts need real implementation |

---

## What NOT To Do

1. **Don't create MINDNETWORK graph infrastructure** — superpowers works without it. Use simple skill chaining.
2. **Don't build a CLI substrate yet** — that's Phase 5 of the master plan. Skills and commands first.
3. **Don't create more than 4 commands** — start with A1-A4. Add more only when these work.
4. **Don't duplicate superpowers skills** — if superpowers already has it (writing-plans, tdd, etc.), USE it. Don't reimplement.
5. **Don't touch .opencode/skills/** — work in .skills-lab/active/ only. Migration comes later.
6. **Don't create new planning files** — this spec is the plan. Update it in place.

---

## Cross-Reference: What This Connects To

| This Spec | Connects To | How |
|-----------|-------------|-----|
| Package A (commands) | .opencode/commands/ | Commands created there reference skills here |
| Package B (skill fixes) | .skills-lab/active/refactoring-skills/ | Fix skills in place, don't create new |
| Package C (agents) | .opencode/agents/ | Replace hivefiver with 3 specialized agents |
| Package D (guardrails) | All skills | Guardrail patterns applied across all skills |
| Package E (new skills) | .skills-lab/active/refactoring-skills/ | New skills created here |
| Master plan (task_plan.md) | Phase 2 → Phase 3 | This spec feeds into Phase 3 implementation |
