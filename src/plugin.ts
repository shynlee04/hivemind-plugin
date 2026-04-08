/**
 * HiveMind V3 Harness Control Plane — composition root.
 *
 * This file is intentionally thin: it instantiates shared dependencies,
 * wires hook factories, and registers tools. All logic lives in the
 * individual hook factory modules and tool implementations.
 */
import type { Plugin } from "@opencode-ai/plugin"
import { BackgroundManager } from "./lib/background-manager.js"
import { createHarnessLifecycleManager } from "./lib/lifecycle-manager.js"
import { taskState } from "./lib/state.js"
import { createCoreHooks } from "./hooks/create-core-hooks.js"
import { createSessionHooks } from "./hooks/create-session-hooks.js"
import { createToolGuardHooks } from "./hooks/create-tool-guard-hooks.js"
import { createBackgroundTool } from "./tools/background/index.js"
import { createPromptSkimTool } from "./tools/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "./tools/prompt-analyze/index.js"
import { createSessionPatchTool } from "./tools/session-patch/index.js"
import { createDelegateTaskTool } from "./tools/delegate-task.js"
import { loadRuntimePolicy } from "./lib/runtime-policy.js"

const WATCH_TIMEOUT_MS = 1800000 // 30 minutes — research/analysis tasks routinely exceed 5 min

export const HarnessControlPlane: Plugin = async ({ client }) => {
  // Load workspace-level runtime policy once at startup.
  // Per-session overrides are resolved from trusted delegation metadata
  // at enforcement time in hooks and lifecycle.
  const runtimePolicy = loadRuntimePolicy()

  const backgroundManager = new BackgroundManager()
  const lifecycleManager = createHarnessLifecycleManager({
    client,
    pollTimeoutMs: WATCH_TIMEOUT_MS,
    runtimePolicy,
    backgroundManager,
  })
  lifecycleManager.hydrateFromContinuity()

  const deps = { client, lifecycleManager, stateManager: taskState }
  const sessionHooks = createSessionHooks(deps)
  const { event: sessionEventObserver, ...sessionReadHooks } = sessionHooks

  return {
    ...createCoreHooks({ ...deps, eventObservers: [sessionEventObserver] }),
    ...sessionReadHooks,
    ...createToolGuardHooks({ stateManager: taskState, lifecycleManager, runtimePolicy }),
    tool: {
      background: createBackgroundTool(backgroundManager, process.cwd()),
      "delegate-task": createDelegateTaskTool(lifecycleManager, client),
      "prompt-skim": createPromptSkimTool(process.cwd()),
      "prompt-analyze": createPromptAnalyzeTool(process.cwd()),
      "session-patch": createSessionPatchTool(process.cwd()),
    },
  }
}

export default HarnessControlPlane
