#!/usr/bin/env node
/**
 * handoff-packet-builder.cjs - Build delegation packet
 * 
 * Constructs a bounded handoff packet with:
 * - Scope declaration
 * - Parent context link
 * - Result contract
 * - Expiration policy
 */

const scope = process.argv[2] || '';
const parentId = process.env.OPENCODE_SESSION_ID || '';
const agentName = process.argv[3] || 'unknown';

function buildPacket(scope, parentId, agentName) {
  const packet = {
    version: '1.0',
    scope: scope,
    parent_context: {
      session_id: parentId,
      link_timestamp: new Date().toISOString()
    },
    result_contract: {
      format: 'json',
      required_fields: ['status', 'evidence', 'completion']
    },
    delegation_chain: {
      delegator: 'orchestrator',
      executor: agentName,
      created_at: new Date().toISOString()
    }
  };

  console.log(JSON.stringify(packet, null, 2));
  return packet;
}

buildPacket(scope, parentId, agentName);
