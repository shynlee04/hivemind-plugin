# Claims-Evidence Framework

Use this reference when turning investigation findings into auditable synthesis output.

## Purpose

- Express every major conclusion as a claim that can be verified later.
- Bind each claim to evidence quotes, source metadata, and confidence.
- Preserve contradiction and uncertainty instead of hiding it in prose.
- Stay compatible with `use-hivemind-research/references/evidence-contract.md`.

## Alignment with the Research Evidence Contract

The synthesis layer extends the research contract instead of inventing a parallel format.

| Research Contract Field | Synthesis Field | Rule |
|---|---|---|
| `claims[].id` | `claims[].id` | Keep stable claim IDs such as `C-01` |
| `claims[].text` | `claims[].claim_text` | Mirror the same verifiable statement |
| `claims[].confidence` | `claims[].confidence` | Use `HIGH`, `MEDIUM`, or `LOW` |
| `evidence[].evidence_quote` | `claims[].evidence[].quote` | Preserve the direct quote or faithful factual summary |
| `evidence[].source_url` | `claims[].evidence[].source_url` | Preserve the canonical URL or repo locator |
| `evidence[].source_title` | `claims[].evidence[].source_title` | Preserve the human-readable title |
| `evidence[].credibility_score` | `claims[].evidence[].credibility_score` | Keep 0-100 score intact |
| `evidence[].grade` | `claims[].evidence[].grade` | Keep optional evidence-grade metadata when available |

**Compatibility rule:** `claim_text` must be losslessly convertible back to `text`, and each evidence object must be convertible back to the research contract's `evidence[]` entry.

## Claims-Evidence Table Schema

Use the human-readable table when writing reports and the JSON template when storing structured output.

| Column | Required | Description |
|---|---|---|
| Claim ID | Yes | Stable identifier such as `C-01` |
| Claim Text | Yes | Singular, falsifiable statement |
| Evidence Quote | Yes | Exact excerpt or tightly bounded factual summary |
| Source URL | Yes | Canonical URL, repo path, DOI link, or code locator |
| Source Title | Yes | Human-readable source name |
| Credibility Score | Yes | 0-100 composite score |
| Evidence Grade | Recommended | `HIGH`, `MEDIUM`, `LOW` for source quality |
| Claim Confidence | Yes | Claim-level verdict: `HIGH`, `MEDIUM`, `LOW` |
| Counterevidence | Recommended | Contradiction or limitation tied to the claim |
| Verdict | Yes | `supported`, `mixed`, `tentative`, or `rejected` |

## Claim Construction Rules

1. Keep each claim singular. Split compound claims before scoring confidence.
2. Use one stable claim ID across all report sections, JSON, and appendices.
3. Require at least one direct evidence item per claim.
4. Require three or more sources for every core claim that drives a recommendation.
5. Downgrade confidence when the supporting quote does not directly prove the claim.
6. Preserve contradictory material in the counterevidence register rather than deleting it.

## Evidence Object Contract

Every claim should carry one or more evidence objects.

```json
{
  "quote": "Exact excerpt or precise factual summary",
  "source_url": "https://example.com",
  "source_title": "Example Source",
  "credibility_score": 86,
  "confidence": "MEDIUM",
  "grade": "HIGH",
  "credibility_breakdown": {
    "domain_authority": 90,
    "recency": 80,
    "expertise": 85,
    "bias": 88
  }
}
```

### Evidence Rules

- Prefer quotes over summaries when the wording matters.
- Use summaries only when the source is structured data, code, or a table.
- Include a credibility breakdown when the source meaning is likely to be challenged later.
- Use LOW-grade evidence only as caveat, edge case, or gap signal.

## Per-Claim Confidence Assignment

Confidence applies to the claim, not the source.

