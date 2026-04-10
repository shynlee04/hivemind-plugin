import { buildDelegationQueueKey, DelegationConcurrencyQueue, reserveSubagentSpawn } from "./concurrency.js"
import type { SpawnReservation } from "./concurrency.js"
import type { BackgroundManager } from "./background-manager.js"
import { CompletionDetector } from "./completion-detector.js"
import { restoreCheckpoint, type CheckpointData } from "./compaction-checkpoint.js"
import { buildDelegationPacketParentChain, createDelegationPacket } from "./delegation-packet.js"
import type { ExecutionModeResult } from "./execution-mode.js"
import { deleteSessionContinuity, getSessionContinuity, getSessionRecoveryState, listSessionContinuity, patchSessionDelegationPacket, patchSessionContinuity, recordSessionContinuity } from "./continuity.js"
import { runLifecycleProcessTask, runLifecycleSubsessionTask } from "./lifecycle-process-runner.js"
import { addWarning } from "./state.js"
import { inferContinuityStatusFromEvent } from "./runtime.js"
import { createSession, getEventParentID, getSessionID, type OpenCodeClient, sendPrompt } from "./session-api.js"
import { commitDescendant, forgetSession, hydrateDelegationState, inheritRootFromParent, setDelegationMeta, taskState } from "./state.js"
import { acquireLifecycleQueue, enqueueWaitingLifecycle, type QueueSnapshot } from "./lifecycle-queue.js"
import { buildDelegationMeta, buildLifecycleState, isValidLifecycleTransition, mapPhaseToDelegationPacketStatus, mapStatusToLifecyclePhase } from "./lifecycle-state.js"
import { resolveLifecycleConcurrency } from "./lifecycle-runtime-policy.js"
import type {
  DelegationRouteResolution,
  PermissionRule,
  RuntimePolicy,
  SessionContinuityMetadata,
  SessionPolicyOverride,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
  SpecialistAgent,
} from "./types.js"

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
  execution: ExecutionModeResult
  runtimePolicyOverride?: SessionPolicyOverride
  spawnReservation?: SpawnReservation
  defaultDispatchMode?: "async" | "sync"
  tmuxAvailability?: "auto" | "enabled" | "disabled"
  pollIntervalMs?: 3000 | 5000 | 15000
}

type HarnessLifecycleManagerOptions = {
  client: OpenCodeClient
  pollTimeoutMs: number
  /** Workspace-level runtime policy injected from plugin composition root. */
  runtimePolicy?: RuntimePolicy
  backgroundManager?: BackgroundManager
}

function now(): number { return Date.now() }

