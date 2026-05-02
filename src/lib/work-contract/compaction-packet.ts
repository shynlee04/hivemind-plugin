import type { AgentWorkContractRuntime } from "./agent-work-contract.js"
import type { CompactionPreservationPacket } from "../prompt-packet/compaction-preservation.js"

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
    constraints: contract.scope.nonGoals,
    session_status: contract.status,
    lifecycle_phase: contract.status,
    delegation_depth: 0,
    queue_key: null,
    run_mode: null,
    todo_authority: null,
    return_contract: null,
    preserved_at: new Date().toISOString(),
  }
}

export function restoreContractFromCompactionPacket(
  packet: CompactionPreservationPacket,
): AgentWorkContractRuntime {
  const now = Date.now()
  return {
    id: packet.session_id,
    status: (packet.session_status as AgentWorkContractRuntime["status"]) ?? "created",
    owner: {
      agent: packet.agent_type ?? "unknown",
      sessionId: packet.session_id,
      parentSessionId: packet.parent_session_id ?? undefined,
    },
    scope: {
      taskBoundary: packet.description,
      allowedSurfaces: [],
      dependencies: [],
      nonGoals: packet.constraints,
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
