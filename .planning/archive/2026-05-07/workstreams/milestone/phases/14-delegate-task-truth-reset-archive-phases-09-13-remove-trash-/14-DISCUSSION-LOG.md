# Phase 14: delegate-task truth-reset — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16 (Session 1), 2026-04-18 (Session 2)
**Phase:** 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-
**Areas discussed:** Trash Removal, delegate-task Tool Fate, Regression Code Triage, Test Suite Reset, Background Execution Model, Persistence & Polling, Task Tool Coexistence, Completion & Lifecycle

---

## Session 1: 2026-04-16 — Cleanup Decisions

### Trash Removal

| Option | Description | Selected |
|--------|-------------|----------|
| Nuke all trash | Delete every diagnostic report, debug artifact, and session dump file | ✓ |
| Archive to .archive/ | Move everything to .archive/ for historical reference | |
| Keep Phase 12 reconciliation only | Delete everything EXCEPT the Phase 12 reconciliation note | |

**User's choice:** Nuke all trash
**Notes:** User was explicit — the diagnostic report is "the reason why everything failed" and poisoned agent context. All forensic value is now captured in STATE.md.
**Decision:** D-01

---

### delegate-task Tool Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Stub/redirect | Replace with redirect to OpenCode task tool | |
| Delete completely | Remove from src/tools/ and plugin.ts | |
| Keep but disable async | Runtime policy guard, sync only | |

**User's choice:** NONE of the above — "it must work"
**Notes:** User was emphatic: delegate-task must actually function. The AGENTS.md ban line exists BECAUSE it's broken, not because it should be deleted.
**Decision:** D-02 (original — superseded by Session 2)

---

### Regression Code Triage

| Option | Description | Selected |
|--------|-------------|----------|
| Delete all 09-13 code | Start from Phase 02 verified baseline | ✓ |
| Selective keep + delete | Keep functional modules, delete broken ones | |
| Module-by-module audit | Individual evaluation of each module | |

**User's choice:** Delete all 09-13 code
**Notes:** Nuclear option. Phase 02 baseline (18/18 verified) is the trusted foundation. Everything from 09-13 gets removed and rebuilt from scratch.
**Decision:** D-05, D-06

---

### Test Suite Reset

| Option | Description | Selected |
|--------|-------------|----------|
| Delete and rewrite | Fresh tests aligned with real runtime behavior | ✓ |
| Keep Phase 02 tests only | Minimal disruption, remove broken tests | |
| Fix incrementally | Adjust existing tests to match new reality | |

**User's choice:** Delete and rewrite
**Notes:** The 668-test suite was mock-heavy and tested phantom behavior. Fresh tests must be runtime-truthful.
**Decision:** D-07, D-08

---

## Session 2: 2026-04-18 — Delegation Architecture Redesign

### Background Execution Model

| Option | Description | Selected |
|--------|-------------|----------|
| Sync-first (blocking) | delegate-task blocks until child session completes | |
| Fire-and-forget | Dispatch and never wait | |
| WaiterModel (always-background) | Tasks always run in background; foreground continues; wait only when result is needed | ✓ |

**User's choice:** WaiterModel — always-background execution
**Notes:** The original plans 14-01/02/03 implemented sync/async mode split with fixed timeouts. This was fundamentally wrong. The correct model is: dispatch → continue foreground → check/wait when result needed. Multiple concurrent delegations tracked independently by unique task IDs.
**Decision:** D-02 (corrected), D-03 (corrected)

---

### Persistence & Polling

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed timeout + callback | 15-min deadline, callback on completion/expiry | |
| oh-my-openagent only | Dual-signal completion, in-process tracking | |
| background-agents only | Disk persistence, polling-based | |
| Hybrid (dual-signal + disk) | oh-my-openagent's completion detection + background-agents' disk persistence | ✓ |

**User's choice:** Hybrid approach
**Notes:** Dual-signal completion (session.idle + message count stability) from oh-my-openagent for reliable completion detection. Disk persistence from opencode-background-agents for durability across restarts. NO fixed timeouts — tasks run until real completion is confirmed.
**Decision:** D-04 (corrected), D-13, D-14

---

### Task Tool Coexistence

| Option | Description | Selected |
|--------|-------------|----------|
| Replace builtin task | delegate-task supersedes OpenCode's task tool | |
| Wrap builtin task | delegate-task calls task internally | |
| Coexist independently | Both tools available, different use cases | |
| Defer to planner | Let planner study SDK parentID semantics first | ✓ |

**User's choice:** Defer to planner
**Notes:** The relationship between delegate-task and OpenCode's builtin `task` tool depends on SDK capabilities (parentID semantics, session lifecycle). The planner must research and recommend. This is NOT a design decision — it's a research task.
**Decision:** D-11

---

### Completion & Lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed timeout ceiling | Max runtime with configurable deadline | |
| Dual-signal only | session.idle + stability, no limits | |
| Dual-signal locked + safety at planner's discretion | Completion mechanism is decided; safety/cleanup details for planner | ✓ |

**User's choice:** Dual-signal locked, details deferred
**Notes:** The completion detection mechanism is LOCKED: session.idle + message count stability. No fixed timeouts. If the planner recommends a safety limit, it must be a MAXIMUM ceiling, not a deadline. Zombie handling, abort mechanisms, and child session cleanup are at planner's discretion.
**Decision:** D-12, D-13

---

## Agent's Discretion (Updated)

- SDK `parentID` semantics and delegate-task's relationship to builtin `task` tool (planner researches)
- Safety limits, zombie session handling, abort mechanisms, child session cleanup (planner decides)
- Exact implementation of dual-signal stability check (planner designs)
- Poll/status tool API shape and naming (planner designs)
- Test file organization and naming conventions

---

*Phase: 14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-*
*Session 1: 2026-04-16*
*Session 2: 2026-04-18*
