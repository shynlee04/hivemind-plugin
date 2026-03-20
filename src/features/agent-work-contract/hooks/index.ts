/**
 * Agent-Work Contract hook helpers.
 *
 * Helper-only export surface for later composition into authoritative root
 * plugin and hook owners. This barrel does not register runtime wiring.
 *
 * @module agent-work-contract/hooks
 */

export {
  AgentWorkEventPacketSchema,
  extractAgentWorkEventPacket,
  type AgentWorkEventPacket,
} from './agent-work-event-handler.js'
export {
  createCompactionPreservationPacket,
  renderCompactionPreservationContext,
} from './compaction-preservation.js'
