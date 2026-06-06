/**
 * Tool registration functions, delegation module factory, and shared helpers.
 *
 * This module owns the "plumbing" layer that sits between the composition
 * root (`plugin.ts`) and the individual tool/hook implementations:
 *
 * - **Tool registration** — `registerDelegationTools`, `registerSessionTools`,
 *   `registerHivemindTools`, `registerConfigTools` build tool maps from deps.
 * - **Delegation wiring** — `setupDelegationModules` constructs the full v2
 *   delegation sub-system (state-machine, coordinator, monitor, etc.).
 * - **Helpers** — session-id extraction, TUI notification predicates, the
 *   in-tree session manager fallback, and pending-notification persistence.
 *
 * @module plugin-registration
 */

import { tool } from "@opencode-ai/plugin/tool"

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
import { getSessionMessageCount, abortSession, sendPromptAsync as sdkSendPromptAsync, type OpenCodeClient } from "./shared/session-api.js"
import { asString, getNestedValue } from "./shared/helpers.js"
import type { PendingNotification } from "./shared/types.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./task-management/continuity/index.js"
import { createPtyManagerIfSupported } from "./features/background-command/pty/pty-runtime.js"
import { createTmuxIntegrationIfSupported } from "./features/tmux/integration.js"
import type { ForkSessionManager } from "./features/tmux/observers.js"

import { createDelegateTaskTool } from "./tools/delegation/delegate-task.js"
import { createDelegationStatusTool } from "./tools/delegation/delegation-status.js"
import { createRunBackgroundCommandTool } from "./tools/hivemind/run-background-command.js"
import { createExecuteSlashCommandTool } from "./tools/session/execute-slash-command.js"
import { createSessionPatchTool } from "./tools/session/session-patch/index.js"
import { createSessionJournalExportTool } from "./tools/session/session-journal-export.js"
import { createSessionTrackerTool } from "./tools/session/session-tracker.js"
import { createSessionHierarchyTool } from "./tools/session/session-hierarchy.js"
import { createSessionContextTool } from "./tools/session/session-context.js"
import { createGovernanceSessionTool } from "./features/governance-engine/index.js"
import { createHivemindDocTool } from "./tools/hivemind/hivemind-doc.js"
import { createHivemindTrajectoryTool } from "./tools/hivemind/hivemind-trajectory.js"
import { createHivemindPressureTool } from "./tools/hivemind/hivemind-pressure.js"
import { createHivemindSdkSupervisorTool } from "./tools/hivemind/hivemind-sdk-supervisor.js"
import { createHivemindCommandEngineTool } from "./tools/hivemind/hivemind-command-engine.js"
import { createHivemindSessionViewTool } from "./tools/hivemind/hivemind-session-view.js"
import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "./tools/hivemind/hivemind-agent-work.js"
import { createSessionDelegationQueryTool } from "./tools/session/session-delegation-query.js"
import { createConfigurePrimitiveTool } from "./tools/config/configure-primitive.js"
import { createValidateRestartTool } from "./tools/config/validate-restart.js"
import { createBootstrapInitTool } from "./tools/config/bootstrap-init.js"
import { createBootstrapRecoverTool } from "./tools/config/bootstrap-recover.js"
import { createPromptSkimTool } from "./tools/prompt/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt/prompt-analyze/index.js"
import { SessionTracker } from "./features/session-tracker/index.js"

import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"
import type { RuntimePolicy } from "./shared/types.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Timeout for session lifecycle polling (30 minutes). */
export const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

// ---------------------------------------------------------------------------
// Domain-specific dependency types
// ---------------------------------------------------------------------------

export interface DelegationToolDeps {
  delegationManager: DelegationManager
  hivemindConfig: HivemindConfigs
  ptyManager: ReturnType<typeof createPtyManagerIfSupported> extends Promise<infer T> ? T : never
  tmuxIntegration?: Awaited<ReturnType<typeof createTmuxIntegrationIfSupported>>
  client: OpenCodeClient
  monitor: { getEscalationLevel: (id: string) => string | null }
  projectDirectory: string
}

export interface SessionToolDeps {
  client: OpenCodeClient
  sessionTracker: SessionTracker
  projectDirectory: string
}

export interface HivemindToolDeps {
  projectDirectory: string
}

export interface ConfigToolDeps {
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

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Return true only for notification types that should append to the parent TUI. */
export function shouldAppendParentTuiNotification(type: DelegationNotificationType): boolean {
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
export function buildInTreeSessionManager(): ForkSessionManager {
  return {
    onSessionCreated: async (_enriched) => {
      // No-op when in-tree tmux integration is unavailable. The enriched
      // event still flows through the observer's metadata lookup pipeline
      // (delegationMeta, lastMessage capture, etc.) — only the dispatch
      // is a no-op.
    },
  };
}

/**
 * Extract the session ID from a hook input object, checking multiple
 * known paths (`sessionID`, `sessionId`, nested `message.sessionID`).
 */
export function extractHookSessionId(input: unknown): string | undefined {
  return asString(getNestedValue(input, ["sessionID"]))
    ?? asString(getNestedValue(input, ["sessionId"]))
    ?? asString(getNestedValue(input, ["message", "sessionID"]))
    ?? asString(getNestedValue(input, ["message", "sessionId"]))
}

/** Extract a short assistant-content excerpt from a chat-message hook payload. */
export function extractAssistantExcerpt(input: unknown, output: unknown): string | undefined {
  const role = asString(getNestedValue(input, ["message", "role"])) ?? asString(getNestedValue(input, ["role"]))
  if (role && role !== "assistant") return undefined
  const text = asString(getNestedValue(output, ["text"]))
    ?? asString(getNestedValue(input, ["message", "content"]))
    ?? asString(getNestedValue(input, ["content"]))
  return text ? text.slice(0, 500) : undefined
}

// ---------------------------------------------------------------------------
// Pending-notification persistence
// ---------------------------------------------------------------------------

/**
 * Group raw delegation notifications by parent session and persist them into
 * the session continuity store. Used by `NotificationRouter` during delegation
 * lifecycle transitions.
 */
export function persistPendingDelegationNotifications(records: Array<{ notification: { delegationId: string; message: string; timestamp: number; type: string }; parentSessionId: string }>): void {
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

// ---------------------------------------------------------------------------
// Delegation module setup
// ---------------------------------------------------------------------------

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
export function buildTuiTmuxLogger(client: OpenCodeClient | undefined): {
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

// ---------------------------------------------------------------------------
// setupDelegationModules
// ---------------------------------------------------------------------------

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
  const coordinator = new DelegationCoordinator({ childSessionStarter, dispatcher, monitor, notificationRouter, lifecycle, detector, periodicNotifier, onChildSessionCreated: options.onChildSessionCreated, client: options.client, sessionManager: options.tmuxIntegration?.sessionManager_, tmuxIntegration: options.tmuxIntegration ? { adapter: options.tmuxIntegration.adapter } : undefined })
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
