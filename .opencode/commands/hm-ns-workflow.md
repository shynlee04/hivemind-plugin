---
description: "workflow | discuss plan execute verify phase progress"
argument-hint: ""
requires: [discuss-phase, spec-phase, plan-phase, execute-phase, verify-work, phase, progress, ultraplan-phase, plan-review-convergence]
tools:
  read: true
  skill: true
---

Route to the appropriate phase-pipeline skill based on the user's intent.
Sub-skill names below are post-#2790 consolidated targets — `hm-phase`
absorbs the former add/insert/remove/edit-phase commands and `hm-progress`
absorbs the former next/do commands.

| User wants | Invoke |
|---|---|
| Gather context before planning | hm-discuss-phase |
| Clarify what a phase delivers | hm-spec-phase |
| Create a PLAN.md | hm-plan-phase |
| Execute plans in a phase | hm-execute-phase |
| Verify built features through UAT | hm-verify-work |
| Add / insert / remove / edit a phase | hm-phase |
| Advance to the next logical step | hm-progress |
| Offload planning to the ultraplan cloud | hm-ultraplan-phase |
| Cross-AI plan review convergence loop | hm-plan-review-convergence |

Invoke the matched skill directly using the Skill tool.
