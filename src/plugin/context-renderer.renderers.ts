/**
 * Core renderers for HiveMind context blocks.
 */

import type { HivemindContextPacket, TurnHierarchyContext, ToolPrecedenceChain } from './context-renderer.types.js'

/**
 * Render a single field as name=value.
 */
function renderField(name: string, value: string | string[]): string {
  return `${name}=${JSON.stringify(value)}`
}

/**
 * Resolve packet value with fallback to 'none' for empty strings.
 */
function resolvePacketValue(value: string | undefined): string {
  return value && value.length > 0 ? value : 'none'
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

/**
 * Render the turn hierarchy context block.
 *
 * @param context Turn hierarchy context fields.
 * @returns Serialized `<hivemind-turn-hierarchy>` block.
 */
export function renderTurnHierarchy(context: TurnHierarchyContext): string {
  const lines: string[] = [
    '<hivemind-turn-hierarchy>',
    renderField('turn_depth', String(context.turn_depth)),
    renderField('turn_type', context.turn_type),
  ]

  if (context.parent_turn_id) {
    lines.push(renderField('parent_turn_id', context.parent_turn_id))
  }

  lines.push(renderField('sibling_count', String(context.sibling_count)))
  lines.push(renderField('trajectory_path', context.trajectory_path))

  if (context.pending_parent) {
    lines.push(renderField('pending_parent', context.pending_parent))
  } else {
    lines.push('pending_parent=none')
  }

  lines.push('</hivemind-turn-hierarchy>')
  return lines.join('\n')
}

/**
 * Render tool precedence chain as structured JSON for command execution.
 *
 * @param chain Tool precedence chain with ordered tools and mandatory reads.
 * @returns JSON string with execution_rule, tool_precedence array, and mandatory_reads array.
 */
export function renderToolPrecedence(chain: ToolPrecedenceChain): string {
  return JSON.stringify({
    execution_rule: 'tool-precedence-chain',
    tool_precedence: chain.chain.map((entry) => ({
      tool: entry.tool,
      action: entry.action,
      args: entry.args,
    })),
    mandatory_reads: chain.mandatory_reads,
  })
}
