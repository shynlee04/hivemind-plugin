# Phase 13: Session Tracker Defect Remediation — Context

**Gathered:** 2026-05-12
**Status:** Ready for planning
**Sources:** CP-ST-01 CONTEXT.md (validated D-01 through D-05), CP-ST-01 SPEC.md (13 REQs locked), CP-ST-01 RESEARCH.md (12-slice plan architecture), CP-ST-01 DISCUSSION-LOG.md (audit trail), Phase 12 CONTEXT.md (what was attempted, what failed), 13-RESEARCH.md (disk-truth corrected — L1 evidence at file:content level)

---

<domain>
## Phase Boundary

This phase SHALL fix ALL defects in the session tracker module (`src/features/session-tracker/`) and achieve FULL compliance with the original CP-ST-01 SPEC (13 REQs). Phase 12 attempted to fix 14 review findings but made things WORSE — cross-contamination, skeleton child files, zero turn counts, and double-capture were introduced or unaddressed. This phase repairs the broken pipeline using disk-truth-first methodology: every fix is validated against `.hivemind/session-tracker/` file content before being declared complete.

**What this phase MUST deliver:**
1. Zero cross-contamination: no child session has its own directory or project-continuity.json entry
2. Complete child session capture: child `.json` files contain all turns, not just turn 0 skeletons
3. Correct turn counting: `session-continuity.json` shows `turnCount > 0` matching actual user turns in `.md`
4. Assistant message capture: main session `.md` contains `## main_l0_agent` blocks with `name`, `model`, and message content
5. Full context output to child `.json`: assistant responses, tool calls, and delegation metadata for resumption
6. Field transformation for child sessions: first `##USER` → `main_l0_agent` with PARENT agent's name/model
7. Dual indices operational: `childCount > 0` in `project-continuity.json`, `turnCount > 0` in `session-continuity.json`
8. No double-capture: legacy event-tracker no longer writes to `.hivemind/event-tracker/`

**What this phase SHALL NOT do:**
- Rewrite the session tracker from scratch
- Undo CP-ST-01 D-01 through D-05 (validated architectural decisions)
- Change delegation manager, concurrency queue, or completion detector (out of SPEC scope)
- Delete old event-tracker source code (safety net per REQ-ST-13)
- Add new npm dependencies

</domain>

<spec_lock>
## Requirements (locked via CP-ST-01 SPEC.md + disk-truth validation)

All 13 REQs from `CP-ST-01-session-tracker-revamp/01-SPEC.md` are still valid and locked. Phase 13 SHALL achieve FULL compliance (PASS on all 13).

### REQ Status Matrix (as of 2026-05-12 disk state)

| REQ | Requirement | Status | Evidence | What's Broken |
|-----|------------|--------|----------|---------------|
| **REQ-ST-01** | Session directory manifestation | **FAIL** | `[DISK] 4 child sessions have own directories` ← `13-RESEARCH.md:75-86` | `ensureSessionReady` creates dirs for ALL sessions regardless of parentID. Children dual-registered. |
| **REQ-ST-02** | User message capture | **PARTIAL** | `[DISK] ses_1e6f252....md has ## USER (turn 1) and ## USER (turn 2)` ← `13-RESEARCH.md:225` | User messages captured in .md but turnCount in index stays 0 (RC-3). |
| **REQ-ST-03** | Agent metadata transform | **FAIL** | `[DISK] ses_1e6ff88f....md starts with "### Tool: task" — NO frontmatter, NO main_l0_agent block` ← `13-RESEARCH.md:265-266` | Assistant output NOT captured. No `## main_l0_agent` sections in .md files. |
| **REQ-ST-04** | Tool capture — Skill | **PASS** | `[SOURCE] tool-capture.ts handles skill tool with pruning` ← `01-RESEARCH.md:38-39` | Working correctly. Pruned first header line. |
| **REQ-ST-05** | Tool capture — Read | **PASS** | `[SOURCE] tool-capture.ts fixed in Phase 12 to use metadata-based error detection` ← `12-CONTEXT.md:42-43` | Working correctly. No file content captured. |
| **REQ-ST-06** | Tool capture — Task (Delegation) | **PARTIAL** | `[DISK] Child .json files exist with correct parentSessionID` ← `13-RESEARCH.md:68-74` | Child .json CREATED correctly but NEVER UPDATED after spawn. Only turn 0. |
| **REQ-ST-07** | Child session recognition + transform | **FAIL** | `[DISK] 4 of 5 child sessions dual-registered in project-continuity.json` ← `13-RESEARCH.md:103-117` | `ensureSessionReady` doesn't check parentID. Child ##USER NOT transformed. Child .json never receives turns beyond 0. |
| **REQ-ST-08** | Dual continuity indices | **FAIL** | `[DISK] All 15 project entries have childCount:0; all session-continuity.json have turnCount:0` ← `13-RESEARCH.md:143-159, 219-233` | `incrementTurnCount` never called. `childCount` never incremented. Indexes are stale. |
| **REQ-ST-09** | Concurrent session isolation | **AT-RISK** | `[SOURCE] session-index-writer.ts and child-writer.ts lack serial write queues` ← `13-RESEARCH.md:294-308` | No visible data loss YET (pipeline too broken to produce concurrent writes) but RC-5, RC-6 confirmed — WILL fail under load. |
| **REQ-ST-10** | Disconnection recovery | **PARTIAL** | `[SOURCE] recovery/session-recovery.ts exists` ← `01-RESEARCH.md:249-251` | Recovery file exists but produces skeletal data. Can't resume from child .json with only turn 0. |
| **REQ-ST-11** | Hook-to-persistence CQRS compliance | **PASS** | `[SOURCE] Hooks call sessionTracker.handleX() methods` ← `01-RESEARCH.md:45-46` | Architecture boundary respected. No direct fs writes from hooks. |
| **REQ-ST-12** | Schema consistency | **PASS** | `[SOURCE] schema-normalizer.ts transforms SDK snake_case to camelCase` ← `01-RESEARCH.md:46-47` | Schema normalizer working. |
| **REQ-ST-13** | Legacy cleanup | **FAIL** | `[DISK] .hivemind/event-tracker/ses_1e69.json — 1985 lines, actively written` ← `13-RESEARCH.md:161-170` | `cleanup()` chain removes old files but `consumeJourneyFact` still writes new ones. Double-capture confirmed. |

