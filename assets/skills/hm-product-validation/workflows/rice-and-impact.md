# Product Validation Workflow

Two flows: RICE for "should we build it?", user-impact audit for "is
it built well?".

## Flow A: RICE Scoring

For new feature candidates.

### Step 1: Reach

How many users per quarter? Cite source (analytics, survey, expert).

### Step 2: Impact

Per affected user. Use scale: 0.25, 0.5, 1.0, 2.0, 3.0.

### Step 3: Confidence

50% / 80% / 100%.

### Step 4: Effort

Person-weeks. Estimate FULL scope, not happy path.

### Step 5: Compute

```bash
bash assets/skills/hm-product-validation/scripts/compute-rice.sh <R_pct> <I> <C_pct> <E>
```

### Decision

| Score | Action |
|---|---|
| > 10 | Build now |
| 3-10 | Build this quarter |
| 1-3 | Build eventually |
| < 1 | Skip |

Fill `templates/rice-card.md` for the feature.

## Flow B: User-Impact Audit

For existing features.

### Step 1: User Journey

What is the user trying to accomplish? What steps? What failure modes?

### Step 2: Pain Points

For each step:
- Time
- Error rate
- Cognitive load
- Friction

### Step 3: Quantify

For each pain point: frequency × severity.

### Step 4: Propose Improvements

Smallest change + expected improvement + cost.

### Step 5: Prioritize

Apply RICE to improvements. Top 1-3.

## Anti-Patterns

| Anti-pattern | Fix |
|---|---|
| RICE without sourcing | Cite evidence |
| "Everyone wants this" | Reach is estimated, not asserted |
| "Transformative" by default | Justify with concrete user value |
| "Low effort" without scope | Estimate FULL scope |
