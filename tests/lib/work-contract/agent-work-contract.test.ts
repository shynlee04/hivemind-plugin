import { describe, it, expect } from "vitest"
import {
  createContract,
  validateContract,
  updateContractStatus,
  type AgentWorkContractRuntime,
} from "../../../src/lib/work-contract/agent-work-contract.js"

describe("agent-work-contract runtime", () => {
  it("creates a contract with generated id and timestamps", () => {
    const contract = createContract({
      ownerAgent: "builder",
      taskBoundary: "Build login page",
      minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
    })
    expect(contract.id).toBeTruthy()
    expect(contract.status).toBe("created")
    expect(contract.owner.agent).toBe("builder")
    expect(contract.scope.taskBoundary).toBe("Build login page")
    expect(contract.createdAt).toBeGreaterThan(0)
    expect(contract.updatedAt).toBeGreaterThanOrEqual(contract.createdAt)
  })

  it("validates a valid contract", () => {
    const contract = createContract({
      ownerAgent: "critic",
      taskBoundary: "Review auth flow",
      minimumEvidenceLevel: "L3_STATIC_REVIEW",
    })
    const result = validateContract(contract)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.id).toBe(contract.id)
  })

  it("rejects an invalid contract", () => {
    const result = validateContract({ status: "invalid-status" })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })

  it("updates status and updatedAt", () => {
    const contract = createContract({
      ownerAgent: "researcher",
      taskBoundary: "Research options",
      minimumEvidenceLevel: "L5_DOCUMENTATION",
    })
    const originalUpdatedAt = contract.updatedAt
    const updated = updateContractStatus(contract, "running")
    expect(updated.status).toBe("running")
    expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt)
  })
})
