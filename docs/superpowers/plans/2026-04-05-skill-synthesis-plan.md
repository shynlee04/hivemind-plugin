# Skill-Synthesis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a P2-domain skill (`skill-synthesis`) that ingests GitHub repos, classifies skill patterns, generates eval-driven scaffolds, and validates through the existing gate system.

**Architecture:** 4-phase pipeline (INGEST → CLASSIFY → SCAFFOLD → VALIDATE) orchestrated by a ~200-line SKILL.md with 5 numbered reference files, 4 bash scripts, evals, and templates. The skill integrates with meta-builder (routing), use-authoring-skills (validation scripts), and skill-judge (quality matrix).

**Tech Stack:** Bash scripts, repomix (remote packing), webfetch (spec fetching), websearch (pattern discovery), JSON for structured output, existing HiveMind validation infrastructure.

---

### Task 1: Create SKILL.md and frontmatter

**Files:**
- Create: `.opencode/skills/skill-synthesis/SKILL.md`
- Create: `.skills-lab/active/refactoring-skills/skill-synthesis/SKILL.md` (sync copy)

- [ ] **Step 1: Write SKILL.md with frontmatter**

Create the SKILL.md file (~200 lines, Process pattern) with:
- Frontmatter: name `skill-synthesis`, description with trigger phrases ("create skills from GitHub repos", "find skill patterns", "build a skill template library", "classify skills by pattern type", "generate eval frameworks for skills", "synthesize a skill from a codebase"), metadata (layer: "3", role: "synthesis", pattern: P2)
- Title and overview section
- Iron Law: "NO SKILL WITHOUT EVALS"
- "On Load" section (fetch agentskills.io spec, check for planning files)
- Pipeline overview (4 phases: INGEST → CLASSIFY → SCAFFOLD → VALIDATE)
- Decision tree mapping user intent → specific reference file
- Anti-patterns table with 4 entries
- Reference map table

Content should follow the spec at `docs/superpowers/specs/2026-04-05-skill-synthesis-design.md` Section 3.

- [ ] **Step 2: Copy to both locations**

```bash
cp -r .opencode/skills/skill-synthesis/ .skills-lab/active/refactoring-skills/skill-synthesis/
```

- [ ] **Step 3: Verify sync**

```bash
diff -rq .opencode/skills/skill-synthesis/ .skills-lab/active/refactoring-skills/skill-synthesis/
```

Expected: only differences in files that don't exist yet (refs, scripts, etc.)

- [ ] **Step 4: Commit**

```bash
git add .opencode/skills/skill-synthesis/ .skills-lab/active/refactoring-skills/skill-synthesis/
git commit -m "skill-synthesis: add SKILL.md with frontmatter — establishes pipeline entry point and routing target"
```

---

### Task 2: Add reference files (01-05)

**Files:**
- Create: `.opencode/skills/skill-synthesis/references/01-github-ingestion.md`
- Create: `.opencode/skills/skill-synthesis/references/02-pattern-classifier.md`
- Create: `.opencode/skills/skill-synthesis/references/03-eval-framework.md`
- Create: `.opencode/skills/skill-synthesis/references/04-quality-matrix.md`
- Create: `.opencode/skills/skill-synthesis/references/05-template-library.md`
- Create: Same files in `.skills-lab/active/refactoring-skills/skill-synthesis/references/`

- [ ] **Step 1: Write 01-github-ingestion.md (~150-200 lines)**

Content:
- `repomix --remote` usage patterns (with correct `--include` flag, not `--include-patterns`)
- `webfetch` for agentskills.io/llms.txt
- `websearch` for finding skill patterns on GitHub
- Non-interactive shell constraints (CI=true, no TTY, timeout wrappers)
- Output format: JSON with skills_found, files, total_lines
- Error handling: repo not found, private repos, empty results
- Cleanup: trap for /tmp files

Reference the existing `repomix-exploration-guide` patterns.

- [ ] **Step 2: Write 02-pattern-classifier.md (~150-200 lines)**

