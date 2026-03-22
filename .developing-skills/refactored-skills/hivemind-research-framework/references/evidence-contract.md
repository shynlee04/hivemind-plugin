# Evidence Contract

Defines the grading system, confidence scoring rules, and evidence quality standards for all research conducted under hivemind-research-framework.

## 4-Dimension Grading

Every piece of evidence receives grades on 4 independent dimensions:

### Dimension 1: Source Authority

| Grade | Criteria | Examples |
|---|---|---|
| **H** (High) | Official source, maintained by authors/maintainers | Official docs, GitHub repo (active), RFC/spec |
| **M** | Authoritative but not primary | Blog post by core contributor, conference talk |
| **L** | Unverified, community-sourced, anonymous | Stack Overflow answer, random blog, forum post |

### Dimension 2: Recency

| Grade | Criteria | Risk |
|---|---|---|
| **H** | Published/updated within 6 months | Low risk of staleness |
| **M** | Published 6-18 months ago | Moderate risk — API may have changed |
| **L** | Published >18 months ago | High risk — likely outdated, must flag |

### Dimension 3: Corroboration

| Grade | Criteria | Strength |
|---|---|---|
| **H** | 2+ independent sources agree on the same finding | Strong — cross-validated |
| **M** | Single reliable source, no contradictions | Moderate — plausible but unverified |
| **L** | Contradicted by another source | Weak — conflict must be resolved |

### Dimension 4: Relevance

| Grade | Criteria | Utility |
|---|---|---|
| **H** | Directly answers the sub-question | Maximum — can use as-is |
| **M** | Answers a related question, provides context | Useful — needs interpretation |
| **L** | Tangential, only loosely related | Minimal — only supporting role |

## Confidence Determination Rules

### Matrix

| Authority | Recency | Corroboration | Relevance | Confidence |
|---|---|---|---|---|
| H | H | H | H | **full** |
| H | H | H | M | **full** |
| H | H | M | H | **full** |
| M | H | H | H | **full** |
| H | M | M | H | **partial** |
| M | M | H | H | **partial** |
| H | H | L | H | **partial** |
| Any | Any | L | Any | **partial** (contradiction flag) |
| L | Any | Any | Any | **low** |
| Any | L | Any | Any | **low** |
| Any | Any | Any | L | **low** (if all findings are tangential) |
| L | L | L | L | **low** |

### Simplified Rule

```
IF any dimension is L → confidence = low
ELSE IF 2+ dimensions are M → confidence = partial
ELSE → confidence = full
```

### Script-Based Scoring

For deterministic scoring, use `scripts/score-confidence.sh`:

```bash
./scripts/score-confidence.sh <corroborated_count> <critical_gap_count> <unresolved_contradictions>
# Output: full | partial | low
```

Rules:
- `full`: corroborated >= 4, gaps == 0, contradictions == 0
- `partial`: corroborated >= 2, gaps <= 1, contradictions <= 1
- `low`: everything else

## Evidence Quality Standards

### Minimum Requirements

Every finding must have:
- At least 1 source graded on all 4 dimensions
- Explicit confidence level
- Citation with provider and URL/identifier
- Date of evidence collection

### Strong Evidence (full confidence)

- 2+ independent sources from different providers
- All dimensions H
- No contradictions with other evidence
- Directly answers the sub-question

### Acceptable Evidence (partial confidence)

- 1 reliable source OR strong inference from indirect evidence
- No L dimensions
- Minor gaps documented
- Caveats clearly stated

### Insufficient Evidence (low confidence)

- Single unreliable source
- Any L dimension
- Contradictions unresolved
- Critical gaps in coverage

### When Evidence Is Insufficient

1. **Document the gap** explicitly
2. **Try alternative providers** — switch from Context7 to Tavily, or from Repomix to Grep
3. **Reformulate the question** — sometimes a different phrasing gets better results
4. **After 3 attempts**: emit low-confidence finding with gap description

## Evidence Table Format

Use `templates/evidence-table.md` for structured tracking.

```markdown
| Claim ID | Claim | Domain | Provider | Source URL | Grading (A/R/C/R) | Confidence | Notes |
|---|---|---|---|---|---|---|---|
| E-001 | [finding] | [domain] | [provider] | [url] | H/H/H/H | full | |
```

### Grading Column Format

`A/R/C/R` = Authority / Recency / Corroboration / Relevance

Each is H, M, or L.

Example: `H/M/H/H` = High authority, Medium recency, High corroboration, High relevance

## Cross-Package Integration

This evidence contract is referenced by:
- **hivemind-research-framework SKILL.md** — uses grading for all findings
- **hivemind-research-tools SKILL.md** — tool results feed into grading system
- **hivemind-research SKILL.md** — router ensures grading is applied

The contract is bidirectional:
- Framework defines HOW to grade
- Tools supply WHAT to grade
