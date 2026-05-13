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
import { DelegationManager } from "./coordination/delegation/manager.js"
import { taskState } from "./shared/state.js"
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
import { createSessionTrackerTool } from "./tools/hivemind/session-tracker.js"
import { createSessionHierarchyTool } from "./tools/hivemind/session-hierarchy.js"
import { createSessionContextTool } from "./tools/hivemind/session-context.js"
import { loadRuntimePolicy } from "./shared/runtime-policy.js"
import { resolveWorkspaceRuntimePolicy } from "./shared/workspace-runtime-policy.js"
import { runAutoLoop } from "./coordination/spawner/auto-loop.js"
import { runRalphLoop, escalationMessage } from "./coordination/spawner/ralph-loop.js"
import { SessionTracker } from "./features/session-tracker/index.js"
import { getConfig, getFreshConfig } from "./config/subscriber.js"
import { resolveBehavioralProfile } from "./routing/behavioral-profile/resolve-behavioral-profile.js"
import type { HivemindConfigs } from "./schema-kernel/hivemind-configs.schema.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const projectDirectory = directory ?? process.cwd()
  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
  // Load Hivemind configs — lazy-cached for downstream consumers.
  // Failure gracefully falls back to defaults (never crashes plugin init).
  const hivemindConfig: HivemindConfigs = getConfig(projectDirectory)
  const ptyManager = await createPtyManagerIfSupported()

  const delegationManager = new DelegationManager(client, { ptyManager, runtimePolicy })
  // Recovery runs asynchronously — must not block plugin init.
  // If a second OpenCode instance starts, recoverPending() would await SDK calls
  // for sessions that belong to the first instance, causing a hang.
  void delegationManager.recoverPending()

  // Session tracker: typed owning module for session knowledge capture.
  // Wired via deps injection (D-01) — matches DelegationManager instantiation pattern.
  const sessionTracker = new SessionTracker({ client, projectRoot: projectDirectory })

  const lifecycleManager = createHarnessLifecycleManager({
    client,
    pollTimeoutMs: WATCH_TIMEOUT_MS,
    runtimePolicy,
    delegationManager,
  })
  lifecycleManager.hydrateFromContinuity()

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
  void sessionTracker.initialize().then(() => {
    return sessionTracker.cleanup()
  }).catch((err) => {
    void client.app?.log?.({
      body: {
        service: "session-tracker",
        level: "warn",
        message: "[Harness] Session tracker: init+cleanup failed",
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
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeSessionTrackerFact, consumeSessionEntryFact, consumeIsMainSessionFact],
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
    // chat.message: session tracker captures user/assistant messages.
    // Best-effort — never blocks the OpenCode runtime.
    "chat.message": createChatMessageCapture({
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
    tool: {
      "delegate-task": createDelegateTaskTool(delegationManager),
      "delegation-status": createDelegationStatusTool(delegationManager),
      "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
      "prompt-skim": createPromptSkimTool(projectDirectory),
      "prompt-analyze": createPromptAnalyzeTool(projectDirectory),
      "session-patch": createSessionPatchTool(projectDirectory),
      "execute-slash-command": createExecuteSlashCommandTool(client),
      "session-journal-export": createSessionJournalExportTool(),
      "hivemind-doc": createHivemindDocTool(projectDirectory),
      "hivemind-trajectory": createHivemindTrajectoryTool(projectDirectory),
      "hivemind-pressure": createHivemindPressureTool(projectDirectory),
      "hivemind-sdk-supervisor": createHivemindSdkSupervisorTool(),
      "hivemind-command-engine": createHivemindCommandEngineTool(projectDirectory),
      "session-tracker": createSessionTrackerTool(projectDirectory),
      "session-hierarchy": createSessionHierarchyTool(projectDirectory),
      "session-context": createSessionContextTool(projectDirectory),
      "hivemind-agent-work-create": createHivemindAgentWorkCreateTool(projectDirectory),
      "hivemind-agent-work-export": createHivemindAgentWorkExportTool(projectDirectory),
      "configure-primitive": createConfigurePrimitiveTool(),
      "validate-restart": createValidateRestartTool(),
      "bootstrap-init": createBootstrapInitTool(),
      "bootstrap-recover": createBootstrapRecoverTool(),
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

export default HarnessControlPlane
