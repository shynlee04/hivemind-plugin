# Phase 12: CP-ST-01 Remediation — Tool Surface Deficiencies

**Date:** 2026-05-12
**Classification: Group B — Tool Surface Deficiencies**
**Files:** `src/tools/hivemind/session-tracker.ts`, `src/schema-kernel/session-tracker.schema.ts`

---

## GAP-01: Path Traversal in `handleExportSession`

| Property | Value |
|----------|-------|
| **File:line** | `src/tools/hivemind/session-tracker.ts:107-108` |
| **Mechanism** | Constructs filePath using raw `resolve(trackerRoot, input.sessionId, ...)` with no validation or sanitization of `input.sessionId`. Zod schema validates `sessionId` as optional string — does NOT validate it as a safe path component. |
| **Severity** | 🔴 CRITICAL |
| **Review ref** | CR-02 — confirmed unresolved |

**Evidence:** Code analysis (L4). An agent could supply `../../` sequences to read arbitrary files.

**Fix:** Apply `isValidSessionID()` + `safeSessionPath()` validation before constructing path. Import from `../../features/session-tracker/persistence/atomic-write.js` and `../../features/session-tracker/types.js`.

---

## GAP-02: Synchronous `statSync`/`existsSync` Block Event Loop

| Property | Value |
|----------|-------|
| **File:line** | `src/tools/hivemind/session-tracker.ts:21, 198, 202` |
| **Mechanism** | `statSync` and `existsSync` from `node:fs` are blocking calls. In a plugin environment, this delays other tool calls. Inconsistent with the rest of the file which uses `readFile`/`readdir` from `node:fs/promises`. |
| **Severity** | 🔵 LOW |
| **Review ref** | IN-04 — confirmed unresolved |

**Fix:** Replace with `node:fs/promises` equivalents: `stat(path)` and `access(path).then(() => true).catch(() => false)`.

---

## GAP-03: No Session ID Validation in `handleSearchSessions`

| Property | Value |
|----------|-------|
| **File:line** | `src/tools/hivemind/session-tracker.ts:196-197` |
| **Mechanism** | `handleSearchSessions` constructs `mdPath` via `resolve(trackerRoot, sessionId, ...)` after a `startsWith("ses_")` filter on directory names (line 193). The directory name check provides partial protection but does NOT validate the session ID against `safeSessionPath()` or `isValidSessionID()`. A directory named `ses_../etc` would pass the `startsWith` check. |
| **Severity** | 🟡 HIGH |

**Fix:** Add `isValidSessionID(sessionId) && safeSessionPath(projectRoot, sessionId, ...)` validation before constructing the path.

---

## GAP-04: Tool is Read-Only but No Write-Side Actions for Agent Consumability

| Property | Value |
|----------|-------|
| **Description** | The tool provides 3 actions: `export-session`, `list-sessions`, `search-sessions`. All are read-only. Per D-02, the tool was designed for extensibility with a TODO for future hierarchy context retrieval toolset connecting to doc-intelligence, agent classifications, and coordination realms. |
| **Severity** | 🟢 MEDIUM |

**Gap analysis:**
- No `get-child-sessions` action — agents cannot query delegation hierarchy from the tool
- No `get-session-status` action — agents cannot check if a session is active/completed/errored
- No `get-session-summary` action — agents must export full .md content (potentially 200KB+) for basic metadata
- No `get-turn` action — agents cannot retrieve specific turns
- No `get-tools-summary` action — tool summary data exists in `session-continuity.json` but is not exposed
- No `get-children-detail` action — child session contents are inaccessible (only the parent .md is exported)

**Design notes for Phase 12:**
- Add `get-session` action returning frontmatter + metadata (without full MD body) for efficient agent consumption
- Add `get-children` action listing child sessions with status, agent, description
- Add `get-child` action returning full child .json record
- Expose toolSummary from session-continuity.json
- Consider adding write-side actions: `mark-session-complete`, `update-child-status` (though write-side tool needs careful CQRS design)

---

## GAP-05: Schema Has No Session ID Format Validation

| Property | Value |
|----------|-------|
| **File:line** | `src/schema-kernel/session-tracker.schema.ts` |
| **Mechanism** | The Zod schema validates `sessionId` as `z.string().optional()` — no format validation, no length check, no prefix check. All session ID validation is deferred to the tool handlers, which inconsistently apply validation. |
| **Severity** | 🟡 HIGH |

**Fix:** Add Zod refinement to validate session ID format at the schema level: `z.string().min(10).regex(/^ses_[a-zA-Z0-9_-]+$/)`. Fail fast at input validation, not in handler logic.

---

## GAP-06: `handleListSessions` Returns Stale Data from Frozen Index

| Property | Value |
|----------|-------|
| **Description** | `handleListSessions` reads `project-continuity.json` which is frozen (see DEFECT-02). Agents listing sessions receive data that is 7+ hours stale — missing sessions created after the index froze, showing wrong child counts (all 0), showing wrong statuses (all "active"). |
| **Severity** | 🔴 CRITICAL |

**Workaround:** Until DEFECT-02 is fixed, the tool should fall back to scanning the `session-tracker/` directory directly and reading individual `.md` frontmatters for status, rather than relying on the frozen index.

---

## Summary

| Gap | File | Severity | Review Ref | Resolved? |
|-----|------|----------|------------|-----------|
| GAP-01 | session-tracker.ts:107 | 🔴 CRITICAL | CR-02 | No |
| GAP-02 | session-tracker.ts:21 | 🔵 LOW | IN-04 | No |
| GAP-03 | session-tracker.ts:196 | 🟡 HIGH | — | — |
| GAP-04 | session-tracker.ts (design) | 🟢 MEDIUM | — | — |
| GAP-05 | session-tracker.schema.ts | 🟡 HIGH | — | — |
| GAP-06 | session-tracker.ts:131 | 🔴 CRITICAL | — | — |

**6 tool surface deficiencies.** 2 critical (path traversal + stale data), 2 high, 1 medium, 1 low. The primary tool gap is that the session-tracker tool reads from the frozen project-continuity.json index, giving agents stale/wrong data.
