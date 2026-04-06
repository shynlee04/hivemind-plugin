/**
 * Tests for the context-budget tool.
 * @module tests/tools/context-budget-tool
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createContextBudgetTool } from "../../src/tools/context-budget/index.js"
import { ContextBudgetRecordSchema } from "../../src/schema-kernel/prompt-enhance.schema.js"

vi.mock("node:fs")

const mockCtx = {
  sessionID: "test_001",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function parseResult(raw: string): unknown {
  return JSON.parse(raw)
}

describe("context-budget tool", () => {
  const tool = createContextBudgetTool(process.cwd())

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns full budget when file does not exist", async () => {
    const fs = await import("node:fs")
    vi.spyOn(fs, "existsSync").mockReturnValue(false)

    const raw = await tool.execute(
      { sessionFilePath: "/nonexistent/session.md" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.budget_pct).toBe(100)
    expect(result.data.compaction_count).toBe(0)
    expect(result.data.status).toBe("ok")
  })

  it("calculates budget from compaction_count", async () => {
    const fs = await import("node:fs")
    vi.spyOn(fs, "existsSync").mockReturnValue(true)
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "---\ncompaction_count: 2\n---\n\nSession content",
    )

    const raw = await tool.execute(
      { sessionFilePath: "/tmp/session.md" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.budget_pct).toBe(50)
    expect(result.data.compaction_count).toBe(2)
    expect(result.data.status).toBe("warning")
  })

  it("returns warning status for moderate compaction", async () => {
    const fs = await import("node:fs")
    vi.spyOn(fs, "existsSync").mockReturnValue(true)
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "---\ncompaction_count: 1\n---\n\nSession content",
    )

    const raw = await tool.execute(
      { sessionFilePath: "/tmp/session.md" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.budget_pct).toBe(50)
    expect(result.data.status).toBe("warning")
  })

  it("returns critical status for high compaction", async () => {
    const fs = await import("node:fs")
    vi.spyOn(fs, "existsSync").mockReturnValue(true)
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "---\ncompaction_count: 10\n---\n\nSession content",
    )

    const raw = await tool.execute(
      { sessionFilePath: "/tmp/session.md" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.budget_pct).toBe(25)
    expect(result.data.status).toBe("critical")
  })

  it("defaults compaction_count to 0 when not in frontmatter", async () => {
    const fs = await import("node:fs")
    vi.spyOn(fs, "existsSync").mockReturnValue(true)
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "---\nno_count_here\n---\n\nSession content",
    )

    const raw = await tool.execute(
      { sessionFilePath: "/tmp/session.md" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.compaction_count).toBe(0)
    expect(result.data.budget_pct).toBe(100)
  })

  it("returns result matching schema-kernel Zod contract", async () => {
    const fs = await import("node:fs")
    vi.spyOn(fs, "existsSync").mockReturnValue(true)
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      "---\ncompaction_count: 1\n---\n\nSession content",
    )

    const raw = await tool.execute(
      { sessionFilePath: "/tmp/session.md" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const data = result.data as Record<string, unknown>
    const schemaCheck = ContextBudgetRecordSchema.safeParse(data)
    expect(schemaCheck.success).toBe(true)
  })
})
