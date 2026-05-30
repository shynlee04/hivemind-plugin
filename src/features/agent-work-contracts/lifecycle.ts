/**
 * Agent-work-contract lifecycle state machine.
 *
 * Defines allowed transitions and provides 4 transition functions
 * for managing contract status through its lifecycle.
 *
 * @module lifecycle
 */

import type { AgentWorkStatus } from "../../schema-kernel/agent-work-contract.schema.js"
import { getAgentWorkContract, upsertAgentWorkContract } from "./store.js"

/**
 * Formal state machine defining which status transitions are allowed.
 *
 * Each key is a source status, and the value is an array of valid target statuses.
 * Empty arrays indicate terminal states (completed, cancelled).
 */
export const ALLOWED_TRANSITIONS: Record<AgentWorkStatus, AgentWorkStatus[]> = {
  created: ["running", "cancelled"],
  running: ["blocked", "completed", "cancelled"],
  blocked: ["running", "cancelled"],
  completed: [],
  cancelled: [],
}

/**
 * Transition a contract from created→running.
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract to transition.
 * @returns Updated contract.
 * @throws {Error} When the contract doesn't exist or the transition is invalid.
 */
export function startContract(projectRoot: string, contractId: string) {
  const contract = transitionContract(projectRoot, contractId, "running")
  return upsertAgentWorkContract(projectRoot, contract)
}

/**
 * Transition a contract from running→blocked.
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract to transition.
 * @param reason - Reason for blocking.
 * @returns Updated contract.
 * @throws {Error} When the contract doesn't exist or the transition is invalid.
 */
export function blockContract(projectRoot: string, contractId: string, reason: string) {
  const contract = transitionContract(projectRoot, contractId, "blocked")
  contract.evidence.blockedStateRules = [...contract.evidence.blockedStateRules, reason]
  return upsertAgentWorkContract(projectRoot, contract)
}

/**
 * Transition a contract from running→completed.
 *
 * Evidence gating: if contract.evidence.requiredProof is non-empty, a proof
 * string must be provided. Throws with a descriptive error listing required proofs.
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract to transition.
 * @param proof - Required completion proof (mandatory when requiredProof is non-empty).
 * @returns Updated contract.
 * @throws {Error} When the contract doesn't exist, the transition is invalid,
 * or requiredProof is non-empty and no proof provided.
 */
export function completeContract(projectRoot: string, contractId: string, proof?: string) {
  // Fetch first for evidence gate check (before transition)
  const contract = getAgentWorkContract(projectRoot, contractId)
  if (!contract) {
    throw new Error(`[Harness] agent work contract not found: ${contractId}`)
  }

  // Evidence gating: require proof when requiredProof is non-empty (REQ-CONT-02)
  if (contract.evidence.requiredProof.length > 0 && !proof) {
    throw new Error(
      `[Harness] contract ${contractId} requires proof before completion. ` +
      `Required: ${contract.evidence.requiredProof.join(", ")}`
    )
  }

  // Now do the transition
  const updated = transitionContract(projectRoot, contractId, "completed")
  if (proof) {
    updated.evidence.requiredProof = [...updated.evidence.requiredProof, proof]
  }
  return upsertAgentWorkContract(projectRoot, updated)
}

/**
 * Transition a contract from any active state to cancelled.
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract to transition.
 * @param reason - Reason for cancellation.
 * @returns Updated contract.
 * @throws {Error} When the contract doesn't exist or the transition is invalid.
 */
export function cancelContract(projectRoot: string, contractId: string, reason: string) {
  const contract = transitionContract(projectRoot, contractId, "cancelled")
  contract.evidence.blockedStateRules = [...contract.evidence.blockedStateRules, `cancelled: ${reason}`]
  return upsertAgentWorkContract(projectRoot, contract)
}

/**
 * Internal transition helper that validates and applies status changes.
 *
 * Does NOT persist — callers are responsible for a single write via
 * `upsertAgentWorkContract` after applying any additional mutations.
 *
 * @param projectRoot - Trusted project root.
 * @param contractId - Contract to transition.
 * @param targetStatus - Desired target status.
 * @returns Updated (unpersisted) contract.
 * @throws {Error} When the contract doesn't exist or the transition is invalid.
 */
function transitionContract(projectRoot: string, contractId: string, targetStatus: AgentWorkStatus) {
  const contract = getAgentWorkContract(projectRoot, contractId)
  if (!contract) {
    throw new Error(`[Harness] agent work contract not found: ${contractId}`)
  }

  const allowed = ALLOWED_TRANSITIONS[contract.status]
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `[Harness] invalid contract transition: ${contract.status}→${targetStatus} (contract ${contractId})`
    )
  }

  contract.status = targetStatus
  contract.updatedAt = Date.now()
  return contract
}
