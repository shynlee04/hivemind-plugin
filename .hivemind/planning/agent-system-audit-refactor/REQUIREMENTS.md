---
feature: agent-system-audit-refactor
category: master-requirements
updated: 2026-05-10
---

# REQUIREMENTS — Agent System Audit & Refactor

## R1: Permission Compliance
- R1.1: All `deny` permissions on L2 agents changed to `ask` (not `allow`) — maintains safety while enabling functionality
- R1.2: Permission keys must map to OpenCode-recognized keys (read, edit, glob, grep, list, bash, task, external_directory, todowrite, question, webfetch, websearch, lsp, doom_loop, skill)
- R1.3: Hivemind custom tool permissions (delegate-task, delegation-status, etc.) remain as-is — OpenCode may not enforce them
- R1.4: Catch-all `*` patterns placed FIRST (last match wins in OpenCode)

## R2: YAML Schema Compliance
- R2.1: No agent uses deprecated `tools` boolean map → migrate to `permission`
- R2.2: No agent uses deprecated `maxSteps` → migrate to `steps`
- R2.3: All agents have required `description` field
- R2.4: All agents have valid `mode` value (primary/subagent/all)

## R3: Naming Convention Redesign
- R3.1: Clear, unambiguous naming that supports harness routing
- R3.2: Lineage (hm/hf) distinction mechanically meaningful
- R3.3: Level (L0-L3) reflects actual delegation capability
- R3.4: No conflicts or confusion between agent names

## R4: Skill-Agent Binding
- R4.1: All shipped skills have `consumed-by` metadata
- R4.2: Contract tables reference only existing agents
- R4.3: No orphan skills (skills without agent consumers)
- R4.4: Skill name/frontmatter layer mismatches resolved

## R5: Harness Wiring
- R5.1: Intake gate (`PURPOSE_TO_ROUTING_TARGET`) uses verified agent names
- R5.2: Delegation rules enforced mechanically (L0→L1→L2→L3), not by convention alone
- R5.3: Agent work contracts support the classification system
- R5.4: Permission enforcement for Hivemind custom tools is on the harness's own tool implementations
