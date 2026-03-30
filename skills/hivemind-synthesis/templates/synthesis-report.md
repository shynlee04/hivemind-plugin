# Report Title

## Table of Contents

- [Executive Summary](#executive-summary)
- [Main Analysis](#main-analysis)
- [Counterevidence Register](#counterevidence-register)
- [Novel Insights](#novel-insights)
- [Recommendations](#recommendations)
- [Bibliography](#bibliography)
- [Methodology Appendix](#methodology-appendix)

## Executive Summary

State the top conclusions in 200-400 words. Reference claim IDs and citations such as `[S1]` instead of unsupported prose.

Use this section to answer five questions explicitly:

1. What decision or problem does the synthesis address?
2. Which two to four claims matter most?
3. What confidence level applies to each headline claim?
4. What counterevidence most changes the interpretation?
5. What immediate action follows from the evidence?

- `C-01` — summary sentence with confidence and citation `[S1]`
- `C-02` — summary sentence with confidence and citation `[S2]`

Recommended summary pattern:

- Context sentence: state the scope and evaluation mode.
- Evidence sentence: state the dominant supporting evidence classes.
- Risk sentence: surface the most important limitation or contradiction.
- Action sentence: state the recommended next step.

## Main Analysis

### Finding 1 — Title

**Claim:** `C-01`  
**Confidence:** `HIGH`  
**Verdict:** `supported`

| Claim ID | Claim Text | Evidence Quote | Source | Credibility Score | Confidence |
|---|---|---|---|---:|---|
| C-01 | Replace with the claim text. | "Replace with direct evidence." | [S1] Example Source 1 | 88 | HIGH |

Analysis paragraph explaining how the evidence supports the claim and what is still uncertain. Link to the [Methodology Appendix](#methodology-appendix) when needed.

Expand each finding with:

- **Mechanism:** explain how the evidence produces the observed outcome.
- **Boundary:** explain where the claim stops being reliable.
- **Trade-off:** explain what is gained and what is sacrificed.
- **Operational impact:** explain what a team should do differently.
- **Cross-claim dependency:** reference any related claims that strengthen or weaken the interpretation.

### Finding 2 — Title

**Claim:** `C-02`  
**Confidence:** `MEDIUM`  
**Verdict:** `mixed`

| Claim ID | Claim Text | Evidence Quote | Source | Credibility Score | Confidence |
|---|---|---|---|---:|---|
| C-02 | Replace with the claim text. | "Replace with direct evidence." | [S2] Example Source 2 | 74 | MEDIUM |

Add analysis, limitations, and implication.

If the report has more than two findings, repeat the same pattern for each additional cluster:

- stable claim ID
- confidence level
- evidence row or rows
- interpretation paragraph
- counterevidence note
- practical implication

## Counterevidence Register

| Counter ID | Claim ID | Contradiction | Source | Impact | Resolution |
|---|---|---|---|---|---|
| X-01 | C-02 | Replace with the contradictory evidence. | [S3] Example Source 3 | moderate | Explain whether the claim was downgraded, scoped, or rejected. |

Add one row for every contradiction that materially changes the confidence, verdict, or recommendation. If the topic is uncontested, say so explicitly and explain why no major contradictory evidence was found.

## Novel Insights

### Insight I-01 — Title

- Derived from claims: `C-01`, `C-02`
- New connection: explain the pattern that emerges across claims
- Confidence: `MEDIUM`
- Operational implication: explain what changes because of the insight

Novel insights must go beyond quotation. Derive them from at least two claims and explain why the pattern matters now. Useful insight categories include:

- hidden dependency or coupling
- repeated failure mode across sources
- mismatch between official guidance and implementation reality
- adoption implication or sequencing insight
- evidence-driven boundary condition the sources mention separately but never connect

## Recommendations

1. Recommendation tied to supported claims `C-01` and `C-02`.
2. Follow-up validation step if confidence remains medium or low.
3. Explicit no-go condition if counterevidence becomes blocking.

For each recommendation, capture:

- owner or audience
- expected benefit
- prerequisite evidence or dependency
- rollback or stop condition
- confidence threshold below which the recommendation should not be treated as final

## Bibliography

- [S1] Example Source 1 — https://example.com/source-1 — credibility_score: 88
- [S2] Example Source 2 — https://example.com/source-2 — credibility_score: 74
- [S3] Example Source 3 — https://example.com/source-3 — credibility_score: 69
- [S4] Example Source 4 — https://example.com/source-4 — credibility_score: 83
- [S5] Example Source 5 — https://example.com/source-5 — credibility_score: 79
- [S6] Example Source 6 — https://example.com/source-6 — credibility_score: 81
- [S7] Example Source 7 — https://example.com/source-7 — credibility_score: 76
- [S8] Example Source 8 — https://example.com/source-8 — credibility_score: 72
- [S9] Example Source 9 — https://example.com/source-9 — credibility_score: 84
- [S10] Example Source 10 — https://example.com/source-10 — credibility_score: 77

## Methodology Appendix

### Scope

State the scope, exclusions, and evaluation mode.

Recommended fields:

- topic
- intended decision
- evaluation depth (quick, standard, deep, ultra-deep)
- included source classes
- excluded source classes
- known unresolved questions

### Claims-Evidence Ledger

State where the JSON claims ledger lives and how claim IDs map back to the report.

Describe the normalization rules used to keep the report aligned with the structured evidence file:

- how claim IDs were assigned
- how evidence IDs map to citations
- how credibility scores were computed
- how counterevidence items changed the verdicts
- how claim confidence was downgraded when corroboration was incomplete

### Validation Summary

- Validation script: `scripts/hm-synthesis-validate.sh`
- Validation cycles used: `1`
- Remaining warnings: `0`

Add a short narrative when validation required rework, especially when a section failed because of missing citations, weak source counts, placeholder text, or incomplete counterevidence handling.

### Source Mix

Describe the blend of official docs, code truth, academic sources, and external analysis.

Useful closing details:

- source count by type
- average credibility score
- lowest-scoring source retained and why it was kept
- strongest contradiction discovered
- diminishing-returns signal that triggered synthesis completion
