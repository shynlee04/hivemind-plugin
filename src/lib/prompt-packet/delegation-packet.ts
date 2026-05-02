import { createKernelPacket, type KernelPacket } from "./kernel-packet.js"
import type { SessionContinuityRecord } from "../types.js"

export type DelegationPacketExtras = {
  parent_session_id: string
  delegation_inheritance: string[]
  todo_authority: "read" | "write" | "none"
  return_contract: string
}

export type DelegationPacket = Omit<KernelPacket, "packet_type"> & DelegationPacketExtras & { packet_type: "delegation" }

export function createDelegationPacket(
  record: SessionContinuityRecord,
  options: {
    parentSessionId: string
    inheritance: string[]
    todoAuthority: "read" | "write" | "none"
    returnContract: string
  },
): DelegationPacket {
  const kernel = createKernelPacket(record)
  const meta = record.metadata
  const delegation = meta.delegation

  return {
    ...kernel,
    packet_type: "delegation",
    parent_session_id: options.parentSessionId,
    root_session_id: delegation?.rootID ?? options.parentSessionId,
    delegation_inheritance: options.inheritance,
    todo_authority: options.todoAuthority,
    return_contract: options.returnContract,
  }
}
