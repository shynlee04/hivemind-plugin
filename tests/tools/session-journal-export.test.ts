import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createSessionJournalExportTool } from "../../src/tools/session/session-journal-export.js"

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

function withStateStore<T>(callback: () => Promise<T>): Promise<T> {
  const previous = process.env.OPENCODE_HARNESS_STATE_DIR
  const dir = mkdtempSync(join(tmpdir(), "hivemind-export-"))
  process.env.OPENCODE_HARNESS_STATE_DIR = dir

  const continuity = {
    version: 1,
    updatedAt: 2,
    sessions: {
      "ses-parent": {
        sessionID: "ses-parent",
        promptParams: {},
        metadata: {
          status: "running",
          description: "Parent session",
          delegation: null,
          constraints: [],
          pendingNotifications: [],
          updatedAt: 2,
        },
      },
    },
    governance: { rules: [], violations: [], updatedAt: 2 },
  }
  const delegations = [{
    id: "del-1",
    parentSessionId: "ses-parent",
    childSessionId: "ses-child",
    agent: "gsd-executor",
    status: "completed",
    result: "RAW CONTINUITY JSON BLOB SHOULD NOT APPEAR",
    createdAt: 3,
    completedAt: 4,
    lastMessageCount: 1,
    stablePollCount: 1,
    executionMode: "sdk",
    workingDirectory: process.cwd(),
    queueKey: "opus:gsd-executor:execution",
    nestingDepth: 1,
  }]

  writeFileSync(join(dir, "session-continuity.json"), `${JSON.stringify(continuity, null, 2)}\n`, "utf-8")
  writeFileSync(join(dir, "delegations.json"), `${JSON.stringify(delegations, null, 2)}\n`, "utf-8")

  return callback().finally(() => {
    if (previous === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previous
    }
    rmSync(dir, { recursive: true, force: true })
  })
}

describe("session-journal-export tool", () => {
  it("returns JSON summary and machine-readable lineage", async () => {
    await withStateStore(async () => {
      const tool = createSessionJournalExportTool()
      const raw = await tool.execute({ format: "json", pipelineKeyLabel: "phase-25" } as never, mockCtx)
      const result = parseResult(raw)

      expect(result.kind).toBe("success")
      const data = result.data as Record<string, unknown>
      expect(data).toHaveProperty("journalSummary")
      expect(data).toHaveProperty("lineage")
      expect((data.lineage as unknown[])[0]).toMatchObject({ pipelineKey: "phase-25" })
    })
  })

  it("filters by pipelineKey without stamping unmatched lineage records", async () => {
    await withStateStore(async () => {
      const tool = createSessionJournalExportTool()
      const raw = await tool.execute({ format: "json", pipelineKey: "nonexistent-pipeline" } as never, mockCtx)
      const result = parseResult(raw)
      const data = result.data as Record<string, unknown>

      expect(result.kind).toBe("success")
      expect(data.lineage).toEqual([])
      expect((data.journalSummary as Record<string, unknown>).delegations).toBe(0)
    })
  })

  it("keeps pipeline labeling explicit and separate from filtering", async () => {
    await withStateStore(async () => {
      const tool = createSessionJournalExportTool()
      const raw = await tool.execute({ format: "json", pipelineKeyLabel: "phase-49" } as never, mockCtx)
      const result = parseResult(raw)
      const data = result.data as Record<string, unknown>

      expect(result.kind).toBe("success")
      expect((data.lineage as Array<Record<string, unknown>>)[0]?.pipelineKey).toBe("phase-49")
      expect((data.journalSummary as Record<string, unknown>).delegations).toBe(1)
    })
  })

  it("returns Markdown summary without raw continuity/delegation blobs", async () => {
    await withStateStore(async () => {
      const tool = createSessionJournalExportTool()
      const raw = await tool.execute({ format: "markdown" } as never, mockCtx)
      const result = parseResult(raw)
      const data = result.data as Record<string, unknown>

      expect(result.kind).toBe("success")
      expect(data.markdown).toContain("# Session Journal Summary")
      expect(data.markdown).toContain("## Execution Lineage")
      expect(data.markdown).not.toContain("RAW CONTINUITY JSON BLOB")
    })
  })

  it("returns an error envelope for invalid format", async () => {
    const tool = createSessionJournalExportTool()
    const raw = await tool.execute({ format: "yaml" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
  })

  it("registers plugin tool and public package exports", () => {
    expect(readFileSync("src/plugin.ts", "utf-8")).toContain("session-journal-export")
    const index = readFileSync("src/index.ts", "utf-8")
    expect(index).toContain('export * from "./task-management/journal/index.js"')
    expect(index).toContain('export * from "./task-management/journal/execution-lineage.js"')
  })
})
