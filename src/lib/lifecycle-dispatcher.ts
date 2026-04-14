import { buildDelegationQueueKey, DelegationConcurrencyQueue, reserveSubagentSpawn } from "./concurrency.js"
import type { SpawnReservation } from "./concurrency.js"
import type { BackgroundManager } from "./background-manager.js"
import { buildDelegationPacketParentChain, createDelegationPacket } from "./delegation-packet.js"
import type { ExecutionModeResult } from "./execution-mode.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./continuity.js"
import { runLifecycleProcessTask } from "./lifecycle-process-runner.js"
import { runLifecycleSubsessionTask } from "./lifecycle-process-runner.js"
import { runLifecycleTmuxTask } from "./lifecycle-tmux-runner.js"
import { addWarning } from "./state.js"
import { createSession, getSessionID, type OpenCodeClient } from "./session-api.js"
import { commitDescendant, setDelegationMeta, taskState } from "./state.js"
import { acquireLifecycleQueue, enqueueWaitingLifecycle } from "./lifecycle-queue.js"
import { buildDelegationMeta, buildLifecycleState } from "./lifecycle-state.js"
import { resolveConcurrencyForKey } from "./runtime-policy.js"
import { type PatchLifecycleArgs } from "./lifecycle-patching.js"
import type {
  DelegationRouteResolution,
  PermissionRule,
  RuntimePolicy,
  SessionPolicyOverride,
  SpecialistAgent,
} from "./types.js"

