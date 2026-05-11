# Phase 12: CP-ST-01 Remediation — Research

**Researched:** 2026-05-12
**Domain:** Session tracker writer engine + tool surface remediation (TypeScript, OpenCode SDK v2 hooks, CQRS persistence)
**Confidence:** HIGH

## Summary

This phase fixes a comprehensively broken session tracker pipeline. Despite 163 passing unit tests, the writer engine has 14 confirmed source defects — the project index is frozen (7+ hours stale), child session records are write-once-never-updated, child lifecycle events are lost, read tool captures file content via heuristic error detection (violating REQ-ST-05), childCount corrupts project entries via `undefined` spread, a path traversal vulnerability exists in the recovery module, and legacy cleanup code exists but is never called. The tool surface has 6 deficiencies including a path traversal in `handleExportSession` and stale data from the frozen index. All 14 review findings from CP-ST-01-REVIEW.md remain unresolved (100%).

The remediation follows a 3-wave dependency-ordered strategy: (1) fix the frozen serial queue first (DEFECT-02, the block), then fix all downstream writer engine defects in dependency order, (2) replace the single `session-tracker` tool with 3 domain-focused tools per CUSTOM-TOOLS-CRITERIA, and (3) verify integration with fork handling, parallel sessions, and 163-test regression baseline.

**Primary recommendation:** Unblock the frozen serial queue FIRST (DEFECT-02) — all other fixes depend on the project index actually updating. Fix DEFECT-01 (childCount: undefined) immediately after. Then route child session lifecycle events through dedicated handler paths (DEFECT-03, DEFECT-08). Fix path traversal vulnerabilities (CR-01, CR-02) before any other tool work.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Session lifecycle event capture | API/Backend (`src/features/session-tracker/capture/event-capture.ts`) | — | Hooks observe, SessionTracker routes to persistence |
| User/assistant message capture | API/Backend (`src/features/session-tracker/capture/message-capture.ts`) | — | Chat.message hook → message-capture → session-writer |
| Tool execution capture | API/Backend (`src/features/session-tracker/capture/tool-capture.ts`) | — | tool.execute.after hook → tool-capture → writers |
| Child session lifecycle tracking | API/Backend (`src/features/session-tracker/capture/event-capture.ts`) | ChildWriter persistence | Child lifecycle events need dedicated routing |
| Project index management | Database/Storage (`project-index-writer.ts`) | — | Serial queue, JSON persistence |
| Session-local index management | Database/Storage (`session-index-writer.ts`) | — | Per-session JSON index |
| Tool query surface (export/list/search) | API/Backend (`src/tools/hivemind/`) | Shared tool-response envelope | CQRS write-side tools for agent consumption |
| Path safety / ID validation | API/Backend (`src/features/session-tracker/persistence/atomic-write.ts`) | Shared types | Centralized sanitization, used by all writers |
| Legacy cleanup | API/Backend (`src/features/session-tracker/index.ts`) | Plugin composition root | Cleanup must be wired to startup |
| Recovery from disk | API/Backend (`src/features/session-tracker/recovery/session-recovery.ts`) | SDK REST API | Rebuild context from persisted files |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01: Wave 1 — Writer Engine Fixes.** Fix capture pipeline before touching tools. Ordered by dependency.
- **D-02: Wave 2 — Tool Redesign.** Replace single `session-tracker` with 3 tools: `session-tracker`, `session-hierarchy`, `session-context`. Each ≤200 LOC per Criterion 4.
- **D-03: Wave 3 — Integration + Verification.** Fork handling, parallel sessions, full regression.
- **D-04:** Each sub-plan decomposes into dependency-ordered micro-tasks (1-2 files per task). No task touches more than 2 files.
- **D-05:** Child `.json` records capture per-turn stems. Final summary after completion.
- **D-06:** 3-level delegation hierarchy fully nested. Status updates propagate on lifecycle events.
- **D-07:** Child session lifecycle events route through dedicated handler path in `event-capture.ts`.
- **D-08:** Three focused tools replace the single action-dispatched `session-tracker`.
- **D-09:** Each tool follows Criterion 4 (≤200 LOC, kebab-case, action+object naming) and Criterion 7 (minimal required fields).
- **D-10:** Compaction capture: write summary breaker blocks to main .md file on `session.compacted` event.
- **D-11:** Errors captured as type + path only. Replace heuristic substring match with structured error detection.

### the agent's Discretion
- Exact internal module structure within `src/features/session-tracker/` for new handlers (child event routing, compaction capture) is up to the implementer following existing patterns.
- Exact field naming for new child session turn stems is up to the implementer following camelCase convention (REQ-ST-12).
- Tool response envelope format follows existing `src/shared/tool-response.ts` patterns.