function ensureParentContinuityRecord(args: {
  parentSessionID: string
  rootID: string
  queueKey: string
  timestamp: number
}): void {
  if (getSessionContinuity(args.parentSessionID)) {
    return
  }

  recordSessionContinuity({
    sessionID: args.parentSessionID,
    toolProfile: {
      permissionRules: [],
      compatibleTools: [],
    },
    promptParams: {
      agent: "general",
      tools: [],
    },
    metadata: {
      parentSessionID: args.parentSessionID,
      rootSessionID: args.rootID,
      delegation: {
        rootID: args.rootID,
        depth: 0,
        budgetUsed: 0,
        agent: "general",
        queueKey: args.queueKey,
      },
      title: `session: ${args.parentSessionID}`,
      description: "Harness parent session record",
      constraints: [],
      runInBackground: false,
      status: "running",
      createdAt: args.timestamp,
      updatedAt: args.timestamp,
    },
  })
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
    const record = getSessionContinuity(sessionID)
    if (!record) {
      return
    }

    const timestamp = now()
    const lifecycle = buildLifecycleState({
      phase: record.metadata.status === "error" ? "failed" : "running",
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
      status: record.metadata.status === "error" ? "error" : "running",
      lastObservedAt: timestamp,
      lastError: record.metadata.status === "error" ? record.metadata.lastError : undefined,
      lifecycle,
    })
    this.syncDelegationPacketStatus(sessionID, lifecycle.phase)
  }

  handleEvent(args: { event: unknown; eventType: string; sessionID: string }): void {
    const { event, eventType, sessionID } = args
    this.completionDetector.feed(eventType, sessionID)

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
      phase: mapStatusToLifecyclePhase(nextStatus ?? continuity.metadata.status, continuity.metadata.lifecycle?.phase),
      runMode: continuity.metadata.runInBackground ? "async" : "sync",
      queueKey: continuity.metadata.lifecycle?.queueKey ?? continuity.metadata.delegation.queueKey,
      previous: continuity.metadata.lifecycle,
      observation: {
        source: `event:${eventType}`,
        observedAt: timestamp,
        detail: nextStatus ? `status:${nextStatus}` : undefined,
      },
      completedAt: nextStatus === "completed" ? timestamp : continuity.metadata.lifecycle?.completedAt,
    })

    patchSessionContinuity(sessionID, {
      status: nextStatus ?? continuity.metadata.status,
      lastObservedAt: timestamp,
      lastError: nextStatus === "error" ? continuity.metadata.lastError : undefined,
      lifecycle,
    })
    this.syncDelegationPacketStatus(sessionID, lifecycle.phase)
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
    const runMode = args.runInBackground ? "async" : "sync"
    const timestamp = now()
    const execution = args.execution
    const queueKey = buildDelegationQueueKey({
      model: args.route.effectiveModel,
      agent: args.agent,
      category: args.route.category,
    })
    const spawnReservation =
      args.spawnReservation ?? reserveSubagentSpawn(args.parentSessionID, args.rootID, taskState)

    ensureParentContinuityRecord({
      parentSessionID: args.parentSessionID,
      rootID: args.rootID,
      queueKey,
      timestamp,
    })

    try {
      const childSession = await createSession(this.options.client, {
        parentID: args.parentSessionID,
        title: `${args.agent}: ${args.description}`,
        permission: args.permissionRules,
      })

      const childSessionID = getSessionID(childSession) ?? ""
      if (!childSessionID) {
        throw new Error("[Harness] Child session creation did not return a session ID.")
      }

      for (const warning of args.route.warnings) {
        addWarning(childSessionID, warning)
      }

      const budgetUsed = commitDescendant(args.rootID, childSessionID)
      spawnReservation.release()

      const delegation = buildDelegationMeta({
        rootID: args.rootID,
        childDepth: args.childDepth,
        budgetUsed,
        agent: args.agent,
        route: args.route,
        queueKey,
        runtimePolicyOverride: args.runtimePolicyOverride,
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
              delegationPacket: createDelegationPacket(
            args.description,
            buildDelegationPacketParentChain({
              rootSessionID: args.rootID,
              parentSessionID: args.parentSessionID,
              sessionID: childSessionID,
            }),
          ),
          execution: {
            family: execution.family,
            submode: execution.submode,
            rationale: execution.rationale,
            characteristics: { ...execution.characteristics },
            capabilityEvidence: { ...execution.capabilityEvidence },
          },
          title: `${args.agent}: ${args.description}`,
          description: args.description,
          category: args.route.category,
          route: args.route,
          scope: args.scope,
          constraints: args.constraints ?? [],
          runInBackground: args.runInBackground,
          status: "pending",
          createdAt: timestamp,
          updatedAt: timestamp,
          defaultDispatchMode: args.defaultDispatchMode,
          tmuxAvailability: args.tmuxAvailability,
          pollIntervalMs: args.pollIntervalMs,
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
        parts: [{ type: "text", text: args.promptText }],
        ...(args.route.effectiveModel ? { model: args.route.effectiveModel } : {}),
      }

      enqueueWaitingLifecycle({
        queue: this.queue,
        sessionID: childSessionID,
        queueKey,
        runMode,
        now,
        patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
      })

      // Resolve per-key concurrency policy from runtime policy
      const resolvedConcurrency = this.runtimePolicy
        ? resolveLifecycleConcurrency(this.runtimePolicy, queueKey)
        : undefined

      if (args.runInBackground) {
        void (async () => {
          try {
            const releaseQueue = await acquireLifecycleQueue({
              queue: this.queue,
              sessionID: childSessionID,
              queueKey,
              runMode,
              now,
              getSessionContinuity,
              patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
              concurrencyLimit: resolvedConcurrency?.limit,
              concurrencyTimeoutMs: resolvedConcurrency?.acquireTimeoutMs,
            })

            const launchedAt = now()
            this.patchLifecycle({
              sessionID: childSessionID,
              status: "running",
              phase: "running",
              launchedAt,
              observation: {
                source: "dispatch",
                observedAt: launchedAt,
                detail: "prompt-dispatched-async",
              },
            })

            if (execution.submode === "builtin-process") {
              const backgroundManager = this.options.backgroundManager
              if (!backgroundManager) {
                throw new Error("[Harness] builtin-process execution requires a BackgroundManager.")
              }

              await runLifecycleProcessTask({
                sessionID: childSessionID,
                parentSessionID: args.parentSessionID,
                rootID: args.rootID,
                childDepth: args.childDepth,
                agent: args.agent,
                category: args.route.category,
                model: args.route.effectiveModel,
                description: args.description,
                promptText: args.promptText,
                runInBackground: true,
                execution,
                client: this.options.client,
                backgroundManager,
                getSessionContinuity,
                patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
                getLifecycleSnapshot: (sessionID) => this.getLifecycleSnapshot(sessionID),
                releaseQueue,
                now,
              })
              return
            }

            await runLifecycleSubsessionTask({
              sessionID: childSessionID,
              parentSessionID: args.parentSessionID,
              rootID: args.rootID,
              childDepth: args.childDepth,
              agent: args.agent,
              category: args.route.category,
              model: args.route.effectiveModel,
              description: args.description,
              route: args.route,
              body,
              runInBackground: true,
              client: this.options.client,
              completionDetector: this.completionDetector,
              pollTimeoutMs: this.options.pollTimeoutMs,
              getSessionContinuity,
              patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
              getLifecycleSnapshot: (sessionID) => this.getLifecycleSnapshot(sessionID),
              releaseQueue,
              queueSnapshot: this.queue.snapshot(queueKey),
              budgetUsed,
              launchedAt,
              now,
            })
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            this.patchLifecycle({
              sessionID: childSessionID,
              status: "error",
              phase: "failed",
              error: message,
              observation: {
                source: "dispatch",
                observedAt: now(),
                detail: "async-queue-dispatch-failed",
              },
            })
          }
        })()

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
            concurrency_key: this.getLifecycleSnapshot(childSessionID)?.queueKey,
            concurrency_active: this.queue.snapshot(queueKey).active,
            concurrency_pending: this.queue.snapshot(queueKey).pending,
            concurrency_limit: this.queue.snapshot(queueKey).limit,
            route: args.route,
            description: args.description,
            lifecycle: this.getLifecycleSnapshot(childSessionID),
            output_link: `session://${childSessionID}`,
            instruction: "Task dispatched. Continue with other work — you'll be notified when complete.",
          },
          null,
          2,
        )
      }

      const releaseQueue = await acquireLifecycleQueue({
        queue: this.queue,
        sessionID: childSessionID,
        queueKey,
        runMode,
        now,
        getSessionContinuity,
        patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
        concurrencyLimit: resolvedConcurrency?.limit,
        concurrencyTimeoutMs: resolvedConcurrency?.acquireTimeoutMs,
      })

      const launchedAt = now()
      this.patchLifecycle({
        sessionID: childSessionID,
        status: "running",
        phase: "running",
        launchedAt,
        observation: {
          source: "dispatch",
          observedAt: launchedAt,
          detail: args.runInBackground ? "prompt-dispatched-async" : "prompt-dispatched-sync",
        },
      })

      if (execution.submode === "builtin-process") {
        const backgroundManager = this.options.backgroundManager
        if (!backgroundManager) {
          throw new Error("[Harness] builtin-process execution requires a BackgroundManager.")
        }

        return await runLifecycleProcessTask({
          sessionID: childSessionID,
          parentSessionID: args.parentSessionID,
          rootID: args.rootID,
          childDepth: args.childDepth,
          agent: args.agent,
          category: args.route.category,
          model: args.route.effectiveModel,
          description: args.description,
          promptText: args.promptText,
          runInBackground: args.runInBackground,
          execution,
          client: this.options.client,
          backgroundManager,
          getSessionContinuity,
          patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
          getLifecycleSnapshot: (sessionID) => this.getLifecycleSnapshot(sessionID),
          releaseQueue,
          now,
        })
      }

      return await runLifecycleSubsessionTask({
        sessionID: childSessionID,
        parentSessionID: args.parentSessionID,
        rootID: args.rootID,
        childDepth: args.childDepth,
        agent: args.agent,
        category: args.route.category,
        model: args.route.effectiveModel,
        description: args.description,
        route: args.route,
        body,
        runInBackground: args.runInBackground,
        client: this.options.client,
        completionDetector: this.completionDetector,
        pollTimeoutMs: this.options.pollTimeoutMs,
        getSessionContinuity,
        patchLifecycle: (patchArgs) => this.patchLifecycle(patchArgs),
        getLifecycleSnapshot: (sessionID) => this.getLifecycleSnapshot(sessionID),
        releaseQueue,
        queueSnapshot: this.queue.snapshot(queueKey),
        budgetUsed,
        launchedAt,
        now,
      })
    } catch (error) {
      spawnReservation.rollback()
      throw error
    }
  }

  private cancelLifecycle(sessionID: string): void {
    this.completionDetector.cancel(sessionID)
    this.patchLifecycle({
      sessionID,
      status: "error",
      phase: "failed",
      error: "Session cancelled by user",
      observation: {
        source: "cancel",
        observedAt: now(),
        detail: "session-cancelled",
      },
    })
  }

  private patchLifecycle(args: {
    sessionID: string
    status: SessionContinuityMetadata["status"]
    phase: SessionLifecyclePhase
    observation?: SessionLifecycleObservation
    queue?: QueueSnapshot | SessionLifecycleQueueState
    cleanup?: SessionLifecycleState["cleanup"]
    launchedAt?: number
    completedAt?: number
    error?: string
  }): boolean {
    const record = getSessionContinuity(args.sessionID)
    if (!record) {
      return false
    }

    const previousPhase = record.metadata.lifecycle?.phase
    if (
      previousPhase !== undefined &&
      previousPhase !== args.phase &&
      !isValidTransition(previousPhase, args.phase)
    ) {
      console.warn(
        `[Harness] Invalid lifecycle transition rejected: ${previousPhase} → ${args.phase} for session ${args.sessionID}`,
      )
      return false
    }

    const timestamp = now()
    const lifecycle = buildLifecycleState({
      phase: args.phase,
      runMode: record.metadata.runInBackground ? "async" : "sync",
      queueKey: record.metadata.lifecycle?.queueKey ?? record.metadata.delegation.queueKey,
      previous: record.metadata.lifecycle,
      queue: args.queue ? { ...args.queue } : record.metadata.lifecycle?.queue,
      observation: args.observation,
      cleanup: args.cleanup,
      launchedAt: args.launchedAt,
      completedAt: args.completedAt,
    })

    patchSessionContinuity(args.sessionID, {
      status: args.status,
      lastObservedAt: timestamp,
      lastError: args.error === undefined ? record.metadata.lastError : args.error,
      lifecycle,
    })
    this.syncDelegationPacketStatus(args.sessionID, args.phase)
    return true
  }

  private syncDelegationPacketStatus(sessionID: string, phase: SessionLifecyclePhase): void {
    const record = getSessionContinuity(sessionID)
    const currentStatus = record?.metadata.delegationPacket?.status
    const nextStatus = mapPhaseToDelegationPacketStatus(phase)

    if (!record?.metadata.delegationPacket || currentStatus === nextStatus) {
      return
    }

    patchSessionDelegationPacket(sessionID, { status: nextStatus })
  }
}

export function createHarnessLifecycleManager(
  options: HarnessLifecycleManagerOptions,
): HarnessLifecycleManager {
  return new HarnessLifecycleManager(options)
}