Content:
- P1/P2/P3 pattern detection (line count + reference count thresholds)
- 3-axis taxonomy: Routing, Efficiency, Testing
- Quality scoring overview (links to 04-quality-matrix.md for details)
- Classification output format (JSON)
- Examples: what a P1 router looks like vs P2 domain vs P3 expert
- Edge cases: ambiguous classification, hybrid patterns

- [ ] **Step 3: Write 03-eval-framework.md (~200-250 lines)**

Content:
- agentskills.io TAB 4 eval structure (prompt + expected output + assertions)
- Test case format (evals.json structure)
- Trigger query format (trigger-queries.json, 20 queries, 60/40 train/val split)
- Assertion types: file existence, content presence, structural, format
- Grading: PASS/FAIL with concrete evidence
- Iteration loop: Evaluate → Revise → Repeat
- Workspace structure: `workspace/iteration-N/eval-<name>/`
- Benchmark aggregation: pass_rate, time_seconds, tokens

- [ ] **Step 4: Write 04-quality-matrix.md (~150-200 lines)**

Content:
- 5 dimensions with weights: Trigger Accuracy (25%), Action Coherence (25%), Reference Integrity (20%), Non-Redundancy (15%), Edge Case Coverage (15%)
- Mechanical proxy checks for each dimension (what bash can verify)
- Block rule: any dimension ≤ 2 blocks release
- Release thresholds: EXCELLENT (4.5+), GOOD (4.0+), ACCEPTABLE (3.5+), NEEDS WORK (<3.5)
- Adapted from existing `use-authoring-skills/references/05-skill-quality-matrix.md`

- [ ] **Step 5: Write 05-template-library.md (~100-150 lines)**

Content:
- How to extract templates from ingested repos (one-time, not maintained)
- Minimal SKILL.md template structure
- Minimal evals.json template
- Minimal trigger-queries.json template
- How to adapt templates to new domains

- [ ] **Step 6: Copy all refs to both locations**

```bash
cp -r .opencode/skills/skill-synthesis/references/ .skills-lab/active/refactoring-skills/skill-synthesis/references/
```

- [ ] **Step 7: Verify sync and commit**

```bash
diff -rq .opencode/skills/skill-synthesis/references/ .skills-lab/active/refactoring-skills/skill-synthesis/references/
git add .opencode/skills/skill-synthesis/references/ .skills-lab/active/refactoring-skills/skill-synthesis/references/
git commit -m "skill-synthesis: add 5 reference files — ingestion, classification, evals, quality, templates"
```

---

### Task 3: Create bash scripts (ingest-repo.sh, classify-pattern.sh)

**Files:**
- Create: `.opencode/skills/skill-synthesis/scripts/ingest-repo.sh`
- Create: `.opencode/skills/skill-synthesis/scripts/classify-pattern.sh`
- Create: Same in `.skills-lab/active/refactoring-skills/skill-synthesis/scripts/`

- [ ] **Step 1: Write ingest-repo.sh (~100-150 lines)**

```bash
#!/usr/bin/env bash
set -euo pipefail
# Non-interactive environment
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat GCM_INTERACTIVE=never
```

Key behaviors:
- Parse args: `<owner/repo>` (required), `[output-dir]` (optional, default `/tmp/skill-ingest-$$`)
- Run `repomix --remote <owner/repo> --include "**/SKILL.md,**/skills/**/*.md" --output <output-dir>/packed.xml`
- Extract SKILL.md file paths from packed XML using grep/sed
- Count lines per file
- Output JSON: `{ "skills_found": N, "files": [{"path": "...", "lines": N}], "total_lines": N }`
- Trap: cleanup /tmp on exit
- Exit 0 on success, non-zero on failure

- [ ] **Step 2: Write classify-pattern.sh (~100-150 lines)**

```bash
#!/usr/bin/env bash
set -euo pipefail
```

Key behaviors:
- Parse args: `<skill-dir>` (required)
- Validate: SKILL.md exists, has frontmatter
- Count: SKILL.md lines, reference files, scripts, evals
- Classify: P1 (<200L, 0-2 refs), P2 (200-400L, 3-8 refs), P3 (400L+, 8+ refs)
- Check: decision tree present? Iron Law? anti-patterns? evals? trigger-queries?
- Output JSON: `{ "pattern": "P2", "lines": N, "refs": N, "scripts": N, "has_evals": true, "has_triggers": false, "has_decision_tree": true, "has_iron_law": true }`
- Exit 0 on success, non-zero if not valid skill

