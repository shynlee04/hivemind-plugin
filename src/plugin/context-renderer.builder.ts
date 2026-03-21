/**
 * Builder functions for HivemindContextPacket creation.
 */

import { CompactionPreservationPacketSchema } from '../features/agent-work-contract/schema/contract.js'
import type { StartWorkDecision } from '../features/session-entry/start-work-types.js'
import type { HivemindContextPacket, HivemindContextPacketInput } from './context-renderer.types.js'
import type { AgentWorkContextFields } from './context-renderer.constants.js'

/**
 * Resolve packet value with fallback to 'none' for empty strings.
 */
function resolvePacketValue(value: string | undefined): string {
  return value && value.length > 0 ? value : 'none'
}

/**
 * Resolve route command from startWork decision.
 */
function resolveRouteCommand(
  startWork?: Pick<StartWorkDecision, 'requiredCommandId' | 'recommendedCommandId'>,
): string {
  return resolvePacketValue(startWork?.requiredCommandId ?? startWork?.recommendedCommandId)
}

/**
 * Extract agent-work context fields from agent work packet.
 * Uses contract schema for validation.
 */
export function resolveAgentWorkContextFields(agentWorkPacket: unknown): AgentWorkContextFields {
  const packet = CompactionPreservationPacketSchema.parse(agentWorkPacket)

  return {
    contract_id: packet.contractId,
    delegation_export_session_id: resolvePacketValue(packet.delegationExportSessionId),
    response_mode: packet.responseMode,
    workflow_phase: packet.workflowPhase,
    active_task_ids: packet.activeTaskIds,
    pending_task_ids: packet.pendingTaskIds,
    briefing_summary: packet.briefingSummary,
    follow_up: packet.followUp,
    recent_anchors: packet.recentAnchorDescriptions,
    compaction_action: packet.compactionAction,
    // TDD-specific fields
    last_test_status: packet.lastTestStatus,
    last_test_file: packet.lastTestFile,
    test_count_run: packet.testCountRun,
    test_count_pass: packet.testCountPass,
    next_action: packet.nextAction,
    // BMAD-specific fields
    current_phase: packet.currentPhase,
    phase_sequence: packet.phaseSequence,
    completed_phases: packet.completedPhases,
    pending_decisions: packet.pendingDecisions,
    decision_refs: packet.decisionRefs,
    next_artifact: packet.nextArtifact,
    // Research-specific fields
    research_depth: packet.researchDepth,
    sources_consulted: packet.sourcesConsulted,
    key_findings: packet.keyFindings,
  }
}

/**
 * Map runtime snapshot and routing state into the authoritative packet fields.
 *
 * @param input Session, snapshot, and optional routing decision state.
 * @returns Canonical packet fields for runtime injection and compaction.
 */
export function createHivemindContextPacket(input: HivemindContextPacketInput): HivemindContextPacket {
  // Determine purpose from startWork first, then agentWorkPacket, then snapshot default
  let purpose: string = input.startWork?.purposeClass ?? input.snapshot.defaultPurposeClass
  if (!input.startWork?.purposeClass && input.agentWorkPacket) {
    try {
      const parsedPacket = CompactionPreservationPacketSchema.parse(input.agentWorkPacket)
      if (parsedPacket.purposeClass) {
        purpose = parsedPacket.purposeClass
      }
    } catch {
      // Fall back to snapshot default if agentWorkPacket parsing fails
    }
  }

  return {
    session_id: input.sessionId,
    lineage: input.startWork?.lineage ?? input.snapshot.defaultLineage,
    trajectory: resolvePacketValue(input.snapshot.trajectoryId),
    workflow: resolvePacketValue(input.snapshot.workflowId),
    task_ids: input.snapshot.taskIds,
    entry_state: input.snapshot.entryState,
    purpose,
    risk: input.startWork?.riskLevel ?? 'none',
    route_command: resolveRouteCommand(input.startWork),
    governance_mode: input.snapshot.governanceMode,
    language: input.snapshot.language,
    ...(input.agentWorkPacket ? resolveAgentWorkContextFields(input.agentWorkPacket) : {}),
  }
}
