/**
 * Tests for the prompt-skim tool.
 * @module tests/tools/prompt-skim-tool
 */
import { describe, it, expect } from "vitest"
import { createPromptSkimTool } from "../../src/tools/prompt-skim/index.js"
import { PromptSkimResultSchema } from "../../src/schema-kernel/prompt-enhance.schema.js"

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

describe("prompt-skim tool", () => {
  const tool = createPromptSkimTool(process.cwd())

  it("counts words and lines correctly", async () => {
    const raw = await tool.execute(
      { content: "Hello world\nThis is a test", workspaceRoot: process.cwd() },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.word_count).toBe(6)
    expect(result.data.line_count).toBe(2)
  })

  it("estimates tokens correctly", async () => {
    const raw = await tool.execute(
      { content: "Hello world test here", workspaceRoot: process.cwd() },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    // 4 words * 1.3 = 5.2 -> ceil = 6
    expect(result.data.token_estimate).toBe(6)
  })

  it("extracts URLs", async () => {
    const raw = await tool.execute(
      {
        content: "Check https://example.com and https://github.com/test/repo",
        workspaceRoot: process.cwd(),
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.url_count).toBe(2)
    expect(result.data.urls).toContain("https://example.com")
    expect(result.data.urls).toContain("https://github.com/test/repo")
  })

  it("counts absolute claims", async () => {
    const raw = await tool.execute(
      {
        content: "You MUST do this. NEVER do that. ALWAYS verify.",
        workspaceRoot: process.cwd(),
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.absolute_claim_count).toBe(3)
  })

  it("calculates complexity score for simple content", async () => {
    const raw = await tool.execute(
      { content: "Simple prompt", workspaceRoot: process.cwd() },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.complexity_score).toBe(1)
    expect(result.data.flooding_risk).toBe("low")
    expect(result.data.verdict).toBe("simple")
  })

  it("detects high complexity for long content with code blocks", async () => {
    const longContent = Array(60).fill("line").join("\n") + "\n" + "```code```"
    const raw = await tool.execute(
      { content: longContent, workspaceRoot: process.cwd() },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    // lines>50 (+1), code blocks (+1) = 1+1+1 = 3
    expect(result.data.complexity_score).toBeGreaterThanOrEqual(3)
  })

  it("returns result matching schema-kernel Zod contract", async () => {
    const raw = await tool.execute(
      { content: "Test content with https://example.com url", workspaceRoot: process.cwd() },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const data = result.data as Record<string, unknown>
    const schemaCheck = PromptSkimResultSchema.safeParse(data)
    expect(schemaCheck.success).toBe(true)
  })

  it("verifies file paths", async () => {
    const raw = await tool.execute(
      {
        content: "See ./package.json and ./nonexistent-file.ts",
        workspaceRoot: process.cwd(),
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const paths = result.data.paths as Array<{ path: string; exists: boolean }>
    expect(paths.length).toBeGreaterThanOrEqual(1)
    const pkgPath = paths.find((p) => p.path === "./package.json")
    expect(pkgPath).toBeDefined()
    expect(pkgPath!.exists).toBe(true)
  })
})
