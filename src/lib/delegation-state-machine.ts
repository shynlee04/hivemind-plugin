/**
 * Delegation state-machine helpers and store extracted from `delegation-manager.ts`
 * to enforce the project's max-500-LOC architectural rule (Phase 36 PH36-03).
 *
 * This module owns:
 *
 * 1. Pure helpers used by `DelegationManager` and the dual-mode dispatch handlers
 *    (`canTransitionDelegationStatus`, `deriveDelegationSurface`,
 *    `deriveRecoveryGuarantee`, `withContractDefaults`, `buildDelegationResult`).
 * 2. `DelegationStateMachine` — the in-memory delegation store plus its terminal
 *    state-transition + timer machinery (safety ceiling, grace period cleanup,
 *    pruning). `DelegationManager` composes one instance and forwards public
 *    queries/operations to it.
 *
 * No new behavior is introduced here — every code path is a verbatim move from
 * the previous `delegation-manager.ts` implementation, with `this.delegations`,
 * `this.delegationsBySession`, `this.safetyTimers`, and `this.gracePeriodTimers`
 * relocated onto this class.
 */

import { persistDelegations } from "./delegation-persistence.js"
import { notifyDelegationTerminal } from "./notification-handler.js"
import { abortSession, type OpenCodeClient } from "./session-api.js"
import {
  DEFAULT_PRUNE_MAX_AGE_MS,
  DEFAULT_SAFETY_CEILING_MS,
  MAX_DELEGATIONS_BEFORE_PRUNE,
  TASK_CLEANUP_DELAY_MS,
  type Delegation,
  type DelegationRecoveryGuarantee,
  type DelegationResult,
  type DelegationStatus,
  type DelegationSurface,
  type DelegationTerminalKind,
} from "./types.js"

/**
 * Allowed delegation status transitions.
 *
 * Terminal states (`completed`, `error`, `timeout`) cannot transition further.
 */
export const VALID_DELEGATION_TRANSITIONS: Record<DelegationStatus, DelegationStatus[]> = {
  dispatched: ["running", "completed", "error", "timeout"],
  running: ["completed", "error", "timeout"],
  completed: [],
  error: [],
  timeout: [],
}

/**
 * Returns true when transitioning a delegation from `from` to `to` is allowed
 * by {@link VALID_DELEGATION_TRANSITIONS}.
 */
export function canTransitionDelegationStatus(from: DelegationStatus, to: DelegationStatus): boolean {
  const allowed = VALID_DELEGATION_TRANSITIONS[from]
  if (!allowed) {
    return false
  }
  return allowed.includes(to)
}

/**
 * Map a delegation's execution mode to its observable delegation surface.
 *
 * - `sdk`     → `agent-delegation`
 * - `pty`/`headless` → `command-process`
 */
export function deriveDelegationSurface(executionMode: Delegation["executionMode"]): DelegationSurface {
  return executionMode === "sdk" ? "agent-delegation" : "command-process"
}

/**
 * Map a delegation's execution mode to its recovery guarantee classification.
 *
 * - `sdk`      → `resumable` (parent can poll OpenCode session after restart)
 * - `pty`      → `best-effort` (PTY survives only while harness is alive)
 * - `headless` → `non-resumable-after-restart`
 */
export function deriveRecoveryGuarantee(executionMode: Delegation["executionMode"]): DelegationRecoveryGuarantee {
  if (executionMode === "sdk") {
    return "resumable"
  }
  if (executionMode === "pty") {
    return "best-effort"
  }
  return "non-resumable-after-restart"
}

/**
 * Fill in default contract fields (`surface`, `recoveryGuarantee`,
 * `explicitCancellation`) on a delegation read from a non-trusted source
 * (persistence file, recovery, etc.).
 */
export function withContractDefaults(delegation: Delegation): Delegation {
  return {
    ...delegation,
    surface: delegation.surface ?? deriveDelegationSurface(delegation.executionMode),
    recoveryGuarantee: delegation.recoveryGuarantee ?? deriveRecoveryGuarantee(delegation.executionMode),
    explicitCancellation: delegation.explicitCancellation ?? false,
  }
}