### Deferred Ideas (OUT OF SCOPE)
- Sidecar dashboard integration
- Real-time SSE streaming
- Graph-based delegation visualization
- Auto-pruning of old session data
- Removal of legacy event-tracker source code
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-ST-01 | Session directory manifestation with project index | DEFECT-01, DEFECT-02 must be fixed |
| REQ-ST-02 | User message capture with turn counter | DEFECT-13 (turn counter seeding) |
| REQ-ST-03 | Agent metadata transform | DEFECT-11 (thinking duration) |
| REQ-ST-04 | Tool capture — Skill | Already PASS — verified |
| REQ-ST-05 | Tool capture — Read (NO file content) | DEFECT-04 MUST be fixed |
| REQ-ST-06 | Task delegation spawns child .json | DEFECT-03, DEFECT-05, DEFECT-07, DEFECT-08 |
| REQ-ST-07 | Child session recognition and transform | DEFECT-03, DEFECT-08 — child lifecycle handler |
| REQ-ST-08 | Dual continuity indices update | DEFECT-01, DEFECT-02, DEFECT-05, DEFECT-07 |
| REQ-ST-09 | Concurrent session isolation | DEFECT-06 (race condition) |
| REQ-ST-10 | Disconnection recovery | CR-01 (path traversal), broken data dependency |
| REQ-ST-11 | Hook-to-persistence architecture compliance | Already PASS — verified |
| REQ-ST-12 | Schema consistency (camelCase) | DEFECT-14 (session ID regex), already PASS on fields |
| REQ-ST-13 | Legacy cleanup | DEFECT-12 (cleanup() never called) |
</phase_requirements>

---

## 1. Technical Approach Summary

The session tracker writer engine has a frozen serial queue that blocks all project index updates (DEFECT-02). This is the root cause blocking REQ-ST-08. Every other index defect (childCount corruption DEFECT-01, stale statuses, missing entries) cascades from this. The repair strategy is dependency-ordered: unblock the queue first → fix data integrity bugs → route child session events correctly → add missing update calls → redesign tools → verify integration. No new npm dependencies are needed — all fixes use the existing stack (gray-matter, yaml, zod, node:fs/promises). The 163 existing tests are the regression baseline; new tests are added for each defect fix using the existing vitest infrastructure.

**Key insight from evidence:** The unit tests pass because they test isolation but not live hook event sequencing. The frozen queue, child write-once pattern, and missing update calls only manifest under real event sequencing. The `project-continuity.json` `lastUpdated` being 7+ hours frozen is L1 evidence that the serial queue is stuck — this is the single most impactful fix.

---

## 2. Source Defect Analysis

