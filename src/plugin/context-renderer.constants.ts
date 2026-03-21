/**
 * Context renderer constants and validation.
 * HIVEMIND_BASE_CONTEXT_KEYS + HIVEMIND_AGENT_WORK_CONTEXT_KEYS must not collide.
 */

import type { HivemindContextPacket } from './context-renderer.types.js'

/**
 * Base context keys — core session identity and entry state (11 fields).
 */
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

/**
 * Agent-work additive context keys — contract, TDD, BMAD, research fields (20 fields).
 */
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
  // TDD-specific fields
  'last_test_status',
  'last_test_file',
  'test_count_run',
  'test_count_pass',
  'next_action',
  // BMAD-specific fields
  'current_phase',
  'phase_sequence',
  'completed_phases',
  'pending_decisions',
  'decision_refs',
  'next_artifact',
  // Research-specific fields
  'research_depth',
  'sources_consulted',
  'key_findings',
] as const

/**
 * Stable field order for rendering — base first, then agent-work additive.
 */
export const HIVEMIND_CONTEXT_FIELD_ORDER = [
  ...HIVEMIND_BASE_CONTEXT_KEYS,
  ...HIVEMIND_AGENT_WORK_CONTEXT_KEYS,
] as const

/**
 * Type for agent-work context fields extracted from agent work packet.
 */
export type AgentWorkContextFields = Pick<
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
  | 'last_test_status'
  | 'last_test_file'
  | 'test_count_run'
  | 'test_count_pass'
  | 'next_action'
  | 'current_phase'
  | 'phase_sequence'
  | 'completed_phases'
  | 'pending_decisions'
  | 'decision_refs'
  | 'next_artifact'
  | 'research_depth'
  | 'sources_consulted'
  | 'key_findings'
>

/**
 * Validate that base and agent-work key sets do not overlap.
 * Throws if collision detected — this is a build-time safety check.
 */
function validateContextKeyCollisions(): void {
  const collisions = HIVEMIND_AGENT_WORK_CONTEXT_KEYS.filter((key) =>
    HIVEMIND_BASE_CONTEXT_KEYS.includes(key as typeof HIVEMIND_BASE_CONTEXT_KEYS[number]),
  )
  if (collisions.length > 0) {
    throw new Error(`Agent-work context field collision detected: ${collisions.join(', ')}`)
  }
}

// Run validation once at module load
validateContextKeyCollisions()
