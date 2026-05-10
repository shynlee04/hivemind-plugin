---
phase: CP-ST-01-session-tracker-revamp
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - src/features/session-tracker/index.ts
  - src/features/session-tracker/types.ts
  - src/features/session-tracker/persistence/atomic-write.ts
  - src/features/session-tracker/persistence/session-writer.ts
  - src/features/session-tracker/persistence/child-writer.ts
  - src/features/session-tracker/persistence/session-index-writer.ts
  - src/features/session-tracker/persistence/project-index-writer.ts
  - src/features/session-tracker/capture/event-capture.ts
  - src/features/session-tracker/capture/message-capture.ts
  - src/features/session-tracker/capture/tool-capture.ts
  - src/features/session-tracker/transform/agent-transform.ts
  - src/features/session-tracker/transform/schema-normalizer.ts
  - src/features/session-tracker/recovery/session-recovery.ts
  - src/plugin.ts
  - src/schema-kernel/session-tracker.schema.ts
  - src/tools/hivemind/session-tracker.ts
findings:
  critical: 3
  warning: 6
  info: 5
  total: 14
status: issues_found
---

# Phase CP-ST-01: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found — 3 critical, 6 warning, 5 info (14 total)

## Summary

Review of the Session Tracker Revamp (CP-ST-01) covering 16 source files across 1,795 total lines. The architecture is sound — CQRS-compliant hook-to-persistence pipeline with dependency injection and atomic writes. However, three critical path-traversal vulnerabilities were found where session IDs from untrusted sources (tool input, session recovery) are used to construct filesystem paths without the `safeSessionPath` sanitization used everywhere else. Additionally, the `handleRead` method has a heuristic-based error detection that can inadvertently capture full file content, violating REQ-ST-05. Six warnings cover data integrity (race conditions in frontmatter updates, unbounded childCount overwrites) and code robustness (missing cleanup hook, in-memory turn counter reset on restart).

---

## Critical Issues

### CR-01: Path Traversal in `readSessionFile` — Recovery Module

**File:** `src/features/session-tracker/recovery/session-recovery.ts:264-268`
**Issue:** `readSessionFile()` constructs the file path using raw `resolve(trackerRoot, sessionID, ...)` with no validation or sanitization of `sessionID`. Unlike every other path-construction path in the persistence layer (which routes through `safeSessionPath` in `atomic-write.ts`), this recovery path bypasses all traversal detection and sanitization. A crafted or malformed `sessionID` (e.g., `../../../etc/passwd`) would escape the `.hivemind/session-tracker/` root.

**Fix:** Replace the raw `resolve` call with `safeSessionPath`:

```typescript
private async readSessionFile(sessionID: string): Promise<string | null> {
  try {
    const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
    const content = await readFile(filePath, "utf-8")
    return content
  } catch {
    return null
  }
}
```

Also add the import: `import { safeSessionPath } from "../persistence/atomic-write.js"` and adjust return since `safeSessionPath` throws on invalid IDs — the `try/catch` already handles this.

---

### CR-02: Path Traversal in Session-Tracker Tool — `handleExportSession`

**File:** `src/tools/hivemind/session-tracker.ts:107-108`
**Issue:** `handleExportSession()` constructs `filePath` via `resolve(trackerRoot, input.sessionId, ...)` with no validation or sanitization of `input.sessionId`. This value comes directly from agent input via Zod schema validation, but Zod only validates that `sessionId` is an optional string — it does not validate it as a safe path component or session ID. An agent (or malicious prompt) could supply `../../` sequences to read arbitrary files outside the tracker root.

The same pattern also exists in `handleSearchSessions` (line 196: `resolve(trackerRoot, sessionId, \`${sessionId}.md\`)`) though that case reads directory entries first and filters by `startsWith("ses_")`, providing partial protection.

**Fix:** Apply the same `safeSessionPath` defense used throughout the persistence layer, or validate with `isValidSessionID` + sanitize:

