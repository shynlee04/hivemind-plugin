import {
  AgentWorkContractSchema,
  parseAgentWorkCreateToolInput,
  type AgentWorkContract,
  type AgentWorkEvidenceLevel,
} from "../../schema-kernel/agent-work-contract.schema.js"
import { z } from "zod"

/**
 * Runtime extension of {@link AgentWorkContract} with execution state.
 *
 * @property runtimeStatus - Current runtime state of the contract (active, paused, or cancelled).
 */
export type AgentWorkContractRuntime = AgentWorkContract & {
  runtimeStatus?: "active" | "paused" | "cancelled"
}

/**
 * Input parameters for creating a new agent work contract.
 *
 * @property id - Optional explicit contract ID. Auto-generated if omitted.
 * @property ownerAgent - Name/identifier of the owning agent.
 * @property ownerSessionId - Session ID of the owning agent.
 * @property ownerParentSessionId - Parent session ID in the delegation chain.
 * @property taskBoundary - Description of the work boundary.
 * @property allowedSurfaces - File/system surfaces the contract may access.
 * @property dependencies - IDs of other contracts this one depends on.
 * @property nonGoals - Explicitly out-of-scope items.
 * @property requiredProof - Evidence types required for completion.
 * @property minimumEvidenceLevel - Minimum evidence quality level required.
 * @property verificationCommands - Commands to verify completion.
 * @property blockedStateRules - Rules that block state transitions.
 * @property briefing - Compaction-safe briefing text.
 * @property summary - Compaction-safe summary text.
 * @property anchors - Context anchors for compaction recovery.
 * @property reinjectionPayload - Payload for context reinjection after compaction.
 * @property sourceRefs - References to source files/artifacts.
 * @property trajectoryId - Optional trajectory tracking ID.
 * @property pressureScore - Runtime pressure score (0–1).
 * @property pressureTier - Runtime pressure tier (1–5).
 * @property pressureApproved - Whether the pressure level has been approved.
 */
export type CreateContractInput = {
  id?: string
  ownerAgent: string
  ownerSessionId?: string
  ownerParentSessionId?: string
  taskBoundary: string
  allowedSurfaces?: string[]
  dependencies?: string[]
  nonGoals?: string[]
  requiredProof?: string[]
  minimumEvidenceLevel: AgentWorkEvidenceLevel
  verificationCommands?: string[]
  blockedStateRules?: string[]
  briefing?: string
  summary?: string
  anchors?: string[]
  reinjectionPayload?: string
  sourceRefs?: string[]
  trajectoryId?: string
  pressureScore?: number
  pressureTier?: number
  pressureApproved?: boolean
}

/**
 * Create a new agent work contract from input parameters.
 *
 * Validates the input through the schema parser and generates a contract
 * with initial status `"created"` and current timestamps.
 *
 * @param input - The contract creation parameters.
 * @returns A validated {@link AgentWorkContractRuntime} ready for execution.
 *
 * @example
 * ```typescript
 * const contract = createContract({
 *   ownerAgent: "hm-executor",
 *   taskBoundary: "Implement feature X",
 *   minimumEvidenceLevel: "L3_INTEGRATION",
 * })
 * ```
 */
export function createContract(input: CreateContractInput): AgentWorkContractRuntime {
  const parsed = parseAgentWorkCreateToolInput({
    ...input,
    id: input.id ?? generateContractId(),
  })
  const now = Date.now()
  return {
    id: parsed.id ?? generateContractId(),
    status: "created",
    owner: {
      agent: parsed.ownerAgent,
      sessionId: parsed.ownerSessionId,
      parentSessionId: parsed.ownerParentSessionId,
    },
    scope: {
      taskBoundary: parsed.taskBoundary,
      allowedSurfaces: parsed.allowedSurfaces,
      dependencies: parsed.dependencies,
      nonGoals: parsed.nonGoals,
    },
    evidence: {
      requiredProof: parsed.requiredProof,
      minimumEvidenceLevel: parsed.minimumEvidenceLevel,
      verificationCommands: parsed.verificationCommands,
      blockedStateRules: parsed.blockedStateRules,
    },
    compaction: {
      briefing: parsed.briefing,
      summary: parsed.summary,
      anchors: parsed.anchors,
      reinjectionPayload: parsed.reinjectionPayload,
      sourceRefs: parsed.sourceRefs,
    },
    trajectoryId: parsed.trajectoryId,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Validate raw data against the agent work contract schema.
 *
 * @param data - Unknown data to validate.
 * @returns Success with the parsed contract data, or failure with a Zod error.
 *
 * @example
 * ```typescript
 * const result = validateContract(rawData)
 * if (result.success) {
 *   console.log(result.data.id)
 * } else {
 *   console.error(result.error.issues)
 * }
 * ```
 */
export function validateContract(
  data: unknown,
): { success: true; data: AgentWorkContract } | { success: false; error: z.ZodError } {
  const result = AgentWorkContractSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Update the status of an agent work contract, returning a new object.
 *
 * The `updatedAt` timestamp is guaranteed to be strictly greater than
 * the previous value to ensure monotonic ordering.
 *
 * @param contract - The contract to update.
 * @param status - The new status value.
 * @returns A new contract object with the updated status and timestamp.
 *
 * @example
 * ```typescript
 * const updated = updateContractStatus(contract, "in_progress")
 * ```
 */
export function updateContractStatus(
  contract: AgentWorkContractRuntime,
  status: AgentWorkContract["status"],
): AgentWorkContractRuntime {
  return { ...contract, status, updatedAt: Math.max(Date.now(), contract.updatedAt + 1) }
}

/**
 * Generate a unique contract ID.
 *
 * Format: `awc-{timestamp}-{random6}` where random6 is a 6-character
 * base-36 string derived from `Math.random()`.
 *
 * @returns A unique contract ID string.
 */
function generateContractId(): string {
  return `awc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
