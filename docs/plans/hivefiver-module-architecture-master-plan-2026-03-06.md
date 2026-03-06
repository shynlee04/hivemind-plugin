# Hivefiver Module Architecture Master Plan

Date: 2026-03-06
Status: active-lineage-planning
Type: lineage-module-master-plan
Scope: second-lineage `hivefiver` module hierarchy, workflow routing, and adaptive operating model

## Purpose

This document defines the next high-level planning frame for `hivefiver` as the second lineage.

It does not turn `hivefiver` into a generic assistant.
It keeps `hivefiver` as the framework-facing module that can diagnose, repair, refactor, create, tailor, guide, and evolve meta-framework surfaces across the full project lifecycle.

This is an orchestration plan, not an implementation specification.
Each later cycle still requires explicit user authorization before execution.

## Why This Module Needs Its Own Architecture

`hivefiver` work can start at any stage:

- day-zero bootstrap
- mid-project correction
- late-stage long-haul recovery
- operator education and repair
- multi-package framework expansion

That means the module cannot be routed by one dimension only.
It has to adapt to:

- project stage
- industry or domain pressure
- user technology awareness
- package topology
- risk surface

## Core Module Identity

`hivefiver` is the lineage for framework-facing meta work:

- diagnose true issues in framework or meta-package behavior
- repair broken or misconfigured `.opencode/**` surfaces
- design tailored meta packages from user intent
- refactor or extend existing commands, agents, skills, workflows, tools, and plugins
- guide users who do not yet know how to use or fix framework surfaces
- sequence validation and continuity so the work remains resumable

`hivefiver` is not the lineage for undifferentiated product implementation.

## Hierarchy

The module should be organized in this hierarchy:

1. Intake and Clarification
Reason:
establish the user’s real intent, project stage, package scope, risk level, and skill level before acting

2. Truth Audit and Doctor Pass
Reason:
confirm what is actually broken, missing, polluted, or only misunderstood

3. Routing and Track Selection
Reason:
choose the correct work lane instead of collapsing everything into one generic “build” flow

4. Work Lanes
Lanes:
- Doctor and diagnosis
- Repair and recovery
- Tailored build and package creation
- Refactor and extension
- Guidance and operator enablement
- Package composition and chained-stack design

5. Validation and Continuity
Reason:
record the chosen lane, evidence, boundaries, and stop conditions so later sessions do not have to reconstruct the logic

## Adaptive Routing Dimensions

Every `hivefiver` request should be classified along these dimensions:

- Project stage:
  - bootstrap
  - active build
  - midstream correction
  - recovery
  - long-haul maintenance
- User technology awareness:
  - guided
  - practitioner
  - advanced
- Package topology:
  - singular
  - paired
  - stacked
  - chained
- Risk surface:
  - planning/docs only
  - `.opencode/**` framework assets
  - cross-domain runtime and framework overlap
- Request archetype:
  - diagnose
  - repair
  - create
  - refactor
  - guide
  - compose

## Workflow Families

### Family 1: Doctor and Diagnosis

Use when:

- user knows something is wrong but not what
- `.opencode/**` or workflow behavior is degraded
- symptoms are noisy and root cause is unclear

Output shape:

- truth audit
- failure grouping
- bounded remediation routes

### Family 2: Repair and Recovery

Use when:

- framework assets were broken or misconfigured
- user “messed up” `.opencode/**`
- continuity or workflow artifacts are poisoning later work

Output shape:

- recovery plan
- staged repair route
- regression and rollback gates

### Family 3: Tailored Build and Package Creation

Use when:

- user wants new custom agents, commands, workflows, tools, plugins, or documentation surfaces
- the target is domain-specific, such as marketing, research, operations, or platform teams

Output shape:

- clarified intent
- package topology decision
- spec-driven plan
- TDD-oriented execution path

### Family 4: Refactor and Extension

Use when:

- existing meta packages need to be expanded, hardened, or realigned
- one package has grown into a multi-package concern

Output shape:

- refactor scope map
- dependency-aware tranche plan
- compatibility and migration notes

### Family 5: Guidance and Operator Enablement

Use when:

- user does not know how to use a surface
- user needs help choosing the right framework mechanism
- the best result is a guided route before mutation

Output shape:

- capability framing
- recommended route
- safe next-step sequence

### Family 6: Package Composition and Chained-Stack Design

Use when:

- the work spans multiple packages or meta surfaces
- the solution combines commands, skills, workflows, agents, tools, or plugins

Output shape:

- composition map
- ownership boundaries
- integration and verification order

## Edge-Case Handling

Special routing pressure exists when:

- user asks for a “quick fix” but the issue spans multiple surfaces
- user wants a package but really needs diagnosis first
- user is low-awareness but the requested change is high-risk
- work crosses `.opencode/**` and runtime/core boundaries
- the project is already long-haul and continuity surfaces are polluted

In those cases, `hivefiver` should prefer:

- intake plus diagnosis before mutation
- narrower staged planning
- stronger verification and rollback language
- explicit handoff and stop conditions

## Cycle Plan

### Cycle 1: Module Routing Finalization

Goal:

- settle the hierarchy and workflow families
- define how the module adapts to user-awareness and package topology

### Cycle 2: Planning-Root Integration

Goal:

- place the `hivefiver` hierarchy into canonical planning-root structures
- ensure phase, research, debug, and verification artifacts can carry the module cleanly

### Cycle 3: Execution-Track Mapping

Goal:

- define which work family leads to which planning/execution pattern
- keep doctor, repair, create, refactor, guidance, and composition tracks distinct

### Cycle 4: Later Implementation Planning

Goal:

- reopen module-specific implementation only after the routing and workflow hierarchy are accepted

## Success Condition

This module plan is successful when:

- `hivefiver` no longer exists only as a broad healer label
- real-world use cases have explicit routing
- user skill level and project complexity affect workflow selection in a controlled way
- package creation, repair, diagnosis, and guidance are treated as distinct but compatible lanes
- later sessions can resume the module logic without reconstructing it from broad context
