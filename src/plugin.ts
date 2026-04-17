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
import { createPromptSkimTool } from "./tools/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session-patch/index.js"
import { createDelegateTaskTool } from "./tools/delegate-task.js"
import { loadRuntimePolicy } from "./lib/runtime-policy.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

export const HarnessControlPlane: Plugin = async ({ client }) => {
  // Load workspace-level runtime policy once at startup.
  const runtimePolicy = loadRuntimePolicy()
  const delegationManager = new DelegationManager(client)
  await delegationManager.recoverPending()

  const lifecycleManager = createHarnessLifecycleManager({
    client,
    pollTimeoutMs: WATCH_TIMEOUT_MS,
    runtimePolicy,
  })
  lifecycleManager.hydrateFromContinuity()

  const deps = { client, lifecycleManager, stateManager: taskState }
  const sessionHooks = createSessionHooks(deps)
  const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks
  const delegationEventObserver = async ({ event }: { event?: unknown }) => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId =
      asString(getNestedValue(event, ["session", "id"]))
      ?? asString(getNestedValue(event, ["properties", "session_id"]))
      ?? asString(getNestedValue(event, ["sessionID"]))
      ?? asString(getNestedValue(event, ["sessionId"]))

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

  return {
    ...createCoreHooks({
      ...deps,
      eventObservers: [delegationEventObserver, sessionEventObserver],
    }),
    ...sessionReadHooks,
    ...createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy }),
    tool: {
      "delegate-task": createDelegateTaskTool(delegationManager),
      "prompt-skim": createPromptSkimTool(process.cwd()),
      "prompt-analyze": createPromptAnalyzeTool(process.cwd()),
      "session-patch": createSessionPatchTool(process.cwd()),
    },
  }
}

export default HarnessControlPlane
