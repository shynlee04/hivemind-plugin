/**
 * Harness lifecycle manager — minimal stub.
 *
 * Stripped to compile after 09-13 module deletion.
 * Plan 14-02 (DelegationManager) will replace this with a full implementation.
 */
import { CompletionDetector } from "./completion-detector.js"
import { getSessionContinuity, listSessionContinuity, patchSessionContinuity } from "./continuity.js"
import type { OpenCodeClient } from "./session-api.js"
import { hydrateDelegationState, taskState } from "./state.js"
import type {
  CheckpointData,
  RuntimePolicy,
  SessionLifecyclePhase,
  SessionLifecycleState,
} from "./types.js"

type HarnessLifecycleManagerOptions = {
  client: OpenCodeClient
  pollTimeoutMs: number
  runtimePolicy?: RuntimePolicy
  backgroundManager?: unknown
}

export type LaunchDelegatedSessionArgs = {
  sessionID: string
  description: string
  agent: string
  category?: string
  model?: string
  constraints?: string[]
  promptText: string
  parentSessionID?: string
  [key: string]: unknown
}

export function isValidTransition(_from: SessionLifecyclePhase, _to: SessionLifecyclePhase): boolean {
  // Minimal stub — always allow transitions during clean slate.
  // Full validation restored in Plan 14-02.
  return true
}

export class HarnessLifecycleManager {
  private readonly concurrencyLimit: number
  private readonly completionDetector = new CompletionDetector()
  private readonly client: OpenCodeClient

  constructor(options: HarnessLifecycleManagerOptions) {
    this.client = options.client
    this.concurrencyLimit = parseInt(process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT ?? "3", 10)
    if (Number.isNaN(this.concurrencyLimit) || this.concurrencyLimit < 1) {
      this.concurrencyLimit = 3
    }
  }

  getConcurrencyLimit(): number {
    return this.concurrencyLimit
  }

  hydrateFromContinuity(): void {
    for (const record of listSessionContinuity()) {
      if (record.metadata.delegation) {
        hydrateDelegationState(record.sessionID, record.metadata.delegation)
      }
    }
  }

  getLifecycleSnapshot(sessionID: string): SessionLifecycleState | undefined {
    return getSessionContinuity(sessionID)?.metadata.lifecycle
  }

  noteObservedActivity(_sessionID: string, _source: string): void {
    // No-op stub — full implementation in Plan 14-02
  }

  handleEvent(args: { event: unknown; eventType: string; sessionID: string }): void {
    const { eventType, sessionID } = args
    // Minimal event routing: feed completion detector for idle detection
    const statusSignal = typeof (args.event as Record<string, unknown>)?.properties === "object"
      ? (((args.event as { properties?: { status?: { type?: string } } }).properties?.status?.type) ?? "")
      : ""

    if (statusSignal === "idle" || eventType === "session.idle") {
      this.completionDetector.feed(sessionID, "idle")
    }
  }

  async cancelDelegatedSession(sessionID: string): Promise<void> {
    try {
      if (this.client?.session?.abort) {
        await this.client.session.abort({ path: { id: sessionID } })
      }
    } catch {
      // Abort best-effort
    }

    this.completionDetector.cancel(sessionID)
    patchSessionContinuity(sessionID, {
      lifecycle: {
        phase: "failed",
        error: "Session cancelled by user",
      },
    })
  }

  async requestAutoLoopRetry(args: { sessionID: string; promptText: string }): Promise<void> {
    // Minimal: send prompt to session
    const { client } = this
    await client.session.prompt({
      path: { id: args.sessionID },
      body: {
        parts: [{ type: "text", text: args.promptText }],
      },
    })
  }

  recordCompactionCheckpoint(sessionID: string, checkpoint: CheckpointData): void {
    patchSessionContinuity(sessionID, { compactionCheckpoint: checkpoint })
    taskState.resetStats(sessionID)
  }

  async launchDelegatedSession(_args: LaunchDelegatedSessionArgs): Promise<string> {
    throw new Error("[Harness] launchDelegatedSession not yet restored — see Plan 14-02 (DelegationManager)")
  }

  getCompletionDetector(): CompletionDetector {
    return this.completionDetector
  }
}

export function createHarnessLifecycleManager(
  options: HarnessLifecycleManagerOptions,
): HarnessLifecycleManager {
  return new HarnessLifecycleManager(options)
}
