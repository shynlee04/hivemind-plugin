---
id: META01
type: root
scope: meta
title: "Hivefiver Domain Restructure"
status: routing
parent: null
children: [META01-SUB01, META01-SUB02, META01-SUB03, META01-SUB04]
dependencies: []
tags: [hivefiver, meta-builder, prime-skill, framework, progressive-disclosure]
created: 2026-03-03
last_updated: 2026-03-03
owner: hivefiver
session_ref: null
completion_pct: 0
---

# Hivefiver Domain Restructure

> **Plan ID**: `META01` | **Status**: `routing` | **Owner**: `hivefiver`
> **Children**: See `sub-plan/META01-SUB*-PLAN.md`

<context>
The hivefiver meta-builder agent has 38 assets across 6 categories (agent profile, 10 commands,
5 skills, 10 workflows, 11 templates, 1 reference). The skill stack lacks enforced progressive
disclosure — no "load-me-first" mechanism exists. The agent body (520L) inlines behavioral
contracts that belong in a prime skill. Parity drifts intentionally from user runtime overrides.
This plan restructures the entire hivefiver domain to establish deterministic runtime loading,
standards-aligned skill design, and clean separation between agent body and skill knowledge.
</context>

---

## Overview

**End state**: Hivefiver agent starts every session by loading `hivefiver-prime` skill, which
guides all subsequent skill loading, intent classification, and context management. The agent
body is slim (~150-200L). Skills have clear ownership boundaries with zero overlap. All assets
pass `skill-judge` evaluation at Grade B or above.

## Prerequisites

- [x] Skill standards loaded: `skill-creator`, `meta-skill-creator`, `skill-judge`, `writing-skills`
- [x] Current asset inventory completed (38 assets mapped)
- [x] Parity drift documented (98-line diff, intentional user edits)
- [x] Triage decisions classified per asset group
- [ ] Human confirmation of triage decisions and order of work

---

## Branches (Sub-Plans)

| ID | Title | Status | Dep | Triage | File |
|----|-------|--------|-----|--------|------|
| SUB01 | Parity drift isolation + false alarm decouple | `open` | — | DECOUPLE | [`META01-SUB01-PLAN.md`](sub-plan/META01-SUB01-PLAN.md) |
| SUB02 | Prime skill redesign (standards-aligned) | `open` | SUB01 | REFACTOR | [`META01-SUB02-PLAN.md`](sub-plan/META01-SUB02-PLAN.md) |
| SUB03 | Agent body slimming + skill stack dedup | `open` | SUB02 | IMPROVE | [`META01-SUB03-PLAN.md`](sub-plan/META01-SUB03-PLAN.md) |
| SUB04 | Orchestrator orphan investigation + cleanup | `open` | — | INVESTIGATE | [`META01-SUB04-PLAN.md`](sub-plan/META01-SUB04-PLAN.md) |

**Deferred (NOT in this plan)**:
- Commands/workflows/templates — downstream of skill stack, touched AFTER skill redesign stable
- hiveminder domain — separate META02 plan after hivefiver complete
- Parity sync (root ← .opencode) — LAST action after all redesign confirmed

---

<decisions>

| # | Decision | Rationale | Date | Reversible? | Impact |
|---|----------|-----------|------|-------------|--------|
| 1 | hivefiver FIRST, hiveminder SECOND | hivefiver = meta handler; fixing it first enables fixing everything downstream | 2026-03-03 | NO | All nodes |
| 2 | Parity drift = INTENTIONAL DECOUPLE | User explicitly relaxed permissions for runtime; syncing now would lose overrides | 2026-03-03 | YES | SUB01 |
| 3 | Prime skill needs REDESIGN not just fill | Previous session filled stubs before loading standards skills; structure doesn't match open standard | 2026-03-03 | YES | SUB02 |
| 4 | Commands/workflows DEFERRED | They depend on skill hierarchy being settled; premature to touch | 2026-03-03 | YES | — |
| 5 | Agent body should slim to ~150-200L | 520L inlines knowledge that belongs in prime skill; duplicates skill content | 2026-03-03 | YES | SUB03 |
| 6 | hivefiver-orchestrator may be orphan | Only 1258 bytes, empty references/; needs investigation before deciding | 2026-03-03 | YES | SUB04 |
| 7 | All reference stubs written this session = DRAFT material | Filled before frame agreed; will be restructured per standards after prime redesign | 2026-03-03 | YES | SUB02 |

