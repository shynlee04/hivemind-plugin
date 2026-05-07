import { describe, it, expect } from "vitest"
import { createConfigurePrimitiveTool } from "../../src/tools/configure-primitive.js"
import { mixedBatchCompile } from "../../src/lib/config-compiler.js"
import { existsSync, readdirSync, unlinkSync, rmdirSync, mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

const AGENTS_DIR = join(process.cwd(), ".opencode", "agents")
const HAS_OPENCODE_DIR = existsSync(AGENTS_DIR) && readdirSync(AGENTS_DIR).some(f => f.endsWith(".md"))

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

  it("roots project-scope writes in explicit tool context instead of process cwd", async () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "configure-primitive-root-"))
    const context = { ...mockCtx, directory: projectRoot, worktree: projectRoot }
    try {
      const result = parseResult(await tool.execute({
        primitive: "agent",
        spec: JSON.stringify({ description: "Context rooted agent", body: "# Body" }),
        dryRun: false,
        validate: true,
        scope: "project",
        overwrite: false,
      }, context))

      const expectedPath = join(projectRoot, ".opencode", "agents", "context-rooted-agent.md")
      expect(result.kind).toBe("success")
      expect(result.data.filePath).toBe(expectedPath)
      expect(existsSync(expectedPath)).toBe(true)
    } finally {
      rmSync(projectRoot, { recursive: true, force: true })
    }
  })
})

// ---------------------------------------------------------------------------
// read action
// ---------------------------------------------------------------------------