### Source Evidence for Each REQ

- **REQ-ST-01** ← `01-SPEC.md:338-343` — "root session (session with no parentID)... creates directory"
- **REQ-ST-02** ← `01-SPEC.md:348-353` — "Each user message... captured as a numbered turn"
- **REQ-ST-03** ← `01-SPEC.md:356-363` — "Assistant response metadata is transformed into structured `main_l0_agent` fields" — **CRITICAL: This is the pinned missing requirement #1 from user**
- **REQ-ST-04** ← `01-SPEC.md:366-373` — "Skill tool invocations... only the skill name and first header line"
- **REQ-ST-05** ← `01-SPEC.md:377-384` — "Read tool... only the file path and success/error status"
- **REQ-ST-06** ← `01-SPEC.md:388-396` — "Task tool... triggers child session file creation" — **CRITICAL: pinned missing requirement #2**
- **REQ-ST-07** ← `01-SPEC.md:399-406` — "Child sessions... must be recognized as delegation children. The `##USER` block... must be transformed to `main_l0_agent`" — **CRITICAL: pinned missing requirements #2 and #3**
- **REQ-ST-08** ← `01-SPEC.md:410-419` — "Two separate index files at different scopes"
- **REQ-ST-09** ← `01-SPEC.md:423-430` — "Up to 6 sessions may write concurrently"
- **REQ-ST-10** ← `01-SPEC.md:435-441` — "When an agent disconnects... can rebuild context from persisted tracker files"
- **REQ-ST-11** ← `01-SPEC.md:446-452` — "Hooks must NOT directly write to `.hivemind/`"
- **REQ-ST-12** ← `01-SPEC.md:457-463` — "All field names follow consistent camelCase convention"
- **REQ-ST-13** ← `01-SPEC.md:468-474` — "Contaminated state files in `.hivemind/event-tracker/` are removed"

</spec_lock>

<decisions>
## Locked Implementation Decisions

### CP-ST-01 Decisions (VALIDATED — MUST PRESERVE)

These 5 decisions from `CP-ST-01-session-tracker-revamp/01-CONTEXT.md` are the architectural foundation. They were validated in the discussion log (`01-DISCUSSION-LOG.md`) and confirmed correct by disk evidence. The problem is the IMPLEMENTATION deviated from them — not that the decisions are wrong.

