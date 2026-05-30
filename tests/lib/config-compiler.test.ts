import { describe, it, expect } from "vitest"
import {
  compileAgent,
  compileCommand,
  compileSkill,
  decompileAgent,
  decompileCommand,
  decompileSkill,
  batchCompile,
  resolveBasePath,
  validateOutputPath,
  type AgentSpec,
  type CommandSpec,
  type SkillSpec,
} from "../../src/config/compiler.js"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const validAgentFrontmatter = {
  description: "Test agent for validation",
  mode: "primary" as const,
  temperature: 0.5,
}

const validCommandFrontmatter = {
  description: "Test command",
  agent: "test-agent",
}

const validSkillFrontmatter = {
  name: "test-skill" as const,
  description: "Test skill description",
}

// ---------------------------------------------------------------------------
// compileAgent
// ---------------------------------------------------------------------------

describe("compileAgent", () => {
  it("produces valid .md with YAML frontmatter", () => {
    const result = compileAgent({ name: "my-agent", frontmatter: validAgentFrontmatter, body: "# Agent body" })
    expect(result.success).toBe(true)
    expect(result.content).toMatch(/^---\n/)
    expect(result.content).toContain("description: Test agent for validation")
    expect(result.content).toContain("---\n\n# Agent body")
  })

  it("includes filePath .opencode/agents/<name>.md", () => {
    const result = compileAgent({ name: "my-agent", frontmatter: validAgentFrontmatter, body: "" })
    expect(result.filePath).toMatch(/agents[/\\]my-agent\.md$/)
  })

  it("returns errors for invalid frontmatter", () => {
    const result = compileAgent({ name: "bad", frontmatter: { description: "" } as any, body: "" })
    expect(result.success).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it("handles optional fields correctly", () => {
    const result = compileAgent({ name: "minimal", frontmatter: { description: "Minimal agent" }, body: "" })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// compileCommand
// ---------------------------------------------------------------------------

describe("compileCommand", () => {
  it("produces valid .md with frontmatter", () => {
    const result = compileCommand({ name: "my-cmd", frontmatter: validCommandFrontmatter, body: "## Command" })
    expect(result.success).toBe(true)
    expect(result.content).toMatch(/^---\n/)
    expect(result.content).toContain("description: Test command")
  })

  it("includes filePath .opencode/commands/<name>.md", () => {
    const result = compileCommand({ name: "my-cmd", frontmatter: validCommandFrontmatter, body: "" })
    expect(result.filePath).toMatch(/commands[/\\]my-cmd\.md$/)
  })
})

// ---------------------------------------------------------------------------
// compileSkill
// ---------------------------------------------------------------------------

describe("compileSkill", () => {
  it("produces valid .md with frontmatter", () => {
    const result = compileSkill({ name: "my-skill", frontmatter: validSkillFrontmatter, body: "### Skill" })
    expect(result.success).toBe(true)
    expect(result.content).toMatch(/^---\n/)
    expect(result.content).toContain("name: test-skill")
  })

  it("includes filePath .opencode/skills/<name>/SKILL.md", () => {
    const result = compileSkill({ name: "my-skill", frontmatter: validSkillFrontmatter, body: "" })
    expect(result.filePath).toMatch(/skills[/\\]my-skill[/\\]SKILL\.md$/)
  })
})

// ---------------------------------------------------------------------------
// path traversal protection
// ---------------------------------------------------------------------------

describe("path traversal protection", () => {
  it("rejects names containing ..", () => {
    const result = compileAgent({ name: "../etc/passwd", frontmatter: validAgentFrontmatter, body: "" })
    expect(result.success).toBe(false)
    expect(result.errors?.some(e => e.includes("traversal"))).toBe(true)
  })

  it("rejects absolute paths outside base", () => {
    const result = compileAgent(
      { name: "safe", frontmatter: validAgentFrontmatter, body: "" },
      { basePath: "/tmp/test" },
    )
    // The filePath should still be relative to base, not absolute
    expect(result.filePath).toMatch(/^\/tmp\/test/)
  })
})

// ---------------------------------------------------------------------------
// scope resolution
// ---------------------------------------------------------------------------

describe("scope resolution", () => {
  it("defaults to project scope with .opencode/ paths", () => {
    const result = compileAgent({ name: "agent1", frontmatter: validAgentFrontmatter, body: "" })
    expect(result.filePath).toMatch(/^\.opencode[/\\]/)
  })

  it("uses global scope with ~/.config/opencode/ paths", () => {
    const result = compileAgent(
      { name: "agent1", frontmatter: validAgentFrontmatter, body: "" },
      { scope: "global" },
    )
    expect(result.filePath).toContain(".config")
    expect(result.filePath).toContain("opencode")
  })

  it("respects OPENCODE_CONFIG_DIR env override", () => {
    const originalEnv = process.env.OPENCODE_CONFIG_DIR
    process.env.OPENCODE_CONFIG_DIR = "/custom/config"
    try {
      const result = compileAgent(
        { name: "agent1", frontmatter: validAgentFrontmatter, body: "" },
        { scope: "global" },
      )
      expect(result.filePath).toMatch(/^\/custom\/config/)
    } finally {
      if (originalEnv !== undefined) process.env.OPENCODE_CONFIG_DIR = originalEnv
      else delete process.env.OPENCODE_CONFIG_DIR
    }
  })
})

// ---------------------------------------------------------------------------
// decompileAgent
// ---------------------------------------------------------------------------

describe("decompileAgent", () => {
  it("extracts frontmatter and body from .md", () => {
    const compiled = compileAgent({ name: "round", frontmatter: validAgentFrontmatter, body: "# Body" })
    expect(compiled.success).toBe(true)
    const result = decompileAgent(compiled.content)
    expect(result.success).toBe(true)
    expect(result.spec?.frontmatter.description).toBe("Test agent for validation")
    expect(result.body).toBe("# Body")
  })

  it("returns warnings for invalid frontmatter", () => {
    const result = decompileAgent("---\nbad: data\n---\n\nbody")
    expect(result.success).toBe(false)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// decompileCommand
// ---------------------------------------------------------------------------

describe("decompileCommand", () => {
  it("extracts frontmatter and body from .md", () => {
    const compiled = compileCommand({ name: "cmd", frontmatter: validCommandFrontmatter, body: "## Body" })
    expect(compiled.success).toBe(true)
    const result = decompileCommand(compiled.content)
    expect(result.success).toBe(true)
    expect(result.spec?.frontmatter.description).toBe("Test command")
    expect(result.body).toBe("## Body")
  })
})

// ---------------------------------------------------------------------------
// decompileSkill
// ---------------------------------------------------------------------------

describe("decompileSkill", () => {
  it("extracts frontmatter and body from .md", () => {
    const compiled = compileSkill({ name: "sk", frontmatter: validSkillFrontmatter, body: "### Body" })
    expect(compiled.success).toBe(true)
    const result = decompileSkill(compiled.content)
    expect(result.success).toBe(true)
    expect(result.spec?.frontmatter.name).toBe("test-skill")
    expect(result.spec?.name).toBe("test-skill")
    expect(result.body).toBe("### Body")
  })
})

// ---------------------------------------------------------------------------
// round-trip fidelity
// ---------------------------------------------------------------------------

describe("round-trip fidelity", () => {
  it("agent round-trip preserves data", () => {
    const spec: AgentSpec = { name: "rt", frontmatter: validAgentFrontmatter, body: "# RT" }
    const compiled = compileAgent(spec)
    expect(compiled.success).toBe(true)
    const decompiled = decompileAgent(compiled.content)
    expect(decompiled.success).toBe(true)
    expect(decompiled.spec?.frontmatter).toEqual(validAgentFrontmatter)
    expect(decompiled.body).toBe("# RT")
  })

  it("command round-trip preserves data", () => {
    const spec: CommandSpec = { name: "rt", frontmatter: validCommandFrontmatter, body: "## RT" }
    const compiled = compileCommand(spec)
    expect(compiled.success).toBe(true)
    const decompiled = decompileCommand(compiled.content)
    expect(decompiled.success).toBe(true)
    expect(decompiled.spec?.frontmatter).toEqual(validCommandFrontmatter)
    expect(decompiled.body).toBe("## RT")
  })

  it("skill round-trip preserves data", () => {
    const spec: SkillSpec = { name: "rt", frontmatter: validSkillFrontmatter, body: "### RT" }
    const compiled = compileSkill(spec)
    expect(compiled.success).toBe(true)
    const decompiled = decompileSkill(compiled.content)
    expect(decompiled.success).toBe(true)
    expect(decompiled.spec?.frontmatter).toEqual(validSkillFrontmatter)
    expect(decompiled.body).toBe("### RT")
  })
})

// ---------------------------------------------------------------------------
// batchCompile
// ---------------------------------------------------------------------------

describe("batchCompile", () => {
  it("compiles multiple specs", () => {
    const result = batchCompile([
      { type: "agent", spec: { name: "a1", frontmatter: validAgentFrontmatter, body: "" } },
      { type: "command", spec: { name: "c1", frontmatter: validCommandFrontmatter, body: "" } },
      { type: "skill", spec: { name: "s1", frontmatter: validSkillFrontmatter, body: "" } },
    ])
    expect(result.allSucceeded).toBe(true)
    expect(result.results.length).toBe(3)
  })

  it("returns failure report when atomic and one fails", () => {
    const result = batchCompile(
      [
        { type: "agent", spec: { name: "good", frontmatter: validAgentFrontmatter, body: "" } },
        { type: "agent", spec: { name: "bad", frontmatter: { description: "" } as any, body: "" } },
      ],
      { atomic: true },
    )
    expect(result.allSucceeded).toBe(false)
    expect(result.failureReport).toBeDefined()
  })
})
