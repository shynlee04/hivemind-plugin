# Hivefiver Use-Case Routing Matrix

Date: 2026-03-06
Status: active-routing-matrix
Type: lineage-routing-matrix

## Purpose

This matrix gives the second-lineage `hivefiver` module a practical routing surface for real-world framework work.

It is intentionally high level.
It should guide classification and planning, not replace later cycle-specific plans.

## Routing Dimensions

Every request should be classified by:

- request archetype
- project stage
- user technology awareness
- package topology
- risk surface

## Primary Matrix

| Use Case | Typical Trigger | Recommended First Lane | Common Topology | User-Awareness Adjustment | Stop Condition Before Execution |
|---|---|---|---|---|---|
| Intent unclear / user unsure | “I need this to work but I don’t know how” | Intake and clarification | singular or unknown | guided path, smaller steps, earlier clarification | route is explicit and risk surface is identified |
| Something is broken | `.opencode/**`, commands, skills, workflows, or plugins behave incorrectly | Doctor and diagnosis | singular, paired, or stacked | guided users get more explanation, advanced users get tighter evidence summary | root-cause hypotheses and repair options are ranked |
| User messed up framework assets | misconfiguration, accidental overwrite, continuity poisoning | Repair and refactor | paired or stacked | guided users get safer rollback framing | recovery boundary and rollback gate are defined |
| Need a custom meta package | agents, commands, tools, plugins, workflows, or docs tailored to a team/domain | Tailored build and package creation | singular, paired, or chained | low-awareness users need capability framing before planning | package scope and verification expectations are explicit |
| Existing meta package must evolve | extension, hardening, cleanup, domain expansion | Repair and refactor | paired, stacked, or chained | advanced users may skip capability framing and go straight to tranche planning | dependency map and compatibility risks are explicit |
| Need to know how to use a surface | onboarding, choosing mechanism, understanding tool/plugin/command patterns | Guidance and operator enablement | singular | guided path with examples and progressive disclosure | operator can choose a next action intentionally |
| Multi-surface ecosystem design | combined agents + commands + workflows + tools + plugins | Package composition and chained-stack design | stacked or chained | higher complexity requires stronger tranche sequencing regardless of user level | ownership and integration order are explicit |
| Cross-domain or restricted risk | `.opencode/**` and runtime/core overlap, or regulated/high-risk domain | Truth audit before any lane-specific mutation | stacked or chained | all user levels get stricter evidence and rollback framing | cross-domain blast radius is bounded |

## Project-Stage Adaptation

| Project Stage | Hivefiver Bias |
|---|---|
| Bootstrap | favor intent clarification, package topology choice, and safe initial design |
| Active build | favor extension and composition without losing continuity |
| Midstream correction | favor diagnosis before build |
| Recovery | favor doctor and repair lanes before any expansion |
| Long-haul maintenance | favor continuity discipline, tranche planning, and selective refactor |

## User-Awareness Adaptation

| User Level | Workflow Bias |
|---|---|
| Guided | explain options, narrow choices, clarify terminology, avoid premature mutation |
| Practitioner | provide tradeoffs, structured routes, and bounded execution plans |
| Advanced | compress explanation, emphasize architecture boundaries, verification, and integration risks |

## Package-Topology Adaptation

| Topology | Typical Need | Workflow Bias |
|---|---|---|
| Singular | one package or one surface | simplest lane with minimal orchestration |
| Paired | two linked surfaces | explicit dependency notes before execution |
| Stacked | several coordinated surfaces | tranche planning and validation gates |
| Chained | long interdependent meta-package system | composition-first planning and stronger continuity artifacts |

## Edge Cases

- Quick-fix request with unclear root cause:
  start in doctor lane, not build lane.
- User asks for a new package but the current framework is already broken:
  repair route outranks tailored build.
- Guided user asks for a high-risk cross-domain change:
  require clarification and a bounded route before implementation.
- Advanced user wants a broad ecosystem refactor:
  still require package-topology mapping and tranche ordering.
- Industry domain adds strong compliance or operational pressure:
  increase validation, documentation, and rollback planning before execution.

## Reconciled Note

This matrix now follows the reconciled five-lane model validated in `docs/plans/hivefiver-devin-reconciliation-2026-03-06.md`.

That means:

- repair and refactor are intentionally merged
- topology remains a routing dimension
- diagnosis-first remains the preferred route when framework stability is unclear

It does not mean topology-aware intake fields or full hard-block routing are already implemented.

## Non-Goals

- This matrix does not define implementation internals.
- This matrix does not override the March 6 authority split.
- This matrix does not create a new state store or continuity authority.
- This matrix does not merge `hivefiver` and `hiveminder`.
