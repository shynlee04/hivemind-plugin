# Roadmap: HiveMind Canonical Rebaseline

## Overview

This roadmap replaces the previously drifted planning spine with a decisive module-first execution model. The product now advances by proving one bounded module at a time against the official OpenCode dual-plane architecture before expanding scope.

## Canonical vs Advisory

- This file is canonical roadmap authority.
- Historical phase documents, Phase 9/10 skill-pack branches, and `.experimental-planning/the-agent-work-contract-planning-artifact.md` are advisory only.
- Phase 11 research and outcomes are useful evidence, but they do not override this roadmap unless their conclusions are restated here.

## Execution Rule

No new expansion lane should stack on top of an incomplete module. Each active phase must end with real runtime proof or an explicit blocked state before the next major lane begins.

## Phases

### Phase 0: Canonical Rebaseline

**Goal:** Restore one authoritative planning spine and quarantine advisory branches.

**Success looks like:**
- the four canonical planning docs tell one consistent story
- advisory branches are clearly marked non-canonical
- execution order is reset around the dual-plane/module-first pivot

**Status:** Complete on 2026-03-21

### Phase 1: Dual-Plane Runtime Backbone

**Goal:** Lock the product to the official OpenCode architecture: control-plane orchestration through `@opencode-ai/sdk`, runtime execution through `@opencode-ai/plugin`.

**Must prove:**
- control-plane and execution-plane responsibilities are unambiguous
- no surviving shadow authority contradicts the dual-plane contract
- canonical docs and shipped surfaces describe the same architecture

### Phase 2: Tool Surface Clarification

**Goal:** Separate narrow utilities from engine-backed tools and keep adapters thin.

**Must prove:**
- tool categories are explicit and consistent
- engine-backed behavior routes through authoritative module owners
- helpers do not secretly own runtime state or orchestration

### Phase 3: Module-by-Module Completion Loop

**Goal:** Deliver each major module as a bounded end-to-end slice instead of stacking partial migrations.

**Execution model:**
- choose one module
- finish its ownership and integration path
- run the required validation, including live runtime evidence where claims touch official behavior
- only then authorize the next module

**Modules can include:** runtime entry, session entry, workflow/tasking, trajectory/handoff, doc intelligence, runtime observability, and operator UI consumers.

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Create bounded-slice template
- [ ] 03-02-PLAN.md — Create module inventory with dependency ordering
- [ ] 03-03-PLAN.md — Validate methodology and document inheritance contract

### Phase 4: Live Validation and Continuity Hardening

**Goal:** Make official-interface proof, continuity behavior, and evidence labeling part of normal completion criteria.

**Must prove:**
- verification lanes clearly separate diagnostics, integration checks, and live proof
- continuity/recovery behavior is validated against the real runtime path
- completion claims remain evidence-backed after compaction, repair, or attach flows

**Plans:** 4 plans

Plans:
- [ ] 04-01-PLAN.md — Enhance BOUNDED-SLICE-TEMPLATE with evidence lane specification
- [ ] 04-02-PLAN.md — Create evidence lane validators for runtime tools
- [ ] 04-03-PLAN.md — Add continuity validation tests with evidence labeling
- [ ] 04-04-PLAN.md — Gap-closure: shared EvidenceLane contract, operator-facing surfaces, edge cases

### Phase 5: Controlled Expansion

**Goal:** Expand only after prior phases have real proof and only by explicit promotion.

**Eligible future work:**
- richer operator UX or TUI work
- restored or expanded intelligence capabilities
- advisory branches such as Phase 9, Phase 10, or agent-work-contract ideas, but only after formal promotion into canonical planning

**Not allowed in this phase by default:** silent promotion of advisory branches or speculative trial stacking.

## Priority Notes

- Phase 9 and Phase 10 are quarantined advisory branches, not active execution truth.
- The experimental agent-work-contract artifact remains a research input, not a canonical roadmap phase.
- Roadmap additions must preserve the module-first, official-proof delivery model.

## Current Focus

After this rebaseline, the next active delivery lane is Phase 1 followed by Phase 2, then repeated bounded execution through the Phase 3 completion loop.

---
*Last updated: 2026-03-21*
