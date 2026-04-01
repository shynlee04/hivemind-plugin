import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import {
  deleteSessionContinuity,
  getSessionContinuity,
  listSessionContinuity,
  patchSessionContinuity,
  recordSessionContinuity,
} from "./continuity.js"
import { addWarning } from "./state.js"
import { inferContinuityStatusFromEvent } from "./runtime.js"
import {
  createSessionByAnyPath,
  getEventParentID,
  getSessionID,
  promptSessionAsyncByAnyPath,
  promptSessionByAnyPath,
  waitForAssistantText,
  waitForSessionCompletion,
} from "./session-api.js"
import {
  commitDescendant,
  forgetSession,
  hydrateDelegationState,
  inheritRootFromParent,
  rollbackReservation,
  setDelegationMeta,
} from "./state.js"
import type {
  DelegationMeta,
  DelegationRouteResolution,
  PermissionRule,
  SessionContinuityMetadata,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
  SpecialistAgent,
} from "./types.js"

type QueueSnapshot = {
  active: number
  pending: number
  limit: number
}

type LaunchDelegatedSessionArgs = {
  parentSessionID: string
  rootID: string
  childDepth: number
  description: string
  scope?: string
  constraints?: string[]
  runInBackground: boolean
  agent: SpecialistAgent
  route: DelegationRouteResolution
  permissionRules: PermissionRule[]
  compatibleTools: string[]
  toolCompatibility?: Record<string, boolean>
  promptText: string
}

type HarnessLifecycleManagerOptions = {
  client: any
  pollIntervalMs: number
  pollTimeoutMs: number
}

function now(): number {
  return Date.now()
}

function buildLifecycleState(args: {
  phase: SessionLifecyclePhase
  runMode: "sync" | "async"
  queueKey: string
  previous?: SessionLifecycleState
  queue?: SessionLifecycleQueueState
  observation?: SessionLifecycleObservation
  cleanup?: SessionLifecycleState["cleanup"]
  launchedAt?: number
  completedAt?: number
}): SessionLifecycleState {
  return {
    phase: args.phase,
    runMode: args.runMode,
    queueKey: args.queueKey,
    launchedAt: args.launchedAt ?? args.previous?.launchedAt,
    completedAt: args.completedAt ?? args.previous?.completedAt,
    queue: args.queue ?? args.previous?.queue,
    observation: args.observation ?? args.previous?.observation,
    cleanup: args.cleanup ?? args.previous?.cleanup,
  }
}

function buildDelegationMeta(args: {
  rootID: string
  childDepth: number
  budgetUsed: number
  agent: SpecialistAgent
  route: DelegationRouteResolution
  queueKey: string
}): DelegationMeta {
  return {
    rootID: args.rootID,
    depth: args.childDepth,
    budgetUsed: args.budgetUsed,
    agent: args.agent,
    category: args.route.category,
    model: args.route.effectiveModel,
    queueKey: args.queueKey,
  }
}

export class HarnessLifecycleManager {
  private readonly queue = new DelegationConcurrencyQueue(1)

  constructor(private readonly options: HarnessLifecycleManagerOptions) {}

  hydrateFromContinuity(): void {
    for (const record of listSessionContinuity()) {
      hydrateDelegationState(record.sessionID, record.metadata.delegation)
    }
  }

  getLifecycleSnapshot(sessionID: string): SessionLifecycleState | undefined {
    return getSessionContinuity(sessionID)?.metadata.lifecycle
  }

  noteObservedActivity(sessionID: string, source: string): void {
    const record = getSessionContinuity(sessionID)
    if (!record) {
      return
    }

    const timestamp = now()
    const lifecycle = buildLifecycleState({
      phase: record.metadata.status === "failed" ? "failed" : "running",
      runMode: record.metadata.runInBackground ? "async" : "sync",
      queueKey: record.metadata.lifecycle?.queueKey ?? record.metadata.delegation.queueKey,
      previous: record.metadata.lifecycle,
      observation: {
        source,
        observedAt: timestamp,
        detail: "tool-activity",
      },
    })

    patchSessionContinuity(sessionID, {
      status: record.metadata.status === "failed" ? "failed" : "running",
      lastObservedAt: timestamp,
      lastError: record.metadata.status === "failed" ? record.metadata.lastError : undefined,
      lifecycle,
    })
  }

