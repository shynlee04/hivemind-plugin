# Dashboard-v2 Phase 8 Orchestration Loop (System-Wide)

> Date: 2026-02-26
> Scope: Phase 8 only (orchestration architecture loop), with Phase 9 linkage
> Mode: strict, plan_driven
> Source inputs: `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md`, `docs/plans/dashboard-v2-overhaul-plan-2026-02-26.md`

---

## 1) Phase 8 Definition

Phase 8 is not a one-timer. It is a continuous orchestration loop that transforms research intelligence into controlled execution waves with strict gates and anti-drift controls.

Mission:
- Convert full project inventory into execution packets
- Enforce gates before/within/after every wave
- Keep main session as single orchestrator authority
- Emit Phase 9-ready hardening artifacts incrementally

Out of scope:
- No direct source implementation in this planning artifact
- No unconstrained delegation

---

## 2) Non-Negotiable Delegation Contract

Main-session authority:
- The main session is the only orchestration authority.

Absolute constraint:
- No sub-of-sub delegation allowed.
- Any delegated sub-session is forbidden from further delegation.
- All outputs must return directly to main session, including research, review, and context prep.

Mandatory delegation footer (include in every sub-task prompt):
- `ABSOLUTE BAN: Do NOT delegate to any other subagent. Return results directly to main orchestrator session.`

---

## 3) Hierarchical Model (Phase 8)

Hierarchy:
- Trajectory: production-grade dashboard control plane, end-to-end reliability
- Tactic: Phase 8 orchestration loop and gate discipline
- Action: wave packetization and gate decisions

Loop primitive:
- Research + Context -> Plan -> Validation Design -> Document -> Execute Wave -> Gate Review -> Iterative Retune -> Next Wave

---

## 4) Phase 8 Subphases (8.01 - 8.08)

### 8.01 Research + Context Sync
Entry:
- Latest inventory exists
- Current blind spots list exists

Exit:
- Delta list produced (new gaps, changed dependencies, blocked items)
- Confidence score recorded (`full|partial|low`)

Gate:
- Evidence references required for each delta

### 8.02 Planning Slice
Entry:
- 8.01 deltas accepted

Exit:
- One bounded wave `Wn` defined with explicit scope and dependencies
- Entry/exit criteria drafted

Gate:
- No mixed-scope wave (single bounded objective per wave)

### 8.03 Validation Design
Entry:
- `Wn` scope and dependencies locked

Exit:
- Pre-gate / In-gate / Post-gate checks defined
- Evidence obligations listed (commands, outputs, artifacts)

Gate:
- No execution allowed without testable exit criteria

### 8.04 Documentation Packet
Entry:
- Validation matrix complete

Exit:
- Wave packet artifact published under `docs/plans/`
- Risk register updated

Gate:
- Traceability check: requirement -> wave -> evidence

### 8.05 Execution Orchestration
Entry:
- 8.04 packet approved

Exit:
- Delegated tasks dispatched sequentially or parallel-by-proof
- Each return captured with evidence and disposition

Gate:
- Delegation contract enforced (no sub-of-sub)

### 8.06 Gatekeeping + Guardrails
Entry:
- At least one delegated return received

Exit:
- Pass/fail decision for wave
- Retune directive or closeout decision

Gate:
- Evidence-before-claim strictness (`npm test`, `npx tsc --noEmit` when code changes exist)

### 8.07 Iterative Retune Loop
Entry:
- Any fail/partial result or new dependency

Exit:
- Corrected wave packet `Wn+delta`
- Updated constraints and success criteria

Gate:
- No forward progress on unresolved blockers without explicit carry-forward record

### 8.08 Phase 9 Linkage Export
Entry:
- Wave closed (pass or controlled defer)

Exit:
- Emit Phase 9 hardening artifacts:
  - reliability obligations
  - refactor obligations
  - production verification obligations

Gate:
- Every deferred item mapped to a Phase 9 lane with owner and verification requirement

---

## 5) Wave Catalog (Current)

### W0 Component Restructuring (COMPLETE)
**Added**: 2026-02-26
**Closeout**: 2026-02-26 (W0.5 reconciliation)
**Trigger**: `index.tsx` at 969 LOC (3.2x over 300 LOC strategic limit)

