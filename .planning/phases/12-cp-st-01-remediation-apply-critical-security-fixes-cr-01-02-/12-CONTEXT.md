# Phase 12: CP-ST-01 Remediation — Context

**Gathered:** 2026-05-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Remediate the CP-ST-01 Session Tracker Revamp implementation to address 20+ catalogued defects across the writer engine (capture logic, hierarchy classification, status tracking, error pruning, compaction capture) and the tool surface (insufficient query capabilities, lack of agent consumability). The phase applies evidence-documented fixes to the existing `src/features/session-tracker/` module and replaces the single `session-tracker` tool with a domain-focused toolset following CUSTOM-TOOLS-CRITERIA guidelines.

This phase fixes what was built in CP-ST-01 — it does NOT add new capabilities beyond the original spec boundary. The existing 163 tests are the regression baseline. All 14 review findings from CP-ST-01-REVIEW.md must be addressed.

</domain>

<decisions>
## Implementation Decisions

### Remediation Strategy: 3-Wave Structure
- **D-01: Wave 1 — Writer Engine Fixes.** Fix the capture pipeline before touching tools. Ordered by dependency: unblock the frozen serial queue (DEFECT-02), fix childCount corruption (DEFECT-01), then hierarchy classification (main vs child), then capture gaps (assistant output, compaction, child status updates), then error pruning. Each fix independently testable.
- **D-02: Wave 2 — Tool Redesign.** Replace the single `session-tracker` tool with a domain-focused toolset: `session-tracker` (export/list/search, extended), `session-hierarchy` (child/parent navigation, delegation chain query), `session-context` (cross-session synthesis, related session discovery). Each tool ≤200 LOC per Criterion 4 (Granularity). Each tool under `src/tools/hivemind/`.
- **D-03: Wave 3 — Integration + Verification.** Fork handling, parallel session edge cases, full regression test pass against all 163 existing tests, integration verification of the complete pipeline.

### Task Granularity: Dependency-Ordered Micro-Tasks
- **D-04:** Each sub-plan decomposes into dependency-ordered micro-tasks (1-2 files per task, individually testable). Tasks follow the frozen dependency chain: unblock the pipeline first, then fix what flows through it. No task touches more than 2 files. Prevents regression cascade.

### Child Session Hierarchy Model: Turn-Level Stems + Final Summary
- **D-05:** Child `.json` records capture per-turn stems: actor (subagent name + model), timestamp, tools (input paths, output paths/IDs, errors as type+path only). After all turns complete, the final assistant response is captured as a summary/report block. No `.md` files for child sessions — only `.json` under parent subdir.
- **D-06:** 3-level delegation hierarchy fully nested in `session-continuity.json`. Children of children recursively nest. Status updates propagate on lifecycle events (created → active → idle/completed/error).
- **D-07:** Child session lifecycle events route through a dedicated handler path in `event-capture.ts`. When `parentID !== null`, events update child `.json` records via `childWriter`, not the main session writer.

### Tool Re-Architecture: Toolset by Domain per CUSTOM-TOOLS-CRITERIA
- **D-08:** Three focused tools replace the single action-dispatched `session-tracker`:
  - `session-tracker` (C2: Governance & State) — export-session, list-sessions, search-sessions, get-status, get-summary
  - `session-hierarchy` (C2: Governance & State) — get-children, get-parent-chain, get-delegation-depth
  - `session-context` (C3: Inspection & Research) — find-related-sessions, cross-reference, synthesize-context
- **D-09:** Each tool follows Criterion 4 (≤200 LOC, kebab-case, action+object naming) and Criterion 7 (minimal required fields, easy agent invocation). Tools use Zod schemas validated at boundary.

### Compaction Capture: Summary Breaker Blocks
- **D-10:** When `session.compacted` event fires, write a compacted section to the main `.md` file containing: pre-compaction context summary, key decisions made, active TODOs/delegations pending, and the compact boundary marker (`## COMPACTED`). Serves as semantic checkpoint for agents resuming long sessions.

### Error Pruning
- **D-11:** Errors captured as type + path only. No file content in error output. The `handleRead` heuristic (substring match on "error") is replaced with structured error detection via tool output metadata.

### the agent's Discretion
- Exact internal module structure within `src/features/session-tracker/` for new handlers (child event routing, compaction capture) is up to the implementer following existing patterns.
- Exact field naming for new child session turn stems is up to the implementer following camelCase convention (REQ-ST-12).
- Tool response envelope format follows existing `src/shared/tool-response.ts` patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### CP-ST-01 Phase Artifacts (original spec + review)
- `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — Locked 13 requirements (REQ-ST-01 through REQ-ST-13). These remain the acceptance baseline.
- `.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md` — Original implementation decisions (D-01 through D-05). D-01 (deps injection), D-03 (atomic rename), and D-04 (append-per-event) remain valid. D-02 (single tool TODO) is superseded by D-08.
- `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md` — 14 findings (3 critical, 6 warning, 5 info). All MUST be addressed in this phase.

### Phase 12 Evidence Baseline
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md` — SPEC vs Reality for all 13 REQs with severity scoring
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md` — 14 writer engine defects with file:line references
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md` — 6 tool surface deficiencies with design notes
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md` — Status of all 14 review findings
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/05-DISK-EVIDENCE-SAMPLES.md` — Sampled session evidence with timestamps and patterns