| Decision | Source | Description | Status |
|----------|--------|-------------|--------|
| **D-01** | `01-CONTEXT.md:43` | Deps injection pattern — SessionTracker receives callbacks via constructor | **VALID — PRESERVE** |
| **D-02** | `01-CONTEXT.md:46` | Single extensible session-tracker tool + TODO for expansion | **VALID — PRESERVE** (note: Phase 12 D-08 attempted to split into 3 tools, but this was premature — fix the pipeline first) |
| **D-03** | `01-CONTEXT.md:49` | Atomic rename + serialize queue — write-to-temp + fs.rename(), promise-chain queue for index files | **VALID — PRESERVE** (confirmed working in project-index-writer, needs extension to session-index-writer and child-writer) |
| **D-04** | `01-CONTEXT.md:53-57` | Append-per-event with task-tool as authoritative delegation signal — each hook event appends immediately, task tool output `task_id` IS child session ID | **VALID — PRESERVE** |
| **D-05** | `01-CONTEXT.md:60-64` | No separate recovery — hook flow IS recovery — on plugin load read project-continuity.json, normal hook flow resumes | **VALID — PRESERVE** |

**Decision provenance:** `01-DISCUSSION-LOG.md:12-78` documents the alternatives considered and user's explicit choices for all 5 decisions.

---

### Pinned Missing Requirements (USER VALIDATED — NON-NEGOTIABLE)

These requirements were MISSING from the original research and Phase 12 implementation. The user identified them as critical for context retrieval and resumption. They SHALL be implemented as locked decisions.

#### P-01: Assistant Message Output Capture (REQ-ST-03)
**Source:** User specification + `01-SPEC.md:356-363`
**Condition:** The main session `.md` file SHALL capture the LAST assistant response message block as a `## main_l0_agent` section containing:
- `name` — agent name (e.g., "Hm-L0-Orchestrator")
- `model` — model identifier (e.g., "DeepSeek V4 Pro")
- `thinking_duration` — thinking time in seconds
- The FULL message content (assistant response text)
**Constraint:** Thinking blocks (chain-of-thought) are NOT captured — only the final assistant output.
**Why this matters:** Without assistant output, agents cannot resume from session state. They need to know what was last said/done.
**Implementation target:** `src/features/session-tracker/capture/message-capture.ts` — handle `chat.message` hook with role "assistant". Append `## main_l0_agent` section to .md.

#### P-02: Child Session Full Context Output (REQ-ST-06, REQ-ST-07)
**Source:** User specification + `01-SPEC.md:388-406`
**Condition:** Child `.json` files SHALL contain the FULL assistant output, NOT skeleton data. Each turn SHALL capture:
- User message (the delegation prompt from parent, already captured as turn 0 by `handleTask`)
- Agent response (assistant output in child session)
- Tool calls made by the child agent (skill, read, task, etc.)
- `task_id` and delegation metadata for any sub-delegations
**Current state:** All child `.json` have `turns: []` or `turns: [turn 0 only]` with `status: "active"` — WORTHLESS for context retrieval. ← `13-RESEARCH.md:122-140`
**Why this matters:** This is the ENTIRE purpose of child session tracking — to provide context for resumption. Without full turn capture, child sessions cannot be resumed.
**Implementation target:** `src/features/session-tracker/index.ts:301-330` — `handleChatMessage` must detect child sessions and route to `childWriter.appendChildTurn()`.

#### P-03: Field Transformation for Child Sessions (REQ-ST-07)
**Source:** User specification + `01-SPEC.md:399-406`
**Condition:** When a `session.created` event fires with `parentID !== null`, the child session's first `##USER` message SHALL be transformed to `main_l0_agent` with:
- `name` — the PARENT agent's name (from delegation metadata stored at spawn time)
- `model` — the PARENT agent's model (not the child's own identity)
- `actor_transformed_from: "user"` — marking that this was originally a user/parent message
**Why this matters:** Child sessions are created by the `task` tool. Their "user" is the parent agent delegating work. The field transformation enables agents to trace delegation lineage.
**Implementation target:** `src/features/session-tracker/transform/agent-transform.ts` — wire into child session message capture path. Parent agent metadata must be stored at delegation spawn time (in `tool-capture.ts:handleTask`) and passed to the transform.

#### P-04: Last Message Output Tracking
**Source:** User specification
**Condition:** 
- The main session `.md` file SHALL track the LAST assistant message for each turn (in `## main_l0_agent` blocks)
- The child `.json` file SHALL track the LAST output for the child session (final assistant response)
**Why this matters:** Agents need to know what was last said/done to resume work. Without last-message tracking, resumption context is incomplete.
**Implementation target:** `message-capture.ts` for main session; `child-writer.ts::appendChildTurn` + dedicated final output field for child sessions.

