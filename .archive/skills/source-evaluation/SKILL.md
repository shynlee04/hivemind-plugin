---
name: source-evaluation
description: "Rubric for assessing source reliability, recency, authority, and bias in research contexts."
---

# Source Evaluation

Use this skill when evaluating the quality and trustworthiness of research sources before incorporating their claims into findings.

## Evaluation Rubric

### Reliability (1-5)

| Score | Criteria |
|-------|----------|
| 5 | Official documentation, peer-reviewed, maintained by project authors |
| 4 | Well-maintained community resource, established technical blog, conference talk |
| 3 | Individual blog post with code examples, Stack Overflow accepted answer |
| 2 | Forum discussion, unverified tutorial, outdated documentation |
| 1 | AI-generated content without verification, anonymous source, broken links |

### Recency (1-5)

| Score | Age | Action |
|-------|-----|--------|
| 5 | < 3 months | Use directly |
| 4 | 3-6 months | Use with minor version check |
| 3 | 6-12 months | Verify against current docs |
| 2 | 12-24 months | Cross-reference with recent source |
| 1 | > 24 months | Flag as stale, seek replacement |

### Authority (1-5)

| Score | Source Type |
|-------|-----------|
| 5 | Project maintainer, core team member, official RFC |
| 4 | Recognized expert in the domain, major contributor |
| 3 | Experienced practitioner with demonstrated expertise |
| 2 | General developer sharing experience |
| 1 | Unknown author, no verifiable credentials |

### Bias Risk (low/medium/high)

- **Low**: Technical documentation, specifications, test results
- **Medium**: Blog posts (may promote specific approach), vendor docs (may oversell)
- **High**: Marketing material, comparison articles by competitors, sponsored content

## Composite Score

`Composite = (Reliability × 0.4) + (Recency × 0.3) + (Authority × 0.3)`

- **≥ 4.0**: Primary source — cite with high confidence
- **3.0–3.9**: Supporting source — use to corroborate primary sources
- **< 3.0**: Weak source — use only when no better alternative exists, always flag

## Application

When building a source inventory:
1. Score each source on all 4 dimensions.
2. Compute composite score.
3. Sort sources by composite score.
4. Use top sources for primary claims, lower sources for supplementary context.
5. Discard sources with composite < 2.0 unless they're the only source for a critical claim (flag explicitly).
