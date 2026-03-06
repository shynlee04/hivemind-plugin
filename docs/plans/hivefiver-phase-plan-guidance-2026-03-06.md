# Hivefiver Guidance Lane Phase Plan

Date: 2026-03-06
Status: active-lane-plan
Type: lane-family-phase-plan

## Purpose

This plan defines the guidance lane as the non-mutating operator-facing lane.

## Use When

- the user needs understanding before change
- the best next step is capability framing, mechanism choice, or safe route explanation
- the lane should stop without mutation if explanation resolves the need

## Scope

- guidance-only framing
- route recommendation
- stop-without-mutation conditions
- handoff-to-other-lane criteria

## Required Outputs

- capability framing
- recommended next lane
- explicit stop condition
- escalation rule if guidance reveals hidden instability

## Validation Expectations

- guidance must not silently become build or repair planning
- if contamination or instability is revealed, the output must route back to diagnose
- explanations should adapt by user-awareness level without changing the underlying gate existence

## Approval Gate

User approval is required before turning a guidance result into a mutation-capable lane plan.

## Non-Goals

- no fixes
- no package creation
- no hidden continuity authority
