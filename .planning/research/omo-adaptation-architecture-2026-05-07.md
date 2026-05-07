# OMO Adaptation Architecture Research — 2026-05-07

**Document type:** Research artifact  
**Route:** Option 3 — Sector Governance Foundation Phase  
**Status:** Docs-only foundation; not runtime implementation evidence  
**Evidence level:** L5 documentation evidence only

---

## Source Audit

| Source | Evidence | Extracted Constraint |
|---|---|---|
| `.planning/PROJECT.md:5-8` | HiveMind is a runtime composition engine with Hard Harness, Soft Meta-Concepts, and `.hivemind/` state. | OMO patterns must preserve Hivemind identity and not replace it with an OMO clone. |
| `.planning/codebase/ARCHITECTURE.md:38-44` | Hard Harness = `src/`, Soft Meta-Concepts = `.opencode/`, Internal State = `.hivemind/`. | Adaptations must respect surface separation. |
| `.planning/codebase/ARCHITECTURE.md:72-81` | CQRS, WaiterModel, dual-layer state, keyed concurrency, and zero business logic in plugin layer are current architecture. | OMO patterns must fit existing lifecycle rather than redefine the harness. |
| `.planning/archive/2026-05-07/research/omo-findings.md:16-25` | OMO BackgroundManager owns task state, notifications, pending-by-parent, queues, and concurrency. | Adopt manager/state-owner concepts selectively for Hivemind task ownership. |
| `.planning/archive/2026-05-07/research/omo-findings.md:84-90` | OMO uses idle + stability completion detection. | Preserve/adapt dual-signal completion as a lifecycle safety pattern. |
| `.planning/archive/2026-05-07/research/omo-findings.md:139-158` | OMO persists Ralph loop under `.sisyphus/`. | Reject `.sisyphus` root; map any state to `.hivemind/` per Q6. |
| `.planning/archive/2026-05-07/research/OMO-ARCHITECTURE-DEEP-DIVE.md:37-56` | OMO staged plugin initialization: config → managers → tools → hooks → interface. | Adapt staged init as architecture guidance for future bootstrap/config cleanup. |
| `.planning/archive/2026-05-07/research/OMO-ARCHITECTURE-DEEP-DIVE.md:310-350` | OMO hook tiers and hook factory pattern. | Adapt hook taxonomy documentation; do not blindly copy 52-hook structure. |

---

## Option 3 Route Constraints

1. This phase SHALL produce planning artifacts only; it SHALL NOT edit `src/**` runtime code or `.opencode/**` primitives.
2. This phase SHALL layer a governance foundation onto the existing CA-04 roadmap rather than claim Option 3 is already an active exact phase name.
3. This phase SHALL preserve Hivemind identity: Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), Internal State (`.hivemind/`).
4. This phase SHALL treat all planning outputs as L5 evidence; runtime readiness remains blocked until L1-L3 proof exists.

---

## Adapt / Reject Table

| OMO Pattern | Decision | Hivemind Transformation | Evidence |
|---|---|---|---|
| Staged plugin initialization | ADAPT | Use as future architecture checklist for bootstrap/init and config realm cleanup; preserve Hivemind composition root and OpenCode SDK boundaries. | `.planning/archive/2026-05-07/research/OMO-ARCHITECTURE-DEEP-DIVE.md:37-56`, `.planning/codebase/ARCHITECTURE.md:50-66` |
| Background manager/state owner | ADAPT | Use manager/state-owner language to clarify sector ownership and lifecycle surfaces; do not collapse existing Hivemind modules prematurely. | `.planning/archive/2026-05-07/research/omo-findings.md:16-25`, `.planning/codebase/ARCHITECTURE.md:46-68` |
| Hook taxonomy | ADAPT | Document Hivemind hook sectors as session, tool guard, transform, continuation, and skill-routing concepts only after matching existing hook factories. | `.planning/archive/2026-05-07/research/omo-findings.md:199-212`, `.planning/codebase/ARCHITECTURE.md:115-134` |
| Background safety controls | ADAPT | Carry depth/budget/circuit-breaker/reservation concepts into future runtime gates, but require tests and SDK proof before implementation claims. | `.planning/archive/2026-05-07/research/omo-findings.md:46-58`, `.planning/archive/2026-05-07/research/OMO-ARCHITECTURE-DEEP-DIVE.md:159-189` |
| Stale polling pattern | ADAPT | Treat polling + stability as a completion safety criterion for future verification, not as a new runtime claim. | `.planning/archive/2026-05-07/research/omo-findings.md:79-90` |
| CRUD naming discipline | ADAPT | Map CRUD naming to Hivemind `.hivemind/` ownership modules and CQRS tools/hooks rules. | `.planning/ROADMAP.md:24-27`, `.planning/codebase/ARCHITECTURE.md:339-353` |
| Sector AGENTS.md guidance | ADAPT | Define target sector guidance artifacts first; implementation of actual sector `AGENTS.md` files must be a later docs-only phase after gates pass. | `.planning/codebase/STRUCTURE.md:21-39`, `.planning/codebase/ARCHITECTURE.md:209-245` |
| Blind folder copying | REJECT | OMO folder names and topology SHALL NOT be copied into Hivemind. Hivemind surfaces remain `src/`, `.opencode/`, `.hivemind/`, `.planning/`. | `.planning/codebase/ARCHITECTURE.md:38-44`, `.planning/codebase/STRUCTURE.md:86-134` |
| Bun-only assumptions | REJECT | Hivemind Node.js runtime is primary; Bun PTY is optional and must gracefully fall back. | `.planning/PROJECT.md:52-56`, `.planning/codebase/ARCHITECTURE.md:287-293` |
| Direct `writeFileSync` persistence | REJECT | Durable state must flow through typed Hivemind state modules/tools and preserve CQRS boundaries. | `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:339-353` |
| OMO names/taxonomy | REJECT | Hivemind SHALL retain hm/hf/gate/stack lineages and L0/L1/L2/L3 hierarchy. | `.planning/codebase/ARCHITECTURE.md:217-245` |
| `.sisyphus` / `.omx` roots | REJECT | Runtime state root SHALL remain `.hivemind/`; `.opencode/` remains primitives-only. | `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/archive/2026-05-07/research/OMO-ARCHITECTURE-DEEP-DIVE.md:408-416` |