describe("read action", () => {
  const tool = createConfigurePrimitiveTool()

  it.skipIf(!HAS_OPENCODE_DIR)("reads an existing agent file", async () => {
    const result = parseResult(await tool.execute({
      action: "read",
      primitive: "agent",
      name: "hm-l2-build",
      scope: "project",
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.name).toBe("hm-l2-build")
    expect(result.data.type).toBe("agent")
    expect(result.data.frontmatter).toBeDefined()
    expect(result.data.body).toBeDefined()
  })

  it("returns error for non-existent primitive", async () => {
    const result = parseResult(await tool.execute({
      action: "read",
      primitive: "agent",
      name: "nonexistent-agent-12345",
      scope: "project",
    }, mockCtx))
    expect(result.kind).toBe("error")
  })

  it("returns error for file with invalid YAML frontmatter", async () => {
    const tempProject = mkdtempSync(join(tmpdir(), "configure-primitive-invalid-"))
    mkdirSync(join(tempProject, ".opencode", "agents"), { recursive: true })
    writeFileSync(
      join(tempProject, ".opencode", "agents", "bad-agent.md"),
      `---
description: "Bad agent
mode: subagent
---

# Bad agent
`,
    )

    const result = parseResult(await tool.execute({
      action: "read",
      primitive: "agent",
      name: "bad-agent",
      scope: "project",
    }, { ...mockCtx, directory: tempProject, worktree: tempProject }))
    rmSync(tempProject, { recursive: true, force: true })
    expect(result.kind).toBe("error")
    expect(result.message).toContain("Failed to read")
  })
})

// ---------------------------------------------------------------------------
// list action
// ---------------------------------------------------------------------------

describe("list action", () => {
  const tool = createConfigurePrimitiveTool()

  it.skipIf(!HAS_OPENCODE_DIR)("lists all primitives when no type filter", async () => {
    const result = parseResult(await tool.execute({
      action: "list",
      primitive: "agent",
      scope: "project",
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.count).toBeGreaterThan(0)
    expect(Array.isArray(result.data.items)).toBe(true)
  })

  it("lists agents only", async () => {
    const result = parseResult(await tool.execute({
      action: "list",
      primitive: "agent",
      scope: "project",
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.items.every((i: { type: string }) => i.type === "agent")).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// inspect action
// ---------------------------------------------------------------------------

describe("inspect action", () => {
  const tool = createConfigurePrimitiveTool()

  it.skipIf(!HAS_OPENCODE_DIR)("inspects an existing primitive with cross-reference status", async () => {
    const result = parseResult(await tool.execute({
      action: "inspect",
      primitive: "agent",
      name: "hm-l2-build",
      scope: "project",
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.name).toBe("hm-l2-build")
    expect(result.data.crossRefStatus).toBeDefined()
    expect(result.data.frontmatter).toBeDefined()
  })

  it("rejects primitive path traversal names", async () => {
    const result = parseResult(await tool.execute({
      action: "inspect",
      primitive: "agent",
      name: "../config",
      scope: "project",
    }, mockCtx))
    expect(result.kind).toBe("error")
    expect(result.message).toContain("Invalid primitive name")
  })
})

// ---------------------------------------------------------------------------
// decompile action
// ---------------------------------------------------------------------------

describe("decompile action", () => {
  const tool = createConfigurePrimitiveTool()

  it("decompiles agent markdown to spec", async () => {
    const md = `---\ndescription: "Test agent"\nmode: primary\n---\n\n# You are helpful\n`
    const result = parseResult(await tool.execute({
      action: "decompile",
      primitive: "agent",
      spec: md,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.spec.frontmatter.description).toBe("Test agent")
    expect(result.data.body).toContain("You are helpful")
  })

  it("decompiles skill markdown to spec", async () => {
    const md = `---\nname: test-skill\ndescription: "Test skill"\n---\n\n# Skill content\n`
    const result = parseResult(await tool.execute({
      action: "decompile",
      primitive: "skill",
      spec: md,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.spec.frontmatter.name).toBe("test-skill")
  })
})

// ---------------------------------------------------------------------------
// mixed-primitive batch (Task 16.5-08)
// ---------------------------------------------------------------------------

describe("mixed-primitive batch", () => {
  const tool = createConfigurePrimitiveTool()

  it("accepts primitives array with mixed types", async () => {
    const result = parseResult(await tool.execute({
      action: "compile",
      primitives: [
        { type: "agent", name: "batch-agent", spec: JSON.stringify({ description: "Batch agent", body: "# A" }) },
        { type: "command", name: "batch-cmd", spec: JSON.stringify({ description: "Batch cmd", body: "## C" }) },
        { type: "skill", name: "batch-skill", spec: JSON.stringify({ name: "batch-skill", description: "Batch skill", body: "### S" }) },
      ],
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.results).toHaveLength(3)
    expect(result.data.results[0].type).toBe("agent")
    expect(result.data.results[1].type).toBe("command")
    expect(result.data.results[2].type).toBe("skill")
  })

  it("batchCompile validates cross-primitive conflicts across ALL types", async () => {
    const result = mixedBatchCompile([
      { type: "agent", name: "dup", spec: { name: "dup", frontmatter: { description: "Agent dup" }, body: "" } },
      { type: "command", name: "dup", spec: { name: "dup", frontmatter: { description: "Cmd dup" }, body: "" } },
    ], { validate: true, scope: "project" })
    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("batchCompile fails fast if any conflict detected", async () => {
    const result = mixedBatchCompile([
      { type: "agent", name: "a1", spec: { name: "a1", frontmatter: { description: "A1" }, body: "" } },
      { type: "agent", name: "a1", spec: { name: "a1", frontmatter: { description: "A1 dup" }, body: "" } },
    ], { validate: true, scope: "project" })
    expect(result.success).toBe(false)
    expect(result.results).toHaveLength(0)
  })

  it("rejects invalid primitive names in batch mode before compilation", async () => {
    const result = parseResult(await tool.execute({
      action: "compile",
      primitives: [
        { type: "agent", name: "bad/name", spec: JSON.stringify({ description: "Bad", body: "# B" }) },
      ],
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))

    expect(result.kind).toBe("error")
    expect(result.message).toContain("Invalid primitive name")
  })

  it("batchCompile creates all files atomically (all-or-nothing)", async () => {
    const result = parseResult(await tool.execute({
      action: "compile",
      primitives: [
        { type: "agent", name: "atomic-agent", spec: JSON.stringify({ description: "Atomic agent", body: "# A" }) },
        { type: "command", name: "atomic-cmd", spec: JSON.stringify({ description: "Atomic cmd", body: "## C" }) },
      ],
      dryRun: false,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(existsSync(join(process.cwd(), ".opencode", "agents", "atomic-agent.md"))).toBe(true)
    expect(existsSync(join(process.cwd(), ".opencode", "commands", "atomic-cmd.md"))).toBe(true)
    // Cleanup
    cleanupFile(join(process.cwd(), ".opencode", "agents", "atomic-agent.md"))
    cleanupFile(join(process.cwd(), ".opencode", "commands", "atomic-cmd.md"))
  })

  it("batchCompile with dryRun returns compiled content without writing", async () => {
    const result = parseResult(await tool.execute({
      action: "compile",
      primitives: [
        { type: "agent", name: "dry-agent", spec: JSON.stringify({ description: "Dry agent", body: "# A" }) },
      ],
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.results[0].result.content).toContain("---")
    expect(existsSync(join(process.cwd(), ".opencode", "agents", "dry-agent.md"))).toBe(false)
  })

  it("single primitive still works (backward compatible)", async () => {
    const result = parseResult(await tool.execute({
      action: "compile",
      primitive: "agent",
      spec: JSON.stringify({ description: "Backward compat", body: "# B" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
    }, mockCtx))
    expect(result.kind).toBe("success")
    expect(result.data.filePath).toContain("agents")
  })
})

// ---------------------------------------------------------------------------
// resume action (Acceptance Criterion 5)
// ---------------------------------------------------------------------------

describe("resume action", () => {
  const tool = createConfigurePrimitiveTool()

  it("should return error when workflowId is missing", async () => {
    const result = parseResult(await tool.execute({
      action: "resume",
    }, mockCtx))
    expect(result.kind).toBe("error")
    expect(result.message).toContain("workflowId")
  })

  it("should return error for non-existent workflow ID", async () => {
    const result = parseResult(await tool.execute({
      action: "resume",
      workflowId: "wf-nonexistent-resume-test",
    }, mockCtx))
    expect(result.kind).toBe("error")
    expect(result.message).toContain("not found")
  })

  it("should return correct workflow state on resume", async () => {
    const { createWorkflowState, completeCurrentTurn, advanceTurn } = await import(
      "../../src/lib/config-workflow/workflow-state.js"
    )
    const { persistWorkflow } = await import(
      "../../src/lib/config-workflow/workflow-persistence.js"
    )

    // Create a workflow, advance to turn 3
    let state = createWorkflowState({
      type: "batch-config",
      targetPrimitives: [
        { type: "agent", name: "resume-agent" },
        { type: "command", name: "resume-cmd" },
      ],
      scope: "project",
      mode: "batch-modify",
    })

    // Complete turns 0-2, advance to turn 3
    state = completeCurrentTurn(state, { discovered: ["agent-a"] })
    state = advanceTurn(state, 1)
    state = completeCurrentTurn(state, { investigated: true })
    state = advanceTurn(state, 2)
    state = completeCurrentTurn(state, { collected: true })
    state = advanceTurn(state, 3)

    persistWorkflow(state)

    // Resume should return the correct state
    const result = parseResult(await tool.execute({
      action: "resume",
      workflowId: state.id,
    }, mockCtx))

    expect(result.kind).toBe("success")
    const resume = result.data.resume
    expect(resume.workflowId).toBe(state.id)
    expect(resume.currentTurn).toBe(3)
    expect(resume.currentTurnName).toBe("proposal")
    expect(resume.completedTurns).toBe(3)
    expect(resume.totalTurns).toBe(8)
    expect(resume.canContinue).toBe(true)
    // Last output should be from turn 2
    expect(resume.lastOutput).toEqual({ collected: true })
  })
})

// ---------------------------------------------------------------------------
// backward compatibility — no workflow params (Acceptance Criterion 9)
// ---------------------------------------------------------------------------

describe("backward compatibility (no workflow params)", () => {
  const tool = createConfigurePrimitiveTool()

  it("should work identically without workflowTurn or workflowId", async () => {
    // Compile without any workflow params — should produce same result as before
    const result = parseResult(await tool.execute({
      action: "compile",
      primitive: "agent",
      spec: JSON.stringify({ description: "No workflow params", body: "# NoWorkflow" }),
      dryRun: true,
      validate: true,
      scope: "project",
      overwrite: false,
      // Explicitly NOT setting workflowTurn or workflowId
    }, mockCtx))

    expect(result.kind).toBe("success")
    expect(result.data.content).toContain("---")
    expect(result.data.filePath).toMatch(/agents[/\\]no-workflow-params\.md/)
  })

  it("should not require workflow params for decompile", async () => {
    const md = `---\ndescription: "Backward compat decompile"\nmode: primary\n---\n\n# Body\n`
    const result = parseResult(await tool.execute({
      action: "decompile",
      primitive: "agent",
      spec: md,
    }, mockCtx))

    expect(result.kind).toBe("success")
    expect(result.data.spec.frontmatter.description).toBe("Backward compat decompile")
  })

  it.skipIf(!HAS_OPENCODE_DIR)("should not require workflow params for list action", async () => {
    const result = parseResult(await tool.execute({
      action: "list",
      scope: "project",
    }, mockCtx))

    expect(result.kind).toBe("success")
    expect(result.data.count).toBeGreaterThan(0)
  })
})
