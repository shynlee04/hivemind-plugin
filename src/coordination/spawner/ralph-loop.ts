/**
 * Ralph-loop orchestration primitive — Phase 39 PH39-02 / PH39-03.
 *
 * Pure async function that drives a validate-fix-redispatch cycle up
 * to a configurable cap (default 3 per PH39-03). The validator and
 * fixer are injected so this module is independent of any specific
 * delegation surface.
 *
 * Algorithm:
 *  1. Validate the initial result.
 *  2. If `passed` → return `{ status: "passed", cycles: 0, ... }`.
 *  3. If `failed` → push the reason, run the fixer, then validate the
 *     new result. Repeat up to `maxCorrectionCycles` times.
 *  4. If never passes → return `{ status: "exhausted", cycles: max, ... }`.
 *  5. If validator or fixer throws → return `{ status: "error", ... }`.
 *
 * The exhausted case **does not throw** — callers decide how to
 * escalate. {@link escalationMessage} is provided as a convenience
 * that produces a `[Hivemind]`-prefixed string suitable for surfacing
 * to humans.
 */

/**
 * Validator outcome. `failed` carries a human-readable reason and a
 * fix prompt the fixer should use on the next cycle.
 */
export type RalphValidation =
  | { outcome: "passed" }
  | { outcome: "failed"; reason: string; fixPrompt: string }

/**
 * Configuration for {@link runRalphLoop}.
 *
 * @template T - Type of the result being validated.
 */
export type RalphLoopOptions<T> = {
  /** Result of the initial dispatch that needs validation. */
  initialResult: T
  /**
   * Maximum number of fix-redispatch cycles after the initial
   * validation. Must be a positive integer. PH39-03 default at every
   * call site is 3.
   */
  maxCorrectionCycles: number
  /**
   * Async validator that classifies a result. Receives the result and
   * the 0-indexed cycle number (cycle 0 = initial validation). Throws
   * propagate as `status: "error"`.
   */
  validator: (result: T, cycle: number) => Promise<RalphValidation>
  /**
   * Async fixer that produces a corrected result. Receives the fix
   * prompt and the 1-indexed correction cycle number. Throws propagate
   * as `status: "error"`.
   */
  fixer: (fixPrompt: string, cycle: number) => Promise<T>
}

/**
 * Final outcome of a ralph-loop run.
 *
 * @template T - Type of the result being validated.
 */
export type RalphLoopResult<T> = {
  /**
   * `passed` when the validator eventually returns `passed`,
   * `exhausted` when `maxCorrectionCycles` is reached without passing,
   * `error` when the validator or fixer threw.
   */
  status: "passed" | "exhausted" | "error"
  /** Number of correction cycles performed (0 if initial validation passed). */
  cycles: number
  /** Most recent result (initial or fixed). */
  finalResult: T
  /** All failure reasons collected across cycles, plus any thrown messages. */
  errors: string[]
}

/**
 * Run a validate-fix-redispatch cycle up to `maxCorrectionCycles`.
 *
 * @template T - Type of the result being validated.
 * @param options - Loop configuration with injected validator/fixer.
 * @returns Final {@link RalphLoopResult}.
 * @throws `[Hivemind]`-prefixed Error when `maxCorrectionCycles` is
 *   non-positive. Validator/fixer throws are returned as
 *   `status: "error"`, not re-thrown.
 *
 * @example
 * ```ts
 * const result = await runRalphLoop({
 *   initialResult: lintOutput,
 *   maxCorrectionCycles: 3,
 *   validator: async (output) => output.errors.length === 0
 *     ? { outcome: "passed" }
 *     : { outcome: "failed", reason: output.errors[0], fixPrompt: "fix lint" },
 *   fixer: async (fixPrompt) => spawnFixSession(fixPrompt),
 * })
 * if (result.status === "exhausted") {
 *   throw new Error(escalationMessage(result))
 * }
 * ```
 */
export async function runRalphLoop<T>(options: RalphLoopOptions<T>): Promise<RalphLoopResult<T>> {
  if (!Number.isInteger(options.maxCorrectionCycles) || options.maxCorrectionCycles <= 0) {
    throw new Error(
      `[Hivemind] ralph-loop maxCorrectionCycles must be a positive integer, got ${options.maxCorrectionCycles}`,
    )
  }

  let currentResult: T = options.initialResult
  const errors: string[] = []

  let validation: RalphValidation
  try {
    validation = await options.validator(currentResult, 0)
  } catch (error) {
    return {
      status: "error",
      cycles: 0,
      finalResult: currentResult,
      errors: [`[Hivemind] validator threw: ${formatThrown(error)}`],
    }
  }

  if (validation.outcome === "passed") {
    return { status: "passed", cycles: 0, finalResult: currentResult, errors: [] }
  }

  errors.push(validation.reason)
  let fixPrompt = validation.fixPrompt
  let cycle = 0

  while (cycle < options.maxCorrectionCycles) {
    cycle += 1

    try {
      currentResult = await options.fixer(fixPrompt, cycle)
    } catch (error) {
      errors.push(`[Hivemind] fixer threw on cycle ${cycle}: ${formatThrown(error)}`)
      return { status: "error", cycles: cycle, finalResult: currentResult, errors }
    }

    let cycleValidation: RalphValidation
    try {
      cycleValidation = await options.validator(currentResult, cycle)
    } catch (error) {
      errors.push(`[Hivemind] validator threw on cycle ${cycle}: ${formatThrown(error)}`)
      return { status: "error", cycles: cycle, finalResult: currentResult, errors }
    }

    if (cycleValidation.outcome === "passed") {
      return { status: "passed", cycles: cycle, finalResult: currentResult, errors }
    }

    errors.push(cycleValidation.reason)
    fixPrompt = cycleValidation.fixPrompt
  }

  return { status: "exhausted", cycles: options.maxCorrectionCycles, finalResult: currentResult, errors }
}

/**
 * Build a `[Hivemind]`-prefixed escalation message from an exhausted
 * ralph-loop result. Use this when surfacing exhaustion to humans
 * (logs, alerts, error throws).
 *
 * @template T - Type of the result being validated.
 * @param result - Result returned by {@link runRalphLoop}.
 * @returns Single-line `[Hivemind]` message including reason summary.
 */
export function escalationMessage<T>(result: RalphLoopResult<T>): string {
  const reasonSummary = result.errors.length > 0 ? result.errors.join("; ") : "no validator reasons recorded"
  return `[Hivemind] ralph-loop exhausted ${result.cycles} correction cycles; reasons: ${reasonSummary}`
}

/**
 * Format a thrown value into a string for the errors array.
 */
function formatThrown(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
