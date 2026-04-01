---
title: "Managing Layer Tools Audit"
date: 2026-03-31
agent: hivexplorer
type: investigation-report
scope: trajectory, agent-work-contract, task, handoff, journal
git_commit: 85f8cbe7
---

# Managing Layer Tools Audit — 2026-03-31

**Scope:** `src/tools/trajectory/`, `src/tools/task/`, `src/tools/handoff/`, `src/tools/hivemind-journal.ts`, `src/features/agent-work-contract/`, `src/features/trajectory/`, `src/features/workflow/`, `src/features/handoff/`, `src/tools/index.ts`, `src/plugin/opencode-plugin.ts`
**Question:** Do the managing layer tools (trajectory, agent-work-contract, task, handoff, journal) actually work? What's broken? What's missing?
**Git commit:** `85f8cbe7` (branch: `product-detox`)
**Type check:** `npx tsc --noEmit` — **PASSES CLEAN** (0 errors)

---

## Tool-by-Tool Analysis

### 1. Trajectory (`hivemind_trajectory`)

- **Status:** WORKING
- **LOC:** 267 total (tool: 49+35+2, feature: 178+1, core dependency: `src/core/trajectory/`)
- **Tests:** NO — zero test files found for trajectory (`glob tests/**/*trajectory*` → 0 results)
- **Registered:** YES — `src/tools/index.ts:9` exports `./trajectory/index.js`; catalog entry at `src/tools/index.ts:48-55`
- **Wired in plugin:** YES — `src/plugin/opencode-plugin.ts:32` imports, `src/plugin/opencode-plugin.ts:129` registers as `hivemind_trajectory`
- **3-Layer Pattern:** Tool → Feature → Core (NOT Intelligence). The intelligence layer (`src/intelligence/`) is doc-only — no trajectory intelligence exists.
- **Issues:**
  1. **No tests.** The trajectory tool has 6 actions (inspect, traverse, attach, checkpoint, event, close) with zero test coverage.
  2. **Upward import violation.** `src/features/trajectory/trajectory.ts:11` imports from `../../tools/trajectory/types.js` — feature importing from tools layer violates CQRS (tools should depend on features, not vice versa).
  3. **No intelligence layer.** The expected Tool → Feature → Intelligence chain stops at Feature. `src/intelligence/` only contains doc-intelligence (`src/intelligence/doc/`), no trajectory intelligence.
- **Evidence:**
  - Tool definition: `src/tools/trajectory/tools.ts:10-48`
  - Feature logic: `src/features/trajectory/trajectory.ts:29-177`
  - Upward import: `src/features/trajectory/trajectory.ts:11`
  - Plugin wiring: `src/plugin/opencode-plugin.ts:32,129`
  - Catalog entry: `src/tools/index.ts:48-55`

### 2. Agent Work Contract (`hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract`)

- **Status:** PARTIAL
- **LOC:** 272 total (create-contract: 155, export-contract: 67, classify-intent: 50, engine: 17 files)
- **Tests:** YES — `create-contract-tool.test.ts`, `export-contract-tool.test.ts`, `classify-intent-tool.test.ts`, `contract-store.test.ts`, `intent-classifier.test.ts`, `anchor-recorder.test.ts`, `chain-executor.test.ts`, `response-mode-resolver.test.ts` (8 test files in `src/features/agent-work-contract/`)
- **Registered:** PARTIAL — Only 2 of 3 tools are wired:
  - `hivemind_agent_work_create_contract` — YES (`src/plugin/opencode-plugin.ts:125`)
  - `hivemind_agent_work_export_contract` — YES (`src/plugin/opencode-plugin.ts:126`)
  - `hivemind_agent_work_classify_intent` — **NO** — exported from `src/features/agent-work-contract/tools/index.ts:13-15` but **never imported or registered** in `opencode-plugin.ts`
- **Wired in plugin:** PARTIAL — see above. The classify-intent tool is orphaned.
- **Catalog entry:** YES — both registered tools appear in `src/tools/index.ts:84-100`
- **Issues:**
  1. **Orphaned tool:** `classify-intent-tool.ts` (50 LOC) is fully implemented, exported from the feature barrel, but never wired into the plugin. It is dead code at runtime.
  2. **Not in `src/tools/index.ts` barrel.** The agent-work-contract tools live under `src/features/`, not `src/tools/`. They are imported directly from the feature layer in the plugin. This breaks the convention that all tools export through `src/tools/index.ts`.
  3. **Upward import:** `src/features/agent-work-contract/tools/create-contract-tool.test.ts:10` imports `agentToolCatalog` from `../../../tools/index.js` — test importing from tools barrel.
