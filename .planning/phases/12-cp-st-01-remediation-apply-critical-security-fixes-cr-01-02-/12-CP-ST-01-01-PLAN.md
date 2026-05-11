---
phase: "12-cp-st-01-remediation"
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/session-tracker/capture/tool-capture.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/message-capture.ts
  - src/features/session-tracker/persistence/project-index-writer.ts
  - src/features/session-tracker/persistence/session-index-writer.ts
  - src/features/session-tracker/persistence/session-writer.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/types.ts
  - src/features/session-tracker/transform/agent-transform.ts
  - src/features/session-tracker/recovery/session-recovery.ts
  - src/plugin.ts
autonomous: true
requirements:
  - REQ-ST-01
  - REQ-ST-02
  - REQ-ST-04
  - REQ-ST-05
  - REQ-ST-06
  - REQ-ST-07
  - REQ-ST-08
  - REQ-ST-09
  - REQ-ST-10
  - REQ-ST-11
  - REQ-ST-12
  - REQ-ST-13

must_haves:
  truths:
    - "Project index lastUpdated advances after each session creation (no 7+ hour freeze)"
    - "project-continuity.json entries have numeric childCount (not undefined/absent)"
    - "handleRead never captures file content — errors logged as 'File read failed' string only"
    - "Child sessions receive lifecycle status updates (active → idle/completed/error)"
    - "Child session turn stems are captured to .json under parent subdirectory"
    - "Session turn counters seed from existing .md on restart (no duplicate turn 1)"
    - "Session hierarchy is fully nested (children of children tracked)"
    - "Legacy event-tracker state files are cleaned up on plugin startup"
    - "toolSummary is populated in session-continuity.json"
  artifacts:
    - path: "src/features/session-tracker/capture/tool-capture.ts"
      provides: "Fixed tool capture: childCount numeric, handleRead safe, toolSummary wired"
      min_lines: 300
    - path: "src/features/session-tracker/capture/event-capture.ts"
      provides: "Child session event routing via dedicated handler"
      min_lines: 280
    - path: "src/features/session-tracker/persistence/project-index-writer.ts"
      provides: "Recoverable serial queue with stale detection"
      min_lines: 260
    - path: "src/features/session-tracker/persistence/session-index-writer.ts"
      provides: "Fixed turnCount (not conflated with child additions)"
      min_lines: 200
    - path: "src/features/session-tracker/persistence/session-writer.ts"
      provides: "Race-condition-free frontmatter updates, static imports"
      min_lines: 200
    - path: "src/features/session-tracker/types.ts"
      provides: "Loosened session ID validation, path-safe"
      contains: "includes('/')"
  key_links:
    - from: "src/features/session-tracker/capture/event-capture.ts"
      to: "src/features/session-tracker/persistence/child-writer.ts"
      via: "childWriter.updateChildStatus() / childWriter.appendChildTurn()"
      pattern: "childWriter\\.(updateChildStatus|appendChildTurn)"
    - from: "src/features/session-tracker/index.ts"
      to: "src/plugin.ts"
      via: "cleanup() called after initialize()"
      pattern: "sessionTracker\\.cleanup\\(\\)"
    - from: "src/features/session-tracker/capture/tool-capture.ts"
      to: "src/features/session-tracker/persistence/session-index-writer.ts"
      via: "updateToolSummary() call in each tool handler"
      pattern: "sessionIndexWriter\\.updateToolSummary"
---

<objective>
Fix 14 writer-engine source defects across the session tracker capture pipeline and persistence layer. Unblock the frozen project index serial queue (DEFECT-02), then fix data integrity bugs, route child session lifecycle events through dedicated handlers, wire missing update calls, and patch path traversal vulnerabilities. All fixes are in dependency order: unblock pipeline first, then fix what flows through it.

**Purpose:** Restore the session tracker writer engine to functional state so project-continuity.json updates correctly, child sessions record complete lifecycle and turn data, file content is never captured, and the entire pipeline produces correct evidence for Wave 2 tool redesign and Wave 3 integration verification.

**Output:** 14 patched source files with passing scoped tests, all 163 existing tests remain green as regression baseline.
</objective>

<execution_context>
@.agent/get-shit-done/workflows/execute-plan.md
@.agent/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-RESEARCH.md
@.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/debug-session-analysis/02-SOURCE-DEFECTS.md
</context>

