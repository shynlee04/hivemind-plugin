import { MAX_DELEGATION_DEPTH } from "../../shared/types.js"
import type { AgentResolver } from "./agent-resolver.js"
import type { SlotHandle, SlotManager } from "./slot-manager.js"
import type { ValidatedAgent } from "../spawner/spawn-request-builder.js"

export interface PreflightParams {
  agent: string
  currentDepth: number
  parentSessionId: string
  prompt?: string
  queueKey: string
  surface?: "agent-delegation" | "command-process"
  workingDirectory?: string
}

export interface PreflightResult {
  queueKey: string
  slotHandle: SlotHandle
  validatedAgent: ValidatedAgent
}

export interface DelegationDispatcherOptions {
  agentResolver: Pick<AgentResolver, "resolve">
  slotManager: Pick<SlotManager, "acquire"> & Partial<Pick<SlotManager, "release">>
}

/** Runs delegate-task v2 pre-flight checks before native Task execution. */
export class DelegationDispatcher {
  private readonly agentResolver: Pick<AgentResolver, "resolve">
  private readonly slotManager: Pick<SlotManager, "acquire"> & Partial<Pick<SlotManager, "release">>

  constructor(options: DelegationDispatcherOptions) {
    this.agentResolver = options.agentResolver
    this.slotManager = options.slotManager
  }

  /** Execute concurrency, depth, and agent validation checks. */
  async preflightCheck(params: PreflightParams): Promise<PreflightResult> {
    const slotHandle = await this.slotManager.acquire(params.parentSessionId, params.queueKey, undefined)
    try {
      this.checkDepth(params.currentDepth)
      const validatedAgent = await this.agentResolver.resolve(params.agent)
      return { queueKey: params.queueKey, slotHandle, validatedAgent }
    } catch (error) {
      this.releaseSlot(slotHandle)
      throw error
    }
  }

  private checkDepth(currentDepth: number): void {
    if (currentDepth >= MAX_DELEGATION_DEPTH) {
      throw new Error(`[Harness] Max delegation depth (${MAX_DELEGATION_DEPTH}) reached at current depth ${currentDepth}.`)
    }
  }

  private releaseSlot(slotHandle: SlotHandle): void {
    const releaseFromManager = this.slotManager.release
    if (typeof releaseFromManager === "function") {
      releaseFromManager.call(this.slotManager, slotHandle)
    }
    slotHandle.release()
  }
}
