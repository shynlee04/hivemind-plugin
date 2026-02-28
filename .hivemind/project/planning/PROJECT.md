# Project Vision

> HiveMind Context Governance Plugin — v2.8.5
> Trajectory: THE-FRAMEWORK-TEST-ITSELF

## Purpose

HiveMind is a context-aware governance layer for OpenCode that prevents agent drift, tracks decisions, and preserves memory across AI coding sessions. It operates as a plugin to the OpenCode platform, injecting structured context into agent sessions and managing lifecycle state through a `.hivemind/` directory tree.

The framework is being used to refactor itself — the governance tools, hooks, and engines that manage AI agent sessions are the same codebase being improved.

## Scope

### In Scope

- **Sector-1 (Runtime)**: `src/` — 164 TypeScript files across tools (14), hooks (6), libs (~60), schemas (~14), CLI, dashboard, types, utils
- **Sector-2 (Assets)**: agents (8), commands (12), workflows (20), skills (33), templates, references, prompts
- **State Layer**: `.hivemind/` directory — brain.json, hierarchy.json, graph (mems, anchors, tasks), sessions, project planning
- **Planning Layer**: `.hivemind/project/planning/` — this directory, SOT for all governance artifacts

### Out of Scope

- Dashboard-v2 sub-project (separate build, Bun/React/Ink — deferred)
- 31 pre-existing sync-assets test failures (deferred, unrelated)
- External integrations (none — plugin is fully offline, sole integration is OpenCode SDK)

## Key Decisions

| # | Decision | Evidence |
|---|----------|----------|
| 1 | Root assets are source of truth; `.opencode/` is mirror/deploy surface | Master plan §9, Decision Lock #1 |
| 2 | 3-RANK problem hierarchy governs all priority: RANK 1 (Context Injection) → RANK 2 (Tools/Mechanism) → RANK 3 (Memory Lifecycle) | Master plan §3 |
| 3 | Wave β (context injection remediation) must complete before any new feature wiring | Master plan §9, Decision Lock #9 |
| 4 | Sector-2 must stabilize FIRST before Sector-1 code changes | User directive, anchor `user-constraint-2026-02-28-hivemind-only` |
| 5 | Only HiveMind-native agents (hivexplorer, hiveplanner, hivemaker, hivehealer, hiveq, hiverd) — no gsd-* agents | User directive, anchor `user-constraint-2026-02-28-hivemind-only` |
| 6 | Planning artifacts reside under `.hivemind/project/planning/` — not in `docs/plans/` | SYSTEM-DIRECTIVES.md, Master plan §9 |
| 7 | `STATE.md` is persistent project-level state and survives compaction boundaries | Master plan §9, Decision Lock #6 |
| 8 | No execution without plan; no plan without research; no research without user confirmation | User corrections across multiple sessions |
| 9 | dist/ and node_modules removed during planning phase to reduce noise | User directive (2026-02-28) |
| 10 | The framework's inability to automate its own brownfield mapping is itself a P1 concern — the codebase analysis done manually should be powered by code-intel engines, hooks, and tools programmatically | User reflection (2026-02-28) |

## Architecture Summary

- **Pattern**: Plugin-based Layered Architecture with CQRS-compliant State Management
- **Layers**: Entry Point → Tools (write) → Hooks (read) → Libs (engine) → Schemas (validation)
- **Context Delivery**: Dual-channel injection — SYSTEM (session-lifecycle hook) + USER (messages-transform hook)
- **State Persistence**: Atomic file I/O to `.hivemind/` via `src/lib/persistence.ts`
- **Dependencies**: 14 production (zod, yaml, web-tree-sitter, remark, proper-lockfile, etc.), Node ≥20, TypeScript 5.3+
- **Tests**: 104 test files, Node.js native test runner via `tsx --test`, SDK boundary enforcement gate

See `codebase/ARCHITECTURE.md` and `codebase/STACK.md` for detailed analysis.
