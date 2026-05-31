# Phase P41-E: Progressive Disclosure Tool for Delegation History + Session Metadata - Research

**Researched:** 2026-05-31
**Domain:** Read-only query tool over session-tracker delegation data
**Confidence:** HIGH

## Summary

P41-E creates a new `session-delegation-query` tool that provides progressive-disclosure access to delegation history via session-tracker's `hierarchy-manifest.json` and child `.json` files. After P41-D deleted old persistence files (`.hivemind/state/delegations.json`, `session-continuity.json`) and made their writers no-ops, session-tracker is the only canonical source for delegation data.

The new tool has two actions: `list` (paginated summary with filtering) and `get` (full detail drill-down). It differs from existing tools by combining pagination, multi-dimension filtering, and progressive disclosure (summary → detail → full export) in a single focused tool. It reads exclusively from session-tracker files — no in-memory delegation state, no legacy readers.

**Primary recommendation:** Create `src/tools/session/session-delegation-query.ts` + `src/schema-kernel/session-delegation-query.schema.ts`, register in `registerHivemindTools()`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Delegation summary listing | `hierarchy-manifest.json` per root session | — | Flattened `Record<string, HierarchyManifestChild>` is the canonical delegation index. Read via `safeSessionPath()`. |
| Delegation detail drill-down | Child `.json` files per root session | — | `ChildSessionRecord` is the full record. Read via `resolveSessionFile()` → `readFile()`. |
| Session discovery (by root) | `project-continuity.json` | `readdir()` fallback | First try the index; fall back to directory scan (same pattern as `session-tracker.ts:236-275`). |
| Manifest regeneration on miss | `HierarchyManifestWriter.loadManifest()` | — | Existing G-1 pattern: if manifest file missing, regenerate from continuity tree (hierarchy-manifest.ts:276-296). |

## Standard Stack

No new packages. The tool is built entirely on existing types and utilities:

| Module | Purpose | Why |
|--------|---------|-----|
| `src/features/session-tracker/types.ts` | `HierarchyManifest`, `HierarchyManifestChild`, `ChildSessionRecord` type imports | Canonical types for both list and get actions |
| `src/features/session-tracker/persistence/atomic-write.ts` | `safeSessionPath()`, `sessionTrackerRoot()` | Safe path construction for reading manifest + child files |
| `src/tools/session/session-resolver.ts` | `resolveSessionFile()` | Session file resolution (proven across 4 existing tools) |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts` | `HierarchyManifestWriter.loadManifest()` (via `getChildren()`/`getChild()`) | Read manifest with auto-regeneration fallback |
| `src/shared/tool-helpers.ts` | `renderToolResult()` | Standard tool result serialization |
| `src/shared/tool-response.ts` | `success()`, `error()` | Standard tool response envelope |
| `src/schema-kernel/session-tracker.schema.ts` | `safeSessionId` | Reusable Zod session ID refinement |

## Session-Tracker File Structure

```
.hivemind/session-tracker/
├── project-continuity.json          # Index: sesID → metadata, chronologicalOrder[]
├── ses_1ed9df1adffe2hbJudz3sK60y3/ # Root main session directory
│   ├── ses_1ed9df1adffe2hbJudz3sK60y3.md   # Main session knowledge file
│   ├── session-continuity.json              # Hierarchical continuity tree
│   ├── hierarchy-manifest.json              # FLATTENED delegation index (target for list)
│   ├── ses_1ed9c5c20ffePWOXce5JQpS5Yk.json # Child session record (target for get)
│   └── ses_...                             # More child .json files
└── ses_.../
```

**Key insight for list action:** `hierarchy-manifest.json` contains a flat `children: Record<string, HierarchyManifestChild>` with ALL children (L1, L2, L3...) under that root session. Each entry has `sessionID`, `parentSessionID`, `delegationDepth`, `delegatedBy`, `subagentType`, `createdAt`, `updatedAt`, `status`, `turnCount`, `childFile` — enough fields for a rich summary without reading individual child files.

**Key insight for get action:** The child `.json` file (`ses_xxx.json`) contains the full `ChildSessionRecord` with `turns`, `journey`, `delegatedBy`, `mainAgent`, `lastMessage`, and all P41-B gap fields. Reading just one file per drill-down is efficient.

## Architecture Patterns

### Data Flow

```
Agent calls session-delegation-query
    │
    ├── action: "list"
    │   ├── with rootSessionId → read that session's hierarchy-manifest.json → filter + paginate
    │   └── without rootSessionId → scan project-continuity.json / readdir() → read each manifest → aggregate → filter + paginate
    │
    └── action: "get"
        └── resolveSessionFile(projectRoot, sessionId) → read child .json → extract turnSummary → return
