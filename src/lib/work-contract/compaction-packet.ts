import type { AgentWorkContractRuntime } from "./agent-work-contract.js"
import type { CompactionPreservationPacket } from "../prompt-packet/compaction-preservation.js"

/**
 * Convert an agent work contract into a compaction preservation packet.
 *
 * Semantic mapping:
 * - contract.scope.nonGoals → packet.non_goals (out-of-scope items, NOT constraints)
 * - contract.status → packet.contract_status (contract lifecycle status)
 * - constraints defaults to [] (contracts have no dedicated constraints field)
 * - lifecycle_phase set to "contract" (contracts don't have session lifecycle phases)
 */
export function contractToCompactionPacket(
  contract: AgentWorkContractRuntime,
): CompactionPreservationPacket {
  return {
    packet_version: "1.0.0",
    packet_type: "compaction",
    session_id: contract.id,
    parent_session_id: contract.owner.parentSessionId ?? null,
    root_session_id: null,
    title: contract.scope.taskBoundary.slice(0, 120),
    description: contract.scope.taskBoundary,
    purpose_category: null,
    agent_type: contract.owner.agent,
    model: null,
    constraints: [],
    non_goals: contract.scope.nonGoals,
    session_status: contract.status,
    contract_status: contract.status,
    lifecycle_phase: "contract",
    delegation_depth: 0,
    queue_key: null,
    run_mode: null,
    todo_authority: null,
    return_contract: null,
    preserved_at: new Date().toISOString(),
  }
}

/**
 * Restore an agent work contract from a compaction preservation packet.
 *
 * Note: non_goals maps back to scope.nonGoals. Constraints are not
 * restored because contracts don't have a dedicated constraints field.
 */
export function restoreContractFromCompactionPacket(
  packet: CompactionPreservationPacket,
): AgentWorkContractRuntime {
  const now = Date.now()
  return {
    id: packet.session_id,
    status: (packet.contract_status as AgentWorkContractRuntime["status"]) ?? "created",
    owner: {
      agent: packet.agent_type ?? "unknown",
      sessionId: packet.session_id,
      parentSessionId: packet.parent_session_id ?? undefined,
    },
    scope: {
      taskBoundary: packet.description,
      allowedSurfaces: [],
      dependencies: [],
      nonGoals: packet.non_goals,
    },
    evidence: {
      requiredProof: [],
      minimumEvidenceLevel: "L5_DOCUMENTATION",
      verificationCommands: [],
      blockedStateRules: [],
    },
    compaction: {
      briefing: "",
      summary: `Restored from compaction at ${packet.preserved_at}`,
      anchors: [],
      reinjectionPayload: "",
      sourceRefs: [],
    },
    createdAt: now,
    updatedAt: now,
  }
}