<tasks>

<!-- ========================================================================= -->
<!-- T-01: Unblock frozen serial queue (DEFECT-02 — BLOCKING, must run first)   -->
<!-- ========================================================================= -->
<task type="fix" id="T-01">
  <name>Task 1: Unblock frozen project index serial queue (DEFECT-02)</name>
  <depends_on></depends_on>
  <files>src/features/session-tracker/persistence/project-index-writer.ts</files>
  <read_first>
    - src/features/session-tracker/persistence/project-index-writer.ts (reason: exact current enqueueWrite implementation at line 234-241 — .catch() already exists, root cause may be I/O stall or no-enqueue)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: atomicWriteJson signature — used by all index writes)
    - tests/features/session-tracker/persistence/project-index-writer.test.ts (reason: existing test patterns for queue behavior)
  </read_first>
  <action>
    **DEFECT-02 fix — Project index `lastUpdated` frozen 7+ hours.**

    The `enqueueWrite` at line 234 already has a `.catch()` handler, so the queue should not be permanently stuck from unhandled rejection. The true root cause is likely one of:
    (a) The enqueued `fn()` never resolves (stuck I/O), or
    (b) Writes are simply never being queued (events not reaching the index writer).

    **Required changes (project-index-writer.ts):**

    1. Add a `private lastWriteTime: number = Date.now()` field to track when writes succeeded.
    2. Add a stale timeout constant: `private static readonly STALE_QUEUE_MS = 300_000 // 5 minutes`.
    3. Modify `enqueueWrite` to:
       - Record `this.lastWriteTime = Date.now()` inside the `.then(fn)` callback AFTER fn() completes (line 235, inside the then callback before the catch).
       - After the `.catch()` (line 240), add a `.then(() => {})` to ensure the promise chain always resolves to void.
       - Add a `detectStaleQueue()` check at the START of `enqueueWrite`: if `Date.now() - this.lastWriteTime > STALE_QUEUE_MS`, log a console.warn with `[Harness] Session tracker: project index write queue appears STALE — last successful write was more than 5 minutes ago`. Then RESET the queue by setting `this.writeQueue = Promise.resolve()`.
    4. In `enqueueWrite`, wrap `fn()` in `await fn()` (add `async` to the arrow callback at line 235 if not already async).
    5. Add a new public method: `async getQueueHealth(): Promise<{lastWriteTime: string, stalled: boolean}>`.

    **Verify behavior:** Write a NEW test file `tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts` that:
    - Creates a ProjectIndexWriter, adds a session (proves normal queue works)
    - Artificially sets `lastWriteTime` to 10 minutes ago and calls `addSession` again — verifies that stale detection warning fires AND the new write still succeeds
    - Asserts `getQueueHealth().stalled === false` after recovery
  </action>
  <acceptance_criteria>
    - `grep "lastWriteTime" src/features/session-tracker/persistence/project-index-writer.ts` returns at least 3 matches (field, assignment, stale check)
    - `grep "STALE_QUEUE_MS" src/features/session-tracker/persistence/project-index-writer.ts` returns match
    - `grep "detectStaleQueue\|STALE" src/features/session-tracker/persistence/project-index-writer.ts` returns match
    - `npx vitest run tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts` passes
    - `npx vitest run tests/features/session-tracker/persistence/project-index-writer.test.ts` passes (regression)
    - `npm run typecheck` passes
  </acceptance_criteria>
</task>

