# P41-C: Update Readers to Prefer Session-Tracker — Research

**Researched:** 2026-05-31
**Domain:** Reader migration / data source preference flip
**Confidence:** HIGH (all 5 readers read directly from source code)

---

## Summary

P41-C migrates 5 reader code paths to prefer session-tracker data over old-file data, while keeping old file paths functional as fallback. The changes are additive — no deletion, no data loss risk. A new `continuity-reader.ts` module provides enrichment helpers for continuity metadata (lifecycle, pendingNotifications, compactionCheckpoint). Two files need type additions (`HookDependencies`, `ToolGuardDependencies`). Three import sites need new imports or parameter propagation.

**Primary recommendation:** Implement in this order — (1) new `continuity-reader.ts`, (2) `HookDependencies` + `ToolGuardDependencies` types, (3) merge order flip in `delegation-status.ts`, (4) session-view redirect, (5) plugin.ts enrichment, (6) session-hooks enrichment, (7) tool-guard-hooks enrichment, (8) typecheck + tests.

**Risk level:** LOW — all changes are additive or order-flip. No old paths removed. Enrichment helper is fire-and-forget with internal try-catch.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Continuity enrichment | `task-management/continuity/` | — | New `continuity-reader.ts` lives alongside existing continuity store |
| Delegation merge priority | `tools/delegation/` | — | `delegation-status.ts` owns the merge logic |
| Session view delegation read | `tools/hivemind/` | `tools/session/` | `hivemind-session-view.ts` calls `resolveSessionFile` from session resolver |
| Notification replay enrichment | `plugin.ts` (orchestrator) | `task-management/continuity/` | Plugin orchestrates; continuity module provides enrichment |
| Hook continuity enrichment | `hooks/lifecycle/` + `hooks/guards/` | `task-management/continuity/` | Hooks consume enrichment from continuity module |

---

## Standard Stack

No new packages required. All dependencies are already in the codebase:

| Dependency | File | Already Used By |
|------------|------|-----------------|
| `resolveSessionFile` | `src/tools/session/session-resolver.ts` | `delegation-status.ts`, `hivemind-session-view.ts` |
| `ChildSessionRecord` | `src/features/session-tracker/types.ts` | `session-resolver.ts`, `child-writer.ts` |
| `SessionContinuityRecord` | `src/shared/types.ts` | `continuity/index.ts` |
| `getSessionContinuity` | `src/task-management/continuity/index.ts` | `session-hooks.ts`, `tool-guard-hooks.ts` |
| `listSessionContinuity` | `src/task-management/continuity/index.ts` | `plugin.ts` |

---

## Package Legitimacy Audit

**Skipped — this phase adds no external packages.** Zero npm/PyPI/cargo dependencies. All types and utilities are already in the codebase. No `package.json` changes.

---

## Architecture Patterns

### Pattern 1: Fire-and-Forget Enrichment

**What:** A wrapper function that takes old-data, queries session-tracker for newer data, merges session-tracker fields on top, and returns. Never throws — internal try-catch returns original data.

**When to use:** Any reader that previously read from old-file-only should be wrapped with enrichment. The enrichment is a *decorator* pattern around the existing read.

**Example (from SPEC):**
```typescript
export async function enrichContinuityWithTracker(
  record: SessionContinuityRecord,
  projectRoot?: string,
): Promise<SessionContinuityRecord> {
  if (!projectRoot || !record.sessionID) return record
  try {
    const resolved = await resolveSessionFile(projectRoot, record.sessionID)
    if (!resolved || resolved.type !== "child" || !resolved.childRecord) return record
    const childRecord = resolved.childRecord
    if (!childRecord.lifecycle && !childRecord.pendingNotifications && !childRecord.compactionCheckpoint) {
      return record
    }
    return {
      ...record,
      metadata: {
        ...record.metadata,
        lifecycle: childRecord.lifecycle ?? record.metadata.lifecycle,
        pendingNotifications: childRecord.pendingNotifications ?? record.metadata.pendingNotifications,
        compactionCheckpoint: childRecord.compactionCheckpoint ?? record.metadata.compactionCheckpoint,
      },
    }
  } catch {
    return record
  }
}
```

### Pattern 2: Array Order Flip for Last-Write-Wins

**What:** The `mergeAllDelegations()` function builds a `Map<string, Delegation>` by iterating an array. `.set()` replaces on key collision, so later entries in the array take precedence. Changing the array order changes which data source wins on merge.

