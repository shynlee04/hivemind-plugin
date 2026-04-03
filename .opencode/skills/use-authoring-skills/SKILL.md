---
name: use-authoring-skills
description: Create, audit, refactor, and doctor agent skills. Use when the user wants to create a skill, improve an existing skill, audit skill quality, convert a document to a skill, or fix skill triggers. Covers frontmatter (agentskills.io spec), pattern selection (P1/P2/P3), TDD and template-driven workflows, quality scoring, eval-driven development, and cross-platform compatibility.
metadata:
  author: hivemind-plugin
  version: "3.0.0"
  rebuild-date: "2026-04-03"
  pattern: "P2-hybrid"
allowed-tools: Read Write Edit Bash Glob Grep
---

# Use Authoring Skills

## MANDATORY FIRST STEP — Run This Before Anything Else

**Every time this skill loads, run the preflight validator immediately:**

```bash
bash scripts/validate-gate.sh <create|edit|audit> "<user-request>" <skill-dir>
```

- `<create>` — building a new skill from scratch or from a document
- `<edit>` — modifying an existing skill
- `<audit>` — reviewing/grading an existing skill
- `<user-request>` — the user's exact words in quotes
- `<skill-dir>` — directory where the skill lives (default: `.`)

**If this exits non-zero, you are BLOCKED.** Fix the reported issue and re-run. Do not proceed to any other step until Gate 0 passes.

## Step-by-Step Checklist (Follow In Order)

Copy this checklist into `task_plan.md` and check off each item as you complete it. **You may not skip steps.**

```
- [ ] STEP 1: Run validate-gate.sh — must exit 0
- [ ] STEP 2: Run decision tree below — pick ONE path
- [ ] STEP 3: Load the ONE matching reference file (not all)
- [ ] STEP 4: Ask questions if unclear (max 3, question tool only)
- [ ] STEP 5: Write frontmatter — run validate-skill.sh
- [ ] STEP 6: Write body — follow agentskills.io principles (see below)
- [ ] STEP 7: Run validate-skill.sh — if FAIL, fix and repeat STEP 7
- [ ] STEP 8: Run check-overlaps.sh — if FAIL, fix and repeat STEP 8
- [ ] STEP 9: Dispatch critic subagent for review — if FAIL, fix and repeat STEP 9
- [ ] STEP 10: Final validate-gate.sh re-run — must exit 0
```

## Decision Tree — Pick Your Path

```
User says...                          → Load
─────────────────────────────────────────────────────────
"create a skill" / "make a skill"     → references/03-three-patterns.md
"create a skill like this @file"      → references/03-three-patterns.md (template path)
"audit this skill" / "review skill"   → references/05-skill-quality-matrix.md
"fix triggers" / "skill not loading"  → references/11-description-optimization.md
"improve this skill" / "refactor"     → references/07-iterative-refinement.md
"skill overlaps with..."              → references/08-conflict-detection.md
"write evals for skill"               → references/10-eval-lifecycle.md
"write scripts for skill"             → references/09-script-authoring.md
"make skill work on X platform"       → references/06-cross-platform-activation.md
"doctor" / "what's wrong with..."     → references/12-anti-deception.md
```

**Rule:** Load only ONE reference file from the decision tree. Do not load all references.

## agentskills.io Principles (Apply During STEP 6)

These are the core design principles from agentskills.io. Apply them when writing skill content:

1. **Procedures over declarations** — Teach HOW to do something, not WHAT something is. Use imperative verbs: "Run this script", "Check the output", "If X, do Y". Avoid: "This skill handles...", "The agent should...".

2. **Defaults, not menus** — Pick one approach as the primary path. Mention alternatives in one sentence. Do not present 5 options and ask the agent to choose. Example: "Use `bash scripts/validate-skill.sh` to validate. For Python-only skills, `pytest` is an acceptable alternative."

3. **Match specificity to fragility** — Be prescriptive for fragile steps (file formats, YAML syntax, tool invocation). Be flexible for creative steps (body content, examples). Frontmatter format = prescriptive. Example scenarios = flexible.

4. **Checklists for multi-step workflows** — Any workflow with 3+ steps must be a checklist with `[ ]` items. Agents check items off as they go.

5. **Validation loops** — Every significant action follows: do → validate → fix → repeat. Never declare done without running the validator.

