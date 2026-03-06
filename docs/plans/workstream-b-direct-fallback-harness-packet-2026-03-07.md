# Workstream B Direct Fallback Harness Packet

Date: 2026-03-07
Status: completed-packet
Type: implementation-packet

## Objective

Add direct harness coverage for `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` so Workstream B can validate fallback-only behavior against the real plugin hook instead of deferring the boundary as an unstable import surface.

## Authoritative Files

- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `src/lib/injection-orchestrator.ts`
- `src/lib/plugin-fallback-context.ts`
- `tests/child-session-injection-policy.test.ts`
- `tests/injection-dedupe-contract.test.ts`
- `tests/plugin-fallback-context.test.ts`

## Allowed Write Scope

- `tests/child-session-injection-policy.test.ts`
- optional narrow updates inside `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- optional narrow updates inside `src/lib/**` only if the direct harness exposes a real missing seam
- active planning-root and packet surfaces for this harness wave only

## Forbidden Surfaces

- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- governance and lifecycle workstreams

## Red-Test Target

Prove two direct plugin-hook behaviors:

1. child-session fallback injects minimized GX-Pack context through the real hook
2. plugin fallback becomes a no-op when core runtime hook presence is detected in the worktree

## Green Verification Ring

- `npx tsx --test tests/child-session-injection-policy.test.ts`
- `npx tsx --test tests/injection-dedupe-contract.test.ts`
- `npx tsx --test tests/plugin-fallback-context.test.ts`
- `npx tsx --test tests/injection-surface-ownership.test.ts`
- `npx tsx --test tests/budget-hook-cap.test.ts`
- `npx tsc --noEmit`
- `git diff --check`

## Hard Stop

Stop immediately if:

- the direct harness requires governance or lifecycle surfaces
- the hook cannot be exercised without broad `.opencode/**` rewiring
- the red test fails for setup reasons rather than boundary reasons

## Outcome

The direct fallback harness is now green.

Landed behavior:

- direct plugin-hook child-session fallback coverage in `tests/child-session-injection-policy.test.ts`
- direct plugin-hook no-op coverage when core runtime hooks are present in the worktree
- one minimal seam in `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` that allows the lineage resolver to be injected for direct harness coverage without widening Workstream B

## Next Gate

Open `01-32-PLAN.md` to review harness results and decide whether Workstream B can continue to one further bounded context extraction or should stop for consolidation.
