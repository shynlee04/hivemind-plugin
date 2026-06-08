# Source Synthesis for Test-Driven Execution

## Purpose

Read this when auditing provenance, explaining why this skill enforces a specific TDD discipline, or checking the RICH gate. It records inspected third-party decisions without requiring any external skill package at runtime.

## Inspected Sources and Decisions

| Source | Materials reviewed in Phase 27 research | Decision | Transformation in this package |
|---|---|---|---|
| `addyosmani/agent-skills@test-driven-development` | GitHub target directory and raw `SKILL.md`; target had `SKILL.md` only. | Adopt/adapt. | Adopt Prove-It bug-fix pattern, test pyramid/size model, state-over-interactions, DAMP readability, real/fake/stub/mock preference, runtime/browser verification caution. |
| `helderberto/skills@tdd` | skills.sh page, GitHub package with `SKILL.md` and references including `principles.md`, `examples.md`, `deep-modules.md`, `interface-design.md`, `refactoring.md`; inspected principles/examples. | Adopt. | Adopt one-test-at-a-time loop, public-interface discipline, mocks only at boundaries, refactor only after green, and testability checkpoint. |
| `jellydn/my-ai-tools@tdd` | skills.sh page, GitHub skill directory with `SKILL.md` and `templates/test-template.md`. | Adapt/reject partial. | Adapt action/state vocabulary and portable test-template idea; reject hard-coded command wrapper assumptions. |

## Adopted Professional Patterns

1. **Prove-It before fixing bugs:** reproduction evidence is the RED phase for defect work.
2. **One test at a time:** each test drives the next minimal implementation step.
3. **Public interface first:** tests prove externally observable behavior, not private helper trivia.
4. **State over interactions:** assert outcomes before mock call counts unless interaction is the behavior.
5. **DAMP over DRY:** clarity in tests is more important than eliminating all repetition.
6. **Honest boundaries:** mock at transports/clocks/external services; label mock-heavy evidence as limited.

## Rejected or Deferred Patterns

| Pattern | Reason |
|---|---|
| Direct slash-command TDD state machine | Not portable across arbitrary OpenCode projects. Use workflow/state tables instead. |
| Mandatory browser/devtools verification | Useful when UI/browser behavior is in scope, but not every project has browser tooling. |
| Coverage percentage as completion proof | Coverage is supplementary; invalid RED or missing behavior remains blocked. |

## Independence Audit

This skill must run in arbitrary projects by detecting the project runner (`npm`, `pytest`, `go test`, or documented equivalent). If no runner exists, return `blocked-tooling` or `manual-only` evidence. Do not assume Node, `.planning/`, GSD, BMAD, OMO, Spec-kit, or this repository paths.
