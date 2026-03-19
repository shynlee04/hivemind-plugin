import type { RuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import type { StartWorkDecision } from '../hooks/start-work/start-work-types.js'

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
}

export interface HivemindContextPacketInput {
  sessionId: string
  snapshot: RuntimeBindingsSnapshot
  startWork?: Pick<StartWorkDecision, 'lineage' | 'purposeClass' | 'riskLevel' | 'requiredCommandId' | 'recommendedCommandId'>
}

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
  }
}

/**
 * Render the canonical HiveMind runtime packet in stable field order.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Serialized `<hivemind context_version="v1">` block.
 */
export function renderHivemindContext(packet: HivemindContextPacket): string {
  return [
    '<hivemind context_version="v1">',
    `session_id=${packet.session_id}`,
    `lineage=${packet.lineage}`,
    `trajectory=${packet.trajectory}`,
    `workflow=${packet.workflow}`,
    `task_ids=${packet.task_ids.join(',')}`,
    `entry_state=${packet.entry_state}`,
    `purpose=${packet.purpose}`,
    `risk=${packet.risk}`,
    `route_command=${packet.route_command}`,
    `governance_mode=${packet.governance_mode}`,
    `language=${packet.language}`,
    '</hivemind>',
  ].join('\n')
}
