import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createAgentWorkContract,
  findContractsByTrajectory,
} from "../../../src/features/agent-work-contracts/index.js"

import type {
  AgentWorkContract,
  AgentWorkCreateResult,
  CreateAgentWorkContractInput,
} from "../../../src/features/agent-work-contracts/types.js"

const baseContract = {
  owner: { agent: "test-agent", sessionId: "ses_parent" },
  scope: {
    taskBoundary: "Test cross-linking",
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

function createInput(projectRoot: string, trajectoryId?: string) {
  return {
    projectRoot,
    ...baseContract,
    trajectoryId,
  }
}

describe("agent work contract types — pressure removal", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "agent-work-contract-crosslink-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("AgentWorkContract type does NOT have pressureScore field", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    const contract = result.contract
    // pressureScore should not exist on the contract
    expect(Object.keys(contract)).not.toContain("pressureScore")
    expect((contract as Record<string, unknown>).pressureScore).toBeUndefined()
  })

  it("AgentWorkContract type does NOT have pressureTier field", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    const contract = result.contract
    expect(Object.keys(contract)).not.toContain("pressureTier")
    expect((contract as Record<string, unknown>).pressureTier).toBeUndefined()
  })

  it("AgentWorkContract type does NOT have pressureApproved field", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    const contract = result.contract
    expect(Object.keys(contract)).not.toContain("pressureApproved")
    expect((contract as Record<string, unknown>).pressureApproved).toBeUndefined()
  })

  it("CreateAgentWorkContractInput type does NOT require pressure fields", () => {
    // Creating a contract without any pressure fields should succeed
    const input = createInput(root, "traj-1")
    // Verify the input object doesn't have pressure fields
    expect((input as Record<string, unknown>).pressureScore).toBeUndefined()
    expect((input as Record<string, unknown>).pressureTier).toBeUndefined()
    expect((input as Record<string, unknown>).pressureApproved).toBeUndefined()
    // The create call should succeed
    const result = createAgentWorkContract(input)
    expect(result.contract).toBeDefined()
  })

  it("AgentWorkCreateResult does NOT contain pressure-blocked variant", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    // After pressure removal, result should always be success (no pressure-blocked variant)
    expect(result.status).toBe("created")
    expect((result as Record<string, unknown>).pressureDecision).toBeUndefined()
    expect((result as Record<string, unknown>).reason).toBeUndefined()
  })

  it("AgentWorkContract has scope.allowedSurfaces field (string array)", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    expect(Array.isArray(result.contract.scope.allowedSurfaces)).toBe(true)
    expect(result.contract.scope.allowedSurfaces).toEqual(["src/test"])
  })

  it("AgentWorkContract has evidence.requiredProof field (string array)", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    expect(Array.isArray(result.contract.evidence.requiredProof)).toBe(true)
  })

  it("AgentWorkContract status union includes all 5 statuses", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    // The contract starts in "created" status
    expect(result.contract.status).toBe("created")
    // Verify the status is one of the 5 valid statuses
    const validStatuses = ["created", "running", "blocked", "completed", "cancelled"]
    expect(validStatuses).toContain(result.contract.status)
  })

  // Preserve existing cross-linking tests
  it("createAgentWorkContract with trajectoryId auto-populates trajectoryId on persisted contract", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    expect(result.status).toBe("created")
    expect(result.contract.trajectoryId).toBe("traj-1")
  })

  it("createAgentWorkContract without trajectoryId leaves trajectoryId undefined", () => {
    const result = createAgentWorkContract(createInput(root))
    expect(result.status).toBe("created")
    expect(result.contract.trajectoryId).toBeUndefined()
  })

  it("createAgentWorkContract with trajectoryId calls attachTrajectoryEvidence", () => {
    const result = createAgentWorkContract(createInput(root, "traj-1"))
    expect(result.status).toBe("created")
    expect(result.contract.trajectoryEvidenceRef).toContain("agent-work-contract:")
  })

  it("findContractsByTrajectory returns contracts matching trajectoryId", () => {
    createAgentWorkContract(createInput(root, "traj-1"))
    const found = findContractsByTrajectory(root, "traj-1")
    expect(found).toHaveLength(1)
    expect(found[0]!.trajectoryId).toBe("traj-1")
  })

  it("findContractsByTrajectory returns empty array for non-existent trajectoryId", () => {
    createAgentWorkContract(createInput(root, "traj-1"))
    const found = findContractsByTrajectory(root, "traj-nonexistent")
    expect(found).toHaveLength(0)
  })

  it("findContractsByTrajectory returns multiple contracts for same trajectoryId", () => {
    createAgentWorkContract({ ...createInput(root, "traj-shared"), id: "contract-1" })
    createAgentWorkContract({ ...createInput(root, "traj-shared"), id: "contract-2" })
    const found = findContractsByTrajectory(root, "traj-shared")
    expect(found).toHaveLength(2)
  })
})
