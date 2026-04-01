# Journal Tool Verification Report

**Date:** 2026-03-31
**Agent:** hivexplorer (terminal investigation)
**Git Commit:** (investigated at current HEAD)

---

## Registration Status

| Check | Status | Evidence |
|-------|--------|----------|
| Tool exists | ✅ YES | `src/tools/hivemind-journal.ts` (196 lines) |
| Registered in catalog | ✅ YES | `src/tools/index.ts` lines 102-109 |
| Registered in plugin | ✅ YES | `src/plugin/opencode-plugin.ts` line 33 (import) and line 131 (registration) |

**Finding:** The `hivemind_journal` tool is properly registered in both the agent tool catalog and the OpenCode plugin.

---

## Execute Implementation

| Check | Status | Evidence |
|-------|--------|----------|
| Function exported | ✅ YES | `createHivemindJournalTool(projectRoot: string): ToolDefinition` at `hivemind-journal.ts:140` |
| Uses tool.schema (Zod) | ✅ YES | `journalToolArgs` defined at lines 67-87 |
| Has execute function | ✅ YES | `execute()` at lines 146-194 |
| Imports markdown-writer | ✅ YES | Line 19: `import { appendDiagnosticToMarkdown } from '../features/event-tracker/markdown-writer.js'` |

**Finding:** Execute implementation is complete and uses proper OpenCode SDK patterns.

---

## Filesystem Write Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Creates parent directories | ✅ YES | `appendToFile()` at lines 128-131 uses `mkdir(..., { recursive: true })` |
| Appends to file | ✅ YES | Uses `appendFile()` |
| Path resolution | ⚠️ DIFFERENT | Uses `getJourneyEventsMarkdownPath()` which **truncates** sessionId to 8 chars |
| Journey-events files exist | ✅ YES | `.hivemind/sessions/journey-events/ses_2bca.md`, `ses_2bb7.md`, etc. |

**CRITICAL ISSUE:** Path truncation mismatch!

- Tool writes to: `{projectRoot}/.hivemind/sessions/journey-events/{truncateSessionId(sessionId)}.md`
- Example: `test-session-journal-123` → `test-ses.md`
- markdown-writer writes to: `{sessionsDir}/journey-events/{sessionId}.md` (NO truncation)
- The existing `ses_2bca.md` files are written by `markdown-writer.ts` NOT by `hivemind_journal` tool

**Evidence from existing files:**
- `ses_2bca.md` format: `## Assistant (Assistant · unknown)` (written by `appendTurnToMarkdown`)
- Tool format: `## assistant_output` with `**Timestamp**, **Actor**, **Title**, **Summary** (different format!)

---

## Test Status

**Test Run Command:** `npx tsx --test src/tools/hivemind-journal.test.ts`

**Results:** 11 tests total
- 5 PASS (schema validation, success return, path resolution)
- 6 FAIL (all event write tests)

**Failing Test Root Cause:** Test helper `getEventsPath()` at line 43 uses full `TEST_SESSION_ID` without truncation:
```typescript
function getEventsPath(projectRoot: string): string {
  return join(projectRoot, '.hivemind', 'sessions', 'journey-events', `${TEST_SESSION_ID}.md`)
}
```
But `getJourneyEventsMarkdownPath()` truncates the sessionId to 8 chars, so file is written to `test-ses.md` not `test-session-journal-123.md`.

**Test Failure Error:**
```
ENOENT: no such file or directory, open '.../hm-journal-test-XXX/.hivemind/sessions/journey-events/test-session-journal-123.md'
```

**Note:** The test at line 302 (`journal tool uses context.directory for path resolution`) PASSES because it checks `parsed.path.includes(differentDir)` — which works because the path IS correct, just truncated.

---

## Hook Integration

| Hook | Status | Uses hivemind_journal? | Evidence |
|------|--------|------------------------|----------|
| `text.complete` | ⚠️ INDIRECT | NO - uses `consolidated-writer.js` + `markdown-writer.js` directly | `text-complete-handler.ts:45-159` |
| `session.compacting` | ⚠️ INDIRECT | NO - uses `consolidated-writer.js` + `markdown-writer.js` directly | `compaction-handler.ts:34-98` |
| `system.transform` | ✅ YES (sets payload) | NO WRITE - just `setInjectionPayload()` | `transform-handler.ts:23-45` |
| `tool-governance` | ✅ LISTED | NOT CALLED - just a managed tool flag | `tool-governance.ts:13` |

**Finding:** The `hivemind_journal` tool is listed in `HIVEMIND_MANAGED_TOOLS` but **never actually called** by any hook! The session journal is written directly by `markdown-writer.ts` functions.

---

## Summary of Issues

### Issue 1: Test Helper Bug
The test helper `getEventsPath()` doesn't account for session ID truncation, causing 6 false-negative test failures.

**Location:** `src/tools/hivemind-journal.test.ts:43`

### Issue 2: Dual Write Systems
Two separate systems write to journey-events:
1. `hivemind_journal` tool (truncates session IDs, different format)
2. `markdown-writer.ts` (doesn't truncate, different format)

**Evidence:**
- `ses_2bca.md` has format: `## Assistant (Assistant · unknown)` (markdown-writer)
- NOT: `## assistant_output\n\n- **Timestamp**...` (hivemind_journal)

### Issue 3: Tool Never Called
The `hivemind_journal` tool is registered but never invoked by any hook. The hooks write directly using `markdown-writer.ts`.

---

## Verdict: PARTIALLY_WORKING

| Component | Status |
|-----------|--------|
| Tool Registration | ✅ WORKING |
| Execute Implementation | ✅ WORKING (but writes to truncated path) |
| Path Resolution | ⚠️ BUGGY (truncates but test doesn't) |
| Test | ❌ BROKEN (6 false negatives due to path mismatch) |
| Hook Integration | ❌ NOT INTEGRATED (tool is registered but never called) |
| Actual Journey-Events Files | ✅ WRITTEN by `markdown-writer.ts` NOT by this tool |

---

## Evidence Files

| File | Purpose |
|------|---------|
| `src/tools/hivemind-journal.ts` | Tool implementation (196 lines) |
| `src/tools/hivemind-journal.test.ts` | Tests (308 lines, 6 failing) |
| `src/tools/index.ts` | Tool catalog registration (lines 102-109) |
| `src/plugin/opencode-plugin.ts` | Plugin registration (lines 33, 131) |
| `src/hooks/runtime-loader/tool-governance.ts` | HIVEMIND_MANAGED_TOOLS list (line 13) |
| `src/features/event-tracker/markdown-writer.ts` | The ACTUAL writer (434 lines) |
| `src/hooks/text-complete-handler.ts` | Hook that writes session events |
| `src/hooks/compaction-handler.ts` | Hook that writes compaction events |
| `.hivemind/sessions/journey-events/ses_2bca.md` | Example of actual output (NOT from hivemind_journal) |

---

## Recommendations

1. **Fix test helper:** Account for `truncateSessionId()` in `getEventsPath()`
2. **Decide which system is authoritative:** Either use `hivemind_journal` tool OR `markdown-writer.ts` directly — not both with different formats
3. **Wire the tool if it's authoritative:** If `hivemind_journal` is the CQRS write-side, hooks should call it instead of `markdown-writer` directly
