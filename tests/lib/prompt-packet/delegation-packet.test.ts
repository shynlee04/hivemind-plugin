import { describe, it, expect } from "vitest"
import {
  createDelegationPacket,
  type DelegationPacket,
} from "../../../src/features/prompt-packet/delegation-packet.js"
import type { SessionContinuityRecord } from "../../../src/shared/types.js"

describe("delegation-packet", () => {
  it("extends kernel packet with 4 delegation fields", () => {
    const record: SessionContinuityRecord = {
      sessionID: "child-1",
      promptParams: { agent: "researcher" },
      metadata: {
        status: "running",
        description: "Research API options",
        delegation: {
          rootID: "root-1",
          depth: 1,
          budgetUsed: 0,
          agent: "researcher",
          queueKey: "research-queue",
        },
        constraints: [],
        updatedAt: Date.now(),
        pendingNotifications: [],
      },
    }

    const packet = createDelegationPacket(record, {
      parentSessionId: "parent-1",
      inheritance: ["context", "tools"],
      todoAuthority: "read",
      returnContract: "deliver summary markdown",
    })

    expect(packet.packet_type).toBe("delegation")
    expect(packet.session_id).toBe("child-1")
    expect(packet.parent_session_id).toBe("parent-1")
    expect(packet.delegation_inheritance).toEqual(["context", "tools"])
    expect(packet.todo_authority).toBe("read")
    expect(packet.return_contract).toBe("deliver summary markdown")
    expect(packet.delegation_depth).toBe(1)
  })

  it("inherits kernel fields from record", () => {
    const record: SessionContinuityRecord = {
      sessionID: "child-2",
      promptParams: { agent: "critic", model: "gpt-4", temperature: 0.2 },
      metadata: {
        status: "pending",
        description: "Review PR",
        delegation: {
          rootID: "root-2",
          depth: 2,
          budgetUsed: 1,
          agent: "critic",
          queueKey: "review-queue",
        },
        constraints: ["be thorough"],
        updatedAt: Date.now(),
        pendingNotifications: [],
      },
    }

    const packet = createDelegationPacket(record, {
      parentSessionId: "parent-2",
      inheritance: ["context"],
      todoAuthority: "none",
      returnContract: "deliver verdict",
    })

    expect(packet.agent_type).toBe("critic")
    expect(packet.model).toBe("gpt-4")
    expect(packet.temperature).toBe(0.2)
    expect(packet.constraints).toContain("be thorough")
  })
})
