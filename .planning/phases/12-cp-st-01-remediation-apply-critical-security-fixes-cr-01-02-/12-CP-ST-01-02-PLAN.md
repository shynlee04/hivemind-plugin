---
phase: "12-cp-st-01-remediation"
plan: 2
type: execute
wave: 2
depends_on: ["12-CP-ST-01-01"]
files_modified:
  - src/tools/hivemind/session-tracker.ts
  - src/tools/hivemind/session-hierarchy.ts
  - src/tools/hivemind/session-context.ts
  - src/schema-kernel/session-tracker.schema.ts
  - src/plugin.ts
autonomous: true
requirements:
  - REQ-ST-01
  - REQ-ST-06
  - REQ-ST-07
  - REQ-ST-08
  - REQ-ST-10
  - REQ-ST-12

must_haves:
  truths:
    - "Agents can export full session .md content via session-tracker with export-session action"
    - "Agents can list all sessions (directory-scanning fallback when index is stale)"
    - "Agents can search sessions by keyword via session-tracker with search-sessions action"
    - "Agents can query child/parent hierarchy via session-hierarchy with get-children and get-parent-chain actions"
    - "Agents can find related sessions via session-context with find-related action"
    - "All three tools reject path traversal attempts (safeSessionPath + isValidSessionID guards)"
    - "Each tool is ≤200 LOC (C4 compliance) and kebab-case"
    - "All tool Zod schemas validate session IDs at boundary"
  artifacts:
    - path: "src/tools/hivemind/session-tracker.ts"
      provides: "Export/list/search/status/summary tool (≤200 LOC)"
      min_lines: 100
      max_lines: 200
    - path: "src/tools/hivemind/session-hierarchy.ts"
      provides: "Child/parent navigation tool (≤200 LOC, NEW)"
      min_lines: 80
      max_lines: 200
    - path: "src/tools/hivemind/session-context.ts"
      provides: "Cross-session synthesis tool (≤200 LOC, NEW)"
      min_lines: 80
      max_lines: 200
    - path: "src/schema-kernel/session-tracker.schema.ts"
      provides: "Zod schemas for all three tools with session ID refinement"
      contains: "refine"
  key_links:
    - from: "src/plugin.ts"
      to: "src/tools/hivemind/session-tracker.ts"
      via: "tool registration"
      pattern: "session-tracker.*createSessionTrackerTool"
    - from: "src/plugin.ts"
      to: "src/tools/hivemind/session-hierarchy.ts"
      via: "tool registration"
      pattern: "session-hierarchy.*createSessionHierarchyTool"
    - from: "src/plugin.ts"
      to: "src/tools/hivemind/session-context.ts"
      via: "tool registration"
      pattern: "session-context.*createSessionContextTool"
    - from: "src/tools/hivemind/session-tracker.ts"
      to: "src/features/session-tracker/persistence/atomic-write.ts"
      via: "safeSessionPath import"
      pattern: "safeSessionPath"
---

<objective>
Replace the single action-dispatched `session-tracker` tool with three domain-focused tools per CUSTOM-TOOLS-CRITERIA (D-08, D-09): `session-tracker` (export/list/search/status/summary), `session-hierarchy` (child/parent navigation), `session-context` (cross-session synthesis). Fix all 6 tool gaps (GAP-01 through GAP-06) identified in the current tool surface. Each tool ≤200 LOC (C4), kebab-case, with Zod-validated inputs and `safeSessionPath()` guards.

**Purpose:** Give agents queryable access to session knowledge data with proper safety boundaries and focused, composable tool surfaces. Backward-compatible with existing action names.

**Output:** 3 tool files + 1 updated schema file + plugin.ts registration update. All tools discoverable after `npm run build`.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/execute-plan.md
@.agent/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md (sections 2 and 3 — tool redesign analysis)
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/03-TOOL-GAPS.md
@.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md
@src/tools/hivemind/session-tracker.ts (current tool — being rewritten)
@src/plugin.ts (tool registration patterns)
@src/shared/tool-response.ts (response envelope)
</context>

