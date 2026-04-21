import { spawn as spawnHeadlessProcess, type ChildProcessWithoutNullStreams } from "node:child_process"

import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import { persistDelegations, readPersistedDelegations } from "./delegation-persistence.js"
import { unwrapData } from "./helpers.js"
import type { PtyManager } from "./pty/pty-manager.js"
import { getSessionMessageCount } from "./session-api.js"
import { resolveDelegationConcurrencyKey } from "./spawner/concurrency-key.js"
import { resolveParentWorkingDirectory } from "./spawner/parent-directory.js"
import { spawnDelegatedSession } from "./spawner/session-creator.js"
import type { DelegationSpawnRequest } from "./spawner/spawner-types.js"
import {
  DEFAULT_SAFETY_CEILING_MS,
  STABILITY_POLL_INTERVAL_MS,
  STABILITY_THRESHOLD,
  type CommandDelegationParams,
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
  agent?: string
  category?: string
}

type MessageLike = {
  role?: string
  info?: { role?: string }
  parts?: Array<{ type?: string; text?: string }>
}

type HeadlessCommandState = {
  process: ChildProcessWithoutNullStreams
  output: string
}

type DelegationManagerOptions = {
  ptyManager?: PtyManager | null
}

const COMMAND_POLL_INTERVAL_MS = 250

export class DelegationManager {
  private readonly delegations = new Map<string, Delegation>()
  private readonly delegationsBySession = new Map<string, string>()
  private readonly safetyTimers = new Map<string, NodeJS.Timeout>()
  private readonly stabilityTimers = new Map<string, NodeJS.Timeout>()
  private readonly commandPollTimers = new Map<string, NodeJS.Timeout>()
  private readonly semaphore = new DelegationConcurrencyQueue()
  private readonly headlessCommands = new Map<string, HeadlessCommandState>()

  constructor(
    private readonly client: OpenCodeClient,
    private readonly options: DelegationManagerOptions = {},
  ) {}

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
      const child = await spawnDelegatedSession({
        client: this.client as never,
        request: this.buildSpawnRequest({ params, agent, workingDirectory }),
      })

      const delegation: Delegation = {
        id: crypto.randomUUID(),
        parentSessionId: params.parentSessionId,
        childSessionId: child.childSessionId,
        agent: agent.name,
        status: "dispatched",
        createdAt: Date.now(),
        safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: "sdk",
        workingDirectory,
        queueKey: acquireQueueKey,
      }

      this.registerDelegation(delegation, true)
      this.persistAllDelegations()

      this.client.session.prompt({
        path: { id: delegation.childSessionId },
        body: {
          parts: [{ type: "text", text: params.prompt }],
          agent: agent.name,
        },
      }).then(() => {
        setTimeout(() => {
          const current = this.delegations.get(delegation.id)
          if (current && current.status === "dispatched") {
            current.status = "running"
            this.persistAllDelegations()
          }
        }, 0)
      }).catch(() => {
        setTimeout(() => {
          const current = this.delegations.get(delegation.id)
          if (current && current.status === "dispatched") {
            current.status = "error"
            current.error = "Failed to send prompt to child session"
            current.completedAt = Date.now()
            this.persistAllDelegations()
            this.cleanupTracking(delegation.id, delegation.childSessionId)
          }
        }, 0)
      })

