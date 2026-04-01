---
date: 2026-03-31
agent: hiveq
task: spot-check tool-source-inventory claims against actual source
scope: 5 tools from hivexplorer/tool-source-inventory-2026-03-31.md
status: gaps_found
score: 3/5 fully accurate
---

# Tool Inventory Verification Report

**Source Document:** `.hivemind/activity/agents/hivexplorer/tool-source-inventory-2026-03-31.md`
**Verification Date:** 2026-03-31
**Verification Method:** Direct source file reads, line-by-line field counting, enum value extraction
**Overall Status:** **GAPS_FOUND** — 3/5 tools fully accurate, 2 have field count discrepancies

---

## Spot-Check Results

### 1. `src/tools/doc/tools.ts` (hivemind_doc)

| Claim | Claimed | Verified | Verdict |
|-------|---------|----------|---------|
| LOC | 35 | 35 | ✅ ACCURATE |
| Actions | 5 (`skim, skim_directory, read, chunk, search`) | 5 — exact match | ✅ ACCURATE |
| Field count | 7 | 7 (`action, filePath, dirPath, heading, maxTokens, query, globFilter`) | ✅ ACCURATE |
| Uses tool.schema | YES | YES (`const s = tool.schema` at line 8) | ✅ ACCURATE |

**Verdict: FULLY ACCURATE** — All 4 claims verified against source.

---

### 2. `src/tools/handoff/tools.ts` (hivemind_handoff)

| Claim | Claimed | Verified | Verdict |
|-------|---------|----------|---------|
| LOC | 54 | 54 | ✅ ACCURATE |
| Actions | 6 (`create, read, list, update, validate, close`) | 6 — exact match (line 14) | ✅ ACCURATE |
| Field count | 22 | 22 (`action, id, sourceSessionId, targetSessionId, sourceAgent, targetAgent, trajectoryId, workflowId, taskIds, subtaskIds, scope, constraints, memoryScope, successMetrics, requiredEvidence, summary, nextSteps, evidence, returnContract, evidenceContractId, returnGate, resumeTarget`) | ✅ ACCURATE |
| Uses tool.schema | YES | YES (`tool.schema.enum` at line 14) | ✅ ACCURATE |

**Verdict: FULLY ACCURATE** — All 4 claims verified against source.

---

### 3. `src/tools/hivemind-journal.ts` (hivemind_journal)

| Claim | Claimed | Verified | Verdict |
|-------|---------|----------|---------|
| LOC | 196 | 196 | ✅ ACCURATE |
| eventTypes | 6 (`assistant_output, user_message, tool_call, compaction, trajectory, diagnostic`) | 6 — exact match (lines 27-32 type def, lines 69-76 enum) | ✅ ACCURATE |
| Field count | 4 | 4 (`sessionId, eventType, payload, timestamp` — lines 68-87) | ✅ ACCURATE |
| Uses tool.schema | YES | YES (`tool.schema.string()`, `tool.schema.enum()`, `tool.schema.object()` at lines 68-87) | ✅ ACCURATE |

**Verdict: FULLY ACCURATE** — All 4 claims verified against source.

---

### 4. `src/tools/runtime/tools.ts` (hivemind_runtime_status + hivemind_runtime_command)

| Claim | Claimed | Verified | Verdict |
|-------|---------|----------|---------|
| LOC | 82 | 82 | ✅ ACCURATE |
| Two tools in one file | YES | YES (`createHivemindRuntimeStatusTool` lines 21-35, `createHivemindRuntimeCommandTool` lines 41-82) | ✅ ACCURATE |
| runtime_status fields | 0 | 0 (args: `{}` at line 24) | ✅ ACCURATE |
| runtime_command fields | **16** | **13** top-level fields | ❌ INACCURATE |
| Uses tool.schema | YES | YES (`tool.schema.string()`, `tool.schema.enum()`, etc.) | ✅ ACCURATE |

**Field Count Discrepancy — runtime_command:**

