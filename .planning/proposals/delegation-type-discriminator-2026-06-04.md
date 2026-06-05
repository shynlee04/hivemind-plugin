<!-- generated: 2026-06-05 -->
# `delegationType` Discriminator — Design Doc for Hivemind Session-Tracker Cluster

**Status:** Proposed — design-only (L5)
**Date:** 2026-06-05
**Author:** subagent `hm-architect` (L2 architecture specialist), delegated by `hm-l0-orchestrator`
**Depends on:** TODO-1 (`.planning/research/session-tracker-cluster-map-2026-06-04.md`)
**Blocks:** TODO-3 (query-tool filters)
**Evidence level:** L5 — design doc, no runtime claim, no source-code mutation
**MVD contract:** 10 files, ~80 LOC, zero schema breaks

---

## 0. Executive Summary

### 0.1 Decisions Locked

| # | Decision | Value | Source |
|---|----------|-------|--------|
| **D1** | Enum (4 literals, kebab-case) | `"async-spawn" \| "native-task" \| "slash-cmd" \| "sdk-direct"` | User decision 2026-06-04, captured in `.hivemind/planning/audit-2026-06-04/todo.md:39` |
| **D2** | Single source of truth for the type | `src/features/session-tracker/types.ts` (new export) | Per Q6 governance: `.hivemind/` is state, `.opencode/` is primitives; the canonical schema for session-tracker state is `src/features/session-tracker/types.ts:175-318` |
| **D3** | Field storage locations | `ChildSessionRecord` (types.ts:278) + `HierarchyManifestChild` (types.ts:175) + mirror in `Delegation` (coordination/delegation/types.ts:28) | D-07 mirror rule; prevents regeneration drift |
| **D4** | Field is **optional** in all places | `?: DelegationType`; Zod schemas use `.optional()`; existing files without the field still parse | MVD constraint — zero schema breaks |
| **D5** | Field is **set at write time**, NEVER derived from event payloads | The persistence write site knows the caller's tool/path; event payloads don't carry that signal | Per user's "Field SET at WRITE time, NEVER derived from event payloads" |
| **D6** | Default behavior for queries without the filter | "return all" — backward compatible | Per user's "Backward compat: existing files lack the field; default 'return all' on queries" |
| **D7** | Set at the **persistence write site**, not at `sdk-child-session-starter` | Because `sdk-child-session-starter.ts:19-58` is a narrow wrapper for the `delegate-task` v2 wire only (per `coordinator.ts:184` comment). The native `task` tool goes through `tool-delegation.ts:292-454`; `execute-slash-command` and `sdk-direct` have no current child-session write path | Architectural correction to the user's brief (see §3.1) |
| **D8** | `"slash-cmd"` and `"sdk-direct"` are **schema-only** today | The write path doesn't currently fire them. They exist in the enum for completeness, per user's "for completeness" note on `sdk-direct` | Honest status: 2 of 4 enum values have no active writer |

### 0.2 LOC Budget

| Layer | Files | LOC delta | Notes |
|-------|-------|-----------|-------|
| Type definition (single source) | 1 | ~10 | New const + type + JSDoc |
| Persistence writers | 2 | ~12 | `addChild` params + entry builder |
| Session-tracker write sites | 3 | ~10 | `tool-delegation.ts`, `capture/tool-capture.ts`, `coordinator.ts` |
| Coordination type | 1 | ~1 | Add optional field to `Delegation` |
| Reader Zod schema | 1 | ~1 | Add `.optional()` to `HierarchyManifestChildSchema` |
| Query tool (`delegation-status`) | 1 | ~8 | Add filter param + render pass-through |
| Reader → Delegation mapping | 1 | ~1 | Pass-through in `hierarchyChildToDelegation` |
| **Subtotal — code changes** | **10** | **~43** | Below MVD ~80 |
| Tests (vitest, BATS) | 2-3 | ~30 | Not counted in MVD |
| Docs/comments | 1-2 | ~10 | JSDoc expansions |
| **Grand total** | ~13 | **~83** | At MVD ceiling |

### 0.3 File List (the 10 from MVD)

| # | Path | Change | LOC |
|---|------|--------|-----|
| 1 | `src/features/session-tracker/types.ts` | New `DELEGATION_TYPES` const + `DelegationType` union; add `delegationType?` to `ChildSessionRecord` (line 318) + `HierarchyManifestChild` (line 198) | ~10 |
| 2 | `src/features/session-tracker/persistence/hierarchy-manifest.ts` | `addChild` params (line 62-71) accepts `delegationType`; entry builder (line 75-87) sets it | ~8 |
| 3 | `src/features/session-tracker/persistence/child-writer.ts` | `createChildFile` (line 413) passes through; no signature change (metadata is a full `ChildSessionRecord`) | ~0 (just JSDoc) |
| 4 | `src/features/session-tracker/tool-delegation.ts` | `recordChildTaskDelegation` (line 292) branches on `input.tool` to set `delegationType` on `childMetadata` | ~4 |
| 5 | `src/features/session-tracker/capture/tool-capture.ts` | `handleTask` (line 228) sets `delegationType: "native-task"` on the `ChildSessionRecord` it builds | ~2 |
| 6 | `src/coordination/delegation/coordinator.ts` | `createRecord` (line ~196) sets `delegationType: "async-spawn"` on the in-memory `Delegation` | ~2 |
| 7 | `src/coordination/delegation/types.ts` | `Delegation` interface (line 28-82) gets `delegationType?: DelegationType` | ~1 |
| 8 | `src/coordination/delegation/sdk-child-session-starter.ts` | JSDoc-only update: documents the constant `"async-spawn"` returned by this path (no code change — see §3.1) | ~2 |
| 9 | `src/tools/delegation/readers/types.ts` | `HierarchyManifestChildSchema` (line 56-67) adds `delegationType: z.string().optional()` | ~1 |
| 10 | `src/tools/delegation/delegation-status.ts` | `DelegationStatusInputSchema` (line 34-44) adds `delegationType?: z.enum([...])`; `renderDelegation` (line 80-114) includes the field; `list` action applies the filter | ~10 |

**Total: 10 files, ~40 LOC of real code change + ~40 LOC of JSDoc/comments = ~80 LOC.** MVD met.

---

## 1. Final Schema

### 1.1 Type Definition (single source of truth)

**File:** `src/features/session-tracker/types.ts`
**Insertion point:** after `export interface HierarchyManifestChild` (which ends at line 198), before the `HierarchyManifest` interface (line 208). New lines 199-207 are the const+type block.