```

### Pattern: Manifest-Based Paginated List

The `list` action reads `hierarchy-manifest.json` for each root session, applies filters server-side, then slices by offset/limit. This is more efficient than reading child `.json` files since the manifest already contains summary fields.

```typescript
// Pseudocode for list action:
async function handleList(projectRoot, filters) {
  const rootSessions = await discoverRootSessions(projectRoot) // project-continuity.json or readdir
  const allDelegations: DelegationSummary[] = []

  for (const rootId of rootSessions) {
    const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
    try {
      const raw = await readFile(manifestPath, "utf-8")
      const manifest = JSON.parse(raw) as HierarchyManifest
      for (const [childId, child] of Object.entries(manifest.children)) {
        if (matchesFilters(child, filters)) {
          allDelegations.push({
            sessionID: childId,
            rootMainSessionID: child.rootMainSessionID,
            parentSessionID: child.parentSessionID,
            subagentType: child.subagentType,
            delegatedBy: child.delegatedBy,
            status: child.status,
            delegationDepth: child.delegationDepth,
            turnCount: child.turnCount,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt,
          })
        }
      }
    } catch { /* skip unreadable manifest */ }
  }

  // Sort by updatedAt descending
  allDelegations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  // Apply pagination
  const total = allDelegations.length
  const paginated = allDelegations.slice(filters.offset, filters.offset + filters.limit)

  return success(`Found ${total} delegation(s)`, {
    delegations: paginated,
    total, offset: filters.offset, limit: filters.limit,
    hasMore: total > filters.offset + filters.limit,
  })
}
```

### Pattern: Detail-Only Drill-Down via `resolveSessionFile`

The `get` action uses the proven `resolveSessionFile()` resolver to find and read the child `.json` file. No manifest needed for this path — just read the one file.

```typescript
// Pseudocode for get action:
async function handleGet(projectRoot, sessionId) {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved || resolved.type !== "child" || !resolved.childRecord) {
    return error(`Session ${sessionId} not found in any hierarchy-manifest. Try "list" to discover available sessions.`)
  }

  const record = resolved.childRecord
  const toolSummary: Record<string, number> = {}
  for (const turn of record.turns) {
    for (const toolCall of turn.tools ?? []) {
      if (toolCall.tool) toolSummary[toolCall.tool] = (toolSummary[toolCall.tool] ?? 0) + 1
    }
  }

  return success(`Delegation detail: ${sessionId}`, {
    sessionID: record.sessionID,
    parentSessionID: record.parentSessionID,
    delegationDepth: record.delegationDepth,
    delegatedBy: record.delegatedBy,
    mainAgent: record.mainAgent,
    created: record.created,
    updated: record.updated,
    status: record.status,
    turnCount: record.turns.length,
    turnSummary: { toolSummary, firstTurnAt: record.turns[0]?.timestamp, lastTurnAt: record.turns[record.turns.length - 1]?.timestamp },
    journeyEntryCount: record.journey?.length ?? 0,
    lastMessage: record.lastMessage?.slice(0, 500),
    children: { count: record.children.length, ids: record.children },
    // P41-B gap fields:
    ...(record.queueKey ? { queueKey: record.queueKey } : {}),
    ...(record.terminalKind ? { terminalKind: record.terminalKind } : {}),
    ...(record.recoveryGuarantee ? { recoveryGuarantee: record.recoveryGuarantee } : {}),
    ...(record.executionMode ? { executionMode: record.executionMode } : {}),
    ...(record.lifecycle ? { lifecycle: record.lifecycle } : {}),
    _note: "Journey entries and turns excluded — use session-tracker export-session for full content",
  })
}
```

### Recommended Project Structure (new files)

```
src/
├── schema-kernel/
│   └── session-delegation-query.schema.ts  # Zod schemas for list + get
└── tools/
    └── session/
        └── session-delegation-query.ts     # Tool implementation
