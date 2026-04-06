import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PromptEnhancePlugin } from "../../src/plugins/prompt-enhance.js"

describe("prompt-enhance compaction tracking", () => {
  const testDir = join(tmpdir(), "prompt-enhance-compaction-test")
  const originalCwd = process.cwd()

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
    process.chdir(testDir)
  })

  afterEach(() => {
    process.chdir(originalCwd)
    try { rmSync(testDir, { recursive: true, force: true }) } catch { /* ignore */ }
  })

  it("session.compacting hook increments compaction_count by 1", async () => {
    const plugin = await PromptEnhancePlugin()
    const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")
    mkdirSync(join(testDir, ".hivemind/state"), { recursive: true })
    writeFileSync(stateFile, "---\ncompaction_count: 0\ncontext_budget_pct: 100\n---\n")

    const mockOutput = { context: [] as string[] }
    await (plugin as Record<string, unknown>)["experimental.session.compacting"]({}, mockOutput)

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 1")
    expect(content).toContain("context_budget_pct: 50")
  })

  it("event hook does NOT increment compaction for session.compacted events", async () => {
    const plugin = await PromptEnhancePlugin()
    const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")
    mkdirSync(join(testDir, ".hivemind/state"), { recursive: true })
    writeFileSync(stateFile, "---\ncompaction_count: 0\ncontext_budget_pct: 100\n---\n")

    await (plugin as Record<string, unknown>).event({ event: { type: "session.compacted" } })

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 0")
    expect(content).toContain("context_budget_pct: 100")
  })

  it("both hooks together do NOT double-count", async () => {
    const plugin = await PromptEnhancePlugin()
    const stateFile = join(testDir, ".hivemind/state/session-context-prompt.md")
    mkdirSync(join(testDir, ".hivemind/state"), { recursive: true })
    writeFileSync(stateFile, "---\ncompaction_count: 0\ncontext_budget_pct: 100\n---\n")

    await (plugin as Record<string, unknown>).event({ event: { type: "session.compacted" } })
    const mockOutput = { context: [] as string[] }
    await (plugin as Record<string, unknown>)["experimental.session.compacting"]({}, mockOutput)

    const content = readFileSync(stateFile, "utf-8")
    expect(content).toContain("compaction_count: 1")
    expect(content).toContain("context_budget_pct: 50")
  })
})
