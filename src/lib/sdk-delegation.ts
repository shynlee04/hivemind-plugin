import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { extractAllAssistantText, unwrapData } from "./helpers.js"
import { getSessionMessageCount } from "./session-api.js"
import {
  STABILITY_POLL_INTERVAL_MS,
  STABILITY_THRESHOLD,
  type Delegation,
} from "./types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SdkDelegationCallbacks = {
  getDelegation: (id: string) => Delegation | undefined
  persistAllDelegations: () => void
  cleanupTracking: (delegationId: string, childSessionId: string) => void
  scheduleSafetyCeiling: (delegation: Delegation) => void
  onSessionIdle: (sessionId: string) => void
}

// ---------------------------------------------------------------------------
// SdkDelegationHandler
// ---------------------------------------------------------------------------

/**
 * Manages SDK delegation lifecycle: stability polling, result extraction, and recovery.
 *
 * Owned state: stability poll timers.
 * Delegates registration, persistence, and cleanup to DelegationManager via callbacks.
 */
export class SdkDelegationHandler {
  private readonly stabilityTimers = new Map<string, NodeJS.Timeout>()

  constructor(
    private readonly client: OpenCodeClient,
    private readonly callbacks: SdkDelegationCallbacks,
  ) {}

  // -------------------------------------------------------------------------
  // Public API (called by DelegationManager)
  // -------------------------------------------------------------------------

  /** Schedule a stability poll for an SDK delegation. */
  scheduleStabilityPoll(delegationId: string): void {
    const timer = setTimeout(() => {
      this.stabilityTimers.delete(delegationId)
      void this.performStabilityPoll(delegationId)
    }, STABILITY_POLL_INTERVAL_MS)

    this.stabilityTimers.set(delegationId, timer)
  }

  /** Recover an SDK delegation that was running before restart. */
  async recoverSdkDelegation(delegation: Delegation): Promise<void> {
    try {
      const statusMap = unwrapData<Record<string, { type?: string }>>(
        await this.client.session.status(),
      )
      const status = statusMap[delegation.childSessionId]
      if (!status?.type) {
        throw new Error("missing")
      }

      if (status.type === "idle") {
        this.callbacks.onSessionIdle(delegation.childSessionId)
        return
      }

      this.callbacks.scheduleSafetyCeiling(delegation)
    } catch {
      delegation.status = "error"
      delegation.error = "Child session not found on recovery"
      delegation.completedAt = Date.now()
      this.callbacks.persistAllDelegations()
      this.callbacks.cleanupTracking(delegation.id, delegation.childSessionId)
    }
  }

  /** Check whether a stability poll timer is active for the given delegation. */
  isPolling(delegationId: string): boolean {
    return this.stabilityTimers.has(delegationId)
  }

  /** Expose stability timers for test compatibility. */
  getTimerMap(): Map<string, NodeJS.Timeout> {
    return this.stabilityTimers
  }

  /** Clear stability timers for a given delegation. */
  clearTimers(delegationId: string): void {
    const timer = this.stabilityTimers.get(delegationId)
    if (timer) {
      clearTimeout(timer)
      this.stabilityTimers.delete(delegationId)
    }
  }

  // -------------------------------------------------------------------------
  // Private — stability polling
  // -------------------------------------------------------------------------

  private async performStabilityPoll(delegationId: string): Promise<void> {
    const delegation = this.callbacks.getDelegation(delegationId)
    if (!delegation || delegation.status !== "running" || delegation.executionMode !== "sdk") {
      return
    }

    const currentMessageCount = await getSessionMessageCount(this.client, delegation.childSessionId)
    if (currentMessageCount === null) {
      if (!this.stabilityTimers.has(delegationId)) {
        this.scheduleStabilityPoll(delegationId)
      }
      return
    }

    if (currentMessageCount !== delegation.lastMessageCount) {
      delegation.lastMessageCount = currentMessageCount
      delegation.stablePollCount = 0
    } else {
      delegation.stablePollCount += 1
    }
    this.callbacks.persistAllDelegations()

    if (delegation.stablePollCount >= STABILITY_THRESHOLD) {
      await this.finalizeSdkDelegation(delegationId)
      return
    }

    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  private async finalizeSdkDelegation(delegationId: string): Promise<void> {
    const delegation = this.callbacks.getDelegation(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    try {
      const messages = unwrapData(
        await this.client.session.messages({
          path: { id: delegation.childSessionId },
        }),
      )
      delegation.status = "completed"
      delegation.result = extractAllAssistantText(Array.isArray(messages) ? messages : [])
      delegation.error = undefined
      delegation.completedAt = Date.now()
    } catch (error) {
      delegation.status = "error"
      delegation.error = error instanceof Error ? error.message : String(error)
      delegation.completedAt = Date.now()
    }

    this.callbacks.persistAllDelegations()
    this.callbacks.cleanupTracking(delegationId, delegation.childSessionId)
  }
}
