# Node 5b: Journal and Contract Tools — Structural Anomalies

**Date:** 2026-03-31
**Scope:** Two structural anomalies in HiveMind tool architecture
**Agent:** hivexplorer (Terminal Repository Investigator)
**Status:** Complete

---

## FINDING 1: hivemind_journal — Flat File, No Barrel Export, Direct Registration

**Anomaly Type:** Registration bypass of barrel export pattern

### Evidence

| Aspect | Detail | File:Line |
|--------|--------|-----------|
| File location | Flat file at `src/tools/hivemind-journal.ts` (not in subdirectory) | `src/tools/hivemind-journal.ts:1` |
| LOC count | 196 lines | `wc -l` output |
| Barrel export | **NOT exported** from `src/tools/index.ts` | `src/tools/index.ts:1-137` (no import/export of hivemind-journal) |
| Direct import | Imported directly in plugin | `src/plugin/opencode-plugin.ts:33` |
| Registration | Registered directly in plugin tool map | `src/plugin/opencode-plugin.ts:131` |
| Catalog entry | Listed in `agentToolCatalog` | `src/tools/index.ts:102-109` |

### Event Type Enum Values

```typescript
// src/tools/hivemind-journal.ts:26-32
type JournalEventType =
  | 'assistant_output'
  | 'user_message'
  | 'tool_call'
  | 'compaction'
  | 'trajectory'
  | 'diagnostic'
```

### Schema Fields

```typescript
// src/tools/hivemind-journal.ts:67-87
{
  sessionId: string (required),
  eventType: enum['assistant_output', 'user_message', 'tool_call', 'compaction', 'trajectory', 'diagnostic'],
  payload: object {
    actor?: string,
    title?: string,
    summary?: string,
    details?: string,
    level?: string,      // for diagnostic events
    source?: string,     // for diagnostic events
    message?: string,    // for diagnostic events
  },
  timestamp: string (required)
}
```

### Registration Anomaly Analysis

The journal tool follows a **different registration pattern** than other tools:

1. **Canonical pattern** (trajectory, task, handoff, runtime, doc): Tools live in subdirectories with barrel exports (`src/tools/trajectory/index.ts`, `src/tools/task/index.ts`, etc.)
2. **Journal pattern**: Flat file directly imported by plugin, bypassing the barrel export system
3. **Catalog registration**: Despite no barrel export, it's listed in `agentToolCatalog` at `src/tools/index.ts:102-109` with `contractFile: 'src/tools/hivemind-journal.ts'`

**Why this works:** The plugin directly imports `createHivemindJournalTool` from `'../tools/hivemind-journal.js'` at line 33, bypassing the barrel export. The tool still functions because the import path is correct, but this breaks the architectural convention.

---

## FINDING 2: create-contract-tool — Feature-Local Tool with Complex Schema

**Anomaly Type:** Tool definition lives in `src/features/` instead of `src/tools/`

### Evidence

| Aspect | Detail | File:Line |
|--------|--------|-----------|
| File location | `src/features/agent-work-contract/tools/create-contract-tool.ts` | `src/features/agent-work-contract/tools/create-contract-tool.ts:1` |
| LOC count | 155 lines | `wc -l` output |
| Barrel export | Exported from feature-local barrel | `src/features/agent-work-contract/tools/index.ts:8-11` |
| Plugin import | Imported from feature path | `src/plugin/opencode-plugin.ts:21-23` |
| Catalog entry | Listed in `agentToolCatalog` | `src/tools/index.ts:84-91` |

### Action Enum Values

```typescript
// src/features/agent-work-contract/tools/create-contract-tool.ts:33
action: enum['create', 'update']
```

### Schema Fields