- [ ] **Step 3: Make executable and copy to both locations**

```bash
chmod +x .opencode/skills/skill-synthesis/scripts/*.sh
cp -r .opencode/skills/skill-synthesis/scripts/ .skills-lab/active/refactoring-skills/skill-synthesis/scripts/
chmod +x .skills-lab/active/refactoring-skills/skill-synthesis/scripts/*.sh
```

- [ ] **Step 4: Test scripts locally**

```bash
# Test ingest-repo.sh — verify usage error
bash .opencode/skills/skill-synthesis/scripts/ingest-repo.sh 2>&1 || true  # should fail with usage

# Test ingest-repo.sh — dry run against a known public repo
bash .opencode/skills/skill-synthesis/scripts/ingest-repo.sh anthropics/skills /tmp/test-ingest
# Verify: /tmp/test-ingest/packed.xml exists, JSON output has skills_found > 0

# Test classify-pattern.sh against an existing skill
bash .opencode/skills/skill-synthesis/scripts/classify-pattern.sh .opencode/skills/meta-builder/
# Verify: JSON output has pattern: "P1", has_decision_tree: true
```

- [ ] **Step 5: Commit**

```bash
git add .opencode/skills/skill-synthesis/scripts/ .skills-lab/active/refactoring-skills/skill-synthesis/scripts/
git commit -m "skill-synthesis: add ingest-repo.sh and classify-pattern.sh — Phase 1 and Phase 2 pipeline scripts"
```

---

### Task 4: Create bash scripts (run-trigger-evals.sh, grade-outputs.sh)

**Files:**
- Create: `.opencode/skills/skill-synthesis/scripts/run-trigger-evals.sh`
- Create: `.opencode/skills/skill-synthesis/scripts/grade-outputs.sh`
- Create: Same in `.skills-lab/active/refactoring-skills/skill-synthesis/scripts/`

- [ ] **Step 1: Write run-trigger-evals.sh (~120-180 lines)**

```bash
#!/usr/bin/env bash
set -euo pipefail
export CI=true GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat
```

Key behaviors (STRUCTURAL checks, not LLM simulation):
- Parse args: `<skill-dir>` (required)
- Read `evals/trigger-queries.json` — extract queries and should_trigger booleans
- Extract description from SKILL.md frontmatter (between `---` markers)
- Define stop words as a compact variable: `STOPWORDS="a an the is are was were be been being have has had do does did will would could should may might must shall can to of in for on with at by from as into through during before after above below between out off over under again further then once here there when where why how all both each few more most other some such no nor not only own same so than too very just because but and or if while about up that this these those i me my myself we our ours ourselves you your yours yourself yourselves he him his himself she her hers herself it its itself they them their theirs themselves what which who whom"`
- For each `should_trigger: true` query: extract significant words (≥3 chars, not in STOPWORDS), check if ≥2 appear in description
- For each `should_trigger: false` query: check that ≤1 significant word appears
- Calculate: true_positives, true_negatives, false_positives, false_negatives, coverage
- Output JSON: `{ "total": N, "true_positives": N, "true_negatives": N, "false_positives": N, "false_negatives": N, "coverage": 0.XX }`
- Exit 0 if coverage ≥ 0.80, non-zero otherwise

- [ ] **Step 2: Write grade-outputs.sh (~120-180 lines)**

```bash
#!/usr/bin/env bash
set -euo pipefail
```

