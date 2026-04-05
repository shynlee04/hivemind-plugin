# Iterative Refinement for Skills

## Purpose

Structured methodology for improving skills through measured iteration cycles. Define what to change, change it, measure the result, and decide whether to continue or escalate.

---

## Confidence Thresholds

Map overall Skill-Judge scores (see `05-skill-quality-matrix.md`) to specific actions:

| Score Range | Grade | Action |
|-------------|-------|--------|
| **4.5–5.0** | EXCELLENT | Release. Extract successful patterns to iteration memory. |
| **4.0–4.4** | GOOD | Minor polish only. One targeted fix, then re-score. |
| **3.5–3.9** | ACCEPTABLE | Address specific dimension gaps. Iterate up to 2 cycles. |
| **3.0–3.4** | NEEDS WORK | Full refinement loop required. Iterate up to 3 cycles. |
| **<3.0** | POOR | Major revision or rewrite. Do not iterate — redesign from the gap analysis. |

**Per-dimension threshold:** Any single dimension scoring ≤2 blocks release regardless of overall score.

---

## Iteration Triggers

Start an iteration cycle when any of these conditions occur:

| Trigger | Source | Required Action |
|---------|--------|-----------------|
| Skill-Judge overall <3.5 | Post-creation evaluation | Enter refinement loop |
| Any single dimension ≤2 | Dimension scoring | Target that dimension specifically |
| Audit checklist fail | Pre-deployment checklist (see `05-skill-quality-matrix.md`) | Fix the failing checklist items |
| False-positive trigger report | Agent feedback | Revise description triggers |
| Missing edge case discovered | Runtime failure | Add edge case handling, re-score Dimension 5 |

---

## Refinement Loop

Execute these steps in order. Track progress in iteration memory.

### Step 1: Analyze Failure

Identify exactly which dimension(s) scored below threshold. For each failing dimension, extract the specific criteria that failed.

Record in iteration memory:
```
[ITERATION START] Skill: [name] | Date: [YYYY-MM-DD]
Failing dimensions: [list]
Specific criteria failed: [quote from evaluation]
```

### Step 2: Identify the Gap

Classify the root cause:

| Gap Type | Symptoms | Fix Strategy |
|----------|----------|--------------|
| **Missing trigger** | Dimension 1 ≤2, false negatives | Add specific "Use when..." conditions |
| **Oversized scope** | Dimension 2 ≤2, mission creep | Split skill or move detail to references |
| **Broken references** | Dimension 3 ≤2, missing files | Fix file paths, remove dangling refs |
| **Authority overlap** | Dimension 4 ≤2, duplicates | Narrow scope, add boundary statement |
| **Missing edge case** | Dimension 5 ≤2, uncovered states | Add handling for the uncovered entry state |

### Step 3: Apply the Fix

Make one targeted change per iteration. Do not batch fixes — each iteration addresses one gap type.

Record the change:
```
[ITERATION ACTION] Gap: [type] | Change: [what was modified]
Before: [specific text or score]
After: [specific text or expected improvement]
```

### Step 4: Re-score

Run Skill-Judge evaluation again. Compare per-dimension scores to the previous iteration.

### Step 5: Decide

| Result | Decision |
|--------|----------|
| Overall ≥4.5 and no dimension ≤2 | **Release.** Extract pattern. Close iteration. |
| Improved but still <4.5 | **Continue.** Start next iteration from Step 1. |
| No improvement after 2 cycles | **Escalate.** Pause and request manual review. |
| No improvement after 3 cycles | **Stop.** Redesign the skill from gap analysis. |

---

## Worked Example: Two Iteration Cycles

### Starting Point

Skill: `context-boundary-guard`

Initial Skill-Judge scores:

| Dimension | Score | Notes |
|-----------|-------|-------|
| Trigger Accuracy | 3 | Description says "Use when context issues arise" — too vague |
| Action Coherence | 4 | Single purpose, clear boundaries |
| Reference Integrity | 5 | Clean 1-level structure |
| Non-Redundancy | 5 | No overlap with existing skills |
| Edge Case Coverage | 2 | Only handles FRESH state |
| **Overall** | **3.55** | ACCEPTABLE — two dimensions below threshold |

### Iteration 1

**Analyze:** Dimension 1 (Trigger) = 3, Dimension 5 (Edge) = 2.

**Identify gap:**
- Gap type: Missing trigger (vague description)
- Gap type: Missing edge case (only FRESH covered)

