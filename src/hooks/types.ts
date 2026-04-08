import type { HarnessLifecycleManager } from "../lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../lib/session-api.js"
import type { TaskStateManager } from "../lib/state.js"

export interface AutoLoopConfig {
  maxIterations: number
  completionSignal: string
  backoffMs: number
}

/**
 * Shared dependency bundle injected into every hook factory.
 * Carries only what hooks need — tools receive their own narrower contexts.
 */
export interface HookDependencies {
  lifecycleManager: HarnessLifecycleManager
  client: OpenCodeClient
  stateManager: TaskStateManager
  eventObservers?: Array<(input: { event?: unknown }) => Promise<void> | void>
  autoLoopConfig?: Partial<AutoLoopConfig>
  sleep?: (ms: number) => Promise<void>
}