      return this.buildResult(delegation)
    } finally {
      release()
    }
  }

  async dispatchCommand(params: CommandDelegationParams): Promise<DelegationResult> {
    const queueContext = this.buildCommandQueueContext(params)
    const queueKey = buildDelegationQueueKey(queueContext)
    const release = await this.semaphore.acquire(queueKey, undefined, undefined)

    try {
      const delegationId = crypto.randomUUID()
      const workingDirectory = params.cwd ?? process.cwd()
      const title = params.title ?? `Command: ${params.command}`
      const ptyManager = this.resolvePtyManager()

      if (ptyManager) {
        try {
          const session = ptyManager.spawn({
            command: params.command,
            args: params.args ?? [],
            cwd: workingDirectory,
            env: this.buildMinimalEnv(params.env),
            metadata: {
              source: "delegation",
              title,
              parentSessionId: params.parentSessionId,
              delegationId,
            },
          })

          const delegation: Delegation = {
            id: delegationId,
            parentSessionId: params.parentSessionId,
            childSessionId: `pty:${session.id}`,
            agent: params.queueContext?.agent ?? "command-runner",
            status: "running",
            createdAt: Date.now(),
            safetyCeilingMs: params.safetyCeilingMs,
            lastMessageCount: 0,
            stablePollCount: 0,
            executionMode: "pty",
            workingDirectory,
            ptySessionId: session.id,
            queueKey,
          }

          this.registerDelegation(delegation, false)
          this.persistAllDelegations()
          this.schedulePtyExitPoll(delegation.id, session.id)

          return this.buildResult(delegation)
        } catch (error) {
          return this.dispatchHeadlessCommand(params, queueKey, workingDirectory, delegationId, this.describeError(error))
        }
      }

      return this.dispatchHeadlessCommand(
        params,
        queueKey,
        workingDirectory,
        delegationId,
        "[Harness] PTY runtime unavailable in current environment",
      )
    } finally {
      release()
    }
  }

  handleSessionIdle(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) {
      return
    }

    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.executionMode !== "sdk") {
      return
    }

    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      return
    }

    if (delegation.status === "dispatched") {
      delegation.status = "running"
      this.persistAllDelegations()
    }

    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  handleSessionDeleted(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) {
      return
    }

    const delegation = this.delegations.get(delegationId)
    if (!delegation) {
      this.cleanupTracking(delegationId, sessionId)
      return
    }

    delegation.status = "error"
    delegation.error = "Delegated session deleted before completion"
    delegation.completedAt = Date.now()
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, sessionId)
  }

  async recoverPending(): Promise<void> {
    for (const persistedDelegation of readPersistedDelegations()) {
      const delegation = { ...persistedDelegation }
      this.delegations.set(delegation.id, delegation)

      if (delegation.status !== "running" && delegation.status !== "dispatched") {
        continue
      }

      if (delegation.executionMode === "sdk") {
        this.delegationsBySession.set(delegation.childSessionId, delegation.id)
        await this.recoverSdkDelegation(delegation)
        continue
      }

      if (delegation.executionMode === "pty" && delegation.ptySessionId) {
        this.recoverPtyDelegation(delegation)
        continue
      }

      delegation.status = "error"
      delegation.error = "[Harness] Headless command delegation cannot be recovered after restart"
      delegation.completedAt = Date.now()
      this.persistAllDelegations()
    }
  }

  getStatus(delegationId: string): Delegation | undefined {
    return this.delegations.get(delegationId)
  }

  getAllDelegations(): Delegation[] {
    return Array.from(this.delegations.values())
  }

  private async recoverSdkDelegation(delegation: Delegation): Promise<void> {
    try {
      const statusMap = unwrapData<Record<string, { type?: string }>>(await this.client.session.status())
      const status = statusMap[delegation.childSessionId]
      if (!status?.type) {
        throw new Error("missing")
      }

      if (status.type === "idle") {
        this.handleSessionIdle(delegation.childSessionId)
        return
      }

      this.scheduleSafetyCeiling(delegation)
    } catch {
      delegation.status = "error"
      delegation.error = "Child session not found on recovery"
      delegation.completedAt = Date.now()
      this.persistAllDelegations()
      this.cleanupTracking(delegation.id, delegation.childSessionId)
    }
  }

  private recoverPtyDelegation(delegation: Delegation): void {
    const session = this.resolvePtyManager()?.getSession(delegation.ptySessionId ?? "")
    if (!session) {
      delegation.status = "error"
      delegation.error = "[Harness] PTY session not found on recovery"
      delegation.completedAt = Date.now()
      this.persistAllDelegations()
      return
    }

    if (session.exitCode !== undefined) {
      this.finalizeCommandDelegation(delegation.id, {
        output: this.resolvePtyManager()?.read(session.id, 0).content ?? "",
        exitCode: session.exitCode,
      })
      return
    }

    this.schedulePtyExitPoll(delegation.id, session.id)
  }

  private scheduleStabilityPoll(delegationId: string): void {
    const timer = setTimeout(() => {
      this.stabilityTimers.delete(delegationId)
      void this.performStabilityPoll(delegationId)
    }, STABILITY_POLL_INTERVAL_MS)

    this.stabilityTimers.set(delegationId, timer)
  }

  private async performStabilityPoll(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
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
    this.persistAllDelegations()

    if (delegation.stablePollCount >= STABILITY_THRESHOLD) {
      await this.finalizeSdkDelegation(delegationId)
      return
    }

    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  private async finalizeSdkDelegation(delegationId: string): Promise<void> {
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
      delegation.error = undefined
      delegation.completedAt = Date.now()
    } catch (error) {
      delegation.status = "error"
      delegation.error = error instanceof Error ? error.message : String(error)
      delegation.completedAt = Date.now()
    }

    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  private schedulePtyExitPoll(delegationId: string, sessionId: string): void {
    const timer = setTimeout(() => {
      this.commandPollTimers.delete(delegationId)
      const ptyManager = this.resolvePtyManager()
      const session = ptyManager?.getSession(sessionId)
      if (!session) {
        this.finalizeCommandDelegation(delegationId, {
          error: "[Harness] PTY session disappeared before completion",
        })
        return
      }

      if (session.exitCode === undefined) {
        this.schedulePtyExitPoll(delegationId, sessionId)
        return
      }

      this.finalizeCommandDelegation(delegationId, {
        output: ptyManager?.read(sessionId, 0).content ?? "",
        exitCode: session.exitCode,
      })
    }, COMMAND_POLL_INTERVAL_MS)

    this.commandPollTimers.set(delegationId, timer)
  }

  private finalizeCommandDelegation(
    delegationId: string,
    outcome: { output?: string; exitCode?: number; error?: string },
  ): void {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    delegation.completedAt = Date.now()
    delegation.result = outcome.output

    if (outcome.error) {
      delegation.status = "error"
      delegation.error = outcome.error
    } else if ((outcome.exitCode ?? 0) === 0) {
      delegation.status = "completed"
      delegation.error = undefined
    } else {
      delegation.status = "error"
      delegation.error = `[Harness] Command exited with code ${outcome.exitCode}`
    }

    if (delegation.executionMode === "headless") {
      this.headlessCommands.delete(delegation.id)
    }

    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  private async dispatchHeadlessCommand(
    params: CommandDelegationParams,
    queueKey: string,
    workingDirectory: string,
    delegationId: string,
    fallbackReason: string,
  ): Promise<DelegationResult> {
    const child = spawnHeadlessProcess(params.command, params.args ?? [], {
      cwd: workingDirectory,
      env: { ...process.env, ...this.buildMinimalEnv(params.env) },
      stdio: ["pipe", "pipe", "pipe"],
    })

    const delegation: Delegation = {
      id: delegationId,
      parentSessionId: params.parentSessionId,
      childSessionId: `headless:${delegationId}`,
      agent: params.queueContext?.agent ?? "command-runner",
      status: "running",
      createdAt: Date.now(),
      safetyCeilingMs: params.safetyCeilingMs,
      lastMessageCount: 0,
      stablePollCount: 0,
      executionMode: "headless",
      workingDirectory,
      fallbackReason,
      queueKey,
    }

    const state: HeadlessCommandState = { process: child, output: "" }
    child.stdout.on("data", (chunk: Buffer | string) => {
      state.output += chunk.toString()
    })
    child.stderr.on("data", (chunk: Buffer | string) => {
      state.output += chunk.toString()
    })
    child.on("error", (error) => {
      this.finalizeCommandDelegation(delegation.id, { output: state.output, error: this.describeError(error) })
    })
    child.on("exit", (exitCode) => {
      this.finalizeCommandDelegation(delegation.id, { output: state.output, exitCode: exitCode ?? 0 })
    })

    this.headlessCommands.set(delegation.id, state)
    this.registerDelegation(delegation, false)
    this.persistAllDelegations()
    return this.buildResult(delegation)
  }

  private registerDelegation(delegation: Delegation, scheduleSafetyCeiling: boolean): void {
    this.delegations.set(delegation.id, { ...delegation })
    this.delegationsBySession.set(delegation.childSessionId, delegation.id)
    if (scheduleSafetyCeiling) {
      this.scheduleSafetyCeiling(delegation)
    }
  }

  private persistAllDelegations(): void {
    persistDelegations(Array.from(this.delegations.values()))
  }

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
      // no-op: session may already be gone
    }

    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

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

    const commandPollTimer = this.commandPollTimers.get(delegationId)
    if (commandPollTimer) {
      clearTimeout(commandPollTimer)
      this.commandPollTimers.delete(delegationId)
    }
  }

  private cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearAllTimers(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  private async validateAgent(agent: string): Promise<ValidatedAgent> {
    const agents = unwrapData<Array<Record<string, unknown>>>(await this.client.app.agents())
    const validAgents = (agents ?? []).map((entry) => ({
      name: typeof entry.name === "string" ? entry.name : "",
      provider: typeof entry.provider === "string" ? entry.provider : undefined,
      model: typeof entry.model === "string" ? entry.model : undefined,
      category: typeof entry.category === "string" ? entry.category : undefined,
    })).filter((entry) => entry.name.length > 0)
    const names = validAgents.map((entry) => entry.name)

    if (!names.includes(agent)) {
      throw new Error(`[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`)
    }

    return validAgents.find((entry) => entry.name === agent) ?? { name: agent }
  }

  private buildResult(delegation: Delegation): DelegationResult {
    return {
      status: delegation.status,
      delegationId: delegation.id,
      executionMode: delegation.executionMode,
      workingDirectory: delegation.workingDirectory,
      ptySessionId: delegation.ptySessionId,
      fallbackReason: delegation.fallbackReason,
      queueKey: delegation.queueKey,
    }
  }

  private buildCanonicalQueueContext(agent: ValidatedAgent, params: DelegateParams): CanonicalQueueContext {
    return {
      provider: params.provider ?? agent.provider,
      model: params.model ?? agent.model,
      agent: agent.name,
      category: params.category ?? agent.category,
    }
  }

  private buildCommandQueueContext(params: CommandDelegationParams): CanonicalQueueContext {
    return {
      provider: params.queueContext?.provider,
      model: params.queueContext?.model,
      agent: params.queueContext?.agent,
      category: params.queueContext?.category ?? "command",
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
      executionMode: "sdk",
      safetyCeilingMs: args.params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
      permissionProfile: {
        mode: "write-capable",
        tools: ["read", "edit", "write", "bash", "glob", "grep"],
      },
    }
  }

  private resolvePtyManager(): PtyManager | null {
    const candidate = this.options.ptyManager ?? null
    if (!candidate) {
      return null
    }

    if (typeof candidate.isSupported === "function" && !candidate.isSupported()) {
      return null
    }

    return candidate
  }

  private buildMinimalEnv(extraEnv?: Record<string, string>): Record<string, string> {
    const allowedKeys = ["PATH", "HOME", "TERM", "LANG", "PWD"]
    const base = Object.fromEntries(
      allowedKeys
        .map((key) => [key, process.env[key]])
        .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    )

    return {
      ...base,
      ...(extraEnv ?? {}),
    }
  }

  private extractAssistantText(messages: MessageLike[]): string {
    return messages
      .filter((message) => message.role === "assistant" || message.info?.role === "assistant")
      .flatMap((message) => message.parts ?? [])
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join("\n")
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }
}

export type { Delegation, DelegationResult }
