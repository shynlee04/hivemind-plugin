---
phase: "16"
reviewed: 2026-05-20T14:30:00Z
depth: deep
files_reviewed: 7
files_reviewed_list:
  - src/schema-kernel/session-tracker.schema.ts
  - src/schema-kernel/session-view.schema.ts
  - src/tools/hivemind/session-tracker.ts
  - src/tools/hivemind/session-context.ts
  - src/tools/hivemind/session-hierarchy.ts
  - src/tools/hivemind/hivemind-session-view.ts
  - src/plugin.ts
findings:
  critical: 3
  warning: 5
  info: 5
  total: 13
status: issues_found
---

# Phase 16: Code Review Report — Session-Tracker Tool Intelligence

**Reviewed:** 2026-05-20T14:30:00Z
**Depth:** deep (cross-file + cross-module)
**Files Reviewed:** 7 source files (6 tool/schema, 1 plugin)
**Status:** issues_found — 3 Critical, 5 Warning, 5 Info

## Summary

Reviewed all modified source files for Phase 16 (session-tracker tool intelligence, new tool actions, new hivemind-session-view tool). **3 Critical bugs found** — including a completely broken aggregation heuristic, semantically inconsistent success/error envelope usage, and a platform-dependent path traversal guard. The prior debug session resolved 7 known issues, but these remaining defects evade simple path-based detection and require semantic reasoning.

---

## Critical Issues

### CR-01: Aggregation heuristic always returns "generic-session" — subagentType grouping is dead logic

**File:** `src/tools/hivemind/session-context.ts:197-203`
**Severity:** CRITICAL (incorrect behavior)

**Issue:** The `handleAggregate` function for `groupBy === "subagentType"` attempts to classify sessions by agent lineage using `continuity.sessionID?.startsWith("hm-")` / `"hf-"` / `"gsd-"`. However, session IDs in the harness follow the OpenCode convention of starting with `"ses_"` (e.g., `ses_1ed9df1adffe2hbJudz3sK60y3`). **None of these prefixes match**, so the heuristic ALWAYS falls through to `"generic-session"` for every real session. The subagentType aggregation produces zero useful information — it collapses every session into a single bucket, rendering the entire `groupBy: "subagentType"` path dead logic.

**Root cause:** The `continuity.sessionID` field stores the session identifier (always `"ses_"`-prefixed), not the agent name or lineage prefix. The code confuses the *session* identity with the *agent* identity.

**Fix:** The agent lineage must come from the session's continuity record metadata — either from a `mainAgent.name` or `mainAgent.model` field, or from the `delegatedBy.subagentType` field in child records. For root sessions, the agent type is not stored in the continuity index. A correct implementation would either:
1. Read the `mainAgent.name` or `delegatedBy.subagentType` field from the child session records
2. Or accept that subagentType aggregation requires richer data and remove the broken heuristic

```typescript
// Line 196-203 replacement:
if (groupBy === "subagentType") {
  for (const [sessionId] of Object.entries(sessions)) {
    const continuity = await readContinuity(projectRoot, sessionId)
    if (!continuity) continue
    // DOES NOT WORK — sessionID is "ses_..." not "hm-..."/"hf-..."/"gsd-..."
    // The continuity record doesn't store agent lineage directly.
    // Must read from child session records' delegatedBy.subagentType
    // OR use continuity's mainAgent field if available.
    const record = await readContinuity(projectRoot, sessionId)
    // TODO: Read child delegations from session hierarchy for agent lineage
  }
}
```

---

### CR-02: hivemind-session-view returns `success()` envelope when session not found

**File:** `src/tools/hivemind/hivemind-session-view.ts:42`
**Severity:** CRITICAL (incorrect behavior contract)

**Issue:** When `buildUnifiedView` cannot find the session (line 95-99), it returns data with an `error` field inside the payload. But the tool always wraps the result in `success()` at line 42. This means the response envelope says `kind: "success"` while the data contains a key named `"error"`. Downstream consumers reading the `kind` field would incorrectly treat this as a successful lookup. This breaks the CQRS contract where `error()` signals failure to callers.

**Fix:** Check for the error condition before calling `success()`:

```typescript
// hivemind-session-view.ts, lines 40-42
const input = SessionViewInputSchema.parse(rawArgs) as SessionViewInput
const data = await buildUnifiedView(projectRoot, input.sessionId)
// CHECK for error case
if (data.error) {
  return renderToolResult(error(`Session not found: ${input.sessionId}`, data))
}
return renderToolResult(success(`Unified view for ${input.sessionId}`, data))
```

---

