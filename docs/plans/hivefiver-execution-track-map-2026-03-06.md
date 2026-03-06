# Hivefiver Execution Track Map

Date: 2026-03-06
Status: active-local-track-map
Type: execution-track-map

## Purpose

This document turns the current `hivefiver` module architecture into a local high-level track map.

It does not authorize implementation by itself.
It exists so returned external synthesis can be reconciled into a stable execution shape instead of becoming another disconnected packet.

## Track Set

The current `hivefiver` execution map has six tracks:

1. Doctor and diagnosis
2. Repair and recovery
3. Tailored build and package creation
4. Refactor and extension
5. Guidance and operator enablement
6. Package composition and chained-stack design

## Track Matrix

| Track | Primary Trigger | First Action | Typical Outputs | Approval Gate Before Mutation |
|---|---|---|---|---|
| Doctor and diagnosis | something is wrong but root cause is unclear | truth audit | audit note, grouped hypotheses, ranked routes | user agrees on the likely route |
| Repair and recovery | framework assets are broken or polluted | bound the damage and rollback surface | recovery plan, rollback gate, validation checklist | user approves staged repair path |
| Tailored build and package creation | user wants a new domain- or team-specific meta package | clarify intent and package topology | capability brief, package scope, spec-driven plan | user approves package scope and success criteria |
| Refactor and extension | existing meta package needs to evolve | scope dependency and compatibility risk | tranche map, compatibility notes, verification path | user approves the tranche order |
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

## Hard Routing Rules

- If root cause is unclear, doctor track outranks all others.
- If framework surfaces are already broken, repair track outranks tailored build.
- If the user’s need is understanding rather than change, guidance track should be allowed to stop without mutation.
- If work spans multiple packages or surfaces, composition track should frame the order before any local implementation track begins.
- If a request crosses lineage or runtime boundaries, split the work before implementation.

## Recommended Next Planning Artifacts

If the Devin answer validates the current direction, the next planning layer should likely be:

- one approval-gated plan per major track family
- one verification contract per mutation-capable track
- one continuity template for doctor/repair outputs

## Non-Goals

- no implementation details here
- no direct command/plugin/tool design yet
- no new authority surfaces
- no collapse of track outputs into one generic workflow
