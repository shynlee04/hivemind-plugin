/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
import type { Plugin } from "@opencode-ai/plugin"
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { createHarnessLifecycleManager } from "./task-management/lifecycle/index.js"
import { CompletionDetector } from "./coordination/completion/detector.js"
import { AgentResolver } from "./coordination/delegation/agent-resolver.js"
import { DelegationCoordinator } from "./coordination/delegation/coordinator.js"
import { DelegationDispatcher } from "./coordination/delegation/dispatcher.js"
import { DelegationLifecycle } from "./coordination/delegation/lifecycle.js"
import { DelegationManager } from "./coordination/delegation/manager.js"
import { DelegationMonitor } from "./coordination/delegation/monitor.js"
import { NotificationRouter } from "./coordination/delegation/notification-router.js"
import { PeriodicNotifier } from "./coordination/delegation/periodic-notifier.js"
import { DelegationRetryHandler } from "./coordination/delegation/retry-handler.js"
import { createSdkChildSessionStarter } from "./coordination/delegation/sdk-child-session-starter.js"
import { SlotManager } from "./coordination/delegation/slot-manager.js"

import type { Delegation, DelegationNotificationType, DelegationStatus } from "./coordination/delegation/types.js"
import { appendTuiPrompt, sendPromptAsync as sdkSendPromptAsync, getSessionMessageCount, abortSession, type OpenCodeClient } from "./shared/session-api.js"
import { asString, getNestedValue } from "./shared/helpers.js"
import { taskState } from "./shared/state.js"
import type { PendingNotification } from "./shared/types.js"
import { createCoreHooks } from "./hooks/lifecycle/core-hooks.js"
import { createSessionHooks } from "./hooks/lifecycle/session-hooks.js"
import { createToolGuardHooks } from "./hooks/guards/tool-guard-hooks.js"
import { createDelegationEventObserver, createSessionEntryEventObserver, createSessionIsMainObserver } from "./hooks/observers/event-observers.js"
// createSessionJourneyEventObserver — REMOVED in CP-ST-03; session-tracker is canonical.
import { createToolExecuteAfterHook } from "./hooks/transforms/tool-after-composer.js"
import { createToolBeforeGuard } from "./hooks/transforms/tool-before-guard.js"
import { createChatMessageCapture } from "./hooks/transforms/chat-message-capture.js"
import { createToolAfterWorkflow } from "./hooks/transforms/tool-after-workflow.js"
import { createSessionEntryConsumer } from "./hooks/observers/session-entry-consumer.js"
import { createSessionMainConsumer } from "./hooks/observers/session-main-consumer.js"
import { createDelegationConsumer } from "./hooks/observers/delegation-consumer.js"
import { createSessionTrackerConsumer } from "./hooks/observers/session-tracker-consumer.js"
import { summarizePluginToolOutput } from "./shared/plugin-tool-output-summary.js"
import { createPtyManagerIfSupported } from "./features/background-command/pty/pty-runtime.js"
import { createGovernanceSessionTool } from "./features/governance-engine/index.js"
import { createPromptSkimTool } from "./tools/prompt/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session/session-patch/index.js"
import { createExecuteSlashCommandTool } from "./tools/session/execute-slash-command.js"
import { createDelegateTaskTool } from "./tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "./tools/delegation/delegation-status.js"
import { createRunBackgroundCommandTool } from "./tools/hivemind/run-background-command.js"
import { createConfigurePrimitiveTool } from "./tools/config/configure-primitive.js"
import { createValidateRestartTool } from "./tools/config/validate-restart.js"
import { createBootstrapInitTool } from "./tools/config/bootstrap-init.js"
import { createBootstrapRecoverTool } from "./tools/config/bootstrap-recover.js"
import { createSessionJournalExportTool } from "./tools/session/session-journal-export.js"
import { createHivemindDocTool } from "./tools/hivemind/hivemind-doc.js"
import { createHivemindTrajectoryTool } from "./tools/hivemind/hivemind-trajectory.js"
import { createHivemindPressureTool } from "./tools/hivemind/hivemind-pressure.js"
import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "./tools/hivemind/hivemind-agent-work.js"
import { createHivemindSdkSupervisorTool } from "./tools/hivemind/hivemind-sdk-supervisor.js"
import { createHivemindCommandEngineTool } from "./tools/hivemind/hivemind-command-engine.js"
import { createSessionTrackerTool } from "./tools/session/session-tracker.js"
import { createSessionHierarchyTool } from "./tools/session/session-hierarchy.js"
import { createSessionContextTool } from "./tools/session/session-context.js"
import { createHivemindSessionViewTool } from "./tools/hivemind/hivemind-session-view.js"
import { loadRuntimePolicy } from "./shared/runtime-policy.js"
import { resolveWorkspaceRuntimePolicy } from "./shared/workspace-runtime-policy.js"
import { runAutoLoop } from "./coordination/spawner/auto-loop.js"
import { runRalphLoop, escalationMessage } from "./coordination/spawner/ralph-loop.js"
import { SessionTracker } from "./features/session-tracker/index.js"
import { getConfig, getFreshConfig } from "./config/subscriber.js"
import { resolveBehavioralProfile } from "./routing/behavioral-profile/resolve-behavioral-profile.js"
import { getSessionContinuity, listSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./task-management/continuity/index.js"
import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"
import type { RuntimePolicy } from "./shared/types.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

/** Return true only for notification types that should append to the parent TUI. */
function shouldAppendParentTuiNotification(type: DelegationNotificationType): boolean {
  return type === "success" || type === "failure" || type === "timeout"
}

function extractHookSessionId(input: unknown): string | undefined {
  return asString(getNestedValue(input, ["sessionID"]))
    ?? asString(getNestedValue(input, ["sessionId"]))
    ?? asString(getNestedValue(input, ["message", "sessionID"]))
    ?? asString(getNestedValue(input, ["message", "sessionId"]))
}

function extractAssistantExcerpt(input: unknown, output: unknown): string | undefined {
  const role = asString(getNestedValue(input, ["message", "role"])) ?? asString(getNestedValue(input, ["role"]))
  if (role && role !== "assistant") return undefined
  const text = asString(getNestedValue(output, ["text"]))
    ?? asString(getNestedValue(input, ["message", "content"]))
    ?? asString(getNestedValue(input, ["content"]))
  return text ? text.slice(0, 500) : undefined
}

function persistPendingDelegationNotifications(records: Array<{ notification: { delegationId: string; message: string; timestamp: number; type: string }; parentSessionId: string }>): void {
  const byParent = new Map<string, PendingNotification[]>()
  for (const record of records) {
    const notification: PendingNotification = {
      agent: "delegate-task",
      createdAt: record.notification.timestamp,
      delivered: false,
      retryCount: 0,
      maxRetries: 3,
      description: `Delegation ${record.notification.delegationId} ${record.notification.type}`,
      metadata: { delegationId: record.notification.delegationId, terminalState: record.notification.type === "success" ? "completed" : record.notification.type === "timeout" ? "timeout" : "error", summaryPreview: record.notification.message.slice(0, 500) },
      resultPreview: record.notification.message,
      sessionID: record.notification.delegationId,
      status: record.notification.type === "success" ? "completed" : record.notification.type === "timeout" || record.notification.type === "failure" ? "failed" : "started",
    }
    byParent.set(record.parentSessionId, [...(byParent.get(record.parentSessionId) ?? []), notification])
  }
  for (const [parentSessionId, pending] of byParent) {
    const current = getSessionContinuity(parentSessionId)
    if (current) {
      patchSessionContinuity(parentSessionId, { pendingNotifications: [...current.metadata.pendingNotifications, ...pending] })
      continue
    }
    recordSessionContinuity({
      metadata: { constraints: [], delegation: null, description: "Delegation pending notification queue", pendingNotifications: pending, status: "running", updatedAt: Date.now() },
      promptParams: {},
      sessionID: parentSessionId,
    })
  }
}

export interface DelegationModuleSetupOptions {
  client: OpenCodeClient
  enableRuntimeAdapter?: boolean
  persistDelegations?: (delegations: Delegation[]) => void
  projectDirectory: string
  ptyManager?: Awaited<ReturnType<typeof createPtyManagerIfSupported>>
  runtimePolicy?: RuntimePolicy
  onChildSessionCreated?: (childSessionId: string, parentSessionId: string) => void
}

export interface DelegationModuleSetup {
  coordinator: DelegationCoordinator
  delegationManager: DelegationManager
  detector: CompletionDetector
  lifecycle: DelegationLifecycle
  notificationRouter: NotificationRouter
  periodicNotifier: PeriodicNotifier
  slotManager: SlotManager
  monitor: DelegationMonitor
}

/**
 * Wires delegate-task v2 modules for the OpenCode plugin composition root.
 *
 * @param options - Plugin runtime dependencies and project root.
 * @returns Delegation modules shared by tools, plugin setup, and integration tests.
 */
export function setupDelegationModules(options: DelegationModuleSetupOptions): DelegationModuleSetup {
  const records = new Map<string, Delegation>()
  const slotManager = new SlotManager()
  const agentResolver = new AgentResolver({ client: options.client, projectRoot: options.projectDirectory })
  const dispatcher = new DelegationDispatcher({ agentResolver, slotManager })
  const detector = new CompletionDetector()
  const notificationRouter = new NotificationRouter({
    deliver: async (parentSessionId, notification) => {
      if (!shouldAppendParentTuiNotification(notification.type)) return true
      const line = notificationRouter.formatNotification(notification.type, notification.delegationId, notification.message)
      if (options.client?.session) {
        void sdkSendPromptAsync(options.client, parentSessionId, { parts: [{ type: "text", text: line }], noReply: true })
      }
      return true
    },
    persistPending: persistPendingDelegationNotifications,
  })
  let coordinatorRef: DelegationCoordinator | undefined
  let periodicNotifierRef: PeriodicNotifier | undefined
  const lifecycle = new DelegationLifecycle({
    get: (delegationId) => records.get(delegationId),
    getAll: () => Array.from(records.values()),
    registerDelegation: (delegation) => { records.set(delegation.id, delegation) },
    transition: (delegationId, status) => {
      const record = records.get(delegationId)
      if (!record || record.status === status) return false
      record.status = status
      return true
    },
    transitionToTerminal: (delegationId: string, status: DelegationStatus, error?: string) => {
      const record = records.get(delegationId)
      if (!record) return
      record.status = status
      record.completedAt = Date.now()
      if (error !== undefined) record.error = error
    },
  })
  const monitor = new DelegationMonitor({
    getDelegationRecord: (delegationId) => lifecycle.getStatus(delegationId),
    getStatus: (delegationId) => lifecycle.getStatus(delegationId)?.status ?? "dispatched",
    getActionCount: (delegationId) => lifecycle.getStatus(delegationId)?.actionCount ?? 0,
    inject: (_parentSessionId, line, delegationId) => {
      if (!delegationId) return
      notificationRouter.route({ delegationId, idempotencyKey: `${delegationId}:progress:${line}`, message: line, timestamp: Date.now(), type: "progress" })
      const rec = lifecycle.getStatus(delegationId)
      if (rec) {
        periodicNotifierRef?.handlePollTick({
          delegationId,
          parentSessionId: _parentSessionId,
          agent: rec.agent,
          toolCount: rec.toolCallCount ?? 0,
          actionCount: rec.actionCount ?? 0,
          elapsedMs: Date.now() - rec.createdAt,
        })
      }
    },
    injectUrgent: (_parentSessionId, line): void => {
      if (options.client?.session) {
        void sdkSendPromptAsync(options.client, _parentSessionId, { parts: [{ type: "text", text: line }], noReply: true })
      }
    },
    onFirstActionDeadline: (delegationId, elapsedSeconds) => coordinatorRef?.markExecutionUnconfirmed(delegationId, elapsedSeconds),
  })
  const retryHandler = new DelegationRetryHandler({ persist: options.persistDelegations })
  const periodicNotifier = new PeriodicNotifier(
    {
      cadenceMs: 30_000,
      batchWindowMs: 2_000,
      showToast: true,
      client: options.client,
    },
    (parentSessionId: string, line: string): void => {
      if (options.client?.session) {
        void sdkSendPromptAsync(options.client, parentSessionId, { parts: [{ type: "text", text: line }], noReply: true })
      }
    },
  )
  periodicNotifierRef = periodicNotifier
  const childSessionStarter = typeof options.client?.session === "object"
    ? createSdkChildSessionStarter(options.client)
    : undefined
  const coordinator = new DelegationCoordinator({ childSessionStarter, dispatcher, monitor, notificationRouter, lifecycle, detector, retryHandler, periodicNotifier, onChildSessionCreated: options.onChildSessionCreated, client: options.client })
  coordinatorRef = coordinator
  const delegationManager = new DelegationManager(options.enableRuntimeAdapter ? options.client : undefined, {
    coordinator,
    lifecycle,
    monitor,
    notificationRouter,
    ptyManager: options.ptyManager,
    runtimePolicy: options.runtimePolicy,
    sendPromptAsync: (sessionId, prompt) => sdkSendPromptAsync(options.client, sessionId, {
      parts: [{ type: "text", text: prompt }],
    }),
  })
  return { coordinator, delegationManager, detector, lifecycle, notificationRouter, periodicNotifier, slotManager, monitor }
}

export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const projectDirectory = directory ?? process.cwd()

  // Startup diagnostic: confirm plugin loaded by logging to OpenCode app log.
  void client?.app?.log?.({
    body: {
      service: "hivemind",
      level: "info",
      message: "[Harness] Hivemind plugin loaded — registering 23 custom tools",
    },
  })

  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
  // Load Hivemind configs — lazy-cached for downstream consumers.
  // Failure gracefully falls back to defaults (never crashes plugin init).
  const hivemindConfig: HivemindConfigs = getConfig(projectDirectory)
  const ptyManager = await createPtyManagerIfSupported()

  // Session tracker: typed owning module for session knowledge capture.
  // Created before delegation modules so it can wire into child session creation
  // for delegate-task SDK-dispatched sessions.
  const sessionTracker = new SessionTracker({ client, projectRoot: projectDirectory })

  // REQ-01: Construct critical deps SYNCHRONOUSLY before delegation wiring
  // so onChildSessionCreated callbacks find eventCapture already available.
  sessionTracker.constructCoreDependencies()

  const delegationModules = setupDelegationModules({
    client,
    enableRuntimeAdapter: true,
    projectDirectory,
    ptyManager,
    runtimePolicy,
    onChildSessionCreated: (childSessionId, _parentSessionId) => {
      void sessionTracker.handleSessionEvent({ eventType: "session.created", sessionID: childSessionId, event: {} })
    },
  })
  const delegationManager = delegationModules.delegationManager
  const monitor = delegationModules.monitor
  // Recovery runs asynchronously — must not block plugin init.
  // If a second OpenCode instance starts, recoverPending() would await SDK calls
  // for sessions that belong to the first instance, causing a hang.
  void delegationManager.recoverPending()

  // Session tracker: typed owning module for session knowledge capture.
  // Wired via deps injection (D-01) — matches DelegationManager instantiation pattern.

  const lifecycleManager = createHarnessLifecycleManager({
    client,
    pollTimeoutMs: WATCH_TIMEOUT_MS,
    runtimePolicy,
    delegationManager,
  })
  lifecycleManager.hydrateFromContinuity()

  // Init-time pending notification drain — replays notifications queued
  // while the parent session was ended. Best-effort: does not block plugin init.
  // This runs AFTER hydrateFromContinuity so continuity records are available,
  // but fires-and-forgets so it never blocks the plugin.
  void replayPendingDelegationNotifications(client)

  // Phase 36.1 R-COMPLETION-DETECTOR-05: complete the dual-signal completion
  // wiring. The lifecycle manager *owns* the CompletionDetector (it receives
  // session.idle/error/deleted events from handleEvent), and the SDK
  // delegation polling loop *consumes* cached terminal signals + feeds
  // message counts back in. This setter call closes the dependency loop
  // without forcing the constructor order to change (DelegationManager must
  // exist before the lifecycle manager because the latter takes the former
  // as an arg).
  delegationManager.setCompletionDetector(lifecycleManager.getCompletionDetector())

  // Initialize session tracker (reads project-continuity.json, creates writers).
  // Fire-and-forget: must not block plugin init.
  void sessionTracker.initialize().catch((err) => {
    void client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: "[Harness] Session tracker: initialization failed",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  })

  // One-shot migration: remove legacy .hivemind/event-tracker/ (CP-ST-03 D-03)
  void (async () => {
    const sentinelPath = join(projectDirectory, ".hivemind", "state", "event-tracker-migration-done")
    const legacyDir = join(projectDirectory, ".hivemind", "event-tracker")
    try {
      if (existsSync(sentinelPath)) return
      if (existsSync(legacyDir)) {
        rmSync(legacyDir, { recursive: true, force: true })
        const stateDir = join(projectDirectory, ".hivemind", "state")
        if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
        writeFileSync(sentinelPath, new Date().toISOString(), "utf-8")
        void client.app?.log?.({
          body: {
            service: "migration",
            level: "info",
            message: "[Harness] CP-ST-03: removed legacy .hivemind/event-tracker/",
          },
        })
      }
    } catch (err) {
      void client.app?.log?.({
        body: {
          service: "migration",
          level: "warn",
          message: "[Harness] CP-ST-03: legacy event-tracker migration failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  })()

  const sessionEntryObserverFactory = createSessionEntryEventObserver()
  const sessionIsMainObserverFactory = createSessionIsMainObserver()

  const deps = { client, lifecycleManager, stateManager: taskState, runAutoLoop, runRalphLoop, escalationMessage, getIntake: sessionEntryObserverFactory.getIntake, hivemindConfig, getFreshHivemindConfig: () => getFreshConfig(projectDirectory), getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory), isMainSession: sessionIsMainObserverFactory.isMainSession }
  const sessionHooks = createSessionHooks(deps)
  const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks
  const delegationEventObserver = createDelegationEventObserver()
  // Observer consumers: pass-through wrappers extracted to dedicated hook modules (CP-ST-03-02).
  // Each factory receives its dependencies via injection — zero business logic in plugin.ts.
  const consumeSessionEntryFact = createSessionEntryConsumer(sessionEntryObserverFactory.observer)
  const consumeIsMainSessionFact = createSessionMainConsumer(sessionIsMainObserverFactory.observer)
  const consumeDelegationFact = createDelegationConsumer({
    observer: delegationEventObserver,
    handleSessionError: delegationManager.handleSessionError.bind(delegationManager),
    handleSessionIdle: delegationManager.handleSessionIdle.bind(delegationManager),
    handleSessionDeleted: delegationManager.handleSessionDeleted.bind(delegationManager),
  })
  const consumeSessionTrackerFact = createSessionTrackerConsumer({
    sessionTracker,
    logWarn: (msg: string, err: unknown) => {
      void client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: msg,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    },
  })

  const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy, hivemindConfig })

  return {
    config: async () => {},
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact, async ({ event }: { event?: unknown }) => {
        if (event && typeof event === "object") {
          const lmc = sessionTracker.getLastMessageCapture()
          lmc?.handleEvent(event as Record<string, unknown>)
        }
      }],
    }),
    ...sessionReadHooks,
    // tool.execute.before: combined guard + session-tracker detection.
    // Detects task tool dispatch for proactive child session discovery (CP-ST-02).
    // Runs circuit breaker + budget guard first, then registers pending entry
    // and starts fire-and-forget polling. Best-effort — never blocks tool execution.
    "tool.execute.before": createToolBeforeGuard({
      toolGuardHook: toolGuardHooks["tool.execute.before"] as (input: unknown, output: unknown) => Promise<void>,
      sessionTracker,
      logWarn: (msg: string, err: unknown) => {
        void client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: msg,
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      },
    }),
    // chat.message: session tracker captures messages and delegation observes child output.
    // Best-effort — never blocks the OpenCode runtime.
    "chat.message": async (input: unknown, output: unknown): Promise<void> => {
      const childSessionId = extractHookSessionId(input)
      if (childSessionId) delegationManager.recordChildMessageSignal(childSessionId, extractAssistantExcerpt(input, output))
      await createChatMessageCapture({
        sessionTracker,
        logWarn: (msg: string, err: unknown) => {
  void client?.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: msg,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        },
      })(input, output)
    },
    tool: {
      "delegate-task": createDelegateTaskTool(delegationManager, hivemindConfig),
      "delegation-status": createDelegationStatusTool(delegationManager, {
        getChildMessageCount: (sessionId) => getSessionMessageCount(client, sessionId),
        terminateChild: (sessionId) => abortSession(client, sessionId),
        getEscalationLevel: (delegationId) => monitor.getEscalationLevel(delegationId),
        projectRoot: projectDirectory,
      }),
      "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
      "prompt-skim": createPromptSkimTool(projectDirectory),
      "prompt-analyze": createPromptAnalyzeTool(projectDirectory),
      "session-patch": createSessionPatchTool(projectDirectory),
      "execute-slash-command": createExecuteSlashCommandTool(client, sessionTracker),
      "session-journal-export": createSessionJournalExportTool(),
      "hivemind-doc": createHivemindDocTool(projectDirectory),
      "hivemind-trajectory": createHivemindTrajectoryTool(projectDirectory),
      "hivemind-pressure": createHivemindPressureTool(projectDirectory),
      "hivemind-sdk-supervisor": createHivemindSdkSupervisorTool(),
      "hivemind-command-engine": createHivemindCommandEngineTool(projectDirectory),
      "session-tracker": createSessionTrackerTool(projectDirectory),
      "session-hierarchy": createSessionHierarchyTool(projectDirectory),
      "session-context": createSessionContextTool(projectDirectory),
      "hivemind-session-view": createHivemindSessionViewTool(projectDirectory),
      "hivemind-agent-work-create": createHivemindAgentWorkCreateTool(projectDirectory),
      "hivemind-agent-work-export": createHivemindAgentWorkExportTool(projectDirectory),
      "configure-primitive": createConfigurePrimitiveTool(),
      "validate-restart": createValidateRestartTool(),
      "bootstrap-init": createBootstrapInitTool(),
      "bootstrap-recover": createBootstrapRecoverTool(),
      "create-governance-session": createGovernanceSessionTool(client),
    },
    // Auto-persist workflow state after configure-primitive calls with workflow params.
    // Best-effort: failures are silently ignored — does not affect the tool call result.
    "tool.execute.after": async (
      input: { tool: string; sessionID?: string; callID?: string; args?: Record<string, unknown> },
      _output?: { metadata?: unknown; [key: string]: unknown } | string,
    ): Promise<void> => {
      const fact = await createToolExecuteAfterHook({
        toolGuardAfterHook: toolGuardHooks["tool.execute.after"],
        summarizeOutput: summarizePluginToolOutput,
      })(input, _output)
      void fact // consumed by guard hooks above; session tracker uses raw input
      const childSessionId = extractHookSessionId(input)
      if (childSessionId) delegationManager.recordChildToolSignal(childSessionId)

      try {
        // Session tracker: capture tool metadata (skill, read, task, etc.)
        // Uses raw hook input/output for accurate metadata, not the projected fact.
        await sessionTracker.handleToolExecuteAfter(
          input as Parameters<typeof sessionTracker.handleToolExecuteAfter>[0],
          (_output ?? {}) as Parameters<typeof sessionTracker.handleToolExecuteAfter>[1],
        )
      } catch {
        // Best-effort: never fail the tool call.
      }

      await createToolAfterWorkflow({})(input, _output)
    },
  }
}

