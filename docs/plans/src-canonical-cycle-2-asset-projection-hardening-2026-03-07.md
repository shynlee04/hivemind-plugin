# Src Canonical Cycle 2 Asset Projection Hardening

Date: 2026-03-07
Status: completed
Type: execution-guide

## Goal

Plan the bounded hardening of asset projection so `src/**` becomes the uncontested source of asset authority for what `.opencode/**` consumes.

## Why This Cycle Exists

Cycle 1 settled the ownership language.

Cycle 2 converts that language into a concrete planning contract around:

- `src/cli/sync-assets.ts`
- `src/cli/init.ts`
- `src/lib/hivefiver-integration.ts`

## Strategic Options

### Option 1: Minimal Report Cleanup

Only reword audits and bootstrap output.

Why not enough:

- it leaves the sync, audit, and init path loosely coupled
- it improves language but not projection discipline

### Option 2: Full Projection Rewrite

Redesign sync, init, and audit logic in one large code tranche.

Why not now:

- too large for the first projection-focused cycle
- bundles policy hardening with behavior change

### Option 3: Bounded Projection Hardening

Keep the existing projection path, but tighten the contract around it.

Recommended:

- it matches the current code structure
- it isolates the projection layer from the hotter runtime adapter layer
- it gives later implementation work a narrow and testable target

## Work Rounds

### Round A: Projection Contract Hardening

Objective:

- lock the authored-source vs mirror contract around sync/init/audit

Expected outputs:

- projection contract
- normalized terminology for asset readiness vs mirror drift
- explicit authored-source authority rules

### Round B: Verification Model

Objective:

- define what evidence later code cycles must produce to claim projection hardening is complete

Expected outputs:

- parity evidence expectations
- init-path evidence expectations
- asset-audit evidence expectations

### Round C: Implementation Boundary

Objective:

- define the narrow code-edit surface for the later execution cycle

Expected outputs:

- implementation boundary around `sync-assets.ts`, `init.ts`, and `hivefiver-integration.ts`
- explicit non-goals that keep this cycle out of plugin runtime consolidation

## In Scope

- authored-source vs mirror policy
- projection-specific audit semantics
- projection-specific bootstrap semantics
- projection verification expectations
- narrow implementation boundary for the later code cycle

## Out Of Scope

- `.opencode/plugins/**` runtime adapter separation
- hot-hook consolidation
- runtime state authority changes
- lineage model redesign

## Acceptance Criteria

- there is one explicit contract for how assets move from root source into `.opencode`
- readiness auditing no longer treats root source and `.opencode` mirrors as peer authorities
- init semantics no longer imply dual asset authority
- later implementation can be scoped to the three projection files without dragging in hook/runtime consolidation

## Exit Gate

When this cycle is complete, open Cycle 3 planning for runtime adapter separation only.
