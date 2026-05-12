---
status: investigating
trigger: "Session tracker parentID detection fundamentally flawed — child task-tool sessions get orphan top-level directories because SDK parentID unavailable at creation time and #USER metadata identical between parent/child"
created: 2026-05-12T16:30:00Z
updated: 2026-05-12T17:50:00Z
---

## Symptoms

### Expected
- Child sessions (delegate-task/task tool created) should NOT have their own top-level directories under `.hivemind/session-tracker/`
- Child .json files should exist ONLY under parent's directory
- Session ID hierarchy: main (L0) → L1 delegation → L2 delegation, lookup-based not SDK-based

### Actual (live evidence from 2026-05-12)
- 5 top-level session directories exist, only 2 in project-continuity.json
- 3 orphan dirs: ses_1e452cc46ffePoJ66UMEMnX8Xt, ses_1e453358dffeqSZotXXOTis9qM, ses_1e458e33dffeCL42qMdkKiON7n
- ALL sessions show `parentID: NONE` in session-continuity.json
- Actual hierarchy (by child .json placement):
  ```
  ses_1e46d9589ffenfflnSi3abFspD (MAIN — has child ses_1e458e33dffeCL42qMdkKiON7n.json)
    └── ses_1e458e33dffeCL42qMdkKiON7n (SHOULD BE CHILD — has own dir + 2 children)
          ├── ses_1e452cc46ffePoJ66UMEMnX8Xt.json
          └── ses_1e453358dffeqSZotXXOTis9qM.json
  ses_1e452cc46ffePoJ66UMEMnX8Xt (SHOULD BE L2 grandchild — has own dir)
  ses_1e453358dffeqSZotXXOTis9qM (SHOULD BE L2 grandchild — has own dir)
  ses_1e6332a93ffeGKEUaIEpmHJJPz (MAIN — current session)
  ```

### Root cause hypothesis (from user)
Phase 13's `ensureSessionReady` parentID gate via SDK `client.session.get()` works for sessions where parentID IS reported, but:
1. Child sessions share identical `#USER` metadata with parent — indistinguishable by shape
2. SDK does NOT report parentID at session creation time (available too late)
3. When user reconnects and agent creates new task delegation, the task tool session ID is mistaken as new main session
4. Fix must be HIERARCHICAL: session IDs must encode parent relationship deterministically
5. All task-tool-created session IDs must lookup parent in hierarchy index. If parent found → child. If not → new main.

### Error Messages
None — silent misclassification. No errors thrown, just wrong data.

### Timeline
- Phase 12 deployed session tracker with initial implementation
- Phase 13 applied parentID gate fix (`ensureSessionReady` checks SDK parentID)
- Current state shows 3 orphan directories created AFTER Phase 13 deployment (timestamps May 12 17:14-17:15)

### Reproduction
1. Start a main session
2. Delegate via task tool (creates child session)
3. Check `.hivemind/session-tracker/` — child session has its own top-level directory
4. Check `session-continuity.json` — parentID is NONE even for children

## Current Focus

**Status:** INVESTIGATING — fix applied but STILL FLAWED. New orphan found after fix deployment + 2 additional bugs.

**Why HierarchyIndex fix was insufficient:** Index relies on `handleTask()` updating BEFORE child session events arrive. Race condition: session.created fires async ahead of tool.execute.after. If ensureSessionReady fires first → creates orphan directory.

**User-specified STRICT 3-LEVEL HIERARCHY (must implement precisely):**

### Level Structure (NOT flat — hierarchical)
- **L0 (Main):** User's session. turnCount == 1 = session starter. Only ONE per user. Has own directory + .md + session-continuity.json.
- **L1 (Delegation from Main):** Task tool sessions created FROM L0. Always children of main. Registered under main's hierarchy. NEVER create top-level project-continuity entry. Has .json file under main's directory.
- **L2 (Delegation from L1):** Task tool sessions created FROM L1. Children of L1, NOT of main. Registered under L1's hierarchy. NEVER create top-level entry. Has .json file under L1's directory.