export type LaunchDelegatedSessionArgs = {
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
  pollIntervalMs?: number
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

type DispatchContext = {
  client: OpenCodeClient
  queue: DelegationConcurrencyQueue
  completionDetector: import("./completion-detector.js").CompletionDetector
  pollTimeoutMs: number
  runtimePolicy: RuntimePolicy | undefined
  backgroundManager: BackgroundManager | undefined
  patchLifecycleFn: (args: PatchLifecycleArgs) => boolean
  getLifecycleSnapshotFn: (sessionID: string) => import("./types.js").SessionLifecycleState | undefined
}

export async function launchDelegatedSession(
  args: LaunchDelegatedSessionArgs,
  ctx: DispatchContext,
): Promise<string> {
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
    const childSession = await createSession(ctx.client, {
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
      queue: ctx.queue,
      sessionID: childSessionID,
      queueKey,
      runMode,
      now,
      patchLifecycle: ctx.patchLifecycleFn,
    })

    const resolvedConcurrency = ctx.runtimePolicy
      ? resolveConcurrencyForKey(ctx.runtimePolicy, queueKey)
      : undefined

    if (args.runInBackground) {
      void (async () => {
        try {
          const releaseQueue = await acquireLifecycleQueue({
            queue: ctx.queue,
            sessionID: childSessionID,
            queueKey,
            runMode,
            now,
            getSessionContinuity,
            patchLifecycle: ctx.patchLifecycleFn,
            concurrencyLimit: resolvedConcurrency?.limit,
            concurrencyTimeoutMs: resolvedConcurrency?.acquireTimeoutMs,
          })

          const launchedAt = now()
          ctx.patchLifecycleFn({
            sessionID: childSessionID,
            status: "queued",
            phase: "dispatching",
            launchedAt,
            observation: {
              source: "dispatch",
              observedAt: launchedAt,
              detail: "prompt-dispatched-async",
            },
          })

          if (execution.submode === "tmux-pane") {
            if (args.tmuxAvailability === "enabled" && !execution.capabilityEvidence.hasTmux) {
              throw new Error("[Harness] tmux-pane execution requested without available tmux runner.")
            }
            if (!ctx.backgroundManager) {
              throw new Error("[Harness] tmux-pane execution requires a BackgroundManager.")
            }

            await runLifecycleTmuxTask({
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
              client: ctx.client,
              backgroundManager: ctx.backgroundManager,
              getSessionContinuity,
              patchSessionContinuity,
              patchLifecycle: ctx.patchLifecycleFn,
              getLifecycleSnapshot: (sid) => ctx.getLifecycleSnapshotFn(sid),
              releaseQueue,
              now,
            })
            return
          }

          if (execution.submode === "builtin-process") {
            if (!ctx.backgroundManager) {
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
              client: ctx.client,
              backgroundManager: ctx.backgroundManager,
              getSessionContinuity,
              patchSessionContinuity,
              patchLifecycle: ctx.patchLifecycleFn,
              getLifecycleSnapshot: (sid) => ctx.getLifecycleSnapshotFn(sid),
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
            client: ctx.client,
            completionDetector: ctx.completionDetector,
            pollTimeoutMs: ctx.pollTimeoutMs,
            getSessionContinuity,
            patchSessionContinuity,
            patchLifecycle: ctx.patchLifecycleFn,
            getLifecycleSnapshot: (sid) => ctx.getLifecycleSnapshotFn(sid),
            releaseQueue,
            queueSnapshot: ctx.queue.snapshot(queueKey),
            budgetUsed,
            launchedAt,
            now,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          ctx.patchLifecycleFn({
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
          concurrency_key: ctx.getLifecycleSnapshotFn(childSessionID)?.queueKey,
          concurrency_active: ctx.queue.snapshot(queueKey).active,
          concurrency_pending: ctx.queue.snapshot(queueKey).pending,
          concurrency_limit: ctx.queue.snapshot(queueKey).limit,
          route: args.route,
          description: args.description,
          lifecycle: ctx.getLifecycleSnapshotFn(childSessionID),
          output_link: `session://${childSessionID}`,
          instruction: "Task dispatched. Continue with other work — you'll be notified when complete.",
        },
        null,
        2,
      )
    }

    const releaseQueue = await acquireLifecycleQueue({
      queue: ctx.queue,
      sessionID: childSessionID,
      queueKey,
      runMode,
      now,
      getSessionContinuity,
      patchLifecycle: ctx.patchLifecycleFn,
      concurrencyLimit: resolvedConcurrency?.limit,
      concurrencyTimeoutMs: resolvedConcurrency?.acquireTimeoutMs,
    })

    const launchedAt = now()
    ctx.patchLifecycleFn({
      sessionID: childSessionID,
      status: "running",
      phase: "running",
      launchedAt,
      observation: {
        source: "dispatch",
        observedAt: launchedAt,
        detail: "prompt-dispatched-sync",
      },
    })

    if (execution.submode === "tmux-pane") {
      if (args.tmuxAvailability === "enabled" && !execution.capabilityEvidence.hasTmux) {
        throw new Error("[Harness] tmux-pane execution requested without available tmux runner.")
      }
      if (!ctx.backgroundManager) {
        throw new Error("[Harness] tmux-pane execution requires a BackgroundManager.")
      }

      return await runLifecycleTmuxTask({
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
        client: ctx.client,
        backgroundManager: ctx.backgroundManager,
        getSessionContinuity,
        patchSessionContinuity,
        patchLifecycle: ctx.patchLifecycleFn,
        getLifecycleSnapshot: (sid) => ctx.getLifecycleSnapshotFn(sid),
        releaseQueue,
        now,
      })
    }

    if (execution.submode === "builtin-process") {
      if (!ctx.backgroundManager) {
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
        client: ctx.client,
        backgroundManager: ctx.backgroundManager,
        getSessionContinuity,
        patchSessionContinuity,
        patchLifecycle: ctx.patchLifecycleFn,
        getLifecycleSnapshot: (sid) => ctx.getLifecycleSnapshotFn(sid),
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
      client: ctx.client,
      completionDetector: ctx.completionDetector,
      pollTimeoutMs: ctx.pollTimeoutMs,
      getSessionContinuity,
      patchSessionContinuity,
      patchLifecycle: ctx.patchLifecycleFn,
      getLifecycleSnapshot: (sid) => ctx.getLifecycleSnapshotFn(sid),
      releaseQueue,
      queueSnapshot: ctx.queue.snapshot(queueKey),
      budgetUsed,
      launchedAt,
      now,
    })
  } catch (error) {
    spawnReservation.rollback()
    throw error
  }
}
