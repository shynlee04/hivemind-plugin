/**
 * Context Renderer — Canonical HiveMind context packet assembly.
 *
 * Module decomposition of 560 LOC original file:
 * - context-renderer.types.ts: Type definitions (HivemindContextPacket, etc.)
 * - context-renderer.constants.ts: Constants and validation
 * - context-renderer.builder.ts: Packet creation logic
 * - context-renderer.renderers.ts: Core renderers
 * - context-renderer.compaction-renderers.ts: Workflow-specific compaction renderers
 */

// Re-export all types
export type {
  HivemindContextPacket,
  HivemindSessionIdentity,
  HivemindEntryState,
  HivemindGovernanceConfig,
  HivemindAgentWorkContract,
  HivemindTDDState,
  HivemindBMADState,
  HivemindResearchState,
  TurnHierarchyContext,
  HivemindContextPacketInput,
  ToolPrecedenceEntry,
  ToolPrecedenceChain,
  WorkflowStyle,
} from './context-renderer.types.js'

// Re-export constants
export {
  HIVEMIND_BASE_CONTEXT_KEYS,
  HIVEMIND_AGENT_WORK_CONTEXT_KEYS,
  HIVEMIND_CONTEXT_FIELD_ORDER,
} from './context-renderer.constants.js'

export type { AgentWorkContextFields } from './context-renderer.constants.js'

// Re-export builder functions
export { createHivemindContextPacket, resolveAgentWorkContextFields } from './context-renderer.builder.js'

// Re-export core renderers
export { renderHivemindContext, renderTurnHierarchy, renderToolPrecedence } from './context-renderer.renderers.js'

// Re-export compaction renderers
export {
  detectWorkflowStyle,
  renderTDDCompaction,
  renderBMADCompaction,
  renderResearchCompaction,
  renderDefaultCompaction,
} from './context-renderer.compaction-renderers.js'
