<!-- generated-by: gsd-doc-writer -->
# Hivemind Runtime Identity Taxonomy — 2026-05-07

**Artifact group:** Architecture / governance  
**Phase:** Phase 0 — Governance Baseline  
**Status:** Blocking baseline for BOOT, MCM, and f-04 continuation  
**Evidence level:** L5 documentation/governance evidence only  
**Runtime readiness:** Not claimed. Runtime proof requires later L1-L3 evidence.

---

## Purpose

This artifact locks the naming, identity, lineage, and hierarchy vocabulary that future agents must use when planning or implementing Hivemind work. It exists to prevent downstream phases from mixing product identity, package identity, project type, platform, and internal workflow tooling.

---

## Source Evidence

| Source | Evidence |
|---|---|
| `.planning/PROJECT.md` | Describes Hivemind as a runtime composition engine for OpenCode with Hard Harness, Soft Meta-Concepts, and `.hivemind/` state. |
| `.planning/codebase/ARCHITECTURE.md` | Separates `src/`, `.opencode/`, `.hivemind/`, and `.hivefiver-meta-builder/`; defines hm/hf/gate/stack/gsd lineages and L0-L3 hierarchy. |
| `.planning/codebase/CONCERNS.md` | Identifies bootstrap, routing, hierarchy enforcement, E2E proof, and primitive/state recovery as unresolved risks. |
| `package.json` | Package name and bin are both `hivemind`; OpenCode is declared as runtime engine dependency through `@opencode-ai/*` packages and `engines.opencode`. |
| `.planning/research/omo-adaptation-architecture-2026-05-07.md` | Requires Hivemind identity preservation and rejects copying OMO roots or taxonomy. |

---

## Canonical Identity Contract

| Concept | Canonical term | Boundary |
|---|---|---|
| Product | **Hivemind** | User-facing product identity. Use this in roadmap, docs, package descriptions, CLI language, and architecture docs. |
| Package | **`hivemind`** | npm package name from `package.json`. |
| CLI / bin | **`hivemind`** | Executable name from `package.json`. |
| Project type | **harness** | Architectural type: runtime composition harness for OpenCode. Not the product name. |
| Platform | **OpenCode** | Current host/runtime platform. Hivemind composes OpenCode tools, hooks, agents, commands, and skills. |
| Legacy alias | `opencode-harness` | Historical package/project alias only. Do not use for new canonical identity. |
| Legacy alias | `hivemind-tools` | Historical CLI/bin alias only. Do not use for new canonical CLI routing. |
| Internal workflow tooling | GSD | Internal planning/workflow tooling used to build the project. It is not the product identity and is not a shipped Hivemind primitive family. |

---

## Lineage Contract

| Lineage | Boundary | Shipped / dev / internal status | Rule |
|---|---|---|---|
| `hm-*` | Hivemind product-development agents and skills | Shipped or intended shipped Hivemind primitives | Strict lineage. Use for product development, requirements, planning, execution, validation, debugging, and research workflows. |
| `hf-*` | HiveFiver/meta-authoring agents, skills, and commands | Shipped or intended shipped meta-authoring primitives | Flexible lineage for authoring, repairing, configuring, and auditing Hivemind meta-concepts. |
| `gate-*` | Quality gate skills and gate references | Internal quality boundary for this project unless explicitly productized later | Used to evaluate lifecycle, spec, and evidence claims. Gate output blocks readiness claims when evidence is insufficient. |
| `stack-*` | Reference skills for third-party stacks | Reference-only support primitive | Provides versioned framework/package knowledge; does not own Hivemind behavior. |
| `gsd-*` | GSD planning/build workflow tooling | Developer/internal only | May guide project work, but must not be presented as Hivemind product identity or shipped customer primitive. |

---

## Hierarchy Contract

| Level | Role | Delegation boundary |
|---|---|---|
| L0 | Front-facing orchestrator | Interprets user intent, frames workflow, routes work, enforces gates. Does not implement specialist work. |
| L1 | Coordinator | Creates work packets, manages waves/checkpoints, validates specialist handoffs. May delegate bounded work to L2. |
| L2 | Specialist | Executes bounded research, authoring, implementation, review, verification, or repair tasks within assigned surfaces. Must not self-expand scope. |
| L3 | Reference / gate / stack knowledge | Supplies reference rules, quality gates, or stack-specific constraints to L2 specialists. Does not directly own runtime mutation. |

Runtime enforcement of L0/L1/L2 depth is currently an unresolved risk in `.planning/codebase/CONCERNS.md`; Phase 0 only locks the governance vocabulary and blocks downstream work until this distinction is respected in plans.

---

## OMO Adopt / Adapt / Reject Framing

| OMO pattern | Phase 0 framing | Hivemind rule |
|---|---|---|
| Staged plugin initialization | Adapt | Use as checklist language for config → managers → tools → hooks only when mapped to existing Hivemind surfaces. |
| Manager/state-owner concepts | Adapt | Useful for `.hivemind/` typed ownership, task continuity, and lifecycle owners. |
| Dual-signal completion | Adopt as existing-aligned pattern | Hivemind already uses idle + stability completion detection. Future changes must preserve or improve that safety. |
| OMO folder roots such as `.sisyphus` or `.omx` | Reject | Hivemind state root remains `.hivemind/`; OpenCode primitives remain `.opencode/`. |
| Blind OMO topology copying | Reject | OMO concepts must be transformed into Hivemind's source planes, lineages, and hierarchy. |

---

## Falsifiable Acceptance Criteria

| ID | Criterion | Verification | Blocks |
|---|---|---|---|
| P0-ID-01 | New roadmap/state text uses Product `Hivemind`, package/bin `hivemind`, project type `harness`, and OpenCode as platform. | Inspect `.planning/ROADMAP.md`, `.planning/STATE.md`, and Phase 0 artifacts. | BOOT, MCM, f-04 continuation. |
| P0-ID-02 | Any use of `opencode-harness` or `hivemind-tools` is explicitly labeled as a legacy alias. | Text search in updated Phase 0 docs. | BOOT CLI naming and MCM docs. |
| P0-ID-03 | `gsd-*` is documented only as internal workflow tooling and not as product identity. | Inspect lineage tables in this artifact and route artifact. | MCM shipped/dev boundary decisions. |
| P0-ID-04 | L0/L1/L2/L3 responsibilities are explicitly separated and do not authorize specialists to bypass coordinator gates. | Inspect hierarchy table and downstream phase plans. | Delegation/routing phases. |

---

## Gate Result

This artifact is L5 governance evidence. It can block inconsistent downstream naming and lineage plans, but it does not prove runtime behavior.
