/**
 * End-to-end integration tests for the prompt-enhance pipeline.
 * Verifies schema contracts, hook behavior, compaction tracking,
 * tool registration, and full pipeline execution.
 * @module tests/integration/prompt-enhance-pipeline
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  PromptSkimResultSchema,
  PromptAnalysisResultSchema,
  SessionPatchRecordSchema,
} from "../../src/schema-kernel/prompt-enhance.schema.js"
import { createPromptSkimTool } from "../../src/tools/prompt/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "../../src/tools/prompt/prompt-analyze/index.js"
import { createSessionPatchTool } from "../../src/tools/session/session-patch/index.js"
import { HivemindControlPlane } from "../../src/plugin.js"

const mockCtx = {
  sessionID: "test_ses_001",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

// ---------------------------------------------------------------------------
// Test 1: Schema contracts are consistent across tools
// ---------------------------------------------------------------------------

describe("schema contracts match tool outputs", () => {
  it("prompt-skim output validates against PromptSkimResultSchema", async () => {
    const tool = createPromptSkimTool(process.cwd())
    const raw = await tool.execute(
      { content: "MUST build this. NEVER do that.\nCheck https://example.com", workspaceRoot: process.cwd() },
      mockCtx,
    )
    const parsed = JSON.parse(raw)
    const result = PromptSkimResultSchema.safeParse(parsed.data)
    expect(result.success).toBe(true)
  })

  it("prompt-analyze output validates against PromptAnalysisResultSchema", async () => {
    const tool = createPromptAnalyzeTool(process.cwd())
    const raw = await tool.execute(
      { content: "You MUST fix everything. Maybe do some stuff etc." },
      mockCtx,
    )
    const parsed = JSON.parse(raw)
    const result = PromptAnalysisResultSchema.safeParse(parsed.data)
    expect(result.success).toBe(true)
  })

  it("session-patch output validates against SessionPatchRecordSchema", async () => {
    const testDir = join(tmpdir(), `sp-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    const sessionFile = join(testDir, "session.md")
    writeFileSync(sessionFile, "---\npatch_count: 0\n---\n\n## Identified Risks\nNone yet.\n")

    const tool = createSessionPatchTool(testDir)
    const raw = await tool.execute(
      { sessionFilePath: sessionFile, section: "## Identified Risks", newContent: "Risk A found" },
      mockCtx,
    )
    const parsed = JSON.parse(raw)
    expect(parsed.data.status).toBe("ok")
    expect(parsed.data.backup_path).toBeDefined()
    expect(existsSync(parsed.data.backup_path)).toBe(true)

    rmSync(testDir, { recursive: true, force: true })
  })
})

// ---------------------------------------------------------------------------
// Test 5: Full pipeline with real tool execution
// ---------------------------------------------------------------------------

describe("full pipeline E2E", () => {
  const testDir = join(tmpdir(), `pipeline-e2e-${Date.now()}`)
  const sessionFile = join(testDir, "session.md")

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    writeFileSync(
      sessionFile,
      "---\npatch_count: 0\ncompaction_count: 2\ncontext_budget_pct: 50\nstatus: idle\n---\n\n## Identified Risks\nNone yet.\n",
    )
  })

  afterEach(() => {
    try { rmSync(testDir, { recursive: true, force: true }) } catch { /* ignore */ }
  })

  it("executes full pipeline from skim to patch", async () => {
    const samplePrompt =
      "MUST fix everything in this project. Do not use bash. " +
      "Some stuff etc. Build all the things.\n" +
      "Check https://docs.example.com and ./README.md\n" +
      "Always verify, never skip. enhance this prompt"

    // Phase 1: Skim
    const skimTool = createPromptSkimTool(process.cwd())
    const skimRaw = await skimTool.execute(
      { content: samplePrompt, workspaceRoot: process.cwd() },
      mockCtx,
    )
    const skimParsed = JSON.parse(skimRaw)
    const skimResult = PromptSkimResultSchema.parse(skimParsed.data)
    expect(skimResult.complexity_score).toBeGreaterThanOrEqual(1)
    expect(skimResult.verdict).toMatch(/^(simple|complex|unclear)$/)

    // Phase 2: Analyze
    const analyzeTool = createPromptAnalyzeTool(process.cwd())
    const analyzeRaw = await analyzeTool.execute({ content: samplePrompt }, mockCtx)
    const analyzeParsed = JSON.parse(analyzeRaw)
    const analyzeResult = PromptAnalysisResultSchema.parse(analyzeParsed.data)
    expect(analyzeResult.finding_count).toBeGreaterThan(0)
    expect(analyzeResult.clarity_score).toBeGreaterThanOrEqual(0)
    expect(analyzeResult.clarity_score).toBeLessThanOrEqual(100)

    // Phase 3: Session patch
    const patchTool = createSessionPatchTool(testDir)
    const patchRaw = await patchTool.execute(
      { sessionFilePath: sessionFile, section: "## Identified Risks", newContent: "Risk: scope creep detected" },
      mockCtx,
    )
    const patchParsed = JSON.parse(patchRaw)
    expect(patchParsed.data.status).toBe("ok")
    expect(patchParsed.data.section).toBe("## Identified Risks")
    expect(patchParsed.metadata.patch_count).toBe(1)

    // Phase 4: Verify patch applied
    const patchedContent = readFileSync(sessionFile, "utf-8")
    expect(patchedContent).toContain("Risk: scope creep detected")
  })
})

// ---------------------------------------------------------------------------
// Test 6: Plugin tools are registered and callable
// ---------------------------------------------------------------------------

describe("plugin tools are registered and callable", () => {
  it("HivemindControlPlane returns all prompt-enhance tools", async () => {
    const plugin = await HivemindControlPlane({} as any)
    const tools = plugin.tool as Record<string, { execute: Function }>

    expect(tools).toBeDefined()
    expect(typeof tools["prompt-skim"]).toBe("object")
    expect(typeof tools["prompt-analyze"]).toBe("object")
    expect(typeof tools["session-patch"]).toBe("object")

    expect(typeof tools["prompt-skim"].execute).toBe("function")
    expect(typeof tools["prompt-analyze"].execute).toBe("function")
    expect(typeof tools["session-patch"].execute).toBe("function")
  })

  it("each registered tool executes without error", async () => {
    const plugin = await HivemindControlPlane({} as any)
    const tools = plugin.tool as Record<string, { execute: Function }>

    const skimResult = await tools["prompt-skim"].execute(
      { content: "test", workspaceRoot: process.cwd() },
      mockCtx,
    )
    expect(skimResult).toContain("Prompt skim complete")

    const analyzeResult = await tools["prompt-analyze"].execute(
      { content: "test content" },
      mockCtx,
    )
    expect(analyzeResult).toContain("Analysis complete")
  })
})