```typescript
// src/features/agent-work-contract/tools/create-contract-tool.ts:32-71
{
  action: enum['create', 'update'],
  contractId?: string,
  sessionId?: string,
  rawIntent?: string,
  delegationExportSessionId?: string,
  responseMode?: enum['broad-search-execute', 'interactive-qa', 'deep-research'],
  workflow?: {
    planningPath?: string,
    phase?: string,
    outlineRef?: string,
    tasks: [{
      id: string,
      title: string,
      status: enum['pending', 'active', 'delegated', 'verifying', 'complete'],
      parentTaskId?: string,
      dependencyIds?: string[],
      delegationMode?: enum['parallel', 'sequential', 'handoff'],
      delegationSessionId?: string,
      evidenceRefs?: string[],
    }],
  },
  chainActions?: {
    onTaskComplete: enum['export-workflow', 'next-task', 'close'],
    onWorkflowEnd: enum['export-contract', 'archive'],
    onDelegation: enum['export-messages', 'handoff-packet'],
    onCompaction80: enum['launch-context-agent', 'export-summary'],
  },
  briefing?: {
    summary: string,
    workflowState: string,
    followUp: string[],
  },
  anchors?: [{
    timestamp: string,
    kind: enum['workflow-shift', 'planning-shift', 'stage-shift', 'user-redirect'],
    description: string,
    snapshotRef?: string,
  }],
}
```

### Supporting Files

The create-contract tool has a **complex supporting architecture** that justifies its feature-local placement:

| File | Purpose | LOC |
|------|---------|-----|
| `create-contract-tool.schema.ts` | Schema types and constants | 71 |
| `create-contract-tool.helpers.ts` | Helper functions | - |
| `create-contract-tool.normalizers.ts` | Input normalization | - |
| `create-contract-tool.operations.ts` | Business logic (create/update) | - |
| `create-contract-tool.test.ts` | Unit tests | - |

---

## FINDING 3: export-contract-tool — Minimal Export Tool in Features

**Anomaly Type:** Tool definition lives in `src/features/` instead of `src/tools/`

### Evidence

| Aspect | Detail | File:Line |
|--------|--------|-----------|
| File location | `src/features/agent-work-contract/tools/export-contract-tool.ts` | `src/features/agent-work-contract/tools/export-contract-tool.ts:1` |
| LOC count | 67 lines | `wc -l` output |
| Barrel export | Exported from feature-local barrel | `src/features/agent-work-contract/tools/index.ts:17-19` |
| Plugin import | Imported from feature path | `src/plugin/opencode-plugin.ts:21-23` |
| Catalog entry | Listed in `agentToolCatalog` | `src/tools/index.ts:93-100` |

### Action Enum Values

```typescript
// src/features/agent-work-contract/tools/export-contract-tool.ts:36
format: enum['contract', 'summary']
```

### Schema Fields

```typescript
// src/features/agent-work-contract/tools/export-contract-tool.ts:34-37
{
  contractId: string.min(1),
  format: enum['contract', 'summary']
}
```

### Tool ID Constant

```typescript
// src/features/agent-work-contract/tools/export-contract-tool.ts:9
export const HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID = 'hivemind_agent_work_export_contract'
```

---

## FINDING 4: Architectural Differences — Why These Tools Are Different

### Canonical Trajectory Pattern (Reference)

The trajectory tool at `src/tools/trajectory/tools.ts` (49 LOC) follows the **canonical pattern**:

1. **Location:** `src/tools/trajectory/` subdirectory
2. **Barrel export:** `src/tools/trajectory/index.ts` exports `tools.ts` and `types.ts`
3. **Simple structure:** Single tool file + types file
4. **Plugin import:** Via barrel: `from '../tools/trajectory/index.js'`
5. **Schema:** Inline in tool file, simple enum + optional strings
6. **Execution:** Delegates to feature logic: `executeHivemindTrajectoryAction()` from `src/features/trajectory/`

### Journal Tool Pattern (Anomaly #1)

| Aspect | Canonical | Journal | Difference |
|--------|-----------|---------|------------|
| Location | `src/tools/{name}/` | `src/tools/hivemind-journal.ts` | Flat file, no subdirectory |
| Barrel export | Yes (`index.ts`) | **No** | Direct import bypass |
| Plugin import | Via barrel | Direct file import | Breaks convention |
| Supporting files | In subdirectory | None | Self-contained |
| Business logic | Delegated to features | **Embedded** | Imports from `src/features/event-tracker/` |