  handleEvent(args: { event: unknown; eventType: string; sessionID: string }): void {
    const { event, eventType, sessionID } = args

    if (eventType === "session.created" || eventType === "session.updated") {
      const parentID = getEventParentID(event)
      if (parentID) {
        inheritRootFromParent(sessionID, parentID)
      }
    }

    if (eventType === "session.deleted") {
      forgetSession(sessionID)
      deleteSessionContinuity(sessionID)
      return
    }

    const continuity = getSessionContinuity(sessionID)
    if (!continuity) {
      return
    }

    if (eventType === "session.created" || eventType === "session.updated") {
      hydrateDelegationState(sessionID, continuity.metadata.delegation)
    }

    const nextStatus = inferContinuityStatusFromEvent({
      event,
      eventType,
      currentStatus: continuity.metadata.status,
    })

    const timestamp = now()
    const lifecycle = buildLifecycleState({
      phase: this.mapStatusToPhase(nextStatus ?? continuity.metadata.status, continuity.metadata.lifecycle?.phase),
      runMode: continuity.metadata.runInBackground ? "async" : "sync",
      queueKey: continuity.metadata.lifecycle?.queueKey ?? continuity.metadata.delegation.queueKey,
      previous: continuity.metadata.lifecycle,
      observation: {
        source: `event:${eventType}`,
        observedAt: timestamp,
        detail: nextStatus ? `status:${nextStatus}` : undefined,
      },
      completedAt:
        nextStatus === "completed"
          ? timestamp
          : continuity.metadata.lifecycle?.completedAt,
    })

    patchSessionContinuity(sessionID, {
      status: nextStatus ?? continuity.metadata.status,
      lastObservedAt: timestamp,
      lastError: nextStatus === "failed" ? continuity.metadata.lastError : undefined,
      lifecycle,
    })
  }

