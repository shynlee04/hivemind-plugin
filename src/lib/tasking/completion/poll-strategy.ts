/**
 * Exponential backoff polling strategy for delegated session monitoring (D-11).
 *
 * Starts at 15s, increments by 5s each step, caps at 60s.
 * Resettable when activity is detected.
 */

export type PollConfig = {
  readonly initialIntervalMs: number
  readonly backoffIncrementMs: number
  readonly maxIntervalMs: number
}

export const DEFAULT_POLL_CONFIG: PollConfig = {
  initialIntervalMs: 15_000,
  backoffIncrementMs: 5_000,
  maxIntervalMs: 60_000,
}

export class PollStrategy {
  private currentIntervalMs: number

  constructor(
    private readonly config: PollConfig = DEFAULT_POLL_CONFIG,
  ) {
    this.currentIntervalMs = config.initialIntervalMs
  }

  /**
   * Returns the current interval, then advances for the next call.
   * Caps at maxIntervalMs.
   */
  nextInterval(): number {
    const current = this.currentIntervalMs
    this.currentIntervalMs = Math.min(
      current + this.config.backoffIncrementMs,
      this.config.maxIntervalMs,
    )
    return current
  }

  /** Reset to initial interval. */
  reset(): void {
    this.currentIntervalMs = this.config.initialIntervalMs
  }

  /** Read the next interval that would be returned, without advancing. */
  getCurrentInterval(): number {
    return this.currentIntervalMs
  }
}
