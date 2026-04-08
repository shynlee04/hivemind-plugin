import { describe, it, expect, beforeEach } from "vitest"
import {
  createDelegationPacket,
  updatePacketStatus,
  addArtifact,
  addCommit,
  buildDelegationArtifactPacket,
  buildDelegationPacketParentChain,
  setPlan,
  packetToJSON,
  packetFromJSON,
  buildParentChain,
} from "../../src/lib/delegation-packet.js"
import type { DelegationPacket } from "../../src/lib/delegation-packet.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePacket(overrides?: { spec?: string; parentChain?: readonly string[] }): DelegationPacket {
  return createDelegationPacket(
    overrides?.spec ?? "Implement the delegation packet module",
    overrides?.parentChain ?? ["root-session", "current-session"],
  )
}

function buildContinuityRecord(): SessionContinuityRecord {
  const packet = createDelegationPacket("Implement continuity-derived exports", ["root-session", "child-session"])
  setPlan(packet, "1. Export packet\n2. Export manifest")

  return {
    sessionID: "child-session",
    toolProfile: {
      permissionRules: [],
      compatibleTools: ["read", "write"],
    },
    promptParams: {
      agent: "builder",
      category: "implementation",
      model: "gpt-5.4",
      temperature: 0.1,
      guidanceText: "keep it focused",
      tools: ["read", "write"],
    },
    metadata: {
      parentSessionID: "parent-session",
      rootSessionID: "root-session",
      delegation: {
        rootID: "root-session",
        depth: 1,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        model: "gpt-5.4",
        queueKey: "gpt-5.4:builder:implementation",
      },
      delegationPacket: packet,
      title: "builder: Implement continuity-derived exports",
      description: "Implement continuity-derived exports",
      category: "implementation",
      route: {
        requestedCategory: "implementation",
        category: "implementation",
        effectiveAgent: "builder",
        presetKey: "generalist-builder",
        requestedModel: "gpt-5.4",
        effectiveModel: "gpt-5.4",
        temperature: 0.1,
        fallbackUsed: true,
        rationale: "Used the explicit generalist fallback for a broad implementation task.",
        guidanceText: "Act as the broad fallback specialist when no stronger domain signal exists.",
        modelSource: "explicit",
        agentSource: "category",
        temperatureSource: "category",
        warnings: ["Specialist routing used the generalist fallback."],
      },
      constraints: ["keep continuity canonical"],
      runInBackground: true,
      status: "running",
      createdAt: 1,
      updatedAt: 2,
      lastObservedAt: 3,
    },
  }
}

// ---------------------------------------------------------------------------
// DelegationPacket
// ---------------------------------------------------------------------------

