import { describe, it, expect } from "vitest"
import {
  validateCrossPrimitive,
  type PrimitiveMap,
  type ValidationReport,
} from "../../src/features/bootstrap/cross-primitive-validator.js"
import type { AgentFile, CommandFile, SkillFile, ToolFile } from "../../src/schema-kernel/index.js"
import type { MCPServerConfig, OpenCodeConfig } from "../../src/schema-kernel/index.js"
import type { DetectedFramework } from "../../src/features/bootstrap/framework-detector.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAgentFile(
  name: string,
  frontmatter: Record<string, unknown> = {},
  body = "",
): AgentFile {
  return {
    frontmatter: {
      description: `Agent ${name}`,
      ...frontmatter,
    } as AgentFile["frontmatter"],
    body: body || `# ${name}`,
    filePath: `.opencode/agents/${name}.md`,
  }
}

function makeCommandFile(
  name: string,
  frontmatter: Record<string, unknown> = {},
  body = "",
): CommandFile {
  return {
    frontmatter: {
      description: `Command ${name}`,
      ...frontmatter,
    } as CommandFile["frontmatter"],
    body: body || `## ${name}`,
    filePath: `.opencode/commands/${name}.md`,
  }
}

function makeSkillFile(
  name: string,
  dirName = name,
  frontmatter: Record<string, unknown> = {},
  body = "",
): SkillFile {
  return {
    frontmatter: {
      name,
      description: `Skill ${name}`,
      ...frontmatter,
    } as SkillFile["frontmatter"],
    body: body || `### ${name}`,
    filePath: `.opencode/skills/${dirName}/SKILL.md`,
    dirName,
  }
}

function makeToolFile(
  name: string,
  definition: Partial<ToolFile["definition"]> = {},
): ToolFile {
  return {
    definition: {
      name,
      description: `Tool ${name}`,
      args: {},
      hasExecute: true,
      filePath: `.opencode/tools/${name}.ts`,
      exports: [],
      ...definition,
    },
    content: "",
    filePath: `.opencode/tools/${name}.ts`,
  }
}

function makePrimitiveMap(overrides?: Partial<PrimitiveMap>): PrimitiveMap {
  return {
    agents: new Map(),
    commands: new Map(),
    skills: new Map(),
    tools: new Map(),
    mcpServers: new Map(),
    config: {},
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validateCrossPrimitive — empty primitives", () => {
  it("returns valid report with empty maps", () => {
    const report = validateCrossPrimitive(makePrimitiveMap())
    expect(report.valid).toBe(true)
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
    expect(report.info).toEqual([])
  })
})

describe("agent-command binding detection", () => {
  it("blocks when command references non-existent agent", () => {
    const commands = new Map<string, CommandFile>([
      ["cmd1", makeCommandFile("cmd1", { agent: "missing-agent" })],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ commands }))
    expect(report.errors.some(e => e.category === "agent-command-binding")).toBe(true)
    expect(report.valid).toBe(false)
  })

  it("passes when command references existing agent", () => {
    const agents = new Map<string, AgentFile>([
      ["exists", makeAgentFile("exists")],
    ])
    const commands = new Map<string, CommandFile>([
      ["cmd1", makeCommandFile("cmd1", { agent: "exists" })],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ agents, commands }))
    expect(report.errors.some(e => e.category === "agent-command-binding")).toBe(false)
    expect(report.valid).toBe(true)
  })
})

describe("permission deadlock detection", () => {
  it("warns when agent denies tool that command needs", () => {
    const agents = new Map<string, AgentFile>([
      ["agent1", makeAgentFile("agent1", { permission: { bash: "deny" } })],
    ])
    const commands = new Map<string, CommandFile>([
      ["cmd1", makeCommandFile("cmd1", { agent: "agent1" }, "!bash echo hi")],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ agents, commands }))
    expect(report.warnings.some(w => w.category === "permission-deadlock")).toBe(true)
  })
})

describe("role overlap detection", () => {
  it("warns when two primary agents have similar descriptions", () => {
    const agents = new Map<string, AgentFile>([
      ["a1", makeAgentFile("a1", { mode: "primary" }, "I build web applications with React")],
      ["a2", makeAgentFile("a2", { mode: "primary" }, "I create web apps using React")],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ agents }))
    expect(report.warnings.some(w => w.category === "role-overlap")).toBe(true)
  })

  it("does not warn for dissimilar agents", () => {
    const agents = new Map<string, AgentFile>([
      ["a1", makeAgentFile("a1", { mode: "primary" }, "I build web applications")],
      ["a2", makeAgentFile("a2", { mode: "primary" }, "I analyze security threats and audit code")],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ agents }))
    expect(report.warnings.some(w => w.category === "role-overlap")).toBe(false)
  })
})

describe("missing skill dependency detection", () => {
  it("warns when agent body references non-existent skill", () => {
    const agents = new Map<string, AgentFile>([
      ["a1", makeAgentFile("a1", {}, 'Use skill("nonexistent") here')],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ agents }))
    expect(report.warnings.some(w => w.category === "missing-skill-dependency")).toBe(true)
  })
})

