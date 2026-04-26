# RICH Resource Rationale — hm-agents-md-sync

## Scope

This package detects and repairs drift between `AGENTS.md` and the actual repository state. It must inspect only source/configuration surfaces relevant to agent instructions and avoid generated/vendor directories.

## Third-Party / External Source Scorecard

| Source | Discovery method | Reviewed material | Bundled-resource result | Decision |
|---|---|---|---|---|
| `sickn33/antigravity-awesome-skills@agents-md` | skills.sh/GitHub search | AGENTS.md-oriented skill metadata and documentation-sync pattern | Source is relevant to AGENTS.md maintenance but full bundle was not locally crawled in this closure pass. | ADAPT |
| `acedergren/agentic-tools@doc-sync` | skills.sh/GitHub search | Documentation synchronization pattern | Similar drift-detection concept; no local bundled resource diff available. | ADAPT WITH CAUTION |
| NousResearch/Hermes issue lineage | GitHub issue evidence | Real-world documentation/runtime drift signal | Issue evidence supports risk model; not a bundled skill package. | USE AS RISK EVIDENCE |

## Pattern Alternatives

1. **Claim extraction + file verification** — adopted. Extract claims, verify against disk, patch targeted lines.
2. **Full rewrite of AGENTS.md** — rejected unless drift is systemic; too destructive for routine sync.
3. **Linter-only detection** — rejected because this skill must also produce repair edits.

## Bundled Resources

- `references/rich-resource-rationale.md` — source scorecard and RICH closure evidence.
- `evals/evals.json` — drift and over-scope scenarios.
- `scripts/validate-skill.sh` — static package validator.

## Independence Audit

PASS. Works in any repository that has `AGENTS.md` or an equivalent agent instruction file. It does not require GSD/BMAD state and explicitly refuses generated/vendor scan targets.

## RICH Exit Score

| Gate | Score | Evidence |
|---|---|---|
| RICH-1 | PASS WITH RATIONALE | Top source candidates selected; access limitations and issue-vs-bundle status documented. |
| RICH-5 | PASS | Domain-specific drift scorecard, evals, and validator bundled. |
| RICH-8 | PASS | Scoring integration now present through this resource rationale and validator evidence. |
