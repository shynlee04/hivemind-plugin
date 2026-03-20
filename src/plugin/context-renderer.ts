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
  // TDD-specific fields
  last_test_status?: string
  last_test_file?: string
  test_count_run?: number
  test_count_pass?: number
  next_action?: string
  // BMAD-specific fields
  current_phase?: string
  phase_sequence?: string[]
  completed_phases?: string[]
  pending_decisions?: number
  decision_refs?: string[]
  next_artifact?: string
  // Research-specific fields
  research_depth?: string
  sources_consulted?: string[]
  key_findings?: string[]
}

export interface TurnHierarchyContext {
  parent_turn_id?: string
  turn_depth: number
  turn_type: 'root' | 'delegation' | 'handoff' | 'checkpoint' | 'correction'
  sibling_count: number
  pending_parent?: string
  trajectory_path: string[]
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
 * Entry in a tool precedence chain.
 */
export interface ToolPrecedenceEntry {
  tool: string
  action: string
  args: Record<string, unknown>
}

/**
 * Chain of tools with mandatory read dependencies.
 */
export interface ToolPrecedenceChain {
  chain: ToolPrecedenceEntry[]
  mandatory_reads: { path: string; reason: string }[]
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

/**
 * Workflow style types for adaptive compaction rendering.
 */
export type WorkflowStyle = 'tdd' | 'bmad' | 'research' | 'default'

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
