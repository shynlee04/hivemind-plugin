# Next Iteration Architecture Consolidation Implementation Plan

Status: Refreshed after child-session minimization and state-authority pass
Date: 2026-03-06

## Completed Since the Prior Draft

- `task_id` continuity landed in:
  - `src/schemas/brain-state.ts`
  - `src/hooks/soft-governance.ts`
  - `src/tools/hivemind-cycle.ts`
- `hivemind_inspect.traverse` v1 landed as a tree-only inspect surface.
- Prompt-surface ownership coverage now exists in:
  - `tests/injection-surface-ownership.test.ts`
  - `tests/child-session-injection-policy.test.ts`
  - `tests/budget-hook-cap.test.ts`
- The first prompt de-duplication slice landed:
  - duplicate status line removed from `system[]`
  - anchor header reduced to fallback-only when packed context is present
  - `<hivemind_state` is the canonical core-message marker
- `tool-gate` is now advisory-only.
- `soft-governance` is the persisted write boundary for post-tool file-touch state.
- Child-session runtime minimization is now active in:
  - `src/hooks/session-lifecycle.ts`
  - `src/hooks/messages-transform.ts`
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- State-authority decisions are now recorded in:
  - `docs/plans/2026-03-06-state-authority-rationalization-pass.md`

## Current Verified Baseline

- `brain.json` remains the canonical hot session metadata store.
- `graph/*.json` remains the canonical structured task/trajectory/mem source for injected context.
- `hierarchy.json` remains the canonical navigation tree and powers `traverse` v1.
- Runtime child linkage is handled via OpenCode session ancestry lookup, not a new persisted registry.
- The plugin fallback injector remains fallback-only and should not become the canonical core prompt surface.

## Active Next Batch

1. QA / research workflow design pass
2. Direct GX-Pack fallback runtime coverage when `.opencode` hook modules expose a stable test import surface
3. Follow-on prompt-surface cleanup only where ownership coverage stays green

## Constraints

- Do not reopen fixed budget hardening or mutation flush work.
- Do not create a fourth state authority.
- Do not broaden `traverse` into graph-wide relationship walking until tree-first usage proves insufficient.
- Keep child-session minimization runtime-driven unless a later schema decision is explicitly approved.

## Execution Priorities

### Priority 1: Preserve the new authority split

- Injection compiler:
  - `src/lib/cognitive-packer.ts`
- Navigation surface:
  - `src/lib/hierarchy-tree.ts`
- Session metadata surface:
  - `src/schemas/brain-state.ts`

Any new work should fit one of those authorities rather than creating a parallel representation.

### Priority 2: Keep prompt-surface ownership moving in one direction

Target ownership remains:

- `system[]`
  - governance instruction
  - stable warnings
  - short next-step guidance
- `messages[] prepend`
  - canonical structured context
  - first-turn coherence when appropriate
  - minimized child-session context
- `messages[] append`
  - checklist
  - short terminal guidance

### Priority 3: Treat child-session behavior as a first-class regression boundary

Minimum regression expectations:

- main sessions still receive full bootstrap/coherence behavior
- child sessions skip the broad first-turn/bootstrap path
- child sessions receive smaller structured context payloads
- main and child sessions remain isolated

## Verification Gate for Future Batches

Before claiming completion on future batches, run:

```bash
npx tsc --noEmit
npx tsx --test tests/child-session-injection-policy.test.ts
npx tsx --test tests/injection-surface-ownership.test.ts
npx tsx --test tests/budget-hook-cap.test.ts
```

Add batch-specific suites as required by the touched files.

## Deferred Work

- direct GX-Pack fallback runtime coverage
- broader state-authority migration beyond the current decision pass
- QA / research workflow contract implementation
- any persisted parent-session lineage field beyond current runtime and split payload handling
