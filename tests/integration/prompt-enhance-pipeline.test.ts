/**
 * End-to-end integration tests for the prompt-enhance pipeline.
 * Verifies schema contracts, hook behavior, compaction tracking,
 * tool registration, and full pipeline execution.
 * @module tests/integration/prompt-enhance-pipeline
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"

import {
  PromptSkimResultSchema,
  PromptAnalysisResultSchema,
  ContextBudgetRecordSchema,
  SessionPatchRecordSchema,
} from "../../src/schema-kernel/prompt-enhance.schema.js"
import { createPromptSkimTool } from "../../src/tools/prompt-skim/index.js"
import { createPromptAnalyzeTool } from "../../src/tools/prompt-analyze/index.js"
import { createContextBudgetTool } from "../../src/tools/context-budget/index.js"
import { createSessionPatchTool } from "../../src/tools/session-patch/index.js"
import { transformSystemPrompt } from "../../src/hooks/system-transform.js"
import { transformMessages } from "../../src/hooks/messages-transform.js"
import { HarnessControlPlane } from "../../src/plugin.js"
import { PromptEnhancePlugin } from "../../src/plugins/prompt-enhance.js"
import { setDelegationMeta } from "../../src/lib/state.js"
import type { DelegationMeta } from "../../src/lib/types.js"

const TEST_DELEGATION: DelegationMeta = {
  rootID: "ses_root",
  depth: 1,
  budgetUsed: 0,
  agent: "researcher",
  queueKey: "test",
}

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

  it("context-budget output validates against ContextBudgetRecordSchema", async () => {
    const tool = createContextBudgetTool(process.cwd())
    const raw = await tool.execute({ sessionFilePath: "/nonexistent/session.md" }, mockCtx)
    const parsed = JSON.parse(raw)
    const result = ContextBudgetRecordSchema.safeParse(parsed.data)
    expect(result.success).toBe(true)
    expect(parsed.data.budget_pct).toBe(100)
  })

  it("session-patch output validates against SessionPatchRecordSchema", async () => {
    const testDir = join(tmpdir(), `sp-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    const sessionFile = join(testDir, "session.md")
    writeFileSync(sessionFile, "---\npatch_count: 0\n---\n\n## Identified Risks\nNone yet.\n")

    const tool = createSessionPatchTool(process.cwd())
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
// Test 2: system.transform injects contracts
// ---------------------------------------------------------------------------

describe("system.transform injects output contract", () => {
  it("appends contract block to system prompt", () => {
    setDelegationMeta("ses_delegated", TEST_DELEGATION)
    const result = transformSystemPrompt("You are a helpful assistant.", "ses_delegated")
    expect(result).toContain("You are a helpful assistant.")
    expect(result).toContain("## Prompt-Enhance Output Contract")
  })

  it("contains YAML frontmatter template", () => {
    setDelegationMeta("ses_delegated", TEST_DELEGATION)
    const result = transformSystemPrompt("base", "ses_delegated")
    expect(result).toContain("version:")
    expect(result).toContain("enhanced_at:")
    expect(result).toContain("complexity_before:")
  })

  it("contains validation rules", () => {
    setDelegationMeta("ses_delegated", TEST_DELEGATION)
    const result = transformSystemPrompt("base", "ses_delegated")
    expect(result).toContain("Validation rules")
    expect(result).toContain("version")
    expect(result).toContain("complexity_before")
  })

  it("system-transform injects zero text for non-delegated sessions", () => {
    const result = transformSystemPrompt("You are a helper.", undefined)
    expect(result).toBe("You are a helper.")
  })
})

// ---------------------------------------------------------------------------
// Test 3: messages.transform detects triggers and injects context
// ---------------------------------------------------------------------------

describe("messages.transform detects triggers and injects context", () => {
  it("returns messages unchanged without trigger", () => {
    const messages = [{ role: "user", content: "Hello world" }]
    const result = transformMessages(messages, "ses_test")
    expect(result).toEqual(messages)
  })

  it("injects system message when trigger phrase found", () => {
    const messages = [
      { role: "user", content: "Please enhance this prompt: fix the scope" },
    ]
    const result = transformMessages(messages, "ses_test")
    expect(result.length).toBe(2)
    // splice inserts AT firstUserIndex, shifting user message to position 1
    expect(result[0].role).toBe("system")
    expect(result[0].content).toContain("## Context")
    expect(result[0].content).toContain("ses_test")
    expect(result[1]).toEqual(messages[0])
  })

  it("handles empty messages array", () => {
    const result = transformMessages([], "ses_test")
    expect(result).toEqual([])
  })

  it("handles messages with no user role", () => {
    const messages = [
      { role: "system", content: "You are helpful" },
      { role: "assistant", content: "OK" },
    ]
    const result = transformMessages(messages, "ses_test")
    expect(result).toEqual(messages)
  })
})

// ---------------------------------------------------------------------------
// Test 4: Session compaction tracked by single hook (event hook is no-op)
// ---------------------------------------------------------------------------

describe("session compaction tracked by single hook", () => {
  const testDir = join(tmpdir(), `compaction-test-${Date.now()}`)
  const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(__dirname)
    try { rmSync(testDir, { recursive: true, force: true }) } catch { /* ignore */ }
  })

  it("session.compacting hook increments compaction_count, event hook does not", async () => {
    const plugin = await PromptEnhancePlugin()
    // Event hook is a no-op for compaction — only ensures state file exists
    await plugin.event?.({})

    const output = { context: [] }
    await plugin["experimental.session.compacting"]?.({}, output)

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 1")
    expect(content).toContain("context_budget_pct: 50")
  })

  it("event hook does NOT increment compaction for session.compacted events", async () => {
    const plugin = await PromptEnhancePlugin()
    await plugin.event?.({})
    await plugin.event?.({ event: { type: "session.compacted" } })

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 0")
    expect(content).toContain("context_budget_pct: 100")
  })

  it("budget floors at 0 after multiple compactions", async () => {
    const plugin = await PromptEnhancePlugin()
    await plugin.event?.({})

    // Run 7 compactions: status-based model → count > 2 = critical, budget 25%
    for (let i = 0; i < 7; i++) {
      const output = { context: [] }
      await plugin["experimental.session.compacting"]?.({}, output)
    }

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 7")
    expect(content).toContain("context_budget_pct: 25")
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

    // Phase 3: Context budget
    const budgetTool = createContextBudgetTool(process.cwd())
    const budgetRaw = await budgetTool.execute({ sessionFilePath: sessionFile }, mockCtx)
    const budgetParsed = JSON.parse(budgetRaw)
    const budgetResult = ContextBudgetRecordSchema.parse(budgetParsed.data)
    expect(budgetResult.compaction_count).toBe(2)
    expect(budgetResult.budget_pct).toBe(50)
    expect(budgetResult.status).toBe("warning")

    // Phase 4: Session patch
    const patchTool = createSessionPatchTool(process.cwd())
    const patchRaw = await patchTool.execute(
      { sessionFilePath: sessionFile, section: "## Identified Risks", newContent: "Risk: scope creep detected" },
      mockCtx,
    )
    const patchParsed = JSON.parse(patchRaw)
    expect(patchParsed.data.status).toBe("ok")
    expect(patchParsed.data.section).toBe("## Identified Risks")
    expect(patchParsed.metadata.patch_count).toBe(1)

    // Phase 5: Verify hooks work with pipeline output
    setDelegationMeta("ses_pipeline_test", TEST_DELEGATION)
    const systemPrompt = transformSystemPrompt("You are a helper.", "ses_pipeline_test")
    expect(systemPrompt).toContain("Prompt-Enhance Output Contract")

    const messages = [{ role: "user", content: samplePrompt }]
    const transformed = transformMessages(messages, "ses_pipeline_test")
    expect(transformed.length).toBe(2)
    // System message injected at index 0, user message shifted to index 1
    expect(transformed[0].role).toBe("system")
    expect(transformed[1]).toEqual(messages[0])
  })
})