/**
 * Project a {@link Delegation} record onto the public {@link DelegationResult}
 * shape returned to delegation tools. Pure projection — no side effects.
 */
export function buildDelegationResult(delegation: Delegation): DelegationResult {
  const hydratedDelegation = withContractDefaults(delegation)
  return {
    status: hydratedDelegation.status,
    result: hydratedDelegation.result,
    resultTruncated: hydratedDelegation.resultTruncated,
    error: hydratedDelegation.error,
    delegationId: hydratedDelegation.id,
    executionMode: hydratedDelegation.executionMode,
    surface: hydratedDelegation.surface,
    recoveryGuarantee: hydratedDelegation.recoveryGuarantee,
    workingDirectory: hydratedDelegation.workingDirectory,
    ptySessionId: hydratedDelegation.ptySessionId,
    fallbackReason: hydratedDelegation.fallbackReason,
    queueKey: hydratedDelegation.queueKey,
    terminalKind: hydratedDelegation.terminalKind,
    terminationSignal: hydratedDelegation.terminationSignal,
    explicitCancellation: hydratedDelegation.explicitCancellation,
  }
}

/**
 * Constructor options for {@link DelegationStateMachine}.
 *
 * - `client` — OpenCode SDK client used by `handleSafetyCeiling()` to abort
 *   timed-out child sessions.
 * - `clearExternalTimers` — invoked by {@link DelegationStateMachine.clearAllTimers}
 *   so the SDK and command delegation handlers can clear their per-delegation
 *   timer maps without this module importing them directly.
 */
export interface DelegationStateMachineOptions {
  client: OpenCodeClient
  clearExternalTimers?: (delegationId: string) => void
}

/**
 * Owns the in-memory delegation store and its lifecycle/timer machinery.
 *
 * Responsibilities:
 *
 * - Hold the `delegations` and `delegationsBySession` maps.
 * - Persist the full delegation set whenever it mutates.
 * - Schedule and cancel safety-ceiling and grace-period timers.
 * - Apply guarded status transitions, including the unified
 *   {@link DelegationStateMachine.transitionToTerminal} that terminates a
 *   delegation, persists, cleans timers, and fires the parent notification.
 *
 * Composed by `DelegationManager`, which retains all dispatch + concurrency
 * logic.
 */
export class DelegationStateMachine {
  /** All delegations indexed by delegation id. */
  readonly delegations = new Map<string, Delegation>()
  /** Reverse lookup: child session id → owning delegation id. */
  readonly delegationsBySession = new Map<string, string>()
  /** @internal Test-only — exposed read-only via {@link DelegationManager.safetyTimers}. */
  readonly safetyTimers = new Map<string, NodeJS.Timeout>()
  private readonly gracePeriodTimers = new Map<string, NodeJS.Timeout>()
  private readonly client: OpenCodeClient
  private readonly clearExternalTimers: (delegationId: string) => void

  constructor(options: DelegationStateMachineOptions) {
    this.client = options.client
    this.clearExternalTimers = options.clearExternalTimers ?? (() => { /* no-op */ })
  }

  /** Get a delegation by id, or `undefined` if unknown. */
  get(delegationId: string): Delegation | undefined {
    return this.delegations.get(delegationId)
  }

  /** Snapshot of every delegation currently in memory. */
  getAll(): Delegation[] {
    return Array.from(this.delegations.values())
  }

  /** Reverse lookup: get the delegation id owning `sessionId`, if any. */
  getDelegationIdForSession(sessionId: string): string | undefined {
    return this.delegationsBySession.get(sessionId)
  }

  /**
   * Register a new delegation, fill in contract defaults, link the child
   * session id back to it, and optionally arm the safety-ceiling timer.
   */
  registerDelegation(delegation: Delegation, scheduleSafetyCeiling: boolean): void {
    const hydratedDelegation = withContractDefaults(delegation)
    this.delegations.set(hydratedDelegation.id, hydratedDelegation)
    this.delegationsBySession.set(hydratedDelegation.childSessionId, hydratedDelegation.id)
    if (scheduleSafetyCeiling) this.scheduleSafetyCeiling(hydratedDelegation)
  }

