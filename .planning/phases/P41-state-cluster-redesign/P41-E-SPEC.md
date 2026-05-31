# P41-E: Progressive Disclosure Tool for Delegation History + Session Metadata

**Phase:** P41-E
**Predecessor:** P41-D (deleted old files, made writers no-ops)
**Domain:** Read-only query tool over session-tracker data

---

## REQ-P41E-01: `session-delegation-query` Tool Lists Delegations with Pagination

**Rationale:** Agents need a fast, paginated way to browse delegation history without loading full child session records. The existing `delegation-status` tool mixes status checking, control actions, and stacking discovery — it is not a focused delegation-history browser.

**Acceptance criteria:**
- A new tool named `session-delegation-query` is registered in `plugin.ts` under `registerHivemindTools()`.
- The tool exposes a `list` action that returns a paginated summary of delegations.
- Pagination uses `offset` and `limit` parameters (limit default 20, max 100).
- Each summary entry includes: `sessionID`, `subagentType`, `delegatedBy`, `status`, `delegationDepth`, `createdAt`, `updatedAt`, `turnCount`.
- Results are sorted by `updatedAt` descending (most recent first).
- The list action reads from `hierarchy-manifest.json` files exclusively — no in-memory delegation manager, no old file readers.
- If `rootSessionId` is provided, only delegations under that root session are returned.
- Response includes `total`, `offset`, `limit`, `hasMore` metadata.

## REQ-P41E-02: Tool Supports Drill-Down (Single Delegation Detail)

**Rationale:** After browsing the summary list, agents need to drill into a specific delegation to read its full metadata, turn summary, and journey entries.

**Acceptance criteria:**
- A `get` action returns the full `ChildSessionRecord` for a single delegation by `sessionID`.
- The drill-down response includes:
  - All fields from `ChildSessionRecord`: `sessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy` (agent name, model, tool, description, subagentType), `mainAgent` (name, model), `created`, `updated`, `status`
  - `turnCount` (total number of turns)
  - `turnSummary` (first and last turn timestamps, tool name counters aggregated across all turns) — NOT the full turn content
  - `journeyEntryCount` (count of journey entries, if present)
  - `lastMessage` excerpt (first 500 chars)
  - `children` list (child session IDs, count)
  - Gap fields from P41-B: `queueKey`, `terminalKind`, `recoveryGuarantee`, `executionMode`, `lifecycle`
- The response explicitly states "Journey entries and turns excluded — use session-tracker export-session for full content" to guide the agent on next steps.
- Error message includes guidance: "Session ID {x} not found in any hierarchy-manifest. Try `list` to discover available sessions."

## REQ-P41E-03: Tool Reads from Session-Tracker Exclusively

**Rationale:** After P41-D deleted old files and made old readers into no-ops, the only canonical source for delegation data is session-tracker's `hierarchy-manifest.json` + child `.json` files. The new tool must not reference in-memory delegation state, `delegation-persistence.ts`, or any other legacy store.

**Acceptance criteria:**
- The tool implementation imports from `../../features/session-tracker/types.js` and `../../features/session-tracker/persistence/atomic-write.js` only.
- The tool does NOT import from `../../task-management/continuity/delegation-persistence.js`.
- The tool does NOT reference `DelegationManager`, `DelegationStatusInputSchema`, or any in-memory delegation state.
- The tool uses `safeSessionPath()` for all file reads.
- The tool uses `resolveSessionFile()` from `session-resolver.ts` for session discovery.
- The tool reads `hierarchy-manifest.json` for the summary (list) action — this file contains the flattened `Record<string, HierarchyManifestChild>` that is the canonical delegation index.
- The tool reads child `.json` files for the drill-down (get) action — these contain the full `ChildSessionRecord`.
- If `hierarchy-manifest.json` is missing for the queried root session, the tool falls back to `generateFromContinuity()` from `HierarchyManifestWriter` — which regenerates the manifest from the continuity tree (G-1 derivative cache pattern already exists at hierarchy-manifest.ts line 290).

## REQ-P41E-04: Existing Tools Remain Functional

**Rationale:** `delegation-status`, `session-tracker`, `session-hierarchy`, and `hivemind-session-view` are existing tools with overlapping but distinct responsibilities. The new `session-delegation-query` tool must not break, duplicate, or deprecate them.

**Acceptance criteria:**
- `delegation-status` continues to: check delegation status, list delegations (with in-memory merge), control delegations (abort/cancel), find stackable sessions.
- `session-tracker` continues to: export sessions, get status/summary, list/search/filter sessions.
- `session-hierarchy` continues to: get-children, get-parent-chain, get-delegation-depth, get-manifest.
- `hivemind-session-view` continues to: get unified view across session-tracker + delegations + trajectory.
- The new tool is a *complement*, not a replacement: it provides a focused, paginated, progressive-disclosure query path that none of the existing tools offer alone.
- No existing tool's Zod schema, action enum, or execute handler is modified.
- No tool registration in `plugin.ts` is removed or renamed.

---

## Actions Summary

| Action | Input | Output |
|--------|-------|--------|
| `list` | `rootSessionId?`, `status?`, `agentType?`, `delegatedBy?`, `minDepth?`, `maxDepth?`, `updatedAfter?`, `updatedBefore?`, `offset` (default 0), `limit` (default 20, max 100) | Paginated array of `DelegationSummary` entries + total/offset/limit/hasMore |
| `get` | `sessionId` | Full delegation detail with turnSummary, no full turns/journey |

## Non-Goals

- The tool does NOT provide control actions (abort, cancel, resume, chain, restart) — use `delegation-status` for those.
- The tool does NOT provide full turn export — use `session-tracker export-session` for that.
- The tool does NOT provide stacking discovery — use `delegation-status find-stackable` for that.
- The tool does NOT provide project-level session listing — use `session-tracker list-sessions` for that.
- The tool does NOT modify or write any data — read-only (CQRS read-side).
