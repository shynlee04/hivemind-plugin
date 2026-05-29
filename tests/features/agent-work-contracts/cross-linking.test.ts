import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createAgentWorkContract,
  findContractsByTrajectory,
} from "../../../src/features/agent-work-contracts/index.js"

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

describe("agent work contract cross-linking", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "agent-work-contract-crosslink-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

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
    // The trajectory evidence ref should be set
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
