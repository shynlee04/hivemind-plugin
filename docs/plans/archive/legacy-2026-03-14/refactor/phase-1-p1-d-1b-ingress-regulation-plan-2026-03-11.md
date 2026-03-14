# Phase 1 P1-D.1b Ingress Regulation Plan

- Date: 2026-03-11
- Status: reference
- Last Verified: 2026-03-11
- Parent: `/Users/apple/hivemind-plugin/PLAN.md`
- Category: refactor

## Goal

Freeze the first enforceable ingress ledger for `.hivemind` so runtime code can distinguish:

- `authority`
- `projection`
- `quarantine`
- `evidence`
- `archive`
- `compatibility`

This slice exists to stop compatibility and readability surfaces from silently behaving like runtime owners.

## Landed In This Slice

1. Added `src/lib/hivemind-ingress-policy.ts` as the canonical ingress classification ledger.
2. Wired canonical task reads through ingress assertions:
   - `state/tasks.json` must classify as `authority`
   - `graph/tasks.json` fallback must classify as `authority`
3. Wired `state-snapshot.ts` to emit warnings when it reads compatibility surfaces:
   - `state/runtime-profile.json`
   - `state/context-recovery.json`
   - `state/health-metrics.json`
4. Wired `hiveops-export.ts` so:
   - gate reads must come from `authority`
   - handoff/checkpoint writes must land on `evidence`
5. Added targeted ingress-policy tests to prove:
   - core surfaces classify correctly
   - compatibility paths are rejected when authority is required
   - unified snapshot warns on compatibility reads
   - checkpoint files classify as `evidence`

## Initial Classification Freeze

### Authority

- `.hivemind/manifest.json`
- `.hivemind/state/manifest.json`
- `.hivemind/state/brain.json`
- `.hivemind/state/hierarchy.json`
- `.hivemind/state/anchors.json`
- `.hivemind/state/tasks.json`
- `.hivemind/state/gates.json`
- `.hivemind/state/sot-index.json`
- `.hivemind/memory/manifest.json`
- `.hivemind/memory/mems.json`
- `.hivemind/sessions/manifest.json`
- `.hivemind/plans/manifest.json`
- `.hivemind/graph/trajectory.json`
- `.hivemind/graph/plans.json`
- `.hivemind/graph/tasks.json`
- `.hivemind/graph/mems.json`
- `.hivemind/codemap/manifest.json`
- `.hivemind/codewiki/manifest.json`

### Quarantine

- `.hivemind/graph/orphans.json`

### Evidence

- `.hivemind/handoffs/*`
- `.hivemind/checkpoints/*`

### Projection

- `.hivemind/INDEX.md`
- `.hivemind/sessions/index.md`
- `.hivemind/project/planning/**`
- `.hivemind/plans/**` except `plans/manifest.json`
- `.hivemind/state/sot-export.tsv`
- `.hivemind/sessions/active/*.md`

### Compatibility

- `.hivemind/state/todo.json`
- `.hivemind/state/runtime-profile.json`
- `.hivemind/state/context-recovery.json`
- `.hivemind/state/health-metrics.json`
- `.hivemind/sessions/active/*/profile.json`
- `.hivemind/anchors/**`
- `.hivemind/mems/**`

### Archive

- `.hivemind/sessions/archive/**`
- `.hivemind/logs/**`
- `.hivemind/state/*.bak*`

## Explicit Non-Goals

- No lineage-separated state path migration in this slice
- No bootstrap/profile owner rewrite in this slice
- No archive/removal pass in this slice
- No broad hook/session/planning refactor in this slice

## Immediate Follow-On

`P1-D.1c` is now the natural next slice:

- classify noisy producers against this ledger
- isolate or archive dead/legacy surfaces
- keep only manifest-backed or queue-backed owners active

This packet is subordinate to `PLAN.md` and may not override it.
