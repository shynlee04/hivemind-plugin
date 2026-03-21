/**
 * Type decomposition for HivemindContextPacket (44 fields → 7 intersection types)
 * All 44 fields preserved via intersection types - field access patterns unchanged.
 */

// ============================================================
// CORE IDENTITY — 5 fields
// ============================================================
/**
 * Core session identity fields that uniquely identify this HiveMind session.
 */
export interface HivemindSessionIdentity {
  session_id: string
  lineage: string
  trajectory: string
  workflow: string
  task_ids: string[]
}

// ============================================================
// ENTRY STATE — 4 fields
// ============================================================
/**
 * Entry routing and purpose classification at session start.
 */
export interface HivemindEntryState {
  entry_state: string
  purpose: string
  risk: string
  route_command: string
}

// ============================================================
// GOVERNANCE CONFIG — 2 fields
// ============================================================
/**
 * Governance mode and language preferences.
 */
export interface HivemindGovernanceConfig {
  governance_mode: string
  language: string
}

// ============================================================
// AGENT WORK CONTRACT — 10 fields
// ============================================================
/**
 * Agent work contract fields for delegated task execution.
 */
export interface HivemindAgentWorkContract {
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

// ============================================================
// TDD STATE — 5 fields
// ============================================================
/**
 * Test-driven development workflow state.
 */
export interface HivemindTDDState {
  last_test_status?: string
  last_test_file?: string
  test_count_run?: number
  test_count_pass?: number
  next_action?: string
}

// ============================================================
// BMAD STATE — 6 fields
// ============================================================
/**
 * BMAD (Brainstorm-Model-Architect-Deploy) workflow phase state.
 */
export interface HivemindBMADState {
  current_phase?: string
  phase_sequence?: string[]
  completed_phases?: string[]
  pending_decisions?: number
  decision_refs?: string[]
  next_artifact?: string
}

// ============================================================
// RESEARCH STATE — 3 fields
// ============================================================
/**
 * Research workflow state for deep investigation tasks.
 */
export interface HivemindResearchState {
  research_depth?: string
  sources_consulted?: string[]
  key_findings?: string[]
}

// ============================================================
// COMPOSED TYPE — 44 fields total
// ============================================================
/**
 * Canonical HiveMind runtime context packet.
 * Decomposed into intersection types for better type inference and maintainability.
 * Field access patterns remain unchanged (packet.session_id still works).
 */
export type HivemindContextPacket = HivemindSessionIdentity &
  HivemindEntryState &
  HivemindGovernanceConfig &
  HivemindAgentWorkContract &
  HivemindTDDState &
  HivemindBMADState &
  HivemindResearchState

// ============================================================
// SUPPORTING TYPES
// ============================================================
/**
 * Turn hierarchy context for nested delegation tracking.
 */
export interface TurnHierarchyContext {
  parent_turn_id?: string
  turn_depth: number
  turn_type: 'root' | 'delegation' | 'handoff' | 'checkpoint' | 'correction'
  sibling_count: number
  pending_parent?: string
  trajectory_path: string[]
}

/**
 * Input parameters for creating a HivemindContextPacket.
 */
export interface HivemindContextPacketInput {
  sessionId: string
  snapshot: import('../shared/runtime-attachment.js').RuntimeBindingsSnapshot
  startWork?: Pick<
    import('../features/session-entry/start-work-types.js').StartWorkDecision,
    'lineage' | 'purposeClass' | 'riskLevel' | 'requiredCommandId' | 'recommendedCommandId'
  >
  agentWorkPacket?: unknown
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
 * Workflow style types for adaptive compaction rendering.
 */
export type WorkflowStyle = 'tdd' | 'bmad' | 'research' | 'default'
