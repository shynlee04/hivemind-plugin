import { MAX_DELEGATION_DEPTH, type CategoryGatePolicy, type CategoryGateSurface } from "../../shared/types.js"
import { recordCategoryGateask as defaultRecordCategoryGateask } from "./category-gate-audit.js"
import { resolveCategoryGateDecision as defaultResolveCategoryGateDecision } from "./category-gates.js"
import type { AgentResolver } from "./agent-resolver.js"
import type { SlotHandle, SlotManager } from "./slot-manager.js"
import type { ValidatedAgent } from "../spawner/spawn-request-builder.js"

export interface PreflightParams {
  agent: string
  category?: string
  currentDepth: number
  parentSessionId: string
  policy?: CategoryGatePolicy
  prompt?: string
  queueKey: string
  safetyCeilingMs?: number
  surface: CategoryGateSurface
  toolProfileMode?: string
}

export interface PreflightResult {
  queueKey: string
  slotHandle: SlotHandle
  validatedAgent: ValidatedAgent
}

export interface DelegationDispatcherOptions {
  agentResolver: Pick<AgentResolver, "resolve">
  recordCategoryGateask?: typeof defaultRecordCategoryGateask
  resolveCategoryGateDecision?: typeof defaultResolveCategoryGateDecision
  slotManager: Pick<SlotManager, "acquire"> & Partial<Pick<SlotManager, "release">>
}

/** Runs delegate-task v2 pre-flight checks before native Task execution. */
export class DelegationDispatcher {
  private readonly agentResolver: Pick<AgentResolver, "resolve">
  private readonly recordCategoryGateask: typeof defaultRecordCategoryGateask
  private readonly resolveCategoryGateDecision: typeof defaultResolveCategoryGateDecision
  private readonly slotManager: Pick<SlotManager, "acquire"> & Partial<Pick<SlotManager, "release">>

  constructor(options: DelegationDispatcherOptions) {
    this.agentResolver = options.agentResolver
    this.recordCategoryGateask = options.recordCategoryGateask ?? defaultRecordCategoryGateask
    this.resolveCategoryGateDecision = options.resolveCategoryGateDecision ?? defaultResolveCategoryGateDecision
    this.slotManager = options.slotManager
  }

  /** Execute category gate, concurrency, depth, and agent validation checks. */
  async preflightCheck(params: PreflightParams): Promise<PreflightResult> {
    this.checkCategoryGate(params)
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

  private checkCategoryGate(params: PreflightParams): void {
    const decision = this.resolveCategoryGateDecision({
      category: params.category,
      policy: params.policy,
      surface: params.surface,
      toolProfileMode: params.toolProfileMode,
    })
    if (decision.allowed) return
    this.recordCategoryGateask({
      askReason: decision.audit.askReason ?? decision.reason,
      callerSessionId: params.parentSessionId,
      requestedAgent: params.agent,
      requestedCategory: params.category,
      surface: params.surface,
    })
    throw new Error(`[Harness] Category gate denied for agent "${params.agent}" and category "${params.category ?? "<none>"}": ${decision.reason}`)
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
