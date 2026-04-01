# HiveMind Tool Source Inventory

**Generated:** 2026-03-31  
**Investigation Scope:** All custom tool files in `src/tools/` and `src/features/*/tools/`

---

## Tool Inventory Table

| Tool Name | File Path | LOC | Actions/Enums | Field Count | Uses tool.schema | Has Feature Layer | Has Tests |
|-----------|-----------|-----|---------------|-------------|------------------|-------------------|-----------|
| hivemind_doc | src/tools/doc/tools.ts | 35 | action: `skim, skim_directory, read, chunk, search` | 7 | YES | YES (doc-intelligence) | NO |
| hivemind_task | src/tools/task/tools.ts | 42 | action: `create, list, get, activate, rotate, verify, complete`<br>kind: `task, subtask` | 9 | YES | YES (workflow) | NO |
| hivemind_trajectory | src/tools/trajectory/tools.ts | 49 | action: `inspect, traverse, attach, checkpoint, event, close`<br>lineage: `hivefiver, hiveminder`<br>purposeClass: `discovery, brainstorming, research, planning, implementation, gatekeeping, tdd, course-correction`<br>kind: `summary, handoff, evidence, transition, note` | 13 | YES | YES (trajectory) | NO |
| hivemind_handoff | src/tools/handoff/tools.ts | 54 | action: `create, read, list, update, validate, close` | 22 | YES | YES (handoff) | NO |
| hivemind_runtime_status | src/tools/runtime/tools.ts | 82 | (none) | 0 | YES | YES (runtime-observability) | NO |
| hivemind_runtime_command | src/tools/runtime/tools.ts | 82 | presetId: `guided-onboarding`<br>requestedSettingsGroups: `identity-language, expertise-style, governance-automation`<br>intakeEvidence.source: `question-tool, cli-flags, runtime-tool, preset`<br>questionnaireId: `bootstrap-profile-v1, settings-profile-v1` | 13 | YES | YES (runtime-observability) | NO |
| hivemind_journal | src/tools/hivemind-journal.ts | 196 | eventType: `assistant_output, user_message, tool_call, compaction, trajectory, diagnostic` | 4 | YES | YES (event-tracker) | YES |
| hivemind_hm_init | src/tools/hivefiver-init/tools.ts | 78 | mode: `greenfield, brownfield, auto` | 2 | YES | NO | NO |
| hivemind_hm_doctor | src/tools/hivefiver-doctor/tools.ts | 109 | scope: `all, skills, agents, config, paths` | 2 | YES | NO | NO |
| hivemind_hm_setting | src/tools/hivefiver-setting/tools.ts | 220 | group: `language, expertise, governance, operation-mode, all`<br>renderMode: `json, tui` | 6 | YES | NO | NO |
| hivemind_agent_work_create_contract | src/features/agent-work-contract/tools/create-contract-tool.ts | 155 | action: `create, update`<br>responseMode: `broad-search-execute, interactive-qa, deep-research`<br>workflow.tasks.status: `pending, active, delegated, verifying, complete`<br>delegationMode: `parallel, sequential, handoff`<br>chainActions: `export-workflow, next-task, close, export-contract, archive, export-messages, handoff-packet, launch-context-agent, export-summary`<br>anchors.kind: `workflow-shift, planning-shift, stage-shift, user-redirect` | 10 | YES | YES (feature IS agent-work-contract) | YES |
| hivemind_agent_work_export_contract | src/features/agent-work-contract/tools/export-contract-tool.ts | 67 | format: `contract, summary` | 2 | YES | YES (feature IS agent-work-contract) | YES |
| hivemind_agent_work_classify_intent | src/features/agent-work-contract/tools/classify-intent-tool.ts | 50 | (none) | 1 | YES | YES (feature IS agent-work-contract) | YES |

---

## Summary Statistics

- **Total Tool Files:** 13
- **Total LOC:** 1,087
- **Tools using tool.schema:** 13 (100%)
- **Tools with feature layer:** 10 (77%)
- **Tools with tests:** 4 (31%)

---

## Tool Catalog Reference (src/tools/index.ts)

The following tools are registered in the catalog:

1. `hivemind_doc` → doc tools.ts
2. `hivemind_task` → task/tools.ts
3. `hivemind_trajectory` → trajectory/tools.ts
4. `hivemind_handoff` → handoff/tools.ts
5. `hivemind_runtime_status` → runtime/tools.ts
6. `hivemind_runtime_command` → runtime/tools.ts
7. `hivemind_agent_work_create_contract` → create-contract-tool.ts
8. `hivemind_agent_work_export_contract` → export-contract-tool.ts
9. `hivemind_journal` → hivemind-journal.ts
10. `hivemind_hm_init` → hivefiver-init/tools.ts
11. `hivemind_hm_doctor` → hivefiver-doctor/tools.ts
12. `hivemind_hm_setting` → hivefiver-setting/tools.ts

**Note:** The classify-intent tool is not in the main catalog but exists in the feature layer.

---

## Detailed Findings

### Feature Layer Tools (imports from src/features/)

| Tool File | Imports From |
|-----------|-------------|
| doc/tools.ts | ../../features/doc-intelligence/doc.js |
| task/tools.ts | ../../features/workflow/task.js |
| trajectory/tools.ts | ../../features/trajectory/trajectory.js |
| handoff/tools.ts | ../../features/handoff/index.js |
| runtime/tools.ts | ../../features/runtime-observability/status.js |
| hivemind-journal.ts | ../features/event-tracker/markdown-writer.js |
| create-contract-tool.ts | (feature IS agent-work-contract) |
| export-contract-tool.ts | (feature IS agent-work-contract) |
| classify-intent-tool.ts | (feature IS agent-work-contract) |

### Tools WITHOUT Feature Layer

| Tool File | Notes |
|-----------|-------|
| hivefiver-init/tools.ts | Placeholder - detects project state |
| hivefiver-doctor/tools.ts | Placeholder - diagnostics shell |
| hivefiver-setting/tools.ts | Uses shared/config-groups.js |

### Test Coverage

| Tool | Test File Location |
|------|-------------------|
| hivemind_journal | src/tools/hivemind-journal.test.ts |
| create-contract-tool | src/features/agent-work-contract/tools/create-contract-tool.test.ts |
| export-contract-tool | src/features/agent-work-contract/tools/export-contract-tool.test.ts |
| classify-intent-tool | src/features/agent-work-contract/tools/classify-intent-tool.test.ts |