<!-- generated-by: gsd-doc-writer -->
# Phase 0 GSD Route — 2026-05-07

**Artifact group:** Roadmap / route governance  
**Phase:** Phase 0 — Governance Baseline  
**Status:** Blocking route before BOOT, MCM, and f-04 continuation  
**Evidence level:** L5 documentation/governance evidence only  
**Runtime readiness:** Not claimed.

---

## Purpose

This route explains how internal GSD workflow tooling is used for Phase 0 without becoming Hivemind product identity. It connects the Phase 0 governance artifacts to roadmap and state routing.

---

## Product vs Workflow Boundary

| Realm | Canonical role |
|---|---|
| Hivemind | Product and package identity. |
| `hivemind` | npm package and CLI/bin identity. |
| harness | Project type and architecture pattern. |
| OpenCode | Host/runtime platform. |
| GSD | Internal planning/workflow tooling used to govern this project. Not product identity and not a shipped primitive lineage. |

---

## Phase 0 Route

| Step | Artifact | Gate function |
|---|---|---|
| 1 | Runtime identity taxonomy | Locks canonical names, aliases, lineages, hierarchy, and OMO framing. |
| 2 | Source-plane architecture | Locks surface ownership and target source planes; forbids Phase 0 code moves. |
| 3 | Config contract | Locks config fields, consumers/status, and planned doctor/meta-authoring consumers. |
| 4 | HiveFiver meta-authoring architecture | Locks `.hivefiver-meta-builder/` → `.opencode/` boundary and shipped/dev/internal split. |
| 5 | Phase 0 governance checklist | Provides falsifiable blocking criteria for downstream work. |
| 6 | Roadmap/state updates | Makes Phase 0 the active blocking entry gate before BOOT/MCM/f-04 continuation. |

---

## Downstream Routing Rule

BOOT, MCM, and f-04 may resume only after the Phase 0 governance checklist passes. Until then:

- BOOT is blocked from continuing CLI/bootstrap implementation.
- MCM is blocked from migrating or reflecting primitives.
- f-04 routing is blocked from source-plane implementation.
- GSD remains internal workflow support and must not be represented as Hivemind product identity.

---

## Falsifiable Acceptance Criteria

| ID | Criterion | Verification | Blocks |
|---|---|---|---|
| P0-ROUTE-01 | Phase 0 route includes all six required artifacts and ROADMAP/STATE updates. | Inspect this route and target files. | BOOT/MCM/f-04. |
| P0-ROUTE-02 | GSD is explicitly internal workflow tooling, not product identity. | Inspect product vs workflow boundary. | MCM shipped/dev boundary. |
| P0-ROUTE-03 | BOOT/MCM/f-04 are blocked until Phase 0 gate passes. | Inspect downstream routing rule and updated STATE. | All downstream phases. |

---

## Gate Result

This artifact is L5 governance evidence. It routes workflow control but does not prove runtime behavior.
