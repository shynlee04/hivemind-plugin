---
title: "Tools Layer Inventory — 2026-03-31"
agent: hivexplorer
date: 2026-03-31
scope: src/tools/
git_commit: 7da1d535
status: complete
---

# Tools Layer Inventory — 2026-03-31

**Investigated at commit:** `7da1d535` (2026-03-30)
**Uncommitted changes:** `M src/tools/hivefiver-setting/{dashboard,index,render,spec-builder,types}.ts`, `D src/tools/AGENTS.md`
**Total files:** 32 (30 source + 2 test)
**Total LOC:** 3,951 (including tests; 3,296 source-only)

---

## Tool Registry (src/tools/index.ts)

File: `src/tools/index.ts` (137 lines)

The barrel file re-exports all tool subdirectories and defines the `agentToolCatalog` array (lines 28–137) with 12 registered tool entries:

| # | Tool ID | contractFile | stateAuthority | workflowPhase |
|---|---------|-------------|----------------|---------------|
| 1 | `hivemind_doc` | `src/tools/doc/tools.ts` | plugin-control-plane | doc-intelligence |
| 2 | `hivemind_task` | `src/tools/task/tools.ts` | workflow | tool-execution |
| 3 | `hivemind_trajectory` | `src/tools/trajectory/tools.ts` | trajectory | trajectory-attachment |
| 4 | `hivemind_handoff` | `src/tools/handoff/tools.ts` | delegation | recovery-checkpoint |
| 5 | `hivemind_runtime_status` | `src/tools/runtime/tools.ts` | plugin-control-plane | runtime-inspection |
| 6 | `hivemind_runtime_command` | `src/tools/runtime/tools.ts` | plugin-control-plane | runtime-command |
| 7 | `hivemind_agent_work_create_contract` | `src/features/agent-work-contract/tools/create-contract-tool.ts` | workflow | agent-work-contract |
| 8 | `hivemind_agent_work_export_contract` | `src/features/agent-work-contract/tools/export-contract-tool.ts` | workflow | agent-work-contract |
| 9 | `hivemind_journal` | `src/tools/hivemind-journal.ts` | plugin-control-plane | session-journal |
| 10 | `hivemind_hm_init` | `src/tools/hivefiver-init/tools.ts` | plugin-control-plane | bootstrap |
| 11 | `hivemind_hm_doctor` | `src/tools/hivefiver-doctor/tools.ts` | plugin-control-plane | diagnostics |
| 12 | `hivemind_hm_setting` | `src/tools/hivefiver-setting/tools.ts` | plugin-control-plane | configuration |

**Note:** Entries #7 and #8 point to `src/features/agent-work-contract/tools/` — NOT under `src/tools/`. They are registered in the catalog but live in the features layer.

---

## Per-Tool Breakdown

### hivemind_trajectory

- **Files:**
  - `src/tools/trajectory/index.ts` — 2 LOC (barrel re-export)
  - `src/tools/trajectory/tools.ts` — 49 LOC (tool definition)
  - `src/tools/trajectory/types.ts` — 35 LOC (type + pressure contracts)
- **Actions:** `inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close` (line 16, `tools.ts`)
- **Zod schemas:** `tool.schema.enum` for action (6 values), lineage (2), purposeClass (8), kind (5) — all inline in `tools.ts` lines 16–31
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../features/trajectory/trajectory.js` — `executeHivemindTrajectoryAction` (line 3)
  - `../../shared/tool-response.js` — `error`, `success` (line 4)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 5)
  - `./types.js` — `HivemindTrajectoryToolArgs` (line 6)
  - `../../shared/pressure-contract.js` — types + `getRuntimePressureContract` (types.ts lines 1–2)
- **Calls into:** `features/trajectory/trajectory.js`
- **Status:** **active** — registered in catalog, delegates to feature layer

### hivemind_task

- **Files:**
  - `src/tools/task/index.ts` — 2 LOC (barrel re-export)
  - `src/tools/task/tools.ts` — 42 LOC (tool definition)
  - `src/tools/task/types.ts` — 33 LOC (type + pressure contracts)
- **Actions:** `create`, `list`, `get`, `activate`, `rotate`, `verify`, `complete` (line 16, `tools.ts`)
- **Zod schemas:** `tool.schema.enum` for action (7 values), kind (2) — inline in `tools.ts` lines 16–24
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../features/workflow/task.js` — `executeHivemindTaskAction` (line 3)
  - `../../shared/tool-response.js` — `error`, `success` (line 4)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 5)
  - `./types.js` — `HivemindTaskToolArgs` (line 6)
  - `../../shared/pressure-contract.js` — types + `getRuntimePressureContract` (types.ts lines 1–2)