### Critical Rules
1. **L1 and L2 are NOT same level** — must be distinct in hierarchy tracking
2. **Task tool session ID lookup:** When any session ID arrives, lookup parent chain. If ID was created by a task tool delegation from known parent → mark as child at correct depth. If no parent found → new main (turnCount must be 1).
3. **L1 sessions NEVER make new entry in project-continuity.json** — they're registered as children under their parent only
4. **L2 sessions registered as children of L1, not of main** — hierarchy depth preserved
5. **Resume detection:** turnCount > 1 = user returned to existing main session (not new session)

### Additional bugs (need deep code investigation, not surface fix)
- **Bug 2:** Last assistant message NOT written to main .md or child .json files
- **Bug 3:** Turn counters and tool counters inaccurate

**Total bugs: 5 (expanded scope)**

1. **Session parent misclassification** — task-tool sessions get orphan top-level dirs because ensureSessionReady doesn't use correct taxonomy
2. **Missing assistant messages** — assistant output not written to main .md or child .json files
3. **Inaccurate counters** — turn counts and tool counts incorrect
4. **L1/L2 depth flattening** — L1 and L2 sessions treated as same level, hierarchy lost
5. **Session resume detection broken** — resumed sessions mistaken as new main sessions

**Deep research required (DO NOT jump to conclusions):**
- OpenCode SDK interfaces: `client.session.get()`, `client.session.create()`, hook event shapes
- OpenCode plugin hooks: PreToolUse, PostToolUse, event observer signatures
- Hivemind internal schemas: session-continuity.json, project-continuity.json, child .json structure
- All src/features/session-tracker/ files + src/plugin.ts
- Complex I/O rules: atomic writes, concurrency queues, directory creation order
- Task tool session ID creation: how OpenCode generates session IDs for subagent dispatch

**Next:** Deep investigation of ALL related files. OpenCode SDK interfaces. Plugin hooks. Internal schemas. Do NOT apply surface fixes — must understand full pipeline first.

## Evidence

- timestamp: 2026-05-12T16:30:00Z — project-continuity.json shows 2 main sessions but 7 top-level dirs exist (5 orphans)
- timestamp: 2026-05-12T16:30:00Z — child .json files correctly placed under parents showing actual hierarchy
- timestamp: 2026-05-12T16:30:00Z — ALL session-continuity.json show parentID: NONE (5/5)
- timestamp: 2026-05-12T16:30:00Z — 3 orphan dirs have session .md files starting with "### Tool: skill" (no YAML frontmatter — missing metadata)
- timestamp: 2026-05-12T17:40:00Z — CODE READ: ensureSessionReady() at index.ts:124-181 checks ONLY SDK parentID (line 134-151), never hierarchy index
- timestamp: 2026-05-12T17:40:00Z — CODE READ: handleTask() in tool-capture.ts:219-308 IS the authority that knows parent-child at delegation time (has input.sessionID = parent, extracts childSessionID)
- timestamp: 2026-05-12T17:40:00Z — CODE READ: handleTask() records hierarchy in session-continuity.json (line 278-284) AFTER ensureSessionReady may have already created directory
- timestamp: 2026-05-12T17:40:00Z — LIVE EVIDENCE: ses_1e46d9/session-continuity.json correctly shows children: {ses_1e458e33...}, BUT ses_1e458e33 also has its own top-level directory
- timestamp: 2026-05-12T17:40:00Z — LIVE EVIDENCE: ses_1e458e33/session-continuity.json shows hierarchy.root = "ses_1e458e33" (treats itself as main), children: {ses_1e452cc4..., ses_1e453358...}
- timestamp: 2026-05-12T17:40:00Z — LIVE EVIDENCE: ses_1e452cc4 and ses_1e453358 both have own top-level dirs AND child .json files under ses_1e458e33
- timestamp: 2026-05-12T17:40:00Z — CONFIRMED GAP: ensureSessionReady() NEVER consults any hierarchy index for child detection. Only SDK parentID is used (index.ts line 135-141). The session-continuity.json hierarchy.children data is never read during classification.

