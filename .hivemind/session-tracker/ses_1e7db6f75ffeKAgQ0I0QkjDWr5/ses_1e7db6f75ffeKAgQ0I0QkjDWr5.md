---
sessionID: ses_1e7db6f75ffeKAgQ0I0QkjDWr5
created: 2026-05-11T17:45:10.124Z
updated: 2026-05-11T17:45:10.124Z
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---

## USER (turn 1)

<objective>
Research how to implement Phase 12: CP-ST-01 Remediation — Apply Critical Security Fixes (CR-01, CR-02)
Answer: "What do I need to know to PLAN this phase well?"
</objective>

<files_to_read>
MANDATORY — read these files in order before producing output:

1. `/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md` — Phase boundary, 11 implementation decisions (D-01 through D-11), canonical references, code context, deferred ideas
2. `/Users/apple/hivemind-plugin-private/.planning/STATE.md` — Project state, active phase, health status
3. `/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md` — CP-ST-01 status ("🔵 PLANNED"), session tracker runway

EVIDENCE BASELINE — read for defect-to-code mapping:
4. `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md` — SPEC vs Reality for all 13 REQs with severity scoring
5. `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md` — 14 writer engine defects with file:line references
6. `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md` — 6 tool surface deficiencies with design notes
7. `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md` — Status of all 14 review findings
8. `/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/05-DISK-EVIDENCE-SAMPLES.md` — Sampled session evidence

CP-ST-01 ORIGINAL SPEC + REVIEW:
9. `/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — 13 locked requirements (REQ-ST-01 through REQ-ST-13)
10. `/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md` — 14 review findings (3 critical, 6 warning, 5 info)

ARCHITECTURE:
11. `/Users/apple/hivemind-plugin-private/.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority
12. `/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10 tool design criteria

SOURCE CODE (spot-check for understanding patterns):
13. `/Users/apple/hivemind-plugin-private/src/features/session-tracker/index.ts` — SessionTracker class
14. `/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/event-capture.ts` — Event routing
15. `/Users/apple/hivemind-plugin-private/tests/features/session-tracker/` — Test directory (list all test files, read at least 3 representative tests)
</files_to_read>

<additional_context>
**Phase description (from ROADMAP.md):** CP-ST-01 Session Tracker Revamp — replaces broken event-tracker with new `src/features/session-tracker/` module. Uses OpenCode SDK v2 hooks. Fixes 12 catalogued flaws (F1-F12) from audit register.

**Phase requirement IDs (MUST address):** REQ-ST-01 through REQ-ST-13 (from CP-ST-01 spec)
**Phase 12 mandate:** All 14 review findings from CP-ST-01-REVIEW.md must be addressed. All 14 source defects from the evidence matrix must be fixed. Tool surface must be redesigned per CUSTOM-TOOLS-CRITERIA (C4 Granularity ≤200 LOC, C7 Ergonomics).

**Implementation strategy (from CONTEXT.md):**
- Wave 1: Writer Engine Fixes (unblock frozen serial queue, fix childCount corruption, hierarchy classification, capture gaps, error pruning)
- Wave 2: Tool Redesign (replace single session-tracker with 3 domain-focused tools: session-tracker, session-hierarchy, session-context)
- Wave 3: Integration + Verification (fork handling, parallel sessions, 163-test regression baseline)

**Project instructions:** Read ./AGENTS.md if exists. This is the Hivemind harness project — a TypeScript npm package. Architecture is CQRS with 9-surface authority model. Source planes: src/shared/, src/task-management/, src/coordination/, src/features/, src/config/, src/routing/, src/hooks/, src/tools/. No src/lib/ (removed in SR restructuring).

**Stack:** TypeScript strict mode, ES2022 target, NodeNext module resolution, Zod schemas, vitest for testing, @opencode-ai/plugin SDK for hooks/tools. No new npm dependencies.
</additional_context>

<output>
Write your complete research findings to:
`/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md`

STRUCTURE your RESEARCH.md with these required sections:
1. **Technical Approach Summary** — 1 paragraph on overall strategy
2. **Source Defect Analysis** — For each of the 14 defects from 02-SOURCE-DEFECTS.md: defect ID, file:line, root cause, fix strategy, risk level
3. **Tool Redesign Analysis** — For each of 3 new tools: purpose, Zod schema sketch, file placement, key considerations from CUSTOM-TOOLS-CRITERIA
4. **Dependency Ordering** — Exact order of fixes (which defect blocks which, tool file dependencies)
5. **Risk Assessment** — What could go wrong, regression risks, integration surface risks
6. **Test Strategy** — Which existing tests verify what, what new tests are needed, test order
7. **Implementation Patterns** — Code patterns to follow (deps injection, best-effort handlers, atomic writes, append-per-event, CQRS boundaries)
8. **Open Questions** — Anything unclear that needs planner/implementer discretion

END your file with: `## RESEARCH COMPLETE`
</output>

<verification>
Before returning, verify:
- RESEARCH.md was written to disk at the correct path
- File contains all 8 required sections
- Each defect from 02-SOURCE-DEFECTS.md is addressed
- Tool redesign references CUSTOM-TOOLS-CRITERIA criteria C4 and C7
- Dependency ordering is explicit and complete
</verification>


### Tool: skill

**Input:**
```json
{
  "name": "hivemind-power-on"
}
```

**Output:** (pruned)
```
# Skill: hivemind-power-on
```


### Tool: skill

**Input:**
```json
{
  "name": "gsd-research-phase"
}
```

**Output:** (pruned)
```
# Skill: gsd-research-phase
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Context
2: 
3: **Gathered:** 2026-05-12
4: **Status:** Ready for planning
5: 
6: <domain>
7: ## Phase Boundary
8: 
9: Remediate the CP-ST-01 Session Tracker Revamp implementation to address 20+ catalogued defects across the writer engine (capture logic, hierarchy classification, status tracking, error pruning, compaction capture) and the tool surface (insufficient query capabilities, lack of agent consumability). The phase applies evidence-documented fixes to the existing `src/features/session-tracker/` module and replaces the single `session-tracker` tool with a domain-focused toolset following CUSTOM-TOOLS-CRITERIA guidelines.
10: 
11: This phase fixes what was built in CP-ST-01 — it does NOT add new capabilities beyond the original spec boundary. The existing 163 tests are the regression baseline. All 14 review findings from CP-ST-01-REVIEW.md must be addressed.
12: 
13: </domain>
14: 
15: <decisions>
16: ## Implementation Decisions
17: 
18: ### Remediation Strategy: 3-Wave Structure
19: - **D-01: Wave 1 — Writer Engine Fixes.** Fix the capture pipeline before touching tools. Ordered by dependency: unblock the frozen serial queue (DEFECT-02), fix childCount corruption (DEFECT-01), then hierarchy classification (main vs child), then capture gaps (assistant output, compaction, child status updates), then error pruning. Each fix independently testable.
20: - **D-02: Wave 2 — Tool Redesign.** Replace the single `session-tracker` tool with a domain-focused toolset: `session-tracker` (export/list/search, extended), `session-hierarchy` (child/parent navigation, delegation chain query), `session-context` (cross-session synthesis, related session discovery). Each tool ≤200 LOC per Criterion 4 (Granularity). Each tool under `src/tools/hivemind/`.
21: - **D-03: Wave 3 — Integration + Verification.** Fork handling, parallel session edge cases, full regression test pass against all 163 existing tests, integration verification of the complete pipeline.
22: 
23: ### Task Granularity: Dependency-Ordered Micro-Tasks
24: - **D-04:** Each sub-plan decomposes into dependency-ordered micro-tasks (1-2 files per task, individually testable). Tasks follow the frozen dependency chain: unblock the pipeline first, then fix what flows through it. No task touches more than 2 files. Prevents regression cascade.
25: 
26: ### Child Session Hierarchy Model: Turn-Level Stems + Final Summary
27: - **D-05:** Child `.json` records capture per-turn stems: actor (subagent name + model), timestamp, tools (input paths, output paths/IDs, errors as type+path only). After all turns complete, the final assistant response is captured as a summary/report block. No `.md` files for child sessions — only `.json` under parent subdir.
28: - **D-06:** 3-level delegation hierarchy fully nested in `session-continuity.json`. Children of children recursively nest. Status updates propagate on lifecycle events (created → active → idle/completed/error).
29: - **D-07:** Child session lifecycle events route through a dedicated handler path in `event-capture.ts`. When `parentID !== null`, events update child `.json` records via `childWriter`, not the main session writer.
30: 
31: ### Tool Re-Architecture: Toolset by Domain per CUSTOM-TOOLS-CRITERIA
32: - **D-08:** Three focused tools replace the single action-dispatched `session-tracker`:
33:   - `session-tracker` (C2: Governance & State) — export-session, list-sessions, search-sessions, get-status, get-summary
34:   - `session-hierarchy` (C2: Governance & State) — get-children, get-parent-chain, get-delegation-depth
35:   - `session-context` (C3: Inspection & Research) — find-related-sessions, cross-reference, synthesize-context
36: - **D-09:** Each tool follows Criterion 4 (≤200 LOC, kebab-case, action+object naming) and Criterion 7 (minimal required fields, easy agent invocation). Tools use Zod schemas validated at boundary.
37: 
38: ### Compaction Capture: Summary Breaker Blocks
39: - **D-10:** When `session.compacted` event fires, write a compacted section to the main `.md` file containing: pre-compaction context summary, key decisions made, active TODOs/delegations pending, and the compact boundary marker (`## COMPACTED`). Serves as semantic checkpoint for agents resuming long sessions.
40: 
41: ### Error Pruning
42: - **D-11:** Errors captured as type + path only. No file content in error output. The `handleRead` heuristic (substring match on "error") is replaced with structured error detection via tool output metadata.
43: 
44: ### the agent's Discretion
45: - Exact internal module structure within `src/features/session-tracker/` for new handlers (child event routing, compaction capture) is up to the implementer following existing patterns.
46: - Exact field naming for new child session turn stems is up to the implementer following camelCase convention (REQ-ST-12).
47: - Tool response envelope format follows existing `src/shared/tool-response.ts` patterns.
48: 
49: </decisions>
50: 
51: <canonical_refs>
52: ## Canonical References
53: 
54: **Downstream agents MUST read these before planning or implementing.**
55: 
56: ### CP-ST-01 Phase Artifacts (original spec + review)
57: - `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — Locked 13 requirements (REQ-ST-01 through REQ-ST-13). These remain the acceptance baseline.
58: - `.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md` — Original implementation decisions (D-01 through D-05). D-01 (deps injection), D-03 (atomic rename), and D-04 (append-per-event) remain valid. D-02 (single tool TODO) is superseded by D-08.
59: - `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md` — 14 findings (3 critical, 6 warning, 5 info). All MUST be addressed in this phase.
60: 
61: ### Phase 12 Evidence Baseline
62: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md` — SPEC vs Reality for all 13 REQs with severity scoring
63: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md` — 14 writer engine defects with file:line references
64: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md` — 6 tool surface deficiencies with design notes
65: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md` — Status of all 14 review findings
66: - `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/05-DISK-EVIDENCE-SAMPLES.md` — Sampled session evidence with timestamps and patterns
67: 
68: ### Architecture & Governance
69: - `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph
70: - `.planning/codebase/STRUCTURE.md` — File tree, placement conventions, naming
71: - `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract
72: - `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10 design criteria for custom tools. C4 (Granularity) and C7 (Ergonomics) are binding for tool redesign decisions D-08/D-09.
73: 
74: ### Source Code
75: - `src/features/session-tracker/index.ts` — SessionTracker class (the main touch point)
76: - `src/features/session-tracker/capture/event-capture.ts` — Event routing (needs child session path)
77: - `src/features/session-tracker/capture/message-capture.ts` — Message capture (needs assistant output capture)
78: - `src/features/session-tracker/capture/tool-capture.ts` — Tool capture (DEFECT-01, DEFECT-03, DEFECT-04)
79: - `src/features/session-tracker/persistence/project-index-writer.ts` — Frozen serial queue (DEFECT-02)
80: - `src/tools/hivemind/session-tracker.ts` — Current tool (to be redesigned per D-08)
81: - `src/plugin.ts` — Hook wiring + tool registration
82: 
83: ### Audit Evidence
84: - `.hivemind/audit/flaw-register-2026-05-10.json` — 12 flaws (F1-F12) from the original event tracker
85: 
86: ### Disk Evidence (live data)
87: - `.hivemind/session-tracker/project-continuity.json` — 83 entries, all status=active, all childCount=0, frozen lastUpdated
88: - `.hivemind/session-tracker/` — 85 session subdirectories, child .json files with empty turns
89: 
90: </canonical_refs>
91: 
92: <code_context>
93: ## Existing Code Insights
94: 
95: ### Reusable Assets
96: - `src/features/session-tracker/persistence/atomic-write.ts` — `safeSessionPath()`, `atomicWriteJson()`, `atomicAppendMarkdown()`, `ensureDirectory()`. All existing write safety mechanisms remain valid.
97: - `src/features/session-tracker/persistence/session-writer.ts` — `SessionWriter` class. MD appending and frontmatter merging patterns stay; new compaction section method needed.
98: - `src/features/session-tracker/persistence/child-writer.ts` — `ChildWriter` class. Existing `createChildFile()`, `updateChildStatus()`, `appendChildTurn()` — already defined but never called after creation. Needs wiring into the event pipeline.
99: - `src/features/session-tracker/transform/agent-transform.ts` — `AgentTransform` class. Child `##USER` → `main_l0_agent` transform already works; needs wiring for child session message capture.
100: - `src/shared/tool-response.ts` — Standard `success()` / `error()` response wrapper for new tools.
101: 
102: ### Established Patterns
103: - **Deps injection:** All capture classes receive writers via constructor `({ client, sessionWriter, ... })`. New handlers follow same pattern.
104: - **Best-effort handlers:** All `handle*` methods wrapped in try/catch — never throw to OpenCode runtime.
105: - **Atomic write pattern (D-03):** Write to temp file → `fs.rename()` — all new writes use this.
106: - **Append-per-event (D-04):** Each hook event appends immediately — no batching.
107: - **CQRS boundaries:** Hooks observe, SessionTracker routes to persistence layer. No direct filesystem writes from hooks.
108: 
109: ### Integration Points
110: - `src/hooks/index.ts` — `createCoreHooks()` observer pipeline. Session tracker hooks already wired here.
111: - `src/plugin.ts` — Plugin composition root. Tool registration lives here. New tools added alongside existing `session-tracker` registration.
112: - `src/features/session-tracker/index.ts` — SessionTracker class. New handler methods (`handleChildSessionEvent`, `handleCompaction`) are added here, following existing pattern.
113: 
114: </code_context>
115: 
116: <specifics>
117: ## Specific Ideas
118: 
119: - **No new npm dependencies.** All fixes use existing stack: `gray-matter`, `yaml`, `zod`, `node:fs/promises`.
120: - **All 14 review findings addressed.** CR-01, CR-02, CR-03 (critical) fixed in Wave 1. WR-01 through WR-06 and IN-01 through IN-05 fixed progressively through Waves 1-3.
121: - **Regressions prevented.** Each micro-task verifies against `npx vitest run tests/features/session-tracker/` plus task-specific tests. No task merges without green.
122: - **Disk evidence is the truth.** When code says one thing and disk says another, disk wins. The `project-continuity.json` frozen state is canonical evidence of what's broken.
123: - **Fork handling (Wave 3).** When OpenCode forks create a new main session from a checkpoint message, the new session shares existing child delegation records. Fork detection via session metadata comparison; shared children are reference-copied, not duplicated.
124: - **Parallel sessions (Wave 3).** Concurrent main sessions with shared child sessions need write isolation. Child records under parent subdirs are naturally isolated; the project index serial queue must handle concurrent updates without freezing.
125: 
126: </specifics>
127: 
128: <deferred>
129: ## Deferred Ideas
130: 
131: - **Sidecar dashboard integration** — Q2, separate project. Session tracker produces files the sidecar CAN read but no sidecar-specific code belongs here.
132: - **Real-time SSE streaming** — Out of scope. Plugin receives events directly via hooks.
133: - **Graph-based delegation visualization** — Out of scope. Belongs to a future phase after the session tracker produces correct data.
134: - **Auto-pruning of old session data** — Future phase. Current scope is producing correct data, not managing retention.
135: - **Removal of legacy event-tracker source code** — Future phase. Safety net remains per REQ-ST-13.
136: 
137: </deferred>
138: 
139: ---
140: 
141: *Phase: 12-CP-ST-01-Remediation*
142: *Context gathered: 2026-05-12*