```typescript
async function handleExportSession(
  projectRoot: string,
  input: SessionTrackerInput,
): Promise<string> {
  if (!input.sessionId) {
    return renderToolResult(error("sessionId is required for export-session action"))
  }
  if (!isValidSessionID(input.sessionId)) {
    return renderToolResult(error(`Invalid session ID: ${input.sessionId}`))
  }
  // Use safeSessionPath for defense-in-depth
  const filePath = safeSessionPath(projectRoot, input.sessionId, `${input.sessionId}.md`)
  // ... rest of handler
}
```

Requires importing: `import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"` and `import { isValidSessionID } from "../../features/session-tracker/types.js"`.

---

### CR-03: REQ-ST-05 Violation — `handleRead` Can Leak File Content

**File:** `src/features/session-tracker/capture/tool-capture.ts:170-187`
**Issue:** REQ-ST-05 explicitly states: "SessionTracker SHALL capture only the file path for Read tool calls — NEVER the file content." The `handleRead` method checks if the output string contains the words `"error"` or `"not found"` and, if found, writes the **entire output string** (which is the file content) into the session `.md` file as the error parameter to `appendToolBlock`. Since any legitimate file can contain the word "error" naturally (e.g., source code: `if (err)`, documentation: "Error handling", etc.), this heuristic frequently classifies normal file reads as errors and writes their full content into the capture file.

**Fix:** Instead of substring-matching on the output content, check the tool output's structure for an error indicator (e.g., output type or status field from the hook), or reverse the logic: only capture output when the hook explicitly reports an error, not when the content happens to contain certain words:

```typescript
private async handleRead(
  input: ToolInput,
  output: ToolOutput,
): Promise<void> {
  const args = (input.args || {}) as Record<string, unknown>
  const filePath = args.filePath as string | undefined

  // Only capture output if the hook output indicates a read error (e.g., file not found).
  // Do NOT inspect the file content for error keywords — that violates REQ-ST-05.
  const metadata = output.metadata as Record<string, unknown> | undefined
  const isError = metadata?.error !== undefined || metadata?.status === "error"

  await this.sessionWriter.appendToolBlock(
    input.sessionID,
    "read",
    { filePath },
    undefined,
    isError ? "File read failed" : undefined, // Do NOT include file content
  )
}
```

---

## Warnings

### WR-01: `childCount: undefined` Can Corrupt Project Index Entry

**File:** `src/tools/hivemind/session-tracker.ts` → `src/features/session-tracker/capture/tool-capture.ts:251-253`
**Issue:** `handleTask` calls `this.projectIndexWriter.updateSession(input.sessionID, { childCount: undefined })` with an explicit `undefined` value. In `project-index-writer.ts:166-172`, the `updateSession` method spreads `...updates` over the existing entry. In JavaScript, spreading `{ childCount: undefined }` **overwrites** the existing `childCount` with `undefined`. This means every time a task tool fires and creates a child, the parent session's `childCount` in the project index gets reset to `undefined`.

**Fix:** Do not pass `undefined` for unchanged fields. Either omit `childCount` entirely from the update call or compute the correct incremental value:

```typescript
// Option A: Omit childCount — let it remain unchanged
await this.projectIndexWriter.updateSession(input.sessionID, {})

// Option B: Read current count and increment (requires index read access)
await this.projectIndexWriter.updateSession(input.sessionID, {
  childCount: (existingCount ?? 0) + 1,
})
```

---

### WR-02: Race Condition in `updateFrontmatter` — Double-Read + Write

**File:** `src/features/session-tracker/persistence/session-writer.ts:175-189`
**Issue:** `updateFrontmatter` reads the file via `readFile` (line 181), then passes merged content to `atomicAppendMarkdown` (line 189), which **also** reads the file independently (line 67 of `atomic-write.ts`). Between the first read in `updateFrontmatter` and the second read in `atomicAppendMarkdown`, another concurrent write (from a different hook event) could modify the file. The second read would pick up the concurrent change, but the merged frontmatter from `updateFrontmatter` would already be stale. This can cause lost frontmatter updates.

