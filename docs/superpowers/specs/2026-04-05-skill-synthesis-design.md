# Spec: skill-synthesis — GitHub-Powered Skill Generation Pipeline

**Date:** 2026-04-05
**Status:** Draft — Pending Review
**Author:** Coordinator (via brainstorming session)

---

## 1. Problem Statement

The HiveMind project has 14 skills but only 5 have eval infrastructure (meta-builder, use-authoring-skills, coordinating-loop, user-intent-interactive-loop, and templates). There is no automated way to:
- Extract skill patterns from GitHub repositories
- Classify skills by pattern type (P1/P2/P3) and quality
- Generate eval-driven skill scaffolds from real-world examples
- Run trigger-query evaluations to verify description effectiveness

Current skill creation is manual: an agent reads agentskills.io docs, writes SKILL.md by hand, and hopes the description triggers correctly. This is slow, inconsistent, and produces skills with untested triggers.

---

## 2. Solution Overview

A P2-domain skill (`skill-synthesis`) that orchestrates a 4-phase pipeline:

```
GitHub Repo → repomix pack → Extract SKILL.md files → Classify (P1/P2/P3)
    → Score (5-dim quality matrix) → Scaffold (evals + refs + scripts)
    → Validate (gate loop) → Output complete skill directory
```

The skill does NOT chew on SKILL.md text alone. It:
1. **Crawls** GitHub repos via `repomix --remote` (structured packing, branch targeting)
2. **Consumes** the agentskills.io canonical spec via `webfetch` (always fresh)
3. **Classifies** extracted patterns into routing / efficiency / testing categories
4. **Generates** eval-driven scaffolds with trigger-query test suites
5. **Validates** through the existing gate system (validate-gate → validate-skill → check-overlaps)

---

## 3. Architecture

### 3.1 Skill Structure

```
.opencode/skills/skill-synthesis/
├── SKILL.md                          # ~200 lines, Process pattern
├── references/
│   ├── 01-github-ingestion.md        # repomix --remote, webfetch, codesearch pipeline
│   ├── 02-pattern-classifier.md      # P1/P2/P3 detection, 3-axis taxonomy
│   ├── 03-eval-framework.md          # Complete eval runner spec (from agentskills.io TAB 4)
│   ├── 04-quality-matrix.md          # 5-dimension scoring (adapted from existing matrix)
│   └── 05-template-library.md        # How to extract templates from ingested repos (one-time, not maintained library)
├── scripts/
│   ├── ingest-repo.sh                # Pack remote repo → extract skill candidates
│   ├── classify-pattern.sh           # Classify SKILL.md by P1/P2/P3 + category
│   ├── run-trigger-evals.sh          # Execute trigger-queries.json against skill
│   └── grade-outputs.sh              # Score skill against 5-dim quality matrix
├── evals/
│   ├── evals.json                    # 5 test cases for synthesis itself
│   └── trigger-queries.json          # 20 queries (10 pos, 10 neg)
└── templates/
    ├── skill-scaffold.md             # Minimal valid SKILL.md template
    └── eval-scaffold.json            # Minimal evals.json template
```

### 3.2 Frontmatter

```yaml
---
name: skill-synthesis
description: >
  Synthesizes skills by crawling GitHub repositories, extracting skill patterns,
  classifying them into routing/efficiency/testing categories, and generating
  eval-driven skill scaffolds. Use when the user asks to "create skills from
  GitHub repos", "find skill patterns", "build a skill template library",
  "classify skills by pattern type", "generate eval frameworks for skills",
  or "synthesize a skill from a codebase".
metadata:
  layer: "3"
  role: "synthesis"
  pattern: P2
allowed-tools: Read Write Edit Bash Glob Grep webfetch websearch codesearch
---
```

### 3.3 Iron Law

```
NO SKILL WITHOUT EVALS
```

Every skill produced by this pipeline must have `evals/evals.json` and `evals/trigger-queries.json` with at least 3 test cases and 20 trigger queries. A scaffold without evals is incomplete. A skill without executed evals is untested.

### 3.4 Pipeline Phases

#### Phase 1: INGEST

**Input:** GitHub repo URL or owner/repo string
**Tools:** `repomix --remote`, `webfetch`, `websearch`

```bash
# Pack remote repo (branch-targetable, no local clone)
repomix --remote <owner/repo> \
  --include "**/SKILL.md,**/skills/**/*.md" \
  --output /tmp/skill-ingest-<timestamp>.xml

# Fetch canonical spec (always fresh)
webfetch https://agentskills.io/llms.txt → /tmp/spec-<timestamp>.md

# Search for real-world skill implementations across GitHub
websearch "site:github.com SKILL.md agent skill frontmatter" → pattern corpus
```

**Output:** Packed XML with all SKILL.md files, fresh spec, pattern corpus

