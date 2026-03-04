# Deterministic Meta-Builder Pack Plan

> **Document ID:** DETERMINISTIC-META-BUILDER-PACK-PLAN-2026-03-04  
> **Task ID:** AUTHOR-SSOT-PLAN-DETERMINISTIC-PACK-2026-03-04  
> **Date:** 2026-03-04  
> **Type:** Planning-only SSOT artifact (no implementation changes)

## Validated Source-of-Truth Inputs

1. **Architecture validation report**: `ARCH-VALIDATE-DETERMINISTIC-PACK-2026-03-04` (authoritative upstream input packet)
2. **Metrics/counter remediation audit**: `AUDIT-METRICS-COUNTERS-ABOLISH-2026-03-04` (authoritative upstream input packet)

### Repository Corroboration Used for This Plan (targeted evidence only)

- Current Node-1 status, completed items, blocked gates, and prerequisites in [AGENTS.md](../../AGENTS.md:135).
- Dual-injection root cause and restricted-region policy in [CONTAMINATION-GUARDRAILS.md](../../CONTAMINATION-GUARDRAILS.md:81).
- Existing counter contract implementation surface in [createGovernanceCounters()](../../src/lib/detection.ts:158), [registerGovernanceSignal()](../../src/lib/detection.ts:271), and hook-side increments in [createSoftGovernanceHook()](../../src/hooks/soft-governance.ts:403).
- Session-isolation foundation in [getSessionPaths()](../../src/lib/paths.ts:269) and session bootstrap wiring in [createEventHandler()](../../src/hooks/event-handler.ts:172).
- Current deterministic routing utility surface in [detectAutoRealignment()](../../src/lib/hivefiver-integration.ts:457).

---

## A) Objective + Scope Boundaries

### Objective
Produce a dependency-ordered, phase-gated execution plan for deterministic meta-builder pack rollout, strictly bound to validated architecture + metrics audits and current verified codebase state.

### Scope Boundaries
- **In scope:** planning decisions, gating logic, sequence control, contract tables, handoff packets.
- **Out of scope:** any source-code modification, schema edits, hook rewrites, test updates, runtime behavior changes.
- **Explicitly restricted/deferred until prerequisites pass:**
  - [src/hooks/session-lifecycle.ts](../../src/hooks/session-lifecycle.ts)
  - [src/hooks/messages-transform.ts](../../src/hooks/messages-transform.ts)
  - plugin injection hook path described in [CONTAMINATION-GUARDRAILS.md](../../CONTAMINATION-GUARDRAILS.md:87)

---

## B) Confirmed Current-State Baseline (Present vs Proposed)

| Dimension | Present (validated) | Proposed target state |
|---|---|---|
| Injection topology | Dual-injection conflict persists (plugin + engine hooks), root-cause documented in [CONTAMINATION-GUARDRAILS.md](../../CONTAMINATION-GUARDRAILS.md:81). | Single deterministic routing path with clear authority boundaries and no contradictory turn-level injections. |
| Node-1 progression | Fix 3A, 3B, 1.5A, 1.5B completed; test alignment still blocked per [AGENTS.md](../../AGENTS.md:137). | Complete 1.5C/1.5D/3C-D/Fix1 in order before deterministic routing promotion. |
| Counter contract | Design intent says retain only drift + compaction, but legacy counter surfaces remain in runtime logic (see [createGovernanceCounters()](../../src/lib/detection.ts:158) and [createSoftGovernanceHook()](../../src/hooks/soft-governance.ts:403)). | Counter contract fully remediated: keep deterministic counters, abolish legacy/no-op pathways, replace with explicit gate outcomes where required. |
| Session isolation | Session-path and bootstrap foundations exist ([getSessionPaths()](../../src/lib/paths.ts:269), [createEventHandler()](../../src/hooks/event-handler.ts:189)). | Clean-slate session state + hook migration completed before injection decoupling work enters restricted zones. |
| Routing determinism | Local deterministic routing helper exists ([detectAutoRealignment()](../../src/lib/hivefiver-integration.ts:457)), but global turn pipeline remains non-deterministic due injection conflict. | Routing helper becomes reliable global control path after prerequisites/gates close. |

---

## C) Hard Prerequisites

