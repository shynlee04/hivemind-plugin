# Hivemind Lifecycle Overview

**Date:** 2026-05-07  
**Category:** Lifecycle / architecture management  
**Reader:** Future Hivemind coordinator, builder, or reviewer entering cold  
**Post-read action:** Trace a user request through Hivemind from intent to delegation, verification, and memory persistence.

---

## 1. Lifecycle Purpose

Hivemind exists to convert user intent into coordinated agent work that compounds across sessions.

The lifecycle has two halves:

| Half | Role |
|------|------|
| HIVE | Structure: hierarchy, routing, delegation, domains, guardrails. |
| MIND | Memory: continuity, journals, trajectory, decisions, reusable knowledge. |

The lifecycle is safe only when both halves are present. HIVE without MIND becomes stateless task execution. MIND without HIVE becomes unmanaged artifact accumulation.

---

## 2. End-to-End Flow

```text
User intent
  -> Front-facing coordinator
  -> Config and profile resolution
  -> Governance and context injection
  -> Intent/routing decision
  -> Specialist delegation or direct tool call
  -> Runtime execution
  -> Completion detection
  -> Verification gates
  -> State and memory persistence
  -> Updated roadmap/state for next cycle
```

---

## 3. Lifecycle Surfaces

| Surface | Lifecycle Role | Current Status |
|---------|----------------|----------------|
| `.planning/` | Project intent, roadmap, requirements, audits, phase state | Rebuilt and usable |
| `.opencode/` | OpenCode primitives: agents, skills, commands, rules | Symlinked; needs bootstrap recovery |
| `.hivefiver-meta-builder/` | Canonical source for soft meta-concepts | Tracked source of truth |
| `.hivemind/` | Runtime state, continuity, journals, delegation records | Partial ownership; needs stronger typed modules |
| `src/` | Hard harness runtime package | Mostly healthy; selected stale/dead modules remain |
| `dist/` | Built npm package output | Buildable, not lifecycle source of truth |

---

## 4. Actor Hierarchy

| Actor | Role | Boundary |
|-------|------|----------|
| User | Provides intent, priorities, acceptance judgment | Does not manage internal routing details |
| Front-facing coordinator | Routes work, manages gates, asks for authorization | Should not bury user in implementation detail |
| L1 coordinator/conductor | Breaks high-level workflows into specialist packets | Must preserve scope and evidence requirements |
| L2 specialist | Researches, builds, reviews, validates within domain | Must return evidence and blockers |
| L3 reference/stack skill | Supplies framework or stack-specific knowledge | Does not own project decisions |

The hierarchy is a HIVE invariant: lower layers should not decide global completion. They report evidence upward.

---

## 5. Runtime Control Flow

| Step | Expected Runtime Owner | Current Gap |
|------|------------------------|-------------|
| Load project config | Config module | Mostly delivered |
| Resolve user mode/profile | Behavioral profile module | Delivered |
| Inject governance/context | Hook layer | Delivered for known toggles |
| Classify intent | Router / command engine | Partial; f-04 missing |
| Select agent/skill/command | Router / registry | Partial; no unified runtime registry |
| Dispatch delegated work | Delegation manager and tools | Delivered core path |
| Detect completion | Completion detector | Delivered core path |
| Persist state | Continuity and delegation persistence | Partial; only some state roots owned |
| Verify evidence | Gate skills and tests | Partial; lifecycle criteria incomplete |

---

## 6. Memory Flow

The MIND layer should preserve:

| Memory Type | Purpose | Current State |
|-------------|---------|---------------|
| Session continuity | Resume and recover active work | Existing core support |
| Delegation records | Track child work and outputs | Existing core support |
| Event journal | Time-machine event timeline | Partial; needs signal/noise cleanup |
| Trajectory ledger | Strategic path across work | Present but not fully integrated |
| Decisions | Stable why behind changes | Present in planning, not fully runtime-owned |
| Learnings/MEMS | Reusable knowledge pieces | Philosophy-defined, incomplete runtime implementation |

Critical rule: memory must be connected to lifecycle events. Static documents alone do not create MIND.

---

## 7. Current Autonomy Boundary

Autonomy is allowed for one scoped cycle at a time.

Allowed now:

| Allowed | Why |
|---------|-----|
| Context synthesis | Low risk, improves shared state |
| Roadmap routing | Low risk, prevents random execution |
| Documentation/lifecycle alignment | Required before implementation |
| Focused research | Only for unknown runtime/API behavior |

Not allowed yet:

| Not Allowed | Why |
|-------------|-----|
| Multi-cycle autonomous implementation | Router and bootstrap safety are incomplete |
| Broad feature work | Core architecture recovery is still blocking |
| Full delegation graph autonomy | Hierarchy enforcement is not runtime-proven |
| Shipping runtime autonomy claims | E2E proof is missing |

---

## 8. Gap-To-Cycle Mapping

| Gap | Lifecycle Failure | Routed Cycle |
|-----|-------------------|--------------|
| Bootstrap missing | HIVE surfaces cannot be restored | Cycle 2 |
| `conversation_language` unused | Config lies about runtime behavior | Cycle 3 |
| State ownership partial | MIND surfaces lack typed owners | Cycle 4 |
| f-04 missing | HIVE cannot route intent reliably | Cycle 5 |
| Hierarchy not enforced | HIVE cannot prevent delegation drift | Cycle 6 |
| E2E proof missing | Evidence gate cannot prove claims | Cycle 7 |

---

## 9. Completion Criteria For Lifecycle Alignment

Cycle 1 completes when:

1. The managed autonomous loop roadmap exists.
2. This lifecycle overview exists.
3. The next cycle is named as Bootstrap Recovery.
4. No implementation starts until the user authorizes Cycle 2.

---

## 10. Next Cycle Recommendation

The next cycle should be **Cycle 2: Bootstrap Recovery**.

Reason: without bootstrap recovery, Hivemind cannot promise installable, recoverable runtime composition. That gap undermines every later state, routing, and onboarding feature.

Do not start Cycle 2 automatically. Ask the user to authorize it.
