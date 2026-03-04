# Compact Superiority — Master Design (Master Synthesis)

> **Document ID:** COMPACT-SUPERIORITY-MASTER-DESIGN-2026-03-03  
> **Date:** 2026-03-03  
> **Type:** Final synthesis package  
> **Scope:** Documentation-only architecture synthesis and rollout governance

---

## 1) Executive Synthesis

Compact Superiority is **design-coherent but rollout-blocked**.

- **State:** Architecture for CIS/RLE/AEM/PDF is specified and insertion-ready at existing runtime seams.
- **Refactor needs:** P0/P1/P2 contradictions must close before any release-valid execution.
- **Recovery status:** Context purification succeeded in making conflicts explicit and prioritized, but final readiness remains partial.
- **Structural health:** Core architecture is stable in intent; operational reliability is constrained by governance/path/CQRS/compaction inconsistencies.

### Current readiness snapshot

- P0: **FAIL** (contract + terminology + semantics contradictions)
- P1: **FAIL** (path canonicality drift)
- P2: **FAIL** (CQRS enforcement by convention + split compaction authority)
- P3: **PARTIAL** (CIS/RLE planned, dependency-blocked)
- P4: **PARTIAL** (AEM/PDF planned, dependency-blocked)
- P5: **FAIL/HOLD** (release adjudication blocked by unresolved P0)

---

## 2) Terminology Canonicalization Policy

**Canonical policy note:**
- **OpenCode terminology is canonical for project artifacts.**
- **Kilocode mode terminology is orchestration-only for this development environment.**

### Canonical + orchestration alias map (clarification only)

| Canonical OpenCode term (project artifacts) | Kilocode orchestration alias (environment-only) | Rule |
|---|---|---|
| agents / subagents | modes | Keep OpenCode wording in project documents; use alias only for internal routing mechanics. |
| delegation / delegation packet | handoff / handoff packet | Keep OpenCode wording in artifacts; aliases are allowed in execution handoff metadata only. |
| context window | budget | Keep `context window` in ecosystem-facing docs; `budget` is allowed in orchestration diagnostics. |
| front-facing coordinator agent | orchestrator mode behavior | Use OpenCode persona language in artifacts; mode alias allowed for platform execution notes. |
| builder / executor agent | `code` / `debug` mode behavior | Keep role language in project-facing architecture; use mode labels only in orchestration lanes. |
| research / explorer subagent | `ask` / research-mode behavior | Keep OpenCode role framing in artifacts; mode alias is internal-only. |
| auto-compact continuation | continuity recovery session | Treat as equivalent labels; prefer artifact-local OpenCode phrasing outside orchestration notes. |

### Usage policy

1. Project artifacts must use OpenCode-canonical terminology.
2. Internal orchestration notes in this environment may use Kilocode mode aliases.
3. Historical terminology may appear only when explicitly labeled as historical/contextual evidence.

---

## 3) Compact Superiority Architecture (Final)

### 3.1 Final component model

1. **CIS — Context Intelligence System**  
   Context sensing + trigger decisioning for session continuity/split/recovery behavior.

2. **RLE — Run-time Load Enforcer**  
   Runtime load declaration/validation with throttle/escalation controls.

3. **AEM — Auto-Export Mechanism**  
   Export-before-prune for stale fragments to preserve continuity integrity.

4. **PDF — Progressive Disclosure Framework**  
   L0-L3 budget-gated disclosure to control context inflation without losing critical signal.

### 3.2 Non-intrusive integration strategy

- Insert at existing hook/library chokepoints instead of replacing core runtime flows.
- Preserve queue-centric mutation doctrine while upgrading enforcement from convention to gate.
- Stage rollout in strict dependency order (P0→P5), with no bypass of failed upstream gates.

### 3.3 Evidence-backed insertion points in codebase

| Component | Primary insertion point | Secondary insertion point | Why this is the correct seam |
|---|---|---|---|
| CIS | `src/hooks/session-lifecycle.ts` | `src/hooks/session-lifecycle-helpers.ts` | Existing turn-level context orchestration and first-turn assembly |
| RLE | `src/hooks/session-lifecycle.ts` | `src/lib/state-mutation-queue.ts` | Budget assembly + mutation boundary choke point |
| AEM | `src/lib/context-purifier.ts` | `src/tools/hivemind-context.ts`, `src/lib/compaction-engine.ts` | Purification pipeline is natural export-before-prune control surface |
| PDF | `src/hooks/session-lifecycle.ts` | `src/hooks/session-lifecycle-helpers.ts` | Existing prioritized budget-aware section assembly |

### 3.4 Architecture preconditions (hard)

No compact-core rollout is valid until:
- P0 contract contradictions are closed,
- P1 path governance is canonicalized,
- P2 CQRS + compaction authority stabilization is passed.

---

## 4) Relational Landscape Summary

### 4.1 Domain and dependency topology

Active domains are:
- Governance contract canonicalization
- Path/state topology integrity
- CQRS boundary integrity
- Compaction authority unification
- Compact core rollout (CIS/RLE/AEM/PDF)
- Terminology and handoff alignment
- Verification/release gates

Dependency order is strict and one-way:
**D1 → D2/D3 → D4 → D5 → D6 → D7**

### 4.2 Entity/dependency posture

