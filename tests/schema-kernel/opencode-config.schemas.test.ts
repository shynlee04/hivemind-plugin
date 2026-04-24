import { describe, it, expect } from "vitest"
import {
  AgentNameSchema, AgentFrontmatterSchema, AgentFileSchema,
  CommandNameSchema, CommandFrontmatterSchema, CommandTemplateFeaturesSchema, CommandFileSchema,
  PermissionActionSchema, PermissionRuleSchema, PatternBasedPermissionSchema,
  SkillNameSchema, SkillFrontmatterSchema, SkillFileSchema, SkillDiscoveryLocationSchema,
  MCPServerConfigSchema, OpenCodeConfigSchema,
} from "../../src/schema-kernel/index.js"

// Helpers — shared across describe blocks

const sp = (schema: any, data: unknown) => schema.safeParse(data)

/** Quick strict-reject helper */
const rejectsExtra = (schema: any, valid: object) =>
  it("rejects extra fields (strict)", () => {
    expect(sp(schema, { ...valid, extra_field: true }).success).toBe(false)
  })

// Agent fixtures
const validAgentFm = () => ({ description: "A test agent" })
const fullAgentFm = () => ({
  description: "Full agent", mode: "subagent" as const,
  model: "anthropic/claude-sonnet-4-20250514", variant: "balanced",
  temperature: 0.7, top_p: 0.9, prompt: "You are helpful",
  disable: false, hidden: false, options: { custom: "val" },
  color: "#ff0000", steps: 10,
})
const validAgentFile = () => ({
  frontmatter: validAgentFm(), body: "# Prompt", filePath: ".opencode/agents/my-agent.md",
})

// Command fixtures
const validCmdFm = () => ({ description: "A test command" })
const fullCmdFm = () => ({
  description: "Full command", agent: "builder",
  model: "anthropic/claude-sonnet-4-20250514", subtask: true,
})
const validTplFeatures = () => ({
  has_arguments: true, has_positional_params: true, positional_indices: [1, 2],
  has_bash_injection: false, has_file_injection: true, has_file_reference: false,
  bash_injection_count: 0, file_injection_count: 2, file_reference_count: 0,
})
const validCmdFile = () => ({
  frontmatter: validCmdFm(), body: "Run $ARGUMENTS", filePath: ".opencode/commands/cmd.md",
})

// Permission fixtures
const validPermRule = () => ({ permission: "bash", action: "deny" as const, pattern: "rm -rf *" })
const PK = ["read","edit","glob","grep","bash","task","skill","lsp","question","webfetch","websearch","codesearch","external_directory","doom_loop"]
const validPatternBased = () => Object.fromEntries(PK.map(k =>
  [k, k === "bash" ? { "*": "ask", "git *": "allow" } : k === "external_directory" || k === "doom_loop" ? { "*": "deny" } : { "*": "allow" }]
))

// Skill fixtures
const validSkillFm = () => ({ name: "my-skill", description: "A test skill" })
const fullSkillFm = () => ({
  name: "my-skill", description: "Full skill", license: "MIT",
  compatibility: ">=1.0.0", metadata: { version: "1.0" },
})
const validSkillFile = () => ({
  frontmatter: validSkillFm(), body: "# Content",
  directoryName: "my-skill", skillPath: ".opencode/skills/my-skill/SKILL.md",
})

// ===========================================================================
// AgentNameSchema
// ===========================================================================

describe("AgentNameSchema", () => {
  it("accepts kebab-case", () => expect(sp(AgentNameSchema, "my-agent").success).toBe(true))
  it("accepts single word", () => expect(sp(AgentNameSchema, "researcher").success).toBe(true))
  it("accepts numbers", () => expect(sp(AgentNameSchema, "agent-v2").success).toBe(true))
  it("rejects uppercase", () => expect(sp(AgentNameSchema, "My-Agent").success).toBe(false))
  it("rejects spaces", () => expect(sp(AgentNameSchema, "my agent").success).toBe(false))
  it("rejects leading -", () => expect(sp(AgentNameSchema, "-agent").success).toBe(false))
  it("rejects trailing -", () => expect(sp(AgentNameSchema, "agent-").success).toBe(false))
  it("rejects double --", () => expect(sp(AgentNameSchema, "my--agent").success).toBe(false))
  it("rejects > 64 chars", () => expect(sp(AgentNameSchema, "a".repeat(65)).success).toBe(false))
})

// ===========================================================================
// AgentFrontmatterSchema
// ===========================================================================

