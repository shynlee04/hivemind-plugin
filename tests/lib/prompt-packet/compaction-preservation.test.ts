import { describe, it, expect } from "vitest"
import {
  toCompactionPacket,
  fromCompactionPacket,
  type CompactionPreservationPacket,
  type CompactionExtras,
} from "../../../src/lib/prompt-packet/compaction-preservation.js"
import { createKernelPacket, type KernelPacket } from "../../../src/lib/prompt-packet/kernel-packet.js"
import type { SessionContinuityRecord } from "../../../src/shared/types.js"

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

  it("defaults extras to null when not provided", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-extras",
      promptParams: {},
      metadata: {
        status: "pending",
        description: "test extras",
        delegation: null,
        constraints: [],
        updatedAt: 0,
        pendingNotifications: [],
      },
    }

    const kernel = createKernelPacket(record)
    const compact = toCompactionPacket(kernel)

    expect(compact.todo_authority).toBeNull()
    expect(compact.return_contract).toBeNull()
    expect(compact.non_goals).toEqual([])
    expect(compact.contract_status).toBeNull()
  })

  it("applies CompactionExtras for delegation-level fields", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-deleg",
      promptParams: {},
      metadata: {
        status: "running",
        description: "test delegation extras",
        delegation: null,
        constraints: [],
        updatedAt: 0,
        pendingNotifications: [],
      },
    }

    const kernel = createKernelPacket(record)
    const extras: CompactionExtras = {
      todo_authority: "write",
      return_contract: "result.json",
    }
    const compact = toCompactionPacket(kernel, extras)

    expect(compact.todo_authority).toBe("write")
    expect(compact.return_contract).toBe("result.json")
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

  it("fromCompactionPacket does not leak compaction-only fields into kernel", () => {
    const record: SessionContinuityRecord = {
      sessionID: "sess-leak",
      promptParams: {},
      metadata: {
        status: "running",
        description: "leak test",
        delegation: null,
        constraints: [],
        updatedAt: 0,
        pendingNotifications: [],
      },
    }

    const kernel = createKernelPacket(record)
    const extras: CompactionExtras = {
      todo_authority: "read",
      return_contract: "some-contract",
    }
    const compact = toCompactionPacket(kernel, extras)
    const hydrated = fromCompactionPacket(compact, kernel)

    // KernelPacket should NOT have these compaction-only fields
    expect("todo_authority" in hydrated).toBe(false)
    expect("return_contract" in hydrated).toBe(false)
    expect("non_goals" in hydrated).toBe(false)
    expect("contract_status" in hydrated).toBe(false)
  })
})
