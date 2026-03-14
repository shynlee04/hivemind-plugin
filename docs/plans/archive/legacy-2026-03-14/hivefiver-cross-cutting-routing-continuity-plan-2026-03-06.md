# Hivefiver Cross-Cutting Routing And Continuity Plan

Date: 2026-03-06
Status: completed-cross-cutting-plan
Type: cross-cutting-phase-plan

## Purpose

This plan governs the active cross-cutting planning cycle for the concerns that must remain shared across all `hivefiver` lane families.

It exists to stop every lane from inventing its own routing, continuity, and precedence model.

## Scope

- project stage routing
- user-awareness adaptation
- package topology handling
- lineage-boundary handling
- runtime-vs-planning mismatch handling
- continuation precedence
- transitional continuity classification
- lane-family validation constitution

## Multi-Round Structure

This cycle should be handled in four planning rounds:

1. Authority and continuation precedence
2. Runtime-truth versus planning-target separation
3. Shared routing constitution
4. Shared validation constitution

Each round remains high level and must not slip into implementation detail.

## Why This Is First

The current repo still has cross-cutting mismatches that affect every lane:

- runtime delegation enforcement is stricter than some agent-profile docs
- runtime persona selection is lighter than the richer persona skill model
- planning-root control is now primary, but older continuity artifacts still exist
- topology is accepted as a planning dimension but not yet explicit runtime routing truth

## Required Outputs

- routing precedence model
- continuity precedence model
- runtime-truth versus planning-target matrix
- lane-family validation constitution
- unresolved mismatch register
- lane-activation readiness criteria

## Completed Outputs

- `docs/plans/hivefiver-routing-precedence-model-2026-03-06.md`
- `docs/plans/hivefiver-continuity-precedence-model-2026-03-06.md`
- `docs/plans/hivefiver-runtime-vs-planning-matrix-2026-03-06.md`
- `docs/plans/hivefiver-shared-validation-constitution-2026-03-06.md`
- `docs/plans/hivefiver-cross-cutting-mismatch-register-2026-03-06.md`
- `docs/plans/hivefiver-lane-activation-readiness-2026-03-06.md`

## Validation Expectations

- do not create new state stores
- do not flatten `hivefiver` and `hiveminder`
- do not let transitional continuity artifacts override planning-root control
- do not claim runtime features exist where only planning targets exist

## Approval Gate

User approval was provided to activate this cross-cutting planning cycle.
Further user approval is required before any later lane-local planning treats its outputs as promoted shared policy and activates the next lane-family cycle.

## Non-Goals

- no implementation details
- no permission edits
- no command or workflow mutations
- no lane-local duplication of shared rules
