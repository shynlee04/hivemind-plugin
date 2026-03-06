# Hivefiver Cross-Cutting Routing And Continuity Plan

Date: 2026-03-06
Status: active-cross-cutting-plan
Type: cross-cutting-phase-plan

## Purpose

This plan governs the concerns that must remain shared across all `hivefiver` lane families.

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

## Validation Expectations

- do not create new state stores
- do not flatten `hivefiver` and `hiveminder`
- do not let transitional continuity artifacts override planning-root control
- do not claim runtime features exist where only planning targets exist

## Approval Gate

User approval is required before any lane-local planning treats these cross-cutting rules as active policy.

## Non-Goals

- no implementation details
- no permission edits
- no command or workflow mutations
