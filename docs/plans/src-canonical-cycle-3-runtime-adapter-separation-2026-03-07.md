# Src Canonical Cycle 3 Runtime Adapter Separation

Date: 2026-03-07
Status: completed
Type: execution-guide

## Goal

Plan the detailed separation of canonical runtime logic from plugin-side adapter behavior so the duplicated runtime lane can be dismantled in later implementation cycles without destabilizing the system.

## Why This Cycle Exists

Cycle 1 settled ownership language.

Cycle 2 settled source-to-mirror asset projection.

Cycle 3 gets into the actual refactor detail for the runtime overlap:

- context assembly
- governance policy
- lifecycle events
- state snapshot consumption

## Strategic Options

### Option 1: Merge all plugin runtime code into src at once

Why not now:

- too risky
- hides failure sources
- mixes three different overlap classes into one mutation tranche

### Option 2: Leave plugin runtime logic in place and only relabel it

Why not now:

- preserves the second control plane
- does not reduce contamination risk

### Option 3: Split by overlap cluster and plan each as a bounded later slice

Recommended:

- context cluster
- governance cluster
- lifecycle cluster

This is the first level where the refactor gets detailed enough to be actionable without becoming reckless.

## Detailed Refactor Slices

### Slice A: Context Injection Separation

Primary files:

- `src/hooks/messages-transform.ts`
- `src/hooks/session-lifecycle.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `src/lib/injection-orchestrator.ts`
- `src/lib/state-snapshot.ts`

Target:

- `src/**` keeps semantic ownership of what context exists and why
- plugin hook becomes transport/fallback wrapper only

### Slice B: Governance Enforcement Separation

Primary files:

- `src/hooks/tool-gate.ts`
- `src/hooks/soft-governance.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
- `src/lib/gatekeeper.ts`
- `src/lib/detection.ts`

Target:

- canonical policy remains in `src/**`
- plugin interception becomes narrow and secondary

### Slice C: Lifecycle And Event Separation

Primary files:

- `src/hooks/event-handler.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`
- `.opencode/plugins/hiveops-governance/hooks/compaction.ts`
- `.opencode/plugins/hiveops-governance/hooks/entry-guard.ts`

Target:

- lifecycle state transitions remain canonical in `src/**`
- plugin side becomes event bridge or fallback shell only

## Verification Expectations For Later Implementation

- context slice must keep current ownership and child-session tests green
- governance slice must preserve current advisory vs write-boundary behavior unless explicitly re-approved
- lifecycle slice must preserve init/bootstrap continuity and handoff invariants
- all implementation slices must still pass `npx tsc --noEmit`

## Out Of Scope

- writing the implementation code now
- changing the March 6 state-authority split
- redesigning planning root or lineage structure

## Exit Gate

When this cycle is complete, the next gate should decide whether to open Cycle 4 hot-hook consolidation planning, which is the first tranche allowed to become implementation-facing.
