# Hivemind Sector AGENTS.md Target Architecture — 2026-05-07

**Document type:** Target architecture artifact  
**Route:** Option 3 — Sector Governance Foundation Phase  
**Status:** Docs-only target; no sector `AGENTS.md` implementation in this phase  
**Evidence level:** L5 documentation evidence only

---

## Purpose

This artifact defines the target strategy for future sector-level `AGENTS.md` guidance. It does not create or modify any sector `AGENTS.md` files. Future implementation must pass pre-phase inventory and gate checks before writing guidance files into sector directories.

---

## Evidence Baseline

| Evidence | Architectural Fact |
|---|---|
| `.planning/PROJECT.md:5-8` | HiveMind is a runtime composition engine with Hard Harness, Soft Meta-Concepts, and `.hivemind/` state. |
| `.planning/codebase/STRUCTURE.md:88-134` | `src/` is runtime code, `.opencode/` is primitives, `.hivemind/` is state. |
| `.planning/codebase/ARCHITECTURE.md:209-245` | Soft meta-concepts include hm/hf/gate/stack lineages and L0→L3 delegation hierarchy. |
| `.planning/codebase/ARCHITECTURE.md:339-353` | Mutation authority and CQRS boundaries separate tools, hooks, and state. |
| `.planning/REQUIREMENTS.md:42-56` | Governance/registry/permission/configuration path has missing/partial registry and routing work. |

---

## Target Sector Strategy

| Sector | Candidate Scope | Guidance Purpose | Must Not Do |
|---|---|---|---|
| Hard Harness sector | `src/`, with sub-sectors for `tools/`, `hooks/`, `lib/`, `schema-kernel/`, `cli/` | Explain CQRS authority, dependency constraints, module-size guardrails, SDK/OpenCode boundaries. | Must not allow hooks to perform durable writes or plugin layer to hold business logic. |
| Soft Meta-Concept sector | `.opencode/` and source-of-truth authoring references | Explain primitive-only boundary, lineage conventions, agent/skill/command roles. | Must not store internal runtime state or blur hm/hf/gate/stack lineages. |
| Internal State sector | `.hivemind/` | Explain canonical state root, durability ownership, recovery surfaces, event artifacts. | Must not write state from hooks or move state back into `.opencode/`. |
| Planning/Governance sector | `.planning/` | Explain planning artifact categories, date-stamped filenames, gates, phase authorization. | Must not claim runtime readiness from documentation-only artifacts. |
| Tests/Verification sector | `tests/` and gate artifacts | Explain evidence hierarchy, integration-vs-unit gaps, and required commands for proof. | Must not accept mocked/unit-only proof for integration readiness. |

---

## Required AGENTS.md Section Shape

Future sector guidance SHOULD use this minimal structure:

1. **Sector purpose** — one sentence explaining the sector's role in the harness.
2. **Allowed mutations** — which files may be edited and by which actor level.
3. **Forbidden mutations** — especially cross-surface violations.
4. **Required evidence** — commands, inspections, or gate artifacts needed before completion claims.
5. **Consumer map** — actor/consumer/purpose table for affected surfaces.
6. **Escalation rules** — when a specialist must stop and return BLOCKED.

---

## Falsifiable Requirements

### REQ-SA-01: Sector Guidance Is Deferred
**Source:** Status and Purpose sections at this artifact lines 5 and 12; `.planning/ROADMAP.md:33-39`.  
**Condition:** The target architecture SHALL state that actual sector `AGENTS.md` implementation is deferred to a later phase.  
**Acceptance Criteria:** Given this artifact, when a reviewer inspects the status and purpose sections, then they show docs-only target scope and no implementation claim.  
**Verification Method:** Documentation inspection.  
**Status:** locked

### REQ-SA-02: Sector Boundaries Preserve Hivemind Surfaces
**Source:** `.planning/codebase/STRUCTURE.md:88-134`; evidence baseline at this artifact lines 20-24.  
**Condition:** Each target sector SHALL resolve to an existing Hivemind surface.  
**Acceptance Criteria:** Given the target sector table, when a reviewer maps each row to source evidence, then every sector resolves to `src/`, `.opencode/`, `.hivemind/`, `.planning/`, or `tests/`.  
**Verification Method:** Documentation inspection against `.planning/codebase/STRUCTURE.md:88-134`.  
**Status:** locked

### REQ-SA-03: Sector Guidance Must Include Evidence Rules
**Source:** Required section shape at this artifact lines 44-49; `.planning/checklists/pre-phase-omo-adaptation-2026-05-07.md:74-93`.  
**Condition:** Future sector `AGENTS.md` files SHALL include an evidence-and-escalation completion control before completion claims.  
**Acceptance Criteria:** Given a future sector guidance file, when a reviewer checks the required section shape, then evidence and escalation sections are present.  
**Verification Method:** Future docs review gate.  
**Status:** locked

---

## Acceptance Matrix

| REQ ID | Source quote/path | Positive | Negative | Boundary | Integration | Verification method | Coverage state |
|---|---|---|---|---|---|---|---|
| REQ-SA-01 | This artifact lines 5 and 12; `.planning/ROADMAP.md:33-39` | Status says docs-only and deferred. | Runtime implementation claim appears. | Roadmap later authorizes docs-only sector file phase. | Links to roadmap phase sequencing. | Documentation inspection of status, purpose, and roadmap O3 rows. | mapped |
| REQ-SA-02 | `.planning/codebase/STRUCTURE.md:88-134`; this artifact lines 20-24 | Sectors map to current Hivemind surfaces. | OMO roots or names become sector names. | Future new sectors require source evidence. | Links to source structure and architecture docs. | Documentation inspection against source structure evidence. | mapped |
| REQ-SA-03 | This artifact lines 44-49; `.planning/checklists/pre-phase-omo-adaptation-2026-05-07.md:74-93` | Evidence/escalation sections are mandatory. | Sector docs allow unverified completion. | Docs-only evidence remains L5. | Links to gate orchestration table in checklist. | Future docs review gate using required section shape. | mapped |

---

## Implementation Boundary

Future implementation of sector `AGENTS.md` files is blocked until the pre-phase checklist passes inventory, naming, actor/consumer/purpose mapping, SDK/API checkpoints, and gate readiness. This artifact is the target architecture only.
