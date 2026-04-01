# Plugins vs Custom Tools Architecture Audit — 2026-03-31

---
date: 2026-03-31
investigator: hivexplorer
branch: v2.9.5-detox-dev
commit: d48dd1b6
scope: src/plugin/, src/tools/, src/features/, src/shared/, src/hooks/, .sdk-lib/opencode/
---

## Summary

HiveMind implements a **three-layer architecture**: Plugin (assembly/wiring), Tools (LLM-facing CQRS write-side), and Features (internal business logic). The canonical pattern is: Tool → Feature → Core/Shared. This pattern is followed correctly by 7 of 10 tools. The `hivefiver-setting` tool is the primary bloat hotspot at 1,121 LOC (7 files) with upward dependency violations into `sdk-supervisor/`, `control-plane/`, and `session-entry/`. The `agent-work-contract` feature is the most complex module at 2,735 LOC (28 files) with its own embedded tool definitions, blurring the tool/feature boundary. OpenCode provides 17 plugin hooks; HiveMind actively wires 12 of them. The architecture is **not bloated overall** but has two specific modules that violate the stated ≤300 LOC/file and clean-layer boundaries.

---

## Plugin Hook Inventory

| Hook | Status | Purpose | LOC | Evidence |
|------|--------|---------|-----|----------|
| `event` | **Active** | Lifecycle event dispatch to event-handler | 257 | `src/plugin/opencode-plugin.ts:116-118` |
| `experimental.chat.system.transform` | **Active** | System prompt transformation | 257 | `src/plugin/opencode-plugin.ts:119-121` |
| `tool` (registry) | **Active** | Registers 12 custom tools | 257 | `src/plugin/opencode-plugin.ts:122-135` |
| `chat.message` | **Active** | Message handling + turn snapshot + degraded-mode toast | 257 | `src/plugin/opencode-plugin.ts:136-153` |
| `permission.ask` | **Active** | Auto-allow HiveMind managed tools, governance toast for writes | 257 | `src/plugin/opencode-plugin.ts:154-171` |
| `tool.execute.before` | **Active** | Pre-execution tool event recording | 257 | `src/plugin/opencode-plugin.ts:172-177` |
| `shell.env` | **Active** | Inject HIVEMIND_* env vars | 257 | `src/plugin/opencode-plugin.ts:178-184` |
| `command.execute.before` | **Active** | Slash command context injection + tool precedence | 257 | `src/plugin/opencode-plugin.ts:185-225` |
| `tool.execute.after` | **Active** | Post-execution handling + event recording | 257 | `src/plugin/opencode-plugin.ts:226-231` |
| `experimental.text.complete` | **Active** | Session journal text-complete handler | 257 | `src/plugin/opencode-plugin.ts:232-244` |
| `experimental.chat.messages.transform` | **Active** | Message transform handler | 257 | `src/plugin/opencode-plugin.ts:245` |
| `experimental.session.compacting` | **Active** | Compaction handler + journal handler | 257 | `src/plugin/opencode-plugin.ts:246-249` |
| `chat.params` | **Unused** | Available but not wired | — | Not in opencode-plugin.ts |
| `chat.headers` | **Unused** | Available but not wired | — | Not in opencode-plugin.ts |
| `tool.definition` | **Unused** | Available but not wired | — | Not in opencode-plugin.ts |
| `config` | **Unused** | Available but not wired | — | Not in opencode-plugin.ts |
| `auth` | **Unused** | Available but not wired | — | Not in opencode-plugin.ts |

**Plugin assembly files:** 23 files, 1,952 total LOC
- `opencode-plugin.ts`: 257 LOC (main assembly)
- `context-renderer.*`: 5 files, ~470 LOC (rendering subsystem)
- `messages-transform*.ts`: 2 files, 187 LOC
- `skill-*.ts`: 3 files, ~370 LOC
- Other adapters: 12 files, ~668 LOC

---

## Custom Tool Inventory

