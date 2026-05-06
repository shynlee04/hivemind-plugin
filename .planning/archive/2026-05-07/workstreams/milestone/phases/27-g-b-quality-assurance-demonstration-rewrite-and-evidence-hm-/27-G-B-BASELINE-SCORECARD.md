# Phase 27 G-B Baseline Scorecard

**Created:** 2026-04-25  
**Scope:** `hm-spec-driven-authoring` and `hm-test-driven-execution` only.  
**Source basis:** Phase 26 playbook D1-D8, Phase 26 ecology audit G-B rows, current package inspection on 2026-04-25.

## Baseline Method

Scores use only current package evidence. Historical Phase 18/22/23 claims explain lineage but do not close any score. `PASS` means the current package has operational guidance plus evidence. `PARTIAL` means useful content exists but evidence or workflow depth is incomplete. `FAIL` means the dimension is absent or too hollow to support a quality claim.

## Current Package Facts

| Skill | Current files inspected | Baseline tier | Summary |
|---|---|---|---|
| `hm-spec-driven-authoring` | `SKILL.md`, `evals/evals.json`, `references/spec-to-req-mapping.md`, `references/acceptance-test-patterns.md`, `scripts/validate-skill.sh` | THIN | 107-line body, two short references, trigger-only eval bundle, validator expects a missing 6-NON phrase. |
| `hm-test-driven-execution` | `SKILL.md`, `evals/evals.json`, `references/red-green-refactor.md`, `references/coverage-verification.md`, `scripts/validate-skill.sh` | THIN | 119-line body, two short references, trigger-only eval bundle, validator expects a missing 6-NON phrase. |

## D1-D8 Baseline Matrix

| Skill | HMQUAL-01 / D1 Trigger | HMQUAL-02 / D2 Body | HMQUAL-03 / D3 6-NON | HMQUAL-04 / D4 Eval | HMQUAL-05 / D5 Refs | HMQUAL-06 / D6 Integration | HMQUAL-07 / D7 Platform | HMQUAL-08 / D8 Self-Correction |
|---|---|---|---|---|---|---|---|---|
| `hm-spec-driven-authoring` | PARTIAL — positive triggers and one negative trigger exist, but no boundary eval for `hm-test-driven-execution` or `hm-planning-with-files`. | PARTIAL — pipeline exists, but entry gates, ambiguity rejection, integration notes, and blocked handoff are thin. | FAIL — no NON-1 through NON-6 evidence record; validator looks for a missing phrase rather than real defences. | PARTIAL — `evals/evals.json` has trigger queries only; no assertions, boundary, or `stacked_scenario`. | PARTIAL — two references exist and are cited, but are too shallow for acceptance-test derivation evidence. | PARTIAL — names adjacent skills but lacks agents, commands, tools, plugin hooks, and runtime state guidance. | PARTIAL — Node-style commands only; no OpenCode/Hivemind/arbitrary-project adapters. | PARTIAL — green-before-red note exists, but retry, escalation, rollback, and blocked handoff are incomplete. |
| `hm-test-driven-execution` | PARTIAL — positive triggers and one negative trigger exist, but manual-only/test-after/generic review boundaries are not gradeable. | PARTIAL — RED/GREEN/REFACTOR exists, but runtime-truthful testing, invalid RED handling, language adapters, and fresh evidence reporting are thin. | FAIL — no NON-1 through NON-6 evidence record; validator looks for a missing phrase rather than real defences. | PARTIAL — `evals/evals.json` has trigger queries only; no assertions, invalid RED, coverage fallback, or `stacked_scenario`. | PARTIAL — two references exist and are cited, but are minimal and not enough for coverage verification across platforms. | PARTIAL — references adjacent skills but lacks agent/command/tool/plugin/runtime-state wiring. | PARTIAL — assumes `npm test` / `npm run test:coverage`; Python, Go, and no-coverage fallback absent. | PARTIAL — some stop gates exist, but retry budget, blocked handoff, flaky-test handling, and unsupported coverage handling are incomplete. |

## Required Closure Blockers for Plans 02-03

### `hm-spec-driven-authoring`

- Add explicit positive, negative, boundary, and stacked eval scenarios with assertions.
- Expand `SKILL.md` with entry gate, ambiguity rejection, spec-lock workflow, acceptance-test derivation, integration wiring, platform adapters, and self-correction.
- Replace phrase-only validator with checks for boundaries, tool names, references, eval keys, and self-correction markers.
- Preserve portable shipped guidance: no absolute project paths in reusable skill content.

### `hm-test-driven-execution`

- Add positive, negative, boundary, invalid RED, coverage-absent, and stacked eval scenarios with assertions.
- Expand `SKILL.md` with runtime-truthful vs mock-heavy guidance, Node/Python/Go/no-coverage adapters, coverage claim rules, retry/rollback/escalation, and blocked handoff.
- Replace phrase-only validator with checks for runtime-truthful language, coverage adapters, references, eval keys, and self-correction markers.
- Preserve honest evidence rules: no coverage or pass claims without fresh command output.

## Verification Commands for This Baseline

```bash
test -f .opencode/skills/hm-spec-driven-authoring/SKILL.md
test -f .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "hm-spec-driven-authoring" .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-BASELINE-SCORECARD.md
grep -q "hm-test-driven-execution" .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-BASELINE-SCORECARD.md
grep -q "HMQUAL-08" .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-BASELINE-SCORECARD.md
```
