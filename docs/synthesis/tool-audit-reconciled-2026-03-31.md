# Tool Audit — Reconciled Evidence
**Date:** 2026-03-31 | **Git:** `85f8cbe75d580e720854bf796742602ae4b13c31` | **Scope:** 12 custom tools

---

## 1. Architectural Spine (Tool Catalog)

- **12 tools registered** in `agentToolCatalog` at `src/tools/index.ts:28-137`
- **AGENTS.md claims 7** at `AGENTS.md:191` — **STALE** (missing: hm_init, hm_doctor, hm_setting, journal, create_contract, export_contract)
- **Factory pattern:** all tools use `createXxxTool(projectRoot)` — verified across all 12 tool definitions
- **5 structural anomalies identified:**
  1. Journal: flat file, no barrel export
  2. Contract tools: in `src/features/`, not `src/tools/`
  3. Runtime: 2 tools share 1 file
  4. Task: `async execute` without `await` (latent code smell)
  5. Handoff: 22 fields, 6 sub-interfaces, +83 LOC overhead

---

## 2. Per-Tool Evidence Tables

### 2.1 hivemind_doc

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_doc` | `src/tools/index.ts:29` |
| Actions | 5: `skim`, `skim_directory`, `read`, `chunk`, `search` | `src/tools/doc/types.ts:4`, `tools.ts:16` |
| Schema fields (count) | 6 (1 required, 5 optional) | `src/tools/doc/tools.ts:16-22` |
| Required fields | `action` | `src/tools/doc/tools.ts:16` |
| LOC (tool dir) | 581 across 10 files | `node1-doc-tool-chain-2026-03-31.md:146` |
| Purpose classes | `discovery`, `research`, `planning`, `gatekeeping` | `src/tools/index.ts:34` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:35` |
| Pressure contract | `steady-state` (all 5 actions) | `src/tools/doc/types.ts:16-21` |
| Async execute? | Yes | `src/tools/doc/tools.ts:25` |
| Barrel export? | Yes — `src/tools/doc/index.ts` | `src/tools/index.ts:12` |

### 2.2 hivemind_task

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_task` | `src/tools/index.ts:39` |
| Actions | 7: `create`, `list`, `get`, `activate`, `rotate`, `verify`, `complete` | `src/tools/task/types.ts:4-11` |
| Schema fields (count) | 9 (1 required, 8 optional) | `src/tools/task/tools.ts:16-25` |
| Required fields | `action` | `src/tools/task/tools.ts:16` |
| LOC (tool dir) | 265 (42 tools + 33 types + 190 feature) | `node3-task-anomaly-2026-03-31.md:26` |
| Purpose classes | `implementation`, `gatekeeping`, `tdd`, `course-correction` | `src/tools/index.ts:43` |
| State authority | `workflow` | `src/tools/index.ts:44` |
| Pressure contract | `task-mutation` (create, activate, rotate, verify, complete); `steady-state` (list, get) | `src/tools/task/types.ts:25-33` |
| Async execute? | Declared `async` but does NOT `await` | `src/tools/task/tools.ts:26-29` |
| Barrel export? | Yes — `src/tools/task/index.ts` | `src/tools/index.ts:8` |

### 2.3 hivemind_trajectory

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_trajectory` | `src/tools/index.ts:48` |
| Actions | 6: `inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close` | `src/tools/trajectory/types.ts:4-10` |
| Schema fields (count) | 13 (1 required, 12 optional) | `src/tools/trajectory/tools.ts:16-32` |
| Required fields | `action` | `src/tools/trajectory/tools.ts:16` |
| LOC (tool dir) | 265 across 5 files (49+35+2+178+1) | `node2-trajectory-pattern-2026-03-31.md:164-171` |
| Purpose classes | `planning`, `implementation`, `gatekeeping`, `course-correction` | `src/tools/index.ts:52` |
| State authority | `trajectory` | `src/tools/index.ts:53` |
| Pressure contract | `trajectory-control`, `trajectory-continuation`, `steady-state` | `src/tools/trajectory/types.ts:28-35` |
| Async execute? | Yes — `await` present | `src/tools/trajectory/tools.ts:34` |
| Barrel export? | Yes — `src/tools/trajectory/index.ts` | `src/tools/index.ts:9` |