**Fix (one change — triggers first since Dimension 1 has higher weight):**

Changed description from:
```
Use when context issues arise during agent sessions.
```
To:
```
Use when conversation context exceeds 50% of token budget,
when compaction has occurred more than twice in a session,
or when the agent references information from before the last compaction event.
```

**Re-score:**

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Trigger Accuracy | 3 | 5 | +2 |
| Edge Case Coverage | 2 | 2 | 0 |
| **Overall** | **3.55** | **4.15** | +0.60 |

**Decision:** Improved but Edge Case Coverage still ≤2. Continue to Iteration 2.

### Iteration 2

**Analyze:** Dimension 5 (Edge) = 2. Only FRESH state handled.

**Identify gap:** Missing edge case — RESUMED and DEGRADED states not covered.

**Fix:** Added edge case handling section to SKILL.md:

```markdown
## State Handling

### RESUMED Sessions
Re-read the last trust-scored context checkpoint before resuming analysis.
Skip re-scoring segments that were already validated.

### DEGRADED Sessions
If context is partially corrupted, score only the surviving segments.
Flag corrupted segments as UNVERIFIED rather than re-analyzing them.
```

**Re-score:**

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Trigger Accuracy | 5 | 5 | 0 |
| Edge Case Coverage | 2 | 4 | +2 |
| **Overall** | **4.15** | **4.45** | +0.30 |

**Decision:** Overall = 4.45. No dimension ≤2. But still below 4.5 EXCELLENT threshold. One more targeted polish or release as GOOD.

**Result:** Released at GOOD (4.45). Pattern extracted: "Specific trigger conditions with measurable thresholds (token %, compaction count) outperform vague condition descriptions."

---

## Iteration Memory

Track what was tried and what happened. Use this format in the skill's development notes or a companion `.md` file:

```markdown
## Iteration Log: [skill-name]

### Iteration 1 — [YYYY-MM-DD]
- **Trigger:** Skill-Judge overall = 3.55
- **Failing:** Trigger Accuracy (3), Edge Case Coverage (2)
- **Action:** Rewrote description with specific measurable triggers
- **Result:** Overall = 4.15 (+0.60). Edge still failing.
- **Pattern learned:** Measurable thresholds in descriptions score higher than vague conditions.

### Iteration 2 — [YYYY-MM-DD]
- **Trigger:** Edge Case Coverage = 2
- **Failing:** Edge Case Coverage (2) — only FRESH state covered
- **Action:** Added RESUMED and DEGRADED handling sections
- **Result:** Overall = 4.45 (+0.30). All dimensions ≥4.
- **Pattern learned:** Entry state coverage tables reveal gaps faster than narrative descriptions.
- **Outcome:** Released at GOOD (4.45).
```

### Memory Rules

1. Record every iteration — successful or not.
2. Always capture the pattern learned, even from failed iterations.
3. Stop after 3 iterations with no improvement. Escalate instead.
4. Carry extracted patterns forward when authoring new skills.

---

## Context State Integration

Adapt refinement behavior based on session context state:

| Context State | Refinement Action |
|---------------|-------------------|
| **FRESH** | Full refinement loop from Step 1 |
| **RESUMED** | Reconstruct from iteration log. Resume at the last completed step. |
| **DELEGATED** | Delegate refinement to sub-agent. Preserve main session's iteration memory. |
| **DEGRADED** | Stop refinement immediately. Escalate to context recovery. |
| **POST-CANCEL** | Review iteration log. Decide whether to continue or discard partial changes. |
| **LATE** | Preserve existing iteration memory. Do not start new cycles. Wrap up current. |

---

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **Pattern pollution** | Extracting patterns from every minor score change | Only extract patterns when overall ≥4.0 and the pattern generalizes beyond one skill |
| **Iteration addiction** | 5+ iterations on the same skill | Hard limit: 3 iterations, then redesign or accept current score |
| **Gap whack-a-mole** | Fixing one dimension breaks another | Re-score all 5 dimensions after every change, not just the targeted one |
| **Vague memory** | Iteration log says "improved triggers" without specifics | Record exact before/after text and exact score deltas |
| **Premature release** | Releasing at 3.5 with a dimension ≤2 | Enforce: every dimension must be ≥3, not just overall score |

---

## References

- `04-tdd-workflow.md` — TDD methodology for skill development
- `05-skill-quality-matrix.md` — Skill-Judge evaluation framework and pre-deployment audit checklist
- `08-conflict-detection.md` — Detecting authority overlap between skills
