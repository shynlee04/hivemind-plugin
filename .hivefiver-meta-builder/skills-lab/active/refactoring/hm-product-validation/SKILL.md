---
name: hm-product-validation
description: >
  Product-lens methodology for validating technical decisions against user impact, product vision, and
  business value. Use when the user asks "is this feature valuable", "what's the user impact", "RICE score",
  "product validation", "validate against users", "how do I measure success", "feature prioritization",
  "product lens", "product context", "end user value", "does this solve the right problem",
  "problem vs solution", "stakeholder perspective", "should we build this", "define success metrics",
  "quantify user benefit", "anti-solution-check", or "prioritize features by impact". NOT for initial
  brainstorming (use hm-brainstorm), requirements gap analysis (use hm-requirements-analysis),
  dependency graph design (use hm-feature-ecosystem), or long-term maintainability scoring
  (use hm-roadmap-maintainability).
metadata:
  layer: "3"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Product Validation: Technical Decisions → User Impact

## Overview

Every feature, architecture choice, and implementation decision must trace back to user value. This skill teaches the product-lens methodology: a structured way to step out of the implementation mindset and validate that what gets built actually delivers to real users. It bridges product management perspective with technical implementation across all development stages.

**This skill answers five questions about every technical decision:**

1. **Who benefits?** Which user segment experiences the improvement, and how many are they?
2. **How much?** What is the measurable difference in their experience — speed, accuracy, satisfaction?
3. **Is this the right problem?** Are we solving a real user pain, or implementing a solution looking for a problem?
4. **How do we know?** What falsifiable success metric will confirm delivery after deployment?
5. **What's the cost of being wrong?** What user harm occurs if this feature misses the mark?

## Third-Party Source Synthesis

This skill synthesizes patterns from three inspected third-party sources:

| Source | Adopt/Adapt Decision | Local Transformation |
|---|---|---|
| `skillmd.ai/product-requirements-2` | Adopt the iterative dialogue model and 100-point quality scoring; adapt away from PRD-generation framing. | Use iterative Q&A as the product-lens probe during design and implementation. Score decisions against user-impact criteria rather than generating documents. |
| `skillmd.ai/requirements-clarity` | Adopt the 4-dimension diagnostic model (Functional, User Interaction, Technical, Business) and scoring rubric; adapt away from the requirements-gap-analysis framing. | Apply the 4 dimensions to product decisions — not document gaps, but value gaps. |
| `skillmd.ai/product-management-3` | Adopt the RICE prioritization (Reach, Impact, Confidence, Effort) and launch-plan structure; adapt away from the full-PM-workflow framing. | Use RICE as the scoring lens for technical decisions. Adapt launch-plan as validation-checklist, not project-management artifact. |

## Boundary Rules

| Nearby Skill | Boundary |
|---|---|
| `hm-brainstorm` | SURFACES user needs and produces requirements briefs. This skill VALIDATES that what's built delivers those needs. Input: requirements brief. Output: user-impact score. |
| `hm-requirements-analysis` | DIAGNOSES requirement gaps, contradictions, and vagueness. This skill EVALUATES product impact of each requirement. Input: validated requirements. Output: value-prioritized requirements. |
| `hm-feature-ecosystem` | DESIGNS feature interdependence and cross-dependency graphs. This skill PRIORITIZES features by user value and feeds that prioritization IN. Input: RICE scores. Output: dependency-informed priorities. |
| `hm-cross-cutting-change` | ASSESSES implementation impact of changes. This skill PROVIDES product-priority context so cross-cutting decisions optimize for user value. |
| `hm-roadmap-maintainability` | SCORES long-term health and technical debt. This skill ENSURES the roadmap serves users by validating maintainability trade-offs against user impact. |
| `hm-spec-driven-authoring` | LOCKS specifications into falsifiable requirements. This skill PROVIDES success-metric definitions so specs have measurable user validation criteria. |

**At-a-glance distinction:** Brainstorm finds problems. Requirements-analysis diagnoses gaps. Product-validation tests value. Feature-ecosystem maps dependencies. Roadmap-maintainability scores health. This skill's unique role: "Before we build this, will users actually benefit?"

## Entry Gate

**Proceed when any of these are true:**
- User asks "should we build this", "is this valuable", "what's the ROI"
- A feature design is ready for product-lens review before implementation begins
- Prioritization is needed across multiple features or requirements
- Success metrics need to be defined before development starts
- User describes a solution ("build a dashboard") without articulating the problem
- A coordinator skill (`hm-coordinating-loop`) routes to this skill during planning phase

