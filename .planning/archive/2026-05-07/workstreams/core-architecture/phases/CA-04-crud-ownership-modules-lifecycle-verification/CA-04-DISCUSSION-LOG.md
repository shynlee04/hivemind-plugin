# Phase CA-04: CRUD Ownership Modules + Lifecycle Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** CA-04 - CRUD Ownership Modules + Lifecycle Verification
**Areas discussed:** CRUD module depth, Toggle wiring priority, Naming convention validation, Lifecycle audit depth

---

## CRUD Module Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Full CRUD for all 19 | Uniform surface. 19 new modules. Violates Q2/Q3. | |
| Tiered by mutation need | 7 CRUD + 6 append-only + 6 read-only. Respects Q2/Q3/D-CRUD-05. ~15 modules. | ✓ |
| Minimal — existing consumers only | 2-3 modules. 14 dirs get no module. | |

**User's choice:** Tiered by mutation need
**Notes:** User emphasized that although full CRUD is expected eventually, other workstreams have not shaped directory interfaces yet — tiered approach is correct for now. Deferred items must be tracked in REQUIREMENTS.md, STATE.md, ROADMAP.md and follow-up context.

---

## Toggle Wiring Priority

| Option | Description | Selected |
|--------|-------------|----------|
| Wire all 4 now | All @future-consumer toggles wired. 6+ files. Risks dead code for WS-6 DEFERRED. | |
| Wire cross_session_tasks_dependencies_validation only | Lifecycle-manager.ts consumer. 2-3 files. | ✓ |
| Doc-only, update annotations | Zero implementation risk. Pure CA-04 focus. | |
| Wire trajectory_control + task_plus_enabled, defer others | Wire 2 with clearest consumers. 4 files. | |

**User's choice:** Wire cross_session_tasks_dependencies_validation only
**Notes:** Clean scope alignment. Remaining 3 toggles stay doc-only with updated @future-consumer annotations. Wiring deferred to WS-6.

---

## Naming Convention Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Scan + Report only | Full scan of 107 shipped primitives. Produce report. No fixes. | ✓ (Layer 1) |
| Template + Validate sample | Reusable CI script. 44 sample files. | ✓ (Layer 2) |
| Full audit + auto-fix | 107 files inspected. Auto-fix violations. 50+ edits. | |

**User's choice:** Both Scan + Report AND Template + Validate sample (two-layered approach)
**Notes:** User directed Layer 1 (full scan + report) first, then Layer 2 (template + validate). Emphasized that the skeleton is nowhere near completion — giant gaps exist in commands, workflows, parsing, conditional auto routing, intent routing. Reports serve as knowledge and context for future phases. Referenced `.hivemind/poor-prompts/PROJECT-ISSUES-2026-05-05.md`.

---

## Lifecycle Audit Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Verification-only pass (all 34 modules, no fixes) | Zero regression risk. Full gap inventory. | |
| Verification pass → targeted fixes on 6 CRUD-owner modules | Audit all 34 first, fix only the 6 CRUD-owners. | ✓ |
| Targeted audit + fixes on 6 modules only | Audit and fix only CA-04-touched modules. | |

**User's choice:** Verification pass → targeted fixes on 6 CRUD-owner modules
**Notes:** Two-phase approach: Phase 1 audits all 34 modules (no fixes) using synthesized gate-l3-lifecycle-integration criteria. Phase 2 fixes violations in the 6 CRUD-owner modules only. Gate skill reference documents must be synthesized from ARCHITECTURE.md first.

---

## the agent's Discretion

*All decisions were user-directed. No areas were deferred to agent discretion.*

## Deferred Ideas

- Full uniform CRUD for all 19 directories → future phases (tiered approach is foundation)
- trajectory_control, advanced_continuity_validation, task_plus_enabled wiring → WS-6 (DEFERRED)
- ui_phase, ui_safety_gate, ai_integration_phase wiring → WS-2/WS-8/WS-4
- Auto-fixes for naming violations → dedicated naming-quality wave
- Fixes for 28 non-CRUD-owner lifecycle violations → CA-05 or equivalent quality sprint
- Backfill consumed-by metadata across 50+ skills → future SE wave
- Cross-lineage runtime enforcement → post-GA
- Tool guard enforcement (blocking) → post-GA
