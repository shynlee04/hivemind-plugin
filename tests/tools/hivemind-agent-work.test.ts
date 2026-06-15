import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createHivemindAgentWorkCreateTool, createHivemindAgentWorkExportTool } from "../../src/tools/hivemind/hivemind-agent-work.js"

const mockCtx = {
  sessionID: "parent-session",
  agent: "gsd-executor",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

const createArgs = {
  ownerAgent: "gsd-executor",
  ownerSessionId: "ses_parent",
  taskBoundary: "Implement agent work contracts",
  allowedSurfaces: ["src/lib/agent-work-contracts"],
  dependencies: ["phase-57-runtime-pressure-and-control-plane"],
  nonGoals: ["do not mutate delegations"],
  requiredProof: ["focused tests"],
  minimumEvidenceLevel: "L2_AUTOMATED_TEST",
  verificationCommands: ["npm run typecheck"],
  blockedStateRules: ["return BLOCKED with evidence"],
  briefing: "briefing",
  summary: "summary",
  anchors: ["WORK-CONTRACT-01"],
  reinjectionPayload: "reinjection payload",
  sourceRefs: ["phase-58-contract"],
}

describe("hivemind agent work tools", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "hivemind-agent-work-tool-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("creates and exports an agent work contract", async () => {
    const createTool = createHivemindAgentWorkCreateTool(root)
    const exportTool = createHivemindAgentWorkExportTool(root)

    const created = parseResult(await createTool.execute(createArgs as never, mockCtx))
    // After pressure removal, tool returns contract directly in data (not wrapped in { contract })
    const createdData = created.data as { id: string }
    const exported = parseResult(await exportTool.execute({ contractId: createdData.id, format: "markdown" } as never, mockCtx))

    expect(created.kind).toBe("success")
    expect(createdData.id).toMatch(/^awc_/)
    expect(exported).toMatchObject({ kind: "success", data: { format: "markdown" } })
    expect(String((exported.data as { payload: string }).payload)).toContain("Implement agent work contracts")
  })

  it("creates contract with backward-compatible pressure fields (silently ignored)", async () => {
    const createTool = createHivemindAgentWorkCreateTool(root)

    // Passing pressure fields should NOT error — they are silently ignored (D-43/D-44)
    const result = parseResult(await createTool.execute({ ...createArgs, pressureTier: 9, pressureScore: 0.9 } as never, mockCtx))

    expect(result.kind).toBe("success")
    // Contract should be created, not pressure-blocked
    const data = result.data as { id: string; status: string }
    expect(data.id).toMatch(/^awc_/)
    expect(data.status).toBe("created")
  })
})
