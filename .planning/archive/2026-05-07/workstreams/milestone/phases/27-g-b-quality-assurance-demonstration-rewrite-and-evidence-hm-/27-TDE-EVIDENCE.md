# Phase 27 TDE Evidence Record

**Skill:** `hm-test-driven-execution`  
**skill_path:** `.opencode/skills/hm-test-driven-execution/SKILL.md`  
**quality_tier:** SUBSTANTIVE  
**Evidence date:** 2026-04-25

## dimension_scores

| HMQUAL | Score | Evidence | Blocker |
|---|---|---|---|
| HMQUAL-01 / D1 Trigger Accuracy | PASS | `SKILL.md` description starts with “Use when”, excludes spec authoring/generic planning/manual QA/test-after work, and `evals/evals.json` includes positive, negative, and boundary trigger cases. Maps to REQ-TDE-01. | none |
| HMQUAL-02 / D2 Body Depth | PASS | `SKILL.md` includes Entry Gate, RED/GREEN/REFACTOR Gates, Runtime-Truthful Testing, Coverage Claims, Invalid RED handling, Exit Criteria, Anti-Patterns, and Self-Correction. Maps to REQ-TDE-02. | none |
| HMQUAL-03 / D3 6-NON Defence | PASS | `SKILL.md` contains `6-NON Defence Table` with NON-1 through NON-6 defences. Maps to REQ-TDE-03. | none |
| HMQUAL-04 / D4 Eval Coverage | PASS | `evals/evals.json` includes positive, negative, boundary ambiguous-requirements, invalid RED, coverage-tooling-absent, and `stacked_scenario` cases. Maps to REQ-TDE-04. | none |
| HMQUAL-05 / D5 Reference Completeness | PASS | `SKILL.md` Reference Map cites one-level references `red-green-refactor.md` and `coverage-verification.md`; both files support rather than replace the body. Maps to REQ-TDE-05. | none |
| HMQUAL-06 / D6 Integration Wiring | PASS | Integration Wiring names `hm-spec-driven-authoring`, `hm-planning-with-files`, `run-background-command`, `prompt-skim`, `prompt-analyze`, `session-patch`, plugin hooks, runtime state, and coverage commands. Maps to REQ-TDE-06. | none |
| HMQUAL-07 / D7 Cross-Platform Compatibility | PASS | Cross-Platform Adapters and Coverage Claims cover OpenCode-native, Hivemind harness, arbitrary projects, Node, Python, Go, and no-coverage fallback. Maps to REQ-TDE-07. | none |
| HMQUAL-08 / D8 Self-Correction | PASS | Self-Correction defines invalid RED, failing GREEN retry budget, refactor regression, missing coverage, and blocked handoff. Maps to REQ-TDE-08. | none |

## verification_commands

```bash
grep -q "hm-spec-driven-authoring" .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "hm-planning-with-files" .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "runtime-truthful" .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "npm run test:coverage" .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "pytest --cov" .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "go test ./... -cover" .opencode/skills/hm-test-driven-execution/SKILL.md
grep -q "stacked_scenario" .opencode/skills/hm-test-driven-execution/evals/evals.json
bash .opencode/skills/hm-test-driven-execution/scripts/validate-skill.sh
```

## eval_bundle_status

| Coverage | Status | Evidence |
|---|---|---|
| Positive trigger | PASS | `positive-tdd-cycle`, `positive-coverage-verification` |
| Negative trigger | PASS | `negative-manual-qa` |
| Boundary handoff | PASS | `boundary-ambiguous-requirements` |
| Invalid RED | PASS | `invalid_red` failure scenario |
| Coverage absent | PASS | `coverage_tooling_absent` failure scenario |
| Stacked scenario | PASS | `spec-to-progress-to-runtime-truthful-tdd` |

## reference_bundle_status

- Files: `references/red-green-refactor.md`, `references/coverage-verification.md`.
- Cited from `SKILL.md`: PASS.
- One-level deep: PASS.
- Stale/circular link status: PASS by package-local inspection.

## integration_wiring_notes

- Agents: applicable — phase status and subagent evidence expectations are specified.
- Commands: applicable — `$ARGUMENTS` parsing and retry budget requirements are specified.
- Tools: applicable — `run-background-command`, `prompt-skim`, `prompt-analyze`, and `session-patch` are named with scope.
- Plugin hooks: applicable — hooks may record output or warn but cannot convert failures to green.
- Runtime state: applicable — phase, command, output, coverage status, retry count, and handoff must persist.

## cross_platform_notes

- OpenCode-native: PASS — available shell/test tools and platform substitutions addressed.
- Hivemind harness: PASS — delegation, queue/runtime state, PTY/background execution, and parent-visible evidence addressed.
- Arbitrary user project: PASS — Node, Python, Go, and no-coverage adapters included without requiring `.planning/` or GSD.

## self_correction_notes

Invalid RED, failing GREEN retry budget, refactor regression, coverage absence, and structured blocked handoff are defined in `Self-Correction`.
