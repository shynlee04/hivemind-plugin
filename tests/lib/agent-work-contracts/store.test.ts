import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  createAgentWorkContract,
  exportAgentWorkContract,
  getAgentWorkContractsFilePath,
  readAgentWorkContracts,
} from "../../../src/features/agent-work-contracts/index.js"

const baseContract = {
  owner: { agent: "gsd-executor", sessionId: "ses_parent" },
  scope: {
    taskBoundary: "Implement bounded contract storage",
    allowedSurfaces: ["src/lib/agent-work-contracts"],
    dependencies: ["phase-57-runtime-pressure-and-control-plane"],
    nonGoals: ["do not dispatch child sessions"],
  },
  evidence: {
    requiredProof: ["focused vitest", "typecheck"],
    minimumEvidenceLevel: "L2_AUTOMATED_TEST",
    verificationCommands: ["npx vitest run tests/lib/agent-work-contracts/store.test.ts"],
    blockedStateRules: ["report blocker with command output"],
  },
  compaction: {
    briefing: "Agent work contract briefing",
    summary: "Preserve scope, proof, and handoff anchors",
    anchors: ["WORK-CONTRACT-01", "WORK-CONTRACT-03"],
    reinjectionPayload: "Resume with scope boundaries and evidence requirements",
    sourceRefs: ["phase-58-contract"],
  },
} as const

function createInput(projectRoot: string, overrides: Partial<typeof baseContract> = {}) {
  return {
    projectRoot,
    owner: overrides.owner ?? baseContract.owner,
    scope: overrides.scope ?? baseContract.scope,
    evidence: overrides.evidence ?? baseContract.evidence,
    compaction: overrides.compaction ?? baseContract.compaction,
  }
}

describe("agent work contract store", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "agent-work-contract-store-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("persists contracts in a dedicated .hivemind state file without touching delegation or continuity stores", () => {
    const result = createAgentWorkContract(createInput(root))

    expect(result.status).toBe("created")
    expect(result.scope.taskBoundary).toBe(baseContract.scope.taskBoundary)
    expect(getAgentWorkContractsFilePath(root)).toBe(join(root, ".hivemind", "state", "agent-work-contracts.json"))
    expect(existsSync(join(root, ".hivemind", "state", "agent-work-contracts.json"))).toBe(true)
    expect(existsSync(join(root, ".hivemind", "state", "delegations.json"))).toBe(false)
    expect(existsSync(join(root, ".hivemind", "state", "session-continuity.json"))).toBe(false)
  })

  it("bounds compaction preservation payloads for safe reinjection", () => {
    const result = createAgentWorkContract(createInput(root, {
      compaction: {
        ...baseContract.compaction,
        briefing: "b".repeat(5_000),
        summary: "s".repeat(5_000),
        anchors: Array.from({ length: 100 }, (_, index) => `anchor-${index}`),
        reinjectionPayload: "r".repeat(10_000),
      },
    }))

    expect(result.compaction.briefing.length).toBeLessThanOrEqual(1_200)
    expect(result.compaction.summary.length).toBeLessThanOrEqual(1_200)
    expect(result.compaction.anchors).toHaveLength(20)
    expect(result.compaction.reinjectionPayload.length).toBeLessThanOrEqual(2_400)
  })

  it("exports JSON and Markdown handoff artifacts without mutating the contract store", () => {
    const created = createAgentWorkContract(createInput(root))
    const before = readFileSync(getAgentWorkContractsFilePath(root), "utf-8")

    const jsonExport = exportAgentWorkContract({ projectRoot: root, contractId: created.id, format: "json" })
    const markdownExport = exportAgentWorkContract({ projectRoot: root, contractId: created.id, format: "markdown" })
    const after = readFileSync(getAgentWorkContractsFilePath(root), "utf-8")

    expect(jsonExport.format).toBe("json")
    expect(jsonExport.payload).toMatchObject({ contract: { id: created.id } })
    expect(markdownExport.format).toBe("markdown")
    expect(markdownExport.payload).toContain(`# Agent Work Contract: ${created.id}`)
    expect(after).toBe(before)
  })

  it("returns deep-cloned contracts on read", () => {
    const created = createAgentWorkContract(createInput(root))
    const firstRead = readAgentWorkContracts(root)
    firstRead.contracts[created.id]!.scope.allowedSurfaces.push("mutated")

    expect(readAgentWorkContracts(root).contracts[created.id]!.scope.allowedSurfaces).not.toContain("mutated")
  })
})
