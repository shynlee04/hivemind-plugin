# Phase AUDIT-03: Deep Inventories — Context

**Why deep inventories:** Per-cluster deep inventories for C2 through C8. Each inventory lists all files, sub-groupings, cross-cutting dependencies, gaps, conflicts, and flaws.

**Approach:** Delegated specialist agents scan one cluster at a time. C1 already complete from AUDIT-02.

**Decision drivers:**
- Sequential scanning prevents resource contention
- Each cluster's findings inform the next
- Deep inventories feed directly into AUDIT-04 legacy phase audit
