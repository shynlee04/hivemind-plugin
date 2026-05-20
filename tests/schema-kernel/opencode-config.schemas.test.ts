import { describe, it, expect } from "vitest"
import {
  AgentNameSchema, AgentFrontmatterSchema, AgentFrontmatterSchemaLenient, AgentFileSchema, AgentFileSchemaLenient,
  CommandNameSchema, CommandFrontmatterSchema, CommandFrontmatterSchemaLenient, CommandTemplateFeaturesSchema, CommandTemplateFeaturesSchemaLenient, CommandFileSchema, CommandFileSchemaLenient,

  SkillNameSchema, SkillFrontmatterSchema, SkillFrontmatterSchemaLenient, SkillFileSchema, SkillFileSchemaLenient, SkillDiscoveryLocationSchema,
  ToolDefinitionSchema, ToolDefinitionSchemaLenient, ToolFileSchema, ToolFileSchemaLenient,
  MCPServerConfigSchema, OpenCodeConfigSchema, ConfigPrecedenceLevelSchema, ConfigSourceSchema, ConfigSourceSchemaLenient,
  validateWithFallback,
} from "../../src/schema-kernel/index.js"

// Helpers — shared across describe blocks

const sp = (schema: any, data: unknown) => schema.safeParse(data)

/** Quick strict-reject helper */
const rejectsExtra = (schema: any, valid: object) =>
  it("rejects extra fields (strict)", () => {
    expect(sp(schema, { ...valid, extra_field: true }).success).toBe(false)
  })