#### P-05: Preserve CP-ST-01 D-01 through D-05 Intact
**Source:** User specification
**Condition:** None of the fixes in Phase 13 SHALL undo or replace CP-ST-01 D-01 through D-05. These are VALIDATED architectural decisions. The problem is the IMPLEMENTATION deviated — the fix is to REPAIR the implementation, not to change the architecture.
**Constraint:** All fixes SHALL work WITHIN the existing D-01 through D-05 architecture (deps injection, append-per-event, atomic rename, task-tool-as-signal, hook-flow-is-recovery).

---

### Fix Strategy Decisions

These are implementation-level decisions for Phase 13, derived from the disk-truth research (`13-RESEARCH.md:340-379`).

#### S-01: Fix `ensureSessionReady` FIRST (Wave 0 — BLOCKING)
**Source:** `13-RESEARCH.md:314-316` (RC-1, RC-2)
**Rationale:** `ensureSessionReady` is the PRIMARY root cause of cross-contamination. Without fixing it, all other fixes are irrelevant — child sessions will continue to get their own directories. Add parentID check: query SDK `getSession()`, if `parentID !== null`, skip directory creation and project index registration.
**Files:** `src/features/session-tracker/index.ts:123-156`

#### S-02: Single Path for Session Initialization (Wave 0)
**Source:** `13-RESEARCH.md:317-318` (RC-2)
**Rationale:** `ensureSessionReady` and `eventCapture.handleSessionCreated` both try to initialize sessions — creating a race. Pick ONE path. Remove `ensureSessionReady` call from `handleSessionEvent` and let `eventCapture` handle all initialization. Or vice versa. Single-path eliminates the race.
**Files:** `index.ts:164-215` + `event-capture.ts:169-204`

#### S-03: Wire MessageCapture → SessionIndexWriter (Wave 0)
**Source:** `13-RESEARCH.md:319` (RC-3)
**Rationale:** `MessageCapture` creates user turns in `.md` but never tells `SessionIndexWriter` to increment `turnCount`. Inject `SessionIndexWriter` via constructor, call `incrementTurnCount(sessionID)` in `handleUserMessage`.
**Files:** `message-capture.ts:60-89` (constructor), `message-capture.ts:167-178` (handleUserMessage)

#### S-04: Add `incrementChildCount` to ProjectIndexWriter (Wave 1)
**Source:** `13-RESEARCH.md:247-253` (RC-4)
**Rationale:** `handleTask` calls `updateSession(sessionID, {})` with empty updates — childCount never increments. Add `incrementChildCount(sessionID)` method that reads current count, increments, writes atomically within serial queue.
**Files:** `project-index-writer.ts` (new method), `tool-capture.ts:287`

#### S-05: Route Child Session Messages to Child JSON (Wave 1)
**Source:** `13-RESEARCH.md:209-214` (RC-6)
**Rationale:** `chat.message` fires for child sessions but `handleChatMessage` only writes to main session .md. Add child detection: query `getSession(sessionID)`, if `parentID !== null`, route to `childWriter.appendChildTurn()`.
**Files:** `index.ts:301-330`

#### S-06: Wire `seedTurnCounters` from `initialize()` (Wave 1)
**Source:** `13-RESEARCH.md:327` (RC-7)
**Rationale:** `seedTurnCounters` is implemented but never called in `initialize()`. Iterate project index sessions and seed counters from existing .md files.
**Files:** `index.ts:380-443`

#### S-07: Add Serial Write Queues to SessionIndexWriter and ChildWriter (Wave 2)
**Source:** `13-RESEARCH.md:294-308` (RC-5)
**Rationale:** These writers currently do read-modify-write with no serialization. Under concurrent writes (6 sessions), data will be lost. Apply same `enqueueWrite` pattern already proven in `ProjectIndexWriter`.
**Files:** `session-index-writer.ts`, `child-writer.ts`

#### S-08: Remove or Gate `consumeJourneyFact` Double-Capture (Wave 3)
**Source:** `13-RESEARCH.md:280-289` (RC-8)
**Rationale:** Both old event-tracker and new session-tracker process every event. `cleanup()` removes old files but `consumeJourneyFact` writes new ones. Remove observer from plugin.ts eventObservers array, OR guard with `cleanup()` completion flag.
**Files:** `plugin.ts:146-155, 181`

#### S-09: Capture Assistant Output in Main Session .md (REQ-ST-03 — P-01)
**Source:** User pinned requirement P-01 + `01-SPEC.md:356-363`
**Rationale:** The `chat.message` hook provides assistant message output. Currently this is NOT captured. Append `## main_l0_agent` block with agent name, model, thinking duration, and full message content. Skip thinking blocks.
**Files:** `capture/message-capture.ts`