<!-- ========================================================================= -->
<!-- T-02: Fix childCount corruption + handleRead content capture + toolSummary -->
<!-- ========================================================================= -->
<task type="fix" id="T-02">
  <name>Task 2: Fix childCount corruption (DEFECT-01), handleRead content capture (DEFECT-04/CR-03), and toolSummary (DEFECT-07)</name>
  <depends_on>T-01</depends_on>
  <files>src/features/session-tracker/capture/tool-capture.ts</files>
  <read_first>
    - src/features/session-tracker/capture/tool-capture.ts (reason: exact handleTask line 251-253, handleRead line 176-187, toolSummary call gap in all handlers)
    - src/features/session-tracker/persistence/project-index-writer.ts line 165-197 (reason: updateSession signature — to understand what childCount update should look like)
    - src/features/session-tracker/persistence/session-index-writer.ts line 190-202 (reason: updateToolSummary signature)
    - tests/features/session-tracker/capture/tool-capture.test.ts (reason: existing tests patterns)
  </read_first>
  <action>
    Three co-located fixes in `src/features/session-tracker/capture/tool-capture.ts`:

    **Fix 2a — DEFECT-01 (childCount: undefined spread, line 251-253):**
    Remove the `childCount: undefined` from the `updateSession` call. Replace with:
    ```typescript
    // Update project-level index — childCount is managed by the index writer internally
    await this.projectIndexWriter.updateSession(input.sessionID, {})
    ```
    Note: `updateSession` at project-index-writer.ts:186 does `{ ...existing, ...updates, updated: now }`. An empty `{}` spread is harmless (no-op). The index writer manages `childCount` via its own internal logic (childCount starts at 0 in `addSession` at line 152).

    Alternatively, if we want to increment childCount, we should read the current count first. The simplest correct fix: don't pass `childCount` at all. Add a TODO comment: `// childCount is tracked by project-index-writer — future: add incrementChildCount() method`.

    **Fix 2b — DEFECT-04 (handleRead captures file content, line 176-187, CR-03):**
    Replace the heuristic substring match with structured error detection:
    ```typescript
    private async handleRead(input: ToolInput, output: ToolOutput): Promise<void> {
      const args = (input.args || {}) as Record<string, unknown>
      const filePath = args.filePath as string | undefined
      // Check structured metadata for errors, NEVER inspect file content
      const outputMeta = output.metadata as Record<string, unknown> | undefined
      const isError = outputMeta?.error !== undefined || outputMeta?.status === "error"
      const errorMessage = isError ? "File read failed" : undefined

      await this.sessionWriter.appendToolBlock(
        input.sessionID,
        "read",
        { filePath },
        undefined,
        errorMessage,  // Fixed string ONLY — never passes file content
      )
    }
    ```
    This NEVER calls `asString(output.output)` for error detection. File content stays in the output that we intentionally skip (outputPruned is `undefined`).

    **Fix 2c — DEFECT-07 (toolSummary never populated):**
    Add `this.sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)` as the FIRST operation in `handleSkill` (after line 148), `handleRead` (after line 174), `handleTask` (after line 203), and `handleOther` (after line 284). Add BEFORE the `await this.sessionWriter.appendToolBlock(...)` call in each handler.
    ```typescript
    // In handleSkill, after extracting skillName, before appendToolBlock:
    await this.sessionIndexWriter.updateToolSummary(input.sessionID, "skill")
    // In handleRead, after extracting filePath, before appendToolBlock:
    await this.sessionIndexWriter.updateToolSummary(input.sessionID, "read")
    // In handleTask, after extracting description, before child creation:
    await this.sessionIndexWriter.updateToolSummary(input.sessionID, "task")
    // In handleOther, before appendToolBlock:
    await this.sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)
    ```
  </action>
  <acceptance_criteria>
    - `grep "childCount.*undefined" src/features/session-tracker/capture/tool-capture.ts` returns NO matches
    - `grep "childCount" src/features/session-tracker/capture/tool-capture.ts --after=3` shows only the comment about future increment method
    - `grep "File read failed" src/features/session-tracker/capture/tool-capture.ts` returns match
    - `grep "outputStr\|includes.*error\|includes.*not found" src/features/session-tracker/capture/tool-capture.ts` returns NO matches
    - `grep "outputMeta" src/features/session-tracker/capture/tool-capture.ts` returns match in handleRead
    - `grep "updateToolSummary" src/features/session-tracker/capture/tool-capture.ts` returns 4 matches (skill, read, task, other handlers)
    - `npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts` passes
    - `npm run typecheck` passes
  </acceptance_criteria>
</task>