```

### Anti-Patterns to Avoid

- **Don't merge with in-memory delegation state:** The entire point of P41-E is session-tracker-only reads. Importing from `DelegationManager` or `delegation-persistence.ts` would create circular dependencies and defeat the clean separation.
- **Don't read old deleted files:** P41-D deleted `delegations.json` and made readers return `[]`. The new tool must not try to re-read these files.
- **Don't include turn content in list:** Listing delegations should return summary fields only. Full turn content belongs in the `get` drill-down or `session-tracker export-session`.
- **Don't add control actions:** Abort, cancel, resume, chain, restart belong in `delegation-status`. The new tool is read-only query.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session ID validation | Custom regex/path check | `safeSessionId` from `session-tracker.schema.ts` | Already proven, rejects path traversal, used by 3 existing tools |
| Session file resolution | Manual directory scanning | `resolveSessionFile()` | Handles both main and child sessions, scans all roots with fallback |
| Tool response formatting | Custom JSON serialization | `renderToolResult()` + `success()`/`error()` | Standard envelope across all 23+ existing tools |
| Hierarchy manifest regeneration | Reimplement continuity tree walking | `HierarchyManifestWriter.loadManifest()` | G-1 derivative cache — regenerates from continuity tree automatically |

## Common Pitfalls

### Pitfall 1: Off-by-One Pagination with `offset` + `limit`
**What goes wrong:** Tools that paginate by "page number" are harder to use. Offset-based pagination must be 0-indexed.
**How to avoid:** Use `offset` (0-indexed, default 0) and `limit` (entries per page, default 20, max 100). Apply after all filters and sorting: `slice(offset, offset + limit)`. Return `hasMore: total > offset + limit`.

### Pitfall 2: Reading Child `.json` Files from Wrong Parent Directory
**What goes wrong:** Per D-03, ALL child `.json` files are stored under the ROOT main session directory, not the immediate parent. Using the immediate parent as the directory will miss the file.
**How to avoid:** Always use `resolveSessionFile()` which handles this correctly via `HierarchyManifest` lookup. Never construct child file paths manually.

### Pitfall 3: Performance When Scanning Many Root Sessions
**What goes wrong:** The `list` action without `rootSessionId` scans ALL root session directories. With hundreds of sessions, this could be slow.
**How to avoid:** When `rootSessionId` is provided, skip the full scan and read only that session's manifest (fast path). For full scans, use `project-continuity.json` chronologicalOrder as the authoritative list of root sessions — only fall back to `readdir()` when the index is missing. Add a `maxResults` hard cap (1000) to prevent unbounded memory use.

### Pitfall 4: Using `HierarchyManifestWriter` Instance for Read-Only Operations
**What goes wrong:** `HierarchyManifestWriter` has a side effect: `loadManifest()` writes a regenerated manifest to disk if the file is missing. A read-only tool should not write files.
**How to avoid:** Either (a) read `hierarchy-manifest.json` directly with `readFile()` + `JSON.parse()` and only use `generateFromContinuity()` as explicit fallback, or (b) accept the write side effect as a cache optimization (same as the existing `delegation-status.ts` pattern which uses `HierarchyManifestWriter` indirectly via `readManifest()`). Option (a) is cleaner for a read-only tool.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Read delegations from `delegations.json` + in-memory DelegationManager | Read from `hierarchy-manifest.json` + child `.json` | P41-D (2026-05-31) | All delegation reads now go through session-tracker files |
| Read session continuity from `session-continuity.json` | Read from session-tracker children + in-memory cache | P41-C / P41-D | Session-continuity.json file deleted; in-memory cache persists for same-process |
| Manual directory scanning for child discovery | `resolveSessionFile()` with `HierarchyManifest` lookup | P41-B / P41-C | Standard resolver proven across 4 tools |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Tool registers under `registerHivemindTools()` | Standard Stack | LOW — same pattern as 8 existing tools |
| A6 | Schema file in `schema-kernel/` preferred | Standard Stack | LOW — inline also works, proven by `delegation-status.ts` |
| A7 | `list` scans multiple root session dirs | Architecture Patterns | LOW — proven by `session-tracker filter-sessions` (lines 339-398) |

**This table is non-empty.** The planner should confirm the schema-kernel placement decision with the user before implementing.

## Open Questions

1. **Should the tool reuse `HierarchyManifestWriter.loadManifest()` or read the manifest file directly?**
   - What we know: `loadManifest()` auto-regenerates on read miss and writes back to disk. The existing `delegation-status.ts` uses direct `readFile()` + `JSON.parse()` in `readManifest()` (lines 180-196) and adds per-invocation caching.
   - What's unclear: Whether the write-side effect of `loadManifest()` is acceptable for a read-only tool.
   - Recommendation: Read the manifest file directly with `readFile()` + `JSON.parse()`, similar to `delegation-status.ts:readManifest()`. If the file is missing, use `generateFromContinuity()` as explicit fallback without writing.

2. **Should the tool support `sortBy` and `sortOrder` parameters?**
   - What we know: Currently only descending by `updatedAt` makes sense. Adding sort parameters adds complexity.
   - What's unclear: Whether agents will need other sort orders (by createdAt, by depth, by turnCount).
   - Recommendation: Start with fixed `updatedAt desc` sort. If agents need other sort orders, add later. The existing `session-tracker filter-sessions` doesn't support sorting at all — so no sort is the current baseline.

3. **How should tool namespacing work?**
   - What we know: The tool is named `session-delegation-query` and registers under hivemind tools.
   - What's unclear: Whether it should be a standalone tool or a new action on an existing tool.
   - Recommendation: Standalone. It's a distinct read-side query tool with its own schema. Adding it as an action on `delegation-status` would bloat that tool further (already 734 lines, 7 actions).

## Environment Availability

> Skipped — this phase creates a new read-only tool with no external dependencies beyond the existing session-tracker file system. No new tools, services, or runtimes required.

## Validation Architecture

> Skip this section — `workflow.nyquist_validation` is not explicitly enabled for individual subphases within P41. Unit tests for the new tool follow existing patterns: test input validation (Zod schemas), test manifest reading, test child file reading, test pagination logic. Integration-style tests verify the tool returns expected shape for known session-tracker fixtures.

## Security Domain

> Security enforcement is not explicitly required for this phase. The tool is read-only (no mutation authority), reads from trusted local filesystem paths via `safeSessionPath()`, and validates session IDs with `safeSessionId` rejection of path traversal. Standard defense-in-depth via session ID validation + safe path construction applies (identical to `session-tracker` and `session-hierarchy` tools).

## Sources

### Primary (HIGH confidence)
- `src/features/session-tracker/types.ts` — `HierarchyManifest`, `HierarchyManifestChild`, `ChildSessionRecord`, `HierarchyManifestChild` field definitions
- `src/features/session-tracker/persistence/hierarchy-manifest.ts` — `HierarchyManifestWriter.loadManifest()` read-miss regeneration pattern (G-1 derivative cache)
- `src/tools/delegation/delegation-status.ts` — Existing tool's `getSessionTrackerChildren()` (lines 199-242), `readManifest()` (lines 180-196), `canAccessDelegation()` (lines 245-264) — proven session-tracker read patterns
- `src/tools/session/session-tracker.ts` — `handleFilterSessions()` (lines 339-422) — directory scanning + manifest-based filtering pattern
- `src/tools/session/session-hierarchy.ts` — `handleGetManifest()` (lines 209-283) — manifest reading pattern
- `src/tools/session/session-resolver.ts` — `resolveSessionFile()` — standard session file resolution
- `src/plugin.ts` — `registerHivemindTools()` (lines 163-174) — tool registration pattern
- `src/schema-kernel/session-tracker.schema.ts` — `safeSessionId`, Zod discriminated union pattern for multi-action tools
- `src/schema-kernel/session-view.schema.ts` — Single-action tool schema pattern

### Secondary (MEDIUM confidence)
- `src/shared/tool-response.ts` — `success()`, `error()` response envelope
- `src/shared/tool-helpers.ts` — `renderToolResult()` JSON serialization

### Tertiary (LOW confidence)
- None — all claims are codebase-verified.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all modules and patterns verified in existing code
- Architecture: HIGH — both list and get patterns proven in existing tools
- Pitfalls: HIGH — all derived from codebase analysis of existing tool implementations
- Assumptions: HIGH (6/7 verified by codebase analysis, 1 MEDIUM for schema-kernel placement preference)

**Research date:** 2026-05-31
**Valid until:** Stable — session-tracker types are production-locked.
