# Reference 05: Quality Gates

> **Jump targets:** [ref-05 §1]–[ref-05 §5]

## §1 — Gate Triad Overview

Every delegation output must pass the quality gate triad. L0/L1 agents enforce this:

```
DELEGATION → lifecycle gate → spec gate → evidence gate → ACCEPT
                                                          ↓
                                                     FAIL → return gaps
                                                              ↓
                                                    Max 3 retries → escalate to user
```

### Gate Skills to Load

| Gate | Skill | Check |
|------|-------|-------|
| Lifecycle | `gate-l3-lifecycle-integration` | CQRS boundaries, surface authority, actor hierarchy |
| Spec | `gate-l3-spec-compliance` | Bidirectional traceability, gap detection, EARS acceptance |
| Evidence | `gate-l3-evidence-truth` | L1-L5 evidence hierarchy, no mock-only proof |

### Gate Orchestration

The skill `hm-l2-gate-orchestrator` can run the full triad as a pipeline. Use when running a complete phase audit or milestone verification.

## §2 — Gate Enforcement Protocol

```
1. Before accepting child output: run lifecycle gate
2. If lifecycle PASSES: run spec compliance gate  
3. If spec PASSES: run evidence truth gate
4. If ALL PASS: accept child output
5. If ANY FAIL: return gap report to child, max 3 fix cycles
6. After 3rd failure: escalate to user with full gap report
```

### Gate Flow Between Coordinators and L2

```
L1 receives L2 output:
  1. Load gate-l3-lifecycle-integration → verify CQRS compliance
  2. If PASS → load gate-l3-spec-compliance → verify spec traceability
  3. If PASS → load gate-l3-evidence-truth → verify evidence hierarchy
  4. If ALL PASS → accept output, report to L0
  5. If FAIL → return gap report to L2 with specific failures
```

## §3 — Gate Skills Reference

### Shared Gate Skills (Both Lineages)

| Gate | Skill | When to Load | Who Loads It |
|------|-------|-------------|-------------|
| Lifecycle Check | gate-l3-lifecycle-integration | Before accepting any child agent output | hm-l1-coordinator, hf-l1-coordinator |
| Spec Compliance | gate-l3-spec-compliance | After lifecycle gate passes | hm-l1-coordinator, hf-l1-coordinator |
| Evidence Truth | gate-l3-evidence-truth | After spec gate passes (terminal gate) | hm-l1-coordinator, hf-l1-coordinator |
| Gate Orchestration | hm-l2-gate-orchestrator | When running the full triad as a pipeline | hm-l1-coordinator |

## §4 — Phase Transition Gates

```
PLANNING → EXECUTION:
  Gate: lifecycle-integration checks that plan is within CQRS boundaries
  Gate: spec-compliance checks that plan traces to requirements
  Pass → dispatch hm-l2-executor

EXECUTION → QUALITY:
  Gate: lifecycle-integration checks implementation surface authority
  Gate: spec-compliance bidirectional traceability
  Gate: evidence-truth checks L1-L5 evidence hierarchy
  Pass → dispatch hm-l2-reviewer

QUALITY → DEPLOYMENT:
  Gate: hm-l2-production-readiness — 8 dimensions
  Gate: evidence-truth — terminal gate
  Pass → ready for deployment

ANY PHASE → RECOVERY:
  Gate: session-tracker check for aborted delegations
  Action: RESUME protocol → [ref-02 §1]
```

## §5 — HMQUAL Compliance

This skill adheres to the project-level HMQUAL quality contract (HMQUAL-01 through HMQUAL-08).

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥10 | 14 trigger phrases in description (session start, resume session, disconnect recovery, recover from disconnect, context compaction, compact context, lineage routing needed, which lineage, what workflow, power on, restart session, continue work, governance, session governance) |
| HMQUAL-02 | Self-correction with anti-patterns | 10 anti-patterns: Fresh Starter, Prompt Repeater, Layer Skipper, Gate Skipper, Context Hog, Multi-Loader, Silent Crosser, Context Polluter, File Referrer, Hallucinator |
| HMQUAL-03 | Cross-references to related skills | 12+ cross-referenced skills across hm/hf/gate/stack lineages |
| HMQUAL-04 | Progressive disclosure | SKILL.md (thin body) + 6 references/ files |
| HMQUAL-05 | Worked example with real session IDs | Disconnect recovery example with ses_1ebe832c5ffeeYuFbS1kqleZnD |
| HMQUAL-06 | IRON LAWS enforcement | 7 iron laws in prominent block at top of SKILL.md |
| HMQUAL-07 | Tool API validated against source | session-tracker params validated against session-tracker.ts |
