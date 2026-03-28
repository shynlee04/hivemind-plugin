# Synthesis Validation

Run validation before treating a synthesis report as complete.

## Nine Automated Quality Checks

| # | Check | Pass Condition |
|---|---|---|
| 1 | Section presence | Executive Summary, Main Analysis, Counterevidence Register, Novel Insights, Recommendations, Bibliography, Methodology Appendix all exist |
| 2 | Citation formatting | Citations use a consistent pattern such as `[S1]` |
| 3 | Bibliography completeness | Every cited source appears in the bibliography with title, URL, and credibility score |
| 4 | Placeholder detection | No `TODO`, `TBD`, `<fill-me>`, `[insert]`, or similar placeholders |
| 5 | Word count | Meets the declared minimum for the report mode |
| 6 | Source count | At least 10 distinct sources for standard or deeper syntheses |
| 7 | Internal links | Internal anchors resolve and are not broken |
| 8 | Credibility scoring present | Each source or evidence row exposes a 0-100 credibility score |
| 9 | Counterevidence present | Counterevidence section exists and is non-empty for contested topics |

## Additional Structured Check

When a claims JSON file exists, also validate:

- every claim has at least one evidence item
- every evidence item has a source URL and credibility score
- every claim has a verdict and confidence value

## Validation Modes

| Mode | Typical Minimum Words | Minimum Sources |
|---|---|---|
| Quick | 600 | 6 |
| Standard | 1,200 | 10 |
| Deep | 2,000 | 15 |
| UltraDeep | 3,000 | 20 |

## Validation Loop Protocol

Validation follows a bounded retry loop.

1. Run structural validation.
2. Run bibliography and citation validation.
3. Run claims-evidence validation when JSON exists.
4. Fix only the reported failures.
5. Re-run validation.
6. Stop after **3 cycles** if failures persist.

## Failure Severity

| Severity | Meaning | Action |
|---|---|---|
| Blocking | Missing section, invalid citations, missing bibliography, empty evidence arrays | Stop and fix before handoff |
| Major | Weak source count, missing credibility score, unresolved counterevidence | Fix or explicitly downgrade report confidence |
| Minor | Formatting drift, sparse internal links, wording issues | Fix before final packaging when possible |

## Review Checklist

- Does every recommendation trace back to supported claims?
- Are weak sources clearly marked as caveat-only?
- Does the counterevidence register change any claim confidence?
- Are bibliography items complete and reusable?

## Handoff Contract

Validation output should return:

```json
{
  "status": "pass|fail",
  "checks_run": 9,
  "failures": [],
  "warnings": [],
  "cycles_used": 1,
  "recommended_next_action": "publish|fix-and-rerun"
}
```

## Recommended Tooling

- `scripts/hm-synthesis-validate.sh` for deterministic checks
- manual skim of the counterevidence and recommendations sections
- optional citation verification pass for DOI or URL sanity