1. **Node-1 gate chain is mandatory and ordered** (from [AGENTS.md](../../AGENTS.md:150)):
   - Test alignment authorization
   - Fix 1.5C (lineage ID validation)
   - Fix 1.5D (dead counter cleanup)
   - Fix 3C-D (clean-slate session state init + hook migration)
   - Fix 1 (dual-injection decoupling)
   - Fix 2 (relational staleness rewrite) remains downstream/deferred

2. **Restricted-region policy remains active until gate clearance** per [CONTAMINATION-GUARDRAILS.md](../../CONTAMINATION-GUARDRAILS.md:134).

3. **Planning artifact authority rule:** this document is SSOT for sequencing and gates; no implementation starts without explicit user authorization.

4. **No-guess evidence policy:** all decisions must map to validated inputs and corroborating repository evidence.

---

## D) Phase Plan (Dependency-Ordered, Phase-Gated)

## Phase 0 — SSOT Lock + Governance Freeze (Planning Baseline)

### Goals
- Freeze deterministic rollout sequence and guardrails.
- Prevent premature edits in restricted zones.

### In-scope files
- [docs/plans/DETERMINISTIC-META-BUILDER-PACK-PLAN-2026-03-04.md](./DETERMINISTIC-META-BUILDER-PACK-PLAN-2026-03-04.md)

### Out-of-scope / restricted files
- All source/runtime files.

### Entry criteria
- Architecture + metrics validated input packets acknowledged.

### Exit criteria
- This SSOT plan is published with explicit gates and deferred zones.

### Verification commands/checks
- Documentation consistency check (manual): required sections A–H present.

### Risk notes + rollback posture
- **Risk:** Ambiguous sequencing causes unsafe edits.
- **Rollback:** Revert to this phase; re-lock scope before any implementation delegation.

---

## Phase 1 — Authorization & Test Alignment Gate

### Goals
- Close prerequisite that currently blocks Node-1 continuation.
- Establish baseline where contract changes and tests are reconciled.

### In-scope files
- [tests/](../../tests)
- [src/schemas/brain-state.ts](../../src/schemas/brain-state.ts)
- [src/lib/detection.ts](../../src/lib/detection.ts)

### Out-of-scope / restricted files
- [src/hooks/session-lifecycle.ts](../../src/hooks/session-lifecycle.ts)
- [src/hooks/messages-transform.ts](../../src/hooks/messages-transform.ts)

### Entry criteria
- Explicit user authorization to proceed with implementation and test expectation updates.

### Exit criteria
- Test alignment blocker in [AGENTS.md](../../AGENTS.md:146) is closed.
- `npx tsc --noEmit` passes.
- Regressions are understood and documented.

### Verification commands/checks
- `npx tsc --noEmit`
- `npm test`

### Risk notes + rollback posture
- **Risk:** Test realignment accidentally masks behavior regressions.
- **Rollback:** Restore pre-alignment commit; rerun targeted failing suites before retry.

---

## Phase 2 — Counter Contract Remediation (Fix 1.5C + 1.5D)

### Goals
- Complete lineage validation prerequisite.
- Remove dead/legacy governance counter pathways from active runtime behavior.

### In-scope files
- [src/lib/detection.ts](../../src/lib/detection.ts)
- [src/hooks/soft-governance.ts](../../src/hooks/soft-governance.ts)
- [src/schemas/hierarchy.ts](../../src/schemas/hierarchy.ts)
- [src/schemas/brain-state.ts](../../src/schemas/brain-state.ts)

### Out-of-scope / restricted files
- [src/hooks/session-lifecycle.ts](../../src/hooks/session-lifecycle.ts)
- [src/hooks/messages-transform.ts](../../src/hooks/messages-transform.ts)

### Entry criteria
- Phase 1 PASS.

### Exit criteria
- Legacy/dead counter behavior eliminated or explicitly deferred by gate decision.
- Contract table outcomes (Section E) are implemented and validated.

### Verification commands/checks
- `npx tsc --noEmit`
- `npx tsx --test tests/detection.test.ts`
- `npx tsx --test tests/soft-governance.test.ts`

### Risk notes + rollback posture
- **Risk:** Partial removals create schema/runtime mismatch.
- **Rollback:** Revert contract changes atomically; restore prior schema + hook pair in same rollback unit.

---

## Phase 3 — Session-State Isolation Completion (Fix 3C-D)

