# Agent Work Tool Verification Report

**Investigated at:** git commit `85f8cbe75d580e720854bf796742602ae4b13c31`  
**Verification Date:** 2026-03-31  
**Scope:** `hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`, `hivemind_agent_work_classify_intent`

---

## Registration Status

| Tool ID | `src/tools/index.ts` | `opencode-plugin.ts` | `tool-governance.ts` | Status |
|---------|---------------------|---------------------|---------------------|--------|
| `hivemind_agent_work_create_contract` | ✅ Line 84 | ✅ Line 125 | ✅ Line 8 | **REGISTERED** |
| `hivemind_agent_work_export_contract` | ✅ Line 93 | ✅ Line 126 | ✅ Line 9 | **REGISTERED** |
| `hivemind_agent_work_classify_intent` | ❌ NOT in catalog | ❌ NOT in plugin | ❌ NOT in managed | **INTENTIONALLY FEATURE-LOCAL** |

**Evidence:**

- `src/tools/index.ts:84-91` — `hivemind_agent_work_create_contract` in `agentToolCatalog` with `stateAuthority: 'workflow'`
- `src/tools/index.ts:93-100` — `hivemind_agent_work_export_contract` in `agentToolCatalog`
- `src/plugin/opencode-plugin.ts:125` — `hivemind_agent_work_create_contract: createAgentWorkCreateContractTool(directory)`
- `src/plugin/opencode-plugin.ts:126` — `hivemind_agent_work_export_contract: createAgentWorkExportContractTool(directory)`
- `src/hooks/runtime-loader/tool-governance.ts:8-9` — Both in `HIVEMIND_MANAGED_TOOLS` set

---

## Execute Implementation

| Tool | File | Lines | Async | Uses `tool.schema` | Context Fields |
|------|------|-------|-------|-------------------|----------------|
| `create_contract` | `src/features/agent-work-contract/tools/create-contract-tool.ts` | 86-149 | ✅ Yes | ✅ Zod | `sessionID`, `agent`, `directory`, `worktree` |
| `export_contract` | `src/features/agent-work-contract/tools/export-contract-tool.ts` | 38-65 | ✅ Yes | ✅ Zod | `sessionID`, `agent`, `directory`, `worktree` |

**Evidence:**

- `create-contract-tool.ts:86-149` — Full async execute with try/catch, args parsing, validation, and contract creation/update
- `export-contract-tool.ts:38-65` — Full async execute with ContractStore lookup, schema validation, and payload formatting
- Both tools use `renderToolResult()` helper from `src/shared/tool-helpers.js`
- Both tools use `error()`/`success()` response patterns from `src/shared/tool-response.js`

---

## Filesystem Write Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Contract JSON files exist | ✅ YES | Found in `.hivemind/agent-work-contract/` |
| Real data persisted | ✅ YES | Live contracts from session `ses_2c7884d59ffe9ShT49MSyBvft2` |

**Evidence:**

Actual contract files found:
```
.hivemind/agent-work-contract/awc-ses_2c7884d59ffe9ShT49MSyBvft2-1774780313102-140983b2-f7ba-496c-90f4-a9436aefdc97.json
.hivemind/agent-work-contract/awc-ses_2c7884d59ffe9ShT49MSyBvft2-1774775407480-1ceea3e3-6662-4963-af3c-1263f22c5d33.json
```

Sample contract structure (verified from actual file):
```json
{
  "contractId": "awc-ses_2c7884d59ffe9ShT49MSyBvft2-1774780313102-140983b2-f7ba-496c-90f4-a9436aefdc97",
  "sessionId": "ses_2c7884d59ffe9ShT49MSyBvft2",
  "userIntent": { "raw": "...", "confidence": 0.333..., "purposeClass": "project-driven" },
  "responseMode": "broad-search-execute",
  "workflow": { "phase": "hm-settings-dashboard-proof", "tasks": [...] },
  "chainActions": { "onTaskComplete": "next-task", "onWorkflowEnd": "export-contract", ... },
  "briefing": { "summary": "...", "workflowState": "...", "followUp": [...] },
  "anchors": [...]
}
```

Contract Store writes to: `{worktree}/.hivemind/agent-work-contract/{contractId}.json`

---

## Test Coverage

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `src/features/agent-work-contract/tools/create-contract-tool.test.ts` | 6 | create, update, validation, error handling |
| `src/features/agent-work-contract/tools/export-contract-tool.test.ts` | 4 | export with format=contract/summary |
| `src/features/agent-work-contract/tools/classify-intent-tool.test.ts` | 2 | feature-local verification |
| `tests/runtime-tools.test.ts` | 1 | Runtime synchronization + classify-intent stays feature-local |

**Evidence:**

