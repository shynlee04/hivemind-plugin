<!-- generated-by: gsd-doc-writer -->
# HiveFiver Meta-Authoring Architecture — 2026-05-07

**Artifact group:** Architecture / meta-authoring governance  
**Phase:** Phase 0 — Governance Baseline  
**Status:** Blocking baseline for MCM and meta-authoring work  
**Evidence level:** L5 documentation/governance evidence only  
**Runtime readiness:** Not claimed. Runtime proof requires later L1-L3 evidence.

---

## Purpose

This artifact defines the relationship between `.hivefiver-meta-builder/`, `.opencode/`, and planned HiveFiver command families. It prevents meta-authoring work from being confused with shipped runtime state or GSD internal workflow tooling.

---

## Source Evidence

| Source | Evidence |
|---|---|
| `.planning/codebase/ARCHITECTURE.md` | `.hivefiver-meta-builder/` is the source-of-truth layer for soft meta-concepts before reflection to `.opencode/`. |
| `.planning/ROADMAP.md` | MCM phases plan migration/integration of non-GSD agents and skills from `.hivefiver-meta-builder/` into `.opencode/`. |
| `.planning/codebase/CONCERNS.md` | Primitive recovery and shipped/dev tooling separation remain critical concerns. |
| `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` | Locks canonical lineage and legacy alias boundaries. |

---

## Meta-Authoring Surface Model

| Surface | Role | Boundary |
|---|---|---|
| `.hivefiver-meta-builder/` | Authoring lab/source-of-truth for agents, skills, commands, references, workflows, and rules before runtime reflection. | Not runtime state. Not OpenCode primitive loading surface by itself. |
| `.opencode/` | Runtime primitive surface consumed by OpenCode and Hivemind. | Primitive-only; must not store internal runtime state. |
| `.hivemind/` | Internal state root. | Not an authoring lab for primitives. |
| `.planning/` | Governance and route/state artifacts. | May document meta-authoring plans; does not implement them. |

---

## Shipped / Dev / Internal Boundary

| Primitive family | Boundary | MCM rule |
|---|---|---|
| `hm-*` | Hivemind product-development primitives | Eligible for shipped/runtime primitive migration if quality gates pass. |
| `hf-*` | HiveFiver meta-authoring primitives | Eligible for shipped/runtime primitive migration if authoring boundaries and permissions pass. |
| `gate-*` | Internal quality gate primitives | Internal gate boundary unless explicitly productized. Must remain evidence-honest. |
| `stack-*` | Reference primitives | Reference-only; may support specialists but should not own Hivemind product behavior. |
| `gsd-*` | Internal development workflow tooling | Excluded from shipped Hivemind primitives. May remain project build tooling only. |

---

## Planned Command Families

| Family | Purpose | Required boundary |
|---|---|---|
| `hf-doctor` | Diagnose authoring health: primitive discoverability, frontmatter validity, lineage compliance, missing references, skill/agent binding drift, shipped/dev/internal leakage. | Read-first diagnostics; write actions require explicit repair subcommands and separate authorization. |
| `hf-meta-authoring` | Create, audit, repair, and package agents, skills, commands, rules, and references in `.hivefiver-meta-builder/`. | Author in lab first; reflect into `.opencode/` only through authorized MCM/bootstrap flows. |
| `hf-create` / `hf-configure` / `hf-audit` style commands | Concrete command variants for authoring, configuration, and audit flows. | Must use `hf-*` lineage rules and avoid shipping `gsd-*` tooling as product primitives. |

These command families are planned governance architecture only. Phase 0 does not create commands or edit `.opencode/` primitives.

---

## Meta-Authoring Workflow Contract

1. Author or repair primitive in `.hivefiver-meta-builder/`.
2. Validate naming, lineage, frontmatter, permission boundaries, and skill/agent contracts.
3. Run doctor/audit diagnostics.
4. Reflect approved shipped primitives into `.opencode/` through authorized migration/bootstrap flows.
5. Verify OpenCode discoverability and Hivemind runtime compatibility with L1-L3 evidence before readiness claims.

---

## Falsifiable Acceptance Criteria

| ID | Criterion | Verification | Blocks |
|---|---|---|---|
| P0-HF-01 | `.hivefiver-meta-builder/` is defined as authoring source-of-truth, not runtime state. | Inspect surface model. | MCM migration. |
| P0-HF-02 | `.opencode/` is defined as primitive-only and `.hivemind/` as state-only. | Inspect surface model. | BOOT primitive recovery and MCM. |
| P0-HF-03 | `gsd-*` is excluded from shipped Hivemind primitive migration. | Inspect shipped/dev/internal boundary table. | MCM-01 and MCM-02. |
| P0-HF-04 | `hf-doctor` and `hf-meta-authoring` are documented as planned command families, not delivered runtime capabilities. | Inspect planned command family table. | Meta-authoring command phases. |

---

## Gate Result

This artifact is L5 governance evidence. It blocks unsafe meta-authoring or MCM plans but does not prove primitive migration or runtime discoverability.
