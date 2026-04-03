# Progressive Assembly

Use progressive assembly when the synthesis is too large, too cross-cutting, or too citation-heavy to trust as a single-shot response.

## Goals

- Generate the report section by section.
- Persist citations and claim state to disk after each section.
- Survive context compaction and long-running sessions.
- Avoid truncation by continuing from explicit on-disk state.

## Section-by-Section Generation Strategy

Write synthesis in this order:

1. Outline + claim inventory
2. Executive Summary draft with claim references only
3. Main Analysis sections, one finding cluster at a time
4. Counterevidence Register
5. Novel Insights
6. Recommendations
7. Bibliography
8. Methodology Appendix

Each section should be written only after the claims-evidence table for that section is stable.

## Persistence Pattern

Maintain three disk artifacts during large syntheses:

| Artifact | Purpose |
|---|---|
| `claims-*.json` | Canonical structured claims and evidence |
| `citations-*.json` | Source ledger, credibility scores, citation IDs |
| `report-*.md` | Human-readable assembled report |

### Persistence Rules

- Write after every major section.
- Never store citations only in conversation context.
- Reuse the same citation IDs across partial runs.
- If the session compacts, reload the JSON ledgers before continuing.

## Auto-Continuation for Large Reports

For reports that exceed roughly 18K words:

1. Freeze the current section and persist files.
2. Record the last completed section, next section, and open claim IDs.
3. Resume with a fresh context window using the persisted state.
4. Append only the unfinished section instead of regenerating the whole report.

## Anti-Truncation Rules

- Do not generate bibliography last if citations are still unstable.
- Do not keep more than one unfinished section open at a time.
- Do not let recommendations reference claims that are not yet persisted.
- Do not continue generation until validation errors from the prior section are fixed.

## Evidence-Driven Outline Refinement

The outline may change as evidence density changes.

| Signal | Action |
|---|---|
| One section collects too many unrelated claims | Split into two findings clusters |
| A section has weak evidence only | Downgrade or merge it into caveats |
| Counterevidence dominates a section | Reframe as trade-off analysis |
| New evidence creates a cross-cutting pattern | Add a novel-insights subsection |

## Working State Template

```json
{
  "current_section": "main-analysis-finding-03",
  "completed_sections": ["executive-summary", "finding-01", "finding-02"],
  "open_claim_ids": ["C-07", "C-08"],
  "citation_ledger": "citations-2026-03-29.json",
  "report_path": "report-2026-03-29.md"
}
```

## Section Completion Gate

Before moving to the next section, confirm:

- section heading exists
- all referenced claims exist in the claims ledger
- all citations resolve to the bibliography ledger
- counterevidence is recorded when relevant
- no placeholders remain

## Recommended Assembly Rhythm

1. Retrieve or validate evidence.
2. Update claims JSON.
3. Update citation ledger.
4. Draft one report section.
5. Run validation.
6. Persist and continue.

## Failure Recovery

If a section fails or context compacts mid-run:

- reload the persisted claim and citation ledgers
- re-open only the last incomplete section
- do not regenerate completed sections unless citations changed

## Handoff Note

When handing off large synthesis work, include:

- last completed section
- pending claims
- citation ledger path
- validation status
- next recommended action
