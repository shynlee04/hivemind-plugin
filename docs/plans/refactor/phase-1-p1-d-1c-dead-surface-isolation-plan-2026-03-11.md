# Phase 1 P1-D.1c Dead-Surface Isolation Plan

- Date: 2026-03-11
- Status: reference
- Last Verified: 2026-03-11
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

## Explicit Non-Goals

- no deletion or move of the shell bootstrap trio yet:
  - `scripts/auto-init.sh`
  - `scripts/detect-entry.sh`
  - `scripts/classify-intent.sh`
- no broader workflow/template archive sweep yet
- no hook-level archive pass yet

## Immediate Follow-On

The next `P1-D.1c` tranche should classify and isolate:

1. bootstrap shell donors
2. stale compatibility readers in `src/lib`
3. compatibility wrappers still surviving in `src/tools`
4. workflow/template producers that can still materialize state-like artifacts without manifest-backed authority

This packet is subordinate to `PLAN.md` and may not override it.