<tasks>

<!-- ========================================================================= -->
<!-- T-01: Rewrite session-tracker tool with expanded actions + fix all GAPs   -->
<!-- ========================================================================= -->
<task type="implement" id="T-01">
  <name>Task 1: Rewrite session-tracker tool (GAP-01, GAP-02, GAP-03, GAP-05, GAP-06)</name>
  <depends_on></depends_on>
  <files>
    - src/tools/hivemind/session-tracker.ts
    - src/schema-kernel/session-tracker.schema.ts
  </files>
  <read_first>
    - src/tools/hivemind/session-tracker.ts (reason: current tool — being rewritten entirely)
    - src/schema-kernel/session-tracker.schema.ts (reason: current schema — being rewritten)
    - src/shared/tool-response.ts (reason: success() / error() signature)
    - src/shared/tool-helpers.ts (reason: renderToolResult signature)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: sessionTrackerRoot, safeSessionPath)
    - src/features/session-tracker/types.ts (reason: isValidSessionID)
    - src/tools/hivemind/hivemind-doc.ts (reason: reference template for ≤200 LOC tool with Zod)
    - src/plugin.ts line 183 (reason: current registration to update)
  </read_first>
  <action>
    Rewrite `src/tools/hivemind/session-tracker.ts` from scratch. Delete all content and write:

    **New tool structure:**
    ```typescript
    import { tool } from "@opencode-ai/plugin/tool"
    import { readFile, readdir, stat, access } from "node:fs/promises"
    import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
    import { isValidSessionID } from "../../features/session-tracker/types.js"
    import { success, error } from "../../shared/tool-response.js"
    import { renderToolResult } from "../../shared/tool-helpers.js"
    ```

    **5 actions:**
    1. `export-session` — Same as current, but with `safeSessionPath()` + `isValidSessionID()` before path construction (fixes GAP-01). Returns full .md content. Uses async `readFile`. Requires `sessionId`.
    2. `list-sessions` — Directory-scanning fallback when `project-continuity.json` index is stale (fixes GAP-06). Falls back to `readdir(trackerRoot)` scanning directories starting with `ses_`. Returns session IDs, statuses from individual `session-continuity.json` files.
    3. `search-sessions` — Same as current, but with `safeSessionPath()` + `isValidSessionID()` per-directory (fixes GAP-03). Replace `existsSync` with `access().then(() => true).catch(() => false)` (fixes GAP-02). Replace `statSync` with `stat()`.
    4. `get-status` — NEW. Reads `session-continuity.json` for a specific session, returns `status`, `lastUpdated`, `turnCount`, `childCount`, `toolSummary`.
    5. `get-summary` — NEW. Returns frontmatter only from .md file (using gray-matter), skipping full body. Efficient for agents that need metadata without 200KB+ of content.

    **Zod schema (rewrite `src/schema-kernel/session-tracker.schema.ts`):**
    ```typescript
    import { z } from "zod"

    const safeSessionId = z.string().min(1).refine(
      (id) => !id.includes("/") && !id.includes("..") && !id.includes("\\"),
      { message: "sessionId must not contain path separators or traversal sequences" }
    )

    export const SessionTrackerInputSchema = z.discriminatedUnion("action", [
      z.object({ action: z.literal("export-session"), sessionId: safeSessionId, format: z.enum(["markdown", "json"]).optional().default("markdown") }),
      z.object({ action: z.literal("get-status"), sessionId: safeSessionId }),
      z.object({ action: z.literal("get-summary"), sessionId: safeSessionId }),
      z.object({ action: z.literal("list-sessions"), limit: z.number().min(1).max(100).optional().default(20) }),
      z.object({ action: z.literal("search-sessions"), query: z.string().min(1), limit: z.number().min(1).max(100).optional().default(20) }),
    ])
    ```

    **Critical path safety rule (enforced in ALL handlers):**
    ```typescript
    if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
    const safeDir = safeSessionPath(projectRoot, sessionId, "")
    const safeFilePath = safeSessionPath(projectRoot, sessionId, `${sessionId}.md`)
    ```
    NEVER use `resolve(trackerRoot, sessionId, ...)` directly. Always through `safeSessionPath()`.
  </action>
  <acceptance_criteria>
    - `grep "safeSessionPath" src/tools/hivemind/session-tracker.ts` returns at least 4 matches (all 5 handlers that use paths)
    - `grep "isValidSessionID" src/tools/hivemind/session-tracker.ts` returns at least 4 matches (export-session, get-status, get-summary, search-sessions handlers)
    - `grep "statSync\|existsSync" src/tools/hivemind/session-tracker.ts` returns ZERO matches (all async — GAP-02 fixed)
    - `grep "resolve.*trackerRoot.*sessionId" src/tools/hivemind/session-tracker.ts` returns ZERO matches (no raw resolve — GAP-01 fixed)
    - `grep "get-status\|get-summary" src/tools/hivemind/session-tracker.ts` returns matches (new actions)
    - `grep "refine\|includes.*\\\"/\\\"\|includes.*\\\"..\\\"" src/schema-kernel/session-tracker.schema.ts` returns match (Zod refinement)
    - `wc -l src/tools/hivemind/session-tracker.ts` is ≤ 200 LOC
    - `npx vitest run tests/tools/hivemind/session-tracker.test.ts` passes
    - `npm run typecheck` passes
    - `npm run build` succeeds
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

