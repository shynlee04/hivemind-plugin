/**
 * Compaction preservation helper.
 *
 * Derives schema-validated contract context for later composition into the
 * authoritative inline compaction hook.
 *
 * @module agent-work-contract/hooks/compaction-preservation
 */

import {
  AgentWorkContractSchema,
  CompactionPreservationPacketSchema,
  type AgentWorkContract,
  type CompactionPreservationPacket,
} from '../schema/index.js'

function resolveWorkflowPhase(contract: AgentWorkContract): string {
  return contract.workflow.phase ?? contract.briefing?.workflowState ?? 'none'
}

function resolveBriefingSummary(contract: AgentWorkContract): string {
  return contract.briefing?.summary ?? 'none'
}

function collectTaskIds(contract: AgentWorkContract, status: 'active' | 'pending'): string[] {
  return contract.workflow.tasks
    .filter((task) => task.status === status)
    .map((task) => task.id)
}

function collectRecentAnchorDescriptions(contract: AgentWorkContract): string[] {
  return (contract.anchors ?? []).slice(-3).map((anchor) => anchor.description)
}

function renderField(name: string, value: string | string[]): string {
  return `${name}=${JSON.stringify(value)}`
}

/**
 * Create a compaction-safe preservation packet from an agent-work contract.
 *
 * @param contractInput - Unknown contract payload that must satisfy schema authority.
 * @returns Validated preservation packet for session compaction composition.
 * @example
 * ```typescript
 * const packet = createCompactionPreservationPacket(contract)
 * ```
 */
export function createCompactionPreservationPacket(contractInput: unknown): CompactionPreservationPacket {
  const contract = AgentWorkContractSchema.parse(contractInput)

  return CompactionPreservationPacketSchema.parse({
    contractId: contract.contractId,
    sessionId: contract.sessionId,
    delegationExportSessionId: contract.delegationExportSessionId,
    purposeClass: contract.userIntent.purposeClass,
    responseMode: contract.responseMode,
    workflowPhase: resolveWorkflowPhase(contract),
    activeTaskIds: collectTaskIds(contract, 'active'),
    pendingTaskIds: collectTaskIds(contract, 'pending'),
    briefingSummary: resolveBriefingSummary(contract),
    followUp: contract.briefing?.followUp ?? [],
    recentAnchorDescriptions: collectRecentAnchorDescriptions(contract),
    compactionAction: contract.chainActions.onCompaction80,
  })
}

function renderOptionalValue(value: string | undefined): string {
  return value && value.length > 0 ? value : 'none'
}

/**
 * Render a stable compaction-preservation context block from a validated packet.
 *
 * @param packetInput - Unknown packet payload to validate before rendering.
 * @returns Serialized agent-work contract compaction context block.
 * @example
 * ```typescript
 * const context = renderCompactionPreservationContext(packet)
 * ```
 */
export function renderCompactionPreservationContext(packetInput: unknown): string {
  const packet = CompactionPreservationPacketSchema.parse(packetInput)

  return [
    '<agent-work-contract-compaction version="v1">',
    renderField('contract_id', packet.contractId),
    renderField('session_id', packet.sessionId),
    renderField('delegation_export_session_id', renderOptionalValue(packet.delegationExportSessionId)),
    renderField('purpose_class', packet.purposeClass),
    renderField('response_mode', packet.responseMode),
    renderField('workflow_phase', packet.workflowPhase),
    renderField('active_task_ids', packet.activeTaskIds),
    renderField('pending_task_ids', packet.pendingTaskIds),
    renderField('briefing_summary', packet.briefingSummary),
    renderField('follow_up', packet.followUp),
    renderField('recent_anchors', packet.recentAnchorDescriptions),
    renderField('compaction_action', packet.compactionAction),
    '</agent-work-contract-compaction>',
  ].join('\n')
}
