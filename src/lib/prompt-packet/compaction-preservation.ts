import type { KernelPacket } from "./kernel-packet.js"

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
  session_status: string
  lifecycle_phase: string
  delegation_depth: number
  queue_key: string | null
  run_mode: string | null
  todo_authority: "read" | "write" | "none" | null
  return_contract: string | null
  preserved_at: string
}

export function toCompactionPacket(kernel: KernelPacket): CompactionPreservationPacket {
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
    session_status: kernel.session_status,
    lifecycle_phase: kernel.lifecycle_phase,
    delegation_depth: kernel.delegation_depth,
    queue_key: kernel.queue_key,
    run_mode: kernel.run_mode,
    todo_authority: (kernel as Record<string, unknown>).todo_authority as "read" | "write" | "none" | null ?? null,
    return_contract: (kernel as Record<string, unknown>).return_contract as string | null ?? null,
    preserved_at: new Date().toISOString(),
  }
}

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
