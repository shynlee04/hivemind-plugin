---
feature: agent-steering-engine
phase: 01-Research-And-Architecture
artifact: CONTEXT
created: 2026-05-09
validated: true
---

# Agent Steering Engine — Phase 01 Context

## Purpose

Phase 01 establishes the technical landscape for building an Agent Steering Engine — a runtime system that conditionally injects role, hierarchy, delegation, and workflow context into OpenCode agent sessions to prevent drift, improve subagent awareness, and enforce governance constraints.

## Pre-Research Assumptions

| ID | Assumption | Status |
|----|-----------|--------|
| A1 | Steering policies are runtime-configurable schemas, not hardcoded agent lists | Validated |
| A2 | All steering code lives in `src/`, NOT in `.opencode/` | Validated — hard constraint |
| A3 | gsd-* agents/skills are developer tooling only, never shipped | Validated — hard constraint |
| A4 | Artifact persistence pitfall is a first-class requirement | Validated — high priority |
| A5 | Phase-based progression with checkpoints is mandatory | Validated |
| A6 | `messages.transform` is the primary injection surface | Validated — online confirmed |
| A7 | Progressive enrichment, not big-bang | Validated |
| A8 | Steering system extends existing hooks, does not replace them | Validated |
| A9 | CQRS boundaries apply — hooks cannot perform durable writes | Validated — architecture constraint |

## Key Stakeholders

1. **OpenCode SDK** (`@opencode-ai/plugin@^1.14.41`) — Provides the hook surfaces (`messages.transform`, `session.compacting`, `system.transform`) that the steering engine must use
2. **Hivemind Harness** (`opencode-harness` npm package) — The runtime composition engine where steering code will live in `src/`
3. **End Users** — Developers using Hivemind-powered OpenCode projects who need agents to stay aligned

## Scope Boundaries

### In Scope (Phase 01)
- Online-validated research of OpenCode SDK hook APIs (signatures, capabilities, constraints)
- Online-validated research of primitive discovery mechanism (agents, skills, commands)
- Online-validated research of YAML frontmatter schemas for each primitive type
- Online-validated research of LLM context window landscape and token budget impacts
- Online-validated research of agent steering best practices across frameworks
- Analysis of current harness injection patterns (local code)

### Out of Scope (Phase 01)
- Schema or policy design (Phase 02)
- Code implementation (Phase 03+)
- Test writing (Phase 03+)
- UI or sidecar work

## Related Artifacts

| Artifact | Path | Purpose |
|----------|------|---------|
| REQUIREMENTS.md | `.hivemind/planning/agent-steering-engine/REQUIREMENTS.md` | 14 requirements, 9 constraints, 9 assumptions |
| STATE.md | `.hivemind/planning/agent-steering-engine/STATE.md` | Phase tracking, risk register, decisions log |
| ROADMAP.md | `.hivemind/planning/agent-steering-engine/ROADMAP.md` | 8-phase roadmap with dependency graph |
| Ideation doc | `.hivemind/planning/ideating/agent-role-mode-steering-2026-05-09.md` | Original raw idea |
| Team-b research | `.hivemind/planning/team-b-references/session-ses_1f2e-*.md` | External team research input |

## Key Technical Context

- **SDK Version:** `@opencode-ai/plugin@^1.14.41`, `@opencode-ai/sdk@^1.14.41`
- **Plugin type:** `Plugin = async (ctx) => { return { hookName: async (input, output) => {} } }`
- **Hook pattern:** All hooks follow `(input, output) => Promise<void>` — mutate output in place
- **CQRS boundary:** Hooks are observation + response-shaping only — no durable writes from hooks
- **Primitive discovery:** OpenCode scans `.opencode/` directories for `.md` files with YAML frontmatter
- **Context windows:** 200K-1M advertised but only 50-65% reliably usable
- **Constraint degradation:** Measurable at ~15 tool calls for Claude agents

## Research Validation Methodology

All findings in this phase were validated against online resources:
- Context7 (opencode library documentation)
- DeepWiki (anomalyco/opencode codebase analysis)
- GitHub issues and source code
- Official Anthropic, OpenAI, Google documentation
- Framework documentation (CrewAI, LangGraph, OpenAI Agents SDK)

Local code was used ONLY for understanding current harness patterns, NOT as source of truth for SDK interfaces.