**Do NOT proceed when:**
- No requirements or feature ideas exist yet → route to `hm-brainstorm`
- Requirements exist but need gap diagnosis → route to `hm-requirements-analysis`
- Features are already prioritized and need dependency mapping → route to `hm-feature-ecosystem`
- The question is purely about long-term code health → route to `hm-roadmap-maintainability`
- The user explicitly says "just build it, I know what my users want" → accept and move to implementation with a note

## Main Workflow: 4-Phase Product Lens

Follow phases in order. Complete each before proceeding to the next.

### Phase 1: Problem Articulation

**Objective:** Establish WHAT user pain exists and WHO experiences it — before discussing any solution.

#### 1.1 Extract the Problem From the Solution Description

When users describe solutions ("build a dashboard with 6 widgets"), apply the anti-solution-check from `references/problem-vs-solution.md`:

1. Rephrase the requested feature as: "The user described building [X]. What problem does [X] solve?"
2. Ask: "Who has this problem? How many of them? How severe is it today?"
3. Ask: "What do users do today to work around this problem? What's the cost of that workaround?"
4. Classify: **Validated problem** (evidence of real pain) vs. **Unvalidated problem** (assumption without evidence)

If the problem is unvalidated, recommend user research before proceeding. Do not continue to scoring.

#### 1.2 Identify Target User Segments

For each feature or decision under review:

| Dimension | Questions to Answer |
|---|---|
| **Segment** | Which user group experiences this? (All users, new users, power users, admins?) |
| **Size** | How many users in this segment? (Absolute count or % of user base) |
| **Context** | What are they doing when this problem arises? |
| **Today's pain** | What's their current workaround? Time cost? Error rate? Frustration level? |

Record results. Each feature must have at least one identified user segment.

#### 1.3 Pause for Confirmation

Restate the problem in user terms:

```markdown
**User Problem Summary:**
- **Segment:** [who]
- **Problem:** [what pain they experience]
- **Scope:** [how many users, how often]
- **Current cost:** [workaround effort, error rate, abandonment rate]

Before we evaluate solutions — does this accurately describe the real user situation?
```

Wait for confirmation. If the user cannot confirm the problem description, stop and recommend user research.

### Phase 2: Impact Quantification

**Objective:** Score the feature's potential user impact using RICE methodology (Reach × Impact × Confidence / Effort). Reference: `references/user-impact-scoring.md`.

#### 2.1 Score Each Dimension

For each feature or decision:

| RICE Dimension | Definition | Scale |
|---|---|---|
| **Reach** | How many users experience the benefit? | 1 (fraction) – 10 (all users) |
| **Impact** | How much does the user experience improve? | 0.25 (minimal) – 3.0 (massive) |
| **Confidence** | How sure are we about the Reach and Impact estimates? | 0.2 (guess) – 1.0 (measured data) |
| **Effort** | How much work to deliver? (Inverted: higher effort = lower score) | Person-weeks (1–12+), then convert to 1/E |

**Scoring ground rules:**
- Reach: Use actual user counts when available. 10 if every user benefits, 1 if only edge cases.
- Impact: 3 = transforms daily workflow. 2 = significant improvement. 1 = noticeable. 0.5 = minor. 0.25 = barely perceptible.
- Confidence: 1.0 = backed by analytics data. 0.8 = strong qualitative evidence. 0.5 = informed estimate. 0.2 = pure guess.
- Effort: Estimate in person-weeks. Convert to score as `max(0.25, 10 / effort_weeks)`. A 4-week feature scores 2.5; a 12-week feature scores 0.83.

**Compute RICE score:** `RICE = (Reach × Impact × Confidence) / Effort_weeks`

Alternatively, use ICE (Impact × Confidence × Ease) for rapid triage when precise effort estimates are unavailable.

#### 2.2 Create a Value-Effort Matrix

Plot features on a 2×2 grid:

```
High Value ────────────
│                      │
│   INVEST             │   SHIP NOW
│   (High value,       │   (High value,
│    high effort)      │    low effort)
│                      │
│   KILL               │   LOW-HANGING
│   (Low value,        │   (Low value,
│    high effort)      │    low effort)
│                      │
└──────────────────────
     Effort →
```

