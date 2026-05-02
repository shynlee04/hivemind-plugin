import type { KernelPacket } from "./kernel-packet.js"

/**
 * Compaction preservation packet — the minimal subset of session context
 * retained across compaction boundaries. Strips deep-module fields
 * (codemap, tool calls, etc.) that are expensive to carry forward.
 */
export type CompactionPreservationPacket = {
  packet_version: string
  packet_type: "compaction"
  session_id: string
  parent_session_id: string | null
  root_session_id: string | null
  title: string
  description: string
  purpose_category: string | null
  agent_type: string | null
  model: string | null
  constraints: string[]
  non_goals: string[]
  session_status: string
  contract_status: string | null
  lifecycle_phase: string
  delegation_depth: number
  queue_key: string | null
  run_mode: string | null
  todo_authority: "read" | "write" | "none" | null
  return_contract: string | null
  preserved_at: string
}

/**
 * Extra fields that belong to delegation context (not present on KernelPacket).
 * Passed as an optional second argument to {@link toCompactionPacket}.
 */
export type CompactionExtras = {
  /** Delegation-level todo authority. */
  todo_authority?: "read" | "write" | "none" | null
  /** Delegation-level return contract reference. */
  return_contract?: string | null
}

/**
 * Convert a kernel packet into a compaction preservation packet.
 *
 * @param kernel - The source kernel packet.
 * @param extras - Optional delegation-level fields not present on KernelPacket.
 * @returns A compaction preservation packet with stripped-down context.
 */
export function toCompactionPacket(kernel: KernelPacket, extras?: CompactionExtras): CompactionPreservationPacket {
  return {
    packet_version: kernel.packet_version,
    packet_type: "compaction",
    session_id: kernel.session_id,
    parent_session_id: kernel.parent_session_id,
    root_session_id: kernel.root_session_id,
    title: kernel.title,
    description: kernel.description,
    purpose_category: kernel.purpose_category,
    agent_type: kernel.agent_type,
    model: kernel.model,
    constraints: kernel.constraints,
    non_goals: [],
    session_status: kernel.session_status,
    contract_status: null,
    lifecycle_phase: kernel.lifecycle_phase,
    delegation_depth: kernel.delegation_depth,
    queue_key: kernel.queue_key,
    run_mode: kernel.run_mode,
    todo_authority: extras?.todo_authority ?? null,
    return_contract: extras?.return_contract ?? null,
    preserved_at: new Date().toISOString(),
  }
}

/**
 * Restore a kernel packet from a compaction preservation packet.
 *
 * Fields that exist only on CompactionPreservationPacket (non_goals,
 * contract_status, todo_authority, return_contract) are intentionally
 * not mapped back because KernelPacket does not define them.
 *
 * @param compact - The compaction preservation packet to restore from.
 * @param base - The base kernel packet providing stripped fields.
 * @returns A kernel packet with restored compaction fields.
 */
export function fromCompactionPacket(
  compact: CompactionPreservationPacket,
  base: KernelPacket,
): KernelPacket {
  return {
    ...base,
    session_id: compact.session_id,
    parent_session_id: compact.parent_session_id,
    root_session_id: compact.root_session_id,
    title: compact.title,
    description: compact.description,
    purpose_category: compact.purpose_category,
    agent_type: compact.agent_type,
    model: compact.model,
    constraints: compact.constraints,
    session_status: compact.session_status,
    lifecycle_phase: compact.lifecycle_phase,
    delegation_depth: compact.delegation_depth,
    queue_key: compact.queue_key,
    run_mode: compact.run_mode,
  }
}