```typescript
// src/features/session-tracker/types.ts — new (lines ~199-207, after HierarchyManifestChild, before HierarchyManifest)

/**
 * Discriminator for the delegation mechanism that produced a child session.
 *
 * 4 enum values, kebab-case, ALL OPTIONAL in storage (D4):
 *   - "async-spawn"  → Hivemind's `delegate-task` custom tool (WaiterModel,
 *                      fire-and-forget, returns delegation ID immediately)
 *   - "native-task"  → OpenCode's native `task` tool (user-issued, sync,
 *                      result returned in main session)
 *   - "slash-cmd"    → Hivemind's `execute-slash-command` (orchestrated
 *                      command, may recurse; RESERVED — no active writer today)
 *   - "sdk-direct"   → Raw OpenCode SDK call that bypasses Hivemind's
 *                      tool layer (rare, for completeness; RESERVED)
 *
 * Set at WRITE TIME by the persistence write site (D5). Never derived
 * from event payloads. Missing field means "pre-2026-06-04 record,
 * delegation mechanism unknown".
 */
export const DELEGATION_TYPES = [
  "async-spawn",
  "native-task",
  "slash-cmd",
  "sdk-direct",
] as const

export type DelegationType = typeof DELEGATION_TYPES[number]
```

**Why this location:** `src/features/session-tracker/types.ts` is the canonical state schema authority per `.planning/codebase/ARCHITECTURE.md:405-411` and Q6 governance (`.hivemind/` is state, `.opencode/` is primitives). All other layers import this type — no other module may define or redeclare it.

### 1.2 Storage Locations (mirror to prevent regeneration drift)

The field is added to 3 interfaces — all `?:`, all `.optional()` in Zod:

| Interface | File:Line | Append after |
|-----------|-----------|-------------|
| `ChildSessionRecord` | `src/features/session-tracker/types.ts:278-318` | `lifecycle?` (line 317) |
| `HierarchyManifestChild` | `src/features/session-tracker/types.ts:175-198` | `childFile: string` (line 197) |
| `Delegation` | `src/coordination/delegation/types.ts:28-82` | `v2?: boolean` (line 74) |

**Single canonical diff (applies to all 3):**

```typescript
  // Append at the indicated position:
  /**
   * Discriminator for the delegation mechanism that produced this record.
   * Set at write time by the persistence write site; not derived from
   * event payloads. See DELEGATION_TYPES for the 4-value enum.
   * Optional — pre-2026-06-04 records may lack the field.
   * TODO-2 2026-06-05.
   */
  delegationType?: DelegationType
```

### 1.3 Why Mirror, Not Derive

The 3 places (`ChildSessionRecord`, `HierarchyManifestChild`, `Delegation`) exist because they have different write owners:

- `ChildSessionRecord` is owned by `ChildWriter` (`persistence/child-writer.ts:30`)
- `HierarchyManifestChild` is owned by `HierarchyManifestWriter` (`persistence/hierarchy-manifest.ts:30`)
- `Delegation` is owned by `DelegationCoordinator` (`coordination/delegation/coordinator.ts:185`)

If we derived `delegationType` at read time from `input.tool` or the SDK call site, the **per-call-site logic** would have to be re-implemented in every reader. Per D5, we set at write time, so each writer does it once, and readers just read.

**Risk addressed:** R5 (dual-write drift) — the mirror must be set in the SAME write call. See §8.

---

## 2. WRITE-Path Design

### 2.1 Call-Site Architecture Correction (important)

The user's brief (§2) states:

> `src/coordination/delegation/sdk-child-session-starter.ts` — when child session is created, set based on caller:
>   - Called from delegate-task → `"async-spawn"`
>   - Called from task tool → `"native-task"`
>   - Called from execute-slash-command → `"slash-cmd"`
>   - Called from direct SDK → `"sdk-direct"`

**This is architecturally inaccurate for the current code.** Verified by reading:

- `src/coordination/delegation/sdk-child-session-starter.ts:1-71` — the function `createSdkChildSessionStarter` calls `createSession(client, ...)` directly (line 32). Its ONLY caller is `DelegationCoordinator.dispatch()` (`coordinator.ts:192`), which is described in `coordinator.ts:184` as "SDK-free delegate-task v2 wire coordinator; the tool layer still owns native Task dispatch."
- `src/features/session-tracker/tool-delegation.ts:292-454` — `recordChildTaskDelegation` is the **shared** write path for BOTH `task` and `delegate-task` tools. It takes `input: { tool: string; ... }` and branches on `input.tool` (line 294, 335).
- `src/features/session-tracker/capture/tool-capture.ts:228-394` — `handleTask` is the **hook-driven** write path that fires for the `task` tool (line 228).
- `src/tools/session/execute-slash-command.ts:17` — imports only `isValidSessionID` for path validation; does NOT create child sessions (per research §7.1 line 512: "(none)" file access).
- `src/hooks/observers/session-tracker-consumer.ts:34` — the hook-driven write path. Direct SDK calls would land here if any existed.

**Implication:** `sdk-child-session-starter` is too narrow to capture all 4 enum values. The right design is to set `delegationType` at the **persistence write site** (the place that knows which tool fired the dispatch):

| Write site | What it knows | Set to |
|------------|---------------|--------|
| `tool-delegation.ts:recordChildTaskDelegation` (line 292) | `input.tool` ∈ `{"task", "delegate-task"}` | branch on `input.tool` |
| `capture/tool-capture.ts:handleTask` (line 228) | Always `task` tool (hook fired for task) | `"native-task"` |
| `coordinator.ts:createRecord` (line ~196) | Always the v2 wire (called only from `coordinator.dispatch`) | `"async-spawn"` |
| `capture/handlers/session-created-handler.ts:writeImmediateChildFile` (line 32-77) | Cannot determine tool from `session.created` event alone; may be from `task`, `delegate-task`, or direct SDK | **Pass through** as a parameter; default to `undefined` if not set |
| `task-management/continuity/delegation-persistence.ts:buildChildRecordFromDelegation` (line 23-54) | Reads from `Delegation` (in-memory record) | Pass through from `delegation.delegationType` |
| `execute-slash-command` | Currently does NOT create child sessions | **No write path today** — `"slash-cmd"` is reserved |
| Hook observer for direct SDK | `session.created` event with no delegator | **No write path today** — `"sdk-direct"` is reserved |

**D7 (locked above) reflects this correction.** The user's MVD of 10 files still holds — we just don't add a code change to `sdk-child-session-starter` (file 8 in the list is JSDoc-only).

### 2.2 Write Site 1: `tool-delegation.ts:recordChildTaskDelegation`

**File:** `src/features/session-tracker/tool-delegation.ts:292-454`
**Branching point:** `input.tool` (line 294)

**Diff sketch (additions only):**

```typescript
// src/features/session-tracker/tool-delegation.ts — inside recordChildTaskDelegation, after line 327 (after const now = ...)

// TODO-2 2026-06-05: derive delegationType from the tool that fired this.
// input.tool is "task" (OpenCode native) or "delegate-task" (Hivemind v2 wire).
// We map the OpenCode name to our kebab-case enum here, NOT at the call site.
const delegationType: DelegationType =
  input.tool === "delegate-task" ? "async-spawn" :
  input.tool === "task"          ? "native-task" :
  /* unknown / future */           undefined

// ... then in the childMetadata object (line 328-340), add:
const childMetadata: ChildSessionRecord = {
  sessionID: childSessionID,
  parentSessionID: input.sessionID,
  delegationDepth: depth,
  delegatedBy: {
    agentName: subagentType,
    model: "unknown",
    tool: input.tool,
    description,
    subagentType,
  },
  delegationType,  // ← NEW
  created: now,
  // ... rest unchanged
}
```

