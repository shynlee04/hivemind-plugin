---
title: "Skeleton Tracking Index"
version: "1.0.0"
date: "2026-05-06"
companion: ".planning/MASTER-PROJECT-SKELETON.md"
---

# Skeleton Tracking Index

> Maps each section and feature from the [Master Project Skeleton](./MASTER-PROJECT-SKELETON.md) to its current workstream/phase coverage, completeness, and next action.

---

## Section Coverage Matrix

| Skeleton Section | Current Owner | Phase Coverage | Status | Next Action |
|------------------|---------------|----------------|--------|-------------|
| §1 Project Identity | — | Locked | ✅ COMPLETE | None |
| §2 Four Paths | — | Locked | ✅ COMPLETE | None |
| §3 Two Lineages | skill-ecosystem + agent-synthesis | SE-1..14, AS-0..11 | ✅ COMPLETE | None |
| §4.1 milestone status | milestone | Phases 1..71 | ⚠️ SUSPENDED | Resume Phase 52 or 66 |
| §4.2 Build gates | milestone | Phase 71 verified | ✅ CURRENT | Maintain per-commit |
| §4.3 Cross-workstream deps | ALL | — | ✅ FRAMED | Update when new workstreams created |
| §4.4 Dangling deps | ⊘ UNOWNED | — | ⚠️ 6 UNOWNED | Create workstreams |
| §5.1 Control pane (f-03x) | HER (partial) | HER-0 audit only | ⚠️ PARTIAL | Needs WS-3 registry workstream |
| §5.2 Commands/workflow (f-04x) | ⊘ UNOWNED | — | 🔴 MISSING | Needs WS-4 workstream |
| §5.3 CLI/bootstrap (f-05) | milestone (foundation) | Phase 40 (CLI substrate) | ⚠️ FOUNDATION | Needs WS-2 workstream |
| §5.4 Delegation (f-06) | milestone | Phases 14-16, 36-37 | ⚠️ PARTIAL | Needs practical revamp |
| §5.5 Task management (f-07) | milestone | Phases 56, 58 | ⚠️ PARTIAL | Needs lifecycle wiring |
| §5.6 Context/events (f-08) | HER | HER-3 (BLOCKED) | ⚠️ BLOCKED → UNBLOCK | Resume HER-3 |
| §5.7 Advanced session (f-09+) | HER + milestone | HER-2, Phases 43-47 | ⚠️ PARTIAL | Extend as needed |
| §6 Gap classification | — | — | ✅ FRAMED | Execute per-gap |
| §7 Governance docs | HER | HER-1 (partial) | ⚠️ 5 ACTIONS PENDING | Freshness audit |
| §8 .hivemind architecture | ⊘ UNOWNED | — | 🔴 NEEDS DESIGN | Create WS-1 or HER-6+ |
| §9 Dev order | — | — | ✅ FRAMED | Decision points open |
| §10 External refs | — | — | ✅ COMPLETE | Reference-only |
| §11 Tracking | — | — | ✅ INITIALIZED | Ongoing |

---

## Feature ID Ownership Map