</decisions>

---

<action_items>

- [x] `DONE` — Scan full hivefiver asset inventory (38 assets, 6 categories)
- [x] `DONE` — Load 4 skill-design standards skills
- [x] `DONE` — Classify each asset group: improve / decouple / refactor
- [x] `DONE` — Create planning infrastructure at .hivemind/plan/
- [ ] `OPEN` — Await human confirmation of triage + order → then transition to `branching`
- [ ] `BLOCKED` — Sub-plan creation (blocked on confirmation)

</action_items>

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Prime redesign invalidates existing commands | M | H | Commands deferred; redesign prime first, adapt commands after |
| Skill avalanche during restructure sessions | M | M | Max 4 skills per session; checkpoint at 5th |
| Reference stubs have incorrect content | L | M | All stubs marked DRAFT; will be audited against standards |
| hivefiver-orchestrator removal breaks routing | L | H | Investigate (SUB04) before deciding; parallel to SUB01 |
| Context rot during multi-session restructure | H | H | Planning files serve as persistent memory; always re-read plan |

## Rollback Plan

- All changes are in `.opencode/skills/` — git revert to pre-restructure commit
- Agent body backed by root mirror (`agents/hivefiver.md` preserves pre-edit state)
- Templates/workflows/commands NOT touched = natural rollback boundary

---

<symlinks>

- State: [`_state.json`](_state.json)
- Validation: [`VALIDATION-META01-PLAN.md`](VALIDATION-META01-PLAN.md) (not yet created)
- Previous session stubs: `.opencode/skills/hivefiver-prime/` (DRAFT — will be restructured)
- Worktree prompt: `.worktrees/framework-upgrade/prompts/temporary-ordained.md`
- Asset inventory source: `.opencode/agents/hivefiver.md` (520L, canonical)
- Root mirror: `agents/hivefiver.md` (443L, 98-line drift)

</symlinks>

---

<footer>

## Session Notes

- [2026-03-03] [MAIN] Previous session created hivefiver-prime skeleton + filled 3 reference stubs. This session was redirected: STOP DEPTH → FRAME FIRST. Skills standards loaded. Asset inventory completed. Triage decisions classified. Planning infrastructure created.
- [2026-03-03] [MAIN] User correction: hivefiver = meta handler (FIRST), hiveminder = project-level (DOWNSTREAM). Not the other way around.
- [2026-03-03] [MAIN] User directive: coordinator-fronted only. No depth execution. Everything hypothesis + conditional. Research/investigation in sub-sessions only. Restart before execution group.

## Next Actions

1. **AWAITING**: Human confirmation of triage decisions (Section B of the frame)
2. **AWAITING**: Human confirmation of work order (E1→E9)
3. **ON CONFIRM**: Create sub-plan files META01-SUB01 through SUB04
4. **ON CONFIRM**: Begin SUB01 (parity decouple) and SUB04 (orchestrator investigation) in parallel — both are independent
5. **RESTART REQUIRED**: Before execution phase (SUB02 prime redesign, SUB03 body slimming)

## Context for Continuation

**STATE**: Plan META01 created at `routing` status. 38 hivefiver assets inventoried. 7 decisions logged. 4 sub-plans outlined but NOT yet created as files. Previous session's prime skill stubs (.opencode/skills/hivefiver-prime/) are DRAFT material — will be restructured per standards.

**BLOCKED ON**: Human confirmation of triage + order.

**NEXT EXACT STEP**: Wait for human to confirm or adjust the 4 sub-plan scope definitions, then create sub-plan files and begin parallel investigation of SUB01 + SUB04.

</footer>
