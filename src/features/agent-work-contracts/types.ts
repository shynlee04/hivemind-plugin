import type {
  AgentWorkCompaction,
  AgentWorkContract,
  AgentWorkEvidence,
  AgentWorkOwner,
  AgentWorkScope,
} from "../../schema-kernel/agent-work-contract.schema.js"

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
 *
 * Per D-09 to D-13, all pressure integration has been removed.
 * Pressure fields (pressureScore, pressureTier, pressureApproved) are
 * silently ignored at the schema layer for backward compatibility (D-43/D-44).
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
}

/**
 * Result returned when a contract create operation writes successfully.
 *
 * Per D-09 to D-13, pressure integration removed.
 * createAgentWorkContract returns the contract directly.
 */
export type AgentWorkCreateResult = AgentWorkContract

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