**Effect:** `delegationType` flows from `tool-delegation.ts:recordChildTaskDelegation` into `childWriter.createChildFile(parentID, childSessionID, childMetadata)` (line 413 of child-writer.ts), which atomic-writes the `ChildSessionRecord` with the new field.

**Import to add at top of file:** `import { DELEGATION_TYPES, type DelegationType } from "./types.js"`.

### 2.3 Write Site 2: `capture/tool-capture.ts:handleTask`

**File:** `src/features/session-tracker/capture/tool-capture.ts:228-394`
**Constant:** `"native-task"` (this handler is only fired for the OpenCode native `task` tool, by hook signature)

**Diff sketch:**

```typescript
// src/features/session-tracker/capture/tool-capture.ts:228-394 — inside handleTask,
// in the ChildSessionRecord builder (search for "delegationDepth" assignment)

const childMetadata: ChildSessionRecord = {
  sessionID: childSessionID,
  parentSessionID: input.sessionID,
  delegationDepth: depth,
  delegatedBy: { /* ... */ },
  delegationType: "native-task",  // ← NEW (constant: this handler is task-only)
  created: now,
  // ... rest unchanged
}
```

**Verification:** per research §7.2 line 525, `ToolCapture.handleTask` is in the write path table for `task` tool only. The `delegate-task` tool does NOT go through `handleTask` (it goes through `tool-delegation.ts` directly). So the constant is correct.

**Import to add at top of file:** already imports `ChildSessionRecord` from `../types.js` (verify) — just add `type DelegationType` to the same import.

### 2.4 Write Site 3: `coordinator.ts:createRecord` (in-memory Delegation)

**File:** `src/coordination/delegation/coordinator.ts:194-198`
**Constant:** `"async-spawn"` (the coordinator is the v2 wire for `delegate-task` per `coordinator.ts:184` comment)

**Diff sketch:**

```typescript
// src/coordination/delegation/coordinator.ts — inside createRecord (around line 196)

const record: Delegation = this.createDelegationRecord(/* ... */)
// TODO-2 2026-06-05: this record is created only from the v2 delegate-task wire.
// See coordinator.ts:184 — "SDK-free delegate-task v2 wire coordinator; the tool
// layer still owns native Task dispatch." So this is always async-spawn.
record.delegationType = "async-spawn"
this.active.set(delegationId, { record, slotHandle: preflight.slotHandle })
```

**Verification:** `coordinator.ts:184` explicitly states the coordinator is for `delegate-task` v2 only. Setting the constant here is correct.

**Note:** This sets `Delegation.delegationType` (in-memory). The same field gets mirrored to `HierarchyManifestChild.delegationType` when `HierarchyManifestWriter.addChild` is called from the persistence write path. See §2.5 for the dual-write.

### 2.5 Write Site 4: `persistence/hierarchy-manifest.ts:addChild`

**File:** `src/features/session-tracker/persistence/hierarchy-manifest.ts:62-95`
**Mirror enforcement:** the manifest entry MUST be set in the same `addChild` call

**Diff sketch:**

```typescript
// src/features/session-tracker/persistence/hierarchy-manifest.ts:62-95 — addChild

async addChild(params: {
  rootMainSessionID: string
  childSessionID: string
  parentSessionID: string
  delegationDepth: number
  delegatedBy: string
  subagentType: string
  childFile: string
  status?: string
  /**
   * TODO-2 2026-06-05: mirror of ChildSessionRecord.delegationType.
   * Set by the caller; if omitted, the entry is written without the
   * discriminator (backward compat). See DELEGATION_TYPES.
   */
  delegationType?: DelegationType
}): Promise<void> {
  const manifest = await this.loadManifest(params.rootMainSessionID)
  const now = new Date().toISOString()

  const entry: HierarchyManifestChild = {
    sessionID: params.childSessionID,
    parentSessionID: params.parentSessionID,
    rootMainSessionID: params.rootMainSessionID,
    delegationDepth: params.delegationDepth,
    delegatedBy: params.delegatedBy,
    subagentType: params.subagentType,
    createdAt: now,
    updatedAt: now,
    status: params.status ?? "active",
    turnCount: 0,
    childFile: params.childFile,
    ...(params.delegationType !== undefined
      ? { delegationType: params.delegationType }
      : {}),  // ← only set the key when caller has it
  }
  // ... rest unchanged
}
```

**Why conditional spread:** an explicit `undefined` value would still write the key (and the JSON would have `"delegationType": null` after JSON serialization of undefined → omission). Conditional spread keeps the field absent when the caller doesn't know. This is the cleanest backward-compat pattern (D4, D6).

**Caller update needed:** every caller of `addChild` should pass `delegationType` from the in-memory `Delegation` or `ChildSessionRecord`. Three callers exist (per research §7.2):
- `tool-delegation.ts:recordChildTaskDelegation` (line 423) — pass through from `childMetadata.delegationType`
- `capture/handlers/session-created-handler.ts:writeImmediateChildFile` (line 32-77) — pass through from `sessionMetadata.delegationType` (if set by the event-classifier caller)
- `task-management/continuity/delegation-persistence.ts:persistDelegations` (line 56-101) — pass through from `Delegation.delegationType`

**Risk addressed:** R5 (dual-write drift). The pattern of "pass through from the canonical record, don't re-derive" prevents the manifest from drifting from the child JSON.

### 2.6 Write Site 5: `child-writer.ts:createChildFile` (passthrough)

**File:** `src/features/session-tracker/persistence/child-writer.ts:413-438`
**No code change** — `createChildFile` takes a `ChildSessionRecord` (line 416), so `delegationType` flows through automatically once it's in the type (D3).

**JSDoc addition only** (in the param list, line 410):

```typescript
// src/features/session-tracker/persistence/child-writer.ts:413 — JSDoc update
* @param metadata - The initial child session record. Must include
*   `delegationType` if known (see DELEGATION_TYPES); the field is
*   optional for backward compat with pre-2026-06-04 records.
```

This is the no-code-change file in the MVD list (file 3 in §0.3).

