# Project State

> Cross-session persistent state. Survives compaction boundaries.
> Last Updated: 2026-02-28

## Current Position

- **Trajectory**: THE-FRAMEWORK-TEST-ITSELF
- **Active Phase**: Phase 0 (Brownfield Mapping) → COMPLETE
- **Next Phase**: Wave β (Context Injection Remediation) → PENDING user approval
- **Branch**: `v-2.9-harness-dev`
- **Last Commit**: `d845536` (Wave α libs)
- **Drift Score**: 70/100
- **Build State**: dist/ and node_modules intentionally removed during planning phase

## Active Blockers

| # | Blocker | Severity | Blocks |
|---|---------|----------|--------|
| 1 | Context injection pipeline injects ~11,360 tokens/turn (target <1,200) | P0 | Wave β, all downstream |
| 2 | 3 P0 duplications across dual-channel injection (checklist ×2, confirmation ×2, entity checklist ×3) | P0 | Wave β |
| 3 | MT-03 auto-realign fires every commandless turn — demonstrated live as context poisoning | P0 | Wave β.3 |
| 4 | 31 pre-existing sync-assets test failures | P2 | Full npm test (deferred, unrelated) |
| 5 | dist/ removed — cannot run tsc verification until npm install + build | P1 | Any verification gate |
| 6 | Framework cannot automate its own codebase mapping — must be done manually | P1 | Wave ζ |

## Recent Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-28 | No gsd-* agents; HiveMind-native only | User directive — framework must use its own facilities |
| 2026-02-28 | Sector-1 deferred until Sector-2 stable | User directive — stabilize governance layer first |
| 2026-02-28 | Brownfield mapping before any code changes | GSD workflow compliance — research before execution |
| 2026-02-28 | 3-RANK priority hierarchy | Master plan v2.1 — severity-driven, not sequence-driven |
| 2026-02-28 | Manual brownfield mapping is itself a concern | User reflection — framework should automate this |
| 2026-02-27 | Hybrid A+B with stabilize-first governance | Master plan pivot from linear to remediation-first |

## Codebase Health Snapshot

| Domain | Score | Source |
|--------|-------|--------|
| Source Code (compile/test) | 10/10 | STACK.md, anchor `wave-1-completion` |
| Framework Validator | 10/10 | anchor `wave-1-completion` |
| Command→Asset Chaining | 10/10 | anchor `wave-1-completion` |
| Agents | 9/10 | anchor `audit-2026-02-28` |
| Skills Registry | 9/10 | 33 skills active |
| Workflows | 9/10 | 20/20 v2 compliant |
| Context Injection Health | 3/10 | CONCERNS.md P0-1, P0-2, P0-3 |
| SOT Planning Layer | 5/10 | Mapping complete, governance files being populated |
| Auto-Session Mechanism | 0/10 | SYSTEM-DIRECTIVES §3A unbuilt |
| Memory Lifecycle | 1/10 | Tools exist but no auto-parse |
| Progressive Disclosure | 0/10 | Runtime loader not implemented |
| Code Intelligence | 1/10 | codemap/codewiki manifests empty |

## Concern Summary (from CONCERNS.md)

| Severity | Count | Key Items |
|----------|-------|-----------|
| P0 Critical | 3 | Dual-channel injection duplication (checklist, confirmation, entity checklist) |
| P1 High | 6 | 21 sync reads/turn, duplicate detectOffTrackIntent, barrel exports dead modules, 114 silent catches, 52% lib untested |
| P2 Medium | 8 | 11 dead files (1,407L), god objects (messages-transform 679L), scattered budget constants |
| P3 Low | 5 | Minor type casts, dashboard quality, inconsistent error handling |

## Session History

| Session | Date | Accomplishments |
|---------|------|-----------------|
| Current | 2026-02-28 | Brownfield mapping (7 docs), SOT governance population, user corrections captured |
| Previous | 2026-02-28 | 3-agent injection trace, master plan v2.1 rewrite, Wave α verification, config dead code removal |
| Earlier | 2026-02-27 | Wave 1A/1B completion, smart merge sync, framework auditor skill, audit blockers |
