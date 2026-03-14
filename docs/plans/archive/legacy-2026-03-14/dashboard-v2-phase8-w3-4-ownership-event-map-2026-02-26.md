# Dashboard-v2 Phase 8 W3.4 Ownership and Event-Map Contract

> Date: 2026-02-26
> Wave: `W3.4` (cross-surface ownership + event channel contract)
> Status: `contract published` (docs-only)
> Inputs: `docs/plans/dashboard-v2-phase8-w3-1-swarm-contract-2026-02-26.md`, `docs/plans/dashboard-v2-phase8-w3-2-tool-registry-contract-2026-02-26.md`, `docs/plans/dashboard-v2-phase8-w3-3-time-travel-contract-2026-02-26.md`

---

## 1) Objective

Publish a single cross-surface contract that defines explicit ownership boundaries and producer/consumer channel responsibilities across W3 observability surfaces so W3.5 can adjudicate gates without ambiguity.

---

## 2) Scope

In scope:
- Ownership boundaries across `SwarmMonitor`, `SwarmOrchestratorView`, `ToolRegistryView`, `TimeTravelDebuggerView`
- Producer/consumer event channel map for W3 surfaces
- Overlap/conflict scan with deterministic resolution rules
- Contract invariants and telemetry correlation strategy

Out of scope:
- Source implementation of any W3 panel
- W4 resilience/recovery behavior
- W5 E2E integration closeout

---

## 3) Surface Ownership Matrix

| Surface | Primary ownership | Read dependencies | Prohibited ownership |
|---|---|---|---|
| Swarm (`SwarmMonitor`, `SwarmOrchestratorView`) | Swarm runtime state, agent topology summary, dispatch/result stream presentation | Tool execution event summaries; session metadata identifiers | Tool catalog schema authority; canonical session timeline authority |
| ToolRegistry (`ToolRegistryView`) | Tool catalog metadata, schema/args render model, tool execution status strip | Swarm/session identifiers for correlation only | Swarm topology authority; session timeline authority |
| TimeTravel (`TimeTravelDebuggerView`) | Session history timeline, snapshot/version navigation contract, diff navigation | Swarm/tool event references as timeline annotations | Live swarm control state authority; tool schema authority |

Ownership rule:
- Exactly one primary owner per domain object.
- Cross-surface reads are allowed only as derived views.

---

## 4) Producer/Consumer Event Channel Map

| Channel | Producer | Consumer(s) | Payload contract intent |
|---|---|---|---|
| `swarm.dispatch.started` | Swarm orchestration layer | Swarm, TimeTravel | Correlate dispatch lifecycle begin |
| `swarm.dispatch.completed` | Swarm orchestration layer | Swarm, TimeTravel | Correlate dispatch lifecycle end + outcome |
| `tool.started` | Tool execution runtime | ToolRegistry, Swarm, TimeTravel | Expose tool execution start with correlation id |
| `tool.completed` | Tool execution runtime | ToolRegistry, Swarm, TimeTravel | Expose tool execution end/status with correlation id |
| `session.snapshot.created` | Session lifecycle runtime | TimeTravel | Append deterministic timeline marker |
| `session.compaction.completed` | Session lifecycle runtime | TimeTravel, Swarm | Surface compaction checkpoint + freshness signal |

Channel contract rules:
- Producers own payload schema for their channel.
- Consumers may project payload fields but cannot redefine producer semantics.

---

## 5) Overlap and Conflict Analysis

Conflict scan outcomes:
- `PASS`: Tool execution visibility is shared safely when ToolRegistry remains schema/status owner and Swarm/TimeTravel consume as projection.
- `PASS`: Session timeline authority remains in TimeTravel; Swarm may annotate freshness from compaction events only.
- `PASS`: Swarm dispatch lifecycle remains Swarm-owned; ToolRegistry cannot claim dispatch authority.
- `WARN-NONE`: No unresolved owner collision after applying ownership matrix + channel rules.

Residual overlap risk to monitor in W3.5:
- Correlation-id naming drift across producers (`dispatch_id`, `tool_run_id`, `session_id`) if not normalized in gate adjudication checklist.

---

## 6) Resolution Rules

1. **Primary-owner precedence**: on ownership dispute, matrix primary owner is authoritative.
2. **Producer schema authority**: payload field meaning is controlled by channel producer.
3. **Read-only projection**: consumers may format/read; they may not mutate source-of-truth state.
4. **Deterministic escalation**: unresolved disputes are escalated to W3.5 gate adjudication; no silent re-assignment.

---

## 7) Contract Invariants

- Invariant A: Every cross-surface object has one and only one declared primary owner.
- Invariant B: Every cross-surface event channel declares exactly one producer.
- Invariant C: Shared correlation keys must include `session_id` plus lane-specific run identifier.
- Invariant D: TimeTravel remains canonical for historical timeline ordering.
- Invariant E: ToolRegistry remains canonical for tool schema/catalog rendering.
- Invariant F: Swarm remains canonical for live dispatch state transitions.

---

## 8) Telemetry Correlation Strategy

Correlation contract:
- Required base key: `session_id`
- Required event key: one of `dispatch_id` or `tool_run_id` depending on channel
- Required temporal key: event timestamp in monotonic render order per surface

Cross-surface stitching rules:
- Swarm view: group by `dispatch_id`, annotate tool lifecycle by matching `session_id` and timestamp windows.
- ToolRegistry view: group by `tool_run_id`, attach dispatch context if `dispatch_id` is present.
- TimeTravel view: canonical timeline keyed by `session_id`, merging swarm/tool milestones as ordered annotations.

---

## 9) Non-Goals

- Defining new runtime transport protocols in W3.4
- Implementing new SSE channels in source code
- Solving W4 retry/offline semantics in this contract lane

---

## 10) Dependencies

- `docs/plans/dashboard-v2-phase8-w3-1-swarm-contract-2026-02-26.md`
- `docs/plans/dashboard-v2-phase8-w3-2-tool-registry-contract-2026-02-26.md`
- `docs/plans/dashboard-v2-phase8-w3-3-time-travel-contract-2026-02-26.md`
- `docs/plans/dashboard-v2-phase8-w3-execution-packet-2026-02-26.md`
- `docs/plans/dashboard-v2-phase8-orchestration-loop-2026-02-26.md`

---

## 11) Verification Checklist (Docs Gate)

- [x] Ownership matrix explicitly covers Swarm, ToolRegistry, TimeTravel
- [x] Producer/consumer channel map published
- [x] Overlap/conflict scan outcome recorded
- [x] Resolution rules codified
- [x] Contract invariants codified
- [x] Telemetry correlation strategy codified
- [x] Non-goals and dependencies codified
- [x] W3 packet and orchestration loop updated to point to W3.5 gate adjudication next

---

### Dispatch Constraint Footer

`ABSOLUTE BAN: delegated sub-sessions may NOT delegate further. No sub-of-sub delegation allowed. All delegated outputs (including review/research/context prep) must return directly to main orchestrator session.`