**Fix:** Extract the atomic-write logic from `atomicAppendMarkdown` into a `atomicWriteMarkdown(filePath, content)` function that writes directly without re-reading, and use that in `updateFrontmatter`:

```typescript
async updateFrontmatter(
  sessionID: string,
  updates: Partial<SessionRecord>,
): Promise<void> {
  const { readFile } = await import("node:fs/promises")
  const filePath = this.getSessionFilePath(sessionID)
  const raw = await readFile(filePath, "utf-8")

  const parsed = matter(raw)
  const merged: Record<string, unknown> = { ...parsed.data, ...updates }

  const yamlStr = yamlStringify(merged)
  const content = `---\n${yamlStr}---\n${parsed.content.trim() ? parsed.content : ""}`

  // Write directly — do NOT use atomicAppendMarkdown which re-reads the file
  const tmpPath = `${filePath}.tmp.${Date.now()}`
  await writeFile(tmpPath, content, "utf-8")
  await rename(tmpPath, filePath)
}
```

Also, the dynamic `import("node:fs/promises")` on every call (line 179) should be replaced with a static import at the top of the file.

---

### WR-03: `isValidSessionID` Regex Is an Assumption, Not Verified Against OpenCode Reality

**File:** `src/features/session-tracker/types.ts:270`
**Issue:** The regex `/^ses_[a-zA-Z0-9]{6,}$/` assumes OpenCode session IDs always start with `ses_` followed by at least 6 alphanumeric characters. If OpenCode ever changes its session ID format (e.g., using hyphens, shorter IDs, or different prefixes), this guard would reject valid sessions, causing the entire capture pipeline to silently skip ALL events. The `handleSessionEvent` method already validates `isValidSessionID` as a gate (event-capture.ts:69-71), and message/tool handlers do the same.

**Fix:** Either (a) loosen the regex to accept any session ID format the runtime produces, or (b) verify against the actual OpenCode source/SDK what session ID formats are guaranteed. Current fallback: `isValidSessionID` could return `true` for any non-empty string that doesn't contain path separators, failing closed only on path traversal. The regex-based validation should be moved to a separate function for path safety only.

---

### WR-04: Turn Counter Reset on Plugin Restart — Duplicate Turn Numbers

**File:** `src/features/session-tracker/capture/message-capture.ts:65`
**Issue:** The `turnCounters` Map is in-memory only. On plugin restart (e.g., OpenCode restart, harness reload), all turn counters reset to 0. If the same session file already has turns 1-N written, the next append will produce `## USER (turn 1)` again, creating duplicate turn numbers in the `.md` file and a mismatch between the persisted file and session-index `turnCount`.

**Fix:** During initialization, read the existing session file's turn count (count `## USER (turn N)` headers) and seed the in-memory `turnCounters` map accordingly:

```typescript
async initialize(sessionID: string, sessionFilePath: string): Promise<void> {
  try {
    const content = await readFile(sessionFilePath, "utf-8")
    const matches = content.match(/^## USER \(turn (\d+)\)$/gm)
    if (matches) {
      const lastTurn = matches.length
      this.turnCounters.set(sessionID, lastTurn)
    }
  } catch {
    // File may not exist yet — start from 0
  }
}
```

---

### WR-05: `SessionTracker.cleanup()` Never Called — Legacy State Leaks

**File:** `src/plugin.ts` (no call site) + `src/features/session-tracker/index.ts:265-312`
**Issue:** `SessionTracker.cleanup()` exists but is never invoked from `plugin.ts`. There is no `disable` hook handler or shutdown logic that calls it. The legacy state files in `.hivemind/event-tracker/` will persist indefinitely even after the session tracker has done its migration work.

