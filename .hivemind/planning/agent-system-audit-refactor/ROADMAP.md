---
feature: agent-system-audit-refactor
status: planning
created: 2026-05-10
lineages: [hm, hf]
levels: [L0, L1, L2, L3]
dependencies: []
---

# ROADMAP — Agent System Audit & Refactor

## Master Goal

Correct and harmonize the entire agent system (hm-* and hf-*, all levels L0-L3) to:
1. Comply with OpenCode SDK agent definition standards
2. Fix broken naming conventions that cause confusion and lack granularity
3. Wire agent profiles into harness runtime for mechanical enforcement of delegation rules
4. Bind skills to agents with validated contracts
5. Ensure all custom fields and tools are properly registered in the harness lifecycle

## Phase Breakdown

| Phase | Name | Scope | Depends On | Status |
|-------|------|-------|------------|--------|
| 01 | PERMISSION-FIX | Fix deny→ask, validate permission keys against OpenCode SDK | None | pending |
| 02 | YAML-COMPLIANCE | Fix deprecated fields (tools→permission, maxSteps→steps), remove dead fields, validate all agents against AgentSchema | 01 | pending |
| 03 | NAMING-REDESIGN | Redesign hm-/hf-/l0-l3 naming conventions with clear granularity, lineage rules, and delegation hierarchy | 02 | pending |
| 04 | SKILL-BINDINGS | Fill consumed-by metadata, fix contract tables, bind skills to correct agent categories | 03 | pending |
| 05 | HARNESS-WIRING | Wire agent routing, delegation enforcement, and permission controls into src/ code; ensure runtime mechanical enforcement | 04 | pending |

## State

See [STATE.md](STATE.md) for current inventory and baseline metrics.

## Key Constraints

- All changes must validate against OpenCode SDK agent.ts source (anomalyco/opencode)
- Custom fields (depth, lineage, domain, skills, instruction) are informational only — OpenCode absorbs them into `options`
- Hivemind custom tools (delegate-task, delegation-status, etc.) are NOT OpenCode-native — their permissions may not be enforced by OpenCode runtime
- Changes to `.opencode/agents/` in this repo are dev-environment artifacts; the harness code in `src/` is what ships to end users
- Naming conventions must support the harness's intake gate routing (`src/routing/session-entry/intake-gate.ts`)
