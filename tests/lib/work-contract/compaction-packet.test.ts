import { describe, it, expect } from "vitest"
import {
  contractToCompactionPacket,
  restoreContractFromCompactionPacket,
} from "../../../src/lib/work-contract/compaction-packet.js"
import { createContract } from "../../../src/lib/work-contract/agent-work-contract.js"
import { toCompactionPacket, createKernelPacket } from "../../../src/lib/prompt-packet/index.js"
import type { SessionContinuityRecord } from "../../../src/lib/types.js"

describe("compaction-packet (AWC-04)", () => {
  const baseRecord: SessionContinuityRecord = {
    sessionID: "sess-awc",
    promptParams: { agent: "builder" },
    metadata: {
      status: "running",
      description: "AWC test",
      delegation: null,
      constraints: ["use zod"],
      updatedAt: Date.now(),
      pendingNotifications: [],
    },
  }

  it("converts contract to compaction packet using Phase 70 PPC-03", () => {
    const contract = createContract({
      ownerAgent: "builder",
      taskBoundary: "Implement schema",
      minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
    })
    contract.compaction.summary = "Schema done"
    contract.compaction.anchors = ["schema.ts:1"]

    const packet = contractToCompactionPacket(contract)
    expect(packet.packet_type).toBe("compaction")
    expect(packet.session_id).toBe(contract.id)
    expect(packet.title).toBe("Implement schema")
    expect(packet.description).toBe("Implement schema")
    expect(packet.constraints).toEqual([])
  })

  it("restores contract from compaction packet", () => {
    const contract = createContract({
      ownerAgent: "researcher",
      taskBoundary: "Research patterns",
      minimumEvidenceLevel: "L5_DOCUMENTATION",
    })

    const packet = contractToCompactionPacket(contract)
    const restored = restoreContractFromCompactionPacket(packet)
    expect(restored.id).toBe(contract.id)
    expect(restored.owner.agent).toBe("researcher")
    expect(restored.scope.taskBoundary).toBe("Research patterns")
    expect(restored.status).toBe(contract.status)
  })

  it("round-trips with Phase 70 compaction utilities", () => {
    const kernel = createKernelPacket(baseRecord)
    const compact = toCompactionPacket(kernel)
    expect(compact.packet_type).toBe("compaction")
    expect(compact.session_id).toBe("sess-awc")
    expect(compact.agent_type).toBe("builder")
  })
})
