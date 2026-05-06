# G-B SPEC: hm-spec-driven-authoring

## Current State

`hm-spec-driven-authoring` is a Phase 20 G-B skill package that currently exists but remains a THIN-tier contract source rather than a quality-complete skill. Current package facts: `107 LOC`, `2 references`, `1 evals.json only`, `THIN tier`, `no stacked eval scenario`, and `Phase 26 does not mutate SKILL.md`.

Evidence basis:
- `26-CONTEXT.md` identifies G-B as the first demonstration wave and locks Phase 26 as read-only synthesis.
- `26-RESEARCH.md` reports the skill as 107-line, two-reference, one-eval, no-stacked-scenario current state.
- `26-ECOLOGY-AUDIT.md` classifies `hm-spec-driven-authoring` as `THIN` with D1-D8 quality still open.
- `26-PLAYBOOK.md` defines D1-D8 as the quality gate for all future hm-/hivefiver-* skill work.

## Target State

By Phase 27 completion, `hm-spec-driven-authoring` must be a standalone-superior spec-to-requirement authoring skill that works in OpenCode-native sessions, Hivemind harness sessions, and arbitrary user projects without depending on GSD being installed. It must produce falsifiable requirements, acceptance criteria, verification methods, integration notes, and evidence records that satisfy PLAYBOOK D1-D8.

Phase 27 target tier: `SUBSTANTIVE` minimum, `EXEMPLAR` preferred if stacked eval evidence and integration proof are completed.

## Requirements

### REQ-SDA-01: Trigger Accuracy
**Description:** The skill MUST activate only for specification-to-requirement, acceptance-test derivation, PRD-to-contract, or implementation-compliance tasks, and MUST exclude exploratory coding or unscoped prototyping.
**Acceptance Criteria:** The skill package contains positive trigger examples, negative trigger examples, and an explicit boundary against `hm-test-driven-execution`, `hm-planning-with-files`, and generic planning/debugging workflows.
**Verification Method:** Inspect `SKILL.md` and eval bundle for positive and negative trigger cases; run a trigger eval where spec-to-requirement prompts load the skill and exploratory coding prompts do not.
**Maps To PLAYBOOK Dimension:** D1 Trigger Accuracy

### REQ-SDA-02: Body Depth
**Description:** The skill body MUST define entry conditions, spec-lock workflow, requirement extraction, ambiguity rejection, acceptance-test derivation, exit criteria, and blocked-state handoff guidance.
**Acceptance Criteria:** `SKILL.md` includes sections for entry gate, pipeline steps, decision gates, anti-patterns, exit criteria, and handoff when requirements cannot be made falsifiable.
**Verification Method:** Grep for entry/exit/gate/handoff headings and manually review that each section contains operational instructions rather than concept-only prose.
**Maps To PLAYBOOK Dimension:** D2 Body Depth

### REQ-SDA-03: 6-NON Defence
**Description:** The skill MUST defend against non-audit, non-contextual, non-cycles, non-hierarchy, non-ecosystem-eval, and non-systematic-pattern failures with cited evidence or explicit workflow gates.
**Acceptance Criteria:** A future audit record can score NON-1 through NON-6 as DEFENDED or document the exact remaining PARTIAL/FAIL evidence with owner and remediation phase.
**Verification Method:** Compare the skill body, references, evals, and scripts against the Phase 18 6-NON criteria and record one evidence note per NON mode.
**Maps To PLAYBOOK Dimension:** D3 6-NON Defence

### REQ-SDA-04: Eval Coverage
**Description:** The skill MUST include eval coverage for isolated trigger behavior and at least one stacked scenario involving spec derivation followed by test-driven execution planning.
**Acceptance Criteria:** `evals/evals.json` includes positive trigger queries, negative trigger queries, assertion criteria, and a `stacked_scenario` that exercises `hm-spec-driven-authoring` with `hm-test-driven-execution` and `hm-planning-with-files`.
**Verification Method:** Inspect eval JSON for `trigger_queries`, negative cases, assertions, and `stacked_scenario`; run or manually grade the eval and record the result.
**Maps To PLAYBOOK Dimension:** D4 Eval Coverage

### REQ-SDA-05: Reference Completeness
**Description:** The skill MUST keep references one level deep, cited from the body, and sufficient to support spec-to-requirement mapping and acceptance-test patterns without replacing the body workflow.
**Acceptance Criteria:** The Reference Map cites `spec-to-req-mapping.md` and `acceptance-test-patterns.md`, states when to read each, and avoids stale or absolute-path-only references.
**Verification Method:** Check that every reference file exists, is cited from `SKILL.md`, has a bounded purpose, and is not required to understand basic execution.
**Maps To PLAYBOOK Dimension:** D5 Reference Completeness