<!-- ========================================================================= -->
<!-- T-03: Fix turnCount confusion + frontmatter race + dynamic import          -->
<!-- ========================================================================= -->
<task type="fix" id="T-03">
  <name>Task 3: Fix turnCount confusion (DEFECT-05), frontmatter race (DEFECT-06), and dynamic import (DEFECT-10)</name>
  <depends_on>T-02</depends_on>
  <files>
    - src/features/session-tracker/persistence/session-index-writer.ts
    - src/features/session-tracker/persistence/session-writer.ts
  </files>
  <read_first>
    - src/features/session-tracker/persistence/session-index-writer.ts (reason: addChild at line 118-141 with turnCount++ at line 137)
    - src/features/session-tracker/persistence/session-writer.ts (reason: updateFrontmatter at line 175-190 with dynamic import at line 179)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: atomicAppendMarkdown signature, used by updateFrontmatter)
    - tests/features/session-tracker/persistence/session-index-writer.test.ts (reason: existing addChild test patterns)
    - tests/features/session-tracker/persistence/session-writer.test.ts (reason: existing updateFrontmatter test patterns)
  </read_first>
  <action>
    **Fix 3a — DEFECT-05 (session-index-writer.ts:137, turnCount conflated with child additions):**
    In `addChild()`, remove line 137 `index.turnCount++`. A child session creation is NOT a conversation turn.
    ```typescript
    // REMOVE this line (line 137):
    // index.turnCount++
    ```
    Only `incrementTurnCount()` (line 174-181) should modify `turnCount`. The `childCount` field in the hierarchy is already tracked by the number of keys in `index.hierarchy.children`.

    **Fix 3b — DEFECT-06 (session-writer.ts:175-190, double-read race in updateFrontmatter):**
    `updateFrontmatter` reads the file at line 181, modifies frontmatter, then calls `atomicAppendMarkdown` at line 189 which independently reads the file again (atomic-write.ts). Between reads, another write can corrupt.

    Fix: Write directly instead of re-reading in atomicAppendMarkdown. Replace the last line (189) with:
    ```typescript
    // Instead of: await atomicAppendMarkdown(filePath, content)
    // Use atomicWriteMarkdown that writes without re-reading:
    const { writeFile, rename } = await import("node:fs/promises")
    const { dirname } = await import("node:path")
    const tmpPath = filePath + ".tmp." + Date.now()
    await ensureDirectory(dirname(filePath))
    await writeFile(tmpPath, content, "utf-8")
    await rename(tmpPath, filePath)
    ```
    This eliminates the race window entirely — no double-read.

    **Fix 3c — DEFECT-10 (session-writer.ts:179, dynamic import on every call):**
    Add static import at TOP of file (after line 14):
    ```typescript
    import { readFile } from "node:fs/promises"
    ```
    Remove the dynamic import at line 179:
    ```typescript
    // REMOVE: const { readFile } = await import("node:fs/promises")
    ```
    The static `readFile` is already available from the top-level import. No other changes needed.
  </action>
  <acceptance_criteria>
    - `grep "turnCount++" src/features/session-tracker/persistence/session-index-writer.ts` returns exactly 1 match (in incrementTurnCount, NOT in addChild)
    - `grep "index\.turnCount\+\+" src/features/session-tracker/persistence/session-index-writer.ts --after=5` shows the line is only in `incrementTurnCount`
    - `grep "atomicAppendMarkdown\|atomicWriteMarkdown" src/features/session-tracker/persistence/session-writer.ts` in updateFrontmatter — verifies direct write used
    - `grep "import.*readFile.*from.*node:fs/promises" src/features/session-tracker/persistence/session-writer.ts` returns match (static import at top)
    - `grep "await import.*node:fs/promises" src/features/session-tracker/persistence/session-writer.ts` returns NO matches
    - `npx vitest run tests/features/session-tracker/persistence/session-index-writer.test.ts` passes
    - `npx vitest run tests/features/session-tracker/persistence/session-writer.test.ts` passes
    - `npm run typecheck` passes
  </acceptance_criteria>
</task>

