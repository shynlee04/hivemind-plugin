import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import type { CompletionDetector } from "../completion/detector.js"
import { extractAllAssistantText } from "../../shared/helpers.js"
import { getSessionMessageCount, getSessionMessages, getSessionStatusMap } from "../../shared/session-api.js"
import {
  STABLE_POLLS_REQUIRED,
  MIN_STABILITY_TIME_MS,
  MIN_IDLE_TIME_MS,
  DEFAULT_STALE_TIMEOUT_MS,
  POLL_INTERVAL_ACTIVE_MS,
  POLL_INTERVAL_BASE_MS,
  POLL_INTERVAL_IDLE_MS,
  POLL_INTERVAL_DEEP_IDLE_MS,
  type Delegation,
} from "../../shared/types.js"

const RECOVERY_UNVERIFIED_ERROR = "[Harness] Delegation unverified after restart; recovery will retry through safety ceiling."

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SdkDelegationCallbacks = {
  getDelegation: (id: string) => Delegation | undefined
  persistAllDelegations: () => void
  cleanupTracking: (delegationId: string, childSessionId: string) => void
  scheduleSafetyCeiling: (delegation: Delegation) => void
  onSessionIdle: (sessionId: string) => void
  onTerminal: (delegationId: string, newState: "completed" | "error" | "timeout", error?: string) => void
  /**
   * Optional accessor for the lifecycle-manager-owned `CompletionDetector`.
   * When provided, the SDK polling loop (Phase 36.1 re-wiring) feeds message
   * counts into the detector and consumes any cached terminal signals from
   * `session.error` / `session.deleted` events that arrived through the
   * lifecycle event handler. When absent, the handler falls back to legacy
   * adaptive polling alone — keeping unit tests and callers that don't wire
   * a detector backwards-compatible.
   */
  getCompletionDetector?: () => CompletionDetector | undefined
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

  /** Compute adaptive poll interval based on time since last message count change. */
  private calculateAdaptiveInterval(delegation: Delegation): number {
    const lastChangeAt = delegation.lastMessageCountChangeAt ?? delegation.createdAt
    const idleTime = Date.now() - lastChangeAt

    // R-POLL-01: Adaptive polling intervals
    if (idleTime < 30000) return POLL_INTERVAL_BASE_MS      // stable < 30s
    if (idleTime < 300000) return POLL_INTERVAL_IDLE_MS     // stable 30s–5min
    return POLL_INTERVAL_DEEP_IDLE_MS                        // stable > 5min
  }

  /** Schedule a stability poll for an SDK delegation. */
  scheduleStabilityPoll(delegationId: string, justChanged: boolean = false): void {
    const delegation = this.callbacks.getDelegation(delegationId)
    const interval = justChanged && delegation
      ? POLL_INTERVAL_ACTIVE_MS
      : (delegation ? this.calculateAdaptiveInterval(delegation) : POLL_INTERVAL_BASE_MS)

    const timer = setTimeout(() => {
      this.stabilityTimers.delete(delegationId)
      void this.performStabilityPoll(delegationId)
    }, interval)

    this.stabilityTimers.set(delegationId, timer)
  }

  /** Recover an SDK delegation that was running before restart. */
  async recoverSdkDelegation(delegation: Delegation): Promise<void> {
    try {
      // Timeout protection: if the SDK client is not ready (e.g., second OpenCode
      // instance starting up), don't hang recovery indefinitely.
      const statusMap = await Promise.race([
        getSessionStatusMap(this.client),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Recovery timeout")), 5000),
        ),
      ])
      const status = statusMap[delegation.childSessionId]
      if (!status?.type) {
        throw new Error("missing")
      }

      this.clearStaleRecoveryError(delegation)
      this.callbacks.persistAllDelegations()

      if (status.type === "idle") {
        this.callbacks.onSessionIdle(delegation.childSessionId)
        return
      }

      this.callbacks.scheduleSafetyCeiling(delegation)
    } catch {
      delegation.error = RECOVERY_UNVERIFIED_ERROR
      this.callbacks.persistAllDelegations()
      this.callbacks.scheduleSafetyCeiling(delegation)
    }
  }

  /**
   * Clears only the recovery retry marker after the SDK proves the child session still exists.
   *
   * @param delegation - Persisted delegation being reconciled during startup recovery.
   */
  private clearStaleRecoveryError(delegation: Delegation): void {
    if (delegation.error === RECOVERY_UNVERIFIED_ERROR) {
      delegation.error = undefined
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

    // Phase 36.1 R-COMPLETION-DETECTOR-01+04: short-circuit on ALL cached
    // terminal signals (session.error, session.deleted, AND idle) from the
    // lifecycle-owned CompletionDetector. When the detector is wired, it is
    // the single source of truth for completion — the adaptive polling loop
    // feeds message counts into it (R-COMPLETION-DETECTOR-02) and the
    // detector's internal stability timer resolves "idle" after
    // stabilityTimeoutMs of unchanged counts. This collapses the dual-signal
    // contract into ONE completion path instead of two parallel state machines.
    // When the detector is absent (unit tests, legacy callers), the existing
    // stablePollCount-based finalization serves as the fallback.
    const detector = this.callbacks.getCompletionDetector?.()
    if (detector) {
      const cached = detector.consumeCachedResult(delegation.childSessionId)
      if (cached) {
        if (cached.signal !== "idle") {
          const reason = cached.error
            ? `[Harness] Session ${cached.signal} during delegation: ${cached.error}`
            : `[Harness] Session ${cached.signal} during delegation`
          this.callbacks.onTerminal(delegationId, "error", reason)
          return
        }
        // R-COMPLETION-DETECTOR-04: idle signal from detector → finalize.
        // Apply the same MIN_IDLE_TIME_MS fast-completion deferral as the
        // legacy path to prevent premature finalization on spurious idle.
        const timeSinceCreated = Date.now() - delegation.createdAt
        if (timeSinceCreated < MIN_IDLE_TIME_MS) {
          if (!this.stabilityTimers.has(delegationId)) {
            this.scheduleStabilityPoll(delegationId)
          }
          return
        }
        await this.finalizeSdkDelegation(delegationId)
        return
      }
    }

    const currentMessageCount = await getSessionMessageCount(this.client, delegation.childSessionId)
    if (currentMessageCount === null) {
      if (!this.stabilityTimers.has(delegationId)) {
        this.scheduleStabilityPoll(delegationId)
      }
      return
    }

    // Phase 36.1 R-COMPLETION-DETECTOR-02: feed every successful poll into
    // the dual-signal detector so its message-stability timer mirrors the
    // adaptive polling loop. This makes the detector the single source of
    // truth for "is this session idle?" — either signal can finalize, and
    // the detector's `watch()` API is now backed by real input data.
    if (detector) {
      detector.feedMessageCount(delegation.childSessionId, currentMessageCount)
    }

    const now = Date.now()
    const hasChanged = currentMessageCount !== delegation.lastMessageCount

    if (hasChanged) {
      delegation.lastMessageCount = currentMessageCount
      delegation.stablePollCount = 0
      delegation.lastMessageCountChangeAt = now
    } else {
      delegation.stablePollCount += 1
    }
    this.callbacks.persistAllDelegations()

    // R-POLL-03: Stale session detection — no activity for DEFAULT_STALE_TIMEOUT_MS
    const lastChangeAt = delegation.lastMessageCountChangeAt ?? delegation.createdAt
    const timeSinceLastChange = now - lastChangeAt
    if (timeSinceLastChange > DEFAULT_STALE_TIMEOUT_MS) {
      this.callbacks.onTerminal(delegationId, "timeout", `[Harness] Stale session: no message activity for ${DEFAULT_STALE_TIMEOUT_MS}ms`)
      return
    }

    // R-POLL-02: Fast-completion deferral — do not finalize before MIN_IDLE_TIME_MS
    const timeSinceCreated = now - delegation.createdAt
    if (timeSinceCreated < MIN_IDLE_TIME_MS) {
      if (!this.stabilityTimers.has(delegationId)) {
        this.scheduleStabilityPoll(delegationId, hasChanged)
      }
      return
    }

    // R-POLL-04: Dual stability gate — both elapsed time AND consecutive stable polls
    const hasMinStabilityTime = timeSinceLastChange >= MIN_STABILITY_TIME_MS
    const hasEnoughStablePolls = delegation.stablePollCount >= STABLE_POLLS_REQUIRED

    if (hasMinStabilityTime && hasEnoughStablePolls) {
      await this.finalizeSdkDelegation(delegationId)
      return
    }

    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId, hasChanged)
    }
  }

  private async finalizeSdkDelegation(delegationId: string): Promise<void> {
    const delegation = this.callbacks.getDelegation(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    try {
      const messages = await getSessionMessages(this.client, delegation.childSessionId)
      delegation.result = extractAllAssistantText(messages)
      if (!delegation.result.trim()) {
        this.callbacks.onTerminal(
          delegationId,
          "error",
          "[Harness] Delegation reached stability without assistant completion evidence; manual review required.",
        )
        return
      }
      this.callbacks.onTerminal(delegationId, "completed")
    } catch (error) {
      this.callbacks.onTerminal(delegationId, "error", error instanceof Error ? error.message : String(error))
    }
  }
}
