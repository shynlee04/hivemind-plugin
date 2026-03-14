---
name: comparative-analysis
description: "Framework for structured comparison: criteria definition, weighted scoring, sensitivity analysis."
---

# Comparative Analysis

Use this skill when comparing 2-5 candidates (technologies, patterns, approaches, tools) to make a structured recommendation.

## Step 1: Criteria Definition

Define 5-8 evaluation criteria relevant to the comparison context:

Common criteria categories:
- **Functionality**: Does it solve the core problem?
- **Developer experience**: Learning curve, documentation quality, tooling
- **Performance**: Speed, resource usage, scalability
- **Maintenance**: Community health, release frequency, backward compatibility
- **Integration**: Compatibility with existing stack, migration effort
- **Cost**: Licensing, infrastructure, operational overhead
- **Risk**: Vendor lock-in, abandonment risk, security track record

For each criterion, assign a weight (must sum to 100%):
- Critical criteria: 20-25% each
- Important criteria: 10-15% each
- Nice-to-have criteria: 5% each

## Step 2: Candidate Investigation

For each candidate:
1. Research using MCP tools (official docs, community resources, benchmarks).
2. Collect evidence for each criterion (code examples, benchmark data, community metrics).
3. Note any criterion where evidence is insufficient (flag as "low confidence").

## Step 3: Scoring Matrix

Rate each candidate 1-5 on each criterion:

| Score | Meaning |
|-------|---------|
| 5 | Excellent — best-in-class for this criterion |
| 4 | Good — strong performance, minor gaps |
| 3 | Adequate — meets requirements without excelling |
| 2 | Weak — significant gaps or concerns |
| 1 | Poor — fails to meet requirements |

Every score must include a 1-sentence evidence justification.

## Step 4: Weighted Total

`Weighted Score = Σ (criterion_score × criterion_weight)`

Present results as a sorted table with scores per criterion and weighted total.

## Step 5: Sensitivity Analysis

Test robustness of the recommendation:
1. Shift each criterion's weight by ±20%.
2. Check if the top candidate changes.
3. If the recommendation flips with small weight changes, flag as "sensitive — recommendation depends on priority assumptions."

## Step 6: Recommendation

Present:
1. **Winner**: Highest weighted score with rationale
2. **Runner-up**: Second-best with "choose this if..." scenario
3. **Tradeoffs**: What you sacrifice by choosing the winner over alternatives
4. **Confidence level**: High (clear winner, robust to sensitivity), Medium (close race), Low (highly sensitive to weights)
