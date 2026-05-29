import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  blockContract,
  cancelContract,
  completeContract,
  startContract,
} from "../../../src/features/agent-work-contracts/index.js"

import { createAgentWorkContract } from "../../../src/features/agent-work-contracts/operations.js"
import { getAgentWorkContract } from "../../../src/features/agent-work-contracts/store.js"

const baseContract = {
  owner: { agent: "test-agent", sessionId: "ses_parent" },
  scope: {
    taskBoundary: "Test lifecycle transitions",
    allowedSurfaces: ["src/test"],
    dependencies: [],
    nonGoals: [],
  },
  evidence: {
    requiredProof: [],
    minimumEvidenceLevel: "L2_AUTOMATED_TEST" as const,
    verificationCommands: [],
    blockedStateRules: [],
  },
  compaction: {
    briefing: "test briefing",
    summary: "test summary",
    anchors: [],
    reinjectionPayload: "test payload",
    sourceRefs: [],
  },
}

function createInput(projectRoot: string) {
  return {
    projectRoot,
    ...baseContract,
  }
}

describe("agent work contract lifecycle", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "agent-work-contract-lifecycle-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("startContract transitions created→running", () => {
    const created = createAgentWorkContract(createInput(root))
    expect(created.status).toBe("created")

    const running = startContract(root, created.id)
    expect(running.status).toBe("running")
  })

  it("blockContract transitions running→blocked", () => {
    const created = createAgentWorkContract(createInput(root))
    startContract(root, created.id)

    const blocked = blockContract(root, created.id, "pressure exceeded")
    expect(blocked.status).toBe("blocked")
  })

  it("completeContract transitions running→completed", () => {
    const created = createAgentWorkContract(createInput(root))
    startContract(root, created.id)

    const completed = completeContract(root, created.id)
    expect(completed.status).toBe("completed")
  })

  it("cancelContract transitions created→cancelled", () => {
    const created = createAgentWorkContract(createInput(root))

    const cancelled = cancelContract(root, created.id, "user requested")
    expect(cancelled.status).toBe("cancelled")
  })

  it("cancelContract transitions running→cancelled", () => {
    const created = createAgentWorkContract(createInput(root))
    startContract(root, created.id)

    const cancelled = cancelContract(root, created.id, "user requested")
    expect(cancelled.status).toBe("cancelled")
  })

  it("cancelContract transitions blocked→cancelled", () => {
    const created = createAgentWorkContract(createInput(root))
    startContract(root, created.id)
    blockContract(root, created.id, "pressure exceeded")

    const cancelled = cancelContract(root, created.id, "user requested")
    expect(cancelled.status).toBe("cancelled")
  })

  it("startContract transitions blocked→running (re-activate)", () => {
    const created = createAgentWorkContract(createInput(root))
    startContract(root, created.id)
    blockContract(root, created.id, "pressure exceeded")

    const reactivated = startContract(root, created.id)
    expect(reactivated.status).toBe("running")
  })

  it("startContract throws for completed contract (invalid transition)", () => {
    const created = createAgentWorkContract(createInput(root))
    startContract(root, created.id)
    completeContract(root, created.id)

    expect(() => startContract(root, created.id)).toThrow("[Harness]")
  })

  it("startContract throws for cancelled contract (invalid transition)", () => {
    const created = createAgentWorkContract(createInput(root))
    cancelContract(root, created.id, "user requested")

    expect(() => startContract(root, created.id)).toThrow("[Harness]")
  })

  it("completeContract throws for created contract (invalid transition)", () => {
    const created = createAgentWorkContract(createInput(root))

    expect(() => completeContract(root, created.id)).toThrow("[Harness]")
  })

  it("blockContract throws for created contract (invalid transition)", () => {
    const created = createAgentWorkContract(createInput(root))

    expect(() => blockContract(root, created.id, "test")).toThrow("[Harness]")
  })

  it("all invalid transitions throw [Harness]-prefixed error", () => {
    const created = createAgentWorkContract(createInput(root))
    completeContract(root, startContract(root, created.id).id)

    try {
      startContract(root, created.id)
      expect.fail("should have thrown")
    } catch (error) {
      expect((error as Error).message).toMatch(/^\[Harness\]/)
    }
  })

  it("each transition updates contract.updatedAt", () => {
    const created = createAgentWorkContract(createInput(root))
    const before = created.updatedAt

    // Small delay to ensure timestamp difference
    const running = startContract(root, created.id)
    expect(running.updatedAt).toBeGreaterThanOrEqual(before)
  })

  it("cancelContract stores reason in contract", () => {
    const created = createAgentWorkContract(createInput(root))

    const cancelled = cancelContract(root, created.id, "scope changed")
    expect(cancelled.evidence.blockedStateRules).toContain("cancelled: scope changed")
  })
})
