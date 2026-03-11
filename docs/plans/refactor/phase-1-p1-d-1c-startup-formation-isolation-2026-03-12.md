# Phase 1 P1-D.1c Startup-Formation Isolation

- Date: 2026-03-12
- Status: reference
- Last Verified: 2026-03-12
- Parent: `/Users/apple/hivemind-plugin/PLAN.md`
- Category: refactor

## Goal

Reduce `.hivemind` startup-formation chaos by narrowing startup owners, stopping eager readability projections from behaving like bootstrap side effects, and forcing legacy shell donors to fail closed.

## Landed Outcome

### Canonical Owners Retained

1. `src/cli/init.ts`
   - remains the full project/bootstrap owner
2. `src/lib/fs/planning-ops.ts`
   - `ensurePlanningRuntimeReady()` remains the lightweight runtime/prerequisite creator
   - `initializePlanningDirectory()` remains the readable planning/session scaffold owner
3. `src/hooks/event-handler.ts`
   - remains the canonical `session.created` bootstrap owner

### Startup Noise Isolated

1. readability projections are no longer eager startup outputs
   - `.hivemind/INDEX.md`
   - `.hivemind/sessions/index.md`
2. `src/cli/init.ts` now treats those surfaces as projections generated on demand
3. shell donors now fail closed instead of mutating startup state
   - `scripts/auto-init.sh`
   - `scripts/detect-entry.sh`
   - `scripts/classify-intent.sh`

## Why This Matters

Before this slice, startup formation could still look authoritative from multiple directions:

- runtime/planning helpers could materialize human-readable startup surfaces eagerly
- shell-era startup donors still looked callable
- later cycles could misread readability artifacts as part of bootstrap truth

This slice reduces that ambiguity without widening scope into bootstrap/profile authority or session-layout migration yet.

## Verification

- `npx tsx --test tests/init-planning.test.ts tests/entry-chain.test.ts tests/session-created-bootstrap.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run lint:boundary`

## Explicit Non-Goals

- no `sessions/active/` layout migration yet
- no `P1-B` bootstrap/profile authority closeout yet
- no workflow/template producer isolation yet
- no deletion of compatibility markers beyond fail-closed donor behavior

## Follow-On

The next strongest `P1-D.1c` tranche is:

1. isolate the mixed `.hivemind/sessions/active/` contract
   - markdown session files written by `src/lib/session-engine.ts`
   - profile/bootstrap directories written by `src/hooks/event-handler.ts`
   - recovery/bootstrap shims written by `src/tools/hivemind-bootstrap.ts`
2. freeze which of those are authority, compatibility, or recovery-only
3. then continue broader producer isolation from a cleaner startup base

This packet is subordinate to `PLAN.md` and may not override it.