| Tool | Actions | LOC (tool file) | Zod? | Description Quality | Evidence |
|------|---------|-----------------|------|---------------------|----------|
| `hivemind_trajectory` | 6 (inspect, traverse, attach, checkpoint, event, close) | 49 | Yes | Clear, purpose-driven | `src/tools/trajectory/tools.ts:1-49` |
| `hivemind_task` | 7 (create, list, get, activate, rotate, verify, complete) | 42 | Yes | Clear, purpose-driven | `src/tools/task/tools.ts:1-42` |
| `hivemind_handoff` | 6 (create, read, list, update, validate, close) | 54 | Yes | Clear, purpose-driven | `src/tools/handoff/tools.ts:1-54` |
| `hivemind_doc` | 5 (skim, skim_directory, read, chunk, search) | 35 | Yes | Clear, read-only | `src/tools/doc/tools.ts:1-35` |
| `hivemind_runtime_status` | 1 (no args) | 82 (shared with command) | Yes | Minimal, clear | `src/tools/runtime/tools.ts:21-35` |
| `hivemind_runtime_command` | 1 (command dispatch) | 82 (shared with status) | Yes | Clear, warns against manual file writes | `src/tools/runtime/tools.ts:41-82` |
| `hivemind_journal` | 6 event types | 196 | Yes | Clear, CQRS write-side | `src/tools/hivemind-journal.ts:1-196` |
| `hivemind_hm_init` | 1 (init) | 78 | Yes | Placeholder, no writes | `src/tools/hivefiver-init/tools.ts:1-78` |
| `hivemind_hm_doctor` | 1 (diagnostics) | 109 | Yes | Placeholder, no writes | `src/tools/hivefiver-doctor/tools.ts:1-109` |
| `hivemind_hm_setting` | 1 (config read/propose) | 220 | Yes | Clear, but bloated with dashboard mode | `src/tools/hivefiver-setting/tools.ts:1-220` |

**Total tool directory:** 12 entries, 2,308 LOC (all .ts non-test files)

### Canonical Pattern (trajectory as reference)
```
tools/trajectory/
├── index.ts      (2 LOC — barrel export)
├── tools.ts      (49 LOC — tool definition, delegates to feature)
├── types.ts      (35 LOC — Zod-inferred types + pressure contracts)
```
This is the **canonical pattern**: thin tool → feature executor → shared helpers.

---

## Feature Module Inventory

| Feature | Files | LOC (non-test) | External Deps? | Purpose | Evidence |
|---------|-------|----------------|----------------|---------|----------|
| `agent-work-contract` | 28 | 2,735 | No | Contract state management, intent classification, chain execution | `src/features/agent-work-contract/` |
| `event-tracker` | 19 | 2,601 | No | Session journal writing, event classification, markdown output | `src/features/event-tracker/` |
| `runtime-entry` | 25 | 3,301 | No | Bootstrap, init, doctor, harness, command routing, attachment | `src/features/runtime-entry/` |
| `session-entry` | 13 | 1,049 | No | Session intake, language resolution, profile resolution, gates | `src/features/session-entry/` |
| `trajectory` | 2 | 179 | No | Trajectory action dispatcher (thin) | `src/features/trajectory/trajectory.ts` |
| `workflow` | 2 | 191 | No | Task action dispatcher (thin) | `src/features/workflow/task.ts` |
| `handoff` | 2 | 273 | No | Delegation handoff dispatcher | `src/features/handoff/handoff.ts` |
| `doc-intelligence` | 2 | 103 | No | Document intelligence dispatcher | `src/features/doc-intelligence/doc.ts` |
| `session-journal` | 4 | 175 | No | Hierarchy writer, error log, session resolver | `src/features/session-journal/` |
| `runtime-observability` | 3 | 409 | No | Runtime status snapshot, sync | `src/features/runtime-observability/` |

**Total features:** 100 files, ~11,010 LOC (non-test)

---

## Dependency Flow Analysis

