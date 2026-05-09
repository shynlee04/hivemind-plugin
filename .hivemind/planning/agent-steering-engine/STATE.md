---
feature: agent-steering-engine
status: active-planning
created: 2026-05-09
updated: 2026-05-09
current-phase: 01-Research-And-Architecture
phase-status: completed
overall-progress: 12%
blocked: false
blocker: none
---

# Agent Steering Engine — State

## Current Position

**Phase:** 01-Research-And-Architecture — COMPLETE
**Status:** Research completed, artifacts written
**Next action:** Begin Phase 02 (Schema And Policy Design) after checkpoint review

## Phase Tracking

| Phase | Status | Artifacts | Atomic Plans | Commits |
|-------|--------|-----------|-------------|---------|
| 01-Research-And-Architecture | complete | CONTEXT.md, RESEARCH.md | — | pending |
| 02-Schema-And-Policy-Design | pending | — | — | — |
| 03-Core-Engine-Implementation | pending | — | — | — |
| 04-Dynamic-Primitive-Registration | pending | — | — | — |
| 05-Injection-Surfaces-Wiring | pending | — | — | — |
| 06-Artifact-Persistence-Steering | pending | — | — | — |
| 07-Integration-And-Validation | pending | — | — | — |
| 08-Progressive-Enrichment-Layer | pending | — | — | — |

## Checkpoint Log

| Checkpoint | Phase | Result | Evidence |
|-----------|-------|--------|----------|
| Master plan creation | Pre-phase | Created REQUIREMENTS.md, STATE.md, ROADMAP.md | This file |
| Phase 01 research complete | 01 | Online-validated findings across 12 sources | CONTEXT.md (80 lines), RESEARCH.md (283 lines) |

## Dependency Map

```
01-Research → 02-Schema → 03-Core-Engine
                                    ↓
04-Dynamic-Registration → 05-Injection-Wiring → 07-Integration
                                                      ↓
06-Artifact-Steering → ─────────────────────────→ 07-Integration
                                                      ↓
                                              08-Progressive-Enrichment
```

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| messages.transform hook semantics differ from research assumptions | Medium | High | Spike in Phase 01 before committing to architecture |
| OpenCode SDK hook ordering causes conflicts with existing governance | Low | Critical | Integration test with existing hooks in Phase 05 |
| Dynamic primitive scanning performance on large .opencode/ trees | Medium | Medium | Benchmark in Phase 04, cache results |
| Steering content contributes to context window pressure | Medium | High | Measure token budget impact per injection in Phase 03 |
| CQRS boundary prevents necessary state tracking in hooks | Low | High | Design state tracking through tools, not hooks, in Phase 02 |

## Key Decisions Log

| Decision | Made | Rationale | Reversible? |
|----------|------|-----------|-------------|
| messages.transform as primary injection surface | Yes (team-b research) | Conditional, no-op available, surgical | Yes — can switch to sendPrompt-based |
| Progressive enrichment (MVP first) | Yes (user Q3) | Avoids injection fatigue, validates incrementally | Yes |
| All code in src/ not .opencode/ | Yes (user constraint) | Steering is runtime feature, not meta-concept | No — hard constraint |
| Schema-driven not hard-coded | Yes (user constraint) | Users must be able to extend without source changes | No — hard constraint |
| 8-phase roadmap | Draft (reference only) | Subject to checkpoint reassessment per user directive | Yes — phases renumber/merge as needed |