<!-- ========================================================================= -->
<!-- T-04: Route child session events—bootstrap + event routing + write-once fix -->
<!-- ========================================================================= -->
<task type="fix" id="T-04">
  <name>Task 4: Route child session lifecycle events (DEFECT-09, DEFECT-08, DEFECT-03)</name>
  <depends_on>T-03</depends_on>
  <files>
    - src/features/session-tracker/index.ts
    - src/features/session-tracker/capture/event-capture.ts
    - src/features/session-tracker/capture/tool-capture.ts
  </files>
  <read_first>
    - src/features/session-tracker/index.ts (reason: ensureSessionReady at line 120-149, handleSessionEvent at line 164-179 — missing bootstrap call)
    - src/features/session-tracker/capture/event-capture.ts (reason: handleSessionIdle/Deleted/Error at line 176-219 ALL route to sessionWriter — need childWriter routing)
    - src/features/session-tracker/persistence/child-writer.ts (reason: updateChildStatus signature at ~line 80, appendChildTurn signature at ~line 110)
    - src/shared/session-api.ts (reason: getSession signature — used to check parentID)
    - src/features/session-tracker/types.ts (reason: ChildSessionRecord shape, Turn shape)
  </read_first>
  <action>
    **DEFECT-09 fix — index.ts handleSessionEvent missing bootstrap (line 164-179):**
    Add `await this.ensureSessionReady(event.sessionID)` as the FIRST operation in `handleSessionEvent`, right after the try block opens:
    ```typescript
    async handleSessionEvent(event: {...}): Promise<void> {
      try {
        // Lazy bootstrap: ensure session directory + index exist before handling events
        await this.ensureSessionReady(event.sessionID)
        if (this.eventCapture) {
          await this.eventCapture.handleSessionEvent(event)
        }
      } catch (err) { ... }
    }
    ```
    This ensures that session.idle/session.deleted/session.error events fire AFTER the session directory exists.

    **DEFECT-08 fix — event-capture.ts child event routing (line 105-127):**
    Inject `ChildWriter` and `SessionIndexWriter` into `EventCapture` constructor:
    ```typescript
    constructor(deps: {
      client: OpenCodeClient
      sessionWriter: SessionWriter
      childWriter: ChildWriter              // NEW
      sessionIndexWriter: SessionIndexWriter // NEW
      projectIndexWriter?: ProjectIndexWriter
    })
    ```
    In `index.ts` initialize(), update EventCapture construction at line 277-281:
    ```typescript
    this.eventCapture = new EventCapture({
      client: this.client,
      sessionWriter: this.sessionWriter,
      childWriter: this.childWriter,              // NEW
      sessionIndexWriter: this.sessionIndexWriter, // NEW
      projectIndexWriter: this.projectIndexWriter,
    })
    ```

    In `event-capture.ts`, add import for `ChildWriter` and `SessionIndexWriter` types.

    In `handleSessionIdle` (line 176), `handleSessionDeleted` (line 192), `handleSessionError` (line 208), add child session detection at TOP of each handler:
    ```typescript
    private async handleSessionIdle(sessionID: string): Promise<void> {
      try {
        // Check if this is a child session
        const session = await getSession(this.client, sessionID)
        const parentID = session.parentID as string | null | undefined
        if (parentID !== null && parentID !== undefined) {
          // Child session — update .json via childWriter
          await this.childWriter.updateChildStatus(parentID, sessionID, "idle")
          // Also update session-local index hierarchy
          await this.sessionIndexWriter.updateChildStatus(parentID, sessionID, "idle")
          return
        }
        // Main session — existing behavior
        await this.sessionWriter.updateFrontmatter(sessionID, {
          status: "idle",
        } as Partial<SessionRecord>)
      } catch (err) { ... }
    }
    ```
    Repeat this pattern in `handleSessionDeleted` (status: "completed") and `handleSessionError` (status: "error").

    **DEFECT-03 fix — tool-capture.ts append child turns (after DEFECT-08 routing in place):**
    In `handleTask` at line 236-240, after `createChildFile`, also call `childWriter.appendChildTurn()` immediately with a "delegation_spawn" turn:
    ```typescript
    // After createChildFile (line 240), add initial turn:
    await this.childWriter.appendChildTurn(
      input.sessionID,
      childSessionID,
      {
        turnNumber: 0,
        timestamp: now,
        actor: {
          name: subagentType || "unknown",
          model: "unknown",
        },
        action: "delegation_spawn",
        description: description || "Task delegation initiated",
        tools: [],
        errors: [],
      }
    )
    ```
  </action>
  <acceptance_criteria>
    - `grep "ensureSessionReady" src/features/session-tracker/index.ts $(rg -n "handleSessionEvent" -A 5)` — `ensureSessionReady` is called within `handleSessionEvent`
    - `grep "childWriter" src/features/session-tracker/capture/event-capture.ts` returns at least 3 matches (constructor param, field, usage in child routing)
    - `grep "parentID.*!==.*null" src/features/session-tracker/capture/event-capture.ts` returns match (child detection in each handler)
    - `grep "updateChildStatus" src/features/session-tracker/capture/event-capture.ts` returns at least 3 matches (idle, deleted, error handlers)
    - `grep "appendChildTurn" src/features/session-tracker/capture/tool-capture.ts` returns match (delegation_spawn turn added)
    - `npx vitest run tests/features/session-tracker/capture/event-capture.test.ts` passes
    - `npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts` passes
    - `npm run typecheck` passes
  </acceptance_criteria>