### 2.7 Propagation Path Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│ WRITE PATHS (where delegationType is set)                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  delegate-task tool ──┐                                              │
│                       │                                              │
│  task tool (native) ──┼─→ tool-delegation.ts:recordChildTaskDelega.. │
│                       │    (BRANCH on input.tool)                    │
│  task tool (hook) ────┘    │                                          │
│                            ▼                                          │
│                  childWriter.createChildFile(metadata)               │
│                            │                                          │
│                            ▼                                          │
│              ChildSessionRecord (file 1) ──→ atomicWriteJson ──┐    │
│                                                               │    │
│  coordinator.ts:createRecord ─→ Delegation (in-memory)        │    │
│                            │                                   │    │
│                            ▼                                   ▼    │
│              HierarchyManifestWriter.addChild(params)  .json  .json │
│                            │                                          │
│                            ▼                                          │
│              HierarchyManifestChild (file 1) ──→ atomicWriteJson     │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ READ PATHS (where delegationType is queried / filtered)             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  .json file ─→ HierarchyManifestChildSchema.safeParse (file 9)     │
│                  │                                                    │
│                  ▼                                                    │
│  hierarchyChildToDelegation (file 9/10) ─→ Delegation              │
│                  │                                                    │
│                  ▼                                                    │
│  DelegationManager.getAllDelegations() ─→ renderDelegation (file 10)│
│                  │                                                    │
│                  ▼                                                    │
│  DelegationStatusInputSchema (file 10) filter: delegationType       │
│                  │                                                    │
│                  ▼                                                    │
│  Tool response to user                                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. QUERY-Path Design

### 3.1 The Single Read-Side Change (per MVD)

The user's brief (§3) lists 4 tools to update:
- `src/tools/delegation/delegation-status.ts` — exists
- `src/tools/session-tracker/...` — should be `src/tools/session/session-tracker.ts`
- `src/tools/session-hierarchy/...` — should be `src/tools/session/session-hierarchy.ts`
- `src/tools/session-view/...` — should be `src/tools/hivemind/hivemind-session-view.ts`

**MVD conflict:** updating 4 tools is more than the 10-file budget allows when we also need 3 write sites and 2 type-definition files. The design trade-off is:

- **Option A (MVD-compliant):** Add filter only to `delegation-status.ts` (the primary query tool per research §7.4 line 549 — hot path, called every ~5s for stack discovery). The other 3 tools already expose `delegationType` in their pass-through output (via the `Delegation` type now having the field) but don't accept it as a filter. **Pro:** Fits 10 files. **Con:** Other 3 tools can't filter.

- **Option B (full coverage):** Add filter to all 4 tools. **Pro:** Better UX. **Con:** Exceeds MVD by 3 files (13 instead of 10).

**Recommendation: Option A for the v1 design, with TODO-3 explicitly listing the other 3 tools as a follow-up scope.** Rationale:
1. `delegation-status` is the hot-path tool that operators actually use to monitor delegations.
2. `session-tracker`, `session-hierarchy`, `hivemind-session-view` are read-only consumers — they already pass the field through automatically (no code change needed once `Delegation` has the field).
3. Adding the field to the output of the 3 read-only tools is a free side-effect of the write-side changes.

The follow-up TODO-3 (query filters) can extend the filter to the other 3 tools as a 4-file follow-up patch, well within their own MVD.

### 3.2 `delegation-status.ts` — Full Filter Plumbing

**File:** `src/tools/delegation/delegation-status.ts`
**Lines:** 34-44 (Zod input), 80-114 (renderDelegation), and a new filter pass at the call site for the `list` action.

**Diff sketch (Zod input):**

```typescript
// src/tools/delegation/delegation-status.ts:34-44 — DelegationStatusInputSchema

import { DELEGATION_TYPES } from "../../features/session-tracker/types.js"

const DelegationStatusInputSchema = z.object({
  delegationId: z.string().min(1).optional(),
  status: z.string().optional(),
  action: z.enum(["status", "get", "list", "control", "find-stackable", "pool", "peek", "progress"]).default("status"),
  control: DelegationControlSchema.optional(),
  agentFilter: z.string().optional(),
  /** P58.8 S1 (REQ-58-07): paneId for the peek action. */
  paneId: z.string().min(1).optional(),
  /** P58.8 S1 (REQ-58-07): maxBytes cap for the peek action content. */
  maxBytes: z.number().int().positive().optional(),
  /**
   * TODO-2 2026-06-05: filter delegations by the mechanism that produced them.
   * Optional; if omitted, all delegations are returned (D6 backward compat).
   * See DELEGATION_TYPES for the 4-value enum.
   */
  delegationType: z.enum(DELEGATION_TYPES).optional(),
})
```

**Diff sketch (renderDelegation output, line 80-114):**

```typescript
// src/tools/delegation/delegation-status.ts:80-114 — inside renderDelegation

function renderDelegation(delegation: Delegation): Record<string, unknown> {
  // ... existing fields ...
  return {
    delegationId: delegation.id,
    childSessionId: delegation.childSessionId,
    status: delegation.status,
    agent: delegation.agent,
    // ... existing pass-through fields ...
    v2: delegation.v2,
    delegationType: delegation.delegationType,  // ← NEW
    // ...
  }
}
```

**Diff sketch (filter application in `list` action handler):**

The exact location of the `list` action handler varies. The pattern is:

```typescript
// src/tools/delegation/delegation-status.ts — inside the execute() switch for action === "list"

// Existing: const delegations = readPersisted() ?? manager.getAllDelegations()
// New: apply the filter BEFORE returning
const delegations = (readPersisted() ?? manager.getAllDelegations())
  .filter((d) =>
    parsedInput.delegationType === undefined
      ? true
      : d.delegationType === parsedInput.delegationType
  )
```

