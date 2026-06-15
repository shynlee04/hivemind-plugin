/**
 * validate-restart tool tests
 *
 * Coverage:
 * 1. Tool returns success when no issues found
 * 2. Tool returns error when validation fails
 * 3. Tool respects verbose flag
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createValidateRestartTool } from "../../src/tools/config/validate-restart.js"

describe("validate-restart tool", () => {
  let tempDir: string
  let tool: ReturnType<typeof createValidateRestartTool>

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "validate-restart-test-"))
    tool = createValidateRestartTool()
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("returns success when no issues found", async () => {
    // Create minimal valid OpenCode project
    writeFileSync(join(tempDir, "opencode.json"), JSON.stringify({ instructions: [] }))
    mkdirSync(join(tempDir, ".opencode", "agents"), { recursive: true })
    writeFileSync(
      join(tempDir, ".opencode", "agents", "test-agent.md"),
      '---\ndescription: "Test agent"\nmode: all\n---\n\nTest body',
    )

    const result = await tool.execute({ projectRoot: tempDir, verbose: false }, {})
    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("success")
  })

  it("returns error when opencode.json is missing", async () => {
    const result = await tool.execute({ projectRoot: tempDir, verbose: false }, {})
    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.message).toContain("No opencode.json found")
  })

  it("includes framework info when verbose is true", async () => {
    writeFileSync(join(tempDir, "opencode.json"), JSON.stringify({ instructions: [] }))
    mkdirSync(join(tempDir, ".opencode", "agents"), { recursive: true })
    writeFileSync(
      join(tempDir, ".opencode", "agents", "test-agent.md"),
      '---\ndescription: "Test agent"\nmode: all\n---\n\nTest body',
    )

    const result = await tool.execute({ projectRoot: tempDir, verbose: true }, {})
    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("success")
    expect(parsed.data.frameworks).toBeDefined()
  })

  it("reports runtime issues when primitives have problems", async () => {
    writeFileSync(join(tempDir, "opencode.json"), JSON.stringify({ instructions: [] }))
    mkdirSync(join(tempDir, ".opencode", "agents"), { recursive: true })
    mkdirSync(join(tempDir, ".opencode", "commands"), { recursive: true })

    // Agent references missing skill
    writeFileSync(
      join(tempDir, ".opencode", "agents", "bad-agent.md"),
      '---\ndescription: "Bad agent"\nmode: all\n---\n\nskill("missing-skill")',
    )

    // Command references missing agent
    writeFileSync(
      join(tempDir, ".opencode", "commands", "bad-command.md"),
      '---\ndescription: "Bad command"\nagent: missing-agent\n---\n\nTest body',
    )

    const result = await tool.execute({ projectRoot: tempDir, verbose: false }, {})
    const parsed = JSON.parse(result)
    expect(parsed.kind).toBe("error")
    expect(parsed.data.summary.runtimeErrors).toBeGreaterThan(0)
  })
})