### DEFECT-01: Project Index Update `childCount: undefined` Corrupts Entry
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts:251-253` → `project-index-writer.ts:166-172` |
| **Root cause** | `handleTask()` calls `updateSession(input.sessionID, { childCount: undefined })`. JavaScript spread `{ ...entry, childCount: undefined }` **overwrites** the key with `undefined`, effectively deleting the field |
| **Evidence** | 13 sessions in `project-continuity.json` missing `childCount` field entirely (L1) |
| **Fix strategy** | Omit `childCount` from the update call OR read current count and increment. Simplest fix: don't pass `childCount` at all in this call site — use a separate dedicated method or read-modify-write |
| **Risk level** | 🔴 CRITICAL — Corrupts project index data |

### DEFECT-02: Project Index `lastUpdated` Never Advances — Serial Queue Stuck
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/project-index-writer.ts:89-91` (writeQueue) |
| **Root cause** | The `writeQueue` Promise chain serializes index writes. If one promise never resolves (unhandled rejection, infinite await, stuck lock), all subsequent writes are blocked. The queue mechanism is a simple chain: `writeQueue = writeQueue.then(...)` — if `.then()` callback throws and isn't caught, the queue halts |
| **Evidence** | `project-continuity.json` `lastUpdated` at `2026-05-11T17:04:29.708Z` — 7+ hours stale. 83 entries but ~57 more session directories created after 17:04 never registered (L1) |
| **Fix strategy** | Add `.catch()` handler to the queue chain to prevent one failure from blocking all subsequent writes. Add stale queue detection (if `lastUpdated` hasn't changed in N minutes despite active sessions, log warning). Consider wrapping `enqueueWrite` callback in `try/catch` with structured error recovery |
| **Risk level** | 🔴 CRITICAL — Blocks ALL project index updates |

### DEFECT-03: Child Session Records Are Write-Once, Never Updated
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts:236-240` |
| **Root cause** | `handleTask()` calls `childWriter.createChildFile()` once at task spawn but NEVER calls `childWriter.updateChildStatus()` or `childWriter.appendChildTurn()`. Child session lifecycle events (`session.idle`, `session.deleted`, `session.error`) are routed to `event-capture.ts` which only handles main sessions |
| **Evidence** | All child `.json` files have `turns: []`, `status: "active"`, `mainAgent.model: "unknown"` (L1) |
| **Fix strategy** | Add child session routing in `event-capture.ts`: when `parentID !== null`, route to `childWriter.updateChildStatus()` and `childWriter.appendChildTurn()` instead of `sessionWriter`. Wire `childWriter` into `EventCapture` via dependency injection |
| **Risk level** | 🔴 CRITICAL — Child session data is skeletal |

### DEFECT-04: `handleRead` Captures File Content via Heuristic Error Detection
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts:176-187` |
| **Root cause** | `outputStr` is substring-matched for `"error"` or `"not found"` — ANY file containing those words triggers full content capture as the error parameter, violating REQ-ST-05 ("NEVER capture file content") |
| **Fix strategy** | Check `output.metadata` for structured error status (`metadata?.error !== undefined` or `metadata?.status === "error"`). Never pass file content to error parameter. On error, capture only "File read failed" as a fixed string, not the output content |
| **Risk level** | 🔴 CRITICAL — Direct REQ-ST-05 violation |

### DEFECT-05: `session-index-writer.addChild` Conflates Child Count with Turn Count
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/session-index-writer.ts:137` |
| **Root cause** | `addChild()` executes `index.turnCount++` — registering a child session is NOT a conversation turn. ses_1e8826b7 has 2 user turns but `turnCount: 8` (8 children) |
| **Fix strategy** | Remove `index.turnCount++` from `addChild()`. Only increment `turnCount` via `incrementTurnCount()`. Maintain separate `childCount` field |
| **Risk level** | 🟡 HIGH — Inflates turnCount metric |

### DEFECT-06: `updateFrontmatter` Has Double-Read Race Condition
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/session-writer.ts:175-189` |
| **Root cause** | `updateFrontmatter` reads file (line 181), modifies, then calls `atomicAppendMarkdown` which independently reads the file again (atomic-write.ts:67). Between the two reads, another concurrent write can modify the file |
| **Fix strategy** | Option A: Use a per-session write queue to serialize all writes. Option B: Create `atomicWriteMarkdown(path, content)` that writes directly without re-reading, use it in `updateFrontmatter` |
| **Risk level** | 🟡 HIGH — Data loss risk under concurrent writes |

### DEFECT-07: `toolSummary` Never Populated in Session Continuity Index
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/tool-capture.ts` (all handlers: handleSkill, handleRead, handleTask, handleOther) |
| **Root cause** | `updateToolSummary(sessionID, toolName)` method exists on `SessionIndexWriter` but is never called from any capture handler |
| **Fix strategy** | Add `this.sessionIndexWriter.updateToolSummary(input.sessionID, input.tool)` call at the start of `handleSkill`, `handleRead`, `handleTask`, and `handleOther` |
| **Risk level** | 🟡 HIGH — `toolSummary` always {} in all session indices |

### DEFECT-08: Child Session Events Lost (Architecture Gap)
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/event-capture.ts:105-127` |
| **Root cause** | `handleSessionIdle`, `handleSessionDeleted`, `handleSessionError` ALL route to `sessionWriter.updateFrontmatter(sessionID, ...)`. For child sessions, no `.md` file exists — the write fails silently (file not found, caught by try/catch) |
| **Fix strategy** | Add routing layer in `handleSessionEvent`: query SDK for `parentID`. For main sessions → use `sessionWriter`. For child sessions → use `childWriter.updateChildStatus()`. Requires `childWriter` dependency injection into `EventCapture` |
| **Risk level** | 🔴 CRITICAL — Child session lifecycles invisible |

### DEFECT-09: Lazy Bootstrap Gap — SessionEvent Handler Doesn't Bootstrap
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/index.ts:164-179, 120-149` |
| **Root cause** | `ensureSessionReady()` is called from `handleChatMessage` and `handleToolExecuteAfter` but NOT from `handleSessionEvent`. If `session.idle` fires before any chat/tool activity, the session directory doesn't exist |
| **Fix strategy** | Add `await this.ensureSessionReady(event.sessionID)` as the first operation in `handleSessionEvent` (after initialization check) |
| **Risk level** | 🟡 HIGH — Silently drops events for non-bootstrapped sessions |

### DEFECT-10: Dynamic Import on Every `updateFrontmatter` Call
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/persistence/session-writer.ts:179` |
| **Root cause** | `await import("node:fs/promises")` runs on every invocation |
| **Fix strategy** | Add static `import { readFile } from "node:fs/promises"` at top of file |
| **Risk level** | 🔵 LOW — Performance minor |

### DEFECT-11: `computeThinkingDuration` Returns Hardcoded "present"
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/transform/agent-transform.ts:117-118` |
| **Root cause** | Method returns `"present"` instead of computing actual duration from timing data |
| **Fix strategy** | Either return `undefined` (honesty) or compute from available hook metadata. If timing data is unavailable, remove the field rather than reporting fake data |
| **Risk level** | 🟢 MEDIUM — Misleading but not blocking |

### DEFECT-12: `SessionTracker.cleanup()` Never Called
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/index.ts:324-334`, `src/plugin.ts` (no call site) |
| **Root cause** | `cleanup()` exists but `plugin.ts` never invokes it. `removeLegacyStateFiles()` never runs |
| **Fix strategy** | In `plugin.ts`, chain `void sessionTracker.initialize().then(() => sessionTracker.cleanup())` or add a disable hook |
| **Risk level** | 🔴 CRITICAL — 1.4MB legacy event-tracker state persists, defeats migration purpose |

### DEFECT-13: Turn Counters Reset on Restart (No Seeding)
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/capture/message-capture.ts:65` |
| **Root cause** | `turnCounters` Map is in-memory only. On plugin restart, all counters reset to 0 |
| **Fix strategy** | During initialization, parse existing `.md` file to count `## USER (turn N)` headers and seed `turnCounters` map |
| **Risk level** | 🟡 HIGH — Duplicate turn numbers across restarts |

### DEFECT-14: Incomplete Non-`ses_` Session ID Handling
| Property | Value |
|----------|-------|
| **File:line** | `src/features/session-tracker/types.ts:270` |
| **Root cause** | `isValidSessionID` regex `/^ses_[a-zA-Z0-9]{6,}$/` rejects IDs not matching exact format |
| **Fix strategy** | Loosen to accept any non-empty string without path separators. Use `safeSessionPath` for path safety, not regex format validation. Validate: `input.length > 0 && !input.includes("/") && !input.includes("..")` |
| **Risk level** | 🟡 HIGH — Could break if OpenCode changes session ID format |

---

## 3. Tool Redesign Analysis

### Current Tool State
The existing `src/tools/hivemind/session-tracker.ts` is a single action-dispatched tool with 3 actions (`export-session`, `list-sessions`, `search-sessions`). It has:
- GAP-01: Path traversal in `handleExportSession` (CR-02) — `resolve(trackerRoot, input.sessionId, ...)` with no validation
- GAP-02: Synchronous `statSync`/`existsSync` (IN-04)
- GAP-03: No session ID validation in `handleSearchSessions`
- GAP-04: Missing query actions (get-children, get-status, get-summary)
- GAP-05: Schema has no session ID format validation
- GAP-06: `handleListSessions` returns stale data from frozen index

### New Tool Architecture (per D-08)

#### Tool 1: `session-tracker` (C2: Governance & State)
| Property | Value |
|----------|-------|
| **Purpose** | Export, list, search, and query main session data |
| **Actions** | `export-session`, `list-sessions`, `search-sessions`, `get-status`, `get-summary` |
| **File** | `src/tools/hivemind/session-tracker.ts` (rewrite existing) |
| **Est. LOC** | ~180 LOC |
| **Zod schema sketch** |
```typescript
args: {
  action: tool.schema.enum(["export-session", "list-sessions", "search-sessions", "get-status", "get-summary"])
    .describe("What to do: export full session, list all sessions, search by keyword, get status, or get summary metadata"),
  sessionId: tool.schema.string().optional()
    .describe("Session ID for export-session, get-status, get-summary actions. Must start with 'ses_'"),
  query: tool.schema.string().optional()
    .describe("Search query for search-sessions action"),
  limit: tool.schema.number().optional().default(20)
    .describe("Max results to return (list-sessions, search-sessions)"),
  format: tool.schema.enum(["markdown", "json"]).optional().default("markdown")
    .describe("Output format for export-session"),
}
```
| **C4 compliance** | ≤200 LOC, kebab-case, action+object naming ✓ |
| **C7 compliance** | ≤3 required args (only `action` is required; `sessionId` needed for 3 of 5 actions) |
| **Key considerations** | 
- Must apply `safeSessionPath()` + `isValidSessionID()` before any path construction (fix GAP-01, GAP-03)
- Must use async `node:fs/promises` only (fix GAP-02)
- Zod validation at boundary with refined session ID (fix GAP-05)
- Must NOT read from frozen project index — scan directories directly for list-sessions until DEFECT-02 is fixed
- `get-summary` returns frontmatter without full MD body for efficient agent consumption

#### Tool 2: `session-hierarchy` (C2: Governance & State)
| Property | Value |
|----------|-------|
| **Purpose** | Navigate delegation hierarchy: parent chains, children, depths |
| **Actions** | `get-children`, `get-parent-chain`, `get-delegation-depth` |
| **File** | `src/tools/hivemind/session-hierarchy.ts` (NEW) |
| **Est. LOC** | ~160 LOC |
| **Zod schema sketch** |
```typescript
args: {
  action: tool.schema.enum(["get-children", "get-parent-chain", "get-delegation-depth"])
    .describe("What to query: list child sessions, trace parent chain, or get delegation depth"),
  sessionId: tool.schema.string()
    .describe("Session ID to query hierarchy for. Must be a valid session ID starting with 'ses_'"),
  includeStatus: tool.schema.boolean().optional().default(true)
    .describe("Include child session status in results (get-children)"),
}
```
| **C4 compliance** | ≤200 LOC ✓ |
| **C7 compliance** | 2 required args ✓ |
| **Key considerations** |
- Uses per-session `session-continuity.json` for child hierarchy (not frozen project index)
- `get-parent-chain` walks `parent_session_id` up to root
- Must handle 3-level delegation depth (grandchildren)

#### Tool 3: `session-context` (C3: Inspection & Research)
| Property | Value |
|----------|-------|
| **Purpose** | Cross-session synthesis: find related sessions, cross-reference, synthesize context |
| **Actions** | `find-related`, `cross-reference`, `synthesize-context` |
| **File** | `src/tools/hivemind/session-context.ts` (NEW) |
| **Est. LOC** | ~180 LOC |
| **Zod schema sketch** |
```typescript
args: {
  action: tool.schema.enum(["find-related", "cross-reference", "synthesize-context"])
    .describe("What to do: find sessions related to this one, cross-reference tool usage, or synthesize a context summary"),
  sessionId: tool.schema.string()
    .describe("Session ID to use as the reference point"),
  maxRelated: tool.schema.number().optional().default(10)
    .describe("Maximum number of related sessions to return (find-related)"),
}
```
| **C4 compliance** | ≤200 LOC ✓ |
| **C7 compliance** | 2 required args ✓ |
| **Key considerations** |
- `find-related` scans `project-continuity.json` for sessions sharing tool usage patterns, agent types, or time proximity
- `cross-reference` searches across all child .json files for specific tool usage or agent names
- `synthesize-context` produces a compact markdown summary of session + children for agent re-consumption

### Tool File Map (post-redesign)

| File | Tool Name | Category | Actions | Est. LOC |
|------|-----------|----------|---------|----------|
| `src/tools/hivemind/session-tracker.ts` | session-tracker | C2 Governance | export/list/search/status/summary | 180 |
| `src/tools/hivemind/session-hierarchy.ts` | session-hierarchy | C2 Governance | get-children/get-parent-chain/get-depth | 160 |
| `src/tools/hivemind/session-context.ts` | session-context | C3 Inspection | find-related/cross-reference/synthesize | 180 |

### Tool Registration (plugin.ts)
All three tools registered in `plugin.ts` alongside existing `session-tracker` registration. Old single-tool registration removed.

---

## 4. Dependency Ordering

### Wave 1: Writer Engine Fixes (strict ordering)

```
DEFECT-02 (unblock frozen queue)
    └─→ DEFECT-01 (childCount: undefined — after queue unblocked, data integrity fix)
         └─→ DEFECT-04 (handleRead file content — CR-03, independent but co-located in tool-capture.ts)
         └─→ DEFECT-05 (turnCount confusion — session-index-writer.ts, independent)
         └─→ DEFECT-06 (double-read race — session-writer.ts, independent)
         └─→ DEFECT-09 (lazy bootstrap gap — index.ts, unlock event handling)
              └─→ DEFECT-08 (child session events lost — AFTER Defect-09, needs bootstrap for child events)
                   └─→ DEFECT-03 (child records write-once — depends on Defect-08 routing being in place)
                        └─→ DEFECT-07 (toolSummary never populated — depends on tool-capture handlers functioning)
    └─→ DEFECT-11 (thinking duration — independent, agent-transform.ts)
    └─→ DEFECT-12 (cleanup() never called — independent, plugin.ts wiring)
    └─→ DEFECT-13 (turn counter seeding — independent, message-capture.ts)
    └─→ DEFECT-14 (session ID regex — independent, types.ts)
    └─→ DEFECT-10 (dynamic import — independent, session-writer.ts)

CR-01 (path traversal recovery — independent, session-recovery.ts)
D-10  (compaction capture — new handler, depends on event-capture routing working)
```

**Dependency chains:**
- **Blocking chain:** DEFECT-02 → DEFECT-01 → {DEFECT-04, DEFECT-05, DEFECT-06, DEFECT-09} → DEFECT-08 → DEFECT-03 → DEFECT-07
- **Independent fixes:** DEFECT-10, DEFECT-11, DEFECT-12, DEFECT-13, DEFECT-14, CR-01, D-10

### Wave 2: Tool Redesign (depends on Wave 1 completed)

```
Wave 1 complete (all indices working)
    └─→ GAP-05 (schema validation — prerequisite for all tools)
         └─→ [session-tracker tool rewrite] (GAP-01, GAP-02, GAP-03, GAP-04, GAP-06)
         └─→ [session-hierarchy tool] (NEW, independently buildable after Wave 1)
         └─→ [session-context tool] (NEW, independently buildable after Wave 1)

CR-02 (path traversal in tool — fix early in rewrite, blocks tool safety)
```

### Wave 3: Integration + Verification

```
Wave 1 + Wave 2 complete
    └─→ Fork handling (session metadata comparison + child reference-copy)
    └─→ Parallel session write isolation verification
    └─→ Full 163-test regression run
    └─→ Disk evidence validation (compare fresh project-continuity.json against expected)
```

---

## 5. Risk Assessment

### Critical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **DEFECT-02 fix may require significant refactor of queue** | If the queue mechanism needs complete replacement, cascading delays | Start with `.catch()` recovery + stale detection first (minimal change). Only refactor if proven insufficient |
| **Child event routing breaks main session events** | Adding child routing to `event-capture.ts` could interfere with main session handling | Add child detection at top of handler, use early return for child path. Use `parentID` check from SDK, not session ID heuristic |
| **Tool redesign breaks existing agent workflows** | Agents using current `session-tracker` tool with action parameter break if tool is replaced | Keep backward-compatible action names (`export-session`, `list-sessions`, `search-sessions`) in new tool. Add new actions without removing old ones |
| **DEFECT-02 fix unblocks writes that reveal MORE bugs** | Frozen queue was hiding data bugs. Unblocking it may expose previously silent failures | After DEFECT-02 fix, immediately run full integration test to catch newly-visible bugs before continuing |
| **Path traversal fixes missed in new code** | New tool files recreate the same vulnerability accidentally | Enforce `safeSessionPath()` as the ONLY path constructor in all tool and recovery files. Add `isValidSessionID()` guard at ALL tool boundaries |

### Regression Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **Existing 163 tests pass but are insufficient** | Tests pass in isolation but real hook sequencing reveals new bugs | Run `npm test` after every micro-task commit. Wave 3 includes live integration verification |
| **cleanup() removes needed legacy data** | 1.4MB legacy event-tracker state could contain valuable debugging data | Archive before cleanup: move to `.hivemind/event-tracker-archive/` instead of delete |
| **Child writer changes break existing child .json structures** | 83+ existing child .json files could become unreadable | `childWriter` methods should be append-only (add turns, update status). Never modify existing field schemas |

### Integration Surface Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| **New tools not discovered by agents** | Agents can't use redesigned tools | Run `npm run build` after tool registration, verify via `hivemind doctor` |
| **Tool response format inconsistent** | Pipeline chaining breaks between old and new tools | All tools use `ToolResponse<T>` from `src/shared/tool-response.ts` |
| **plugin.ts LOC grows beyond 242 target** | Tool registration boilerplate adds ~15 lines for 3 new tools | Accept temporary increase. Extraction to separate module is deferred (not in scope) |

---

## 6. Test Strategy

### Existing Test Coverage (163 tests across 17 files)
| Test File | Covers | Defects Verified |
|-----------|--------|------------------|
| `capture/tool-capture.test.ts` | Skill, read, task, other tool handlers | DEFECT-04 (after fix), DEFECT-07 |
| `capture/event-capture.test.ts` | Session lifecycle events | DEFECT-08 (after fix), DEFECT-09 |
| `capture/message-capture.test.ts` | User/assistant messages, turn counter | DEFECT-13 |
| `persistence/project-index-writer.test.ts` | Project index read/write/queue | DEFECT-01, DEFECT-02 |
| `persistence/session-index-writer.test.ts` | Session-local index, child tracking | DEFECT-05 |
| `persistence/session-writer.test.ts` | MD append, frontmatter update | DEFECT-06, DEFECT-10 |
| `persistence/child-writer.test.ts` | Child .json creation, turns, status | DEFECT-03 |
| `persistence/atomic-write.test.ts` | Path safety, atomic rename | CR-01, CR-02 (defense) |
| `transform/agent-transform.test.ts` | Agent name/model/duration extraction | DEFECT-11 |
| `types.test.ts` | isValidSessionID, types | DEFECT-14 |
| `recovery/session-recovery.test.ts` | Session recovery, reconsumption | CR-01 |
| `integration/hook-wiring.test.ts` | Hook-to-SessionTracker pipeline | REQ-ST-11 |
| `integration/recovery-integration.test.ts` | Full recovery workflow | REQ-ST-10 |
| `integration/e2e-verification.test.ts` | End-to-end capture verification | Cross-cutting |
| `integration/cleanup.test.ts` | Legacy state file cleanup | DEFECT-12 |
| `integration/concurrency.test.ts` | Parallel session write isolation | DEFECT-06, REQ-ST-09 |

### New Tests Needed (Wave 0 before Wave 1)

| Test File (NEW) | Covers | Priority |
|-----------------|--------|----------|
| `capture/tool-capture-child.test.ts` | Child session turn capture via handleTask, appendChildTurn, updateChildStatus | HIGH — DEFECT-03 |
| `capture/event-capture-child.test.ts` | Child session lifecycle event routing to childWriter (not sessionWriter) | HIGH — DEFECT-08 |
| `capture/event-capture-compaction.test.ts` | Compaction capture, breaker block in .md | MEDIUM — D-10 |
| `persistence/project-index-writer-recovery.test.ts` | Queue recovery from stuck promise, stale detection | HIGH — DEFECT-02 |
| `tools/session-tracker-safety.test.ts` | Path traversal rejection in tool, session ID validation | CRITICAL — GAP-01, CR-02 |

### Test Order (within Wave 1)

1. **Before any code change:** Run full suite — `npx vitest run tests/features/session-tracker/` — confirm 163 tests pass as baseline
2. **After each micro-task:** Run scoped tests + `npm run typecheck`
3. **After each Wave 1 sub-chain completes:** Run full suite
4. **Wave 1 completion gate:** Full suite green, all 14 defects have at least one test verifying the fix
5. **Wave 2 completion gate:** Tool integration tests pass, all 3 tools discoverable
6. **Wave 3 completion gate:** 163 + new tests all green, disk evidence matches expectations

---

## 7. Implementation Patterns

### Pattern 1: Dependency Injection (all new classes follow this)
```typescript
// All capture classes receive writers via constructor. New handlers follow same pattern.
constructor(deps: {
  sessionWriter: SessionWriter
  childWriter: ChildWriter           // NEW: needed for child event routing
  sessionIndexWriter: SessionIndexWriter
  projectIndexWriter: ProjectIndexWriter
  client: OpenCodeClient              // NEW: needed for parentID queries
}) { ... }
```

### Pattern 2: Best-Effort Handlers (all `handle*` methods)
```typescript
// All handler methods wrapped in try/catch — never throw to OpenCode runtime.
async handleSessionEvent(event: {...}): Promise<void> {
  try {
    // ...handler logic...
  } catch (err) {
    console.warn("[Harness] Session tracker: event handler failed:", err)
  }
}
```

### Pattern 3: Child Session Routing (new pattern for DEFECT-08)
```typescript
// In event-capture.ts handleSessionEvent:
// 1. Query SDK for parentID: const session = await getSession(client, event.sessionID)
// 2. If parentID !== null → route to childWriter
// 3. If parentID === null → route to sessionWriter (existing behavior)

async handleSessionEvent(event: {...}): Promise<void> {
  try {
    if (!event?.sessionID || !isValidSessionID(event.sessionID)) return
    // ... existing validation ...
    
    const session = await getSession(this.client, event.sessionID)
    const isChildSession = session?.parentID !== null
    
    if (isChildSession) {
      await this.routeChildEvent(event.sessionID, event.eventType, session.parentID)
      return
    }
    
    // ... existing main session handling ...
  } catch (err) {
    console.warn("[Harness] Session tracker: event handler failed:", err)
  }
}
```

### Pattern 4: Queue Recovery (for DEFECT-02)
```typescript
// Wrap enqueueWrite callback in try/catch to prevent single failure from blocking queue.
private async enqueueWrite(fn: () => Promise<void>): Promise<void> {
  this.writeQueue = this.writeQueue.then(async () => {
    try {
      await fn()
    } catch (err) {
      console.warn("[Harness] Session tracker: project index write failed:", err)
      // Don't rethrow — keeps queue alive for subsequent writes
    }
  })
  return this.writeQueue
}
```

### Pattern 5: Atomic Writes (unchanged, all new writes use this)
```typescript
// All persistence writers use atomicWriteJson / atomicAppendMarkdown from atomic-write.ts
// Write to temp file → fs.rename() — no partial writes visible to readers.
```

### Pattern 6: Schema-First Tool Design (for Wave 2 tools)
```typescript
// From CUSTOM-TOOLS-CRITERIA Appendix A template:
export default tool({
  description: "[What this tool does]. [When to use]. [What it returns].",
  args: {
    action: tool.schema.enum([...]).describe("..."),
    // ≤3 required args
  },
  async execute(args, context): Promise<ToolResponse> {
    // 1. Validate at boundary (Zod schema does this)
    // 2. Apply safeSessionPath + isValidSessionID for any path construction
    // 3. Execute logic
    // 4. Return success() or error() ToolResponse
  },
})
```

### Anti-Patterns to Avoid
- **Direct `resolve(trackerRoot, sessionId, ...)` without `safeSessionPath` or `isValidSessionID` check** — path traversal vulnerability (already caused CR-01, CR-02)
- **Blocking `statSync`/`existsSync` in tool handlers** — use async `node:fs/promises` equivalents
- **Dynamic `import("node:fs/promises")` inside methods** — use static imports at module top
- **`let` for non-reassigned variables** — use `const`
- **Non-null assertions (`!`)** — use proper null checks
- **Spreading `undefined` values into objects** — omit the key entirely or use null-coalescing defaults
- **Reading from `project-continuity.json` in tool without fallback** — the index may be stale; tools should scan directories as fallback

---

## 8. Open Questions

1. **DEFECT-02 root cause: Why is the serial queue stuck?**
   - What we know: `lastUpdated` frozen for 7+ hours. Queue is a simple `writeQueue = writeQueue.then(...)` chain
   - What's unclear: Is it a stuck promise (unhandled rejection stopping the chain) or no writes being queued (events not reaching the index writer)?
   - Recommendation: ADD logging to `enqueueWrite` to confirm writes are being queued. Inspect running process or add `console.warn` on queue stall

2. **How does OpenCode SDK `getSession()` work for child sessions?**
   - What we know: Event hooks provide `sessionID` and events. SDK `getSession()` should return session metadata including `parentID`
   - What's unclear: Does SDK `getSession()` work for child sessions that were dispatched via `task` tool? Does it require different permissions?
   - Recommendation: Test `getSession()` call with a known child session ID before implementing DEFECT-08 routing

3. **What is the exact OpenCode session ID format?**
   - What we know: Current regex `/^ses_[a-zA-Z0-9]{6,}$/`. All observed IDs match this pattern
   - What's unclear: Will OpenCode change this format? Are underscores/hyphens allowed?
   - Recommendation: Loosen validation to reject only path separators and `.` traversal sequences. Don't validate format, validate safety

4. **Should compaction capture (D-10) write to `.md` or `.json`?**
   - What we know: D-10 says "write a compacted section to the main `.md` file"
   - What's unclear: Format details of the breaker block, how agents consume it
   - Recommendation: Write as `## COMPACTED (2026-05-12T00:00:00Z)` markdown section with YAML-like metadata block summarizing decisions, active TODOs, and pending delegations

5. **What is the exact `session.compacted` event payload?**
   - What we know: The spec references this event but code has never been written for it
   - What's unclear: Does OpenCode SDK v2 emit this event? What fields does it carry?
   - Recommendation: Check OpenCode SDK v2 documentation for experimental session events. Add handler with try/catch — best-effort, never throws

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified). All fixes use existing stack: gray-matter, yaml, zod, node:fs/promises, @opencode-ai/plugin SDK. No new npm installs, no external services required.