(End of file - total 142 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.planning/AGENTS.md
# Planning and Governance Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.planning/` is the Planning/Governance sector for source-backed requirements, roadmaps, architecture maps, audits, research, lifecycle notes, and phase authorization artifacts. It explains and gates work; it does not implement runtime behavior. Source evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`, `.planning/codebase/STRUCTURE.md:73-79`.

## 2. Allowed mutation authority

- Planning artifacts may document requirements, acceptance matrices, target architecture, audits, roadmaps, and source-backed decisions.
- Planning artifacts may authorize future work only when they explicitly state scope, dependencies, evidence requirements, and gate conditions. Evidence: `.planning/ROADMAP.md:29-49`.
- Date-stamped artifacts are expected for generated plans, reports, and architecture documents when creating new governance outputs.

## 3. Forbidden mutations / explicit no-go boundaries

- Planning docs SHALL NOT claim runtime readiness from docs-only evidence. Evidence: `.planning/ROADMAP.md:47-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Planning docs SHALL NOT authorize runtime code, `.opencode/**` primitive, or `.hivemind/**` state mutation unless the current phase/user authorization explicitly allows it. Evidence: `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:12-15`.
- Do not blindly copy OMO or adopt OMO roots; sector mapping must preserve Hivemind surfaces. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:28-37`.
- Do not treat archived planning artifacts as current authority without a fresh date/status check.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Coordinators and specialists | Source contracts, acceptance criteria, gate status, and phase boundaries | Must not infer implementation authorization from drafts |
| Quality gates | Trace requirements to evidence and readiness claims | Docs-only artifacts are L5 unless runtime proof is attached |
| Runtime/source sectors | Consume approved requirements and architecture constraints | Implementation occurs outside `.planning/` |
| Human reviewers | Decide authorization and priority | Planning can recommend but not self-approve runtime readiness |

## 5. Naming and placement conventions

- Generated artifacts should be grouped by purpose (`architecture/`, `research/`, `audits/`, `checklists/`, `roadmap/`, `lifecycle/`) and date-stamped with `name-YYYY-MM-DD` where applicable.
- Current codebase intelligence lives under `.planning/codebase/`; active roadmap/requirements/project state live at `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`. Evidence: `.planning/codebase/STRUCTURE.md:73-79`.
- Archived artifacts under `.planning/archive/` require current validation before use as authority.

## 6. Quality gates and evidence expectations

- Planning requirements should be falsifiable, source-backed, and mapped to acceptance/verification methods.
- Completion claims must state evidence level; O3 and docs-only artifacts are L5 and keep runtime readiness blocked. Evidence: `.planning/ROADMAP.md:47-49`.
- Before a planning artifact authorizes work, it must identify allowed surfaces, forbidden surfaces, actors/consumers, verification commands or inspection methods, and stop conditions.

## 7. Current CP-PTY runway note

- `CP-PTY-00-shell-pty-control-plane-spike` is a docs/spec-only phase. It may update `.planning/**` but must not mutate `src/**`, `tests/**`, `.opencode/**`, or `.hivemind/**`.
- `CP-PTY-01-background-shell-control-plane-mvp` is READY (BOOT-07 complete). Covers command-process delegation (PTY/headless).
- `CP-PTY-02-sdk-session-delegation-integration` covers OpenCode SDK child-session delegation, async/sync dispatch, context injection.
- `CP-PTY-03-agent-subagent-background-task-coordination` covers wave dispatch, completion-looping, queue dedup, lifecycle cascade.
- `CP-PTY-04-cross-cutting-shell-integration` wires everything to session/task/journal/hooks/permissions.
- `SC-PTY-01-read-only-terminal-projection` remains DEFERRED until CP-PTY-01 and Q2 sidecar confirmation.
- Any routing or sidecar plan that invokes background command, PTY, headless shell, or terminal projection behavior must depend on the CP-PTY artifacts and preserve read-only projection boundaries unless a later phase changes them.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). This phase audits and corrects all .planning/ artifacts to reflect current project reality.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .planning/:** STATE.md has been rewritten to runway-focused structure (~216 lines). PROJECT.md, REQUIREMENTS.md, and ROADMAP.md have been reconciled against live evidence. Historical STATE.md content archived to `.planning/archive/state-history/`.  
**Key governance baseline files:**
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming + lineage contracts
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership
- `.planning/codebase/ARCHITECTURE.md` — CQRS, 9-surface authority
- `.planning/codebase/STRUCTURE.md` — File tree conventions

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/STATE.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/ROADMAP.md"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Evidence Truth Matrix
2: 
3: **Date:** 2026-05-12
4: **Auditor:** gsd-debug-session-manager (subagent)
5: **Evidence hierarchy:** L1 (live disk) + L2 (continuity records) + source code analysis
6: **Method:** SPEC vs Reality cross-reference for all 13 requirements (REQ-ST-01 through REQ-ST-13)
7: 
8: ---
9: 
10: ## Evidence Legend
11: 
12: | Symbol | Meaning |
13: |--------|---------|
14: | ✅ PASS | Requirement satisfied with L1/L2 evidence |
15: | ⚠️ PARTIAL | Partially implemented, has gaps |
16: | ❌ FAIL | Not satisfied, requires remediation |
17: | 🔴 CRITICAL | Blocks core functionality |
18: | 🟡 HIGH | Degrades data quality |
19: | 🟢 MEDIUM | Non-blocking quality issue |
20: | 🔵 LOW | Cosmetic |
21: 
22: ---
23: 
24: ## REQ-ST-01: Session Directory Manifestation
25: 
26: **CLAIMED (CP-ST-01-02-SUMMARY.md):** "Root sessions → `sessionWriter.createSessionDir()` + `initializeSessionFile()`. Child sessions → skipped (handled by tool-capture)."
27: 
28: **EVIDENCE:**
29: - ✅ 83 session directories exist under `.hivemind/session-tracker/` (L1 — `ls` confirms)
30: - ✅ Each directory contains `{sessionID}.md` with YAML frontmatter (L1)
31: - ✅ Child `.json` files exist under parent directories (L1 — confirmed in multiple subdirs)
32: - ❌ project-continuity.json lists 83 sessions but `lastUpdated` is `2026-05-11T17:04:29.708Z` — frozen for ~7 hours (L1)
33: - ❌ `childCount: 0` for ALL entries, even sessions with 8+ child .json files (L1 — WR-01)
34: - ❌ All 83 sessions have `status: "active"` — none transition to "completed"/"idle" (L1)
35: - ❌ 13 sessions missing `childCount` field entirely — `undefined` was spread over the field (WR-01)
36: 
37: **GAP:** Project index is stale/static. Session status never transitions. Child count never tracked. The index writer appears to have a frozen serial queue.
38: 
39: **SEVERITY:** 🔴 CRITICAL — Core index data is incorrect/static.
40: 
41: **Source references:**
42: - `src/features/session-tracker/capture/tool-capture.ts:251-253` — `childCount: undefined` bug
43: - `src/features/session-tracker/persistence/project-index-writer.ts:166-172` — spread of undefined
44: - `.hivemind/session-tracker/project-continuity.json` — all 83 entries childCount=0, all status=active
45: 
46: ---
47: 
48: ## REQ-ST-02: User Message Capture
49: 
50: **CLAIMED:** "User message captured with turn counter"
51: 
52: **EVIDENCE:**
53: - ✅ Main .md files contain `## USER (turn N)` sections (L1 — confirmed in sampled .md files)
54: - ✅ Turn numbers are sequential (observed turns 1, 2 in sampled file)
55: - ✅ Full user text content is captured (L1 — confirmed)
56: - ⚠️ Turn counters are in-memory only — reset on restart (WR-04) (L5 — source code analysis)
57: - ⚠️ No mechanism to seed turn counter from existing .md file on restart (WR-04)
58: 
59: **GAP:** Restart resets turn counters → duplicate turn numbers in persisted .md files.
60: 
61: **SEVERITY:** 🟡 HIGH — Data quality degradation across restarts.
62: 
63: **Source references:**
64: - `src/features/session-tracker/capture/message-capture.ts:65` — turnCounters Map
65: - `src/features/session-tracker/capture/message-capture.ts:190-194` — nextTurnNumber()
66: 
67: ---
68: 
69: ## REQ-ST-03: Agent Metadata Transform
70: 
71: **CLAIMED:** "Assistant metadata transformed into structured `main_l0_agent` fields"
72: 
73: **EVIDENCE:**
74: - ✅ AgentTransform class exists and extracts name, model, thinkingDuration (L4 — unit tests pass)
75: - ⚠️ `computeThinkingDuration()` returns hardcoded `"present"` instead of actual duration (L5)
76: - ⚠️ No evidence of `main_l0_agent` blocks in sampled .md files — only skill tool blocks visible (L1)
77: - ⚠️ Need to verify assistant message capture is actually firing in live sessions
78: 
79: **GAP:** Thinking duration is a placeholder, not actual timing data. Need L1 verification of agent block capture.
80: 
81: **SEVERITY:** 🟢 MEDIUM — Core transform works but thinking duration is fake.
82: 
83: **Source references:**
84: - `src/features/session-tracker/transform/agent-transform.ts:117-118` — hardcoded "present"
85: - `src/features/session-tracker/capture/message-capture.ts:163-181` — handleAssistantMessage
86: 
87: ---
88: 
89: ## REQ-ST-04: Tool Capture — Skill
90: 
91: **CLAIMED:** "Skill name + 1 header captured"
92: 
93: **EVIDENCE:**
94: - ✅ Sampled .md files contain `### Tool: skill` blocks (L1 — confirmed)
95: - ✅ Input captures `{ name: "skill-name" }` (L1 — confirmed)
96: - ✅ Output is pruned to first `#` header line (L1 — confirmed, see `# Skill: hivemind-power-on`)
97: - ✅ extractFirstHeader() correctly matches `^# .+$` pattern
98: 
99: **GAP:** None identified. Skill capture is working correctly.
100: 
101: **SEVERITY:** ✅ PASS
102: 
103: **Source references:**
104: - `src/features/session-tracker/capture/tool-capture.ts:143-158` — handleSkill
105: - `src/features/session-tracker/capture/tool-capture.ts:304-310` — extractFirstHeader
106: 
107: ---
108: 
109: ## REQ-ST-05: Tool Capture — Read
110: 
111: **CLAIMED:** "Read path captured, no content"
112: 
113: **EVIDENCE:**
114: - ❌ CR-03: `handleRead()` inspects output for "error"/"not found" substrings and captures full output (which IS file content) when these words appear (L4 — code analysis confirmed)
115: - ❌ The heuristic error detection is fundamentally wrong — any file containing the word "error" triggers full content capture (CR-03)
116: - ⚠️ The code uses `let` for `outputStr` and `isError` (IN-02)
117: - ⚠️ Read tool blocks were not found in sampled .md files (need larger sample or confirmation of hook firing)
118: 
119: **GAP:** CR-03 is a direct violation of REQ-ST-05. Heuristic error detection captures file content when the output coincidentally contains "error" or "not found".
120: 
121: **SEVERITY:** 🔴 CRITICAL — Violation of a hard requirement. Captures file content against explicit spec.
122: 
123: **Source references:**
124: - `src/features/session-tracker/capture/tool-capture.ts:170-187` — handleRead (CR-03)
125: - Review finding CR-03 (confirmed unresolved)
126: 
127: ---
128: 
129: ## REQ-ST-06: Tool Capture — Task (Delegation)
130: 
131: **CLAIMED:** "Task delegation spawns child .json"
132: 
133: **EVIDENCE:**
134: - ✅ Child .json files ARE created under parent directories (L1 — confirmed, 8 children in ses_1e8826b7)
135: - ✅ Child files contain parentSessionID, delegatedBy, description (L1)
136: - ❌ Child .json files have `turns: []` — never populated with actual turn data (L1)
137: - ❌ Child .json files have `status: "active"` — never transitions to "completed" (L1)
138: - ❌ Child .json files have `mainAgent.model: "unknown"` — never populated (L1)
139: - ❌ Child .json files have `children: []` — grandchild support missing (L1)
140: - ❌ `projectIndexWriter.updateSession()` called with `childCount: undefined` (WR-01)
141: - ❌ `sessionIndexWriter.addChild()` increments `turnCount++` (WR-06)
142: - ⚠️ `handleTask` does NOT call `updateChildStatus()` or `appendChildTurn()` — child files are write-once
143: 
144: **GAP:** Child session data is skeletal. No turn capture, no status transitions, no model info, no grandchild support. The record is created but never updated.
145: 
146: **SEVERITY:** 🔴 CRITICAL — Child session capture is fundamentally incomplete. Write-once, never-updated.
147: 
148: **Source references:**
149: - `src/features/session-tracker/capture/tool-capture.ts:199-273` — handleTask
150: - `.hivemind/session-tracker/ses_1e8826b7fffe6rpXbScJR18btU/ses_1e85e857affefWZJzwX3WFBi1k.json` — skeletal child record
151: 
152: ---
153: 
154: ## REQ-ST-07: Child Session Recognition and Transformation
155: 
156: **CLAIMED:** "Child ##USER → main_l0_agent transform"
157: 
158: **EVIDENCE:**
159: - ❌ Child .json files have `turns: []` — no turns to transform (L1)
160: - ❌ The `transformChildUserMessage()` method exists but is only called when turns are captured, which never happens (L4)
161: - ⚠️ `event-capture.ts` correctly checks `parentID` via `getSession()` for root detection (L4)
162: - ❌ Child session lifecycle events (session.created, session.idle) are handled by event-capture which only knows about main sessions — child status events are completely lost
163: 
164: **GAP:** Architecture flaw: child sessions generate independent lifecycle events but those events are either mistakenly routed to main session .md files (which don't exist for children) or silently dropped. The child capture pipeline is a one-shot creation at task tool time with zero lifecycle updates.
165: 
166: **SEVERITY:** 🔴 CRITICAL — Child session lifecycles are invisible. No transformation ever occurs because no turns are captured.
167: 
168: **Source references:**
169: - `src/features/session-tracker/capture/event-capture.ts:140-171` — handleSessionCreated (skips children)
170: - `src/features/session-tracker/capture/tool-capture.ts:199-273` — handleTask (creates but never updates child records)
171: - `src/features/session-tracker/transform/agent-transform.ts:98-106` — transformChildUserMessage (exists but never called)
172: 
173: ---
174: 
175: ## REQ-ST-08: Dual Continuity Indices
176: 
177: **CLAIMED:** "Both indices updated on write"
178: 
179: **EVIDENCE:**
180: - ✅ session-continuity.json exists inside session subdirectories (L1 — confirmed)
181: - ✅ Children are listed in session-continuity.json hierarchy (L1)
182: - ❌ All child entries have `status: "active"` — never updated (L1)
183: - ❌ `toolSummary` is always `{}` — `updateToolSummary()` never called (L1)
184: - ❌ `turnCount` conflated with child count (WR-06) — ses_1e8826b7 has 2 user turns but turnCount=8 (8 children)
185: - ❌ project-continuity.json `lastUpdated` is frozen at 2026-05-11T17:04:29 (7+ hours stale)
186: - ❌ All project entries have `childCount: 0` (WR-01)
187: 
188: **GAP:** Session-local index is structurally correct but never updated after creation. Project-level index is completely frozen/stale.
189: 
190: **SEVERITY:** 🔴 CRITICAL — Core index infrastructure is broken. Primary deliverable of CP-ST-01.
191: 
192: **Source references:**
193: - `.hivemind/session-tracker/project-continuity.json` — frozen at May 11 17:04, all childCount=0
194: - `.hivemind/session-tracker/ses_1e8826b7fffe6rpXbScJR18btU/session-continuity.json` — turnCount=8 (wrong), toolSummary={}
195: - `src/features/session-tracker/persistence/session-index-writer.ts:137` — WR-06: addChild increments turnCount
196: - `src/features/session-tracker/persistence/project-index-writer.ts:166-172` — WR-01: spread undefined deletes field
197: 
198: ---
199: 
200: ## REQ-ST-09: Concurrent Session Isolation
201: 
202: **CLAIMED:** "6 concurrent sessions, no corruption"
203: 
204: **EVIDENCE:**
205: - ⚠️ project-index-writer.ts has a `writeQueue` promise chain (serialized writes) (L4)
206: - ⚠️ session-writer.ts `updateFrontmatter` has a race condition (WR-02): reads file, then passes to atomicAppendMarkdown which re-reads — double-read creates window for lost updates
207: - ⚠️ No per-session write queue for .md appends — `atomicAppendMarkdown` reads the full file each time, and if two appends race, one can be lost
208: - ⚠️ Unit tests pass in isolation (L4) but no live concurrency evidence (no L1/L2 proof)
209: 
210: **GAP:** Race conditions in frontmatter updates (WR-02). MD appends not serialized per-session. No live concurrency proof.
211: 
212: **SEVERITY:** 🟡 HIGH — Data loss risk under concurrent writes.
213: 
214: **Source references:**
215: - `src/features/session-tracker/persistence/session-writer.ts:175-189` — WR-02: double-read race
216: - `src/features/session-tracker/persistence/atomic-write.ts:60-77` — atomicAppendMarkdown reads file again
217: 
218: ---
219: 
220: ## REQ-ST-10: Disconnection Recovery
221: 
222: **CLAIMED:** "Reconsumption from .md/.json files + SDK REST API"
223: 
224: **EVIDENCE:**
225: - ✅ SessionRecovery class exists and has `initialize()`, `reconsumeSession()`, `rebuildSessionContext()` methods (L4)
226: - ❌ CR-01: `readSessionFile()` in session-recovery.ts uses raw `resolve()` without `safeSessionPath()` — path traversal vulnerability (L4)
227: - ⚠️ Recovery depends on project-continuity.json which is frozen/stale (see REQ-ST-08)
228: - ⚠️ Recovery depends on session .md files which have stale frontmatter (children: [], status: active)
229: - ⚠️ Recovery depends on child .json files which have no turn data
230: 
231: **GAP:** Recovery infrastructure exists but the data it consumes is stale/incomplete due to failures in other requirements. Path traversal vulnerability (CR-01).
232: 
233: **SEVERITY:** 🟡 HIGH — Recovery works architecturally but operates on broken data. Has a path traversal vulnerability.
234: 
235: **Source references:**
236: - `src/features/session-tracker/recovery/session-recovery.ts:264-268` — CR-01: unvalidated path
237: - Review finding CR-01 (confirmed unresolved)
238: 
239: ---
240: 
241: ## REQ-ST-11: Hook-to-Persistence Architecture Compliance
242: 
243: **CLAIMED:** "Hooks route through SessionTracker, not direct fs writes"
244: 
245: **EVIDENCE:**
246: - ✅ plugin.ts wires event observer → `sessionTracker.handleSessionEvent()` (L4)
247: - ✅ plugin.ts wires chat.message → `sessionTracker.handleChatMessage()` (L4)
248: - ✅ plugin.ts wires tool.execute.after → `sessionTracker.handleToolExecuteAfter()` (L4)
249: - ✅ All capture handlers delegate to persistence writers
250: - ✅ Legacy event-tracker wiring preserved (as per deviation noted in CP-ST-01-03-SUMMARY.md)
251: 
252: **GAP:** None identified. CQRS boundary is correctly enforced.
253: 
254: **SEVERITY:** ✅ PASS
255: 
256: **Source references:**
257: - `src/plugin.ts` — SessionTracker wiring
258: - `src/features/session-tracker/index.ts:164-253` — handler methods
259: 
260: ---
261: 
262: ## REQ-ST-12: Schema Consistency
263: 
264: **CLAIMED:** "All fields camelCase"
265: 
266: **EVIDENCE:**
267: - ✅ All TypeScript interfaces in types.ts use camelCase (L4)
268: - ✅ schema-normalizer.ts has `toCamelCase()` and normalization functions (L4)
269: - ⚠️ WR-03: `isValidSessionID` regex is overly restrictive — `/^ses_[a-zA-Z0-9]{6,}$/` assumes format that may not match all OpenCode session IDs (L4)
270: - ⚠️ IN-03: Non-null assertion `p.text!` in message-capture.ts (minor lint issue)
271: 
272: **GAP:** isValidSessionID regex could reject valid session IDs if OpenCode changes format.
273: 
274: **SEVERITY:** 🟢 MEDIUM — Schema is internally consistent but external compatibility is fragile.
275: 
276: **Source references:**
277: - `src/features/session-tracker/types.ts:270` — WR-03: restrictive regex
278: - `src/features/session-tracker/capture/message-capture.ts:207` — IN-03: non-null assertion
279: 
280: ---
281: 
282: ## REQ-ST-13: Legacy Cleanup
283: 
284: **CLAIMED:** "Old state files removed"
285: 
286: **EVIDENCE:**
287: - ❌ Legacy event-tracker directory has 26 pairs of .json/.md files (L1 — `ls` confirms)
288: - ❌ Total ~1.4MB of legacy state persists (L1)
289: - ❌ `cleanup()` method exists in SessionTracker but is NEVER called (WR-05)
290: - ❌ `removeLegacyStateFiles()` method exists but is never invoked (WR-05)
291: - ✅ Old source code at `src/task-management/journal/event-tracker/` preserved (L1)
292: 
293: **GAP:** Legacy cleanup was implemented but never wired to startup. The `void sessionTracker.initialize()` in plugin.ts does NOT chain to `.then(() => cleanup())`.
294: 
295: **SEVERITY:** 🔴 CRITICAL — Legacy state files persist. Defeats the purpose of migration.
296: 
297: **Source references:**
298: - `.hivemind/event-tracker/` — 26 pairs of .json/.md files (1.4MB)
299: - `src/features/session-tracker/index.ts:324-334` — cleanup() method (exists, never called)
300: - `src/plugin.ts` — no call to cleanup()
301: - Review finding WR-05 (confirmed unresolved)
302: 
303: ---
304: 
305: ## Summary Matrix
306: 
307: | REQ | Status | Severity | Key Gap |
308: |-----|--------|----------|---------|
309: | REQ-ST-01 | ⚠️ PARTIAL | 🔴 CRITICAL | Project index frozen, status never transitions |
310: | REQ-ST-02 | ⚠️ PARTIAL | 🟡 HIGH | Turn counter reset on restart |
311: | REQ-ST-03 | ⚠️ PARTIAL | 🟢 MEDIUM | Thinking duration placeholder |
312: | REQ-ST-04 | ✅ PASS | — | — |
313: | REQ-ST-05 | ❌ FAIL | 🔴 CRITICAL | CR-03: file content capture via heuristic error check |
314: | REQ-ST-06 | ❌ FAIL | 🔴 CRITICAL | Child records write-once, never updated |
315: | REQ-ST-07 | ❌ FAIL | 🔴 CRITICAL | Child lifecycles invisible, no turn capture |
316: | REQ-ST-08 | ❌ FAIL | 🔴 CRITICAL | Project index frozen, indices never updated |
317: | REQ-ST-09 | ⚠️ PARTIAL | 🟡 HIGH | Race conditions in frontmatter update |
318: | REQ-ST-10 | ⚠️ PARTIAL | 🟡 HIGH | Consumes stale data, has path traversal (CR-01) |
319: | REQ-ST-11 | ✅ PASS | — | — |
320: | REQ-ST-12 | ✅ PASS | 🟢 MEDIUM | isValidSessionID regex fragility |
321: | REQ-ST-13 | ❌ FAIL | 🔴 CRITICAL | cleanup() never called, 1.4MB legacy state persists |
322: 
323: **VERDICT:** 7 of 13 requirements have critical or high-severity gaps. 2 pass clean, 4 are partially working. The session tracker creates files but the update pipeline (indices, status transitions, child lifecycle tracking) is fundamentally broken. This is consistent with a module that was unit-tested in isolation (163 passing tests) but never validated against live hook event sequencing.
324: 
325: ---
326: 
327: ## Additional Systemic Issues (Beyond REQ Coverage)
328: 
329: ### SYS-01: Event Capture Ignores Child Sessions
330: The event-capture.ts module handles `session.created`, `session.idle`, `session.deleted`, `session.error` — but ONLY for main sessions. Child sessions generate their own lifecycle events that are silently dropped because:
331: - `session.created` for a child: `handleSessionCreated` sees `parentID !== null` and skips (correct)
332: - But `session.idle` for a child: `handleSessionIdle` calls `updateFrontmatter(childSessionID)` which looks for a .md file that doesn't exist → fails silently
333: - Child status transitions are completely lost
334: 
335: ### SYS-02: Lazy Bootstrap Gap
336: `ensureSessionReady()` (index.ts:120-149) is called from `handleChatMessage` and `handleToolExecuteAfter` — but NOT from `handleSessionEvent`. If a `session.idle` event fires before any chat or tool activity, the session directory doesn't exist and the event is dropped.
337: 
338: ### SYS-03: project-continuity.json Serial Queue Is Frozen
339: The `writeQueue` promise chain in `project-index-writer.ts` appears to have a stuck promise — `lastUpdated` hasn't changed in 7+ hours despite continuous session activity. This means no new session registrations are hitting the index.
340: 
341: ### SYS-04: No Child-to-Parent Status Back-Propagation
342: When a child session completes or errors, the parent's `session-continuity.json` should update the child's status. This never happens because no handler listens for child session lifecycle events and routes them to the parent's index.

(End of file - total 342 lines)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/.hivemind/AGENTS.md
# Internal State Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`.hivemind/` is the Internal State sector and canonical Q6 state root for Hivemind runtime persistence: session continuity, delegation records, config workflow state, event tracker artifacts, session journals, execution lineage, and recovery artifacts. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:405-411`, `.planning/codebase/STRUCTURE.md:130-134`.

## 2. Allowed mutation authority

- Typed runtime owners in `src/task-management/`, `src/coordination/`, and `src/features/` may write their assigned state files through approved persistence modules. Evidence: `.planning/codebase/ARCHITECTURE.md:311-315`, `.planning/codebase/ARCHITECTURE.md:405-411`.
- Tools may trigger state mutations through library owners when the tool contract permits mutation. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Event tracker artifacts may be best-effort hook-driven outputs only when routed through library/event-tracker owners; they must not block canonical handling. Evidence: `.planning/codebase/ARCHITECTURE.md:302-315`, `.planning/codebase/ARCHITECTURE.md:388-392`.

## 3. Forbidden mutations / explicit no-go boundaries

- Hooks SHALL NOT directly write durable state into `.hivemind/`; hook effects must stay observation/response-shaping/guard-decision. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- `.hivemind/` state SHALL NOT be moved back into `.opencode/`; `.opencode/state/` is legacy migration-only. Evidence: `.planning/codebase/ARCHITECTURE.md:351-353`, `.planning/codebase/STRUCTURE.md:295-299`.
- Do not fabricate missing state subdirectories or ownership modules from documentation-only work; bootstrap/state ownership remains an active gap. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not edit runtime state artifacts manually unless a recovery workflow explicitly authorizes it.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/task-management/continuity/` | Owns session continuity JSON persistence | Must deep-clone/normalize/quarantine through code owners |
| `src/task-management/continuity/delegation-persistence.ts` | Owns delegation record I/O | Tools/managers call the owner, not raw edits |
| Event tracker/session journal/lineage modules | Produce audit and timeline artifacts | Best-effort artifacts are not completion proof by themselves |
| Sidecar/planning readers | May read canonical artifacts | Read-only consumers must not mutate state |
| Recovery workflows | Assess and repair state under authorization | Must preserve evidence and avoid manual drift |

## 5. Naming and placement conventions

- Current known state folders include `.hivemind/state/`, `.hivemind/event-tracker/`, and `.hivemind/poor-prompts/`. Evidence: `.planning/codebase/STRUCTURE.md:40-43`, `.planning/codebase/STRUCTURE.md:130-134`.
- State files should be owned by typed modules before being treated as runtime-contract surfaces. Evidence: `.planning/PROJECT.md:29-42`, `.planning/REQUIREMENTS.md:46-56`.
- Do not use `.opencode/` for new internal state naming or placement. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.

## 6. Quality gates and evidence expectations

- State-sector changes require proof of the owning module, migration behavior, and recovery/quarantine behavior when applicable.
- Unit tests alone do not prove restart recovery; runtime recovery claims need integration or live restart evidence.
- Docs-only edits remain L5 evidence and must not unblock CA-04 bootstrap/state ownership readiness. Evidence: `.planning/ROADMAP.md:29-49`.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01). All sector AGENTS.md files audited against live evidence.  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for .hivemind/:** Directory count verified at 11 subdirectories. Q6 canonical state root boundary unchanged.  
**Next work affecting .hivemind/:** CP-ST-01 (Session Tracker Revamp) will add `.hivemind/session-tracker/` as a new persistence root.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Source Defects Catalog (Writer Engine)
2: 
3: **Date:** 2026-05-12
4: **Scope:** `src/features/session-tracker/` capture + persistence + transform layers
5: **Classification: Group A — Writer Engine Defects**
6: 
7: Each finding includes: file:line, mechanism, reproduction evidence, review finding cross-reference, and suggested fix direction.
8: 
9: ---
10: 
11: ## DEFECT-01: Project Index Update `childCount: undefined` Corrupts Entry
12: 
13: | Property | Value |
14: |----------|-------|
15: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts:251-253` |
16: | **Mechanism** | `handleTask()` calls `this.projectIndexWriter.updateSession(input.sessionID, { childCount: undefined })` |
17: | **Chain** | `project-index-writer.ts:166-172` — `updateSession` spreads `...updates` over existing entry. JavaScript `{ childCount: undefined }` spread **overwrites** the key with `undefined` → field effectively deleted from JSON |
18: | **Evidence** | 13 sessions in `project-continuity.json` are missing the `childCount` field entirely (L1) |
19: | **Review ref** | WR-01 — confirmed unresolved |
20: | **Severity** | 🔴 CRITICAL |
21: 
22: **Fix direction:** Either omit `childCount` from the update call, or read current count and increment.
23: 
24: ---
25: 
26: ## DEFECT-02: Project Index `lastUpdated` Never Advances — Serial Queue Stuck
27: 
28: | Property | Value |
29: |----------|-------|
30: | **File:line** | `src/features/session-tracker/persistence/project-index-writer.ts:89-91` (writeQueue) |
31: | **Mechanism** | The `writeQueue` Promise chain serializes index writes. If one promise in the chain never resolves (unhandled rejection, infinite await), all subsequent writes are blocked. `project-continuity.json` shows `lastUpdated: "2026-05-11T17:04:29.708Z"` — 7+ hours stale as of May 12 00:04. |
32: | **Evidence** | `project-continuity.json` has 83 entries all added before 17:04 but no entries added since, despite ~57 more session directories created after 17:04 (L1) |
33: | **Review ref** | Not in review (systemic issue discovered during disk audit) |
34: | **Severity** | 🔴 CRITICAL |
35: 
36: **Fix direction:** Add timeout/failure recovery to the write queue. Log stuck queue state. Consider per-entry locking instead of global serial queue.
37: 
38: ---
39: 
40: ## DEFECT-03: Child Session Records Are Write-Once, Never Updated
41: 
42: | Property | Value |
43: |----------|-------|
44: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts:236-240` |
45: | **Mechanism** | `handleTask()` calls `childWriter.createChildFile()` once at task spawn time. Never calls `childWriter.updateChildStatus()` or `childWriter.appendChildTurn()` afterward. Child session lifecycle events (created, idle, deleted) are routed to `event-capture.ts` which only handles main sessions (routes events to .md, not .json). |
46: | **Evidence** | All child .json files have `turns: []`, `status: "active"`, `mainAgent.model: "unknown"`, `created == updated` (L1) |
47: | **Review ref** | Not in review (systemic gap) |
48: | **Severity** | 🔴 CRITICAL |
49: 
50: **Fix direction:** Child session events need a separate handler path. When `event-capture` detects a child session (via `parentID !== null`), it should route to `childWriter.updateChildStatus()` and `childWriter.appendChildTurn()` instead of (or in addition to) the main session writer.
51: 
52: ---
53: 
54: ## DEFECT-04: `handleRead` Captures File Content via Heuristic Error Detection
55: 
56: | Property | Value |
57: |----------|-------|
58: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts:176-187` |
59: | **Mechanism** | `outputStr` is checked for substrings `"error"` or `"not found"`. If found, the **entire output string** (which IS the file content) is written as the error parameter to `appendToolBlock`. Any file containing those words triggers full content capture. |
60: | **Evidence** | Code analysis (L4) — direct violation of REQ-ST-05 |
61: | **Review ref** | CR-03 — confirmed unresolved |
62: | **Severity** | 🔴 CRITICAL |
63: 
64: **Fix direction:** Check output metadata for error status (e.g., `output.metadata?.error !== undefined`) instead of substring-matching file content. Never pass file content to error parameter.
65: 
66: ---
67: 
68: ## DEFECT-05: `session-index-writer.addChild` Conflates Child Count with Turn Count
69: 
70: | Property | Value |
71: |----------|-------|
72: | **File:line** | `src/features/session-tracker/persistence/session-index-writer.ts:137` |
73: | **Mechanism** | `addChild()` executes `index.turnCount++` when registering a child. A child session creation is not a conversation turn — this inflates `turnCount`. |
74: | **Evidence** | `ses_1e8826b7` has 2 actual user turns but `session-continuity.json` shows `turnCount: 8` (matches 8 children) (L1) |
75: | **Review ref** | WR-06 — confirmed unresolved |
76: | **Severity** | 🟡 HIGH |
77: 
78: **Fix direction:** Remove `index.turnCount++` from `addChild()`. Maintain separate `childCount` field. Only increment `turnCount` via `incrementTurnCount()`.
79: 
80: ---
81: 
82: ## DEFECT-06: `updateFrontmatter` Has Double-Read Race Condition
83: 
84: | Property | Value |
85: |----------|-------|
86: | **File:line** | `src/features/session-tracker/persistence/session-writer.ts:175-189` |
87: | **Mechanism** | `updateFrontmatter` reads the file (line 181), modifies frontmatter, then calls `atomicAppendMarkdown` (line 189) which **independently reads the file again** (atomic-write.ts:67). Between the two reads, another concurrent write can modify the file, causing lost frontmatter updates. |
88: | **Evidence** | Code analysis (L4) — race window exists between two file reads |
89: | **Review ref** | WR-02 — confirmed unresolved |
90: | **Severity** | 🟡 HIGH |
91: 
92: **Fix direction:** Either (a) use a per-session write queue to serialize all writes, or (b) extract `atomicWriteMarkdown(path, content)` that writes directly without re-reading, and use it in `updateFrontmatter`.
93: 
94: ---
95: 
96: ## DEFECT-07: `toolSummary` Never Populated in Session Continuity Index
97: 
98: | Property | Value |
99: |----------|-------|
100: | **File:line** | `src/features/session-tracker/capture/tool-capture.ts` (all handlers) |
101: | **Mechanism** | `updateToolSummary(sessionID, toolName)` method exists on `SessionIndexWriter` but is never called from any capture handler. Every tool invocation should call `sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)`. |
102: | **Evidence** | All `session-continuity.json` files show `toolSummary: {}` (L1) |
103: | **Review ref** | Not in review |
104: | **Severity** | 🟡 HIGH |
105: 
106: **Fix direction:** Add `this.sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)` call in `handleSkill`, `handleRead`, `handleTask`, and `handleOther`.
107: 
108: ---
109: 
110: ## DEFECT-08: Child Session Events Lost (Architecture Gap)
111: 
112: | Property | Value |
113: |----------|-------|
114: | **File:line** | `src/features/session-tracker/capture/event-capture.ts:105-127` |
115: | **Mechanism** | `handleSessionEvent` switch cases call `handleSessionIdle`, `handleSessionDeleted`, `handleSessionError` which ALL route to `sessionWriter.updateFrontmatter(sessionID, ...)`. For child sessions, no .md file exists — the record is a .json file under the parent. The write silently fails (file not found, caught by try/catch, logged as warning). |
116: | **Evidence** | All child .json files have `status: "active"` with zero updates (L1) |
117: | **Review ref** | Not in review |
118: | **Severity** | 🔴 CRITICAL |
119: 
120: **Fix direction:** `event-capture.ts` needs a routing layer: for main sessions → use `sessionWriter`; for child sessions → use `childWriter.updateChildStatus()`. Requires detecting child sessions (via `parentID` check) at the `handleSessionEvent` level, not just at `handleSessionCreated`.
121: 
122: ---
123: 
124: ## DEFECT-09: Lazy Bootstrap Gap — SessionEvent Handler Doesn't Bootstrap
125: 
126: | Property | Value |
127: |----------|-------|
128: | **File:line** | `src/features/session-tracker/index.ts:164-179, 120-149` |
129: | **Mechanism** | `ensureSessionReady()` (lazy bootstrap) is called from `handleChatMessage` (line 206) and `handleToolExecuteAfter` (line 241) but NOT from `handleSessionEvent` (line 164). If a `session.idle`, `session.deleted`, or `session.error` event fires BEFORE any chat or tool activity, the session directory hasn't been created yet and the event is silently dropped. |
130: | **Evidence** | Code analysis (L4) — missing bootstrap in event handler |
131: | **Review ref** | Not in review |
132: | **Severity** | 🟡 HIGH |
133: 
134: **Fix direction:** Add `await this.ensureSessionReady(event.sessionID)` as the first operation in `handleSessionEvent` (after checking initialization).
135: 
136: ---
137: 
138: ## DEFECT-10: Dynamic Import on Every `updateFrontmatter` Call
139: 
140: | Property | Value |
141: |----------|-------|
142: | **File:line** | `src/features/session-tracker/persistence/session-writer.ts:179` |
143: | **Mechanism** | `await import("node:fs/promises")` runs on every `updateFrontmatter` invocation. Unnecessary dynamic import overhead. |
144: | **Evidence** | Code analysis (L4) |
145: | **Review ref** | IN-01 — confirmed unresolved |
146: | **Severity** | 🔵 LOW |
147: 
148: **Fix direction:** Add static `import { readFile } from "node:fs/promises"` at top of file.
149: 
150: ---
151: 
152: ## DEFECT-11: `computeThinkingDuration` Returns Hardcoded "present"
153: 
154: | Property | Value |
155: |----------|-------|
156: | **File:line** | `src/features/session-tracker/transform/agent-transform.ts:117-118` |
157: | **Mechanism** | Method returns `"present"` instead of computing actual thinking duration from timing data. |
158: | **Evidence** | Code analysis (L4) |
159: | **Review ref** | Not in review |
160: | **Severity** | 🟢 MEDIUM |
161: 
162: **Fix direction:** Either remove this method and return `undefined` (honesty) or compute from actual timing data if available in hook metadata.
163: 
164: ---
165: 
166: ## DEFECT-12: `SessionTracker.cleanup()` Never Called
167: 
168: | Property | Value |
169: |----------|-------|
170: | **File:line** | `src/features/session-tracker/index.ts:324-334`, `src/plugin.ts` (no call site) |
171: | **Mechanism** | `cleanup()` method exists but is never invoked. `removeLegacyStateFiles()` inside it also never runs. |
172: | **Evidence** | 1.4MB of legacy event-tracker state persists (L1) |
173: | **Review ref** | WR-05 — confirmed unresolved |
174: | **Severity** | 🔴 CRITICAL |
175: 
176: **Fix direction:** In `plugin.ts`, chain `void sessionTracker.initialize().then(() => sessionTracker.cleanup())` or add a disable hook.
177: 
178: ---
179: 
180: ## DEFECT-13: Turn Counters Reset on Restart (No Seeding)
181: 
182: | Property | Value |
183: |----------|-------|
184: | **File:line** | `src/features/session-tracker/capture/message-capture.ts:65` |
185: | **Mechanism** | `turnCounters` Map is in-memory only. On plugin restart, all counters reset to 0. Existing .md files with turns 1-N will get duplicate `## USER (turn 1)` appends. |
186: | **Evidence** | Code analysis (L4) |
187: | **Review ref** | WR-04 — confirmed unresolved |
188: | **Severity** | 🟡 HIGH |
189: 
190: **Fix direction:** During initialization, parse existing .md file to count `## USER (turn N)` headers and seed `turnCounters` map.
191: 
192: ---
193: 
194: ## DEFECT-14: Incomplete Non-`ses_` Session ID Handling
195: 
196: | Property | Value |
197: |----------|-------|
198: | **File:line** | `src/features/session-tracker/types.ts:270` |
199: | **Mechanism** | `isValidSessionID` regex `/^ses_[a-zA-Z0-9]{6,}$/` rejects any session ID that doesn't start with `ses_` followed by 6+ alphanumeric chars. If OpenCode changes format, all capture silently skips. |
200: | **Evidence** | Code analysis (L4) |
201: | **Review ref** | WR-03 — confirmed unresolved |
202: | **Severity** | 🟡 HIGH |
203: 
204: **Fix direction:** Loosen validation to accept any non-empty string without path separators. Use `safeSessionPath` for path safety, not session ID format validation.
205: 
206: ---
207: 
208: ## Summary
209: 
210: | ID | File | Severity | Review Ref | Resolved? |
211: |----|------|----------|------------|-----------|
212: | DEFECT-01 | tool-capture.ts:251 | 🔴 CRITICAL | WR-01 | No |
213: | DEFECT-02 | project-index-writer.ts:89 | 🔴 CRITICAL | — | — |
214: | DEFECT-03 | tool-capture.ts:236 | 🔴 CRITICAL | — | — |
215: | DEFECT-04 | tool-capture.ts:176 | 🔴 CRITICAL | CR-03 | No |
216: | DEFECT-05 | session-index-writer.ts:137 | 🟡 HIGH | WR-06 | No |
217: | DEFECT-06 | session-writer.ts:175 | 🟡 HIGH | WR-02 | No |
218: | DEFECT-07 | tool-capture.ts (all) | 🟡 HIGH | — | — |
219: | DEFECT-08 | event-capture.ts:105 | 🔴 CRITICAL | — | — |
220: | DEFECT-09 | index.ts:164 | 🟡 HIGH | — | — |
221: | DEFECT-10 | session-writer.ts:179 | 🔵 LOW | IN-01 | No |
222: | DEFECT-11 | agent-transform.ts:117 | 🟢 MEDIUM | — | — |
223: | DEFECT-12 | index.ts:324 + plugin.ts | 🔴 CRITICAL | WR-05 | No |
224: | DEFECT-13 | message-capture.ts:65 | 🟡 HIGH | WR-04 | No |
225: | DEFECT-14 | types.ts:270 | 🟡 HIGH | WR-03 | No |
226: 
227: **14 source defects identified.** 6 critical, 6 high, 1 medium, 1 low. 0 review findings resolved.

(End of file - total 227 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Tool Surface Deficiencies
2: 
3: **Date:** 2026-05-12
4: **Classification: Group B — Tool Surface Deficiencies**
5: **Files:** `src/tools/hivemind/session-tracker.ts`, `src/schema-kernel/session-tracker.schema.ts`
6: 
7: ---
8: 
9: ## GAP-01: Path Traversal in `handleExportSession`
10: 
11: | Property | Value |
12: |----------|-------|
13: | **File:line** | `src/tools/hivemind/session-tracker.ts:107-108` |
14: | **Mechanism** | Constructs filePath using raw `resolve(trackerRoot, input.sessionId, ...)` with no validation or sanitization of `input.sessionId`. Zod schema validates `sessionId` as optional string — does NOT validate it as a safe path component. |
15: | **Severity** | 🔴 CRITICAL |
16: | **Review ref** | CR-02 — confirmed unresolved |
17: 
18: **Evidence:** Code analysis (L4). An agent could supply `../../` sequences to read arbitrary files.
19: 
20: **Fix:** Apply `isValidSessionID()` + `safeSessionPath()` validation before constructing path. Import from `../../features/session-tracker/persistence/atomic-write.js` and `../../features/session-tracker/types.js`.
21: 
22: ---
23: 
24: ## GAP-02: Synchronous `statSync`/`existsSync` Block Event Loop
25: 
26: | Property | Value |
27: |----------|-------|
28: | **File:line** | `src/tools/hivemind/session-tracker.ts:21, 198, 202` |
29: | **Mechanism** | `statSync` and `existsSync` from `node:fs` are blocking calls. In a plugin environment, this delays other tool calls. Inconsistent with the rest of the file which uses `readFile`/`readdir` from `node:fs/promises`. |
30: | **Severity** | 🔵 LOW |
31: | **Review ref** | IN-04 — confirmed unresolved |
32: 
33: **Fix:** Replace with `node:fs/promises` equivalents: `stat(path)` and `access(path).then(() => true).catch(() => false)`.
34: 
35: ---
36: 
37: ## GAP-03: No Session ID Validation in `handleSearchSessions`
38: 
39: | Property | Value |
40: |----------|-------|
41: | **File:line** | `src/tools/hivemind/session-tracker.ts:196-197` |
42: | **Mechanism** | `handleSearchSessions` constructs `mdPath` via `resolve(trackerRoot, sessionId, ...)` after a `startsWith("ses_")` filter on directory names (line 193). The directory name check provides partial protection but does NOT validate the session ID against `safeSessionPath()` or `isValidSessionID()`. A directory named `ses_../etc` would pass the `startsWith` check. |
43: | **Severity** | 🟡 HIGH |
44: 
45: **Fix:** Add `isValidSessionID(sessionId) && safeSessionPath(projectRoot, sessionId, ...)` validation before constructing the path.
46: 
47: ---
48: 
49: ## GAP-04: Tool is Read-Only but No Write-Side Actions for Agent Consumability
50: 
51: | Property | Value |
52: |----------|-------|
53: | **Description** | The tool provides 3 actions: `export-session`, `list-sessions`, `search-sessions`. All are read-only. Per D-02, the tool was designed for extensibility with a TODO for future hierarchy context retrieval toolset connecting to doc-intelligence, agent classifications, and coordination realms. |
54: | **Severity** | 🟢 MEDIUM |
55: 
56: **Gap analysis:**
57: - No `get-child-sessions` action — agents cannot query delegation hierarchy from the tool
58: - No `get-session-status` action — agents cannot check if a session is active/completed/errored
59: - No `get-session-summary` action — agents must export full .md content (potentially 200KB+) for basic metadata
60: - No `get-turn` action — agents cannot retrieve specific turns
61: - No `get-tools-summary` action — tool summary data exists in `session-continuity.json` but is not exposed
62: - No `get-children-detail` action — child session contents are inaccessible (only the parent .md is exported)
63: 
64: **Design notes for Phase 12:**
65: - Add `get-session` action returning frontmatter + metadata (without full MD body) for efficient agent consumption
66: - Add `get-children` action listing child sessions with status, agent, description
67: - Add `get-child` action returning full child .json record
68: - Expose toolSummary from session-continuity.json
69: - Consider adding write-side actions: `mark-session-complete`, `update-child-status` (though write-side tool needs careful CQRS design)
70: 
71: ---
72: 
73: ## GAP-05: Schema Has No Session ID Format Validation
74: 
75: | Property | Value |
76: |----------|-------|
77: | **File:line** | `src/schema-kernel/session-tracker.schema.ts` |
78: | **Mechanism** | The Zod schema validates `sessionId` as `z.string().optional()` — no format validation, no length check, no prefix check. All session ID validation is deferred to the tool handlers, which inconsistently apply validation. |
79: | **Severity** | 🟡 HIGH |
80: 
81: **Fix:** Add Zod refinement to validate session ID format at the schema level: `z.string().min(10).regex(/^ses_[a-zA-Z0-9_-]+$/)`. Fail fast at input validation, not in handler logic.
82: 
83: ---
84: 
85: ## GAP-06: `handleListSessions` Returns Stale Data from Frozen Index
86: 
87: | Property | Value |
88: |----------|-------|
89: | **Description** | `handleListSessions` reads `project-continuity.json` which is frozen (see DEFECT-02). Agents listing sessions receive data that is 7+ hours stale — missing sessions created after the index froze, showing wrong child counts (all 0), showing wrong statuses (all "active"). |
90: | **Severity** | 🔴 CRITICAL |
91: 
92: **Workaround:** Until DEFECT-02 is fixed, the tool should fall back to scanning the `session-tracker/` directory directly and reading individual `.md` frontmatters for status, rather than relying on the frozen index.
93: 
94: ---
95: 
96: ## Summary
97: 
98: | Gap | File | Severity | Review Ref | Resolved? |
99: |-----|------|----------|------------|-----------|
100: | GAP-01 | session-tracker.ts:107 | 🔴 CRITICAL | CR-02 | No |
101: | GAP-02 | session-tracker.ts:21 | 🔵 LOW | IN-04 | No |
102: | GAP-03 | session-tracker.ts:196 | 🟡 HIGH | — | — |
103: | GAP-04 | session-tracker.ts (design) | 🟢 MEDIUM | — | — |
104: | GAP-05 | session-tracker.schema.ts | 🟡 HIGH | — | — |
105: | GAP-06 | session-tracker.ts:131 | 🔴 CRITICAL | — | — |
106: 
107: **6 tool surface deficiencies.** 2 critical (path traversal + stale data), 2 high, 1 medium, 1 low. The primary tool gap is that the session-tracker tool reads from the frozen project-continuity.json index, giving agents stale/wrong data.

(End of file - total 107 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md</path>
<type>file</type>
<content>
1: # Phase 12: CP-ST-01 Remediation — Review Findings Status
2: 
3: **Date:** 2026-05-12
4: **Source:** `CP-ST-01-REVIEW.md` (14 findings: 3 critical, 6 warning, 5 info)
5: **Verification method:** Source code inspection + disk evidence audit
6: 
7: ---
8: 
9: ## Critical Issues
10: 
11: | ID | Finding | File:line | Status | Evidence |
12: |----|---------|-----------|--------|----------|
13: | **CR-01** | Path Traversal in `readSessionFile` — Recovery Module | `session-recovery.ts:264-268` | ❌ UNRESOLVED | Source code unchanged. `resolve(trackerRoot, sessionID, ...)` still raw — no `safeSessionPath` import. |
14: | **CR-02** | Path Traversal in Session-Tracker Tool — `handleExportSession` | `session-tracker.ts:107-108` | ❌ UNRESOLVED | Source code unchanged. `resolve(trackerRoot, input.sessionId, ...)` still raw. No `isValidSessionID` guard. |
15: | **CR-03** | REQ-ST-05 Violation — `handleRead` Can Leak File Content | `tool-capture.ts:170-187` | ❌ UNRESOLVED | Source code unchanged. Substring-matching on `"error"`/`"not found"` still present. Full output captured as error parameter. |
16: 
17: **All 3 critical review findings remain unresolved.** No code changes applied.
18: 
19: ---
20: 
21: ## Warnings
22: 
23: | ID | Finding | File:line | Status | Evidence |
24: |----|---------|-----------|--------|----------|
25: | **WR-01** | `childCount: undefined` Can Corrupt Project Index Entry | `tool-capture.ts:251-253` | ❌ UNRESOLVED | `childCount: undefined` still present. Confirmed by L1 evidence: 13 sessions missing `childCount` field. |
26: | **WR-02** | Race Condition in `updateFrontmatter` — Double-Read + Write | `session-writer.ts:175-189` | ❌ UNRESOLVED | `atomicAppendMarkdown` still re-reads file internally. Dynamic import on line 179 still present. |
27: | **WR-03** | `isValidSessionID` Regex Is an Assumption | `types.ts:270` | ❌ UNRESOLVED | Regex `/^ses_[a-zA-Z0-9]{6,}$/` unchanged. No loosening or format verification. |
28: | **WR-04** | Turn Counter Reset on Plugin Restart | `message-capture.ts:65` | ❌ UNRESOLVED | `turnCounters` Map still in-memory only. No seeding from existing .md files. |
29: | **WR-05** | `SessionTracker.cleanup()` Never Called | `index.ts:324` + `plugin.ts` | ❌ UNRESOLVED | Confirmed by L1 evidence: 1.4MB legacy event-tracker state persists. No call chain to `cleanup()`. |
30: | **WR-06** | `addChild` Increments `turnCount` Semantically Incorrectly | `session-index-writer.ts:137` | ❌ UNRESOLVED | `index.turnCount++` still present. Confirmed by L1: ses_1e8826b7 has turnCount=8 (8 children, but only 2 actual turns). |
31: 
32: **All 6 warnings remain unresolved.** No code changes applied.
33: 
34: ---
35: 
36: ## Info
37: 
38: | ID | Finding | File:line | Status | Evidence |
39: |----|---------|-----------|--------|----------|
40: | **IN-01** | Dynamic Import on Every `updateFrontmatter` Call | `session-writer.ts:179` | ❌ UNRESOLVED | `await import("node:fs/promises")` still present. |
41: | **IN-02** | `let` Instead of `const` for Non-Reassigned Variables | `tool-capture.ts:174-178` | ❌ UNRESOLVED | Variables still declared with `let`. |
42: | **IN-03** | Non-Null Assertion in `extractTextContent` | `message-capture.ts:207` | ❌ UNRESOLVED | `p.text!` non-null assertion still present. |
43: | **IN-04** | Synchronous `statSync`/`existsSync` in Read-Side Tool | `session-tracker.ts:21,198,202` | ❌ UNRESOLVED | `statSync`/`existsSync` still used. |
44: | **IN-05** | `console.log` Debug Artifact on Initialization | `index.ts:247` | ❌ UNRESOLVED | `console.log("[Harness] Session tracker: initialized")` still present. |
45: 
46: **All 5 info findings remain unresolved.** No code changes applied.
47: 
48: ---
49: 
50: ## Summary
51: 
52: | Category | Total | Resolved | Unresolved | Regressed |
53: |----------|-------|----------|------------|-----------|
54: | Critical | 3 | 0 | 3 | 0 |
55: | Warning | 6 | 0 | 6 | 0 |
56: | Info | 5 | 0 | 5 | 0 |
57: | **Total** | **14** | **0** | **14** | **0** |
58: 
59: **100% of review findings remain unresolved.** The review was filed but no remediation plan or fix commit followed the review. All 14 findings are live in the current codebase and confirmed by fresh source inspection.
60: 
61: ### New Findings Beyond Review
62: 
63: The disk evidence audit discovered 8 additional systemic issues not caught by the code review:
64: 
65: | ID | Description | Severity |
66: |----|-------------|----------|
67: | DEFECT-02 | Project index serial queue frozen — no updates in 7+ hours | 🔴 CRITICAL |
68: | DEFECT-03 | Child records write-once, never updated | 🔴 CRITICAL |
69: | DEFECT-07 | toolSummary never populated | 🟡 HIGH |
70: | DEFECT-08 | Child session lifecycle events completely lost | 🔴 CRITICAL |
71: | DEFECT-09 | Lazy bootstrap gap in event handler | 🟡 HIGH |
72: | DEFECT-11 | computeThinkingDuration returns hardcoded "present" | 🟢 MEDIUM |
73: | SYS-03 | project-continuity.json lastUpdated frozen | 🔴 CRITICAL |
74: | SYS-04 | No child-to-parent status back-propagation | 🟡 HIGH |
75: 
76: The code review was thorough on surface-level issues (path traversal, race conditions, type safety) but missed systemic architecture gaps that only manifest in live hook event sequencing — specifically, the loss of child session lifecycle events, the frozen index queue, and the write-once child record pattern.

(End of file - total 76 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md</path>
<type>file</type>
<content>
1: # Custom Tools Design Criteria
2: 
3: **Document Version:** 1.0.0
4: **Date:** 2026-05-05
5: **Author:** hf-l2-prompter (L2 Prompt Engineering Specialist)
6: **Status:** ACTIVE — Reference standard for all custom tool design, audit, and development
7: **Scope:** Hivemind V3 harness (`src/tools/`) and any future custom tool development
8: 
9: ---
10: 
11: ## Purpose
12: 
13: This document defines the **correct design criteria** for custom tools in the Hivemind harness ecosystem. It serves as:
14: 
15: 1. **Design Standard** — What correct tool design looks like based on industry best practices
16: 2. **Validation Metrics** — Measurable criteria for auditing existing tools
17: 3. **Development Guide** — Practical guidance for building new tools
18: 4. **Anti-Pattern Catalog** — What to avoid (based on industry standards, not legacy codebase patterns)
19: 
20: > **IMPORTANT:** The existing codebase tools may contain patterns that deviate from these criteria. This document defines the **target state**, not the current state. Use it to guide refactoring and new development.
21: 
22: ---
23: 
24: ## Table of Contents
25: 
26: 1. [Tool Classification Matrix](#1-tool-classification-matrix)
27: 2. [Criterion 1: Discoverability](#2-criterion-1-discoverability)
28: 3. [Criterion 2: Deterministic Behavior](#3-criterion-2-deterministic-behavior)
29: 4. [Criterion 3: Composability](#4-criterion-3-composability)
30: 5. [Criterion 4: Granularity & Naming](#5-criterion-4-granularity--naming)
31: 6. [Criterion 5: Schema Validation](#6-criterion-5-schema-validation)
32: 7. [Criterion 6: Non-Conflict](#7-criterion-6-non-conflict)
33: 8. [Criterion 7: Ergonomics](#8-criterion-7-ergonomics)
34: 9. [Criterion 8: Purpose-Driven Design](#9-criterion-8-purpose-driven-design)
35: 10. [Criterion 9: Ecosystem Integration](#10-criterion-9-ecosystem-integration)
36: 11. [Criterion 10: Justified Existence](#11-criterion-10-justified-existence)
37: 12. [Validation Checklist](#12-validation-checklist)
38: 13. [References](#13-references)
39: 
40: ---
41: 
42: ## 1. Tool Classification Matrix
43: 
44: Custom tools MUST be classified into one of 8 categories. Classification determines naming conventions, scope boundaries, and integration patterns.
45: 
46: | Category | Purpose | Tool Prefix | Example Tools | Lineage |
47: |----------|---------|-------------|---------------|---------|
48: | **C1: Task Management & Coordination** | Delegation dispatch, status polling, hand-off, governance loops | `delegate-*`, `task-*` | `delegate-task`, `delegation-status` | hm-*, hf-* |
49: | **C2: Governance & State** | State updates, context governance, context purification, memory persistence | `state-*`, `context-*` | `session-patch`, `continuity-*` | hm-* |
50: | **C3: Inspection & Research** | Investigation, research-based analysis, knowledge synthesis | `inspect-*`, `research-*` | `prompt-skim`, `prompt-analyze`, `hivemind-doc` | hm-* |
51: | **C4: Code Intelligence** | AST analysis, signatures, symbols, type injections | `code-*`, `ast-*` | (future: `symbol-lookup`, `type-inject`) | hm-* |
52: | **C5: Planning & Artifacts** | Planning documents, doc-intelligence, hierarchical planning | `plan-*`, `doc-*` | `session-journal-export` | hm-* |
53: | **C6: Quality & Guardrails** | Audit, review, verification, compliance | `audit-*`, `verify-*` | `validate-restart` | hm-*, gate-* |
54: | **C7: Gate-Keeping & Integration** | Cross-domain evidence-based verification, integration checks | `gate-*`, `integrate-*` | (future: `evidence-check`, `integration-verify`) | gate-* |
55: | **C8: Lineage & Classification** | hm-*/hf-*/shared classification, routing | `lineage-*`, `classify-*` | (future: `lineage-classify`) | shared |
56: 
57: ### Classification Rules
58: 
59: 1. **Every tool MUST belong to exactly one category.** If a tool spans categories, split it into separate tools.
60: 2. **Category determines prefix.** Tools MUST use the prefix约定 for their category.
61: 3. **Lineage determines ownership.** hm-* tools serve product development; hf-* tools serve meta-builder workflows; gate-* tools serve quality assurance; shared tools serve all lineages.
62: 4. **Cross-category tools are anti-patterns.** A tool that manages state AND delegates work violates single-responsibility.
63: 
64: ---
65: 
66: ## 2. Criterion 1: Discoverability
67: 
68: ### Standard
69: 
70: Tools MUST be discoverable by agents without obfuscation in descriptions. An agent encountering a tool for the first time MUST understand its purpose, inputs, outputs, and side effects from the description alone.
71: 
72: ### Success Metrics
73: 
74: | Metric | Target | Validation Method |
75: |--------|--------|-------------------|
76: | **Description clarity** | Agent can predict tool behavior from description alone | Blind test: give description to agent, ask what tool does |
77: | **Parameter documentation** | 100% of args have `.describe()` with clear purpose | Code review: grep for missing `.describe()` calls |
78: | **Side-effect disclosure** | Description mentions if tool mutates state | Manual review of description text |
79: | **Example availability** | Complex tools (>3 args) include usage examples in description | Code review: check description length and content |
80: 
81: ### Guidelines
82: 
83: 1. **Description MUST answer:** What does this tool do? When should I use it? What does it return?
84: 2. **Description MUST NOT:** Be vague ("Handles tasks"), be overly technical ("Invokes SDK session.create with parentID resolution"), or omit side effects.
85: 3. **Parameter descriptions MUST:** State the purpose, expected format, and constraints.
86: 4. **Use imperative mood:** "Dispatch work to a specialist agent" not "This tool dispatches work..."
87: 
88: ### Anti-Patterns
89: 
90: | Anti-Pattern | Why It's Wrong | Correct Approach |
91: |--------------|----------------|------------------|
92: | **Vague descriptions** ("Manages sessions") | Agent cannot determine when to use tool | "Create, retrieve, or abort OpenCode sessions by ID" |
93: | **Missing parameter docs** | Agent guesses at input format | Every arg gets `.describe("Purpose, format, constraints")` |
94: | **Hidden side effects** | Agent doesn't know tool mutates state | "Persists delegation record to `.hivemind/state/delegations.json`" |
95: | **Technical jargon in descriptions** | Agent may not understand implementation details | Use domain language, not implementation language |
96: 
97: ---
98: 
99: ## 3. Criterion 2: Deterministic Behavior
100: 
101: ### Standard
102: 
103: Tools MUST be deterministic, condition-based, or event-driven. A tool with the same inputs MUST produce the same outputs (or predictable state transitions). Tools MUST be classified by their behavior model.
104: 
105: ### Behavior Models
106: 
107: | Model | Description | Example | State Impact |
108: |-------|-------------|---------|--------------|
109: | **Deterministic** | Same input → same output, no side effects | `prompt-skim` (analyze text, return metrics) | None |
110: | **Condition-based** | Output depends on current state, but transitions are predictable | `delegation-status` (returns current state of delegation) | Read-only |
111: | **Event-driven** | Triggered by lifecycle events, produces side effects | `delegate-task` (creates session, persists record) | Mutation |
112: | **State-mutating** | Explicitly changes persistent state | `session-patch` (modifies session files) | Mutation |
113: 
114: ### Success Metrics
115: 
116: | Metric | Target | Validation Method |
117: |--------|--------|-------------------|
118: | **Behavior classification** | Every tool has documented behavior model | Review tool metadata/frontmatter |
119: | **Idempotency (where applicable)** | Read-only tools return same result for same input | Unit test: call twice, compare outputs |
120: | **State transition documentation** | Mutation tools document before/after states | Review tool description and code |
121: | **Error determinism** | Same error conditions produce same error responses | Unit test: trigger error, verify response shape |
122: 
123: ### Guidelines
124: 
125: 1. **Document the behavior model** in tool description or frontmatter.
126: 2. **Read-only tools MUST be idempotent.** Calling `delegation-status` twice with same args returns same result.
127: 3. **Mutation tools MUST document state transitions.** "Before: delegation is `pending`. After: delegation is `dispatched`."
128: 4. **Event-driven tools MUST document triggers.** "Fires on: `session.idle`, `session.error`."
129: 
130: ### Anti-Patterns
131: 
132: | Anti-Pattern | Why It's Wrong | Correct Approach |
133: |--------------|----------------|------------------|
134: | **Undocumented side effects** | Agent doesn't know tool changes state | Document all state mutations in description |
135: | **Non-idempotent reads** | Calling read tool twice gives different results | Ensure read tools are pure functions of current state |
136: | **Hidden state dependencies** | Tool output depends on undocumented internal state | Document all state dependencies |
137: | **Race conditions** | Concurrent calls produce inconsistent results | Use keyed semaphore or document concurrency model |
138: 
139: ---
140: 
141: ## 4. Criterion 3: Composability
142: 
143: ### Standard
144: 
145: Tools MUST support composition via sub-tools, `$ARGUMENTS`, and plugin integration. Tools SHOULD be designed as building blocks that can be chained together.
146: 
147: ### Composition Patterns
148: 
149: | Pattern | Description | Example |
150: |---------|-------------|---------|
151: | **Sub-tool routing** | Single tool with action parameter routes to different behaviors | `run-background-command` with `action: "run" | "output" | "input" | "terminate"` |
152: | **Pipeline chaining** | Output of one tool feeds into next tool | `prompt-skim` → `prompt-analyze` → `session-patch` |
153: | **Plugin integration** | Tool can be extended or wrapped by plugins | Tool uses `ToolResponse<T>` envelope for uniform handling |
154: | **$ARGUMENTS support** | Tool accepts dynamic arguments from command parsing | Command invokes tool with parsed arguments |
155: 
156: ### Success Metrics
157: 
158: | Metric | Target | Validation Method |
159: |--------|--------|-------------------|
160: | **Action routing (where applicable)** | Multi-purpose tools use action enum | Code review: check for action parameter |
161: | **Pipeline compatibility** | Tools return structured data that downstream tools can consume | Integration test: chain tools |
162: | **Plugin extensibility** | Tool behavior can be modified via plugin hooks | Verify `tool.execute.before`/`after` hooks work |
163: | **Response envelope consistency** | All tools return `ToolResponse<T>` | Code review: grep for return types |
164: 
165: ### Guidelines
166: 
167: 1. **Multi-purpose tools MUST use action routing.** Single tool with `action` enum is preferred over multiple similar tools.
168: 2. **All tools MUST return `ToolResponse<T>` envelope.** This enables uniform error handling and pipeline chaining.
169: 3. **Tools SHOULD accept structured input** that can be produced by other tools.
170: 4. **Document composition patterns** in tool description: "Use after `prompt-skim` to analyze flagged issues."
171: 
172: ### Anti-Patterns
173: 
174: | Anti-Pattern | Why It's Wrong | Correct Approach |
175: |--------------|----------------|------------------|
176: | **Monolithic tools** | Single tool does too many things | Split into composable sub-tools |
177: | **Inconsistent return types** | Tools return different shapes, breaking pipelines | Use `ToolResponse<T>` envelope |
178: | **No action routing** | Multiple similar tools when one with actions would suffice | Use action enum for multi-purpose tools |
179: | **Tight coupling** | Tool only works with specific other tools | Design tools to accept generic input |
180: 
181: ---
182: 
183: ## 5. Criterion 4: Granularity & Naming
184: 
185: ### Standard
186: 
187: Tools MUST be granular with clear naming conventions. Tool names MUST be descriptive, follow kebab-case, and indicate the tool's category and purpose.
188: 
189: ### Naming Convention
190: 
191: ```
192: <category-prefix>-<action>-<object>
193: ```
194: 
195: | Component | Description | Examples |
196: |-----------|-------------|----------|
197: | **category-prefix** | Matches tool classification (C1-C8) | `delegate-`, `state-`, `inspect-`, `audit-` |
198: | **action** | Verb describing what tool does | `create-`, `get-`, `update-`, `delete-`, `export-`, `validate-` |
199: | **object** | Noun describing what tool operates on | `-task`, `-session`, `-delegation`, `-journal` |
200: 
201: ### Success Metrics
202: 
203: | Metric | Target | Validation Method |
204: |--------|--------|-------------------|
205: | **Kebab-case compliance** | 100% of tool names use kebab-case | Automated check: regex `^[a-z]+(-[a-z]+)*$` |
206: | **Category prefix compliance** | 100% of tools have correct category prefix | Manual review against classification matrix |
207: | **Name-action alignment** | Tool name accurately describes what it does | Blind test: read name, predict behavior |
208: | **LOC per tool** | ≤200 LOC per tool file (excluding tests) | Automated check: `wc -l` on tool files |
209: 
210: ### Guidelines
211: 
212: 1. **Tool name = filename.** OpenCode uses filename as tool name. Name the file correctly.
213: 2. **Use kebab-case exclusively.** No camelCase, no snake_case, no PascalCase.
214: 3. **Name MUST describe action + object.** `delegate-task` not `dt` or `delegationTool`.
215: 4. **Keep tools small.** If a tool exceeds 200 LOC, consider splitting into sub-tools.
216: 5. **Avoid generic names.** `manage-sessions` is too broad. `create-session`, `get-session`, `abort-session` are better.
217: 
218: ### Anti-Patterns
219: 
220: | Anti-Pattern | Why It's Wrong | Correct Approach |
221: |--------------|----------------|------------------|
222: | **Generic names** ("manage", "handle", "process") | Doesn't indicate specific purpose | Use specific verbs: "create", "get", "update", "delete" |
223: | **Abbreviations** ("del-task", "dlg-stat") | Reduces discoverability | Use full words: "delegate-task", "delegation-status" |
224: | **Inconsistent naming** | Some tools use prefixes, others don't | Follow the naming convention consistently |
225: | **Oversized tools** (>500 LOC) | Hard to test, hard to understand | Split into smaller, focused tools |
226: 
227: ---
228: 
229: ## 6. Criterion 5: Schema Validation
230: 
231: ### Standard
232: 
233: Tools MUST use Zod schemas for structured outputs and edge case handling. All tool arguments MUST be validated at the boundary. All tool responses MUST conform to documented schemas.
234: 
235: ### Schema Requirements
236: 
237: | Component | Requirement | Example |
238: |-----------|-------------|---------|
239: | **Input schema** | All args defined with Zod types | `args: { query: tool.schema.string().describe("...") }` |
240: | **Output schema** | Return type documented via `ToolResponse<T>` | `ToolResponse<{ count: number }>` |
241: | **Validation** | Input validated at boundary, not deep in code | `DelegateTaskInputSchema.parse(args)` at tool entry |
242: | **Error handling** | Validation errors return structured error response | `error("Invalid input: " + zodError.message)` |
243: 
244: ### Success Metrics
245: 
246: | Metric | Target | Validation Method |
247: |--------|--------|-------------------|
248: | **Zod schema coverage** | 100% of tool args have Zod schemas | Code review: check all `args` objects |
249: | **Boundary validation** | Validation happens at tool entry, not deep in code | Code review: check for `.parse()` calls |
250: | **Type safety** | No `any` types in tool signatures | TypeScript strict mode check |
251: | **Error response structure** | All errors return `ToolResponse` with kind: "error" | Code review: check error paths |
252: 
253: ### Guidelines
254: 
255: 1. **Define schemas at the boundary.** Validate input before any business logic.
256: 2. **Use `tool.schema` (Zod) for all arguments.** Never accept raw `any` or untyped input.
257: 3. **Return `ToolResponse<T>` for all outcomes.** Success, error, and pending states.
258: 4. **Document schema in description.** Agent needs to know expected input shape.
259: 5. **Use `.describe()` on every schema field.** This becomes the agent's documentation.
260: 
261: ### Anti-Patterns
262: 
263: | Anti-Pattern | Why It's Wrong | Correct Approach |
264: |--------------|----------------|------------------|
265: | **No input validation** | Invalid input causes runtime errors | Validate with Zod at boundary |
266: | **Raw string returns** | Agent can't parse structured results | Return `ToolResponse<T>` with typed data |
267: | **Deep validation** | Validation happens in business logic, not at entry | Validate at tool entry point |
268: | **Missing `.describe()`** | Agent doesn't know what field expects | Every field gets `.describe()` |
269: 
270: ---
271: 
272: ## 7. Criterion 6: Non-Conflict
273: 
274: ### Standard
275: 
276: Tools MUST NOT conflict with existing tools. Custom tools MUST NOT shadow built-in OpenCode tools unless explicitly intended and documented. Tool names MUST be unique within the harness.
277: 
278: ### Conflict Types
279: 
280: | Type | Description | Detection |
281: |------|-------------|-----------|
282: | **Name collision** | Custom tool has same name as built-in tool | Check against OpenCode built-in tool list |
283: | **Behavior overlap** | Custom tool does same thing as existing tool | Review existing tools before creating new one |
284: | **Side-effect conflict** | Two tools mutate same state in incompatible ways | Review state mutation paths |
285: | **Permission conflict** | Tool requires permissions that conflict with agent restrictions | Check agent permission model |
286: 
287: ### Success Metrics
288: 
289: | Metric | Target | Validation Method |
290: |--------|--------|-------------------|
291: | **Name uniqueness** | 0 name collisions with built-in tools | Automated check against tool registry |
292: | **Behavior uniqueness** | Each tool has distinct purpose | Manual review of tool descriptions |
293: | **State isolation** | Tools don't interfere with each other's state | Review state mutation paths |
294: | **Permission compliance** | Tools respect agent permission boundaries | Test with restricted agents |
295: 
296: ### Guidelines
297: 
298: 1. **Check existing tools before creating new ones.** Review `src/tools/` and OpenCode built-ins.
299: 2. **Document intentional overrides.** If a tool intentionally shadows a built-in, document why.
300: 3. **Use namespaced prefixes.** `hivemind-*` prefix for harness-specific tools.
301: 4. **Avoid state conflicts.** Each tool should own its state domain.
302: 
303: ### Anti-Patterns
304: 
305: | Anti-Pattern | Why It's Wrong | Correct Approach |
306: |--------------|----------------|------------------|
307: | **Shadowing built-ins without documentation** | Agent confusion about which tool is active | Document intentional overrides |
308: | **Duplicate functionality** | Two tools do the same thing | Consolidate into one tool |
309: | **Shared mutable state** | Tools interfere with each other | Use namespaced state or CQRS boundaries |
310: | **Permission escalation** | Tool bypasses agent restrictions | Respect permission model |
311: 
312: ---
313: 
314: ## 8. Criterion 7: Ergonomics
315: 
316: ### Standard
317: 
318: Tools MUST be easy to use with minimal required fields. Tools MUST be accessible mid-run without requiring session restart. Tool invocation SHOULD require the fewest possible arguments.
319: 
320: ### Ergonomic Principles
321: 
322: | Principle | Description | Example |
323: |-----------|-------------|---------|
324: | **Minimal required args** | Only essential fields are required; others have defaults | `delegate-task` requires `agent` and `prompt`; `title` is optional |
325: | **Sensible defaults** | Optional fields have reasonable defaults | `safetyCeilingMs` defaults to 300000 (5 min) |
326: | **Progressive disclosure** | Simple use case is simple; complex use case is possible | Basic: `delegate-task({ agent: "researcher", prompt: "..." })` |
327: | **Mid-run accessibility** | Tool can be invoked at any point in conversation | No session restart required |
328: 
329: ### Success Metrics
330: 
331: | Metric | Target | Validation Method |
332: |--------|--------|-------------------|
333: | **Required args count** | ≤3 required arguments per tool | Code review: count required fields |
334: | **Default coverage** | All optional fields have defaults | Code review: check for `.default()` or fallback logic |
335: | **Invocation simplicity** | Common use case requires minimal args | Agent test: invoke tool for common case |
336: | **Mid-run availability** | Tool works at any conversation point | Integration test: invoke mid-session |
337: 
338: ### Guidelines
339: 
340: 1. **Minimize required arguments.** If a field can have a default, make it optional.
341: 2. **Provide sensible defaults.** Defaults should work for the common case.
342: 3. **Support progressive disclosure.** Simple invocation for simple cases.
343: 4. **Document common patterns.** Show the simplest invocation first.
344: 
345: ### Anti-Patterns
346: 
347: | Anti-Pattern | Why It's Wrong | Correct Approach |
348: |--------------|----------------|------------------|
349: | **Too many required fields** | Increases cognitive load | Make fields optional with defaults |
350: | **No defaults** | Agent must specify everything | Provide sensible defaults |
351: | **Complex invocation** | Simple task requires complex args | Design for the common case first |
352: | **Session-dependent** | Tool only works at specific session points | Design for mid-run accessibility |
353: 
354: ---
355: 
356: ## 9. Criterion 8: Purpose-Driven Design
357: 
358: ### Standard
359: 
360: Tools MUST be well-designed for specific use cases with routing. Each tool MUST have a clear, singular purpose. Tools SHOULD route to appropriate handlers based on input.
361: 
362: ### Design Patterns
363: 
364: | Pattern | Description | Example |
365: |---------|-------------|---------|
366: | **Single Responsibility** | Each tool does one thing well | `delegate-task` only dispatches; `delegation-status` only polls |
367: | **Action Routing** | Multi-purpose tool routes to handlers | `run-background-command` routes by `action` field |
368: | **Category Gates** | Tools enforce category-specific rules | Category gates in delegation manager |
369: | **Error Routing** | Errors route to appropriate handlers | Validation errors → structured error response |
370: 
371: ### Success Metrics
372: 
373: | Metric | Target | Validation Method |
374: |--------|--------|-------------------|
375: | **Single responsibility** | Each tool has one clear purpose | Blind test: describe tool, get one-sentence purpose |
376: | **Action routing (where applicable)** | Multi-purpose tools use action enum | Code review: check for action parameter |
377: | **Error handling completeness** | All error paths return structured responses | Code review: check all throw/catch paths |
378: | **Purpose documentation** | Tool description states singular purpose | Review tool descriptions |
379: 
380: ### Guidelines
381: 
382: 1. **One tool, one purpose.** If you can't describe the tool's purpose in one sentence, split it.
383: 2. **Use action routing for multi-purpose tools.** Single tool with action enum is better than multiple similar tools.
384: 3. **Route errors appropriately.** Validation errors, runtime errors, and business errors should all be handled.
385: 4. **Document the purpose clearly.** "This tool dispatches work to a specialist agent via SDK child-session."
386: 
387: ### Anti-Patterns
388: 
389: | Anti-Pattern | Why It's Wrong | Correct Approach |
390: |--------------|----------------|------------------|
391: | **Kitchen sink tools** | Tool does too many things | Split into focused tools |
392: | **No error routing** | Errors are swallowed or generic | Route errors to appropriate handlers |
393: | **Unclear purpose** | Agent doesn't know when to use tool | Document singular purpose |
394: | **Mixed concerns** | Tool handles unrelated responsibilities | Separate concerns into different tools |
395: 
396: ---
397: 
398: ## 10. Criterion 9: Ecosystem Integration
399: 
400: ### Standard
401: 
402: Tools MUST integrate and harmonize with the broader ecosystem. Tools MUST respect CQRS boundaries, agent hierarchies, and state management patterns. Tools SHOULD leverage existing infrastructure (continuity, concurrency, lifecycle).
403: 
404: ### Integration Points
405: 
406: | Integration | Description | Requirement |
407: |-------------|-------------|-------------|
408: | **CQRS Boundaries** | Tools are write-side; hooks are read-side | Tools MAY mutate state; hooks MUST NOT |
409: | **Agent Hierarchy** | Tools respect front-facing vs. subagent boundaries | Tools document which agent types should use them |
410: | **State Management** | Tools use continuity.ts for persistence | Tools write to `.hivemind/state/` (Q6 canonical) |
411: | **Concurrency** | Tools use keyed semaphore for concurrent access | Tools document concurrency model |
412: | **Lifecycle** | Tools participate in session lifecycle | Tools document lifecycle hooks they use |
413: 
414: ### Success Metrics
415: 
416: | Metric | Target | Validation Method |
417: |--------|--------|-------------------|
418: | **CQRS compliance** | Tools don't violate write-side boundary | Code review: check for hook-side mutations |
419: | **State root compliance** | Tools write to `.hivemind/state/` | Code review: check file paths |
420: | **Concurrency safety** | Tools handle concurrent access correctly | Stress test: concurrent invocations |
421: | **Lifecycle participation** | Tools document lifecycle hooks | Review tool documentation |
422: 
423: ### Guidelines
424: 
425: 1. **Respect CQRS boundaries.** Tools are the only write-side mutation surface.
426: 2. **Use canonical state paths.** Write to `.hivemind/state/`, not `.opencode/state/`.
427: 3. **Leverage existing infrastructure.** Use `continuity.ts` for persistence, `concurrency.ts` for queuing.
428: 4. **Document integration points.** State which hooks, lifecycle events, and state modules the tool uses.
429: 
430: ### Anti-Patterns
431: 
432: | Anti-Pattern | Why It's Wrong | Correct Approach |
433: |--------------|----------------|------------------|
434: | **CQRS violations** | Hooks writing state breaks architecture | Tools write, hooks read |
435: | **Wrong state paths** | Writing to `.opencode/state/` (legacy) | Use `.hivemind/state/` (Q6 canonical) |
436: | **Duplicated infrastructure** | Tool reimplements persistence or concurrency | Use existing `continuity.ts`, `concurrency.ts` |
437: | **Undocumented integration** | Agent doesn't know tool's ecosystem dependencies | Document all integration points |
438: 
439: ---
440: 
441: ## 11. Criterion 10: Justified Existence
442: 
443: ### Standard
444: 
445: Custom tools MUST outperform innate/MCP tools to justify existence. A custom tool MUST provide clear value over using built-in tools or MCP servers. If a built-in tool or MCP server can do the job, don't create a custom tool.
446: 
447: ### Justification Criteria
448: 
449: | Criterion | Description | Example |
450: |-----------|-------------|---------|
451: | **Domain specificity** | Tool handles domain-specific logic that built-ins can't | `delegate-task` handles WaiterModel delegation (not in built-ins) |
452: | **State integration** | Tool integrates with harness state management | `delegation-status` reads from continuity store |
453: | **Pipeline integration** | Tool participates in tool pipelines | `prompt-skim` → `prompt-analyze` → `session-patch` |
454: | **Performance** | Tool is faster than equivalent built-in/MCP approach | Direct function call vs. external process |
455: | **Security** | Tool enforces harness-specific security rules | `validate-restart` checks primitive discoverability |
456: 
457: ### Success Metrics
458: 
459: | Metric | Target | Validation Method |
460: |--------|--------|-------------------|
461: | **Value justification** | Every custom tool has documented justification | Review tool documentation |
462: | **No built-in alternative** | No custom tool duplicates built-in functionality | Compare against OpenCode built-in tool list |
463: | **No MCP alternative** | No custom tool duplicates MCP server functionality | Compare against available MCP servers |
464: | **Performance parity** | Custom tool performs as well as or better than alternatives | Benchmark: custom vs. built-in/MCP |
465: 
466: ### Guidelines
467: 
468: 1. **Document why this tool exists.** "This tool exists because [built-in/MCP] cannot [specific capability]."
469: 2. **Check built-ins first.** OpenCode provides `read`, `write`, `bash`, `glob`, `grep`, `edit`, `todowrite`, `skill`.
470: 3. **Check MCP servers second.** MCP servers may provide the functionality you need.
471: 4. **Only create custom tools for harness-specific logic.** Delegation, state management, lifecycle integration.
472: 
473: ### Anti-Patterns
474: 
475: | Anti-Pattern | Why It's Wrong | Correct Approach |
476: |--------------|----------------|------------------|
477: | **Reimplementing built-ins** | Wasted effort, maintenance burden | Use built-in tools |
478: | **MCP duplication** | Custom tool does what MCP server already does | Use MCP server |
479: | **No justification** | Tool exists without clear value proposition | Document why tool exists |
480: | **Over-engineering** | Simple task gets complex custom tool | Use built-in tools for simple tasks |
481: 
482: ---
483: 
484: ## 12. Validation Checklist
485: 
486: Use this checklist to audit existing tools or validate new tool designs.
487: 
488: ### Pre-Development Checklist
489: 
490: - [ ] **Classification:** Tool classified into one of 8 categories (C1-C8)
491: - [ ] **Justification:** Documented why built-in/MCP tools are insufficient
492: - [ ] **Naming:** Tool name follows `<category-prefix>-<action>-<object>` convention
493: - [ ] **Scope:** Tool has single, clear purpose
494: - [ ] **Conflicts:** No name or behavior conflicts with existing tools
495: 
496: ### Design Checklist
497: 
498: - [ ] **Discoverability:** Description answers what, when, and what-it-returns
499: - [ ] **Behavior Model:** Documented as deterministic, condition-based, event-driven, or state-mutating
500: - [ ] **Schema:** All args have Zod schemas with `.describe()`
501: - [ ] **Defaults:** Optional fields have sensible defaults
502: - [ ] **Required Args:** ≤3 required arguments
503: - [ ] **Response Envelope:** Returns `ToolResponse<T>` for all outcomes
504: - [ ] **Composition:** Supports pipeline chaining or action routing
505: 
506: ### Implementation Checklist
507: 
508: - [ ] **Boundary Validation:** Input validated at tool entry with Zod `.parse()`
509: - [ ] **Error Handling:** All error paths return structured `ToolResponse` errors
510: - [ ] **CQRS Compliance:** Tool respects write-side boundary
511: - [ ] **State Compliance:** Writes to `.hivemind/state/` (Q6 canonical)
512: - [ ] **Concurrency Safety:** Handles concurrent access correctly
513: - [ ] **LOC Compliance:** ≤200 LOC per tool file (excluding tests)
514: - [ ] **No `any` Types:** TypeScript strict mode compliance
515: 
516: ### Documentation Checklist
517: 
518: - [ ] **Purpose:** One-sentence purpose statement
519: - [ ] **Behavior Model:** Documented behavior classification
520: - [ ] **Side Effects:** All state mutations documented
521: - [ ] **Integration Points:** Hooks, lifecycle events, state modules documented
522: - [ ] **Usage Examples:** Common invocation patterns documented
523: - [ ] **Error Cases:** Error conditions and responses documented
524: 
525: ### Post-Implementation Checklist
526: 
527: - [ ] **Unit Tests:** All code paths tested
528: - [ ] **Integration Tests:** Tool works in pipeline with other tools
529: - [ ] **Agent Test:** Agent can discover and use tool correctly
530: - [ ] **Performance:** Tool performs within acceptable limits
531: - [ ] **Documentation:** All documentation checklist items complete
532: 
533: ---
534: 
535: ## 13. References
536: 
537: ### On-Disk References
538: 
539: | Reference | Location | Purpose |
540: |-----------|----------|---------|
541: | Architecture | `.planning/codebase/ARCHITECTURE.md` | Project architecture overview |
542: | Session Context | `.hivemind/state/session-context-prompt.md` | Workflow state |
543: | Agent Hierarchy | `AGENTS.md` | Project rules and agent hierarchy |
544: | Tool Response | `src/shared/tool-response.ts` | Standard response envelope |
545: | Tool Implementations | `src/tools/` | Existing tool code |
546: 
547: ### External References
548: 
549: | Reference | URL | Purpose |
550: |-----------|-----|---------|
551: | OpenCode Custom Tools | https://opencode.ai/docs/custom-tools | Platform tool creation guide |
552: | OpenCode Plugins | https://opencode.ai/docs/plugins/ | Plugin system documentation |
553: | Zod Documentation | https://zod.dev/ | Schema validation library |
554: | OpenCode SDK | https://opencode.ai/docs/sdk | SDK documentation |
555: 
556: ### Architectural Decisions
557: 
558: | Decision | Description | Impact on Tools |
559: |----------|-------------|-----------------|
560: | **Q1** | Hybrid + Spec-Driven Automated Runtime Detection | Tools may integrate with runtime detection |
561: | **Q3** | Session Journal as Complement + Time-Machine | Tools should participate in journaling |
562: | **Q6** | `.hivemind/` is internal state root | Tools MUST write to `.hivemind/state/` |
563: 
564: ---
565: 
566: ## Appendix A: Tool Template
567: 
568: ```typescript
569: import { tool } from "@opencode-ai/plugin"
570: import { z } from "zod"
571: import { success, error, type ToolResponse } from "../shared/tool-response"
572: 
573: /**
574:  * [Tool Name] — [One-sentence purpose]
575:  *
576:  * @category [C1-C8]
577:  * @behavior [deterministic | condition-based | event-driven | state-mutating]
578:  * @lineage [hm-* | hf-* | gate-* | shared]
579:  * @side-effects [None | Lists all state mutations]
580:  */
581: export default tool({
582:   description: [
583:     "[What this tool does]",
584:     "[When to use this tool]",
585:     "[What it returns]",
586:     "[Side effects, if any]",
587:   ].join("\n"),
588: 
589:   args: {
590:     requiredArg: tool.schema
591:       .string()
592:       .describe("[Purpose, format, constraints]"),
593: 
594:     optionalArg: tool.schema
595:       .number()
596:       .optional()
597:       .default(100)
598:       .describe("[Purpose, format, default value]"),
599: 
600:     action: tool.schema
601:       .enum(["create", "get", "update", "delete"])
602:       .describe("[Action to perform]"),
603:   },
604: 
605:   async execute(args, context): Promise<ToolResponse> {
606:     // 1. Validate input at boundary
607:     // 2. Execute business logic
608:     // 3. Return ToolResponse
609:     return success("Operation completed", { result: "..." })
610:   },
611: })
612: ```
613: 
614: ---
615: 
616: ## Appendix B: Category-to-Tool Mapping (Existing Tools)
617: 
618: | Tool | Category | Behavior Model | Lineage |
619: |------|----------|----------------|---------|
620: | `delegate-task` | C1: Task Management | Event-driven | hm-* |
621: | `delegation-status` | C1: Task Management | Condition-based | hm-* |
622: | `run-background-command` | C1: Task Management | Event-driven | hm-* |
623: | `prompt-skim` | C3: Inspection | Deterministic | hm-* |
624: | `prompt-analyze` | C3: Inspection | Deterministic | hm-* |
625: | `session-patch` | C2: Governance | State-mutating | hm-* |
626: | `session-journal-export` | C5: Planning | Deterministic | hm-* |
627: | `configure-primitive` | C2: Governance | State-mutating | hf-* |
628: | `validate-restart` | C6: Quality | Deterministic | hf-* |
629: | `hivemind-doc` | C3: Inspection | Deterministic | hm-* |
630: | `hivemind-trajectory` | C5: Planning | Condition-based | hm-* |
631: | `hivemind-pressure` | C6: Quality | Condition-based | hm-* |
632: | `hivemind-sdk-supervisor` | C6: Quality | Condition-based | hm-* |
633: | `hivemind-command-engine` | C1: Task Management | Event-driven | hm-* |
634: | `hivemind-agent-work-create` | C1: Task Management | Event-driven | hm-* |
635: | `hivemind-agent-work-export` | C5: Planning | Deterministic | hm-* |
636: 
637: ---
638: 
639: *Document generated: 2026-05-05 by hf-l2-prompter*
640: *Next review: When new tools are added or existing tools are refactored*

(End of file - total 640 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md</path>
<type>file</type>
<content>
1: # CP-ST-01: Session Tracker Revamp — Formal Specification
2: 
3: **Date:** 2026-05-11
4: **Status:** SPEC-LOCKED
5: **Supersedes:** `.hivemind/planning/cp-st-session-tracker-2026-05-10/SPEC.md` (draft baseline)
6: **Depends on:** WS-SR (COMPLETE), Flaw Register (`.hivemind/audit/flaw-register-2026-05-10.json`)
7: **Architecture refs:** `.planning/codebase/ARCHITECTURE.md`, Q1-Q6 decisions
8: 
9: ---
10: 
11: ## 1. Problem Statement
12: 
13: The current event tracker (`src/task-management/journal/event-tracker/`) produces broken, noisy output with 12 documented flaws (F1-F12). It cross-contaminates session files, never populates semantic fields, contains dead code (classifier, dual-persistence), never executed the Q6 migration, and is gated by a `commit_docs` toggle. The session tracker revamp replaces this with a clean, structured, hook-driven capture system that produces hierarchical, searchable, agent-reconsumable session knowledge files.
14: 
15: ### Source Evidence
16: - Flaw register: `.hivemind/audit/flaw-register-2026-05-10.json` (12 flaws with file:line evidence)
17: - State audit: `.hivemind/audit/state-persistence-audit-2026-05-10.md`
18: - Reference export: `session-ses_1ed9.md` (7321 lines showing expected capture format)
19: - User spec: `.hivemind/planning/debug/sessions/session-continuity-event-tracker-journal-2026-05-10.md`
20: 
21: ---
22: 
23: ## 2. Scope
24: 
25: ### In Scope
26: - New session tracker module under `src/features/session-tracker/` (owning typed module)
27: - Hook integration via existing `createCoreHooks()` observer pipeline
28: - File structure: `.hivemind/session-tracker/{main-session-id}/` with MD + JSON outputs
29: - Project-level index: `.hivemind/session-tracker/project-continuity.json` (cross-session connections)
30: - Session-local index: `.hivemind/session-tracker/{main-session-id}/session-continuity.json` (parent-child hierarchy within session)
31: - Recovery/reconsumption via OpenCode SDK REST API (`client.session.*`)
32: - Up to 3 levels of delegation depth, up to 6 concurrent sessions
33: - Conservative cleanup of contaminated `.hivemind/event-tracker/` state files
34: 
35: ### Out of Scope
36: - Sidecar dashboard integration (Q2, separate project)
37: - SSE-based real-time streaming (plugin receives events directly via hooks)
38: - Changes to delegation manager, concurrency queue, or completion detector
39: - Changes to `.opencode/` primitives
40: - Removal of old event-tracker module code (kept as safety net)
41: 
42: ---
43: 
44: ## 3. Architecture Decision: Hybrid Hooks + REST Recovery
45: 
46: ### Data Collection Strategy
47: 
48: | Mechanism | Role | When Used |
49: |-----------|------|-----------|
50: | **Plugin hooks** (primary) | Real-time event capture | `event`, `chat.message`, `tool.execute.after` fire as events happen |
51: | **REST API** (recovery) | Reconsumption after disconnection | `client.session.get()`, `client.session.messages()`, `client.session.children()` |
52: | **SSE** (not used) | — | Plugin runs inside runtime; receives events directly, not via HTTP |
53: 
54: ### Rationale
55: The harness plugin runs INSIDE the OpenCode runtime. It receives events directly through hooks, not through SSE (which is for external clients). Hooks provide zero-latency capture. REST API provides reconsumption when agents disconnect and need to rebuild context from persisted tracker files.
56: 
57: ### Hook Mapping
58: 
59: | Hook | SDK Signature | Captures | Persistence Target |
60: |------|--------------|----------|-------------------|
61: | `event` | `hook("event", { eventType, sessionID, event })` | Session lifecycle: created, updated, idle, deleted, error, status, compacted | Main session .md frontmatter updates |
62: | `chat.message` | `hook("chat.message", { sessionID, agent?, model?, messageID?, variant? }) => { message, parts }` | User prompts (##USER), assistant metadata (agent name, model, duration), message parts | Main session .md content sections |
63: | `tool.execute.after` | `hook("tool.execute.after", { tool, sessionID, callID, args }) => { title, output, metadata }` | Tool metadata: skill names, read paths, task delegations, tool errors | Main session .md tool blocks + child session spawn |
64: 
65: ---
66: 
67: ## 4. Target Directory Structure
68: 
69: ```
70: .hivemind/
71: ├── session-tracker/                              # NEW root
72: │   ├── project-continuity.json                    # Cross-session index (connects ALL main sessions)
73: │   └── ses_1ed9df1adffe2hbJudz3sK60y3/           # One subdir per main session
74: │       ├── ses_1ed9df1adffe2hbJudz3sK60y3.md     # Primary knowledge capture (YAML + MD)
75: │       ├── ses_1ed9c5c20ffePWOXce5JQpS5Yk.json   # Child session (delegation level 1)
76: │       ├── ses_1ed9bffbcffesN10Er8Pd91tW7.json   # Child session (delegation level 1)
77: │       └── session-continuity.json                # Session-local index (hierarchy within THIS session)
78: ├── state/
79: │   ├── session-continuity.json                    # EXISTING — harness delegation state
80: │   └── delegations.json                           # EXISTING — delegation records
81: └── event-tracker/                                 # LEGACY — kept as safety net, state files cleaned
82: ```
83: 
84: **Key rule:** Subdirectories are created ONLY when a user starts a new main session (not before). Child session files are written under the parent's subdir. The `session-continuity.json` lives INSIDE each session subdir (not at the top level). The top-level `project-continuity.json` connects all main sessions across the project.
85: 
86: ---
87: 
88: ## 5. File Format Specifications
89: 
90: ### 5.1 Main Session File (`.md` with YAML frontmatter)
91: 
92: ```yaml
93: ---
94: session_id: "ses_1ed9df1adffe2hbJudz3sK60y3"
95: created: "2026-05-10T21:54:36Z"
96: updated: "2026-05-10T22:08:04Z"
97: parent_session_id: null                    # null for root sessions
98: delegation_depth: 0                        # 0 = root, 1 = child, 2 = grandchild
99: children:
100:   - session_id: "ses_1ed9c5c20ffePWOXce5JQpS5Yk"
101:     child_file: "ses_1ed9c5c20ffePWOXce5JQpS5Yk.json"
102:   - session_id: "ses_1ed9bffbcffesN10Er8Pd91tW7"
103:     child_file: "ses_1ed9bffbcffesN10Er8Pd91tW7.json"
104: continuity_index: "session-continuity.json"
105: status: "active"                           # active | idle | completed | error
106: ---
107: 
108: ## USER (turn 1)
109: 
110: Map source architecture for state modules (@hm-l2-architect subagent)...
111: 
112: ## main_l0_agent
113: 
114: **name:** Hm-L0-Orchestrator
115: **model:** DeepSeek V4 Pro
116: **thinking_duration:** 19.7s
117: 
118: ### Tool: skill
119: 
120: **Input:**
121: ```json
122: { "name": "hm-l2-coordinating-loop" }
123: ```
124: 
125: **Output:** (pruned — first line only)
126: ```
127: # Skill: hm-l2-coordinating-loop
128: ```
129: 
130: ### Tool: read
131: 
132: **Input:**
133: ```json
134: { "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/session-continuity.json" }
135: ```
136: 
137: **Error:** File not found
138: 
139: ### Tool: read
140: 
141: **Input:**
142: ```json
143: { "filePath": "/Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json" }
144: ```
145: 
146: **Output:** (success — path only)
147: ```
148: /Users/apple/hivemind-plugin-private/.hivemind/state/delegations.json
149: ```
150: 
151: ### Tool: task
152: 
153: **Input:**
154: ```json
155: { "description": "Investigate event tracker bugs", "subagent_type": "hm-l2-investigator" }
156: ```
157: 
158: **Output:**
159: ```
160: task_id: ses_1ed9c5c20ffePWOXce5JQpS5Yk
161: ```
162: 
163: ## USER (turn 2)
164: 
165: Continue if you have next steps...
166: ```
167: 
168: ### Capture Rules
169: | Element | Capture | Skip |
170: |---------|---------|------|
171: | User message (`##USER`) | Full text, turn counter | — |
172: | Assistant block | Transform to `main_l0_agent` with name, model, thinking_duration | Thinking blocks |
173: | Tool: skill | Input `{name}`, first line of output only | Full skill content |
174: | Tool: read | Input `{filePath}`, error if any | File content on success |
175: | Tool: task | Input `{description, subagent_type}`, output `task_id` | Full delegation prompt |
176: | Other tools | Input metadata only | Verbose output |
177: 
178: ### 5.2 Child Session File (`.json`)
179: 
180: ```json
181: {
182:   "session_id": "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
183:   "parent_session_id": "ses_1ed9df1adffe2hbJudz3sK60y3",
184:   "delegation_depth": 1,
185:   "delegated_by": {
186:     "agent_name": "Hm-L0-Orchestrator",
187:     "tool": "task",
188:     "description": "Investigate event tracker bugs",
189:     "subagent_type": "hm-l2-investigator"
190:   },
191:   "created": "2026-05-10T21:56:44Z",
192:   "updated": "2026-05-10T22:04:47Z",
193:   "status": "completed",
194:   "main_agent": {
195:     "name": "Hm-L2-Investigator",
196:     "model": "DeepSeek V4 Pro"
197:   },
198:   "turns": [
199:     {
200:       "turn": 1,

(Showing lines 1-200 of 538. Use offset=201 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md</path>
<type>file</type>
<content>
1: ---
2: phase: CP-ST-01-session-tracker-revamp
3: reviewed: 2026-05-11T00:00:00Z
4: depth: standard
5: files_reviewed: 16
6: files_reviewed_list:
7:   - src/features/session-tracker/index.ts
8:   - src/features/session-tracker/types.ts
9:   - src/features/session-tracker/persistence/atomic-write.ts
10:   - src/features/session-tracker/persistence/session-writer.ts
11:   - src/features/session-tracker/persistence/child-writer.ts
12:   - src/features/session-tracker/persistence/session-index-writer.ts
13:   - src/features/session-tracker/persistence/project-index-writer.ts
14:   - src/features/session-tracker/capture/event-capture.ts
15:   - src/features/session-tracker/capture/message-capture.ts
16:   - src/features/session-tracker/capture/tool-capture.ts
17:   - src/features/session-tracker/transform/agent-transform.ts
18:   - src/features/session-tracker/transform/schema-normalizer.ts
19:   - src/features/session-tracker/recovery/session-recovery.ts
20:   - src/plugin.ts
21:   - src/schema-kernel/session-tracker.schema.ts
22:   - src/tools/hivemind/session-tracker.ts
23: findings:
24:   critical: 3
25:   warning: 6
26:   info: 5
27:   total: 14
28: status: issues_found
29: ---
30: 
31: # Phase CP-ST-01: Code Review Report
32: 
33: **Reviewed:** 2026-05-11
34: **Depth:** standard
35: **Files Reviewed:** 16
36: **Status:** issues_found — 3 critical, 6 warning, 5 info (14 total)
37: 
38: ## Summary
39: 
40: Review of the Session Tracker Revamp (CP-ST-01) covering 16 source files across 1,795 total lines. The architecture is sound — CQRS-compliant hook-to-persistence pipeline with dependency injection and atomic writes. However, three critical path-traversal vulnerabilities were found where session IDs from untrusted sources (tool input, session recovery) are used to construct filesystem paths without the `safeSessionPath` sanitization used everywhere else. Additionally, the `handleRead` method has a heuristic-based error detection that can inadvertently capture full file content, violating REQ-ST-05. Six warnings cover data integrity (race conditions in frontmatter updates, unbounded childCount overwrites) and code robustness (missing cleanup hook, in-memory turn counter reset on restart).
41: 
42: ---
43: 
44: ## Critical Issues
45: 
46: ### CR-01: Path Traversal in `readSessionFile` — Recovery Module
47: 
48: **File:** `src/features/session-tracker/recovery/session-recovery.ts:264-268`
49: **Issue:** `readSessionFile()` constructs the file path using raw `resolve(trackerRoot, sessionID, ...)` with no validation or sanitization of `sessionID`. Unlike every other path-construction path in the persistence layer (which routes through `safeSessionPath` in `atomic-write.ts`), this recovery path bypasses all traversal detection and sanitization. A crafted or malformed `sessionID` (e.g., `../../../etc/passwd`) would escape the `.hivemind/session-tracker/` root.
50: 
51: **Fix:** Replace the raw `resolve` call with `safeSessionPath`:
52: 
53: ```typescript
54: private async readSessionFile(sessionID: string): Promise<string | null> {
55:   try {
56:     const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
57:     const content = await readFile(filePath, "utf-8")
58:     return content
59:   } catch {
60:     return null
61:   }
62: }
63: ```
64: 
65: Also add the import: `import { safeSessionPath } from "../persistence/atomic-write.js"` and adjust return since `safeSessionPath` throws on invalid IDs — the `try/catch` already handles this.
66: 
67: ---
68: 
69: ### CR-02: Path Traversal in Session-Tracker Tool — `handleExportSession`
70: 
71: **File:** `src/tools/hivemind/session-tracker.ts:107-108`
72: **Issue:** `handleExportSession()` constructs `filePath` via `resolve(trackerRoot, input.sessionId, ...)` with no validation or sanitization of `input.sessionId`. This value comes directly from agent input via Zod schema validation, but Zod only validates that `sessionId` is an optional string — it does not validate it as a safe path component or session ID. An agent (or malicious prompt) could supply `../../` sequences to read arbitrary files outside the tracker root.
73: 
74: The same pattern also exists in `handleSearchSessions` (line 196: `resolve(trackerRoot, sessionId, \`${sessionId}.md\`)`) though that case reads directory entries first and filters by `startsWith("ses_")`, providing partial protection.
75: 
76: **Fix:** Apply the same `safeSessionPath` defense used throughout the persistence layer, or validate with `isValidSessionID` + sanitize:
77: 
78: ```typescript
79: async function handleExportSession(
80:   projectRoot: string,
81:   input: SessionTrackerInput,
82: ): Promise<string> {
83:   if (!input.sessionId) {
84:     return renderToolResult(error("sessionId is required for export-session action"))
85:   }
86:   if (!isValidSessionID(input.sessionId)) {
87:     return renderToolResult(error(`Invalid session ID: ${input.sessionId}`))
88:   }
89:   // Use safeSessionPath for defense-in-depth
90:   const filePath = safeSessionPath(projectRoot, input.sessionId, `${input.sessionId}.md`)
91:   // ... rest of handler
92: }
93: ```
94: 
95: Requires importing: `import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"` and `import { isValidSessionID } from "../../features/session-tracker/types.js"`.
96: 
97: ---
98: 
99: ### CR-03: REQ-ST-05 Violation — `handleRead` Can Leak File Content
100: 
101: **File:** `src/features/session-tracker/capture/tool-capture.ts:170-187`
102: **Issue:** REQ-ST-05 explicitly states: "SessionTracker SHALL capture only the file path for Read tool calls — NEVER the file content." The `handleRead` method checks if the output string contains the words `"error"` or `"not found"` and, if found, writes the **entire output string** (which is the file content) into the session `.md` file as the error parameter to `appendToolBlock`. Since any legitimate file can contain the word "error" naturally (e.g., source code: `if (err)`, documentation: "Error handling", etc.), this heuristic frequently classifies normal file reads as errors and writes their full content into the capture file.
103: 
104: **Fix:** Instead of substring-matching on the output content, check the tool output's structure for an error indicator (e.g., output type or status field from the hook), or reverse the logic: only capture output when the hook explicitly reports an error, not when the content happens to contain certain words:
105: 
106: ```typescript
107: private async handleRead(
108:   input: ToolInput,
109:   output: ToolOutput,
110: ): Promise<void> {
111:   const args = (input.args || {}) as Record<string, unknown>
112:   const filePath = args.filePath as string | undefined
113: 
114:   // Only capture output if the hook output indicates a read error (e.g., file not found).
115:   // Do NOT inspect the file content for error keywords — that violates REQ-ST-05.
116:   const metadata = output.metadata as Record<string, unknown> | undefined
117:   const isError = metadata?.error !== undefined || metadata?.status === "error"
118: 
119:   await this.sessionWriter.appendToolBlock(
120:     input.sessionID,
121:     "read",
122:     { filePath },
123:     undefined,
124:     isError ? "File read failed" : undefined, // Do NOT include file content
125:   )
126: }
127: ```
128: 
129: ---
130: 
131: ## Warnings
132: 
133: ### WR-01: `childCount: undefined` Can Corrupt Project Index Entry
134: 
135: **File:** `src/tools/hivemind/session-tracker.ts` → `src/features/session-tracker/capture/tool-capture.ts:251-253`
136: **Issue:** `handleTask` calls `this.projectIndexWriter.updateSession(input.sessionID, { childCount: undefined })` with an explicit `undefined` value. In `project-index-writer.ts:166-172`, the `updateSession` method spreads `...updates` over the existing entry. In JavaScript, spreading `{ childCount: undefined }` **overwrites** the existing `childCount` with `undefined`. This means every time a task tool fires and creates a child, the parent session's `childCount` in the project index gets reset to `undefined`.
137: 
138: **Fix:** Do not pass `undefined` for unchanged fields. Either omit `childCount` entirely from the update call or compute the correct incremental value:
139: 
140: ```typescript
141: // Option A: Omit childCount — let it remain unchanged
142: await this.projectIndexWriter.updateSession(input.sessionID, {})
143: 
144: // Option B: Read current count and increment (requires index read access)
145: await this.projectIndexWriter.updateSession(input.sessionID, {
146:   childCount: (existingCount ?? 0) + 1,
147: })
148: ```
149: 
150: ---

(Showing lines 1-150 of 309. Use offset=151 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/index.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/index.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session Tracker feature module.
3:  *
4:  * Owns session knowledge capture under `.hivemind/session-tracker/`.
5:  * Hooks observe OpenCode lifecycle events and route to this module;
6:  * the module owns persistence logic and error handling.
7:  *
8:  * Architecture: Read-side observer (hooks) → SessionTracker → persistence layer.
9:  * CQRS compliance: hooks must NEVER write files directly (REQ-ST-11).
10:  *
11:  * @module session-tracker
12:  */
13: 
14: // Barrel re-exports — types
15: export type {
16:   SessionTrackerConfig,
17:   SessionRecord,
18:   ChildSessionRecord,
19:   SessionContinuityIndex,
20:   ProjectContinuityIndex,
21:   ProjectSessionEntry,
22:   DelegatedBy,
23:   MainAgent,
24:   Turn,
25:   ToolRecord,
26:   ChildRef,
27:   ChildHierarchyEntry,
28: } from "./types.js"
29: 
30: export { isValidSessionID, isValidHookPayload } from "./types.js"
31: export { SessionRecovery } from "./recovery/session-recovery.js"
32: export type { ReconsumptionResult, SessionContext } from "./recovery/session-recovery.js"
33: 
34: // ---------------------------------------------------------------------------
35: // SessionTracker class
36: // ---------------------------------------------------------------------------
37: 
38: // NOTE: OpenCodeClient type is imported from shared/session-api.
39: // We use a lightweight import to avoid circular dependencies.
40: import type { OpenCodeClient } from "../../shared/session-api.js"
41: import { EventCapture } from "./capture/event-capture.js"
42: import { MessageCapture } from "./capture/message-capture.js"
43: import { ToolCapture } from "./capture/tool-capture.js"
44: import { SessionWriter } from "./persistence/session-writer.js"
45: import { ChildWriter } from "./persistence/child-writer.js"
46: import { SessionIndexWriter } from "./persistence/session-index-writer.js"
47: import { ProjectIndexWriter } from "./persistence/project-index-writer.js"
48: import { AgentTransform } from "./transform/agent-transform.js"
49: import { SessionRecovery } from "./recovery/session-recovery.js"
50: import { isValidSessionID } from "./types.js"
51: 
52: /**
53:  * Central session tracker class.
54:  *
55:  * Instantiated in plugin.ts with dependency injection:
56:  * ```typescript
57:  * const tracker = new SessionTracker({ client, projectRoot })
58:  * ```
59:  *
60:  * Hook callbacks call the public handler methods:
61:  * - `handleSessionEvent()` — session.created, session.idle, session.deleted, session.error
62:  * - `handleChatMessage()` — user/assistant message capture
63:  * - `handleToolExecuteAfter()` — tool metadata capture (skill, read, task, etc.)
64:  *
65:  * All handler methods are best-effort: they catch errors internally and
66:  * never throw to the OpenCode runtime.
67:  */
68: export class SessionTracker {
69:   private client: OpenCodeClient
70:   private projectRoot: string
71: 
72:   // Capture handlers — initialized in initialize()
73:   private eventCapture!: EventCapture
74:   private messageCapture!: MessageCapture
75:   private toolCapture!: ToolCapture
76: 
77:   // Persistence writers
78:   private sessionWriter!: SessionWriter
79:   private childWriter!: ChildWriter
80:   private sessionIndexWriter!: SessionIndexWriter
81:   private projectIndexWriter!: ProjectIndexWriter
82: 
83:   // Recovery
84:   private recovery!: SessionRecovery
85: 
86:   // Transform
87:   private agentTransform!: AgentTransform
88: 
89:   /**
90:    * Tracks sessions that have been lazy-bootstrapped (dir + .md file created).
91:    * Avoids redundant work on subsequent events for the same session.
92:    */
93:   private bootstrappedSessions: Set<string> = new Set()
94: 
95:   /**
96:    * Creates a new SessionTracker instance.
97:    *
98:    * @param deps - Injected dependencies.
99:    * @param deps.client - The OpenCode SDK client for session queries.
100:    * @param deps.projectRoot - Absolute path to the project root.
101:    */
102:   constructor(deps: { client: OpenCodeClient; projectRoot: string }) {
103:     this.client = deps.client
104:     this.projectRoot = deps.projectRoot
105:   }
106: 
107:   /**
108:    * Lazy-bootstraps a session that was created before the harness loaded.
109:    *
110:    * When the plugin loads into an already-running session, `session.created`
111:    * has already fired without us. This method creates the session directory,
112:    * initializes the `.md` file, and registers the session in the project index
113:    * on the first observed event (chat message or tool execution).
114:    *
115:    * Idempotent — skips if the session has already been bootstrapped.
116:    *
117:    * @param sessionID - The session identifier to bootstrap.
118:    * @returns Promise that resolves when bootstrap is complete.
119:    */
120:   private async ensureSessionReady(sessionID: string): Promise<void> {

(Showing lines 1-120 of 403. Use offset=121 to continue.)
</content>

<system-reminder>
Instructions from: /Users/apple/hivemind-plugin-private/src/features/session-tracker/AGENTS.md
# Session Tracker Feature Guidance

**Parent sector:** `src/features/AGENTS.md` | **Architecture:** `.planning/codebase/ARCHITECTURE.md` | **Classification:** Hard Harness — runtime-feature (read-side: session knowledge capture)

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/session-tracker/` owns session knowledge capture under `.hivemind/session-tracker/`. It replaces the broken event tracker (`src/task-management/journal/event-tracker/`) with a clean, structured, hook-driven capture system. Source evidence: `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md`.

## 2. Allowed mutation authority

- SessionTracker may write session knowledge files to `.hivemind/session-tracker/` exclusively.
- SessionTracker may read `.hivemind/session-tracker/` files for recovery purposes.
- All writes use atomic rename pattern (D-03): write-to-tmp → `fs.rename()`.

## 3. Forbidden mutations / explicit no-go boundaries

- SessionTracker SHALL NOT write to `.hivemind/event-tracker/` or any legacy paths.
- SessionTracker SHALL NOT store runtime state in `.opencode/`. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- SessionTracker SHALL NOT exceed the 500 LOC module cap. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.
- SessionTracker SHALL NOT write files directly from hook callbacks (CQRS compliance per REQ-ST-11).

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/hooks/` | Routes OpenCode lifecycle events to SessionTracker methods | Hooks observe; module owns persistence |
| `src/plugin.ts` | Instantiates SessionTracker, passes to hooks via deps injection | One instantiation line only |
| Agents (recovery) | Rebuild context from persisted .md/.json files after disconnection | Read-only consumption |
| Tests | Validate type safety, persistence correctness, and boundary compliance | Unit tests in `tests/features/session-tracker/` |

## 5. Naming and placement conventions

- Modules use `kebab-case.ts` in `src/features/session-tracker/`.
- Barrel export at `index.ts`.
- Types in `types.ts`.
- Persistence layer in `persistence/` subdirectory.
- Tests mirror under `tests/features/session-tracker/`.
- All field names use camelCase per REQ-ST-12.
- All writes target `.hivemind/session-tracker/` root — never elsewhere.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/features/session-tracker/`.
- Write safety requires atomic rename verification (interrupt-then-restart test).
- Path safety requires traversal rejection validation.
- Docs-only edits remain L5 evidence. Source evidence: `.planning/ROADMAP.md:47-49`.

## 7. Architecture compliance

- CQRS boundary: Hooks MUST NOT directly write to `.hivemind/`. Hook effects route through this module.
- 9-surface authority: `src/features/session-tracker/` owns typed capture logic; `.hivemind/session-tracker/` owns persisted state.
- Deps injection: SessionTracker receives `{ client, projectRoot }` via constructor (matches DelegationManager pattern).


Instructions from: /Users/apple/hivemind-plugin-private/src/features/AGENTS.md
# Features Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/features/` owns standalone runtime feature modules that are neither routing, config, coordination, task-management, nor shared leaf utilities. Features include bootstrap (primitive loading and framework detection), background-command (PTY/headless execution), doc-intelligence (markdown parsing/chunking), prompt-packet (packet creation and compaction), runtime-pressure (pressure scoring and control-plane decisions), sdk-supervisor (read-only SDK diagnostics), and agent-work-contracts (durable contract creation/export). Source evidence: `.planning/codebase/ARCHITECTURE.md:136-183`, `.planning/codebase/STRUCTURE.md:110-112`. Source-plane classification: Hard Harness — runtime features belong to `src/` (not `.opencode/`). Each feature is a dedicated npm-package module; `.opencode/` Soft Meta-Concepts configure features from outside the package boundary.

## 2. Allowed mutation authority

- Feature modules may define and export typed public interfaces consumed by tools, hooks, and coordination modules.
- Features may perform internal state computation (pressure scoring, profile resolution, document parsing) without durable writes.
- Agent-work-contracts may write durable contract records through `.hivemind/` authority surfaces. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features follow factory injection patterns ADAPTED from OMO (`.planning/research/omo-adaptation-architecture-2026-05-07.md`): typed dependencies are injected at composition time, not hidden globals.

## 3. Forbidden mutations / explicit no-go boundaries

- Features SHALL NOT store runtime state in `.opencode/`; `.hivemind/` is the canonical state root. Source evidence: `.planning/codebase/ARCHITECTURE.md:247-255`.
- Features SHALL NOT become hidden tool implementations; tool entrypoints live in `src/tools/`.
- Features SHALL NOT bypass schema validation; contracts belong in `src/schema-kernel/`.
- Features SHALL NOT exceed the 500 LOC module cap or introduce circular imports. Source evidence: `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| `src/tools/` | Calls feature modules to perform runtime logic | Tools own CQRS mutation; features own computation |
| `src/hooks/` | Reads feature state for guard and observer decisions | Hooks must not mutate feature state directly |
| `src/plugin.ts` | Wires feature dependencies at composition time | Keeps assembly logic only |
| Tests | Validate feature behavior and public exports | Unit tests do not prove integration readiness |

## 5. Naming and placement conventions

- Each feature lives in its own subdirectory: `src/features/{feature-name}/index.ts`. Source evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Feature types belong in `{feature-name}/types.ts`; schemas belong in `src/schema-kernel/`.
- Empty reserved folders must use `.gitkeep`. Source evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript strict ESM with `.js` import extensions and `import type` for type-only imports. Source evidence: `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- Code changes require `npm run typecheck` and scoped `npx vitest run tests/...` evidence. Source evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence. Source evidence: `.planning/ROADMAP.md:47-49`.
- Docs-only edits remain L5 evidence and must not alter readiness status.


Instructions from: /Users/apple/hivemind-plugin-private/src/AGENTS.md
# Hard Harness Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`src/` is the Hard Harness npm package source for the OpenCode runtime composition engine: `src/plugin.ts` assembles dependencies, tools expose write-side commands, hooks observe read-side events, `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/` own runtime logic, `src/schema-kernel/` owns validation contracts, and `src/shared/` owns leaf tool utilities. Source evidence: `.planning/codebase/ARCHITECTURE.md:38-45`, `.planning/codebase/ARCHITECTURE.md:48-68`, `.planning/codebase/STRUCTURE.md:88-118`. Source-plane ownership model: `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — defines the split between Hard Harness (`src/`), Soft Meta-Concepts (`.opencode/`), and Internal State (`.hivemind/`).

## 2. Allowed mutation authority

- `src/plugin.ts` may wire runtime dependencies, instantiate hooks, register tools, and load runtime policy; keep business logic in `src/task-management/`, `src/coordination/`, `src/features/`, `src/config/`, `src/routing/`, tools, hooks, or schemas. Evidence: `.planning/codebase/ARCHITECTURE.md:48-50`, `.planning/codebase/ARCHITECTURE.md:70-82`.
- `src/tools/` owns write-side tool entrypoints and may call `src/task-management/`, `src/coordination/`, `src/features/`, `src/schema-kernel/`, and `src/shared/` to perform validated mutations. Evidence: `.planning/codebase/ARCHITECTURE.md:87-113`.
- `src/hooks/` owns read-side observers, response shaping, and guard decisions, subject to the CQRS hook boundary. Evidence: `.planning/codebase/ARCHITECTURE.md:115-134`, `.planning/codebase/ARCHITECTURE.md:339-353`.
- `src/task-management/` owns continuity, journal, event tracker, recovery, trajectory, and lifecycle modules.
- `src/coordination/` owns delegation, completion, concurrency, SDK/command delegation, and spawner modules.
- `src/features/` owns standalone runtime features: bootstrap, PTY/background command, doc intelligence, prompt packets, pressure, SDK supervisor, and work contracts.
- `src/config/` owns config subscriber, compiler, and workflow modules.
- `src/routing/` owns session entry, behavioral profile, and command engine modules.
Evidence: `.planning/codebase/ARCHITECTURE.md:136-183`.
- `src/schema-kernel/` owns Zod validation schemas; `src/shared/` owns leaf utility surfaces used by tools. Evidence: `.planning/codebase/ARCHITECTURE.md:188-200`.

## 3. Forbidden mutations / explicit no-go boundaries

- Do not store internal runtime state in `.opencode/`; `.hivemind/` is canonical state root. Evidence: `.planning/codebase/ARCHITECTURE.md:247-255`, `.planning/codebase/ARCHITECTURE.md:351-353`.
- Do not authorize hooks to perform durable writes; only tools have CQRS mutation authority. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`.
- Do not move business logic into `src/plugin.ts`; it is a thin composition root. Evidence: `.planning/codebase/ARCHITECTURE.md:70-82`.
- Do not create `src/plugin/`, `src/config/`, or broad `src/features/` folders without a separate, source-backed architecture decision. `src/config/` and `src/features/` are authorized by `.planning/architecture/sr-remediation-architecture-decision-2026-05-08.md`; `src/plugin.ts` remains the plugin authority and `src/plugin/` is still not authorized.
- Do not exceed the 500 LOC module cap or introduce circular imports. Evidence: `.planning/codebase/ARCHITECTURE.md:345-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| OpenCode runtime | Loads the plugin, tools, hooks, and SDK-facing wrappers | Must consume compiled/package entrypoints, not planning artifacts |
| Harness tools | Execute mutation commands through validated inputs | Must use schemas and shared response envelopes |
| Harness hooks | Observe events and shape/guard responses | Must not perform durable writes |
| Tests and gates | Verify runtime behavior, type safety, and integration boundaries | Docs-only changes remain L5 evidence |
| `.opencode/` primitives | Configure agents/commands/skills that call harness tools | Must not become internal state owners |

## 5. Naming and placement conventions

- TypeScript source files use `kebab-case.ts`; schemas use `kebab-case.schema.ts`; tests mirror source with `.test.ts`. Evidence: `.planning/codebase/STRUCTURE.md:186-195`.
- Tool implementations live in `src/tools/{tool-name}.ts` or `src/tools/{tool-name}/index.ts`; schemas live in `src/schema-kernel/{tool-name}.schema.ts`; tests live under `tests/`. Evidence: `.planning/codebase/STRUCTURE.md:218-261`.
- Empty reserved folders must be registered with `.gitkeep`; do not create unregistered broad folders. Evidence: `.planning/codebase/STRUCTURE.md:268-278`.
- TypeScript remains strict ESM with `.js` import extensions and `import type` for type-only imports. Evidence: `.planning/codebase/CONVENTIONS.md:5-18`, `.planning/codebase/CONVENTIONS.md:80-98`.

## 6. Quality gates and evidence expectations

- For runtime code changes, minimum local evidence is `npm run typecheck`, relevant `npx vitest run ...`, and `npm test` or scoped justification; docs-only changes may use diff/path inspection only. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Integration readiness cannot be claimed from unit tests or docs-only evidence; O3 docs artifacts are L5 until authorized runtime proof exists. Evidence: `.planning/ROADMAP.md:29-49`, `.planning/architecture/sector-agents-docs-implementation-plan-2026-05-07.md:1-8`.
- Completion claims must preserve CQRS, state-root, lineage, naming, and module-size constraints. Evidence: `.planning/codebase/ARCHITECTURE.md:339-353`, `.planning/codebase/CONVENTIONS.md:19-28`.

## 7. Cross-sector alignment

`.opencode/` is the Soft Meta-Concepts sector — NEVER treated as development assets or implementation source. Skills, agents, and commands in `.opencode/` CONFIGURE runtime behavior from outside the npm package. They contain no business logic, no state persistence, and no compiled code.

- **OMO Adaptation:** Per `.planning/research/omo-adaptation-architecture-2026-05-07.md`, factory injection patterns, CQRS boundaries, and staged initialization are ADAPTED from OMO where they align with Hivemind surfaces. OMO folder roots (`.sisyphus`, `.omx`) are REJECTED.
- **State root:** `.hivemind/` is the canonical deep module persistence root per `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md`. No internal runtime state may be stored in `.opencode/` or `src/` without going through `.hivemind/` authority surfaces.
- **Hard Harness = `src/`:** This sector contains compiled TypeScript that ships in the npm package. Soft Meta-Concepts = `.opencode/`: user-configurable primitives. Internal State = `.hivemind/`: runtime journals, delegation records, event tracker, lineage.

## Current Phase Context

**Active phase (2026-05-11):** Phase 11 — Governance Reconciliation (GOV-01).  
**Evidence baseline:** `.planning/phases/11-governance-reconciliation-update-all-core-artifacts-state-md/11-TRUTH-MATRIX.md`  
**What this means for src/:** All claims about source structure, module counts, and file locations have been verified against the live `src/` tree. References to `src/lib/` (removed in SR-10) have been updated to current plane paths (shared/, task-management/, coordination/, features/, config/, routing/, hooks/, tools/). `plugin.ts` is at 242 LOC.  
**SR restructuring complete:** SR-0 through SR-10 delivered. The target structure in `.planning/codebase/STRUCTURE.md` is the canonical layout.  
**Next work affecting src/:** CP-PTY-01 (Background Shell Control-Plane MVP) will add/modify `src/features/` and `src/coordination/`. CP-ST-01 (Session Tracker Revamp) will add `src/features/session-tracker/`.

</system-reminder>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/tool-capture.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/tool-capture.ts</path>
<type>file</type>
<content>
1: /**
2:  * Tool metadata capture handler with per-tool pruning rules.
3:  *
4:  * Handles `tool.execute.after` hook events from OpenCode. Applies
5:  * SPEC.md Section 5.1 capture rules for each tool type:
6:  *
7:  * - **skill**: captures skill name + first `#` header line only (REQ-ST-04)
8:  * - **read**: captures file path only, NEVER file content (REQ-ST-05)
9:  * - **task**: captures delegation metadata + triggers child `.json` creation (REQ-ST-06)
10:  * - **other**: captures tool name and callID only (metadata safe)
11:  *
12:  * All handlers are best-effort — errors are logged, never thrown.
13:  *
14:  * @module session-tracker/capture/tool-capture
15:  */
16: 
17: import type { SessionWriter } from "../persistence/session-writer.js"
18: import type { ChildWriter } from "../persistence/child-writer.js"
19: import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
20: import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
21: import type { ChildSessionRecord } from "../types.js"
22: import { isValidSessionID } from "../types.js"
23: 
24: // ---------------------------------------------------------------------------
25: // Hook input/output shapes
26: // ---------------------------------------------------------------------------
27: 
28: /** Shape of the tool.execute.after hook input. */
29: interface ToolInput {
30:   tool: string
31:   sessionID: string
32:   callID: string
33:   args: unknown
34: }
35: 
36: /** Shape of the tool.execute.after hook output. */
37: interface ToolOutput {
38:   title?: string
39:   output?: unknown
40:   metadata?: unknown
41: }
42: 
43: // ---------------------------------------------------------------------------
44: // ToolCapture class
45: // ---------------------------------------------------------------------------
46: 
47: /**
48:  * Captures tool execution metadata from the `tool.execute.after` hook.
49:  *
50:  * Applies per-tool pruning rules to keep session knowledge files focused
51:  * and avoid capturing sensitive or excessive data.
52:  */
53: export class ToolCapture {
54:   private sessionWriter: SessionWriter
55:   private childWriter: ChildWriter
56:   private sessionIndexWriter: SessionIndexWriter
57:   private projectIndexWriter: ProjectIndexWriter
58: 
59:   /**
60:    * @param deps - Injected dependencies.
61:    * @param deps.sessionWriter - The main session writer for .md output.
62:    * @param deps.childWriter - The child session writer for .json delegation files.
63:    * @param deps.sessionIndexWriter - The session-local index writer.
64:    * @param deps.projectIndexWriter - The project-level index writer.
65:    */
66:   constructor(deps: {
67:     sessionWriter: SessionWriter
68:     childWriter: ChildWriter
69:     sessionIndexWriter: SessionIndexWriter
70:     projectIndexWriter: ProjectIndexWriter
71:   }) {
72:     this.sessionWriter = deps.sessionWriter
73:     this.childWriter = deps.childWriter
74:     this.sessionIndexWriter = deps.sessionIndexWriter
75:     this.projectIndexWriter = deps.projectIndexWriter
76:   }
77: 
78:   /**
79:    * Handles a tool.execute.after hook event.
80:    *
81:    * @param input - Hook input containing tool name, sessionID, callID, and args.
82:    * @param output - Hook output containing title, output, and metadata.
83:    * @returns Promise that resolves when the tool invocation has been captured.
84:    */
85:   async handleToolExecuteAfter(
86:     input: ToolInput,
87:     output: ToolOutput,
88:   ): Promise<void> {
89:     try {
90:       if (!input?.sessionID || !isValidSessionID(input.sessionID)) {
91:         return
92:       }
93:       if (!input.tool || typeof input.tool !== "string") {
94:         return
95:       }
96: 
97:       // Validate input.args is a non-null, non-array object (or undefined).
98:       if (
99:         input.args !== undefined &&
100:         (input.args === null || Array.isArray(input.args) || typeof input.args !== "object")
101:       ) {
102:         console.warn(
103:           `[Harness] Session tracker: invalid args shape for tool "${input.tool}" — skipping`,
104:         )
105:         return
106:       }
107: 
108:       switch (input.tool) {
109:         case "skill":
110:           await this.handleSkill(input, output)
111:           break
112:         case "read":
113:           await this.handleRead(input, output)
114:           break
115:         case "task":
116:           await this.handleTask(input, output)
117:           break
118:         default:
119:           await this.handleOther(input)
120:           break

(Showing lines 1-120 of 352. Use offset=121 to continue.)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/tool-capture.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/tool-capture.ts</path>
<type>file</type>
<content>
120:           break
121:       }
122:     } catch (err) {
123:       console.warn(
124:         "[Harness] Session tracker: tool.execute.after handler failed:",
125:         err,
126:       )
127:     }
128:   }
129: 
130:   // -----------------------------------------------------------------------
131:   // Per-tool handlers
132:   // -----------------------------------------------------------------------
133: 
134:   /**
135:    * Captures a skill tool invocation.
136:    *
137:    * Input: captures `args.name` (the skill name).
138:    * Output: captures only the first `#` header line, if present (REQ-ST-04).
139:    *
140:    * @param input - The hook input.
141:    * @param output - The hook output.
142:    */
143:   private async handleSkill(
144:     input: ToolInput,
145:     output: ToolOutput,
146:   ): Promise<void> {
147:     const args = (input.args || {}) as Record<string, unknown>
148:     const skillName = args.name as string | undefined
149:     const firstHeader = this.extractFirstHeader(output.output)
150: 
151:     await this.sessionWriter.appendToolBlock(
152:       input.sessionID,
153:       "skill",
154:       { name: skillName },
155:       firstHeader,
156:       undefined,
157:     )
158:   }
159: 
160:   /**
161:    * Captures a read tool invocation.
162:    *
163:    * Input: captures `args.filePath` (the file path).
164:    * Output: NEVER captures file content — only the path (REQ-ST-05).
165:    * If the output indicates an error, the error message is captured.
166:    *
167:    * @param input - The hook input.
168:    * @param output - The hook output.
169:    */
170:   private async handleRead(
171:     input: ToolInput,
172:     output: ToolOutput,
173:   ): Promise<void> {
174:     const args = (input.args || {}) as Record<string, unknown>
175:     const filePath = args.filePath as string | undefined
176:     const outputStr = this.asString(output.output)
177:     const isError = outputStr?.toLowerCase().includes("error") ||
178:       outputStr?.toLowerCase().includes("not found")
179: 
180:     await this.sessionWriter.appendToolBlock(
181:       input.sessionID,
182:       "read",
183:       { filePath },
184:       undefined,
185:       isError ? outputStr : undefined,
186:     )
187:   }
188: 
189:   /**
190:    * Captures a task tool invocation — the authoritative delegation signal.
191:    *
192:    * Input: captures `args.description` and `args.subagent_type`.
193:    * Output: extracts `task_id` from output to create the child `.json` file
194:    * and update both continuity indices (REQ-ST-06, D-04).
195:    *
196:    * @param input - The hook input.
197:    * @param output - The hook output.
198:    */
199:   private async handleTask(
200:     input: ToolInput,
201:     output: ToolOutput,
202:   ): Promise<void> {
203:     const args = (input.args || {}) as Record<string, unknown>
204:     const description = (args.description as string) || ""
205:     const subagentType = (args.subagent_type as string) || ""
206:     const childSessionID = this.extractTaskId(output.output)
207: 
208:     if (childSessionID) {
209:       const now = new Date().toISOString()
210:       const childFile = `${childSessionID}.json`
211:       const depth = 1
212: 
213:       // Create child session record
214:       const childMetadata: ChildSessionRecord = {
215:         sessionID: childSessionID,
216:         parentSessionID: input.sessionID,
217:         delegationDepth: depth,
218:         delegatedBy: {
219:           agentName: "main_l0_agent",
220:           tool: "task",
221:           description,
222:           subagentType,
223:         },
224:         created: now,
225:         updated: now,
226:         status: "active",
227:         mainAgent: {
228:           name: subagentType || "unknown",
229:           model: "unknown",
230:         },
231:         turns: [],
232:         children: [],
233:       }
234: 
235:       // Create child .json file under parent's subdir
236:       await this.childWriter.createChildFile(
237:         input.sessionID,
238:         childSessionID,
239:         childMetadata,
240:       )
241: 
242:       // Update session-local index
243:       await this.sessionIndexWriter.addChild(
244:         input.sessionID,
245:         childSessionID,
246:         childFile,
247:         depth,
248:         "main_l0_agent",
249:       )
250: 
251:       // Update project-level index
252:       await this.projectIndexWriter.updateSession(input.sessionID, {
253:         childCount: undefined, // Let the writer handle incremental or passed value
254:       })
255: 
256:       // Also append the task tool block to the main session .md
257:       await this.sessionWriter.appendToolBlock(
258:         input.sessionID,
259:         "task",
260:         { description, subagent_type: subagentType, task_id: childSessionID },
261:         `task_id: ${childSessionID}`,
262:         undefined,
263:       )
264:     } else {
265:       // No task_id found — capture as metadata only
266:       await this.sessionWriter.appendToolBlock(
267:         input.sessionID,
268:         "task",
269:         { description, subagent_type: subagentType },
270:         undefined,
271:         undefined,
272:       )
273:     }
274:   }
275: 
276:   /**
277:    * Captures unknown tool invocations as metadata only.
278:    *
279:    * Only the `callID` is captured — no args or output content.
280:    * This prevents sensitive tool output from being captured verbatim.
281:    *
282:    * @param input - The hook input.
283:    */
284:   private async handleOther(input: ToolInput): Promise<void> {
285:     await this.sessionWriter.appendToolBlock(
286:       input.sessionID,
287:       input.tool,
288:       { callID: input.callID },
289:       undefined,
290:       undefined,
291:     )
292:   }
293: 
294:   // -----------------------------------------------------------------------
295:   // Helpers
296:   // -----------------------------------------------------------------------
297: 
298:   /**
299:    * Extracts the first markdown header line (`# ...`) from tool output.
300:    *
301:    * @param output - The raw tool output.
302:    * @returns The first header line, or `undefined` if none found.
303:    */
304:   private extractFirstHeader(output: unknown): string | undefined {
305:     const str = this.asString(output)
306:     if (!str) return undefined
307: 
308:     const match = str.match(/^# .+$/m)
309:     return match ? match[0] : undefined
310:   }
311: 
312:   /**
313:    * Extracts a task_id from the output string.
314:    *
315:    * Recognizes two formats:
316:    * - `task_id: ses_abc123` (the canonical format from Plan 01 task tool output)
317:    * - A standalone session ID starting with `ses_` that appears in the output
318:    *
319:    * @param output - The raw tool output.
320:    * @returns The extracted task/session ID, or `null` if none found.
321:    */
322:   private extractTaskId(output: unknown): string | null {
323:     const str = this.asString(output)
324:     if (!str) return null
325: 
326:     // Try "task_id: ses_..." format first
327:     const match = str.match(/task_id:\s*(ses_[a-zA-Z0-9]+)/)
328:     if (match) return match[1]
329: 
330:     // Try standalone ses_ ID in the output
331:     const sesMatch = str.match(/(ses_[a-zA-Z0-9]{6,})/)
332:     if (sesMatch) return sesMatch[1]
333: 
334:     return null
335:   }
336: 
337:   /**
338:    * Safely converts unknown output to a string.
339:    *
340:    * @param value - The value to convert.
341:    * @returns The string representation, or `undefined` if not representable.
342:    */
343:   private asString(value: unknown): string | undefined {
344:     if (typeof value === "string") return value
345:     if (value === null || value === undefined) return undefined
346:     try {
347:       return JSON.stringify(value)
348:     } catch {
349:       return String(value)
350:     }
351:   }
352: }

(End of file - total 352 lines)
</content>
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/project-index-writer.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/event-capture.ts"
}
```

**Error:**
```
<path>/Users/apple/hivemind-plugin-private/src/features/session-tracker/capture/event-capture.ts</path>
<type>file</type>
<content>
1: /**
2:  * Session lifecycle event capture handler.
3:  *
4:  * Handles `session.created`, `session.idle`, `session.deleted`, and
5:  * `session.error` events from the OpenCode `event` hook. Distinguishes
6:  * root sessions from child sessions via SDK `parentID` check.
7:  *
8:  * Root sessions: creates `.hivemind/session-tracker/{sessionID}/` subdir
9:  * and `{sessionID}.md` file. Child sessions: skipped (handled by tool-capture
10:  * when `task` tool fires).
11:  *
12:  * All handlers are best-effort — errors are logged, never thrown.
13:  *
14:  * @module session-tracker/capture/event-capture
15:  */
16: 
17: import type { OpenCodeClient } from "../../../shared/session-api.js"
18: import { getSession } from "../../../shared/session-api.js"
19: import type { SessionWriter } from "../persistence/session-writer.js"
20: import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
21: import { sanitizeSessionID } from "../persistence/atomic-write.js"
22: import { isValidSessionID } from "../types.js"
23: 
24: // ---------------------------------------------------------------------------
25: // EventCapture class
26: // ---------------------------------------------------------------------------
27: 
28: /**
29:  * Handles session lifecycle events from the OpenCode `event` hook.
30:  *
31:  * Delegated by the hook pipeline. Never writes files directly — relies on
32:  * {@link SessionWriter} for all persistence operations.
33:  */
34: export class EventCapture {
35:   private client: OpenCodeClient
36:   private sessionWriter: SessionWriter
37:   private projectIndexWriter: ProjectIndexWriter | undefined
38: 
39:   /**
40:    * @param deps - Injected dependencies.
41:    * @param deps.client - The OpenCode SDK client for session queries.
42:    * @param deps.sessionWriter - The session writer for persistence.
43:    * @param deps.projectIndexWriter - Optional project index writer for session registration.
44:    */
45:   constructor(deps: {
46:     client: OpenCodeClient
47:     sessionWriter: SessionWriter
48:     projectIndexWriter?: ProjectIndexWriter
49:   }) {
50:     this.client = deps.client
51:     this.sessionWriter = deps.sessionWriter
52:     this.projectIndexWriter = deps.projectIndexWriter
53:   }
54: 
55:   /**
56:    * Handles a session lifecycle event from the `event` hook.
57:    *
58:    * @param event - Hook input containing eventType, sessionID, and raw event data.
59:    * @returns Promise that resolves when the event has been processed.
60:    *
61:    * @remarks
62:    * Supported event types:
63:    * - `session.created` — creates subdir + .md for root sessions
64:    * - `session.idle` — updates session status to "idle"
65:    * - `session.deleted` — marks session status as "completed"
66:    * - `session.error` — marks session status as "error"
67:    */
68:   async handleSessionEvent(event: {
69:     eventType: string
70:     sessionID: string
71:     event: unknown
72:   }): Promise<void> {
73:     try {
74:       if (!event?.sessionID || !isValidSessionID(event.sessionID)) {
75:         return
76:       }
77: 
78:       // Validate sessionID matches its own sanitized form — reject any
79:       // sessionID that would be altered by sanitization (path traversal guard).
80:       if (event.sessionID !== sanitizeSessionID(event.sessionID)) {
81:         console.warn(
82:           `[Harness] Session tracker: sessionID contains unsafe characters: "${event.sessionID}"`,
83:         )
84:         return
85:       }
86: 
87:       // Validate eventType is a recognized session lifecycle type.
88:       const validEventTypes = [
89:         "session.created",
90:         "session.idle",
91:         "session.deleted",
92:         "session.error",
93:         "session.status",
94:         "session.compacted",
95:         "session.updated",
96:       ]
97:       if (!validEventTypes.includes(event.eventType)) {
98:         console.warn(
99:           `[Harness] Session tracker: unexpected event type "${event.eventType}", expected one of: ${validEventTypes.join(", ")}`,
100:         )
101:         // Continue for unrecognized types — they may carry unknown but harmless events.
102:         // Don't return; log is sufficient for observability.
103:       }
104: 
105:       switch (event.eventType) {
106:         case "session.created":
107:           await this.handleSessionCreated(event.sessionID)
108:           break
109:         case "session.idle":
110:           await this.handleSessionIdle(event.sessionID)
111:           break
112:         case "session.deleted":
113:           await this.handleSessionDeleted(event.sessionID)
114:           break
115:         case "session.error":
116:           await this.handleSessionError(event.sessionID)
117:           break
118:         default:
119:           console.warn(
120:             `[Harness] Session tracker: unknown event type "${event.eventType}"`,

(Showing lines 1-120 of 220. Use offset=121 to continue.)
</content>
```


### Tool: glob

**Input:**
```json
{
  "callID": "call_03_Cj5CP4Sk9wLDUXZr5jIS0934"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/.planning/config.json"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/project-index-writer.ts"
}
```


### Tool: read

**Input:**
```json
{
  "filePath": "/Users/apple/hivemind-plugin-private/src/features/session-tracker/persistence/session-writer.ts"
}
```


### Tool: write

**Input:**
```json
{
  "callID": "call_00_MGaaTVq4i2TvXVxgalRm7417"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_p6im2XVwIgypFsBuG6fF1455"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_01_wskiEpruMlM7tBFWUgoX8503"
}
```


### Tool: bash

**Input:**
```json
{
  "callID": "call_00_jxqR0Yr0lWRkXVNE65Q55716"
}
```