### Correct Dependency Flows (CQRS-compliant)
```
Tool → Feature → Core/Shared → stdlib
```

| Tool | Imports From | Direction | Status |
|------|-------------|-----------|--------|
| trajectory/tools.ts | `../../features/trajectory/trajectory.js` | Tool→Feature | ✅ Correct |
| task/tools.ts | `../../features/workflow/task.js` | Tool→Feature | ✅ Correct |
| handoff/tools.ts | `../../features/handoff/index.js` | Tool→Feature | ✅ Correct |
| doc/tools.ts | `../../features/doc-intelligence/doc.js` | Tool→Feature | ✅ Correct |
| runtime/tools.ts | `../../features/runtime-observability/status.js` | Tool→Feature | ✅ Correct |
| hivemind-journal.ts | `../features/event-tracker/markdown-writer.js` | Tool→Feature | ✅ Correct |
| hivefiver-init/tools.ts | `../../shared/tool-response.js` | Tool→Shared | ✅ Correct |
| hivefiver-doctor/tools.ts | `../../shared/tool-response.js` | Tool→Shared | ✅ Correct |

### Upward Dependency Violations

| File | Imports From | Violation Type | Evidence |
|------|-------------|----------------|----------|
| `src/tools/hivefiver-setting/tools.ts:25` | `../../features/runtime-entry/snapshot-loader.js` | Tool→Feature (cross-cutting) | Line 25 |
| `src/tools/hivefiver-setting/tools.ts:26` | `../../sdk-supervisor/runtime-status.js` | Tool→SDK-Supervisor (layer skip) | Line 26 |
| `src/tools/hivefiver-setting/tools.ts:27` | `../../control-plane/control-plane-registry.js` | Tool→Control-Plane (layer skip) | Line 27 |
| `src/tools/hivefiver-setting/tools.ts:28` | `../../features/session-entry/intake.gates.js` | Tool→Feature (cross-cutting) | Line 28 |

**The `hivefiver-setting` tool is the ONLY tool with upward dependency violations.** It imports from 4 different layers: features, sdk-supervisor, control-plane, and session-entry. This makes it a god-tool that knows about the entire architecture.

### Feature→Tool Type Imports (Acceptable)
Features import **types only** from tools (not implementations):
- `src/features/trajectory/trajectory.ts:11` → `../../tools/trajectory/types.js` (types only)
- `src/features/workflow/task.ts:12` → `../../tools/task/types.js` (types only)
- `src/features/handoff/handoff.ts:16` → `../../tools/handoff/types.js` (types only)
- `src/features/doc-intelligence/doc.ts:8` → `../../tools/doc/types.js` (types only)

This is acceptable because types are compile-time only and don't create runtime coupling.

### Feature→Feature Dependencies
| Feature | Imports From | Evidence |
|---------|-------------|----------|
| handoff | `agent-work-contract/engine/chain-executor.js` | `src/features/handoff/handoff.ts:13` |
| handoff | `runtime-entry/workflow-continuity.js` | `src/features/handoff/handoff.ts:14` |
| runtime-observability/status | `agent-work-contract/engine/contract-store.js` | `src/features/runtime-observability/status.ts:6` |
| runtime-observability/status | `agent-work-contract/hooks/index.js` | `src/features/runtime-observability/status.ts:7` |
| runtime-observability/status | `runtime-entry/workflow-continuity.js` | `src/features/runtime-observability/status.ts:8` |

These are **internal feature-to-feature dependencies** within the same layer — acceptable but indicates `agent-work-contract` is a central hub.

### Circular Dependency Risk
- `handoff` → `agent-work-contract` → (no reverse import found) ✅ No cycle
- `runtime-observability` → `agent-work-contract` → (no reverse import found) ✅ No cycle
- No circular dependencies detected.

---

## OpenCode SDK Coverage Map

### Plugin Hooks: Used vs Available

