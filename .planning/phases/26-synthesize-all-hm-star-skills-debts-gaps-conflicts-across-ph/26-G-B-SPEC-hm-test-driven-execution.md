# G-B SPEC: hm-test-driven-execution

## Current State

`hm-test-driven-execution` is a Phase 20 G-B skill package that currently exists but remains a THIN-tier execution guide rather than a quality-complete testing workflow. Current package facts: `119 LOC`, `2 references`, `1 evals.json only`, `THIN tier`, `no stacked eval scenario`, `no runtime-truthful vs mock-heavy guidance`, and `Phase 26 does not mutate SKILL.md`.

Evidence basis:
- `26-CONTEXT.md` names the G-B quality-assurance lineage as the first demonstration template.
- `26-RESEARCH.md` reports the current skill as 119-line, two-reference, one-eval, no-stacked-scenario current state.
- `26-ECOLOGY-AUDIT.md` classifies `hm-test-driven-execution` as `THIN` with D1-D8 quality still open.
- `26-PLAYBOOK.md` defines D1-D8 as the required quality gate before future closure claims.

## Target State

By Phase 27 completion, `hm-test-driven-execution` must be a standalone-superior TDD execution skill that enforces RED/GREEN/REFACTOR gates, verifies coverage claims with fresh evidence, distinguishes runtime-truthful testing from mock-heavy theater, and adapts to Node, Python, Go, and projects without coverage tooling.

Phase 27 target tier: `SUBSTANTIVE` minimum, `EXEMPLAR` preferred if stacked eval evidence and runtime-truthful integration proof are completed.

## Requirements

### REQ-TDE-01: Trigger Accuracy
**Description:** The skill MUST activate for test-first implementation, RED/GREEN/REFACTOR execution, coverage verification, and test-suite quality work, and MUST exclude manual-only testing or test-after implementation requests.
**Acceptance Criteria:** The skill package contains positive trigger cases, negative trigger cases, and boundary language separating this skill from `hm-spec-driven-authoring`, `hm-planning-with-files`, and generic code review workflows.
**Verification Method:** Inspect `SKILL.md` and eval bundle for positive/negative trigger cases; run trigger evals where TDD prompts load the skill and non-TDD prompts do not.
**Maps To PLAYBOOK Dimension:** D1 Trigger Accuracy

### REQ-TDE-02: Body Depth
**Description:** The skill body MUST define RED, GREEN, REFACTOR, coverage-claim verification, invalid-test handling, regression handling, and completion reporting with fresh evidence.
**Acceptance Criteria:** `SKILL.md` includes entry gate, per-phase commands, failure gates, anti-patterns, coverage claim format, rollback/retry behavior, and exit criteria.
**Verification Method:** Grep for Red/Green/Refactor, Gate, Coverage Claims, Anti-Patterns, and failure handling sections; review that each section contains executable guidance.
**Maps To PLAYBOOK Dimension:** D2 Body Depth

### REQ-TDE-03: 6-NON Defence
**Description:** The skill MUST defend against non-audit, non-contextual, non-cycles, non-hierarchy, non-ecosystem-eval, and non-systematic-pattern failures in testing workflows.
**Acceptance Criteria:** A future audit record can score NON-1 through NON-6 with evidence for source grounding, adjacent skill boundaries, loop-back gates, role hierarchy, stacked eval behavior, and deterministic verification commands.
**Verification Method:** Compare the skill body, references, evals, and scripts against Phase 18 6-NON criteria and record one evidence note per NON mode.
**Maps To PLAYBOOK Dimension:** D3 6-NON Defence

### REQ-TDE-04: Eval Coverage
**Description:** The skill MUST include eval coverage for trigger behavior and stacked multi-skill testing workflows, including invalid RED tests and coverage-claim truthfulness.
**Acceptance Criteria:** `evals/evals.json` includes positive trigger queries, negative trigger queries, assertion criteria, and a `stacked_scenario` involving `hm-spec-driven-authoring`, `hm-planning-with-files`, and a runtime-truthful TDD cycle.
**Verification Method:** Inspect eval JSON for `trigger_queries`, negative cases, assertions, and `stacked_scenario`; run or manually grade the eval and record the result.
**Maps To PLAYBOOK Dimension:** D4 Eval Coverage

### REQ-TDE-05: Reference Completeness
**Description:** The skill MUST keep references one level deep, cited from the body, and sufficient to support canonical TDD and coverage verification without replacing the body workflow.
**Acceptance Criteria:** The Reference Map cites `red-green-refactor.md` and `coverage-verification.md`, states when to read each, and avoids stale or absolute-path-only references.
**Verification Method:** Check that every reference file exists, is cited from `SKILL.md`, has a bounded purpose, and is not required to understand basic execution.
**Maps To PLAYBOOK Dimension:** D5 Reference Completeness

### REQ-TDE-06: Integration Wiring
**Description:** The skill MUST state how test execution connects to agents, commands, tools, plugin hooks, runtime state, and adjacent skills without assuming a single language or package manager.
**Acceptance Criteria:** Integration guidance names `hm-spec-driven-authoring`, `hm-planning-with-files`, `npm run test:coverage`, `pytest --cov`, `go test ./... -cover`, `runtime-truthful`, and fallback behavior for projects without coverage tooling.
**Verification Method:** Grep for each required integration term and review platform-adaptation notes for Node, Python, Go, and no-coverage-tool projects.
**Maps To PLAYBOOK Dimension:** D6 Integration Wiring

