# ses_2bbc

**Session ID:** ses_2bbc
**Created:** 3/31/2026, 9:14:32 PM
**Updated:** 3/31/2026, 9:15:22 PM

---

## Table of Contents

| # | Timestamp | Actor | Tools | Summary |
|---|-----------|-------|-------|---------|

---
## User



---
**Tool:** skill

**Input:**
```json
{"name":"use-hivemind"}
```

**Output:**
```
<skill_content name="use-hivemind">
# Skill: use-hivemind

# use-hivemind

## Purpose

Resolve one question before any action: "Am I the orchestrator or an executor?" Then gate project validity. Then route.

## GATE 0: Role Lineage Detection

Check ONE signal: does this agent receive instructions from a human, or from a delegation packet?

| Signal | Orchestrator | Executor |
|--------|-------------|----------|
| Prompt source | Human user directly | Delegation packet from another agent |
| Session type | Primary session | Sub-session (delegated) |
| context.ask() | Available (human in loop) | Not available (autonomous within bounds) |

Resolution rules:
1. Human prompt + context.ask() available → ORCHESTRATOR
2. Pre-defined scope + return contract → EXECUTOR
3. Ambiguous signal → assume ORCHESTRATOR (safer default)
4. Executor signal but no packet → BLOCK, escalate

Load exactly ONE reference after resolution:

| Role | Load |
|------|------|
| Orchestrator | `references/orchestrator-entry.md` |
| Executor | `references/executor-entry.md` |

## GATE 1: Project Validity

Run: `node scripts/hm-entry-gate.cjs --cwd <project-root>`

Exit code 0, PASS → proceed.
Exit code 0, DEGRADED → proceed with caution. Log soft warnings.
Exit code 1, FAIL → STOP. Report failures. Do not proceed.

Run GATE 1 once per session start (or when context feels uncertain). Not every turn.

## Post-Gate Routing

After GATE 0 + GATE 1 resolve, load routing and intelligence references:

### Protocol References (loaded by both branches)

| File | Contains |
|------|----------|
| `references/agent-roles.md` | Per-agent capability matrix for routing resolution |
| `references/role-boundaries.md` | Session positioning, lineage detection, delegation thresholds |
| `references/domain-coupling-map.md` | Intent → specialist → depth reference routing table |

### Intelligence References (loaded after routing)

| File | Contains |
|------|----------|
| `references/project-state-awareness.md` | Phase detection, blockage signals, doc trustworthiness, distrust levels |
| `references/task-classification.md` | Request type classification matrix with routing targets |
| `references/session-state.md` | Session continuity: fresh, resume, post-compaction tracking |

### Templates

| File | Contains |
|------|----------|
| `templates/load-template.md` | Dynamic batch loading templates for common workflows |

### Scripts

| File | Contains |
|------|----------|
| `scripts/hm-entry-gate.cjs` | Universal project validity gate (6 gates, zero deps) |

## Turn Loop

Re-enter GATE 0 every turn. Do not carry state between turns except what the orchestrator persists via git memory.

```
Turn start → GATE 0 → Load role reference → Follow role protocol → Turn end
                                                                      │
                                                Next turn → GATE 0 ──┘
