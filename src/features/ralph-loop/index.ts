import type { DelegationResult } from "../../coordination/delegation/types.js"
import type { RalphLoopCoordinator, RalphLoopOpts, RalphLoopResult } from "./types.js"

/** Cycles delegations across an agent list while passing each result forward. */
export class RalphLoopEngine {
  constructor(private readonly coordinator: RalphLoopCoordinator) {}

  /** Run the configured number of cycles with round-robin agent selection. */
  async run(opts: RalphLoopOpts): Promise<RalphLoopResult> {
    this.validate(opts)
    const results: DelegationResult[] = []
    const agentResults: Record<string, DelegationResult[]> = Object.fromEntries(opts.agents.map((agent) => [agent, []]))
    for (let cycle = 0; cycle < opts.maxCycles; cycle += 1) {
      const agent = opts.agents[cycle % opts.agents.length]
      const previous = results.at(-1)
      const result = await this.coordinator.dispatch({
        agent,
        currentDepth: 0,
        parentSessionId: opts.parentSessionId ?? "ralph-loop",
        prompt: previous ? this.buildPrompt(opts, previous, cycle) : opts.initialPrompt,
        queueKey: opts.queueKey ?? `ralph-loop:${agent}`,
      })
      results.push(result)
      agentResults[agent]?.push(result)
      if (result.status === "error" || result.status === "timeout") return { agentResults, cycles: results.length, results, status: "failed" }
    }
    return { agentResults, cycles: results.length, results, status: "completed" }
  }

  private buildPrompt(opts: RalphLoopOpts, previous: DelegationResult, cycle: number): string {
    return opts.contextBuilder?.(previous, cycle, opts.initialPrompt) ?? `${opts.initialPrompt}\n\nPrevious result: ${previous.result ?? previous.error ?? previous.status}`
  }

  private validate(opts: RalphLoopOpts): void {
    if (opts.agents.length === 0) throw new Error("[Hivemind] ralph-loop agents list must not be empty.")
    if (opts.maxCycles <= 0) throw new Error("[Hivemind] ralph-loop maxCycles must be greater than 0.")
  }
}