#### S-10: Transform Child Session First User Message (REQ-ST-07 — P-03)
**Source:** User pinned requirement P-03 + `01-SPEC.md:399-406`
**Rationale:** Child session's first message is actually the parent agent delegating. Transform `## USER` → `main_l0_agent` with parent agent name/model from delegation metadata. Store delegation metadata at spawn time.
**Files:** `capture/message-capture.ts`, `transform/agent-transform.ts`, `capture/tool-capture.ts` (store parent metadata)

</decisions>

<canonical_refs>
## Canonical References

**The planner SHALL read these before creating PLAN.md. The implementer SHALL read these before writing code.**

### Primary Authority (Phase 13 baseline)
- `13-RESEARCH.md` — Disk-truth corrected research with 11 root causes (RC-1 through RC-11), 12 fixes (F-01 through F-12) across 3 waves, and per-REQ acceptance test mapping. **MUST READ FIRST.**
  → Full path: `.planning/phases/13-fix-all-session-tracker-defects-with-gatekeeping-tdd-spec-dr/13-RESEARCH.md`

### Locked Specification (CP-ST-01)
- `01-SPEC.md` — 13 REQs with EARS acceptance criteria, file format specifications (Section 5), SDK API surface (Section 6), module placement guide (Section 9), flaw coverage (Section 10), and acceptance test matrix (Section 8). **Authoritative requirements baseline — these REQs are LOCKED.**
  → Full path: `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md`
- `01-CONTEXT.md` — D-01 through D-05 locked decisions, canonical refs, code context. **Architectural decisions are LOCKED.**
  → Full path: `.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md`
- `01-DISCUSSION-LOG.md` — Audit trail of alternatives considered for each decision. Read to understand WHY decisions were made, not to change them.
  → Full path: `.planning/phases/CP-ST-01-session-tracker-revamp/01-DISCUSSION-LOG.md`
- `01-RESEARCH.md` — Original implementation-planning research with 12-slice architecture, CQRS boundary diagram, existing pattern documentation, SDK hook signatures, security threat model, and 10 "do not do" rules.
  → Full path: `.planning/phases/CP-ST-01-session-tracker-revamp/01-RESEARCH.md`

### Phase 12 Context (what went wrong)
- `12-CONTEXT.md` — What Phase 12 attempted (3-wave remediation, tool redesign D-08, compaction capture D-10). Documents the decisions that PRODUCED the current broken state. Read to understand what NOT to repeat.
  → Full path: `.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md`

### Architecture Governance
- `ARCHITECTURE.md` — CQRS model, 9-surface authority table, component graph, dependency rules. Required for CQRS boundary validation (REQ-ST-11).
  → Full path: `.planning/codebase/ARCHITECTURE.md`
- `CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 8 criteria for custom tool design. Used for tool quality evaluation.
  → Full path: `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md`

### Source Code (current implementation to be repaired)
- `src/features/session-tracker/index.ts` — SessionTracker class. `ensureSessionReady` (RC-1, RC-2), `handleSessionEvent`, `handleChatMessage` (RC-6), `initialize` (RC-7).
- `src/features/session-tracker/capture/event-capture.ts` — `handleSessionCreated` (RC-2), child event routing.
- `src/features/session-tracker/capture/message-capture.ts` — `handleUserMessage` (RC-3, REQ-ST-02), assistant message handler (P-01, REQ-ST-03).
- `src/features/session-tracker/capture/tool-capture.ts` — `handleTask` (RC-4, REQ-ST-06).
- `src/features/session-tracker/transform/agent-transform.ts` — `##USER` → `main_l0_agent` (P-03, REQ-ST-07).
- `src/features/session-tracker/persistence/project-index-writer.ts` — `enqueueWrite` pattern (proven), `updateSession` (broken — RC-4), `detectStaleQueue` (suspect).
- `src/features/session-tracker/persistence/session-index-writer.ts` — No serial queues (RC-5). `incrementTurnCount` never called (RC-3).
- `src/features/session-tracker/persistence/child-writer.ts` — No serial queues (RC-5). `appendChildTurn` never called after spawn (RC-6).
- `src/plugin.ts` — `consumeJourneyFact` still active (RC-8), hook wiring (L99-100, L146-155, L181).
- `src/hooks/index.ts` — `createCoreHooks()` observer pipeline.