  async launchDelegatedSession(args: LaunchDelegatedSessionArgs): Promise<string> {
    const runMode = args.runInBackground ? "async" : "sync"
    const timestamp = now()
    const queueKey = buildDelegationQueueKey({
      model: args.route.effectiveModel,
      agent: args.agent,
      category: args.route.category,
    })

    let childSessionID = ""

    try {
      const childSession = await createSessionByAnyPath(this.options.client, {
        parentID: args.parentSessionID,
        title: `${args.agent}: ${args.description}`,
        permission: args.permissionRules,
      })

      childSessionID = getSessionID(childSession) ?? ""
      if (!childSessionID) {
        throw new Error("[Harness] Child session creation did not return a session ID.")
      }

      if (args.route.warnings.length > 0) {
        for (const warning of args.route.warnings) {
          addWarning(childSessionID, warning)
        }
      }

      const budgetUsed = commitDescendant(args.rootID, childSessionID)
      const delegation = buildDelegationMeta({
        rootID: args.rootID,
        childDepth: args.childDepth,
        budgetUsed,
        agent: args.agent,
        route: args.route,
        queueKey,
      })
      setDelegationMeta(childSessionID, delegation)

      recordSessionContinuity({
        sessionID: childSessionID,
        toolProfile: {
          permissionRules: args.permissionRules,
          compatibleTools: args.compatibleTools,
        },
        promptParams: {
          agent: args.agent,
          category: args.route.category,
          model: args.route.effectiveModel,
          temperature: args.route.temperature,
          guidanceText: args.route.guidanceText,
          tools: args.compatibleTools,
        },
        metadata: {
          parentSessionID: args.parentSessionID,
          rootSessionID: args.rootID,
          delegation,
          title: `${args.agent}: ${args.description}`,
          description: args.description,
          category: args.route.category,
          route: args.route,
          scope: args.scope,
          constraints: args.constraints ?? [],
          runInBackground: args.runInBackground,
          status: "created",
          createdAt: timestamp,
          updatedAt: timestamp,
          lifecycle: buildLifecycleState({
            phase: "created",
            runMode,
            queueKey,
            observation: {
              source: "lifecycle-manager",
              observedAt: timestamp,
              detail: "session-created",
            },
          }),
        },
      })

      const body = {
        agent: args.agent,
        tools: args.toolCompatibility,
        parts: [
          {
            type: "text",
            text: args.promptText,
          },
        ],
        ...(args.route.effectiveModel ? { model: args.route.effectiveModel } : {}),
      }

      const waitingQueueState = this.queue.snapshot(queueKey)
      if (waitingQueueState.active >= waitingQueueState.limit) {
        this.patchLifecycle(childSessionID, {
          status: "running",
          phase: "queued",
          observation: {
            source: "queue",
            observedAt: now(),
            detail: "waiting-for-lane",
          },
          queue: waitingQueueState,
        })
      }

      const releaseQueue = await this.acquireQueue(childSessionID, queueKey, runMode)

      try {
        await this.dispatchPrompt(body, childSessionID, args.runInBackground)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.patchLifecycle(childSessionID, {
          status: "failed",
          phase: "failed",
          error: message,
          observation: {
            source: "dispatch",
            observedAt: now(),
            detail: "prompt-dispatch-failed",
          },
        })
        releaseQueue("dispatch-failed")
        throw error
      }

      this.patchLifecycle(childSessionID, {
        status: "running",
        phase: "running",
        launchedAt: now(),
        observation: {
          source: "dispatch",
          observedAt: now(),
          detail: args.runInBackground ? "prompt-dispatched-async" : "prompt-dispatched-sync",
        },
      })

      if (args.runInBackground) {
        void this.observeBackgroundCompletion(childSessionID, releaseQueue)

        return JSON.stringify(
          {
            ok: true,
            mode: "async",
            session_id: childSessionID,
            parent_session_id: args.parentSessionID,
            root_session_id: args.rootID,
            agent: args.agent,
            category: args.route.category,
            model: args.route.effectiveModel,
            depth: args.childDepth,
            budget_used: budgetUsed,
            concurrency_key: queueKey,
            concurrency_active: this.queue.snapshot(queueKey).active,
            concurrency_pending: this.queue.snapshot(queueKey).pending,
            concurrency_limit: this.queue.snapshot(queueKey).limit,
            route: args.route,
            description: args.description,
            lifecycle: this.getLifecycleSnapshot(childSessionID),
          },
          null,
          2
        )
      }

      try {
        const observation = await waitForAssistantText(
          this.options.client,
          childSessionID,
          this.options.pollIntervalMs,
          this.options.pollTimeoutMs
        )

        this.patchLifecycle(childSessionID, {
          status: "completed",
          phase: "completed",
          completedAt: now(),
          observation: {
            source: `observe:${observation.completionSignal}`,
            observedAt: now(),
            detail: "assistant-output-ready",
            statusType: observation.statusType,
            sessionStatusType: observation.sessionStatusType,
          },
        })

        return observation.assistantText
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        this.patchLifecycle(childSessionID, {
          status: "failed",
          phase: "failed",
          error: message,
          observation: {
            source: "observe:sync",
            observedAt: now(),
            detail: "assistant-output-failed",
          },
        })
        throw error
      } finally {
        releaseQueue("sync-complete")
      }
    } catch (error) {
      if (!childSessionID) {
        rollbackReservation(args.rootID)
      }
      throw error
    }
  }

  private mapStatusToPhase(
    status: SessionContinuityMetadata["status"],
    previousPhase?: SessionLifecyclePhase
  ): SessionLifecyclePhase {
    switch (status) {
      case "created":
        return previousPhase ?? "created"
      case "running":
        return previousPhase === "queued" || previousPhase === "dispatching" ? previousPhase : "running"
      case "completed":
        return "completed"
      case "failed":
        return "failed"
    }
  }

