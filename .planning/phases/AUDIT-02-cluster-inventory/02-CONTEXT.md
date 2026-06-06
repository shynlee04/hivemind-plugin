# Phase AUDIT-02: Cluster Inventory — Context

**Why cluster inventory:** 8 clusters defined from code surface analysis to organize the codebase into independently auditable units.

**Cross-cutting resolution:**
- tools → C3
- guards → C1
- session-tracker → C2
- foundation → C8

**Decision drivers:**
- Codebase spans multiple surface types (governance, runtime, tools, coordination, task management, config, hooks, foundation)
- Each cluster maps to a domain of concern for targeted deep inventories
- Cross-cutting dependencies documented to prevent duplicate work across clusters