**Root cause:** The journal tool is self-contained and small (196 LOC), so it was placed as a flat file. However, it imports business logic from `src/features/event-tracker/` (lines 19-20), creating a **cross-cutting dependency** that violates the CQRS boundary.

### Contract Tools Pattern (Anomaly #2)

| Aspect | Canonical | Contract Tools | Difference |
|--------|-----------|----------------|------------|
| Location | `src/tools/{name}/` | `src/features/agent-work-contract/tools/` | Feature-local |
| Barrel export | `src/tools/{name}/index.ts` | Feature-local `index.ts` | Different barrel |
| Plugin import | Via `src/tools/` barrel | Via `src/features/` barrel | Different import path |
| Supporting files | Minimal | **Extensive** (schema, helpers, normalizers, operations) | Complex feature module |
| Business logic | Delegated to features | **Co-located** | Tool + logic in same feature |

**Root cause:** The contract tools are **tightly coupled** to the `agent-work-contract` feature module. They share:
- Schema definitions (`../schema/index.js`)
- Contract store (`../engine/contract-store.js`)
- Compaction preservation (`../hooks/compaction-preservation.js`)
- Normalizers and operations (co-located files)

This co-location makes sense for **feature cohesion** but breaks the **tool registry convention** where all tools should live in `src/tools/`.

### Structural Comparison Summary

```
Canonical Pattern (trajectory):
  src/tools/trajectory/
  ├── index.ts          (barrel export)
  ├── tools.ts          (tool definition)
  └── types.ts          (type definitions)
  src/features/trajectory/
  └── trajectory.ts     (business logic)

Journal Pattern (anomaly):
  src/tools/hivemind-journal.ts  (flat file, no barrel)
  src/features/event-tracker/    (business logic imported)
  ├── markdown-writer.js
  └── paths.js

Contract Pattern (anomaly):
  src/features/agent-work-contract/tools/
  ├── index.ts                   (feature-local barrel)
  ├── create-contract-tool.ts    (tool definition)
  ├── create-contract-tool.schema.ts
  ├── create-contract-tool.helpers.ts
  ├── create-contract-tool.normalizers.ts
  ├── create-contract-tool.operations.ts
  └── export-contract-tool.ts    (tool definition)
```

### Why This Matters

1. **Discoverability:** Tools in `src/tools/` are expected to be the authoritative tool registry. Contract tools hidden in `src/features/` break this expectation.
2. **Consistency:** The journal tool's flat file pattern is unique among all 12 tools in the catalog.
3. **Maintenance:** Contract tools have 5+ supporting files co-located with the tool, making them harder to find for developers expecting tools in `src/tools/`.
4. **Registration:** Both anomalies are registered in the plugin directly, bypassing the barrel export system that other tools use.

---

## Git Context

**Commit history for investigated files:**

| Commit | Message | Files |
|--------|---------|-------|
| `33df100f` | feat(session-journal): wire markdown-writer | `hivemind-journal.ts` |
| `7183335f` | Generated numerous Hivemind session artifacts | `hivemind-journal.ts` |
| `dd3cc510` | fix(clusters 1-3): unblock build | `hivemind-journal.ts` |
| `c95b12a1` | refactor: decompose 9 oversized files | `hivemind-journal.ts` |
| `0f029dc0` | feat: Introduce workflow continuity, agent work contracts | `create-contract-tool.ts`, `export-contract-tool.ts` |
| `a3a41889` | feat: Introduce agent work contract tools | `create-contract-tool.ts`, `export-contract-tool.ts` |

**Investigation conducted at:** HEAD of worktree `product-detox` on 2026-03-31

---

## Summary Table

| Tool | LOC | Location | Barrel Export | Plugin Import | Anomaly |
|------|-----|----------|---------------|---------------|---------|
| `hivemind_journal` | 196 | `src/tools/hivemind-journal.ts` | **No** | Direct file | Flat file, no barrel |
| `create_contract` | 155 | `src/features/.../tools/` | Feature-local | Feature path | Wrong directory |
| `export_contract` | 67 | `src/features/.../tools/` | Feature-local | Feature path | Wrong directory |
| `trajectory` (ref) | 49 | `src/tools/trajectory/` | Yes | Via barrel | Canonical pattern |
