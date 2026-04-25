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
import { asString, getNestedValue } from "./lib/helpers.js"
import { getEventSessionID } from "./lib/session-api.js"
import { createPromptSkimTool } from "./tools/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session-patch/index.js"
import { createDelegateTaskTool } from "./tools/delegate-task.js"
import { createDelegationStatusTool } from "./tools/delegation-status.js"
import { createRunBackgroundCommandTool } from "./tools/run-background-command.js"
import { createConfigurePrimitiveTool } from "./tools/configure-primitive.js"
import { createValidateRestartTool } from "./tools/validate-restart.js"
import { createSessionJournalExportTool } from "./tools/session-journal-export.js"
import { loadRuntimePolicy } from "./lib/runtime-policy.js"
import {
  createJourneyEventFromHook,
  writeSessionJourneyArtifacts,
} from "./lib/session-journey-events.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy()
  let ptyManager: import("./lib/pty/pty-manager.js").PtyManager | null = null
  try {
    const ptyModule = await import("./lib/pty/pty-manager.js")
    const candidate = new ptyModule.PtyManager()
    if (candidate.isSupported()) {
      ptyManager = candidate
    }
  } catch {
    ptyManager = null
  }

  const delegationManager = new DelegationManager(client, { ptyManager })
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
  const delegationEventObserver = async ({ event }: { event?: unknown }) => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId = getEventSessionID(event)

    if (!eventType || !sessionId) {
      return
    }

    if (eventType === "session.idle") {
      delegationManager.handleSessionIdle(sessionId)
      return
    }

    if (eventType === "session.deleted") {
      delegationManager.handleSessionDeleted(sessionId)
    }
  }
  const sessionJourneyEventObserver = async ({ event }: { event?: unknown }) => {
    try {
      const journeyEvent = createJourneyEventFromHook({ event, source: "plugin.event" })
      writeSessionJourneyArtifacts({ projectRoot: directory, event: journeyEvent })
    } catch {
      // Best-effort audit projection: never block canonical OpenCode event handling.
    }
  }

  return {
    ...createCoreHooks({
      ...deps,
      eventObservers: [delegationEventObserver, sessionEventObserver, sessionJourneyEventObserver],
    }),
    ...sessionReadHooks,
    ...createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy }),
    tool: {
      "delegate-task": createDelegateTaskTool(delegationManager),
      "delegation-status": createDelegationStatusTool(delegationManager),
      ...(ptyManager ? {
        "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
      } : {}),
      "prompt-skim": createPromptSkimTool(directory),
      "prompt-analyze": createPromptAnalyzeTool(directory),
      "session-patch": createSessionPatchTool(directory),
      "session-journal-export": createSessionJournalExportTool(),
      "configure-primitive": createConfigurePrimitiveTool(),
      "validate-restart": createValidateRestartTool(),
    },
    // Auto-persist workflow state after configure-primitive calls with workflow params.
    // Best-effort: failures are silently ignored — does not affect the tool call result.
    "tool.execute.after": async (
      input: { tool: string; args?: Record<string, unknown> },
      _output?: unknown,
    ): Promise<void> => {
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
