# Problem/Solution/Impact Feature Proposal Format

Structured feature proposal using the triad that forces evidence-based decisions before spec writing begins.

## Decision Gate

**A proposal is ready for spec writing ONLY when all 3 sections contain concrete evidence.** A proposal missing evidence in any section is blocked.

---

## Problem Statement

What is the problem? Who experiences it? What is the impact of NOT solving it?

### Template

```markdown
**Problem:** [One sentence describing the problem]
**Who:** [Who experiences this problem — user persona or system actor]
**Impact of not solving:** [Quantified cost — time, money, user churn, risk]
**Evidence:** [Data, user quotes, error logs, incident reports]
```

### Scoring Rubric

| Score | Criteria |
|-------|----------|
| 0 | No problem identified — "we think this would be cool" |
| 1 | Vague problem — "users don't like it" with no data |
| 2 | Named problem with anecdotal evidence |
| 3 | Named problem with quantified impact and primary evidence |

**Minimum score to proceed: 2**

### Examples

**Good (score 3):**
> **Problem:** Users abandon the export flow when CSV files exceed 5k rows.
> **Who:** Power users (12% of active users) performing bulk data extraction.
> **Impact of not solving:** 340 users/month churn to competitor; estimated $28k MRR loss.
> **Evidence:** Funnel analytics show 68% drop-off at step 3 for files >5k rows. 23 support tickets in Q4 reference "export timeout."

**Bad (score 0):**
> **Problem:** The export feature is bad. We should make it better.

### Anti-Patterns

- **Solution masquerading as problem:** "The problem is we don't have WebSockets" — that's a solution. What's the actual problem?
- **Problem without a persona:** "It's slow" — slow for whom? A 50ms delay on an admin dashboard is different from 50ms on a real-time chat.
- **No impact baseline:** "Users are frustrated" — frustrated enough to churn? Or frustrated enough to complain but keep paying?

---

## Solution Approach

What is the proposed solution? What alternatives were considered? Why this approach?

### Template

```markdown
**Solution:** [One sentence describing the approach]
**Alternatives considered:**
  1. [Alternative A — why rejected]
  2. [Alternative B — why rejected]
**Why this approach:** [Concrete reason tied to problem evidence]
**Assumptions:** [What must be true for this solution to work]
```

### Scoring Rubric

| Score | Criteria |
|-------|----------|
| 0 | No alternatives considered — first idea picked |
| 1 | Alternatives listed but rejection reasons are vague |
| 2 | Alternatives with clear rejection criteria |
| 3 | Alternatives evaluated against problem evidence with quantified tradeoffs |

**Minimum score to proceed: 2**

### Examples

**Good (score 3):**
> **Solution:** Server-side pagination with streaming export for files >1k rows.
> **Alternatives considered:**
>   1. Client-side chunking — rejected: still loads full dataset into memory, fails for >50k rows.
>   2. Background job with email download link — rejected: users need immediate access, 80% of exports are <10k rows.
> **Why this approach:** Directly addresses the 68% drop-off by eliminating the timeout. Streaming handles 95% of real user file sizes without memory spike.
> **Assumptions:** Server has minimum 2GB RAM; export endpoint can sustain 50 concurrent streams.

**Bad (score 0):**
> **Solution:** Use WebSockets to stream the data. Alternatives: REST (too slow), GraphQL (too complex).

### Anti-Patterns

- **False dichotomy:** "We could rebuild everything from scratch, or we could add this one line of code" — if your alternatives are absurd extremes, you're not really evaluating.
- **Rejecting alternatives for wrong reasons:** "We rejected pagination because it's old-fashioned" — is it? Does it solve the problem? Evaluate on merit, not trendiness.
- **Hidden assumptions:** If your solution depends on an API that's in beta, say so. Assumptions that break are risks in disguise.

---

## Expected Impact

What metrics improve? What is the success criteria? What is the measurement method?

### Template

```markdown
**Success metric:** [Primary metric that changes]
**Baseline:** [Current value]
**Target:** [Expected value after solution ships]
**Measurement method:** [How you'll measure — analytics, logs, survey]
**Timeframe:** [When to evaluate — 7 days, 30 days, 90 days post-ship]
```

### Scoring Rubric

| Score | Criteria |
|-------|----------|
| 0 | No metrics defined — "it'll be better" |
| 1 | Metric named but no baseline or target |
| 2 | Metric with baseline and target, but no measurement plan |
| 3 | Metric, baseline, target, measurement method, and evaluation timeframe |

**Minimum score to proceed: 2**

### Examples

**Good (score 3):**
> **Success metric:** Export completion rate for files >5k rows.
> **Baseline:** 32% (current funnel analytics).
> **Target:** 85% completion rate.
> **Measurement method:** Funnel analytics event `export_complete` filtered by `row_count > 5000`.
> **Timeframe:** 30 days post-ship. Alert if <60% at day 14.

**Bad (score 0):**
> **Impact:** Users will be happier. The feature will be faster.

### Anti-Patterns

- **Vanity metrics:** "We'll increase page views" — page views don't pay salaries. Tie metrics to business or user outcomes.
- **No baseline:** "We want to reduce errors" — reduce from what? If you don't know the starting point, you can't measure improvement.
- **Measurement afterthought:** "We'll figure out how to measure it later" — later means never. Define measurement before shipping.
- **Unrealistic targets:** "100% completion rate" — nothing is 100%. Set a realistic target based on comparable flows.

---

## Proposal Readiness Checklist

Before advancing to spec writing, verify:

| Check | Requirement |
|-------|-------------|
| Problem section | Score ≥ 2 with named persona and quantified impact |
| Solution section | Score ≥ 2 with ≥ 2 alternatives and rejection reasons |
| Impact section | Score ≥ 2 with baseline, target, and measurement method |
| Evidence chain | Impact metrics trace back to problem evidence |
| No contradictions | Solution doesn't conflict with problem evidence |

A proposal that fails any check is **blocked** until the gaps are filled with evidence, not promises.
