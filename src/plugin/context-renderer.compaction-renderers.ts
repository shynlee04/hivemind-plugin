/**
 * Workflow-specific compaction renderers.
 * TDD, BMAD, Research, and Default compaction styles.
 */

import type { HivemindContextPacket, WorkflowStyle } from './context-renderer.types.js'

/**
 * Resolve packet value with fallback to 'none' for empty strings.
 */
function resolvePacketValue(value: string | undefined): string {
  return value && value.length > 0 ? value : 'none'
}

/**
 * Render a single field as name=value.
 */
function renderField(name: string, value: string | string[]): string {
  return `${name}=${JSON.stringify(value)}`
}

/**
 * Detect workflow style from a HivemindContextPacket.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Detected workflow style.
 */
export function detectWorkflowStyle(packet: HivemindContextPacket): WorkflowStyle {
  // Research-brainstorm purposeClass always maps to research style
  if (packet.purpose === 'research-brainstorm') {
    return 'research'
  }

  // Quick-action purposeClass always maps to default style
  if (packet.purpose === 'quick-action') {
    return 'default'
  }

  // Project-driven purposeClass: detect from workflow_phase
  if (packet.purpose === 'project-driven' || !packet.purpose) {
    const phase = packet.workflow_phase?.toLowerCase() ?? ''

    // Detect TDD workflow phases
    if (
      phase.includes('test') ||
      phase.includes('tdd') ||
      phase.includes('red') ||
      phase.includes('green') ||
      phase.includes('refactor')
    ) {
      return 'tdd'
    }

    // Detect BMAD workflow phases
    if (
      phase.includes('discovery') ||
      phase.includes('planning') ||
      phase.includes('implementation') ||
      phase.includes('review') ||
      phase.includes('bmad')
    ) {
      return 'bmad'
    }

    // Default for project-driven without specific phase detection
    return 'default'
  }

  return 'default'
}

/**
 * Render TDD-style compaction output.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Serialized `<hivemind-compaction workflow_style='tdd'>` block.
 */
export function renderTDDCompaction(packet: HivemindContextPacket): string {
  const lines: string[] = [
    `<hivemind-compaction workflow_style='tdd'>`,
    renderField('session_id', packet.session_id),
    renderField('purpose', packet.purpose),
  ]

  // Agent-work contract fields (must be preserved when contract exists)
  if (packet.contract_id) {
    lines.push(renderField('contract_id', packet.contract_id))
    lines.push(renderField('response_mode', resolvePacketValue(packet.response_mode)))
    lines.push(renderField('workflow_phase', resolvePacketValue(packet.workflow_phase)))
    lines.push(renderField('compaction_action', resolvePacketValue(packet.compaction_action)))
  }

  // TDD-specific fields (use snake_case from HivemindContextPacket)
  if (packet.last_test_status) {
    lines.push(`last_test_status='${packet.last_test_status}'`)
  }
  if (packet.last_test_file) {
    lines.push(`last_test_file='${packet.last_test_file}'`)
  }
  if (packet.test_count_run !== undefined) {
    lines.push(`test_count_run=${packet.test_count_run}`)
  }
  if (packet.test_count_pass !== undefined) {
    lines.push(`test_count_pass=${packet.test_count_pass}`)
  }
  if (packet.next_action) {
    lines.push(`next_action=${packet.next_action}`)
  }

  // Standard fields
  lines.push(renderField('recent_anchors', packet.recent_anchors ?? []))
  lines.push(renderField('pending_task_ids', packet.pending_task_ids ?? []))
  lines.push(renderField('active_task_ids', packet.active_task_ids ?? []))

  lines.push('</hivemind-compaction>')
  return lines.join('\n')
}

/**
 * Render BMAD-style compaction output.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Serialized `<hivemind-compaction workflow_style='bmad'>` block.
 */