Key behaviors (mechanical proxies, not qualitative scoring):
- Parse args: `<skill-dir>` (required)
- Score each dimension via 0-3 checks, then scale to 0-5 (matching spec algorithm):
  - **Trigger Accuracy (0-3 → scale to 0-5)**: desc length 100-1024? (+1) Has "Use when"? (+1) Has ≥3 trigger phrases? (+1). Scale: `score * 5 / 3`
  - **Action Coherence (0-3 → scale to 0-5)**: Has decision tree/checklist? (+1) Has Iron Law? (+1) Has step-by-step workflow? (+1). Scale: `score * 5 / 3`
  - **Reference Integrity (0-3 → scale to 0-5)**: All referenced files exist? (+1) No dead refs? (+1) References numbered? (+1). Scale: `score * 5 / 3`
  - **Non-Redundancy (0-3 → scale to 0-5)**: SKILL.md < 400 lines? (+1) No duplicate content in refs? (+1) No tutorial content? (+1). Scale: `score * 5 / 3`
  - **Edge Case Coverage (0-3 → scale to 0-5)**: Has anti-patterns table? (+1) Has error handling? (+1) Has platform adaptation? (+1). Scale: `score * 5 / 3`
- Calculate weighted total: (trigger*0.25 + coherence*0.25 + integrity*0.20 + redundancy*0.15 + edge*0.15)
- Block rule: any dimension ≤ 2 → blocked
- Output JSON: `{ "dimensions": {"trigger_accuracy": N, "action_coherence": N, "reference_integrity": N, "non_redundancy": N, "edge_case_coverage": N}, "total": X.X, "grade": "GOOD|ACCEPTABLE|NEEDS WORK", "blocked": false }`
- Exit 0 if total ≥ 3.5 and not blocked, non-zero otherwise

- [ ] **Step 3: Make executable and copy to both locations**

```bash
chmod +x .opencode/skills/skill-synthesis/scripts/run-trigger-evals.sh .opencode/skills/skill-synthesis/scripts/grade-outputs.sh
cp -r .opencode/skills/skill-synthesis/scripts/ .skills-lab/active/refactoring-skills/skill-synthesis/scripts/
```

- [ ] **Step 4: Test scripts against existing skills**

```bash
# Test run-trigger-evals.sh against meta-builder (has trigger-queries.json)
bash .opencode/skills/skill-synthesis/scripts/run-trigger-evals.sh .opencode/skills/meta-builder/

# Test grade-outputs.sh against use-authoring-skills
bash .opencode/skills/skill-synthesis/scripts/grade-outputs.sh .opencode/skills/use-authoring-skills/
```

- [ ] **Step 5: Commit**

```bash
git add .opencode/skills/skill-synthesis/scripts/ .skills-lab/active/refactoring-skills/skill-synthesis/scripts/
git commit -m "skill-synthesis: add run-trigger-evals.sh and grade-outputs.sh — Phase 4 validation scripts"
```

---

### Task 5: Integrate validation gate scripts from use-authoring-skills

**Files:**
- Copy: `.opencode/skills/use-authoring-skills/scripts/validate-gate.sh` → `.opencode/skills/skill-synthesis/scripts/validate-gate.sh`
- Copy: `.opencode/skills/use-authoring-skills/scripts/validate-skill.sh` → `.opencode/skills/skill-synthesis/scripts/validate-skill.sh`
- Copy: `.opencode/skills/use-authoring-skills/scripts/check-overlaps.sh` → `.opencode/skills/skill-synthesis/scripts/check-overlaps.sh`
- Same copies in `.skills-lab/active/refactoring-skills/skill-synthesis/scripts/`

These 3 scripts are needed for Phase 4 VALIDATE (spec Section 3.4). They use `SCRIPT_DIR` relative paths internally, so they must be co-located with the skill.

- [ ] **Step 1: Copy the 3 scripts**

```bash
cp .opencode/skills/use-authoring-skills/scripts/validate-gate.sh .opencode/skills/skill-synthesis/scripts/
cp .opencode/skills/use-authoring-skills/scripts/validate-skill.sh .opencode/skills/skill-synthesis/scripts/
cp .opencode/skills/use-authoring-skills/scripts/check-overlaps.sh .opencode/skills/skill-synthesis/scripts/
chmod +x .opencode/skills/skill-synthesis/scripts/validate-*.sh .opencode/skills/skill-synthesis/scripts/check-overlaps.sh
```

- [ ] **Step 2: Copy to sync location**

```bash
cp .opencode/skills/skill-synthesis/scripts/validate-*.sh .skills-lab/active/refactoring-skills/skill-synthesis/scripts/
cp .opencode/skills/skill-synthesis/scripts/check-overlaps.sh .skills-lab/active/refactoring-skills/skill-synthesis/scripts/
chmod +x .skills-lab/active/refactoring-skills/skill-synthesis/scripts/validate-*.sh .skills-lab/active/refactoring-skills/skill-synthesis/scripts/check-overlaps.sh
```

