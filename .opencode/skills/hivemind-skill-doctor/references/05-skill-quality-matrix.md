# Skill Quality Matrix

## Purpose

Skill-Judge evaluation framework for assessing HiveMind skill quality across 5 dimensions.

---

## Evaluation Overview

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Trigger Accuracy** | 25% | Description triggers on specific conditions |
| **Action Coherence** | 25% | ONE thing well, no mission creep |
| **Reference Integrity** | 20% | 1-level depth, no circular refs |
| **Non-Redundancy** | 15% | No overlap with existing skills |
| **Edge Case Coverage** | 15% | Handles degraded/delegated states |

---

## Scoring Scale

| Score | Rating | Definition |
|-------|--------|------------|
| **5** | Excellent | Consistently exceeds expectations |
| **4** | Good | Meets expectations with minor gaps |
| **3** | Acceptable | Meets minimum requirements |
| **2** | Needs Work | Significant gaps |
| **1** | Poor | Fails minimum requirements |

---

## Dimension 1: Trigger Accuracy (25%)

### What It Measures

- Does the description trigger on specific conditions?
- Are false positives minimized?
- Is the trigger unambiguous?

### Evaluation Criteria

| Score | Criteria |
|-------|----------|
| **5** | Triggers ONLY on specific conditions, no false positives |
| **4** | Specific triggers, minimal false positives |
| **3** | Captures most triggering conditions |
| **2** | Vague or triggers too broadly |
| **1** | Generic or non-triggering |

### Good Examples

```yaml
# Excellent
description: >
  Use when delegation scope is ambiguous,
  when inheriting tasks from subagent,
  or when scope boundaries are unclear.

# Poor
description: >
  Use when delegating tasks.
  (Too vague)
```

### Checklist

- [ ] Description starts with "Use when..."
- [ ] Specific triggering conditions listed
- [ ] No generic trigger words
- [ ] False positives minimized
- [ ] Clear cause-effect stated

---

## Dimension 2: Action Coherence (25%)

### What It Measures

- Does the skill do ONE thing well?
- Are entry/exit states clear?
- Is there mission creep?

### Evaluation Criteria

| Score | Criteria |
|-------|----------|
| **5** | Single purpose, clear entry/exit, zero mission creep |
| **4** | Single purpose, minor optional extensions |
| **3** | Clear primary purpose, some optional scope |
| **2** | Multiple purposes, unclear boundaries |
| **1** | Does everything, completely unfocused |

### Good Examples

```markdown
# Excellent - Single purpose
## Purpose
Context rot detection and trust scoring.
Does one thing: defends against context degradation.

# Poor - Multiple purposes
## Purpose
Context rot detection, delegation management,
workflow coordination, AND verification.
(Too much)
```

### Checklist

- [ ] Single clear purpose stated
- [ ] Entry state defined
- [ ] Exit state defined
- [ ] No mission creep in body
- [ ] Boundaries explicitly marked

---

## Dimension 3: Reference Integrity (20%)

### What It Measures

- Is reference depth = 1 level?
- Are references numbered and ordered?
- Is TOC present for P3?
- Are there circular references?

### Evaluation Criteria

| Score | Criteria |
|-------|----------|
| **5** | Perfect 1-level depth, logical ordering, clear TOC |
| **4** | 1-level depth, minor ordering issues |
| **3** | Some refs could be consolidated |
| **2** | 2-level depth or circular refs |
| **1** | Chaotic reference structure |

### Good Structure

```
skill/
├── SKILL.md
└── references/
    ├── 01-topic-alpha.md      # ✓ Numbered
    ├── 02-topic-beta.md        # ✓ Numbered
    └── index.md                # ✓ TOC for P3

references/01-topic-alpha.md
# (No references to other reference files) ✓
```

### Bad Structure

```
skill/
├── SKILL.md
└── references/
    ├── 01-topic-alpha.md
    │   └── references/
    │       └── nested.md      # ✗ 2-level deep
    └── 02-topic-beta.md
        └── "See 01-topic-alpha.md"  # ✗ Circular
```

### Checklist

- [ ] Reference depth = 1 level max
- [ ] Files numbered for ordering
- [ ] P3 has index.md with TOC
- [ ] Jump links functional
- [ ] No circular references

---

## Dimension 4: Non-Redundancy (15%)

### What It Measures

- Does this overlap with existing skills?
- Is the purpose distinct?
- Can boundaries be clearly drawn?