- **Evidence:**
  - Create contract tool: `src/features/agent-work-contract/tools/create-contract-tool.ts:81-150`
  - Export contract tool: `src/features/agent-work-contract/tools/export-contract-tool.ts:30-66`
  - Classify intent tool (orphaned): `src/features/agent-work-contract/tools/classify-intent-tool.ts:25-49`
  - Plugin wiring (missing classify): `src/plugin/opencode-plugin.ts:21-23,125-126`
  - Feature barrel export: `src/features/agent-work-contract/tools/index.ts:8-19`

### 3. Task (`hivemind_task`)

- **Status:** WORKING (with minor issue)
- **LOC:** 268 total (tool: 42+33+2, feature: 190+1)
- **Tests:** PARTIAL — `tests/task-lifecycle-corruption.test.ts` tests the core `src/core/workflow-management/task-lifecycle.js` layer but NOT the tool or feature layer directly. No tests for `src/tools/task/tools.ts` or `src/features/workflow/task.ts`.
- **Registered:** YES — `src/tools/index.ts:8` exports `./task/index.js`; catalog entry at `src/tools/index.ts:39-46`
- **Wired in plugin:** YES — `src/plugin/opencode-plugin.ts:31` imports, `src/plugin/opencode-plugin.ts:128` registers as `hivemind_task`
- **3-Layer Pattern:** Tool → Feature → Core. No intelligence layer for tasks.
- **Issues:**
  1. **Unnecessary `async` on execute.** `src/tools/task/tools.ts:26` marks `execute` as `async`, but `executeHivemindTaskAction` at `src/features/workflow/task.ts:30` is **synchronous** (no `await`, returns `TaskFeatureResult` not `Promise<TaskFeatureResult>`). The `async` keyword is unnecessary — the function never awaits anything.
  2. **Upward import violation.** `src/features/workflow/task.ts:12` imports from `../../tools/task/types.js` — same CQRS violation as trajectory.
  3. **No direct tool/feature tests.** Only the core layer has corruption tests.
- **Evidence:**
  - Tool definition: `src/tools/task/tools.ts:10-41`
  - Unnecessary async: `src/tools/task/tools.ts:26`
  - Sync feature function: `src/features/workflow/task.ts:30` (no `async`, no `await`)
  - Upward import: `src/features/workflow/task.ts:12`
  - Plugin wiring: `src/plugin/opencode-plugin.ts:31,128`

### 4. Handoff (`hivemind_handoff`)

- **Status:** WORKING
- **LOC:** 445 total (tool: 54+118+2, feature: 271+1)
- **Tests:** NO — zero test files found for handoff (`glob tests/**/*handoff*` → 0 results)
- **Registered:** YES — `src/tools/index.ts:10` exports `./handoff/index.js`; catalog entry at `src/tools/index.ts:57-64`
- **Wired in plugin:** YES — `src/plugin/opencode-plugin.ts:26` imports, `src/plugin/opencode-plugin.ts:130` registers as `hivemind_handoff`
- **3-Layer Pattern:** Tool → Feature → Delegation. The handoff feature delegates to `src/delegation/` (not intelligence).
- **Sub-interfaces usage:** All 6 sub-interfaces in `types.ts` are used:
  - `HandoffIdentity` — used in tool args composition (`types.ts:101-104`)
  - `HandoffWorkflowContext` — used in tool args composition (`types.ts:105`)
  - `HandoffScope` — used in tool args composition (`types.ts:106`)
  - `HandoffSuccessCriteria` — used in tool args composition (`types.ts:107`)
  - `HandoffRecord` — used in tool args composition (`types.ts:108`)
  - `HandoffResume` — used in tool args composition (`types.ts:109`)
- **Issues:**
  1. **No tests.** The handoff tool has 6 actions (create, read, list, update, validate, close) with zero test coverage. This is the most complex tool (445 LOC) with the least testing.
  2. **Upward import violation.** `src/features/handoff/handoff.ts:16` imports from `../../tools/handoff/types.js`.
  3. **Cross-feature dependency.** `src/features/handoff/handoff.ts:13` imports from `../agent-work-contract/engine/chain-executor.js` — handoff depends on agent-work-contract engine, creating a feature-to-feature coupling.
  4. **Cross-feature dependency.** `src/features/handoff/handoff.ts:14` imports from `../runtime-entry/workflow-continuity.js` — another feature coupling.
- **Evidence:**
  - Tool definition: `src/tools/handoff/tools.ts:8-53`
  - Types with 6 sub-interfaces: `src/tools/handoff/types.ts:16-109`
  - Feature logic: `src/features/handoff/handoff.ts:89-270`
  - Cross-feature deps: `src/features/handoff/handoff.ts:13-14`
  - Upward import: `src/features/handoff/handoff.ts:16`
  - Plugin wiring: `src/plugin/opencode-plugin.ts:26,130`

### 5. Journal (`hivemind_journal`)