/**
 * Drain pending delegation notifications from ALL continuity records
 * and replay them into the TUI via appendTuiPrompt. Called at plugin init
 * to recover notifications that were queued while the parent session was ended.
 *
 * Best-effort: failures during replay are silently ignored — the continuity
 * array is cleared regardless to prevent duplicate replay on next init.
 *
 * Double-notification prevention: the lifecycle handler already calls
 * patchSessionContinuity(sessionID, { pendingNotifications: [] }) during
 * session.created/session.updated events. The init-time drain also clears
 * after replay. Since both use patchSessionContinuity to write and
 * listSessionContinuity to read fresh data each time, whichever runs first
 * clears the array and the other sees empty. No duplicate notifications.
 *
 * @param client - OpenCode SDK client for TUI operations.
 */
export async function replayPendingDelegationNotifications(client: OpenCodeClient): Promise<void> {
  const allSessions = listSessionContinuity()
  for (const record of Object.values(allSessions)) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue
    const sessionId = record.sessionID
    if (!sessionId) continue
    for (const notification of pending) {
      const line = notification.resultPreview ??
        `Delegation ${notification.metadata?.delegationId ?? "unknown"} ${notification.status}`
      try {
        await appendTuiPrompt(client, line)
      } catch {
        break  // best-effort: stop replay on first failure
      }
    }
    patchSessionContinuity(sessionId, { pendingNotifications: [] })
  }
}

export default { server: HarnessControlPlane }
