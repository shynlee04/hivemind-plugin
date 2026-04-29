---
phase: 54-sidecar-and-product-detox-integration-runway
artifact: phase-verification-frame
created: 2026-04-28
status: pending-pre-planning
evidence_posture: no_completion_claims
---

# Phase 54 Verification Frame: Sidecar & Product-Detox Integration Runway

## Current Verdict

**PENDING — NO RUNWAY VERIFICATION EXISTS YET.** This is a pre-planning verification frame. It defines what must be proven before anyone can claim the sidecar/product-detox runway is ready for implementation planning.

## What Must Be Proven

| Runway Claim | Minimum Evidence | Why |
|---|---:|---|
| Sidecar contract is read-only against canonical state | L3 + L5, and L1 later if a sidecar prototype exists | Must be grounded in current code/guard surfaces before UI build |
| Product-detox concepts are migrated through gates, not copied | L5 for control-plane mapping; L3 for future guard/projection tests | This is an architecture constraint, not a hope |
| Primitive/permission UX maps to real configuration/runtime surfaces | L3 | Needs code-grounded validation against `opencode.json`, primitive loader, and configure/runtime validators |
| Hook-injection UX does not bypass CQRS boundaries | L3, and L1 later if interactive UX exists | Hook mutation boundaries must remain explicit |

## Pending Verification Matrix

| Scenario | Claim | Required Evidence | Completion Condition |
|---|---|---|---|
| V54-01 Sidecar boundaries | sidecar reads/proposes only, never writes canonical state | L3 code/guard evidence | no write path exists outside approved tools/commands |
| V54-02 Product-detox gates | migration candidates must pass concept gates before planning | L5 control-plane mapping + L3 guard strategy | no copy-forward path remains implicit |
| V54-03 Primitive UX contract | user-configurable primitive flows map to real validator/compiler/runtime surfaces | L3 | planner can identify exact config precedence and validation path |
| V54-04 Hook injection UX | user-facing guidance for hook behavior does not create hidden authority | L3 | planner can show the safe request path |

## Evidence Rejections

- Absence of a sidecar app is not evidence that the boundary problem is solved.
- Stack skill availability is not evidence that the integration contract is ready.
- Product-detox design prose is not evidence that a migration path is safe.
- Any UI/config proposal that writes canonical state directly fails verification.

## Final Verification Gate

Phase 54 may be marked verified only when a later planner/verifier can show:

1. the sidecar contract is read-only and request-mediated,
2. product-detox concept migration is gate-enforced,
3. primitive/permission UX is grounded in real runtime/config surfaces, and
4. hook injection remains inside approved authority boundaries.