- **Calls into:** `features/workflow/task.js`
- **Status:** **active** — registered in catalog, delegates to feature layer

### hivemind_handoff

- **Files:**
  - `src/tools/handoff/index.ts` — 2 LOC (barrel re-export)
  - `src/tools/handoff/tools.ts` — 54 LOC (tool definition)
  - `src/tools/handoff/types.ts` — 118 LOC (decomposed interfaces + pressure contracts)
- **Actions:** `create`, `read`, `list`, `update`, `validate`, `close` (line 14, `tools.ts`)
- **Zod schemas:** `tool.schema.enum` for action (6 values) — inline in `tools.ts` line 14; all other args are `tool.schema.string().optional()` (lines 15–35)
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../features/handoff/index.js` — `executeHivemindHandoffAction` (line 3)
  - `../../shared/tool-response.js` — `error`, `success` (line 4)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 5)
  - `./types.js` — `HivemindHandoffToolArgs` (line 6)
  - `../../shared/pressure-contract.js` — types + `getRuntimePressureContract` (types.ts lines 1–2)
- **Calls into:** `features/handoff/index.js`
- **Status:** **active** — registered in catalog, delegates to feature layer
- **Note:** types.ts uses interface decomposition pattern (6 sub-interfaces: `HandoffIdentity`, `HandoffWorkflowContext`, `HandoffScope`, `HandoffSuccessCriteria`, `HandoffRecord`, `HandoffResume`) composed via intersection type (lines 101–109)

### hivemind_runtime_status + hivemind_runtime_command

- **Files:**
  - `src/tools/runtime/index.ts` — 9 LOC (named barrel export)
  - `src/tools/runtime/tools.ts` — 82 LOC (2 tool definitions)
  - `src/tools/runtime/types.ts` — 111 LOC (complex payload types)
- **Actions (runtime_status):** none (no args — pure inspection)
- **Actions (runtime_command):** `command` (string), with optional `arguments`, `userMessage`, `preferredUserName`, `language`, `artifactLanguage`, `governanceMode`, `automationLevel`, `expertLevel`, `outputStyle`, `presetId` (enum: `guided-onboarding`), `requestedSettingsGroups` (array enum), `intakeEvidence` (nested object schema) — `tools.ts` lines 47–71
- **Zod schemas:** `tools.ts` lines 47–71 — extensive nested object schema for `intakeEvidence` with nested enums
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../features/runtime-observability/status.js` — `buildHivemindRuntimeStatus`, `executeHivemindRuntimeCommand` (lines 11–13)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 14)
  - `./types.js` — `HivemindRuntimeStatusPayload` (line 15)
  - `../../schema-kernel/index.js` — 8 record types (types.ts line 14)
  - `../../shared/contracts/runtime-status.js` — `RuntimeStatus`, `RuntimeCommandCapabilityMode`, `RuntimeChainActionSupportMode` (types.ts lines 15, 19–20)
  - `../../sdk-supervisor/index.js` — `SupervisorHealthSummary` (types.ts line 16)
- **Calls into:** `features/runtime-observability/status.js`
- **Status:** **active** — both tools registered in catalog, delegate to feature layer

### hivemind_doc

- **Files:**
  - `src/tools/doc/index.ts` — 2 LOC (named barrel export)
  - `src/tools/doc/tools.ts` — 35 LOC (tool definition)
  - `src/tools/doc/types.ts` — 22 LOC (type + pressure contracts)
