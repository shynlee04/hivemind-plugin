---
description: "Roadmap workflow: load phases → dependency analysis → gap detection → modification → report."
---

# hm-roadmap

## Goal
Manage the project roadmap: display phases with status, analyze dependency chains, detect gaps, and apply modifications (add/remove/reorder).

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Roadmapping | hm-roadmapper | Loads, analyzes, modifies, and reports on roadmap |

## Execution Phases
1. **Load Roadmap**: Read ROADMAP.md from .planning/ or .planning//.
2. **Display**: Render categorized phase list with status (planned/in-progress/complete/blocked), dependencies, and priority.
3. **Dependency Analysis**: Trace dependency chains, detect circular dependencies, find orphan phases, identify critical path.
4. **Gap Detection**: Check for missing phases between completed work and roadmap targets.
5. **Modification** (if action=add/remove): Apply change with automatic renumbering and dependency validation.
6. **Export**: Write roadmap report with dependency graph, critical path, gap analysis, and recommendations.

## Exit Criteria
- Roadmap displayed or modified as requested.
- Dependency analysis detects any violations.
- Gap analysis identifies missing phases.
- Report written to hm-roadmap-report.md.
