---
phase: 39-auto-loop-ralph-loop-engine
artifact: summary
created: 2026-05-01
status: complete
requirements: [PH39-01, PH39-02, PH39-03]
---

# Phase 39 Summary — Auto-Loop / Ralph-Loop Engine

## Verdict

**COMPLETE.** All three requirements (PH39-01, PH39-02, PH39-03)
implemented as pure orchestration primitives with full TDD coverage.

## Deliverables

### PH39-01 — Self-referential dev loop until completion
- `src/lib/auto-loop.ts` — `runAutoLoop<T>()` (~135 LOC).
- Dispatches the initial prompt, runs the verifier, and either
  completes, re-dispatches with `nextPrompt`, surfaces a task-level
  failure, or exhausts the iteration budget.
- Dispatcher rejection thrown as `[Harness]`-prefixed error
  (infrastructure failure, not task-level failure).

### PH39-02 — Ralph-loop validate-fix-redispatch cycle
- `src/lib/ralph-loop.ts` — `runRalphLoop<T>()` (~155 LOC).
- Validates the initial result, then runs validate-fix-redispatch
  cycles up to `maxCorrectionCycles`. Validator and fixer throws are
  captured into `errors` and surfaced as `status: "error"` rather than
  re-thrown so the caller stays in control.

### PH39-03 — Max 3 correction cycles + escalation
- `maxCorrectionCycles` is a required option (no implicit default), and
  every test plus the conformance test passes `3`. Reflects the
  Phase 39 requirement that callers explicitly choose their cap.
- `runRalphLoop` does not throw on exhaustion — it returns
  `{ status: "exhausted", cycles, finalResult, errors }` so callers
  can decide how to escalate.
- `escalationMessage(result)` produces a `[Harness]`-prefixed string
  ready for surfacing to humans:
  `[Harness] ralph-loop exhausted 3 correction cycles; reasons: ...`.

## Path Choice — Pure Orchestration Primitives

Both modules take their side-effect dependencies via injection
(`dispatcher`, `verifier`, `fixer`, `validator`) rather than reaching
into `delegation-manager` or `completion-detector`. This means:

- **No circular dependencies** between auto-loop ↔ delegation-manager.
- **Trivially unit-testable** with `vi.fn()` mocks.
- **Composable** — auto-loop can wrap ralph-loop and vice versa, as
  demonstrated in `tests/lib/phase39-conformance.test.ts`.
- **Phase 67 integration is an explicit follow-up.** When the runtime
  pressure control plane needs to gate auto-loop iterations on
  blocking pressure, that integration belongs in a separate phase
  that owns the pressure-aware dispatcher.

## Test Evidence

| File | Tests |
|------|-------|
| `tests/lib/auto-loop.test.ts` | 7 |
| `tests/lib/ralph-loop.test.ts` | 9 |
| `tests/lib/phase39-conformance.test.ts` | 2 |
| **Total Phase 39 suite** | **18** |

Full repo suite: **91 files / 1196 tests passing**, plus
`npm run typecheck` and `npm run build` clean.

## Out of Scope (deferred per PLAN.md)

- **No live integration with `delegation-manager.ts` or
  `completion-detector.ts`.** Phase 39's contract is the pure
  orchestration primitives; wiring them into the live delegation flow
  needs a follow-up phase that decides exit conditions, persistence,
  and runtime-pressure interaction.
- **No persistence of loop state across session restarts.** The
  primitives are in-memory.
- **No runtime-pressure (Phase 67) gating inside the loops.** A
  pressure-aware dispatcher can be passed in by the caller; the loops
  themselves stay agnostic.

## Gates

- `npm run typecheck` — PASS
- `npm test` — PASS (1196/1196)
- `npm run build` — PASS
- AGENTS.md compliance — every new function JSDoc'd; both modules well
  under 500 LOC; `[Harness]` prefix on all thrown errors; exhaustion
  message also carries `[Harness]` prefix.
