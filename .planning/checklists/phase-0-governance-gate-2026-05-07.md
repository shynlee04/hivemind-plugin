<!-- generated-by: gsd-doc-writer -->
# Phase 0 Governance Gate Checklist — 2026-05-07

**Artifact group:** Checklist / governance gate  
**Phase:** Phase 0 — Governance Baseline  
**Status:** Blocking gate for BOOT, MCM, and f-04 continuation  
**Evidence level:** L5 documentation/governance evidence only unless a row explicitly requires later L1-L3 proof  
**Runtime readiness:** Blocked until downstream runtime evidence exists.

---

## Gate Purpose

Phase 0 is the entry gate that must pass before BOOT, MCM, and f-04 routing work continue. It locks identity, lineage, hierarchy, source-plane, config, meta-authoring, and route/state governance so future implementation phases do not build on contradictory naming or surface assumptions.

---

## Blocking Checklist

| Gate ID | Check | Evidence required now | Pass condition | Blocks |
|---|---|---|---|---|
| P0-GATE-01 | Canonical identity locked | L5 docs | Product `Hivemind`, package/bin `hivemind`, project type `harness`, platform `OpenCode`, legacy aliases labeled. | BOOT CLI, ROADMAP, STATE, MCM. |
| P0-GATE-02 | Lineage boundaries locked | L5 docs | hm/hf/gate/stack/gsd lineages and shipped/dev/internal boundaries documented. | MCM migration. |
| P0-GATE-03 | L0/L1/L2/L3 hierarchy locked | L5 docs | Actor hierarchy and delegation boundaries documented; runtime enforcement gap remains marked unresolved. | Delegation/routing phases. |
| P0-GATE-04 | Surface ownership locked | L5 docs | `src`, `.opencode`, `.hivemind`, `.planning`, `.hivefiver-meta-builder` ownership documented. | BOOT, MCM, source-plane work. |
| P0-GATE-05 | Target source planes documented | L5 docs | `src/routing`, `src/task-management`, `src/coordination`, `src/plugin-handlers`, `src/cli`, `src/schema-kernel`, `src/config-plane` recorded as future target planes with no code moves authorized. | f-04, BOOT refactors. |
| P0-GATE-06 | Config contract documented | L5 docs | conversation language, documents/artifacts language, mode, user expert level, and delegation systems fields documented with consumers/status. | BOOT config bootstrap and MCM config integration. |
| P0-GATE-07 | Meta-authoring boundary documented | L5 docs | `.hivefiver-meta-builder/` source-of-truth and planned `hf-doctor` / `hf-meta-authoring` command families documented. | MCM and HF command work. |
| P0-GATE-08 | OMO framing documented | L5 docs | Adopt/adapt/reject framing preserves Hivemind identity and rejects OMO roots/topology copying. | Any OMO-derived implementation. |
| P0-GATE-09 | Roadmap/state route updated | L5 docs | `.planning/ROADMAP.md` and `.planning/STATE.md` show Phase 0 as blocking entry gate before BOOT/MCM/f-04. | All downstream phases. |
| P0-GATE-10 | Runtime proof requirements remain honest | L1-L3 later, L5 now | Phase 0 artifacts classify themselves as docs/governance only; downstream runtime claims remain blocked until proof exists. | Release/readiness claims. |

---

## Stop Conditions

Stop downstream execution if any of the following is true:

1. `opencode-harness` or `hivemind-tools` appears as canonical current identity instead of legacy alias.
2. A plan proposes shipping `gsd-*` as Hivemind product primitives.
3. `.opencode/` is used for internal runtime state.
4. `.hivemind/` is used as a primitive authoring/runtime-loading surface.
5. Phase 0 docs are cited as runtime proof.
6. BOOT, MCM, or f-04 is marked unblocked before P0-GATE-01 through P0-GATE-10 pass.

---

## Downstream Evidence Requirements

| Future area | Minimum future evidence |
|---|---|
| BOOT init/doctor | L3 CLI proof for `hivemind init` / `hivemind doctor`; L1 end-to-end proof for delete/recover flow. |
| MCM migration | L3 OpenCode discoverability proof for migrated primitives; L2 doctor/audit proof for counts and boundaries. |
| f-04 routing | L2/L3 tests proving intent classification, command parsing, workflow routing, and correct specialist selection. |
| Delegation hierarchy enforcement | L2/L3 tests proving unauthorized depth transitions are blocked. |
| Config behavior | L2/L3 tests proving config fields reach intended consumers and dead/deferred fields are not falsely active. |

---

## Gate Verdict Template

| Gate | Verdict | Evidence |
|---|---|---|
| Identity | PASS / FAIL / BLOCK | Phase 0 identity artifact inspection. |
| Lineage | PASS / FAIL / BLOCK | Runtime identity and meta-authoring artifacts. |
| Source planes | PASS / FAIL / BLOCK | Source-plane architecture artifact. |
| Config | PASS / FAIL / BLOCK | Config contract artifact. |
| Route/state | PASS / FAIL / BLOCK | ROADMAP and STATE updates. |
| Evidence honesty | PASS / FAIL / BLOCK | All artifacts classify as L5 docs/governance unless later runtime proof is explicitly required. |

---

## Current Phase 0 Gate Status

Phase 0 is ready for review after the six Phase 0 artifacts, `.planning/ROADMAP.md`, and `.planning/STATE.md` are created or updated. Until reviewed, BOOT, MCM, and f-04 remain blocked by this gate.