- **Actions:** `skim`, `skim_directory`, `read`, `chunk`, `search` (line 16, `tools.ts`)
- **Zod schemas:** `s.enum` for action (5 values), `s.string().optional()` for filePath, dirPath, heading, query, globFilter, `s.number().int().positive().optional()` for maxTokens — `tools.ts` lines 16–22
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../features/doc-intelligence/doc.js` — `executeHivemindDocAction` (line 3)
  - `../../shared/tool-response.js` — `error`, `success` (line 4)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 5)
  - `./types.js` — `HivemindDocToolArgs` (line 6)
  - `../../shared/pressure-contract.js` — types + `getRuntimePressureContract` (types.ts lines 1–2)
- **Calls into:** `features/doc-intelligence/doc.js`
- **Status:** **active** — registered in catalog, delegates to feature layer

### hivemind_journal

- **Files:**
  - `src/tools/hivemind-journal.ts` — 196 LOC (standalone tool, no subdirectory)
  - `src/tools/hivemind-journal.test.ts` — 308 LOC (test file)
- **Actions:** event types: `assistant_output`, `user_message`, `tool_call`, `compaction`, `trajectory`, `diagnostic` (lines 27–32)
- **Zod schemas:** `journalToolArgs` const object (lines 67–87) — `sessionId` (string), `eventType` (enum 6 values), `payload` (nested object with 7 optional fields), `timestamp` (string)
- **Imports from:**
  - `node:fs/promises` — `appendFile`, `mkdir` (line 14)
  - `node:path` — `dirname` (line 15)
  - `@opencode-ai/plugin` — `tool`, `ToolDefinition` (line 17)
  - `../features/event-tracker/markdown-writer.js` — `appendDiagnosticToMarkdown` (line 19)
  - `../features/event-tracker/paths.js` — `getJourneyEventsMarkdownPath` (line 20)
  - `../shared/tool-helpers.js` — `renderToolResult` (line 21)
- **Calls into:** `features/event-tracker/markdown-writer.js`, `features/event-tracker/paths.js`
- **Status:** **active** — registered in catalog, writes directly to filesystem (CQRS write-side)
- **Tests:** 10 test cases covering all 6 event types + path resolution + error handling

### hivemind_hm_init

- **Files:**
  - `src/tools/hivefiver-init/index.ts` — 2 LOC (named barrel export)
  - `src/tools/hivefiver-init/tools.ts` — 78 LOC (tool definition)
  - `src/tools/hivefiver-init/types.ts` — 26 LOC (types)
- **Actions:** `mode` (enum: `greenfield`, `brownfield`, `auto`), `force` (boolean) — `tools.ts` lines 24–27
- **Zod schemas:** `s.enum` for mode (3 values with default `auto`), `s.boolean` for force (default `false`) — `tools.ts` lines 24–27
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../shared/tool-response.js` — `success` (line 11)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 12)
  - `./types.js` — `HmInitToolArgs`, `HmInitResult` (line 13)
  - `node:fs`, `node:path` — dynamic imports in execute (lines 30–31)
- **Calls into:** No feature layer calls — self-contained placeholder implementation
- **Status:** **active** — registered in catalog, placeholder implementation (no writes)

### hivemind_hm_doctor

- **Files:**
  - `src/tools/hivefiver-doctor/index.ts` — 8 LOC (named barrel export)
  - `src/tools/hivefiver-doctor/tools.ts` — 109 LOC (tool definition)
  - `src/tools/hivefiver-doctor/types.ts` — 33 LOC (types)
