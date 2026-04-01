---
title: "NODE 2: Trajectory Tool — Canonical Pattern Extraction"
date: "2026-03-31"
agent: hivexplorer
node: 2
scope: src/tools/trajectory/ + src/features/trajectory/ + src/core/trajectory/
git_commit: 85f8cbe7
status: complete
---

# Codebase Investigation Report — NODE 2: Trajectory Tool Pattern

**Scope:** `src/tools/trajectory/` (3 files) + `src/features/trajectory/` (2 files) + `src/core/trajectory/` (7 files)
**Question:** Is the trajectory tool the canonical pattern other tools should follow? Extract every structural layer.
**Date:** 2026-03-31
**Git Commit:** `85f8cbe7`

---

## FINDING 1: Action Enum Values

**Evidence:** `src/tools/trajectory/types.ts:4-10`, `src/tools/trajectory/tools.ts:16`

```typescript
export type HivemindTrajectoryAction =
  | 'inspect'
  | 'traverse'
  | 'attach'
  | 'checkpoint'
  | 'event'
  | 'close'
```

**Zod schema mirror** at `tools.ts:16`:
```typescript
action: tool.schema.enum(['inspect', 'traverse', 'attach', 'checkpoint', 'event', 'close'])
```

**Observation:** The enum is defined once in `types.ts` as a TypeScript union, then mirrored in the Zod schema. There is no `z.enum()` shared source — the two are kept in sync manually. This is a minor DRY gap but functionally correct.

**Additional enums nested in schema:**
- `lineage`: `'hivefiver' | 'hiveminder'` — `tools.ts:20`
- `purposeClass`: 8 values (`discovery`, `brainstorming`, `research`, `planning`, `implementation`, `gatekeeping`, `tdd`, `course-correction`) — `tools.ts:21-24`
- `kind`: `'summary' | 'handoff' | 'evidence' | 'transition' | 'note'` — `tools.ts:30`

---

## FINDING 2: Schema Fields with Zod Types

**Evidence:** `src/tools/trajectory/tools.ts:15-32`

| Field | Zod Type | Optional? | Line |
|-------|----------|-----------|------|
| `action` | `tool.schema.enum([...])` | Required | 16 |
| `trajectoryId` | `tool.schema.string()` | `.optional()` | 17 |
| `workflowId` | `tool.schema.string()` | `.optional()` | 18 |
| `sessionId` | `tool.schema.string()` | `.optional()` | 19 |
| `lineage` | `tool.schema.enum(['hivefiver','hiveminder'])` | `.optional()` | 20 |
| `purposeClass` | `tool.schema.enum([...8 values])` | `.optional()` | 21-24 |
| `taskIds` | `tool.schema.string()` | `.optional()` | 25 |
| `subtaskIds` | `tool.schema.string()` | `.optional()` | 26 |
| `summary` | `tool.schema.string()` | `.optional()` | 27 |
| `source` | `tool.schema.string()` | `.optional()` | 28 |
| `resumeTarget` | `tool.schema.string()` | `.optional()` | 29 |
| `kind` | `tool.schema.enum([...5 values])` | `.optional()` | 30 |
| `evidenceRefs` | `tool.schema.string()` | `.optional()` | 31 |

**Total:** 13 schema fields. 1 required (`action`), 12 optional. All have `.describe()` annotations.

---

## FINDING 3: Factory Pattern Structure

**Evidence:** `src/tools/trajectory/tools.ts:10-48`

```typescript
export function createHivemindTrajectoryTool(projectRoot: string): ReturnType<typeof tool>
```

**Parameters:**
- `projectRoot: string` — single dependency injected at factory time

**Return type:** `ReturnType<typeof tool>` — the OpenCode SDK `tool()` return type

**Structure:**
1. Factory function wraps `tool({...})` call
2. `description` is a static string (lines 12-14)
3. `args` is the Zod schema object (lines 15-32)
4. `execute` delegates to `executeHivemindTrajectoryAction()` from features layer (lines 33-47)
5. Result rendering uses shared helpers: `render(error(...))` / `render(success(...))` (lines 38-46)

**Import chain:**
- `@opencode-ai/plugin/tool` — SDK tool factory (line 1)
- `../../features/trajectory/trajectory.js` — feature execute function (line 3)
- `../../shared/tool-response.js` — `error`, `success` helpers (line 4)
- `../../shared/tool-helpers.js` — `render` helper (line 5)
- `./types.js` — `HivemindTrajectoryToolArgs` type (line 6)