// ---------------------------------------------------------------------------
// Test 6: Plugin tools are registered and callable
// ---------------------------------------------------------------------------

describe("plugin tools are registered and callable", () => {
  it("HarnessControlPlane returns all 4 prompt-enhance tools", async () => {
    const plugin = await HarnessControlPlane({} as any)
    const tools = plugin.tool as Record<string, { execute: Function }>

    expect(tools).toBeDefined()
    expect(typeof tools["prompt-skim"]).toBe("object")
    expect(typeof tools["prompt-analyze"]).toBe("object")
    expect(typeof tools["context-budget"]).toBe("object")
    expect(typeof tools["session-patch"]).toBe("object")

    expect(typeof tools["prompt-skim"].execute).toBe("function")
    expect(typeof tools["prompt-analyze"].execute).toBe("function")
    expect(typeof tools["context-budget"].execute).toBe("function")
    expect(typeof tools["session-patch"].execute).toBe("function")
  })

  it("each registered tool executes without error", async () => {
    const plugin = await HarnessControlPlane({} as any)
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

    const budgetResult = await tools["context-budget"].execute(
      { sessionFilePath: "/nonexistent.md" },
      mockCtx,
    )
    expect(budgetResult).toContain("Budget calculated")
  })
})

// ---------------------------------------------------------------------------
// Test 7: Missing edge cases from review
// ---------------------------------------------------------------------------

describe("additional edge cases", () => {
  it("PromptEnhancePlugin.event handler ignores non-compacted events", async () => {
    const plugin = await PromptEnhancePlugin()
    // The plugin writes to .hivemind/state/session-context-prompt.md at process.cwd()
    // Read the current state first
    const stateFile = join(process.cwd(), ".hivemind/state/session-context-prompt.md")
    const originalContent = existsSync(stateFile) ? readFileSync(stateFile, "utf-8") : null

    // Reset to known state
    if (originalContent) {
      writeFileSync(stateFile, originalContent.replace(/compaction_count:\s*\d+/m, "compaction_count: 0").replace(/context_budget_pct:\s*\d+/m, "context_budget_pct: 100"))
    }

    // Send a non-compacted event — should be a no-op for compaction
    await (plugin as any).event({ event: { type: "session.started" } })

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 0")
    expect(content).toContain("context_budget_pct: 100")
  })

  it("messages.transform ignores trigger in assistant messages", () => {
    const messages = [
      { role: "system", content: "You are helpful" },
      { role: "assistant", content: "Let me enhance this prompt for you" },
      { role: "user", content: "Build the feature" },
    ]
    const result = transformMessages(messages, "ses_test")
    // Should NOT inject context packet — trigger is in assistant, not user message
    expect(result).toHaveLength(3)
    expect(result).toEqual(messages)
  })

  it("messages.transform detects multiple trigger phrases in user messages", () => {
    const messages = [
      { role: "user", content: "Please enhance this prompt and audit it too" },
    ]
    const result = transformMessages(messages, "ses_test")
    expect(result).toHaveLength(2)
    expect(result[0].role).toBe("system")
    expect(result[0].content).toContain("Context")
  })
})