</task>

<!-- ========================================================================= -->
<!-- T-05: Fix independent low/mid severity defects (DEFECT-11, DEFECT-13, DEFECT-14) -->
<!-- ========================================================================= -->
<task type="fix" id="T-05">
  <name>Task 5: Fix independent type/transform/message defects (DEFECT-11, DEFECT-13, DEFECT-14)</name>
  <depends_on>T-02</depends_on>
  <files>
    - src/features/session-tracker/transform/agent-transform.ts
    - src/features/session-tracker/capture/message-capture.ts
    - src/features/session-tracker/types.ts
  </files>
  <read_first>
    - src/features/session-tracker/transform/agent-transform.ts (reason: computeThinkingDuration at ~line 117-118 returns "present")
    - src/features/session-tracker/capture/message-capture.ts (reason: turnCounters Map at line 65, needs seeding logic)
    - src/features/session-tracker/types.ts (reason: isValidSessionID regex at line 270)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: safeSessionPath — used for path safety, not regex validation)
  </read_first>
  <action>
    **Fix 5a — DEFECT-11 (agent-transform.ts:117, thinking duration "present"):**
    Change `computeThinkingDuration` to return `undefined` instead of `"present"`:
    ```typescript
    computeThinkingDuration(): string | undefined {
      // Timing data not available from hook metadata; return undefined (honesty over fake data)
      return undefined
    }
    ```
    In `transformMessage` where `thinkingDuration` is used, ensure consumers handle `undefined` correctly (drop the field from output when undefined).

    **Fix 5b — DEFECT-13 (message-capture.ts:65, turn counter seeding):**
    Add a `seedTurnCounters` method called during SessionTracker.initialize():
    ```typescript
    /**
     * Seeds in-memory turnCounters from existing .md file content.
     * Prevents duplicate turn numbers on plugin restart.
     */
    async seedTurnCounters(sessionID: string): Promise<void> {
      try {
        const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
        const raw = await readFile(filePath, "utf-8")
        const matches = raw.match(/## USER \(turn (\d+)\)/g)
        if (matches && matches.length > 0) {
          const lastTurn = matches.length // Count of existing turns
          this.turnCounters.set(sessionID, lastTurn)
        }
      } catch {
        // File may not exist — start at 0
      }
    }
    ```
    Add `turnCounters` as `private turnCounters: Map<string, number> = new Map()` if not already a field.
    In `SessionTracker.initialize()` (index.ts ~line 293), add after `recovery.initialize()`:
    ```typescript
    // Seed turn counters from existing session .md files
    const recovery = this.recovery // already initialized
    // For all known sessions in project-continuity.json, seed counters
    ```

    **Fix 5c — DEFECT-14 (types.ts:270, session ID regex too strict):**
    Replace `isValidSessionID` regex with path-safety check:
    ```typescript
    export function isValidSessionID(sessionID: string): boolean {
      if (!sessionID || sessionID.length === 0) return false
      if (sessionID.includes("/")) return false   // No path separators
      if (sessionID.includes("..")) return false   // No traversal sequences
      if (sessionID.includes("\\")) return false   // No Windows separators
      return true
    }
    ```
    Remove the regex `/^ses_[a-zA-Z0-9]{6,}$/`. Path safety is enforced by `sanitizeSessionID` and `safeSessionPath` in atomic-write.ts. The validation here should only reject path-injection characters.
  </action>
  <acceptance_criteria>
    - `grep '"present"' src/features/session-tracker/transform/agent-transform.ts` returns NO matches
    - `grep "computeThinkingDuration" src/features/session-tracker/transform/agent-transform.ts --after=5` shows `return undefined`
    - `grep "seedTurnCounters" src/features/session-tracker/capture/message-capture.ts` returns match
    - `grep "## USER.*turn" src/features/session-tracker/capture/message-capture.ts` returns match (regex for seeding)
    - `grep "includes.*\"/\"" src/features/session-tracker/types.ts` returns match (path separator check)
    - `grep "ses_.*regex\|/\\^ses_/" src/features/session-tracker/types.ts` returns NO matches (old regex removed)
    - `grep "includes.*\"\.\.\"" src/features/session-tracker/types.ts` returns match (traversal guard)
    - `npx vitest run tests/features/session-tracker/` passes (full test suite)
    - `npm run typecheck` passes
  </acceptance_criteria>
