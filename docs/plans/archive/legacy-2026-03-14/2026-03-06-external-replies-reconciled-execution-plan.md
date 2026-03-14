# External Replies Reconciled Execution Plan

Date: 2026-03-06
Status: Refreshed after implemented phases

## Purpose

This document keeps the external `DeepWiki` and `Devin` replies reconciled against current repo truth after implementation moved forward.

It exists to prevent stale external claims from re-entering the active plan.

## Current Verdict

- `DeepWiki` remains the preferred source for OpenCode-native behavior.
- `Devin` remains useful only for high-level repo themes after local verification.
- Current repo code and tests remain the sole authority for current-state facts.

## What Is Now Implemented

- `task_id` continuity in `cycle_log`
- `hivemind_inspect.traverse` v1
- prompt-surface ownership coverage
- first restricted prompt-surface de-duplication slice
- `tool-gate` write demotion
- child-session runtime prompt minimization
- state-authority decision pass

## Live Architecture Themes That Still Matter

1. prompt-surface ownership should keep moving toward one canonical structured context path
2. state authority must stay split cleanly across:
   - `brain.json`
   - `graph/*.json`
   - `hierarchy.json`
3. QA / research workflow design still needs a repo-specific contract
4. GX-Pack fallback runtime coverage still needs a stable direct test harness

## Fresh Decisions Locked In

### Injection authority

- `cognitive-packer.ts` is the leading canonical injection compiler

### Navigation authority

- `hierarchy-tree.ts` + `hierarchy.json` remain the canonical traversal surface for v1

### Session metadata authority

- `brain-state.ts` + `brain.json` remain the canonical hot session metadata store

### Child-session behavior

- runtime ancestry via OpenCode `parentID` is now the active minimization signal
- no new persisted lineage registry was introduced

## What We Explicitly Will Not Reopen

- file-existence disputes already disproven locally
- missing-test claims already disproven locally
- compaction budget migration
- mutation flush gap in `soft-governance.ts`
- greenfield continuity-envelope or state-store proposals

## Next Execution Order

1. QA / research workflow design pass
2. direct GX-Pack fallback runtime coverage when import/test surface stabilizes
3. additional prompt cleanup only behind existing ownership and child-session tests

## Required Evidence Gate

Before any future completion claim on this wave, re-run:

```bash
npx tsc --noEmit
npx tsx --test tests/child-session-injection-policy.test.ts
npx tsx --test tests/injection-surface-ownership.test.ts
npx tsx --test tests/budget-hook-cap.test.ts
```