- [ ] **Step 3: Verify scripts work**

```bash
# Test validate-gate.sh against skill-synthesis itself
bash .opencode/skills/skill-synthesis/scripts/validate-gate.sh create "synthesize a skill" .opencode/skills/skill-synthesis/

# Test validate-skill.sh
bash .opencode/skills/skill-synthesis/scripts/validate-skill.sh .opencode/skills/skill-synthesis/
```

- [ ] **Step 4: Commit**

```bash
git add .opencode/skills/skill-synthesis/scripts/validate-*.sh .opencode/skills/skill-synthesis/scripts/check-overlaps.sh .skills-lab/active/refactoring-skills/skill-synthesis/scripts/validate-*.sh .skills-lab/active/refactoring-skills/skill-synthesis/scripts/check-overlaps.sh
git commit -m "skill-synthesis: integrate validation gate scripts from use-authoring-skills — enables Phase 4 VALIDATE"
```

---

### Task 6: Create evals and templates

**Files:**
- Create: `.opencode/skills/skill-synthesis/evals/evals.json`
- Create: `.opencode/skills/skill-synthesis/evals/trigger-queries.json`
- Create: `.opencode/skills/skill-synthesis/templates/skill-scaffold.md`
- Create: `.opencode/skills/skill-synthesis/templates/eval-scaffold.json`
- Create: Same in `.skills-lab/active/refactoring-skills/skill-synthesis/`

- [ ] **Step 1: Write evals.json (5 test cases)**

Test cases for the skill-synthesis skill itself. Use the assertion format from `use-authoring-skills/evals/evals.json`:
```json
{
  "id": "TC-001",
  "prompt": "realistic user message",
  "expected_output": { "should_trigger": true, "path": "INGEST" },
  "assertions": [
    {"type": "structural", "text": "description contains trigger phrase", "passed": false, "evidence": ""}
  ],
  "files": [],
  "fixture": "intent-confirmed"
}
```

- TC-001: "Create a skill from the anthropics/skills repo" → should trigger, path: INGEST
- TC-002: "Find skill patterns across GitHub repos" → should trigger, path: CLASSIFY
- TC-003: "Generate evals for my new skill" → should trigger, path: EVAL
- TC-004: "Fix the bug in my auth module" → should NOT trigger
- TC-005: "Write a Python script to parse logs" → should NOT trigger

- [ ] **Step 2: Write trigger-queries.json (20 queries)**

10 should-trigger, 10 should-not-trigger. Include near-miss negatives (share keywords but need different skill).

- [ ] **Step 3: Write skill-scaffold.md template**

Minimal valid SKILL.md with:
- Frontmatter template (name, description with trigger phrases, metadata)
- Iron Law section placeholder
- On Load section template
- Pipeline/decision tree template
- Anti-patterns table template
- Reference map template

- [ ] **Step 4: Write eval-scaffold.json template**

Minimal evals.json structure with one example test case and comments explaining each field.

- [ ] **Step 5: Copy to both locations and commit**

```bash
cp -r .opencode/skills/skill-synthesis/evals/ .skills-lab/active/refactoring-skills/skill-synthesis/evals/
cp -r .opencode/skills/skill-synthesis/templates/ .skills-lab/active/refactoring-skills/skill-synthesis/templates/
git add .opencode/skills/skill-synthesis/evals/ .opencode/skills/skill-synthesis/templates/ .skills-lab/active/refactoring-skills/skill-synthesis/evals/ .skills-lab/active/refactoring-skills/skill-synthesis/templates/
git commit -m "skill-synthesis: add evals and templates — self-test infrastructure for the synthesis skill"
```

---

### Task 7: Update meta-builder routing table

**Files:**
- Modify: `.opencode/skills/meta-builder/SKILL.md`
- Modify: `.skills-lab/active/refactoring-skills/meta-builder/SKILL.md`

- [ ] **Step 1: Add routing entry**

