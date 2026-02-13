# Team A Indexed Artifacts (A001-A006)

## Artifact map

| ID | Artifact | Path | Purpose |
|---|---|---|---|
| A001 | PR lineage matrix | `.plan/team-a-review/artifacts/A001-pr-lineage-matrix.md` | Merge/retain/regress truth table for PR #4-#17 |
| A002 | Current HEAD evidence | `.plan/team-a-review/artifacts/A002-head-evidence-ledger.md` | File/line-based proof of current implementation state |
| A003 | Cross-team reconciliation | `.plan/team-a-review/artifacts/A003-cross-team-reconciliation.md` | Team C alignment vs post-merge drift |
| A004 | Weighted risk model | `.plan/team-a-review/artifacts/A004-weighted-risk-model.md` | Scoring rationale and priority math |
| A005 | Bucketed verdict ledger | `.plan/team-a-review/artifacts/A005-bucketed-verdicts.md` | Final 5-bucket coordinator classification |
| A006 | Actionable roadmap | `.plan/team-a-review/artifacts/A006-action-roadmap.md` | P0/P1/P2 recommendations and governance loop |

## Primary Team A report set

| Document | Path |
|---|---|
| Team A index | `docs/pr-review/team-a-review/INDEX.md` |
| Cross-validation evidence | `docs/pr-review/team-a-review/cross-validation-evidence.md` |
| Full analysis | `docs/pr-review/team-a-review/pr-analysis-2026-02-13.md` |
| Executive recommendations | `docs/pr-review/team-a-review/executive-summary-recommendations.md` |

## Notes on evidence integrity

- All A001-A006 artifacts were regenerated against `origin/master` at `28f6c3d` on 2026-02-13.
- Team A used runtime verification (`npm test`, `npm run typecheck`, `npm run lint:boundary`) in addition to commit lineage checks.
