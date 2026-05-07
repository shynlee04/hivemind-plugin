<!-- generated-by: gsd-doc-writer -->
# Hivemind Source Plane Architecture — 2026-05-07

**Artifact group:** Architecture / governance  
**Phase:** Phase 0 — Governance Baseline  
**Status:** Blocking baseline for source-plane planning  
**Evidence level:** L5 documentation/governance evidence only  
**Runtime readiness:** Not claimed. No code moves are authorized by Phase 0.

---

## Purpose

This artifact defines the source-plane ownership model for Hivemind. It records what each top-level surface owns today, what future target source planes may exist under `src/`, and which surfaces are forbidden for Phase 0 mutation.

---

## Current Surface Ownership

| Surface | Ownership | Current evidence | Phase 0 mutation authority |
|---|---|---|---|
| `src/` | Hard harness runtime: tools, hooks, plugin composition, shared libs, schema kernel, CLI. | `.planning/codebase/ARCHITECTURE.md` system overview and component tables. | None. Phase 0 does not edit runtime code. |
| `.opencode/` | OpenCode primitives: agents, skills, commands, rules, plugins. | `.planning/codebase/ARCHITECTURE.md` Soft Meta-Concepts layer. | None. Phase 0 does not edit primitives. |
| `.hivemind/` | Internal runtime state: continuity, delegations, event tracker, journal, configs. | `.planning/codebase/ARCHITECTURE.md` Deep Module State layer and Q6 rule. | None. Phase 0 does not edit state. |
| `.planning/` | Governance, roadmaps, architecture maps, research, checklists, route/state docs. | `.planning/AGENTS.md` Planning/Governance sector guidance. | Yes, limited to authorized planning markdown files. |
| `.hivefiver-meta-builder/` | Source-of-truth authoring plane for meta-concepts before reflection to `.opencode/`. | `.planning/codebase/ARCHITECTURE.md` Source-of-Truth layer. | None. Phase 0 does not edit meta-builder source. |

---

## Target `src/` Source Planes

Phase 0 records these as target source planes for future architecture alignment only. It does not authorize moving files, creating modules, or rewriting imports.

| Target plane | Intended future responsibility | Current relationship |
|---|---|---|
| `src/routing` | Intent classification, command/workflow routing, f-04 auto-routing, domain selection. | Missing or partial; `.planning/codebase/CONCERNS.md` identifies f-04 routing as missing. |
| `src/task-management` | Task state, task continuity, task-plus concepts, status transitions, completion lifecycle. | Partially represented by delegation/status/state modules today. |
| `src/coordination` | Delegation manager, concurrency lanes, hierarchy/depth enforcement, coordinator runtime policies. | Partially represented by delegation/concurrency modules; hierarchy enforcement is not runtime-proven. |
| `src/plugin-handlers` | Plugin hook/tool registration handlers, event observers, composition helper boundaries. | Current `plugin.ts`, hook factories, and tool registration logic cover pieces of this. |
| `src/cli` | `hivemind` CLI command routing, init, doctor, recover, help/version flows. | Existing CLI layer exists; BOOT continuation is blocked until Phase 0 gate passes. |
| `src/schema-kernel` | Zod schemas and validation contracts for configs, primitives, task packets, trajectories, commands, and pressure. | Existing schema kernel is documented in architecture map. |
| `src/config-plane` | Config loading, defaults, subscriber/cache, behavior profile integration, config-to-consumer binding. | Existing config schema and traceability artifact identify wired/dead fields. |

---

## Non-Authorization Rule

No code moves are authorized by Phase 0. Any future move into target planes requires a later implementation phase with:

1. source inventory,
2. consumer/import graph check,
3. migration plan,
4. tests or runtime proof appropriate to the changed surface,
5. gate review that distinguishes L5 planning from L1-L3 runtime evidence.

---

## Source-Plane Consumer Rules

| Consumer | May consume | Must not do |
|---|---|---|
| BOOT phases | Phase 0 naming, source-plane, config, and gate artifacts. | Continue CLI/bootstrap implementation while Phase 0 gate is incomplete. |
| MCM phases | Identity, lineage, `.hivefiver-meta-builder/` authoring, and shipped/dev/internal boundary docs. | Ship `gsd-*` as product primitives or blur `.opencode/` and `.hivemind/`. |
| f-04 routing phase | Target routing plane and command/workflow/session map. | Claim auto-routing exists before runtime source and tests prove it. |
| Quality gates | Acceptance criteria and evidence-level statements. | Treat Phase 0 docs as runtime proof. |

---

## Falsifiable Acceptance Criteria

| ID | Criterion | Verification | Blocks |
|---|---|---|---|
| P0-SP-01 | Every top-level surface has an owner and explicit Phase 0 mutation authority. | Inspect current surface ownership table. | All downstream work. |
| P0-SP-02 | Target `src/` planes are described as future architecture alignment only, not code-move authorization. | Inspect target source plane and non-authorization sections. | BOOT refactors, f-04 source creation. |
| P0-SP-03 | `.opencode/` remains primitive-only and `.hivemind/` remains internal state-only. | Inspect surface ownership table and downstream phase plans. | MCM and bootstrap recovery. |
| P0-SP-04 | `.hivefiver-meta-builder/` is recognized as meta-authoring source-of-truth, not runtime state or product runtime. | Inspect ownership table and meta-authoring architecture artifact. | MCM migration planning. |

---

## Gate Result

This artifact is L5 governance evidence. It blocks inconsistent source-plane plans but does not authorize or verify runtime source changes.
