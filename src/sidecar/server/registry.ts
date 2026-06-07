/**
 * Lazy dependency binding container for the sidecar HTTP server.
 *
 * The sidecar server starts at plugin init step 5.5, before many
 * plugin modules exist.  This registry lets the server accept
 * dependencies after construction via typed setter methods, with
 * `[Hivemind]` error guards on unbound access.
 *
 * Core dependencies (DelegationManager + SessionTracker + OpenCodeClient)
 * determine {@link isReady}; trajectory, pressure, and config subscriber
 * are optional extras.
 *
 * @module sidecar/server/registry
 */

import type { DelegationManager } from "../../coordination/delegation/manager.js"
import type { SessionTracker } from "../../features/session-tracker/index.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import type { TrajectoryLedger } from "../../task-management/trajectory/types.js"

/**
 * Lazy dependency registry for the sidecar server.
 *
 * All module references use `import type` to avoid circular imports —
 * the sidecar server starts before these modules are constructed.
 */
export class SidecarDependencyRegistry {
  /* eslint-disable @typescript-eslint/no-explicit-any */

  #delegationManager: DelegationManager | undefined
  #sessionTracker: SessionTracker | undefined
  #client: OpenCodeClient | undefined
  #trajectory: TrajectoryLedger | undefined
  #pressure: Record<string, any> | undefined
  #configSubscriber:
    | Partial<Record<string, any>>
    | (() => Partial<Record<string, any>>)
    | undefined

  /* eslint-enable @typescript-eslint/no-explicit-any */

  // ── Setters ──────────────────────────────────────────────

  setDelegationManager(m: DelegationManager): void {
    this.#delegationManager = m
  }

  setSessionTracker(t: SessionTracker): void {
    this.#sessionTracker = t
  }

  setClient(c: OpenCodeClient): void {
    this.#client = c
  }

  setTrajectory(t: TrajectoryLedger): void {
    this.#trajectory = t
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setPressure(p: Record<string, any>): void {
    this.#pressure = p
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setConfigSubscriber(c: Partial<Record<string, any>> | (() => Partial<Record<string, any>>)): void {
    this.#configSubscriber = c
  }

  // ── Getters (with unbound guards) ────────────────────────

  get delegationManager(): DelegationManager {
    if (!this.#delegationManager) {
      throw new Error("[Hivemind] Sidecar: DelegationManager not bound yet")
    }
    return this.#delegationManager
  }

  get sessionTracker(): SessionTracker {
    if (!this.#sessionTracker) {
      throw new Error("[Hivemind] Sidecar: SessionTracker not bound yet")
    }
    return this.#sessionTracker
  }

  get client(): OpenCodeClient {
    if (!this.#client) {
      throw new Error("[Hivemind] Sidecar: Client not bound yet")
    }
    return this.#client
  }

  get trajectory(): TrajectoryLedger {
    if (!this.#trajectory) {
      throw new Error("[Hivemind] Sidecar: Trajectory not bound yet")
    }
    return this.#trajectory
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get pressure(): Record<string, any> {
    if (!this.#pressure) {
      throw new Error("[Hivemind] Sidecar: Pressure not bound yet")
    }
    return this.#pressure
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get configSubscriber(): Partial<Record<string, any>> | (() => Partial<Record<string, any>>) {
    if (!this.#configSubscriber) {
      throw new Error("[Hivemind] Sidecar: ConfigSubscriber not bound yet")
    }
    return this.#configSubscriber
  }

  // ── Readiness ────────────────────────────────────────────

  /**
   * Returns `true` when all three **core** dependencies are bound.
   * Trajectory, pressure, and config subscriber are optional extras
   * and do not affect readiness.
   */
  isReady(): boolean {
    return !!this.#delegationManager && !!this.#sessionTracker && !!this.#client
  }
}
