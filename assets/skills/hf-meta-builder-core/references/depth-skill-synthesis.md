# Depth Reference: Skill Synthesis

> **Loading trigger:** Read when ingesting skills from remote repos (GitHub → skill directory).
> **Do NOT load** for simple routing tasks.

---

## What It Does

This reference documents the full pipeline from a GitHub repository URL to a generated skill directory ready for OpenCode loading. Skill synthesis is the highest-leverage operation in the meta-builder toolkit — it converts months of engineering wisdom embedded in a codebase into a hot-swappable knowledge artifact that changes AI behavior instantly.

The pipeline has five stages: INGEST → CLASSIFY → SCAFFOLD → VALIDATE → INTEGRATE. Each stage has specific tool requirements, error handling patterns, and quality gates. Skipping a stage produces a skill that is either too shallow (just a summary of the repo) or too deep (a repomix dump masquerading as a skill).

---

## WHY It Matters for Meta-Builder

Skill synthesis is where the meta-builder's "knowledge delta" principle is most directly tested. A good synthesized skill extracts the decision trees and trade-offs that the original authors developed through trial and error. A bad synthesized skill extracts the directory structure and function names — information the model already knows.

**The synthesis pipeline is also the primary source of new skills in the hivemind ecosystem.** When a user says "I want a skill like [famous repo]", this pipeline produces the artifact. Its quality determines whether the hivemind grows stronger or just grows larger.

---

## WHEN to Use

| Trigger | Pipeline Stage | Expected Output |
|---------|---------------|---------------|
| User says "create a skill from this GitHub repo" | Full pipeline (INGEST → INTEGRATE) | Complete skill directory with SKILL.md + references/ + scripts/ |
| User says "what patterns does this repo have?" | INGEST → CLASSIFY only | Pattern inventory (no skill created) |
| User says "turn this repo into a skill for me" | Full pipeline | Skill directory + integration instructions |
| Post-creation: "is this skill any good?" | VALIDATE only | Skill-judge score + gap list |

---

## The Pipeline

### Stage 1: INGEST — Repository Packing

**Goal:** Convert the GitHub repository into a compact, searchable representation.

**Procedure:**
```bash
# Step 1: Determine repo size and scope
repomix --remote https://github.com/user/repo \
  --include "src/**/*.ts,README.md,docs/**/*.md" \
  --ignore "node_modules/**,dist/**,*.test.ts" \
  --output repo-analysis.xml
```

**Decision tree:**
- Repo <10k lines: Pack everything, no compression needed
- Repo 10k-100k lines: Use `--compress` for implementation files, keep full text for README/docs
- Repo >100k lines: `--compress` all, then do targeted re-packs of specific modules

**Error handling:**
- **Repo not found (404):** Verify the URL. Check if it's a private repo that requires auth.
- **Empty results:** The `--include` pattern was too restrictive. Broaden and retry.
- **Timeout:** For repos >500k lines, use `--include` to limit to 3-5 key directories instead of the full repo.

### Stage 2: CLASSIFY — Pattern Extraction

**Goal:** Identify 1-3 skill-worthy patterns from the packed repo.

**Procedure:**
```bash
# Step 1: Search for architectural decisions
grep -nP "(DECISION|trade.?off|why we chose|instead of|rather than)" repo-analysis.xml | head -30

# Step 2: Search for unique patterns (not standard library usage)
grep -nP "(pattern|strategy|approach|framework|philosophy)" repo-analysis.xml | head -30

# Step 3: Find error handling and edge cases
grep -nP "(edge case|corner case|failure mode|fallback|degradation)" repo-analysis.xml | head -20
```

**Quality gate:** If the grep returns <5 substantive matches, the repo may be too implementation-heavy. Abort or narrow to a specific module (e.g., `src/core/` instead of the full repo).

### Stage 3: SCAFFOLD — Skill Directory Creation

**Goal:** Create the skill directory structure with real content, not stubs.

**Required files:**
```
skill-name/
├── SKILL.md              # Frontmatter + body (decision trees, trigger phrases)
├── references/
│   ├── summary.md        # What this skill does, when to use it
│   └── (1-2 depth files) # Detailed guides for complex sub-topics
├── scripts/
│   └── validate-gate.sh  # Acceptance test: does the skill load correctly?
└── evals/
    └── trigger-queries.json  # 10-20 test phrases that should trigger this skill
```

**Frontmatter rules:**
- `name`: kebab-case, max 64 chars
- `description`: Must contain trigger phrases in natural language (not keywords)
- `metadata.layer`: 1 (routing), 2 (composition), or 3 (execution)
- `metadata.role`: What this skill IS (not what it DOES)
- `allowed-tools`: Explicit list, no wildcards