| Hook | Available in OpenCode | Used by HiveMind | Evidence |
|------|----------------------|------------------|----------|
| `event` | ✅ | ✅ Active | `opencode-plugin.ts:116` |
| `chat.message` | ✅ | ✅ Active | `opencode-plugin.ts:136` |
| `chat.params` | ✅ | ❌ Unused | Not wired |
| `chat.headers` | ✅ | ❌ Unused | Not wired |
| `permission.ask` | ✅ | ✅ Active | `opencode-plugin.ts:154` |
| `command.execute.before` | ✅ | ✅ Active | `opencode-plugin.ts:185` |
| `tool.execute.before` | ✅ | ✅ Active | `opencode-plugin.ts:172` |
| `tool.execute.after` | ✅ | ✅ Active | `opencode-plugin.ts:226` |
| `tool.definition` | ✅ | ❌ Unused | Not wired |
| `shell.env` | ✅ | ✅ Active | `opencode-plugin.ts:178` |
| `system.transform` | ✅ | ✅ Active (as `experimental.chat.system.transform`) | `opencode-plugin.ts:119` |
| `messages.transform` | ✅ | ✅ Active (as `experimental.chat.messages.transform`) | `opencode-plugin.ts:245` |
| `session.compacting` | ✅ | ✅ Active (as `experimental.session.compacting`) | `opencode-plugin.ts:246` |
| `config` | ✅ | ❌ Unused | Not wired |
| `auth` | ✅ | ❌ Unused | Not wired |
| `text.complete` | ✅ | ✅ Active (as `experimental.text.complete`) | `opencode-plugin.ts:232` |

**Coverage: 12/17 hooks active (71%)**

### SDK Client APIs: Used vs Available

| Client API | Available | Used by HiveMind | Evidence |
|-----------|-----------|------------------|----------|
| `client.app.log()` | ✅ | ✅ Used | `src/plugin/opencode-plugin.ts` (via SDK context) |
| `client.session.*` | ✅ | ✅ Used | `src/hooks/sdk-context.ts` |
| `client.tui.*` | ✅ | ✅ Used | `src/hooks/soft-governance.ts` |
| `client.file.*` | ✅ | ❌ Not directly used | — |
| `client.find.*` | ✅ | ❌ Not directly used | — |
| `client.config.*` | ✅ | ❌ Not directly used | — |
| `client.event.subscribe()` | ✅ | ❌ Not directly used | — |

### OpenCode Events (from SDK docs)
OpenCode provides 30+ event types (session.created, session.compacted, file.edited, message.updated, etc.). HiveMind's `event-handler.ts` subscribes to these but the specific event filtering is in `src/hooks/event-handler.ts`.

---

## Bloat Analysis

### God Files (>300 LOC)

| File | LOC | Assessment | Evidence |
|------|-----|------------|----------|
| `src/features/event-tracker/consolidated-writer.ts` | 442 | **GOD FILE** — needs decomposition | `wc -l` output |
| `src/features/event-tracker/markdown-writer.ts` | 434 | **GOD FILE** — needs decomposition | `wc -l` output |
| `src/features/event-tracker/types.ts` | 380 | **GOD FILE** — type bloat | `wc -l` output |
| `src/features/runtime-entry/harness.ts` | 300 | Borderline | `wc -l` output |
| `src/tools/hivefiver-setting/spec-builder.ts` | 309 | **GOD FILE** — spec builder bloat | `wc -l` output |

### Over-Engineered Modules

| Module | Files | LOC | Canonical Ratio | Assessment |
|--------|-------|-----|-----------------|------------|
| `agent-work-contract` | 28 | 2,735 | 14× trajectory | **OVER-ENGINEERED** — has its own embedded tools, schema, engine, hooks subdirectories |
| `event-tracker` | 19 | 2,601 | 13× trajectory | **OVER-ENGINEERED** — 3 subdirectories (classifier/, parser/, writers/) for what is essentially a journal writer |
| `runtime-entry` | 25 | 3,301 | 17× trajectory | **OVER-ENGINEERED** — 25 files for bootstrap/init/harness/command routing |
| `session-entry` | 13 | 1,049 | 5× trajectory | Moderate — intake/gates/resolution is complex but justified |
| `hivefiver-setting` | 7 | 1,121 | 23× trajectory tool | **OVER-ENGINEERED** — dashboard, render, i18n, spec-builder for a config reader |