**When to use:** Any multi-source merge with last-write-wins semantics. The order determines data source priority.

**Example:** `[...trackerChildren, ...persisted, ...managerDelegations]` → `[...persisted, ...trackerChildren, ...managerDelegations]`

### Pattern 3: Session-Tracker-First with Old-File Fallback

**What:** A reader function tries session-tracker first via `resolveSessionFile`, then falls back to the old file path if session-tracker returns no data.

**When to use:** Any reader that previously read from a single `.json` path. Adds the new path as primary without removing the old one.

**Code pattern:**
```typescript
// 1. Try session-tracker
try {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (resolved && resolved.type === "main" && resolved.manifestPath) {
    // Read from manifest...
    return data
  }
} catch { /* fall through */ }
// 2. Fall back to old file
try {
  const oldPath = resolve(projectRoot, ".hivemind", "state", "delegations.json")
  const raw = await readFile(oldPath, "utf-8")
  // ...
} catch { return [] }
```

### Anti-Patterns to Avoid

- **Making continuity store functions async:** `getSessionContinuity()` and `listSessionContinuity()` are synchronous in-memory reads. Do NOT change their signatures. Enrichment is a separate async wrapper.
- **Importing `continuity/index.ts` from `continuity-reader.ts`:** Creates circular dependency — `continuity/index.ts` already imports from session-tracker modules. The enrichment helper must be independent.
- **Modifying old file paths:** P41-D handles deletion. In P41-C, old paths remain readable. Only add the session-tracker *preference*.
- **Mutating the original record:** The enrichment helper must return a new merged object (`{ ...record, metadata: { ... } }`), not modify the input.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Child session record reading | Custom file path construction | `resolveSessionFile()` | Already handles manifest lookup, root main resolution, scanning fallback, path traversal protection |
| Atomic file reading | Raw `readFile` + `JSON.parse` without try-catch | Existing `resolveSessionFile()` pattern | Session-resolver already wraps errors and returns `null` |
| Continuity record merging | Custom field-by-field merge | `enrichContinuityWithTracker()` (new) | Standardized merge precedence: tracker fields win, `??` falls back to old-data, never throws |

---

## Common Pitfalls

### Pitfall 1: Enrichment not reaching all `getSessionContinuity()` call sites

**What goes wrong:** Only some `getSessionContinuity()` calls get enriched, leading to inconsistent data within a single session-hook execution.

**Why it happens:** The `session-hooks.ts` event hook (line 151) and compacting hook (line 308) both call `getSessionContinuity()`. If only one is enriched, auto-loop decisions use enriched data but compaction context injection uses raw data.

**How to avoid:** Enrich BOTH call sites. The SPEC REQ-P41C-05 explicitly lists both.

**Warning signs:** Compaction output shows different lifecycle/pendingNotifications than what the auto-loop hook used.

### Pitfall 2: `ToolGuardDependencies` type extension breaks existing callers

**What goes wrong:** Adding `projectRoot?: string` to `ToolGuardDependencies` — if the type is used in a test or another call site that doesn't pass it, TypeScript should be fine (optional field). But the `createToolGuardHooks()` call in `plugin.ts:501` must be updated.

**Why it happens:** The type is used only once (at plugin.ts:501). No other call sites exist. But the field is `optional` so even if other callers exist, they won't break.

**How to avoid:** Verify with `grep -r "ToolGuardDependencies"` after changes. Ensure `plugin.ts:501` passes `projectRoot: projectDirectory`.

**Warning signs:** Typecheck error on `ToolGuardDependencies` or `createToolGuardHooks()`.

### Pitfall 3: `getSessionContinuity()` returns `undefined` but enrichment expects a record

**What goes wrong:** Enrichment helper signature takes `SessionContinuityRecord`, but `getSessionContinuity()` returns `SessionContinuityRecord | undefined`. Passing `undefined` causes a type error.

**Why it happens:** The hook guards use `const continuity = getSessionContinuity(sessionID)` without null-check (tool-guard-hooks.ts:193). The enrichment must be gated behind a null check.

**How to avoid:** Use the guard pattern:
```typescript
const rawContinuity = getSessionContinuity(sessionID)
const continuity = rawContinuity
  ? await enrichContinuityWithTracker(rawContinuity, deps.projectRoot)
  : undefined
```