### Architecture & Governance
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph
- `.planning/codebase/STRUCTURE.md` — File tree, placement conventions, naming
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract
- `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10 design criteria for custom tools. C4 (Granularity) and C7 (Ergonomics) are binding for tool redesign decisions D-08/D-09.

### Source Code
- `src/features/session-tracker/index.ts` — SessionTracker class (the main touch point)
- `src/features/session-tracker/capture/event-capture.ts` — Event routing (needs child session path)
- `src/features/session-tracker/capture/message-capture.ts` — Message capture (needs assistant output capture)
- `src/features/session-tracker/capture/tool-capture.ts` — Tool capture (DEFECT-01, DEFECT-03, DEFECT-04)
- `src/features/session-tracker/persistence/project-index-writer.ts` — Frozen serial queue (DEFECT-02)
- `src/tools/hivemind/session-tracker.ts` — Current tool (to be redesigned per D-08)
- `src/plugin.ts` — Hook wiring + tool registration

### Audit Evidence
- `.hivemind/audit/flaw-register-2026-05-10.json` — 12 flaws (F1-F12) from the original event tracker

### Disk Evidence (live data)
- `.hivemind/session-tracker/project-continuity.json` — 83 entries, all status=active, all childCount=0, frozen lastUpdated
- `.hivemind/session-tracker/` — 85 session subdirectories, child .json files with empty turns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/features/session-tracker/persistence/atomic-write.ts` — `safeSessionPath()`, `atomicWriteJson()`, `atomicAppendMarkdown()`, `ensureDirectory()`. All existing write safety mechanisms remain valid.
- `src/features/session-tracker/persistence/session-writer.ts` — `SessionWriter` class. MD appending and frontmatter merging patterns stay; new compaction section method needed.
- `src/features/session-tracker/persistence/child-writer.ts` — `ChildWriter` class. Existing `createChildFile()`, `updateChildStatus()`, `appendChildTurn()` — already defined but never called after creation. Needs wiring into the event pipeline.
- `src/features/session-tracker/transform/agent-transform.ts` — `AgentTransform` class. Child `##USER` → `main_l0_agent` transform already works; needs wiring for child session message capture.
- `src/shared/tool-response.ts` — Standard `success()` / `error()` response wrapper for new tools.

### Established Patterns
- **Deps injection:** All capture classes receive writers via constructor `({ client, sessionWriter, ... })`. New handlers follow same pattern.
- **Best-effort handlers:** All `handle*` methods wrapped in try/catch — never throw to OpenCode runtime.
- **Atomic write pattern (D-03):** Write to temp file → `fs.rename()` — all new writes use this.
- **Append-per-event (D-04):** Each hook event appends immediately — no batching.
- **CQRS boundaries:** Hooks observe, SessionTracker routes to persistence layer. No direct filesystem writes from hooks.

### Integration Points
- `src/hooks/index.ts` — `createCoreHooks()` observer pipeline. Session tracker hooks already wired here.
- `src/plugin.ts` — Plugin composition root. Tool registration lives here. New tools added alongside existing `session-tracker` registration.
- `src/features/session-tracker/index.ts` — SessionTracker class. New handler methods (`handleChildSessionEvent`, `handleCompaction`) are added here, following existing pattern.

</code_context>

<specifics>
## Specific Ideas

- **No new npm dependencies.** All fixes use existing stack: `gray-matter`, `yaml`, `zod`, `node:fs/promises`.
- **All 14 review findings addressed.** CR-01, CR-02, CR-03 (critical) fixed in Wave 1. WR-01 through WR-06 and IN-01 through IN-05 fixed progressively through Waves 1-3.
- **Regressions prevented.** Each micro-task verifies against `npx vitest run tests/features/session-tracker/` plus task-specific tests. No task merges without green.
- **Disk evidence is the truth.** When code says one thing and disk says another, disk wins. The `project-continuity.json` frozen state is canonical evidence of what's broken.
- **Fork handling (Wave 3).** When OpenCode forks create a new main session from a checkpoint message, the new session shares existing child delegation records. Fork detection via session metadata comparison; shared children are reference-copied, not duplicated.
- **Parallel sessions (Wave 3).** Concurrent main sessions with shared child sessions need write isolation. Child records under parent subdirs are naturally isolated; the project index serial queue must handle concurrent updates without freezing.

</specifics>

<deferred>
## Deferred Ideas

- **Sidecar dashboard integration** — Q2, separate project. Session tracker produces files the sidecar CAN read but no sidecar-specific code belongs here.
- **Real-time SSE streaming** — Out of scope. Plugin receives events directly via hooks.
- **Graph-based delegation visualization** — Out of scope. Belongs to a future phase after the session tracker produces correct data.
- **Auto-pruning of old session data** — Future phase. Current scope is producing correct data, not managing retention.
- **Removal of legacy event-tracker source code** — Future phase. Safety net remains per REQ-ST-13.

</deferred>

---

*Phase: 12-CP-ST-01-Remediation*
*Context gathered: 2026-05-12*