- Entity landscape is sufficiently mapped for planning and sequencing.
- Structural relationships are usable for governance and rollout coordination.
- Numeric inventory claims in mapping artifacts are treated as directional unless revalidated in a dedicated audit pass.

### 4.3 Symlink/path integrity status

| Area | Status | Summary |
|---|---|---|
| Resolver-first policy | ACTIVE | Canonical path policy exists and is clear |
| Stale path references | OPEN BLOCKER | Non-canonical hierarchy path references remain in active surfaces |
| Queue mutation pathing | PARTIAL | Queue centrality is documented, but enforcement remains convention-heavy |
| `symlink_contexts/` design dependency | UNVERIFIED | Design present at spec level; runtime dependency not yet validated |

---

## 5) Conflict / Blocker Register

| Priority | Blocker | Impact | Mitigation |
|---|---|---|---|
| P0 | Confirmation contract contradiction (main vs delegated sub-session vs continuity recovery) | Deadlock/non-deterministic execution behavior | Publish a single canonical session-behavior matrix and supersede conflicting text |
| P0 | Canonical path drift (`.hivemind/...` stale classes) | Wrong-state reads/writes and invalid diagnostics | Enforce stale-path lint + replace non-canonical active references |
| P0/P1 | Compaction authority split (engine path vs hook path) | Divergent compaction outcomes and ambiguous source-of-truth | Select one canonical compaction path and route all entrypoints through it |
| P1 | Dual governance semantics (`governance_mode` vs `governance_status`) | Operator/runtime semantic ambiguity | Define one canonical field model + migration/deprecation mapping |
| P1 | Multi-surface SSoT drift (docs/skills/commands) | Inconsistent policy enforcement | Enforce ordered SSoT stack with drift-check cadence |
| P1 | CQRS enforcement by convention | Mutation sequencing risk | Promote pre-write flush to framework-level hard boundary invariant |
| P2 | Terminology drift | Coordination overhead and onboarding confusion | Enforce OpenCode-canonical glossary for artifacts; permit mode aliases only in orchestration-only sections |

---

## 6) Phased Rollout

### Phase 0 — Contract Lock and Canonical Vocabulary
- **Critical Phases:** Entry gate for every downstream phase
- **What’s Next:** Publish canonical contract matrix (session types + governance semantics)
- **Ongoing:** Terminology alignment to OpenCode-canonical vocabulary with orchestration-only mode aliases
- **Undone:** Confirmation contradiction and dual governance semantics

### Phase 1 — Path and State Governance Hardening
- **Critical Phases:** Prerequisite for deterministic runtime behavior
- **What’s Next:** Run stale-path elimination + resolver-conformance closure
- **Ongoing:** Resolver-first path policy
- **Undone:** Active stale hierarchy-path references

### Phase 2 — CQRS and Compaction Authority Stabilization
- **Critical Phases:** Mandatory precondition before compact-core insertion
- **What’s Next:** Enforce global pre-write flush + unify compaction authority
- **Ongoing:** Queue-centric mutation doctrine
- **Undone:** Convention-only enforcement and split authority

### Phase 3 — Compact Core Foundation (CIS + RLE)
- **Critical Phases:** Foundation for Phase 4
- **What’s Next:** Implement CIS then RLE in sequence
- **Ongoing:** Insertion-point strategy complete
- **Undone:** Operational rollout across all orchestration flows

### Phase 4 — Compact Core Expansion (AEM + PDF)
- **Critical Phases:** Requires P3 pass
- **What’s Next:** Integrate export-before-prune and progressive disclosure gates
- **Ongoing:** Staleness and budget policy shaping
- **Undone:** Cross-handoff retention/disclosure verification

### Phase 5 — Integration Gate and Release Adjudication
- **Critical Phases:** Final release gate
- **What’s Next:** Re-run integrated PASS/PARTIAL/FAIL adjudication
- **Ongoing:** Evidence trace collection
- **Undone:** Release closure while any P0 remains unresolved

---

## 7) Governance & Guardrails

### 7.1 CQRS guardrails
- Hook surfaces remain read-oriented and must not become direct mutation surfaces.
- All writes must pass queue boundary and mandatory pre-write flush behavior.
- Any detected mutation bypass is a fail-close condition.

### 7.2 Source-of-truth ordering (SOT)
1. Operational baseline (`AGENTS.md`)
2. Dated phase/canonicalization package in `docs/plans/`
3. Constitutional reference (`AGENT_RULES.md`)

### 7.3 Evidence gates
- **G0:** Contract singularity and canonical vocabulary
- **G1:** Path integrity and resolver conformance
- **G2:** CQRS hard-boundary enforcement
- **G3:** Compaction authority singularity
- **G4:** Ordered CIS/RLE/AEM/PDF completion
- **G5:** Integrated release adjudication with no open P0

### 7.4 Rollback triggers
- Reappearance of contradictory confirmation policy in active normative artifacts
- Reintroduction of stale non-canonical path references
- Mixed compaction authorities in one release window
- Any write path that bypasses mandatory queue-boundary behavior
- Attempted phase promotion with unresolved P0 blocker

---

## Final Synthesis Statement

Compact Superiority is **design-complete and insertion-ready at architecture level**, but **not rollout-ready**. Readiness requires closure of P0/P1/P2 blockers under gate-verified governance before any release-valid execution claim is made.
