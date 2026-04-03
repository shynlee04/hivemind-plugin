# Iterative Refinement

## Confidence Thresholds

Map overall Skill-Judge scores to specific actions:

| Score Range | Grade | Action |
|-------------|-------|--------|
| **4.5–5.0** | EXCELLENT | Release. Extract successful patterns. |
| **4.0–4.4** | GOOD | Minor polish only. One targeted fix, then re-score. |
| **3.5–3.9** | ACCEPTABLE | Address specific dimension gaps. Iterate up to 2 cycles. |
| **3.0–3.4** | NEEDS WORK | Full refinement loop required. Iterate up to 3 cycles. |
| **<3.0** | POOR | Major revision or redesign. Do not iterate. |

**Per-dimension threshold:** Any single dimension scoring ≤2 blocks release regardless of overall score.

## Refinement Loop

Execute these steps in order:

### Step 1: Analyze Failure

Identify exactly which dimension(s) scored below threshold. Extract the specific criteria that failed.

### Step 2: Identify the Gap

| Gap Type | Symptoms | Fix Strategy |
|----------|----------|--------------|
| **Missing trigger** | Dimension 1 ≤2, false negatives | Add specific "Use when..." conditions |
| **Oversized scope** | Dimension 2 ≤2, mission creep | Split skill or move detail to references |
| **Broken references** | Dimension 3 ≤2, missing files | Fix file paths, remove dangling refs |
| **Authority overlap** | Dimension 4 ≤2, duplicates | Narrow scope, add boundary statement |
| **Missing edge case** | Dimension 5 ≤2, uncovered states | Add handling for the uncovered entry state |

### Step 3: Apply the Fix

Make **one targeted change** per iteration. Do not batch fixes.

### Step 4: Re-score

Run Skill-Judge evaluation again. Compare per-dimension scores to the previous iteration.

### Step 5: Decide

| Result | Decision |
|--------|----------|
| Overall ≥4.5 and no dimension ≤2 | **Release.** Close iteration. |
| Improved but still <4.5 | **Continue.** Start next iteration. |
| No improvement after 2 cycles | **Escalate.** Request manual review. |
| No improvement after 3 cycles | **Stop.** Redesign from gap analysis. |

## Worked Example: Two Iteration Cycles

### Starting Point

Skill: `pdf-document-processor`

| Dimension | Score | Notes |
|-----------|-------|-------|
| Trigger Accuracy | 2 | Description: "Processes PDF files" — no activation context |
| Action Coherence | 3 | Covers extraction, merging, and form-filling — three purposes |
| Reference Integrity | 4 | Two numbered refs, one link broken |
| Non-Redundancy | 5 | No overlap with existing skills |
| Edge Case Coverage | 2 | No handling for encrypted or scanned PDFs |
| **Overall** | **3.05** | NEEDS WORK — two dimensions at ≤2 |

### Iteration 1

**Analyze:** Dimension 1 (Trigger) = 2, Dimension 5 (Edge) = 2.

**Fix (triggers first — higher weight):**

Changed description from:
```
Processes PDF files.
```
To:
```
Extract text and tables from PDF files, fill PDF forms, and merge multiple PDFs into one document. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction, even if they say "document" without specifying the format.
Triggers: "PDF", "portable document", "form filling", "merge documents".
```

**Re-score:**

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Trigger Accuracy | 2 | 4 | +2 |
| Edge Case Coverage | 2 | 2 | 0 |
| **Overall** | **3.05** | **3.65** | +0.60 |

**Decision:** Improved but Edge Case Coverage still ≤2. Continue.

### Iteration 2

**Analyze:** Dimension 5 (Edge) = 2. No handling for encrypted or scanned PDFs.

**Fix:** Added edge case handling section:

```markdown
## Edge Cases

### Encrypted PDFs
If the PDF is password-protected, ask the user for the password before proceeding. Do not attempt to bypass encryption.

### Scanned PDFs (Image-only)
If the PDF contains only images (no text layer), inform the user that OCR is required. Suggest running an OCR tool first.
```

**Re-score:**

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Trigger Accuracy | 4 | 4 | 0 |
| Edge Case Coverage | 2 | 4 | +2 |
| **Overall** | **3.65** | **4.25** | +0.60 |

**Decision:** Overall = 4.25. No dimension ≤2. Released at GOOD.

**Pattern extracted:** "Specific trigger conditions with measurable thresholds outperform vague condition descriptions."

## Iteration Memory Format

```markdown
## Iteration Log: [skill-name]

### Iteration 1 — [YYYY-MM-DD]
- **Trigger:** Skill-Judge overall = 3.55
- **Failing:** Trigger Accuracy (3), Edge Case Coverage (2)
- **Action:** Rewrote description with specific measurable triggers
- **Result:** Overall = 4.15 (+0.60). Edge still failing.
- **Pattern learned:** Measurable thresholds in descriptions score higher.
```

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|-------------|---------|-----|
| **Iteration addiction** | 5+ iterations on the same skill | Hard limit: 3 iterations, then redesign |
| **Gap whack-a-mole** | Fixing one dimension breaks another | Re-score all 5 dimensions after every change |
| **Vague memory** | Log says "improved triggers" without specifics | Record exact before/after text and score deltas |
| **Premature release** | Releasing at 3.5 with a dimension ≤2 | Enforce: every dimension must be ≥3 |