**Fix:** Add a `disable` handler in plugin.ts or call `cleanup()` after `initialize()` completes. Since `initialize` is void-called on line 97 of plugin.ts, consider chaining:

```typescript
void sessionTracker.initialize().then(() => sessionTracker.cleanup())
```

Or register a proper shutdown hook if the OpenCode plugin API supports it.

---

### WR-06: `session-index-writer.addChild` Increments `turnCount` Semantically Incorrectly

**File:** `src/features/session-tracker/persistence/session-index-writer.ts:137`
**Issue:** `addChild()` increments `index.turnCount++` when registering a child session. A child session creation (via `task` tool) is not a "turn" in the conversation — turns are user/assistant message exchanges. This conflates two distinct counters and will inflate the `turnCount` value in `session-continuity.json`.

**Fix:** Either maintain a separate `childCount` field or only increment `turnCount` in the `incrementTurnCount` method (which is already available but seems to be called separately). Remove the `index.turnCount++` from `addChild`.

---

## Info

### IN-01: Dynamic Import on Every `updateFrontmatter` Call

**File:** `src/features/session-tracker/persistence/session-writer.ts:179`
**Issue:** `await import("node:fs/promises")` is called inside `updateFrontmatter` on every invocation. This is a dynamic import that resolves each time. `readFile` is already available in the `node:fs/promises` module, which is statically imported in other files in this module (e.g., `atomic-write.ts:10`).

**Fix:** Add a static `import { readFile } from "node:fs/promises"` at the top of the file (alongside the existing `gray-matter` and `yaml` imports) and remove the dynamic import.

---

### IN-02: `let` Instead of `const` for Non-Reassigned Variables

**File:** `src/features/session-tracker/capture/tool-capture.ts:174-178`
**Issue:** `outputStr` and `isError` are declared with `let` but never reassigned. TypeScript strict mode with `noUnusedLocals` won't catch this because the variables are used, but `const` better communicates intent and prevents accidental mutation.

**Fix:** Change `let` to `const` on lines 174-178:

```typescript
const outputStr = this.asString(output.output)
const isError = outputStr?.toLowerCase().includes("error") ||
  outputStr?.toLowerCase().includes("not found")
```

---

### IN-03: Non-Null Assertion in `extractTextContent`

**File:** `src/features/session-tracker/capture/message-capture.ts:208`
**Issue:** `map((p) => p.text!)` uses the `!` non-null assertion operator. While the preceding `filter` checks `typeof p.text === "string"`, using `!` is unnecessary and fragile — if the filter logic changes, this assertion silently masks the bug.

**Fix:** Use the explicit type guard already present:

```typescript
.filter((p): p is OutputPart & { text: string } => p.type === "text" && typeof p.text === "string")
.map((p) => p.text)
```

---

### IN-04: Synchronous `statSync`/`existsSync` in Read-Side Tool

**File:** `src/tools/hivemind/session-tracker.ts:21, 198, 202`
**Issue:** `statSync` and `existsSync` from `node:fs` block the event loop. In a plugin environment, this could delay other tool calls or hook processing if the filesystem is under load. The same file already imports `readFile`/`readdir` from `node:fs/promises` — the sync operations are inconsistent with the rest of the module.

**Fix:** Use `node:fs/promises` equivalents:

```typescript
import { readFile, readdir, stat, access } from "node:fs/promises"
// ...
if (!(await access(mdPath).then(() => true).catch(() => false))) continue
const fileStat = await stat(mdPath)
```

---

### IN-05: `console.log` Debug Artifact on Initialization Success

**File:** `src/features/session-tracker/index.ts:247`
**Issue:** `console.log("[Harness] Session tracker: initialized")` — this is a startup log. Consider whether this is intentional (observability signal) or a development artifact. The project guidance says to flag `console.log` usage.

**Fix:** If intentional as an observability signal, prefix consistently with `[Harness]` (already done) and consider using a structured logging approach. If a debug artifact, remove it.

---

_Reviewed: 2026-05-11_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