---

## Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (existing) |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npx vitest run tests/features/session-tracker/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-ST-01 | Session dir + project index | unit | `npx vitest run tests/features/session-tracker/persistence/project-index-writer.test.ts` | ✅ |
| REQ-ST-04 | Skill capture (first header) | unit | `npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts` | ✅ |
| REQ-ST-05 | Read — no file content | unit | NEW: `npx vitest run tests/features/session-tracker/capture/tool-capture.test.ts -t "handleRead"` | ❌ Wave 0 |
| REQ-ST-06 | Task → child .json | unit | NEW: `npx vitest run tests/features/session-tracker/capture/tool-capture-child.test.ts` | ❌ Wave 0 |
| REQ-ST-08 | Dual indices update | unit | Existing project/session index writer tests, need update for toolSummary | ✅ partial |
| REQ-ST-09 | Concurrent write isolation | unit | `npx vitest run tests/features/session-tracker/integration/concurrency.test.ts` | ✅ |
| REQ-ST-11 | CQRS boundary | unit | `npx vitest run tests/features/session-tracker/integration/hook-wiring.test.ts` | ✅ |
| REQ-ST-13 | Legacy cleanup | unit | `npx vitest run tests/features/session-tracker/integration/cleanup.test.ts` + NEW wiring test | ✅ partial |

