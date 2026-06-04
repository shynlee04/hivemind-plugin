import { describe, it, expect } from "vitest"
import {
  GovernanceConfigsSchema,
  HivemindConfigsSchema,
  NamingStandardsSchema,
  AgentConfigSchema,
  CommandConfigSchema,
  TemplateConfigSchema,
  GuardrailLevelSchema,
  DelegationModeSchema,
  ToolAccessPatternSchema,
  SkillFilterSchema,
  readConfigs,
} from "../../src/schema-kernel/hivemind-configs.schema.js"

// ===========================================================================
// GovernanceConfigsSchema — new fields
// ===========================================================================

describe("GovernanceConfigsSchema", () => {
  it("accepts valid governance object with all new fields", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [],
      naming_standards: {
        allowed_frameworks: ["hm", "hf"],
        allowed_classifications: ["root", "child"],
        naming_format: "{framework}/{classification}",
        max_title_length: 128,
      },
      agent_configs: {
        "hm-test": { description: "Test agent", allowedCommands: ["read"] },
      },
      command_agent_mappings: {
        plan: { agent: "hm-planner", description: "Create plans" },
      },
      templates: {
        brief: { description: "Brief template", content: "Template content" },
      },
    })
    expect(result.success).toBe(true)
  })

  it("accepts governance object with only rules (backward compat)", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [{ id: "test-rule", condition: {}, action: { type: "warn" }, enabled: true }],
    })
    expect(result.success).toBe(true)
  })

  it("accepts empty governance object (defaults to {rules: []})", () => {
    const result = GovernanceConfigsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rules).toEqual([])
    }
  })
})

// ===========================================================================
// HivemindConfigsSchema — behavioral override fields
// ===========================================================================

describe("HivemindConfigsSchema behavioral overrides", () => {
  it("accepts config with guardrail_level: strict", () => {
    const result = HivemindConfigsSchema.safeParse({
      guardrail_level: "strict",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.guardrail_level).toBe("strict")
    }
  })

  it("accepts config without behavioral override fields (backward compat)", () => {
    const result = HivemindConfigsSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.guardrail_level).toBeUndefined()
      expect(result.data.delegation_mode).toBeUndefined()
      expect(result.data.tool_access_pattern).toBeUndefined()
      expect(result.data.skill_filter).toBeUndefined()
    }
  })

  it("rejects invalid guardrail_level value (not in enum)", () => {
    const result = HivemindConfigsSchema.safeParse({
      guardrail_level: "invalid-value",
    })
    expect(result.success).toBe(false)
  })

  it("accepts all 4 behavioral override fields together", () => {
    const result = HivemindConfigsSchema.safeParse({
      guardrail_level: "moderate",
      delegation_mode: "direct",
      tool_access_pattern: "full",
      skill_filter: "domain",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.guardrail_level).toBe("moderate")
      expect(result.data.delegation_mode).toBe("direct")
      expect(result.data.tool_access_pattern).toBe("full")
      expect(result.data.skill_filter).toBe("domain")
    }
  })
})

// ===========================================================================
// Individual sub-schemas
// ===========================================================================

