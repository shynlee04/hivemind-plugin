/**
 * Auto-loop orchestration primitive — Phase 39 PH39-01.
 *
 * Pure async function that drives a self-referential dev loop until a
 * task either completes, exhausts its iteration budget, or is reported
 * as failed by the verifier. The dispatcher and verifier are injected
 * so this module is independent of `delegation-manager`,
 * `completion-detector`, and any other side-effect surface.
 *
 * The verifier classifies each dispatch result into one of three
 * outcomes:
 *  - `completed`: the loop is done; return the final result.
 *  - `needs_continuation`: re-dispatch with the supplied next prompt.
 *  - `failed`: the task failed at the task level; surface the error.
 *
 * Both dispatcher and verifier rejections are treated as
 * infrastructure-level failures and re-thrown as `[Harness]`-prefixed
 * Errors so callers can distinguish them from task-level failures
 * (which the verifier reports via the `failed` outcome).
 */

/**
 * Verification outcome the auto-loop expects from its verifier.
 *
 * @template T - Type of the dispatcher result.
 */
export type AutoLoopVerification<T> =
  | { outcome: "completed"; result: T }
  | { outcome: "needs_continuation"; result: T; nextPrompt: string }
  | { outcome: "failed"; result: T; error: string }

/**
 * Configuration for {@link runAutoLoop}. All side effects come through
 * the injected `dispatcher` / `verifier`; the loop itself is pure.
 *
 * @template T - Type of the dispatcher result.
 */
export type AutoLoopOptions<T> = {
  /** Initial task prompt to dispatch. */
  initialPrompt: string
  /** Maximum number of dispatch attempts. Must be a positive integer. */
  maxIterations: number
  /**
   * Async dispatcher that runs a prompt and returns its raw result.
   * Receives the prompt and the 1-indexed attempt number.
   */
  dispatcher: (prompt: string, attempt: number) => Promise<T>
  /**
   * Async verifier that classifies a dispatcher result. Receives the
   * result and the 1-indexed attempt number. Should return a `failed`
   * outcome for task-level failures rather than throwing; if it does
   * throw, the loop wraps the rejection in a `[Harness]`-prefixed
   * Error matching the dispatcher's behaviour (treated as
   * infrastructure failure, not task-level failure).
   */
  verifier: (result: T, attempt: number) => Promise<AutoLoopVerification<T>>
}

/**
 * Final outcome of an auto-loop run.
 *
 * @template T - Type of the dispatcher result.
 */
export type AutoLoopResult<T> = {
  /** `completed` on verifier success, `exhausted` on iteration cap, `failed` on task-level failure. */
  status: "completed" | "exhausted" | "failed"
  /** Number of dispatcher invocations performed. */
  iterations: number
  /** Most recent dispatcher result, when one was produced. */
  finalResult?: T
  /** Verifier-supplied error message when status is `failed`. */
  error?: string
}

/**
 * Run a self-referential development loop until the verifier reports
 * completion, the iteration budget is exhausted, or a task-level
 * failure is reported.
 *
 * @template T - Type of the dispatcher result.
 * @param options - Loop configuration with injected dispatcher/verifier.
 * @returns Final {@link AutoLoopResult}.
 * @throws `[Harness]`-prefixed Error when `maxIterations` is non-positive
 *   or when the dispatcher or verifier itself rejects.
 *
 * @example
 * ```ts
 * const result = await runAutoLoop({
 *   initialPrompt: "compile the project",
 *   maxIterations: 3,
 *   dispatcher: async (prompt) => spawnSession(prompt),
 *   verifier: async (sessionOutput) => sessionOutput.exitCode === 0
 *     ? { outcome: "completed", result: sessionOutput }
 *     : { outcome: "needs_continuation", result: sessionOutput, nextPrompt: "fix the build" },
 * })
 * ```
 */
export async function runAutoLoop<T>(options: AutoLoopOptions<T>): Promise<AutoLoopResult<T>> {
  if (!Number.isInteger(options.maxIterations) || options.maxIterations <= 0) {
    throw new Error(
      `[Harness] auto-loop maxIterations must be a positive integer, got ${options.maxIterations}`,
    )
  }

  let prompt = options.initialPrompt
  let lastResult: T | undefined
  let attempt = 0

  while (attempt < options.maxIterations) {
    attempt += 1

    let result: T
    try {
      result = await options.dispatcher(prompt, attempt)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[Harness] auto-loop dispatcher failed on attempt ${attempt}: ${message}`)
    }
    lastResult = result

    let verification: AutoLoopVerification<T>
    try {
      verification = await options.verifier(result, attempt)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`[Harness] auto-loop verifier failed on attempt ${attempt}: ${message}`)
    }

    if (verification.outcome === "completed") {
      return { status: "completed", iterations: attempt, finalResult: verification.result }
    }
    if (verification.outcome === "failed") {
      return {
        status: "failed",
        iterations: attempt,
        finalResult: verification.result,
        error: verification.error,
      }
    }
    // outcome === "needs_continuation"
    prompt = verification.nextPrompt
    lastResult = verification.result
  }

  return { status: "exhausted", iterations: attempt, finalResult: lastResult }
}
