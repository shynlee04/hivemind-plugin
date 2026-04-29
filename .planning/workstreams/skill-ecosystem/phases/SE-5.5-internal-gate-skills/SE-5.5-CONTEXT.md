# Phase SE-5.5: Internal Gate Skills — Hardening & Integration — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-5.5 (inserted between SE-5 and SE-6)
**Depends on:** SE-5 (gate-orchestrator + lineage-router exist)
**Status:** DRAFT — awaiting discuss-phase authorization

## What These Are

A third skill category: **harness-project-internal**. Neither hm-* (shipped cross-lineage) nor hf-* (hivefiver-exclusive). These 3 gate skills serve THIS project's quality gatekeeping — they validate the harness engineering lifecycle, spec compliance, and runtime evidence truth.

Created from the original harness lifecycle specification prompt. Currently:

| Skill | RICH Audit | Key Issues |
|-------|-----------|------------|
| gate-lifecycle-integration | **FAIL** | No hm-* skill integration (RICH-3), no routing to operational skills (RICH-4), no gap documentation (RICH-7) |
| gate-spec-compliance | **BLOCKED** | RICH-8 scoring missing. Integration wiring is strong but evidence incomplete. |
| gate-evidence-truth | **BLOCKED** | RICH-8 scoring missing. RICH-6 partial (project-local paths). |

## Problem

1. The 3 gates were created hastily from the original harness lifecycle spec — they work but lack RICH-gate quality
2. gate-lifecycle-integration is isolated from operational skills — violations found have no path to remediation
3. gate-evidence-truth references project-local paths (src/lib/session-api.ts, etc.) — would fail in end-user projects
4. No cross-referencing between the triad is bidirectional (gate-lifecycle-integration doesn't reference gate-evidence-truth)
5. No agent permissions exist for any gate-* skill

## Scope (WHAT — locked)

### Improvement Targets

| Skill | What to Fix |
|-------|------------|
| gate-lifecycle-integration | Add routing to hm-completion-looping, hm-coordinating-loop, hm-phase-execution, hm-debug. Define remediation paths for FAIL findings. Add gap documentation (RICH-7). |
| gate-spec-compliance | Add RICH-8 skill-judge scorecard. Fix project-local path assumptions (RICH-6). |
| gate-evidence-truth | Add RICH-8 skill-judge scorecard. Replace project-local path references with adapter notes. Fix backward reference to gate-lifecycle-integration. |

### Triad Integration
- gate-lifecycle-integration → references BOTH gate-spec-compliance AND gate-evidence-truth
- gate-spec-compliance → references BOTH upstream and downstream
- gate-evidence-truth → references BOTH upstream gates
- All three list triad-siblings in YAML frontmatter

### Routing
- On FAIL: route to hm-debug (investigation) or hm-refactor (structural fix)
- On classification violation: route to hm-coordinating-loop (redesign dispatch)
- Consumed by: hm-gate-orchestrator (created in SE-5)

## Constraints
- These are INTERNAL-USE — not shipped, serve THIS project only
- Must NOT depend on hm-* or hf-* skills (they validate those skills)
- Must use skill-creator + skill-judge for quality verification
- Prefix: `gate-*` (distinct from hm-* and hf-* — signals harness-internal)

## NOT in Scope
- Creating new gate logic (gates already exist, enhancing existing)
- Shipping these skills (INTERNAL-USE only)
- hm-gate-orchestrator (created in SE-5 — this phase improves the gates it orchestrates)