### Disk Evidence (ground truth for validation)
- `.hivemind/session-tracker/project-continuity.json` — 15 entries, all childCount:0, all status:active. **Canonical evidence of broken state.**
- `.hivemind/session-tracker/ses_*/` — Session directories with cross-contamination evidence.
- `.hivemind/event-tracker/` — Double-capture evidence (actively written .json/.md files).

</canonical_refs>

<anti_patterns>
## Anti-Patterns — What NOT To Do

These anti-patterns are derived from Phase 12 failures and the original CP-ST-01 "do not do" rules (`01-RESEARCH.md:452-480`). Violating any of these will cause regression.

| # | Anti-Pattern | Why It Failed in Phase 12 | What To Do Instead |
|---|-------------|--------------------------|--------------------|
| **A-1** | Trust source code over disk state | Phase 12 claimed "12 of 14 defects fixed in code" — FALSE because unit tests mocked everything. Disk evidence showed cross-contamination, zero turn counts, frozen index. ← `13-RESEARCH.md:29-57` | Validate EVERY fix against `.hivemind/session-tracker/` file content. If disk disagrees with code, disk wins. |
| **A-2** | Rewrite the session tracker from scratch | Would undo valid D-01 through D-05 decisions and introduce new bugs. | REPAIR the existing pipeline. Fix `ensureSessionReady`, wire missing dependencies, add serial queues. |
| **A-3** | Undo CP-ST-01 D-01 through D-05 | These decisions were made with user input after evaluating alternatives (documented in `01-DISCUSSION-LOG.md`). They are correct — the implementation deviated. | Work WITHIN the existing architecture: deps injection, append-per-event, atomic rename, task-tool-as-signal, hook-flow-is-recovery. |
| **A-4** | Create a separate recovery system | D-05 mandates: "hook flow IS recovery." Phase 12 attempted explicit recovery paths that complicated the pipeline. | On plugin load, read `project-continuity.json`. Hook events naturally resume — no separate "catch up" phase. |
| **A-5** | Batch writes | D-04 mandates: "append-per-event." Batching introduces latency and loses crash-safety guarantees. | Each `chat.message` or `tool.execute.after` writes immediately. No accumulation buffer. |
| **A-6** | Write files directly from hook callbacks | REQ-ST-11 is non-negotiable. Phase 12 kept CQRS boundary but the current code has `consumeJourneyFact` writing to event-tracker from hooks. | All file writes route through `SessionTracker` → persistence layer. Remove or gate `consumeJourneyFact`. |
| **A-7** | Skip child session message capture | Phase 12's child .json files have only turn 0 — the delegation spawn itself. ALL subsequent child messages are lost. This is what the user identified as the missing requirement (P-02). | Route child `chat.message` to `childWriter.appendChildTurn()`. Detect child sessions via `getSession()` parentID check. |
| **A-8** | Skip assistant output capture (REQ-ST-03) | Main session .md files contain user messages and tool blocks but NO assistant responses. Agents cannot resume without knowing what was last said. This is the user's P-01. | Capture `chat.message` assistant output as `## main_l0_agent` blocks with name, model, thinking_duration, and full message. Skip thinking blocks. |
| **A-9** | Skip field transformation for child sessions | Child session "user" messages are actually parent agent delegations. Without transformation, agents see `##USER` and assume human input — breaking delegation lineage tracing. This is P-03. | When session has `parentID !== null`, transform first `##USER` to `main_l0_agent` with PARENT agent's name/model. Store parent metadata at delegation spawn time. |
| **A-10** | Pass empty updates to index writers | `handleTask` calls `updateSession(sessionID, {})` — the `{}` updates nothing. childCount stays 0 forever. | Create dedicated `incrementChildCount(sessionID)` method. Read current count, increment, write atomically within serial queue. |
| **A-11** | Add npm dependencies | The existing stack (gray-matter, js-yaml, zod, node:fs/promises) is sufficient. No external dependencies needed. | Reuse existing dependencies. No new `package.json` entries. |
| **A-12** | Delete old event-tracker source code | REQ-ST-13: safety net remains. Only cleanup contaminated state files. | Remove stale `.hivemind/event-tracker/*.json` and `*.md` files. Preserve `src/task-management/journal/event-tracker/` source code. |

</anti_patterns>

<code_context>
## Existing Code Insights