For each feature, classify its quadrant and recommend: **Ship now**, **Invest** (worth the effort), **Low-hanging** (do if spare capacity), **Kill** (don't build).

#### 2.3 Prioritize by RICE Score

Rank features by RICE score. Present a sorted table:

```markdown
| Rank | Feature | Reach | Impact | Confidence | Effort (wks) | RICE | Quadrant |
|------|---------|-------|--------|------------|--------------|------|----------|
| 1 | [Name] | 8 | 2.0 | 0.8 | 3 | 4.3 | Ship Now |
| 2 | [Name] | 6 | 1.5 | 0.6 | 5 | 1.1 | Invest |
| 3 | [Name] | 3 | 0.5 | 0.4 | 10 | 0.06 | Kill |
```

### Phase 3: Success Metric Definition

**Objective:** Define falsifiable success metrics BEFORE implementation begins. Reference: `references/success-metrics.md`.

#### 3.1 Define Metrics for Each Feature

For every feature with a RICE score ≥ threshold (default: 1.0), define:

| Metric Component | Example |
|---|---|
| **What to measure** | Time to complete checkout |
| **Baseline (current)** | 4.2 minutes (from analytics, last 30 days) |
| **Target (post-launch)** | <2.0 minutes |
| **Measurement window** | 30 days post-launch |
| **Minimum detectable effect** | 30% improvement (smaller would be noise) |
| **How to measure** | Analytics event `checkout_complete` — duration from cart page load to confirmation |
| **Counter-metric** | Cart abandonment rate (must not increase) |

#### 3.2 Validate Metrics Are Falsifiable

Run this test on every metric:

- [ ] Can the metric be measured with existing instrumentation?
- [ ] Is the baseline known? If not, flag: **Metric requires pre-launch instrumentation.**
- [ ] Is the target specific and numeric? "Better" or "faster" fail this check.
- [ ] Is there a counter-metric to detect unintended harm?
- [ ] Can the metric be measured within the defined window?
- [ ] Is the minimum detectable effect realistic given sample size?

If any metric fails falsification, flag it and define a replacement before proceeding to Phase 4.

#### 3.3 Define Product Success Gates

Create a validation gate for post-launch:

```markdown
## Product Validation Gate — [Feature Name]
- **Launch criteria:** All metrics instrumented and baselines captured.
- **1-week check:** Early signal detection. Pause and investigate if counter-metric degrades.
- **30-day check:** Full measurement window complete.
  - If target met → SUCCESS. Feature is validated.
  - If target not met but trending positively → EXTEND. Monitor for 15 more days.
  - If flat or negative → ROLLBACK or ITERATE. Feature did not deliver value.
```

### Phase 4: Stakeholder Communication

**Objective:** Translate technical decisions into product/business language for stakeholders. Reference: `references/stakeholder-communication.md`.

#### 4.1 Frame Technical Trade-Offs as Product Decisions

Every technical trade-off has a product consequence. Translate:

| Technical Trade-Off | Product Framing |
|---|---|
| "We chose a queue-based async architecture" | "Users will see confirmation within 5 seconds instead of blocking for 30 seconds." |
| "We deferred edge case handling for X" | "0.5% of users will see a fallback message instead of an error. We chose speed-to-market over 100% coverage." |
| "We used a simpler data model" | "Query performance improved by 40% but the admin dashboard only shows last 30 days." |
| "We chose framework A over B" | "Initial load is 200ms faster. Trade-off: fewer community plugins available for future." |

#### 4.2 Produce a Decision Brief

For major architectural decisions, produce a structured brief:

1. **Decision:** What was chosen (1 sentence)
2. **User impact:** What users experience differently (2-3 sentences)
3. **Alternatives considered:** What else was evaluated and why rejected (bullet list)
4. **Risk to users:** What could go wrong and how it's mitigated (2-3 sentences)
5. **Success measurement:** How we'll know it was right (1 sentence + metric)

#### 4.3 Cross-Stage Application Check

Apply the product lens at each development stage:

| Stage | Product-Lens Question |
|---|---|
| **Design** | "Does this design solve the validated user problem? What's the simplest version?" |
| **Implementation** | "Is this implementation complexity justified by user impact? Are there shortcuts that don't hurt users?" |
| **Code review** | "Does this change maintain or improve the user experience? Any regression risk?" |
| **Deployment** | "What's the rollback plan if the success metric degrades? Who monitors the counter-metric?" |
| **Post-launch** | "Did we hit the metric? If not, is the problem the implementation or the problem statement?" |

## Decision Tree

```
Is there a validated user problem statement?
  YES → Are there multiple features/requirements to prioritize?
    YES → Apply RICE scoring (Phase 2) → Rank → Proceed
    NO → Apply anti-solution-check (Phase 1) → Define success metrics (Phase 3) → Proceed
  NO → Can we articulate the user problem in one sentence?
    YES → Write it down → Validate with user → Proceed
    NO → Route to hm-brainstorm for user needs discovery

Is a success metric defined for this decision?
  YES → Is it falsifiable (numeric target, known baseline)?
    YES → Proceed to stakeholder communication (Phase 4)
    NO → Define falsifiable metric (Phase 3) → Re-check
  NO → Define falsifiable metric (Phase 3) → Re-check
```

## Routing Table

| Situation | Skill to Load |
|---|---|
| No user problem articulated yet | `hm-brainstorm` |
| Requirements exist but need gap diagnosis | `hm-requirements-analysis` |
| Features are prioritized, need dependency mapping | `hm-feature-ecosystem` |
| Long-term code health vs. feature velocity trade-off | `hm-roadmap-maintainability` |
| Feature is validated, ready for spec-locking | `hm-spec-driven-authoring` |
| Cross-cutting implementation impact assessment | `hm-cross-cutting-change` |
| New technology, no benchmarks for effort estimation | `hm-deep-research` |

## Gate System

| Gate | When | Criteria | Exit |
|---|---|---|---|
| **G1: Problem** | Before any scoring | Validated user problem statement exists with identified segment | Block: route to hm-brainstorm |
| **G2: RICE** | After impact quantification | Every feature has Reach, Impact, Confidence, Effort scored | Fix missing scores |
| **G3: Metrics** | Before any implementation | Every feature ≥ threshold has falsifiable success metric + counter-metric | Block implementation until defined |
| **G4: Stakeholder** | Before major decisions ship | Decision brief produced for architectural choices affecting user experience | Fix missing briefs |
| **G5: Launch** | Before deployment | Success gate defined with 1-week and 30-day check criteria | Block deployment until gate defined |

## Validation Checklist

Before routing to the next skill or proceeding to implementation:

- [ ] Every feature has a validated user problem statement (Phase 1)
- [ ] RICE scores are computed and features are ranked (Phase 2)
- [ ] Every feature ≥ threshold 1.0 has falsifiable success metrics (Phase 3)
- [ ] Counter-metrics are defined to detect unintended harm (Phase 3)
- [ ] "Kill" quadrant features are explicitly recommended for removal
- [ ] Major architectural decisions have a stakeholder decision brief (Phase 4)
- [ ] Launch validation gate is defined with time-boxed checkpoints (Phase 3.3)

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|---|---|---|
| **Solution-first thinking** — proposing "build X" without articulating the problem | Feature description starts with implementation detail, not user pain | Run anti-solution-check. Ask: "What problem does X solve? Who has it?" |
| **Missing user segment** — scoring impact without identifying who benefits | RICE score computed but no segment defined | Go back to Phase 1.2. "Who are these users? How many?" |
| **Vague success metrics** — "users will be happier" or "better performance" | Metric cannot be measured or has no numeric target | Replace with falsifiable metric. "Better" → "P95 latency <200ms." "Happier" → "NPS score increase by ≥5 points." |
| **Confidence inflation** — scoring Reach/Impact at 0.8 without evidence | Confidence ≥ 0.8 but no analytics data or user research cited | Drop confidence to 0.5 (informed estimate) or 0.2 (guess). Require evidence for ≥ 0.8. |
| **Ignoring counter-metrics** — measuring only positive outcomes, not harm | Success metric defined but no counter-metric | Add counter-metric. Every change can cause regression. What would indicate the feature made things worse? |
| **Skipping product lens post-design** — applying validation only at ideation, skipping implementation review | Product validation discussed once then never revisited | Apply cross-stage checks (Phase 4.3): design, implementation, review, deployment, post-launch. |
| **Effort-as-afterthought** — RICE computed but effort estimated in seconds without engineering input | Effort score used without team validation | Flag: "Effort estimate needs engineering validation. Current score assumes [X weeks]. Confirm with team." |
| **Stakeholder-bypass** — making product-impact decisions without translating to business language | Technical decision documented with implementation-only justification | Produce stakeholder decision brief (Phase 4.2). Technical trade-offs have product consequences. Communicate them. |

## Files

| Resource | Purpose |
|---|---|
| `references/user-impact-scoring.md` | Full RICE and ICE methodology with scoring scales, examples, and anti-inflation checks. |
| `references/success-metrics.md` | Falsifiable metric definition, counter-metric patterns, baseline measurement, measurement-window selection. |
| `references/problem-vs-solution.md` | Anti-solution-check procedure, Five Whys adaptation for product decisions, user-problem articulation templates. |
| `references/stakeholder-communication.md` | Technical-to-product translation tables, decision-brief template, cross-stage application checklist, stakeholder-decision frameworks. |
