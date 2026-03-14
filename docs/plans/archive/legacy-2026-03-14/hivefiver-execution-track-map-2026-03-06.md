# Hivefiver Execution Track Map

Date: 2026-03-06
Status: active-local-track-map
Type: execution-track-map

## Purpose

This document turns the current `hivefiver` module architecture into a local high-level track map.

It does not authorize implementation by itself.
It exists so returned external synthesis can be reconciled into a stable execution shape instead of becoming another disconnected packet.

## Track Set

The reconciled `hivefiver` execution map has five tracks:

1. Doctor and diagnosis
2. Repair and refactor
3. Tailored build and package creation
4. Guidance and operator enablement
5. Package composition and chained-stack design

This is a reconciled planning update, not a claim that all lane-specific behaviors are already implemented in code.

## Track Matrix

| Track | Primary Trigger | First Action | Typical Outputs | Approval Gate Before Mutation |
|---|---|---|---|---|
| Doctor and diagnosis | something is wrong but root cause is unclear | truth audit | audit note, grouped hypotheses, ranked routes | user agrees on the likely route |
| Repair and refactor | framework assets are broken, polluted, or need controlled extension | bound the damage, compatibility, and rollback surface | recovery plan, tranche route, rollback gate, validation checklist | user approves stabilize-versus-extend route |
| Tailored build and package creation | user wants a new domain- or team-specific meta package | clarify intent and package topology | capability brief, package scope, spec-driven plan | user approves package scope and success criteria |
| Guidance and operator enablement | user needs understanding before mutation | explain mechanism and route choices | operator guide, next-step route, non-goals | stop if guidance alone solves the need |
| Package composition and chained-stack design | multiple framework surfaces must work together | map ownership and integration order | composition map, ownership boundaries, integration order | user approves composition boundaries and order |

## Adaptation Rules

### By User-Awareness Level

- Guided:
  - use smaller route choices
  - define terms earlier
  - bias toward diagnosis and guidance before mutation
- Practitioner:
  - present tradeoffs directly
  - allow faster movement into refactor or build planning
- Advanced:
  - compress explanation
  - emphasize architecture, blast radius, and verification

### By Package Topology

- Singular:
  - prefer one-track execution when possible
- Paired:
  - require explicit dependency notes
- Stacked:
  - require tranche ordering
- Chained:
  - require composition-first planning and stronger continuity artifacts

Current repo truth:

- dependency-aware continuity already exists in schemas and graph relationships
- explicit topology fields and topology-specific intake routing remain planning work, not landed implementation

## Hard Routing Rules

- If root cause is unclear, doctor track outranks all others.
- If framework surfaces are already broken, repair track outranks tailored build.
- If the user’s need is understanding rather than change, guidance track should be allowed to stop without mutation.
- If work spans multiple packages or surfaces, composition track should frame the order before any local implementation track begins.
- If a request crosses lineage or runtime boundaries, split the work before implementation.

Current repo truth:

- these rules are the reconciled planning target
- some supporting signals already exist in governance and workflow surfaces
- the full hard-block routing matrix is not yet fully programmatic

## Recommended Next Planning Artifacts

Because the external synthesis has now been validated and reconciled, the next planning layer should likely be:

- one approval-gated phase plan per major lane family
- one verification contract per mutation-capable track
- one continuity template for doctor/repair outputs
- one routing-and-topology plan that stays planning-only until separately approved

## Non-Goals

- no implementation details here
- no direct command/plugin/tool design yet
- no new authority surfaces
- no collapse of track outputs into one generic workflow
