import { spawn as spawnHeadlessProcess, type ChildProcessWithoutNullStreams } from "node:child_process"

import { describeError } from "../../shared/helpers.js"
import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
import type { CommandDelegationParams, Delegation, DelegationResult, DelegationTerminalKind } from "../../shared/types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HeadlessCommandState = {
  process: ChildProcessWithoutNullStreams
  output: string
  truncated: boolean
}

type CommandDelegationCallbacks = {
  getDelegation: (id: string) => Delegation | undefined
  registerDelegation: (delegation: Delegation, scheduleSafety: boolean) => void
  persistAllDelegations: () => void
  buildResult: (delegation: Delegation) => DelegationResult
  cleanupTracking: (delegationId: string, childSessionId: string) => void
  onTerminal: (
    delegationId: string,
    newState: "completed" | "error" | "timeout",
    error?: string,
    terminalDetail?: {
      terminalKind?: DelegationTerminalKind
      terminationSignal?: string
      explicitCancellation?: boolean
    },
  ) => void
}

const COMMAND_POLL_INTERVAL_MS = 250
const MAX_HEADLESS_OUTPUT_CHARS = 64_000

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
    nestingDepth: number,
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
          lastMessageCount: 0,
          stablePollCount: 0,
          nestingDepth,
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
          params, queueKey, workingDirectory, delegationId, nestingDepth, describeError(error),
        )
      }
    }

    return this.dispatchHeadlessCommand(
      params, queueKey, workingDirectory, delegationId, nestingDepth,
      "[Harness] PTY runtime unavailable in current environment",
    )
  }

  /**
   * Recover a PTY delegation that was running before restart.
   *
   * PTY OS processes cannot survive a harness restart — the underlying
   * `bun-pty` process tree dies with the parent. When recovery cannot
   * find the prior session (because the runtime has no PTY manager, or
   * the manager has no record of this `ptySessionId`), surface a truthful
   * `terminalKind: "non-resumable-after-restart"` rather than the
   * historical "session not found" string. Observers can then distinguish
   * "we crashed" from "this kind of process is just not resumable".
   *
   * @see Phase 16.2.1 — R-PTY-03-AMENDED
   */
  recoverPtyDelegation(delegation: Delegation): void {
    const session = this.resolvePtyManager()?.getSession(delegation.ptySessionId ?? "")
    if (!session) {
      this.callbacks.onTerminal(
        delegation.id,
        "error",
        "[Harness] PTY delegation is non-resumable-after-restart: PTY OS processes do not survive harness restarts",
        { terminalKind: "non-resumable-after-restart" },
      )
      return
    }

    if (session.exitCode !== undefined) {
      this.finalizeCommandDelegation(delegation.id, {
        output: this.readPtyOutput(this.resolvePtyManager(), session.id),
        exitCode: session.exitCode,
        signal: session.exitSignal,
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
    nestingDepth: number,
    fallbackReason: string,
  ): Promise<DelegationResult> {
    const child = spawnHeadlessProcess(params.command, params.args ?? [], {
      cwd: workingDirectory,
      env: this.buildMinimalEnv(params.env),
      stdio: ["pipe", "pipe", "pipe"],
    })

    const delegation: Delegation = {
      id: delegationId,
      parentSessionId: params.parentSessionId,
      childSessionId: `headless:${delegationId}`,
      agent: params.queueContext?.agent ?? "command-runner",
      status: "running",
      createdAt: Date.now(),
      lastMessageCount: 0,
      stablePollCount: 0,
      nestingDepth,
      executionMode: "headless",
      workingDirectory,
      fallbackReason,
      queueKey,
    }

    const state: HeadlessCommandState = { process: child, output: "", truncated: false }
    child.stdout.on("data", (chunk: Buffer | string) => {
      appendHeadlessOutput(state, chunk.toString())
    })
    child.stderr.on("data", (chunk: Buffer | string) => {
      appendHeadlessOutput(state, chunk.toString())
    })
    child.on("error", (error) => {
      this.finalizeCommandDelegation(delegation.id, { output: renderHeadlessOutput(state), error: describeError(error) })
    })
    child.on("exit", (exitCode, signal) => {
      this.finalizeCommandDelegation(delegation.id, {
        output: renderHeadlessOutput(state),
        exitCode: exitCode ?? 0,
        signal: signal ?? undefined,
      })
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
        const delegation = this.callbacks.getDelegation(delegationId)
        const cancellationRecorded = delegation?.explicitCancellation === true || delegation?.terminalKind === "cancelled"
        this.finalizeCommandDelegation(delegationId, {
          error: cancellationRecorded
            ? "[Harness] Command cancelled by user"
            : "[Harness] PTY session disappeared before completion",
        })
        return
      }

      if (session.exitCode === undefined) {
        if (session.exitSignal) {
          this.finalizeCommandDelegation(delegationId, {
            output: this.readPtyOutput(ptyManager, sessionId),
            signal: session.exitSignal,
          })
          return
        }
        this.schedulePtyExitPoll(delegationId, sessionId)
        return
      }

      this.finalizeCommandDelegation(delegationId, {
        output: this.readPtyOutput(ptyManager, sessionId),
        exitCode: session.exitCode,
        signal: session.exitSignal,
      })
    }, COMMAND_POLL_INTERVAL_MS)

    this.commandPollTimers.set(delegationId, timer)
  }

  private finalizeCommandDelegation(
    delegationId: string,
    outcome: { output?: string; exitCode?: number; error?: string; signal?: string },
  ): void {
    const delegation = this.callbacks.getDelegation(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    delegation.result = outcome.output
    delegation.resultTruncated = outcome.output?.startsWith("[Harness] Headless output truncated") ?? false
    const explicitCancellation = delegation.explicitCancellation ?? false

    if (outcome.error) {
      const terminalKind: DelegationTerminalKind = explicitCancellation
        ? "cancelled"
        : outcome.signal
          ? "interrupted-by-signal"
          : "error"
      this.callbacks.onTerminal(
        delegationId,
        "error",
        outcome.error,
        {
          terminalKind,
          terminationSignal: outcome.signal,
          explicitCancellation,
        },
      )
      if (delegation.executionMode === "headless") {
        this.headlessCommands.delete(delegation.id)
      }
      return
    }

    if (explicitCancellation) {
      this.callbacks.onTerminal(
        delegationId,
        "error",
        outcome.signal
          ? `[Harness] Command cancelled by user (${outcome.signal})`
          : "[Harness] Command cancelled by user",
        {
          terminalKind: "cancelled",
          terminationSignal: outcome.signal,
          explicitCancellation: true,
        },
      )
    } else if (outcome.signal) {
      this.callbacks.onTerminal(
        delegationId,
        "error",
        `[Harness] Command interrupted by signal ${outcome.signal}`,
        {
          terminalKind: "interrupted-by-signal",
          terminationSignal: outcome.signal,
          explicitCancellation: false,
        },
      )
    } else if ((outcome.exitCode ?? 0) === 0) {
      this.callbacks.onTerminal(delegationId, "completed", undefined, {
        terminalKind: "completed",
        explicitCancellation: false,
      })
    } else {
      this.callbacks.onTerminal(
        delegationId,
        "error",
        `[Harness] Command exited with code ${outcome.exitCode}`,
        {
          terminalKind: "error",
          explicitCancellation: false,
        },
      )
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

  private readPtyOutput(ptyManager: PtyManager | null | undefined, sessionId: string): string {
    if (!ptyManager || typeof ptyManager.read !== "function") {
      return ""
    }

    return ptyManager.read(sessionId, 0).content
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

/**
 * Append process output while bounding retained memory.
 *
 * @param state - Mutable headless command tracking state.
 * @param chunk - New stdout/stderr text.
 */
function appendHeadlessOutput(state: HeadlessCommandState, chunk: string): void {
  state.output += chunk
  if (state.output.length <= MAX_HEADLESS_OUTPUT_CHARS) {
    return
  }
  state.truncated = true
  state.output = state.output.slice(state.output.length - MAX_HEADLESS_OUTPUT_CHARS)
}

/**
 * Render bounded headless output with visible truncation metadata.
 *
 * @param state - Headless command tracking state.
 * @returns Output string safe to persist in delegation records.
 */
function renderHeadlessOutput(state: HeadlessCommandState): string {
  if (!state.truncated) {
    return state.output
  }
  return `[Harness] Headless output truncated to last ${MAX_HEADLESS_OUTPUT_CHARS} characters.\n${state.output}`
}
