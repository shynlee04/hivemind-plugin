---
phase: 39-auto-loop-ralph-loop-engine
artifact: plan
created: 2026-05-01
requirements: [PH39-01, PH39-02, PH39-03]
depends_on: [36-lifecycle-state-machine-enforcement, 67-runtime-pressure-control-plane-implementation]
---

# Phase 39 Plan — Auto-Loop / Ralph-Loop Engine

## Approach

Build two pure orchestration primitives that **take their side-effect
dependencies via injection** rather than reaching into
`delegation-manager.ts` or `completion-detector.ts` directly. This keeps:
- Phase 39 modules unit-testable without spawning real sessions
- No circular dependency between `auto-loop.ts` ↔ `delegation-manager.ts`
- Easy composition (`auto-loop` can wrap `ralph-loop` and vice versa)

The auto-loop module owns the "keep working until done" semantic. The
ralph-loop module owns the "validate-fix-redispatch up to N cycles"
semantic. Both are pure async functions over injected dispatcher /
verifier / fixer callbacks.

## Requirement Tree

### PH39-01 — Self-referential dev loop until completion

**Module:** `src/lib/auto-loop.ts` (~150 LOC).

**API:**

```ts
export type AutoLoopVerification<T> =
  | { outcome: "completed"; result: T }
  | { outcome: "needs_continuation"; result: T; nextPrompt: string }
  | { outcome: "failed"; result: T; error: string }

export type AutoLoopOptions<T> = {
  /** Initial task prompt to dispatch. */
  initialPrompt: string
  /** Maximum number of dispatch attempts. */
  maxIterations: number
  /** Async function that dispatches a prompt and returns its raw result. */
  dispatcher: (prompt: string, attempt: number) => Promise<T>
  /** Async function that classifies a result as completed / needs more / failed. */
  verifier: (result: T, attempt: number) => Promise<AutoLoopVerification<T>>
}

export type AutoLoopResult<T> = {
  status: "completed" | "exhausted" | "failed"
  iterations: number
  finalResult?: T
  error?: string
}

export async function runAutoLoop<T>(options: AutoLoopOptions<T>): Promise<AutoLoopResult<T>>
```

**Behaviour:**
1. Dispatch `initialPrompt` (attempt 1). Verify the result.
2. If verifier returns `completed` → return `{ status: "completed", iterations: n, finalResult }`.
3. If verifier returns `needs_continuation` → re-dispatch with `nextPrompt` (attempt n+1).
4. If verifier returns `failed` → return `{ status: "failed", iterations, finalResult, error }`.
5. If `maxIterations` reached without completion → return `{ status: "exhausted", iterations: maxIterations, finalResult }`.
6. Throws `[Harness]`-prefixed error only when the dispatcher itself rejects (i.e. session-spawn-level failure, not task-level failure).

### PH39-02 — Ralph-loop validate-fix-redispatch cycle

**Module:** `src/lib/ralph-loop.ts` (~170 LOC).

**API:**

```ts
export type RalphValidation =
  | { outcome: "passed" }
  | { outcome: "failed"; reason: string; fixPrompt: string }

export type RalphLoopOptions<T> = {
  /** Result of the initial dispatch that needs validation. */
  initialResult: T
  /** Maximum number of fix-redispatch cycles. */
  maxCorrectionCycles: number
  /** Async function that validates a result. */
  validator: (result: T, cycle: number) => Promise<RalphValidation>
  /** Async function that takes a fix prompt and returns a re-dispatched result. */
  fixer: (fixPrompt: string, cycle: number) => Promise<T>
}

export type RalphLoopResult<T> = {
  status: "passed" | "exhausted" | "error"
  cycles: number
  finalResult: T
  errors: string[]
}

export async function runRalphLoop<T>(options: RalphLoopOptions<T>): Promise<RalphLoopResult<T>>
```

**Behaviour:**
1. Validate `initialResult` (cycle 0).
2. If `passed` → return `{ status: "passed", cycles: 0, finalResult: initialResult, errors: [] }`.
3. If `failed` → push reason onto `errors`, call `fixer(fixPrompt, 1)`, then validate again (cycle 1).
4. Repeat up to `maxCorrectionCycles` times.
5. If still failing after `maxCorrectionCycles` → return `{ status: "exhausted", cycles: maxCorrectionCycles, finalResult: <last>, errors: [...] }`.
6. If validator or fixer throws → return `{ status: "error", ..., errors: [...with throw message] }`.

### PH39-03 — Max 3 correction cycles default + escalation

`maxCorrectionCycles` parameter type is `number` but the **default at every call site is 3**. The Phase 39 conformance test verifies:
- Calling `runRalphLoop` with `maxCorrectionCycles: 3` and a never-passing validator returns `status: "exhausted"` with `cycles === 3` and `errors.length === 4` (1 initial + 3 cycle failures).
- The exhausted case does NOT throw — it returns a structured result so callers can decide how to escalate (log, alert, surface to user).
- A separate helper `escalationMessage(result)` produces a `[Harness]`-prefixed string suitable for surfacing to humans:
  `[Harness] ralph-loop exhausted 3 correction cycles for task; reasons: ...`.

## Test Strategy (TDD, RED→GREEN)

| Test file | Coverage |
|-----------|----------|
| `tests/lib/auto-loop.test.ts` | (1) completes on first iteration, (2) loops through `needs_continuation` until completed, (3) returns `exhausted` at maxIterations, (4) returns `failed` when verifier reports failure, (5) propagates dispatcher reject as thrown `[Harness]` error, (6) records correct iteration count, (7) passes attempt index to dispatcher and verifier. |
| `tests/lib/ralph-loop.test.ts` | (1) returns `passed` on initial validation success (zero cycles), (2) loops fix-validate up to maxCorrectionCycles, (3) returns `exhausted` when never passes, (4) returns `error` when validator throws, (5) returns `error` when fixer throws, (6) records all reasons in `errors`, (7) `escalationMessage()` produces `[Harness]` prefix and includes reason summary. |
| `tests/lib/phase39-conformance.test.ts` | End-to-end: composing auto-loop with ralph-loop as the verifier — failed verifications kick into ralph-loop's correction cycle, passed verifications complete the auto-loop, exhausted ralph-loop surfaces as auto-loop `failed`. |

## Out of Scope

- **No actual integration with `delegation-manager.ts` or `completion-detector.ts` in this PR.** Phase 39's contract is the pure orchestration primitives. Wiring them into the live delegation-manager flow is a follow-up phase that needs design conversation about exit conditions, persistence, and runtime pressure interaction (which is now Phase 67's surface).
- **No runtime-pressure integration.** Phase 67 just landed; integration would require deciding whether auto-loop pauses/aborts on `block` outcomes. That's a separate phase decision; here we ship the orchestration primitives.
- **No persistence of loop state across session restarts.** The orchestration primitives are in-memory.

## Gates

- `npm run typecheck` — clean
- `npm test` — all 1180+ tests must pass plus the new ones (estimated +20 tests)
- `npm run build` — clean
- AGENTS.md compliance: every new function JSDoc'd; modules well under 500 LOC; `[Harness]` prefix on all thrown errors

## Risk Notes

- **Async loop tests** — must use `vi.fn()` mock dispatchers and `await runAutoLoop(...)` rather than fake timers, since loop iterations are sequential `await` calls.
- **Composition test ergonomics** — the conformance test composes both modules; we need to be careful that the composition's failure modes don't leak across, so the test uses real instances of both modules with mocked side-effect callbacks.
