import {
  AgentWorkContractSchema,
  parseAgentWorkCreateToolInput,
  type AgentWorkContract,
  type AgentWorkEvidenceLevel,
} from "../../schema-kernel/agent-work-contract.schema.js"
import { z } from "zod"

export type AgentWorkContractRuntime = AgentWorkContract & {
  runtimeStatus?: "active" | "paused" | "cancelled"
}

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

export function validateContract(
  data: unknown,
): { success: true; data: AgentWorkContract } | { success: false; error: z.ZodError } {
  const result = AgentWorkContractSchema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export function updateContractStatus(
  contract: AgentWorkContractRuntime,
  status: AgentWorkContract["status"],
): AgentWorkContractRuntime {
  return { ...contract, status, updatedAt: Math.max(Date.now(), contract.updatedAt + 1) }
}

function generateContractId(): string {
  return `awc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
