import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import {
  persistDelegations,
  readPersistedDelegations,
} from "./delegation-persistence.js"
import { unwrapData } from "./helpers.js"
import type { PtyManager } from "./pty/pty-manager.js"
import { getSessionMessageCount } from "./session-api.js"
import { resolveDelegationConcurrencyKey } from "./spawner/concurrency-key.js"
import { resolveParentWorkingDirectory } from "./spawner/parent-directory.js"
import { spawnDelegatedSession } from "./spawner/session-creator.js"
import { startDelegationRuntime } from "./spawner/pty-setup.js"
import type { DelegationSpawnRequest } from "./spawner/spawner-types.js"
import {
  DEFAULT_SAFETY_CEILING_MS,
  STABILITY_POLL_INTERVAL_MS,
  STABILITY_THRESHOLD,
  type Delegation,
  type DelegationResult,
} from "./types.js"

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  safetyCeilingMs?: number
  workingDirectory?: string
  worktree?: string
  provider?: string
  model?: string
  category?: string
}

type ValidatedAgent = {
  name: string
  provider?: string
  model?: string
  category?: string
}

type CanonicalQueueContext = {
  provider?: string
  model?: string
  agent: string
  category?: string
}

type TextPart = { type?: string; text?: string }
type MessageLike = { role?: string; info?: { role?: string }; parts?: TextPart[] }
type DelegationRuntimeMetadata = Pick<Delegation, "executionMode" | "workingDirectory" | "ptySessionId" | "fallbackReason">

/**
 * DelegationManager — WaiterModel execution pattern.
 *
 * Architecture: D-02 (always-background dispatch), D-04 (dual-signal completion
 * via session.idle + message count stability), D-13 (safety ceiling, not deadline).
 */
export class DelegationManager {
  private readonly client: OpenCodeClient
  private readonly delegations = new Map<string, Delegation>()
  private readonly delegationsBySession = new Map<string, string>()
  private readonly safetyTimers = new Map<string, NodeJS.Timeout>()
  private readonly stabilityTimers = new Map<string, NodeJS.Timeout>()
  private readonly semaphore = new DelegationConcurrencyQueue()

  constructor(client: OpenCodeClient) {
    this.client = client
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Dispatch a delegation: validate agent, acquire concurrency slot, create
   * child session, persist, send prompt fire-and-forget.
   *
   * Returns immediately with `{ status: "dispatched", delegationId }`.
   */
  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    const agent = await this.validateAgent(params.agent)
    const canonicalContext = this.buildCanonicalQueueContext(agent, params)
    const acquireQueueKey = buildDelegationQueueKey(canonicalContext)
    const spawnQueueKey = resolveDelegationConcurrencyKey(canonicalContext)
    if (spawnQueueKey !== acquireQueueKey) {
      throw new Error("[Harness] Canonical delegation queue-key drift detected.")
    }

    const release = await this.semaphore.acquire(acquireQueueKey, undefined, undefined)

    try {
      const workingDirectory = resolveParentWorkingDirectory({
        contextDirectory: params.workingDirectory,
        worktree: params.worktree,
      })
      const spawnRequest = this.buildSpawnRequest({
        params,
        agent,
        workingDirectory,
      })
      const child = await spawnDelegatedSession({
        client: this.client as never,
        request: spawnRequest,
      })
      const runtime = await this.startRuntimeMetadata({
        childSessionId: child.childSessionId,
        workingDirectory,
      })

      const delegation: Delegation = {
        id: crypto.randomUUID(),
        parentSessionId: params.parentSessionId,
        childSessionId: child.childSessionId,
        agent: agent.name,
        status: "dispatched",
        createdAt: Date.now(),
        safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
        // Compared against real child-session message counts; failed polls must not advance stability.
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: runtime.executionMode,
        workingDirectory: runtime.workingDirectory,
        ptySessionId: runtime.ptySessionId,
        fallbackReason: runtime.fallbackReason,
        queueKey: acquireQueueKey,
      }

      this.registerDelegation(delegation)
      this.persistAllDelegations()

      // Fire-and-forget prompt — status transitions to "running" via setTimeout(0)
      // in the .then() handler so it doesn't happen before the caller reads "dispatched".
      this.client.session.prompt({
        path: { id: delegation.childSessionId },
        body: {
          parts: [{ type: "text", text: params.prompt }],
          agent: agent.name,
        },
      }).then(() => {
        // setTimeout(0) macrotask: real-timers won't fire before await returns,
        // but fake-timers + advanceTimersByTimeAsync(24) will fire it.
        setTimeout(() => {
          const d = this.delegations.get(delegation.id)
          if (d && d.status === "dispatched") {
            d.status = "running"
            this.persistAllDelegations()
          }
        }, 0)
      }).catch(() => {
        // Prompt failure — mark error, no transition to running
        setTimeout(() => {
          const d = this.delegations.get(delegation.id)
          if (d && d.status === "dispatched") {
            d.status = "error"
            d.error = "Failed to send prompt to child session"
            d.completedAt = Date.now()
            this.persistAllDelegations()
            this.cleanupTracking(delegation.id, delegation.childSessionId)
          }
        }, 0)
      })

      return {
        status: "dispatched",
        delegationId: delegation.id,
        executionMode: delegation.executionMode,
        workingDirectory: delegation.workingDirectory,
        ptySessionId: delegation.ptySessionId,
        fallbackReason: delegation.fallbackReason,
        queueKey: delegation.queueKey,
      }
    } finally {
      release()
    }
  }