Add to the Routing Table in meta-builder/SKILL.md:

```
| "synthesize skills" / "create skills from GitHub" | `skill-synthesis` |
```

Also add to Stacking Recipes if applicable:

```
| "Synthesize a skill + validate it" | skill-synthesis + use-authoring-skills | Synthesis + validation gate |
```

- [ ] **Step 2: Update both locations**

Ensure the change is in both `.opencode/skills/meta-builder/SKILL.md` and `.skills-lab/active/refactoring-skills/meta-builder/SKILL.md`.

- [ ] **Step 3: Verify routing consistency**

```bash
# Check that the new route exists in both locations
grep "skill-synthesis" .opencode/skills/meta-builder/SKILL.md
grep "skill-synthesis" .skills-lab/active/refactoring-skills/meta-builder/SKILL.md
```

- [ ] **Step 4: Commit**

```bash
git add .opencode/skills/meta-builder/SKILL.md .skills-lab/active/refactoring-skills/meta-builder/SKILL.md
git commit -m "meta-builder: add skill-synthesis routing — enables discovery of the synthesis skill"
```

---

### Task 8: Final verification and integration test

**Files:**
- Verify: All files in both locations
- Test: Scripts against existing skills

- [ ] **Step 1: Full sync verification**

```bash
diff -rq .opencode/skills/skill-synthesis/ .skills-lab/active/refactoring-skills/skill-synthesis/
```

Expected: zero differences.

- [ ] **Step 2: Run all scripts against existing skills**

```bash
# classify-pattern.sh against all existing skills
for skill in .opencode/skills/*/; do
  echo "=== $(basename $skill) ==="
  bash .opencode/skills/skill-synthesis/scripts/classify-pattern.sh "$skill" 2>&1 || echo "FAILED"
done

# grade-outputs.sh against use-authoring-skills (should pass — it's a high-quality skill)
bash .opencode/skills/skill-synthesis/scripts/grade-outputs.sh .opencode/skills/use-authoring-skills/

# run-trigger-evals.sh against meta-builder (has trigger-queries.json)
bash .opencode/skills/skill-synthesis/scripts/run-trigger-evals.sh .opencode/skills/meta-builder/
```

- [ ] **Step 3: Verify SKILL.md line count and structure**

```bash
wc -l .opencode/skills/skill-synthesis/SKILL.md
# Should be ~200 lines (Process pattern)
```

- [ ] **Step 4: Verify frontmatter**

```bash
# Check name
grep "^name:" .opencode/skills/skill-synthesis/SKILL.md
# Check description has trigger phrases
grep -c "Use when" .opencode/skills/skill-synthesis/SKILL.md
# Check metadata
grep -A3 "metadata:" .opencode/skills/skill-synthesis/SKILL.md
```

- [ ] **Step 5: Verify no dead references**

```bash
# Check all referenced files exist
grep -oP 'references/[\w-]+\.md' .opencode/skills/skill-synthesis/SKILL.md | while read ref; do
  [ -f ".opencode/skills/skill-synthesis/$ref" ] && echo "OK: $ref" || echo "MISSING: $ref"
done
```

- [ ] **Step 6: Commit final state**

```bash
git add .opencode/skills/skill-synthesis/ .skills-lab/active/refactoring-skills/skill-synthesis/
git commit -m "skill-synthesis: final verification passed — all scripts tested, both locations synced"
```

---

## File Summary

| Task | Files Created | Files Modified |
|------|--------------|----------------|
| 1 | SKILL.md (×2 locations) | — |
| 2 | 5 reference files (×2) | — |
| 3 | ingest-repo.sh, classify-pattern.sh (×2) | — |
| 4 | run-trigger-evals.sh, grade-outputs.sh (×2) | — |
| 5 | validate-gate.sh, validate-skill.sh, check-overlaps.sh (×2, copied from use-authoring-skills) | — |
| 6 | evals.json, trigger-queries.json, skill-scaffold.md, eval-scaffold.json (×2) | — |
| 7 | — | meta-builder/SKILL.md (×2) |
| 8 | — | — (verification only) |

**Total: 28 new files (×2 locations = 56 file creations), 2 file modifications, 8 commits**
