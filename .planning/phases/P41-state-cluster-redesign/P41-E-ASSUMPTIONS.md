# P41-E Assumptions

> Evidence-based assumptions for the P41-E session-delegation-query tool. Each assumption is tagged with its evidence source and confidence level.

---

## A1: `session-delegation-query` Can Be Registered Under `registerHivemindTools`

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase analysis]` `registerHivemindTools()` in `plugin.ts` (lines 163-174) takes `HivemindToolDeps` with only `projectDirectory: string`. The new tool needs exactly this dependency. All 8 existing hivemind tools follow the same `createXxxTool(projectRoot)` factory pattern. The tool would be added as a new entry in the returned record: `"session-delegation-query": createSessionDelegationQueryTool(deps.projectDirectory)`. |
| **Risk** | NONE: Standard registration pattern, no new dependencies needed. |

## A2: `hierarchy-manifest.json` Is the Canonical Index for Session-Tracker Delegations

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase analysis]` The `HierarchyManifest` interface (types.ts lines 148-161) defines `children: Record<string, HierarchyManifestChild>` — a flattened, keyed-by-sessionID index of all children. `HierarchyManifestChild` includes: `sessionID`, `parentSessionID`, `rootMainSessionID`, `delegationDepth`, `delegatedBy`, `subagentType`, `createdAt`, `updatedAt`, `status`, `turnCount`, `childFile`. This is exactly the data needed for the summary (list) action. The `delegation-status.ts` tool (lines 199-242) already reads `hierarchy-manifest.json` via `readManifest()` for its `getSessionTrackerChildren()` helper — proving this file is a viable read source. |
| **Risk** | LOW: The manifest is a derivative cache of the continuity tree (G-1), regenerated on read miss at `hierarchy-manifest.ts:290`. There is no scenario where a root session exists without a manifest — if the file is missing, it's regenerated from the continuity tree. |

## A3: `resolveSessionFile()` Resolves Child Session `.json` Files Reliably

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase analysis]` `resolveSessionFile()` (session-resolver.ts) scans all root main session directories via `project-continuity.json` → falls back to `readdir()` of `.hivemind/session-tracker/`. For each root, it reads `hierarchy-manifest.json` to find the child session, then reads the child `.json` file. This same resolution pattern is used by `delegation-status.ts`, `session-tracker.ts`, `session-hierarchy.ts`, and `hivemind-session-view.ts`. All read-children tool paths use this resolver. |
| **Risk** | LOW: Already proven in production across 4 tools. The fallback scan pattern covers the case where `project-continuity.json` is stale or missing. |

## A4: The `generateFromContinuity()` Fallback Is Safe for Read-Miss Scenarios

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase analysis]` `HierarchyManifestWriter.loadManifest()` (hierarchy-manifest.ts lines 276-296) already implements a read-miss fallback: if the manifest file is missing or unparseable, it calls `this.generateFromContinuity(rootMainSessionID)` which walks the continuity tree and generates a fresh manifest. The generated manifest is then written to disk as a cache optimization. The new tool can reuse this same pattern — or simply call `loadManifest()` through the existing `HierarchyManifestWriter.getChildren()` or `getChild()` methods. |
| **Risk** | LOW: Pattern is already implemented and tested. The derivative-generation runs in the error handler of `loadManifest()`, meaning it only activates when the manifest file is genuinely missing — never on the hot path. |

## A5: `session-delegation-query` Does Not Duplicate Existing Tool Functionality

| Property | Value |
|----------|-------|
| **Confidence** | MEDIUM |
| **Evidence** | `[VERIFIED: codebase analysis]` Overlap analysis:
- `delegation-status list` (line 569-604) reads from 3 sources (manager, persisted, tracker) and merges them. It returns `Delegation[]` — not a focused hierarchy-manifest summary. It does NOT support `offset`/`limit` pagination (no slicing on server side, just `filtered.length` for total). It does NOT support filters like `agentType`, `delegatedBy`, `minDepth`, `maxDepth`, `updatedAfter`/`updatedBefore`. It returns ~30 fields per delegation including `result`, `error`, `prompt` — many irrelevant for a summary browse.
- `session-hierarchy get-manifest` (line 209-283) reads `hierarchy-manifest.json` but returns the raw manifest with ALL children — no pagination, no filtering by status/agent/depth/time. It does NOT support drill-down to a single child's full record. It's a "dump everything" action.
- `session-tracker filter-sessions` (line 339-422) supports filtering by status, agentType, minDepth, maxDepth, timeRange — but returns only metadata fields (sessionId, status, agentType, depth, lastUpdated). It does NOT return delegatedBy, turnCount, createdAt, or any `ChildSessionRecord` fields. It does NOT support pagination with offset/limit (uses a hard `limit` slice).
- **Gap:** No existing tool provides ALL of: paginated list with offset/limit, filters on 5 dimensions, summary fields from `HierarchyManifestChild`, drill-down to full `ChildSessionRecord` with turn summary (not full turns), and explicit progressive disclosure guidance. The new tool fills this gap.
| **Risk** | MEDIUM: There is overlap with `filter-sessions` (both support status/agentType/depth/time filters). The key differentiator is pagination (offset/limit) and richer output fields. If a user calls both `filter-sessions` and the new `list`, the `list` action returns more fields per entry including `delegatedBy`, `turnCount`, `createdAt`. This is additive overlap, not conflicting. |

## A6: Schema File Should Be Added to `schema-kernel/`

| Property | Value |
|----------|-------|
| **Confidence** | MEDIUM |
| **Evidence** | `[ASSUMED]` Following the pattern of `session-tracker.schema.ts` and `session-view.schema.ts`, the new tool should have a dedicated schema file at `src/schema-kernel/session-delegation-query.schema.ts`. This keeps Zod contracts co-located and discoverable. The schema should use `safeSessionId` (already exported from `session-tracker.schema.ts`) for session ID validation. However, since the tool actions are simpler (only `list` and `get`), the schema could alternatively be inlined in the tool file. The schema-kernel pattern is preferred for consistency and testability. |
| **Risk** | LOW: Either approach works. Inline schemas are used by `delegation-status.ts` (line 33-39) and are equally valid. Schema-kernel placement enables easier unit testing of input validation. |

## A7: The `list` Action Must Scan Multiple Root Session Directories

| Property | Value |
|----------|-------|
| **Confidence** | HIGH |
| **Evidence** | `[VERIFIED: codebase analysis]` The `session-tracker filter-sessions` tool (lines 339-398) already demonstrates the pattern for scanning all root session directories: read `sessionTrackerRoot(projectRoot)` → `readdir()` → filter `ses_*` directories → read each session's `hierarchy-manifest.json` → collect children → apply filters. The new tool's `list` action should follow this same directory-scanning pattern but add pagination (offset/limit) and return richer `HierarchyManifestChild` fields. |
| **Risk** | LOW: Proven pattern exists in `filter-sessions`. Pagination adds `offset` slicing after filter application. For efficiency, if `rootSessionId` is specified, only that one directory needs scanning (much faster). |
