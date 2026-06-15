# Skill Quality Matrix

## 5-Dimension Scoring Rubric

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| **Trigger Accuracy** | 25% | Description triggers on specific conditions, false positives minimized |
| **Action Coherence** | 25% | ONE thing well, clear entry/exit, no mission creep |
| **Reference Integrity** | 20% | 1-level depth, numbered files, no circular refs |
| **Non-Redundancy** | 15% | No overlap with existing skills, distinct purpose |
| **Edge Case Coverage** | 15% | Handles degraded, delegated, resumed, post-cancel states |

## Scoring Scale

| Score | Rating | Definition |
|-------|--------|------------|
| **5** | Excellent | Consistently exceeds expectations |
| **4** | Good | Meets expectations with minor gaps |
| **3** | Acceptable | Meets minimum requirements |
| **2** | Needs Work | Significant gaps |
| **1** | Poor | Fails minimum requirements |

## Dimension Criteria

### Trigger Accuracy (25%)

| Score | Criteria |
|-------|----------|
| **5** | Triggers ONLY on specific conditions, zero false positives |
| **4** | Specific triggers, minimal false positives |
| **3** | Captures most triggering conditions |
| **2** | Vague or triggers too broadly |
| **1** | Generic or non-triggering |

**Checklist:**
- [ ] Description starts with "Use when..."
- [ ] Specific triggering conditions listed
- [ ] No generic trigger words
- [ ] Clear cause-effect stated

### Action Coherence (25%)

| Score | Criteria |
|-------|----------|
| **5** | Single purpose, clear entry/exit, zero mission creep |
| **4** | Single purpose, minor optional extensions |
| **3** | Clear primary purpose, some optional scope |
| **2** | Multiple purposes, unclear boundaries |
| **1** | Does everything, completely unfocused |

**Checklist:**
- [ ] Single clear purpose stated
- [ ] Entry state defined
- [ ] Exit state defined
- [ ] No mission creep in body
- [ ] Boundaries explicitly marked

### Reference Integrity (20%)

| Score | Criteria |
|-------|----------|
| **5** | Perfect 1-level depth, logical ordering, clear TOC |
| **4** | 1-level depth, minor ordering issues |
| **3** | Some refs could be consolidated |
| **2** | 2-level depth or circular refs |
| **1** | Chaotic reference structure |

**Checklist:**
- [ ] Reference depth = 1 level max
- [ ] Files numbered for ordering
- [ ] All markdown links resolve
- [ ] No circular references

### Non-Redundancy (15%)

| Score | Criteria |
|-------|----------|
| **5** | Unique purpose, no overlap |
| **4** | Minimal overlap, clear boundaries |
| **3** | Some overlap, but distinct enough |
| **2** | Significant overlap |
| **1** | Duplicate of existing skill |

**Checklist:**
- [ ] No duplicate of existing skill
- [ ] Distinct purpose from similar skills
- [ ] Can explain difference in one sentence

### Edge Case Coverage (15%)

| Score | Criteria |
|-------|----------|
| **5** | All 6 entry states covered, handles complex edges |
| **4** | Most entry states, common edges handled |
| **3** | Basic states, some edge handling |
| **2** | Only basic states, no edge handling |
| **1** | Doesn't account for session complexity |

**Checklist:**
- [ ] Entry state recognition present
- [ ] Degraded state handling
- [ ] Delegation edge cases
- [ ] Post-cancel awareness

## Overall Score Calculation

```
Overall = (Trigger × 0.25) + (Action × 0.25) + (Reference × 0.20) + (Redundancy × 0.15) + (Edge × 0.15)
```

### Worked Example

Skill: `context-boundary-guard`

| Dimension | Score | Weight | Weighted | Evidence |
|-----------|-------|--------|----------|----------|
| Trigger Accuracy | 4 | 0.25 | 1.00 | Description has specific conditions, minor false positives on "context" keyword |
| Action Coherence | 5 | 0.25 | 1.25 | Single purpose (boundary detection), clear entry/exit |
| Reference Integrity | 4 | 0.20 | 0.80 | 1-level depth, 3 numbered refs, one minor ordering issue |
| Non-Redundancy | 5 | 0.15 | 0.75 | No overlap with existing skills |
| Edge Case Coverage | 4 | 0.15 | 0.60 | Covers FRESH, RESUMED, DEGRADED; missing POST-CANCEL |
| **Overall** | | | **4.40** | **GOOD** |

**Grade:** GOOD (4.40) — Minor polish needed. Add POST-CANCEL handling to reach EXCELLENT.

## Release Thresholds

| Grade | Score | Action |
|-------|-------|--------|
| EXCELLENT | 4.5+ | Ship it |
| GOOD | 4.0+ | Minor polish |
| ACCEPTABLE | 3.5+ | Address specific gaps |
| NEEDS WORK | <3.5 | Do not release |

**Block rule:** Any single dimension scoring ≤2 blocks release regardless of overall score.

## Evaluation Template

```markdown
## Skill-Judge Evaluation: [Skill Name]

**Date:** [YYYY-MM-DD]

### Dimension Scores

| Dimension | Score | Evidence |
|-----------|-------|----------|
| Trigger Accuracy | /5 | [Notes] |
| Action Coherence | /5 | [Notes] |
| Reference Integrity | /5 | [Notes] |
| Non-Redundancy | /5 | [Notes] |
| Edge Case Coverage | /5 | [Notes] |

### Weighted Calculation

Trigger:      [X] × 0.25 = [X.XX]
Action:       [X] × 0.25 = [X.XX]
Reference:    [X] × 0.20 = [X.XX]
Redundancy:   [X] × 0.15 = [X.XX]
Edge:         [X] × 0.15 = [X.XX]
Overall:                 [X.XX]

### Grade: [EXCELLENT/GOOD/ACCEPTABLE/NEEDS WORK]
```