### Evaluation Criteria

| Score | Criteria |
|-------|----------|
| **5** | Unique purpose, no overlap |
| **4** | Minimal overlap, clear boundaries |
| **3** | Some overlap, but distinct enough |
| **2** | Significant overlap |
| **1** | Duplicate of existing skill |

### Cross-Reference Matrix

| Skill | vs context-intelligence | vs delegation-scope | vs workflow-hierarchy |
|-------|----------------------|-------------------|---------------------|
| context-intelligence | - | Border | Border |
| delegation-scope | Border | - | No overlap |
| workflow-hierarchy | Border | No overlap | - |
| context-rot-recovery | Extends | No overlap | No overlap |

### Checklist

- [ ] No duplicate of existing skill
- [ ] Distinct purpose from similar skills
- [ ] Boundaries clear
- [ ] Can explain difference in one sentence

---

## Dimension 5: Edge Case Coverage (15%)

### What It Measures

- Does it handle degraded states?
- Does it handle delegation edge cases?
- Does it handle post-cancel scenarios?
- Does it handle late-session drift?

### Entry State Coverage Matrix

| Skill | FRESH | RESUMED | DELEGATED | DEGRADED | POST-CANCEL | LATE |
|-------|-------|---------|-----------|----------|-------------|------|
| context-intelligence | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| delegation-scope | - | ✓ | ✓ | ✓ | ✓ | - |
| workflow-hierarchy | ✓ | ✓ | - | - | - | ✓ |
| context-rot-recovery | - | ✓ | - | ✓ | ✓ | ✓ |

### Evaluation Criteria

| Score | Criteria |
|-------|----------|
| **5** | All 6 entry states covered, handles complex edges |
| **4** | Most entry states, common edges handled |
| **3** | Basic states, some edge handling |
| **2** | Only basic states, no edge handling |
| **1** | Doesn't account for session complexity |

### Checklist

- [ ] Entry state recognition present
- [ ] Degraded state handling
- [ ] Delegation edge cases
- [ ] Post-cancel awareness
- [ ] Late-session drift handling

---

## Overall Score Calculation

### Formula

```
Overall = (Trigger × 0.25) + 
          (Action × 0.25) + 
          (Reference × 0.20) + 
          (Redundancy × 0.15) + 
          (Edge × 0.15)
```

### Example Calculation

```
Trigger:      4 × 0.25 = 1.00
Action:       5 × 0.25 = 1.25
Reference:    4 × 0.20 = 0.80
Redundancy:   5 × 0.15 = 0.75
Edge:         4 × 0.15 = 0.60
─────────────────────────────
Overall:                 4.40 = GOOD
```

### Grade Thresholds

| Overall | Grade | Action |
|---------|-------|--------|
| 4.5+ | EXCELLENT | Ready for release |
| 4.0+ | GOOD | Minor polish |
| 3.0+ | ACCEPTABLE | Address gaps |
| <3.0 | NEEDS WORK | Major revision |

---

## Evaluation Template

```markdown
## Skill-Judge Evaluation: [Skill Name]

**Date:** [YYYY-MM-DD]
**Evaluator:** [Name/Agent]

### Dimension Scores

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Trigger Accuracy | /5 | [Notes] |
| Action Coherence | /5 | [Notes] |
| Reference Integrity | /5 | [Notes] |
| Non-Redundancy | /5 | [Notes] |
| Edge Case Coverage | /5 | [Notes] |

### Weighted Calculation

```
Trigger:      [X] × 0.25 = [X.XX]
Action:       [X] × 0.25 = [X.XX]
Reference:    [X] × 0.20 = [X.XX]
Redundancy:   [X] × 0.15 = [X.XX]
Edge:         [X] × 0.15 = [X.XX]
─────────────────────────────
Overall:                 [X.XX]
```

### Grade: [EXCELLENT/GOOD/ACCEPTABLE/NEEDS WORK]

### Strengths
- [List strengths]

### Weaknesses
- [List weaknesses]

### Recommendations
- [List improvements]
```

---

## Release Criteria

| Criterion | Threshold |
|-----------|-----------|
| Overall Score | ≥3.5 |
| Trigger Accuracy | ≥3.0 |
| Action Coherence | ≥4.0 |
| Reference Integrity | ≥3.0 |
| Non-Redundancy | ≥3.0 |
| Edge Case Coverage | ≥3.0 |

**All thresholds must be met for release.**
