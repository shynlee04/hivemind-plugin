# Dashboard-v2 Phase 8 W3 Implementation Kickoff Packet

> Date: 2026-02-26
> Wave: `W3` implementation kickoff (post-W3.5 `CONDITIONAL-GO`)
> Scope: observability-surface implementation lanes only
> Source decision: `docs/plans/dashboard-v2-phase8-w3-5-gate-adjudication-2026-02-26.md`

---

## 1) Objective

Execute W3 implementation lanes for Swarm, Tool Registry, and Time Travel surfaces with explicit ownership boundaries, while closing residual risks `R-W3-001` and `R-W3-002` before W3 closeout.

---

## 2) Implementation Lane Order

Execution order (sequential-by-proof):
1. `W3-I1` Correlation contract normalization and shared event mapping baseline.
2. `W3-I2` Swarm surface implementation (`SwarmMonitor` + `SwarmOrchestratorView`) with cadence contract enforcement.
3. `W3-I3` Tool registry implementation (`ToolRegistryView`) aligned to normalized correlation keys.
4. `W3-I4` Time travel implementation (`TimeTravelDebuggerView`) plus cross-surface stitching verification.
5. `W3-I5` W3 gate closeout pack (post-implementation evidence and adjudication).

Parallel lanes are allowed only with explicit non-overlap proof and unchanged ownership boundaries.

---

## 3) Lane Scope Boundaries

`W3-I1` scope boundaries:
- In scope: shared W3 event/correlation mapping used by Swarm, Tool Registry, Time Travel surfaces.
- Out of scope: W4 resilience behaviors, W5 end-to-end release closure.

`W3-I2` scope boundaries:
- In scope: `SwarmMonitor` and `SwarmOrchestratorView` implementation details for status, dispatch visibility, cadence.
- Out of scope: Tool registry table semantics, timeline diff rendering.

`W3-I3` scope boundaries:
- In scope: `ToolRegistryView` catalog and execution-trace surface tied to normalized keys.
- Out of scope: swarm dispatch orchestration semantics, historical snapshot browser logic.

`W3-I4` scope boundaries:
- In scope: `TimeTravelDebuggerView` timeline/snapshot/diff viewing contract and read-path stitching.
- Out of scope: retry/backoff/offline resilience policy (W4 ownership).

`W3-I5` scope boundaries:
- In scope: W3-only verification evidence, open-risk closure proof, final W3 disposition.
- Out of scope: opening W4 implementation work.

---

## 4) Required Risk Closures

`R-W3-001` closure requirement:
- Normalize correlation-key contract (`dispatch_id` vs `tool_run_id`) across W3 producers/consumers.
- Closure proof: implementation notes and verification evidence show a single deterministic mapping path.

`R-W3-002` closure requirement:
- Align event cadence and reconciliation cadence to prevent stale-indicator inconsistency.
- Closure proof: cadence contract documented and stale-threshold behavior verified in W3 evidence.

W3 closeout is blocked until both `R-W3-001` and `R-W3-002` are closed or explicitly deferred with owner + verification obligation.

---

## 5) Minimal Gate Plan (Pre / In / Post)

Pre-gate:
- Verify W3.5 decision remains `CONDITIONAL-GO` and this implementation kickoff packet is the active dispatch artifact.
- Confirm lane order, scope boundaries, and risk-closure obligations are embedded in each lane prompt.

In-gate:
- Enforce no sub-of-sub delegation and no W4/W5 scope bleed.
- Capture lane evidence per dispatch: changed files, verification commands, residual risks.
- Validate `R-W3-001` and `R-W3-002` closure progress at each lane return.

Post-gate:
- Run W3 implementation verification commands (`npx tsc --noEmit`, `npm test`) before W3 closeout claim.
- Produce W3 final adjudication note with explicit risk ledger status.

---

## 6) W4 Handoff Condition

W4 handoff condition is satisfied only when:
- W3 implementation lanes (`W3-I1`..`W3-I5`) are complete with evidence.
- `R-W3-001` is closed.
- `R-W3-002` is closed.
- W3 post-gate verification is passing and W3 is marked closed in loop artifacts.

Until then, next dispatch remains inside W3 implementation lanes (not W4).

---

### Dispatch Constraint Footer

`ABSOLUTE BAN: delegated sub-sessions may NOT delegate further. No sub-of-sub delegation allowed. All delegated outputs (including review/research/context prep) must return directly to main orchestrator session.`