<!-- ========================================================================= -->
<!-- T-02: Create session-hierarchy tool (NEW)                                 -->
<!-- ========================================================================= -->
<task type="implement" id="T-02">
  <name>Task 2: Create session-hierarchy tool (NEW — child/parent navigation)</name>
  <depends_on></depends_on>
  <files>
    - src/tools/hivemind/session-hierarchy.ts
    - src/schema-kernel/session-tracker.schema.ts
  </files>
  <read_first>
    - src/tools/hivemind/session-tracker.ts (reason: existing tool patterns for structure reference)
    - src/tools/hivemind/hivemind-doc.ts (reason: reference template for new tool factory pattern)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: safeSessionPath, sessionTrackerRoot)
    - src/features/session-tracker/types.ts (reason: isValidSessionID, SessionContinuityIndex type)
    - src/shared/tool-response.ts (reason: success/error signatures)
    - src/shared/tool-helpers.ts (reason: renderToolResult)
    - src/plugin.ts (reason: where to add registration)
  </read_first>
  <action>
    Create NEW file `src/tools/hivemind/session-hierarchy.ts` (≤160 LOC):

    **3 actions:**
    1. `get-children` — Reads parent session's `session-continuity.json`, returns `hierarchy.children` with each child's status, depth, delegatedBy, and childFile. Requires `sessionId`.
    2. `get-parent-chain` — Walks `parent_session_id` field from each session's `session-continuity.json` up to root. Returns ordered array [{sessionId, status, depth}, ...].
    3. `get-delegation-depth` — Returns the max delegation depth under the given session (recursive walk of children's children). Returns single number.

    **Structure (follow existing tool pattern):**
    ```typescript
    import { tool } from "@opencode-ai/plugin/tool"
    import { readFile } from "node:fs/promises"
    import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
    import { isValidSessionID } from "../../features/session-tracker/types.js"
    import { success, error } from "../../shared/tool-response.js"
    import { renderToolResult } from "../../shared/tool-helpers.js"

    export function createSessionHierarchyTool(projectRoot: string) {
      const s = tool.schema
      return tool({
        description: "Navigate session delegation hierarchy...",
        args: {
          action: s.enum(["get-children", "get-parent-chain", "get-delegation-depth"]),
          sessionId: s.string(),
          includeStatus: s.boolean().optional().default(true),
        },
        async execute(rawArgs) { ... }
      })
    }
    ```

    **Zod schema:** Extend `session-tracker.schema.ts` to add:
    ```typescript
    export const SessionHierarchyInputSchema = z.discriminatedUnion("action", [
      z.object({ action: z.literal("get-children"), sessionId: safeSessionId, includeStatus: z.boolean().optional().default(true) }),
      z.object({ action: z.literal("get-parent-chain"), sessionId: safeSessionId }),
      z.object({ action: z.literal("get-delegation-depth"), sessionId: safeSessionId }),
    ])
    ```

    **Data sources:**
    - `get-children`: reads `.hivemind/session-tracker/{sessionId}/session-continuity.json` → `hierarchy.children`
    - `get-parent-chain`: reads `session-continuity.json` → `parentSessionID` field, then loops up
    - `get-delegation-depth`: recursive walk of `hierarchy.children`, returns `Math.max(0, ...children.map(c => 1 + getDepth(c)))`

    **Path safety:**
    ```typescript
    if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID`))
    const indexPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
    ```
  </action>
  <acceptance_criteria>
    - `grep "get-children" src/tools/hivemind/session-hierarchy.ts` returns match
    - `grep "get-parent-chain" src/tools/hivemind/session-hierarchy.ts` returns match
    - `grep "get-delegation-depth" src/tools/hivemind/session-hierarchy.ts` returns match
    - `grep "safeSessionPath" src/tools/hivemind/session-hierarchy.ts` returns at least 1 match
    - `grep "isValidSessionID" src/tools/hivemind/session-hierarchy.ts` returns at least 1 match
    - `wc -l src/tools/hivemind/session-hierarchy.ts` is ≤ 160 LOC
    - `npx vitest run tests/tools/hivemind/session-hierarchy.test.ts` passes (test file must exist — create in Wave 2 task)
    - `npm run typecheck` passes
    - `npm run build` succeeds
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

<!-- ========================================================================= -->
<!-- T-03: Create session-context tool (NEW)                                   -->
<!-- ========================================================================= -->
<task type="implement" id="T-03">
  <name>Task 3: Create session-context tool (NEW — cross-session synthesis)</name>
  <depends_on></depends_on>
  <files>
    - src/tools/hivemind/session-context.ts
    - src/schema-kernel/session-tracker.schema.ts
  </files>
  <read_first>
    - src/tools/hivemind/session-tracker.ts (reason: existing tool patterns for structure reference)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: safeSessionPath, sessionTrackerRoot)
    - src/features/session-tracker/types.ts (reason: isValidSessionID, ProjectContinuityIndex type)
    - src/shared/tool-response.ts (reason: success/error signatures)
    - src/shared/tool-helpers.ts (reason: renderToolResult)
    - src/tools/hivemind/hivemind-doc.ts (reason: reference for ≤200 LOC tool)
  </read_first>
  <action>
    Create NEW file `src/tools/hivemind/session-context.ts` (≤180 LOC):

    **3 actions:**
    1. `find-related` — Scans `project-continuity.json` for sessions sharing: same agent types used, similar tool usage patterns (from `toolSummary`), or time proximity (±30 min `created` window). Returns ranked list with relevance scores. Requires `sessionId`.
    2. `cross-reference` — Searches ALL child `.json` files across the project for a specific tool name or agent name. Returns matching child sessions with context. Requires `sessionId` (as reference point) + optional `query` (tool name or agent name).
    3. `synthesize-context` — Produces a compact markdown summary of a session: frontmatter + child session tree + tool usage summary + turn count + status. Designed for agent re-consumption after context compaction.

    **Structure:**
    ```typescript
    import { tool } from "@opencode-ai/plugin/tool"
    import { readFile, readdir } from "node:fs/promises"
    import { safeSessionPath, sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
    import { isValidSessionID } from "../../features/session-tracker/types.js"
    import { success, error } from "../../shared/tool-response.js"
    import { renderToolResult } from "../../shared/tool-helpers.js"
    ```

    **Zod schema (extend session-tracker.schema.ts):**
    ```typescript
    export const SessionContextInputSchema = z.discriminatedUnion("action", [
      z.object({ action: z.literal("find-related"), sessionId: safeSessionId, maxRelated: z.number().min(1).max(50).optional().default(10) }),
      z.object({ action: z.literal("cross-reference"), sessionId: safeSessionId, query: z.string().min(1).optional() }),
      z.object({ action: z.literal("synthesize-context"), sessionId: safeSessionId }),
    ])
    ```

    **Data sources:**
    - `find-related`: reads `project-continuity.json` → iterates `sessions` → checks `toolSummary` overlap
    - `cross-reference`: walks `readdir(trackerRoot)` → finds child `.json` files → searches for query in tool names or agent names
    - `synthesize-context`: reads `.md` frontmatter (via gray-matter) + `session-continuity.json` + child `.json` statuses → produces markdown

    **Path safety:** Same pattern as T-01 and T-02 — `isValidSessionID()` + `safeSessionPath()` before every path operation.
  </action>
  <acceptance_criteria>
    - `grep "find-related" src/tools/hivemind/session-context.ts` returns match
    - `grep "cross-reference" src/tools/hivemind/session-context.ts` returns match
    - `grep "synthesize-context" src/tools/hivemind/session-context.ts` returns match
    - `grep "safeSessionPath" src/tools/hivemind/session-context.ts` returns at least 1 match
    - `grep "isValidSessionID" src/tools/hivemind/session-context.ts` returns at least 1 match
    - `wc -l src/tools/hivemind/session-context.ts` is ≤ 180 LOC
    - `npx vitest run tests/tools/hivemind/session-context.test.ts` passes (test file must exist — create in Wave 2 task)
    - `npm run typecheck` passes
    - `npm run build` succeeds
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

<!-- ========================================================================= -->
<!-- T-04: Wire tools in plugin.ts + verify discovery                         -->
<!-- ========================================================================= -->
<task type="implement" id="T-04">
  <name>Task 4: Register all 3 tools in plugin.ts and verify discovery</name>
  <depends_on>T-01, T-02, T-03</depends_on>
  <files>src/plugin.ts</files>
  <read_first>
    - src/plugin.ts (reason: current tool registration at line 183, imports at line 38)
    - src/tools/hivemind/session-tracker.ts (reason: verify createSessionTrackerTool export)
    - src/tools/hivemind/session-hierarchy.ts (reason: verify createSessionHierarchyTool export)
    - src/tools/hivemind/session-context.ts (reason: verify createSessionContextTool export)
  </read_first>
  <action>
    In `src/plugin.ts`:

    **Step 1 — Add imports** (near line 38, after existing session-tracker import):
    ```typescript
    import { createSessionTrackerTool } from "./tools/hivemind/session-tracker.js"
    import { createSessionHierarchyTool } from "./tools/hivemind/session-hierarchy.js"   // NEW
    import { createSessionContextTool } from "./tools/hivemind/session-context.js"        // NEW
    ```

    **Step 2 — Update tool registrations** (near line 183):
    Replace the single registration:
    ```typescript
    // Before:
    "session-tracker": createSessionTrackerTool(projectDirectory),

    // After:
    "session-tracker": createSessionTrackerTool(projectDirectory),
    "session-hierarchy": createSessionHierarchyTool(projectDirectory),    // NEW
    "session-context": createSessionContextTool(projectDirectory),         // NEW
    ```

    **Step 3 — Verify:**
    ```bash
    npm run build && npm run typecheck
    ```

    Ensure all three tools are registered in the `tools` object under `createTools()`.
    Remove any references to the OLD single-action dispatched tool if they still exist (the tool is being rewritten, not deleted).

    **Note:** Keep the existing `session-tracker` key — the tool is being rewritten (not removed). The new `session-hierarchy` and `session-context` are net-new registrations.
  </action>
  <acceptance_criteria>
    - `grep "session-hierarchy" src/plugin.ts` returns match (import + registration)
    - `grep "session-context" src/plugin.ts` returns match (import + registration)
    - `grep "createSessionHierarchyTool" src/plugin.ts` returns match
    - `grep "createSessionContextTool" src/plugin.ts` returns match
    - `npm run typecheck` passes
    - `npm run build` succeeds
  </acceptance_criteria>
  <autonomous>true</autonomous>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Agent input → tool Zod schema | Untrusted session IDs enter tool boundary — validated by Zod refinement |
| Zod-validated sessionId → filesystem path | safeSessionPath() is the only path constructor — no raw resolve() |
| Tool output → agent context | Session data returned to agents — no mutation authority, read-only |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-07 | Tampering | session-tracker.ts handleExportSession (GAP-01, CR-02) | mitigate | Zod schema validates sessionId with `.refine()` rejecting "/", "..", "\\". Handler applies safeSessionPath() before ANY path construction. Never uses raw resolve(trackerRoot, sessionId, ...). |
| T-12-08 | Tampering | session-hierarchy.ts all handlers | mitigate | Same pattern: isValidSessionID() + safeSessionPath() before every readFile call. Zod refinement at boundary. |
| T-12-09 | Tampering | session-context.ts all handlers | mitigate | Same pattern: isValidSessionID() + safeSessionPath(). Directory scanning uses readdir() on safeSessionRoot, individual paths through safeSessionPath(). |
| T-12-10 | Information Disclosure | session-tracker.ts export-session | accept | Returns session .md content to requesting agent — by design (tool is read-only query). Content is session knowledge, not system secrets. Accept as intended exposure. |
| T-12-11 | Denial of Service | session-tracker.ts search-sessions (statSync) | mitigate | Replace blocking statSync/existsSync with async node:fs/promises equivalents to prevent event loop blockage. |
</threat_model>

<verification>
Wave 2 completion gate:
1. `npm run typecheck` — passes (zero errors)
2. `npm run build` — succeeds (all 3 tools compiled into dist/)
3. `grep -r "resolve.*trackerRoot.*sessionId" src/tools/hivemind/` returns ZERO matches (path traversal eliminated)
4. `grep -r "statSync\|existsSync" src/tools/hivemind/` returns ZERO matches (all async I/O)
5. `wc -l src/tools/hivemind/session-tracker.ts` ≤ 200 LOC
6. `wc -l src/tools/hivemind/session-hierarchy.ts` ≤ 160 LOC
7. `wc -l src/tools/hivemind/session-context.ts` ≤ 180 LOC
8. All 3 tools registered in plugin.ts tools object
9. Zod schemas have .refine() on sessionId for path safety
10. Backward-compatible: existing `action: "export-session"`, `"list-sessions"`, `"search-sessions"` still work
</verification>

<success_criteria>
1. GAP-01 (CR-02): Path traversal fixed — all path construction uses safeSessionPath() + Zod refinement
2. GAP-02: No blocking I/O — all file ops use async node:fs/promises
3. GAP-03: Session ID validation at tool boundary — Zod schema refines before handler logic
4. GAP-04: Missing query actions added — get-status, get-summary, get-children, get-parent-chain, get-delegation-depth, find-related, cross-reference, synthesize-context
5. GAP-05: Schema-level validation — Zod refinement on ALL sessionId inputs
6. GAP-06: Stale index fallback — list-sessions scans directories when index is stale
7. All 3 tools ≤200 LOC (C4 compliance)
8. All 3 tools discoverable after build (C7 compliance)
9. Backward-compatible with existing tool action names
</success_criteria>

<output>
After completion, create `.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-02-SUMMARY.md`
</output>