---

## FINDING 4: Action Dispatch Mechanism

**Evidence:** `src/features/trajectory/trajectory.ts:38-177`

**Mechanism: `switch` statement on `args.action`**

```typescript
switch (args.action) {
  case 'inspect':    // lines 39-50
  case 'traverse':   // lines 51-82
  case 'attach':     // lines 83-115
  case 'checkpoint': // lines 116-137
  case 'event':      // lines 138-156
  case 'close':      // lines 157-174
  default:           // lines 175-176
}
```

**Every action has a dedicated handler block.** Each block:
1. Validates required args (guard clauses at the top of each case)
2. Calls a single feature/core function (e.g., `inspectTrajectoryLedger`, `bootstrapTrajectoryLedger`, `recordTrajectoryEvent`, `closeTrajectory`, `createTrajectoryCheckpoint`)
3. Returns a `TrajectoryFeatureResult` union type (`{ kind: 'success' | 'error', ... }`)
4. Includes `pressureContract` in response data

**Pressure contract system** at `types.ts:28-35`:
```typescript
export const trajectoryActionPressureContracts: Record<HivemindTrajectoryAction, RuntimePressureContract>
```
Each action maps to a pressure contract (`steady-state`, `trajectory-control`, `trajectory-continuation`).

**Imports from core:** `src/features/trajectory/trajectory.ts:1-10`
- `bootstrapTrajectoryLedger`, `closeTrajectory`, `createTrajectoryCheckpoint`, `inspectTrajectoryLedger`, `loadTrajectoryLedger`, `recordTrajectoryEvent` — from `../../core/trajectory/index.js`
- `readWorkflowTaskState` — from `../../core/workflow-management/index.js`
- `parseList` — from `../../shared/tool-helpers.js`

---

## FINDING 5: H-C Verdict — Is It Canonical?

**Verdict: YES — This is the canonical pattern.**

**Evidence-based rationale:**

1. **Cleanest separation of concerns:** The tool layer (`tools.ts`, 49 LOC) is purely a thin adapter — it defines the schema, delegates to the feature layer, and renders results. Zero business logic. The feature layer (`trajectory.ts`, 178 LOC) owns all dispatch, validation, and core integration. The types layer (`types.ts`, 35 LOC) owns all type definitions and pressure contracts. The barrel exports (`index.ts`, 1-2 lines each) are clean.

2. **Every action has a dedicated handler:** All 6 actions (`inspect`, `traverse`, `attach`, `checkpoint`, `event`, `close`) have their own `case` block with explicit guard clauses, single-responsibility core calls, and consistent result shapes.

3. **Schema is well-structured:** 13 fields, 1 required, 12 optional. Every field has `.describe()`. All enum values are explicit. The schema mirrors the TypeScript types (manual sync, but consistent).

4. **Consistent result contract:** Every handler returns `TrajectoryFeatureResult` — a discriminated union on `kind: 'success' | 'error'`. Success includes `message`, `data`, and optional `metadata`. Error includes `message`. This is uniform across all 6 actions.

5. **Pressure contract integration:** Each action carries a `RuntimePressureContract` that is resolved at dispatch time and included in every response. This is a governance feature unique to this tool.

6. **LOC discipline:** Total across 5 files = 265 lines. Largest file = 178 lines (feature). Tool file = 49 lines. Well within the ≤300 LOC per file standard.

**Minor gaps (not blockers):**
- Zod enum and TypeScript enum are manually synced (no `z.enum()` inference from the TS type) — `tools.ts:16` vs `types.ts:4-10`
- `taskIds` and `subtaskIds` are strings (comma-separated) requiring `parseList()` parsing — not arrays at the schema level — `tools.ts:25-26`

---

## LOC Summary

| File | Lines |
|------|-------|
| `src/tools/trajectory/tools.ts` | 49 |
| `src/tools/trajectory/types.ts` | 35 |
| `src/tools/trajectory/index.ts` | 2 |
| `src/features/trajectory/trajectory.ts` | 178 |
| `src/features/trajectory/index.ts` | 1 |
| **Total** | **265** |

---

## BLOCKED: None

All requested evidence was found and grounded. No files missing. No patterns absent.
