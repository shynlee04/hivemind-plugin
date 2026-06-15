import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

import { getDelegationsFilePath, persistDelegations } from "../../task-management/continuity/delegation-persistence.js"
import type { Delegation } from "./types.js"

export interface DelegationRetryHandlerOptions {
  degradedPath?: string
  persist?: (delegations: Delegation[]) => void
  wait?: (delayMs: number) => Promise<void>
}

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000] as const

/** Adds bounded retry and degraded fallback around delegation persistence. */
export class DelegationRetryHandler {
  private readonly degradedPath: string
  private readonly persist: (delegations: Delegation[]) => void
  private readonly wait: (delayMs: number) => Promise<void>

  constructor(options: DelegationRetryHandlerOptions = {}) {
    this.degradedPath = options.degradedPath ?? getDelegationsFilePath().replace(/delegations\.json$/, "retry-degraded.json")
    this.persist = options.persist ?? persistDelegations
    this.wait = options.wait ?? ((delayMs) => new Promise((resolve) => { setTimeout(resolve, delayMs) }))
  }

  /** Persist delegations, retrying transient failures with exponential backoff. */
  async persistWithRetry(delegations: Delegation[]): Promise<boolean> {
    let lastError: unknown
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        this.persist(delegations)
        return true
      } catch (error) {
        lastError = error
        const delay = RETRY_DELAYS_MS[attempt]
        if (delay === undefined) break
        await this.wait(delay)
      }
    }
    this.writeDegraded(delegations, lastError)
    return false
  }

  private writeDegraded(delegations: Delegation[], error: unknown): void {
    const reason = error instanceof Error ? error.message : String(error)
    mkdirSync(dirname(this.degradedPath), { recursive: true })
    writeFileSync(this.degradedPath, `${JSON.stringify({ reason, delegations, writtenAt: Date.now() }, null, 2)}\n`, "utf-8")
  }
}
