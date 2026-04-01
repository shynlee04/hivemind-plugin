# Course Correction Test

## Scenario: Debug → Refactor Transition

A debug delegation discovers a structural issue and escalates to refactor.

### Setup

- Bug: test fails in `src/tools/task/tools.ts`
- Debug phase: reproduce → narrow
- Discovery: the bug is a structural problem, not a logic error

### Validation Table

| Step | Action | Expected |
|------|--------|----------|
| 1 | Debug reproduce phase | Bug confirmed, repro steps documented |
| 2 | Debug narrow phase | Root cause identified as structural |
| 3 | Escalation trigger | `status: "blocked"`, `escalation_target: "refactor"` |
| 4 | Evidence preserved | Debug findings in refactor packet |
| 5 | Refactor assess phase | Structural issue cataloged |
| 6 | Refactor plan phase | Refactor steps designed |
| 7 | Refactor execute phase | Changes applied |
| 8 | Refactor verify phase | Tests pass, bug fixed |

### Cross-Domain Test

| From | To | Trigger | Evidence Preserved |
|------|----|---------|-------------------|
| Debug | Refactor | Structural root cause | Debug findings → assess input |
| Audit | Refactor | Actionable issues | Recommendations → plan input |
| Refactor | Debug | Test breakage | Test output → reproduce input |

### Anti-Pattern Test

| Step | Action | Expected |
|------|--------|----------|
| 1 | Skip reproduce phase | Rejected — must confirm bug first |
| 2 | Lose evidence on transition | Error — evidence must transfer |
| 3 | Skip assess in refactor | Rejected — must understand state first |