### LOC Ratio vs Canonical Pattern (trajectory = 86 LOC total)

| Module | Total LOC | Ratio to Canonical | Verdict |
|--------|-----------|-------------------|---------|
| trajectory (tool+feature) | 86 + 179 = 265 | 1.0× | Canonical |
| task (tool+feature) | 77 + 191 = 268 | 1.0× | Canonical |
| handoff (tool+feature) | 174 + 273 = 447 | 1.7× | Acceptable |
| doc (tool+feature) | 59 + 103 = 162 | 0.6× | Lean |
| runtime (tool+feature) | 202 + 409 = 611 | 2.3× | Acceptable |
| journal (tool only) | 196 | 0.7× | Lean |
| init (tool only) | 107 | 0.4× | Placeholder |
| doctor (tool only) | 150 | 0.6× | Placeholder |
| setting (tool only) | 1,121 | 4.2× | **BLOATED** |
| agent-work-contract (feature) | 2,735 | 10.3× | **BLOATED** |
| event-tracker (feature) | 2,601 | 9.8× | **BLOATED** |
| runtime-entry (feature) | 3,301 | 12.5× | **BLOATED** |

### God Interfaces (>10 fields)

| Interface | Fields | File | Evidence |
|-----------|--------|------|----------|
| `HivemindHandoffToolArgs` | 20+ fields | `src/tools/handoff/types.ts` | Lines 1-118 |
| `HivemindRuntimeCommandArgs` | 14+ fields | `src/tools/runtime/types.ts` | Lines 1-111 |
| `HmSettingResult` | 8+ fields + nested | `src/tools/hivefiver-setting/types.ts` | Lines 1-205 |
| `AgentWorkContract` (schema) | 10+ fields | `src/features/agent-work-contract/schema/contract.ts` | Lines 1-244 |

---

## External Dependency Map

### package.json Dependencies (17 total)

| Dependency | Type | Used By | Purpose |
|-----------|------|---------|---------|
| `@opencode-ai/plugin` | peer | All tools/hooks | Plugin SDK |
| `@opencode-ai/sdk` | dep | SDK context, supervisor | OpenCode client |
| `zod` | dep | All tools | Schema validation |
| `fast-glob` | dep | doc-intelligence, paths | File pattern matching |
| `ignore` | dep | doc-intelligence | .gitignore handling |
| `yaml` | dep | config-groups, settings | YAML parsing |
| `remark` | dep | doc-intelligence | Markdown AST parsing |
| `unist-util-visit` | dep | doc-intelligence | AST traversal |
| `magic-string` | dep | system-transform | Source manipulation |
| `web-tree-sitter` | dep | intelligence | Code parsing |
| `proper-lockfile` | dep | event-tracker | File locking |
| `@types/proper-lockfile` | dep | event-tracker | Type definitions |
| `@clack/prompts` | dep | CLI | Terminal prompts |
| `@json-render/*` (3 pkgs) | dep | setting dashboard | JSON→React rendering |
| `ink` | dep | setting dashboard | Terminal UI |
| `just-bash` | dep | runtime-command | Shell execution |
| `@z_ai/coding-helper` | dep | UNVERIFIED | Unknown |
| `typescript` | dep | Build | Compiler |

### Self-Sustaining Features (no external deps beyond stdlib + shared) 

| Feature | External Deps | Status |
|---------|--------------|--------|
| `trajectory` | None (stdlib only) | ✅ Self-sustaining |
| `workflow` | None (stdlib only) | ✅ Self-sustaining |
| `handoff` | None (stdlib only) | ✅ Self-sustaining |
| `session-journal` | None (stdlib only) | ✅ Self-sustaining |

