import type { RuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import { CompactionPreservationPacketSchema } from '../features/agent-work-contract/schema/contract.js'
import type { StartWorkDecision } from '../features/session-entry/start-work-types.js'

export interface HivemindContextPacket {
  session_id: string
  lineage: string
  trajectory: string
  workflow: string
  task_ids: string[]
  entry_state: string
  purpose: string
  risk: string
  route_command: string
  governance_mode: string
  language: string
  contract_id?: string
  delegation_export_session_id?: string
  response_mode?: string
  workflow_phase?: string
  active_task_ids?: string[]
  pending_task_ids?: string[]
  briefing_summary?: string
  follow_up?: string[]
  recent_anchors?: string[]
  compaction_action?: string
}

export interface HivemindContextPacketInput {
  sessionId: string
  snapshot: RuntimeBindingsSnapshot
  startWork?: Pick<StartWorkDecision, 'lineage' | 'purposeClass' | 'riskLevel' | 'requiredCommandId' | 'recommendedCommandId'>
  agentWorkPacket?: unknown
}

export const HIVEMIND_BASE_CONTEXT_KEYS = [
  'session_id',
  'lineage',
  'trajectory',
  'workflow',
  'task_ids',
  'entry_state',
  'purpose',
  'risk',
  'route_command',
  'governance_mode',
  'language',
] as const

export const HIVEMIND_AGENT_WORK_CONTEXT_KEYS = [
  'contract_id',
  'delegation_export_session_id',
  'response_mode',
  'workflow_phase',
  'active_task_ids',
  'pending_task_ids',
  'briefing_summary',
  'follow_up',
  'recent_anchors',
  'compaction_action',
] as const

export const HIVEMIND_CONTEXT_FIELD_ORDER = [
  ...HIVEMIND_BASE_CONTEXT_KEYS,
  ...HIVEMIND_AGENT_WORK_CONTEXT_KEYS,
] as const

type AgentWorkContextFields = Pick<
  HivemindContextPacket,
  | 'contract_id'
  | 'delegation_export_session_id'
  | 'response_mode'
  | 'workflow_phase'
  | 'active_task_ids'
  | 'pending_task_ids'
  | 'briefing_summary'
  | 'follow_up'
  | 'recent_anchors'
  | 'compaction_action'
>

function validateContextKeyCollisions(): void {
  const collisions = HIVEMIND_AGENT_WORK_CONTEXT_KEYS.filter((key) => HIVEMIND_BASE_CONTEXT_KEYS.includes(key as typeof HIVEMIND_BASE_CONTEXT_KEYS[number]))
  if (collisions.length > 0) {
    throw new Error(`Agent-work context field collision detected: ${collisions.join(', ')}`)
  }
}

function resolveAgentWorkContextFields(agentWorkPacket: unknown): AgentWorkContextFields {
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
  }
}

function renderField(name: string, value: string | string[]): string {
  return `${name}=${JSON.stringify(value)}`
}

validateContextKeyCollisions()

function resolvePacketValue(value: string | undefined): string {
  return value && value.length > 0 ? value : 'none'
}

function resolveRouteCommand(
  startWork?: Pick<StartWorkDecision, 'requiredCommandId' | 'recommendedCommandId'>,
): string {
  return resolvePacketValue(startWork?.requiredCommandId ?? startWork?.recommendedCommandId)
}

/**
 * Map runtime snapshot and routing state into the authoritative packet fields.
 *
 * @param input Session, snapshot, and optional routing decision state.
 * @returns Canonical packet fields for runtime injection and compaction.
 */
export function createHivemindContextPacket(input: HivemindContextPacketInput): HivemindContextPacket {
  return {
    session_id: input.sessionId,
    lineage: input.startWork?.lineage ?? input.snapshot.defaultLineage,
    trajectory: resolvePacketValue(input.snapshot.trajectoryId),
    workflow: resolvePacketValue(input.snapshot.workflowId),
    task_ids: input.snapshot.taskIds,
    entry_state: input.snapshot.entryState,
    purpose: input.startWork?.purposeClass ?? input.snapshot.defaultPurposeClass,
    risk: input.startWork?.riskLevel ?? 'none',
    route_command: resolveRouteCommand(input.startWork),
    governance_mode: input.snapshot.governanceMode,
    language: input.snapshot.language,
    ...(input.agentWorkPacket ? resolveAgentWorkContextFields(input.agentWorkPacket) : {}),
  }
}

/**
 * Render the canonical HiveMind runtime packet in stable field order.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Serialized `<hivemind context_version="v1">` block.
 */
export function renderHivemindContext(packet: HivemindContextPacket): string {
  const agentWorkLines = packet.contract_id
    ? [
      renderField('contract_id', packet.contract_id),
      renderField('delegation_export_session_id', resolvePacketValue(packet.delegation_export_session_id)),
      renderField('response_mode', resolvePacketValue(packet.response_mode)),
      renderField('workflow_phase', resolvePacketValue(packet.workflow_phase)),
      renderField('active_task_ids', packet.active_task_ids ?? []),
      renderField('pending_task_ids', packet.pending_task_ids ?? []),
      renderField('briefing_summary', resolvePacketValue(packet.briefing_summary)),
      renderField('follow_up', packet.follow_up ?? []),
      renderField('recent_anchors', packet.recent_anchors ?? []),
      renderField('compaction_action', resolvePacketValue(packet.compaction_action)),
    ]
    : []

  return [
    '<hivemind context_version="v1">',
    renderField('session_id', packet.session_id),
    renderField('lineage', packet.lineage),
    renderField('trajectory', packet.trajectory),
    renderField('workflow', packet.workflow),
    renderField('task_ids', packet.task_ids),
    renderField('entry_state', packet.entry_state),
    renderField('purpose', packet.purpose),
    renderField('risk', packet.risk),
    renderField('route_command', packet.route_command),
    renderField('governance_mode', packet.governance_mode),
    renderField('language', packet.language),
    ...agentWorkLines,
    '</hivemind>',
  ].join('\n')
}
