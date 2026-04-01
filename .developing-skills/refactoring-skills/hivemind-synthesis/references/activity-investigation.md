# Activity Investigation

## Table of Contents

- [Activity Data Layers](#activity-data-layers)
- [Planning Artifacts Investigation](#planning-artifacts-investigation)
- [Delegation Records Investigation](#delegation-records-investigation)
- [Handoff Records Investigation](#handoff-records-investigation)
- [Testing & Verification Investigation](#testing--verification-investigation)
- [Agent Output Investigation](#agent-output-investigation)

## Activity Data Layers

`.hivemind/activity/` with 17 subdirectories, 137+ files.

Key categories:

| Category | Path | File Count | Primary Use |
|----------|------|-----------|-------------|
| Agents | `activity/agents/` | Per-agent dirs | Agent output tracking |
| Audit | `activity/audit/` | ~5 files | Audit trail |
| Codescan | `activity/codescan/` | ~8 files | Code scan outputs |
| Delegation | `activity/delegation/` | 34 files | Phase dispatch records |
| Handoff | `activity/handoff/` | 12 files | Phase transition records |
| Hierarchy | `activity/hierarchy/` | ~4 files | Decision hierarchy |
| Longhaul | `activity/longhaul/` | ~3 files | Multi-turn task state |
| Pathing | `activity/pathing/` | ~2 files | Deterministic path records |
| Planning | `activity/planning/` | ~10 files | Planning artifacts |
| Sessions | `activity/sessions/` | ~6 files | Session continuity |
| State | `activity/state/` | ~4 files | Workflow state snapshots |
| Status | `activity/status.json` | 1 file | Workflow tracker |
| Synthesis | `activity/synthesis/` | ~5 files | Integration summaries |
| TDD | `activity/tdd/` | 21 files | TDD evidence |
| Verification | `activity/verification/` | 19 files | Verification reports |

## Planning Artifacts Investigation

**Path:** `.hivemind/activity/plans/` and `.hivemind/activity/planning/`

Files: master plans, integration plans, skill improvement plans.

**Investigation focus:**
- Plan continuity — does each plan reference the prior one?
- Task decomposition — are tasks properly broken down?
- Dependency tracking — are dependencies between tasks identified?
- Cross-ref with `activity/status.json` for workflow tracker state

**Questions to answer:**
1. What was planned vs what was executed?
2. Where did plans diverge from execution?
3. What tasks are still pending?

## Delegation Records Investigation

**Path:** `.hivemind/activity/delegation/`

34 delegation JSON files tracking phase dispatches.

**Each packet contains:**
- `target_agent` — who was dispatched
- `scope` — what was delegated
- `constraints` — boundaries set
- `return_status` — completed / partial / blocked

**Investigation focus:**
- Agent usage patterns — which agents are dispatched most?
- Success rates — what percentage return completed vs blocked?
- Scope patterns — are delegations properly bounded?
- Constraint violations — did agents exceed their scope?

## Handoff Records Investigation

**Path:** `.hivemind/activity/handoff/`

12 timestamped phase handoffs.

**Tracks:**
- Source and destination agents
- Context preserved in handoff
- Carry-forward items (≤5 key findings)
- Handoff success/failure

**Investigation focus:**
- Was context properly preserved between phases?
- Were carry-forward items acted upon?
- Did handoffs lose critical information?

## Testing & Verification Investigation

**Path:** `.hivemind/activity/tdd/` (21 files) and `.hivemind/activity/verification/` (19 files)

**TDD evidence:** Red/green/refactor phases per plan. Each file documents:
- Tests written (red phase)
- Implementation that passed (green phase)
- Refactoring that preserved behavior (refactor phase)

**Verification reports:** Incremental verification, hiveq verification, final verify per plan.

**Cross-ref with:** `.hivemind/activity/synthesis/` (integration summaries)

**Investigation focus:**
- Do TDD records match actual test files?
- Were all verification gates actually run?
- Do verification reports show command output (evidence) or just claims?

## Agent Output Investigation

**Path:** `.hivemind/activity/agents/`

Per-agent output folders: architect, code-skeptic, hitea, hivehealer, hiveq, hiverd, hivexplorer.

**Investigation focus:**
- What does each agent type produce?
- Output quality — do agents return evidence or claims?
- Decision patterns — how do different agent types approach problems?
- Consistency — do agents follow their delegation packets?