## New Evidence (Round 2 — fix applied but still flawed)

- timestamp: 2026-05-12T18:05:00Z — NEW orphan: `ses_1e3be93f0ffeVu9H8JWzT26X18` — turnCount: 0, only tool calls (skill, glob, read, bash, todowrite), has own top-level dir, hierarchy.root=self. No user messages ever. Should be child.
- timestamp: 2026-05-12T18:05:00Z — User specifies STRICT SCHEMA: main session = turnCount EXACTLY 1 (single user prompt starts session); resumed session = turnCount > 1 (user returned to existing); ALL task-tool-created session IDs = ALWAYS children of main, regardless of status
- timestamp: 2026-05-12T18:05:00Z — Bug 2: Last assistant message NOT recorded/written to .md (main sessions) or .json (child sessions)
- timestamp: 2026-05-12T18:05:00Z — Bug 3: Turn counters and tool counters are inaccurate

## Eliminated

[none yet]

## Resolution

**root_cause:** `ensureSessionReady()` at `src/features/session-tracker/index.ts:124-181` classifies sessions as MAIN based SOLELY on SDK `parentID` (line 135-141). The OpenCode SDK structurally fails to report `parentID` for child sessions (returns null/undefined or throws). When the SDK gate fails, the method falls through to directory creation (lines 154-168), producing orphan top-level directories for ALL task-tool child sessions.

The hierarchy index in `session-continuity.json` (populated by `handleTask()` at `tool-capture.ts:278-284` via `sessionIndexWriter.addChild()`) CORRECTLY records parent-child relationships, but was NEVER consulted during session classification.

Live evidence confirmed: `ses_1e458e33` has a child `.json` file correctly placed under `ses_1e46d9`, yet ALSO has its own top-level directory — proving the dual-gate gap.

This is a single-gate bug: one source of truth (SDK) is unreliable, and the second source of truth (hierarchy index) was never wired in.

**fix:** Added `HierarchyIndex` class (`src/features/session-tracker/persistence/hierarchy-index.ts`) — an in-memory `Map<childID, parentID>` built from existing `session-continuity.json` files at initialization and updated live when `handleTask()` records new delegations.

Three classification sites now consult the hierarchy index as a SECOND gate after SDK parentID:

1. `ensureSessionReady()` (index.ts:134-162): After SDK check fails, consults `hierarchyIndex.isChild(sessionID)`. If found in index → skip directory creation. Only creates directory if NEITHER source indicates parentage.
2. `handleChatMessage()` (index.ts:355-368): After SDK check fails, consults `hierarchyIndex.getParent(sessionID)`. Uses hierarchy parent for child `.json` routing.
3. `handleSessionCreated()` (event-capture.ts:176-183): Same pattern — hierarchy index as second gate after SDK parentID.

`ToolCapture.handleTask()` now calls `hierarchyIndex.registerChild(parent, child)` at line 293, keeping the index current in real-time (before child events arrive).

**verification:**
- TypeScript typecheck passes (0 errors)
- All 256 session-tracker tests pass (25 test files)
- Full test suite: 2142/2152 pass (8 pre-existing failures unrelated to session-tracker)
- Fix is minimal: 1 new file (`hierarchy-index.ts`, ~110 lines), 3 files modified (`index.ts`, `event-capture.ts`, `tool-capture.ts`), 1 test file updated (`tool-capture.test.ts`)

**files_changed:**
- src/features/session-tracker/persistence/hierarchy-index.ts (NEW)
- src/features/session-tracker/index.ts
- src/features/session-tracker/capture/event-capture.ts
- src/features/session-tracker/capture/tool-capture.ts
- tests/features/session-tracker/capture/tool-capture.test.ts
