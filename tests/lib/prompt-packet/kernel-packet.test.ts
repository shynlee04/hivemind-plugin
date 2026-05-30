import { describe, it, expect } from "vitest"
import {
  createKernelPacket,
  type KernelPacket,
  KERNEL_PACKET_VERSION,
} from "../../../src/features/prompt-packet/kernel-packet.js"
import type { SessionContinuityRecord } from "../../../src/shared/types.js"

describe("kernel-packet", () => {
  it("creates a packet with 33 normalized fields", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-123",
      promptParams: {
        agent: "builder",
        category: "implementation",
        tools: ["read_file", "edit_file"],
      },
      toolProfile: {
        allowed: ["read_file", "edit_file"],
        denied: ["delete_file"],
      },
      metadata: {
        status: "running",
        description: "Build feature X",
        delegation: null,
        constraints: ["use TypeScript", "max 500 LOC"],
        updatedAt: Date.now(),
        pendingNotifications: [],
      },
    }

    const packet = createKernelPacket(record)
    expect(packet.packet_version).toBe(KERNEL_PACKET_VERSION)
    expect(packet.packet_type).toBe("kernel")
    expect(packet.session_id).toBe("sess-123")
    expect(packet.agent_type).toBe("builder")
    expect(packet.tool_allow_list).toEqual(["read_file", "edit_file"])
    expect(packet.tool_ask_list).toEqual(["delete_file"])
    expect(packet.constraints).toEqual(["use TypeScript", "max 500 LOC"])
  })

  it("defaults missing fields gracefully", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-456",
      promptParams: {},
      metadata: {
        status: "pending",
        description: "",
        delegation: null,
        constraints: [],
        updatedAt: 0,
        pendingNotifications: [],
      },
    }

    const packet = createKernelPacket(record)
    expect(packet.agent_type).toBeNull()
    expect(packet.detected_language).toBe("unknown")
    expect(packet.todo_active).toEqual([])
    expect(packet.delegation_depth).toBe(0)
  })

  it("counts normalized fields as 33", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-count",
      promptParams: {},
      metadata: {
        status: "pending",
        description: "count fields",
        delegation: null,
        constraints: [],
        updatedAt: 0,
        pendingNotifications: [],
      },
    }

    const packet = createKernelPacket(record)
    const fields = Object.keys(packet)
    expect(fields.length).toBe(33)
  })
})
