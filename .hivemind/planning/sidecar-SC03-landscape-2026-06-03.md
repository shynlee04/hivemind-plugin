[LANGUAGE: Write this file in en per Language Governance.]
[LANGUAGE: Write this file in en per Language Governance.]
# Landscape: SC-03 — Next.js 16 Standalone App

**Created:** 2026-06-03
**Session:** SC-03 delegation
**Status:** Landscape formed — ready for coordinated-path delegation

---

## Task Summary

Implement SC-03: Next.js 16 standalone application that consumes SC-02 REST API + Tool Proxy and displays the 4-panel Hivemind Sidecar GUI (Session Explorer, Delegation Dashboard, MEMS Browser, Control Panel). Uses `@json-render/react` for generative UI, shadcn/ui components, and Next.js API routes + SSE for real-time updates.

## Upstream Dependencies

| Phase | Status | Evidence |
|-------|--------|----------|
| SC-01 (Plugin HTTP Server + State Bridge) | ✅ COMPLETE | 59 tests, typecheck clean |
| SC-02 (REST API + Tool Proxy) | ✅ COMPLETE | 5/5 waves, 11 ACs, commit 4496960d |

## Existing Research Artifacts (inform SC-03)

- `.hivemind/planning/sidecar-vision/ARCHITECTURE.md` — 4-panel design, plugin integration, json-render catalog
- `.hivemind/planning/sidecar-vision/RESEARCH-nextjs.md` — Next.js 16 patterns
- `.hivemind/planning/sidecar-vision/RESEARCH-json-render.md` — @json-render/react v0.19.0 API
- `.hivemind/planning/sidecar-vision/RESEARCH-ecosystem.md` — reference patterns
- `.hivemind/planning/sidecar-vision/AUDIT-codebase-surfaces.md` — existing src/sidecar/ audit

## Domains Involved

| Domain | Role |
|--------|------|
| **Research** | Read existing SC-02 code to map available endpoints, read sidecar-vision research docs |
| **Planning** | Decompose SC-03 into executable phases with dependency ordering |
| **Implementation** | Build Next.js app, json-render panels, API routes |
| **Quality** | Gate triad on each wave return |

## Sub-task Breakdown

### Wave 1: Investigation + Planning (sequential)

| # | Sub-task | Specialist | Path | Artifact |
|---|----------|-----------|------|----------|
| 1.1 | Investigate SC-02 codebase: map all REST/SSE/WS endpoints, catalog schema, tool handlers | hm-l2-researcher | fast-path | `.planning/phases/SC-03-nextjs-app/03-RESEARCH.md` |
| 1.2 | Read sidecar-vision research/architecture, produce SPEC + CONTEXT + PATTERNS + PLAN for SC-03 | hm-l2-planner | fast-path | `.planning/phases/SC-03-nextjs-app/03-*.md` |

### Wave 2: Implementation (sequential, depends on Wave 1)

| # | Sub-task | Specialist | Path | Artifact |
|---|----------|-----------|------|----------|
| 2.1 | Implement Next.js app scaffold + json-render catalog + 4 panels | hm-l2-executor | fast-path | source files in src/sidecar/ |
| 2.2 | Wire API routes to SC-02 endpoints, SSE real-time, integration tests | hm-l2-executor | fast-path | source files + tests |
| 2.3 | Verification: typecheck + full suite + build + coverage gates | hm-l2-executor | fast-path | test results |

## Path Decisions

**Wave 1 (Investigation + Planning):** Fast-path sequential — hm-phase-researcher → hm-planner
**Wave 2 (Implementation):** Fast-path via hm-executor

## Quality Gate Expectations

- Wave 1 returns: SPEC + CONTEXT + RESEARCH + PATTERNS + PLAN must exist on disk
- Wave 2 returns: typecheck clean, tests pass, build succeeds, dist files verified
- Phase gate: triad (lifecycle → spec → evidence) after all waves complete
