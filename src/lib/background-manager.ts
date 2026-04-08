import { spawn as nodeSpawn } from "node:child_process"
import type { ChildProcess } from "node:child_process"
import { DEFAULT_ALLOWED_COMMANDS } from "./execution-mode.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BackgroundManagerOptions {
  /**
   * Commands allowed for owned-process execution.
   * Defaults to {@link DEFAULT_ALLOWED_COMMANDS} from execution-mode.ts
   * when omitted.
   */
  allowedCommands?: readonly string[]
  /**
   * Working directories allowed for spawned processes.
   * When omitted, only `process.cwd()` is allowed.
   */
  allowedCwdPrefixes?: readonly string[]
}

export interface BackgroundAgentConfig {
  /** Executable to run (e.g. "node"). */
  readonly command: string
  /** Arguments passed to the command. */
  readonly args: string[]
  /** Working directory for the spawned process. */
  readonly cwd: string
  /** Additional environment variables merged over process.env. */
  readonly env?: Record<string, string>
  /**
   * Auto-kill timeout in milliseconds.
   * When elapsed and the task is still running, the process receives SIGTERM.
   * Default: 300000 (5 minutes).
   */
  readonly timeout?: number
  /** ID of the parent session that initiated this background task. */
  readonly parentSessionID: string
}

export interface BackgroundTask {
  readonly id: string
  status: "running" | "completed" | "failed" | "killed"
  readonly pid: number
  readonly startedAt: number
  readonly parentSessionID: string
  stdout: string
  stderr: string
  exitCode: number | null
  error: string | null
}

export interface BackgroundResult {
  exitCode: number | null
  stdout: string
  stderr: string
  status: "completed" | "failed" | "killed"
}

// ---------------------------------------------------------------------------
// Internal stored record (extends BackgroundTask with the live process handle)
// ---------------------------------------------------------------------------

type TaskRecord = BackgroundTask & { readonly process: ChildProcess }

// ---------------------------------------------------------------------------
// BackgroundManager
// ---------------------------------------------------------------------------

/**
 * Manages background child-process tasks spawned on behalf of parent sessions.
 *
 * Each spawned command is tracked by a unique string ID.  Output is captured
 * into a ring buffer (last N bytes) to guard against memory exhaustion from
 * long-running processes.
 *
 * Hardened per architecture audit (threat T-02-05):
 *  - Command allowlist enforced before spawn
 *  - CWD constrained to project root / workspace allowlist
 *  - Failure context persisted before cleanup so parent status queries remain
 *    meaningful (threat T-02-07)
 */
export class BackgroundManager {
  private readonly tasks = new Map<string, TaskRecord>()
  private readonly completionCallbacks = new Map<
    string,
    (result: BackgroundResult) => void
  >()
  private readonly maxOutputBytes: number
  private readonly allowedCommands: readonly string[]
  private readonly allowedCwdPrefixes: readonly string[]
  private taskCounter = 0

  /**
   * @param maxOutputBytes - Ring buffer capacity per-stream per-task.
   *   Defaults to 10 240 bytes (10 KB).
   * @param options - Security hardening options (allowlist, cwd constraints).
   */
  constructor(maxOutputBytes = 10240, options?: BackgroundManagerOptions) {
    this.maxOutputBytes = maxOutputBytes
    this.allowedCommands = options?.allowedCommands ?? DEFAULT_ALLOWED_COMMANDS
    this.allowedCwdPrefixes = options?.allowedCwdPrefixes ?? [process.cwd()]
  }

  // -------------------------------------------------------------------------
  // spawn
  // -------------------------------------------------------------------------

  /**
   * Spawn a background command and begin capturing its output.
   *
   * Validates command and cwd before spawning (threat T-02-05).
   *
   * @returns A **snapshot** of the task at the moment of spawn.  Query
   *   {@link getTask} for live output and status.
   * @throws `[Harness]`-prefixed error for disallowed commands or out-of-root cwd.
   */
  spawn(config: BackgroundAgentConfig): BackgroundTask {
    // Threat T-02-05: Enforce command allowlist
    if (!this.allowedCommands.includes(config.command)) {
      throw new Error(
        `[Harness] Command "${config.command}" is not in the allowed list: ${this.allowedCommands.join(", ")}.`,
      )
    }

    // Threat T-02-05: Enforce cwd constraint
    const cwdAllowed = this.allowedCwdPrefixes.some(
      (prefix) => config.cwd === prefix || config.cwd.startsWith(prefix + "/"),
    )
    if (!cwdAllowed) {
      throw new Error(
        `[Harness] Working directory "${config.cwd}" is outside the allowed project root(s).`,
      )
    }

    const id = `bg_${++this.taskCounter}_${Date.now()}`

    const proc = nodeSpawn(config.command, config.args, {
      cwd: config.cwd,
      env: { ...process.env, ...config.env },
      stdio: ["ignore", "pipe", "pipe"],
    })

    const record: TaskRecord = {
      id,
      status: "running",
      pid: proc.pid ?? 0,
      startedAt: Date.now(),
      parentSessionID: config.parentSessionID,
      stdout: "",
      stderr: "",
      exitCode: null,
      error: null,
      process: proc,
    }

    this.tasks.set(id, record)
    this.attachStreamHandlers(record)
    this.attachExitHandlers(record)

    const timeoutMs = config.timeout ?? 300000
    const timeoutHandle = setTimeout(() => {
      if (record.status === "running") {
        this.kill(id)
      }
    }, timeoutMs)

    // Do not let the timeout timer keep the Node.js event loop alive
    if (typeof timeoutHandle === "object" && "unref" in timeoutHandle) {
      timeoutHandle.unref()
    }

    // Return an immutable snapshot (does NOT include the ChildProcess handle)
    return this.snapshot(record)
  }

