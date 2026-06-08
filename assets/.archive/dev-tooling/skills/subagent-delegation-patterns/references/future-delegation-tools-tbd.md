# Future Delegation Tools — In Development (TBD)

## Purpose

This document catalogs delegation-related tools that are **partially implemented**
or **pending redesign**. These tools have code on disk and registered in the
plugin, but their state machines are untested, their designs are under active
revision, or they depend on future phases.

## Status Classification

| Mark | Meaning |
|------|---------|
| 🟡 **PARTIAL** | Tool exists. Core functions work but lifecycle/integration is incomplete. |
| 📋 **TBD** | Design exists but implementation awaits a future phase. |

---

## 1. hivemind-trajectory — Execution Lineage Tracking

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Target phase** | P25 (Trajectory + Agent-Work-Contract Redesign) |
| **Role in delegation** | Tracks execution lineage across delegation chains — which checkpoints were passed, what evidence was attached |
| **What works** | Basic inspect, attach evidence, checkpoint logging, close |
| **What's partial** | State machine transitions untested. `deriveSurface()` duplicated. No proof of multi-session survival. |

**Future delegation value:** When operational, trajectory will provide full
execution lineage — see exactly which checkpoints a delegation passed
through, what evidence was collected at each step, and how the delegation
chain evolved over time. This enables post-hoc forensics and audit trails.

---

## 2. hivemind-pressure — Runtime Pressure Signals

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Target phase** | P26 (Pressure + Notification Redesign) |
| **Role in delegation** | Classifies runtime pressure to guide delegation throttling decisions |
| **What works** | classify (score→tier), detect (control-plane outcomes), inspect_tool_catalog |
| **What's partial** | Redesign pending. Pressure-to-trajectory integration not validated. |

**Future delegation value:** When operational, pressure will help orchestrators
decide whether to throttle delegations — if the system is under load (high
pressure tier), batch delegations or defer. If pressure is low, dispatch
aggressively. Also provides per-delegation pressure scoring for monitoring.

---

## 3. hivemind-agent-work (create + export) — Durable Work Contracts

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Target phase** | P25 |
| **Role in delegation** | Creates durable work contracts that survive across sessions |
| **What works** | Contract creation (with pressure gating), export as JSON/Markdown |
| **What's partial** | Lifecycle untested. `deriveSurface()` duplicated. No integration with trajectory. |

**Future delegation value:** When operational, agent work contracts will
provide durable delegation specifications — define task boundaries, allowed
surfaces, dependencies, non-goals, required proof, and evidence levels
BEFORE dispatching. Contracts persist across sessions and can be
re-injected when an agent is re-launched.

---

## 4. run-background-command — Shell Control-Plane

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Target phase** | CP-PTY-01 (Background Shell Control-Plane MVP) |
| **Role in delegation** | Runs background shell commands in PTY sessions |
| **What works** | Routes through DelegationManager. PTY session ownership filtering. |
| **What's partial** | Full PTY control-plane pending. No signal handling. No cross-cutting permissions. |

**Future delegation value:** When operational, will enable agents to run
shell commands in background PTY sessions — install dependencies, run
builds, execute test suites, all asynchronously with progressive output
reads. Commands survive context switches. PTY recovery provides
non-resumable-after-restart awareness.

---

## Operational vs TBD — Delegation Context Summary

| Tool | Status | Usable for Delegation? | Operational Phase |
|------|--------|----------------------|-------------------|
| `delegate-task` | ✅ OPERATIONAL | Yes — WaiterModel dispatch | CP-DT-01 ✅ |
| `delegation-status` | ✅ OPERATIONAL | Yes — poll, list, control | CP-DT-01 + P22 ✅ |
| `execute-slash-command` | ✅ OPERATIONAL | Yes — command/agent override | P21.1 ✅ |
| `task` tool (native) | ✅ OPERATIONAL | Yes — simple subagent | OpenCode native |
| `hivemind-trajectory` | 🟡 PARTIAL | Not yet — state machine untested | P25 |
| `hivemind-pressure` | 🟡 PARTIAL | Not yet — redesign pending | P26 |
| `hivemind-agent-work-create` | 🟡 PARTIAL | Not yet — lifecycle untested | P25 |
| `hivemind-agent-work-export` | 🟡 PARTIAL | Not yet — lifecycle untested | P25 |
| `run-background-command` | 🟡 PARTIAL | Not yet — CP-PTY-01 pending | CP-PTY-01 |

---

## Integration Notes

These future tools are designed to integrate with the delegation workflow:

```
Current delegation flow:
  Dispatch → Poll → Read output → Done

Future delegation flow (with TBD tools):
  Create work contract (hivemind-agent-work) →
  Check pressure tier (hivemind-pressure) →
  Dispatch (delegate-task) →
  Track lineage (hivemind-trajectory) →
  Poll completion (delegation-status) →
  Attach evidence to trajectory →
  Export contract results (hivemind-agent-work-export)
```

When these tools become operational, the delegation patterns in this skill
will be updated to incorporate them. Until then, use only the operational
tools: delegate-task, delegation-status, execute-slash-command, and the
task tool.
