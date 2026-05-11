import type { HarnessLifecycleManager } from "../task-management/lifecycle/index.js"
import type { OpenCodeClient } from "../shared/session-api.js"
import type { TaskStateManager } from "../shared/state.js"
import type { AutoLoopOptions, AutoLoopResult } from "../coordination/spawner/auto-loop.js"
import type { RalphLoopOptions, RalphLoopResult } from "../coordination/spawner/ralph-loop.js"
import type { IntakeResult } from "../routing/session-entry/intake-gate.js"
import type { HivemindConfigs } from "../schema-kernel/hivemind-configs.schema.js"
import type { ResolvedBehavioralProfile } from "../routing/behavioral-profile/types.js"

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
  getIntake?: (sessionId: string) => IntakeResult | undefined
  /** Hivemind runtime config — loaded once at plugin init, cached for session lifetime. */
  hivemindConfig?: HivemindConfigs
  /**
   * Resolves the behavioral profile for a session.
   * Lazy — computes on first call, caches for session lifetime.
   * @see D-09, D-10 in CA-02-CONTEXT.md
   */
  getBehavioralProfile?: (sessionId: string) => ResolvedBehavioralProfile
  /**
   * Checks whether a session ID belongs to a main (level-0, non-delegated) session.
   * Populated by `createSessionIsMainObserver()` from `session.created` events.
   * Main sessions have no `parentID` in OpenCode's session records.
   * @see D-01, D-02, D-03 in BOOT-09-CONTEXT.md
   */
  isMainSession?: (sessionId: string) => boolean
}