/** Quick lenient-accept helper */
const acceptsExtra = (schema: any, valid: object) =>
  it("accepts extra fields (lenient)", () => {
    const result = sp(schema, { ...valid, extra_field: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect("extra_field" in result.data).toBe(false)
    }
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

// Tool fixtures
const validToolDef = () => ({
  name: "my-tool", description: "A test tool", args: { input: "string" },
  hasExecute: true, filePath: ".opencode/tools/my-tool.ts", exports: ["default"],
})
const validToolFile = () => ({
  definition: validToolDef(), sourcePath: ".opencode/tools/my-tool.ts",
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
// ToolDefinitionSchema
// ===========================================================================

describe("ToolDefinitionSchema", () => {
  it("accepts valid definition", () => expect(sp(ToolDefinitionSchema, validToolDef()).success).toBe(true))
  it("rejects missing name", () => { const { name, ...r } = validToolDef(); expect(sp(ToolDefinitionSchema, r).success).toBe(false) })
  it("rejects missing description", () => { const { description, ...r } = validToolDef(); expect(sp(ToolDefinitionSchema, r).success).toBe(false) })
  rejectsExtra(ToolDefinitionSchema, validToolDef())
})

describe("ToolFileSchema", () => {
  it("accepts valid file", () => expect(sp(ToolFileSchema, validToolFile()).success).toBe(true))
  it("rejects missing sourcePath", () => { const { sourcePath, ...r } = validToolFile(); expect(sp(ToolFileSchema, r).success).toBe(false) })
  rejectsExtra(ToolFileSchema, validToolFile())
})

describe("ToolDefinitionSchemaLenient", () => {
  it("accepts valid data", () => expect(sp(ToolDefinitionSchemaLenient, validToolDef()).success).toBe(true))
  acceptsExtra(ToolDefinitionSchemaLenient, validToolDef())
})

describe("ToolFileSchemaLenient", () => {
  it("accepts valid file", () => expect(sp(ToolFileSchemaLenient, validToolFile()).success).toBe(true))
  acceptsExtra(ToolFileSchemaLenient, validToolFile())
})

// ===========================================================================
// ConfigPrecedenceLevelSchema
// ===========================================================================

describe("ConfigPrecedenceLevelSchema", () => {
  it("accepts known levels", () => {
    for (const level of ["managed_preferences", "managed_config", "inline_config", "opencode_dir", "project_config", "custom_config", "global_config", "remote_config"]) {
      expect(sp(ConfigPrecedenceLevelSchema, level).success).toBe(true)
    }
  })
  it("accepts future levels", () => {
    expect(sp(ConfigPrecedenceLevelSchema, "future_level").success).toBe(true)
  })
  it("rejects empty string", () => {
    expect(sp(ConfigPrecedenceLevelSchema, "").success).toBe(false)
  })
})

// ===========================================================================
// MCP Server / OpenCode Config
// ===========================================================================

describe("MCPServerConfigSchema", () => {
  it("accepts valid local config with command array", () => {
    const result = sp(MCPServerConfigSchema, { type: "local", command: ["node", "server.js"] })
    expect(result.success).toBe(true)
  })

  it("accepts valid remote config with url", () => {
    const result = sp(MCPServerConfigSchema, { type: "remote", url: "https://example.com/mcp" })
    expect(result.success).toBe(true)
  })

  it("rejects missing type discriminator", () => {
    const result = sp(MCPServerConfigSchema, { command: ["node"] })
    expect(result.success).toBe(false)
  })

  it("rejects local without command", () => {
    const result = sp(MCPServerConfigSchema, { type: "local" })
    expect(result.success).toBe(false)
  })

  it("rejects remote without url", () => {
    const result = sp(MCPServerConfigSchema, { type: "remote" })
    expect(result.success).toBe(false)
  })
})

describe("OpenCodeConfigSchema", () => {
  it("accepts empty config {}", () => {
    const result = sp(OpenCodeConfigSchema, {})
    expect(result.success).toBe(true)
  })

  it("accepts full config with all fields", () => {
    const result = sp(OpenCodeConfigSchema, {
      agent: { "my-agent": { description: "Test" } },
      command: { "my-cmd": { description: "Test" } },
      mcp: { "my-server": { type: "local", command: ["node"] } },
      instructions: [".opencode/rules.md"],
      default_agent: "my-agent",
    })
    expect(result.success).toBe(true)
  })

  it("rejects extra fields (strict)", () => {
    const result = sp(OpenCodeConfigSchema, { unknown: true })
    expect(result.success).toBe(false)
  })
})

// ===========================================================================
// Lenient Schema Variants — accept extra fields by stripping them
// ===========================================================================

describe("AgentFrontmatterSchemaLenient", () => {
  it("accepts valid data", () => expect(sp(AgentFrontmatterSchemaLenient, validAgentFm()).success).toBe(true))
  acceptsExtra(AgentFrontmatterSchemaLenient, validAgentFm())
})

describe("AgentFileSchemaLenient", () => {
  it("accepts valid file", () => expect(sp(AgentFileSchemaLenient, validAgentFile()).success).toBe(true))
  acceptsExtra(AgentFileSchemaLenient, validAgentFile())
})

describe("CommandFrontmatterSchemaLenient", () => {
  it("accepts valid data", () => expect(sp(CommandFrontmatterSchemaLenient, validCmdFm()).success).toBe(true))
  acceptsExtra(CommandFrontmatterSchemaLenient, validCmdFm())
})

describe("CommandTemplateFeaturesSchemaLenient", () => {
  it("accepts valid features", () => expect(sp(CommandTemplateFeaturesSchemaLenient, validTplFeatures()).success).toBe(true))
  acceptsExtra(CommandTemplateFeaturesSchemaLenient, validTplFeatures())
})

describe("CommandFileSchemaLenient", () => {
  it("accepts valid file", () => expect(sp(CommandFileSchemaLenient, validCmdFile()).success).toBe(true))
  acceptsExtra(CommandFileSchemaLenient, validCmdFile())
})

describe("SkillFrontmatterSchemaLenient", () => {
  it("accepts valid data", () => expect(sp(SkillFrontmatterSchemaLenient, validSkillFm()).success).toBe(true))
  acceptsExtra(SkillFrontmatterSchemaLenient, validSkillFm())
})

describe("SkillFileSchemaLenient", () => {
  it("accepts valid file", () => expect(sp(SkillFileSchemaLenient, validSkillFile()).success).toBe(true))
  acceptsExtra(SkillFileSchemaLenient, validSkillFile())
})

// ===========================================================================
// validateWithFallback — strict-first with graceful stripping
// ===========================================================================

describe("validateWithFallback", () => {
  it("returns success with no warnings when strict passes", () => {
    const result = validateWithFallback(AgentFrontmatterSchema, AgentFrontmatterSchemaLenient, validAgentFm(), "agent")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings).toEqual([])
      expect(result.data).toEqual(validAgentFm())
    }
  })

  it("strips unknown fields and returns warning when only unrecognized keys", () => {
    const result = validateWithFallback(AgentFrontmatterSchema, AgentFrontmatterSchemaLenient, { ...validAgentFm(), unknownField: 123 }, "agent")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain("Stripped unrecognized keys")
      expect("unknownField" in result.data).toBe(false)
    }
  })

  it("returns failure when strict fails for non-unknown-key reasons", () => {
    const result = validateWithFallback(AgentFrontmatterSchema, AgentFrontmatterSchemaLenient, { temperature: -1 }, "agent")
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes("temperature"))).toBe(true)
    }
  })

  it("strips nested unknown fields in composed schemas", () => {
    const data = { ...validAgentFile(), extra: true, frontmatter: { ...validAgentFm(), extraFm: true } }
    const result = validateWithFallback(AgentFileSchema, AgentFileSchemaLenient, data, "agent-file")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings.length).toBeGreaterThan(0)
      expect("extra" in result.data).toBe(false)
      expect("extraFm" in result.data.frontmatter).toBe(false)
    }
  })

  it("accepts future permission keys without warnings (permission field is known)", () => {
    const data = { ...validAgentFm(), permission: { "future-tool": { "*": "allow" } } }
    const result = validateWithFallback(AgentFrontmatterSchema, AgentFrontmatterSchemaLenient, data, "agent")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings).toEqual([])
    }
  })

  it("accepts future config levels via lenient fallback", () => {
    const data = { key: "test", value: "val", source: "future_level" }
    const result = validateWithFallback(ConfigSourceSchema, ConfigSourceSchemaLenient, data, "config")
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings).toEqual([])
    }
  })
})
