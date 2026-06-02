[LANGUAGE: Write this file in en per Language Governance.]
# Landscape: Hivemind Sidecar GUI Layer

**Created:** 2026-06-02
**Session:** sidecar-vision
**Status:** Landscape formed — ready for delegation

---

## Task Summary

Design and implement the Hivemind Sidecar — a Next.js 16 + @json-render/react v0.19.0 GUI layer that reads from `.hivemind/` to provide session visualization, delegation dashboards, MEMS memory browsing, and configuration panels for the Hivemind runtime composition engine.

## Domains Involved

| Domain | Role | Specialists |
|--------|------|-------------|
| **Research** | Validate json-render v0.19.0 API, Next.js 16 patterns, package version compatibility, reference implementations | hm-l2-researcher, hm-l3-deep-research |
| **Architecture** | Design 4-panel catalog, data flow from .hivemind/ read-only state, SSE live update wiring, plugin integration | hm-l2-architect |
| **Planning** | Break into phases, define deliverables, dependency ordering | hm-l2-planner |
| **Implementation** | Write catalog components, Next.js pages, readonly-state.ts wiring, SSE endpoints | hm-l2-executor |
| **Quality** | Gate triad on each phase return | hm-l2-reviewer, gate-l3-* |

## Sub-task Breakdown & Agent Assignments

### Wave 1: Research (sequential — Wave 2 depends on output)

| # | Sub-task | Specialist | Path | Artifact |
|---|----------|-----------|------|----------|
| 1.1 | Research json-render v0.19.0 API surface, catalog/registry changes, breaking changes from 0.18.x | hm-l2-researcher | fast-path | `.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` |
| 1.2 | Research Next.js 16 App Router patterns for sidecar SSE + Server Components reading filesystem | hm-l2-researcher | fast-path | `.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` |
| 1.3 | Audit existing `src/sidecar/readonly-state.ts` for wiring points + check tmux P50-P55 integration patterns | hm-l2-scout | fast-path | `.hivemind/planning/sidecar-vision/AUDIT-sidecar-existing.md` |
| 1.4 | Survey ecosystem for reference sidecar/plugin-dashboard patterns (opencode ecosystem, Vercel labs examples) | hm-l2-researcher | fast-path | `.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` |

### Wave 2: Architecture Design (depends on Wave 1)

| # | Sub-task | Specialist | Path | Artifact |
|---|----------|-----------|------|----------|
| 2.1 | Design json-render catalog (15 components), registry, spec schemas | hm-l2-architect | fast-path | `.hivemind/planning/sidecar-vision/ARCHITECTURE-catalog.md` |
| 2.2 | Design data flow: .hivemind/ → readonly-state.ts → Next.js API routes → json-render specs → panels | hm-l2-architect | fast-path | `.hivemind/planning/sidecar-vision/ARCHITECTURE-dataflow.md` |
| 2.3 | Design plugin integration: hook events → SSE endpoint, session-tracker push | hm-l2-architect | fast-path | `.hivemind/planning/sidecar-vision/ARCHITECTURE-plugin-integration.md` |
| 2.4 | Package dependency audit: version bumps needed, peer dep conflicts | hm-l2-researcher | fast-path | `.hivemind/planning/sidecar-vision/RESEARCH-dependencies.md` |

### Wave 3: Planning (depends on Wave 2)

| # | Sub-task | Specialist | Path | Artifact |
|---|----------|-----------|------|----------|
| 3.1 | Decompose into executable phases with dependency ordering | hm-l2-planner | fast-path | `.hivemind/planning/sidecar-vision/PLAN.md` |

## Path Decisions

All sub-tasks use **fast-path** (direct to L2 specialists) because:
- Single specialist per sub-task
- Known domain (no scope ambiguity)
- Sequential wave dependency (Wave 1 → 2 → 3)
- No cross-domain coordination within a single sub-task

## Wave Ordering & Dependencies

```
Wave 1 (Research) — 4 parallel tasks
    │
    ▼
Wave 2 (Architecture) — 4 sequential/parallel tasks
    │
    ▼
Wave 3 (Planning) — 1 task
    │
    ▼
[Future] Wave 4+ (Implementation, Quality gates)
```

## Quality Gate Expectations

- Each wave return: artifact MUST exist on disk with evidence references
- Wave 3 gate: lifecycle → spec → evidence triad after plan verification

## Communication

All artifacts under `.hivemind/planning/sidecar-vision/`
Return each wave's results to orchestrator before advancing to next wave.