### REQ-TDE-07: Cross-Platform Compatibility
**Description:** The skill MUST provide OpenCode-native, Hivemind harness, and arbitrary user-project adapters for testing commands, coverage tooling, shell behavior, and unavailable test frameworks.
**Acceptance Criteria:** The skill includes adapters for Node/Vitest/Jest, Python/pytest, Go, and a fallback rule that records MISSING/PARTIAL coverage evidence instead of inventing metrics when coverage tooling is absent.
**Verification Method:** Review platform notes and verify every coverage command has an alternate or an honest unavailable-tool reporting path.
**Maps To PLAYBOOK Dimension:** D7 Cross-Platform Compatibility

### REQ-TDE-08: Self-Correction
**Description:** The skill MUST detect invalid RED tests, fake green results, mock-heavy test theater, broken refactors, flaky tests, and unsupported coverage claims, then loop back or escalate with evidence.
**Acceptance Criteria:** The skill defines retry, rollback, blocked, escalation, and handoff behavior for green-before-red, tests that assert trivial truths, failing GREEN, refactor regressions, flaky suites, and coverage commands that cannot run.
**Verification Method:** Run or review eval prompts that simulate invalid RED tests and mock-heavy coverage claims; expected output must reject false completion and require fresh verification evidence.
**Maps To PLAYBOOK Dimension:** D8 Self-Correction

## Integration Contract

`hm-test-driven-execution` must integrate with these surfaces in Phase 27:

| Surface | Contract | Platform-adaptation notes |
|---------|----------|---------------------------|
| `hm-spec-driven-authoring` | Consumes locked REQ-* and acceptance criteria before writing RED tests. | If no spec skill is available, require the user-provided requirement table or produce a blocked handoff. |
| `hm-planning-with-files` | Persists RED/GREEN/REFACTOR status, coverage command output, retry count, and blocked reason. | If unavailable, include a local progress table in the output artifact. |
| `npm run test:coverage` | Preferred Node coverage command when package scripts define it. | If absent, try project-specific test scripts or mark coverage tooling unavailable with evidence. |
| `pytest --cov` | Preferred Python coverage command when pytest-cov is installed. | If absent, use `pytest` for behavioral proof and record coverage as MISSING. |
| `go test ./... -cover` | Preferred Go coverage command. | If module context is missing, run package-level `go test` where available or record blocker. |
| `runtime-truthful` | Required test quality label for tests that exercise real behavior and mock only transport boundaries. | If a project requires mocks, document mock boundary and why it does not hide the behavior under test. |

Fallback rule for projects without coverage tooling: do not estimate coverage. Record `coverage_status: MISSING`, list the unavailable command, provide the behavioral tests that did run, and create a follow-up requirement to install or configure coverage tooling if the project needs coverage metrics.

Agents using this skill must report fresh verification output and cannot claim tests or coverage from stale memory. Commands invoking it must pass target test command, requirement IDs, and allowed retry budget. Plugin hooks may record command output but must not convert failures into green status. Runtime state should preserve phase (`red`, `green`, `refactor`), last command, last output summary, retry count, and handoff instructions.

## Eval Contract

Phase 27 MUST expand the current `1 evals.json only` bundle from trigger-only coverage into behavior validation:

1. Positive trigger query: user asks for test-first implementation or RED/GREEN/REFACTOR execution.
2. Negative trigger query: user asks for manual QA notes or post-hoc test suggestions only.
3. Boundary query: requirements are ambiguous, so the skill should require `hm-spec-driven-authoring` or return blocked before writing RED tests.
4. Stacked scenario: derive requirements with `hm-spec-driven-authoring`, persist progress with `hm-planning-with-files`, execute a runtime-truthful RED/GREEN/REFACTOR flow, and verify coverage using the correct project adapter.
5. Failure scenario: a RED test passes before implementation; expected behavior is STOP and rewrite the test.
6. Coverage scenario: coverage tooling is absent; expected behavior is MISSING/PARTIAL evidence, not invented percentages.

Each eval must include expected behavior, failure signals, and evidence output shape. File existence alone is not sufficient proof.

## Verification Commands

```bash
test -f .opencode/skills/hm-test-driven-execution/SKILL.md
grep -n "Red Phase\|Green Phase\|Refactor Phase\|Coverage Claims" .opencode/skills/hm-test-driven-execution/SKILL.md
test -f .opencode/skills/hm-test-driven-execution/evals/evals.json
grep -n "trigger_queries\|stacked_scenario" .opencode/skills/hm-test-driven-execution/evals/evals.json
grep -n "runtime-truthful\|npm run test:coverage\|pytest --cov\|go test ./... -cover" .opencode/skills/hm-test-driven-execution/SKILL.md
```

Phase 26 artifact verification:

```bash
test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md
grep -q "REQ-TDE-08" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md
test $(grep -c "Acceptance Criteria" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md) -ge 8
```

## Phase 27 Execution Notes

- Phase 27 may mutate `.opencode/skills/hm-test-driven-execution/**`; Phase 26 does not.
- Start by scoring the current skill against D1-D8 using this SPEC and `26-PLAYBOOK.md`.
- Preserve the current RED/GREEN/REFACTOR skeleton but expand it with runtime-truthful testing guidance, language adapters, coverage fallback behavior, evals, integration notes, and self-correction.
- Do not claim `SUBSTANTIVE` or `EXEMPLAR` until all REQ-TDE-01 through REQ-TDE-08 acceptance criteria have current evidence.
