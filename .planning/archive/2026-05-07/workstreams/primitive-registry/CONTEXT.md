# CONTEXT: Primitive Registry

**Workstream:** primitive-registry (WS-3)
**Status:** PLANNED
**Parent Doc:** → `.planning/ROADMAP.md`

## Purpose

Build a unified primitive registry for all agents, skills, commands, tools, MCP integrations, and hooks. Enable stacking, chaining, and permission enforcement. Make governance authoritative before runtime automation grows.

## Scope

- Unified registry schema covering all 7 primitive types:
  - `agents.json` — Agent definitions with permissions and skill bindings
  - `skills.json` — Skill metadata, triggers, RICH-8 scores
  - `commands.json` — Command definitions with $ARGUMENTS parsing
  - `tools.json` — Built-in OpenCode tools
  - `mcp-tools.json` — MCP provider tools with permissions
  - `custom-tools.json` — Harness custom tools (src/tools/)
  - `hooks.json` — Event hooks and transform pipelines
- Permission matrix enforcement: agent → tool → skill access rules per lineage
- Cross-primitive validation on compile (config-compiler.ts foundation)
- Stacking and chaining support for primitive composition
- Restart validation integration (validate-restart tool)
- Registry ownership: `.hivemind/registries/` (canonical per Q6 + hivemind-state-architecture)

## Feature Refs

- f-03a — Agent registry with permission enforcement
- f-03b — Skill registry with quality metadata
- f-03c — Tool registry & wiring
- f-03d — MCP tool registry & permissions
- f-03e — Custom tool registry & stacking
- f-03f — Hook registry & feature wiring
- f-04 — Auto-commands engine (consumes command registry)

## Key Design Decisions

| ID | Decision | Status |
|----|----------|--------|
| REGISTRY-01 | Unified primitive registry with all 7 types | ⊘ PARTIAL (individual scanners exist, no unified registry) |
| REGISTRY-02 | Permission matrix with runtime enforcement | ⊘ MISSING |
| REGISTRY-03 | Stacking and chaining support for primitives | ⊘ MISSING |
| REGISTRY-04 | Cross-primitive validation on compile | ⊘ PARTIAL (config-compiler.ts exists) |

## Dependencies

- **hivemind-state-architecture (WS-1, PLANNED)**: Registry directory structure and schema conventions
- **HER-1 (COMPLETE ✅)**: Fixed command refs and validate-restart lay groundwork
- **Blocks:** bootstrap-cli-onboarding (WS-2), auto-commands-workflow-router (WS-4), delegation-revamp (WS-5)

## Priority: HIGH

Governance must be authoritative before runtime automation grows. Current state: individual scanners exist (primitive-scanners.ts, primitive-loader.ts, primitive-registry.ts) but no unified registry with runtime enforcement. Broken command refs (fixed in HER-1) and unclear registry ownership were found in UAT.
