---
description: "State workflow: load state → aggregate data → analyze progress → identify blockers → report."
---

# hm-state

## Goal
Aggregate project state from multiple sources to produce a concise state report showing current phase, completion percentage, blockers, and next recommended action.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| State | hm-planner | Aggregates state data, analyzes progress, writes report |

## Execution Phases
1. **Load State Sources**: Read .planning/STATE.md, .planning/ROADMAP.md, git log for recent commits.
2. **Aggregate Data**: Count completed vs total phases. Identify current active phase. List blockers from planning documents.
3. **Progress Analysis**: Calculate completion percentage. Determine velocity (phases/week). Estimate remaining timeline.
4. **Blocker Identification**: Scan for BLOCKED, WAITING, or DEPENDS-ON markers in planning docs.
5. **Next Action**: Determine the single most important next action based on current state and dependencies.
6. **Write Report**: Produce concise state report with: Current Phase, Progress %, Blockers, Next Action, Recent Activity.

## Exit Criteria
- State report written with current phase, progress %, blockers, and next action.
- Report is concise (under 50 lines unless --detailed flag).