export function renderBMADCompaction(packet: HivemindContextPacket): string {
  const lines: string[] = [
    `<hivemind-compaction workflow_style='bmad'>`,
    renderField('session_id', packet.session_id),
  ]

  // Agent-work contract fields (must be preserved when contract exists)
  if (packet.contract_id) {
    lines.push(renderField('contract_id', packet.contract_id))
    lines.push(renderField('response_mode', resolvePacketValue(packet.response_mode)))
    lines.push(renderField('workflow_phase', resolvePacketValue(packet.workflow_phase)))
    lines.push(renderField('compaction_action', resolvePacketValue(packet.compaction_action)))
  }

  // BMAD-specific fields (use snake_case from HivemindContextPacket)
  if (packet.current_phase) {
    lines.push(`current_phase='${packet.current_phase}'`)
  }
  if (packet.phase_sequence && packet.phase_sequence.length > 0) {
    lines.push(`phase_sequence=${JSON.stringify(packet.phase_sequence)}`)
  }
  if (packet.completed_phases && packet.completed_phases.length > 0) {
    lines.push(`completed_phases=${JSON.stringify(packet.completed_phases)}`)
  }
  if (packet.pending_decisions !== undefined) {
    lines.push(`pending_decisions=${packet.pending_decisions}`)
  }
  if (packet.decision_refs && packet.decision_refs.length > 0) {
    lines.push(`decision_refs=${JSON.stringify(packet.decision_refs)}`)
  }
  if (packet.next_artifact) {
    lines.push(`next_artifact='${packet.next_artifact}'`)
  }

  // Standard fields
  lines.push(renderField('recent_anchors', packet.recent_anchors ?? []))
  lines.push(renderField('active_task_ids', packet.active_task_ids ?? []))
  lines.push(renderField('pending_task_ids', packet.pending_task_ids ?? []))

  lines.push('</hivemind-compaction>')
  return lines.join('\n')
}

/**
 * Render Research-style compaction output.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Serialized `<hivemind-compaction workflow_style='research'>` block.
 */
export function renderResearchCompaction(packet: HivemindContextPacket): string {
  const lines: string[] = [
    `<hivemind-compaction workflow_style='research'>`,
    renderField('session_id', packet.session_id),
    `purpose='${packet.purpose}'`,
  ]

  // Agent-work contract fields (must be preserved when contract exists)
  if (packet.contract_id) {
    lines.push(renderField('contract_id', packet.contract_id))
    lines.push(renderField('response_mode', resolvePacketValue(packet.response_mode)))
    lines.push(renderField('workflow_phase', resolvePacketValue(packet.workflow_phase)))
    lines.push(renderField('compaction_action', resolvePacketValue(packet.compaction_action)))
  }

  // Research-specific fields (use snake_case from HivemindContextPacket)
  if (packet.research_depth) {
    lines.push(`research_depth='${packet.research_depth}'`)
  }
  if (packet.sources_consulted && packet.sources_consulted.length > 0) {
    lines.push(`sources_consulted=${JSON.stringify(packet.sources_consulted)}`)
  }
  if (packet.key_findings && packet.key_findings.length > 0) {
    lines.push(`key_findings=${JSON.stringify(packet.key_findings)}`)
  }

  // Standard fields
  lines.push(renderField('recent_anchors', packet.recent_anchors ?? []))
  lines.push(renderField('pending_task_ids', packet.pending_task_ids ?? []))
  lines.push(renderField('active_task_ids', packet.active_task_ids ?? []))

  lines.push('</hivemind-compaction>')
  return lines.join('\n')
}

/**
 * Render Default-style compaction output.
 *
 * @param packet Canonical runtime packet fields.
 * @returns Serialized `<hivemind-compaction workflow_style='default'>` block.
 */
export function renderDefaultCompaction(packet: HivemindContextPacket): string {
  const lines: string[] = [
    `<hivemind-compaction workflow_style='default'>`,
    renderField('session_id', packet.session_id),
    renderField('purpose', packet.purpose),
    renderField('workflow', packet.workflow),
    renderField('trajectory', packet.trajectory),
  ]

  // Agent-work contract fields (must be preserved when contract exists)
  if (packet.contract_id) {
    lines.push(renderField('contract_id', packet.contract_id))
    lines.push(renderField('response_mode', resolvePacketValue(packet.response_mode)))
    lines.push(renderField('workflow_phase', resolvePacketValue(packet.workflow_phase)))
    lines.push(renderField('compaction_action', resolvePacketValue(packet.compaction_action)))
  }

  // Standard fields
  lines.push(renderField('recent_anchors', packet.recent_anchors ?? []))
  lines.push(renderField('pending_task_ids', packet.pending_task_ids ?? []))
  lines.push(renderField('active_task_ids', packet.active_task_ids ?? []))
  lines.push(renderField('briefing_summary', resolvePacketValue(packet.briefing_summary)))

  lines.push('</hivemind-compaction>')
  return lines.join('\n')
}
