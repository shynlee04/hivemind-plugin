import type {
  AgentWorkCompaction,
  AgentWorkContract,
  AgentWorkEvidence,
  AgentWorkOwner,
  AgentWorkScope,
} from "../../schema-kernel/agent-work-contract.schema.js"
import type { PressureDecision } from "../runtime-pressure/index.js"

export type {
  AgentWorkCompaction,
  AgentWorkContract,
  AgentWorkContractStore,
  AgentWorkEvidence,
  AgentWorkEvidenceLevel,
  AgentWorkOwner,
  AgentWorkScope,
  AgentWorkStatus,
} from "../../schema-kernel/agent-work-contract.schema.js"

/**
 * Input accepted by the contract creation operation.
 */
export type CreateAgentWorkContractInput = {
  /** Trusted project root where `.hivemind/state/agent-work-contracts.json` is written. */
  projectRoot: string
  /** Optional caller-provided stable contract ID. */
  id?: string
  /** Owner metadata for the agent/session that owns the work boundary. */
  owner: AgentWorkOwner
  /** Work scope boundaries and non-goals. */
  scope: AgentWorkScope
  /** Evidence and blocked-state reporting requirements. */
  evidence: AgentWorkEvidence
  /** Compaction preservation payload, bounded before persistence. */
  compaction: AgentWorkCompaction
  /** Optional trajectory ID to receive an evidence reference. */
  trajectoryId?: string
  /** Optional pressure score to classify before writing. */
  pressureScore?: number
  /** Optional direct pressure tier to classify before writing. */
  pressureTier?: number
  /** True when the caller has approved a gated-pressure write. */
  pressureApproved?: boolean
}

/**
 * Result returned when a contract create operation writes successfully.
 */
export type AgentWorkCreateSuccess = {
  status: "created"
  contract: AgentWorkContract
  pressureDecision: PressureDecision
}

/**
 * Result returned when Phase 57 pressure gates prevent a write.
 */
export type AgentWorkCreatePressureBlocked = {
  status: "pressure-blocked"
  pressureDecision: PressureDecision
  reason: string
}

/**
 * Union result for contract creation.
 */
export type AgentWorkCreateResult = AgentWorkCreateSuccess | AgentWorkCreatePressureBlocked

/**
 * Export operation input for a durable work contract.
 */
export type ExportAgentWorkContractInput = {
  /** Trusted project root containing the contract store. */
  projectRoot: string
  /** Contract ID to export. */
  contractId: string
  /** Output format for the handoff payload. */
  format: "json" | "markdown"
}

/**
 * Exported handoff artifact for a contract.
 */
export type AgentWorkExportResult = {
  contractId: string
  format: "json" | "markdown"
  payload: { contract: AgentWorkContract } | string
}