Actual 13 top-level fields:
`command, arguments, userMessage, preferredUserName, language, artifactLanguage, governanceMode, automationLevel, expertLevel, outputStyle, presetId, requestedSettingsGroups, intakeEvidence`

Possible explanation: The inventory may have counted `intakeEvidence` sub-fields separately. The `intakeEvidence` object has 5 sub-fields (`source, questionnaireId, displayLanguage, completedGroups, usedRecommendedPresetGroups`). That would give 12 (without intakeEvidence) + 5 = 17 — still not 16. Alternatively, `requestedSettingsGroups` may have been excluded and sub-fields counted: 11 + 5 = 16. **The counting methodology is inconsistent** — the handoff tool counted only top-level fields, but this tool appears to mix levels.

**Verdict: INACCURATE** — Field count for `hivemind_runtime_command` is 13 (top-level), not 16. Discrepancy of 3.

---

### 5. `src/features/agent-work-contract/tools/create-contract-tool.ts` (hivemind_agent_work_create_contract)

| Claim | Claimed | Verified | Verdict |
|-------|---------|----------|---------|
| LOC | 155 | 155 | ✅ ACCURATE |
| Field count | **14** | **10** top-level fields | ❌ INACCURATE |
| Uses tool.schema | YES | YES (`const s = tool.schema` at line 30) | ✅ ACCURATE |
| Action enum | `create, update` | `create, update` — exact match (line 33) | ✅ ACCURATE |

**Field Count Discrepancy — create-contract-tool:**

Actual 10 top-level fields (lines 32-71):
`action, contractId, sessionId, rawIntent, delegationExportSessionId, responseMode, workflow, chainActions, briefing, anchors`

The inventory claims 14. No consistent counting methodology produces 14:
- Top-level only: 10
- Top-level + all nested leaf fields: ~28+
- Removing object-valued fields (workflow, chainActions, briefing, anchors) and counting only leaf primitives: 6

**Verdict: INACCURATE** — Field count is 10 (top-level), not 14. Discrepancy of 4. The inventory's field count methodology is undefined and inconsistent across tools with nested schemas.

---

## Summary

| Tool | LOC | Actions | Fields | tool.schema | Overall |
|------|-----|---------|--------|-------------|---------|
| doc/tools.ts | ✅ 35 | ✅ 5 | ✅ 7 | ✅ YES | **ACCURATE** |
| handoff/tools.ts | ✅ 54 | ✅ 6 | ✅ 22 | ✅ YES | **ACCURATE** |
| hivemind-journal.ts | ✅ 196 | ✅ 6 eventTypes | ✅ 4 | ✅ YES | **ACCURATE** |
| runtime/tools.ts | ✅ 82 | ✅ 2 tools | ❌ 13≠16 (command) | ✅ YES | **INACCURATE** |
| create-contract-tool.ts | ✅ 155 | ✅ 2 | ❌ 10≠14 | ✅ YES | **INACCURATE** |

### Verification Score: 3/5 tools fully accurate

### Key Findings

1. **LOC counts are 100% accurate** across all 5 tools — exact match in every case.
2. **Action/enum values are 100% accurate** — every enum member matches source exactly.
3. **tool.schema usage is 100% accurate** — all 5 tools correctly use `tool.schema` (Zod).
4. **Field counts are INCONSISTENT for nested schemas** — the inventory counts flat tools correctly (doc, handoff, journal) but overcounts tools with nested objects (runtime_command, create_contract). The counting methodology mixes top-level keys with sub-field enumeration in an undefined way.

### Recommendation

The inventory's "Field Count" column needs a **defined counting methodology**. Two options:

1. **Strict top-level only** — count only the immediate children of `args:{}`. This is how flat tools (doc, handoff, journal) were counted. Under this method: runtime_command = 13, create_contract = 10.
2. **All leaf fields recursively** — count every terminal schema field. Under this method: counts would be much higher for nested tools.

The current inventory mixes both approaches, producing unreliable field counts for tools with nested schemas.