### What Already Works (DO NOT BREAK)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Atomic write helpers | `persistence/atomic-write.ts` | ✅ Working | `safeSessionPath()`, `atomicWriteJson()`, `atomicAppendMarkdown()`, `ensureDirectory()` |
| Project index serial queue | `persistence/project-index-writer.ts::enqueueWrite` | ✅ Pattern proven | Apply same pattern to SessionIndexWriter and ChildWriter (S-07) |
| Deps injection pattern | All capture classes | ✅ Working | SessionTracker receives deps via constructor, passes to capture classes |
| Best-effort handlers | All `handle*` methods | ✅ Working | Wrapped in try/catch — never throw to OpenCode runtime |
| Tool capture (skill/read) | `capture/tool-capture.ts` | ✅ Working | Skill pruning, read path-only, other-tool metadata — all correct |
| Schema normalizer | `transform/schema-normalizer.ts` | ✅ Working | camelCase transformation working |
| Agent transform (isolated) | `transform/agent-transform.ts` | ✅ Implementation exists | Code is correct but NOT WIRED to child session message capture |
| Cleanup chain | `plugin.ts:99-100` | ✅ Wired | `cleanup()` chained in plugin — removes old files correctly |


### What's Broken (MUST FIX — in priority order)

| Priority | Defect | Root Cause | File(s) | Research Link |
|----------|--------|------------|---------|---------------|
| **BLOCKING** | Child sessions get own directories | `ensureSessionReady` no parentID check (RC-1) | `index.ts:123-156` | `13-RESEARCH.md:314-316` |
| **BLOCKING** | Dual initialization race | `ensureSessionReady` + `eventCapture` both init (RC-2) | `index.ts:177` + `event-capture.ts:169-204` | `13-RESEARCH.md:317-318` |
| **BLOCKING** | Turn counts always zero | `MessageCapture` never calls `incrementTurnCount` (RC-3) | `message-capture.ts:167-178` | `13-RESEARCH.md:319` |
| **CRITICAL** | childCount always zero | `handleTask` passes `{}` to `updateSession` (RC-4) | `tool-capture.ts:287` | `13-RESEARCH.md:247-253` |
| **CRITICAL** | Child .json never updated | `handleChatMessage` doesn't route to `childWriter` (RC-6) | `index.ts:301-330` | `13-RESEARCH.md:209-214` |
| **CRITICAL** | Turn counters not seeded on restart | `seedTurnCounters` not wired in `initialize()` (RC-7) | `index.ts:380-443` | `13-RESEARCH.md:327` |
| **CRITICAL** | Assistant output NOT captured in .md | No handler for assistant `chat.message` (P-01, REQ-ST-03) | `message-capture.ts` | User pinned requirement |
| **CRITICAL** | Child ##USER NOT transformed | Transform not wired to child message capture (P-03, REQ-ST-07) | `transform/agent-transform.ts` | User pinned requirement |
| **HIGH** | Race conditions in 2 writers | No serial queues (RC-5) | `session-index-writer.ts`, `child-writer.ts` | `13-RESEARCH.md:294-308` |
| **MEDIUM** | Double-capture to old event-tracker | `consumeJourneyFact` still active (RC-8) | `plugin.ts:146-155, 181` | `13-RESEARCH.md:280-289` |

### Integration Points (where the fix needs to touch)

```
src/plugin.ts
  ├── L99-100: cleanup() chain — already correct, preserves
  ├── L146-155: consumeJourneyFact — REMOVE or GATE (S-08)
  ├── L156-174: consumeSessionTrackerFact — PRESERVE, already correct
  └── L181: eventObservers array — REMOVE consumeJourneyFact entry (S-08)

src/features/session-tracker/index.ts
  ├── L123-156: ensureSessionReady() — MUST ADD parentID check (S-01)
  ├── L164-215: handleSessionEvent() — MUST REMOVE ensureSessionReady call OR remove init from eventCapture (S-02)
  ├── L301-330: handleChatMessage() — MUST ADD child session routing (S-05, P-02, P-01)
  └── L380-443: initialize() — MUST WIRE seedTurnCounters (S-06)

src/features/session-tracker/capture/message-capture.ts
  ├── L60-89: constructor — MUST ADD SessionIndexWriter dependency (S-03)
  ├── L167-178: handleUserMessage — MUST CALL incrementTurnCount (S-03)
  └── (new): handleAssistantMessage — MUST IMPLEMENT for P-01 (S-09)

src/features/session-tracker/capture/tool-capture.ts
  └── L287: handleTask updateSession call — MUST REPLACE with incrementChildCount (S-04)

src/features/session-tracker/persistence/project-index-writer.ts
  └── (new): incrementChildCount(sessionID) — MUST IMPLEMENT (S-04)

src/features/session-tracker/persistence/session-index-writer.ts
  └── All read-modify-write methods — MUST ADD serial queue (S-07)

src/features/session-tracker/persistence/child-writer.ts
  └── All read-modify-write methods — MUST ADD serial queue (S-07)

src/features/session-tracker/transform/agent-transform.ts
  └── Child transform — MUST WIRE into child message capture path (S-10, P-03)
```

