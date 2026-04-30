# RICH Resource Rationale — hivefiver-delegation-gates

## Scope

This package enforces pre-delegation boundary checks. It is not an orchestrator and should not perform implementation; it validates whether a proposed handoff is authorized, scoped, and recoverable.

## Third-Party / External Source Scorecard

| Source | Discovery method | Reviewed material | Bundled-resource result | Decision |
|---|---|---|---|---|
| OpenAI Agents guardrails | Official docs/search lineage | Tripwire and guardrail concepts | External docs are not a skill bundle, but the boundary model maps directly to pre-dispatch gates. | ADAPT |
| Claude Code hook lifecycle | Official docs/search lineage | PreToolUse/PostToolUse-style interception concepts | Hook lifecycle informs boundary timing; not a bundled skill package. | ADAPT |
| Nanostack guard/rules pattern | GitHub/source lineage | Guard rules and explicit block/pass records | Adapted as explicit evidence rows; no runtime dependency. | ADAPT |

## Bundled Resources

- `references/gates.md` — gate structure and specialist profiles.
- `references/boundary-guardrails.md` — workflow/child/tool/human boundary checks.
- `references/rich-resource-rationale.md` — this scorecard.
- `evals/evals.json` — boundary pressure scenarios.
- `scripts/validate-skill.sh` and `scripts/check-overlaps.sh` — validation utilities.

## Independence Audit

PASS. The skill is framework-independent and can be applied to any OpenCode project that dispatches subagents or tools. It records evidence rather than depending on GSD/BMAD state.

## RICH Exit Score

| Gate | Score | Evidence |
|---|---|---|
| RICH-1 | PASS WITH RATIONALE | Top boundary/guardrail sources selected; non-bundle status documented. |
| RICH-5 | PASS | Boundary guardrail references, evals, and validators bundled. |
| RICH-8 | PASS | Eval-depth partial is closed by `evals/evals.json` and this scorecard. |
