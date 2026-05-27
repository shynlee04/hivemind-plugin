[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
# Merged Phase 24.3: Commands Infrastructure & Tooling — CONTEXT

**Date:** 2026-05-27
**Decision:** Merge original P24.3 (Commands Infrastructure) + P24.3.2 (Core Revamp) + P24.3.3 foundational + P24.4 (deferred except critical items)
**Rationale:** 6 critical flaws from P24.3.2 already fixed. Remaining gaps form a natural dependency chain. P24.4 (References & Templates) has no code dependency on P24.3 — deferred to separate phase.

## Scope

**IN:**
- Wire contract validation (currently dead module)
- Add `namespace` field to `CommandBundle` type
- Create `src/tools/session/index.ts` barrel
- Document TUI append confusion gap
- Update ROADMAP.md, STATE.md

**OUT (deferred):**
- Namespace routing logic → P24.4
- Workflow execution engine → P24.4
- NL auto-append → P24.4
- `.hivemind/references/` + `.hivemind/templates/` → P24.4

## Dependencies

- Blocked by: P23.3 (GAP-01 notification UAT) — per STATE.md
- Does NOT block: P24.4 (independent scope)
- Does NOT block: P25 (Trajectory) — trajectory depends on P23.5 gate, not P24.3 delivery timing