#### Phase 2: CLASSIFY

**Input:** Packed XML from Phase 1
**Process:** For each SKILL.md found:

| Classification Axis | Categories | Detection Method |
|---------------------|------------|------------------|
| **Pattern** | P1 (Router <200L), P2 (Domain 200-400L), P3 (Expert 400L+) | SKILL.md line count + reference count |
| **Routing** | Thin router, Context router, Not-a-router | Decision tree present? Reference count 0-2? |
| **Efficiency** | Token-efficient, Context-heavy, Script-bundled, Pure-instructions | Token/line ratio, scripts/ presence, ref count |
| **Testing** | Has evals, Has triggers, Has scripts, Has matrix, Complete | evals/ presence, trigger-queries.json, scripts/ |
| **Quality** | Excellent (4.5+), Good (4.0+), Acceptable (3.5+), Needs Work (<3.5) | 5-dimension weighted score |

**Output:** Classification report per skill, ranked by quality score

#### Phase 3: SCAFFOLD

**Input:** Best-in-class examples from Phase 2 + user's synthesis target
**Process:**

1. Select top 3 examples matching target category
2. Extract common structural patterns (frontmatter shape, reference topics, script types)
3. Generate scaffold:
   - SKILL.md with proper frontmatter (trigger phrases from decision tree analysis)
   - Numbered reference files (150-300 lines each, following 01-skill-anatomy.md rules)
   - Validation scripts (copied from use-authoring-skills/scripts/ into the new skill's scripts/ directory — scripts use SCRIPT_DIR relative paths internally, so they must be co-located with the skill)
   - Evals: `evals.json` (3-8 test cases with realistic prompts) + `trigger-queries.json` (20 queries, 60/40 train/val split)
4. Write to target directory

**Output:** Complete skill directory, ready for validation

#### Phase 4: VALIDATE

**Input:** Scaffolded skill directory
**Process:**

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

### 3.5 Decision Tree (SKILL.md Body)

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

---

## 4. Script Specifications

### 4.1 ingest-repo.sh

```bash
#!/usr/bin/env bash
# Usage: ingest-repo.sh <owner/repo> [output-dir]
# Packs remote repo, extracts SKILL.md files, reports findings as JSON
# Exit 0 on success, non-zero on failure
# Non-interactive: all flags set, no prompts
```

**Key behaviors:**
- Uses `repomix --remote` with `--include "**/SKILL.md"`
- No fallback to `gh api` — repomix is the single ingestion path (it handles auth, branches, and packing in one command)
- Outputs JSON: `{ "skills_found": N, "files": [...], "total_lines": N }`
- Cleans up /tmp files on exit (trap)

### 4.2 classify-pattern.sh

```bash
#!/usr/bin/env bash
# Usage: classify-pattern.sh <skill-dir>
# Classifies a skill by P1/P2/P3 pattern and 3-axis taxonomy
# Exit 0 on success, non-zero if not a valid skill
```

**Key behaviors:**
- Counts SKILL.md lines, reference files, scripts
- Checks for decision tree, evals, trigger-queries
- Outputs JSON: `{ "pattern": "P2", "routing": "domain", "efficiency": "script-bundled", "testing": "has-evals", "quality_score": 4.2 }`

### 4.3 run-trigger-evals.sh

```bash
#!/usr/bin/env bash
# Usage: run-trigger-evals.sh <skill-dir>
# Validates trigger-query coverage via STRUCTURAL checks (not LLM simulation)
# Exit 0 if structural coverage ≥ 80%, non-zero otherwise
```

**Key behaviors:**
- Reads `evals/trigger-queries.json`
- For each `should_trigger: true` query: checks if ≥2 significant keywords from the query appear in the description (case-insensitive word match, excluding stop words)
- For each `should_trigger: false` query: checks that ≤1 significant keyword appears (prevents over-triggering)
- Reports: `{ "total": 20, "true_positives": 9, "true_negatives": 9, "false_positives": 1, "false_negatives": 1, "coverage": 0.90 }`
- Fails if coverage < 80%

**Why structural, not LLM-based:** OpenCode's skill triggering is LLM-based (the model reads the query + description and decides). A bash script cannot simulate LLM semantic matching. Instead, this script performs structural validation: does the description contain the vocabulary that would make an LLM trigger on it? This is a proxy — imperfect but mechanically verifiable. The final trigger validation is the agent itself loading the skill in a real session.

### 4.4 grade-outputs.sh

```bash
#!/usr/bin/env bash
# Usage: grade-outputs.sh <skill-dir>
# Scores skill against MECHANICAL PROXIES of the 5-dimension quality matrix
# Exit 0 if score ≥ 3.5, non-zero otherwise
```

**Key behaviors:**
- Scores via mechanical proxies (not LLM judgment):
  - **Trigger Accuracy (25%)**: Description length 100-1024 chars? Has "Use when"? Has ≥3 trigger phrases? (0-3 points → scaled to 0-5)
  - **Action Coherence (25%)**: Has decision tree or checklist? Has Iron Law? Has step-by-step workflow? (0-3 → scaled)
  - **Reference Integrity (20%)**: All referenced files exist? No dead refs? References numbered? (0-3 → scaled)
  - **Non-Redundancy (15%)**: SKILL.md < 400 lines? No duplicate content in refs? (0-3 → scaled)
  - **Edge Case Coverage (15%)**: Has anti-patterns table? Has error handling section? Has "Do NOT Load" guidance? (0-3 → scaled)
- Block rule: any dimension ≤ 2 blocks release
- Outputs: `{ "dimensions": {...}, "total": 4.1, "grade": "GOOD", "blocked": false }`

**Why mechanical proxies:** The full 5-dimension quality matrix (from `05-skill-quality-matrix.md`) requires qualitative judgment that bash cannot perform. This script implements mechanical proxies — structural checks that correlate with quality. The agent performs the qualitative scoring during Phase 3 SCAFFOLD (reading the matrix and applying judgment). This script validates that the scaffolding has the structural prerequisites for quality.

---

## 5. Error Handling

| Failure Mode | Detection | Recovery |
|--------------|-----------|----------|
| Repo not found / private | repomix exits non-zero | Inform user, verify repo exists and is public |
| No SKILL.md files in repo | ingest-repo.sh reports 0 skills | Inform user, suggest broader search |
| Classification ambiguous | classify-pattern.sh outputs low confidence | Flag for human review, proceed with best guess |
| Eval rate < 80% | run-trigger-evals.sh exits non-zero | Auto-revise description, re-run (max 3 iterations) |
| Quality score < 3.5 | grade-outputs.sh exits non-zero | Flag specific dimensions, suggest improvements |
| Overlap with existing skill | check-overlaps.sh reports conflict | Report overlap percentage, let user decide |

---

## 6. Non-Interactive Shell Compliance

All scripts must:
- Set `CI=true`, `GIT_TERMINAL_PROMPT=0`, `GIT_PAGER=cat`, `PAGER=cat`
- Use `--yes` / `-y` flags for all package managers
- Output structured JSON (not free-form text)
- Exit non-zero on any failure (`set -euo pipefail`)
- Include `timeout 30` wrapper for any command that might hang
- Never use banned commands (vim, less, git add -p, etc.)

---

## 7. Integration with Existing Skills

| Existing Skill | Relationship |
|----------------|--------------|
| `meta-builder` | Routes "synthesize skills" → `skill-synthesis`. **Implementation must add this routing entry** — it does not exist yet in the current routing table. |
| `use-authoring-skills` | Provides validation scripts (validate-gate.sh, validate-skill.sh, check-overlaps.sh) that skill-synthesis reuses |
| `skill-judge` (external) | Provides the 5-dimension quality matrix that grade-outputs.sh implements as mechanical proxies. Located at `/Users/apple/.agents/skills/skill-judge/`, not in `.opencode/skills/`. |
| `repomix-exploration-guide` | Provides repomix patterns that ingest-repo.sh uses |
| `opencode-platform-reference` | Source of domain knowledge for OpenCode-specific skill patterns |

**Stacking recipe:**
```
User: "Create a skill from the anthropics/skills repo"
→ meta-builder routes to skill-synthesis
→ skill-synthesis Phase 1: repomix --remote anthropics/skills
→ skill-synthesis Phase 2: classify extracted skills
→ skill-synthesis Phase 3: scaffold new skill from best examples
→ skill-synthesis Phase 4: validate with use-authoring-skills scripts
→ Output: complete skill directory with passing evals
```

---

## 8. Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Eval structural coverage | ≥ 80% | run-trigger-evals.sh output (keyword overlap with trigger queries) |
| Quality structural score | ≥ 3.5/5.0 | grade-outputs.sh output (mechanical proxies) |
| No dimension blocked | All ≥ 2.0 | grade-outputs.sh block rule |
| No dead references | 0 | check-overlaps.sh |
| Scripts pass validation | All exit 0 | validate-gate.sh re-run |
| Meta-builder routing updated | "synthesize skills" routes to skill-synthesis | grep in meta-builder SKILL.md |

---

## 9. Out of Scope

- Modifying existing skills (use `use-authoring-skills` for that)
- Running evals against live agents (evals are structural + keyword-based, not behavioral)
- Publishing skills to registries (out of scope for v1)
- Multi-repo synthesis in one pass (one repo at a time, iterate)
- Maintaining a persistent template library (templates are extracted per-synthesis, not curated long-term)