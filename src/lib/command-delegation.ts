import { spawn as spawnHeadlessProcess, type ChildProcessWithoutNullStreams } from "node:child_process"

import { describeError } from "./helpers.js"
import type { PtyManager } from "./pty/pty-manager.js"
import type { CommandDelegationParams, Delegation, DelegationResult } from "./types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HeadlessCommandState = {
  process: ChildProcessWithoutNullStreams
  output: string
}

type CommandDelegationCallbacks = {
  getDelegation: (id: string) => Delegation | undefined
  registerDelegation: (delegation: Delegation, scheduleSafety: boolean) => void
  persistAllDelegations: () => void
  buildResult: (delegation: Delegation) => DelegationResult
  cleanupTracking: (delegationId: string, childSessionId: string) => void
  onTerminal: (delegationId: string, newState: "completed" | "error" | "timeout", error?: string) => void
}

const COMMAND_POLL_INTERVAL_MS = 250

// ---------------------------------------------------------------------------
// CommandDelegationHandler
// ---------------------------------------------------------------------------

/**
 * Manages PTY and headless command delegation lifecycle.
 *
 * Owned state: command poll timers, headless process tracking.
 * Delegates registration, persistence, and cleanup to DelegationManager via callbacks.
 */
export class CommandDelegationHandler {
  private readonly commandPollTimers = new Map<string, NodeJS.Timeout>()
  private readonly headlessCommands = new Map<string, HeadlessCommandState>()
  private readonly ptyManager: PtyManager | null

  constructor(
    ptyManager: PtyManager | null,
    private readonly callbacks: CommandDelegationCallbacks,
  ) {
    this.ptyManager = ptyManager
  }

  // -------------------------------------------------------------------------
  // Public API (called by DelegationManager)
  // -------------------------------------------------------------------------

  /** Dispatch a command via PTY (preferred) or headless fallback. Caller handles concurrency. */
  async dispatchCommand(
    params: CommandDelegationParams,
    queueKey: string,
  ): Promise<DelegationResult> {
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
          nestingDepth: 1,
          executionMode: "pty",
          workingDirectory,
          ptySessionId: session.id,
          queueKey,
        }

        this.callbacks.registerDelegation(delegation, false)
        this.callbacks.persistAllDelegations()
        this.schedulePtyExitPoll(delegation.id, session.id)

        return this.callbacks.buildResult(delegation)
      } catch (error) {
        return this.dispatchHeadlessCommand(
          params, queueKey, workingDirectory, delegationId, describeError(error),
        )
      }
    }

    return this.dispatchHeadlessCommand(
      params, queueKey, workingDirectory, delegationId,
      "[Harness] PTY runtime unavailable in current environment",
    )
  }

  /** Recover a PTY delegation that was running before restart. */
  recoverPtyDelegation(delegation: Delegation): void {
    const session = this.resolvePtyManager()?.getSession(delegation.ptySessionId ?? "")
    if (!session) {
      delegation.status = "error"
      delegation.error = "[Harness] PTY session not found on recovery"
      delegation.completedAt = Date.now()
      this.callbacks.persistAllDelegations()
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

  /** Clear poll timers for a given delegation. */
  clearTimers(delegationId: string): void {
    const timer = this.commandPollTimers.get(delegationId)
    if (timer) {
      clearTimeout(timer)
      this.commandPollTimers.delete(delegationId)
    }
  }

  // -------------------------------------------------------------------------
  // Private — dispatch helpers
  // -------------------------------------------------------------------------

  private dispatchHeadlessCommand(
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
      nestingDepth: 1,
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
      this.finalizeCommandDelegation(delegation.id, { output: state.output, error: describeError(error) })
    })
    child.on("exit", (exitCode) => {
      this.finalizeCommandDelegation(delegation.id, { output: state.output, exitCode: exitCode ?? 0 })
    })

    this.headlessCommands.set(delegation.id, state)
    this.callbacks.registerDelegation(delegation, false)
    this.callbacks.persistAllDelegations()
    return Promise.resolve(this.callbacks.buildResult(delegation))
  }

  // -------------------------------------------------------------------------
  // Private — PTY polling
  // -------------------------------------------------------------------------

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
    const delegation = this.callbacks.getDelegation(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    delegation.result = outcome.output

    if (outcome.error) {
      this.callbacks.onTerminal(delegationId, "error", outcome.error)
    } else if ((outcome.exitCode ?? 0) === 0) {
      this.callbacks.onTerminal(delegationId, "completed")
    } else {
      this.callbacks.onTerminal(delegationId, "error", `[Harness] Command exited with code ${outcome.exitCode}`)
    }

    if (delegation.executionMode === "headless") {
      this.headlessCommands.delete(delegation.id)
    }
  }

  // -------------------------------------------------------------------------
  // Private — environment helpers
  // -------------------------------------------------------------------------

  private resolvePtyManager(): PtyManager | null {
    if (!this.ptyManager) {
      return null
    }

    if (typeof this.ptyManager.isSupported === "function" && !this.ptyManager.isSupported()) {
      return null
    }

    return this.ptyManager
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
}
