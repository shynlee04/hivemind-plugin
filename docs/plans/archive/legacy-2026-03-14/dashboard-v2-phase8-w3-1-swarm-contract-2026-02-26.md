# Dashboard-v2 Phase 8 W3.1 Swarm Surface Contract

> Date: 2026-02-26
> Wave: `W3.1` (Swarm surface contract)
> Status: contract published (docs-only, not implemented)
> Scope lock: `SwarmMonitor` + `SwarmOrchestratorView`

---

## 1) Scope and Objective

Define the contract for the Swarm observability surface before implementation.

In scope:
- Contract for data/event inputs, ownership boundaries, UI outputs, and update cadence for `SwarmMonitor` and `SwarmOrchestratorView`.
- Failure-mode behavior for degraded or missing upstream state/event streams.
- Hand-off dependencies to W3.2 and W3.4.

Out of scope:
- Any source-code implementation changes.
- Any W4/W5 resilience or release-readiness execution.

Objective:
- Publish a deterministic, testable contract that allows W3.1 implementation to proceed without ownership ambiguity.

---

## 2) Evidence-Backed Current State

Current state is skeleton/TODO-only and requires contract-first execution:
- `src/dashboard/components/SwarmMonitor.tsx:14` declares TODO `[US-040]` for swarm status tracking.
- `src/dashboard/views/SwarmOrchestratorView.tsx:15` declares TODO `[US-045]` for topology grid and communication bus.
- `src/dashboard/views/SwarmOrchestratorView.tsx:16` explicitly requires session-state integration.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:131` marks `SwarmMonitor` as missing for v2 parity.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:139` marks `SwarmOrchestratorView` as skeleton.
- `docs/plans/dashboard-v2-comprehensive-inventory-2026-02-26.md:207` identifies `tool.started/completed` as available real-time indicators for observability alignment.

Interpretation:
- Surface contract exists only at packet/planning level; implementation details are intentionally blocked until ownership and evidence gates are explicit.

---

## 3) Contract Definition

### Inputs (Data / Events)

Input channels:
- Session/swarm state snapshot feed (authoritative source owned by session layer).
- Event stream for swarm/tool execution lifecycle status transitions.
- Optional topology metadata for rendering orchestrator relationships.

Minimum payload requirements:
- Actor identity (`agent_id` or equivalent stable key).
- Execution state (`queued | running | completed | failed | blocked`).
- Timestamp and originating session/action correlation key.
- Last known operation summary for display.

### State Ownership Boundaries

Ownership split:
- Upstream ownership (outside W3.1 surface): data production, normalization, and lifecycle truth.
- W3.1 surface ownership: presentation-ready projection and deterministic rendering states.

Boundary rules:
- W3.1 must not mutate canonical swarm/session state.
- W3.1 may derive display-only aggregates (counts, badge classes, grouped status summaries).
- Cross-surface ownership (shared-event contract and producer/consumer mapping) is deferred to W3.4 and must not be preempted in W3.1.

### Outputs / UI Obligations

`SwarmMonitor` obligations:
- Show current swarm health/state summary with deterministic fallback labels.
- Show per-agent status badges (or equivalent list rows) mapped from execution states.
- Show last update timestamp and stale-data indicator when freshness threshold exceeded.

`SwarmOrchestratorView` obligations:
- Show topology-oriented view (or declared placeholder contract) using stable actor identifiers.
- Show active communication/execution transitions when event data is present.
- Show explicit degraded mode banner when topology data is absent.

### Update Mode and Cadence

Mode:
- Event-driven refresh when lifecycle events arrive.
- Snapshot reconciliation on periodic cadence to correct drift/missed events.

Cadence contract:
- Event-driven path: apply updates on event receipt.
- Reconciliation path: periodic refresh (target interval owned by implementation lane, must be declared and verified in W3.1 implementation notes).
- UI freshness threshold: if no update within threshold, switch to stale/degraded indicator.

---

## 4) Failure Modes and Fallback Behaviors

1. Missing event stream
- Failure: no live transitions available.
- Fallback: continue rendering last known snapshot with `stale` banner and timestamp.

2. Partial actor payloads
- Failure: some agents missing required fields.
- Fallback: render `unknown` status row with bounded placeholder text; do not crash panel.

3. Topology metadata unavailable
- Failure: cannot render relationship layout.
- Fallback: switch `SwarmOrchestratorView` to deterministic list-mode contract and display degraded-mode notice.

4. Reconciliation error/timeouts
- Failure: snapshot refresh fails.
- Fallback: keep previous stable state, increment error indicator, and surface last successful refresh time.

---

## 5) Acceptance Criteria (Pass / Fail)

Pass criteria:
- Contract unambiguously defines inputs, ownership boundaries, outputs, and update cadence.
- Failure/fallback behaviors are deterministic and do not depend on hidden ownership.
- W3.1 artifact references concrete evidence lines from code/planning inventory.
- Hand-off dependencies to W3.2 and W3.4 are explicit.

Fail criteria:
- Any contract clause implies W3.1 mutates canonical swarm/session state.
- Any required field/behavior is left implicit or contradictory.
- Any claim of implementation completion appears in this docs-only lane.

---

## 6) Verification Evidence Requirements

Required evidence for W3.1 docs gate:
- Artifact existence: this file path present in repo and linked from W3 packet.
- Evidence references: file:line citations to current TODO/skeleton state.
- Status integrity: lane marked `contract published` and wave remains `in-progress`.

Required evidence for later implementation gate (not executed in this lane):
- `npx tsc --noEmit`
- `npm test`
- Lane-specific render/behavior proof against this contract.

---

## 7) Risks and Non-Goals

Risks:
- Event semantics may diverge across Swarm/ToolRegistry surfaces before W3.4 resolves shared ownership.
- Cadence defaults can become inconsistent if implementation lane does not codify a single refresh policy.
- Overloaded fallback behavior may hide upstream regressions unless errors are surfaced explicitly.

Non-goals:
- Implementing swarm UI widgets in this lane.
- Defining ToolRegistry schema rendering behavior (W3.2 scope).
- Finalizing cross-surface producer/consumer matrix (W3.4 scope).

---

## 8) Hand-Off Dependencies (W3.2 / W3.4)

Dependencies to W3.2:
- Reuse execution-state vocabulary and stale/degraded indicator semantics to avoid registry/swarm drift.
- Align event timestamp/correlation requirements for cross-panel traceability.

Dependencies to W3.4:
- Consume W3.1 ownership boundaries as immutable inputs for cross-surface ownership map.
- Resolve producer/consumer ownership for shared event channels and conflict adjudication.

Blocking condition:
- W3.1 implementation must not close until W3.4 confirms no ownership overlap/conflict.

---

### Mandatory Anti-Subdelegation Footer

`ABSOLUTE BAN: delegated sub-sessions may NOT delegate further. No sub-of-sub delegation allowed. All delegated outputs (including review/research/context prep) must return directly to main orchestrator session.`