describe("AgentFrontmatterSchema", () => {
  it("accepts description only", () => expect(sp(AgentFrontmatterSchema, validAgentFm()).success).toBe(true))
  it("accepts all fields", () => expect(sp(AgentFrontmatterSchema, fullAgentFm()).success).toBe(true))
  it("accepts deprecated tools", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), tools: { bash: true } }).success).toBe(true))
  it("accepts deprecated maxSteps", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), maxSteps: 5 }).success).toBe(true))
  it("accepts theme color name", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), color: "blue" }).success).toBe(true))
  it("accepts #RGB hex", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), color: "#f00" }).success).toBe(true))
  it("rejects missing description", () => expect(sp(AgentFrontmatterSchema, {}).success).toBe(false))
  it("rejects empty description", () => expect(sp(AgentFrontmatterSchema, { description: "" }).success).toBe(false))
  it("rejects negative temperature", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), temperature: -0.1 }).success).toBe(false))
  it("rejects temperature > 2", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), temperature: 2.1 }).success).toBe(false))
  it("rejects top_p > 1", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), top_p: 1.1 }).success).toBe(false))
  it("rejects negative steps", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), steps: -1 }).success).toBe(false))
  it("rejects zero steps", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), steps: 0 }).success).toBe(false))
  it("rejects invalid color", () => expect(sp(AgentFrontmatterSchema, { ...validAgentFm(), color: "nope" }).success).toBe(false))
  rejectsExtra(AgentFrontmatterSchema, validAgentFm())
})

// ===========================================================================
// AgentFileSchema
// ===========================================================================

describe("AgentFileSchema", () => {
  it("accepts valid file", () => expect(sp(AgentFileSchema, validAgentFile()).success).toBe(true))
  it("rejects missing body", () => { const { body, ...r } = validAgentFile(); expect(sp(AgentFileSchema, r).success).toBe(false) })
  it("rejects empty body", () => expect(sp(AgentFileSchema, { ...validAgentFile(), body: "" }).success).toBe(false))
  it("rejects missing filePath", () => { const { filePath, ...r } = validAgentFile(); expect(sp(AgentFileSchema, r).success).toBe(false) })
  rejectsExtra(AgentFileSchema, validAgentFile())
})

// ===========================================================================
// CommandNameSchema
// ===========================================================================

describe("CommandNameSchema", () => {
  it("accepts kebab-case", () => expect(sp(CommandNameSchema, "start-work").success).toBe(true))
  it("rejects uppercase", () => expect(sp(CommandNameSchema, "Start-Work").success).toBe(false))
  it("rejects spaces", () => expect(sp(CommandNameSchema, "start work").success).toBe(false))
  it("rejects leading -", () => expect(sp(CommandNameSchema, "-start").success).toBe(false))
  it("rejects double --", () => expect(sp(CommandNameSchema, "start--work").success).toBe(false))
  it("rejects > 64 chars", () => expect(sp(CommandNameSchema, "x".repeat(65)).success).toBe(false))
})

// ===========================================================================
// CommandFrontmatterSchema
// ===========================================================================

describe("CommandFrontmatterSchema", () => {
  it("accepts description only", () => expect(sp(CommandFrontmatterSchema, validCmdFm()).success).toBe(true))
  it("accepts all fields", () => expect(sp(CommandFrontmatterSchema, fullCmdFm()).success).toBe(true))
  it("rejects missing description", () => expect(sp(CommandFrontmatterSchema, {}).success).toBe(false))
  it("rejects empty description", () => expect(sp(CommandFrontmatterSchema, { description: "" }).success).toBe(false))
  rejectsExtra(CommandFrontmatterSchema, validCmdFm())
})

// ===========================================================================
// CommandTemplateFeaturesSchema
// ===========================================================================

describe("CommandTemplateFeaturesSchema", () => {
  it("accepts valid features", () => expect(sp(CommandTemplateFeaturesSchema, validTplFeatures()).success).toBe(true))
  it("detects $ARGUMENTS", () => expect(sp(CommandTemplateFeaturesSchema, { ...validTplFeatures(), has_arguments: true }).success).toBe(true))
  it("detects positional params", () => expect(sp(CommandTemplateFeaturesSchema, { ...validTplFeatures(), has_positional_params: true, positional_indices: [1, 2, 3] }).success).toBe(true))
  it("detects bash injection", () => expect(sp(CommandTemplateFeaturesSchema, { ...validTplFeatures(), has_bash_injection: true, bash_injection_count: 1 }).success).toBe(true))
  it("rejects positional index 0", () => expect(sp(CommandTemplateFeaturesSchema, { ...validTplFeatures(), positional_indices: [0] }).success).toBe(false))
  it("rejects positional index > 9", () => expect(sp(CommandTemplateFeaturesSchema, { ...validTplFeatures(), positional_indices: [10] }).success).toBe(false))
  it("rejects negative bash_injection_count", () => expect(sp(CommandTemplateFeaturesSchema, { ...validTplFeatures(), bash_injection_count: -1 }).success).toBe(false))
  it("rejects missing required field", () => { const { has_arguments, ...r } = validTplFeatures(); expect(sp(CommandTemplateFeaturesSchema, r).success).toBe(false) })
  rejectsExtra(CommandTemplateFeaturesSchema, validTplFeatures())
})

