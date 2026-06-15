import { z } from "zod"

import { ANCHOR_LIMIT, BRIEFING_LIMIT, REINJECTION_LIMIT, SUMMARY_LIMIT } from "../features/agent-work-contracts/bounds.js"

/**
 * Evidence hierarchy labels accepted by agent work contracts.
 */
export const AgentWorkEvidenceLevelSchema = z.enum([
  "L1_RUNTIME_PROOF",
  "L2_AUTOMATED_TEST",
  "L3_STATIC_REVIEW",
  "L4_IMPLEMENTATION_TRACE",
  "L5_DOCUMENTATION",
])

/**
 * Lifecycle statuses for durable agent work contracts.
 */
export const AgentWorkStatusSchema = z.enum(["created", "running", "blocked", "completed", "cancelled"])

/**
 * Contract owner schema for an agent/session boundary.
 */
export const AgentWorkOwnerSchema = z.object({
  agent: z.string().min(1),
  sessionId: z.string().min(1).optional(),
  parentSessionId: z.string().min(1).optional(),
})

/**
 * Work scope schema that separates task boundaries from delegation dispatch.
 */
export const AgentWorkScopeSchema = z.object({
  taskBoundary: z.string().min(1),
  allowedSurfaces: z.array(z.string().min(1)).default([]),
  dependencies: z.array(z.string().min(1)).default([]),
  nonGoals: z.array(z.string().min(1)).default([]),
})

/**
 * Evidence requirements and blocked-state reporting schema.
 */
export const AgentWorkEvidenceSchema = z.object({
  requiredProof: z.array(z.string().min(1)).default([]),
  minimumEvidenceLevel: AgentWorkEvidenceLevelSchema,
  verificationCommands: z.array(z.string().min(1)).default([]),
  blockedStateRules: z.array(z.string().min(1)).default([]),
})

/**
 * Bounded compaction preservation payload schema.
 */
export const AgentWorkCompactionSchema = z.object({
  briefing: z.string().max(BRIEFING_LIMIT).default(""),
  summary: z.string().max(SUMMARY_LIMIT).default(""),
  anchors: z.array(z.string().min(1)).max(ANCHOR_LIMIT).default([]),
  reinjectionPayload: z.string().max(REINJECTION_LIMIT).default(""),
  sourceRefs: z.array(z.string().min(1)).max(ANCHOR_LIMIT).default([]),
})

/**
 * Durable agent work contract schema.
 */
export const AgentWorkContractSchema = z.object({
  id: z.string().min(1),
  status: AgentWorkStatusSchema,
  owner: AgentWorkOwnerSchema,
  scope: AgentWorkScopeSchema,
  evidence: AgentWorkEvidenceSchema,
  compaction: AgentWorkCompactionSchema,
  trajectoryId: z.string().min(1).optional(),
  trajectoryEvidenceRef: z.string().min(1).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Agent work contract store file schema.
 */
export const AgentWorkContractStoreSchema = z.object({
  version: z.literal(1),
  updatedAt: z.number(),
  contracts: z.record(z.string(), AgentWorkContractSchema),
})

/**
 * Tool input schema for `hivemind-agent-work-create`.
 *
 * Per D-43/D-44: pressure fields are ACCEPTED but STRIPPED from parsed output.
 * The schema accepts them for backward compatibility, but the transform removes
 * them so operations never see pressure data.
 */
export const AgentWorkCreateToolInputSchema = z.object({
  id: z.string().min(1).optional(),
  ownerAgent: z.string().min(1),
  ownerSessionId: z.string().min(1).optional(),
  ownerParentSessionId: z.string().min(1).optional(),
  taskBoundary: z.string().min(1),
  allowedSurfaces: z.array(z.string().min(1)).default([]),
  dependencies: z.array(z.string().min(1)).default([]),
  nonGoals: z.array(z.string().min(1)).default([]),
  requiredProof: z.array(z.string().min(1)).default([]),
  minimumEvidenceLevel: AgentWorkEvidenceLevelSchema,
  verificationCommands: z.array(z.string().min(1)).default([]),
  blockedStateRules: z.array(z.string().min(1)).default([]),
  briefing: z.string().max(BRIEFING_LIMIT).default(""),
  summary: z.string().max(SUMMARY_LIMIT).default(""),
  anchors: z.array(z.string().min(1)).default([]),
  reinjectionPayload: z.string().default(""),
  sourceRefs: z.array(z.string().min(1)).default([]),
  trajectoryId: z.string().min(1).optional(),
  // Pressure fields: ACCEPTED for backward compat (D-43) but STRIPPED in transform (D-44)
  pressureScore: z.number().optional(),
  pressureTier: z.number().optional(),
  pressureApproved: z.boolean().default(false),
}).transform(({ pressureScore: _ps, pressureTier: _pt, pressureApproved: _pa, ...rest }) => rest)

/**
 * Tool input schema for `hivemind-agent-work-export`.
 */
export const AgentWorkExportToolInputSchema = z.object({
  contractId: z.string().min(1),
  format: z.enum(["json", "markdown"]).default("json"),
})

export type AgentWorkEvidenceLevel = z.infer<typeof AgentWorkEvidenceLevelSchema>
export type AgentWorkStatus = z.infer<typeof AgentWorkStatusSchema>
export type AgentWorkOwner = z.infer<typeof AgentWorkOwnerSchema>
export type AgentWorkScope = z.infer<typeof AgentWorkScopeSchema>
export type AgentWorkEvidence = z.infer<typeof AgentWorkEvidenceSchema>
export type AgentWorkCompaction = z.infer<typeof AgentWorkCompactionSchema>
export type AgentWorkContract = z.infer<typeof AgentWorkContractSchema>
export type AgentWorkContractStore = z.infer<typeof AgentWorkContractStoreSchema>
export type AgentWorkCreateToolInput = z.infer<typeof AgentWorkCreateToolInputSchema>
export type AgentWorkExportToolInput = z.infer<typeof AgentWorkExportToolInputSchema>

/**
 * Parse untrusted create-tool input.
 *
 * @param rawInput - Untrusted tool arguments.
 * @returns Validated create-tool input.
 */
export function parseAgentWorkCreateToolInput(rawInput: unknown): AgentWorkCreateToolInput {
  return AgentWorkCreateToolInputSchema.parse(rawInput)
}

/**
 * Parse untrusted export-tool input.
 *
 * @param rawInput - Untrusted tool arguments.
 * @returns Validated export-tool input.
 */
export function parseAgentWorkExportToolInput(rawInput: unknown): AgentWorkExportToolInput {
  return AgentWorkExportToolInputSchema.parse(rawInput)
}
