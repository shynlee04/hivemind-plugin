import { DelegationConcurrencyQueue } from "./concurrency.js"
import type { BackgroundManager } from "./background-manager.js"
import { CompletionDetector } from "./completion-detector.js"
import type { CheckpointData } from "./compaction-checkpoint.js"
import { getSessionContinuity, getSessionRecoveryState, listSessionContinuity, patchSessionContinuity } from "./continuity.js"
import { restoreCheckpoint } from "./compaction-checkpoint.js"
import type { OpenCodeClient } from "./session-api.js"
import { sendPrompt } from "./session-api.js"
import { hydrateDelegationState, taskState } from "./state.js"
import { isValidLifecycleTransition } from "./lifecycle-state.js"
import { patchLifecycle } from "./lifecycle-patching.js"
import { handleEvent as handleLifecycleEvent, noteObservedActivity as noteActivity } from "./lifecycle-events.js"
import { launchDelegatedSession, type LaunchDelegatedSessionArgs } from "./lifecycle-dispatcher.js"
import type {
  RuntimePolicy,
  SessionLifecyclePhase,
  SessionLifecycleState,
} from "./types.js"

export type { LaunchDelegatedSessionArgs } from "./lifecycle-dispatcher.js"

type HarnessLifecycleManagerOptions = {
  client: OpenCodeClient
  pollTimeoutMs: number
  runtimePolicy?: RuntimePolicy
  backgroundManager?: BackgroundManager
}

export function isValidTransition(from: SessionLifecyclePhase, to: SessionLifecyclePhase): boolean {
  return isValidLifecycleTransition(from, to)
}

export class HarnessLifecycleManager {
  private readonly concurrencyLimit: number
  private readonly queue: DelegationConcurrencyQueue
  private readonly completionDetector = new CompletionDetector()
  private readonly runtimePolicy: RuntimePolicy | undefined

  constructor(private readonly options: HarnessLifecycleManagerOptions) {
    this.runtimePolicy = options.runtimePolicy
    this.concurrencyLimit = parseInt(process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT ?? "3", 10)
    if (Number.isNaN(this.concurrencyLimit) || this.concurrencyLimit < 1) {
      this.concurrencyLimit = 3
    }
    this.queue = new DelegationConcurrencyQueue(this.concurrencyLimit)
  }

  getConcurrencyLimit(): number {
    return this.concurrencyLimit
  }

  hydrateFromContinuity(): void {
    for (const record of listSessionContinuity()) {
      hydrateDelegationState(record.sessionID, record.metadata.delegation)
      if (record.metadata.compactionCheckpoint) {
        restoreCheckpoint(record.sessionID, record.metadata.compactionCheckpoint, taskState)
      }
    }
  }

  getRecoveryState(sessionID: string): ReturnType<typeof getSessionRecoveryState> {
    return getSessionRecoveryState(sessionID)
  }

  getLifecycleSnapshot(sessionID: string): SessionLifecycleState | undefined {
    return getSessionContinuity(sessionID)?.metadata.lifecycle
  }

  noteObservedActivity(sessionID: string, source: string): void {
    noteActivity(sessionID, source)
  }

  handleEvent(args: { event: unknown; eventType: string; sessionID: string }): void {
    handleLifecycleEvent({
      ...args,
      completionDetector: this.completionDetector,
    })
  }

  async cancelDelegatedSession(sessionID: string): Promise<void> {
    try {
      if (this.options.client?.session?.abort) {
        await this.options.client.session.abort({ path: { id: sessionID } })
      }
    } catch {
      return this.cancelLifecycle(sessionID)
    }

    this.cancelLifecycle(sessionID)
  }

  async requestAutoLoopRetry(args: { sessionID: string; promptText: string }): Promise<void> {
    await sendPrompt(this.options.client, args.sessionID, {
      parts: [{ type: "text", text: args.promptText }],
    })
  }

  recordCompactionCheckpoint(sessionID: string, checkpoint: CheckpointData): void {
    patchSessionContinuity(sessionID, { compactionCheckpoint: checkpoint })
    taskState.resetStats(sessionID)
  }

  async launchDelegatedSession(args: LaunchDelegatedSessionArgs): Promise<string> {
    return launchDelegatedSession(args, {
      client: this.options.client,
      queue: this.queue,
      completionDetector: this.completionDetector,
      pollTimeoutMs: this.options.pollTimeoutMs,
      runtimePolicy: this.runtimePolicy,
      backgroundManager: this.options.backgroundManager,
      patchLifecycleFn: (patchArgs) => this.privatePatchLifecycle(patchArgs),
      getLifecycleSnapshotFn: (sessionID) => this.getLifecycleSnapshot(sessionID),
    })
  }

  private cancelLifecycle(sessionID: string): void {
    this.completionDetector.cancel(sessionID)
    this.privatePatchLifecycle({
      sessionID,
      status: "error",
      phase: "failed",
      error: "Session cancelled by user",
      observation: {
        source: "cancel",
        observedAt: Date.now(),
        detail: "session-cancelled",
      },
    })
  }

  private privatePatchLifecycle(args: Parameters<typeof patchLifecycle>[0]): boolean {
    return patchLifecycle(args)
  }
}

export function createHarnessLifecycleManager(
  options: HarnessLifecycleManagerOptions,
): HarnessLifecycleManager {
  return new HarnessLifecycleManager(options)
}