### CR-03: safeSessionPath path-traversal guard broken on Windows

**File:** `src/features/session-tracker/persistence/atomic-write.ts:142`
**Severity:** CRITICAL (platform-dependent security bypass)

**Issue:** The path-traversal guard on line 142 checks `!resolved.startsWith(trackerRoot + "/")`. On macOS/Linux, `path.resolve()` produces forward-slash paths, so this check works. On Windows, `path.resolve()` produces backslash paths (e.g., `C:\Users\...\.hivemind\session-tracker\`), but `trackerRoot + "/"` appends a forward slash, creating a mixed-separator string. The `startsWith()` check **fails on Windows**, allowing path traversal to bypass the guard.

This is called by every `safeSessionPath()` invocation across all 3 tools.

**Fix:** Use `path.sep` or normalize the prefix:
```typescript
const prefix = trackerRoot.endsWith(path.sep) ? trackerRoot : trackerRoot + path.sep
if (!resolved.startsWith(prefix) && resolved !== trackerRoot) {
```
Add `import { sep } from "node:path"` at top of file.

---

## Warnings

### WR-01: Duplicate `safeSessionId` refinement — DRY violation

**Files:**
- `src/schema-kernel/session-tracker.schema.ts:19-25`
- `src/schema-kernel/session-view.schema.ts:15-21`
**Severity:** WARNING (maintenance risk, silent divergence)

**Issue:** The exact same `safeSessionId` Zod refinement (`.min(1)`, `.refine(no "/" / ".." / "\\")`) is defined independently in two schema files. Any future change to the validation rules (e.g., adding a new blocked character) must be replicated in both files. Nothing prevents the two copies from silently diverging, potentially creating a security gap in one path.

**Fix:** Extract to a shared exported constant in a common location (e.g., `src/schema-kernel/shared-session-id.ts` or `session-view.schema.ts` re-exports from `session-tracker.schema.ts`):

```typescript
// In session-tracker.schema.ts — export it:
export const safeSessionId = z.string().min(1).refine(...)

// In session-view.schema.ts — import it:
import { safeSessionId } from "./session-tracker.schema.js"
```

---

### WR-02: Tool args declare `timeRange` as string but Zod schema expects object

**File:** `src/tools/hivemind/session-tracker.ts:38`
**Severity:** WARNING (validation mismatch)

**Issue:** The tool's `args` declaration advertises `timeRange: tool.schema.string().optional()`, but the Zod schema (`SessionTrackerInputSchema`, line 67-70) expects `timeRange: z.object({ after?: string, before?: string }).optional()`. This mismatch means:
1. Auto-generated documentation tells callers to pass a string when they should pass an object
2. The OpenCode SDK may serialize/serialize in unexpected ways depending on how it handles this type mismatch
3. The `filterJson` field (line 39) is declared but **never consumed** by the Zod schema or the handler — it is dead code

**Fix:** Align the tool args with the Zod schema. Either flatten `timeRange` into `after`/`before` string fields, or change the tool arg to accept the object shape. Remove the unused `filterJson` field:

```typescript
args: {
  // ... existing fields ...
  timeAfter: tool.schema.string().optional(),  // replaces timeRange
  timeBefore: tool.schema.string().optional(), // replaces timeRange
  // Remove: filterJson, removeEmpty — never consumed
},
```

---

### WR-03: `handleFilterSessions` hardcodes root session status as "active"

**File:** `src/tools/hivemind/session-tracker.ts:332`
**Severity:** WARNING (incorrect filter results)

**Issue:** Line 332 sets `status: "active"` for every root session read from the hierarchy manifest, regardless of the session's actual status. The manifest file (`hierarchy-manifest.json`) does not store the root session's status directly, but the session's `session-continuity.json` file does. This means a `status` filter of `"completed"`, `"error"`, or `"idle"` would never match root sessions, silently excluding them from results.

**Fix:** Read the root session's actual status from `session-continuity.json`:

```typescript
// After line 329 (const rootId = ...), add:
let rootStatus = "active"
try {
  const continuityPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
  const continuityData = JSON.parse(await readFile(continuityPath, "utf-8"))
  rootStatus = (continuityData as Record<string, unknown>).status ?? "active"
} catch { /* fallback to "active" */ }

matches.push({
  sessionId: rootId,
  status: rootStatus,  // was: "active"
  depth: 0,
  lastUpdated: manifest.lastUpdated,
})
```

---

### WR-04: `SessionViewDelegationFilterSchema` is orphaned in wrong schema file

**File:** `src/schema-kernel/session-view.schema.ts:39-43`
**Severity:** WARNING (maintenance debt, misplaced contract)

**Issue:** `SessionViewDelegationFilterSchema` is defined in `session-view.schema.ts` but is not used by the `hivemind-session-view` tool at all. It appears to be a delegation-status filter schema that belongs in the delegation-status schema file. No code in the reviewed files imports this schema. It is an orphaned export that creates confusion about ownership boundaries.

**Fix:** Move this schema to the appropriate delegation-status schema file. If no such file exists, remove it until a consumer exists (YAGNI).

---

### WR-05: `handleFilterSessions` deduplication gap — same session may appear multiple times

**File:** `src/tools/hivemind/session-tracker.ts:330-348`
**Severity:** WARNING (duplicate entries in filter results)

**Issue:** The `handleFilterSessions` function iterates over all session directories and pushes the root session (line 330-335) AND all children from the manifest (line 338-348). If two session directories share the same `rootMainSessionID` (which can happen when multiple manifests reference the same root), the root session is duplicated in the results. There is no deduplication step before filtering.

**Fix:** Track seen session IDs in a `Set<string>` before pushing:

```typescript
const seen = new Set<string>()
for (const entry of entries) {
  // ... existing ...
  const rootId = manifest.rootMainSessionID ?? sessionId
  if (!seen.has(rootId)) {
    seen.add(rootId)
    matches.push({ ... })
  }
  if (manifest.children) {
    for (const [, childMeta] of Object.entries(manifest.children)) {
      if (childMeta.sessionID && !seen.has(childMeta.sessionID)) {
        seen.add(childMeta.sessionID)
        matches.push({ ... })
      }
    }
  }
}
```

---

## Info

### IN-01: `filterJson` and `removeEmpty` are dead code in tool args

**File:** `src/tools/hivemind/session-tracker.ts:39-40`
**Severity:** INFO

**Issue:** `filterJson` and `removeEmpty` are declared in the tool `args` block but are never referenced in the Zod schema, the `execute` function, or any handler. They inflate the argument surface area without providing any functionality.

**Fix:** Remove both fields from the `args` declaration.

---

### IN-02: `resolvePaths()` returns union type — fragile error-vs-value pattern

**File:** `src/tools/hivemind/session-tracker.ts:63-74`
**Severity:** INFO

**Issue:** `resolvePaths()` returns `{ safeMd: string; safeJson: string } | string`, where the `string` case is actually a pre-rendered error response string. Callers check `typeof paths === "string"` to detect errors. This pattern is fragile — TypeScript cannot distinguish between a string error and a valid return. A tagged union or a `Result<T, E>` type would be safer.

---

### IN-03: `computeDepth` has no recursion guard for deep delegation trees

**File:** `src/tools/hivemind/session-hierarchy.ts:137-149`
**Severity:** INFO

**Issue:** `computeDepth` is a recursive function without a maximum depth limit. While `handleGetParentChain` (same file, line 114) has `MAX_DEPTH = 50`, `handleGetDelegationDepth` / `computeDepth` does not. A corrupted delegation tree with a cycle would stack-overflow. The `visited` Set prevents infinite loops from cycles, but a legitimate deep tree (1000+ levels) would overflow the call stack.

---

### IN-04: `SessionViewInputSchema` not re-exported from schema-kernel barrel

**File:** `src/schema-kernel/index.ts`
**Severity:** INFO

**Issue:** Unlike other tool schemas, `SessionViewInputSchema` and `SessionViewDelegationFilterSchema` are not re-exported from the schema-kernel barrel (`index.ts`). While the tool imports directly from the schema file (which works), barrel consumers cannot access these schemas.

**Fix:** Add exports to `schema-kernel/index.ts`:
```typescript
export { SessionViewInputSchema, SessionViewDelegationFilterSchema } from "./session-view.schema.js"
export type { SessionViewInput, SessionViewDelegationFilter } from "./session-view.schema.js"
```

---

### IN-05: `handleCrossReference` performs O(n) directory scan with no caching

**File:** `src/tools/hivemind/session-context.ts:112-137`
**Severity:** INFO

**Issue:** Every cross-reference query reads the entire session directory listing and sequentially reads each session's `session-continuity.json`. For projects with many sessions, this is O(n) I/O per query. No caching layer exists. Typical session counts may be low (5-30), so this is flagged as INFO rather than a warning, but it should be monitored.

---

_Reviewed: 2026-05-20T14:30:00Z_
_Reviewer: gsd-code-reviewer (deep mode, 7 source files)_
_Findings summary: 3 Critical · 5 Warning · 5 Info_
