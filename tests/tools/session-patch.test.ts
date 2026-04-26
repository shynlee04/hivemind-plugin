/**
 * Tests for the session-patch tool.
 * @module tests/tools/session-patch-tool
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createSessionPatchTool } from "../../src/tools/session-patch/index.js"
import { readFileSync, writeFileSync, unlinkSync, mkdirSync, rmSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { SessionPatchRecordSchema } from "../../src/schema-kernel/prompt-enhance.schema.js"

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

describe("session-patch tool", () => {
  const testDir = join(tmpdir(), "session-patch-tool-test")
  const sessionFile = join(testDir, "session.md")
  const tool = createSessionPatchTool(testDir)

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    writeFileSync(
      sessionFile,
      "---\npatch_count: 0\n---\n\n## Identified Risks\nold risk content\n\n## Other Section\nother content\n",
    )
  })

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  })

  it("patches a section and creates backup", async () => {
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Identified Risks",
        newContent: "new risk content",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.status).toBe("ok")
    expect(result.metadata.patch_count).toBe(1)

    const updated = readFileSync(sessionFile, "utf-8")
    expect(updated).toContain("new risk content")
    expect(updated).not.toContain("old risk content")
  })

  it("creates backup file in .patches directory", async () => {
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Identified Risks",
        newContent: "new risk content",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const backupPath = result.data.backup_path as string
    expect(existsSync(backupPath)).toBe(true)
    const backupContent = readFileSync(backupPath, "utf-8")
    expect(backupContent).toContain("old risk content")
  })

  it("returns error for non-existent section", async () => {
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Nonexistent",
        newContent: "content",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.kind).toBe("error")
  })

  it("returns error for missing file", async () => {
    const raw = await tool.execute(
      {
        sessionFilePath: "/nonexistent/file.md",
        section: "## Test",
        newContent: "content",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.kind).toBe("error")
  })

  it("rejects existing session artifacts outside the project root", async () => {
    const outsideDir = join(tmpdir(), "session-patch-outside")
    const outsideFile = join(outsideDir, "session.md")
    mkdirSync(outsideDir, { recursive: true })
    writeFileSync(outsideFile, "---\npatch_count: 0\n---\n\n## Test\nold\n")

    try {
      const raw = await tool.execute(
        {
          sessionFilePath: outsideFile,
          section: "## Test",
          newContent: "new",
        },
        mockCtx,
      )
      const result = parseResult(raw) as Record<string, unknown>
      expect(result.kind).toBe("error")
      expect(result.message).toContain("project root")
    } finally {
      rmSync(outsideDir, { recursive: true, force: true })
    }
  })

  it("increments patch_count in frontmatter", async () => {
    // First patch
    await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Identified Risks",
        newContent: "first patch",
      },
      mockCtx,
    )

    // Second patch
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Identified Risks",
        newContent: "second patch",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    // patch_count is in metadata, not data (data is SessionPatchRecord)
    expect(result.metadata.patch_count).toBe(2)

    // Verify the file also has the correct count
    const content = readFileSync(sessionFile, "utf-8")
    expect(content).toMatch(/^patch_count:\s*2$/m)
  })

  it("preserves other sections when patching", async () => {
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Identified Risks",
        newContent: "updated risks",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.status).toBe("ok")

    const updated = readFileSync(sessionFile, "utf-8")
    expect(updated).toContain("## Other Section")
    expect(updated).toContain("other content")
  })

  it("returns result matching SessionPatchRecord schema contract", async () => {
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## Identified Risks",
        newContent: "test content",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    // Tool now returns the validated SessionPatchRecord in data
    const data = result.data as Record<string, unknown>
    expect(data.section).toBe("## Identified Risks")
    expect(data.new_value).toBe("test content")
    expect(typeof data.backup_path).toBe("string")
    expect(typeof data.timestamp).toBe("string")
    expect(data.status).toBe("ok")
  })

  it("handles section names with regex-special characters", async () => {
    writeFileSync(
      sessionFile,
      `---\npatch_count: 0\n---\n\n## [Section: Special] Content here\n\n## Other\nother\n`,
    )
    const raw = await tool.execute(
      {
        sessionFilePath: sessionFile,
        section: "## [Section: Special]",
        newContent: "replaced",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.kind).toBe("success")
    const updated = readFileSync(sessionFile, "utf-8")
    expect(updated).toContain("replaced")
    expect(updated).not.toContain("Content here")
    expect(updated).toContain("## Other")
    expect(updated).toContain("other")
  })
})
