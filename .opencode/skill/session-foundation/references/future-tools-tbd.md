# Future Session Tools — In Development (TBD)

## Purpose

This document catalogs session-related tools that are **partially implemented**
or **pending redesign**. These tools have code on disk and registered in the
plugin, but their state machines are untested, their designs are under active
revision, or they depend on future phases.

**These tools should NOT be used in production delegation workflows.** They
are documented here so agents know they exist, understand their current
limitations, and can plan for their future availability.

## Status Classification

| Mark | Meaning |
|------|---------|
| 🟡 **PARTIAL** | Tool exists and is registered. Core functionality works but state machine, lifecycle, or integration is incomplete. |
| 📋 **TBD** | Tool design exists but implementation is pending a future phase. |

---

## 1. hivemind-trajectory — Execution Trajectory Ledger

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Actions** | inspect, traverse, attach, checkpoint, event, close |
| **Target phase** | P24 (Trajectory + Agent-Work-Contract Redesign) |
| **What works** | Basic IPC, schema validation, evidence attachment, checkpoint logging |
| **What's partial** | State machine transitions are untested. No proof it survives a real multi-session workflow. `deriveSurface()` duplicated across 3 modules. |

**When this tool becomes operational:**
- Trajectory state machine fully tested with multi-session workflows
- `deriveSurface()` deduplicated
- Production evidence of trajectory surviving across session chains

**Planned session governance role:** Will provide execution lineage view
across all sessions — see which checkpoints were passed, what evidence was
attached, and how sessions relate through trajectory events.

---

## 2. hivemind-pressure — Runtime Pressure Classification

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Actions** | classify, detect, inspect_tool_catalog, attach_event |
| **Target phase** | P26 (Pressure + Notification Redesign) |
| **What works** | classify (score→tier clamping), detect (control-plane outcome detection), inspect_tool_catalog |
| **What's partial** | Redesign pending. Assessment found potential issues with event attachment and pressure-to-trajectory integration. |

**When this tool becomes operational:**
- Pressure redesign completed (P26)
- Pressure-to-trajectory integration validated
- Pressure evidence properly chained across delegation boundaries

**Planned session governance role:** Will provide runtime pressure signals —
how loaded the system is, whether delegations should be throttled, and
whether a session is under resource pressure.

---

## 3. hivemind-agent-work (create + export) — Work Contracts

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Actions (create)** | Define work contract with task boundary, surfaces, dependencies, evidence requirements |
| **Actions (export)** | Export contract as JSON or Markdown handoff |
| **Target phase** | P24-P25 (Redesign along with trajectory) |
| **What works** | Contract creation (with pressure blocking), export (JSON/Markdown format) |
| **What's partial** | Lifecycle correctness untested. `deriveSurface()` duplicated. |

**When this tool becomes operational:**
- Agent work contract lifecycle validated against real workflows
- Contracts integrate with trajectory (P24) and pressure (P26)
- Contract evidence requirements verified against L1-L5 hierarchy

**Planned session governance role:** Will provide durable work contracts
that survive across sessions — define what work was requested, what
evidence is required, and what boundaries the agent must respect.

---

## 4. run-background-command — Background Shell Control-Plane

| Field | Value |
|-------|-------|
| **Status** | 🟡 PARTIAL |
| **Actions** | run, output, input, list, terminate |
| **Target phase** | CP-PTY-01 (Background Shell Control-Plane MVP) |
| **What works** | Routes `run` through DelegationManager. Shell metacharacter rejection. PTY session ownership filtering. |
| **What's partial** | Full PTY control-plane pending CP-PTY-01. Lacks true background process isolation, signal handling, and cross-cutting permissions. |

**When this tool becomes operational:**
- CP-PTY-01 implemented (Background Shell Control-Plane MVP)
- Signal handling, command lifecycle, cross-cutting permissions done
- PTY recovery after harness restart (terminalKind: "non-resumable-after-restart")

**Planned session governance role:** Will provide background command execution
with PTY support — sessions can run shell commands asynchronously, read
output progressively, and terminate on demand.

---

## Operational vs TBD — Summary

| Tool | Status | Usable Now? | When Operational |
|------|--------|------------|------------------|
| `hivemind-trajectory` | 🟡 PARTIAL | ❌ No — state machine untested | P24 |
| `hivemind-pressure` | 🟡 PARTIAL | ❌ No — redesign pending | P26 |
| `hivemind-agent-work-create` | 🟡 PARTIAL | ❌ No — lifecycle untested | P25 |
| `hivemind-agent-work-export` | 🟡 PARTIAL | ❌ No — lifecycle untested | P25 |
| `run-background-command` | 🟡 PARTIAL | ❌ No — CP-PTY-01 pending | CP-PTY-01 |

**For current session governance, use only the operational tools** documented
in the main SKILL.md: session-tracker, session-hierarchy, session-context,
hivemind-session-view, delegate-task, delegation-status, execute-slash-command,
hivemind-command-engine.