### Features Requiring External Packages

| Feature | External Deps | Required For |
|---------|--------------|--------------|
| `doc-intelligence` | `remark`, `unist-util-visit`, `fast-glob`, `ignore` | Markdown parsing |
| `event-tracker` | `proper-lockfile` | File locking for journal writes |
| `runtime-entry` | `@clack/prompts`, `yaml` | CLI prompts, config parsing |
| `session-entry` | `yaml` | Config parsing |
| `runtime-observability` | `@json-render/*`, `ink` (via setting tool) | Dashboard rendering |
| `agent-work-contract` | None directly | ✅ Self-sustaining |

---

## Verified Facts

1. **Plugin assembly is clean** — `opencode-plugin.ts` (257 LOC) imports hooks and tools, registers them, exports Plugin. No business logic. `src/plugin/opencode-plugin.ts:1-257`
2. **12 of 17 OpenCode hooks are actively wired** — 5 hooks (`chat.params`, `chat.headers`, `tool.definition`, `config`, `auth`) are available but unused. `src/plugin/opencode-plugin.ts:115-250`
3. **12 custom tools are registered** in the plugin's `tool` object. `src/plugin/opencode-plugin.ts:122-135`
4. **7 tools follow the canonical pattern** (thin tool → feature executor → shared). `src/tools/{trajectory,task,handoff,doc,runtime,hivefiver-init,hivefiver-doctor}/tools.ts`
5. **`hivefiver-setting` tool has 4 upward dependency violations** importing from features, sdk-supervisor, control-plane, and session-entry. `src/tools/hivefiver-setting/tools.ts:25-28`
6. **`hivefiver-setting` is 1,121 LOC across 7 files** — 23× the canonical tool size. `wc -l` output
7. **`agent-work-contract` feature is 2,735 LOC across 28 files** with its own embedded tool definitions (`tools/create-contract-tool.ts`, `tools/export-contract-tool.ts`, `tools/classify-intent-tool.ts`). `src/features/agent-work-contract/`
8. **`event-tracker` feature is 2,601 LOC across 19 files** with 3 god files (>300 LOC). `src/features/event-tracker/`
9. **`runtime-entry` feature is 3,301 LOC across 25 files** — the largest feature module. `src/features/runtime-entry/`
10. **No circular dependencies detected** between tools and features.
11. **Features import types from tools** (compile-time only) — acceptable pattern. `src/features/trajectory/trajectory.ts:11`
12. **`hivemind_hm_init` and `hivemind_hm_doctor` are placeholders** — they return proposed changes without writing. `src/tools/hivefiver-init/tools.ts:4`, `src/tools/hivefiver-doctor/tools.ts:6`
13. **`hivemind_journal` is the ONLY write-side tool** — all other tools are read/dispatch. `src/tools/hivemind-journal.ts:5`
14. **No features import from tools at runtime** — only type imports. Verified by grep.
15. **`src/tools/index.ts` exports a catalog** (`agentToolCatalog`) with metadata for all 12 tools including pressure contracts. `src/tools/index.ts:28-137`
16. **5 god files exceed 300 LOC**: `consolidated-writer.ts` (442), `markdown-writer.ts` (434), `types.ts` (380), `harness.ts` (300), `spec-builder.ts` (309).
17. **External dependencies are minimal** — 17 total, most are for doc-intelligence (markdown parsing) and CLI (prompts).
18. **The `dashboard-v2/` directory is a dead stub** — empty, should be removed. `AGENTS.md` Layer Architecture table

---

## Architecture Recommendations

### What Should Be a Plugin Hook
- **Current state is correct.** The 12 active hooks cover the necessary interception points: event lifecycle, message handling, tool execution (before/after), permission gating, shell environment, command context, text completion, message transform, and compaction.
- **Unused hooks** (`chat.params`, `chat.headers`, `tool.definition`, `config`, `auth`) are not needed for HiveMind's governance scope.

