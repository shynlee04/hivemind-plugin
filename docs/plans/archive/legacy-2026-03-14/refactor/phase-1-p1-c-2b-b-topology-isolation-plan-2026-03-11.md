# Phase 1 P1-C.2b.b Topology Isolation Plan

**Date**: 2026-03-11
**Status**: Active
**Category**: `docs/plans/refactor/`
**Authority**: Subordinate to root `PLAN.md`

---

## Goal

Land workflow topology on canonical task authority so tools, hooks, and later sub-session logic stop inferring relationships ad hoc.

This cycle also prepares the next aggressive slices by:

- tightening `PLAN.md` around the topology contract,
- identifying dead-surface isolation/archive candidates in `src/lib/`, `src/tools/`, and `src/hooks/`,
- narrowing the future `.hivemind` structure work toward authority-first startup flow.

## Scope

In scope:

- `src/schemas/manifest.ts`
- `src/schemas/graph-nodes.ts`
- `src/tools/hiveops-todo.ts`
- `src/hooks/event-handler.ts`
- `src/lib/state-mutation-queue.ts`
- targeted tests for canonical task topology
- `PLAN.md` Phase 1 status / immediate next moves

Out of scope:

- delegate/sub-session completion propagation
- lineage-separated state paths
- bootstrap/profile rewrite
- deletion or movement of runtime code files

## Execution Route

1. Add optional canonical `workflow_topology` to task schema.
2. Stamp topology on manual task creation and `todo.updated` ingestion.
3. Preserve topology through manifest → graph synchronization.
4. Expose topology in task dependency views and exports where it helps navigation.
5. Update `PLAN.md` so the next aggressive cycles target:
   - task survival / delegation,
   - `.hivemind` ingress regulation,
   - dead-surface isolation/archive register,
   - clearer startup/state manifest structure.

## Verification Gate

- `npx tsx --test tests/hiveops-tool-isolation.test.ts tests/hooks/event-handler-todo-2026-02-15.test.ts`
- `npx tsc --noEmit`
- `git diff --check`

## Stop Conditions

Stop and branch back if:

- topology requires new runtime state files,
- task topology cannot survive graph sync without wider graph-schema surgery,
- dead-surface archiving would require moving or deleting active code in this same cycle.

## Follow-On Direction

If this cycle lands cleanly, the next aggressive cycles are:

1. `P1-C.2b.c` main/sub-session task survival
2. `P1-D.1` `.hivemind` ingress regulation
3. dead-surface isolation/archive register for messy compatibility surfaces in `src/lib/`, `src/tools/`, and `src/hooks/`
4. startup/state manifest clarification for easier human operation
