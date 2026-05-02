import { createKernelPacket, type KernelPacket } from "./kernel-packet.js"
import type { SessionContinuityRecord } from "../types.js"

/**
 * Extra fields specific to delegation packets, beyond the kernel base.
 *
 * @property parent_session_id - ID of the parent session that initiated the delegation.
 * @property delegation_inheritance - List of inherited properties from the parent context.
 * @property todo_authority - The delegation's authority level for todo operations.
 * @property return_contract - Contract reference for the delegation's return value.
 */
export type DelegationPacketExtras = {
  parent_session_id: string
  delegation_inheritance: string[]
  todo_authority: "read" | "write" | "none"
  return_contract: string
}

/**
 * A prompt packet for delegated sub-agent sessions.
 *
 * Extends {@link KernelPacket} with delegation-specific fields
 * and overrides `packet_type` to `"delegation"`.
 */
export type DelegationPacket = Omit<KernelPacket, "packet_type"> & DelegationPacketExtras & { packet_type: "delegation" }

/**
 * Create a delegation packet from a session continuity record.
 *
 * Builds a kernel packet base, then layers on delegation-specific
 * fields such as parent session, inheritance chain, and return contract.
 *
 * @param record - The session continuity record to derive context from.
 * @param options - Delegation-specific configuration.
 * @param options.parentSessionId - ID of the parent (delegating) session.
 * @param options.inheritance - Properties inherited from the parent context.
 * @param options.todoAuthority - Todo read/write/none authority for this delegation.
 * @param options.returnContract - Contract reference for the delegation result.
 * @returns A fully formed {@link DelegationPacket}.
 *
 * @example
 * ```typescript
 * const packet = createDelegationPacket(record, {
 *   parentSessionId: "parent-123",
 *   inheritance: ["constraints", "scope"],
 *   todoAuthority: "write",
 *   returnContract: "return-evidence",
 * })
 * ```
 */
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
