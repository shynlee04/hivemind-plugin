---
name: hm-product-validation
description: >
  Product-lens validation of features. Use when the user wants to validate
  whether a feature is worth building, score it against RICE, decide
  priority, or get a stakeholder's perspective. Triggers on verbs like
  "validate", "worth it", "RICE", "product lens", "user impact", "should we
  build this", "stakeholder". Pattern 1 Mindset — high freedom, judgment
  over procedure. Tech-agnostic + stack-agnostic. NOT for spec authoring
  (load `hm-spec-authoring`), NOT for refactor (load `hm-arch-refactor`).
metadata:
  consumed-by:
    - "hm-product-validator"
    - "hm-planner"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "specialist"
  pattern: "P1-Mindset"
  realm: "spec,arch,clean-code"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# Product Validation

Product-lens methodology for deciding what's worth building. Uses RICE
scoring, user-impact analysis, and stakeholder mapping.

## When This Skill Loads — Do This First

1. **Identify the candidate.** What feature / change is being validated?
2. **Identify the user.** Who benefits? How many? How often?
3. **Identify the goal.** Is this "should we build it?" or "is it built
   well?" Different flows below.

## Flow A: Should We Build It? (RICE)

RICE = Reach × Impact × Confidence / Effort

### Step 1: Reach (per time period)

How many users does this affect, per time period (e.g., per quarter)?

- **Marginal**: <5% of users
- **Low**: 5-25%
- **Medium**: 25-50%
- **High**: 50-75%
- **Massive**: >75%

Cite the source of the reach estimate (analytics, survey, expert
judgment).

### Step 2: Impact (per user)

How much does this move the needle for the AFFECTED user?

- **Minimal**: 0.25 (tiny improvement, barely noticeable)
- **Low**: 0.5 (small improvement)
- **Medium**: 1.0 (meaningful improvement)
- **High**: 2.0 (significant improvement)
- **Massive**: 3.0 (transformative)

Negative impacts count but flip the sign.

### Step 3: Confidence

How confident are you in the Reach and Impact estimates?

- **Low**: 50% (gut feel, no data)
- **Medium**: 80% (some data or strong reasoning)
- **High**: 100% (validated data, prior art, customer interviews)

### Step 4: Effort

How many person-weeks of engineering work? (Rough order of magnitude.)

### Step 5: RICE score

```
RICE = (Reach × Impact × Confidence) / Effort
```

Higher is better. Compare scores across candidate features to prioritize.

### Step 6: Decide

| RICE range | Action |
|---|---|
| > 10 | Build now |
| 3-10 | Build this quarter |
| 1-3 | Build eventually |
| < 1 | Skip or deprecate |

## Flow B: Is It Built Well? (User-Impact Audit)

For an existing feature, audit against user impact.

### Step 1: Define the user journey

What is the user trying to accomplish? What steps do they take?
What are the failure modes?

### Step 2: Identify pain points

For each step:
- Time to complete
- Error rate
- Cognitive load (decisions required)
- Friction (mandatory fields, confusing UI)

### Step 3: Quantify

For each pain point:
- Frequency (how often does the user hit this?)
- Severity (how bad is the impact?)

### Step 4: Propose improvements

For each pain point, propose:
- The smallest change that addresses it
- The expected improvement
- The cost

### Step 5: Prioritize improvements

Apply RICE to the improvements. Pick the top 1-3.

## Anti-Patterns

| Anti-pattern | Why it fails | Fix |
|---|---|---|
| RICE score without sourcing | It's just a number, not evidence | Cite analytics / survey / expert judgment |
| "Everyone wants this" | Reach = 100% with no data | Reach must be estimated, not asserted |
| "It'll be transformative" | Impact = 3.0 by default | Justify with concrete user value |
| "Low effort" without scope | Effort is the denominator; getting it wrong biases the score | Estimate the FULL scope, not the happy path |
| Skipping confidence | "100% confident" hides the unknowns | Default to 80% unless data supports 100% |

## Cross-References

| Skill | Boundary |
|---|---|
| `hm-spec-authoring` | After validating, route here to write the spec |
| `hm-arch-refactor` | For structural changes uncovered by user-impact audit |
| `hm-ship-readiness` | For shipping validated features |

## Additional Resources

### Reference Files
- **`references/rice-examples.md`** — 10 worked examples across product types
- **`references/user-journey-canvas.md`** — template for Flow B step 1

### Templates
- **`templates/rice-card.md`** — one-card-per-feature RICE scoring
- **`templates/user-impact-report.md`** — Flow B output

### Evaluation
- **`evals/evals.json`** — 5 RICE + user-impact cases
- **`metrics/gate-scorecard.md`** — gate-evidence-truth scorecard
