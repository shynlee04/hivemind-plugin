# Hivefiver Cross-Cutting Mismatch Register

Date: 2026-03-06
Status: active-register
Type: mismatch-register

## Purpose

Record the shared mismatches that every later lane must inherit consistently instead of solving independently.

## Active Mismatches

| ID | Mismatch | Current Truth | Planning Direction | Handling Rule |
|---|---|---|---|---|
| HF-CC-001 | Action taxonomy vs five-lane taxonomy | Runtime uses action families | Planning uses five lanes | Map explicitly; do not rename runtime |
| HF-CC-002 | Heuristic persona selection vs richer awareness routing | Runtime selection is keyword-based | Planning wants stronger stage/awareness adaptation | Mark richer routing as future-facing |
| HF-CC-003 | Runtime topology gap | No explicit topology field in current routing | Planning accepts singular/paired/stacked/chained | Keep topology at planning layer for now |
| HF-CC-004 | Delegation narrative drift | Plugin enforcement is stricter than some profile docs | Planning wants cleaner lineage bridge rules | Runtime enforcement wins until docs and runtime align |
| HF-CC-005 | Continuity drift | Planning root is canonical, transitional handoffs still exist | Planning wants stable resume hierarchy | Treat handoffs as historical continuity only |
| HF-CC-006 | Advisory vs hard-block diagnosis behavior | Several runtime checks are advisory | Planning wants stronger shared diagnose-first discipline | Describe current advisory behavior honestly |
| HF-CC-007 | Legacy planning fallback | `.planning/` still exists as fallback | Planning wants one canonical readable root | Keep fallback compatibility-only |

## Shared Resolution Posture

- resolve shared mismatches centrally before deeper lane-local policy
- let later lanes inherit this register rather than restating it differently
- open runtime alignment work only after planning promotion is approved

## Deferred Runtime Alignment Candidates

These are valid future alignment candidates, but not active implementation in this cycle:

- align runtime routing taxonomy more closely with the five-lane packet
- add explicit topology-aware routing inputs
- reconcile `hivefiver` profile wording with plugin enforcement
- strengthen selected diagnosis-first conditions from advisory to harder gating