### REQ-SDA-06: Integration Wiring
**Description:** The skill MUST state how spec artifacts connect to agents, commands, tools, plugin hooks, and runtime state without assuming every surface exists in every user project.
**Acceptance Criteria:** Integration guidance names `hm-test-driven-execution`, `hm-planning-with-files`, `prompt-skim`, and `prompt-analyze`; it also states agent role boundaries, command argument handling, plugin hook fact-reporting behavior, and runtime-state evidence expectations.
**Verification Method:** Grep for the four required integration names plus agent/command/tool/plugin/runtime state notes; review each for platform-adaptation guidance.
**Maps To PLAYBOOK Dimension:** D6 Integration Wiring

### REQ-SDA-07: Cross-Platform Compatibility
**Description:** The skill MUST work in OpenCode-native environments, Hivemind harness environments, and arbitrary user projects with different languages, frameworks, shells, and planning systems.
**Acceptance Criteria:** The skill includes OpenCode-native notes, Hivemind harness notes, and generic fallback guidance for projects without `.planning/`, GSD commands, Node tooling, or repo-specific paths.
**Verification Method:** Review platform notes and verify every command or artifact assumption has an adapter or fallback explanation.
**Maps To PLAYBOOK Dimension:** D7 Cross-Platform Compatibility

### REQ-SDA-08: Self-Correction
**Description:** The skill MUST detect vague, untestable, contradictory, or over-broad requirements and either loop back to clarify or return a blocked handoff with evidence.
**Acceptance Criteria:** The skill defines retry, rewrite, escalation, and blocked-state behavior for vague specs, missing acceptance criteria, green-before-red test design, and impossible verification methods.
**Verification Method:** Inspect self-correction guidance and run an eval prompt containing vague requirements; expected output must reject ambiguity instead of inventing false precision.
**Maps To PLAYBOOK Dimension:** D8 Self-Correction

## Integration Contract

`hm-spec-driven-authoring` must integrate with these surfaces in Phase 27:

| Surface | Contract | Platform-adaptation notes |
|---------|----------|---------------------------|
| `hm-test-driven-execution` | Receives derived acceptance tests and RED/GREEN/REFACTOR expectations after spec requirements are locked. | If unavailable, output a neutral test-plan section with language-specific command placeholders. |
| `hm-planning-with-files` | Persists requirement IDs, acceptance criteria, status, and progress evidence for multi-session work. | If unavailable, write a local requirements table in the requested artifact and include resume instructions. |
| `prompt-skim` | Quickly detects spec length, URLs, missing paths, and candidate ambiguity before deep requirement extraction. | If unavailable, perform manual skim and document that the tool was unavailable. |
| `prompt-analyze` | Identifies contradictions, vagueness, missing scope, and clarity signals before locking requirements. | If unavailable, apply the same checks manually and cite the review method. |

Agents that load this skill must know whether they are authoring a contract, verifying implementation against a contract, or deriving acceptance tests. Commands invoking it must parse `$ARGUMENTS` into artifact path, reader, and target post-read action before writing. Plugin hooks may suggest or record the skill but must report facts rather than silently rewriting requirements. Runtime state should preserve requirement IDs, verification commands, and blocked reasons across compaction or handoff.

## Eval Contract

Phase 27 MUST expand the current `1 evals.json only` bundle from trigger-only coverage into a behavior-validating bundle:

1. Positive trigger query: PRD/spec input requires REQ-* extraction.
2. Negative trigger query: exploratory implementation request should not load this skill.
3. Boundary query: request asks for TDD execution after requirements already exist, so the skill should hand off to `hm-test-driven-execution`.
4. Stacked scenario: use `hm-spec-driven-authoring` to derive REQ-* items, then use `hm-test-driven-execution` to define RED/GREEN verification expectations, while `hm-planning-with-files` persists progress.

Each eval must define expected behavior and failure signals. File existence alone is not sufficient proof.

## Verification Commands

```bash
test -f .opencode/skills/hm-spec-driven-authoring/SKILL.md
grep -n "REQ-\|Acceptance Criteria\|Verification Method" .opencode/skills/hm-spec-driven-authoring/SKILL.md .opencode/skills/hm-spec-driven-authoring/references/*.md
test -f .opencode/skills/hm-spec-driven-authoring/evals/evals.json
grep -n "trigger_queries\|stacked_scenario" .opencode/skills/hm-spec-driven-authoring/evals/evals.json
grep -n "prompt-skim\|prompt-analyze\|hm-test-driven-execution\|hm-planning-with-files" .opencode/skills/hm-spec-driven-authoring/SKILL.md
```

Phase 26 artifact verification:

```bash
test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md
grep -q "REQ-SDA-08" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md
test $(grep -c "Acceptance Criteria" .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md) -ge 8
```

## Phase 27 Execution Notes

- Phase 27 may mutate `.opencode/skills/hm-spec-driven-authoring/**`; Phase 26 does not.
- Start by scoring the current skill against D1-D8 using this SPEC and `26-PLAYBOOK.md`.
- Preserve the current useful skeleton but expand it into a standalone-superior workflow with trigger boundaries, ambiguity scoring, evals, integration notes, and self-correction.
- Do not claim `SUBSTANTIVE` or `EXEMPLAR` until all REQ-SDA-01 through REQ-SDA-08 acceptance criteria have current evidence.
