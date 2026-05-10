/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
import type { Plugin } from "@opencode-ai/plugin"

import { createHarnessLifecycleManager } from "./task-management/lifecycle/index.js"
import { DelegationManager } from "./coordination/delegation/manager.js"
import { taskState } from "./shared/state.js"
import { createCoreHooks } from "./hooks/lifecycle/core-hooks.js"
import { createSessionHooks } from "./hooks/lifecycle/session-hooks.js"
import { createToolGuardHooks } from "./hooks/guards/tool-guard-hooks.js"
import { createDelegationEventObserver, createSessionEntryEventObserver, createSessionJourneyEventObserver } from "./hooks/observers/event-observers.js"
import { createToolExecuteAfterHook } from "./hooks/transforms/tool-after-composer.js"
import { summarizePluginToolOutput } from "./shared/plugin-tool-output-summary.js"
import { createPtyManagerIfSupported } from "./features/background-command/pty/pty-runtime.js"
import { createPromptSkimTool } from "./tools/prompt/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session/session-patch/index.js"
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
import { loadRuntimePolicy } from "./shared/runtime-policy.js"
import { resolveWorkspaceRuntimePolicy } from "./shared/workspace-runtime-policy.js"
import { runAutoLoop } from "./coordination/spawner/auto-loop.js"
import { runRalphLoop, escalationMessage } from "./coordination/spawner/ralph-loop.js"
// Legacy event-tracker code preserved at src/task-management/journal/event-tracker/ (REQ-ST-13).
// Deprecated: event-tracker wiring is kept for backward compatibility with existing tests.
// New capture goes through SessionTracker → .hivemind/session-tracker/.
import {
  createEventTrackerArtifactsFromHook,
  shouldTrackEventTrackerEvent,
} from "./task-management/journal/event-tracker/index.js"
import { SessionTracker } from "./features/session-tracker/index.js"

import { getConfig } from "./config/subscriber.js"
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
  void sessionTracker.initialize()

  const sessionEntryObserverFactory = createSessionEntryEventObserver()

  const deps = { client, lifecycleManager, stateManager: taskState, runAutoLoop, runRalphLoop, escalationMessage, getIntake: sessionEntryObserverFactory.getIntake, hivemindConfig, getBehavioralProfile: (sessionId: string) => resolveBehavioralProfile(sessionId, projectDirectory) }
  const sessionHooks = createSessionHooks(deps)
  const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks
  const delegationEventObserver = createDelegationEventObserver()
  const sessionJourneyEventObserver = createSessionJourneyEventObserver(shouldTrackEventTrackerEvent)
  const consumeSessionEntryFact = async ({ event }: { event?: unknown }) => {
    try {
      await sessionEntryObserverFactory.observer({ event })
    } catch {
      // Best-effort intake classification: never block canonical event handling.
    }
  }
  const consumeDelegationFact = async ({ event }: { event?: unknown }) => {
    const fact = await delegationEventObserver({ event })
    if (fact.kind === "delegation-session-idle") {
      delegationManager.handleSessionIdle(fact.sessionId)
    }
    if (fact.kind === "delegation-session-deleted") {
      delegationManager.handleSessionDeleted(fact.sessionId)
    }
  }
  // Replaced: session tracker now handles capture via SessionTracker module.
  // Old event-tracker wiring kept for backward compatibility (REQ-ST-13).
  // Deprecated — will be removed after session-tracker integration tests are updated.
  const consumeJourneyFact = async ({ event }: { event?: unknown }) => {
    try {
      const fact = await sessionJourneyEventObserver({ event })
      if (fact.kind === "session-journey-event") {
        createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event: fact.event, source: fact.source } })
      }
    } catch {
      // Best-effort audit projection: never block canonical OpenCode event handling.
    }
  }
  const consumeSessionTrackerFact = async ({ event }: { event?: unknown }) => {
    try {
      const ev = event as Record<string, unknown> | undefined
      const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
      const sessionID = (ev?.sessionID as string) || ""
      if (sessionID) {
        await sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
      }
    } catch (err) {
      console.warn("[Harness] Session tracker event observer failed:", err)
    }
  }

  const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy })

  return {
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact, consumeSessionTrackerFact, consumeSessionEntryFact],
    }),
    ...sessionReadHooks,
    ...toolGuardHooks,
    // chat.message: session tracker captures user/assistant messages.
    // Best-effort — never blocks the OpenCode runtime.
    "chat.message": async (input, output) => {
      try {
        await sessionTracker.handleChatMessage(
          input as Parameters<typeof sessionTracker.handleChatMessage>[0],
          output as Parameters<typeof sessionTracker.handleChatMessage>[1],
        )
      } catch (err) {
        console.warn("[Harness] Session tracker chat.message failed:", err)
      }
    },
    tool: {
      "delegate-task": createDelegateTaskTool(delegationManager),
      "delegation-status": createDelegationStatusTool(delegationManager),
      "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
      "prompt-skim": createPromptSkimTool(projectDirectory),
      "prompt-analyze": createPromptAnalyzeTool(projectDirectory),
      "session-patch": createSessionPatchTool(projectDirectory),
      "session-journal-export": createSessionJournalExportTool(),
      "hivemind-doc": createHivemindDocTool(projectDirectory),
      "hivemind-trajectory": createHivemindTrajectoryTool(projectDirectory),
      "hivemind-pressure": createHivemindPressureTool(projectDirectory),
      "hivemind-sdk-supervisor": createHivemindSdkSupervisorTool(),
      "hivemind-command-engine": createHivemindCommandEngineTool(projectDirectory),
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
      input: { tool: string; args?: Record<string, unknown> },
      _output?: { metadata?: unknown; [key: string]: unknown } | string,
    ): Promise<void> => {
      const fact = await createToolExecuteAfterHook({
        toolGuardAfterHook: toolGuardHooks["tool.execute.after"],
        summarizeOutput: summarizePluginToolOutput,
      })(input, _output)
      void fact // consumed by guard hooks above; session tracker uses raw input
      // Deprecated: old event-tracker wiring kept for backward compatibility.
      try {
        if (fact.kind === "tool-execute-after" && shouldTrackEventTrackerEvent(fact.event)) {
          createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event: fact.event, source: fact.source } })
        }
      } catch {
        // Best-effort audit projection: never fail the tool call result.
      }
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

      if (input.tool !== "configure-primitive") return
      const args = input.args
      if (!args || typeof args.workflowId !== "string" || typeof args.workflowTurn !== "number") return

      try {
        const { readWorkflow, persistWorkflow, advanceTurn, completeCurrentTurn } =
          await import("./config/workflow/index.js")
        const workflow = readWorkflow(args.workflowId)
        if (!workflow) return

        const advanced = advanceTurn(workflow, args.workflowTurn as number)
        const output = typeof _output === "string" ? _output.substring(0, 500) : "completed"
        const completed = completeCurrentTurn(advanced, { toolOutput: output })
        persistWorkflow(completed)
      } catch {
        // Best-effort persistence — never fail the tool call
      }
    },
  }
}

export default HarnessControlPlane
