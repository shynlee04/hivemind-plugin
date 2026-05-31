---
phase: P41-E
plan: 01
type: execute
wave: 1
depends_on: [P41-D-01, P41-D-02, P41-D-03]
files_modified:
  - src/schema-kernel/session-delegation-query.schema.ts
  - src/tools/session/session-delegation-query.ts
  - src/plugin.ts
autonomous: true
requirements: [REQ-P41E-01, REQ-P41E-02, REQ-P41E-03, REQ-P41E-04]

must_haves:
  truths:
    - "Agent can call session-delegation-query with list action to get paginated delegation summaries"
    - "Agent can call session-delegation-query with get action to drill into a single delegation's detail"
    - "Tool reads exclusively from hierarchy-manifest.json and child session .json files"
    - "Tool does NOT import from delegation-persistence.ts or DelegationManager"
    - "Existing tools (delegation-status, session-tracker, session-hierarchy, hivemind-session-view) remain unmodified"
    - "Tool is registered in plugin.ts under registerHivemindTools()"
  artifacts:
    - path: "src/schema-kernel/session-delegation-query.schema.ts"
      provides: "Zod schemas for list and get input validation"
      min_lines: 80
    - path: "src/tools/session/session-delegation-query.ts"
      provides: "session-delegation-query tool implementation with list/get handlers"
      min_lines: 200
    - path: "src/plugin.ts"
      provides: "Tool registration — import + registerSessionTools entry"
      min_lines: 1
  key_links:
    - from: "src/tools/session/session-delegation-query.ts"
      to: "src/features/session-tracker/types.ts"
      via: "import HierarchyManifest types"
      pattern: "import.*from.*types"
    - from: "src/tools/session/session-delegation-query.ts"
      to: "src/features/session-tracker/persistence/atomic-write.ts"
      via: "import safeSessionPath"
      pattern: "import.*safeSessionPath"
    - from: "src/tools/session/session-delegation-query.ts"
      to: "src/tools/session/session-resolver.ts"
      via: "import resolveSessionFile"
      pattern: "import.*resolveSessionFile"
    - from: "src/plugin.ts"
      to: "src/tools/session/session-delegation-query.ts"
      via: "import createSessionDelegationQueryTool"
      pattern: "createSessionDelegationQuery"
---

<objective>
Create the progressive-disclosure session-delegation-query tool with list (paginated summary) and get (detail drill-down) actions.

**Purpose:** Provide a fast, paginated, session-tracker-only query path for browsing delegation history — complementary to delegation-status, session-tracker, session-hierarchy, and hivemind-session-view.

