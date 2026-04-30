---
phase: 32.1-workstream-path-layout-doc
priority: P2
status: pending
created: 2026-04-30
driver_audit: delegation-async-pty-lifecycle-audit-2026-04-30
driver_finding: 6
amends: 32
supersedes_amendment_status: false
depends_on: []
blocks: [31-planning-documentation-refresh]
gsd_agents: [gsd-doc-writer, gsd-verifier]
requirements: [DOC-WS-LAYOUT-01, HEALTH-CHECK-WS-01]
---

# Phase 32.1: Workstream Path Layout Documentation

## Goal

Document the project's deliberate workstream-rooted phase layout (`.planning/workstreams/{milestone,skill-ecosystem,agent-synthesis}/phases/`) and update the planning health check to resolve phase IDs across all three workstream roots. Eliminate the "phantom phase" framing introduced by the audit's Finding 6.

## Validation Source

Generated from `AUDIT-VALIDATION-2026-04-30.md` Finding 6 (CONTEXTUAL). Evidence on disk:

- The branch HAS `.planning/workstreams/milestone/phases/` with 70 phase directories (02, 09, 14, 16.x, 32, 36, 38, 46, 48.x, 52, 53, etc. — all the "phantom" ones).
- The audit was run as if `.planning/phases/` were the canonical root; it is not. The skill-ecosystem workstream's D-01 decision locks `.hivemind/` as canonical state root and partitions planning by workstream.

The "phantom phase" claim is therefore a path-resolution mismatch, not a missing-artifact problem. Documentation closes it without any deletions.

## Requirements

| ID | Requirement | Source |
|----|-------------|--------|
| DOC-WS-LAYOUT-01 | `.planning/PROJECT.md` MUST contain a "Phase Path Resolution" section listing the three workstream roots, owner per workstream, and the rule that phase IDs are unique within each workstream. ROADMAP.md status table cross-references the workstream owner per phase. | Validation override |
| HEALTH-CHECK-WS-01 | `gsd-sdk query find-phase <ID>` (or a wrapper invoked by the planning health check) MUST resolve phase IDs against all three workstream roots, in the order: milestone → skill-ecosystem → agent-synthesis. Health-check script flags ambiguous IDs (same phase number in multiple workstreams). | Validation override |

## Scope

- `.planning/PROJECT.md`
- `.planning/workstreams/milestone/ROADMAP.md`
- `.planning/workstreams/milestone/STATE.md`
- The planning health-check script under Phase 31's directory (or the gsd-sdk wrapper), if one exists

## Out of Scope

- Deleting any phases.
- Renumbering phases.
- Force-merging workstreams.

## GSD Routing

| Requirement | GSD Agent | Skill |
|-------------|-----------|-------|
| DOC-WS-LAYOUT-01 | gsd-doc-writer | gsd-docs-update |
| HEALTH-CHECK-WS-01 | gsd-executor | hm-refactor |
