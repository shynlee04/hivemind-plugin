# Phase SE-7: Integration Verification — CONTEXT

**Workstream:** skill-ecosystem
**Phase:** SE-7 (terminal)
**Depends on:** SE-6 (all skills created)
**Status:** DRAFT — awaiting discuss-phase authorization

## Authorized Decision
Terminal phase. Prove all shipped skills pass RICH gates, cross-references resolve, and end-to-end workflow from brainstorm → triad gates works.

## Scope (WHAT — locked)

### RICH Gate Audit
- Full RICH-1 through RICH-8 evaluation on ALL shipped skills (hm-* + hf-*)
- Target: 100% PASS (no FAIL or BLOCKED)
- Per-skill scorecard in `metrics/rich-gate-scorecard.md`

### Cross-Reference Integrity
- Verify every cross-reference resolves to existing skill/agent/command
- Verify bidirectional where appropriate
- Target: 0 broken references

### End-to-End Workflow Test
- Path: brainstorm → spec-driven-authoring → test-driven-execution → hm-artifact-hierarchy → hm-gate-orchestrator → triad gates
- Verify each stage produces correct artifacts
- Verify gate triad produces unified verdict

### Lineage Routing Test
- Product task → routes through hm-* chain
- Meta task → routes through hf-* chain
- Hybrid task → handled correctly

### Final Report
- Ecosystem coherence report
- Remaining gaps (RICH-7)
- Workstream completion summary

## NOT in Scope
- Agent-synthesis workstream verification (separate workstream)
- Hard Harness (src/) code changes