- `create-contract-tool.test.ts:72-137` — Full integration test: validates args, asks permission, persists via context worktree
- `create-contract-tool.test.ts:54-70` — ID collision tests explicitly verify classify-intent NOT in managed/catalog
- `runtime-tools.test.ts:103-149` — Integration test verifying create/export ARE in plugin, managed, and catalog; classify-intent is NOT
- `export-contract-tool.test.ts` — Tests format='contract' and format='summary' export paths

---

## Workflow Integration

| Component | Uses Agent-Work Contracts? | Evidence |
|-----------|---------------------------|----------|
| `src/core/workflow-management/` | ❌ NO | Own独立的workflow-types, workflow-authority, task-lifecycle |
| `src/features/agent-work-contract/` | ✅ YES (IS the authority) | IS the contract management feature itself |

**Note:** The `agent-work-contract` feature is a parallel orchestration system. It does not appear to be directly integrated into `workflow-management/` core. The workflow-management layer has its own task lifecycle and authority system. Agent-work contracts serve as a session-bound workflow tracking layer for the orchestrator.

---

## classify-intent Status

| Aspect | Status | Evidence |
|--------|--------|----------|
| Registered in plugin | ❌ NO | `src/plugin/opencode-plugin.ts` — NOT present |
| In HIVEMIND_MANAGED_TOOLS | ❌ NO | `tool-governance.ts:4-17` — NOT present |
| In agentToolCatalog | ❌ NO | `src/tools/index.ts:28-137` — NOT present |
| Has tests | ✅ YES | `classify-intent-tool.test.ts` — 2 tests |
| Exists in feature | ✅ YES | `src/features/agent-work-contract/tools/classify-intent-tool.ts` |

**This is INTENTIONAL, not a bug.**

- `runtime-tools.test.ts:128-133` — Explicitly tests that classify-intent is NOT in any registration surface
- The tool is an internal engine used by `create-contract` to classify raw intent into purposeClass/responseMode
- `create-contract-tool.ts:99` — Calls `normalizeResponseMode()` which internally classifies intent

Evidence from test:
```typescript
// runtime-tools.test.ts:128-133
assert.equal(pluginToolIds.includes(agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
assert.equal(HIVEMIND_MANAGED_TOOLS.has(agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
assert.equal(agentToolCatalog.some((entry) => entry.id === agentWorkContractTools.HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
```

---

## Verdict: **WORKING**

### Summary

| Component | Status |
|-----------|--------|
| `hivemind_agent_work_create_contract` | ✅ FULLY FUNCTIONAL |
| `hivemind_agent_work_export_contract` | ✅ FULLY FUNCTIONAL |
| `hivemind_agent_work_classify_intent` | ✅ WORKS (internally, intentionally feature-local) |
| Contract persistence (filesystem) | ✅ VERIFIED — real JSON files exist |
| Test coverage | ✅ 13 tests across 4 test files |
| Runtime registration | ✅ Both create/export registered and wired |

### Findings

1. **Both create and export tools are properly registered** in all three registration surfaces (tools/index.ts, opencode-plugin.ts, tool-governance.ts)

2. **Both tools have complete execute implementations** with proper async patterns, Zod validation, error handling, and context usage

3. **Real contract data exists on disk** — multiple contract JSON files found in `.hivemind/agent-work-contract/` with legitimate workflow data (tasks, phases, briefings, anchors)

4. **Tests confirm correct behavior** — 13 tests covering create, update, export, validation, error cases, and registration verification

5. **classify-intent is intentionally not registered** — This is confirmed by explicit tests showing it stays feature-local. It is an internal engine component used by create-contract to classify intent, not a standalone agent tool

### No Issues Found

The agent-work contract tool chain (create + export) is **fully operational** end-to-end.

---

## Evidence Files Referenced

| File | Line(s) | Relevance |
|------|---------|----------|
| `src/tools/index.ts` | 84-100 | Catalog registration |
| `src/plugin/opencode-plugin.ts` | 20-23, 125-126 | Plugin wiring |
| `src/hooks/runtime-loader/tool-governance.ts` | 4-17 | Managed tools set |
| `src/features/agent-work-contract/tools/create-contract-tool.ts` | 86-149 | Execute implementation |
| `src/features/agent-work-contract/tools/export-contract-tool.ts` | 38-65 | Execute implementation |
| `src/features/agent-work-contract/tools/create-contract-tool.test.ts` | 54-290 | 6 unit tests |
| `tests/runtime-tools.test.ts` | 103-149 | Runtime synchronization test |
| `.hivemind/agent-work-contract/awc-ses_2c7884d59ffe9ShT49MSyBvft2-1774780313102-140983b2-f7ba-496c-90f4-a9436aefdc97.json` | 1-90 | Real persisted contract |