describe("DelegationPacket", () => {
  // -------------------------------------------------------------------------
  // Creation
  // -------------------------------------------------------------------------

  describe("creation", () => {
    it("createDelegationPacket returns a packet with all required fields", () => {
      const packet = makePacket()
      expect(packet.id).toMatch(/^dpkt_/)
      expect(typeof packet.spec).toBe("string")
      expect(packet.plan).toBeNull()
      expect(Array.isArray(packet.artifacts)).toBe(true)
      expect(Array.isArray(packet.commits)).toBe(true)
      expect(Array.isArray(packet.parentChain)).toBe(true)
      expect(typeof packet.status).toBe("string")
      expect(typeof packet.createdAt).toBe("number")
      expect(typeof packet.updatedAt).toBe("number")
    })

    it("packet starts with status 'pending'", () => {
      const packet = makePacket()
      expect(packet.status).toBe("pending")
    })

    it("packet includes parentChain from root to current", () => {
      const chain = ["root-session", "intermediate-session", "current-session"] as const
      const packet = createDelegationPacket("spec text", chain)
      expect(packet.parentChain).toEqual(["root-session", "intermediate-session", "current-session"])
    })

    it("packet includes spec (task description)", () => {
      const spec = "Build the delegation chain artifact format"
      const packet = createDelegationPacket(spec, ["root"])
      expect(packet.spec).toBe(spec)
    })

    it("packet plan starts as null", () => {
      const packet = makePacket()
      expect(packet.plan).toBeNull()
    })

    it("packet starts with empty artifacts list", () => {
      const packet = makePacket()
      expect(packet.artifacts).toHaveLength(0)
    })

    it("packet starts with empty commits list", () => {
      const packet = makePacket()
      expect(packet.commits).toHaveLength(0)
    })

    it("packet id is unique across multiple calls", () => {
      const a = makePacket()
      const b = makePacket()
      expect(a.id).not.toBe(b.id)
    })
  })

  // -------------------------------------------------------------------------
  // Updates
  // -------------------------------------------------------------------------

  describe("updates", () => {
    let packet: DelegationPacket

    beforeEach(() => {
      packet = makePacket()
    })

    it("updatePacketStatus changes status field", () => {
      updatePacketStatus(packet, "running")
      expect(packet.status).toBe("running")
    })

    it("updatePacketStatus updates updatedAt timestamp", () => {
      const before = packet.updatedAt
      updatePacketStatus(packet, "running")
      expect(packet.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it("updatePacketStatus rejects invalid transition: pending → completed without running", () => {
      expect(() => updatePacketStatus(packet, "completed")).toThrow(/^\[Harness\]/)
    })

    it("updatePacketStatus rejects invalid transition: completed → running (terminal)", () => {
      updatePacketStatus(packet, "running")
      updatePacketStatus(packet, "completed")
      expect(() => updatePacketStatus(packet, "running")).toThrow(/^\[Harness\]/)
    })

    it("updatePacketStatus rejects invalid transition: failed → running (terminal)", () => {
      updatePacketStatus(packet, "running")
      updatePacketStatus(packet, "failed")
      expect(() => updatePacketStatus(packet, "running")).toThrow(/^\[Harness\]/)
    })

    it("updatePacketStatus allows pending → running", () => {
      expect(() => updatePacketStatus(packet, "running")).not.toThrow()
      expect(packet.status).toBe("running")
    })

    it("updatePacketStatus allows pending → failed", () => {
      expect(() => updatePacketStatus(packet, "failed")).not.toThrow()
      expect(packet.status).toBe("failed")
    })

    it("updatePacketStatus allows running → completed", () => {
      updatePacketStatus(packet, "running")
      expect(() => updatePacketStatus(packet, "completed")).not.toThrow()
      expect(packet.status).toBe("completed")
    })

    it("updatePacketStatus allows running → failed", () => {
      updatePacketStatus(packet, "running")
      expect(() => updatePacketStatus(packet, "failed")).not.toThrow()
      expect(packet.status).toBe("failed")
    })

    it("addArtifact appends file path to artifacts list", () => {
      addArtifact(packet, "src/lib/delegation-packet.ts")
      expect(packet.artifacts).toContain("src/lib/delegation-packet.ts")
      expect(packet.artifacts).toHaveLength(1)
    })

    it("addArtifact appends multiple paths preserving order", () => {
      addArtifact(packet, "src/file-a.ts")
      addArtifact(packet, "src/file-b.ts")
      expect(packet.artifacts).toEqual(["src/file-a.ts", "src/file-b.ts"])
    })

    it("addArtifact updates updatedAt timestamp", () => {
      const before = packet.updatedAt
      addArtifact(packet, "some/path.ts")
      expect(packet.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it("addCommit appends commit SHA to commits list", () => {
      addCommit(packet, "abc123def456")
      expect(packet.commits).toContain("abc123def456")
      expect(packet.commits).toHaveLength(1)
    })

    it("addCommit appends multiple SHAs preserving order", () => {
      addCommit(packet, "sha-first")
      addCommit(packet, "sha-second")
      expect(packet.commits).toEqual(["sha-first", "sha-second"])
    })

    it("addCommit updates updatedAt timestamp", () => {
      const before = packet.updatedAt
      addCommit(packet, "abcdef")
      expect(packet.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it("setPlan sets the plan field", () => {
      setPlan(packet, "Phase 1: research. Phase 2: build.")
      expect(packet.plan).toBe("Phase 1: research. Phase 2: build.")
    })

    it("setPlan updates updatedAt timestamp", () => {
      const before = packet.updatedAt
      setPlan(packet, "some plan text")
      expect(packet.updatedAt).toBeGreaterThanOrEqual(before)
    })

    it("setPlan can overwrite a previous plan", () => {
      setPlan(packet, "first plan")
      setPlan(packet, "revised plan")
      expect(packet.plan).toBe("revised plan")
    })
  })

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------

  describe("serialization", () => {
    it("packet roundtrips through JSON.stringify/JSON.parse", () => {
      const original = makePacket()
      addArtifact(original, "src/foo.ts")
      addCommit(original, "deadbeef")
      setPlan(original, "do the thing")
      updatePacketStatus(original, "running")

      const json = JSON.stringify(original)
      const restored = JSON.parse(json) as DelegationPacket
      expect(restored.id).toBe(original.id)
      expect(restored.spec).toBe(original.spec)
      expect(restored.plan).toBe(original.plan)
      expect(restored.artifacts).toEqual(original.artifacts)
      expect(restored.commits).toEqual(original.commits)
      expect(restored.parentChain).toEqual([...original.parentChain])
      expect(restored.status).toBe(original.status)
      expect(restored.createdAt).toBe(original.createdAt)
      expect(restored.updatedAt).toBe(original.updatedAt)
    })

    it("packetToJSON produces valid JSON string", () => {
      const packet = makePacket()
      const json = packetToJSON(packet)
      expect(typeof json).toBe("string")
      expect(() => JSON.parse(json)).not.toThrow()
    })

    it("packetToJSON produces a JSON object with all packet fields", () => {
      const packet = makePacket()
      const parsed = JSON.parse(packetToJSON(packet)) as Record<string, unknown>
      expect(parsed).toHaveProperty("id")
      expect(parsed).toHaveProperty("spec")
      expect(parsed).toHaveProperty("plan")
      expect(parsed).toHaveProperty("artifacts")
      expect(parsed).toHaveProperty("commits")
      expect(parsed).toHaveProperty("parentChain")
      expect(parsed).toHaveProperty("status")
      expect(parsed).toHaveProperty("createdAt")
      expect(parsed).toHaveProperty("updatedAt")
    })

    it("fromJSON reconstructs packet from JSON", () => {
      const original = makePacket()
      addArtifact(original, "src/module.ts")
      addCommit(original, "cafebabe")
      setPlan(original, "structured plan")

      const restored = packetFromJSON(packetToJSON(original))
      expect(restored.id).toBe(original.id)
      expect(restored.spec).toBe(original.spec)
      expect(restored.plan).toBe(original.plan)
      expect(restored.artifacts).toEqual(original.artifacts)
      expect(restored.commits).toEqual(original.commits)
      expect(restored.status).toBe(original.status)
    })

    it("packetFromJSON throws [Harness] error on missing required fields", () => {
      const broken = JSON.stringify({ id: "dpkt_123" })
      expect(() => packetFromJSON(broken)).toThrow(/^\[Harness\]/)
    })

    it("packetFromJSON throws on non-JSON input", () => {
      expect(() => packetFromJSON("not json")).toThrow()
    })
  })

  // -------------------------------------------------------------------------
  // Parent chain
  // -------------------------------------------------------------------------

  describe("parentChain", () => {
    it("parentChain preserves order [root, ...intermediates, current]", () => {
      const chain = ["root-001", "mid-002", "leaf-003"] as const
      const packet = createDelegationPacket("do work", chain)
      expect([...packet.parentChain]).toEqual(["root-001", "mid-002", "leaf-003"])
    })

    it("parentChain with single session (root = self)", () => {
      const packet = createDelegationPacket("solo task", ["root-only"])
      expect([...packet.parentChain]).toEqual(["root-only"])
    })

    it("buildParentChain returns [sessionID] when session IS the root (no mapping)", () => {
      const mapping = new Map<string, string>()
      const result = buildParentChain("root-session", mapping)
      expect(result).toEqual(["root-session"])
    })

    it("buildParentChain constructs chain from session-to-root mapping", () => {
      const mapping = new Map<string, string>([["child-session", "root-session"]])
      const result = buildParentChain("child-session", mapping)
      expect(result[0]).toBe("root-session")
      expect(result[result.length - 1]).toBe("child-session")
    })

    it("buildDelegationPacketParentChain de-duplicates identical root and parent IDs", () => {
      const result = buildDelegationPacketParentChain({
        rootSessionID: "root-session",
        parentSessionID: "root-session",
        sessionID: "child-session",
      })

      expect(result).toEqual(["root-session", "child-session"])
    })

    it("buildDelegationPacketParentChain preserves root-parent-child order", () => {
      const result = buildDelegationPacketParentChain({
        rootSessionID: "root-session",
        parentSessionID: "parent-session",
        sessionID: "child-session",
      })

      expect(result).toEqual(["root-session", "parent-session", "child-session"])
    })

    it("buildParentChain with self-mapping returns single element", () => {
      const mapping = new Map<string, string>([["root-session", "root-session"]])
      const result = buildParentChain("root-session", mapping)
      expect(result).toEqual(["root-session"])
    })
  })

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  describe("validation", () => {
    it("empty spec throws [Harness] error", () => {
      expect(() => createDelegationPacket("", ["root"])).toThrow(/^\[Harness\]/)
    })

    it("whitespace-only spec throws [Harness] error", () => {
      expect(() => createDelegationPacket("   ", ["root"])).toThrow(/^\[Harness\]/)
    })

    it("empty parentChain throws [Harness] error", () => {
      expect(() => createDelegationPacket("valid spec", [])).toThrow(/^\[Harness\]/)
    })

    it("valid spec and parentChain do not throw", () => {
      expect(() => createDelegationPacket("valid spec", ["root"])).not.toThrow()
    })
  })

  describe("continuity-derived packet exports", () => {
    it("builds an artifact packet that preserves lineage and specialist metadata from continuity", () => {
      const artifactPacket = buildDelegationArtifactPacket(buildContinuityRecord())

      expect(artifactPacket.parentChain).toEqual(["root-session", "child-session"])
      expect(artifactPacket.lineage).toEqual({
        rootSessionID: "root-session",
        parentSessionID: "parent-session",
        sessionID: "child-session",
      })
      expect(artifactPacket.specialist).toMatchObject({
        effectiveAgent: "builder",
        presetKey: "generalist-builder",
        fallbackUsed: true,
        rationale: expect.any(String),
      })
      expect(artifactPacket.execution).toMatchObject({
        runInBackground: true,
        continuityStatus: "running",
      })
    })
  })
})
