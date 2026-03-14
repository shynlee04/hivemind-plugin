# Hivefiver Diagnose Lane Phase Plan

Date: 2026-03-06
Status: completed-lane-plan
Type: lane-family-phase-plan

## Purpose

This plan defines the diagnosis lane as the evidence-first entry lane for unstable, unclear, or polluted framework situations.

## Use When

- root cause is unclear
- framework assets appear broken or contradictory
- user asks for a quick fix without enough stable context
- continuity or authority confusion may be masking the real problem

## Scope

- truth audit framing
- contradiction grouping
- remediation route recommendation
- stop conditions before mutation
- application of the promoted cross-cutting routing, continuity, and validation constitutions

## Shared Inputs

- `.hivemind/project/planning/phases/01-hivefiver-module/01-14-PLAN.md`
- `docs/plans/hivefiver-routing-precedence-model-2026-03-06.md`
- `docs/plans/hivefiver-continuity-precedence-model-2026-03-06.md`
- `docs/plans/hivefiver-runtime-vs-planning-matrix-2026-03-06.md`
- `docs/plans/hivefiver-shared-validation-constitution-2026-03-06.md`
- `docs/plans/hivefiver-cross-cutting-mismatch-register-2026-03-06.md`

## Inheritance Rule

This lane inherits the promoted cross-cutting constitutions as shared policy.

It must not re-litigate those constitutions locally.
It must separate landed runtime truth from planning-target guidance in every output.
It must include code-backed runtime evidence and mismatch notes where later lanes could otherwise overstate current behavior.

## Required Outputs

- verified situation summary
- contradiction register
- ranked remediation routes
- diagnosis stop/continue decision

## Completed Outputs

- `docs/plans/hivefiver-diagnose-verified-situation-summary-2026-03-07.md`
- `docs/plans/hivefiver-diagnose-contradiction-register-2026-03-07.md`
- `docs/plans/hivefiver-diagnose-ranked-remediation-routes-2026-03-07.md`
- `docs/plans/hivefiver-diagnose-stop-or-promote-decision-2026-03-07.md`

## Validation Expectations

- claims must separate verified, inferred, and proposed
- diagnosis must stop if evidence remains too weak for a mutation-capable lane
- outputs must be usable by repair/refactor or build planning without re-auditing from scratch

## Approval Gate

User approval is required before promoting diagnosis output into any later lane-family planning cycle.

The next approval gate is now `.hivemind/project/planning/phases/01-hivefiver-module/01-15-PLAN.md`.

## Non-Goals

- no fixes
- no workflow mutations
- no direct implementation planning
