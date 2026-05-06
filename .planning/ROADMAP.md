# HiveMind V3 — Roadmap

**Created:** 2026-05-07  
**Status:** Active  
**Dependency order:** Core Architecture → Agent Workflows → User Experience (per D-WS-03)

---

## Active Workstream: Core Architecture (WS-CA)

| Phase | Title | Status | Depends On |
|-------|-------|--------|------------|
| CA-01 | configs.json Schema + Runtime Binding | ✅ DELIVERED | — |
| CA-02 | Behavioral Profile System + Mode Dispatch | ✅ DELIVERED | CA-01 |
| CA-03 | Workflow Toggle Runtime Binding | ✅ DELIVERED | CA-01 |
| CA-04 | **Bootstrap + State Ownership** (restructured) | 🔴 PRIORITY | CA-01, CA-02, CA-03 |

### CA-04 Restructured Scope

Original "CRUD Ownership Modules + Lifecycle Verification" was premature — building plumbing before producers/consumers exist. Restructured to priority-ordered sub-phases:

| Sub-phase | Title | Rationale |
|-----------|-------|-----------|
| CA-04.1 | **Bootstrap CLI + Primitives Recovery** | D-CRUD-01: `npx opencode-harness init` creates `.hivemind/` + `.opencode/` structure. Postinstall restores primitives. Fixes the "delete and lose everything" gap. |
| CA-04.2 | **`conversation_language` Runtime Wiring** | D-BIND-03: Field has zero consumers. Wire into system.transform → messages.transform hooks. Fix the config → behavior gap. |
| CA-04.3 | **State Directory Ownership Modules** | D-CRUD-05: Each `.hivemind/` subdirectory gets typed module. Tiered by mutation need (7 CRUD, 7 append, 6 read-only). Only AFTER bootstrap exists and tools write state. |
| CA-04.4 | **Lifecycle Audit + Gate Criteria Synthesis** | Synthesize gate-l3-lifecycle-integration references/ from ARCHITECTURE.md. Audit all 34 src/lib modules. Fix only CA-04 CRUD-owner violations. |

### Checkpoints

- **CP-CA-1:** configs.json full schema operational ✅
- **CP-CA-2:** Mode → behavioral profile mapping produces observable behavior ✅
- **CP-CA-3:** Every workflow toggle has a concrete runtime consumer ✅ (6 wired, 4 annotated, 4 deferred)
- **CP-CA-4:** `.hivemind/` bootstrap on install + typed ownership for state/ and delegation-managements/ dirs (MINIMUM)

---

## Active Workstream: Harness Ecosystem Recovery (HER)

| Phase | Title | Status |
|-------|-------|--------|
| HER-0 | Ecosystem Remap Audit | ✅ VALUABLE-CONTEXT |
| HER-1 | Documentation & Config Recovery | ✅ DELIVERED |
| HER-2 | Dead Code Cleanup | ✅ DELIVERED |
| HER-3 | Context & Compaction | 📋 READY — no PLAN.md |
| HER-4 | SDK Integration Depth | 📋 READY — no PLAN.md |
| HER-5 | Agent Rationalization | 📋 READY — no PLAN.md |

---

## Planned Workstreams (Blocked on Core Architecture)

### Agent Workflows (WS-AW)
- WS-4: Auto-commands + Workflow Router (f-04) — **HIGHEST GAP**
- WS-5: Delegation Revamp (f-06 lanes/hierarchy)
- WS-6: Trajectory + Task-Plus (f-07)

### User Experience (WS-UX)
- WS-2: Bootstrap CLI + Onboarding
- WS-7: Context/Compaction Engine
- WS-8: Sidecar + UI (DEFERRED)

---

## Deliverables & Timeline

| Wave | What | Blocks |
|------|------|--------|
| **Wave 1 (NOW)** | CA-04.1 Bootstrap + CA-04.2 Language wiring | Nothing — these fix immediate gaps |
| **Wave 2** | CA-04.3 State ownership modules | Depends on Wave 1 bootstrap |
| **Wave 3** | f-04 Auto-commands + Workflow Router | Depends on CA-04.3 (tools need owners) |
| **Wave 4** | HER-3/4/5 execution | Depends on Wave 3 routing |
| **Wave 5+** | WS-AW + WS-UX workstreams | Depends on Waves 1-4 |

---
*Last updated: 2026-05-07 after full audit + archive + codebase map*