- **Status:** BROKEN (tests failing)
- **LOC:** 196 (single flat file, no directory structure)
- **Tests:** YES — `src/tools/hivemind-journal.test.ts` (308 lines, 11 tests) — **6 of 11 FAILING**
- **Registered:** YES — catalog entry at `src/tools/index.ts:102-109`
- **Wired in plugin:** YES — `src/plugin/opencode-plugin.ts:33` imports, `src/plugin/opencode-plugin.ts:131` registers as `hivemind_journal`
- **Structural issues:**
  1. **Flat file, not directory.** Unlike all other tools (trajectory/, task/, handoff/, runtime/, doc/), journal is a single file `src/tools/hivemind-journal.ts` — no `index.ts`, no `types.ts`, no `tools.ts` separation.
  2. **Not exported from `src/tools/index.ts` barrel.** The journal tool is NOT exported via `src/tools/index.ts`. It is imported directly in the plugin from its file path. This means `import * from './tools'` will not include journal.
  3. **Test failures — 6/11 failing.** All 6 failing tests are ENOENT errors: the tool's `execute` returns success but the file is never actually written. Root cause: `src/tools/hivemind-journal.ts:149` calls `getJourneyEventsMarkdownPath(effectiveRoot, sessionId)` which uses `truncateSessionId()` to shorten the session ID to 8 chars (`test-session-journal-123` → `test-ses`), but the test at `src/tools/hivemind-journal.test.ts:43-45` constructs the expected path using the **full** session ID. The test reads from the wrong path.
  4. **Path mismatch detail:** `getJourneyEventsMarkdownPath` at `src/features/event-tracker/paths.ts:83-85` returns `${truncateSessionId(sessionId)}.md` (truncated to 8 chars). The test helper `getEventsPath` at `src/tools/hivemind-journal.test.ts:43-45` returns `${TEST_SESSION_ID}.md` (full ID). These don't match.
  5. **No types.ts separation.** Types are defined inline in the tool file (`JournalEventType`, `SessionEventPayload`, `DiagnosticPayload`, `HivemindJournalArgs`) instead of a separate `types.ts`.
- **Evidence:**
  - Tool file: `src/tools/hivemind-journal.ts:1-196`
  - Test file: `src/tools/hivemind-journal.test.ts:1-308`
  - Path function (truncates): `src/features/event-tracker/paths.ts:83-85`
  - Test helper (no truncation): `src/tools/hivemind-journal.test.ts:43-45`
  - Plugin wiring: `src/plugin/opencode-plugin.ts:33,131`
  - Catalog entry: `src/tools/index.ts:102-109`
  - Test results: 5 pass, 6 fail (all ENOENT)

---

## Dependency Map

```
hivemind_trajectory
  Tool: src/tools/trajectory/tools.ts
    → Feature: src/features/trajectory/trajectory.ts
      → Core: src/core/trajectory/index.js
      → Core: src/core/workflow-management/index.js
      → Shared: src/shared/tool-response.js, src/shared/tool-helpers.js
      → ⚠️ UPWARD: src/tools/trajectory/types.js (feature imports from tools)
    → Types: src/tools/trajectory/types.js
      → Shared: src/shared/pressure-contract.js

hivemind_task
  Tool: src/tools/task/tools.ts
    → Feature: src/features/workflow/task.ts
      → Core: src/core/workflow-management/index.js
      → Shared: src/shared/tool-helpers.js
      → ⚠️ UPWARD: src/tools/task/types.js (feature imports from tools)
    → Types: src/tools/task/types.js
      → Shared: src/shared/pressure-contract.js

hivemind_handoff
  Tool: src/tools/handoff/tools.ts
    → Feature: src/features/handoff/handoff.ts
      → Delegation: src/delegation/index.js
      → Core: src/core/trajectory/index.js
      → ⚠️ CROSS-FEATURE: src/features/agent-work-contract/engine/chain-executor.js
      → ⚠️ CROSS-FEATURE: src/features/runtime-entry/workflow-continuity.js
      → Shared: src/shared/tool-helpers.js
      → ⚠️ UPWARD: src/tools/handoff/types.js (feature imports from tools)
    → Types: src/tools/handoff/types.js
      → Shared: src/shared/pressure-contract.js

hivemind_journal
  Tool: src/tools/hivemind-journal.ts (flat file, no separation)
    → Feature: src/features/event-tracker/markdown-writer.js
    → Feature: src/features/event-tracker/paths.js
    → Shared: src/shared/tool-helpers.js
    → stdlib: node:fs/promises, node:path

hivemind_agent_work_create_contract
  Tool: src/features/agent-work-contract/tools/create-contract-tool.ts
    → Engine: src/features/agent-work-contract/engine/contract-store.js
    → Engine: src/features/agent-work-contract/engine/intent-classifier.js
    → Schema: src/features/agent-work-contract/schema/index.js
    → Shared: src/shared/tool-response.js, src/shared/tool-helpers.js

hivemind_agent_work_export_contract
  Tool: src/features/agent-work-contract/tools/export-contract-tool.ts
    → Engine: src/features/agent-work-contract/engine/contract-store.js
    → Hooks: src/features/agent-work-contract/hooks/compaction-preservation.js
    → Schema: src/features/agent-work-contract/schema/index.js
    → Shared: src/shared/tool-response.js, src/shared/tool-helpers.js

hivemind_agent_work_classify_intent (ORPHANED — not wired)
  Tool: src/features/agent-work-contract/tools/classify-intent-tool.ts
    → Engine: src/features/agent-work-contract/engine/intent-classifier.js
    → Schema: src/features/agent-work-contract/schema/index.js
    → Shared: src/shared/tool-response.js, src/shared/tool-helpers.js
```

