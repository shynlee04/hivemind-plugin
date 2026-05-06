---
phase: 67-runtime-pressure-control-plane-implementation
artifact: plan
created: 2026-05-01
planning_contract: 57-CONTRACT-2026-04-30.md
requirements: [PRESSURE-01, PRESSURE-02, PRESSURE-03]
---

# Phase 67 Plan — Runtime Pressure Control Plane Implementation

## Source of Truth

The planning contract is `57-CONTRACT-2026-04-30.md`. **Every band boundary,
decision outcome, and matrix attribute below is taken directly from the
contract — none of it is invented here.**

## Current State Audit

`src/lib/runtime-pressure/` already exists and has partial coverage:

| File | Status |
|------|--------|
| `types.ts` | Defines `PressureTier`, `PressureBand`, `PressureDecisionOutcome`, `ToolAuthority` — **shape is mostly right but missing contract-required fields**. |
| `model.ts` | `getPressureBand()` is **wrong vs. contract** (treats tier 2 as `steady` instead of `advisory`). |
| `model.test.ts` | Locks in the wrong behavior — must be rewritten to match contract. |
| `control-plane.ts` | `detectRuntimePressure()` produces all five outcomes but **`PressureDecision` is missing `severity`, `recommendedAction`, and `blockingRationale`**. |
| `authority-matrix.ts` | Has 16 tool entries but **lacks `stateSurface` + `pressureBehavior` + `evidenceAttachment` fields** required by the contract. |
| Tests | 4 files, ~94 LOC; all green at HEAD but lock in pre-contract behavior. |

The Phase 67 CONTEXT.md lists the path as `src/lib/pressure/`. The actual path
is `src/lib/runtime-pressure/`. **We will not rename** — moving an existing
public module surface mid-cycle is risky and the existing path is also
referenced by `src/lib/spawner/agent-primitive-policy.ts` and the Phase 59
authority-matrix conformance test. The deviation is documented in SUMMARY.md.

## Requirement Tree

### PH67-01 — 10-tier steady→advisory→gated→blocking pressure model

Contract band table (**not negotiable**):

| Band | Tiers |
|------|-------|
| steady | 0, 1 |
| advisory | 2, 3, 4 |
| gated | 5, 6, 7 |
| blocking | 8, 9 |

Today's `getPressureBand` returns `steady` for tier 2 (off-by-one against
the contract). Fix the implementation, fix the test, run the full suite to
confirm no other module relies on the broken mapping.

### PH67-02 — `detect()` produces all five outcomes with full decision payload

Contract outcomes: `allow`, `advise`, `require_approval`, `defer`, `block`.

Contract decision payload: `status, reason, severity, recommended action,
blocking rationale (when applicable)`.

Today's `PressureDecision` carries `outcome, reason, tool, tier, band`. We
add **without breaking the existing shape**:

| Field | Type | When present |
|-------|------|--------------|
| `severity` | `"info" \| "warn" \| "error"` | Always (derived from band: steady→info, advisory→warn, gated→warn, blocking→error). |
| `recommendedAction` | `string` | Always (one human-readable next step per outcome). |
| `blockingRationale` | `string` | **Only** when `outcome ∈ {require_approval, defer, block}` — that's exactly when the decision changes the runtime trajectory. |

`outcome` already serves as the contract's `status` field — no rename
needed; we keep `outcome` for source-compat.

### PH67-03 — Tool catalog authority matrix per contract

The contract requires the matrix to **distinguish** four tool classes:
- `.hivemind/` state writers
- `.opencode/` primitive configurators
- read-only inspection tools
- external command runners

Today's `ToolAuthority` only carries `authority`/`mutatesState`/`canExecute`.
We add (additive, no breaking change):

| Field | Type | Purpose |
|-------|------|---------|
| `stateSurface` | `"hivemind-state" \| "opencode-primitive" \| "read-only" \| "external-command"` | Contract-required four-way distinction. |
| `pressureBehavior` | `{ steady: PressureDecisionOutcome; advisory: PressureDecisionOutcome; gated: PressureDecisionOutcome; blocking: PressureDecisionOutcome }` | How the tool reacts at each band — explicit per-tool, not derived. |
| `evidenceAttachment` | `"trajectory-ledger" \| "session-journal" \| "execution-lineage" \| "none"` | Where evidence is attached when this tool runs (trajectory writers, journal exporters, etc.). |

We populate these for the existing 16 tools. We add a **conformance test**
asserting that every tool name registered via `plugin.ts` has a matrix entry,
and that every matrix entry has a non-default `stateSurface`. (The Phase 59
conformance test already covers a subset; this strengthens it.)

`detectRuntimePressure()` keeps its current band-driven defaults but,
**when a known tool is supplied, prefers the tool's per-band
`pressureBehavior` mapping** as the contract intends. Unknown tools fall
back to the conservative band default (mutating gated → require_approval,
blocking → block).

## Out of Scope (explicit non-goals for this PR)

- **No runtime-policy.ts pressurePolicy block.** The contract fixes the
  band boundaries; making them workspace-overridable would break the
  contract.
- **No primitive-registry runtime detection.** Phase 61 already owns
  primitive detection (`status: complete_conditional_runway`). This phase
  consumes the registry results, not produces them.
- **No `src/lib/runtime-pressure/` → `src/lib/pressure/` rename.** Path
  deviation from CONTEXT.md is documented in SUMMARY.md.
- **No Phase 39 auto-loop integration.** That's the next phase; here we
  only deliver the pure decision API + the matrix it dispatches on.

## Test Strategy (TDD, RED→GREEN)

| Test file | Coverage |
|-----------|----------|
| `tests/lib/runtime-pressure/model.test.ts` | **Rewritten** — band mapping per contract (steady=0-1, advisory=2-4, gated=5-7, blocking=8-9), clamp behavior, edge tiers. |
| `tests/lib/runtime-pressure/control-plane.test.ts` | Existing 23 tests + new ones for `severity` derivation per band, `recommendedAction` shape, `blockingRationale` present iff outcome ∈ {require_approval, defer, block}, and tool-driven `pressureBehavior` override. |
| `tests/lib/runtime-pressure/authority-matrix.test.ts` | Existing 35 tests + new ones for `stateSurface` taxonomy correctness (four-way), `pressureBehavior` self-consistency (steady=allow, blocking∈{block,defer}), `evidenceAttachment` enum closure. |
| `tests/lib/runtime-pressure/phase67-conformance.test.ts` | **NEW** — full contract conformance: every plugin-registered tool present in matrix, every entry has non-default `stateSurface`, every entry has a defined `pressureBehavior` for all four bands. |

Existing tests that relied on the off-by-one mapping (`steady` for tier 2)
will be updated in the same commit that fixes the mapping.

## Gates

- `npm run typecheck` — must be clean
- `npm test` — all 1205+ tests must pass plus the new ones
- `npm run build` — must compile cleanly
- AGENTS.md compliance: every new function/class JSDoc'd; no module > 500 LOC

## Risk Notes

- **Test churn.** The off-by-one fix in `getPressureBand` will require
  updating any test that referenced tier-2 as `steady`. Search-and-fix
  before commit.
- **Authority matrix completeness.** Plugin-registered tools may have
  drifted since the matrix was last touched. The conformance test will
  surface drift; fix matrix entries before merging.
- **`pressureBehavior` ergonomics.** Specifying four outcomes per tool is
  verbose. We accept that — being explicit is the point of the matrix.
