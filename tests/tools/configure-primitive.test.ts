import { describe, it, expect } from "vitest"
import { createConfigurePrimitiveTool } from "../../src/tools/configure-primitive.js"
import { existsSync, unlinkSync, rmdirSync } from "node:fs"
import { join } from "node:path"

// ---------------------------------------------------------------------------
// Mock context
// ---------------------------------------------------------------------------

const mockCtx = {
  sessionID: "test_config_001",
  directory: process.cwd(),
  worktree: process.cwd(),
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseResult(result: string) {
  return JSON.parse(result)
}

function cleanupFile(filePath: string) {
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

// ---------------------------------------------------------------------------
// dry-run mode
// ---------------------------------------------------------------------------

describe("dry-run mode", () => {
  const tool = createConfigurePrimitiveTool()

  it("returns compiled content without writing", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: JSON.stringify({ description: "Test agent", body: "# Hello" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.content).toContain("---")
    expect(result.data.filePath).toMatch(/agents[/\\]test-agent\.md/)
  })

  it("returns compiled command content", async () => {
    const result = parseResult(await tool.execute({
      primitive: "command",
      spec: JSON.stringify({ description: "Test cmd", body: "## Hello" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.filePath).toMatch(/commands[/\\]test-cmd\.md/)
  })

  it("returns compiled skill content", async () => {
    const result = parseResult(await tool.execute({
      primitive: "skill",
      spec: JSON.stringify({ name: "test-skill", description: "Test skill", body: "### Hello" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.filePath).toMatch(/skills[/\\]test-skill[/\\]SKILL\.md/)
  })
})

// ---------------------------------------------------------------------------
// JSON spec parsing
// ---------------------------------------------------------------------------

describe("JSON spec parsing", () => {
  const tool = createConfigurePrimitiveTool()

  it("parses JSON spec correctly", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: JSON.stringify({ description: "JSON agent", body: "# Body" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
  })

  it("returns error for invalid JSON", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: "not valid json {{",
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("error")
  })
})

// ---------------------------------------------------------------------------
// YAML spec parsing
// ---------------------------------------------------------------------------

describe("YAML spec parsing", () => {
  const tool = createConfigurePrimitiveTool()

  it("parses YAML spec correctly", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: "description: YAML agent\nbody: '# Body'",
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
  })
})

// ---------------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------------

describe("validation", () => {
  const tool = createConfigurePrimitiveTool()

  it("validates frontmatter against schema", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: JSON.stringify({ body: "# Missing description" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("error")
  })

  it("skips validation when validate=false", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: JSON.stringify({ body: "# Missing description" }),
      dryRun: true,
      validate: false,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
  })
})

// ---------------------------------------------------------------------------
// primitive routing
// ---------------------------------------------------------------------------

describe("primitive routing", () => {
  const tool = createConfigurePrimitiveTool()

  it("routes to correct compiler based on primitive type", async () => {
    for (const [primitive, expectedPath] of [
      ["agent", "agents"],
      ["command", "commands"],
      ["skill", "skills"],
    ] as const) {
      const spec = primitive === "skill"
        ? JSON.stringify({ name: "test", description: "Test", body: "# Body" })
        : JSON.stringify({ description: "Test", body: "# Body" })
      const result = parseResult(await tool.execute({
        primitive,
        spec,
        dryRun: true,
        validate: true,
        scope: "project",
        overwrite: false,
      }, mockCtx))
      expect(result.data.filePath).toContain(expectedPath)
    }
  })

  it("returns error for unknown primitive type", async () => {
    const result = parseResult(await tool.execute({
      primitive: "unknown",
      spec: JSON.stringify({ description: "Test" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("error")
  })
})

// ---------------------------------------------------------------------------
// scope and overwrite
// ---------------------------------------------------------------------------

describe("scope and overwrite", () => {
  const tool = createConfigurePrimitiveTool()

  it("writes to global path when scope is global", async () => {
    const result = parseResult(await tool.execute({
      primitive: "agent",
      spec: JSON.stringify({ description: "Global agent", body: "# Body" }),
      dryRun: true,
      validate: true,
      scope: "global",
      overwrite: false,
    }, mockCtx))
    expect(result.data.filePath).toContain(".config")
    expect(result.data.filePath).toContain("opencode")
  })

  it("rejects overwrite when overwrite is false and file exists", async () => {
    const spec = JSON.stringify({ description: "Overwrite test", body: "# Body" })
    // First write
    await tool.execute({ primitive: "agent", spec, dryRun: false, validate: true, scope: "project", overwrite: false }, mockCtx)
    // Second write without overwrite
    const result = parseResult(await tool.execute({ primitive: "agent", spec, dryRun: false, validate: true, scope: "project", overwrite: false }, mockCtx))
    expect(result.kind).toBe("error")
    // Cleanup
    cleanupFile(join(process.cwd(), ".opencode", "agents", "overwrite-test.md"))
  })

  it("allows overwrite when overwrite is true and file exists", async () => {
    const spec = JSON.stringify({ description: "Overwrite test", body: "# Body" })
    // First write
    await tool.execute({ primitive: "agent", spec, dryRun: false, validate: true, scope: "project", overwrite: false }, mockCtx)
    // Second write with overwrite
    const result = parseResult(await tool.execute({ primitive: "agent", spec, dryRun: false, validate: true, scope: "project", overwrite: true }, mockCtx))
    expect(result.kind).toBe("success")
    // Cleanup
    cleanupFile(join(process.cwd(), ".opencode", "agents", "overwrite-test.md"))
  })
})