---

## Violations Found

| # | Violation | Type | Files | Severity |
|---|-----------|------|-------|----------|
| 1 | Feature imports from tools layer (upward import) | CQRS violation | `src/features/trajectory/trajectory.ts:11`, `src/features/workflow/task.ts:12`, `src/features/handoff/handoff.ts:16`, `src/features/doc-intelligence/doc.ts:8`, `src/features/runtime-observability/status.ts:23` | HIGH |
| 2 | Orphaned tool — classify-intent not wired | Dead code | `src/features/agent-work-contract/tools/classify-intent-tool.ts` | MEDIUM |
| 3 | Journal tool not exported from tools barrel | Registration gap | `src/tools/index.ts` (missing export) | MEDIUM |
| 4 | Journal tests failing — path mismatch | Broken tests | `src/tools/hivemind-journal.test.ts:43-45` vs `src/features/event-tracker/paths.ts:83-85` | HIGH |
| 5 | Handoff has cross-feature dependencies | Coupling | `src/features/handoff/handoff.ts:13-14` | MEDIUM |
| 6 | Unnecessary async on task execute | Code quality | `src/tools/task/tools.ts:26` | LOW |
| 7 | No trajectory tests | Coverage gap | `tests/**/*trajectory*` → 0 files | MEDIUM |
| 8 | No handoff tests | Coverage gap | `tests/**/*handoff*` → 0 files | MEDIUM |
| 9 | No direct task tool/feature tests | Coverage gap | Only core layer tested | LOW |
| 10 | Journal is flat file, not directory structure | Consistency | `src/tools/hivemind-journal.ts` vs `src/tools/{trajectory,task,handoff}/` | LOW |
| 11 | No intelligence layer for trajectory/task/handoff | Architecture gap | `src/intelligence/` is doc-only | LOW |

---

## Verdict Table

| Tool | Works? | Tests? | Registered? | Needs Fix? | Priority |
|---|---|---|---|---|---|
| hivemind_trajectory | YES | NO (0 tests) | YES | YES — add tests, fix upward import | MEDIUM |
| hivemind_task | YES | PARTIAL (core only) | YES | YES — remove unnecessary async, fix upward import | LOW |
| hivemind_handoff | YES | NO (0 tests) | YES | YES — add tests, fix upward import, decouple cross-feature deps | MEDIUM |
| hivemind_journal | **NO** (tests fail) | YES (6/11 fail) | YES (catalog only) | **YES — fix path mismatch, export from barrel** | **HIGH** |
| hivemind_agent_work_create_contract | YES | YES (8 test files) | YES | NO | — |
| hivemind_agent_work_export_contract | YES | YES (8 test files) | YES | NO | — |
| hivemind_agent_work_classify_intent | YES (code) | YES (test exists) | **NO** (orphaned) | **YES — wire into plugin** | MEDIUM |

---

## Summary

**Working without issues:** `hivemind_agent_work_create_contract`, `hivemind_agent_work_export_contract` — well-tested, properly wired.

**Working but needs attention:** `hivemind_trajectory`, `hivemind_task`, `hivemind_handoff` — all functional and wired, but share the same upward import pattern (features importing types from tools), and trajectory/handoff have zero test coverage.

**Broken:** `hivemind_journal` — the tool code works at runtime (returns success), but tests fail because the test helper constructs paths with the full session ID while the actual code truncates it. The tool is also structurally inconsistent (flat file vs directory) and missing from the tools barrel export.

**Orphaned:** `hivemind_agent_work_classify_intent` — fully implemented with tests, but never wired into the plugin. Dead code at runtime.

**Systemic issue:** The upward import pattern (features → tools/types) appears in 5 feature files. This inverts the intended CQRS dependency direction where tools should depend on features, not the reverse. The types should live in the feature layer or a shared layer.