  /**
   * Persist all in-memory delegations to disk. Runs an opportunistic prune
   * first when the store is over {@link MAX_DELEGATIONS_BEFORE_PRUNE}.
   */
  persistAll(): void {
    if (this.delegations.size > MAX_DELEGATIONS_BEFORE_PRUNE) {
      this.pruneCompletedDelegations()
    }
    persistDelegations(Array.from(this.delegations.values()))
  }

  /**
   * Hydrate a single delegation from persistence (used by recovery flows).
   * Does not schedule timers.
   */
  hydrateFromPersistence(delegation: Delegation): void {
    this.delegations.set(delegation.id, delegation)
  }

  /** Track a session-id → delegation-id mapping (used by recovery flows). */
  trackSession(childSessionId: string, delegationId: string): void {
    this.delegationsBySession.set(childSessionId, delegationId)
  }

  /**
   * Apply a guarded delegation status transition without terminal side effects.
   * Returns `true` when the transition was applied.
   */
  transition(delegationId: string, nextStatus: DelegationStatus): boolean {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status === nextStatus) {
      return false
    }
    if (!canTransitionDelegationStatus(delegation.status, nextStatus)) {
      return false
    }
    delegation.status = nextStatus
    this.persistAll()
    return true
  }

  /**
   * Unified terminal transition for all delegation completion paths. Sets
   * status, persists, clears timers, schedules grace-period cleanup, logs the
   * transition, and fires parent notification.
   */
  transitionToTerminal(
    delegationId: string,
    newState: DelegationStatus,
    error?: string,
    terminalDetail?: {
      terminalKind?: DelegationTerminalKind
      terminationSignal?: string
      explicitCancellation?: boolean
    },
  ): void {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    const previousStatus = delegation.status
    if (!canTransitionDelegationStatus(previousStatus, newState)) {
      return
    }

    delegation.status = newState
    delegation.completedAt = Date.now()
    delegation.terminalKind = terminalDetail?.terminalKind ?? delegation.terminalKind
    delegation.terminationSignal = terminalDetail?.terminationSignal ?? delegation.terminationSignal
    delegation.explicitCancellation = terminalDetail?.explicitCancellation ?? delegation.explicitCancellation ?? false
    if (error !== undefined) {
      delegation.error = error
    }
    if (newState === "completed") {
      delegation.error = undefined
    }

    this.clearAllTimers(delegationId)
    this.persistAll()
    this.cleanupTracking(delegationId, delegation.childSessionId)

    // R-OBS-01: Log state transitions with [Harness] prefix
    console.error(`[Harness] Delegation ${delegationId} transitioned: ${previousStatus} → ${newState}${error ? ` (error: ${error})` : ""}`)

    // R-LC-01: Schedule grace period cleanup for terminal delegations
    this.scheduleGracePeriodCleanup(delegationId)

    // R-NOTIF-01: Notify parent session of terminal state (fire-and-forget).
    // Delivery failure queues a durable pending notification that core hooks replay
    // on parent session lifecycle events.
    void notifyDelegationTerminal(this.client, delegation)
  }

  /** Arm the safety-ceiling timer for a delegation. */
  scheduleSafetyCeiling(delegation: Delegation): void {
    const ceiling = delegation.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS
    const remaining = Math.max(1, ceiling - (Date.now() - delegation.createdAt))
    const timer = setTimeout(() => { void this.handleSafetyCeiling(delegation.id) }, remaining)
    this.safetyTimers.set(delegation.id, timer)
  }

  /**
   * Schedule grace-period cleanup for a terminal delegation. Removes the
   * delegation from in-memory state only — does NOT touch persistence (R-LC-03).
   */
  scheduleGracePeriodCleanup(delegationId: string): void {
    const delegation = this.delegations.get(delegationId)
    if (!delegation) return

    const existingTimer = this.gracePeriodTimers.get(delegationId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    delegation.gracePeriodExpiresAt = Date.now() + TASK_CLEANUP_DELAY_MS
    this.persistAll()

    const timer = setTimeout(() => {
      this.gracePeriodTimers.delete(delegationId)
      // R-LC-03: Remove from in-memory Map only — do NOT touch persistence file
      this.delegations.delete(delegationId)
    }, TASK_CLEANUP_DELAY_MS)
    this.gracePeriodTimers.set(delegationId, timer)
  }

  /**
   * Clear safety + grace-period timers and any external timers (SDK/command
   * stability polls) registered with this state machine.
   */
  clearAllTimers(delegationId: string): void {
    const t = this.safetyTimers.get(delegationId)
    if (t) { clearTimeout(t); this.safetyTimers.delete(delegationId) }
    const gt = this.gracePeriodTimers.get(delegationId)
    if (gt) { clearTimeout(gt); this.gracePeriodTimers.delete(delegationId) }
    this.clearExternalTimers(delegationId)
  }

  /**
   * Clear timers and drop the child-session → delegation-id mapping.
   * The delegation record itself is retained so the parent can still query
   * its terminal state until grace-period cleanup runs.
   */
  cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearAllTimers(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  /**
   * Remove terminal delegations (`completed`, `error`, `timeout`) whose
   * `completedAt` timestamp is older than `maxAgeMs`. Prevents unbounded
   * memory growth in the in-memory delegations map. Syncs durable state after
   * pruning.
   *
   * @param maxAgeMs - Maximum age in ms for keeping terminal delegations.
   *   Defaults to {@link DEFAULT_PRUNE_MAX_AGE_MS} (30 minutes).
   * @returns Number of delegations pruned.
   */
  pruneCompletedDelegations(maxAgeMs: number = DEFAULT_PRUNE_MAX_AGE_MS): number {
    const now = Date.now()
    const terminalStatuses: ReadonlySet<DelegationStatus> = new Set(["completed", "error", "timeout"])
    const toPrune: string[] = []

    for (const [id, delegation] of this.delegations) {
      if (!terminalStatuses.has(delegation.status)) continue
      if (delegation.completedAt !== undefined && (now - delegation.completedAt) > maxAgeMs) {
        toPrune.push(id)
      }
    }

    for (const id of toPrune) {
      const delegation = this.delegations.get(id)
      if (delegation) {
        this.cleanupTracking(id, delegation.childSessionId)
      }
      this.delegations.delete(id)
    }

    if (toPrune.length > 0) {
      persistDelegations(Array.from(this.delegations.values()))
    }

    return toPrune.length
  }

  /**
   * Mark a delegation as user-cancelled via its PTY session id. Returns the
   * resulting {@link DelegationResult} when the PTY session is recognised, or
   * `undefined` otherwise. If the delegation is already terminal, returns its
   * current result without mutating state.
   */
  markCommandCancellationForPtySession(ptySessionId: string): DelegationResult | undefined {
    for (const delegation of this.delegations.values()) {
      if (delegation.ptySessionId !== ptySessionId) {
        continue
      }
      if (delegation.status !== "running" && delegation.status !== "dispatched") {
        return buildDelegationResult(delegation)
      }

      delegation.explicitCancellation = true
      delegation.terminalKind = "cancelled"
      this.persistAll()
      return buildDelegationResult(delegation)
    }

    return undefined
  }

  /**
   * Find the active delegation that owns a PTY session id, or `undefined`
   * when none does.
   */
  findByPtySession(ptySessionId: string): Delegation | undefined {
    for (const delegation of this.delegations.values()) {
      if (delegation.ptySessionId === ptySessionId) {
        return delegation
      }
    }
    return undefined
  }

  private async handleSafetyCeiling(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) return
    this.transitionToTerminal(delegationId, "timeout", `[Harness] Delegation safety ceiling reached after ${delegation.safetyCeilingMs}ms`)
    try { await abortSession(this.client, delegation.childSessionId) } catch { /* no-op */ }
  }
}