**Warning signs:** TypeScript "Argument of type 'undefined' is not assignable to parameter" error.

### Pitfall 4: Async enrichment in synchronous-looking hook path

**What goes wrong:** The `tool.execute.after` hook is already async, so enrichment via `await` is fine. But if someone adds enrichment to a synchronous hook in the future, it would break.

**How to avoid:** Keep enrichment in async contexts only. All 3 enrichment call sites (plugin.ts replay, session-hooks event/compacting, tool-guard-hooks after) are already async.

**Warning signs:** Hook returns `Promise<void>` but doesn't `await` enrichment.

---

## Code Examples

### Enrichment Helper (new module)

See SPEC REQ-P41C-01 for full implementation — `src/task-management/continuity/continuity-reader.ts`

Key imports:
```typescript
import { resolveSessionFile } from "../../tools/session/session-resolver.js"
import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { SessionContinuityRecord } from "../../shared/types.js"
```

### Merge Order Flip at `delegation-status.ts:400`

```typescript
// Before:
const allRecords = [...trackerChildren, ...persisted, ...managerDelegations]
// After:
const allRecords = [...persisted, ...trackerChildren, ...managerDelegations]
```

The `byId.set()` at lines 402-418 applies `...record, ...existing` where `existing` is the previously-set value. Since arrays iterate left-to-right, `managerDelegations` (last) always wins over both — which is correct (in-memory manager data is most current).

### Session-View Delegation Reader

```typescript
async function readDelegationsForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown>[]> {
  // 1. Try session-tracker first
  try {
    const resolved = await resolveSessionFile(projectRoot, sessionId)
    if (resolved && resolved.type === "main") {
      const manifestRaw = await readFile(resolved.manifestPath, "utf-8")
      const manifest = JSON.parse(manifestRaw) as { children?: Record<string, Record<string, unknown>> }
      if (manifest.children) {
        const childDelegations = Object.entries(manifest.children)
          .filter(([, childMeta]) => childMeta.parentSessionID === sessionId)
          .map(([id, meta]) => ({ id, childSessionId: id, ...meta }))
          .slice(0, 20)
        if (childDelegations.length > 0) return childDelegations
      }
    } else if (resolved && resolved.type === "child") {
      if (resolved.childRecord) {
        return [resolved.childRecord as unknown as Record<string, unknown>]
      }
    }
  } catch { /* fall through */ }

  // 2. Fall back to old delegations.json path
  try {
    const delegationsPath = resolve(projectRoot, ".hivemind", "state", "delegations.json")
    const raw = await readFile(delegationsPath, "utf-8")
    const allDelegations = JSON.parse(raw) as Array<Record<string, unknown>>
    return allDelegations.filter((d) =>
      d.childSessionId === sessionId || d.id === sessionId
    ).slice(0, 20)
  } catch { return [] }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `delegation-status.ts` merge: `[tracker, persisted, manager]` | `[persisted, tracker, manager]` | P41-C | Session-tracker delegation data wins over old file |
| `hivemind-session-view.ts`: reads only delegations.json | Reads session-tracker first, falls back | P41-C | Session view shows tracker data when available |
| `plugin.ts` notification replay: raw continuity | Continuity enriched with tracker `pendingNotifications` | P41-C | Replay sees tracker's more current notification state |
| `session-hooks.ts`: raw `getSessionContinuity()` | Enriched with tracker lifecycle/pendingNotifications | P41-C | Auto-loop decisions use tracker's lifecycle state |
| `tool-guard-hooks.ts`: raw `getSessionContinuity()` | Enriched with tracker lifecycle/pendingNotifications | P41-C | Metadata injection uses tracker's lifecycle state |

---

## Assumptions Log

All 14 assumptions documented in `P41-C-ASSUMPTIONS.md`. All verified against current source code. No untagged `[ASSUMED]` claims in this research.

---

## Open Questions

**None identified.** The SPEC is explicit and complete. All code paths were verified by reading the actual source files. The only potential unknown is whether `listSessionContinuity()` returns sessions that were created *only* through session-tracker (not written to old continuity file), but P41-B dual-write ensures all sessions are written to both — so enrichment will find tracker data for every session.

---

## Environment Availability

**Skipped** — this phase makes no changes to external dependencies, CLI tools, or runtime environment. All changes are within existing TypeScript source files.

---

## Validation Architecture

> workflow.nyquist_validation is enabled (absent from config, treating as enabled).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-P41C-01 | `continuity-reader.ts` exports enrichment helpers | unit | `npx vitest run tests/lib/continuity/continuity-reader.test.ts -x` | ❌ Wave 0 |
| REQ-P41C-02 | Merge order flipped in `delegation-status.ts` | unit | `npx vitest run tests/tools/delegation/delegation-status.test.ts -x` | ❓ Check |
| REQ-P41C-03 | `hivemind-session-view.ts` prefers session-tracker | unit | `npx vitest run tests/tools/hivemind/hivemind-session-view.test.ts -x` | ❓ Check |
| REQ-P41C-04 | `plugin.ts` enriches notification replay | integration | `npx vitest run tests/lib/plugin/plugin.test.ts -x` | ❓ Check |
| REQ-P41C-05 | `session-hooks.ts` enriches continuity reads | unit | `npx vitest run tests/hooks/session-hooks.test.ts -x` | ❓ Check |
| REQ-P41C-06 | `tool-guard-hooks.ts` enriches continuity reads | unit | `npx vitest run tests/hooks/tool-guard-hooks.test.ts -x` | ❓ Check |
| REQ-P41C-07 | `npm run typecheck && npm run test` both pass | gate | `npm run typecheck && npm run test` | N/A |

### Wave 0 Gaps

- [ ] `tests/lib/continuity/continuity-reader.test.ts` — new file needed for REQ-P41C-01 enrichment helper
- [ ] Check if `tests/tools/delegation/delegation-status.test.ts` needs update for merge order change (likely no — the merge order test may need adjustment)
- [ ] Check if `tests/hooks/session-hooks.test.ts` and `tests/hooks/tool-guard-hooks.test.ts` mock `getSessionContinuity` — enrichment should not affect these since it's best-effort

*(If gaps remain: "None — existing test infrastructure covers all phase requirements")*

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose --changed`
- **Per wave merge:** `npm run test`
- **Phase gate:** `npm run typecheck && npm run test` — both must pass with zero failures

