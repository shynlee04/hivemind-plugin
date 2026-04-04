# Quality Matrix

## Overview

Adapted from `use-authoring-skills/references/05-skill-quality-matrix.md`. The full scoring rubric tables live there — this file focuses on **mechanical proxy checks** that can be verified by bash scripts, plus the aggregation logic and release gates.

## 5 Dimensions with Weights

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Trigger Accuracy** | 25% | Description triggers on specific conditions, false positives minimized |
| **Action Coherence** | 25% | ONE thing well, clear entry/exit, no mission creep |
| **Reference Integrity** | 20% | 1-level depth, numbered files, no circular refs |
| **Non-Redundancy** | 15% | No overlap with existing skills, distinct purpose |
| **Edge Case Coverage** | 15% | Handles degraded, delegated, resumed, post-cancel states |

Full criteria tables: see `use-authoring-skills/references/05-skill-quality-matrix.md`.

## Scoring Scale

| Score | Rating | Definition |
|-------|--------|------------|
| **5** | Excellent | Consistently exceeds expectations |
| **4** | Good | Meets expectations with minor gaps |
| **3** | Acceptable | Meets minimum requirements |
| **2** | Needs Work | Significant gaps |
| **1** | Poor | Fails minimum requirements |

## Mechanical Proxy Checks

These are bash-verifiable checks. Each passing check contributes +1 toward the dimension score.

### Trigger Accuracy (max +5)

- Description starts with "Use when..." → +1
- Specific triggering conditions listed in description → +1
- No generic trigger words ("skill", "create", "help") as sole triggers → +1
- Clear cause-effect stated → +1
- Trigger phrases in SKILL.md match decision tree entries → +1

### Action Coherence (max +5)

- SKILL.md body has single "First Action" block → +1
- Entry state defined (On Load section) → +1
- Exit state defined (Output section) → +1
- No more than 3 distinct workflows in body → +1
- Boundaries explicitly marked (Anti-Patterns section) → +1

### Reference Integrity (max +5)

- Reference depth = 1 level (no subdirectories in references/) → +1
- Files numbered sequentially (01-, 02-, etc.) → +1
- All markdown links resolve (no broken internal links) → +1
- No circular references (A links to B, B links to A) → +1
- Each reference file is 150-300 lines → +1

### Non-Redundancy (max +3)

- No other skill in workspace has same `name` in frontmatter → +1
- Description differs from all existing skills by > 50% (word overlap) → +1
- Can explain difference from nearest skill in one sentence → +1

### Edge Case Coverage (max +4)

- Entry state recognition present (On Load section) → +1
- Degraded state handling mentioned → +1
- Delegation edge cases addressed → +1
- Post-cancel awareness present → +1

## Overall Score Calculation

```
Overall = (Trigger × 0.25) + (Action × 0.25) + (Reference × 0.20) + (Redundancy × 0.15) + (Edge × 0.15)
```

### Worked Example

Skill: `use-authoring-skills`

| Dimension | Score | Weight | Weighted | Evidence |
|-----------|-------|--------|----------|----------|
| Trigger Accuracy | 4 | 0.25 | 1.00 | Description has specific conditions, minor false positives on "create skill" keyword |
| Action Coherence | 4 | 0.25 | 1.00 | Single purpose (authoring pipeline), clear 4-phase workflow |
| Reference Integrity | 5 | 0.20 | 1.00 | 1-level depth, numbered refs, all links resolve |
| Non-Redundancy | 5 | 0.15 | 0.75 | No overlap with existing skills — unique authoring function |
| Edge Case Coverage | 3 | 0.15 | 0.45 | Covers basic states, missing degraded session handling |
| **Overall** | | | **4.20** | **GOOD** |

**Grade:** GOOD (4.20) — Add degraded session handling to reach EXCELLENT.

## Release Thresholds

| Grade | Score | Action |
|-------|-------|--------|
| EXCELLENT | 4.5+ | Ship it |
| GOOD | 4.0+ | Minor polish |
| ACCEPTABLE | 3.5+ | Address specific gaps |
| NEEDS WORK | <3.5 | Do not release |

**Block rule:** Any single dimension scoring ≤ 2 blocks release regardless of overall score.

## Evaluation Template

```markdown
## Skill-Judge Evaluation: [Skill Name]
**Date:** [YYYY-MM-DD]

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Trigger Accuracy | /5 | [Notes] |
| Action Coherence | /5 | [Notes] |
| Reference Integrity | /5 | [Notes] |
| Non-Redundancy | /5 | [Notes] |
| Edge Case Coverage | /5 | [Notes] |

Trigger:      [X] × 0.25 = [X.XX]
Action:       [X] × 0.25 = [X.XX]
Reference:    [X] × 0.20 = [X.XX]
Redundancy:   [X] × 0.15 = [X.XX]
Edge:         [X] × 0.15 = [X.XX]
Overall:                 [X.XX]

**Grade:** [EXCELLENT/GOOD/ACCEPTABLE/NEEDS WORK]
**Blocked:** [Yes/No] — [Reason if any dimension ≤ 2]
```
