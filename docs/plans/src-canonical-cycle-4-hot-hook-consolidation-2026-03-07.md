# Src Canonical Cycle 4 Hot Hook Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Open the first bounded implementation-facing refactor tranche by consolidating the context-injection hot-hook cluster around `src/**` ownership while keeping `.opencode/**` as fallback-only transport.

**Architecture:** This cycle does not attempt a broad plugin merge. It isolates the context cluster first because that is the clearest contamination surface and the best-protected by current tests. The canonical rule is that `src/hooks/session-lifecycle.ts` and `src/hooks/messages-transform.ts` own context semantics, while `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` becomes a thin fallback wrapper that uses canonical snapshot helpers instead of rebuilding policy meaning on its own.

**Tech Stack:** TypeScript, Node test runner, OpenCode plugin hooks, HiveMind runtime hooks, shared injection ledger.

---

## Purpose

Cycle 4 is the first implementation-facing planning tranche.

It exists to turn the completed ownership, projection, and runtime-adapter contracts into one bounded code slice that can be executed under TDD without reopening the whole overlap at once.

## Why The Context Cluster Goes First

Three options were considered:

1. Start with the context cluster.
2. Start with governance enforcement.
3. Start with lifecycle/event bridging.

Option 1 is the best first tranche because the overlap is already explicit, the plugin hook already contains a fallback short-circuit, and the repo already has direct coverage around ownership, shared budget, and child-session minimization. The other two are weaker first moves because governance and lifecycle slices touch broader behavioral boundaries before the control plane has proven the narrower context boundary in code.

## Cycle 4 Scope

In scope for the first implementation slice:

- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `src/lib/injection-orchestrator.ts`
- `src/lib/state-snapshot.ts`
- targeted tests protecting ownership, budget, and child-session policy

Out of scope in this slice:

- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`
- broad lifecycle rewrites
- direct GX-Pack fallback import-surface stabilization

## Target Contract

- `src/**` remains the canonical owner of context semantics.
- `.opencode/**` may adapt message transport and provide fallback-only injection when canonical runtime hooks are unavailable.
- plugin fallback must not independently reinterpret planning, hierarchy, TODO, or governance policy as a second primary control plane.
- any new code movement must preserve:
  - ownership baseline behavior
  - shared turn-budget behavior
  - child-session minimization behavior

## Routed Execution Plan

### Route A: Preferred Path

Use this route if the current tests can express the next boundary clearly.

1. write a failing test that proves the plugin hook yields to canonical runtime presence and does not behave like a second primary context owner
2. run the targeted test and verify the failure is correct
3. implement the smallest code change that narrows plugin-side context responsibility without changing canonical runtime ownership
4. rerun the targeted suite
5. only then consider a second failing test for fallback-only snapshot shaping

### Route B: Fallback Path

Use this if the first red test shows the plugin import surface is still too unstable to exercise directly.

1. stop before code mutation
2. write the missing harness plan instead of forcing runtime edits
3. keep direct GX-Pack fallback coverage deferred
4. continue by tightening canonical helper boundaries in `src/**` only if existing tests can cover them without importing the plugin hook directly

### Route C: Stop Path

Use this if the first targeted test exposes hidden dependency on governance or lifecycle clusters.

1. stop the implementation slice
2. record the new dependency collision in the planning root
3. open a corrective gate before any code movement continues

## TDD Packet

### Task 1: Prove the current boundary with a new failing test

**Files:**
- Modify: `tests/child-session-injection-policy.test.ts`
- Optional Modify: `tests/injection-surface-ownership.test.ts`

**Intent:**
- add one behavior-level test for the first missing boundary in the context cluster
- prefer a test that exercises canonical-vs-fallback behavior without widening the blast radius

**Expected failure shape:**
- the failure must show a missing or too-broad plugin fallback responsibility
- the failure must not come from a broken temp dir, missing config, or type mismatch

### Task 2: Minimal implementation

**Files:**
- Modify: `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- Optional Modify: `src/lib/state-snapshot.ts`

**Intent:**
- narrow plugin responsibility to transport/fallback behavior only
- if helper extraction is needed, do it in `src/lib/**` and keep the plugin hook thin

**Hard rule:**
- no new semantic policy should be introduced in `.opencode/**`

### Task 3: Verify the bounded slice

**Tests:**
- `npx tsx --test tests/injection-surface-ownership.test.ts`
- `npx tsx --test tests/child-session-injection-policy.test.ts`
- `npx tsx --test tests/budget-hook-cap.test.ts`
- `npx tsc --noEmit`

**Success condition:**
- all targeted tests pass
- type-check passes
- no new prompt-surface duplication appears
- child-session suppression remains intact

## Evidence Base

This cycle is grounded in:

- `.hivemind/project/planning/codebase/runtime-adapter-overlap-map-2026-03-07.md`
- `docs/plans/src-canonical-runtime-adapter-separation-contract-2026-03-07.md`
- `docs/plans/src-canonical-cycle-3-runtime-adapter-separation-2026-03-07.md`
- `tests/injection-surface-ownership.test.ts`
- `tests/child-session-injection-policy.test.ts`
- `tests/budget-hook-cap.test.ts`

## Risks

- direct plugin fallback runtime coverage is still not fully harnessed
- plugin fallback logic still reads a wide unified snapshot shape
- hot-hook edits can easily reintroduce duplicate context or break child-session suppression

## Exit Condition

Cycle 4 is ready to execute when the planning root reflects:

- `01-22-PLAN.md` completed
- `01-23-PLAN.md` active for the bounded context cluster
- `01-24-PLAN.md` prepared as the next gate

Cycle 4 is ready to close only after one bounded context-cluster slice has been proven under TDD or intentionally stopped under Route B or Route C.