// ===========================================================================
// CommandFileSchema
// ===========================================================================

describe("CommandFileSchema", () => {
  it("accepts valid file", () => expect(sp(CommandFileSchema, validCmdFile()).success).toBe(true))
  it("rejects missing body", () => { const { body, ...r } = validCmdFile(); expect(sp(CommandFileSchema, r).success).toBe(false) })
  it("rejects empty body", () => expect(sp(CommandFileSchema, { ...validCmdFile(), body: "" }).success).toBe(false))
  rejectsExtra(CommandFileSchema, validCmdFile())
})

// ===========================================================================
// PermissionActionSchema
// ===========================================================================

describe("PermissionActionSchema", () => {
  it('accepts "allow"', () => expect(sp(PermissionActionSchema, "allow").success).toBe(true))
  it('accepts "ask"', () => expect(sp(PermissionActionSchema, "ask").success).toBe(true))
  it('accepts "deny"', () => expect(sp(PermissionActionSchema, "deny").success).toBe(true))
  it('rejects "block"', () => expect(sp(PermissionActionSchema, "block").success).toBe(false))
  it('rejects "grant"', () => expect(sp(PermissionActionSchema, "grant").success).toBe(false))
  it("rejects empty string", () => expect(sp(PermissionActionSchema, "").success).toBe(false))
})

// ===========================================================================
// PermissionRuleSchema
// ===========================================================================

describe("PermissionRuleSchema", () => {
  it("accepts valid rule", () => expect(sp(PermissionRuleSchema, validPermRule()).success).toBe(true))
  it("rejects missing permission", () => { const { permission, ...r } = validPermRule(); expect(sp(PermissionRuleSchema, r).success).toBe(false) })
  it("rejects missing action", () => { const { action, ...r } = validPermRule(); expect(sp(PermissionRuleSchema, r).success).toBe(false) })
  it("rejects missing pattern", () => { const { pattern, ...r } = validPermRule(); expect(sp(PermissionRuleSchema, r).success).toBe(false) })
  it("rejects invalid action", () => expect(sp(PermissionRuleSchema, { ...validPermRule(), action: "block" }).success).toBe(false))
  it("rejects empty permission", () => expect(sp(PermissionRuleSchema, { ...validPermRule(), permission: "" }).success).toBe(false))
  rejectsExtra(PermissionRuleSchema, validPermRule())
})

// ===========================================================================
// PatternBasedPermissionSchema
// ===========================================================================

describe("PatternBasedPermissionSchema", () => {
  it("accepts valid pattern-based", () => expect(sp(PatternBasedPermissionSchema, validPatternBased()).success).toBe(true))
  it("accepts all-wildcard", () => {
    const allAllow = Object.fromEntries(PK.map(k => [k, { "*": "allow" }]))
    expect(sp(PatternBasedPermissionSchema, allAllow).success).toBe(true)
  })
  it("rejects invalid action in pattern", () => {
    expect(sp(PatternBasedPermissionSchema, { ...validPatternBased(), bash: { "*": "block" } }).success).toBe(false)
  })
  it("rejects invalid permission key", () => {
    expect(sp(PatternBasedPermissionSchema, { "not-a-permission": { "*": "allow" } }).success).toBe(false)
  })
  it("rejects partial keys (missing required)", () => {
    expect(sp(PatternBasedPermissionSchema, { bash: { "*": "deny" } }).success).toBe(false)
  })
})

// ===========================================================================
// SkillNameSchema
// ===========================================================================

describe("SkillNameSchema", () => {
  it("accepts kebab-case", () => expect(sp(SkillNameSchema, "my-skill").success).toBe(true))
  it("rejects uppercase", () => expect(sp(SkillNameSchema, "My-Skill").success).toBe(false))
  it("rejects spaces", () => expect(sp(SkillNameSchema, "my skill").success).toBe(false))
  it("rejects leading -", () => expect(sp(SkillNameSchema, "-skill").success).toBe(false))
  it("rejects double --", () => expect(sp(SkillNameSchema, "my--skill").success).toBe(false))
  it("rejects > 64 chars", () => expect(sp(SkillNameSchema, "s".repeat(65)).success).toBe(false))
})

// ===========================================================================
// SkillFrontmatterSchema
// ===========================================================================