```

## Hard Blocks

- Skip GATE 0 → BLOCK
- Load BOTH branch references → BLOCK
- Act before role resolved → BLOCK
- Executor loading governance content → BLOCK
- Proceed past GATE 1 when script fails → BLOCK

## Platform

Framework-agnostic. Works in OpenCode, Claude Code, Cursor, Gemini CLI, and any agent system that supports skill loading. Platform-specific behaviors handled by the platform layer, not by this skill.

## Independence Rules

- No implementation — routes only
- No deep reads — context assessment is shallow
- No mutation — never writes files, modifies state, or commits
- No how-to-implement — delegates process guidance only

Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/templates/load-template.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/scripts/hm-entry-gate.cjs</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-rot-defense.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-self-assessment.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/verification-before-completion.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-entry.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/task-classification.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/intent-classification.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-health-protocol.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/agent-roles.md</file>
</skill_files>
</skill_content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/tool-source-inventory-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/tool-source-inventory-2026-03-31.md</path>
<type>file</type>
<content>1: # HiveMind Tool Source Inventory
2: 
3: **Generated:** 2026-03-31  
4: **Investigation Scope:** All custom tool files in `src/tools/` and `src/features/*/tools/`
5: 
6: ---
7: 
8: ## Tool Inventory Table
9: 
10: | Tool Name | File Path | LOC | Actions/Enums | Field Count | Uses tool.schema | Has Feature Layer | Has Tests |
11: |-----------|-----------|-----|---------------|-------------|------------------|-------------------|-----------|
12: | hivemind_doc | src/tools/doc/tools.ts | 35 | action: `skim, skim_directory, read, chunk, search` | 7 | YES | YES (doc-intelligence) | NO |
13: | hivemind_task | src/tools/task/tools.ts | 42 | action: `create, list, get, activate, rotate, verify, complete`<br>kind: `task, subtask` | 9 | YES | YES (workflow) | NO |
14: | hivemind_trajectory | src/tools/trajectory/tools.ts | 49 | action: `inspect, traverse, attach, checkpoint, event, close`<br>lineage: `hivefiver, hiveminder`<br>purposeClass: `discovery, brainstorming, research, planning, implementation, gatekeeping, tdd, course-correction`<br>kind: `summary, handoff, evidence, transition, note` | 13 | YES | YES (trajectory) | NO |
15: | hivemind_handoff | src/tools/handoff/tools.ts | 54 | action: `create, read, list, update, validate, close` | 22 | YES | YES (handoff) | NO |
16: | hivemind_runtime_status | src/tools/runtime/tools.ts | 82 | (none) | 0 | YES | YES (runtime-observability) | NO |
17: | hivemind_runtime_command | src/tools/runtime/tools.ts | 82 | presetId: `guided-onboarding`<br>requestedSettingsGroups: `identity-language, expertise-style, governance-automation`<br>intakeEvidence.source: `question-tool, cli-flags, runtime-tool, preset`<br>questionnaireId: `bootstrap-profile-v1, settings-profile-v1` | 13 | YES | YES (runtime-observability) | NO |
18: | hivemind_journal | src/tools/hivemind-journal.ts | 196 | eventType: `assistant_output, user_message, tool_call, compaction, trajectory, diagnostic` | 4 | YES | YES (event-tracker) | YES |
19: | hivemind_hm_init | src/tools/hivefiver-init/tools.ts | 78 | mode: `greenfield, brownfield, auto` | 2 | YES | NO | NO |
20: | hivemind_hm_doctor | src/tools/hivefiver-doctor/tools.ts | 109 | scope: `all, skills, agents, config, paths` | 2 | YES | NO | NO |
21: | hivemind_hm_setting | src/tools/hivefiver-setting/tools.ts | 220 | group: `language, expertise, governance, operation-mode, all`<br>renderMode: `json, tui` | 6 | YES | NO | NO |
22: | hivemind_agent_work_create_contract | src/features/agent-work-contract/tools/create-contract-tool.ts | 155 | action: `create, update`<br>responseMode: `broad-search-execute, interactive-qa, deep-research`<br>workflow.tasks.status: `pending, active, delegated, verifying, complete`<br>delegationMode: `parallel, sequential, handoff`<br>chainActions: `export-workflow, next-task, close, export-contract, archive, export-messages, handoff-packet, launch-context-agent, export-summary`<br>anchors.kind: `workflow-shift, planning-shift, stage-shift, user-redirect` | 10 | YES | YES (feature IS agent-work-contract) | YES |
23: | hivemind_agent_work_export_contract | src/features/agent-work-contract/tools/export-contract-tool.ts | 67 | format: `contract, summary` | 2 | YES | YES (feature IS agent-work-contract) | YES |
24: | hivemind_agent_work_classify_intent | src/features/agent-work-contract/tools/classify-intent-tool.ts | 50 | (none) | 1 | YES | YES (feature IS agent-work-contract) | YES |
25: 
26: ---
27: 
28: ## Summary Statistics
29: 
30: - **Total Tool Files:** 13
31: - **Total LOC:** 1,087
32: - **Tools using tool.schema:** 13 (100%)
33: - **Tools with feature layer:** 10 (77%)
34: - **Tools with tests:** 4 (31%)
35: 
36: ---
37: 
38: ## Tool Catalog Reference (src/tools/index.ts)
39: 
40: The following tools are registered in the catalog:
41: 
42: 1. `hivemind_doc` → doc tools.ts
43: 2. `hivemind_task` → task/tools.ts
44: 3. `hivemind_trajectory` → trajectory/tools.ts
45: 4. `hivemind_handoff` → handoff/tools.ts
46: 5. `hivemind_runtime_status` → runtime/tools.ts
47: 6. `hivemind_runtime_command` → runtime/tools.ts
48: 7. `hivemind_agent_work_create_contract` → create-contract-tool.ts
49: 8. `hivemind_agent_work_export_contract` → export-contract-tool.ts
50: 9. `hivemind_journal` → hivemind-journal.ts
51: 10. `hivemind_hm_init` → hivefiver-init/tools.ts
52: 11. `hivemind_hm_doctor` → hivefiver-doctor/tools.ts
53: 12. `hivemind_hm_setting` → hivefiver-setting/tools.ts
54: 
55: **Note:** The classify-intent tool is not in the main catalog but exists in the feature layer.
56: 
57: ---
58: 
59: ## Detailed Findings
60: 
61: ### Feature Layer Tools (imports from src/features/)
62: 
63: | Tool File | Imports From |
64: |-----------|-------------|
65: | doc/tools.ts | ../../features/doc-intelligence/doc.js |
66: | task/tools.ts | ../../features/workflow/task.js |
67: | trajectory/tools.ts | ../../features/trajectory/trajectory.js |
68: | handoff/tools.ts | ../../features/handoff/index.js |
69: | runtime/tools.ts | ../../features/runtime-observability/status.js |
70: | hivemind-journal.ts | ../features/event-tracker/markdown-writer.js |
71: | create-contract-tool.ts | (feature IS agent-work-contract) |
72: | export-contract-tool.ts | (feature IS agent-work-contract) |
73: | classify-intent-tool.ts | (feature IS agent-work-contract) |
74: 
75: ### Tools WITHOUT Feature Layer
76: 
77: | Tool File | Notes |
78: |-----------|-------|
79: | hivefiver-init/tools.ts | Placeholder - detects project state |
80: | hivefiver-doctor/tools.ts | Placeholder - diagnostics shell |
81: | hivefiver-setting/tools.ts | Uses shared/config-groups.js |
82: 
83: ### Test Coverage
84: 
85: | Tool | Test File Location |
86: |------|-------------------|
87: | hivemind_journal | src/tools/hivemind-journal.test.ts |
88: | create-contract-tool | src/features/agent-work-contract/tools/create-contract-tool.test.ts |
89: | export-contract-tool | src/features/agent-work-contract/tools/export-contract-tool.test.ts |
90: | classify-intent-tool | src/features/agent-work-contract/tools/classify-intent-tool.test.ts |

(End of file - total 90 lines)
</content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node1-doc-tool-chain-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node1-doc-tool-chain-2026-03-31.md</path>
<type>file</type>
<content>1: ---
2: investigation: doc-tool-chain
3: agent: hivexplorer
4: date: 2026-03-31
5: commit: d351aecf
6: scope: "Trace hivemind_doc tool full execution chain: tool definition -> handler -> feature layer -> intelligence layer"
7: status: complete
8: ---
9: 
10: # Codebase Investigation Report: `hivemind_doc` Tool Execution Chain
11: 
12: **Scope:** Full execution chain from tool definition through feature layer to intelligence layer
13: **Question:** What are the exact action enums, schema fields, layer connections, write capabilities, and layer connectivity for `hivemind_doc`?
14: **Commit:** `d351aecf`
15: **Date:** 2026-03-31
16: 
17: ---
18: 
19: ## FINDINGS
20: 
21: ### FINDING 1: Action Enums
22: 
23: **5 read-only actions defined as a TypeScript union type and mirrored in Zod enum schema.**
24: 
25: | Action | Defined At | Evidence |
26: |--------|-----------|----------|
27: | `skim` | `src/tools/doc/types.ts:4` | `export type HivemindDocAction = 'skim' \| 'skim_directory' \| 'read' \| 'chunk' \| 'search'` |
28: | `skim_directory` | `src/tools/doc/types.ts:4` | same line |
29: | `read` | `src/tools/doc/types.ts:4` | same line |
30: | `chunk` | `src/tools/doc/types.ts:4` | same line |
31: | `search` | `src/tools/doc/types.ts:4` | same line |
32: 
33: Zod mirror at `src/tools/doc/tools.ts:16`:
34: ```typescript
35: action: s.enum(['skim', 'skim_directory', 'read', 'chunk', 'search'])
36: ```
37: 
38: All 5 actions have pressure contracts at `src/tools/doc/types.ts:16-21`, all set to `'steady-state'`.
39: 
40: ### FINDING 2: Schema Fields
41: 
42: **6 fields defined in Zod schema and TypeScript interface.**
43: 
44: | Field | Zod Type | TS Type | Required | Evidence |
45: |-------|----------|---------|----------|----------|
46: | `action` | `s.enum(...)` | `HivemindDocAction` | YES | `tools.ts:16`, `types.ts:7` |
47: | `filePath` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:17`, `types.ts:8` |
48: | `dirPath` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:18`, `types.ts:9` |
49: | `heading` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:19`, `types.ts:10` |
50: | `maxTokens` | `s.number().int().positive().optional()` | `number \| undefined` | NO | `tools.ts:20`, `types.ts:11` |
51: | `query` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:21`, `types.ts:12` |
52: | `globFilter` | `s.string().optional()` | `string \| undefined` | NO | `tools.ts:22`, `types.ts:13` |
53: 
54: ### FINDING 3: Layer Chain — Tool -> Feature -> Intelligence
55: 
56: **Three-layer architecture, fully connected. No broken links.**
57: 
58: ```
59: Layer 1: Tool Definition        src/tools/doc/tools.ts (35 LOC)
60:          │  imports executeHivemindDocAction from features
61:          │  imports error/success from shared/tool-response
62:          │  imports renderToolResult from shared/tool-helpers
63:          │  imports HivemindDocToolArgs from ./types
64:          │
65:          ▼  (tools.ts:3 → features/doc-intelligence/doc.js)
66: Layer 2: Feature Dispatcher      src/features/doc-intelligence/doc.ts (102 LOC)
67:          │  imports skimDocument, readSection, searchDocuments,
68:          │          skimDirectory, readChunked from intelligence/doc
69:          │  imports docActionPressureContracts, HivemindDocToolArgs from tools/doc/types
70:          │
71:          ▼  (doc.ts:1-7 → intelligence/doc/index.js)
72: Layer 3: Intelligence Operations  src/intelligence/doc/read-ops.ts (151 LOC)
73:          │  imports from node:fs/promises (readFile, readdir)
74:          │  imports from ./formats/md.js (5 functions)
75:          │  imports from ./safety.js (3 functions)
76:          │  imports types from ./types.js
77:          │
78:          ▼
79: Layer 3a: Markdown Parser         src/intelligence/doc/formats/md.ts (177 LOC)
80:           imports remark, unist-util-visit, mdast types
81: ```
82: 
83: **Complete import chain:**
84: ```
85: tools.ts:3   → '../../features/doc-intelligence/doc.js'        (feature layer)
86: doc.ts:1-7   → '../../intelligence/doc/index.js'               (intelligence layer)
87: read-ops.ts  → './formats/md.js'                               (markdown parser)
88: read-ops.ts  → './safety.js'                                   (path safety)
89: ```
90: 
91: ### FINDING 4: H-A Verdict — Write Operations Absent (CONFIRMED)
92: 
93: **H-A: "Doc tool lost all write operations during migration" — VERDICT: ALL OPERATIONS ARE READ-ONLY BY DESIGN**
94: 
95: Evidence:
96: - `src/tools/doc/tools.ts:13` — description explicitly states "Read-only document intelligence"
97: - `src/tools/doc/tools.ts:16` — action enum contains only: `skim`, `skim_directory`, `read`, `chunk`, `search`
98: - `src/intelligence/doc/read-ops.ts:1` — imports only `readFile` and `readdir` from `node:fs/promises` (no `writeFile`, `mkdir`, `appendFile`, etc.)
99: - `src/intelligence/doc/safety.ts` — contains `safePath()` which ONLY resolves and validates paths for reading
100: - No file in the entire chain imports or uses any write-capable Node.js API
101: 
102: **Assessment:** This is not "lost write operations" — the tool was designed as read-only from the ground up. The action names (`skim`, `read`, `chunk`, `search`) are all read semantics. There is zero write capability anywhere in the chain. The phrase "lost during migration" in H-A is misleading — no write capability ever existed in this tool's current form.
103: 
104: ### FINDING 5: H-B Verdict — Feature Layer Is CONNECTED (NOT disconnected)
105: 
106: **H-B: "Feature layer is disconnected from tool" — VERDICT: FULLY CONNECTED**
107: 
108: Evidence of connection:
109: - `src/tools/doc/tools.ts:3` — `import { executeHivemindDocAction } from '../../features/doc-intelligence/doc.js'`
110: - `src/tools/doc/tools.ts:25` — `const result = await executeHivemindDocAction(projectRoot, args)` (direct invocation)
111: - `src/features/doc-intelligence/doc.ts:1-7` — imports 5 functions from intelligence layer
112: - `src/features/doc-intelligence/doc.ts:22-101` — dispatches to all 5 intelligence operations based on `args.action`
113: 
114: **Every action in the enum has a corresponding handler in the feature layer:**
115: 
116: | Action | Feature Handler | Intelligence Function | Evidence |
117: |--------|----------------|----------------------|----------|
118: | `skim` | `doc.ts:28-43` | `skimDocument()` | `read-ops.ts:63-74` |
119: | `skim_directory` | `doc.ts:45-56` | `skimDirectory()` | `read-ops.ts:76-85` |
120: | `read` | `doc.ts:58-73` | `readSection()` | `read-ops.ts:87-91` |
121: | `chunk` | `doc.ts:75-86` | `readChunked()` | `read-ops.ts:93-106` |
122: | `search` | `doc.ts:88-101` | `searchDocuments()` | `read-ops.ts:108-151` |
123: 
124: ---
125: 
126: ## STRUCTURE MAP
127: 
128: ```
129: src/tools/doc/
130: ├── tools.ts              (35 LOC) — Tool factory, Zod schema, execute handler
131: └── types.ts              (22 LOC) — HivemindDocAction type, HivemindDocToolArgs interface, pressure contracts
132: 
133: src/features/doc-intelligence/
134: ├── doc.ts               (102 LOC) — Feature dispatcher: validates args, calls intelligence ops
135: └── index.ts               (1 LOC) — Re-export barrel
136: 
137: src/intelligence/doc/
138: ├── index.ts               (3 LOC) — Re-export barrel (router + types + read-ops)
139: ├── doc-surface-router.ts (39 LOC) — Maps PurposeClass to DocKnowledgeSurface (NOT used by tool chain)
140: ├── types.ts              (29 LOC) — HeadingHierarchy, DocumentChunk, DocumentSkim, DocumentSearchResult
141: ├── read-ops.ts          (151 LOC) — Core read operations: skimDocument, skimDirectory, readSection, readChunked, searchDocuments
142: ├── safety.ts            (22 LOC)  — Path traversal protection, markdown detection, relative path resolution
143: └── formats/
144:     └── md.ts            (177 LOC) — Remark-based markdown parsing: outline, metadata, section extraction, chunking
145: 
146: Total: 581 LOC across 10 files
147: ```
148: 
149: ---
150: 
151: ## PATTERNS FOUND
152: 
153: 1. **Three-layer CQRS read-side compliance**: Tool (LLM interface) -> Feature (dispatch/validation) -> Intelligence (pure operations). No layer crosses write boundaries.
154: 2. **Path safety enforcement**: All file paths go through `safePath()` (`safety.ts:5-14`) which prevents path traversal attacks.
155: 3. **Pressure contracts on every action**: All 5 actions have `steady-state` pressure contracts (`types.ts:16-21`).
156: 4. **Remark-based parsing**: The intelligence layer uses `remark` + `unist-util-visit` for AST-based markdown parsing (`formats/md.ts:1-3`).
157: 5. **Barrel exports**: Both `features/doc-intelligence/index.ts` and `intelligence/doc/index.ts` are re-export barrels.
158: 
159: ---
160: 
161: ## GAPS
162: 
163: 1. **`doc-surface-router.ts` is ORPHANED from the tool chain.** It exports `resolveDocKnowledgeSurfaces()` and `DocKnowledgeSurface` but these are NOT imported by the tool, the feature layer, or `read-ops.ts`. The intelligence layer's `index.ts` re-exports it, but nothing in the doc tool chain consumes it. This file appears to serve a different system (session routing) and was placed in this directory for organizational proximity, not for use by the doc tool.
164: 
165: 2. **No `write` / `update` / `create` / `delete` actions exist.** The tool is purely read-only. If the tool ever needs to support doc mutations, a new action enum and handler chain would need to be added.
166: 
167: ---
168: 
169: ## BLOCKED
170: 
171: None. All 10 files in the chain were read and analyzed successfully. No contradictions found between schema definitions and handler implementations.

(End of file - total 171 lines)
</content>
```

---
## Assistant (Assistant · unknown)

_Thinking:_

I'll start by loading the mandatory governance skill and then reading all the investigation reports to frame a proper plan before delegating.

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node5b-journal-contract-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node5b-journal-contract-2026-03-31.md</path>
<type>file</type>
<content>1: # Node 5b: Journal and Contract Tools — Structural Anomalies
2: 
3: **Date:** 2026-03-31
4: **Scope:** Two structural anomalies in HiveMind tool architecture
5: **Agent:** hivexplorer (Terminal Repository Investigator)
6: **Status:** Complete
7: 
8: ---
9: 
10: ## FINDING 1: hivemind_journal — Flat File, No Barrel Export, Direct Registration
11: 
12: **Anomaly Type:** Registration bypass of barrel export pattern
13: 
14: ### Evidence
15: 
16: | Aspect | Detail | File:Line |
17: |--------|--------|-----------|
18: | File location | Flat file at `src/tools/hivemind-journal.ts` (not in subdirectory) | `src/tools/hivemind-journal.ts:1` |
19: | LOC count | 196 lines | `wc -l` output |
20: | Barrel export | **NOT exported** from `src/tools/index.ts` | `src/tools/index.ts:1-137` (no import/export of hivemind-journal) |
21: | Direct import | Imported directly in plugin | `src/plugin/opencode-plugin.ts:33` |
22: | Registration | Registered directly in plugin tool map | `src/plugin/opencode-plugin.ts:131` |
23: | Catalog entry | Listed in `agentToolCatalog` | `src/tools/index.ts:102-109` |
24: 
25: ### Event Type Enum Values
26: 
27: ```typescript
28: // src/tools/hivemind-journal.ts:26-32
29: type JournalEventType =
30:   | 'assistant_output'
31:   | 'user_message'
32:   | 'tool_call'
33:   | 'compaction'
34:   | 'trajectory'
35:   | 'diagnostic'
36: ```
37: 
38: ### Schema Fields
39: 
40: ```typescript
41: // src/tools/hivemind-journal.ts:67-87
42: {
43:   sessionId: string (required),
44:   eventType: enum['assistant_output', 'user_message', 'tool_call', 'compaction', 'trajectory', 'diagnostic'],
45:   payload: object {
46:     actor?: string,
47:     title?: string,
48:     summary?: string,
49:     details?: string,
50:     level?: string,      // for diagnostic events
51:     source?: string,     // for diagnostic events
52:     message?: string,    // for diagnostic events
53:   },
54:   timestamp: string (required)
55: }
56: ```
57: 
58: ### Registration Anomaly Analysis
59: 
60: The journal tool follows a **different registration pattern** than other tools:
61: 
62: 1. **Canonical pattern** (trajectory, task, handoff, runtime, doc): Tools live in subdirectories with barrel exports (`src/tools/trajectory/index.ts`, `src/tools/task/index.ts`, etc.)
63: 2. **Journal pattern**: Flat file directly imported by plugin, bypassing the barrel export system
64: 3. **Catalog registration**: Despite no barrel export, it's listed in `agentToolCatalog` at `src/tools/index.ts:102-109` with `contractFile: 'src/tools/hivemind-journal.ts'`
65: 
66: **Why this works:** The plugin directly imports `createHivemindJournalTool` from `'../tools/hivemind-journal.js'` at line 33, bypassing the barrel export. The tool still functions because the import path is correct, but this breaks the architectural convention.
67: 
68: ---
69: 
70: ## FINDING 2: create-contract-tool — Feature-Local Tool with Complex Schema
71: 
72: **Anomaly Type:** Tool definition lives in `src/features/` instead of `src/tools/`
73: 
74: ### Evidence
75: 
76: | Aspect | Detail | File:Line |
77: |--------|--------|-----------|
78: | File location | `src/features/agent-work-contract/tools/create-contract-tool.ts` | `src/features/agent-work-contract/tools/create-contract-tool.ts:1` |
79: | LOC count | 155 lines | `wc -l` output |
80: | Barrel export | Exported from feature-local barrel | `src/features/agent-work-contract/tools/index.ts:8-11` |
81: | Plugin import | Imported from feature path | `src/plugin/opencode-plugin.ts:21-23` |
82: | Catalog entry | Listed in `agentToolCatalog` | `src/tools/index.ts:84-91` |
83: 
84: ### Action Enum Values
85: 
86: ```typescript
87: // src/features/agent-work-contract/tools/create-contract-tool.ts:33
88: action: enum['create', 'update']
89: ```
90: 
91: ### Schema Fields
92: 
93: ```typescript
94: // src/features/agent-work-contract/tools/create-contract-tool.ts:32-71
95: {
96:   action: enum['create', 'update'],
97:   contractId?: string,
98:   sessionId?: string,
99:   rawIntent?: string,
100:   delegationExportSessionId?: string,
101:   responseMode?: enum['broad-search-execute', 'interactive-qa', 'deep-research'],
102:   workflow?: {
103:     planningPath?: string,
104:     phase?: string,
105:     outlineRef?: string,
106:     tasks: [{
107:       id: string,
108:       title: string,
109:       status: enum['pending', 'active', 'delegated', 'verifying', 'complete'],
110:       parentTaskId?: string,
111:       dependencyIds?: string[],
112:       delegationMode?: enum['parallel', 'sequential', 'handoff'],
113:       delegationSessionId?: string,
114:       evidenceRefs?: string[],
115:     }],
116:   },
117:   chainActions?: {
118:     onTaskComplete: enum['export-workflow', 'next-task', 'close'],
119:     onWorkflowEnd: enum['export-contract', 'archive'],
120:     onDelegation: enum['export-messages', 'handoff-packet'],
121:     onCompaction80: enum['launch-context-agent', 'export-summary'],
122:   },
123:   briefing?: {
124:     summary: string,
125:     workflowState: string,
126:     followUp: string[],
127:   },
128:   anchors?: [{
129:     timestamp: string,
130:     kind: enum['workflow-shift', 'planning-shift', 'stage-shift', 'user-redirect'],
131:     description: string,
132:     snapshotRef?: string,
133:   }],
134: }
135: ```
136: 
137: ### Supporting Files
138: 
139: The create-contract tool has a **complex supporting architecture** that justifies its feature-local placement:
140: 
141: | File | Purpose | LOC |
142: |------|---------|-----|
143: | `create-contract-tool.schema.ts` | Schema types and constants | 71 |
144: | `create-contract-tool.helpers.ts` | Helper functions | - |
145: | `create-contract-tool.normalizers.ts` | Input normalization | - |
146: | `create-contract-tool.operations.ts` | Business logic (create/update) | - |
147: | `create-contract-tool.test.ts` | Unit tests | - |
148: 
149: ---
150: 
151: ## FINDING 3: export-contract-tool — Minimal Export Tool in Features
152: 
153: **Anomaly Type:** Tool definition lives in `src/features/` instead of `src/tools/`
154: 
155: ### Evidence
156: 
157: | Aspect | Detail | File:Line |
158: |--------|--------|-----------|
159: | File location | `src/features/agent-work-contract/tools/export-contract-tool.ts` | `src/features/agent-work-contract/tools/export-contract-tool.ts:1` |
160: | LOC count | 67 lines | `wc -l` output |
161: | Barrel export | Exported from feature-local barrel | `src/features/agent-work-contract/tools/index.ts:17-19` |
162: | Plugin import | Imported from feature path | `src/plugin/opencode-plugin.ts:21-23` |
163: | Catalog entry | Listed in `agentToolCatalog` | `src/tools/index.ts:93-100` |
164: 
165: ### Action Enum Values
166: 
167: ```typescript
168: // src/features/agent-work-contract/tools/export-contract-tool.ts:36
169: format: enum['contract', 'summary']
170: ```
171: 
172: ### Schema Fields
173: 
174: ```typescript
175: // src/features/agent-work-contract/tools/export-contract-tool.ts:34-37
176: {
177:   contractId: string.min(1),
178:   format: enum['contract', 'summary']
179: }
180: ```
181: 
182: ### Tool ID Constant
183: 
184: ```typescript
185: // src/features/agent-work-contract/tools/export-contract-tool.ts:9
186: export const HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID = 'hivemind_agent_work_export_contract'
187: ```
188: 
189: ---
190: 
191: ## FINDING 4: Architectural Differences — Why These Tools Are Different
192: 
193: ### Canonical Trajectory Pattern (Reference)
194: 
195: The trajectory tool at `src/tools/trajectory/tools.ts` (49 LOC) follows the **canonical pattern**:
196: 
197: 1. **Location:** `src/tools/trajectory/` subdirectory
198: 2. **Barrel export:** `src/tools/trajectory/index.ts` exports `tools.ts` and `types.ts`
199: 3. **Simple structure:** Single tool file + types file
200: 4. **Plugin import:** Via barrel: `from '../tools/trajectory/index.js'`
201: 5. **Schema:** Inline in tool file, simple enum + optional strings
202: 6. **Execution:** Delegates to feature logic: `executeHivemindTrajectoryAction()` from `src/features/trajectory/`
203: 
204: ### Journal Tool Pattern (Anomaly #1)
205: 
206: | Aspect | Canonical | Journal | Difference |
207: |--------|-----------|---------|------------|
208: | Location | `src/tools/{name}/` | `src/tools/hivemind-journal.ts` | Flat file, no subdirectory |
209: | Barrel export | Yes (`index.ts`) | **No** | Direct import bypass |
210: | Plugin import | Via barrel | Direct file import | Breaks convention |
211: | Supporting files | In subdirectory | None | Self-contained |
212: | Business logic | Delegated to features | **Embedded** | Imports from `src/features/event-tracker/` |
213: 
214: **Root cause:** The journal tool is self-contained and small (196 LOC), so it was placed as a flat file. However, it imports business logic from `src/features/event-tracker/` (lines 19-20), creating a **cross-cutting dependency** that violates the CQRS boundary.
215: 
216: ### Contract Tools Pattern (Anomaly #2)
217: 
218: | Aspect | Canonical | Contract Tools | Difference |
219: |--------|-----------|----------------|------------|
220: | Location | `src/tools/{name}/` | `src/features/agent-work-contract/tools/` | Feature-local |
221: | Barrel export | `src/tools/{name}/index.ts` | Feature-local `index.ts` | Different barrel |
222: | Plugin import | Via `src/tools/` barrel | Via `src/features/` barrel | Different import path |
223: | Supporting files | Minimal | **Extensive** (schema, helpers, normalizers, operations) | Complex feature module |
224: | Business logic | Delegated to features | **Co-located** | Tool + logic in same feature |
225: 
226: **Root cause:** The contract tools are **tightly coupled** to the `agent-work-contract` feature module. They share:
227: - Schema definitions (`../schema/index.js`)
228: - Contract store (`../engine/contract-store.js`)
229: - Compaction preservation (`../hooks/compaction-preservation.js`)
230: - Normalizers and operations (co-located files)
231: 
232: This co-location makes sense for **feature cohesion** but breaks the **tool registry convention** where all tools should live in `src/tools/`.
233: 
234: ### Structural Comparison Summary
235: 
236: ```
237: Canonical Pattern (trajectory):
238:   src/tools/trajectory/
239:   ├── index.ts          (barrel export)
240:   ├── tools.ts          (tool definition)
241:   └── types.ts          (type definitions)
242:   src/features/trajectory/
243:   └── trajectory.ts     (business logic)
244: 
245: Journal Pattern (anomaly):
246:   src/tools/hivemind-journal.ts  (flat file, no barrel)
247:   src/features/event-tracker/    (business logic imported)
248:   ├── markdown-writer.js
249:   └── paths.js
250: 
251: Contract Pattern (anomaly):
252:   src/features/agent-work-contract/tools/
253:   ├── index.ts                   (feature-local barrel)
254:   ├── create-contract-tool.ts    (tool definition)
255:   ├── create-contract-tool.schema.ts
256:   ├── create-contract-tool.helpers.ts
257:   ├── create-contract-tool.normalizers.ts
258:   ├── create-contract-tool.operations.ts
259:   └── export-contract-tool.ts    (tool definition)
260: ```
261: 
262: ### Why This Matters
263: 
264: 1. **Discoverability:** Tools in `src/tools/` are expected to be the authoritative tool registry. Contract tools hidden in `src/features/` break this expectation.
265: 2. **Consistency:** The journal tool's flat file pattern is unique among all 12 tools in the catalog.
266: 3. **Maintenance:** Contract tools have 5+ supporting files co-located with the tool, making them harder to find for developers expecting tools in `src/tools/`.
267: 4. **Registration:** Both anomalies are registered in the plugin directly, bypassing the barrel export system that other tools use.
268: 
269: ---
270: 
271: ## Git Context
272: 
273: **Commit history for investigated files:**
274: 
275: | Commit | Message | Files |
276: |--------|---------|-------|
277: | `33df100f` | feat(session-journal): wire markdown-writer | `hivemind-journal.ts` |
278: | `7183335f` | Generated numerous Hivemind session artifacts | `hivemind-journal.ts` |
279: | `dd3cc510` | fix(clusters 1-3): unblock build | `hivemind-journal.ts` |
280: | `c95b12a1` | refactor: decompose 9 oversized files | `hivemind-journal.ts` |
281: | `0f029dc0` | feat: Introduce workflow continuity, agent work contracts | `create-contract-tool.ts`, `export-contract-tool.ts` |
282: | `a3a41889` | feat: Introduce agent work contract tools | `create-contract-tool.ts`, `export-contract-tool.ts` |
283: 
284: **Investigation conducted at:** HEAD of worktree `product-detox` on 2026-03-31
285: 
286: ---
287: 
288: ## Summary Table
289: 
290: | Tool | LOC | Location | Barrel Export | Plugin Import | Anomaly |
291: |------|-----|----------|---------------|---------------|---------|
292: | `hivemind_journal` | 196 | `src/tools/hivemind-journal.ts` | **No** | Direct file | Flat file, no barrel |
293: | `create_contract` | 155 | `src/features/.../tools/` | Feature-local | Feature path | Wrong directory |
294: | `export_contract` | 67 | `src/features/.../tools/` | Feature-local | Feature path | Wrong directory |
295: | `trajectory` (ref) | 49 | `src/tools/trajectory/` | Yes | Via barrel | Canonical pattern |

(End of file - total 295 lines)
</content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node2-trajectory-pattern-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node2-trajectory-pattern-2026-03-31.md</path>
<type>file</type>
<content>1: ---
2: title: "NODE 2: Trajectory Tool — Canonical Pattern Extraction"
3: date: "2026-03-31"
4: agent: hivexplorer
5: node: 2
6: scope: src/tools/trajectory/ + src/features/trajectory/ + src/core/trajectory/
7: git_commit: 85f8cbe7
8: status: complete
9: ---
10: 
11: # Codebase Investigation Report — NODE 2: Trajectory Tool Pattern
12: 
13: **Scope:** `src/tools/trajectory/` (3 files) + `src/features/trajectory/` (2 files) + `src/core/trajectory/` (7 files)
14: **Question:** Is the trajectory tool the canonical pattern other tools should follow? Extract every structural layer.
15: **Date:** 2026-03-31
16: **Git Commit:** `85f8cbe7`
17: 
18: ---
19: 
20: ## FINDING 1: Action Enum Values
21: 
22: **Evidence:** `src/tools/trajectory/types.ts:4-10`, `src/tools/trajectory/tools.ts:16`
23: 
24: ```typescript
25: export type HivemindTrajectoryAction =
26:   | 'inspect'
27:   | 'traverse'
28:   | 'attach'
29:   | 'checkpoint'
30:   | 'event'
31:   | 'close'
32: ```
33: 
34: **Zod schema mirror** at `tools.ts:16`:
35: ```typescript
36: action: tool.schema.enum(['inspect', 'traverse', 'attach', 'checkpoint', 'event', 'close'])
37: ```
38: 
39: **Observation:** The enum is defined once in `types.ts` as a TypeScript union, then mirrored in the Zod schema. There is no `z.enum()` shared source — the two are kept in sync manually. This is a minor DRY gap but functionally correct.
40: 
41: **Additional enums nested in schema:**
42: - `lineage`: `'hivefiver' | 'hiveminder'` — `tools.ts:20`
43: - `purposeClass`: 8 values (`discovery`, `brainstorming`, `research`, `planning`, `implementation`, `gatekeeping`, `tdd`, `course-correction`) — `tools.ts:21-24`
44: - `kind`: `'summary' | 'handoff' | 'evidence' | 'transition' | 'note'` — `tools.ts:30`
45: 
46: ---
47: 
48: ## FINDING 2: Schema Fields with Zod Types
49: 
50: **Evidence:** `src/tools/trajectory/tools.ts:15-32`
51: 
52: | Field | Zod Type | Optional? | Line |
53: |-------|----------|-----------|------|
54: | `action` | `tool.schema.enum([...])` | Required | 16 |
55: | `trajectoryId` | `tool.schema.string()` | `.optional()` | 17 |
56: | `workflowId` | `tool.schema.string()` | `.optional()` | 18 |
57: | `sessionId` | `tool.schema.string()` | `.optional()` | 19 |
58: | `lineage` | `tool.schema.enum(['hivefiver','hiveminder'])` | `.optional()` | 20 |
59: | `purposeClass` | `tool.schema.enum([...8 values])` | `.optional()` | 21-24 |
60: | `taskIds` | `tool.schema.string()` | `.optional()` | 25 |
61: | `subtaskIds` | `tool.schema.string()` | `.optional()` | 26 |
62: | `summary` | `tool.schema.string()` | `.optional()` | 27 |
63: | `source` | `tool.schema.string()` | `.optional()` | 28 |
64: | `resumeTarget` | `tool.schema.string()` | `.optional()` | 29 |
65: | `kind` | `tool.schema.enum([...5 values])` | `.optional()` | 30 |
66: | `evidenceRefs` | `tool.schema.string()` | `.optional()` | 31 |
67: 
68: **Total:** 13 schema fields. 1 required (`action`), 12 optional. All have `.describe()` annotations.
69: 
70: ---
71: 
72: ## FINDING 3: Factory Pattern Structure
73: 
74: **Evidence:** `src/tools/trajectory/tools.ts:10-48`
75: 
76: ```typescript
77: export function createHivemindTrajectoryTool(projectRoot: string): ReturnType<typeof tool>
78: ```
79: 
80: **Parameters:**
81: - `projectRoot: string` — single dependency injected at factory time
82: 
83: **Return type:** `ReturnType<typeof tool>` — the OpenCode SDK `tool()` return type
84: 
85: **Structure:**
86: 1. Factory function wraps `tool({...})` call
87: 2. `description` is a static string (lines 12-14)
88: 3. `args` is the Zod schema object (lines 15-32)
89: 4. `execute` delegates to `executeHivemindTrajectoryAction()` from features layer (lines 33-47)
90: 5. Result rendering uses shared helpers: `render(error(...))` / `render(success(...))` (lines 38-46)
91: 
92: **Import chain:**
93: - `@opencode-ai/plugin/tool` — SDK tool factory (line 1)
94: - `../../features/trajectory/trajectory.js` — feature execute function (line 3)
95: - `../../shared/tool-response.js` — `error`, `success` helpers (line 4)
96: - `../../shared/tool-helpers.js` — `render` helper (line 5)
97: - `./types.js` — `HivemindTrajectoryToolArgs` type (line 6)
98: 
99: ---
100: 
101: ## FINDING 4: Action Dispatch Mechanism
102: 
103: **Evidence:** `src/features/trajectory/trajectory.ts:38-177`
104: 
105: **Mechanism: `switch` statement on `args.action`**
106: 
107: ```typescript
108: switch (args.action) {
109:   case 'inspect':    // lines 39-50
110:   case 'traverse':   // lines 51-82
111:   case 'attach':     // lines 83-115
112:   case 'checkpoint': // lines 116-137
113:   case 'event':      // lines 138-156
114:   case 'close':      // lines 157-174
115:   default:           // lines 175-176
116: }
117: ```
118: 
119: **Every action has a dedicated handler block.** Each block:
120: 1. Validates required args (guard clauses at the top of each case)
121: 2. Calls a single feature/core function (e.g., `inspectTrajectoryLedger`, `bootstrapTrajectoryLedger`, `recordTrajectoryEvent`, `closeTrajectory`, `createTrajectoryCheckpoint`)
122: 3. Returns a `TrajectoryFeatureResult` union type (`{ kind: 'success' | 'error', ... }`)
123: 4. Includes `pressureContract` in response data
124: 
125: **Pressure contract system** at `types.ts:28-35`:
126: ```typescript
127: export const trajectoryActionPressureContracts: Record<HivemindTrajectoryAction, RuntimePressureContract>
128: ```
129: Each action maps to a pressure contract (`steady-state`, `trajectory-control`, `trajectory-continuation`).
130: 
131: **Imports from core:** `src/features/trajectory/trajectory.ts:1-10`
132: - `bootstrapTrajectoryLedger`, `closeTrajectory`, `createTrajectoryCheckpoint`, `inspectTrajectoryLedger`, `loadTrajectoryLedger`, `recordTrajectoryEvent` — from `../../core/trajectory/index.js`
133: - `readWorkflowTaskState` — from `../../core/workflow-management/index.js`
134: - `parseList` — from `../../shared/tool-helpers.js`
135: 
136: ---
137: 
138: ## FINDING 5: H-C Verdict — Is It Canonical?
139: 
140: **Verdict: YES — This is the canonical pattern.**
141: 
142: **Evidence-based rationale:**
143: 
144: 1. **Cleanest separation of concerns:** The tool layer (`tools.ts`, 49 LOC) is purely a thin adapter — it defines the schema, delegates to the feature layer, and renders results. Zero business logic. The feature layer (`trajectory.ts`, 178 LOC) owns all dispatch, validation, and core integration. The types layer (`types.ts`, 35 LOC) owns all type definitions and pressure contracts. The barrel exports (`index.ts`, 1-2 lines each) are clean.
145: 
146: 2. **Every action has a dedicated handler:** All 6 actions (`inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`) have their own `case` block with explicit guard clauses, single-responsibility core calls, and consistent result shapes.
147: 
148: 3. **Schema is well-structured:** 13 fields, 1 required, 12 optional. Every field has `.describe()`. All enum values are explicit. The schema mirrors the TypeScript types (manual sync, but consistent).
149: 
150: 4. **Consistent result contract:** Every handler returns `TrajectoryFeatureResult` — a discriminated union on `kind: 'success' | 'error'`. Success includes `message`, `data`, and optional `metadata`. Error includes `message`. This is uniform across all 6 actions.
151: 
152: 5. **Pressure contract integration:** Each action carries a `RuntimePressureContract` that is resolved at dispatch time and included in every response. This is a governance feature unique to this tool.
153: 
154: 6. **LOC discipline:** Total across 5 files = 265 lines. Largest file = 178 lines (feature). Tool file = 49 lines. Well within the ≤300 LOC per file standard.
155: 
156: **Minor gaps (not blockers):**
157: - Zod enum and TypeScript enum are manually synced (no `z.enum()` inference from the TS type) — `tools.ts:16` vs `types.ts:4-10`
158: - `taskIds` and `subtaskIds` are strings (comma-separated) requiring `parseList()` parsing — not arrays at the schema level — `tools.ts:25-26`
159: 
160: ---
161: 
162: ## LOC Summary
163: 
164: | File | Lines |
165: |------|-------|
166: | `src/tools/trajectory/tools.ts` | 49 |
167: | `src/tools/trajectory/types.ts` | 35 |
168: | `src/tools/trajectory/index.ts` | 2 |
169: | `src/features/trajectory/trajectory.ts` | 178 |
170: | `src/features/trajectory/index.ts` | 1 |
171: | **Total** | **265** |
172: 
173: ---
174: 
175: ## BLOCKED: None
176: 
177: All requested evidence was found and grounded. No files missing. No patterns absent.

(End of file - total 177 lines)
</content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node3-task-anomaly-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node3-task-anomaly-2026-03-31.md</path>
<type>file</type>
<content>1: ---
2: title: "Task Tool Execute Signature Anomaly Investigation"
3: date: "2026-03-31"
4: agent: "hivexplorer"
5: scope: "node3-task-anomaly"
6: status: "complete"
7: ---
8: 
9: # Codebase Investigation Report — Task Tool Execute Signature
10: 
11: **Scope:** `src/tools/task/tools.ts`, `src/tools/task/types.ts`, `src/features/workflow/task.ts`
12: **Question:** Is the task tool's `execute()` function sync or async? Does it await its feature handler? Is this a bug compared to the trajectory tool pattern?
13: **Git Context:** Worktree at `/Users/apple/hivemind-plugin/.worktrees/product-detox`, investigated 2026-03-31
14: 
15: ---
16: 
17: ## Findings
18: 
19: | # | Finding | File | Line | Evidence |
20: |---|---------|------|------|----------|
21: | 1 | `execute()` is declared `async` | `src/tools/task/tools.ts` | 26 | `async execute(args: HivemindTaskToolArgs, context) {` |
22: | 2 | `executeHivemindTaskAction()` is called **WITHOUT** `await` | `src/tools/task/tools.ts` | 27-29 | `const result = executeHivemindTaskAction(projectRoot, args, { sessionID: context.sessionID, })` — no `await` keyword |
23: | 3 | `executeHivemindTaskAction()` is **NOT async** — returns `TaskFeatureResult` synchronously | `src/features/workflow/task.ts` | 30-34 | `export function executeHivemindTaskAction(projectRoot: string, args: HivemindTaskToolArgs, _context: TaskFeatureContext): TaskFeatureResult {` — no `async` keyword, returns plain `TaskFeatureResult` (not `Promise<TaskFeatureResult>`) |
24: | 4 | Action enum: 7 actions — `create`, `list`, `get`, `activate`, `rotate`, `verify`, `complete` | `src/tools/task/types.ts` | 4-11 | `export type HivemindTaskAction = \| 'create' \| 'list' \| 'get' \| 'activate' \| 'rotate' \| 'verify' \| 'complete'` |
25: | 5 | Schema fields: `action` (required enum), `workflowId`, `taskId`, `title`, `kind` (task/subtask), `parentTaskId`, `dependencyIds`, `verificationContractId`, `evidenceRefs` — all string except `action` and `kind` which are enums | `src/tools/task/tools.ts` | 15-25 | Zod schema via `tool.schema.enum()` and `tool.schema.string().optional()` |
26: | 6 | LOC counts: `tools.ts` = 42 lines, `types.ts` = 33 lines, `task.ts` (feature) = 190 lines | — | — | File read confirmed |
27: 
28: ---
29: 
30: ## Comparison: Trajectory Tool Pattern
31: 
32: | Aspect | Task Tool | Trajectory Tool |
33: |--------|-----------|-----------------|
34: | `execute()` signature | `async execute(...)` (line 26) | `async execute(...)` (line 33) |
35: | Awaits feature handler? | **NO** — `const result = executeHivemindTaskAction(...)` (line 27) | **YES** — `const result = await executeHivemindTrajectoryAction(...)` (line 34) |
36: | Feature handler signature | `function executeHivemindTaskAction(...): TaskFeatureResult` (sync) | `async function executeHivemindTrajectoryAction(...): Promise<...>` (async) |
37: | Consistency | **INCONSISTENT** — declares `async` but doesn't `await` | **CONSISTENT** — declares `async` and `await`s |
38: 
39: **Evidence for trajectory async handler:** `src/features/trajectory/trajectory.ts` line 29: `export async function executeHivemindTrajectoryAction(`
40: 
41: ---
42: 
43: ## H-D Verdict: "Sync execute is a latent defect"
44: 
45: **VERDICT: NOT A BUG — The `async` on `execute()` is technically unnecessary but not defective.**
46: 
47: **Rationale with evidence:**
48: 
49: 1. **The feature handler `executeHivemindTaskAction()` is fully synchronous.** It returns `TaskFeatureResult` (not `Promise<TaskFeatureResult>`). See `src/features/workflow/task.ts` line 30-34. All internal calls (`listWorkflowTasks`, `readWorkflowTask`, `createWorkflowTask`, `activateWorkflowTask`, `verifyWorkflowTask`, `completeWorkflowTask`, `inspectWorkflowAuthority`, `bootstrapWorkflowAuthority`) are called without `await` and return plain values.
50: 
51: 2. **The `async` keyword on `execute()` is redundant but harmless.** An `async` function that doesn't `await` anything still works correctly — it just wraps the return value in a resolved Promise. The OpenCode SDK's `tool()` wrapper accepts both sync and async execute functions.
52: 
53: 3. **No unhandled promise rejection risk.** Since `executeHivemindTaskAction()` is sync, there's no Promise to reject. The `async` wrapper around a sync call produces a resolved Promise, not an unhandled one.
54: 
55: 4. **The inconsistency is a code smell, not a defect.** The trajectory tool uses `async` + `await` because its feature handler is async. The task tool uses `async` without `await` because its feature handler is sync. The `async` keyword on the task tool's execute was likely copy-pasted or preemptively added, but it causes no runtime harm.
56: 
57: **Recommendation (informational only, not a directive):** The `async` keyword on `src/tools/task/tools.ts` line 26 could be removed for cleanliness, making the signature `execute(args: HivemindTaskToolArgs, context)` without `async`. This would align the declaration with the actual synchronous behavior.
58: 
59: ---
60: 
61: ## Gaps
62: 
63: - None identified within scope. All 3 target files were read and analyzed completely.
64: - The underlying workflow-management functions (`createWorkflowTask`, `activateWorkflowTask`, etc.) were not inspected — they could theoretically be async but wrapped synchronously. This is outside the stated scope.
65: 
66: ---
67: 
68: ## Structure Map
69: 
70: ```
71: src/tools/task/
72: ├── tools.ts      (42 LOC) — Tool definition, async execute without await
73: └── types.ts      (33 LOC) — HivemindTaskAction enum (7 actions), tool args interface, pressure contracts
74: 
75: src/features/workflow/
76: └── task.ts       (190 LOC) — executeHivemindTaskAction (sync), switch-case router for 7 actions
77: 
78: src/features/trajectory/
79: └── trajectory.ts — executeHivemindTrajectoryAction (async) — comparison reference
80: ```
81: 
82: ---
83: 
84: ## Patterns Found
85: 
86: - **CQRS pattern:** Tools delegate to feature handlers, which delegate to core workflow-management functions
87: - **Pressure contracts:** Each action maps to a `RuntimePressureContract` (`task-mutation` vs `steady-state`)
88: - **Result envelope:** All feature handlers return `{ kind: 'success' | 'error', message, data?, details? }` envelope
89: - **Inconsistency:** Task tool declares `async execute` but doesn't `await`; trajectory tool does both

(End of file - total 89 lines)
</content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node4-handoff-overengineering-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/node4-handoff-overengineering-2026-03-31.md</path>
<type>file</type>
<content>1: ---
2: title: "NODE 4: Handoff Tool — Over-Engineering Analysis"
3: date: 2026-03-31
4: agent: hivexplorer
5: node: 4
6: scope: handoff-tool-overengineering
7: status: complete
8: ---
9: 
10: # Codebase Investigation Report — NODE 4
11: 
12: **Scope:** Handoff tool schema, action enums, dispatch mechanism, and comparison against trajectory tool
13: **Question:** Is the handoff tool over-engineered compared to the canonical trajectory pattern?
14: **Git commit:** `85f8cbe7` (HEAD)
15: 
16: ---
17: 
18: ## FINDING 1: Action Enums
19: 
20: **Handoff actions (6 values):** `create`, `read`, `list`, `update`, `validate`, `close`
21: - Evidence: `src/tools/handoff/types.ts:4-10` — `HivemindHandoffAction` type union
22: - Evidence: `src/tools/handoff/tools.ts:14` — Zod enum mirrors the type union
23: 
24: **Trajectory actions (6 values):** `inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`
25: - Evidence: `src/tools/trajectory/types.ts:4-10` — `HivemindTrajectoryAction` type union
26: 
27: **Verdict:** Same action count (6 each). No over-engineering signal here.
28: 
29: ---
30: 
31: ## FINDING 2: Schema Fields with Zod Types (Count)
32: 
33: ### Handoff: 22 total fields (1 required + 21 optional)
34: 
35: | # | Field | Zod Type | Required? | Line |
36: |---|-------|----------|-----------|------|
37: | 1 | `action` | `tool.schema.enum([...])` | **Yes** | `tools.ts:14` |
38: | 2 | `id` | `tool.schema.string().optional()` | No | `tools.ts:15` |
39: | 3 | `sourceSessionId` | `tool.schema.string().optional()` | No | `tools.ts:16` |
40: | 4 | `targetSessionId` | `tool.schema.string().optional()` | No | `tools.ts:17` |
41: | 5 | `sourceAgent` | `tool.schema.string().optional()` | No | `tools.ts:18` |
42: | 6 | `targetAgent` | `tool.schema.string().optional()` | No | `tools.ts:19` |
43: | 7 | `trajectoryId` | `tool.schema.string().optional()` | No | `tools.ts:20` |
44: | 8 | `workflowId` | `tool.schema.string().optional()` | No | `tools.ts:21` |
45: | 9 | `taskIds` | `tool.schema.string().optional()` | No | `tools.ts:22` |
46: | 10 | `subtaskIds` | `tool.schema.string().optional()` | No | `tools.ts:23` |
47: | 11 | `scope` | `tool.schema.string().optional()` | No | `tools.ts:24` |
48: | 12 | `constraints` | `tool.schema.string().optional()` | No | `tools.ts:25` |
49: | 13 | `memoryScope` | `tool.schema.string().optional()` | No | `tools.ts:26` |
50: | 14 | `successMetrics` | `tool.schema.string().optional()` | No | `tools.ts:27` |
51: | 15 | `requiredEvidence` | `tool.schema.string().optional()` | No | `tools.ts:28` |
52: | 16 | `summary` | `tool.schema.string().optional()` | No | `tools.ts:29` |
53: | 17 | `nextSteps` | `tool.schema.string().optional()` | No | `tools.ts:30` |
54: | 18 | `evidence` | `tool.schema.string().optional()` | No | `tools.ts:31` |
55: | 19 | `returnContract` | `tool.schema.string().optional()` | No | `tools.ts:32` |
56: | 20 | `evidenceContractId` | `tool.schema.string().optional()` | No | `tools.ts:33` |
57: | 21 | `returnGate` | `tool.schema.string().optional()` | No | `tools.ts:34` |
58: | 22 | `resumeTarget` | `tool.schema.string().optional()` | No | `tools.ts:35` |
59: 
60: ### Trajectory: 13 total fields (1 required + 12 optional)
61: 
62: | # | Field | Zod Type | Required? | Line |
63: |---|-------|----------|-----------|------|
64: | 1 | `action` | `tool.schema.enum([...])` | **Yes** | `tools.ts:16` |
65: | 2 | `trajectoryId` | `tool.schema.string().optional()` | No | `tools.ts:17` |
66: | 3 | `workflowId` | `tool.schema.string().optional()` | No | `tools.ts:18` |
67: | 4 | `sessionId` | `tool.schema.string().optional()` | No | `tools.ts:19` |
68: | 5 | `lineage` | `tool.schema.enum([...]).optional()` | No | `tools.ts:20` |
69: | 6 | `purposeClass` | `tool.schema.enum([...]).optional()` | No | `tools.ts:21-24` |
70: | 7 | `taskIds` | `tool.schema.string().optional()` | No | `tools.ts:25` |
71: | 8 | `subtaskIds` | `tool.schema.string().optional()` | No | `tools.ts:26` |
72: | 9 | `summary` | `tool.schema.string().optional()` | No | `tools.ts:27` |
73: | 10 | `source` | `tool.schema.string().optional()` | No | `tools.ts:28` |
74: | 11 | `resumeTarget` | `tool.schema.string().optional()` | No | `tools.ts:29` |
75: | 12 | `kind` | `tool.schema.enum([...]).optional()` | No | `tools.ts:30` |
76: | 13 | `evidenceRefs` | `tool.schema.string().optional()` | No | `tools.ts:31` |
77: 
78: **Delta:** Handoff has **9 more fields** than trajectory (22 vs 13, +69%).
79: 
80: ---
81: 
82: ## FINDING 3: Required vs Optional Breakdown
83: 
84: ### Handoff
85: - **Required (1):** `action`
86: - **Optional (21):** all other fields
87: - Evidence: `src/tools/handoff/tools.ts:13-36`
88: 
89: ### Trajectory
90: - **Required (1):** `action`
91: - **Optional (12):** all other fields
92: - Evidence: `src/tools/trajectory/tools.ts:16-32`
93: 
94: ### Type Decomposition Overhead
95: 
96: Handoff decomposes its 21 optional fields into **6 sub-interfaces** to satisfy the "≤10 fields per interface" rule:
97: 
98: | Interface | Fields | LOC | Evidence |
99: |-----------|--------|-----|----------|
100: | `HandoffIdentity` | 5 (`id`, `sourceSessionId`, `targetSessionId`, `sourceAgent`, `targetAgent`) | 12 lines | `types.ts:16-27` |
101: | `HandoffWorkflowContext` | 4 (`trajectoryId`, `workflowId`, `taskIds`, `subtaskIds`) | 10 lines | `types.ts:33-42` |
102: | `HandoffScope` | 3 (`scope`, `constraints`, `memoryScope`) | 9 lines | `types.ts:48-55` |
103: | `HandoffSuccessCriteria` | 2 (`successMetrics`, `requiredEvidence`) | 7 lines | `types.ts:61-66` |
104: | `HandoffRecord` | 6 (`summary`, `nextSteps`, `evidence`, `returnContract`, `evidenceContractId`, `returnGate`) | 15 lines | `types.ts:72-85` |
105: | `HandoffResume` | 1 (`resumeTarget`) | 5 lines | `types.ts:91-94` |
106: 
107: The final type is an intersection of all 6:
108: ```typescript
109: export type HivemindHandoffToolArgs = { action: ... } & HandoffIdentity & HandoffWorkflowContext & HandoffScope & HandoffSuccessCriteria & HandoffRecord & HandoffResume
110: ```
111: Evidence: `src/tools/handoff/types.ts:101-109`
112: 
113: Trajectory uses a **single flat interface** with no decomposition:
114: ```typescript
115: export interface HivemindTrajectoryToolArgs { ... }
116: ```
117: Evidence: `src/tools/trajectory/types.ts:12-26`
118: 
119: **Overhead:** Handoff types.ts is **118 LOC** vs trajectory's **35 LOC** — 3.4× more lines for the same structural role.
120: 
121: ---
122: 
123: ## FINDING 4: Dispatch Mechanism
124: 
125: Both tools use a `switch/case` dispatch on the `action` enum.
126: 
127: ### Handoff dispatch
128: - Location: `src/features/handoff/handoff.ts:96-270`
129: - 6 cases: `list`, `read`, `validate`, `close`, `update`, `create`
130: - Each case calls a corresponding delegation-layer function
131: - `create` and `update` cases invoke `syncDelegationContinuity()` which chains to `upsertWorkflowDelegationContinuityLinkage()` and `dispatchDelegationHandoffPacketAction()`
132: - `validate` and `close` also invoke `syncDelegationContinuity()`
133: - All cases attach `pressureContract` to response data
134: - Lines: 175 lines of dispatch logic
135: 
136: Evidence: `src/features/handoff/handoff.ts:96-270`
137: 
138: ### Trajectory dispatch
139: - Location: `src/features/trajectory/trajectory.ts`
140: - 6 cases with simpler delegation-layer calls
141: - Lines: 178 total file (includes dispatch + helpers)
142: 
143: Evidence: `src/features/trajectory/trajectory.ts`
144: 
145: ### Complexity comparison
146: 
147: | Metric | Handoff | Trajectory | Delta |
148: |--------|---------|------------|-------|
149: | `tools.ts` LOC | 54 | 49 | +5 |
150: | `types.ts` LOC | 118 | 35 | +83 |
151: | Feature file LOC | 271 | 178 | +93 |
152: | `index.ts` LOC | 1 | — | +1 |
153: | **Total LOC** | **444** | **262** | **+182 (+69%)** |
154: | Schema fields | 22 | 13 | +9 |
155: | Action count | 6 | 6 | 0 |
156: | Sub-interfaces | 6 | 0 | +6 |
157: | Required validations per action | 1-4 fields | 0-2 fields | +more |
158: 
159: ---
160: 
161: ## FINDING 5: H-E Verdict — OVER-ENGINEERED
162: 
163: ### Evidence Summary
164: 
165: | Signal | Handoff | Trajectory | Assessment |
166: |--------|---------|------------|------------|
167: | Total LOC | 444 | 262 | +69% — significant |
168: | Types LOC | 118 | 35 | +237% — excessive |
169: | Schema fields | 22 | 13 | +69% — moderate |
170: | Action count | 6 | 6 | Equal |
171: | Sub-interfaces | 6 | 0 | Pure overhead |
172: | Shared fields | 6 (`trajectoryId`, `workflowId`, `taskIds`, `subtaskIds`, `summary`, `resumeTarget`) | — | 27% of handoff fields are duplicated from trajectory |
173: 
174: ### What Justifies the Extra Fields
175: 
176: Handoff serves a fundamentally different purpose than trajectory:
177: - **Trajectory** records events on a timeline (read/write a log)
178: - **Handoff** packages delegation packets between agents/sessions (identity, scope, contracts, evidence, success criteria)
179: 
180: The following handoff-specific fields are **justified** by the delegation domain:
181: - `sourceSessionId`, `targetSessionId`, `sourceAgent`, `targetAgent` — delegation identity
182: - `scope`, `constraints`, `memoryScope` — work boundary definition
183: - `successMetrics`, `requiredEvidence` — completion criteria
184: - `returnContract`, `evidenceContractId`, `returnGate` — return-path contracts
185: - `nextSteps`, `evidence` — handoff payload content
186: 
187: ### What Is Bloat
188: 
189: 1. **Interface decomposition overhead** — 6 sub-interfaces for 21 optional fields adds 83 extra LOC in types.ts with zero runtime benefit. The intersection type reassembles them into a single flat surface. This is compliance with the "≤10 fields per interface" rule, not functional necessity. (`types.ts:16-109`)
190: 
191: 2. **All-string encoding** — Fields like `taskIds`, `subtaskIds`, `constraints`, `memoryScope`, `successMetrics`, `requiredEvidence`, `evidence`, `nextSteps` are all `string` (comma-separated or JSON-encoded) rather than proper typed arrays. This pushes parsing burden into the feature layer (`parseList()`, `parseJsonArray()` calls at `handoff.ts:184-185, 224-230, 237-238`). The trajectory tool does the same pattern, so this is a project-wide convention, not handoff-specific bloat.
192: 
193: 3. **Shared field duplication** — 6 of 22 fields (`trajectoryId`, `workflowId`, `taskIds`, `subtaskIds`, `summary`, `resumeTarget`) are identical to trajectory fields. This is acceptable since they serve different domains, but represents surface area that could theoretically be composed from a shared base.
194: 
195: ### Final Verdict
196: 
197: **OVER-ENGINEERED — but primarily in type decomposition, not in domain scope.**
198: 
199: The handoff tool's 22 fields are mostly justified by its delegation-packet domain. The over-engineering signal comes from:
200: - **6 sub-interfaces** adding 83 LOC of structural overhead for no runtime benefit
201: - **118 LOC types file** vs trajectory's 35 LOC — a 3.4× multiplier for the same conceptual role
202: 
203: The feature layer (271 LOC vs 178 LOC) is proportionally heavier because handoff operations chain to delegation continuity, workflow linkage, and chain-action dispatch — which trajectory does not need. This additional complexity is **justified** by the handoff domain's richer semantics.
204: 
205: **Recommendation (informational only):** The 6-interface decomposition could collapse to 2-3 interfaces (identity, delegation-packet, metadata) without violating the spirit of the ≤10-field rule, saving ~50 LOC in types.ts.
206: 
207: ---
208: 
209: ## BLOCKED
210: 
211: None. All 3 target files and their feature-layer counterparts were accessed successfully.
212: 
213: ---
214: 
215: ## File Inventory
216: 
217: | File | LOC | Role |
218: |------|-----|------|
219: | `src/tools/handoff/tools.ts` | 54 | Tool definition + factory |
220: | `src/tools/handoff/types.ts` | 118 | Type definitions + pressure contracts |
221: | `src/features/handoff/handoff.ts` | 271 | Feature dispatch + delegation chaining |
222: | `src/features/handoff/index.ts` | 1 | Re-export barrel |
223: | **Handoff total** | **444** | |
224: | `src/tools/trajectory/tools.ts` | 49 | Tool definition + factory |
225: | `src/tools/trajectory/types.ts` | 35 | Type definitions + pressure contracts |
226: | `src/features/trajectory/trajectory.ts` | 178 | Feature dispatch |
227: | **Trajectory total** | **262** | |

(End of file - total 227 lines)
</content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/investigation-report-legacy-code-intel-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/investigation-report-legacy-code-intel-2026-03-31.md</path>
<type>file</type>
<content>1: # Legacy Code-Intelligence Full Scope Investigation Report
2: 
3: **Archive:** `.archive/legacy-src-20260314-140720/`
4: **Date:** 2026-03-31
5: **Total LOC:** 12,586 across 33 TypeScript files
6: 
7: ---
8: 
9: ## Module: lib/code-intel/index.ts
10: **File:** `lib/code-intel/index.ts`
11: **LOC:** 63
12: **Purpose:** Barrel export aggregator for all code-intel modules
13: **Format Support:** N/A (module re-exports)
14: **Operation Types:** Export/re-export only
15: **Key Exports:**
16: - `createGitignoreFilter` — creates gitignore filter instance
17: - `isBinaryPathSafe` — binary file detection
18: - `detectSecrets/hasSecrets/getSecretTypes` — secret scanning
19: - `countTokens/countTokensForFile/getEncoding` — token counting
20: - `scanFilesToCodeMap/scanToFullCodeMap/detectLanguage` — project file scanning
21: - `createEmptyCodeMap/saveCodeMap/loadCodeMap` — codemap I/O
22: - `createTreeSitterFactory/createTreeSitterLoader` — Tree-sitter factory
23: - `extractSignatures/extractImportsRegex/extractExportsRegex` — signature extraction
24: - `compressCodemap/compressSingleFile/renderCompressedCodemap` — codemap compression
25: - `IncrementalUpdater` — incremental codemap updates
26: - `startWatchIntegration` — file system watcher bridge
27: - `selectSourceForInjection/renderSourceSelectionXml` — selective context injection
28: - `searchPatterns/findFunction/findType/findExport/findImporters` — pattern search
29: - `commitKnowledgeState/hasKnowledgeChanged/getLastKnowledgeCommit` — knowledge commits
30: - `ASTSurgeon` — AST-based code surgery
31: - `DocWeaver` — document weaving
32: - `LSPBridge` — LSP integration
33: 
34: **Dependencies:**
35: - Internal: all code-intel submodules
36: - External: `ignore` npm package
37: 
38: **Used By:** `tools/hivemind-codemap.ts`, `tools/hivemind-read-skeleton.ts`, `tools/hivemind-doc.ts`
39: 
40: ---
41: 
42: ## Module: ast-surgeon.ts
43: **File:** `lib/code-intel/ast-surgeon.ts`
44: **LOC:** 185
45: **Purpose:** AST-based code surgery — extract skeletons, patch symbols, analyze code structure
46: **Format Support:** TypeScript, JavaScript, Python, Go, Rust
47: **Operation Types:** Read (AST parse), Write (symbol patching)
48: **Key Exports:**
49: - `ASTSurgeon` class — main surgeon engine
50: - `extractSkeleton(filePath)` — extract imports, exports, signatures, compressed view
51: - `getSymbolRange(filePath, symbolName)` — get byte range for a symbol
52: - `patchSymbol(filePath, symbolName, newCode)` — patch symbol code with backup
53: 
54: **Dependencies:**
55: - Internal: `token-counter`, `signature-extractor`, `tree-sitter-loader`
56: - External: `magic-string` npm package (for surgical edits)
57: 
58: **Used By:** `tools/hivemind-read-skeleton.ts`
59: 
60: ---
61: 
62: ## Module: binary-detector.ts
63: **File:** `lib/code-intel/binary-detector.ts`
64: **LOC:** 40
65: **Purpose:** Detect binary file extensions to skip during code scanning
66: **Format Support:** N/A (file extension detection)
67: **Operation Types:** Inspect
68: **Key Exports:**
69: - `isBinaryPathSafe(filePath)` — returns false for binary extensions
70: 
71: **Dependencies:** None
72: 
73: **Used By:** `file-scanner.ts` (internal)
74: 
75: ---
76: 
77: ## Module: codemap-io.ts
78: **File:** `lib/code-intel/codemap-io.ts`
79: **LOC:** 120
80: **Purpose:** Serialization/deserialization of CodeMap to/from JSON files
81: **Format Support:** JSON
82: **Operation Types:** Read, Write
83: **Key Exports:**
84: - `CodeMapEntry` interface — file entry with hash, size, tokens, secrets
85: - `CodeMap` interface — collection of entries with metadata
86: - `createEmptyCodeMap(projectRoot)` — factory
87: - `saveCodeMap(path, codemap)` — JSON serialization
88: - `loadCodeMap(pathOrDir)` — JSON deserialization
89: - `computeCodeMapStats(entries)` — compute totals
90: - `scanProjectToCodeMap` — legacy scanner
91: - `loadCodeMapFromDir` — legacy loader
92: 
93: **Dependencies:** None (pure file I/O)
94: 
95: **Used By:** `file-scanner.ts`, `incremental-updater.ts`, `tools/hivemind-codemap.ts`
96: 
97: ---
98: 
99: ## Module: compressed-codemap.ts
100: **File:** `lib/code-intel/compressed-codemap.ts`
101: **LOC:** 335
102: **Purpose:** Compress codebase into signature-only representation for token-efficient context injection
103: **Format Support:** TypeScript, JavaScript, Python, Go, Rust, JSON
104: **Operation Types:** Transform (compression), Read (signature extraction)
105: **Key Exports:**
106: - `Signature` interface — function/class/interface/type/variable/import signature
107: - `Parameter` interface — function parameter with name, type, optional, default
108: - `CompressedFileInfo` — per-file compressed data
109: - `CompressedCodemap` — full compressed codemap
110: - `compressCodemap(codemap, options)` — full compression pipeline
111: - `compressSingleFile(filePath, projectRoot, language)` — single file compression
112: - `renderCompressedCodemap(codemap)` — human-readable serialization
113: - `computeCompressionRatio` — ratio calculation
114: 
115: **Dependencies:**
116: - Internal: `codemap-io`, `tree-sitter-loader`, `token-counter`, `signature-extractor`
117: 
118: **Used By:** `incremental-updater.ts`, `pattern-search.ts`, `selective-injector.ts`, `knowledge-commits.ts`, `tools/hivemind-codemap.ts`
119: 
120: ---
121: 
122: ## Module: doc-weaver.ts
123: **File:** `lib/code-intel/doc-weaver.ts`
124: **LOC:** 417
125: **Purpose:** Markdown document weaving — patch, upsert, append, insert, delete sections by heading
126: **Format Support:** Markdown (with frontmatter)
127: **Operation Types:** Read (outline, section content), Write (patch, upsert, append, insert, delete, frontmatter)
128: **Key Exports:**
129: - `DocWeaver` class — main weaver engine
130: - `readOutline(content)` — parse heading hierarchy
131: - `readSectionContent(content, heading)` — extract section body
132: - `patchSection(content, heading, newContent)` — replace section body
133: - `upsertSection(content, heading, newContent, level)` — replace or create section
134: - `appendToSection(content, heading, appendContent)` — append to section
135: - `insertAfterSection(content, afterHeading, newHeading, level, body)` — insert new section
136: - `deleteSection(content, heading)` — delete section
137: - `readFrontmatter(content)` — parse YAML frontmatter
138: - `writeFrontmatter(content, metadata)` — write/merge frontmatter
139: - `chunkByHeadings(content, maxChunkTokens)` — token-budget-aware chunking
140: - `batchPatchSections(content, ops)` — batch section operations
141: 
142: **Dependencies:**
143: - External: `remark` (markdown parser), `unist-util-visit`
144: 
145: **Used By:** `lib/doc-intel.ts` (top-level doc-intel imports from code-intel/doc-weaver.ts)
146: 
147: ---
148: 
149: ## Module: file-scanner.ts
150: **File:** `lib/code-intel/file-scanner.ts`
151: **LOC:** 191
152: **Purpose:** Recursive project file collection with gitignore/binary filtering
153: **Format Support:** All text files (detects language by extension)
154: **Operation Types:** Read (directory traversal)
155: **Key Exports:**
156: - `detectLanguage(filePath)` — extension-based language detection
157: - `scanFilesToCodeMap(projectRoot, options)` — legacy scanner (returns `{files: [{path}]}`)
158: - `scanToFullCodeMap(projectRoot, options)` — full scanner with hash, tokens, secrets
159: 
160: **Dependencies:**
161: - Internal: `gitignore-filter`, `binary-detector`, `token-counter`, `secret-detector`, `codemap-io`
162: 
163: **Used By:** `incremental-updater.ts` (via codemap-io)
164: 
165: ---
166: 
167: ## Module: gitignore-filter.ts
168: **File:** `lib/code-intel/gitignore-filter.ts`
169: **LOC:** 30
170: **Purpose:** Filter files based on .gitignore patterns
171: **Format Support:** N/A
172: **Operation Types:** Inspect (path filtering)
173: **Key Exports:**
174: - `createGitignoreFilter(projectRoot)` — creates filter instance with `isIgnored()` and `getPatterns()`
175: 
176: **Dependencies:**
177: - External: `ignore` npm package
178: 
179: **Used By:** `file-scanner.ts` (internal)
180: 
181: ---
182: 
183: ## Module: incremental-updater.ts
184: **File:** `lib/code-intel/incremental-updater.ts`
185: **LOC:** 258
186: **Purpose:** Incremental codemap updates on file change events with listener subscription
187: **Format Support:** All code files
188: **Operation Types:** Read (file content), Write (codemap mutation), Event subscription
189: **Key Exports:**
190: - `IncrementalUpdater` class — main updater engine
191: - `buildEntry(relativePath)` — build CodeMapEntry for a single file
192: - `updateFile(codemap, filePath, compressedCodemap?)` — delta update
193: - `removeFile(codemap, filePath, compressedCodemap?)` — file deletion
194: - `getStaleFiles(codemap)` — find files whose hash changed
195: - `onUpdate(callback)` — subscribe to update events
196: 
197: **Dependencies:**
198: - Internal: `token-counter`, `secret-detector`, `file-scanner`, `compressed-codemap`, `codemap-io`, `tree-sitter-loader`
199: 
200: **Used By:** `watch-integration.ts`
201: 
202: ---
203: 
204: ## Module: knowledge-commits.ts
205: **File:** `lib/code-intel/knowledge-commits.ts`
206: **LOC:** 190
207: **Purpose:** Atomic git commits for code intelligence state persistence
208: **Format Support:** JSON (codemap files)
209: **Operation Types:** Write (git commit)
210: **Key Exports:**
211: - `commitKnowledgeState(projectRoot, codemap, options)` — commit compressed codemap state
212: - `hasKnowledgeChanged(projectRoot)` — check for uncommitted changes
213: - `getLastKnowledgeCommit(projectRoot)` — get last knowledge commit info
214: 
215: **Dependencies:**
216: - Internal: `compressed-codemap`
217: - External: `node:child_process` (git exec)
218: 
219: **Used By:** `tools/hivemind-codemap.ts`
220: 
221: ---
222: 
223: ## Module: lsp-bridge.ts
224: **File:** `lib/code-intel/lsp-bridge.ts`
225: **LOC:** 103
226: **Purpose:** Bridge to Language Server Protocol for cross-file navigation (find references, go to definition)
227: **Format Support:** Any LSP-supported language
228: **Operation Types:** Read (LSP queries)
229: **Key Exports:**
230: - `LSPBridge` class — LSP client wrapper
231: - `isAvailable()` — check if LSP client connected
232: - `getBlastRadius(filePath, line, col)` — find all references
233: - `getDefinition(filePath, line, col)` — go to definition
234: 
235: **Dependencies:** None (interfaces with LSP client)
236: 
237: **Used By:** None in this archive
238: 
239: ---
240: 
241: ## Module: pattern-search.ts
242: **File:** `lib/code-intel/pattern-search.ts`
243: **LOC:** 191
244: **Purpose:** Fast pattern-first search on compressed codemap without full file reads
245: **Format Support:** TypeScript, JavaScript, Python, Go, Rust
246: **Operation Types:** Search (signature matching)
247: **Key Exports:**
248: - `searchPatterns(codemap, query)` — search by function/type/export/import/regex
249: - `findFunction(codemap, name)` — find functions
250: - `findType(codemap, name)` — find classes/interfaces/types
251: - `findExport(codemap, name)` — find exported symbols
252: - `findByPattern(codemap, pattern)` — find by regex
253: - `findImporters(codemap, source)` — find files importing a module
254: 
255: **Dependencies:**
256: - Internal: `compressed-codemap`
257: 
258: **Used By:** `tools/hivemind-codemap.ts`
259: 
260: ---
261: 
262: ## Module: secret-detector.ts
263: **File:** `lib/code-intel/secret-detector.ts`
264: **LOC:** 166
265: **Purpose:** Detect API keys, tokens, private keys, and other secrets in source code
266: **Format Support:** Any text file
267: **Operation Types:** Inspect (pattern scanning)
268: **Key Exports:**
269: - `detectSecrets(content, filePath?)` — returns `SecretMatch[]` with line/column
270: - `hasSecrets(content)` — boolean quick check
271: - `getSecretTypes(content)` — list of detected secret types
272: - `detectSecretsLegacy(content, filePath?)` — legacy API with `{kind, line, match}`
273: 
274: **Dependencies:** None (pure regex)
275: 
276: **Used By:** `file-scanner.ts`, `incremental-updater.ts`
277: 
278: ---
279: 
280: ## Module: selective-injector.ts
281: **File:** `lib/code-intel/selective-injector.ts`
282: **LOC:** 229
283: **Purpose:** Select source code for context injection based on file locks and token budget
284: **Format Support:** TypeScript, JavaScript, Python, Go, Rust
285: **Operation Types:** Transform (selective injection)
286: **Key Exports:**
287: - `selectSourceForInjection(codemap, fileLocks, budget)` — select files/signatures within budget
288: - `renderSourceSelectionXml(selection, budget)` — render as XML for cognitive packer
289: 
290: **Dependencies:**
291: - Internal: `compressed-codemap`
292: 
293: **Used By:** `tools/hivemind-codemap.ts`
294: 
295: ---
296: 
297: ## Module: signature-extractor.ts
298: **File:** `lib/code-intel/signature-extractor.ts`
299: **LOC:** 821
300: **Purpose:** Extract function/class/interface/type/enum signatures from source code using AST or regex fallback
301: **Format Support:** TypeScript, JavaScript, Python, Go, Rust
302: **Operation Types:** Read (signature extraction)
303: **Key Exports:**
304: - `extractSignatures(input)` — main extractor with AST or regex fallback
305: - `extractImportsRegex(content)` — fast import path extraction
306: - `extractExportsRegex(content)` — fast export name extraction
307: 
308: **Dependencies:**
309: - Internal: `tree-sitter-loader`
310: 
311: **Used By:** `compressed-codemap.ts`, `ast-surgeon.ts`
312: 
313: ---
314: 
315: ## Module: token-counter.ts
316: **File:** `lib/code-intel/token-counter.ts`
317: **LOC:** 95
318: **Purpose:** Count LLM tokens using tiktoken (cl100k_base) or deterministic fallback
319: **Format Support:** Any text
320: **Operation Types:** Inspect (token counting)
321: **Key Exports:**
322: - `countTokens(content)` — main counter
323: - `countTokensForFile(filePath)` — file-based counter
324: - `getEncoding()` — get active encoding name
325: 
326: **Dependencies:**
327: - External: `tiktoken` npm package (optional, falls back to char/4)
328: 
329: **Used By:** `ast-surgeon.ts`, `compressed-codemap.ts`, `file-scanner.ts`, `incremental-updater.ts`
330: 
331: ---
332: 
333: ## Module: tree-sitter-loader.ts
334: **File:** `lib/code-intel/tree-sitter-loader.ts`
335: **LOC:** 374
336: **Purpose:** Load Tree-sitter language parsers (WASM) for AST parsing
337: **Format Support:** TypeScript, JavaScript, JSON, Python, Go, Rust
338: **Operation Types:** Read (AST parsing)
339: **Key Exports:**
340: - `createTreeSitterFactory()` — recommended factory API
341: - `createTreeSitterLoader(options)` — legacy loader (deprecated)
342: - `extensionToLanguage(extension)` — map extension to language name
343: - `getSupportedExtensions()` — list supported extensions
344: 
345: **Dependencies:**
346: - External: `web-tree-sitter` npm package, `tree-sitter-*` language packages
347: 
348: **Used By:** `signature-extractor.ts`, `compressed-codemap.ts`, `ast-surgeon.ts`, `incremental-updater.ts`, `tools/hivemind-read-skeleton.ts`
349: 
350: ---
351: 
352: ## Module: watch-integration.ts
353: **File:** `lib/code-intel/watch-integration.ts`
354: **LOC:** 245
355: **Purpose:** Bridge FileSystemWatcher → IncrementalUpdater → EventBus for live codemap updates
356: **Format Support:** All code files
357: **Operation Types:** Read (file watching), Write (event emission)
358: **Key Exports:**
359: - `startWatchIntegration(projectRoot, codemap, options, compressedCodemap?, treeSitter?)` — start watching
360: - `WatchIntegration` interface — stop(), rescanAll(), getStatus()
361: 
362: **Dependencies:**
363: - Internal: `incremental-updater`, `codemap-io`, `compressed-codemap`, `tree-sitter-loader`
364: - External: `../watcher.js`, `../event-bus.js`
365: 
366: **Used By:** None in this archive
367: 
368: ---
369: 
370: ## Module: lib/doc-intel/formats/md.ts
371: **File:** `lib/doc-intel/formats/md.ts`
372: **LOC:** 388
373: **Purpose:** Full Markdown FormatWeaver implementation with remark AST parsing
374: **Format Support:** Markdown
375: **Operation Types:** Read, Write, Transform
376: **Key Exports:**
377: - `estimateTokens(content)` — rough token estimation
378: - `mdWeaver` object — FormatWeaver implementation with:
379:   - `readOutline(content)` — parse heading hierarchy
380:   - `readSection(content, id)` — read section body
381:   - `upsertSection(content, id, newContent, level)` — replace or create section
382:   - `writeSection(content, id, newContent)` — replace section body
383:   - `appendSection(content, id, newContent)` — append to section
384:   - `insertSection(content, afterId, newId, level, body)` — insert new section
385:   - `deleteSection(content, id)` — delete section
386:   - `readMetadata(content)` — parse YAML frontmatter
387:   - `writeMetadata(content, metadata)` — write/merge frontmatter
388:   - `chunkBySections(content, maxTokens)` — token-budget-aware chunking
389:   - `isWellFormed(content)` — markdown parse validation
390: 
391: **Dependencies:**
392: - External: `remark`, `unist-util-visit`, `mdast` types
393: 
394: **Used By:** `lib/doc-intel/index.ts`
395: 
396: ---
397: 
398: ## Module: lib/doc-intel/formats/json.ts
399: **File:** `lib/doc-intel/formats/json.ts`
400: **LOC:** 55
401: **Purpose:** JSON FormatWeaver stub — read-only (validate JSON, no section operations)
402: **Format Support:** JSON
403: **Operation Types:** Read (isWellFormed only)
404: **Key Exports:**
405: - `jsonWeaver` — FormatWeaver with all write ops throwing "Not implemented"
406: 
407: **Dependencies:** None
408: 
409: **Used By:** `lib/doc-intel/index.ts`
410: 
411: ---
412: 
413: ## Module: lib/doc-intel/formats/xml.ts
414: **File:** `lib/doc-intel/formats/xml.ts`
415: **LOC:** 55
416: **Purpose:** XML FormatWeaver stub — read-only (validate XML, no section operations)
417: **Format Support:** XML
418: **Operation Types:** Read (isWellFormed only)
419: **Key Exports:**
420: - `xmlWeaver` — FormatWeaver with all write ops throwing "Not implemented"
421: 
422: **Dependencies:** None
423: 
424: **Used By:** `lib/doc-intel/index.ts`
425: 
426: ---
427: 
428: ## Module: lib/doc-intel/formats/yaml.ts
429: **File:** `lib/doc-intel/formats/yaml.ts`
430: **LOC:** 83
431: **Purpose:** YAML FormatWeaver stub with basic validation
432: **Format Support:** YAML
433: **Operation Types:** Read (isWellFormed only)
434: **Key Exports:**
435: - `yamlWeaver` — FormatWeaver with all write ops throwing "Not implemented"
436: 
437: **Dependencies:** None
438: 
439: **Used By:** `lib/doc-intel/index.ts`
440: 
441: ---
442: 
443: ## Module: lib/doc-intel/index.ts
444: **File:** `lib/doc-intel/index.ts`
445: **LOC:** 58
446: **Purpose:** Barrel export and format registry for doc-intel FormatWeavers
447: **Format Support:** Markdown, XML, JSON, YAML
448: **Operation Types:** Export/registry only
449: **Key Exports:**
450: - `getWeaver(ext)` — get FormatWeaver by extension
451: - `getSupportedExtensions()` — list supported extensions
452: - `isExtensionSupported(ext)` — check support
453: - `mdWeaver`, `xmlWeaver`, `jsonWeaver`, `yamlWeaver` — format weavers
454: 
455: **Dependencies:**
456: - Internal: `formats/md`, `formats/xml`, `formats/json`, `formats/yaml`
457: 
458: **Used By:** `write-ops.ts`, `read-ops.ts`
459: 
460: ---
461: 
462: ## Module: lib/doc-intel/types.ts
463: **File:** `lib/doc-intel/types.ts`
464: **LOC:** 112
465: **Purpose:** Type definitions for doc-intel operations and write results
466: **Format Support:** N/A (types)
467: **Operation Types:** N/A
468: **Key Exports:**
469: - `HeadingHierarchy` — nested heading with level, text, line, children
470: - `DocumentChunk` — token-budget chunk with heading, content, tokenEstimate
471: - `FormatWeaver` interface — all format operations
472: - `WriteResult` — write operation result with hash, bytesChanged, opId
473: - `ChunkWriteSignal` — signal for section-by-section writes
474: - `CreateVerificationReceipt` — read-after-write verification
475: - `CreateDocumentResult` — document creation result
476: - `BatchEditOp` — single section operation
477: - `BatchFileOp` — multi-file operation
478: - `BatchFileResult` — per-file batch result
479: 
480: **Dependencies:** None
481: 
482: **Used By:** `write-ops.ts`, `read-ops.ts`, `index.ts`
483: 
484: ---
485: 
486: ## Module: lib/doc-intel/safety.ts
487: **File:** `lib/doc-intel/safety.ts`
488: **LOC:** 120
489: **Purpose:** Path validation, file-type guards, and governance write denylist enforcement
490: **Format Support:** N/A
491: **Operation Types:** Inspect
492: **Key Exports:**
493: - `safePath(projectRoot, filePath)` — resolve path with traversal prevention
494: - `isWritable(filePath)` — check if extension allows writes
495: - `isDocument(filePath)` — check if recognized document type
496: - `relativeProjectPath(projectRoot, absPath)` — normalize to project-relative
497: - `matchGovernanceWriteDenylist(normalizedPath)` — check governance patterns
498: - `assertGovernanceWriteAllowed(projectRoot, absPath, allowGovernance)` — enforcement
499: 
500: **Dependencies:** None
501: 
502: **Used By:** `write-ops.ts`, `read-ops.ts`
503: 
504: ---
505: 
506: ## Module: lib/doc-intel/read-ops.ts
507: **File:** `lib/doc-intel/read-ops.ts`
508: **LOC:** 664
509: **Purpose:** All read operations for document intelligence (skim, search, list, index, xref, context)
510: **Format Support:** Markdown, XML, JSON, YAML
511: **Operation Types:** Read
512: **Key Exports:**
513: - `skimDocument(projectRoot, filePath)` — extract outline, metadata, size
514: - `skimDirectory(projectRoot, dirPath, glob?)` — batch skim
515: - `listDocuments(projectRoot, dirPath, options?)` — list with metadata
516: - `searchDocuments(projectRoot, dirPath, query, options?)` — keyword/regex search
517: - `indexDocuments(projectRoot, dirPath, glob?)` — comprehensive index
518: - `xrefDocuments(projectRoot, dirPath, glob?)` — cross-reference analysis
519: - `contextExtract(projectRoot, dirPath, query, tokenBudget, glob?)` — smart context
520: 
521: **Dependencies:**
522: - Internal: `index` (getWeaver), `safety`
523: 
524: **Used By:** Not imported directly in this archive (merged into doc-intel.ts)
525: 
526: ---
527: 
528: ## Module: lib/doc-intel/write-ops.ts
529: **File:** `lib/doc-intel/write-ops.ts`
530: **LOC:** 877
531: **Purpose:** All write operations with locking, atomic writes, chunking guards, and verification
532: **Format Support:** Markdown, XML, JSON, YAML
533: **Operation Types:** Write
534: **Key Exports:**
535: - `upsertSection(projectRoot, filePath, heading, content, level?, expectedHash?, allowGovernance?)` — write or create
536: - `writeSection(projectRoot, filePath, heading, content, expectedHash?, allowGovernance?)` — replace section
537: - `appendSection(projectRoot, filePath, heading, content, expectedHash?, allowGovernance?)` — append to section
538: - `insertSection(projectRoot, filePath, afterHeading, newHeading, level, body, expectedHash?, allowGovernance?)` — insert section
539: - `deleteSection(projectRoot, filePath, heading, expectedHash?, allowGovernance?)` — delete section
540: - `writeMetadata(projectRoot, filePath, metadata, expectedHash?, allowGovernance?)` — frontmatter update
541: - `createDocument(projectRoot, filePath, title, metadata?, initialContent?, allowGovernance?)` — create new doc
542: - `batchEdit(projectRoot, filePath, ops, expectedHash?, allowGovernance?)` — single file batch
543: - `batchFiles(projectRoot, ops, allowGovernance?)` — multi-file batch
544: 
545: **Dependencies:**
546: - Internal: `index` (getWeaver), `types`, `safety`
547: - External: `proper-lockfile` npm package
548: 
549: **Used By:** Not imported directly in this archive (merged into doc-intel.ts)
550: 
551: ---
552: 
553: ## Module: lib/doc-intel.ts (top-level)
554: **File:** `lib/doc-intel.ts`
555: **LOC:** 1,785
556: **Purpose:** Unified document intelligence library — monolithic aggregator combining all doc-intel operations
557: **Format Support:** Markdown, XML, JSON, YAML
558: **Operation Types:** Read, Write, Search, Index, Cross-reference, Context extraction
559: **Key Exports:**
560: - `skimDocument/projectRoot, filePath)` — extract outline, metadata, size
561: - `skimDirectory(projectRoot, dirPath, glob?)` — batch skim
562: - `readSection(projectRoot, filePath, heading)` — extract section by heading
563: - `readChunked(projectRoot, filePath, heading?, maxTokens?)` — token-budget chunked read
564: - `readMetadata(projectRoot, filePath)` — frontmatter extraction
565: - `readLines(projectRoot, filePath, startLine, endLine)` — line range read
566: - `generateTOC(projectRoot, filePath)` — markdown TOC generation
567: - `upsertSection/writeSection/appendSection/insertSection/deleteSection` — all section operations
568: - `writeMetadata(projectRoot, filePath, metadata)` — frontmatter update
569: - `createDocument(projectRoot, filePath, title, metadata?, initialContent?)` — document creation
570: - `batchEdit/batchFiles` — batch operations
571: - `inspectCode(projectRoot, filePath)` — extract JSDoc, comments, exports, signatures
572: - `searchDocuments(projectRoot, dirPath, query, options?)` — keyword/regex search
573: - `listDocuments(projectRoot, dirPath, options?)` — document listing
574: - `indexDocuments(projectRoot, dirPath, glob?)` — comprehensive index
575: - `xrefDocuments(projectRoot, dirPath, glob?)` — cross-reference analysis
576: - `contextExtract(projectRoot, dirPath, query, tokenBudget, glob?)` — smart context
577: 
578: **Internal Dependencies:**
579: - `DocWeaver` from `code-intel/doc-weaver.ts`
580: - All doc-intel types from `doc-intel/types.ts`
581: 
582: **Used By:** `tools/hivemind-doc.ts`, `tools/hivemind-doc-weaver.ts`
583: 
584: ---
585: 
586: ## Tool: hivemind-doc.ts
587: **File:** `tools/hivemind-doc.ts`
588: **LOC:** 911
589: **Purpose:** Unified V2 document intelligence tool with 20 actions (supersedes hivemind_doc_weaver)
590: **Format Support:** Markdown, XML, JSON, YAML
591: **Operation Types:** All doc-intel read/write operations as OpenCode tool
592: **Key Exports:**
593: - `createHivemindDocTool(directory)` — OpenCode tool definition
594: 
595: **Actions:**
596: - skim, read, read_lines, metadata, list, search, inspect, index, xref, context (read side)
597: - write, upsert, append, insert, delete, batch, batch_files, set_metadata, create, toc (write side)
598: 
599: **Dependencies:**
600: - Internal: `doc-intel.js` (lib/doc-intel.ts)
601: 
602: ---
603: 
604: ## Tool: hivemind-doc-weaver.ts
605: **File:** `tools/hivemind-doc-weaver.ts`
606: **LOC:** 72
607: **Purpose:** Legacy compatibility wrapper — routes old callers through new writeSection path
608: **Format Support:** Markdown
609: **Operation Types:** Write (section patching)
610: **Key Exports:**
611: - `createHivemindDocWeaverTool(directory)` — compatibility tool definition
612: 
613: **Dependencies:**
614: - Internal: `lib/doc-intel.js` (writeSection)
615: 
616: ---
617: 
618: ## Tool: hivemind-inspect.ts
619: **File:** `tools/hivemind-inspect.ts`
620: **LOC:** 81
621: **Purpose:** Unified session state inspection tool (merged from scan_hierarchy, think_back, check_drift)
622: **Format Support:** N/A (session state)
623: **Operation Types:** Inspect
624: **Key Exports:**
625: - `createHivemindInspectTool(directory)` — OpenCode tool definition
626: 
627: **Actions:** scan, deep, drift, introspect, traverse
628: 
629: **Dependencies:**
630: - Internal: `lib/inspect-engine.js` (scanState, deepInspect, driftReport, introspectState, traverseState)
631: 
632: ---
633: 
634: ## Tool: hivemind-read-skeleton.ts
635: **File:** `tools/hivemind-read-skeleton.ts`
636: **LOC:** 57
637: **Purpose:** Extract AST skeleton for a source file using Tree-sitter
638: **Format Support:** TypeScript, JavaScript, Python, Go, Rust
639: **Operation Types:** Read (AST extraction)
640: **Key Exports:**
641: - `createHivemindReadSkeletonTool(directory)` — OpenCode tool definition
642: 
643: **Dependencies:**
644: - Internal: `lib/code-intel/index.js` (ASTSurgeon, createTreeSitterFactory)
645: 
646: ---
647: 
648: ## Tool: hivemind-codemap.ts
649: **File:** `tools/hivemind-codemap.ts`
650: **LOC:** 316
651: **Purpose:** Code Intelligence tool — scan, compress, status, search, inject, commit
652: **Format Support:** All code files
653: **Operation Types:** Read, Write, Search, Transform
654: **Key Exports:**
655: - `createHivemindCodemapTool(directory)` — OpenCode tool definition
656: 
657: **Actions:**
658: - scan — scan project to codemap
659: - compress — compress codemap to signatures
660: - status — show codemap status
661: - search — pattern search (function, type, export, importer, pattern)
662: - inject — select source for context injection
663: - commit — commit knowledge state to git
664: 
665: **Dependencies:**
666: - Internal: `lib/code-intel/index.js` (all exports), `lib/paths.js`
667: 
668: ---
669: 
670: ## Tool: hivemind-hierarchy.ts
671: **File:** `tools/hivemind-hierarchy.ts`
672: **LOC:** 204
673: **Purpose:** Hierarchy tree management tool (merged from hierarchy_prune, hierarchy_migrate)
674: **Format Support:** N/A (hierarchy JSON)
675: **Operation Types:** Read, Write
676: **Key Exports:**
677: - `createHivemindHierarchyTool(directory)` — OpenCode tool definition
678: 
679: **Actions:** prune (dry-run supported), migrate, status
680: 
681: **Dependencies:**
682: - Internal: `lib/hierarchy-tree.js` (loadTree, saveTree, pruneCompleted, migrateNode, etc.)
683: 
684: ---
685: 
686: ## Dependency Graph
687: 
688: ```
689: lib/doc-intel.ts (top-level)
690: ├── code-intel/doc-weaver.ts (DocWeaver)
691: ├── doc-intel/types.ts
692: ├── doc-intel/safety.ts
693: └── doc-intel/formats/*.ts (mdWeaver, xmlWeaver, jsonWeaver, yamlWeaver)
694: 
695: lib/doc-intel/index.ts
696: ├── doc-intel/types.ts
697: ├── doc-intel/formats/md.ts (remark, mdast)
698: ├── doc-intel/formats/json.ts
699: ├── doc-intel/formats/xml.ts
700: └── doc-intel/formats/yaml.ts
701: 
702: lib/doc-intel/read-ops.ts
703: ├── doc-intel/index.ts (getWeaver)
704: └── doc-intel/safety.ts
705: 
706: lib/doc-intel/write-ops.ts
707: ├── doc-intel/index.ts (getWeaver)
708: ├── doc-intel/types.ts
709: ├── doc-intel/safety.ts
710: └── proper-lockfile npm
711: 
712: lib/code-intel/index.ts (barrel)
713: ├── code-intel/gitignore-filter.ts (ignore npm)
714: ├── code-intel/binary-detector.ts
715: ├── code-intel/secret-detector.ts
716: ├── code-intel/token-counter.ts (tiktoken npm)
717: ├── code-intel/file-scanner.ts
718: ├── code-intel/codemap-io.ts
719: ├── code-intel/tree-sitter-loader.ts (web-tree-sitter npm, tree-sitter-* npm)
720: ├── code-intel/signature-extractor.ts
721: ├── code-intel/compressed-codemap.ts
722: ├── code-intel/incremental-updater.ts
723: ├── code-intel/watch-integration.ts (watcher.js, event-bus.js)
724: ├── code-intel/selective-injector.ts
725: ├── code-intel/pattern-search.ts
726: ├── code-intel/knowledge-commits.ts (git exec)
727: ├── code-intel/ast-surgeon.ts (magic-string npm)
728: ├── code-intel/doc-weaver.ts (remark, mdast)
729: └── code-intel/lsp-bridge.ts
730: 
731: tools/hivemind-doc.ts
732: └── lib/doc-intel.ts
733: 
734: tools/hivemind-doc-weaver.ts
735: └── lib/doc-intel.ts (writeSection)
736: 
737: tools/hivemind-codemap.ts
738: └── lib/code-intel/index.ts
739: 
740: tools/hivemind-read-skeleton.ts
741: └── lib/code-intel/index.ts (ASTSurgeon, createTreeSitterFactory)
742: 
743: tools/hivemind-inspect.ts
744: └── lib/inspect-engine.js
745: 
746: tools/hivemind-hierarchy.ts
747: └── lib/hierarchy-tree.js
748: ```
749: 
750: ---
751: 
752: ## Capability Inventory Matrix
753: 
754: | Capability | lib/code-intel | lib/doc-intel | lib/doc-intel.ts | tools/* |
755: |-----------|---------------|---------------|------------------|---------|
756: | **Section Read** | doc-weaver.ts (markdown) | formats/md.ts | ✓ (all formats via weaver) | hivemind-doc.ts |
757: | **Section Write** | doc-weaver.ts | write-ops.ts (upsert/write/append/insert/delete) | ✓ (monolithic) | hivemind-doc.ts |
758: | **AST Parse** | tree-sitter-loader.ts, signature-extractor.ts | — | — | hivemind-read-skeleton.ts |
759: | **Outline Extraction** | doc-weaver.ts | formats/md.ts | ✓ (skimDocument) | hivemind-doc.ts |
760: | **Token Counting** | token-counter.ts | — | estimateTokens | hivemind-codemap.ts |
761: | **Secret Detection** | secret-detector.ts | — | — | — |
762: | **Pattern Search** | pattern-search.ts | — | — | hivemind-codemap.ts |
763: | **Language Detection** | file-scanner.ts | — | — | — |
764: | **Codemap I/O** | codemap-io.ts | — | — | hivemind-codemap.ts |
765: | **Codemap Compression** | compressed-codemap.ts | — | — | hivemind-codemap.ts |
766: | **Incremental Updates** | incremental-updater.ts, watch-integration.ts | — | — | — |
767: | **Source Injection** | selective-injector.ts | — | — | hivemind-codemap.ts |
768: | **Knowledge Commits** | knowledge-commits.ts | — | — | hivemind-codemap.ts |
769: | **File Scanning** | file-scanner.ts | — | — | hivemind-codemap.ts |
770: | **LSP Bridge** | lsp-bridge.ts | — | — | — |
771: | **Code Surgery** | ast-surgeon.ts | — | — | hivemind-read-skeleton.ts |
772: | **Document Search** | — | read-ops.ts | ✓ (searchDocuments) | hivemind-doc.ts |
773: | **Document List** | — | read-ops.ts | ✓ (listDocuments) | hivemind-doc.ts |
774: | **Document Index** | — | read-ops.ts | ✓ (indexDocuments) | hivemind-doc.ts |
775: | **Cross-References** | — | read-ops.ts | ✓ (xrefDocuments) | hivemind-doc.ts |
776: | **Smart Context** | — | read-ops.ts | ✓ (contextExtract) | hivemind-doc.ts |
777: | **Batch Operations** | — | write-ops.ts | ✓ (batchEdit/batchFiles) | hivemind-doc.ts |
778: | **Document Create** | — | write-ops.ts | ✓ (createDocument) | hivemind-doc.ts |
779: | **Frontmatter Ops** | — | formats/md.ts, write-ops.ts | ✓ (read/writeMetadata) | hivemind-doc.ts |
780: | **Hierarchy Mgmt** | — | — | — | hivemind-hierarchy.ts |
781: | **Session Inspect** | — | — | — | hivemind-inspect.ts |
782: 
783: ---
784: 
785: ## Special Focus Findings
786: 
787: ### doc-intel.ts vs lib/doc-intel/ Relationship
788: 
789: **`lib/doc-intel.ts`** (1,785 LOC) is the **monolithic top-level aggregator** that combines all doc-intel functionality into a single module. It:
790: - Imports `DocWeaver` from `code-intel/doc-weaver.ts`
791: - Contains ALL type definitions inline
792: - Implements ALL operations directly (not delegating to submodules)
793: - Has its own safety, locking, path resolution, and format rendering logic
794: 
795: **`lib/doc-intel/`** (8 files, ~2,412 LOC) is the **modular decomposition** where:
796: - `index.ts` — format registry and weaver exports
797: - `types.ts` — shared type definitions
798: - `safety.ts` — path and governance safety
799: - `read-ops.ts` — all read operations (664 LOC)
800: - `write-ops.ts` — all write operations (877 LOC)
801: - `formats/*.ts` — format-specific implementations
802: 
803: **The monolithic `doc-intel.ts` predates/duplicates the modular `lib/doc-intel/` structure.** Tools import from `doc-intel.ts`, not from `lib/doc-intel/`.
804: 
805: ---
806: 
807: ### doc-weaver.ts — What "Weaving" Means
808: 
809: In this codebase, **weaving** refers to **section-aware document patching**:
810: - Not code generation or aspect-oriented weaving
811: - Operations: `patchSection`, `upsertSection`, `appendToSection`, `insertAfterSection`, `deleteSection`
812: - Uses heading text as section identifiers
813: - Backs up full document before changes
814: - Operates on remark AST for accurate boundary detection
815: 
816: **DocWeaver** in `lib/code-intel/doc-weaver.ts` (417 LOC) is the **markdown-specific** implementation.
817: **lib/doc-intel/formats/md.ts** (388 LOC) is the **markdown FormatWeaver** that implements the generic `FormatWeaver` interface from `lib/doc-intel/types.ts`.
818: 
819: ---
820: 
821: ### write-ops.ts — Write Operations in Legacy doc-intel
822: 
823: The legacy doc-intel had comprehensive write operations with:
824: 
825: 1. **File Locking** — advisory locks via `proper-lockfile` npm
826: 2. **Atomic Writes** — temp file + rename pattern
827: 3. **Content Hashing** — SHA-256 for change detection
828: 4. **Chunking Guard** — 400+ LOC files return `chunk_required` signal
829: 5. **Governance Denylist** — blocks writes to `.hivemind/**`, `.opencode/**`, `opencode.json`, `AGENTS.md`, `CLAUDE.md`
830: 6. **Format-Aware Dispatch** — delegates to FormatWeaver by extension
831: 7. **Verification Receipts** — read-after-write verification for create operations
832: 
833: **Supported write operations:**
834: - `upsertSection` — replace or create
835: - `writeSection` — replace only
836: - `appendSection` — append to section
837: - `insertSection` — insert after heading
838: - `deleteSection` — remove section + content
839: - `writeMetadata` — frontmatter update
840: - `createDocument` — new file with scaffold
841: - `batchEdit` — multiple ops on one file
842: - `batchFiles` — multi-file batch
843: 
844: ---
845: 
846: ### ast-surgeon.ts — Code Surgery Capabilities
847: 
848: The `ASTSurgeon` class provides surgical code manipulation:
849: 
850: 1. **`extractSkeleton(filePath)`** — extracts:
851:    - Imports list
852:    - Exports list
853:    - All signatures (function/class/interface/type)
854:    - Compressed view (signatures-only text)
855:    - Token counts (original vs skeleton)
856: 
857: 2. **`getSymbolRange(filePath, symbolName)`** — gets exact byte range for a symbol
858: 
859: 3. **`patchSymbol(filePath, symbolName, newCode)`** — surgical replacement:
860:    - Uses `magic-string` for accurate range replacement
861:    - Creates backup before patching
862:    - Returns success/bytesChanged/backup
863: 
864: **Requires:** Tree-sitter instance for AST parsing
865: 
866: ---
867: 
868: ### signature-extractor.ts — Code Intelligence Provided
869: 
870: **Languages supported:** TypeScript, JavaScript (including TSX), Python, Go, Rust
871: 
872: **For each signature extracts:**
873: - Type: function/class/interface/type/variable/import
874: - Name
875: - Full signature string
876: - Line range (start/end)
877: - Byte range (startIndex/endIndex)
878: - Docstring (JSDoc above declaration)
879: - Parameters (name, type, optional, default)
880: - Return type
881: - Export flag
882: 
883: **Dual extraction modes:**
884: 1. **AST-based** (with Tree-sitter) — accurate parameter parsing, type extraction
885: 2. **Regex fallback** — when no Tree-sitter available
886: 
887: **Utility exports:**
888: - `extractImportsRegex(content)` — fast import path extraction
889: - `extractExportsRegex(content)` — fast export name extraction
890: 
891: ---
892: 
893: ### lsp-bridge.ts — LSP Integration
894: 
895: **Design:** Wrapper around external LSP client (not a full LSP implementation)
896: 
897: **Capabilities:**
898: - `getBlastRadius(filePath, line, col)` — find all references to a symbol
899: - `getDefinition(filePath, line, col)` — go to definition
900: 
901: **Interface methods checked dynamically** (fallback chain):
902: - `findReferences` → `references` → `getReferences`
903: - `getDefinition` → `definition` → `findDefinition`
904: 
905: **Graceful degradation:** Returns empty array/null if LSP unavailable
906: 
907: ---
908: 
909: ### tree-sitter-loader.ts — Tree-sitter Usage
910: 
911: **Architecture:**
912: - Factory pattern (`createTreeSitterFactory`) — recommended API
913: - WASM-based language loading from `tree-sitter-*` npm packages
914: - Singleton parser per factory instance
915: - Per-language caching
916: 
917: **Supported languages with npm packages:**
918: ```
919: typescript → tree-sitter-typescript
920: tsx → tree-sitter-typescript
921: javascript → tree-sitter-javascript
922: json → tree-sitter-json
923: python → tree-sitter-python
924: go → tree-sitter-go
925: rust → tree-sitter-rust
926: ```
927: 
928: **Key interface:**
929: ```typescript
930: interface TreeSitterNode {
931:   type: string
932:   text: string
933:   startIndex: number
934:   endIndex: number
935:   startPosition: { row: number; column: number }
936:   endPosition: { row: number; column: number }
937:   children: TreeSitterNode[]
938:   isNamed: boolean
939:   childForFieldName(fieldName: string): TreeSitterNode | null
940:   childrenForFieldName(fieldName: string): TreeSitterNode[]
941: }
942: ```
943: 
944: **Graceful degradation:** Throws on init failure, `parse()` returns null if language not loaded
945: 
946: ---
947: 
948: ## Gaps
949: 
950: 1. **lib/doc-intel.ts and lib/doc-intel/ are redundant** — same functionality duplicated
951: 2. **XML/YAML/JSON FormatWeavers are stubs** — only `mdWeaver` is fully implemented
952: 3. **LSP bridge not integrated** — `lsp-bridge.ts` exists but not connected to any tool
953: 4. **Watch integration not connected** — `watch-integration.ts` exists but not wired to tools
954: 5. **Code inspection in doc-intel.ts uses regex** — not Tree-sitter like signature-extractor
955: 6. **No real-time collaboration** — locking is advisory only, no CRDT or operational transform

(End of file - total 955 lines)
</content>
```

---
**Tool:** read

**Input:**
```json
{"filePath":"/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/investigation-report-tier-architecture-2026-03-31.md"}
```

**Output:**
```
<path>/Users/apple/hivemind-plugin/.worktrees/product-detox/.hivemind/activity/agents/hivexplorer/investigation-report-tier-architecture-2026-03-31.md</path>
<type>file</type>
<content>1: # Tier Architecture Investigation Report
2: 
3: **Scope:** Map Tier 1 (Hard Harness), Tier 2 (Opencode-Dependable), and Tier 3 (Skills) implementations  
4: **Question:** From OVERVIEW.md - classify all implementations into the three-tier model  
5: **Investigation Completed:** 2026-03-31  
6: **Git Commit:** d351aecf (External research: AI agent tool design best practices)
7: 
8: ---
9: 
10: ## Executive Summary
11: 
12: The codebase implements a three-tier architecture with clear separation of concerns:
13: 
14: | Tier | Definition | Implementation Location | Status |
15: |------|------------|------------------------|--------|
16: | **Tier 1: Hard Harness** | SDK, deterministic, programmatic, npm packages | `src/plugin/`, `src/sdk-supervisor/`, `src/schema-kernel/`, `src/cli.ts`, `src/core/` | **EXISTS AND WORKS** |
17: | **Tier 2: Opencode-Dependable** | Plugins, hooks, commands, agents, sub-agents | `src/hooks/`, `src/commands/slash-command/`, `src/tools/`, `.opencode/agents/` | **EXISTS AND WORKS** |
18: | **Tier 3: Skills** | Platform-agnostic, fail-safe, installed via npx | `skills/`, `.opencode/skills/` | **EXISTS AND WORKS** |
19: 
20: ---
21: 
22: ## Tier 1: Hard Harness
23: 
24: ### SDK Usage
25: 
26: **OpenCode SDK Imports (32 instances across codebase):**
27: 
28: | File | Line | Import | Purpose |
29: |------|------|--------|---------|
30: | `src/plugin/opencode-plugin.ts` | 8 | `import { type Plugin } from '@opencode-ai/plugin'` | Plugin type definition |
31: | `src/tools/runtime/tools.ts` | 8 | `import { tool } from '@opencode-ai/plugin/tool'` | Tool creation |
32: | `src/tools/task/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Task tool |
33: | `src/tools/trajectory/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Trajectory tool |
34: | `src/tools/handoff/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Handoff tool |
35: | `src/tools/doc/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Doc tool |
36: | `src/tools/hivefiver-init/tools.ts` | 9 | `import { tool } from '@opencode-ai/plugin/tool'` | Init tool |
37: | `src/tools/hivefiver-doctor/tools.ts` | 9 | `import { tool } from '@opencode-ai/plugin/tool'` | Doctor tool |
38: | `src/tools/hivefiver-setting/tools.ts` | 8 | `import { tool } from '@opencode-ai/plugin/tool'` | Settings tool |
39: | `src/tools/hivemind-journal.ts` | 17 | `import { tool, type ToolDefinition } from '@opencode-ai/plugin'` | Journal tool |
40: | `src/features/agent-work-contract/tools/create-contract-tool.ts` | 11 | `import { tool } from '@opencode-ai/plugin/tool'` | Contract creation |
41: | `src/features/agent-work-contract/tools/export-contract-tool.ts` | 1 | `import { tool, type ToolContext } from '@opencode-ai/plugin/tool'` | Contract export |
42: | `src/features/agent-work-contract/tools/classify-intent-tool.ts` | 1 | `import { tool, type ToolContext } from '@opencode-ai/plugin/tool'` | Intent classification |
43: | `src/hooks/event-handler.ts` | 1 | `import type { Event } from '@opencode-ai/sdk'` | Event types |
44: | `src/hooks/sdk-context.ts` | 1 | `import type { PluginInput } from '@opencode-ai/plugin'` | SDK context |
45: | `src/control-plane/sdk-runtime.ts` | 1 | `import { createOpencode, createOpencodeClient, type OpencodeClient, type ServerOptions } from '@opencode-ai/sdk'` | SDK runtime |
46: 
47: **NPM Dependencies that form the Hard Harness:**
48: 
49: From `package.json` lines 76-97:
50: ```json
51: "dependencies": {
52:   "@opencode-ai/plugin": ">=1.1.0",
53:   "@opencode-ai/sdk": "^1.2.27",
54:   "zod": "^4.3.6",
55:   "yaml": "^2.8.2",
56:   "typescript": "^5.3.0",
57:   "fast-glob": "^3.3.3",
58:   "proper-lockfile": "^4.1.2",
59:   "remark": "^15.0.1",
60:   "unist-util-visit": "^5.1.0",
61:   "web-tree-sitter": "^0.26.5",
62:   "magic-string": "^0.30.21"
63: }
64: ```
65: 
66: ### Deterministic/Programmatic Implementations
67: 
68: | Component | File | Evidence | Purpose |
69: |-----------|------|----------|---------|
70: | **Plugin Assembly** | `src/plugin/opencode-plugin.ts:90-257` | `export const HiveMindPlugin: Plugin = async (input) => { ... }` | Main plugin entry - assembles all hooks and tools |
71: | **SDK Supervisor** | `src/sdk-supervisor/runtime-status.ts:184-300` | `buildRuntimeStatusSnapshot()` function | Programmatic runtime status building |
72: | **Schema Kernel** | `src/schema-kernel/` | 9 files including `agent-records.ts`, `config-records.ts`, `default-agent-templates.ts` | Contract schemas for persisted records |
73: | **CLI Entry** | `src/cli.ts:101-178` | `runCli()` function | Programmatic CLI routing |
74: | **Core Trajectory** | `src/core/trajectory/` | 9 files | Deterministic trajectory ledger |
75: | **Core Workflow** | `src/core/workflow-management/` | 8 files | Workflow authority, task lifecycle |
76: 
77: ---
78: 
79: ## Tier 2: Opencode-Dependable
80: 
81: ### Plugins
82: 
83: **Main Plugin:**
84: | File | Lines | Evidence |
85: |------|-------|----------|
86: | `src/plugin/opencode-plugin.ts` | 1-257 | `HiveMindPlugin` exported as default |
87: 
88: **Plugin Sub-components (25 files in `src/plugin/`):**
89: - `compaction-adapter.ts` - Compaction handling
90: - `context-renderer.*.ts` (6 files) - Context rendering pipeline
91: - `evidence-reporter.ts` - Evidence reporting
92: - `messages-transform-adapter.ts` - Message transformation
93: - `skill-exposure-map.ts` - Skill injection
94: - `synthetic-parts.ts` - Synthetic parts generation
95: - `runtime-snapshot.ts` - Turn snapshot loading
96: 
97: ### Hooks (16 files in `src/hooks/`)
98: 
99: | Hook File | Purpose | Key Evidence |
100: |-----------|---------|--------------|
101: | `event-handler.ts` | All OpenCode lifecycle events | `createEventHandler()` at line 172 |
102: | `chat-message-handler.ts` | Track messages per-session | `handleChatMessage()` |
103: | `tool-execution-handler.ts` | Post-tool observation | `handleToolExecution()` |
104: | `text-complete-handler.ts` | Streaming text injection | `createTextCompleteHandler()` |
105: | `compaction-handler.ts` | Session compaction | `createCompactionHandler()` |
106: | `transform-handler.ts` | System prompt modification | `createTransformHandler()` |
107: | `sdk-context.ts` | SDK context initialization | `initSdkContext()` |
108: | `soft-governance.ts` | Governance toasts | `showGovernanceToast()` |
109: | `runtime-loader/index.ts` | Runtime loading | Exports `isHivemindManagedTool`, `recordToolEvent` |
110: | `start-work/index.ts` | Start work hooks | 6 files |
111: | `auto-slash-command/index.ts` | Auto slash command | 5 files |
112: | `workflow-integration/index.ts` | Workflow hooks | 4 files |
113: 
114: **Hook Registration (in `opencode-plugin.ts` lines 115-250):**
115: ```typescript
116: return {
117:   event: async (eventInput) => { await eventHandler(eventInput) },
118:   'experimental.chat.system.transform': async (input, output) => { ... },
119:   'chat.message': async (messageInput, output) => { ... },
120:   'permission.ask': async (permissionInput, output) => { ... },
121:   'tool.execute.before': async (toolInput, _output) => { ... },
122:   'tool.execute.after': async (toolInput, output) => { ... },
123:   'shell.env': async (_input, output) => { ... },
124:   'command.execute.before': async (commandInput, output) => { ... },
125:   'experimental.text.complete': async (input, output) => { ... },
126:   'experimental.chat.messages.transform': messagesTransform,
127:   'experimental.session.compacting': async (input, output) => { ... },
128: }
129: ```
130: 
131: ### Commands (Slash Commands)
132: 
133: **Location:** `src/commands/slash-command/`
134: 
135: | File | Lines | Purpose |
136: |------|-------|---------|
137: | `command-bundles.ts` | 179 | Defines 10 command bundles (hm-init, hm-doctor, hm-harness, hm-settings, hm-research, hm-plan, hm-implement, hm-verify, hm-tdd, hm-course-correct) |
138: | `command-types.ts` | - | Type definitions |
139: | `command-discovery.ts` | - | Command discovery |
140: | `command-runner.ts` | - | Command execution |
141: | `index.ts` | - | Barrel export |
142: 
143: ### Tools (14 files in `src/tools/`)
144: 
145: | Tool Directory | Tool Name | File | Evidence |
146: |----------------|-----------|------|----------|
147: | `runtime/` | `hivemind_runtime_status` | `tools.ts:21-35` | `createHivemindRuntimeStatusTool()` |
148: | `runtime/` | `hivemind_runtime_command` | `tools.ts:41-82` | `createHivemindRuntimeCommandTool()` |
149: | `task/` | `hivemind_task` | `tools.ts` | Task management |
150: | `trajectory/` | `hivemind_trajectory` | `tools.ts` | Trajectory control |
151: | `handoff/` | `hivemind_handoff` | `tools.ts` | Handoff management |
152: | `doc/` | `hivemind_doc` | `tools.ts` | Document intelligence |
153: | `hivemind-journal.ts` | `hivemind_journal` | - | Session journaling |
154: | `hivefiver-init/` | `hivemind_hm_init` | - | Init command |
155: | `hivefiver-doctor/` | `hivemind_hm_doctor` | - | Doctor command |
156: | `hivefiver-setting/` | `hivemind_hm_setting` | - | Settings command |
157: | `agent-work-contract/` | `hivemind_agent_work_create_contract` | - | Contract creation |
158: | `agent-work-contract/` | `hivemind_agent_work_export_contract` | - | Contract export |
159: 
160: ### Agents (14 files in `.opencode/agents/`)
161: 
162: | Agent | File | Purpose |
163: |-------|------|---------|
164: | `hiveminder` | `hiveminder.md` | Orchestrator role |
165: | `hivefiver` | `hivefiver.md` | Executor role |
166: | `hiveplanner` | `hiveplanner.md` | Planning |
167: | `hivemaker` | `hivemaker.md` | Implementation |
168: | `hiveq` | `hiveq.md` | Verification |
169: | `hitea` | `hitea.md` | Testing |
170: | `hivehealer` | `hivehealer.md` | Recovery |
171: | `hivexplorer` | `hivexplorer.md` | Investigation |
172: | `architect` | `architect.md` | Architecture |
173: | `code-skeptic` | `code-skeptic.md` | Code review |
174: | `hiverd` | `hiverd.md` | Research |
175: | `general` | `general.md` | General purpose |
176: | `explore` | `explore.md` | Exploration |
177: | `explore-small` | `explore-small.md` | Lightweight exploration |
178: 
179: ---
180: 
181: ## Tier 3: Skills
182: 
183: ### Skill Packages (20 packages)
184: 
185: **Location:** `skills/` and `.opencode/skills/`
186: 
187: | Skill Package | Location | Status | Evidence |
188: |---------------|----------|--------|----------|
189: | `use-hivemind` | `skills/use-hivemind/` | Active | SKILL.md with frontmatter |
190: | `use-hivemind-context` | `skills/use-hivemind-context/` | Active | SKILL.md with frontmatter |
191: | `use-hivemind-delegation` | `skills/use-hivemind-delegation/` | Active | SKILL.md with frontmatter |
192: | `use-hivemind-git-memory` | `skills/use-hivemind-git-memory/` | Active | SKILL.md with frontmatter |
193: | `use-hivemind-planning` | `skills/use-hivemind-planning/` | Active | SKILL.md with frontmatter |
194: | `use-hivemind-research` | `skills/use-hivemind-research/` | Active | SKILL.md with frontmatter |
195: | `use-hivemind-skill-authoring` | `skills/use-hivemind-skill-authoring/` | Active | SKILL.md with frontmatter |
196: | `use-hivemind-tdd` | `skills/use-hivemind-tdd/` | Active | SKILL.md with frontmatter |
197: | `hivemind-codemap` | `skills/hivemind-codemap/` | Active | SKILL.md with frontmatter |
198: | `hivemind-gatekeeping` | `skills/hivemind-gatekeeping/` | Active | SKILL.md with frontmatter |
199: | `hivemind-architecture` | `skills/hivemind-architecture/` | Active | SKILL.md with frontmatter |
200: | `hivemind-atomic-commit` | `skills/hivemind-atomic-commit/` | Active | SKILL.md with frontmatter |
201: | `hivemind-execution` | `skills/hivemind-execution/` | Active | SKILL.md with frontmatter |
202: | `hivemind-patterns` | `skills/hivemind-patterns/` | Active | SKILL.md with frontmatter |
203: | `hivemind-refactor` | `skills/hivemind-refactor/` | Active | SKILL.md with frontmatter |
204: | `hivemind-spec-driven` | `skills/hivemind-spec-driven/` | Active | SKILL.md with frontmatter |
205: | `hivemind-synthesis` | `skills/hivemind-synthesis/` | Active | SKILL.md with frontmatter |
206: | `hivemind-system-debug` | `skills/hivemind-system-debug/` | Active | SKILL.md with frontmatter |
207: | `hivemind-ideating` | `skills/hivemind-ideating/` | Active | SKILL.md with frontmatter |
208: | `use-hivemind-ideating` | `skills/use-hivemind-ideating/` | Active | SKILL.md with frontmatter |
209: 
210: ### Skill Registry
211: 
212: **Internal Registry:** `skills/registry-internal.yaml`
213: 
214: Contains 30+ skill entries with metadata:
215: - `name`, `domain`, `bundle`, `knowledge_delta_score`, `status`, `owner`, `disclosure_level`, `triggers`, `supersedes`, `depends_on`
216: 
217: Example entry (lines 31-42):
218: ```yaml
219: - name: agent-role-boundary
220:   domain: agent-governance
221:   bundle: governance-core
222:   knowledge_delta_score: 0.88
223:   status: active
224:   owner: hivemind-core
225:   disclosure_level: L1
226:   triggers:
227:     - "agent profile refactor"
228:     - "permission envelope design"
229: ```
230: 
231: ### Skill Installation Mechanism
232: 
233: **SKILL.md Standard (from `skills/use-hivemind/SKILL.md`):**
234: 
235: Each skill follows a strict frontmatter standard:
236: ```yaml
237: ---
238: name: use-hivemind
239: description: Master session entry router...
240: parent: none
241: ---
242: ```
243: 
244: **Bundled Resources Structure:**
245: Each skill contains:
246: - `SKILL.md` - Main skill file
247: - `references/` - Supporting documentation
248: - `templates/` - Output templates
249: - `scripts/` - Validation/utility scripts
250: - `tests/` - Test scenarios
251: 
252: **OpenCode Skill Loading:**
253: From `src/plugin/skill-exposure-map.ts` and `src/shared/skill-injection-loader.ts`:
254: - Skills are loaded via OpenCode's `skill` tool
255: - Skill injection is handled through `initSkillInjection(directory)` at `opencode-plugin.ts:93`
256: - Skill registry path resolution via `src/shared/skill-registry-path.ts`
257: 
258: ---
259: 
260: ## Tier Gaps Analysis
261: 
262: ### Tier 1 Missing
263: 
264: | Expected | Status | Notes |
265: |----------|--------|-------|
266: | SDK surface for `client.app.log()` | **REFERENCED** | Mentioned in AGENTS.md but not found in grep |
267: | SDK surface for `client.tui.showToast()` | **REFERENCED** | Mentioned in AGENTS.md but not found in grep |
268: | `permission.ask` hook details | **PARTIAL** | Hook exists at `opencode-plugin.ts:154-171` but SDK surface may be incomplete |
269: 
270: ### Tier 2 Missing
271: 
272: | Expected | Status | Notes |
273: |----------|--------|-------|
274: | `chat.params` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
275: | `chat.headers` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
276: | `tool.definition` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
277: | `session.compacting` hook | **WIRED** | `opencode-plugin.ts:246-249` - experimental |
278: | `auth` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
279: | `config` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
280: 
281: ### Tier 3 Missing
282: 
283: | Expected | Status | Notes |
284: |----------|--------|-------|
285: | `npx skills add` mechanism | **NOT IMPLEMENTED** | Skills exist but no `npx skills add` command found |
286: | Skill installation CLI | **PARTIAL** | Skills are files; no install command |
287: | External skill URLs | **NOT IMPLEMENTED** | `skills/registry-internal.yaml` references external skills but no fetch mechanism |
288: 
289: ---
290: 
291: ## Git Context
292: 
293: **Latest Commit:** `d351aecf` - "External research: AI agent tool design best practices (2026-03-30)"
294: 
295: **Uncommitted Changes:** Significant - multiple agent files, skill files, and source files modified. This investigation was conducted with uncommitted changes present.
296: 
297: **Key Modified Areas:**
298: - `.opencode/agents/*.md` - Agent files modified
299: - `.opencode/skills/*/SKILL.md` - Skill files modified
300: - `src/hooks/*.ts` - Hook handlers modified
301: - `src/tools/hivefiver-setting/*` - Settings tools modified
302: 
303: ---
304: 
305: ## Evidence Summary
306: 
307: | Claim | File:Line | Evidence |
308: |-------|-----------|----------|
309: | Plugin entry exists | `src/plugin/opencode-plugin.ts:90` | `export const HiveMindPlugin: Plugin = async (input) => {` |
310: | SDK imported | `src/plugin/opencode-plugin.ts:8` | `import { type Plugin } from '@opencode-ai/plugin'` |
311: | Tool created with SDK | `src/tools/runtime/tools.ts:8` | `import { tool } from '@opencode-ai/plugin/tool'` |
312: | Hook wiring | `src/plugin/opencode-plugin.ts:116-249` | All hook returns registered |
313: | Command bundles defined | `src/commands/slash-command/command-bundles.ts:4-179` | 10 slash commands defined |
314: | Skills exist | `skills/` directory | 20 skill packages |
315: | Skill registry exists | `skills/registry-internal.yaml:1-374` | Internal metadata registry |
316: | Agents exist | `.opencode/agents/` | 14 agent files |
317: 
318: ---
319: 
320: *Report generated: 2026-03-31*
321: *Investigation artifacts: `.hivemind/activity/agents/hivexplorer/investigation-report-tier-architecture-2026-03-31.md`*

(End of file - total 321 lines)
</content>
```

---
## Assistant (Assistant · unknown)

_Thinking:_

Now let me read the remaining investigation reports and the legacy code-intel files to complete context:

---
