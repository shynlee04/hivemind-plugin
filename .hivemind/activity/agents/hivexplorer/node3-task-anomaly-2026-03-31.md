---
title: "Task Tool Execute Signature Anomaly Investigation"
date: "2026-03-31"
agent: "hivexplorer"
scope: "node3-task-anomaly"
status: "complete"
---

# Codebase Investigation Report — Task Tool Execute Signature

**Scope:** `src/tools/task/tools.ts`, `src/tools/task/types.ts`, `src/features/workflow/task.ts`
**Question:** Is the task tool's `execute()` function sync or async? Does it await its feature handler? Is this a bug compared to the trajectory tool pattern?
**Git Context:** Worktree at `/Users/apple/hivemind-plugin/.worktrees/product-detox`, investigated 2026-03-31

---

## Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | `execute()` is declared `async` | `src/tools/task/tools.ts` | 26 | `async execute(args: HivemindTaskToolArgs, context) {` |
| 2 | `executeHivemindTaskAction()` is called **WITHOUT** `await` | `src/tools/task/tools.ts` | 27-29 | `const result = executeHivemindTaskAction(projectRoot, args, { sessionID: context.sessionID, })` — no `await` keyword |
| 3 | `executeHivemindTaskAction()` is **NOT async** — returns `TaskFeatureResult` synchronously | `src/features/workflow/task.ts` | 30-34 | `export function executeHivemindTaskAction(projectRoot: string, args: HivemindTaskToolArgs, _context: TaskFeatureContext): TaskFeatureResult {` — no `async` keyword, returns plain `TaskFeatureResult` (not `Promise<TaskFeatureResult>`) |
| 4 | Action enum: 7 actions — `create`, `list`, `get`, `activate`, `rotate`, `verify`, `complete` | `src/tools/task/types.ts` | 4-11 | `export type HivemindTaskAction = \| 'create' \| 'list' \| 'get' \| 'activate' \| 'rotate' \| 'verify' \| 'complete'` |
| 5 | Schema fields: `action` (required enum), `workflowId`, `taskId`, `title`, `kind` (task/subtask), `parentTaskId`, `dependencyIds`, `verificationContractId`, `evidenceRefs` — all string except `action` and `kind` which are enums | `src/tools/task/tools.ts` | 15-25 | Zod schema via `tool.schema.enum()` and `tool.schema.string().optional()` |
| 6 | LOC counts: `tools.ts` = 42 lines, `types.ts` = 33 lines, `task.ts` (feature) = 190 lines | — | — | File read confirmed |

---

## Comparison: Trajectory Tool Pattern

| Aspect | Task Tool | Trajectory Tool |
|--------|-----------|-----------------|
| `execute()` signature | `async execute(...)` (line 26) | `async execute(...)` (line 33) |
| Awaits feature handler? | **NO** — `const result = executeHivemindTaskAction(...)` (line 27) | **YES** — `const result = await executeHivemindTrajectoryAction(...)` (line 34) |
| Feature handler signature | `function executeHivemindTaskAction(...): TaskFeatureResult` (sync) | `async function executeHivemindTrajectoryAction(...): Promise<...>` (async) |
| Consistency | **INCONSISTENT** — declares `async` but doesn't `await` | **CONSISTENT** — declares `async` and `await`s |

**Evidence for trajectory async handler:** `src/features/trajectory/trajectory.ts` line 29: `export async function executeHivemindTrajectoryAction(`

---

## H-D Verdict: "Sync execute is a latent defect"

**VERDICT: NOT A BUG — The `async` on `execute()` is technically unnecessary but not defective.**

**Rationale with evidence:**

1. **The feature handler `executeHivemindTaskAction()` is fully synchronous.** It returns `TaskFeatureResult` (not `Promise<TaskFeatureResult>`). See `src/features/workflow/task.ts` line 30-34. All internal calls (`listWorkflowTasks`, `readWorkflowTask`, `createWorkflowTask`, `activateWorkflowTask`, `verifyWorkflowTask`, `completeWorkflowTask`, `inspectWorkflowAuthority`, `bootstrapWorkflowAuthority`) are called without `await` and return plain values.

2. **The `async` keyword on `execute()` is redundant but harmless.** An `async` function that doesn't `await` anything still works correctly — it just wraps the return value in a resolved Promise. The OpenCode SDK's `tool()` wrapper accepts both sync and async execute functions.

3. **No unhandled promise rejection risk.** Since `executeHivemindTaskAction()` is sync, there's no Promise to reject. The `async` wrapper around a sync call produces a resolved Promise, not an unhandled one.

4. **The inconsistency is a code smell, not a defect.** The trajectory tool uses `async` + `await` because its feature handler is async. The task tool uses `async` without `await` because its feature handler is sync. The `async` keyword on the task tool's execute was likely copy-pasted or preemptively added, but it causes no runtime harm.

**Recommendation (informational only, not a directive):** The `async` keyword on `src/tools/task/tools.ts` line 26 could be removed for cleanliness, making the signature `execute(args: HivemindTaskToolArgs, context)` without `async`. This would align the declaration with the actual synchronous behavior.

---

## Gaps

- None identified within scope. All 3 target files were read and analyzed completely.
- The underlying workflow-management functions (`createWorkflowTask`, `activateWorkflowTask`, etc.) were not inspected — they could theoretically be async but wrapped synchronously. This is outside the stated scope.

---

## Structure Map

```
src/tools/task/
├── tools.ts      (42 LOC) — Tool definition, async execute without await
└── types.ts      (33 LOC) — HivemindTaskAction enum (7 actions), tool args interface, pressure contracts

src/features/workflow/
└── task.ts       (190 LOC) — executeHivemindTaskAction (sync), switch-case router for 7 actions

src/features/trajectory/
└── trajectory.ts — executeHivemindTrajectoryAction (async) — comparison reference
```

---

## Patterns Found

- **CQRS pattern:** Tools delegate to feature handlers, which delegate to core workflow-management functions
- **Pressure contracts:** Each action maps to a `RuntimePressureContract` (`task-mutation` vs `steady-state`)
- **Result envelope:** All feature handlers return `{ kind: 'success' | 'error', message, data?, details? }` envelope
- **Inconsistency:** Task tool declares `async execute` but doesn't `await`; trajectory tool does both