  // -------------------------------------------------------------------------
  // getTask / listTasks
  // -------------------------------------------------------------------------

  /**
   * Return the current state of a task, or `undefined` when the ID is unknown.
   */
  getTask(taskID: string): BackgroundTask | undefined {
    const record = this.tasks.get(taskID)
    return record === undefined ? undefined : this.snapshot(record)
  }

  /**
   * Return a snapshot of every tracked task (running + terminal).
   */
  listTasks(parentSessionID?: string): BackgroundTask[] {
    return [...this.tasks.values()]
      .filter(
        (record) =>
          parentSessionID === undefined ||
          record.parentSessionID === parentSessionID,
      )
      .map((record) => this.snapshot(record))
  }

  // -------------------------------------------------------------------------
  // kill
  // -------------------------------------------------------------------------

  /**
   * Send SIGTERM to the running process and mark the task as killed.
   *
   * A SIGKILL is scheduled 5 seconds later as a safety net, in case the
   * process ignores SIGTERM.  Both signals are silently swallowed when the
   * process has already exited.
   *
   * Calling `kill()` on a non-running task is a no-op.
   */
  kill(taskID: string): void {
    const record = this.tasks.get(taskID)
    if (record === undefined || record.status !== "running") {
      return
    }

    record.status = "killed"

    try {
      record.process.kill("SIGTERM")
    } catch {
      // Process already dead — nothing to do
    }

    const forceKillHandle = setTimeout(() => {
      try {
        record.process.kill("SIGKILL")
      } catch {
        // Already dead
      }
    }, 5000)

    if (typeof forceKillHandle === "object" && "unref" in forceKillHandle) {
      forceKillHandle.unref()
    }
  }

  // -------------------------------------------------------------------------
  // onComplete
  // -------------------------------------------------------------------------

  /**
   * Return a promise that resolves when the task reaches a terminal state.
   *
   * If the task has already finished, the promise resolves immediately.
   *
   * @throws `[Harness] Unknown task ID` when `taskID` is not tracked.
   */
  onComplete(taskID: string): Promise<BackgroundResult> {
    const record = this.tasks.get(taskID)

    if (record === undefined) {
      return Promise.reject(new Error("[Harness] Unknown task ID"))
    }

    if (record.status !== "running") {
      return Promise.resolve(this.toResult(record))
    }

    return new Promise<BackgroundResult>((resolve) => {
      this.completionCallbacks.set(taskID, resolve)
    })
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private attachStreamHandlers(record: TaskRecord): void {
    record.process.stdout?.on("data", (chunk: Buffer) => {
      record.stdout += chunk.toString()
      if (record.stdout.length > this.maxOutputBytes) {
        record.stdout = record.stdout.slice(-this.maxOutputBytes)
      }
    })

    record.process.stderr?.on("data", (chunk: Buffer) => {
      record.stderr += chunk.toString()
      if (record.stderr.length > this.maxOutputBytes) {
        record.stderr = record.stderr.slice(-this.maxOutputBytes)
      }
    })
  }

  private attachExitHandlers(record: TaskRecord): void {
    record.process.on("close", (code: number | null) => {
      // Only update status when we haven't already set it (e.g. via kill())
      if (record.status === "running") {
        record.exitCode = code
        if (code === 0) {
          record.status = "completed"
        } else {
          record.status = "failed"
          record.error = `[Harness] Process exited with code ${String(code)}`
        }
      } else {
        // Killed: still capture exit code for diagnostics
        record.exitCode = code
      }

      this.resolveCompletion(record)
    })

    record.process.on("error", (err: Error) => {
      if (record.status === "running") {
        record.status = "failed"
        record.error = `[Harness] ${err.message}`
      }

      this.resolveCompletion(record)
    })
  }

  private resolveCompletion(record: TaskRecord): void {
    const cb = this.completionCallbacks.get(record.id)
    if (cb !== undefined) {
      this.completionCallbacks.delete(record.id)
      cb(this.toResult(record))
    }
  }

  private toResult(record: TaskRecord): BackgroundResult {
    // Status is narrowed: running is not a terminal status
    const status =
      record.status === "running" ? "failed" : record.status
    return {
      exitCode: record.exitCode,
      stdout: record.stdout,
      stderr: record.stderr,
      status,
    }
  }

  private snapshot(record: TaskRecord): BackgroundTask {
    return {
      id: record.id,
      status: record.status,
      pid: record.pid,
      startedAt: record.startedAt,
      parentSessionID: record.parentSessionID,
      stdout: record.stdout,
      stderr: record.stderr,
      exitCode: record.exitCode,
      error: record.error,
    }
  }
}
