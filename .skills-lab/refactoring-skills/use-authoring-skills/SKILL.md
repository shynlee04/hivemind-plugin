---
name: use-authoring-skills
description: Create, audit, refactor, and doctor agent skills. Use when the user wants to create a skill, improve an existing skill, audit skill quality, convert a document to a skill, or fix skill triggers. Covers frontmatter (agentskills.io spec), pattern selection (P1/P2/P3), TDD and template-driven workflows, quality scoring, eval-driven development, and cross-platform compatibility.
metadata:
  author: hivemind-plugin
  version: "2.0.0"
  rebuild-date: "2026-04-03"
  pattern: "P2-hybrid"
allowed-tools: Read Write Edit Bash Glob Grep
---

# Use Authoring Skills

## When This Skill Loads — Do THIS First

1. **Identify the task type** using the decision tree below (max 10 seconds).
2. **Load the matching reference file** — only ONE, not all.
3. **Create planning files** via `scripts/init-session.sh` if task > 3 steps.
4. **Ask at most 3 questions** via the question tool if intent is unclear.

Do NOT load all reference files. Do NOT start writing SKILL.md content. Do NOT skip the decision tree.

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

## Hierarchical Loading Order (Enforced)

This skill is **standalone sufficient** for creating, auditing, refactoring, and doctoring skills. No external skills required.

**Load order** — each step blocks the next until complete:

```
Step 1 (always):   This SKILL.md body
Step 2 (if >3 steps):  Run scripts/init-session.sh → creates task_plan.md
Step 3 (decision):     Load ONE reference file from decision tree
Step 4 (if creating):  Load references/01-skill-anatomy.md + 02-frontmatter-standard.md
Step 5 (if auditing):  Load references/05-skill-quality-matrix.md
Step 6 (optional):     Load additional reference only if current one is insufficient
```

**Enforcement:** Before loading Step 5, Step 3 MUST be complete. Before writing any skill file, Step 4 MUST be complete. The `scripts/gate-enforce.sh` script validates this.

## Gate System — Programmatic Enforcement

Each gate has measurable criteria AND an enforcement script. Gates are sequential — you cannot skip.

| Gate | When | Criteria | Enforcement |
|------|------|----------|-------------|
| G1: Intent | Before any work | User intent captured in task_plan.md Goal field | `gate-enforce.sh G1` checks Goal is non-empty |
| G2: Structure | Before writing files | SKILL.md frontmatter has name + description | `validate-skill.sh` checks frontmatter |
| G3: Pattern | Before body content | Pattern (P1/P2/P3) selected and documented | `gate-enforce.sh G3` checks pattern field |
| G4: Quality | Before declaring done | Quality score ≥ 3/5 on all 5 dimensions | `gate-enforce.sh G4` runs scoring |
| G5: Validation | Final step | `validate-skill.sh` passes, `check-overlaps.sh` clean | Both scripts exit 0 |

**Run enforcement:** `bash scripts/gate-enforce.sh <GATE>` — exits non-zero if gate not passed.

## Interactive Protocol

When intent is unclear, ask questions. Rules:
- **Max 3 questions at a time** — never more.
- **Use the question tool** — do not ask questions in plain text output.
- **Wait for answers** before proceeding to implementation.

Example questions for skill creation:
1. "What is the single purpose this skill should serve?"
2. "Do you have a source document to convert, or building from scratch?"
3. "Which platforms should this skill target? (OpenCode, Claude Code, Codex, Cursor)"

## Worked Example: Document → Skill Conversion

**Input:** User provides `.kilo/command/deep-research-synthesis-repomix.md` (a 200-line markdown command file).

**Step 1 — Identify pattern:** This is a focused how-to guide → **P2** (balanced depth).

**Step 2 — Extract purpose:** "Synthesize deep research findings from Repomix-packed codebases into structured reports."

**Step 3 — Write frontmatter:**
```yaml
---
name: deep-research-synthesis
description: Synthesizes Repomix-packed codebase analysis into structured research reports with citations. Use when the user asks to analyze a codebase deeply, create research reports from Repomix output, or synthesize findings from multiple code sources.
---
```

**Step 4 — Write body:** Extract the command's workflow steps → convert to skill instructions. Keep under 300 lines. Move detailed examples to `references/`.

**Step 5 — Validate:** Run `bash scripts/validate-skill.sh` → passes. Run `bash scripts/check-overlaps.sh` → no conflicts.

**Output:** A complete skill at `.opencode/skills/deep-research-synthesis/SKILL.md` with `references/` directory.

## Anti-Patterns — With Detection

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Phantom dependencies** — referencing skills that don't exist | `grep -r "skill(" SKILL.md references/` → verify each exists | Remove or create the missing skill |
| **Identity crisis** — P1 router with P3 depth content | Count lines: >300 in SKILL.md = likely P3 masquerading | Split into thin SKILL.md + reference files |
| **Unenforceable gates** — claims "programmatic" with no scripts | `ls scripts/` → must have gate-enforce.sh | Create enforcement scripts or remove gate claims |
| **Template TDD mismatch** — forcing RED phase on template conversion | Check task type: if "convert document" → skip RED | Use template-driven workflow (references/04-tdd-workflow.md) |
| **Banned field usage** — `compatibility` in examples when banned | `grep "compatibility:" references/` | Remove or document as optional per agentskills.io spec |

## Platform Adaptation

| Platform | Skill Location | Hook Format | Notes |
|----------|---------------|-------------|-------|
| **OpenCode** | `.opencode/skills/<name>/SKILL.md` | `opencode.json` hooks | Use `skill` tool to load |
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `.claude/hooks/` | Same frontmatter spec |
| **Codex** | `.codex/skills/<name>/SKILL.md` | `.codex/hooks/` | May need `allowed-tools` field |
| **Cursor** | `.cursor/skills/<name>/SKILL.md` | `.cursor/rules/` | Frontmatter may vary |

Always write frontmatter per agentskills.io spec — it is the lowest common denominator.

## Three Operating Rules (Not 15)

1. **Read source before writing** — identify the skill's single purpose before touching any file.
2. **Frontmatter first** — write `name` + `description`, validate, then write body.
3. **Validate before done** — run `validate-skill.sh` and `check-overlaps.sh` before declaring complete.

## Load Order for Child Skills (Future Extensions)

When agent, tool, command, or workflow authoring skills exist as separate packs:
1. Load THIS skill first (Phase 1 — skill anatomy + frontmatter)
2. Load child domain skill second (Phase 2 — domain-specific patterns)
3. Resolve conflicts via references/08-conflict-detection.md

Until then, this skill is standalone sufficient.
