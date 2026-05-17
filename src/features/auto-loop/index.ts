import type { AutoLoopCoordinator, AutoLoopOpts, AutoLoopResult } from "./types.js"
import type { DelegationResult } from "../../coordination/delegation/types.js"

/** Runs sequential delegations for one agent, feeding each result into the next prompt. */
export class AutoLoopEngine {
  constructor(private readonly coordinator: AutoLoopCoordinator) {}

  /** Execute the auto-loop until max iterations, a stop condition, or a terminal failure. */
  async run(opts: AutoLoopOpts): Promise<AutoLoopResult> {
    this.validate(opts)
    const results: DelegationResult[] = []
    for (let iteration = 0; iteration < opts.maxIterations; iteration += 1) {
      const previous = results.at(-1)
      const result = await this.coordinator.dispatch({
        agent: opts.agent,
        currentDepth: 0,
        parentSessionId: opts.parentSessionId ?? "auto-loop",
        prompt: previous ? this.buildPrompt(opts, previous, iteration) : opts.initialPrompt,
        queueKey: opts.queueKey ?? `auto-loop:${opts.agent}`,
        surface: "agent-delegation",
      })
      results.push(result)
      if (this.shouldStop(opts, result)) return { iterations: results.length, results, status: result.status === "completed" ? "completed" : "failed" }
    }
    return { iterations: results.length, results, status: "completed" }
  }

  private buildPrompt(opts: AutoLoopOpts, previous: DelegationResult, iteration: number): string {
    return opts.contextBuilder?.(previous, iteration, opts.initialPrompt) ?? `${opts.initialPrompt}\n\nPrevious result: ${this.summarize(previous)}`
  }

  private shouldStop(opts: AutoLoopOpts, result: DelegationResult): boolean {
    return opts.stopCondition?.(result) === true || result.status === "error" || result.status === "timeout"
  }

  private summarize(result: DelegationResult): string {
    return result.result ?? result.error ?? result.status
  }

  private validate(opts: AutoLoopOpts): void {
    if (opts.maxIterations <= 0) throw new Error("[Harness] auto-loop maxIterations must be greater than 0.")
  }
}
