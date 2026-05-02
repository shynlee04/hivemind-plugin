import { describe, it, expect } from "vitest"
import {
  toCompactionPacket,
  fromCompactionPacket,
  type CompactionPreservationPacket,
} from "../../../src/lib/prompt-packet/compaction-preservation.js"
import { createKernelPacket, type KernelPacket } from "../../../src/lib/prompt-packet/kernel-packet.js"
import type { SessionContinuityRecord } from "../../../src/lib/types.js"

describe("compaction-preservation", () => {
  it("strips kernel packet to essential fields", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-cp",
      promptParams: { agent: "builder" },
      metadata: {
        status: "running",
        description: "Build auth",
        delegation: null,
        constraints: ["use JWT"],
        updatedAt: Date.now(),
        pendingNotifications: [],
      },
    }

    const kernel = createKernelPacket(record)
    const compact = toCompactionPacket(kernel)

    expect(compact.session_id).toBe("sess-cp")
    expect(compact.agent_type).toBe("builder")
    expect(compact.constraints).toEqual(["use JWT"])
    // stripped fields should be absent
    expect("codemap_file_count" in compact).toBe(false)
    expect("recent_tool_calls" in compact).toBe(false)
  })

  it("can hydrate back to approximate kernel packet", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-hydrate",
      promptParams: {},
      metadata: {
        status: "pending",
        description: "hydrate me",
        delegation: null,
        constraints: [],
        updatedAt: 0,
        pendingNotifications: [],
      },
    }

    const kernel = createKernelPacket(record)
    const compact = toCompactionPacket(kernel)
    const hydrated = fromCompactionPacket(compact, kernel)

    expect(hydrated.session_id).toBe("sess-hydrate")
    expect(hydrated.packet_type).toBe("kernel")
    // Hydration restores missing fields from base
    expect(hydrated.codemap_file_count).toBe(kernel.codemap_file_count)
  })
})