### 2.4 hivemind_handoff

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_handoff` | `src/tools/index.ts:57` |
| Actions | 6: `create`, `read`, `list`, `update`, `validate`, `close` | `src/tools/handoff/types.ts:4-10` |
| Schema fields (count) | 22 (1 required, 21 optional) | `src/tools/handoff/tools.ts:14-35` |
| Required fields | `action` | `src/tools/handoff/tools.ts:14` |
| LOC (tool dir) | 444 (54+118+271+1) | `node4-handoff-overengineering-2026-03-31.md:153` |
| Purpose classes | `research`, `implementation`, `gatekeeping`, `course-correction` | `src/tools/index.ts:61` |
| State authority | `delegation` | `src/tools/index.ts:62` |
| Pressure contract | `handoff-validation` | `src/tools/index.ts:63` |
| Async execute? | Yes | `src/features/handoff/handoff.ts:96-270` |
| Barrel export? | Yes — `src/tools/handoff/index.ts` | `src/tools/index.ts:10` |

### 2.5 hivemind_runtime_status

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_runtime_status` | `src/tools/index.ts:66` |
| Actions | 0 (no args — `args: {}`) | `src/tools/runtime/tools.ts:24` |
| Schema fields (count) | 0 | `src/tools/runtime/tools.ts:24` |
| Required fields | None | — |
| LOC (tool dir) | 202 (82 tools + 111 types + 9 index) | `node5a-runtime-tools-2026-03-31.md:96-99` |
| Purpose classes | `discovery`, `gatekeeping` | `src/tools/index.ts:70` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:71` |
| Pressure contract | `steady-state` | `src/tools/index.ts:72` |
| Async execute? | Yes | `src/tools/runtime/tools.ts:26-29` |
| Barrel export? | Yes — `src/tools/runtime/index.ts` | `src/tools/index.ts:11` |

### 2.6 hivemind_runtime_command

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_runtime_command` | `src/tools/index.ts:75` |
| Actions | 13 schema fields (command-driven dispatch, not action enum) | `src/tools/runtime/tools.ts:46-72` |
| Schema fields (count) | 13 (1 required, 12 optional) | `src/tools/runtime/tools.ts:46-72` |
| Required fields | `command` | `src/tools/runtime/tools.ts:47` |
| LOC (tool dir) | Shared with runtime_status: 202 total | `node5a-runtime-tools-2026-03-31.md:96-99` |
| Purpose classes | `implementation`, `course-correction` | `src/tools/index.ts:79` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:80` |
| Pressure contract | `control-plane-repair` | `src/tools/index.ts:81` |
| Async execute? | Yes | `src/tools/runtime/tools.ts:73-80` |
| Barrel export? | Yes — shared barrel with runtime_status | `src/tools/runtime/index.ts:5` |

### 2.7 hivemind_journal

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_journal` | `src/tools/index.ts:102` |
| Actions | 6 event types: `assistant_output`, `user_message`, `tool_call`, `compaction`, `trajectory`, `diagnostic` | `src/tools/hivemind-journal.ts:26-32` |
| Schema fields (count) | 4 (2 required: `sessionId`, `timestamp`; 2 optional: `eventType`, `payload`) | `src/tools/hivemind-journal.ts:67-87` |
| Required fields | `sessionId`, `timestamp` | `src/tools/hivemind-journal.ts:67-87` |
| LOC (tool dir) | 196 (single flat file) | `node5b-journal-contract-2026-03-31.md:19` |
| Purpose classes | All 8: `discovery`, `brainstorming`, `research`, `planning`, `implementation`, `gatekeeping`, `tdd`, `course-correction` | `src/tools/index.ts:106` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:107` |
| Pressure contract | `steady-state` | `src/tools/index.ts:108` |
| Async execute? | Yes | `src/tools/hivemind-journal.ts` |
| Barrel export? | **NO** — flat file, direct import in plugin | `node5b-journal-contract-2026-03-31.md:20-22` |

### 2.8 hivemind_agent_work_create_contract

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_agent_work_create_contract` | `src/tools/index.ts:84` |
| Actions | 2: `create`, `update` | `src/features/agent-work-contract/tools/create-contract-tool.ts:33` |
| Schema fields (count) | 7 top-level (1 required: `action`; 6 optional) with nested objects for `workflow`, `chainActions`, `briefing`, `anchors` | `node5b-journal-contract-2026-03-31.md:94-134` |
| Required fields | `action` | `src/features/agent-work-contract/tools/create-contract-tool.ts:33` |
| LOC (tool dir) | 155 (tool) + supporting files (schema, helpers, normalizers, operations) | `node5b-journal-contract-2026-03-31.md:79` |
| Purpose classes | `planning`, `implementation`, `gatekeeping` | `src/tools/index.ts:88` |
| State authority | `workflow` | `src/tools/index.ts:89` |
| Pressure contract | `task-mutation` | `src/tools/index.ts:90` |
| Async execute? | Yes | `src/features/agent-work-contract/tools/create-contract-tool.ts` |
| Barrel export? | Feature-local barrel only — `src/features/agent-work-contract/tools/index.ts` | `node5b-journal-contract-2026-03-31.md:80` |