---

## Security Domain

> `security_enforcement` is absent from config — treating as enabled.

**Applicable ASVS categories:** None directly. This phase adds no new authentication, input validation, or network surfaces.

**Security consideration:** The new `continuity-reader.ts` module reads session-tracker child files from disk via `resolveSessionFile()`, which already enforces `safeSessionPath()` protection against path traversal. The enrichment helper only *reads* existing files — it does not write, create, or mutate filesystem state.

**Threat pattern:** None new. Existing path traversal protection at `safeSessionPath()` (in `atomic-write.ts`) rejects session IDs containing `..` or path separators.

---

## Sources

### Primary (HIGH confidence)
- `src/tools/delegation/delegation-status.ts` — merge order at line 400, single delegation at lines 462-487, handleControl at lines 606-619
- `src/tools/hivemind/hivemind-session-view.ts` — `readDelegationsForSession()` at lines 68-79, `buildUnifiedView()` at lines 96-131, `resolveSessionFile` import at line 16
- `src/plugin.ts` — `projectDirectory` at line 355, notification replay call at line 414, function at lines 629-647, `deps` bundle at line 473, `createToolGuardHooks` at line 501
- `src/hooks/lifecycle/session-hooks.ts` — `getSessionContinuity()` at lines 151 and 308
- `src/hooks/guards/tool-guard-hooks.ts` — `ToolGuardDependencies` at lines 28-33, `getSessionContinuity()` at line 193
- `src/hooks/types.ts` — `HookDependencies` interface at lines 25-61
- `src/tools/session/session-resolver.ts` — `resolveSessionFile()` at lines 22-115, return type at lines 7-14
- `src/features/session-tracker/types.ts` — `ChildSessionRecord` gap fields at lines 244-258

### Secondary (MEDIUM confidence)
- `.planning/phases/P41-state-cluster-redesign/P41-C-SPEC.md` — all 7 requirements with acceptance criteria

### Tertiary (LOW confidence)
- None — all findings verified against actual source code

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified all imports and types against codebase
- Architecture: HIGH — read all 5 target files, confirmed every code path
- Pitfalls: HIGH — identified by reading actual call sites and type signatures

**Research date:** 2026-05-31
**Valid until:** After P41-D (old file deletion) — these research findings are valid only while old file paths remain functional