Scope delivered:
- W0.1 state extraction (`state.ts`)
- W0.2 panel extraction + shared constants
- W0.3 `MainPanel`/`HelpOverlay` extraction
- W0.4 keyboard/polling hook extraction
- W0.5 closeout reconciliation and gate encoding

Closeout snapshot:
- `index.tsx` LOC progression: `969 -> 862 -> 531 -> 395 -> 240`
- Strategic LOC target achieved: `index.tsx` now 240 (`<300`)
- Key files present: `state.ts`, `constants.ts`, `panels/*.tsx` (7 files), `components/MainPanel.tsx`, `components/HelpOverlay.tsx`, `hooks/useDashboardData.ts`, `hooks/useKeyboardHandler.ts`

Closeout gate outcomes:
- `cd /Users/apple/hivemind-plugin/src/dashboard-v2 && bunx tsc --noEmit` -> PASS
- `cd /Users/apple/hivemind-plugin && npx tsc --noEmit` -> PASS
- `cd /Users/apple/hivemind-plugin && npm test` -> PASS (197 pass, 0 fail)

### W1 Real-Time Spine
Scope:
- SSE integration model, reconnect strategy, live status surfaces

Entry criteria:
- API event schema confirmed

Exit criteria:
- Live update contract documented
- Reconnect and fallback behavior documented

Status: ✅ COMPLETE

### W2 Interaction Completeness
Scope:
- Input modal paths, language toggle, help overlay interaction map

Entry criteria:
- Modal state model present

Exit criteria:
- Interaction matrix complete (keyboard and mouse paths)

Status: ✅ CLOSEOUT (partial-pass)

Closeout notes:
- W2.1-W2.3 are complete.
- W2.4 completed as mouse capability audit + interaction matrix declaration with code-grounded evidence.
- Mouse lane is explicitly unsupported in current runtime contract and deferred to Phase 9 with owner + verification obligations.
- Evidence artifact: `docs/plans/dashboard-v2-phase8-w2-4-mouse-path-declaration-2026-02-26.md`.

### W3 Observability Surfaces
Scope:
- Swarm monitor, tool registry, time-travel surfaces

Entry criteria:
- V1 gap mapping confirmed
- W2 completion (W0 blocker removed)

Exit criteria:
- Panel contracts + data ownership map complete

Status: 🚧 IMPLEMENTATION KICKOFF ACTIVE (W3.5 adjudication published; implementation kickoff packet published)

Kickoff artifact:
- `docs/plans/dashboard-v2-phase8-w3-execution-packet-2026-02-26.md`
- `docs/plans/dashboard-v2-phase8-w3-implementation-kickoff-packet-2026-02-26.md`

Timestamped loop update (2026-02-26T16:33:41Z):
- W3.2 ToolRegistry contract published (docs-only): `docs/plans/dashboard-v2-phase8-w3-2-tool-registry-contract-2026-02-26.md`
- W3 remains pre-gate/open and implementation is not started in this update.
- Next dispatch-ready action: `W3.3` TimeTravel contract lane.

Timestamped loop update (2026-02-26T16:41:14Z):
- W3.3 TimeTravel contract published (docs-only): `docs/plans/dashboard-v2-phase8-w3-3-time-travel-contract-2026-02-26.md`
- W3 remains pre-gate/open and implementation is not started in this update.
- Next dispatch-ready action: `W3.4` ownership/event map lane.

Timestamped loop update (2026-02-26T16:46:58Z):
- W3.4 ownership/event-map contract published (docs-only): `docs/plans/dashboard-v2-phase8-w3-4-ownership-event-map-2026-02-26.md`
- W3 remains pre-gate/open and implementation is not started in this update.
- Next dispatch-ready action: `W3.5 gate adjudication`.

Timestamped loop update (2026-02-26T16:55:00Z):
- W3.5 gate adjudication published (docs-only): `docs/plans/dashboard-v2-phase8-w3-5-gate-adjudication-2026-02-26.md`
- Adjudication decision: `CONDITIONAL-GO` for W3 implementation kickoff.
- W3 pre-gate state moved from `open` to `adjudicated`.
- Next dispatch-ready action: `W3 implementation kickoff` (not W4).

