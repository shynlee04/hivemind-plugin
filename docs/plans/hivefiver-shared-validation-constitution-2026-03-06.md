# Hivefiver Shared Validation Constitution

Date: 2026-03-06
Status: active-constitution
Type: cross-cutting-validation-constitution

## Purpose

Define the shared proof standard that every later `hivefiver` lane plan must use before claiming readiness, promotion, or implementation eligibility.

## Base Constitution

Every later lane-local plan must prove:

1. repo-truth alignment
2. March 6 authority-split compliance
3. continuity-precedence compliance
4. runtime-vs-planning separation discipline
5. lineage-boundary compliance
6. explicit approval gate before implementation-adjacent promotion

## Evidence Baseline

At minimum, later lane plans must cite:

- one or more code-backed runtime files when describing current behavior
- one or more planning-root files when describing current planning policy
- one mismatch note whenever the plan depends on planning-target guidance rather than landed runtime behavior

## Shared Gate Set

| Gate | What It Proves |
|---|---|
| Repo-truth gate | Current runtime description matches code-backed surfaces |
| Authority gate | No contradiction with the locked March 6 authority split |
| Continuity gate | Active planning-root precedence is preserved |
| Lineage gate | `hivefiver` and `hiveminder` scopes are not flattened |
| Planning-target gate | Future-facing items are clearly marked as not yet landed |
| Approval gate | No mutation-adjacent phase proceeds without explicit user approval |

## Shared Failure Conditions

A lane-local plan fails this constitution if it:

- claims an unlanded runtime feature as current truth
- treats transitional handoff artifacts as primary control
- contradicts plugin enforcement with profile-only wording
- introduces a second routing or continuity constitution
- implies a new state store or new continuity registry

## Promotion Rule

Completion of a lane-local planning cycle does not automatically promote its outputs into implementation policy.

Promotion requires:

1. explicit approval
2. active cycle closure recorded in the planning root
3. downstream plan references updated to the promoted output

## Verification Expectations

For planning-only batches, use:

- `git diff --check`
- clean worktree review for the planning batch

For any future implementation-adjacent batch, layer the current repo verification gates back on top:

- `npx tsc --noEmit`
- targeted suites for the touched runtime area
