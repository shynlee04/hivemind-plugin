import { describe, it, expect } from "vitest"
import {
  createKernelPacket,
  createDelegationPacket,
  toCompactionPacket,
  fromCompactionPacket,
  KERNEL_PACKET_VERSION,
  type KernelPacket,
  type DelegationPacket,
  type CompactionPreservationPacket,
} from "../../../src/lib/prompt-packet/index.js"
import type { SessionContinuityRecord } from "../../../src/lib/types.js"

describe("prompt-packet index exports", () => {
  const baseRecord: SessionContinuityRecord = {
    sessionID: "idx-1",
    promptParams: { agent: "builder" },
    metadata: {
      status: "running",
      description: "index test",
      delegation: null,
      constraints: [],
      updatedAt: Date.now(),
      pendingNotifications: [],
    },
  }

  it("exports kernel packet factory", () => {
    const packet = createKernelPacket(baseRecord)
    expect(packet.packet_version).toBe(KERNEL_PACKET_VERSION)
    expect(packet.packet_type).toBe("kernel")
  })

  it("exports delegation packet factory", () => {
    const packet = createDelegationPacket(baseRecord, {
      parentSessionId: "p-1",
      inheritance: ["tools"],
      todoAuthority: "write",
      returnContract: "result.json",
    })
    expect((packet as DelegationPacket).packet_type).toBe("delegation")
    expect(packet.parent_session_id).toBe("p-1")
  })

  it("exports compaction round-trip", () => {
    const kernel = createKernelPacket(baseRecord)
    const compact = toCompactionPacket(kernel)
    const hydrated = fromCompactionPacket(compact, kernel)
    expect(hydrated.session_id).toBe("idx-1")
    expect(hydrated.packet_type).toBe("kernel")
  })
})