---

## Risks and Gap Detection

| Gap Type | Risk | Severity | Mitigation |
|---|---|---|---|
| Missing Scope | Sector boundaries are not yet mapped to actual files and consumers. | HIGH | Require inventory checklist before any implementation. |
| Hidden Constraint | OpenCode SDK/plugin APIs may differ from OMO assumptions. | HIGH | Require SDK/server API checkpoint before future runtime work. |
| Contradiction | Roadmap currently prioritizes CA-04 bootstrap while Option 3 adds governance foundation. | MEDIUM | Treat Option 3 as docs-only pre-phase layered onto CA-04, not a replacement. |
| Unvalidated Assumption | OMO patterns may appear reusable but lack Hivemind runtime proof. | HIGH | Gate evidence remains L5; runtime readiness fails until L1-L3 proof exists. |

---

## Falsifiable Requirements

### REQ-OMO-01: Preserve Hivemind Surface Identity
**Source:** `.planning/PROJECT.md:5-8`; `.planning/codebase/ARCHITECTURE.md:38-44`; adapt/reject rows at this artifact lines 45-49.  
**Condition:** The adaptation plan SHALL preserve Hivemind surface identity by mapping adaptation guidance only to the existing `src/`, `.opencode/`, and `.hivemind/` surfaces.  
**Acceptance Criteria:** Given this document, when a reviewer inspects the adapt/reject table, then copied OMO roots are explicitly rejected and Hivemind surfaces are named.  
**Verification Method:** Documentation inspection.  
**Status:** locked

### REQ-OMO-02: Evidence Level Honesty
**Source:** `.planning/codebase/ARCHITECTURE.md:247-255`; `.planning/archive/2026-05-07/research/omo-findings.md:139-158`; option route constraints at this artifact lines 27-30.  
**Condition:** The adaptation plan SHALL classify every docs-only Option 3 output as L5 evidence.  
**Acceptance Criteria:** Given this document and checklist, when a reviewer searches for runtime readiness claims, then implementation readiness is blocked until L1-L3 proof exists.  
**Verification Method:** Documentation inspection.  
**Status:** locked

### REQ-OMO-03: Future-Phase Boundary
**Source:** `.planning/ROADMAP.md:29-47`; `.planning/REQUIREMENTS.md:73-82`; future routing constraints at this artifact lines 57-60.  
**Condition:** The adaptation plan SHALL classify bootstrap/init CLI, config realm cleanup, routing workflow foundation, and session/task continuity management as future-phase work.  
**Acceptance Criteria:** Given `.planning/ROADMAP.md`, when a reviewer inspects planned/future work, then these future phases appear without runtime implementation claims.  
**Verification Method:** Roadmap inspection.  
**Status:** locked

---

## Acceptance Matrix

| REQ ID | Source quote/path | Positive | Negative | Boundary | Integration | Verification method | Coverage state |
|---|---|---|---|---|---|---|---|
| REQ-OMO-01 | `.planning/PROJECT.md:5-8`; `.planning/codebase/ARCHITECTURE.md:38-44`; this artifact lines 45-49 | Reviewer finds `src/`, `.opencode/`, and `.hivemind/` named as Hivemind surfaces and OMO root copying rejected. | OMO folder roots such as `.sisyphus` or `.omx` are adopted as Hivemind roots. | OMO concepts may be referenced only when transformed to existing Hivemind surfaces. | Cross-checks OMO research evidence against Hivemind architecture boundaries. | Documentation inspection of Source Audit and Adapt / Reject Table. | mapped |
| REQ-OMO-02 | `.planning/codebase/ARCHITECTURE.md:247-255`; `.planning/archive/2026-05-07/research/omo-findings.md:139-158`; this artifact lines 27-30 | Artifact states docs-only scope and L5 documentation evidence only. | Artifact claims runtime implementation readiness from documentation. | Future runtime readiness may pass only with L1-L3 proof outside this docs-only artifact. | Links roadmap/checklist evidence gates to adaptation scope. | Search planning artifacts for `Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists` and inspect evidence-level metadata. | mapped |
| REQ-OMO-03 | `.planning/ROADMAP.md:29-47`; `.planning/REQUIREMENTS.md:73-82`; this artifact lines 57-60 | Future phases are listed as blocked/future work without delivered runtime claims. | Bootstrap/init, routing, config cleanup, or continuity work is marked delivered by this artifact. | O3-04 may receive a blueprint artifact only; it must not authorize source-sector `AGENTS.md` edits by itself. | Connects OMO adaptation findings to CA-04/O3 roadmap sequencing. | Roadmap inspection plus review of future phase routing statements. | mapped |