</task>

<!-- ========================================================================= -->
<!-- T-06: Fix cleanup wiring + recovery path traversal + compaction capture   -->
<!-- ========================================================================= -->
<task type="fix" id="T-06">
  <name>Task 6: Wire cleanup() call (DEFECT-12), fix recovery path traversal (CR-01), implement compaction capture (D-10)</name>
  <depends_on>T-04</depends_on>
  <files>
    - src/plugin.ts
    - src/features/session-tracker/recovery/session-recovery.ts
    - src/features/session-tracker/index.ts
  </files>
  <read_first>
    - src/plugin.ts (reason: line 97 void sessionTracker.initialize() — need to chain cleanup after)
    - src/features/session-tracker/recovery/session-recovery.ts (reason: path traversal vulnerability)
    - src/features/session-tracker/index.ts (reason: cleanup() at line 324-334, removeLegacyStateFiles() at line 373-402)
    - src/features/session-tracker/persistence/atomic-write.ts (reason: safeSessionPath — use for recovery path safety)
    - src/features/session-tracker/types.ts (reason: isValidSessionID — use for input validation in recovery)
  </read_first>
  <action>
    **Fix 6a — DEFECT-12 (plugin.ts: cleanup() never called):**
    In `src/plugin.ts`, find line 97 `void sessionTracker.initialize()`. Replace with:
    ```typescript
    void sessionTracker.initialize().then(() => {
      return sessionTracker.cleanup()
    }).catch((err) => {
      console.warn("[Harness] Session tracker: init+cleanup failed:", err)
    })
    ```

    **Fix 6b — CR-01 (session-recovery.ts: path traversal):**
    Find all places where `sessionID` or `parentSessionID` is used to construct file paths via `resolve()` or template literals. Apply `safeSessionPath()` and `isValidSessionID()` BEFORE any path construction:
    ```typescript
    import { safeSessionPath } from "../persistence/atomic-write.js"
    import { isValidSessionID } from "../types.js"

    // At every method entry point that accepts a sessionID parameter:
    if (!isValidSessionID(sessionID)) {
      console.warn(`[Harness] Session recovery: invalid sessionID rejected: "${sessionID}"`)
      return undefined // or appropriate fallback
    }
    const safePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
    // ... use safePath instead of resolve(trackerRoot, sessionID, ...)
    ```
    Audit the entire `session-recovery.ts` for ALL `resolve()` calls involving session IDs and replace each one with `safeSessionPath()`.

    **Fix 6c — D-10 (compaction capture):**
    In `event-capture.ts`, handle the `session.compacted` event type. This event type is already listed in `validEventTypes` at line 94. Add a case in the switch statement (after line 117, before `default`):
    ```typescript
    case "session.compacted":
      await this.handleSessionCompacted(event.sessionID, event.event as Record<string, unknown>)
      break
    ```
    Add the handler method:
    ```typescript
    private async handleSessionCompacted(
      sessionID: string,
      event: Record<string, unknown> | undefined,
    ): Promise<void> {
      try {
        const now = new Date().toISOString()
        const section = `## COMPACTED (${now})\n\n` +
          `**Pre-compaction state preserved.** See \`session-continuity.json\` for ` +
          `active delegations and pending work at time of compaction.\n`
        await this.sessionWriter.appendCompactionBlock(sessionID, section)
      } catch (err) {
        console.warn(
          `[Harness] Session tracker: compaction capture failed for "${sessionID}":`,
          err,
        )
      }
    }
    ```
    Add `appendCompactionBlock` method to `SessionWriter` (session-writer.ts):
    ```typescript
    async appendCompactionBlock(sessionID: string, block: string): Promise<void> {
      const filePath = this.getSessionFilePath(sessionID)
      await atomicAppendMarkdown(filePath, block)
    }
    ```
  </action>
  <acceptance_criteria>
    - `grep "sessionTracker\.cleanup" src/plugin.ts` returns match (cleanup called after init)
    - `grep "safeSessionPath" src/features/session-tracker/recovery/session-recovery.ts` returns at least 1 match (path safety applied)
    - `grep "isValidSessionID" src/features/session-tracker/recovery/session-recovery.ts` returns match (validation before path ops)
    - `grep "session\.compacted" src/features/session-tracker/capture/event-capture.ts` returns match (case in switch)
    - `grep "COMPACTED" src/features/session-tracker/capture/event-capture.ts` returns match (compaction block generation)
    - `grep "appendCompactionBlock" src/features/session-tracker/persistence/session-writer.ts` returns match
    - `npx vitest run tests/features/session-tracker/integration/cleanup.test.ts` passes
    - `npx vitest run tests/features/session-tracker/recovery/session-recovery.test.ts` passes
    - `npx vitest run tests/features/session-tracker/capture/event-capture.test.ts` passes
    - `npm run typecheck` passes
  </acceptance_criteria>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Agent input → tool | Untrusted session IDs enter tool handlers from agent prompts |
| Hook event → capture handler | Event payload from OpenCode runtime enters capture handlers |
| sessionID → filesystem path | Session IDs used to construct file paths under .hivemind/session-tracker/ |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-12-01 | Tampering | tool-capture.ts handleRead (line 176-187) | mitigate | Replace substring heuristic with structured error detection via output.metadata; never inspect file content for error detection. Error captured as fixed string "File read failed" only. |
| T-12-02 | Information Disclosure | tool-capture.ts handleRead | mitigate | outputPruned parameter set to `undefined` — file content stays in output object that is intentionally not passed to appendToolBlock. |
| T-12-03 | Tampering | project-index-writer.ts writeQueue | mitigate | Add stale queue detection (5-min timeout) + auto-recovery (queue reset). Add `.catch()` handler to prevent single failure from blocking chain. |
| T-12-04 | Elevation of Privilege | recovery/session-recovery.ts path construction | mitigate | Apply safeSessionPath() + isValidSessionID() before ALL path resolution. Reject session IDs containing "/", "..", or "\\". |
| T-12-05 | Tampering | session-writer.ts updateFrontmatter (double-read race) | mitigate | Replace atomicAppendMarkdown (which re-reads) with direct writeFile+rename in updateFrontmatter to eliminate TOCTOU race window. |
| T-12-06 | Information Disclosure | message-capture.ts turn counter reset | accept | Turn counter seeding from disk is best-effort; duplicate turn numbers are a data integrity issue but not a security boundary. Accept as low-risk. |
</threat_model>

<verification>
Wave 1 completion gate:
1. `npm run typecheck` — passes (zero errors)
2. `npx vitest run tests/features/session-tracker/` — all 163 existing tests pass (regression baseline)
3. New test files created: `tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts`
4. Child session event routing tests pass in existing `event-capture.test.ts`
5. handleRead content capture tests verify "File read failed" for errors, no file content in error parameter
6. `grep -r "childCount.*undefined" src/features/session-tracker/` returns zero matches
7. `grep -r "includes.*error.*not found" src/features/session-tracker/capture/tool-capture.ts` returns zero matches
</verification>

<success_criteria>
1. DEFECT-02: Project index writes unblock; `lastUpdated` advances on session creation
2. DEFECT-01: `project-continuity.json` entries have numeric `childCount`
3. DEFECT-04: `handleRead` NEVER captures file content — error parameter is "File read failed" string only
4. DEFECT-08/DEFECT-03: Child sessions receive lifecycle status updates in .json files
5. DEFECT-05: `turnCount` in session-continuity.json reflects actual conversation turns, not child count
6. DEFECT-06: Frontmatter updates are race-condition free
7. DEFECT-09: Session events fire after lazy bootstrap completes
8. DEFECT-10: No dynamic `import("node:fs/promises")` in session-writer.ts
9. DEFECT-11: `thinkingDuration` returns `undefined` instead of "present"
10. DEFECT-12: `cleanup()` called after `initialize()` in plugin.ts
11. DEFECT-13: Turn counters seed from existing .md files on restart
12. DEFECT-14: Session ID validation rejects only path traversal characters
13. CR-01: `safeSessionPath()` applied in session-recovery.ts
14. D-10: Compaction capture writes `## COMPACTED` blocks to .md files
</success_criteria>

<output>
After completion, create `.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-01-SUMMARY.md`
</output>
