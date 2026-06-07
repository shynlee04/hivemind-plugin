/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
import type { Plugin } from "@opencode-ai/plugin"
import { join } from "node:path"

import { createHarnessLifecycleManager } from "./task-management/lifecycle/index.js"

import { taskState } from "./shared/state.js"
import { createCoreHooks } from "./hooks/lifecycle/core-hooks.js"
import { createSessionHooks } from "./hooks/lifecycle/session-hooks.js"
import { createToolGuardHooks } from "./hooks/guards/tool-guard-hooks.js"
import { createDelegationEventObserver, createSessionEntryEventObserver, createSessionIsMainObserver } from "./hooks/observers/event-observers.js"
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
import { createPaneMonitorHook } from "./hooks/pane-monitor.js"
import { tmuxStateQueryTool } from "./tools/tmux-state-query.js"
import { tmuxCopilotTool } from "./tools/tmux-copilot.js"
import { createHivemindSteerTool } from "./tools/hivemind/hivemind-steer.js"
import { loadRuntimePolicy } from "./shared/runtime-policy.js"
import { resolveWorkspaceRuntimePolicy } from "./shared/workspace-runtime-policy.js"
import { runAutoLoop } from "./coordination/spawner/auto-loop.js"
import { runRalphLoop, escalationMessage } from "./coordination/spawner/ralph-loop.js"
import { SessionTracker } from "./features/session-tracker/index.js"
import { getConfig, getFreshConfig } from "./config/subscriber.js"
import { createSidecarServer } from "./sidecar/server/factory.js"
import { SidecarDependencyRegistry } from "./sidecar/server/registry.js"
import { SseConnectionPool } from "./sidecar/server/sse/pool.js"
import { createStateRoutes } from "./sidecar/server/routes/state.js"
import { createToolsRoutes } from "./sidecar/server/routes/tools.js"
import { createCatalogRoutes } from "./sidecar/server/routes/catalog.js"
import { createEventsRoute } from "./sidecar/server/routes/events.js"
import type { Route } from "./sidecar/server/handler.js"
import { resolveBehavioralProfile } from "./routing/behavioral-profile/resolve-behavioral-profile.js"
import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"

// Registration helpers & delegation module setup (split from plugin.ts for LOC budget)
import {
  WATCH_TIMEOUT_MS,
  buildInTreeSessionManager,
  extractHookSessionId,
  extractAssistantExcerpt,
  setupDelegationModules,
  registerDelegationTools,
  registerSessionTools,
  registerHivemindTools,
  registerConfigTools,
  buildTuiTmuxLogger,
  wireTmuxPromptAndMessages,
  emitTmuxStatusBanner,
  createJournalObserver,
} from "./plugin-registration.js"

// One-shot migration & replay functions (split from plugin.ts for LOC budget)
import {
  migrateLegacyEventTracker,
  migrateLegacyDelegationsJson,
  replayPendingDelegationNotifications,
} from "./one-shot-migrations.js"

// ---------------------------------------------------------------------------
// Backward-compat re-exports — preserve public API surface
// ---------------------------------------------------------------------------
export {
  WATCH_TIMEOUT_MS,
  registerDelegationTools,
  registerSessionTools,
  registerHivemindTools,
  registerConfigTools,
  shouldAppendParentTuiNotification,
  buildInTreeSessionManager,
  extractHookSessionId,
  extractAssistantExcerpt,
  persistPendingDelegationNotifications,
  buildTuiTmuxLogger,
  setupDelegationModules,
  wireTmuxPromptAndMessages,
  emitTmuxStatusBanner,
  createJournalObserver,
} from "./plugin-registration.js"

export type {
  DelegationToolDeps,
  SessionToolDeps,
  HivemindToolDeps,
  ConfigToolDeps,
  DelegationModuleSetupOptions,
  DelegationModuleSetup,
} from "./plugin-registration.js"

export {
  migrateLegacyEventTracker,
  migrateLegacyDelegationsJson,
  replayPendingDelegationNotifications,
} from "./one-shot-migrations.js"

// ---------------------------------------------------------------------------
// Plugin composition root
// ---------------------------------------------------------------------------

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

  // P59 R2+R5: wire module-level sendPrompt and getSessionMessages for tmux-copilot.
  wireTmuxPromptAndMessages(client)

  // Emit a single TUI-visible status line for the tmux subsystem.
  emitTmuxStatusBanner(client, tmuxIntegration, projectDirectory)

  // ── Step 5.5: Sidecar HTTP server ──────────────────────────────
  // Per D-SC01-03: server start failure must NOT block plugin init.
  const sidecarRegistry = new SidecarDependencyRegistry()
  const ssePool = new SseConnectionPool({})
  // Wire orphan SC-02 route factories (state, tools, catalog, events) into
  // the SidecarRouter. Handlers read dependencies from `sidecarRegistry` at
  // request time, so they may be registered before the registry is fully
  // populated (see `sidecarRegistry.setX(...)` calls below).
  // NOTE: `createSessionsRoutes` is intentionally skipped because it
  // duplicates every path in `createStateRoutes`.
  const sidecarRoutes: Route[] = [
    ...createStateRoutes(sidecarRegistry),
    ...createToolsRoutes(sidecarRegistry),
    ...createCatalogRoutes(sidecarRegistry),
    ...createEventsRoute({ registry: sidecarRegistry, ssePool }),
  ]
  let sidecarPort = 0
  try {
    const sidecar = await createSidecarServer({
      registry: sidecarRegistry,
      ssePool,
      projectDirectory,
      routes: sidecarRoutes,
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
    // S5b wire: thread `tmuxIntegration` into the delegation setup so
    // `DelegationCoordinator.spawnTmuxPanelForChild` reaches the real
    // adapter on every dispatch instead of silently no-oping on the
    // "unwired" branch. The factory at setupDelegationModules already
    // accepts this field (`DelegationModuleSetupOptions.tmuxIntegration`).
    tmuxIntegration,
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
  void migrateLegacyEventTracker(projectDirectory, client)

  // One-shot migration: remove legacy .hivemind/state/delegations.json and session-continuity.json (P41-D D-02, D-03)
  void migrateLegacyDelegationsJson(projectDirectory, client)

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

  // P58.9 REQ-58.9-01: wire the tmuxObserver into the SessionManager so the
  // startPolling tick emits pane-captured events. The adapter is the
  // SessionManagerAdapter (publishes onPaneCaptured to the observer chain);
  // the SessionManager calls observer.onPaneCaptured on every hash change.
  //
  // FIX: The adapter's onPaneCaptured is a no-op (integration.ts:429-434).
  // We replace it with a forwarder to the tmuxObserver so pane-captured
  // events actually reach registered listeners (e.g., pane-monitor hook).
  // Without this, events are silently dropped.
  if (tmuxIntegration?.sessionManager_ && typeof tmuxIntegration.sessionManager_.setObserver === "function") {
    tmuxIntegration.adapter.onPaneCaptured = (event) => {
      void tmuxObserver({ event })
    }
    tmuxIntegration.sessionManager_.setObserver(tmuxIntegration.adapter)
  }

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
      }, tmuxObserver, createJournalObserver(projectDirectory)],
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
      // Steering tool: injects a noReply:true context message into the
      // active (busy) session for mid-flight redirect. Backed by the
      // `sendPromptAsync` SDK wrapper in shared/session-api.ts.
      "hivemind-steer": createHivemindSteerTool(client),
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

export default { server: HarnessControlPlane }
