# Phase AUDIT-04: Legacy Phase Audit — Context

**Why legacy phase audit:** Audit all legacy phases in `.planning/phases/` against the 8-cluster inventory to surface assumptions, detect gaps/conflicts, and prepare for refactoring.

**Scope:** 121 legacy phases in `.planning/phases/` as of inventory date.

**Decision drivers:**
- Legacy phases may contain decisions, assumptions, and artifacts that conflict with current architecture
- Systematic audit prevents regressions during refactoring
- Audited phases can be archived to reduce clutter
- STATE.md and ROADMAP.md must be updated to reflect audit findings
