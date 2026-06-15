import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, readFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  GovernanceConfigsSchema,
  readConfigs,
  writeConfigs,
  getDefaultConfigs,
} from "../../src/schema-kernel/hivemind-configs.schema.js"
import { DEFAULT_GOVERNANCE_CONFIGS } from "../../src/config/defaults.js"

// ===========================================================================
// Phase 2 RED tests — governance.tool_denied_message schema extension
// ===========================================================================

describe("governance.tool_denied_message schema", () => {
  it("accepts valid tool_denied_message with {toolName} and {agentName} placeholders", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [],
      tool_denied_message: {
        edit: { message: "Tool '{toolName}' denied for '{agentName}'. Use hivemind-doc instead." },
        write: { message: "Tool '{toolName}' denied for '{agentName}'. Use hivemind-doc instead." },
      },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tool_denied_message).toBeDefined()
      expect(result.data.tool_denied_message!.edit.message).toContain("{toolName}")
      expect(result.data.tool_denied_message!.edit.message).toContain("{agentName}")
    }
  })

  it("accepts governance config without tool_denied_message (optional field)", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tool_denied_message).toBeUndefined()
    }
  })

  it("rejects tool_denied_message entry missing the message field", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [],
      tool_denied_message: {
        edit: {},
      },
    })
    expect(result.success).toBe(false)
  })

  it("rejects tool_denied_message entry with non-string message", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [],
      tool_denied_message: {
        edit: { message: 123 },
      },
    })
    expect(result.success).toBe(false)
  })

  it("accepts tool_denied_message with arbitrary tool names", () => {
    const result = GovernanceConfigsSchema.safeParse({
      rules: [],
      tool_denied_message: {
        bash: { message: "bash is blocked for {agentName}" },
        "execute-slash-command": { message: "No slash commands for {agentName}" },
      },
    })
    expect(result.success).toBe(true)
  })
})

describe("DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message", () => {
  it("includes default messages for edit and write tools", () => {
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message).toBeDefined()
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message!.edit).toBeDefined()
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message!.edit.message).toContain("{toolName}")
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message!.edit.message).toContain("{agentName}")
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message!.edit.message).toContain("hivemind-doc")
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message!.write).toBeDefined()
    expect(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message!.write.message).toContain("hivemind-doc")
  })

  it("default messages mention hivemind-doc as the alternative tool", () => {
    for (const [, entry] of Object.entries(DEFAULT_GOVERNANCE_CONFIGS.tool_denied_message ?? {})) {
      expect(entry.message).toContain("hivemind-doc")
    }
  })
})

describe("tool_denied_message round-trip via writeConfigs/readConfigs", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = join(tmpdir(), `hivemind-tdm-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("round-trips tool_denied_message through write/read", () => {
    const config = readConfigs(process.cwd())
    config.governance.tool_denied_message = {
      edit: { message: "Custom edit deny for {agentName}: use hivemind-doc" },
      write: { message: "Custom write deny for {agentName}: use hivemind-doc" },
    }
    writeConfigs(tmpDir, config)
    const roundTripped = readConfigs(tmpDir)
    expect(roundTripped.governance.tool_denied_message).toEqual({
      edit: { message: "Custom edit deny for {agentName}: use hivemind-doc" },
      write: { message: "Custom write deny for {agentName}: use hivemind-doc" },
    })
  })

  it("persists tool_denied_message to disk as JSON", () => {
    const config = getDefaultConfigs()
    writeConfigs(tmpDir, config)
    const raw = readFileSync(join(tmpDir, ".hivemind", "configs.json"), "utf8")
    const parsed = JSON.parse(raw)
    expect(parsed.governance?.tool_denied_message).toBeDefined()
    expect(parsed.governance.tool_denied_message.edit.message).toContain("hivemind-doc")
  })
})