**Backward compat verified:** if `parsedInput.delegationType` is `undefined` (caller didn't send it), the filter is a no-op (returns all). All existing callers work unchanged. (D6)

### 3.3 `hierarchyChildToDelegation` Pass-Through

**File:** `src/tools/delegation/readers/types.ts:120+`
**Function:** `hierarchyChildToDelegation` (the mapper from `HierarchyManifestChildValidated` → `Delegation`)

**Diff sketch:**

```typescript
// src/tools/delegation/readers/types.ts:120+ — inside hierarchyChildToDelegation

export function hierarchyChildToDelegation(
  childSessionId: string,
  child: HierarchyManifestChildValidated,
  projectRoot: string,
): Delegation {
  return {
    // ... existing fields ...
    v2: undefined,  // or however v2 is currently set
    delegationType: child.delegationType,  // ← NEW pass-through
  }
}
```

**`HierarchyManifestChildSchema` (file 9) update:**

```typescript
// src/tools/delegation/readers/types.ts:56-67 — add optional field

export const HierarchyManifestChildSchema = z.object({
  parentSessionID: z.string(),
  status: z.string(),
  subagentType: z.string().optional(),
  delegationDepth: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  childFile: z.string().optional(),
  rootMainSessionID: z.string().optional(),
  delegatedBy: z.string().optional(),
  turnCount: z.number().optional(),
  /** TODO-2 2026-06-05: discriminator for delegation mechanism. */
  delegationType: z.string().optional(),
})
```

**Backward compat verified:** `.optional()` in Zod means a missing field validates to `undefined`. The pass-through propagates `undefined` correctly. (D4, D6)

---

## 4. Tool-by-Tool Diff Summary

### 4.1 `delegation-status` (the one filter-capable tool per MVD)

| Aspect | Change |
|--------|--------|
| Zod schema | Add `delegationType: z.enum(DELEGATION_TYPES).optional()` (line 34-44) |
| `renderDelegation` output | Add `delegationType: delegation.delegationType` (line 80-114) |
| `list` action filter | Apply `delegationType` filter before returning |
| Default behavior | If `delegationType` undefined → return all (D6) |
| Backward compat | ✅ Existing callers without the param work unchanged |

### 4.2 `session-tracker` (read-only, no filter in v1)

| Aspect | Change |
|--------|--------|
| Code change | **None** — `Delegation` type now has `delegationType`; existing pass-through code emits it automatically |
| Output behavior | All `delegationType` values appear in tool output (including `undefined` for old records) |
| Filter param | **Deferred to TODO-3** (4-file follow-up) |

### 4.3 `session-hierarchy` (read-only, no filter in v1)

| Aspect | Change |
|--------|--------|
| Code change | **None** — same as 4.2 |
| Output behavior | Same as 4.2 |
| Filter param | **Deferred to TODO-3** |

### 4.4 `hivemind-session-view` (read-only, no filter in v1)

| Aspect | Change |
|--------|--------|
| Code change | **None** — same as 4.2 |
| Output behavior | Same as 4.2 |
| Filter param | **Deferred to TODO-3** |

### 4.5 `session-delegation-query` (also read-only, no filter in v1)

| Aspect | Change |
|--------|--------|
| Code change | **None** — `DelegationSummary` already pass-through from `Delegation` |
| Output behavior | Same as 4.2 |
| Filter param | **Deferred to TODO-3** |

**Total active filter in v1:** 1 tool. Total passive pass-through: 4 tools.

---

## 5. Migration Path

### 5.1 Question: When is Migration Needed?

**Answer: Never.** Per D4 (field is optional) and the MVD constraint (zero schema breaks), existing records in `.hivemind/session-tracker/` are forward-compatible without any migration.

### 5.2 Reading Old Records

| Record state | Read behavior |
|--------------|---------------|
| Old record (pre-2026-06-04) without `delegationType` | Zod parse → `delegationType: undefined`; pass-through → output `delegationType: undefined` |
| New record (post-2026-06-04) with `delegationType` | Zod parse → `delegationType: "async-spawn"` etc.; pass-through → output `delegationType: "async-spawn"` |
| Mixed batch (some old, some new) | Default "return all" filter; per-record `delegationType` is `undefined` or set; sort/filter by tool logic |

### 5.3 Optional Bulk Backfill (NOT RECOMMENDED)

A backfill script could walk `.hivemind/session-tracker/` and add `delegationType` to old records based on heuristic inference (e.g., the `delegatedBy.tool` field if present in the existing schema). **This is NOT recommended for v1** because:

1. Heuristics are error-prone (e.g., `delegatedBy.tool === "task"` is a weak signal — could be `delegate-task` v1 or `task` v0)
2. The field is optional, so the "unknown" state (undefined) is already valid
3. Backfill scripts add maintenance burden and risk of corrupting canonical state

**Recommendation:** leave old records alone. New records get the field. Users querying the field on old records get `undefined` and can interpret as "pre-discriminator era".

### 5.4 Quarantined Sessions (R8)

Quarantined sessions in `.hivemind/session-tracker/quarantine/` are moved there by `OrphanCleanup.cleanupOrphanDirectories` (`orphan-cleanup.ts:97-197`). Per R8, quarantined sessions MUST be preserved as-is. Since the field is optional, no migration is needed for quarantined records — they retain their original `delegationType` (or lack thereof).

---

## 6. Test Design

### 6.1 Vitest Unit Tests (3 new test files, ~30 LOC each)

**File 1:** `tests/features/session-tracker/types.test.ts` (~20 LOC)
- Test: `DELEGATION_TYPES` is a const tuple of 4 values
- Test: `DelegationType` is the inferred union
- Test: `ChildSessionRecord` accepts all 4 enum values
- Test: `HierarchyManifestChild` accepts all 4 enum values
- Test: `ChildSessionRecord` without `delegationType` is valid (backward compat)

**File 2:** `tests/tools/delegation/delegation-status-delegation-type.test.ts` (~30 LOC)
- Test: Zod input accepts `delegationType: "async-spawn"`
- Test: Zod input accepts `delegationType: "native-task"`
- Test: Zod input accepts `delegationType: "slash-cmd"`
- Test: Zod input accepts `delegationType: "sdk-direct"`
- Test: Zod input rejects `delegationType: "unknown-tool"`
- Test: Zod input without `delegationType` works (backward compat)
- Test: `list` action with `delegationType: "async-spawn"` returns only async-spawn delegations
- Test: `list` action without filter returns all

**File 3:** `tests/coordination/delegation/sdk-child-session-starter-delegation-type.test.ts` (~20 LOC)
- Test: `createSdkChildSessionStarter` returns a record with `delegationType: "async-spawn"` constant (D7)

### 6.2 Integration Test (1 new test file, ~40 LOC)

**File:** `tests/integration/delegation-type-flow.test.ts` (~40 LOC)
- Test: invoking the `delegate-task` tool produces a `ChildSessionRecord` with `delegationType: "async-spawn"` (E2E)
- Test: invoking the `task` tool produces a `ChildSessionRecord` with `delegationType: "native-task"` (E2E)
- Test: the field is mirrored to `HierarchyManifestChild` in the same write
- Test: the field is mirrored to the in-memory `Delegation`
- Test: querying `delegation-status` with `?delegationType=async-spawn` returns only async-spawn
- Test: old records (no field) parse successfully and return `undefined`

### 6.3 BATS Test Slot (slot 66+)

The research mentions BATS slot 66 for delegation event monotonicity. R4 says "add to metadata not DU" — i.e., don't bump the BATS slot; add a metadata field within slot 66.

**No new BATS slot is needed.** The `delegationType` is a field on `ChildSessionRecord` / `HierarchyManifestChild` / `Delegation`, not a separate event surface. The existing BATS slot 66 (delegation events) continues to emit `delegation-queued` / `delegation-dispatched` / `delegation-terminal` events. The `delegationType` can be attached to the event payload as `metadata.delegationType` if a future test needs it.

### 6.4 Coverage Requirement (per AGENTS.md §7.5)

Every new test must report a coverage state:
- Unit tests: `PASS` (with `npx vitest run --coverage`)
- Integration tests: `PASS` (with `npx vitest run --coverage`)
- BATS: `PASS` if added (none added for this design)
- Coverage target: 80% of new code paths in session-tracker types + delegation-status

---

## 7. Risk Register — R1 through R10

This section addresses each risk identified in `.planning/research/session-tracker-cluster-map-2026-06-04.md:743-790` (R1-R10).

### 7.1 R1: Backward Compatibility

**Risk:** existing session records in `.hivemind/session-tracker/` lack the new field; queries that assume the field exists could break.

**Mitigation (D4, D6, §5.1):**
- Field is `?:` (optional) in all 3 type definitions
- Zod schema uses `.optional()` in `HierarchyManifestChildSchema` (file 9)
- Query tools default to "return all" when filter is omitted
- `safeParse` in `session-tracker-reader.ts:32, 66` already handles malformed records by `continue` (per research §1.2)
- No migration script needed

**Verification:** integration test asserts old records (synthetically without the field) parse and return `undefined`.

**Residual risk:** LOW. Backward compat is the strongest constraint in this design.

### 7.2 R2: Zod Strictness

**Risk:** if `HierarchyManifestChildSchema` is made strict (no `.optional()`), old records fail to parse, breaking the reader pipeline.

**Mitigation:** the schema uses `z.string().optional()` (not `z.enum(...).optional()`) deliberately. A `z.enum(DELEGATION_TYPES).optional()` would also work, but `z.string().optional()` is more permissive — it accepts ANY string value, not just the 4 known enum values. This forward-compat is valuable: if a future writer adds a 5th value (e.g., `"cron-spawn"`), old readers still parse it (they just don't know what it means).

**Verification:** unit test asserts `safeParse({ delegationType: "future-value" })` succeeds with `success: true` and `data.delegationType === "future-value"`.

**Residual risk:** LOW. The trade-off is "loose reader, strict writer" — a sound pattern.

### 7.3 R3: Delegation Type Chain Fragility

**Risk:** the `Delegation` type is imported by many modules (`coordination/delegation/types.ts:28-82` shows 30+ usages in research). Adding a field to it could trigger a cascade of type errors.

**Mitigation (D3):**
- The new field is `?:` (optional), so no existing consumer is required to handle it
- TypeScript strict mode (`strict: true` per AGENTS.md code style) is satisfied because optional fields don't require checks
- Existing code that does `delegation.delegationType` would now compile (it was previously a type error); the new field can be used or ignored

**Verification:** run `npm run typecheck` after the change. Should pass with no errors.

**Residual risk:** LOW. Optional fields are non-breaking in TypeScript.

### 7.4 R4: BATS Slot 66 Monotonicity

**Risk:** the BATS test slot 66 tracks delegation event monotonicity (per research §1.3 line 94, §9.3). Adding a new event surface (or modifying the slot) could break the monotonicity invariant.

**Mitigation:** the design does NOT add a new BATS event surface. The `delegationType` is a field on existing records, not a new event. If a future test needs to know which type fired an event, it can read `Delegation.delegationType` after the event fires (the in-memory record is the source of truth).

**Verification:** BATS test suite continues to pass with no changes.

**Residual risk:** NONE. The BATS slot is not touched.

### 7.5 R5: Dual-Write Drift

**Risk:** `ChildSessionRecord` and `HierarchyManifestChild` are written by separate persistence owners (`ChildWriter` and `HierarchyManifestWriter`). If they drift, queries against the manifest could return a different `delegationType` than the child JSON.

**Mitigation (D5, §2.5):**
- The `delegationType` is set in the **same write call** for both. The pattern is: caller computes `delegationType` once from the call-site, then passes it to BOTH `childWriter.createChildFile(metadata)` and `HierarchyManifestWriter.addChild({ ..., delegationType })`.
- The conditional spread `...(params.delegationType !== undefined ? { delegationType } : {})` in the manifest writer ensures both records are written or neither is.

**Verification:** integration test asserts that after a `delegate-task` invocation, both `childSessionID.json` and `hierarchy-manifest.json` contain the same `delegationType` value (or both lack it).

**Residual risk:** MEDIUM. The dual-write is the most fragile part. Mitigation requires a single-source-of-truth pattern at the call site (caller computes once, writes both). A follow-up enhancement could add a `BatchWriter` that takes both records and writes them atomically, but that's out of scope for v1.

### 7.6 R6: Stale Tmp Files

**Risk:** per research §10.5, the large session `ses_17c1b5b41ffe3D6kdDn8fcc4Mk` has 4 `.tmp.*` files totaling ~64 MB. Adding a new field could increase the write size, exacerbating the tmp-file problem.

**Mitigation:** the new field is at most 12 characters (`"async-spawn"` is the longest). The total file size grows by ~25 bytes per record. The tmp-file problem is orthogonal — it's a cleanup bug in `OrphanCleanup.cleanupOrphanedTmpFiles` (`orphan-cleanup.ts:358-377`) per research §10.5. **Not addressed by this design.**

**Verification:** not applicable to this design.

**Residual risk:** NONE for this design; the tmp-file bug is a separate concern.

### 7.7 R7: Hook Chain Contamination

**Risk:** the `session.created` hook event fires after a child session is created. If `delegationType` is derived from the hook payload (instead of the call site), the hook chain could be contaminated with wrong values.

**Mitigation (D5, §2.1):** the field is set at the **persistence write site** (the tool handler that called the SDK), NOT at the hook observer. The hook observer (`session-tracker-consumer.ts:34`) reads the event and passes the `sessionID` to the handler, but does NOT determine `delegationType`. The handler (`writeImmediateChildFile` in `session-created-handler.ts:32-77`) accepts `delegationType` as a parameter; the default is `undefined`.

**Verification:** trace the call path from `delegate-task` tool to `session.created` hook to `writeImmediateChildFile`. Confirm `delegationType` is passed through the parameter chain, not derived from the hook payload.

**Residual risk:** LOW. The pass-through pattern is clean.

### 7.8 R8: Quarantined Session Preservation

**Risk:** quarantined sessions in `.hivemind/session-tracker/quarantine/` may be modified by a naive migration, losing the original `delegationType` (or lack thereof).

**Mitigation (D4, §5.4):**
- The field is optional, so quarantined records don't need updating
- No migration script is needed
- `OrphanCleanup.preserveOrphanHierarchy` (`orphan-cleanup.ts:271-272`) reads the orphan's `session-continuity.json` and `hierarchy-manifest.json` and merges them into the root's index — it does NOT modify the orphan's records. The orphan's `delegationType` is preserved as-is.

**Verification:** unit test asserts that after a quarantine event, the orphan's `delegationType` is unchanged.

**Residual risk:** LOW. The quarantine path is read-only with respect to the orphan's records.

### 7.9 R9: Manifest vs Continuity Drift

**Risk:** per research §6.5, `hierarchy-manifest.json` and `session-continuity.json` can drift if writes fail asymmetrically. Adding a field to `HierarchyManifestChild` but not `ChildHierarchyEntry` (or vice versa) could amplify this drift.

**Mitigation (D3, §1.2):**
- The field is added to `HierarchyManifestChild` (the manifest) but NOT to `ChildHierarchyEntry` (the continuity index). This is **intentional**:
  - `HierarchyManifestChild` is the canonical record-of-record (per research §6.3 line 415 — "D-07 authoritative")
  - `ChildHierarchyEntry` is a derived cache (per research §6.4 line 446 — "Nested tree (not flat)")
  - Adding the field only to the manifest minimizes the drift surface
- The continuity tree regenerates from the manifest on cache miss (per research §6.5 line 482), so the field will propagate to the tree at read time

**Verification:** integration test asserts that after a write, `hierarchy-manifest.json` contains `delegationType` and `session-continuity.json` does NOT (until the tree is regenerated from the manifest).

**Residual risk:** MEDIUM. The two-file drift is a known issue (R9 LOCKED). This design reduces the surface but doesn't fix the underlying dual-write problem.

### 7.10 R10: Trajectory Event Surface

**Risk:** the trajectory event surface (`src/task-management/trajectory/`) may need to carry `delegationType` to track which mechanism dispatched the work.

**Mitigation:** the trajectory event payload is `Record<string, unknown>`. If a future trajectory consumer needs to know the delegation type, it can read `Delegation.delegationType` after the event fires (the in-memory record is the source of truth). **No change to the trajectory event schema is needed for v1.**

**Verification:** not applicable to this design.

**Residual risk:** LOW. Future trajectory enhancements can opt in.

### 7.11 Risk Summary

| ID | Risk | Mitigation | Residual |
|----|------|-----------|----------|
| R1 | Backward compat | Optional + `.optional()` + safeParse | LOW |
| R2 | Zod strictness | `z.string().optional()` not `z.enum().optional()` | LOW |
| R3 | Type chain fragility | `?:` optional field | LOW |
| R4 | BATS slot 66 | No new event surface | NONE |
| R5 | Dual-write drift | Pass-through from single source | MEDIUM |
| R6 | Stale tmp files | Not addressed (orthogonal) | NONE (out of scope) |
| R7 | Hook contamination | Pass-through, not derivation | LOW |
| R8 | Quarantine preservation | Optional field, no migration | LOW |
| R9 | Manifest vs continuity | Field only on manifest | MEDIUM |
| R10 | Trajectory surface | Read from `Delegation` after event | LOW |

**Net residual risk:** MEDIUM, driven by R5 and R9. Both are pre-existing risks amplified by adding the field. Neither is blocking for v1.

---

## 8. Implementation Order (Atomic Commits)

Per AGENTS.md "Atomic commits are mandatory" and the MVD constraint (10 files, ~80 LOC), the implementation should be split into **5 atomic commits**, each independently passable through `npm run typecheck` and `npm test`.

### Commit 1: Type Foundation (2 files, ~12 LOC)

**Files:**
- `src/features/session-tracker/types.ts` — add `DELEGATION_TYPES`, `DelegationType`, fields on `ChildSessionRecord` and `HierarchyManifestChild`
- `src/coordination/delegation/types.ts` — add `delegationType?` to `Delegation`

**LOC:** ~12
**Tests:** `tests/features/session-tracker/types.test.ts` (new, ~20 LOC)
**Verify:** `npm run typecheck` && `npm test tests/features/session-tracker/types.test.ts`

### Commit 2: Reader Zod + Pass-Through (2 files, ~2 LOC)

**Files:**
- `src/tools/delegation/readers/types.ts` — add `delegationType: z.string().optional()` to `HierarchyManifestChildSchema`
- `src/tools/delegation/readers/types.ts` — pass through in `hierarchyChildToDelegation` (same file, 1 line)

**LOC:** ~2
**Tests:** existing tests should still pass
**Verify:** `npm test tests/tools/delegation/`

### Commit 3: Persistence Writer Mirror (2 files, ~8 LOC)

**Files:**
- `src/features/session-tracker/persistence/hierarchy-manifest.ts` — `addChild` params + entry builder
- `src/features/session-tracker/persistence/child-writer.ts` — JSDoc only

**LOC:** ~8
**Tests:** existing tests should still pass
**Verify:** `npm test tests/features/session-tracker/persistence/`

### Commit 4: Write-Site Branching (3 files, ~8 LOC)

**Files:**
- `src/features/session-tracker/tool-delegation.ts` — branch on `input.tool` in `recordChildTaskDelegation`
- `src/features/session-tracker/capture/tool-capture.ts` — set `"native-task"` in `handleTask`
- `src/coordination/delegation/coordinator.ts` — set `"async-spawn"` in `createRecord`

**LOC:** ~8
**Tests:** `tests/integration/delegation-type-flow.test.ts` (new, ~40 LOC)
**Verify:** `npm test tests/integration/delegation-type-flow.test.ts`

### Commit 5: Query Tool Filter (1 file, ~10 LOC)

**Files:**
- `src/tools/delegation/delegation-status.ts` — add Zod filter param + `renderDelegation` pass-through + `list` action filter

**LOC:** ~10
**Tests:** `tests/tools/delegation/delegation-status-delegation-type.test.ts` (new, ~30 LOC)
**Verify:** `npm test tests/tools/delegation/delegation-status-delegation-type.test.ts`

### Commit 6 (Optional, separate phase): Follow-up Read-Side Filters

**Files:** 3-4 (TODO-3)
- `src/tools/session/session-tracker.ts` — add filter
- `src/tools/session/session-hierarchy.ts` — add filter
- `src/tools/hivemind/hivemind-session-view.ts` — add filter
- `src/tools/session/session-delegation-query.ts` — add filter (if needed)

**This is out of scope for v1.** Track in TODO-3.

---

## 9. Open Questions for L0

These require user/orchestrator input before or during implementation.

### 9.1 Q1: Enum Literal Naming

**Question:** The locked enum is `"async-spawn" | "native-task" | "slash-cmd" | "sdk-direct"`. Is the `slash-cmd` abbreviation acceptable, or should it be `"execute-slash-command"` for consistency with the tool name?

**Recommendation:** keep `slash-cmd` (it's terser, matches the audit TODO line 39 which the user already locked). Document the mapping in a comment at the const definition.

**Decision needed:** none (locked by user). Documenting for traceability.

### 9.2 Q2: `slash-cmd` and `sdk-direct` Active Writers

**Question:** neither `slash-cmd` nor `sdk-direct` have an active write path in the current code. When (if ever) should the schema-only enum values become writable?

**Recommendation:** leave them schema-only for v1. If `execute-slash-command` ever creates child sessions (a future CP-PTY enhancement), the write site would be a new `tool-delegation.ts` branch (similar to §2.2). If direct SDK calls land in the hook observer, the write site would be a `delegationType` parameter on `writeImmediateChildFile`. Neither is a v1 concern.

**Decision needed:** none. Documented as a "no writer today" honest status per D8.

### 9.3 Q3: BATS Slot Reservation for `delegationType`

**Question:** the research mentions BATS slot 66 for delegation event monotonicity. Should `delegationType` get its own slot?

**Recommendation:** no new slot (R4 mitigation). The field is a property of existing records, not a new event surface. If a future test needs the type, it can read the record after the event fires.

**Decision needed:** none (R4 resolved by design).

### 9.4 Q4: TODO-3 Scope

**Question:** should TODO-3 (query-tool filters) extend `delegationType` filtering to the 3 other read tools (`session-tracker`, `session-hierarchy`, `hivemind-session-view`)?

**Recommendation:** yes, as a separate follow-up phase. The v1 design (per MVD) only filters in `delegation-status`. The 3 other tools already expose `delegationType` in their pass-through output (free side-effect of the type changes).

**Decision needed:** confirmation from orchestrator that TODO-3 is the right vehicle for this expansion. Likely yes.

### 9.5 Q5: Quarantine Migration (R8)

**Question:** should quarantined sessions in `.hivemind/session-tracker/quarantine/` get a bulk backfill?

**Recommendation:** no. The field is optional, quarantined sessions preserve as-is, and heuristic backfill is error-prone. Old records stay "unknown" forever.

**Decision needed:** none. Default to "no backfill" per §5.3.

### 9.6 Q6: Documentation Updates

**Question:** which docs need to be updated to reflect the new field?

**Recommendation:**
- `.planning/codebase/ARCHITECTURE.md` — add note about `DelegationType` discriminator in the 9-surface authority table
- `.hivemind/planning/audit-2026-06-04/todo.md` — mark TODO-2 DONE after the 5 commits merge
- `.planning/proposals/delegation-type-discriminator-2026-06-04.md` (this doc) — the source of truth, no further update needed
- No updates to user-facing docs (`README.md`, etc.) because the field is internal to operators using `delegation-status`

**Decision needed:** orchestrator's preference on whether to update `ARCHITECTURE.md`. Likely yes (low cost, high consistency).

### 9.7 Q7: Date-Stamp Convention for This Document

**Question:** this doc is at `.planning/proposals/delegation-type-discriminator-2026-06-04.md` (dated 2026-06-04, matching the audit TODO date). The actual authoring date is 2026-06-05. Should the filename be renamed?

**Recommendation:** keep the filename as `delegation-type-discriminator-2026-06-04.md` to match the audit TODO lineage. Add a `**Date:** 2026-06-05` line in the header (already done in §0) to clarify the actual authoring date.

**Decision needed:** none. Convention matches `.planning/AGENTS.md` §1 ("Date-stamped artifacts are expected for generated plans... with name-YYYY-MM-DD").

---

## 10. Acceptance Checklist (for verifier)

When this design is implemented, the verifier (`hm-verifier`) should check:

- [ ] `DELEGATION_TYPES` is exported from `src/features/session-tracker/types.ts` and contains exactly 4 values in the locked order
- [ ] `DelegationType` type is exported from the same file
- [ ] `ChildSessionRecord.delegationType?: DelegationType` exists (file 1)
- [ ] `HierarchyManifestChild.delegationType?: DelegationType` exists (file 1)
- [ ] `Delegation.delegationType?: DelegationType` exists (file 7)
- [ ] `HierarchyManifestChildSchema` accepts `delegationType: z.string().optional()` (file 9)
- [ ] `hierarchyChildToDelegation` passes through the field (file 9)
- [ ] `tool-delegation.ts:recordChildTaskDelegation` branches on `input.tool` and sets the field (file 4)
- [ ] `capture/tool-capture.ts:handleTask` sets `"native-task"` (file 5)
- [ ] `coordinator.ts:createRecord` sets `"async-spawn"` (file 6)
- [ ] `HierarchyManifestWriter.addChild` accepts the field and conditionally spreads it (file 2)
- [ ] `delegation-status.ts` Zod schema accepts the filter param (file 10)
- [ ] `delegation-status.ts:renderDelegation` includes the field in output (file 10)
- [ ] `delegation-status.ts:list` action applies the filter (file 10)
- [ ] All 5 atomic commits are in git log
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (3 new test files + existing tests)
- [ ] `npm run test:coverage` reports `PASS` for new code paths
- [ ] No file exceeds 500 LOC (per AGENTS.md code style)
- [ ] Total LOC delta is ≤ 100 (MVD budget + safety margin)
- [ ] Old records (no field) parse and return `undefined` (integration test)
- [ ] New records have field set at write time, not derived at read time (integration test)
- [ ] `delegationType` is mirrored in `ChildSessionRecord` AND `HierarchyManifestChild` (dual-write integration test)
- [ ] Default behavior is "return all" when filter is omitted (unit test)

**Evidence level expected at acceptance:** L1-L3 (runtime proof: typecheck + tests pass + integration E2E).

---

## 11. References

| Source | Purpose |
|--------|---------|
| `.planning/research/session-tracker-cluster-map-2026-06-04.md` | Deep research — 969 lines, 38 TS files, 9,990 LOC, MVD, R1-R10 |
| `.hivemind/planning/audit-2026-06-04/todo.md` | TODO-1 DONE, TODO-2 IN PROGRESS, locked enum |
| `src/features/session-tracker/types.ts:175-198` | `HierarchyManifestChild` (D-07 authoritative) |
| `src/features/session-tracker/types.ts:208-221` | `HierarchyManifest` |
| `src/features/session-tracker/types.ts:278-318` | `ChildSessionRecord` (with P41-B precedent) |
| `src/features/session-tracker/types.ts:341-354` | `ChildHierarchyEntry` |
| `src/features/session-tracker/types.ts:361-379` | `SessionContinuityIndex` |
| `src/coordination/delegation/types.ts:28-82` | `Delegation` (with `executionMode` precedent) |
| `src/coordination/delegation/sdk-child-session-starter.ts:19-58` | SDK wrapper (narrow path) |
| `src/coordination/delegation/coordinator.ts:140-172` | `ChildSessionStartParams` + `ChildSessionStartResult` |
| `src/coordination/delegation/coordinator.ts:184` | "delegate-task v2 wire" comment |
| `src/features/session-tracker/persistence/hierarchy-manifest.ts:62-95` | `addChild` |
| `src/features/session-tracker/persistence/child-writer.ts:413-438` | `createChildFile` |
| `src/features/session-tracker/tool-delegation.ts:292-454` | `recordChildTaskDelegation` (branching point) |
| `src/features/session-tracker/capture/tool-capture.ts:228-394` | `handleTask` (task-only path) |
| `src/tools/delegation/delegation-status.ts:34-44` | Zod input schema |
| `src/tools/delegation/delegation-status.ts:80-114` | `renderDelegation` |
| `src/tools/delegation/readers/types.ts:56-67` | `HierarchyManifestChildSchema` |
| `src/tools/delegation/readers/session-tracker-reader.ts:32, 66` | `safeParse` calls |
| `.planning/codebase/ARCHITECTURE.md:405-411` | Q6 governance: `.hivemind/` is state, `.opencode/` is primitives |
| `/Users/apple/hivemind-plugin-private/AGENTS.md` §Test-Driven Development | TDD discipline binding |
| `/Users/apple/hivemind-plugin-private/AGENTS.md` §Code Style | Max 500 LOC per module |
| `/Users/apple/hivemind-plugin-private/AGENTS.md` §Git Commit Discipline | Atomic commits mandatory |
| `/Users/apple/hivemind-plugin-private/AGENTS.md` §Terminology | "Delegation packet" not "Task assignment" |

---

**End of design doc. Total: 11 sections, ~600 LOC, 10 MVD files identified, 5 atomic commits planned, R1-R10 addressed, 7 open questions documented.**