**Output:**
- `src/schema-kernel/session-delegation-query.schema.ts` — Zod schemas for list and get actions
- `src/tools/session/session-delegation-query.ts` — Tool implementation
- Registered in `plugin.ts` under `registerHivemindTools()`
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/apple/hivemind-plugin-private/.planning/phases/P41-state-cluster-redesign/P41-E-SPEC.md
@/Users/apple/hivemind-plugin-private/.planning/phases/P41-state-cluster-redesign/P41-E-RESEARCH.md
@/Users/apple/hivemind-plugin-private/src/plugin.ts
@/Users/apple/hivemind-plugin-private/src/tools/session/session-hierarchy.ts
@/Users/apple/hivemind-plugin-private/src/schema-kernel/session-tracker.schema.ts
@/Users/apple/hivemind-plugin-private/src/tools/session/session-resolver.ts
@/Users/apple/hivemind-plugin-private/src/features/session-tracker/types.ts
@/Users/apple/hivemind-plugin-private/src/shared/tool-response.ts
@/Users/apple/hivemind-plugin-private/src/shared/tool-helpers.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create schema + tool implementation</name>
  <files>
    src/schema-kernel/session-delegation-query.schema.ts
    src/tools/session/session-delegation-query.ts
  </files>
  <action>
    Create two files:

    **A) `src/schema-kernel/session-delegation-query.schema.ts`**
    - Zod discriminated union with `list` and `get` actions
    - `list` action: rootSessionId (optional safeSessionId), status (optional string), agentType (optional string), delegatedBy (optional string), minDepth (optional number min 0), maxDepth (optional number min 0), updatedAfter (optional string), updatedBefore (optional string), offset (number min 0 default 0), limit (number min 1 max 100 default 20)
    - `get` action: sessionId (required safeSessionId)
    - Import `safeSessionId` from `session-tracker.schema.ts`
    - Export `SessionDelegationQueryInput` type

    **B) `src/tools/session/session-delegation-query.ts`**
    - Pattern: follows session-hierarchy.ts exactly (tool() wrapper, Zod parse, switch on action, renderToolResult(success/error))
    - Imports: `@opencode-ai/plugin/tool`, `node:fs/promises` (readFile), `node:path` (join), `safeSessionPath` and `sessionTrackerRoot` from atomic-write, `resolveSessionFile` from session-resolver, `isValidSessionID` and types from types.ts, `success`/`error` from tool-response.ts, `renderToolResult` from tool-helpers.ts
    - Per REQ-P41E-03: does NOT import from delegation-persistence.ts, DelegationManager, or any in-memory state
    - `handleList()`: 
      - Discover root sessions: if rootSessionId provided, use it directly; otherwise read project-continuity.json chronologicalOrder or fallback to readdir()
      - For each root session, read hierarchy-manifest.json via safeSessionPath() + readFile() + JSON.parse()
      - Filter entries by status, agentType (subagentType), delegatedBy, minDepth, maxDepth, updatedAfter, updatedBefore
      - Map to DelegationSummary: sessionID, rootMainSessionID, parentSessionID, subagentType, delegatedBy, status, delegationDepth, turnCount, childFile, createdAt, updatedAt
      - Sort by updatedAt descending
      - Apply offset/limit pagination
      - Return { delegations, total, offset, limit, hasMore: total > offset + limit }
      - If hierarchy-manifest.json missing for a root session, silently skip (not an error — valid state for sessions with no children)
      - Hard cap at 1000 total entries to prevent unbounded memory
    - `handleGet()`:
      - Call resolveSessionFile(projectRoot, sessionId)
      - If not resolved or not type "child" → error: "Session ID {x} not found in any hierarchy-manifest. Try `list` to discover available sessions."
      - Extract from childRecord: all ChildSessionRecord fields per REQ-P41E-02
      - Build turnSummary: iterate turns, count tool name frequencies, get first/last turn timestamps
      - Return full detail with children ids/count, lastMessage excerpt (first 500 chars), P41-B gap fields (queueKey, terminalKind, recoveryGuarantee, executionMode, lifecycle)
      - Include _note: "Journey entries and turns excluded — use session-tracker export-session for full content"
    - Export `createSessionDelegationQueryTool(projectRoot: string): ReturnType<typeof tool>`
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>
    Both schema file and tool implementation file exist with no type errors.
    Tool imports only from session-tracker types, atomic-write, session-resolver, tool-response, and tool-helpers.
    Tool does not import from delegation-persistence.ts or DelegationManager.
  </done>
</task>

<task type="auto">
  <name>Task 2: Register tool in plugin.ts</name>
  <files>src/plugin.ts</files>
  <action>
    Add to `registerHivemindTools()`:
    - Import `createSessionDelegationQueryTool` from `./tools/session/session-delegation-query.js`
    - Add entry: `"session-delegation-query": createSessionDelegationQueryTool(deps.projectDirectory)`
    - Do NOT modify any existing tool registration, import, or function signature
    - Per REQ-P41E-04: existing tools remain functional and unmodified
  </action>
  <verify>
    <automated>npm run typecheck</automated>
  </verify>
  <done>
    Tool registered in registerHivemindTools() with no changes to any existing tool registrations.
  </done>
</task>

<task type="auto">
  <name>Task 3: Gate verification</name>
  <files>src/plugin.ts</files>
  <action>
    Run full typecheck and test suite:
    ```
    npm run typecheck
    npm test
    ```
    If typecheck fails: fix reported errors and re-run.
    If tests fail: diagnose and fix before claiming completion.
  </action>
  <verify>
    <automated>npm run typecheck && npm test -- --reporter=verbose 2>&1 | tail -20</automated>
  </verify>
  <done>
    All typechecks pass and all tests pass.
  </done>
</task>

</tasks>

<verification>
1. `npm run typecheck` passes with zero errors
2. `npm test` passes with no regressions
3. No existing tool Zod schema, action enum, or execute handler modified
4. No import from delegation-persistence.ts or DelegationManager in the new tool
</verification>

<success_criteria>
- session-delegation-query tool registered and type-safe
- `list` action returns paginated delegation summaries from hierarchy-manifest.json
- `get` action returns full delegation detail from child .json files via resolveSessionFile()
- All 2,963+ existing tests pass
- Existing tools (delegation-status, session-tracker, session-hierarchy, hivemind-session-view) unchanged
</success_criteria>

<output>
Create `.planning/phases/P41-state-cluster-redesign/P41-E-01-SUMMARY.md` when done
</output>
