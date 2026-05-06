---
phase: 67-runtime-pressure-control-plane-implementation
artifact: summary
created: 2026-05-01
status: complete
planning_contract: 57-CONTRACT-2026-04-30.md
requirements: [PRESSURE-01, PRESSURE-02, PRESSURE-03]
---

# Phase 67 Summary — Runtime Pressure Control Plane Implementation

## Verdict

**COMPLETE.** All three requirements (PRESSURE-01, PRESSURE-02, PRESSURE-03)
satisfied against the planning contract `57-CONTRACT-2026-04-30.md`.

## Deliverables

### PH67-01 — 10-tier steady→advisory→gated→blocking pressure model
- `src/lib/runtime-pressure/model.ts` — `getPressureBand()` band mapping fixed
  to match contract: steady=0-1, advisory=2-4, gated=5-7, blocking=8-9. Prior
  implementation incorrectly mapped tier 2 to `steady`.
- `tests/lib/runtime-pressure/model.test.ts` — rewritten with explicit
  per-band assertions citing the contract.

### PH67-02 — Control-plane decision contract payload
- `src/lib/runtime-pressure/types.ts` — `PressureDecision` extended with
  `severity` (info/warn/error), `recommendedAction` (always present), and
  `blockingRationale` (present only when outcome ∈ {require_approval,
  defer, block}).
- `src/lib/runtime-pressure/control-plane.ts` — `detectRuntimePressure()`
  rewritten to:
  - Prefer the per-tool `pressureBehavior` mapping when a known tool is
    supplied (the matrix is the authority).
  - Fall back to a conservative band default for unknown tools.
  - Derive `severity`, `recommendedAction`, and `blockingRationale` per
    contract.
- All five outcomes (`allow`, `advise`, `require_approval`, `defer`,
  `block`) are exercised by the new conformance tests.

### PH67-03 — Tool catalog authority matrix
- `src/lib/runtime-pressure/types.ts` — `ToolAuthority` extended with
  three contract-required fields:
  - `stateSurface`: four-way taxonomy (`hivemind-state`,
    `opencode-primitive`, `read-only`, `external-command`)
  - `pressureBehavior`: per-band outcome map (steady/advisory/gated/blocking)
  - `evidenceAttachment`: where evidence is recorded
    (`trajectory-ledger`, `session-journal`, `execution-lineage`, `none`)
- `src/lib/runtime-pressure/authority-matrix.ts` — all 16 registered tools
  populated with the new fields, factored through four shared per-band
  behavior templates (HIVEMIND_STATE_WRITER, OPENCODE_PRIMITIVE_WRITER,
  READ_ONLY_INSPECTOR, EXTERNAL_COMMAND_RUNNER).
- `tests/lib/runtime-pressure/phase67-conformance.test.ts` — new 16-case
  conformance suite asserts every entry has all contract fields, the
  four-way state-surface taxonomy is fully populated, per-band behavior
  is monotonic (blocking is never more permissive than steady), and
  mutating tools cannot leak `allow` at the blocking band.

## Path Deviation from CONTEXT.md

CONTEXT.md lists the source path as `src/lib/pressure/`. The actual
existing path is `src/lib/runtime-pressure/`. **No rename was performed**
because:
1. The existing path is already imported by `src/lib/spawner/agent-primitive-policy.ts`
   and the Phase 59 authority-matrix conformance test.
2. Renaming would force a cross-cutting churn unrelated to the contract
   requirements and would fight the existing four green test files.
3. The contract does not specify a path — only the surface and the
   semantics.

This deviation is documented in PLAN.md and acceptable per the
planning-contract precedence rule (contract > CONTEXT path field).

## Test Evidence

- `tests/lib/runtime-pressure/model.test.ts` — 6 tests (band mapping per
  contract, score clamping, explicit-tier classification).
- `tests/lib/runtime-pressure/control-plane.test.ts` — 4 tests
  (unchanged; existing outcomes still satisfied).
- `tests/lib/runtime-pressure/authority-matrix.test.ts` — 2 tests
  (unchanged tool roster; existing entries still match base shape).
- `tests/lib/runtime-pressure/phase59-authority-matrix.test.ts` — 1 test
  (unchanged; Phase 59 entries still satisfy base shape).
- `tests/lib/runtime-pressure/phase67-conformance.test.ts` — 10 NEW
  tests covering the full PRESSURE-01/02/03 contract.

Pressure suite total: **23 tests across 5 files, all green.**

Full repo suite: **88 files / 1179 tests passing**, plus
`npm run typecheck` and `npm run build` clean.

## Out of Scope (deferred per PLAN.md)

- No `pressurePolicy` block in `runtime-policy.ts` — band boundaries are
  fixed by contract, not workspace-overridable.
- No primitive-registry runtime detection — that belongs to Phase 61
  (already `complete_conditional_runway`); this phase consumes the
  registry results, not produces them.
- No Phase 39 auto-loop integration — that's the next phase.
- No path rename of `src/lib/runtime-pressure/` → `src/lib/pressure/`
  per the rationale above.

## Gates

- `npm run typecheck` — PASS
- `npm test` — PASS (1179/1179)
- `npm run build` — PASS
- AGENTS.md compliance — every new/modified function JSDoc'd; no module
  exceeds 500 LOC; `[Harness]` prefix preserved on all error paths.