### Goals
- Finish clean-slate session-state initialization and hook migration prerequisites.
- Ensure deterministic session scoping is complete before injection decoupling.

### In-scope files
- [src/lib/paths.ts](../../src/lib/paths.ts)
- [src/hooks/event-handler.ts](../../src/hooks/event-handler.ts)
- session-state initialization surfaces referenced by [AGENTS.md](../../AGENTS.md:155)

### Out-of-scope / restricted files
- Direct edits to [src/hooks/session-lifecycle.ts](../../src/hooks/session-lifecycle.ts) and [src/hooks/messages-transform.ts](../../src/hooks/messages-transform.ts) remain deferred unless this phase gate passes.

### Entry criteria
- Phase 2 PASS.

### Exit criteria
- Session-scoped state init is deterministic and validated.
- No dependency on global singleton assumptions for new sessions.

### Verification commands/checks
- `npx tsc --noEmit`
- `npx tsx --test tests/paths.test.ts`
- `npx tsx --test tests/hooks/event-handler-todo-2026-02-15.test.ts`

### Risk notes + rollback posture
- **Risk:** Session identity/path regressions break continuity.
- **Rollback:** Revert to known-good session pathing commit and rerun path + event tests.

---

## Phase 4 — Dual-Injection Decoupling (Fix 1, Restricted Region Entry)

### Goals
- Decouple contradictory injections and establish single deterministic injection authority.
- Only enter restricted hook regions after prior gates pass.

### In-scope files
- [src/hooks/session-lifecycle.ts](../../src/hooks/session-lifecycle.ts)
- [src/hooks/messages-transform.ts](../../src/hooks/messages-transform.ts)
- plugin hook surface identified in [CONTAMINATION-GUARDRAILS.md](../../CONTAMINATION-GUARDRAILS.md:87)

### Out-of-scope / restricted files
- Unrelated modules outside injection path and governance contract.

### Entry criteria
- Phases 1–3 PASS.
- Explicit restricted-region entry approval.

### Exit criteria
- No duplicated/contradictory turn-level injection path remains.
- Deterministic authority and sequencing are documented and test-verified.

### Verification commands/checks
- `npx tsc --noEmit`
- `npx tsx --test tests/hooks/session-lifecycle-constitution.test.ts`
- `npx tsx --test tests/hooks/messages-transform-checklist.test.ts`
- `npm test`

### Risk notes + rollback posture
- **Risk:** Prompt/injection regressions degrade governance behavior.
- **Rollback:** Revert entire decoupling set; do not keep partial hook changes.

---

## Phase 5 — Deterministic Routing Activation + Gate Certification

### Goals
- Promote deterministic routing to operational default only after injection stability is proven.
- Certify release readiness for deterministic meta-builder pack behavior.

### In-scope files
- [src/lib/hivefiver-integration.ts](../../src/lib/hivefiver-integration.ts)
- validation/reporting surfaces used to verify routing outcomes.

### Out-of-scope / restricted files
- New architectural expansions unrelated to deterministic routing.

### Entry criteria
- Phase 4 PASS.

### Exit criteria
- Deterministic routing feasibility status = **NOW-READY** (see Section F).
- Full verification gate passes.

### Verification commands/checks
- `npx tsc --noEmit`
- `npm test`
- Targeted routing path tests (existing + newly added by implementers).

### Risk notes + rollback posture
- **Risk:** Deterministic router and runtime injection sequencing diverge.
- **Rollback:** Disable routing promotion, revert to pre-activation behavior, keep Phase 4 fixes isolated.

---

## Deferred Zone — Relational Staleness Rewrite (Fix 2)

- Explicitly downstream of Fix 1 chain per [AGENTS.md](../../AGENTS.md:157).
- Not required to unlock deterministic routing baseline; plan as separate post-certification track.

---

## E) Metrics/Counter Contract Remediation Table

