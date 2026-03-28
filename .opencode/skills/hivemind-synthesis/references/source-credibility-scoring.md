# Source Credibility Scoring

Use this reference to assign 0-100 credibility scores to every source used in synthesis.

## Weighted Model

Score each source with a four-part composite:

- **Domain authority:** 35%
- **Recency:** 20%
- **Expertise:** 25%
- **Bias / balance:** 20%

Formula:

```text
credibility_score =
  (domain_authority * 0.35) +
  (recency * 0.20) +
  (expertise * 0.25) +
  (bias * 0.20)
```

Round to the nearest whole number for report display.

## Score Buckets

| Score | Label | Use Rule |
|---|---|---|
| 80-100 | Strong | Can support critical claims and recommendations |
| 60-79 | Acceptable | Can support secondary claims or corroborate stronger sources |
| 0-59 | Weak | Use only as caveat, counterpoint, or gap signal |

## Component Rubric

| Component | 90-100 | 70-89 | 40-69 | 0-39 |
|---|---|---|---|---|
| Domain authority | official standards, gov, peer-reviewed journals, maintainer-owned docs | established vendor docs, respected research orgs, major conference material | reputable industry publication or consultancy | unknown blog, affiliate landing page, scraped mirror |
| Recency | updated within 6 months | 6-18 months old | 18-36 months old but still possibly relevant | older than 36 months and not historical context |
| Expertise | maintainer, standards author, domain expert, principal researcher | credible practitioner with identifiable track record | unclear authorship but technically plausible | anonymous or content-farm authorship |
| Bias / balance | trade-offs and caveats explicitly discussed | mild preference but still balanced | promotional slant or incomplete trade-offs | sales-heavy, sensational, adversarial without evidence |

## High-Authority Domains

Treat these as strong authority candidates before applying the other components:

- `arxiv.org`
- `nature.com`
- `science.org`
- `ieee.org`
- `acm.org`
- `nist.gov`
- `nih.gov`
- `who.int`
- `*.gov`
- `*.edu`
- official vendor documentation domains
- maintainer-owned repositories and release notes
- standards bodies such as IETF, W3C, ISO summaries, WHATWG, ECMA

## Moderate-Authority Domains

These can score well, but usually require corroboration:

- established technology news sites
- reputable industry analysts
- vendor engineering blogs with identified authors
- long-form conference talks with transcripts or slides
- respected consultancy publications
- major open-source ecosystem blogs

## Low-Authority Indicators

Any of these should trigger a strong downgrade:

- `blogspot.` domains
- `wordpress.` domains without institutional backing
- unknown personal subdomains
- AI-generated content farms
- link-aggregator pages
- SEO pages with no identified author
- sponsored content that presents no caveats
- stale mirrors of official docs

## Domain Authority Heuristics

| Signal | Effect |
|---|---|
| Official documentation or spec | Start domain authority at 90 |
| Government or peer-reviewed research | Start domain authority at 92 |
| Maintainer issue, release note, or RFC | Start domain authority at 85 |
| Reputable industry write-up | Start domain authority at 70 |
| Personal blog with named expert | Start domain authority at 55 |
| Unknown blog or repost | Start domain authority at 25 |

## Recency Heuristics

| Age | Suggested Score |
|---|---|
| 0-6 months | 90-100 |
| 6-12 months | 80-89 |
| 12-18 months | 70-79 |
| 18-36 months | 45-69 |
| 36+ months | 0-44 unless explicitly historical |

**Historical-source exception:** preserve older sources when the task concerns original design intent, chronology, or standards lineage. Record that exception explicitly.

## Expertise Heuristics

Assign higher expertise when the author is directly responsible for the topic.

- 95-100: maintainer, standards editor, principal researcher, official working group member
- 80-94: senior practitioner with public track record
- 60-79: credible technical author with consistent depth
- 30-59: unclear technical standing
- 0-29: anonymous, unverifiable, or obviously generic authorship

## Bias Heuristics

- 90-100: openly discusses trade-offs, risks, and limitations
- 70-89: mostly balanced but still prefers one path
- 40-69: moderate promotional slant or omitted trade-offs
- 0-39: one-sided sales content, hype piece, or grievance content

## Floor and Ceiling Rules

- If domain authority is below 30, the source cannot exceed 59 overall without extraordinary expertise evidence.
- If bias is below 25, cap the overall score at 69.
- If the source is official but stale, let domain authority remain high but lower recency sharply.
- If the source is fresh but anonymous, cap expertise at 40.

## Example Scoring Walkthroughs

### Example 1: Official API Docs

| Component | Score | Reason |
|---|---|---|
| Domain authority | 95 | Official vendor docs |
| Recency | 88 | Updated four months ago |
| Expertise | 92 | Maintainer-owned source |
| Bias | 82 | Good docs, but limited discussion of alternatives |

Composite: `95*.35 + 88*.20 + 92*.25 + 82*.20 = 89.85` → **90 (Strong)**

### Example 2: Industry Analysis Article

| Component | Score | Reason |
|---|---|---|
| Domain authority | 72 | Reputable industry publication |
| Recency | 78 | Updated last year |
| Expertise | 70 | Identified practitioner |
| Bias | 68 | Some positioning bias |

Composite: `72*.35 + 78*.20 + 70*.25 + 68*.20 = 71.9` → **72 (Acceptable)**

### Example 3: Personal Blog Post

| Component | Score | Reason |
|---|---|---|
| Domain authority | 28 | Personal blog with no institutional backing |
| Recency | 84 | Recently posted |
| Expertise | 48 | Some technical detail, unclear reputation |
| Bias | 42 | Opinionated and one-sided |

Composite: `28*.35 + 84*.20 + 48*.25 + 42*.20 = 47.0` → **47 (Weak)**

## Use Rules in Synthesis

1. Show the composite score beside each source in the claims-evidence table.
2. Use sources below 60 only as caveat, counterpoint, or open question.
3. Require at least one source above 80 for high-confidence recommendations.
4. Downgrade claim confidence when the evidence set average falls below 70.

## Review Checklist

- Does every source show a 0-100 score?
- Do the component scores match the source type and date?
- Are weak sources clearly labeled and limited in influence?
- Is the scoring logic consistent across similar source types?