  /**
   * Dual-signal: session.idle handler.
   * Transitions "dispatched" → "running" and starts stability polling.
   * Does NOT call messages yet — messages are fetched after stability confirmed.
   */
  handleSessionIdle(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) return

    const delegation = this.delegations.get(delegationId)
    if (!delegation) return

    // Skip if already terminal
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      return
    }

    // Transition to running (if not already)
    if (delegation.status === "dispatched") {
      delegation.status = "running"
      this.persistAllDelegations()
    }

    // Start stability polling only if not already polling
    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  /**
   * Handle session deletion — mark delegation as error, clean up tracking.
   */
  handleSessionDeleted(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) return

    const delegation = this.delegations.get(delegationId)
    if (!delegation) {
      this.cleanupTracking(delegationId, sessionId)
      return
    }

    delegation.status = "error"
    delegation.error = "Delegated session deleted before completion"
    delegation.completedAt = Date.now()

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, sessionId)
  }

  /**
   * Recover pending delegations from disk on plugin load.
   * Re-registers dispatched and running delegations and reconciles their
   * child-session state before resuming polling, scheduling safety ceilings,
   * or failing closed.
   */
  async recoverPending(): Promise<void> {
    const persistedDelegations = readPersistedDelegations()

    for (const delegation of persistedDelegations) {
      // Register all delegations in memory
      this.delegations.set(delegation.id, { ...delegation })

      if (delegation.status !== "running" && delegation.status !== "dispatched") {
        continue
      }

      this.delegationsBySession.set(delegation.childSessionId, delegation.id)

      try {
        const statusMap = unwrapData<Record<string, { type?: string }>>(
          await this.client.session.status(),
        )
        const status = statusMap[delegation.childSessionId]

        if (!status) {
          throw new Error("missing")
        }

        if (status.type === "idle") {
          // Idle session — start dual-signal stability polling
          this.handleSessionIdle(delegation.childSessionId)
          continue
        }

        // Still busy — schedule safety ceiling
        this.scheduleSafetyCeiling(delegation)
      } catch {
        delegation.status = "error"
        delegation.error = "Child session not found on recovery"
        delegation.completedAt = Date.now()
        this.delegations.set(delegation.id, { ...delegation })
        this.persistAllDelegations()
        this.cleanupTracking(delegation.id, delegation.childSessionId)
      }
    }
  }

  /**
   * Get current status of a delegation by ID.
   */
  getStatus(delegationId: string): Delegation | undefined {
    return this.delegations.get(delegationId)
  }

  /**
   * Get all tracked delegations.
   */
  getAllDelegations(): Delegation[] {
    return Array.from(this.delegations.values())
  }

  // ---------------------------------------------------------------------------
  // Dual-signal: stability polling
  // ---------------------------------------------------------------------------

  private scheduleStabilityPoll(delegationId: string): void {
    const timer = setTimeout(() => {
      this.stabilityTimers.delete(delegationId)
      void this.performStabilityPoll(delegationId)
    }, STABILITY_POLL_INTERVAL_MS)

    this.stabilityTimers.set(delegationId, timer)
  }

  private async performStabilityPoll(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    const currentMessageCount = await getSessionMessageCount(
      this.client,
      delegation.childSessionId,
    )

    if (currentMessageCount === null) {
      if (!this.stabilityTimers.has(delegationId)) {
        this.scheduleStabilityPoll(delegationId)
      }
      return
    }

    if (currentMessageCount !== delegation.lastMessageCount) {
      delegation.lastMessageCount = currentMessageCount
      delegation.stablePollCount = 0
      this.persistAllDelegations()
    } else {
      delegation.stablePollCount += 1
      this.persistAllDelegations()
    }

    if (delegation.stablePollCount >= STABILITY_THRESHOLD) {
      await this.finalizeDelegation(delegationId)
      return
    }

    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  // ---------------------------------------------------------------------------
  // Finalization
  // ---------------------------------------------------------------------------

  private async finalizeDelegation(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    try {
      const messages = unwrapData<MessageLike[]>(await this.client.session.messages({
        path: { id: delegation.childSessionId },
      }))

      delegation.status = "completed"
      delegation.result = this.extractAssistantText(messages)
      delegation.completedAt = Date.now()
      delegation.error = undefined
    } catch (error) {
      delegation.status = "error"
      delegation.error = error instanceof Error ? error.message : String(error)
      delegation.completedAt = Date.now()
    }

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  // ---------------------------------------------------------------------------
  // Safety ceiling (max runtime, not a deadline)
  // ---------------------------------------------------------------------------

  private scheduleSafetyCeiling(delegation: Delegation): void {
    const ceiling = delegation.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS
    const elapsed = Date.now() - delegation.createdAt
    const remaining = Math.max(1, ceiling - elapsed)

    const timer = setTimeout(() => {
      void this.handleSafetyCeiling(delegation.id)
    }, remaining)

    this.safetyTimers.set(delegation.id, timer)
  }

  private async handleSafetyCeiling(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    delegation.status = "timeout"
    delegation.error = `[Harness] Delegation safety ceiling reached after ${delegation.safetyCeilingMs}ms`
    delegation.completedAt = Date.now()

    try {
      await this.client.session.abort({ path: { id: delegation.childSessionId } })
    } catch {
      // Child session may already be gone
    }

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  // ---------------------------------------------------------------------------
  // Agent validation
  // ---------------------------------------------------------------------------

  private async validateAgent(agent: string): Promise<ValidatedAgent> {
    const agents = unwrapData<Array<Record<string, unknown>>>(await this.client.app.agents())
    const validAgents = (agents ?? []).map((entry) => ({
      name: typeof entry.name === "string" ? entry.name : "",
      provider: typeof entry.provider === "string" ? entry.provider : undefined,
      model: typeof entry.model === "string" ? entry.model : undefined,
      category: typeof entry.category === "string" ? entry.category : undefined,
    })).filter((entry) => entry.name.length > 0)
    const names = validAgents.map(a => a.name)

    if (!names.includes(agent)) {
      throw new Error(
        `[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`,
      )
    }

    return validAgents.find((entry) => entry.name === agent) ?? { name: agent }
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private registerDelegation(delegation: Delegation): void {
    this.delegations.set(delegation.id, { ...delegation })
    this.delegationsBySession.set(delegation.childSessionId, delegation.id)
    this.scheduleSafetyCeiling(delegation)
  }

  private persistAllDelegations(): void {
    persistDelegations(Array.from(this.delegations.values()))
  }

  // ---------------------------------------------------------------------------
  // Timer management
  // ---------------------------------------------------------------------------

  private clearAllTimers(delegationId: string): void {
    const safetyTimer = this.safetyTimers.get(delegationId)
    if (safetyTimer) {
      clearTimeout(safetyTimer)
      this.safetyTimers.delete(delegationId)
    }

    const stabilityTimer = this.stabilityTimers.get(delegationId)
    if (stabilityTimer) {
      clearTimeout(stabilityTimer)
      this.stabilityTimers.delete(delegationId)
    }
  }

  private cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearAllTimers(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private extractAssistantText(messages: MessageLike[]): string {
    return messages
      .filter((message) => message.role === "assistant" || message.info?.role === "assistant")
      .flatMap((message) => message.parts ?? [])
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join("\n")
  }

  private buildCanonicalQueueContext(agent: ValidatedAgent, params: DelegateParams): CanonicalQueueContext {
    return {
      provider: params.provider ?? agent.provider,
      model: params.model ?? agent.model,
      agent: agent.name,
      category: params.category ?? agent.category,
    }
  }

  private buildSpawnRequest(args: {
    params: DelegateParams
    agent: ValidatedAgent
    workingDirectory: string
  }): DelegationSpawnRequest {
    return {
      parentSessionId: args.params.parentSessionId,
      agent: args.agent.name,
      title: args.params.title ?? `Delegation: ${args.agent.name}`,
      prompt: args.params.prompt,
      workingDirectory: args.workingDirectory,
      executionMode: "pty",
      safetyCeilingMs: args.params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
      permissionProfile: {
        mode: "write-capable",
        tools: ["read", "edit", "write", "bash", "glob", "grep"],
      },
    }
  }

  private async startRuntimeMetadata(args: {
    childSessionId: string
    workingDirectory: string
  }): Promise<DelegationRuntimeMetadata> {
    const runtimeRequest = {
      command: process.env.OPENCODE_HARNESS_DELEGATION_PTY_COMMAND ?? "opencode",
      args: this.readPtyArgsFromEnv(),
      cwd: args.workingDirectory,
      env: this.buildRuntimeEnv(),
    }
    const runtime = await startDelegationRuntime({
      childSessionId: args.childSessionId,
      ptyManager: await this.resolveRuntimePtyManager(),
      request: runtimeRequest,
      spawnHeadless: async () => ({ childSessionId: args.childSessionId }),
    })

    return {
      executionMode: runtime.executionMode,
      workingDirectory: runtime.workingDirectory,
      ptySessionId: runtime.ptySessionId,
      fallbackReason: runtime.fallbackReason,
    }
  }

  private async resolveRuntimePtyManager(): Promise<Pick<PtyManager, "spawn">> {
    if (typeof globalThis.Bun !== "undefined" && process.env.OPENCODE_HARNESS_DELEGATION_PTY_COMMAND) {
      const module = await import("./pty/pty-manager.js")
      const ptyManager = new module.PtyManager()
      if (ptyManager.isSupported()) {
        return ptyManager as Pick<PtyManager, "spawn">
      }
    }

    return {
      spawn: () => {
        throw new Error(
          typeof globalThis.Bun !== "undefined"
            ? "[Harness] PTY delegation runtime command not configured"
            : "[Harness] PTY runtime unavailable in current environment",
        )
      },
    } as Pick<PtyManager, "spawn">
  }

  private buildRuntimeEnv(): Record<string, string> {
    const keys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
    return Object.fromEntries(
      keys
        .map((key) => [key, process.env[key]])
        .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    )
  }

  private readPtyArgsFromEnv(): string[] {
    const rawArgs = process.env.OPENCODE_HARNESS_DELEGATION_PTY_ARGS
    if (!rawArgs) {
      return []
    }

    return rawArgs
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
  }
}

export type { Delegation, DelegationResult }
