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
import { redactTextSecrets } from "./lib/security/redaction.js"
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
import { resolveWorkspaceRuntimePolicy } from "./lib/workspace-runtime-policy.js"
import {
  createEventTrackerArtifactsFromHook,
  shouldTrackEventTrackerEvent,
} from "./lib/event-tracker/index.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min
const TOOL_OUTPUT_SUMMARY_LIMIT = 240

function summarizePluginToolOutput(output: unknown): string {
  const raw = typeof output === "string" ? output : JSON.stringify(output ?? "completed")
  const redacted = redactTextSecrets(raw ?? "completed")
  const normalized = redacted.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
  if (!normalized) return "completed"
  return normalized.length <= TOOL_OUTPUT_SUMMARY_LIMIT ? normalized : `${normalized.slice(0, TOOL_OUTPUT_SUMMARY_LIMIT - 1)}…`
}

function resolveToolHookSessionId(args: Record<string, unknown> | undefined): string | undefined {
  return (
    asString(getNestedValue(args, ["sessionID"])) ??
    asString(getNestedValue(args, ["sessionId"])) ??
    asString(getNestedValue(args, ["rootSessionID"])) ??
    asString(getNestedValue(args, ["rootSessionId"]))
  )
}

export const HarnessControlPlane: Plugin = async ({ client, directory }) => {
  const projectDirectory = directory ?? process.cwd()
  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy(resolveWorkspaceRuntimePolicy(projectDirectory))
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
      if (!shouldTrackEventTrackerEvent(event)) return
      createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event, source: "plugin.event" } })
    } catch {
      // Best-effort audit projection: never block canonical OpenCode event handling.
    }
  }

  const toolGuardHooks = createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy })

  return {
    ...createCoreHooks({
      ...deps,
      eventObservers: [delegationEventObserver, sessionEventObserver, sessionJourneyEventObserver],
    }),
    ...sessionReadHooks,
    ...toolGuardHooks,
    tool: {
      "delegate-task": createDelegateTaskTool(delegationManager),
      "delegation-status": createDelegationStatusTool(delegationManager),
      ...(ptyManager ? {
        "run-background-command": createRunBackgroundCommandTool({ delegationManager, ptyManager }),
      } : {}),
      "prompt-skim": createPromptSkimTool(projectDirectory),
      "prompt-analyze": createPromptAnalyzeTool(projectDirectory),
      "session-patch": createSessionPatchTool(projectDirectory),
      "session-journal-export": createSessionJournalExportTool(),
      "configure-primitive": createConfigurePrimitiveTool(),
      "validate-restart": createValidateRestartTool(),
    },
    // Auto-persist workflow state after configure-primitive calls with workflow params.
    // Best-effort: failures are silently ignored — does not affect the tool call result.
    "tool.execute.after": async (
      input: { tool: string; args?: Record<string, unknown> },
      _output?: { metadata?: unknown; [key: string]: unknown } | string,
    ): Promise<void> => {
      const sessionID = resolveToolHookSessionId(input.args)
      if (_output && typeof _output === "object") {
        await toolGuardHooks["tool.execute.after"]({ ...input, sessionID }, _output)
      }

      try {
        if (sessionID) {
          const event = {
            type: "tool.execute.after",
            properties: {
              sessionID,
              tool: input.tool,
              status: "completed",
              resultSummary: summarizePluginToolOutput(_output),
            },
          }
          if (shouldTrackEventTrackerEvent(event)) {
            createEventTrackerArtifactsFromHook({ projectRoot: projectDirectory, hook: { event, source: "plugin.tool.execute.after" } })
          }
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
