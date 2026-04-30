/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
import type { Plugin } from "@opencode-ai/plugin"

import { createHarnessLifecycleManager } from "./lib/lifecycle-manager.js"
import { DelegationManager } from "./lib/delegation-manager.js"
import { taskState } from "./lib/state.js"
import { createCoreHooks } from "./hooks/create-core-hooks.js"
import { createSessionHooks } from "./hooks/create-session-hooks.js"
import { createToolGuardHooks } from "./hooks/create-tool-guard-hooks.js"
import { createDelegationEventObserver, createSessionJourneyEventObserver } from "./hooks/plugin-event-observers.js"
import { createToolExecuteAfterHook } from "./hooks/tool-after-composer.js"
import { summarizePluginToolOutput } from "./lib/plugin-tool-output-summary.js"
import { createPtyManagerIfSupported } from "./lib/pty/pty-runtime.js"
import { createPromptSkimTool } from "./tools/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session-patch/index.js"
import { createDelegateTaskTool } from "./tools/delegate-task.js"
import { createDelegationStatusTool } from "./tools/delegation-status.js"
import { createRunBackgroundCommandTool } from "./tools/run-background-command.js"
import { createConfigurePrimitiveTool } from "./tools/configure-primitive.js"
import { createValidateRestartTool } from "./tools/validate-restart.js"
import { createSessionJournalExportTool } from "./tools/session-journal-export.js"
import { createHivemindDocTool } from "./tools/hivemind-doc.js"
import { createHivemindTrajectoryTool } from "./tools/hivemind-trajectory.js"
import { createHivemindPressureTool } from "./tools/hivemind-pressure.js"
import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "./tools/hivemind-agent-work.js"
import { createHivemindSdkSupervisorTool } from "./tools/hivemind-sdk-supervisor.js"
import { createHivemindCommandEngineTool } from "./tools/hivemind-command-engine.js"
import { loadRuntimePolicy } from "./lib/runtime-policy.js"
import { resolveWorkspaceRuntimePolicy } from "./lib/workspace-runtime-policy.js"
import {
  createEventTrackerArtifactsFromHook,
  shouldTrackEventTrackerEvent,
} from "./lib/event-tracker/index.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const projectDirectory = directory ?? process.cwd()
  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
  const ptyManager = await createPtyManagerIfSupported()

  const delegationManager = new DelegationManager(client, { ptyManager, runtimePolicy })
  // Recovery runs asynchronously — must not block plugin init.
  // If a second OpenCode instance starts, recoverPending() would await SDK calls
  // for sessions that belong to the first instance, causing a hang.
  void delegationManager.recoverPending()

  const lifecycleManager = createHarnessLifecycleManager({
    client,
    pollTimeoutMs: WATCH_TIMEOUT_MS,
    runtimePolicy,
    delegationManager,
  })
  lifecycleManager.hydrateFromContinuity()

  const deps = { client, lifecycleManager, stateManager: taskState }
  const sessionHooks = createSessionHooks(deps)
  const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks
  const delegationEventObserver = createDelegationEventObserver()
  const sessionJourneyEventObserver = createSessionJourneyEventObserver(shouldTrackEventTrackerEvent)
  const consumeDelegationFact = async ({ event }: { event?: unknown }) => {
    const fact = await delegationEventObserver({ event })
    if (fact.kind === "delegation-session-idle") {
      delegationManager.handleSessionIdle(fact.sessionId)
    }
    if (fact.kind === "delegation-session-deleted") {
      delegationManager.handleSessionDeleted(fact.sessionId)
    }
  }
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

  const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy })

  return {
    ...createCoreHooks({
      ...deps,
      eventObservers: [consumeDelegationFact, sessionEventObserver, consumeJourneyFact],
    }),
    ...sessionReadHooks,
    ...toolGuardHooks,
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
      try {
        if (fact.kind === "tool-execute-after" && shouldTrackEventTrackerEvent(fact.event)) {
          createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event: fact.event, source: fact.source } })
        }
      } catch {
        // Best-effort audit projection: never fail the tool call result.
      }

      if (input.tool !== "configure-primitive") return
      const args = input.args
      if (!args || typeof args.workflowId !== "string" || typeof args.workflowTurn !== "number") return

      try {
        const { readWorkflow, persistWorkflow, advanceTurn, completeCurrentTurn } =
          await import("./lib/config-workflow/index.js")
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