| Feature ID | Skeleton §  | Workstream | Phase(s) | Status |
|------------|-------------|------------|----------|--------|
| f-03a | §5.1 | HER | HER-5 (READY) | PARTIAL — registry exists, enforcement missing |
| f-03b | §5.1 | skill-ecosystem | CLOSED | PARTIAL — scanners exist, no unified registry |
| f-03c | §5.1 | ⊘ UNOWNED | — | PARTIAL — hooks exist, no registry |
| f-03d | §5.1 | ⊘ UNOWNED | — | MISSING |
| f-03e | §5.1 | ⊘ UNOWNED | — | PARTIAL — tools exist, no registry |
| f-03f | §5.1 | ⊘ UNOWNED | — | PARTIAL — hooks exist, no registry |
| f-04 | §5.2 | ⊘ UNOWNED | — | FOUNDATION — command-engine/ stub |
| f-04a | §5.2 | ⊘ UNOWNED | — | MISSING |
| f-04a.i | §5.2 | ⊘ UNOWNED | — | PARTIAL — purpose-classifier exists |
| f-04a.ii | §5.2 | ⊘ UNOWNED | — | MISSING |
| f-05 | §5.3 | milestone | Phase 40 | FOUNDATION — CLI substrate only |
| f-05.i | §5.3 | ⊘ UNOWNED | — | MISSING — configs.json not designed |
| f-05.ii | §5.3 | ⊘ UNOWNED | — | MISSING |
| f-05.iii | §5.3 | ⊘ UNOWNED | — | MISSING |
| f-06 | §5.4 | milestone | Phases 14-16, 36-37 | PARTIAL — core works, no CRUD/graph |
| f-06.lanes | §5.4 | ⊘ UNOWNED | — | PARTIAL — PTY/SDK/Command exist |
| f-06.hierarchy | §5.4 | agent-synthesis | CLOSED | PARTIAL — depth fields defined |
| f-06.persistence | §5.4 | milestone | Phase 37 | EXISTS |
| f-07 | §5.5 | milestone | Phases 56, 58 | PARTIAL — modules exist, not wired |
| f-07.i | §5.5 | ⊘ UNOWNED | — | MISSING |
| f-07.ii | §5.5 | ⊘ UNOWNED | — | MISSING |
| f-07.iii | §5.5 | ⊘ UNOWNED | — | MISSING |
| f-08 | §5.6 | HER | HER-3 (BLOCKED) | PARTIAL — 10 types, noise output |
| f-08.i | §5.6 | ⊘ UNOWNED | — | MISSING |
| f-08.ii | §5.6 | milestone | Phase 41 | PARTIAL — query/replay exist |
| f-08.iii | §5.6 | ⊘ UNOWNED | — | MISSING |
| f-09 | §5.7 | HER | HER-2 (COMPLETE) | PARTIAL — wired, needs structured append |
| f-10 | §5.7 | milestone | Phases 43-47 | PARTIAL |
| f-11 | §5.7 | — | CUSTOM-TOOLS-CRITERIA exists | PARTIAL — criteria defined, no E2E |

---

## Workstream Gap Summary

| Proposed WS | Skeleton § | Feature IDs | Blocked By | Priority |
|-------------|-----------|-------------|------------|----------|
| WS-1: .hivemind state arch | §8 | f-05.i, all state writers | WS-0 (DONE) | 🔴 CRITICAL |
| WS-2: Bootstrap / CLI | §5.3, §6.4 | f-05, f-05.i-iii | WS-1, WS-3 | 🔴 CRITICAL |
| WS-3: Primitive registry | §5.1, §6.3 | f-03c-f | WS-1 | 🔴 HIGH |
| WS-4: Auto-commands | §5.2 | f-04, f-04a, f-04a.i-ii | WS-3 | 🟡 MEDIUM |
| WS-5: Delegation revamp | §5.4 | f-06, f-06.lanes | WS-3 | 🟡 MEDIUM |
| WS-6: Trajectory / task | §5.5 | f-07, f-07.i-iii | WS-1, WS-5 | 🟡 MEDIUM |
| WS-7: Context / events | §5.6 | f-08, f-08.i-iii | WS-1 | 🔴 HIGH |
| WS-8: Sidecar + UI | §6.4 | sidecar, doctor | WS-2, WS-3, WS-6 | 🟢 LOW |

---

## Open Decision Tracking

| # | Decision | Skeleton § | Status | Blocker For |
|---|----------|-----------|--------|-------------|
| D-1 | How many new workstreams (expand HER vs. new)? | §9.3 | OPEN | All WS-1..8 creation |
| D-2 | `.planning/` → `.hivemind/plannings/` migration? | §8 | OPEN | WS-1 design |
| D-3 | configs.json minimal vs. full schema? | §8.3 | OPEN | WS-1, WS-2 |
| D-4 | HER workstream scope expansion? | §9.3 | OPEN | WS-1 ownership |
| D-5 | Root ROADMAP.md: master of masters? | §7.1 | OPEN | Governance refresh |

---

*Created: 2026-05-06*
*Companion to: `.planning/MASTER-PROJECT-SKELETON.md`*