</code_context>

<specifics>
## Specific User Directives

- **"Do not over engineer — clean, direct logic."** ← `01-CONTEXT.md:129`
- **"The task tool output IS the delegation signal — no complex parent-resolution caches."** ← `01-CONTEXT.md:129`
- **"Append-per-event — as long as the main session is ongoing, captured parts are appended and updated time updated."** ← `01-CONTEXT.md:131`
- **"Main session .md uses YAML frontmatter + Markdown. Child sessions use JSON only."** ← `01-CONTEXT.md:130`
- **"Capture rules are selective — skip thinking blocks, prune tool output to metadata only, transform ##USER in child sessions to main_l0_agent."** ← `01-CONTEXT.md:133`
- **"Keep CP-ST-01 D-01 through D-05 intact."** ← User pinned requirement P-05
- **"Assistant response → `main_l0_agent` section with name, model, thinking_duration. Thinking blocks NOT captured."** ← User pinned requirement P-01
- **"Child .json files MUST contain FULL assistant output, NOT skeleton data."** ← User pinned requirement P-02
- **"Child's first user message → transformed to `main_l0_agent` with PARENT agent's name/model."** ← User pinned requirement P-03
- **"The .md file must track the LAST assistant message for each turn."** ← User pinned requirement P-04
- **"Validate EVERY fix against disk state — not just unit tests."** ← User methodology directive

</specifics>

<deferred>
## Deferred Ideas

These are NOT in scope for Phase 13. They belong to future phases.

- **Tool redesign (Phase 12 D-08):** Splitting `session-tracker` tool into a domain-focused toolset (`session-hierarchy`, `session-context`). DEFERRED until pipeline is fixed. The single extensible `session-tracker` tool (D-02) is sufficient for now.
- **Sidecar dashboard integration (Q2):** Separate project. Session tracker produces files the sidecar can read.
- **Real-time SSE streaming:** Out of scope. Plugin receives events directly via hooks.
- **Graph-based delegation visualization:** Future phase.
- **Auto-pruning of old session data:** Future phase. Current scope is producing correct data.
- **Removal of legacy event-tracker source code:** Future phase. Safety net remains per REQ-ST-13.

</deferred>

---

## Quality Gates (for Phase 13 verification)

Phase 13 SHALL pass all 3 quality gates before completion:

### Gate 1: Lifecycle Integration
- [ ] CQRS boundary: hooks → SessionTracker → persistence — no direct fs writes from hooks (REQ-ST-11)
- [ ] All modules ≤ 500 LOC
- [ ] No circular dependencies
- [ ] `consumeJourneyFact` removed or gated (no double-capture)

### Gate 2: SPEC Compliance
- [ ] Bidirectional traceability: REQ-ST-01..13 ↔ test ↔ code
- [ ] All 13 REQs at PASS status (from current 4 FAIL, 4 PARTIAL, 4 PASS, 1 AT-RISK)
- [ ] P-01 through P-05 implemented and verified
- [ ] EARS acceptance criteria validated per `01-SPEC.md Section 8`

### Gate 3: Evidence Truth
- [ ] L1: Fresh `.hivemind/session-tracker/` disk state after simulated session shows:
  - Zero child sessions with own directories (REQ-ST-01)
  - `childCount > 0` for sessions with delegations (REQ-ST-08)
  - `turnCount > 0` matching actual user turns in .md (REQ-ST-08)
  - Child `.json` files with turns beyond turn 0 (REQ-ST-06, REQ-ST-07)
  - `## main_l0_agent` blocks in .md files (REQ-ST-03, P-01)
- [ ] L2: Continuity index correctness — parseable, navigable
- [ ] L4: All integration tests pass (`tests/features/session-tracker/integration/pipeline.test.ts`)
- [ ] L4: All 247 existing unit tests still pass (regression baseline)

---

*Phase: 13 — Session Tracker Defect Remediation*
*Context gathered: 2026-05-12*
*Evidence base: CP-ST-01 SPEC.md (13 REQs), CP-ST-01 CONTEXT.md (D-01..D-05), 13-RESEARCH.md (L1 disk evidence, 11 root causes, 12 fixes)*
*Next action: Proceed to planning (create PLAN.md with 4-wave structure based on Fix Strategy Decisions S-01 through S-10)*
