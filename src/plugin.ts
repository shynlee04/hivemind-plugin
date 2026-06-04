/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin/tool"
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
import { createSdkChildSessionStarter } from "./coordination/delegation/sdk-child-session-starter.js"
import { SlotManager } from "./coordination/delegation/slot-manager.js"
import { DelegationStateMachine } from "./coordination/delegation/state-machine.js"

import type { Delegation, DelegationNotificationType } from "./coordination/delegation/types.js"
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
import { getActiveContractByAgent } from "./features/agent-work-contracts/store.js"
import { getDelegationMeta } from "./shared/state.js"
import { createChatMessageCapture } from "./hooks/transforms/chat-message-capture.js"
import { createToolAfterWorkflow } from "./hooks/transforms/tool-after-workflow.js"
import { createSessionEntryConsumer } from "./hooks/observers/session-entry-consumer.js"
import { createSessionMainConsumer } from "./hooks/observers/session-main-consumer.js"
import { createDelegationConsumer } from "./hooks/observers/delegation-consumer.js"
import { createSessionTrackerConsumer } from "./hooks/observers/session-tracker-consumer.js"
import { summarizePluginToolOutput } from "./shared/plugin-tool-output-summary.js"
import { createPtyManagerIfSupported } from "./features/background-command/pty/pty-runtime.js"
import { createTmuxIntegrationIfSupported } from "./features/tmux/integration.js"
import { createTmuxEventObserver } from "./features/tmux/observers.js"
import type { ForkSessionManager } from "./features/tmux/observers.js"
import { createPaneMonitorHook } from "./hooks/pane-monitor.js"
import { tmuxStateQueryTool } from "./tools/tmux-state-query.js"
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
import { createSessionDelegationQueryTool } from "./tools/session/session-delegation-query.js"
import { createHivemindSessionViewTool } from "./tools/hivemind/hivemind-session-view.js"
import { tmuxCopilotTool } from "./tools/tmux-copilot.js"
import { loadRuntimePolicy } from "./shared/runtime-policy.js"
import { resolveWorkspaceRuntimePolicy } from "./shared/workspace-runtime-policy.js"
import { runAutoLoop } from "./coordination/spawner/auto-loop.js"
import { runRalphLoop, escalationMessage } from "./coordination/spawner/ralph-loop.js"
import { SessionTracker } from "./features/session-tracker/index.js"
import { getManualOverrideState } from "./features/session-tracker/index.js"
import { getConfig, getFreshConfig } from "./config/subscriber.js"
import { createSidecarServer } from "./sidecar/server/factory.js"
import { SidecarDependencyRegistry } from "./sidecar/server/registry.js"
import { SseConnectionPool } from "./sidecar/server/sse/pool.js"
import { resolveBehavioralProfile } from "./routing/behavioral-profile/resolve-behavioral-profile.js"
import { getSessionContinuity, listSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./task-management/continuity/index.js"
import { enrichContinuityListWithTracker } from "./task-management/continuity/continuity-reader.js"
import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"
import type { RuntimePolicy } from "./shared/types.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

// ---------------------------------------------------------------------------
// Domain-specific dependency types
// ---------------------------------------------------------------------------

interface DelegationToolDeps {
  delegationManager: DelegationManager
  hivemindConfig: HivemindConfigs
  ptyManager: ReturnType<typeof createPtyManagerIfSupported> extends Promise<infer T> ? T : never
  tmuxIntegration?: Awaited<ReturnType<typeof createTmuxIntegrationIfSupported>>
  client: OpenCodeClient
  monitor: { getEscalationLevel: (id: string) => string | null }
  projectDirectory: string
}

interface SessionToolDeps {
  client: OpenCodeClient
  sessionTracker: SessionTracker
  projectDirectory: string
}

interface HivemindToolDeps {
  projectDirectory: string
}

interface ConfigToolDeps {
  projectDirectory: string
}

// ---------------------------------------------------------------------------
// Domain registration functions
// ---------------------------------------------------------------------------

/**
 * Register delegation-domain tools: delegate-task, delegation-status, run-background-command.
 *
 * @param deps - Delegation-specific dependencies.
 * @returns Record of 3 delegation tools.
 */
export function registerDelegationTools(deps: DelegationToolDeps): Record<string, ReturnType<typeof tool>> {
  return {
    "delegate-task": createDelegateTaskTool(deps.delegationManager, deps.hivemindConfig),
    "delegation-status": createDelegationStatusTool(deps.delegationManager, {
      getChildMessageCount: (sessionId) => getSessionMessageCount(deps.client, sessionId),
      terminateChild: (sessionId) => abortSession(deps.client, sessionId),
      getEscalationLevel: (delegationId) => deps.monitor.getEscalationLevel(delegationId),
      projectRoot: deps.projectDirectory,
    }),
    "run-background-command": createRunBackgroundCommandTool({ delegationManager: deps.delegationManager, ptyManager: deps.ptyManager }),
  }
}

/**
 * Register session-domain tools: execute-slash-command, session-patch, session-journal-export,
 * session-tracker, session-hierarchy, session-context, create-governance-session.
 *
 * @param deps - Session-specific dependencies.
 * @returns Record of 7 session tools.
 */
export function registerSessionTools(deps: SessionToolDeps): Record<string, ReturnType<typeof tool>> {
  return {
    "execute-slash-command": createExecuteSlashCommandTool(deps.client, deps.sessionTracker),
    "session-patch": createSessionPatchTool(deps.projectDirectory),
    "session-journal-export": createSessionJournalExportTool(),
    "session-tracker": createSessionTrackerTool(deps.projectDirectory),
    "session-hierarchy": createSessionHierarchyTool(deps.projectDirectory),
    "session-context": createSessionContextTool(deps.projectDirectory),
    "create-governance-session": createGovernanceSessionTool(deps.client),
  }
}

/**
 * Register hivemind-domain tools: hivemind-doc, hivemind-trajectory, hivemind-pressure,
 * hivemind-sdk-supervisor, hivemind-command-engine, hivemind-session-view,
 * hivemind-agent-work-create, hivemind-agent-work-export.
 *
 * @param deps - Hivemind-specific dependencies.
 * @returns Record of 8 hivemind tools.
 */
export function registerHivemindTools(deps: HivemindToolDeps): Record<string, ReturnType<typeof tool>> {
  return {
    "hivemind-doc": createHivemindDocTool(deps.projectDirectory),
    "hivemind-trajectory": createHivemindTrajectoryTool(deps.projectDirectory),
    "hivemind-pressure": createHivemindPressureTool(deps.projectDirectory),
    "hivemind-sdk-supervisor": createHivemindSdkSupervisorTool(),
    "hivemind-command-engine": createHivemindCommandEngineTool(deps.projectDirectory),
    "hivemind-session-view": createHivemindSessionViewTool(deps.projectDirectory),
    "hivemind-agent-work-create": createHivemindAgentWorkCreateTool(deps.projectDirectory),
    "hivemind-agent-work-export": createHivemindAgentWorkExportTool(deps.projectDirectory),
    "session-delegation-query": createSessionDelegationQueryTool(deps.projectDirectory),
  }
}

/**
 * Register config-domain tools: configure-primitive, validate-restart,
 * bootstrap-init, bootstrap-recover, prompt-skim, prompt-analyze.
 *
 * @param deps - Config-specific dependencies.
 * @returns Record of 6 config tools.
 */
export function registerConfigTools(deps: ConfigToolDeps): Record<string, ReturnType<typeof tool>> {
  return {
    "configure-primitive": createConfigurePrimitiveTool(),
    "validate-restart": createValidateRestartTool(),
    "bootstrap-init": createBootstrapInitTool(),
    "bootstrap-recover": createBootstrapRecoverTool(),
    "prompt-skim": createPromptSkimTool(deps.projectDirectory),
    "prompt-analyze": createPromptAnalyzeTool(deps.projectDirectory),
  }
}

/** Return true only for notification types that should append to the parent TUI. */
function shouldAppendParentTuiNotification(type: DelegationNotificationType): boolean {
  return type === "success" || type === "failure" || type === "timeout";
}

/**
 * Build an in-tree ForkSessionManager for builds where the in-tree tmux
 * integration is not available (e.g. running outside a tmux session, or
 * the tmux binary is not installed). The observer enriches `session.created`
 * events with delegation metadata and dispatches them here; in this case
 * we discard the enriched event. Production builds (with tmux available)
 * construct a real `SessionManager` inside `createTmuxIntegrationIfSupported`
 * and publish the adapter via `setSessionManagerAdapter`; the plugin
 * entry then passes `tmuxIntegration.adapter` to the observer.
 *
 * Phase 43 (REQ-05): runtime-injection boundary.
 *
 * Phase 51 (REQ-51-06): the "no-op" path is now reached when the factory
 * returns `null` (silent fallback per D-04), not when the fork package is
 * absent. Same runtime shape, different trigger.
 */
function buildInTreeSessionManager(): ForkSessionManager {
  return {
    onSessionCreated: async (_enriched) => {
      // No-op when in-tree tmux integration is unavailable. The enriched
      // event still flows through the observer's metadata lookup pipeline
      // (delegationMeta, lastMessage capture, etc.) — only the dispatch
      // is a no-op.
    },
  };
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
  /**
   * P58.8 S1 (REQ-58-07): optional tmux integration result. When supplied,
   * the session manager reference is wired into DelegationManager so
   * `dispatch()` can start the capture-pane polling loop after spawning
   * a child session.
   */
  tmuxIntegration?: Awaited<ReturnType<typeof createTmuxIntegrationIfSupported>>
}

// ---------------------------------------------------------------------------
// TUI logger adapter for the tmux integration factory
// ---------------------------------------------------------------------------

/**
 * Build a `Logger` (the shape expected by `createTmuxIntegrationIfSupported`'s
 * `options.log` parameter) that forwards every call into the OpenCode TUI
 * `client.app.log` envelope. This makes the integration's silent-null
 * factory (`f4dd77ac` B3 fix) actually visible to the user — the factory's
 * `skip(reason)` calls now show up in the TUI log instead of being swallowed.
 *
 * The `info` and `warn` levels surface at "info" in the TUI; `debug` is
 * forwarded at "debug" (typically hidden by default in the OpenCode TUI
 * but visible in verbose mode). `error` is forwarded at "error".
 *
 * The returned logger is purely additive — if `client.app.log` is
 * unavailable (older OpenCode builds, or partial SDK), every call is a
 * safe no-op, preserving the factory's existing D-04 silent-fallback
 * contract.
 */
function buildTuiTmuxLogger(client: OpenCodeClient | undefined): {
  debug: (msg: string, data?: unknown) => void
  info: (msg: string, data?: unknown) => void
  warn: (msg: string, data?: unknown) => void
  error: (msg: string, data?: unknown) => void
} {
  return {
    debug: (msg, data) => {
      void client?.app?.log?.({
        body: { service: "tmux-integration", level: "debug", message: msg, extra: data as Record<string, unknown> | undefined },
      })
    },
    info: (msg, data) => {
      void client?.app?.log?.({
        body: { service: "tmux-integration", level: "info", message: msg, extra: data as Record<string, unknown> | undefined },
      })
    },
    warn: (msg, data) => {
      void client?.app?.log?.({
        body: { service: "tmux-integration", level: "warn", message: msg, extra: data as Record<string, unknown> | undefined },
      })
    },
    error: (msg, data) => {
      void client?.app?.log?.({
        body: { service: "tmux-integration", level: "error", message: msg, extra: data as Record<string, unknown> | undefined },
      })
    },
  }
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
  // Single shared state machine — backs both v2 coordinator (via DelegationLifecycle)
  // and v1 runtime adapter (passed through the facade to RuntimeDelegationManager).
  const stateMachine = new DelegationStateMachine({ client: options.client })
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
  const lifecycle = new DelegationLifecycle(stateMachine)
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
  const coordinator = new DelegationCoordinator({ childSessionStarter, dispatcher, monitor, notificationRouter, lifecycle, detector, periodicNotifier, onChildSessionCreated: options.onChildSessionCreated, client: options.client, sessionManager: options.tmuxIntegration?.sessionManager_ })
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
    stateMachine,
    // P58.8 S1 (REQ-58-07): wire the session manager so dispatch() can
    // start the capture-pane polling loop after spawning a child session.
    // The adapter satisfies the G3 historical sessionManager shape
    // (persist + respawnIfKnown) and adds startPolling for S1.
    sessionManager: options.tmuxIntegration?.sessionManager_
      ? {
          persist: (record) => options.tmuxIntegration!.sessionManager_!.persist(record),
          respawnIfKnown: (sessionId) => options.tmuxIntegration!.sessionManager_!.respawnIfKnown(sessionId),
          startPolling: (intervalMs) => options.tmuxIntegration!.sessionManager_!.startPolling(intervalMs),
        }
      : undefined,
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
      message: "[Harness] Hivemind plugin loaded — registering 26 custom tools",
    },
  })

  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
  // Load Hivemind configs — lazy-cached for downstream consumers.
  // Failure gracefully falls back to defaults (never crashes plugin init).
  const hivemindConfig: HivemindConfigs = getConfig(projectDirectory)
  const ptyManager = await createPtyManagerIfSupported()

  // Tmux integration: optional visual orchestration layer.
  //
  // The integration auto-detects the opencode server URL by reading
  // `opencode.json` for `server.port`, then falls back to the persisted
  // port in `.hivemind/state/tmux-port.json`, then to a deterministic
  // hash-derived port. For "just works" behavior, add to `opencode.json`:
  //   "server": { "port": 4096 }
  // matching the port your opencode server listens on (default: 4096).
  //
  // See .planning/phases/42-tmux-visual-orchestration-layer-fork-extension/42-RESEARCH.md
  // for the auto-init rationale (in-plugin server-mode bootstrap is
  // impossible — plugin runs inside an already-started opencode process).
  //
  // We pass a TUI logger so the integration's silent-null factory emits
  // a user-visible message in the OpenCode TUI log instead of failing
  // silently. After the factory call we emit a single ENABLED / DISABLED
  // banner so the user immediately knows whether sub-agents will spawn
  // visible tmux panes.
  const tmuxIntegration = await createTmuxIntegrationIfSupported(projectDirectory, {
    log: buildTuiTmuxLogger(client),
  })

  // Emit a single TUI-visible status line for the tmux subsystem. This
  // is the one line the user will look for in the OpenCode TUI log
  // ("/harness: tmux ENABLED" or "/harness: tmux DISABLED — <reason>").
  if (tmuxIntegration) {
    void client?.app?.log?.({
      body: {
        service: "hivemind",
        level: "info",
        message:
          `[Harness] Tmux visual orchestration: ENABLED ` +
          `(${tmuxIntegration.version ?? "unknown version"}, ` +
          `server=${tmuxIntegration.serverUrl ?? "auto-detect"}, ` +
          `binary=${tmuxIntegration.binaryPath ?? "n/a"}) — ` +
          `sub-agents will spawn in tmux panes`,
        extra: {
          tmuxVersion: tmuxIntegration.version,
          opencodeBinary: tmuxIntegration.opencodeBinaryPath,
          serverUrl: tmuxIntegration.serverUrl,
          projectDirectory,
        },
      },
    })
  } else {
    // The factory already logged the precise reason via buildTuiTmuxLogger
    // (info-level on success, debug-level on skip — the latter is silent
    // in the TUI). Emit a single user-facing banner so they at least
    // know the visual layer is off, and what to do.
    void client?.app?.log?.({
      body: {
        service: "hivemind",
        level: "info",
        message:
          `[Harness] Tmux visual orchestration: DISABLED — ` +
          `sub-agents will run inline (no tmux panes). ` +
          `To enable: run opencode inside a tmux session with ` +
          `'opencode --port 4096' and add "server": { "port": 4096 } ` +
          `to opencode.json.`,
        extra: { projectDirectory, hasTmux: Boolean(process.env.TMUX) },
      },
    })
  }

  // ── Step 5.5: Sidecar HTTP server ──────────────────────────────
  // Per D-SC01-03: server start failure must NOT block plugin init.
  const sidecarRegistry = new SidecarDependencyRegistry()
  const ssePool = new SseConnectionPool({})
  let sidecarPort = 0
  try {
    const sidecar = await createSidecarServer({
      registry: sidecarRegistry,
      ssePool,
      projectDirectory,
    })
    sidecarPort = sidecar.port
  } catch (err) {
    void client?.app?.log?.({
      body: {
        service: "sidecar",
        level: "warn",
        message: "[Harness] Sidecar: server start failed — continuing without sidecar",
        extra: { error: err instanceof Error ? err.message : String(err) },
      },
    })
  }

  // Suppress unused-variable warning — port will be consumed by Next.js sidecar in SC-03.
  void sidecarPort

  // Bind client to sidecar registry (always available — plugin parameter).
  try { sidecarRegistry.setClient(client) } catch { /* skip — sidecar may not have started */ }

  // Phase 43 (REQ-05): factory-level wiring lands here in the fork's plugin
  // entry, where a real SessionManager is constructed. In the in-tree
  // build (Phase 51), the factory itself constructs the real SessionManager
  // and publishes the adapter via `setSessionManagerAdapter` (a
  // module-level slot in `features/tmux/types.ts`). The observer
  // receives the real adapter (`tmuxIntegration.adapter`) or a no-op
  // stub if tmux is unavailable.

  // Session tracker: typed owning module for session knowledge capture.
  // Created before delegation modules so it can wire into child session creation
  // for delegate-task SDK-dispatched sessions.
  const sessionTracker = new SessionTracker({ client, projectRoot: projectDirectory })

  // Bind session tracker to sidecar registry (non-blocking — best-effort).
  try { sidecarRegistry.setSessionTracker(sessionTracker) } catch { /* skip — sidecar may not have started */ }

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

  // Bind delegation manager to sidecar registry (non-blocking — best-effort).
  try { sidecarRegistry.setDelegationManager(delegationManager) } catch { /* skip — sidecar may not have started */ }

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
  void replayPendingDelegationNotifications(client, projectDirectory)

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

  // One-shot migration: remove legacy .hivemind/state/delegations.json and session-continuity.json (P41-D D-02, D-03)
  void (async () => {
    const sentinelPath = join(projectDirectory, ".hivemind", "state", "delegations-migration-done")
    const delegationsPath = join(projectDirectory, ".hivemind", "state", "delegations.json")
    const continuityPath = join(projectDirectory, ".hivemind", "state", "session-continuity.json")
    try {
      if (existsSync(sentinelPath)) return
      let deletedAny = false
      if (existsSync(delegationsPath)) {
        rmSync(delegationsPath, { force: true })
        deletedAny = true
      }
      if (existsSync(continuityPath)) {
        rmSync(continuityPath, { force: true })
        deletedAny = true
      }
      if (deletedAny) {
        const stateDir = join(projectDirectory, ".hivemind", "state")
        if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
        writeFileSync(sentinelPath, new Date().toISOString(), "utf-8")
        void client.app?.log?.({
          body: {
            service: "migration",
            level: "info",
            message: "[Harness] P41-D: removed legacy .hivemind/state/delegations.json and session-continuity.json",
          },
        })
      }
    } catch (err) {
      void client.app?.log?.({
        body: {
          service: "migration",
          level: "warn",
          message: "[Harness] P41-D: legacy file migration failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  })()

  const sessionEntryObserverFactory = createSessionEntryEventObserver(projectDirectory)
  const sessionIsMainObserverFactory = createSessionIsMainObserver()

  const deps = { client, lifecycleManager, stateManager: taskState, runAutoLoop, runRalphLoop, escalationMessage, getIntake: sessionEntryObserverFactory.getIntake, hivemindConfig, getFreshHivemindConfig: () => getFreshConfig(projectDirectory), getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory), isMainSession: sessionIsMainObserverFactory.isMainSession, projectDirectory }
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

  const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy, hivemindConfig, projectRoot: projectDirectory })

  // P53: bind the tmux observer in a const so the pane-monitor hook can
  // subscribe to the SAME instance (consistency: pane-captured events from
  // this observer trigger the hook; the observer is also added to the
  // eventObservers array below for session.created forwarding).
  const tmuxObserver = tmuxIntegration
    ? createTmuxEventObserver(tmuxIntegration.adapter)
    : createTmuxEventObserver(buildInTreeSessionManager())

  // P53: pane-monitor hook consumes pane-captured events and persists
  // them as 7-field JSON entries under .hivemind/journal/<sid>/. The
  // handle is retained (closure-captured retry timers must not be GC'd)
  // for the lifetime of the plugin instance.
  const paneMonitorHook = createPaneMonitorHook({
    sessionId: "harness",
    observer: tmuxObserver,
    journalRoot: join(projectDirectory, ".hivemind/journal"),
    logWarn: (msg: string, err?: unknown) => {
      void client.app?.log?.({
        body: {
          service: "pane-monitor",
          level: "warn",
          message: msg,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    },
  })
  // Touch the handle to keep the closure-captured retry timers alive.
  // Without this reference the GC may collect the hook mid-session.
  void paneMonitorHook

  return {
    config: async () => {},
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact, async ({ event }: { event?: unknown }) => {
        if (event && typeof event === "object") {
          const lmc = sessionTracker.getLastMessageCapture()
          lmc?.handleEvent(event as Record<string, unknown>)
        }
      }, tmuxObserver],
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
      // Contract enforcement: third step in guard chain (P25.5 D-06)
      contractEnforcement: {
        getActiveContractByAgent,
        resolveAgentName: (sessionID: string) => {
          const meta = getDelegationMeta(sessionID)
          return meta?.agent
        },
        projectRoot: projectDirectory,
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
      ...registerDelegationTools({
        delegationManager,
        hivemindConfig,
        ptyManager,
        client,
        monitor,
        projectDirectory,
      }),
      ...registerSessionTools({
        client,
        sessionTracker,
        projectDirectory,
      }),
      ...registerHivemindTools({
        projectDirectory,
      }),
      ...registerConfigTools({
        projectDirectory,
      }),
      // Phase 49 (REQ-04): wire the pre-constructed tmuxCopilotTool directly
      // into the plugin tool spread. It is exported as a `tool()` instance
      // (not a factory) so it requires no per-call dependency plumbing.
      "tmux-copilot": tmuxCopilotTool,
      // Phase 52 (REQ-04, REQ-05): read-only session metadata tool for the
      // observability layer. Same orchestrator-tier permission gate pattern
      // as tmux-copilot.ts.
      "tmux-state-query": tmuxStateQueryTool,
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
export async function replayPendingDelegationNotifications(client: OpenCodeClient, projectDirectory?: string): Promise<void> {
  const allSessions = listSessionContinuity()
  const sessionRecords = projectDirectory
    ? await enrichContinuityListWithTracker(Object.values(allSessions), projectDirectory)
    : Object.values(allSessions)
  for (const record of sessionRecords) {
    const pending = record.metadata.pendingNotifications ?? []
    if (pending.length === 0) continue
    const sessionId = record.sessionID
    if (!sessionId) continue
    for (const notification of pending) {
      // P58 (G5, REQ-58-05, D-58-11): respect manualOverride flag — if a human
      // operator has taken over the session, do NOT auto-inject orchestrator
      // notifications. The sessionId is the parent session that owns the
      // notification; if a take-over was issued, suppress the replay.
      const overrideState = getManualOverrideState(sessionId)
      if (overrideState?.manualOverride === true) {
        continue
      }
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
