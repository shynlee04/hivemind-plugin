---
name: hm-skill-synthesis
description: "Use when synthesizing skills from GitHub repos, classifying skill patterns, building template libraries, generating eval frameworks, or creating eval-driven skill scaffolds. Triggers on: 'create skills from GitHub', 'find skill patterns', 'classify skills', 'generate evals', 'synthesize a skill from a codebase'."
metadata:
  layer: "3"
  role: "synthesis"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep webfetch websearch codesearch
---

<!-- ONBOARDING-HEADING-HERE -->

## The Iron Law

```
NO SKILL WITHOUT EVALS
```

Every skill produced by this pipeline must have `evals/evals.json` and `evals/trigger-queries.json` with at least 3 test cases and 20 trigger queries. A scaffold without evals is incomplete. A skill without executed evals is untested.

# skill-synthesis
## On Load

1. **Fetch the canonical spec** — always fresh, never cached:
   ```bash
   webfetch https://agentskills.io/llms.txt
   ```
   Use this as the ground truth for frontmatter format, pattern definitions, and eval structure.

2. **Check for planning files** — if `task_plan.md` exists, read the Goal field. If missing, run:
   ```bash
   bash scripts/validate-gate.sh synthesize "<user-request>" <output-dir>
   ```
    This creates the planning scaffold and validates intent.

## Pipeline Overview

```
INGEST → CLASSIFY → SCAFFOLD → VALIDATE
```

### Phase 1: INGEST

**Input:** GitHub repo URL or owner/repo string
**Tools:** `repomix --remote`, `webfetch`, `websearch`

```bash
# Pack remote repo (branch-targetable, no local clone)
repomix --remote <owner/repo> \
  --include "**/SKILL.md,**/skills/**/*.md" \
  --output /tmp/skill-ingest-<timestamp>.xml

# Fetch canonical spec (always fresh)
# Saves to /tmp/spec-<timestamp>.md
webfetch https://agentskills.io/llms.txt

# Search for real-world skill implementations across GitHub
# Results form a pattern corpus for classification
websearch "site:github.com SKILL.md agent skill frontmatter"
```

**Output:** Packed XML with all SKILL.md files, fresh spec, pattern corpus

### Phase 2: CLASSIFY

For each SKILL.md found, classify along these axes:

| Axis | Categories | Detection |
|------|------------|-----------|
| **Pattern** | P1 (<200L), P2 (200-400L), P3 (400L+) | Line count + reference count |
| **Routing** | Thin router, Context router, Not-a-router | Decision tree present? Ref count 0-2? |
| **Efficiency** | Token-efficient, Context-heavy, Script-bundled, Pure-instructions | Token/line ratio, scripts/ presence |
| **Testing** | Has evals, Has triggers, Has scripts, Has matrix, Complete | evals/ presence, trigger-queries.json |
| **Quality** | Excellent (4.5+), Good (4.0+), Acceptable (3.5+), Needs Work (<3.5) | 5-dimension weighted score |

**Output:** Classification report per skill, ranked by quality score

### Phase 3: SCAFFOLD

1. Select top 3 examples matching target category
2. Extract common structural patterns (frontmatter shape, reference topics, script types)
3. Generate scaffold:
   - SKILL.md with proper frontmatter (trigger phrases from decision tree analysis)
   - Numbered reference files (150-300 lines each)
   - Validation scripts (co-located with the skill's scripts/ directory)
   - Evals: `evals.json` (3-8 test cases) + `trigger-queries.json` (20 queries, 60/40 train/val split)
4. Write to target directory

**Output:** Complete skill directory, ready for validation

### Phase 4: VALIDATE

```bash
# Gate 0: Intent validation
bash scripts/validate-gate.sh synthesize "<user-request>" <output-dir>

# Structure validation
bash scripts/validate-skill.sh <output-dir>

# Overlap detection
bash scripts/check-overlaps.sh <output-dir>

# Trigger eval execution
bash scripts/run-trigger-evals.sh <output-dir>

# Quality scoring
bash scripts/grade-outputs.sh <output-dir>
```

**If any step fails:** Fix → re-run. Max 5 iterations.
**Output:** Validated skill with passing evals and quality score ≥ 3.5

## Decision Tree — Pick Your Path

```
User says...                                    → Load
─────────────────────────────────────────────────────────────────────
"create skills from GitHub" / "synthesize"      → references/01-github-ingestion.md
"find skill patterns" / "classify skills"       → references/02-pattern-classifier.md
"generate evals" / "test this skill"            → references/03-eval-framework.md
"score this skill" / "quality check"            → references/04-quality-matrix.md
"build a template" / "template library"         → references/05-template-library.md
```

**Rule:** Load only ONE reference file. Do not load all references.

## Reference Map

| File | When to Read |
|------|-------------|
| `references/01-github-ingestion.md` | GitHub repo ingestion, repomix patterns |
| `references/02-pattern-classifier.md` | P1/P2/P3 classification, taxonomy |
| `references/03-eval-framework.md` | Eval structure, trigger queries, grading |
| `references/04-quality-matrix.md` | 5-dimension scoring, block rules |
| `references/05-template-library.md` | Template extraction, scaffolding |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Hoarder** — loading all references instead of following decision tree | All reference files read in one session | Follow the decision tree. Load ONE reference. |
| **The LLM Simulator** — trying to run LLM-based evals in bash scripts | Script calls external LLM API or simulates semantic matching | Use structural keyword overlap checks only (see run-trigger-evals.sh spec) |
| **The Template Copier** — copy-pasting SKILL.md content without adapting to domain | Generated SKILL.md contains generic placeholder text | Extract patterns, not content. Adapt frontmatter and body to target domain |
| **The Silent Failure** — not running validation gates before declaring done | No evidence of validate-gate.sh, validate-skill.sh, or run-trigger-evals.sh execution | Run all gates. Report exit codes. Max 5 fix iterations |

## Error Handling

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| Repo not found / private | repomix exits non-zero | Inform user, verify repo exists and is public |
| No SKILL.md files in repo | ingest-repo.sh reports 0 skills | Inform user, suggest broader search |
| Classification ambiguous | classify-pattern.sh outputs low confidence | Flag for human review, proceed with best guess |
| Eval rate < 80% | run-trigger-evals.sh exits non-zero | Auto-revise description, re-run (max 3 iterations) |
| Quality score < 3.5 | grade-outputs.sh exits non-zero | Flag specific dimensions, suggest improvements |
| Overlap with existing skill | check-overlaps.sh reports conflict | Report overlap percentage, let user decide |

## Non-Interactive Shell Compliance

All scripts must:
- Set `CI=true`, `GIT_TERMINAL_PROMPT=0`, `GIT_PAGER=cat`, `PAGER=cat`
- Use `--yes` / `-y` flags for all package managers
- Output structured JSON (not free-form text)
- Exit non-zero on any failure (`set -euo pipefail`)
- Include `timeout 30` wrapper for any command that might hang
- Never use banned commands (vim, less, git add -p, etc.)

## Integration with Existing Skills

| Existing Skill | Relationship |
|----------------|--------------|
| `meta-builder` | Routes "synthesize skills" → `skill-synthesis` |
| `use-authoring-skills` | Provides validation scripts reused by this pipeline |
| `skill-judge` (external) | Provides the 5-dimension quality matrix |
| `repomix-exploration-guide` | Provides repomix patterns used by ingestion |
| `opencode-platform-reference` | Source of domain knowledge for OpenCode-specific patterns |
