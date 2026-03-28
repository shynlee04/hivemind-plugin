# Evidence Contract

All research outputs must connect claims to evidence, evidence to source quality, and source quality to a confidence decision.

## Evidence Grades

| Grade | Meaning | Minimum Standard |
|---|---|---|
| HIGH | Primary or official source, current enough, directly relevant, corroborated or clearly authoritative | Official docs, active repo maintainer statements, local code truth, standards/specs |
| MEDIUM | Credible but indirect, slightly stale, or only partially corroborated | Reputable industry articles, contributor blog posts, curated tutorials |
| LOW | Weak authority, stale, noisy, or contradicted | Unverified blogs, forums, thin AI summaries, unsupported snippets |

### Grade Rules

- A claim that depends only on LOW evidence must never be labeled high confidence.
- HIGH evidence can still produce a medium-confidence claim when the evidence is incomplete or contradicted.
- LOW evidence can remain in the packet only if it is explicitly labeled as caveat, counterexample, or gap signal.

## Source Credibility Scoring

Score every source on a 0-100 scale using this weighted model:

- **Domain authority**: 35%
- **Recency**: 20%
- **Expertise**: 25%
- **Bias / balance**: 20%

### Component Guidance

| Component | 90-100 | 60-89 | 0-59 |
|---|---|---|---|
| Domain authority | official vendor docs, standards body, active maintainer repo, recognized academic/gov domain | established industry publication or reputable consultancy | unknown personal blog, aggregator, marketing landing page |
| Recency | updated within 6 months | 6-18 months | older than 18 months unless historical source is required |
| Expertise | written by maintainers, standards authors, or domain experts | credible practitioner | unclear authorship or generic content farm |
| Bias | balanced trade-offs, explicit caveats | mild promotional slant | sales-heavy, sensational, or one-sided |

### Score Buckets

| Score | Label | Use Rule |
|---|---|---|
| 80-100 | Strong | Can support critical claims |
| 60-79 | Acceptable | Can support secondary claims or corroborate stronger sources |
| 0-59 | Weak | Use only as caveat, counterpoint, or gap signal |

## Claim Confidence Rules

| Confidence | Requirements |
|---|---|
| High | Claim has at least one Strong source and one additional corroborating source, or local code truth plus official docs |
| Medium | Claim has one Strong or Acceptable source with limited corroboration and explicit caveats |
| Low | Claim relies on weak evidence, unresolved contradiction, or inference-heavy reasoning |

### Mandatory Downgrades

- Downgrade to **Medium** if sources disagree but the preferred interpretation is still justified.
- Downgrade to **Low** if the claim depends on one source only and that source is not Strong.
- Downgrade to **Low** if the evidence quote does not directly support the claim text.

## Claims-Evidence Table Format

Prefer `templates/claims-evidence-table.md` for human-readable packaging.

| Column | Purpose |
|---|---|
| Claim # | Stable identifier such as `C-01` |
| Claim Text | Single verifiable statement |
| Evidence Quote | Exact excerpt or direct factual summary |
| Source URL | URL or repo identifier |
| Source Title | Human-readable source name |
| Credibility Score | 0-100 composite score |
| Confidence Level | High / Medium / Low |

## Return Contract JSON Schema

```json
{
  "_meta": {
    "created_at": "2026-03-29T00:00:00Z",
    "updated_at": "2026-03-29T00:00:00Z",
    "producer": "use-hivemind-research",
    "mode": "standard"
  },
  "topic": "string",
  "primary_type": "technology-eval",
  "decision_stakes": "team-local",
  "claims": [
    {
      "id": "C-01",
      "text": "string",
      "confidence": "High",
      "evidence_ids": ["E-01", "E-02"],
      "caveats": ["string"]
    }
  ],
  "evidence": [
    {
      "id": "E-01",
      "claim_id": "C-01",
      "grade": "HIGH",
      "source_title": "string",
      "source_url": "https://example.com",
      "evidence_quote": "string",
      "credibility_score": 86,
      "credibility_breakdown": {
        "domain_authority": 90,
        "recency": 80,
        "expertise": 85,
        "bias": 88
      }
    }
  ],
  "blocked_routes": [],
  "open_questions": [],
  "recommended_next_action": "string"
}
```

## Validation Gates

The output fails validation if any of these are true:

- `_meta.created_at` or `_meta.updated_at` is missing
- evidence count is below the packet threshold
- any evidence item lacks `credibility_score`
- any output contains placeholders such as `TODO`, `TBD`, `<fill-me>`, or `[insert]`

Run `scripts/hm-research-validate.sh <output.json> <min-evidence>` before handoff.

## Packaging Rules

- Keep claims short and singular; split compound claims.
- Evidence quotes must be specific enough to audit later.
- Record contradictions in `open_questions` or `caveats`; do not bury them in prose.
- Prefer independent domains when corroborating major claims.
