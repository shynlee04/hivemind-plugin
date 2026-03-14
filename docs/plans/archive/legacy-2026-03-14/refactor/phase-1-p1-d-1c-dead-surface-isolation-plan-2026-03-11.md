# Phase 1 P1-D.1c Dead-Surface Isolation Plan

- Date: 2026-03-11
- Status: reference
- Last Verified: 2026-03-12
- Parent: `/Users/apple/hivemind-plugin/PLAN.md`
- Category: refactor

## Goal

Start the first selective archive/isolation wave against the new ingress rulebook so known dead or stale producer surfaces stop polluting verification and planning.

## Landed Subset 1

### Boundary Script Isolation

1. `scripts/check-state-write-boundary.sh`
   - removed the deleted plugin path from the scan roots
   - now scans `src` and `.opencode/tool` only
   - now enforces the current `src`-canonical / wrapper-only ownership model

2. `scripts/check-docs-ownership-boundary.sh`
   - removed the stale dependency on missing `agents/hivefiver-reserved.md`
   - now checks the live framework-vs-implementation boundary:
     - `agents/hivefiver.md` stays framework/meta-builder
     - `agents/hivemaker.md` stays implementation-scoped
     - `agents/hivehealer.md` stays remediation-scoped

### Why This Subset First

- these scripts were already on the active watchlist
- they were failing the repo-level boundary gate for dead-surface reasons
- fixing them reduces noise before broader hook/lib/script archive work starts

## 2026-03-12 Reconciliation Note

The fresh `docs/deep-scan-audit/02-SAFE-TO-ARCHIVE-2026-03-12.md` packet is useful for candidate generation, but it is **not** safe to treat as archive authority by itself.

Verified false-positive examples from live code:

- `src/lib/file-lock.ts` is still consumed by `src/lib/graph/shared.ts` and `src/lib/graph/writer.ts`
- `src/lib/orphan-quarantine.ts` is still consumed by `src/lib/graph/fk-validator.ts`, `src/lib/graph/shared.ts`, and orphan-quarantine tests
- `src/lib/project-snapshot.ts` is still consumed by `src/lib/session-governance.ts`
- `src/lib/session-memory-classifier.ts` is still consumed by tests and `src/tools/hivemind-session-memory.ts`
- `src/lib/skill-registry.ts` is still consumed by `tests/skill-resolver.test.ts`
- `src/lib/tool-activation.ts` is still consumed by `src/lib/session-governance.ts` and tests

Result:

- archive packets from deep-scan-audit must be treated as hypotheses until consumer tracing proves zero live imports/tests/runtime references
- `P1-D.1c` may isolate, downgrade, or archive only after that verification step

The first verified output of that step is captured in:

- working packet: `docs/plans/refactor/phase-1-p1-d-1c-archive-candidate-verification-2026-03-12.md`
- evidence packet: `docs/audits/phase-1-p1-d-1c-archive-candidate-verification-2026-03-12.md`

## 2026-03-12 Verification Tranche Landed

Evidence packet:

- `/Users/apple/hivemind-plugin/docs/audits/phase-1-p1-d-1c-archive-candidate-verification-2026-03-12.md`
- supporting working packet: `/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-p1-d-1c-archive-candidate-verification-2026-03-12.md`

Verified outcome:

1. the six `src/lib` “dead code” candidates from deep-scan are **not** archive-safe and remain live
2. the listed `.hivemind` compatibility/state files and directories are already absent, so they move to archive/remove ledger rather than active refactor work
3. `src/tools/hivemind-doc-weaver.ts` is compatibility-only, but not yet removable because it still has a live test bridge

Routing consequence:

- the next `P1-D.1c` subset must target real producer debt instead of false-positive dead-code candidates

## 2026-03-12 Startup-Formation Isolation Landed

Working packet:

- `/Users/apple/hivemind-plugin/docs/plans/refactor/phase-1-p1-d-1c-startup-formation-isolation-2026-03-12.md`

Verified outcome:

1. `src/lib/fs/planning-ops.ts`
   - `ensurePlanningRuntimeReady()` remains the canonical runtime/planning prerequisite creator
   - `initializePlanningDirectory()` no longer eagerly materializes readability projections
   - root `INDEX.md` and `sessions/index.md` are now on-demand outputs instead of startup side effects
2. `src/cli/init.ts`
   - still owns full project bootstrap
   - now documents readable index surfaces as projections, not startup authority
3. shell startup donors
   - `scripts/auto-init.sh`
   - `scripts/detect-entry.sh`
   - `scripts/classify-intent.sh`
   - all now fail closed as deprecated compatibility markers instead of mutating `.hivemind`

Verification:

- `npx tsx --test tests/init-planning.test.ts tests/entry-chain.test.ts tests/session-created-bootstrap.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run lint:boundary`

Routing consequence:

- startup-formation overlap is reduced, but not closed
- the next `P1-D.1c` subset must target the mixed `.hivemind/sessions/active/` layout split between:
  - markdown session files written by `src/lib/session-engine.ts`
  - per-session profile/bootstrap directories created by `src/hooks/event-handler.ts` and `src/tools/hivemind-bootstrap.ts`

## Explicit Non-Goals

- no broader workflow/template archive sweep yet
- no hook-level archive pass yet
- no `sessions/active/` layout migration yet
- no `P1-B` bootstrap/profile authority closeout yet

## Immediate Follow-On

The next `P1-D.1c` tranche should classify and isolate:

1. the mixed `sessions/active/` layout across `src/lib/session-engine.ts`, `src/hooks/event-handler.ts`, and `src/tools/hivemind-bootstrap.ts`
2. stale compatibility readers in `src/lib`
3. compatibility wrappers still surviving in `src/tools`
4. workflow/template producers that can still materialize state-like artifacts without manifest-backed authority
5. only archive candidates that survive consumer tracing against `src`, `tests`, scripts, and runtime entrypoints

This packet is subordinate to `PLAN.md` and may not override it.