  private patchLifecycle(
    sessionID: string,
    args: {
      status: SessionContinuityMetadata["status"]
      phase: SessionLifecyclePhase
      observation?: SessionLifecycleObservation
      queue?: QueueSnapshot | SessionLifecycleQueueState
      cleanup?: SessionLifecycleState["cleanup"]
      launchedAt?: number
      completedAt?: number
      error?: string
    }
  ): void {
    const record = getSessionContinuity(sessionID)
    if (!record) {
      return
    }

    const timestamp = now()
    const queue = args.queue
      ? {
          ...args.queue,
        }
      : record.metadata.lifecycle?.queue
    const lifecycle = buildLifecycleState({
      phase: args.phase,
      runMode: record.metadata.runInBackground ? "async" : "sync",
      queueKey: record.metadata.lifecycle?.queueKey ?? record.metadata.delegation.queueKey,
      previous: record.metadata.lifecycle,
      queue,
      observation: args.observation,
      cleanup: args.cleanup,
      launchedAt: args.launchedAt,
      completedAt: args.completedAt,
    })

    patchSessionContinuity(sessionID, {
      status: args.status,
      lastObservedAt: timestamp,
      lastError: args.error,
      lifecycle,
    })
  }

  private async acquireQueue(
    sessionID: string,
    queueKey: string,
    runMode: "sync" | "async"
  ): Promise<(reason: string) => void> {
    const release = await this.queue.acquire(queueKey)
    const acquiredAt = now()
    this.patchLifecycle(sessionID, {
      status: "running",
      phase: "dispatching",
      queue: {
        ...this.queue.snapshot(queueKey),
        acquiredAt,
      },
      observation: {
        source: "queue",
        observedAt: acquiredAt,
        detail: `lane-acquired:${runMode}`,
      },
    })

    return (reason: string) => {
      const timestamp = now()
      const existing = getSessionContinuity(sessionID)
      const previousQueue = existing?.metadata.lifecycle?.queue
      release()
      const queueAfterRelease = this.queue.snapshot(queueKey)
      this.patchLifecycle(sessionID, {
        status: existing?.metadata.status ?? "running",
        phase: existing?.metadata.lifecycle?.phase ?? "running",
        queue: {
          ...queueAfterRelease,
          acquiredAt: previousQueue?.acquiredAt,
          releasedAt: timestamp,
        },
        cleanup: {
          scheduledAt: existing?.metadata.lifecycle?.cleanup?.scheduledAt ?? timestamp,
          completedAt: timestamp,
          reason,
        },
        observation: {
          source: "queue",
          observedAt: timestamp,
          detail: `lane-released:${reason}`,
        },
      })
    }
  }

  private async dispatchPrompt(
    body: Record<string, unknown>,
    sessionID: string,
    runInBackground: boolean
  ): Promise<void> {
    if (runInBackground) {
      await promptSessionAsyncByAnyPath(this.options.client, sessionID, body)
      return
    }

    await promptSessionByAnyPath(this.options.client, sessionID, body)
  }

  private async observeBackgroundCompletion(
    sessionID: string,
    releaseQueue: (reason: string) => void
  ): Promise<void> {
    try {
      const observation = await waitForSessionCompletion(
        this.options.client,
        sessionID,
        this.options.pollIntervalMs,
        this.options.pollTimeoutMs
      )

      this.patchLifecycle(sessionID, {
        status: "completed",
        phase: "completed",
        completedAt: now(),
        observation: {
          source: `observe:${observation.completionSignal}`,
          observedAt: now(),
          detail: observation.assistantText ? "background-assistant-output" : "background-idle-observed",
          statusType: observation.statusType,
          sessionStatusType: observation.sessionStatusType,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      addWarning(sessionID, `Delegated session completion watcher failed: ${message}`)
      this.patchLifecycle(sessionID, {
        status: "failed",
        phase: "failed",
        error: message,
        observation: {
          source: "observe:async",
          observedAt: now(),
          detail: "background-observer-failed",
        },
      })
    } finally {
      releaseQueue("background-complete")
    }
  }
}

export function createHarnessLifecycleManager(
  options: HarnessLifecycleManagerOptions
): HarnessLifecycleManager {
  return new HarnessLifecycleManager(options)
}