### What Should Be a Custom Tool
- **Keep as tools:** trajectory, task, handoff, doc, runtime (status + command), journal, init, doctor — these follow the canonical pattern correctly.
- **Refactor `hivefiver-setting`:** Split into 2-3 tools:
  - `hivemind_hm_setting` — config read/propose only (≤100 LOC)
  - `hivemind_hm_dashboard` — dashboard rendering (separate tool, moves dashboard.ts, render.ts, spec-builder.ts out)
  - Remove upward dependencies by having the dashboard tool import from a shared presentation layer, not from features directly.

### What Should Be a Feature Module
- **Keep as features:** trajectory, workflow, handoff, doc-intelligence, session-journal, runtime-observability — these are thin dispatchers.
- **Decompose `agent-work-contract`:** The embedded tools (`create-contract-tool.ts`, `export-contract-tool.ts`) should move to `src/tools/agent-work/` to maintain the tool/feature boundary. The feature should contain only business logic (engine, schema, hooks).
- **Decompose `event-tracker`:** Split into `event-classifier/` (classification logic), `event-writer/` (markdown writing), and `event-parser/` (parsing). Each should be ≤200 LOC.
- **Decompose `runtime-entry`:** This is the largest module. Split into: `bootstrap/` (init, doctor), `attachment/` (runtime binding), `command-routing/` (harness, nl-first-dispatch), and `continuity/` (workflow-continuity).

### What Should Be External
- **`@json-render/*` and `ink`** are only used by `hivefiver-setting` dashboard. Consider making the dashboard an optional feature that only loads when the dependency is available.
- **`web-tree-sitter`** is heavy (code parsing). Only used by intelligence layer. Verify it's actually needed or if simpler regex/glob approaches suffice.

### Hard-Wiring Defaults
The user's concern about "fragile OpenCode innate concepts" is valid. The current architecture handles this correctly by:
1. **Not importing OpenCode's internal modules** — only using the public plugin SDK (`@opencode-ai/plugin`)
2. **Wrapping all OpenCode interactions** through the plugin assembly layer
3. **Providing fallback defaults** in `src/shared/` (paths, contracts, injection)

The risk areas are:
- `hivefiver-setting` imports from `control-plane/` and `sdk-supervisor/` — these are HiveMind's own layers, not OpenCode's, so this is acceptable but should be documented.
- The `experimental.*` hook names may change in future OpenCode versions. Monitor for breaking changes.

---

## Open Questions

1. **`@z_ai/coding-helper` dependency** — What is this package? It's listed in dependencies but no import was found in the codebase. May be dead dependency.
2. **`dashboard-v2/` dead stub** — AGENTS.md marks it as "DEAD STUB — empty, remove." Why hasn't it been removed? Is there a migration plan?
3. **`workflows/` directory** — AGENTS.md says "ALL LEGACY/NOISE — disconnected from build." 22 files of dead code. Should be removed.
4. **Placeholder tools** — `hivemind_hm_init` and `hivemind_hm_doctor` are explicitly marked as placeholders. What is the timeline for implementing actual logic?
5. **`agent-work-contract` embedded tools** — Why are `create-contract-tool.ts` and `export-contract-tool.ts` in `features/` instead of `tools/`? This breaks the stated CQRS boundary.
6. **`event-tracker` god files** — `consolidated-writer.ts` (442 LOC) and `markdown-writer.ts` (434 LOC) are the two largest feature files. What decomposition strategy would preserve their behavior while reducing complexity?
7. **Pressure contracts** — Every tool action has a `pressureContract` attached. Is this actually used at runtime or is it metadata-only? The `getRuntimePressureContract()` calls in `src/tools/index.ts` suggest it's used for governance decisions.

---

*Investigation conducted at commit `d48dd1b6` on branch `v2.9.5-detox-dev`. All file paths are relative to project root `/Users/apple/hivemind-plugin/.worktrees/product-detox/`. LOC counts exclude `.test.ts` files.*