describe("NamingStandardsSchema", () => {
  it("accepts valid naming standards object", () => {
    const result = NamingStandardsSchema.safeParse({
      allowed_frameworks: ["hm", "hf", "gate", "stack"],
      allowed_classifications: ["root", "child"],
      naming_format: "{framework}/{classification}/{name}",
      max_title_length: 128,
    })
    expect(result.success).toBe(true)
  })

  it("accepts partial naming standards (all fields optional)", () => {
    const result = NamingStandardsSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("AgentConfigSchema", () => {
  it("accepts valid agent config object", () => {
    const result = AgentConfigSchema.safeParse({
      description: "Test agent",
      allowedCommands: ["read", "write"],
      tools: ["bash"],
      temperature: 0.7,
    })
    expect(result.success).toBe(true)
  })

  it("accepts partial agent config (all fields optional)", () => {
    const result = AgentConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe("CommandConfigSchema", () => {
  it("accepts valid command config object", () => {
    const result = CommandConfigSchema.safeParse({
      agent: "hm-planner",
      workflow: "plan-phase",
      description: "Create plans",
    })
    expect(result.success).toBe(true)
  })

  it("accepts partial command config (all fields optional)", () => {
    const result = CommandConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

// ===========================================================================
// Behavioral override enum schemas
// ===========================================================================

describe("Behavioral override enums", () => {
  it("GuardrailLevelSchema accepts strict/moderate/permissive", () => {
    expect(GuardrailLevelSchema.safeParse("strict").success).toBe(true)
    expect(GuardrailLevelSchema.safeParse("moderate").success).toBe(true)
    expect(GuardrailLevelSchema.safeParse("permissive").success).toBe(true)
    expect(GuardrailLevelSchema.safeParse("invalid").success).toBe(false)
  })

  it("DelegationModeSchema accepts waiter/direct/autonomous", () => {
    expect(DelegationModeSchema.safeParse("waiter").success).toBe(true)
    expect(DelegationModeSchema.safeParse("direct").success).toBe(true)
    expect(DelegationModeSchema.safeParse("autonomous").success).toBe(true)
    expect(DelegationModeSchema.safeParse("invalid").success).toBe(false)
  })

  it("ToolAccessPatternSchema accepts restricted/standard/full", () => {
    expect(ToolAccessPatternSchema.safeParse("restricted").success).toBe(true)
    expect(ToolAccessPatternSchema.safeParse("standard").success).toBe(true)
    expect(ToolAccessPatternSchema.safeParse("full").success).toBe(true)
    expect(ToolAccessPatternSchema.safeParse("invalid").success).toBe(false)
  })

  it("SkillFilterSchema accepts curated/domain/full", () => {
    expect(SkillFilterSchema.safeParse("curated").success).toBe(true)
    expect(SkillFilterSchema.safeParse("domain").success).toBe(true)
    expect(SkillFilterSchema.safeParse("full").success).toBe(true)
    expect(SkillFilterSchema.safeParse("invalid").success).toBe(false)
  })
})

// ===========================================================================
// Real config file validation
// ===========================================================================

describe("Real config file validation", () => {
  it("HivemindConfigsSchema parses with governance field present", () => {
    const config = {
      conversation_language: "en",
      mode: "hivemind-powered",
      governance: {
        rules: [],
        naming_standards: {
          allowed_frameworks: ["hm", "hf"],
        },
        agent_configs: {
          "hm-test": { description: "Test" },
        },
      },
    }
    const result = HivemindConfigsSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.governance.naming_standards?.allowed_frameworks).toEqual(["hm", "hf"])
      expect(result.data.governance.agent_configs?.["hm-test"]?.description).toBe("Test")
    }
  })

  it("HivemindConfigsSchema parses config without governance field (backward compat)", () => {
    const config = {
      conversation_language: "en",
      mode: "expert-advisor",
    }
    const result = HivemindConfigsSchema.safeParse(config)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.governance.rules).toEqual([])
    }
  })

  it("validates full registry: agent_configs has >= 42 agents", () => {
    const config = readConfigs(process.cwd())
    const agentCount = Object.keys(config.governance.agent_configs || {}).length
    expect(agentCount).toBeGreaterThanOrEqual(42)
  })

  it("validates full registry: command_agent_mappings has >= 100 commands", () => {
    const config = readConfigs(process.cwd())
    const cmdCount = Object.keys(config.governance.command_agent_mappings || {}).length
    expect(cmdCount).toBeGreaterThanOrEqual(100)
  })

  it("validates governance.rules has 5 entries", () => {
    const config = readConfigs(process.cwd())
    expect(config.governance.rules).toHaveLength(5)
    const ruleIds = config.governance.rules.map(r => r.id)
    expect(ruleIds).toContain("gov-delegate-task-subagent-only")
    expect(ruleIds).toContain("gov-write-depth-warn")
    expect(ruleIds).toContain("gov-delegate-task-depth-block")
    expect(ruleIds).toContain("gov-create-session-naming-warn")
    expect(ruleIds).toContain("gov-unsafe-tools-escalate")
  })
})
