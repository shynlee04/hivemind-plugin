# Pattern Classifier

## Overview

This reference covers the CLASSIFY phase of the skill-synthesis pipeline. After ingestion produces a corpus of SKILL.md files, each skill is classified along multiple axes to determine its architecture pattern, routing behavior, efficiency profile, and testing maturity.

## 3-Axis Taxonomy

Every skill is classified along three independent axes:

| Axis | Purpose | Categories |
|------|---------|------------|
| **Routing** | Does this skill delegate to other skills? | Thin router, Context router, Not-a-router |
| **Efficiency** | How does it use context tokens? | Pure-instructions, Token-efficient, Script-bundled, Context-heavy |
| **Testing** | What testing infrastructure exists? | Has evals, Has triggers, Has scripts, Has matrix, Complete |

These axes are orthogonal to the P1/P2/P3 pattern classification. A P1 skill can be a thin router (expected) or a context router (unusual). A P3 skill can be context-heavy (expected) or token-efficient (rare).

## P1/P2/P3 Pattern Detection

### Detection Rules

| Pattern | Line Count Threshold | Reference Count | Decision Tree |
|---------|---------------------|-----------------|---------------|
| **P1 — Routing** | < 200 lines | 0-2 reference files | Required (routing table) |
| **P2 — Domain** | 200-400 lines | 3-8 reference files | Required (decision tree) |
| **P3 — Expertise** | 400+ lines | 8+ reference files | Required (multi-scenario) |

### Detection Algorithm

```bash
#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="${1:?Usage: classify-pattern.sh <skill-dir>}"

skill_md="$SKILL_DIR/SKILL.md"
if [ ! -f "$skill_md" ]; then
  echo '{"error": "no_skill_md", "path": "'"$SKILL_DIR"'"}' >&2
  exit 1
fi

line_count=$(wc -l < "$skill_md")
ref_count=$(find "$SKILL_DIR/references" -name "*.md" 2>/dev/null | wc -l || echo 0)
has_decision_tree=$(grep -ciE "decision tree|when to load|pick your path|routing table" "$skill_md" || echo 0)
has_evals=$(test -d "$SKILL_DIR/evals" && echo true || echo false)
has_scripts=$(test -d "$SKILL_DIR/scripts" && echo true || echo false)

# Determine pattern
if [ "$line_count" -lt 200 ] && [ "$ref_count" -le 2 ]; then
  pattern="P1"
  pattern_name="Routing"
elif [ "$line_count" -le 400 ] && [ "$ref_count" -le 8 ]; then
  pattern="P2"
  pattern_name="Domain"
else
  pattern="P3"
  pattern_name="Expertise"
fi

# Determine routing type
if [ "$has_decision_tree" -gt 0 ] && [ "$ref_count" -le 2 ]; then
  routing="thin_router"
elif [ "$has_decision_tree" -gt 0 ] && [ "$ref_count" -gt 2 ]; then
  routing="context_router"
else
  routing="not_a_router"
fi

# Determine efficiency (ref_density — direct ref_count thresholds)
if [ "$has_scripts" = true ]; then
  efficiency="script_bundled"
elif [ "$ref_count" -eq 0 ]; then
  efficiency="pure_instructions"
elif [ "$ref_count" -le 2 ]; then
  efficiency="token_efficient"
elif [ "$ref_count" -le 8 ]; then
  efficiency="script_bundled"
else
  efficiency="context_heavy"
fi

# Determine testing maturity
if [ "$has_evals" = true ] && [ "$has_scripts" = true ]; then
  testing="complete"
elif [ "$has_evals" = true ]; then
  testing="has_evals"
elif [ "$has_scripts" = true ]; then
  testing="has_scripts"
else
  testing="none"
fi

jq -n \
  --arg pattern "$pattern" \
  --arg pattern_name "$pattern_name" \
  --arg routing "$routing" \
  --arg efficiency "$efficiency" \
  --arg testing "$testing" \
  --argjson lines "$line_count" \
  --argjson refs "$ref_count" \
  '{
    pattern: $pattern,
    pattern_name: $pattern_name,
    routing: $routing,
    efficiency: $efficiency,
    testing: $testing,
    line_count: $lines,
    reference_count: $refs
  }'
```

## Classification Output Format

Each skill produces a JSON classification record:

```json
{
  "skill_name": "use-authoring-skills",
  "pattern": "P2",
  "pattern_name": "Domain",
  "routing": "context_router",
  "efficiency": "script_bundled",
  "testing": "complete",
  "line_count": 180,
  "reference_count": 12,
  "quality_score": 4.2,
  "quality_grade": "GOOD"
}
```

## Examples by Pattern

### P1 Router Example

```
meta-builder/
├── SKILL.md              # 120 lines — thin entry, routes to specialist skills
└── references/
    └── routing-map.md    # 1 file — detailed routing logic
```

**Characteristics:**
- SKILL.md body is a decision tree only
- No deep implementation guidance
- Delegates to 3+ other skills
- References: 0-2 files

### P2 Domain Example

```
use-authoring-skills/
├── SKILL.md              # 180 lines — core workflow + decision tree
├── references/           # 12 files — focused topics
├── scripts/              # Validation scripts
├── evals/                # Test cases
└── templates/            # Scaffolds
```

**Characteristics:**
- Clear primary workflow
- Decision tree for reference loading
- 3-8 reference files (can be up to 12 for complex domains)
- May include scripts and evals

### P3 Expertise Example

```
opencode-platform-reference/
├── SKILL.md              # 450+ lines — comprehensive guide
├── references/           # 15+ files — deep reference material
├── scripts/
├── templates/
└── assets/
```

**Characteristics:**
- Multiple workflows for different scenarios
- Detailed edge case handling
- Recovery procedures
- Cross-references between many reference files

## Edge Cases

### Ambiguous Classification

When a skill falls on a boundary (e.g., 195 lines with 3 references), use the **primary purpose** heuristic:

1. What does the SKILL.md body spend most of its lines on?
   - Routing logic → P1
   - Workflow guidance → P2
   - Reference material → P3

2. Flag ambiguous cases in the output:
   ```json
   {
     "pattern": "P2",
     "confidence": "low",
     "ambiguity_reason": "Line count suggests P1 (195L) but reference count suggests P2 (3 refs)"
   }
   ```

### Hybrid Patterns

Some skills combine patterns. A skill might be a P1 router that also contains deep reference material (anti-pattern, but exists in the wild):

```json
{
  "pattern": "P1",
  "anti_pattern_detected": true,
  "anti_pattern": "P1 with P3 content",
  "recommendation": "Split: thin SKILL.md + reference files"
}
```

### Quality Scoring Overview

Quality scoring uses the 5-dimension weighted matrix. See `references/04-quality-matrix.md` for the full rubric. The classifier produces a quick estimate:

| Quick Check | Score Indicator |
|-------------|----------------|
| Has evals + triggers + scripts + quality matrix | 4.0+ (GOOD) |
| Has evals + triggers | 3.5+ (ACCEPTABLE) |
| Has evals only | 3.0 (borderline) |
| No evals | < 3.0 (NEEDS WORK) |

This is a heuristic only. Run the full quality matrix for accurate scoring.

## Classification Workflow

```
1. For each SKILL.md in ingestion corpus:
   a. Count lines in SKILL.md
   b. Count reference files
   c. Detect decision tree presence
   d. Check for evals/, scripts/, templates/
   e. Run classification algorithm
   f. Output JSON record
2. Aggregate all records into classification report
3. Rank by quality score (descending)
4. Flag anti-patterns for human review
```