| Confidence | Minimum Standard | Common Failure Mode |
|---|---|---|
| HIGH | At least one strong source plus corroboration from another independent source or code truth | Overstating certainty from one official source without corroboration |
| MEDIUM | One strong or acceptable source with partial corroboration and explicit caveats | Ignoring unresolved disagreement |
| LOW | Weak evidence, unresolved contradiction, or inference-heavy reasoning | Presenting speculation as conclusion |

### Mandatory Downgrades

- Downgrade to `MEDIUM` when two credible sources disagree and the preferred interpretation still has support.
- Downgrade to `LOW` when only one non-strong source exists.
- Downgrade to `LOW` when the evidence quote is indirect, paraphrased, or incomplete.

## Verdict Vocabulary

| Verdict | Use When |
|---|---|
| `supported` | Evidence directly supports the claim and contradictions are minor |
| `mixed` | Evidence supports the claim but credible counterevidence materially limits it |
| `tentative` | Early evidence exists but corroboration is incomplete |
| `rejected` | Counterevidence defeats the claim or the claim cannot be supported |

## Counterevidence Register Format

Counterevidence is mandatory for major claims with meaningful disagreement, trade-offs, or uncertainty.

| Field | Description |
|---|---|
| Counter ID | Stable identifier such as `X-01` |
| Claim ID | Claim affected by the contradiction |
| Contradiction | Summary of what challenges the claim |
| Evidence Quote | The contradictory quote or fact |
| Source | Title + URL |
| Impact | `minor`, `moderate`, `major`, `blocking` |
| Resolution | Why the claim still stands, must be downgraded, or must be rejected |
| Status | `open`, `resolved`, `carried-forward` |

### Counterevidence Example

```markdown
| X-02 | C-04 | Vendor docs claim feature parity, but issue tracker shows unresolved edge cases | "Fails on nested workspace restore" | Repo issue #118 | major | Downgrade claim to MEDIUM and mark scope limit | resolved |
```

## Novel Insights Section Template

Novel insights should synthesize across claims instead of restating a source.

```markdown
### Insight I-01 — Why it matters
- Derived from claims: C-02, C-04, C-07
- New connection: explain the pattern that no single source states directly
- Evidence basis: summarize the supporting claim set
- Confidence: MEDIUM
- Operational implication: state what action changes because of the insight
```

### Novel Insight Rules

- Build each insight from two or more claims.
- Label it as inference if no source states it directly.
- Never let an insight outrank the lowest-confidence claim it depends on.

## Diminishing-Returns Detection Signals

Stop retrieval and move to synthesis when several of these are true:

- Three consecutive sources repeat known evidence without increasing confidence.
- Average credibility improves by less than five points after another search round.
- New sources add examples but no new contradiction, boundary, or mechanism.
- All core claims already have 3+ sources and at least one strong source.
- Counterevidence register remains unchanged after a focused adversarial pass.

## Triangulation Protocol

Core claims require three or more sources across at least two source categories.

| Source Category | Examples |
|---|---|
| Code truth | local source, tests, schema, runtime output |
| Official | vendor docs, standards body, maintainer repo, government site |
| External analysis | academic paper, industry publication, high-quality research note |

### Triangulation Steps

1. Draft the claim in one sentence.
2. Find a primary source that states or proves the mechanism.
3. Add a corroborating source from a different domain or evidence class.
4. Add a third source that validates edge cases, limitations, or implementation reality.
5. Record any contradictions before assigning the verdict.

## Report Integration Pattern

1. Executive Summary references claim IDs, not unsupported prose.
2. Main Analysis expands each claim with evidence and caveats.
3. Counterevidence Register preserves contradictions in a dedicated section.
4. Novel Insights cite the claim IDs they combine.
5. Recommendations only use claims with clear verdicts and declared confidence.

## Failure Conditions

The synthesis fails review when any of the following is true:

- A recommendation depends on a claim without direct evidence.
- A core claim has fewer than three sources and no downgrade note.
- Counterevidence exists in notes but not in the report.
- Confidence labels are missing or stronger than the evidence allows.
- Claim IDs drift between the report, appendix, and JSON template.