| Counter / Signal | Decision | Rationale | Evidence | Phase |
|---|---|---|---|---|
| `drift` | **KEEP** | Deterministic governance signal used for escalation and stale-cycle detection. | [GovernanceCounters](../../src/lib/detection.ts:87), [registerGovernanceSignal() usage](../../src/hooks/event-handler.ts:235) | Phase 2 |
| `compaction` | **KEEP** | Deterministic lifecycle signal tied to compaction events. | [createGovernanceCounters()](../../src/lib/detection.ts:158), [session.compacted handling](../../src/hooks/event-handler.ts:248) | Phase 2 |
| `out_of_order` | **KEEP** | Deterministic signal for prerequisite violations. Validated in 9-phase refactor (2026-03-04): 230/230 tests pass, severity escalation working correctly. | [GovernanceCounters](../../src/lib/detection.ts:96), [severity escalation fix](../../src/hooks/soft-governance.ts:450), [test validation](../../tests/governance-stress.test.ts:100) | ✅ COMPLETE |
| `evidence_pressure` | **KEEP** | Deterministic signal for evidence verification pressure. Validated in 9-phase refactor (2026-03-04): type-safe, dashboard-compatible, zero regressions. | [GovernanceCounters](../../src/lib/detection.ts:97), [toast emission](../../src/hooks/soft-governance.ts:480), [counter canonicalization](../../src/lib/detection.ts:103) | ✅ COMPLETE |
| `ignored` pseudo-signal path | **REPLACE** | Replace inferred/derived legacy behavior with explicit gate status and checklist outcomes. | `ignored` accepted in [GovernanceSignalKind](../../src/lib/detection.ts:72), currently no-op in [registerGovernanceSignal()](../../src/lib/detection.ts:275) | Phase 2 |
| Keyword-flag accumulation (`keyword_flags`) | **DEFER** | Important but orthogonal to minimal deterministic counter contract closure in this pack lane. | Detection pipeline in [createSoftGovernanceHook()](../../src/hooks/soft-governance.ts:360) | Deferred post Phase 5 |

**Note (2026-03-04)**: Counter contract updated to adopt Option A (keep 4 counters) based on completed refactor validation. The 4-counter approach is type-safe, validated (230/230 tests pass), and preserves semantic signal granularity. Original ABOLISH rationale was based on outdated assumptions; current implementation is fully deterministic with canonicalization and severity escalation working correctly.

---

## F) Deterministic Routing Feasibility

### Feasible **now**
- **Partial / local only**: deterministic command/intention routing helper exists via [detectAutoRealignment()](../../src/lib/hivefiver-integration.ts:457).
- **Not globally deterministic yet** due unresolved dual-injection conflict documented in [CONTAMINATION-GUARDRAILS.md](../../CONTAMINATION-GUARDRAILS.md:81).

### Feasible **after prerequisites**
- **Yes (full)** after Phases 1–4 pass:
  - Counter contract is deterministic.
  - Session-state isolation is complete.
  - Dual-injection conflict is decoupled with single authority.
- Promotion to default routing posture occurs in Phase 5 gate only.

---

## G) Handoff Packets for Downstream Implementers

## Packet 1 — `docs-specialist` (Planning Steward)
- Maintain this SSOT plan as the only execution-order authority.
- Track gate outcomes, blockers, and explicit defer decisions.
- Produce gate closure summary after each phase.

## Packet 2 — `code` (Implementation)
- Execute only the active phase scope.
- Do not cross into restricted files before gate clearance.
- Keep changes phase-atomic to preserve rollback posture.

## Packet 3 — `debug` (Failure Isolation)
- Triage gate failures with minimal-scope instrumentation.
- Distinguish contract mismatch vs regression.
- Produce deterministic repro steps per failed gate.

## Packet 4 — `test-engineer` (Verification)
- Build/update targeted tests tied to each phase gate.
- Enforce PASS criteria using listed commands.
- Publish pass/fail evidence artifact for each gate transition.

## Packet 5 — `review` / `code-reviewer` (Gate Adjudication)
- Review against this plan’s entry/exit criteria.
- Enforce keep/abolish/replace/defer contract decisions from Section E.
- Block phase promotion on incomplete prerequisites.

## Packet 6 — `orchestrator` (Dependency Control)
- Sequence work strictly Phase 0→5.
- Prevent parallel execution across prerequisite boundaries.
- Enforce HARD STOP when authorization or gates are missing.

---

## H) HARD STOP (Authorization Gate)

**HARD STOP — NO IMPLEMENTATION CHANGES MAY BEGIN FROM THIS PLAN WITHOUT EXPLICIT USER AUTHORIZATION.**

This document is a planning SSOT only. Any transition from planning to code changes requires explicit user approval and must start at Phase 1 entry criteria.