- **Actions:** `scope` (enum: `all`, `skills`, `agents`, `config`, `paths`), `fix` (boolean) — `tools.ts` lines 24–27
- **Zod schemas:** `s.enum` for scope (5 values with default `all`), `s.boolean` for fix (default `false`) — `tools.ts` lines 24–27
- **Imports from:**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../shared/tool-response.js` — `success` (line 11)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 12)
  - `./types.js` — `HmDoctorToolArgs`, `HmDoctorResult`, `HmDoctorFinding` (line 13)
  - `node:fs`, `node:path` — dynamic imports in execute (lines 30–31)
- **Calls into:** No feature layer calls — self-contained placeholder implementation
- **Status:** **active** — registered in catalog, placeholder implementation (no writes)

### hivemind_hm_setting

- **Files:**
  - `src/tools/hivefiver-setting/index.ts` — 23 LOC (extensive barrel — exports from 5 files)
  - `src/tools/hivefiver-setting/tools.ts` — 220 LOC (tool definition)
  - `src/tools/hivefiver-setting/types.ts` — 205 LOC (extensive type definitions)
  - `src/tools/hivefiver-setting/render.ts` — 210 LOC (TUI rendering via @json-render/ink)
  - `src/tools/hivefiver-setting/dashboard.ts` — 68 LOC (dashboard proof builder)
  - `src/tools/hivefiver-setting/spec-builder.ts` — 309 LOC (json-render spec builder)
  - `src/tools/hivefiver-setting/i18n/index.ts` — 86 LOC (i18n copy for en/vi)
- **Actions:** `group` (enum: `language`, `expertise`, `governance`, `operation-mode`, `all`), `key` (string), `value` (string), `locale` (string), `renderMode` (enum: `json`, `tui`), `dashboard` (boolean) — `tools.ts` lines 74–91
- **Zod schemas:** `s.enum` for group (5 values), `s.string().optional()` for key/value/locale, `s.enum` for renderMode (2 values), `s.boolean` for dashboard — `tools.ts` lines 74–91
- **Imports from (tools.ts):**
  - `@opencode-ai/plugin/tool` — SDK tool factory
  - `../../shared/tool-response.js` — `success`, `error` (line 10)
  - `../../shared/tool-helpers.js` — `renderToolResult` (line 11)
  - `../../shared/config-groups.js` — `CONFIG_GROUPS`, `getConfigGroup`, `validateConfigUpdate`, `ConfigGroupName` (lines 13–17)
  - `./i18n/index.js` — `resolveLanguageSelectorCopy`, `SUPPORTED_LANGUAGE_VALUES` (line 18)
  - `./dashboard.js` — `buildHmSettingDashboardProof` (line 19)
  - `./render.js` — `renderHmSettingTui` (line 20)
  - `../../features/runtime-entry/snapshot-loader.js` — `loadRuntimeBindingsSnapshot` (line 25)
  - `../../sdk-supervisor/runtime-status.js` — `buildRuntimeStatusSnapshot` (line 26)
  - `../../control-plane/control-plane-registry.js` — `findControlPlanePrimitive` (line 27)
  - `../../features/session-entry/intake.gates.js` — `resolveControlPlaneIntakeGate` (line 28)
- **Calls into:** `features/runtime-entry/snapshot-loader.js`, `features/session-entry/intake.gates.js`, `sdk-supervisor/runtime-status.js`, `control-plane/control-plane-registry.js`
- **Status:** **active** — registered in catalog, most complex tool with dashboard/TUI/i18n support
- **Note:** This tool has the most upward imports of any tool — reaches into `features/`, `sdk-supervisor/`, and `control-plane/` layers

---

## Dependency Summary

| Tool File | Imports From | Layer Violation? |
|-----------|-------------|-----------------|
| `trajectory/tools.ts` | `features/trajectory/`, `shared/` | No — standard tool→feature delegation |
| `task/tools.ts` | `features/workflow/`, `shared/` | No — standard tool→feature delegation |
| `handoff/tools.ts` | `features/handoff/`, `shared/` | No — standard tool→feature delegation |
| `runtime/tools.ts` | `features/runtime-observability/`, `shared/` | No — standard tool→feature delegation |
| `runtime/types.ts` | `schema-kernel/`, `shared/`, `sdk-supervisor/` | No — types import from schema kernel is expected |
| `doc/tools.ts` | `features/doc-intelligence/`, `shared/` | No — standard tool→feature delegation |
| `hivemind-journal.ts` | `features/event-tracker/`, `shared/`, `node:fs/promises` | No — CQRS write-side, direct FS is intentional |
| `hivefiver-init/tools.ts` | `shared/`, `node:fs` (dynamic) | No — self-contained placeholder |
| `hivefiver-doctor/tools.ts` | `shared/`, `node:fs` (dynamic) | No — self-contained placeholder |
| `hivefiver-setting/tools.ts` | `shared/`, `features/runtime-entry/`, `features/session-entry/`, `sdk-supervisor/`, `control-plane/` | **YES** — imports from 4 layers beyond features |
| `hivefiver-setting/dashboard.ts` | `sdk-supervisor/`, `shared/` | No — dashboard is a view concern |
| `hivefiver-setting/render.ts` | `shared/` | No — pure rendering |
| `hivefiver-setting/spec-builder.ts` | (internal only) | No |
| `hivefiver-setting/i18n/index.ts` | `schema-kernel/` | No — type import only |

### Layer Violation Detail: `hivefiver-setting/tools.ts`

This file imports from **4 distinct layers** beyond the expected tool→feature→shared chain:

1. `features/runtime-entry/snapshot-loader.js` (line 25)
2. `features/session-entry/intake.gates.js` (line 28)
3. `sdk-supervisor/runtime-status.js` (line 26)
4. `control-plane/control-plane-registry.js` (line 27)

This makes `hivefiver-setting/tools.ts` the most cross-layer-coupled file in the entire tools directory.

---

## Dead Code

### Deleted file (uncommitted)
- `src/tools/AGENTS.md` — marked as deleted (`D`) in git status. Was likely a leftover AGENTS.md in the tools directory (violates "single AGENTS.md" rule from project constitution).

### Unused exports from `hivefiver-setting/index.ts`
The barrel at `src/tools/hivefiver-setting/index.ts` (line 23) exports:
- `buildHmSettingDashboardProof` from `./dashboard.js` — used internally by `tools.ts` dashboard mode (line 119)
- `renderHmSettingDashboardTui`, `renderHmSettingTui` from `./render.js` — `renderHmSettingTui` used by `tools.ts` (line 96); `renderHmSettingDashboardTui` used by `dashboard.ts` (line 59)
- `buildHmSettingDashboardSpec` from `./spec-builder.ts` — used by `dashboard.ts` (line 58)
- All type exports — consumed by render/dashboard/spec-builder

**Assessment:** All exports appear to be used within the `hivefiver-setting` subdirectory or by the tool itself. No confirmed dead exports.

### No test files for these tools:
- `src/tools/trajectory/` — **no tests**
- `src/tools/task/` — **no tests**
- `src/tools/handoff/` — **no tests**
- `src/tools/runtime/` — **no tests**
- `src/tools/doc/` — **no tests**
- `src/tools/hivefiver-init/` — **no tests** (covered by `hivefiver-tools.test.ts` integration tests)
- `src/tools/hivefiver-doctor/` — **no tests** (covered by `hivefiver-tools.test.ts` integration tests)
- `src/tools/hivefiver-setting/` — **no tests** (covered by `hivefiver-tools.test.ts` integration tests)

### Tools with tests: 2 of 9 tool directories
- `hivemind-journal.ts` — 308 LOC, 10 test cases (unit tests)
- `hivefiver-tools.test.ts` — 347 LOC, 18 test cases (integration tests for init/doctor/setting)

---

## Total Counts

| Metric | Count |
|--------|-------|
| Total files (source + test) | 32 |
| Source files (.ts, excluding .test.ts) | 30 |
| Test files (.test.ts) | 2 |
| Total LOC (all files) | 3,951 |
| Total LOC (source only) | 3,296 |
| Tools registered in catalog | 12 |
| Tools defined under src/tools/ | 9 (7 factory functions, 2 in runtime) |
| Tools defined outside src/tools/ (in catalog) | 2 (`hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract` in `src/features/agent-work-contract/tools/`) |
| Tool directories | 8 (`task`, `trajectory`, `handoff`, `runtime`, `doc`, `hivefiver-init`, `hivefiver-doctor`, `hivefiver-setting`) |
| Standalone tool files | 1 (`hivemind-journal.ts`) |
| Tools with dedicated tests | 1 (`hivemind-journal.ts`) |
| Tools covered by integration tests | 3 (init, doctor, setting via `hivefiver-tools.test.ts`) |
| Tools with NO test coverage | 5 (trajectory, task, handoff, runtime, doc) |
| Files with uncommitted modifications | 5 (all in `hivefiver-setting/`) |
| Files deleted (uncommitted) | 1 (`src/tools/AGENTS.md`) |

---

## Structural Patterns Observed

### Consistent pattern (6 of 9 tools)
Tools follow a 3-file structure: `index.ts` (barrel) + `tools.ts` (factory) + `types.ts` (types + pressure contracts). This pattern is used by: `task`, `trajectory`, `handoff`, `runtime`, `doc`, `hivefiver-init`, `hivefiver-doctor`.

### Execute pattern
All tool factories accept `projectRoot: string` and return `ReturnType<typeof tool>`. The execute function:
1. Calls a feature-layer `execute*Action` function
2. Checks `result.kind === 'error'` and returns `render(error(...))`
3. Attaches metadata via `context.metadata(result.metadata)` if present
4. Returns `render(success(result.message, result.data))`

### Pressure contract pattern
Every `types.ts` file defines a `Record<ActionType, RuntimePressureContract>` mapping each action to a pressure contract from `shared/pressure-contract.js`.

### Deviation: `hivemind-journal.ts`
Standalone file (no subdirectory). Direct filesystem writes via `node:fs/promises`. No pressure contract. Uses its own internal type definitions rather than a separate `types.ts`.

### Deviation: `hivefiver-setting/`
Largest tool subdirectory (7 files, 1,121 LOC). Includes TUI rendering, dashboard proof building, json-render spec construction, and i18n. Imports from 4 layers beyond features.