### 2.9 hivemind_agent_work_export_contract

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_agent_work_export_contract` | `src/tools/index.ts:93` |
| Actions | 1: `export` (format-driven: `contract` or `summary`) | `src/features/agent-work-contract/tools/export-contract-tool.ts:36` |
| Schema fields (count) | 2 (both required: `contractId`, `format`) | `node5b-journal-contract-2026-03-31.md:175-179` |
| Required fields | `contractId`, `format` | `src/features/agent-work-contract/tools/export-contract-tool.ts:34-37` |
| LOC (tool dir) | 67 | `node5b-journal-contract-2026-03-31.md:160` |
| Purpose classes | `planning`, `implementation`, `gatekeeping`, `course-correction` | `src/tools/index.ts:97` |
| State authority | `workflow` | `src/tools/index.ts:98` |
| Pressure contract | `steady-state` | `src/tools/index.ts:99` |
| Async execute? | Yes | `src/features/agent-work-contract/tools/export-contract-tool.ts` |
| Barrel export? | Feature-local barrel only | `node5b-journal-contract-2026-03-31.md:161` |

### 2.10 hivemind_hm_init

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_hm_init` | `src/tools/index.ts:111` |
| Actions | 0 (mode-driven: `greenfield`, `brownfield`, `auto`) | `src/tools/hivefiver-init/tools.ts:24` |
| Schema fields (count) | 2 (both with defaults: `mode`, `force`) | `src/tools/hivefiver-init/tools.ts:24-27` |
| Required fields | None (both have defaults) | `src/tools/hivefiver-init/tools.ts:24-27` |
| LOC (tool dir) | 104 (78 tools + 26 types) | `src/tools/hivefiver-init/tools.ts:78`, `types.ts:26` |
| Purpose classes | `discovery`, `implementation` | `src/tools/index.ts:115` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:116` |
| Pressure contract | `steady-state` | `src/tools/index.ts:117` |
| Async execute? | Yes (dynamic imports) | `src/tools/hivefiver-init/tools.ts:30-31` |
| Barrel export? | Yes — `src/tools/hivefiver-init/index.ts` | `src/tools/index.ts:13` |

### 2.11 hivemind_hm_doctor

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_hm_doctor` | `src/tools/index.ts:120` |
| Actions | 0 (scope-driven: `all`, `skills`, `agents`, `config`, `paths`) | `src/tools/hivefiver-doctor/tools.ts:24` |
| Schema fields (count) | 2 (both with defaults: `scope`, `fix`) | `src/tools/hivefiver-doctor/tools.ts:24-27` |
| Required fields | None (both have defaults) | `src/tools/hivefiver-doctor/tools.ts:24-27` |
| LOC (tool dir) | 142 (109 tools + 33 types) | `src/tools/hivefiver-doctor/tools.ts:109`, `types.ts:33` |
| Purpose classes | `discovery`, `gatekeeping` | `src/tools/index.ts:124` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:125` |
| Pressure contract | `steady-state` | `src/tools/index.ts:126` |
| Async execute? | Yes (dynamic imports) | `src/tools/hivefiver-doctor/tools.ts:30-31` |
| Barrel export? | Yes — `src/tools/hivefiver-doctor/index.ts` | `src/tools/index.ts:14` |

### 2.12 hivemind_hm_setting

| Field | Value | Evidence |
|-------|-------|----------|
| Tool name | `hivemind_hm_setting` | `src/tools/index.ts:129` |
| Actions | 0 (group-driven: `language`, `expertise`, `governance`, `operation-mode`, `all`) | `src/tools/hivefiver-setting/tools.ts:74-80` |
| Schema fields (count) | 6 (1 required: `group`; 5 optional) | `src/tools/hivefiver-setting/tools.ts:74-91` |
| Required fields | `group` (has default `'all'`) | `src/tools/hivefiver-setting/tools.ts:74-80` |
| LOC (tool dir) | 425 (220 tools + 205 types) | `src/tools/hivefiver-setting/tools.ts:220`, `types.ts:205` |
| Purpose classes | `discovery`, `implementation` | `src/tools/index.ts:133` |
| State authority | `plugin-control-plane` | `src/tools/index.ts:134` |
| Pressure contract | `steady-state` | `src/tools/index.ts:135` |
| Async execute? | Yes | `src/tools/hivefiver-setting/tools.ts:93` |
| Barrel export? | Yes — `src/tools/hivefiver-setting/index.ts` | `src/tools/index.ts:15` |

---

## 3. Structural Anomalies

### Anomaly 1: Journal — Flat File, No Barrel Export

| Aspect | Evidence |
|--------|----------|
| Location | `src/tools/hivemind-journal.ts` (flat file, not subdirectory) | `node5b-journal-contract-2026-03-31.md:18` |
| Barrel export | **Absent** — not exported from `src/tools/index.ts` | `node5b-journal-contract-2026-03-31.md:20` |
| Plugin import | Direct: `import { createHivemindJournalTool } from '../tools/hivemind-journal.js'` | `src/plugin/opencode-plugin.ts:33` |
| Catalog entry | Listed in `agentToolCatalog` at `src/tools/index.ts:102-109` | `node5b-journal-contract-2026-03-31.md:23` |
| Business logic | Embedded — imports from `src/features/event-tracker/` | `node5b-journal-contract-2026-03-31.md:214` |

### Anomaly 2: Contract Tools — Feature-Local, Cross-Boundary

| Aspect | Evidence |
|--------|----------|
| Location | `src/features/agent-work-contract/tools/` (not `src/tools/`) | `node5b-journal-contract-2026-03-31.md:78,159` |
| Barrel export | Feature-local: `src/features/agent-work-contract/tools/index.ts` | `node5b-journal-contract-2026-03-31.md:80,161` |
| Plugin import | Via feature path: `src/plugin/opencode-plugin.ts:21-23` | `node5b-journal-contract-2026-03-31.md:81,162` |
| Supporting files | 5+ co-located files (schema, helpers, normalizers, operations, tests) | `node5b-journal-contract-2026-03-31.md:142-148` |
| Justification | Tightly coupled to `agent-work-contract` feature (shared schema, contract store, compaction) | `node5b-journal-contract-2026-03-31.md:226-232` |

### Anomaly 3: Runtime — Two Tools Share One File

| Aspect | Evidence |
|--------|----------|
| Shared file | `src/tools/runtime/tools.ts` (82 LOC) | `node5a-runtime-tools-2026-03-31.md:65` |
| Tool 1 | `createHivemindRuntimeStatusTool` — 0 args | `node5a-runtime-tools-2026-03-31.md:21-29` |
| Tool 2 | `createHivemindRuntimeCommandTool` — 13 args | `node5a-runtime-tools-2026-03-31.md:34-59` |
| Barrel export | Both re-exported from `src/tools/runtime/index.ts:5` | `node5a-runtime-tools-2026-03-31.md:70-73` |
| Plugin wiring | Independent: `src/plugin/opencode-plugin.ts:123-124` | `node5a-runtime-tools-2026-03-31.md:75-82` |
| Shared backend | Both import from `src/features/runtime-observability/status.js` | `node5a-runtime-tools-2026-03-31.md:86` |

### Anomaly 4: Task — Missing Await (Latent Code Smell)

| Aspect | Evidence |
|--------|----------|
| Declaration | `async execute(args, context)` at `src/tools/task/tools.ts:26` | `node3-task-anomaly-2026-03-31.md:21` |
| Call site | `const result = executeHivemindTaskAction(...)` — **no `await`** | `node3-task-anomaly-2026-03-31.md:22` |
| Feature handler | `function executeHivemindTaskAction(...): TaskFeatureResult` — **sync, not async** | `node3-task-anomaly-2026-03-31.md:23` |
| Comparison | Trajectory tool: `async` + `await` (consistent) | `node3-task-anomaly-2026-03-31.md:35-37` |
| Impact | Harmless — `async` wrapping sync produces resolved Promise, no unhandled rejection | `node3-task-anomaly-2026-03-31.md:51-53` |

### Anomaly 5: Handoff — Over-Engineered Types

| Aspect | Evidence |
|--------|----------|
| Schema fields | 22 (vs trajectory's 13 — +69%) | `node4-handoff-overengineering-2026-03-31.md:33-58` |
| Sub-interfaces | 6 (`HandoffIdentity`, `HandoffWorkflowContext`, `HandoffScope`, `HandoffSuccessCriteria`, `HandoffRecord`, `HandoffResume`) | `node4-handoff-overengineering-2026-03-31.md:96-105` |
| Types LOC | 118 (vs trajectory's 35 — 3.4×) | `node4-handoff-overengineering-2026-03-31.md:119` |
| Total LOC | 444 (vs trajectory's 262 — +69%) | `node4-handoff-overengineering-2026-03-31.md:153` |
| Overhead source | 6 sub-interfaces add 83 LOC with zero runtime benefit | `node4-handoff-overengineering-2026-03-31.md:189` |
| Justified fields | 16 of 22 are delegation-domain-specific (identity, scope, contracts, evidence) | `node4-handoff-overengineering-2026-03-31.md:180-185` |

---

## 4. Canonical Pattern (Trajectory)

### Why Trajectory Is the Benchmark

| Criterion | Evidence |
|-----------|----------|
| Cleanest separation of concerns | Tool layer (49 LOC) is purely thin adapter — zero business logic | `node2-trajectory-pattern-2026-03-31.md:144` |
| Every action has dedicated handler | All 6 actions have own `case` block with guard clauses | `node2-trajectory-pattern-2026-03-31.md:147` |
| Schema well-structured | 13 fields, 1 required, 12 optional, all with `.describe()` | `node2-trajectory-pattern-2026-03-31.md:148` |
| Consistent result contract | Discriminated union on `kind: 'success' | 'error'` across all 6 actions | `node2-trajectory-pattern-2026-03-31.md:150` |
| Pressure contract integration | Each action carries `RuntimePressureContract` resolved at dispatch | `node2-trajectory-pattern-2026-03-31.md:152` |
| LOC discipline | 265 total across 5 files, largest = 178 (feature), within ≤300 standard | `node2-trajectory-pattern-2026-03-31.md:154` |

### All Tools vs Trajectory Comparison

| Metric | Trajectory (canonical) | Doc | Task | Handoff | Runtime (status) | Runtime (command) | Journal | Create Contract | Export Contract | Hm Init | Hm Doctor | Hm Setting |
|--------|----------------------|-----|------|---------|------------------|-------------------|---------|-----------------|-----------------|---------|-----------|------------|
| Actions | 6 | 5 | 7 | 6 | 0 | 13 fields | 6 events | 2 | 1 | 0 | 0 | 0 |
| Schema fields | 13 | 6 | 9 | 22 | 0 | 13 | 4 | 7+ | 2 | 2 | 2 | 6 |
| Required fields | 1 | 1 | 1 | 1 | 0 | 1 | 2 | 1 | 2 | 0 | 0 | 0 |
| Total LOC | 265 | 581 | 265 | 444 | 202* | 202* | 196 | 155+ | 67 | 104 | 142 | 425 |
| Barrel export | Yes | Yes | Yes | Yes | Yes (shared) | Yes (shared) | **No** | Feature-local | Feature-local | Yes | Yes | Yes |
| Async consistent | Yes | Yes | **No** | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Sub-interfaces | 0 | 0 | 0 | 6 | 0 | 0 | 0 | Complex nested | 0 | 0 | 0 | Complex |
| Location | `src/tools/` | `src/tools/` | `src/tools/` | `src/tools/` | `src/tools/` | `src/tools/` | `src/tools/` (flat) | `src/features/` | `src/features/` | `src/tools/` | `src/tools/` | `src/tools/` |

*Runtime tools share one file (202 LOC total for both)

---

## 5. Legacy vs Current Gap (Doc Tool)

### Legacy Surface

| Aspect | Value | Evidence |
|--------|-------|----------|
| Actions | 20 (10 read + 10 write) | `gap-analysis-legacy-vs-current-2026-03-31.md:46` |
| LOC | 911 monolith | `gap-analysis-legacy-vs-current-2026-03-31.md:29` |
| Write operations | 10: `upsert`, `write`, `append`, `insert`, `delete`, `create`, `writeMetadata`, `batchEdit`, `batchFiles`, `setMetadata` | `gap-analysis-legacy-vs-current-2026-03-31.md:38` |
| Code intelligence | 18 modules (4,053 LOC) | `gap-analysis-legacy-vs-current-2026-03-31.md:39` |
| Format support | 4 formats (md full, json/xml/yaml stubs) | `gap-analysis-legacy-vs-current-2026-03-31.md:40` |
| Cross-referencing | 3 ops: `xrefDocuments`, `indexDocuments`, `listDocuments` | `gap-analysis-legacy-vs-current-2026-03-31.md:41` |
| Safety systems | File locking, atomic writes, SHA-256 hashing, chunking guards | `gap-analysis-legacy-vs-current-2026-03-31.md:43` |

### Current Surface

| Aspect | Value | Evidence |
|--------|-------|----------|
| Actions | 5 (all read): `skim`, `skim_directory`, `read`, `chunk`, `search` | `node1-doc-tool-chain-2026-03-31.md:27-31` |
| LOC | 581 across 10 files (layered) | `node1-doc-tool-chain-2026-03-31.md:146` |
| Write operations | **Zero** — tool is read-only by design | `node1-doc-tool-chain-2026-03-31.md:96-102` |
| Code intelligence | **Zero** — all 18 modules removed | `gap-analysis-legacy-vs-current-2026-03-31.md:39` |
| Format support | 1 format: markdown only (md.ts, 177 LOC) | `node1-doc-tool-chain-2026-03-31.md:80` |
| Cross-referencing | **Zero** — not exported from current read-ops.ts | `gap-analysis-legacy-vs-current-2026-03-31.md:41` |
| Safety systems | Path traversal blocking + extension validation only | `node1-doc-tool-chain-2026-03-31.md:99` |

### Feature Chain Status

| Link | Status | Evidence |
|------|--------|----------|
| Tool → Feature | Connected — `tools.ts:3` imports `executeHivemindDocAction` | `node1-doc-tool-chain-2026-03-31.md:109` |
| Feature → Intelligence | Connected — `doc.ts:1-7` imports 5 functions | `node1-doc-tool-chain-2026-03-31.md:111` |
| Intelligence → Parser | Connected — `read-ops.ts` imports `./formats/md.js` | `node1-doc-tool-chain-2026-03-31.md:87` |
| Action coverage | Complete — all 5 actions have handlers | `node1-doc-tool-chain-2026-03-31.md:114-122` |
| Orphaned file | `doc-surface-router.ts` — not consumed by tool chain | `node1-doc-tool-chain-2026-03-31.md:163` |

### Gap Classification

| Capability | Classification | Legacy LOC | Current LOC | Evidence |
|-----------|---------------|------------|-------------|----------|
| Document writing | **REGRESSION** | 876 (write-ops.ts) | 0 | `gap-analysis-legacy-vs-current-2026-03-31.md:38` |
| Code intelligence | **REGRESSION** | 4,053 (18 modules) | 0 | `gap-analysis-legacy-vs-current-2026-03-31.md:39` |
| Cross-referencing | **REGRESSION** | ~200 | 0 | `gap-analysis-legacy-vs-current-2026-03-31.md:41` |
| Batch operations | **REGRESSION** | ~100 | 0 | `gap-analysis-legacy-vs-current-2026-03-31.md:42` |
| LSP integration | **REGRESSION** | 103 | 0 | `gap-analysis-legacy-vs-current-2026-03-31.md:44` |
| Document reading | **DEGRADED** | 12 ops | 5 ops | `gap-analysis-legacy-vs-current-2026-03-31.md:37` |
| Format support | **DEGRADED** | 4 formats | 1 format | `gap-analysis-legacy-vs-current-2026-03-31.md:40` |
| Safety systems | **DEGRADED** | 4 features | 2 features | `gap-analysis-legacy-vs-current-2026-03-31.md:43` |
| Smart extraction | **DEGRADED** | 3 ops | 0 (general-purpose) | `gap-analysis-legacy-vs-current-2026-03-31.md:45` |
| Markdown parsing | **PRESERVED** | remark AST | remark AST | `gap-analysis-legacy-vs-current-2026-03-31.md:64` |
| Document skim/search | **PRESERVED** | 5 ops | 5 ops | `gap-analysis-legacy-vs-current-2026-03-31.md:65` |

---

## 6. Refactoring Opportunities

### Opportunity 1: Remove Redundant `async` from Task Tool

| Aspect | Detail |
|--------|--------|
| Evidence | `src/tools/task/tools.ts:26` — `async execute` without `await`; feature handler is sync (`src/features/workflow/task.ts:30-34`) |
| Impact | Code cleanliness only — no runtime effect |
| Priority | **Low** — harmless but inconsistent with trajectory pattern |
| Change | Remove `async` keyword from line 26 |

### Opportunity 2: Collapse Handoff Sub-Interfaces

| Aspect | Detail |
|--------|--------|
| Evidence | 6 sub-interfaces in `src/tools/handoff/types.ts:16-109` add 83 LOC with zero runtime benefit |
| Impact | ~50 LOC reduction in types.ts; simpler type surface |
| Priority | **Medium** — maintenance burden, no functional benefit |
| Change | Collapse to 2-3 interfaces (identity, delegation-packet, metadata) |

### Opportunity 3: Move Journal to Canonical Pattern

| Aspect | Detail |
|--------|--------|
| Evidence | Flat file at `src/tools/hivemind-journal.ts` (196 LOC), no barrel export, direct plugin import |
| Impact | Architectural consistency; discoverability improvement |
| Priority | **Medium** — breaks convention but works correctly |
| Change | Create `src/tools/journal/` subdirectory with `index.ts`, `tools.ts`, `types.ts` |

### Opportunity 4: Relocate Contract Tools to `src/tools/`

| Aspect | Detail |
|--------|--------|
| Evidence | Tools at `src/features/agent-work-contract/tools/` — outside tool registry convention |
| Impact | Discoverability; consistency with 10 other tools |
| Priority | **Low-Medium** — justified by feature cohesion but breaks convention |
| Change | Move tool definitions to `src/tools/contract/`, keep supporting files in features |

### Opportunity 5: Update AGENTS.md Tool Count

| Aspect | Detail |
|--------|--------|
| Evidence | `AGENTS.md:191` claims "Custom Tools (7)" — actual count is 12 |
| Impact | Documentation accuracy |
| Priority | **High** — stale documentation misleads developers |
| Change | Update table to list all 12 tools with correct locations |

### Opportunity 6: Remove Orphaned `doc-surface-router.ts`

| Aspect | Detail |
|--------|--------|
| Evidence | `src/intelligence/doc/doc-surface-router.ts` (39 LOC) — not imported by tool, feature layer, or read-ops |
| Impact | Dead code removal; clarity |
| Priority | **Low** — orphaned but harmless |
| Change | Delete file or document its intended consumer |

### Opportunity 7: Share Runtime Types Between Status and Command

| Aspect | Detail |
|--------|--------|
| Evidence | Both tools in `src/tools/runtime/tools.ts` share `src/tools/runtime/types.ts` (111 LOC) — no type sync validation |
| Impact | Type safety; reduced maintenance |
| Priority | **Low** — convention gap, not defect |
| Change | Add compile-time validation that TypeScript interface mirrors Zod schema |

---

## Appendix: Tool Catalog Summary

| # | Tool ID | Actions | Schema Fields | LOC | Barrel? | Async OK? | Location |
|---|---------|---------|--------------|-----|---------|-----------|----------|
| 1 | `hivemind_doc` | 5 | 6 | 581 | Yes | Yes | `src/tools/doc/` |
| 2 | `hivemind_task` | 7 | 9 | 265 | Yes | **No** (redundant) | `src/tools/task/` |
| 3 | `hivemind_trajectory` | 6 | 13 | 265 | Yes | Yes | `src/tools/trajectory/` |
| 4 | `hivemind_handoff` | 6 | 22 | 444 | Yes | Yes | `src/tools/handoff/` |
| 5 | `hivemind_runtime_status` | 0 | 0 | 202* | Yes | Yes | `src/tools/runtime/` |
| 6 | `hivemind_runtime_command` | 13 fields | 13 | 202* | Yes | Yes | `src/tools/runtime/` |
| 7 | `hivemind_journal` | 6 events | 4 | 196 | **No** | Yes | `src/tools/` (flat) |
| 8 | `hivemind_agent_work_create_contract` | 2 | 7+ | 155+ | Feature | Yes | `src/features/` |
| 9 | `hivemind_agent_work_export_contract` | 1 | 2 | 67 | Feature | Yes | `src/features/` |
| 10 | `hivemind_hm_init` | 0 | 2 | 104 | Yes | Yes | `src/tools/hivefiver-init/` |
| 11 | `hivemind_hm_doctor` | 0 | 2 | 142 | Yes | Yes | `src/tools/hivefiver-doctor/` |
| 12 | `hivemind_hm_setting` | 0 | 6 | 425 | Yes | Yes | `src/tools/hivefiver-setting/` |

*Runtime tools share one file (202 LOC total)

**Totals:** 12 tools | 48 action/enum values | 2,996+ LOC | 10/12 barrel exports | 11/12 async consistent
