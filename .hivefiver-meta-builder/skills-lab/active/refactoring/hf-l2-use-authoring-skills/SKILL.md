---
name: hf-l2-use-authoring-skills
description: This skill should be used when the user asks to "create a skill", "audit this skill", "refactor skills", "doctor agent skills", "check skill quality", "fix frontmatter", "skill pattern selection", "TDD for skills", "cross-platform skill compatibility", or "score skill quality".
metadata:
  consumed-by:
    - "hf-l2-skill-builder"
    - "hf-l2-refactorer"
  lineage-scope: "hf-*"
  access: "STRICT"
  layer: "4"
  role: "domain-execution"
  pattern: P2-hybrid
allowed-tools: Read Write Edit Bash Glob Grep
---

## The Iron Law

```
NO SKILL WITHOUT TRIGGER PHRASES IN THE DESCRIPTION
```

<files_to_read>
.opencode/skills/use-authoring-skills/references/01-skill-anatomy.md
.opencode/skills/use-authoring-skills/references/02-frontmatter-standard.md
.opencode/skills/use-authoring-skills/references/03-three-patterns.md
.opencode/skills/use-authoring-skills/references/05-skill-quality-matrix.md
.opencode/skills/use-authoring-skills/scripts/validate-gate.sh
.opencode/skills/use-authoring-skills/scripts/validate-skill.sh
.opencode/skills/use-authoring-skills/scripts/check-overlaps.sh
.opencode/get-shit-done/references/thinking-models-execution.md
</files_to_read>

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

## HIERARCHY ENFORCEMENT — Run This FIRST

This skill is LAYER 4 in the loading chain (domain execution). Before any action:

1. **Verify hierarchy chain:**
   ```bash
   bash scripts/verify-hierarchy.sh use-authoring-skills
   ```
   This checks that meta-builder exists and routed to this skill.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh use-authoring-skills
   ```

3. **Prerequisites:**
   - `meta-builder` must exist (routing source)
   - Background skills should already be loaded by upstream skills

**If hierarchy check fails → STOP. This skill should only be loaded after meta-builder routing.**

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
name: hf-l2-use-authoring-skills
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

## Scripts

All 8 scripts passed audit — each has real validation logic, exits non-zero on failure, and contains no placeholder/TODO text. Unlike stub scripts (which exit 0 always), these enforce actual constraints.

| Script | Purpose | Lines |
|--------|---------|-------|
| `validate-gate.sh` | Preflight: intent, pattern, planning files | 118 |
| `validate-skill.sh` | Structure: frontmatter, sections, terminology | 187 |
| `check-overlaps.sh` | Content duplication detection across reference files | 203 |
| `gate-enforce.sh` | Gate G1-G5 enforcement with pass/fail | 109 |
| `check-complete.sh` | Phase completion status reporter | 37 |
| `init-session.sh` | Planning file initialization | 121 |
| `register-skill.sh` | Skill load recording in loaded-skills.json | 122 |
| `verify-hierarchy.sh` | Prerequisite chain verification | 295 |

Enforcement lives primarily in SKILL.md text (Iron Law + Validation Gate). Scripts supplement for mechanical checks (structure validation, gate enforcement). If a script ever becomes a stub (exits 0 without checking), delete it — the text enforcement is the source of truth.

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

## Three Operating Rules

1. **Run validate-gate.sh first** — before reading, writing, or planning anything.
2. **Procedures over declarations** — teach HOW, not WHAT. Use checklists for 3+ step workflows.
3. **Validate before done** — run the validation loop (STEP 7–9). No exceptions.

## Self-Correction

### When the Task Keeps Failing
[Detection] validate-skill.sh repeatedly fails (3+ iterations). check-overlaps.sh reports persistent conflicts. Critic subagent keeps flagging the same issues after 3 fix cycles.
[Recovery] STOP the validation loop. Read the exact failure messages from each failing script. Address the root cause rather than patching symptoms. If overlap conflicts persist: the skill may need scope reduction or should be merged with the overlapping skill. If critic reports are unclear: ask the user which specific principle is violated before continuing. Do not exceed 5 total iterations — beyond that, the skill needs redesign, not refinement.

### When Unsure About the Next Step
[Detection] The user's request doesn't clearly map to any decision tree path. validate-gate.sh exits with an ambiguous error. Pattern selection (P1/P2/P3) is unclear for the task.
[Recovery] Run `bash scripts/validate-gate.sh <action> "<user-request>" <dir>` to create task_plan.md — this will clarify intent and pattern. Check the pattern field in task_plan.md: if unset, default to P2 (balanced depth) for most authoring tasks. Use the question tool for up to 3 clarifications — but proceed with reasonable defaults if still unclear after 3 questions.

### When the User Contradicts Skill Guidance
[Detection] User says "don't bother with the checklist" or "skip validation, just write it" or "I know the agentskills.io spec, ignore it." User wants to bypass the 10-step checklist or validation loop.
[Recovery] Acknowledge the user's authority but warn: "Skipping validation means the skill may have broken frontmatter, phantom references, or dead trigger phrases. The skill may silently fail to load." If the user insists, document skipped steps in task_plan.md and mark the skill as "unvalidated." Never claim a skill passed validation if any gate was skipped.

### When an Edge Case Is Encountered
[Detection] Skill being audited uses a non-standard frontmatter format (different YAML spec). User wants to author a skill for a platform not in the adaptation table. Script fails due to missing dependency (bash version, jq not installed). Skill has content in multiple languages.
[Recovery] For non-standard frontmatter: validate against agentskills.io spec and flag deviations. For unsupported platforms: apply agentskills.io patterns as the lowest common denominator, then document platform-specific adaptations. For missing dependencies: check if the script has fallback logic — if not, inform the user which dependency is needed. For multi-language skills: treat the primary language as canonical and flag translations for separate review.