6. **Bundle scripts in scripts/** — Reusable validation, initialization, and cleanup logic lives in `scripts/`. Reference them from SKILL.md, don't inline shell commands.

## Validation Loop (STEP 7–9)

After writing skill content, enter this loop:

```
LOOP START:
  1. Run: bash scripts/validate-skill.sh <skill-dir>
  2. If exit code ≠ 0:
     - Read the FAIL messages
     - Fix each issue
     - Go to step 1
  3. Run: bash scripts/check-overlaps.sh <skill-dir>
  4. If exit code ≠ 0:
     - Read overlap warnings
     - Resolve conflicts
     - Go to step 3
  5. Dispatch critic subagent:
     - Task: "Review this skill against agentskills.io principles"
     - Pass: skill-dir path + the agentskills.io principles from this file
     - If critic reports issues → fix them → go to step 1
  6. All checks passed → exit loop
LOOP END
```

**Maximum iterations:** 5. If the loop hasn't passed after 5 iterations, stop and report what's blocking.

## Question Enforcement (STEP 4)

When intent is unclear:

- **Maximum 3 questions per session.** Not 4. Not "just one more."
- **Use the question tool only.** Do not ask questions in plain text output.
- **Wait for answers** before proceeding to implementation.
- If still unclear after 3 questions, proceed with the most reasonable default and document the assumption in `task_plan.md`.

## Gate System

| Gate | When | Criteria | Enforcement |
|------|------|----------|-------------|
| G1: Intent | Before any work | User intent in task_plan.md Goal field | `validate-gate.sh` checks Goal non-empty |
| G2: Structure | Before writing body | SKILL.md frontmatter has name + description | `validate-skill.sh` checks frontmatter |
| G3: Pattern | Before body content | Pattern (P1/P2/P3) selected in task_plan.md | `validate-gate.sh` checks pattern field |
| G4: Quality | Before declaring done | Quality score ≥ 3/5 on all 5 dimensions | `gate-enforce.sh G4` runs scoring |
| G5: Validation | Final step | validate-skill.sh + check-overlaps.sh both pass | `validate-gate.sh` re-run |
| G6: Subagent Review | After G5 | Critic subagent review passes | Manual dispatch + loop |

**Run enforcement:** `bash scripts/validate-gate.sh <action> "<request>" <dir>` — exits non-zero if blocked.

## Worked Example: Document → Skill Conversion

**Input:** User provides a 200-line markdown command file to convert into a skill.

**STEP 1:** `bash scripts/validate-gate.sh create "Convert this command file into a skill" .` → exits 0, creates task_plan.md.

**STEP 2:** Decision tree → "create a skill like this @file" → load `references/03-three-patterns.md`.

**STEP 3:** Pattern decision: focused how-to guide → **P2** (balanced depth). Record in task_plan.md.

**STEP 4:** Questions if needed (max 3 via question tool).

**STEP 5:** Write frontmatter:
```yaml
---
name: deep-research-synthesis
description: Synthesizes Repomix-packed codebase analysis into structured research reports with citations. Use when the user asks to analyze a codebase deeply, create research reports from Repomix output, or synthesize findings from multiple code sources.
---
```
Run `bash scripts/validate-skill.sh .` → passes.

**STEP 6:** Write body following agentskills.io principles (procedures, defaults, checklists).

**STEP 7–9:** Validation loop → validate-skill.sh → check-overlaps.sh → critic subagent → all pass.

**STEP 10:** `bash scripts/validate-gate.sh create "Convert this command file into a skill" .` → exits 0.

**Output:** Complete skill at target directory with `references/` and `scripts/`.

## Anti-Patterns — With Detection

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Phantom dependencies** — referencing skills that don't exist | `grep -r "skill(" SKILL.md references/` → verify each exists | Remove or create the missing skill |
| **Identity crisis** — P1 router with P3 depth content | Count lines: >300 in SKILL.md = likely P3 masquerading | Split into thin SKILL.md + reference files |
| **Unenforceable gates** — claims "programmatic" with no scripts | `ls scripts/` → must have validate-gate.sh + validate-skill.sh | Create enforcement scripts or remove gate claims |
| **Template TDD mismatch** — forcing RED phase on template conversion | Check task type: if "convert document" → skip RED | Use template-driven workflow |
| **Banned field usage** — `compatibility` in frontmatter | `grep "compatibility:" SKILL.md` | Remove per agentskills.io spec |
| **Skipping validation loop** — declaring done without running validators | Check task_plan.md: STEP 7–9 unchecked | Run the loop before claiming complete |

## Platform Adaptation

| Platform | Skill Location | Hook Format | Notes |
|----------|---------------|-------------|-------|
| **OpenCode** | `.opencode/skills/<name>/SKILL.md` | `opencode.json` hooks | Use `skill` tool to load |
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `.claude/hooks/` | Same frontmatter spec |
| **Codex** | `.codex/skills/<name>/SKILL.md` | `.codex/hooks/` | May need `allowed-tools` field |
| **Cursor** | `.cursor/skills/<name>/SKILL.md` | `.cursor/rules/` | Frontmatter may vary |

Always write frontmatter per agentskills.io spec — it is the lowest common denominator.

## Three Operating Rules

1. **Run validate-gate.sh first** — before reading, writing, or planning anything.
2. **Procedures over declarations** — teach HOW, not WHAT. Use checklists for 3+ step workflows.
3. **Validate before done** — run the validation loop (STEP 7–9). No exceptions.