Timestamped loop update (2026-02-26T17:02:20Z):
- W3 implementation kickoff packet published: `docs/plans/dashboard-v2-phase8-w3-implementation-kickoff-packet-2026-02-26.md`
- Required risk closures imported into implementation phase: `R-W3-001`, `R-W3-002`.
- Immediate dispatch order locked: `W3-I1 -> W3-I2 -> W3-I3 -> W3-I4 -> W3-I5`.
- Immediate next action remains W3 implementation lane dispatch (not W4).

Kickoff note:
- W3 is actively packetized; no implementation-complete claim is made at this stage.

### W4 Resilience and Recovery
Scope:
- Error boundary, retry/backoff, offline recovery, confirmation flows

Entry criteria:
- Failure modes cataloged

Exit criteria:
- Recovery matrix and rollback semantics documented

### W5 End-to-End Readiness
Scope:
- Cross-panel integrated flows and production-readiness closure

Entry criteria:
- W1-W4 wave evidence available

Exit criteria:
- E2E obligations, release gates, and Phase 9 export complete

---

## 6) Gate Matrix

Pre-gate (before wave execution):
- Scope lock complete
- Dependency lock complete
- Evidence obligations declared
- Delegation contract embedded

In-gate (during execution):
- Session checkpoint updates at each state transition
- Constraint compliance checked continuously
- Evidence attached to each task return

Post-gate (after execution):
- Exit criteria pass/fail adjudication
- Open risks classified (impact x probability)
- Phase 9 linkage records emitted for all deferred items

W0 closeout gate (executed):
- LOC proof captured (`index.tsx` = 240)
- W0.1-W0.4 lane evidence recorded
- TypeScript gates PASS (dashboard + root)
- Test gate PASS (`npm test`: 197 pass, 0 fail)

---

## 7) Guardrails + Gatekeeping Policy

Guardrails:
- No undocumented scope changes
- No hidden dependency assumptions
- No claims without evidence
- No delegation chain expansion

Gatekeeping:
- Every wave has mandatory entry and exit checks
- Every delegated result is reviewed in main session
- Every failure path has explicit retune or defer record

---

## 8) Anti-Drift Controls

- Checkpoint cadence: update context at every loop transition
- Stable IDs: use `Wn` + `Wn.delta` identifiers
- Trace chain: each decision links to an evidence artifact
- Drift trigger: any contradiction or unresolved blocker forces 8.07 retune
- No silent carry-forward: deferred work must be explicitly mapped to Phase 9

---

## 9) Phase 9 Linkage (Production Hardening)

Phase 9 is fed by structured outputs from Phase 8:
- P9.1 Reliability hardening (SSE fallback, retries, offline paths)
- P9.2 Progressive refactor (panel boundaries, state ownership, integration seams)
- P9.3 Production verification (E2E matrix, release gates, rollback checks)

Linkage contract:
- Every wave emits `hardening obligations` and `verification obligations`.
- No Phase 9 kickoff without complete obligation registry.

---

## 10) Execution Packet Template (Use Per Wave)

Packet fields:
- Wave ID
- Scope
- In-scope / Out-of-scope
- Dependencies
- Entry criteria
- Exit criteria
- Validation commands
- Delegation tasks (with anti-subdelegation footer)
- Evidence collection checklist
- Risks and fallback
- Phase 9 obligations emitted

---

## 11) Immediate Next Action

Execute transition path under this model:
- Mark W0 as closed with W0.5 evidence encoded in planning artifacts
- Mark W2 as closed with W2.4 partial-pass + controlled defer evidence encoded in planning artifacts
- W3 kickoff active: packet published; W3.1, W3.2, W3.3, and W3.4 contract published (docs-only), pre-gate remains open (`docs/plans/dashboard-v2-phase8-w3-execution-packet-2026-02-26.md`)
- W3.5 adjudication published with `CONDITIONAL-GO` (`docs/plans/dashboard-v2-phase8-w3-5-gate-adjudication-2026-02-26.md`)
- W3 implementation kickoff packet published with lane/risk/gate/handoff conditions (`docs/plans/dashboard-v2-phase8-w3-implementation-kickoff-packet-2026-02-26.md`)
- Next dispatch: W3 implementation lane dispatch (`W3-I1 -> W3-I2 -> W3-I3 -> W3-I4 -> W3-I5`)
- Continue to W4 -> W5 only after W3 closeout and W4 handoff condition is satisfied
- Keep W3 unblocked (W2 closure complete)