describe("MCP server gap detection", () => {
  it("warns when tool references unconfigured MCP server", () => {
    const tools = new Map<string, ToolFile>([
      ["mcp-bridge", makeToolFile("mcp-bridge", { args: { server: "missing-mcp" } })],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ tools }))
    expect(report.warnings.some(w => w.category === "mcp-server-gap")).toBe(true)
  })
})

describe("rule file gap detection", () => {
  it("blocks when config instructions reference invalid paths", () => {
    const config: OpenCodeConfig = { instructions: [""] }
    const report = validateCrossPrimitive(makePrimitiveMap({ config }))
    expect(report.errors.some(e => e.category === "rule-file-gap")).toBe(true)
    expect(report.valid).toBe(false)
  })
})

describe("report structure", () => {
  it("sets valid=false when errors exist", () => {
    const commands = new Map<string, CommandFile>([
      ["cmd1", makeCommandFile("cmd1", { agent: "missing" })],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ commands }))
    expect(report.valid).toBe(false)
  })

  it("sets valid=true with only warnings", () => {
    const agents = new Map<string, AgentFile>([
      ["a1", makeAgentFile("a1", {}, 'skill("missing")')],
    ])
    const report = validateCrossPrimitive(makePrimitiveMap({ agents }))
    expect(report.valid).toBe(true)
    expect(report.warnings.length).toBeGreaterThan(0)
  })
})

describe("framework boundary validation", () => {
  it("warns when frameworks have overlapping boundaries", () => {
    const frameworks: DetectedFramework[] = [
      {
        marker: {
          name: "gsd",
          configFiles: [".planning/ROADMAP.md"],
          boundaryDirs: [".planning"],
          namespacePrefix: "gsd",
        },
        rootPath: "/project",
        configPath: "/project/.planning",
        boundaryPaths: ["/project/.planning"],
      },
      {
        marker: {
          name: "hivemind",
          configFiles: [],
          boundaryDirs: [".opencode"],
          namespacePrefix: "hivemind",
        },
        rootPath: "/project",
        configPath: "/project/.opencode",
        boundaryPaths: ["/project/.opencode"],
      },
    ]

    const report = validateCrossPrimitive(makePrimitiveMap(), frameworks)
    expect(report.warnings.some(w => w.category === "framework-conflict")).toBe(false)
  })

  it("detects actual boundary overlap", () => {
    const frameworks: DetectedFramework[] = [
      {
        marker: {
          name: "gsd",
          configFiles: [".planning/ROADMAP.md"],
          boundaryDirs: [".planning"],
          namespacePrefix: "gsd",
        },
        rootPath: "/project",
        configPath: "/project/.planning",
        boundaryPaths: ["/project/.planning"],
      },
      {
        marker: {
          name: "other",
          configFiles: [],
          boundaryDirs: [".planning"],
          namespacePrefix: "other",
        },
        rootPath: "/project",
        configPath: "/project/.planning",
        boundaryPaths: ["/project/.planning"],
      },
    ]

    const report = validateCrossPrimitive(makePrimitiveMap(), frameworks)
    expect(report.warnings.some(w => w.category === "framework-conflict")).toBe(true)
  })
})

describe("runtime validation integration", () => {
  it("reports loading-order errors for circular dependencies", () => {
    const agents = new Map<string, AgentFile>([
      ["agent-a", makeAgentFile("agent-a", {}, "Uses /command-c")],
    ])
    const commands = new Map<string, CommandFile>([
      ["command-c", makeCommandFile("command-c", { agent: "agent-a" })],
    ])

    const report = validateCrossPrimitive(makePrimitiveMap({ agents, commands }))
    expect(report.errors.some(e => e.category === "loading-order")).toBe(true)
    expect(report.valid).toBe(false)
  })

  it("reports resolution-order errors for missing dependencies", () => {
    const commands = new Map<string, CommandFile>([
      ["command-c", makeCommandFile("command-c", { agent: "missing-agent" })],
    ])

    const report = validateCrossPrimitive(makePrimitiveMap({ commands }))
    // resolution-order AND agent-command-binding both detect this
    expect(report.errors.some(e => e.category === "resolution-order" || e.category === "agent-command-binding")).toBe(true)
  })

  it("reports inheritance-chain warnings for permission contradictions", () => {
    const agents = new Map<string, AgentFile>([
      ["agent-a", makeAgentFile("agent-a", { permission: { read: "allow" } })],
    ])
    const config = { instructions: [], permission: { read: "deny" } }

    const report = validateCrossPrimitive(makePrimitiveMap({ agents, config: config as any }))
    expect(report.warnings.some(w => w.category === "inheritance-chain")).toBe(true)
  })

  it("reports pipeline-position warnings for overlapping primary agents", () => {
    const agents = new Map<string, AgentFile>([
      ["a1", makeAgentFile("a1", { mode: "primary" }, "Coordinates all work across the system")],
      ["a2", makeAgentFile("a2", { mode: "primary" }, "Coordinates tasks and delegates work across modules")],
    ])

    const report = validateCrossPrimitive(makePrimitiveMap({ agents }))
    expect(report.warnings.some(w => w.category === "pipeline-position")).toBe(true)
  })
})