**Body rules:**
- Lead with decision trees, not definitions
- Include "NEVER do X because [non-obvious reason]" patterns
- Include trade-offs: "A is faster but B handles edge case C"
- Keep paragraphs under 4 lines for readability

### Stage 4: VALIDATE — Quality Assurance

**Goal:** Verify the skill is loadable, triggerable, and knowledge-dense.

**Validation script:**
```bash
#!/bin/bash
set -euo pipefail
SKILL_DIR="$1"

# Check 1: Frontmatter has required fields
python3 -c "import yaml; d=yaml.safe_load(open('$SKILL_DIR/SKILL.md')); assert 'name' in d; assert 'description' in d"

# Check 2: Description contains trigger phrases (not just keywords)
grep -P '(when|if|for|how to|what is)' "$SKILL_DIR/SKILL.md" | head -5

# Check 3: All referenced files exist
for ref in $(grep -oP 'references/[\w\-\.]+' "$SKILL_DIR/SKILL.md" | sort -u); do
  test -f "$SKILL_DIR/$ref" || { echo "MISSING: $ref"; exit 1; }
done

# Check 4: Body is knowledge-dense (not tutorial content)
# (heuristic: >50% of paragraphs contain a specific decision, trade-off, or edge case)
```

**Skill-judge scoring:** Run the `skill-judge` skill on the new skill. Target: >80/120 points. If <60, the skill is too tutorial-heavy — needs more expert content.

### Stage 5: INTEGRATE — Ecosystem Wiring

**Goal:** Make the new skill discoverable and usable within the hivemind.

**Steps:**
1. Move skill to `.hivefiver-meta-builder/skills-lab/active/refactoring/skill-name/`
2. Verify it appears in `.opencode/skills/` via the directory-level symlink
3. Update `meta-builder/SKILL.md` routing table if this skill handles a new task type
4. Update `validate-gate.sh` if this skill needs to be callable from scripts
5. Run the full skill stack: `meta-builder` → `skill-judge` → `use-authoring-skills`

---

## Inline Examples

### webfetch — Fetching agentskills.io Spec

**When:** Creating a new skill that must conform to ecosystem standards.

**Example:**
```
webfetch: "https://agentskills.io/spec/v1"
# Verify: does my skill's frontmatter match the spec?
# If not, adapt before declaring complete.
```

**Error handling:** If agentskills.io is unreachable, use the local spec from `.hivefiver-meta-builder/skills-lab/specs/` as fallback.

### websearch — Corpus Research

**When:** Validating that a pattern extracted from one repo is genuinely unique (not standard practice).

**Example:**
```
websearch: "async error handling pattern: wait for all then aggregate vs fail fast"
# If 10+ repos use the same pattern, it's standard practice — don't synthesize it.
# If only 1-2 repos use it, it may be a genuine innovation worth capturing.
```

### Non-Interactive Shell Constraints

**Rule:** All scripts in `scripts/` must run with `set -euo pipefail` and produce exit code 0 on success, non-zero on failure. No interactive prompts. No `read` commands. No `vim` or `nano`.

**Why:** Skills are loaded by non-interactive agents. A script that waits for user input hangs the agent forever.

**Example safe script:**
```bash
#!/bin/bash
set -euo pipefail

SKILL_DIR="${1:-.}"
if [[ ! -f "$SKILL_DIR/SKILL.md" ]]; then
  echo "ERROR: SKILL.md not found in $SKILL_DIR" >&2
  exit 1
fi

echo "VALID: $SKILL_DIR/SKILL.md exists"
```

---

## Permission Recommendations

| Pipeline Stage | Required Tools | Optional Tools |
|----------------|----------------|----------------|
| **INGEST** | Bash (repomix), Read | webfetch (for spec verification) |
| **CLASSIFY** | Read, Grep | websearch (for pattern uniqueness validation) |
| **SCAFFOLD** | Read, Write, Edit, Bash, Glob, Grep | skill (for loading reference skills as templates) |
| **VALIDATE** | Bash, Read, Glob, Grep | skill (for skill-judge scoring) |
| **INTEGRATE** | Read, Write, Edit, Bash | — |

---

## Error Handling Reference

| Error | Stage | Recovery |
|-------|-------|----------|
| `404` from repomix remote | INGEST | Verify URL, check for private repo, try `github.com/user/repo/tree/main` |
| Empty classification results | CLASSIFY | Narrow `--include` to 1-2 directories, or abort if repo is too shallow |
| Frontmatter validation fails | SCAFFOLD | Fix frontmatter, re-run validation script |
| Missing reference file | SCAFFOLD | Create the file, or remove the reference from SKILL.md body |
| Skill-judge score <60 | VALIDATE | Add expert content: decision trees, trade-offs, edge cases. Remove tutorial content. |
| Routing table conflict | INTEGRATE | Disambiguate triggers, or merge with existing skill instead of creating new |
