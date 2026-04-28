/**
 * Tests for the prompt-analyze tool.
 * @module tests/tools/prompt-analyze-tool
 */
import { describe, it, expect } from "vitest"
import { createPromptAnalyzeTool } from "../../src/tools/prompt-analyze/index.js"
import { PromptAnalysisResultSchema } from "../../src/schema-kernel/prompt-enhance.schema.js"

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

describe("prompt-analyze tool", () => {
  const tool = createPromptAnalyzeTool(process.cwd())

  it("detects absolute claims", async () => {
    const raw = await tool.execute(
      { content: "You MUST do this.\nNEVER skip that." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.finding_count).toBeGreaterThan(0)
    const findings = result.data.findings as Array<{ type: string }>
    const absolutes = findings.filter((f) => f.type === "absolute_claim")
    expect(absolutes.length).toBe(2)
  })

  it("detects vague wording", async () => {
    const raw = await tool.execute(
      { content: "Fix some things and various stuff etc." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const findings = result.data.findings as Array<{ type: string }>
    const vague = findings.filter((f) => f.type === "vagueness")
    expect(vague.length).toBeGreaterThan(0)
  })

  it("detects missing scope", async () => {
    const raw = await tool.execute(
      { content: "Build this and improve everything." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const findings = result.data.findings as Array<{ type: string }>
    const missing = findings.filter((f) => f.type === "missing_scope")
    expect(missing.length).toBeGreaterThan(0)
  })

  it("lowers clarity for vague app-improvement prompts", async () => {
    const raw = await tool.execute(
      { content: "Make the app better and improve the flow." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const findings = result.data.findings as Array<{ type: string }>

    expect(result.data.clarity_score).toBeLessThan(100)
    expect(findings.some((finding) => finding.type === "vagueness" || finding.type === "missing_scope")).toBe(true)
  })

  it("does not flag complementary event sourcing and CQRS guidance as contradictory", async () => {
    const raw = await tool.execute(
      {
        content: "You must use event sourcing with CQRS and do not couple read and write models.",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const findings = result.data.findings as Array<{ type: string }>

    expect(findings.some((finding) => finding.type === "contradiction")).toBe(false)
  })

  it("detects contradictions", async () => {
    const raw = await tool.execute(
      { content: "Always use the module but never include it." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const findings = result.data.findings as Array<{ type: string }>
    const contradictions = findings.filter((f) => f.type === "contradiction")
    expect(contradictions.length).toBeGreaterThan(0)
  })

  it("calculates clarity score", async () => {
    const raw = await tool.execute(
      { content: "Simple clear prompt" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(result.data.clarity_score).toBeGreaterThanOrEqual(0)
    expect(result.data.clarity_score).toBeLessThanOrEqual(100)
  })

  it("severity breakdown is correct", async () => {
    const raw = await tool.execute(
      { content: "You MUST do this.\nFix some things somehow.\nBuild this." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const bySeverity = result.data.by_severity as Record<string, number>
    expect(bySeverity.critical).toBeGreaterThanOrEqual(0)
    expect(bySeverity.important).toBeGreaterThanOrEqual(0)
    expect(bySeverity.minor).toBeGreaterThanOrEqual(0)
  })

  it("returns result matching schema-kernel Zod contract", async () => {
    const raw = await tool.execute(
      { content: "Test content with MUST and some vague things." },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    const data = result.data as Record<string, unknown>
    const schemaCheck = PromptAnalysisResultSchema.safeParse(data)
    expect(schemaCheck.success).toBe(true)
  })

  it("skips empty lines", async () => {
    const raw = await tool.execute(
      { content: "Line one\n\n\nLine two" },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    // No findings expected for these lines
    expect(result.data.finding_count).toBe(0)
  })

  it("detects contradictions that span multiple lines", async () => {
    const raw = await tool.execute(
      {
        content:
          "Use TypeScript for the plugin.\nDo not use TypeScript for the plugin.",
      },
      mockCtx,
    )
    const result = parseResult(raw) as Record<string, unknown>
    expect(
      (result.data.findings as Array<{ type: string }>).some(
        (f) => f.type === "contradiction",
      ),
    ).toBe(true)
  })
})