describe("SkillFrontmatterSchema", () => {
  it("accepts name + description", () => expect(sp(SkillFrontmatterSchema, validSkillFm()).success).toBe(true))
  it("accepts all fields", () => expect(sp(SkillFrontmatterSchema, fullSkillFm()).success).toBe(true))
  it("rejects missing name", () => { const { name, ...r } = validSkillFm(); expect(sp(SkillFrontmatterSchema, r).success).toBe(false) })
  it("rejects missing description", () => { const { description, ...r } = validSkillFm(); expect(sp(SkillFrontmatterSchema, r).success).toBe(false) })
  it("rejects description > 1024", () => expect(sp(SkillFrontmatterSchema, { ...validSkillFm(), description: "x".repeat(1025) }).success).toBe(false))
  it("rejects empty description", () => expect(sp(SkillFrontmatterSchema, { ...validSkillFm(), description: "" }).success).toBe(false))
  rejectsExtra(SkillFrontmatterSchema, validSkillFm())
})

// ===========================================================================
// SkillFileSchema
// ===========================================================================

describe("SkillFileSchema", () => {
  it("accepts matching name/dirName", () => expect(sp(SkillFileSchema, validSkillFile()).success).toBe(true))
  it("rejects name !== directoryName (refine)", () => {
    expect(sp(SkillFileSchema, {
      ...validSkillFile(),
      frontmatter: { ...validSkillFm(), name: "different" },
      directoryName: "my-skill",
    }).success).toBe(false)
  })
  it("rejects missing body", () => { const { body, ...r } = validSkillFile(); expect(sp(SkillFileSchema, r).success).toBe(false) })
  it("rejects empty body", () => expect(sp(SkillFileSchema, { ...validSkillFile(), body: "" }).success).toBe(false))
  rejectsExtra(SkillFileSchema, validSkillFile())
})

// ===========================================================================
// SkillDiscoveryLocationSchema
// ===========================================================================

describe("SkillDiscoveryLocationSchema", () => {
  it("accepts all valid locations", () => {
    for (const loc of ["project", "global", "claude", "claude-global", "agents", "agents-global"]) {
      expect(sp(SkillDiscoveryLocationSchema, loc).success).toBe(true)
    }
  })
  it("rejects invalid", () => expect(sp(SkillDiscoveryLocationSchema, "invalid").success).toBe(false))
  it("rejects empty", () => expect(sp(SkillDiscoveryLocationSchema, "").success).toBe(false))
})

// ===========================================================================
// MCP Server Config
// ===========================================================================

describe("MCPServerConfigSchema", () => {
  it("accepts valid local config with command array", () => {
    const result = sp(MCPServerConfigSchema, {
      type: "local",
      command: ["npx", "-y", "@anthropic/mcp-server"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe("local")
      expect(result.data.command).toEqual(["npx", "-y", "@anthropic/mcp-server"])
    }
  })

  it("accepts valid remote config with url", () => {
    const result = sp(MCPServerConfigSchema, {
      type: "remote",
      url: "https://mcp.example.com/sse",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.type).toBe("remote")
    }
  })

  it("rejects missing type discriminator", () => {
    const result = sp(MCPServerConfigSchema, {
      command: ["npx", "-y", "pkg"],
    })
    expect(result.success).toBe(false)
  })

  it("rejects local without command", () => {
    const result = sp(MCPServerConfigSchema, {
      type: "local",
    })
    expect(result.success).toBe(false)
  })

  it("rejects remote without url", () => {
    const result = sp(MCPServerConfigSchema, {
      type: "remote",
    })
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// OpenCode Config
// ===========================================================================

describe("OpenCodeConfigSchema", () => {
  it("accepts empty config {}", () => {
    const result = sp(OpenCodeConfigSchema, {})
    expect(result.success).toBe(true)
  })

  it("accepts full config with all fields", () => {
    const result = sp(OpenCodeConfigSchema, {
      $schema: "https://opencode.ai/schema.json",
      agent: { "my-agent": { model: "anthropic/claude-sonnet-4-20250514" } },
      command: { "my-cmd": { agent: "builder" } },
      permission: { read: "allow" },
      plugin: ["./dist/plugin.js"],
      mcp: { "my-server": { type: "local", command: ["node", "server.js"] } },
      instructions: ["./AGENTS.md"],
      default_agent: "coordinator",
      theme: { mode: "dark" },
      provider: { anthropic: { apiKey: "sk-..." } },
    })
    expect(result.success).toBe(true)
  })

  it("rejects extra fields (strict)", () => {
    const result = sp(OpenCodeConfigSchema, {
      unknown_section: "not allowed",
    })
    expect(result.success).toBe(false)
  })
})
