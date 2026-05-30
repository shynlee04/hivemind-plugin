import { describe, expect, it } from "vitest"

import { createContractEnforcementHook, extractFilePaths, isPathAllowed } from "../../src/hooks/transforms/contract-enforcement.js"

import type { AgentWorkContract } from "../../src/features/agent-work-contracts/types.js"

const mockAgentContract: AgentWorkContract = {
  id: "awc_test",
  status: "running",
  owner: { agent: "test-agent" },
  scope: {
    taskBoundary: "Test enforcement",
    allowedSurfaces: ["src/", "/project/src/"],
    dependencies: [],
    nonGoals: [],
  },
  evidence: {
    requiredProof: [],
    minimumEvidenceLevel: "L2_AUTOMATED_TEST",
    verificationCommands: [],
    blockedStateRules: [],
  },
  compaction: {
    briefing: "",
    summary: "",
    anchors: [],
    reinjectionPayload: "",
    sourceRefs: [],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

describe("contract enforcement hook", () => {
  it("blocks write to file outside allowedSurfaces with correct error message", async () => {
    const hook = createContractEnforcementHook({
      projectRoot: "/tmp",
      resolveAgentName: () => "test-agent",
      getActiveContractByAgent: () => mockAgentContract,
    })

    await expect(
      hook(
        { tool: "write", sessionID: "ses_1", callID: "call_1" },
        { args: { filePath: "/outside/file.ts" } },
      ),
    ).rejects.toThrow("[Harness] contract violation: agent test-agent not allowed to modify /outside/file.ts")
  })

  it("allows write to file within allowedSurfaces (prefix match)", async () => {
    const hook = createContractEnforcementHook({
      projectRoot: "/tmp",
      resolveAgentName: () => "test-agent",
      getActiveContractByAgent: () => mockAgentContract,
    })

    await expect(
      hook(
        { tool: "write", sessionID: "ses_1", callID: "call_1" },
        { args: { filePath: "/project/src/file.ts" } },
      ),
    ).resolves.toBeUndefined()
  })

  it("allows execution when no active contract exists (D-26)", async () => {
    const hook = createContractEnforcementHook({
      projectRoot: "/tmp",
      resolveAgentName: () => "test-agent",
      getActiveContractByAgent: () => undefined, // no contract
    })

    await expect(
      hook(
        { tool: "write", sessionID: "ses_1", callID: "call_1" },
        { args: { filePath: "/outside/file.ts" } },
      ),
    ).resolves.toBeUndefined()
  })

  it("allows execution when agent name unresolvable (D-26)", async () => {
    const hook = createContractEnforcementHook({
      projectRoot: "/tmp",
      resolveAgentName: () => undefined, // unresolvable
      getActiveContractByAgent: () => mockAgentContract,
    })

    await expect(
      hook(
        { tool: "write", sessionID: "ses_unknown", callID: "call_1" },
        { args: { filePath: "/outside/file.ts" } },
      ),
    ).resolves.toBeUndefined()
  })

  it("error message includes agent name, file path, and allowed surfaces", async () => {
    const hook = createContractEnforcementHook({
      projectRoot: "/tmp",
      resolveAgentName: () => "test-agent",
      getActiveContractByAgent: () => mockAgentContract,
    })

    try {
      await hook(
        { tool: "write", sessionID: "ses_1", callID: "call_1" },
        { args: { filePath: "/outside/file.ts" } },
      )
      expect.fail("should have thrown")
    } catch (error) {
      const msg = (error as Error).message
      expect(msg).toContain("contract violation")
      expect(msg).toContain("test-agent")
      expect(msg).toContain("/outside/file.ts")
      expect(msg).toContain("src/")
    }
  })
})

describe("extractFilePaths", () => {
  it("write tool returns [filePath]", () => {
    const result = extractFilePaths("write", { args: { filePath: "/path/to/file.ts" } })
    expect(result).toEqual(["/path/to/file.ts"])
  })

  it("edit tool returns [filePath]", () => {
    const result = extractFilePaths("edit", { args: { filePath: "/path/to/file.ts" } })
    expect(result).toEqual(["/path/to/file.ts"])
  })

  it("read tool returns [] (read-only)", () => {
    const result = extractFilePaths("read", { args: { filePath: "/path/to/file.ts" } })
    expect(result).toEqual([])
  })

  it("bash tool returns [] (cannot enforce)", () => {
    const result = extractFilePaths("bash", { args: { command: "rm -rf /" } })
    expect(result).toEqual([])
  })

  it("glob tool returns [] (read-only)", () => {
    const result = extractFilePaths("glob", { args: { pattern: "**/*.ts" } })
    expect(result).toEqual([])
  })

  it("returns [] when no args present", () => {
    const result = extractFilePaths("write", {})
    expect(result).toEqual([])
  })
})

describe("isPathAllowed", () => {
  it("returns true when file starts with an allowed surface", () => {
    expect(isPathAllowed("/project/src/file.ts", ["src/"])).toBe(true)
  })

  it("returns false when file does not start with allowed surface", () => {
    expect(isPathAllowed("/project/tests/file.ts", ["src/"])).toBe(false)
  })

  it("handles multiple allowed surfaces (any match = allowed)", () => {
    expect(isPathAllowed("/project/config/file.json", ["src/", "config/", "tests/"])).toBe(true)
  })

  it("returns false for path within none of the surfaces", () => {
    expect(isPathAllowed("/project/node_modules/pkg", ["src/", "tests/"])).toBe(false)
  })
})
