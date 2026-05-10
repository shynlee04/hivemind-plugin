---
feature: agent-steering-engine
status: active-planning
created: 2026-05-09
updated: 2026-05-10
current-phase: 02-Schema-And-Policy-Design
phase-status: validated-corrected
overall-progress: 25%
blocked: false
blocker: none
last-validation: 2026-05-10 — Research validated against live anomalyco/opencode sources; critical corrections applied (RESEARCH.md, SPEC.md, PATTERNS.md)
---

# Agent Steering Engine — State

## Current Position

**Phase:** 02-Schema-And-Policy-Design — COMPLETE
**Status:** Schema and policy design complete, artifacts written
**Next action:** Begin Phase 03 (Core Engine Implementation) after checkpoint review

## Phase Tracking

| Phase | Status | Artifacts | Atomic Plans | Commits |
|-------|--------|-----------|-------------|---------|
| 01-Research-And-Architecture | complete | CONTEXT.md, RESEARCH.md | — | pending |
| 02-Schema-And-Policy-Design | complete | SPEC.md (362 lines), PATTERNS.md (570 lines) | — | pending |
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
| Phase 02 schema design complete | 02 | Zod schemas, policy resolution, CQRS boundary, 4 default policies | SPEC.md (362 lines), PATTERNS.md (570 lines) |
| **2026-05-10: Live validation + corrections** | 01-02 | Verified all hook signatures against anomalyco/opencode source; discovered Issue #25754 (silent no-op); corrected RESEARCH.md §1.3/§1.5/§1.6/§4.3/§7/§8, SPEC.md §3.3/§3.4, PATTERNS.md §2/§5 | GitHub issues #19960, #25754; plugin/index.ts; config.ts |

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
| messages.transform hook semantics differ from research assumptions | **CONFIRMED** — Issue #25754 | Critical | Mitigation: all injection uses push/splice in-place, never reassignment (enforced in SPEC.md §3.4, PATTERNS.md §2/§5) |
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
| In-place mutation only for messages.transform | Yes (2026-05-10 validation) | `output.messages = newArray` is silent no-op (anomalyco/opencode#25754); all injection MUST use push/splice | No — enforced at schema level |
