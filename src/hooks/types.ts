import type { HarnessLifecycleManager } from "../lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../lib/session-api.js"
import type { TaskStateManager } from "../lib/state.js"
import type { AutoLoopOptions, AutoLoopResult } from "../lib/auto-loop.js"
import type { RalphLoopOptions, RalphLoopResult } from "../lib/ralph-loop.js"

export interface AutoLoopConfig {
  maxIterations: number
  completionSignal: string
  backoffMs: number
}

export interface ParentAutoLoopConfig {
  maxIterations: number
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
  parentAutoLoopConfig?: Partial<ParentAutoLoopConfig>
  sleep?: (ms: number) => Promise<void>
  runAutoLoop?: <T>(options: AutoLoopOptions<T>) => Promise<AutoLoopResult<T>>
  runRalphLoop?: <T>(options: RalphLoopOptions<T>) => Promise<RalphLoopResult<T>>
  escalationMessage?: <T>(result: RalphLoopResult<T>) => string
}