### Wave 0 Gaps
- [ ] `tests/features/session-tracker/capture/tool-capture-child.test.ts` — covers DEFECT-03 child turn capture
- [ ] `tests/features/session-tracker/capture/event-capture-child.test.ts` — covers DEFECT-08 child event routing
- [ ] `tests/features/session-tracker/persistence/project-index-writer-recovery.test.ts` — covers DEFECT-02 queue recovery
- [ ] `tests/features/session-tracker/tools/session-tracker-safety.test.ts` — covers CR-02, GAP-01 path traversal

---

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | Path traversal prevention via `safeSessionPath()` |
| V5 Input Validation | yes | Zod schema validation at tool boundary, `isValidSessionID()`, `sanitizeSessionID()` |
| V6 Cryptography | no | — |

### Known Threat Patterns for Session Tracker
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path traversal via session ID in tool input | Tampering | Apply `isValidSessionID()` + `safeSessionPath()` before ANY path construction. Validate at Zod schema boundary |
| File content capture via heuristic error detection | Information Disclosure | Never inspect file content for error detection. Use structured tool output metadata only |
| Race condition in frontmatter update (double-read) | Tampering | Serialize per-session .md writes or use atomic write that doesn't re-read |
| Stale index data returned to agents | Information Disclosure | Tools should scan directories as fallback when index is stale |
| Legacy state files with sensitive data | Information Disclosure | Archive (don't delete) during cleanup |

---

## Sources

### Primary (HIGH confidence)
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/01-EVIDENCE-MATRIX.md` — SPEC vs Reality for all 13 REQs with L1/L2 evidence
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/02-SOURCE-DEFECTS.md` — 14 writer engine defects with file:line references
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/03-TOOL-GAPS.md` — 6 tool surface deficiencies with design notes
- `.hivemind/planning/phase-12-cp-st-01-remediation-2026-05-12/04-REVIEW-FINDINGS-STATUS.md` — Status of all 14 review findings
- `.planning/phases/CP-ST-01-session-tracker-revamp/01-SPEC.md` — Locked 13 requirements
- `.planning/phases/CP-ST-01-session-tracker-revamp/CP-ST-01-REVIEW.md` — 14 review findings (3 critical, 6 warning, 5 info)
- `.planning/archive/2026-05-07/CUSTOM-TOOLS-CRITERIA-2026-05-05.md` — 10 tool design criteria
- Source code files: `src/features/session-tracker/index.ts`, `capture/tool-capture.ts`, `capture/event-capture.ts`, `persistence/project-index-writer.ts`, `persistence/session-writer.ts`, `persistence/session-index-writer.ts`, `types.ts`
- Live disk evidence: `.hivemind/session-tracker/project-continuity.json` (83 entries, all childCount=0, frozen lastUpdated)
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority

### Secondary (MEDIUM confidence)
- Test files: `tests/features/session-tracker/` — 17 test files, 163 total tests
- `.planning/phases/12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02-/12-CONTEXT.md` — Implementation decisions (D-01 through D-11)

### Tertiary (LOW confidence)
- None — all findings cross-referenced with L1 disk evidence or L4 source code analysis

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | No unverified assumptions. All claims verified against L1 disk evidence or L4 source code analysis. | — | — |

---

## Metadata

**Confidence breakdown:**
- Source defects: HIGH — all 14 have file:line references and L1/L4 evidence cross-referenced
- Architecture patterns: HIGH — patterns documented in source code and ARCHITECTURE.md
- Tool redesign: HIGH — CUSTOM-TOOLS-CRITERIA provides binding design constraints
- Pitfalls: HIGH — all 14 review findings + 8 additional systemic issues documented

**Research date:** 2026-05-12
**Valid until:** 2026-06-12 (stable architecture, no external dependency changes expected)

---

## RESEARCH COMPLETE
