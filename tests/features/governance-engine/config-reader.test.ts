/**
 * Unit tests for governance config reader (SR-05 facade pattern).
 *
 * Tests the facade over readConfigs().governance, agent resolution from brief,
 * and naming title validation against allowed standards.
 *
 * @module tests/features/governance-engine/config-reader
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  readGovernanceConfig,
  resolveAgentForBrief,
  validateNamingTitle,
  type GovernanceConfig,
  type NamingStandardsConfig,
} from "../../../src/features/governance-engine/config-reader.js"

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_CONFIG: GovernanceConfig = {
  version: "1.0.0",
  defaultAgent: "hm-codebase-mapper",
  naming_standards: {
    allowed_frameworks: ["hm", "hf", "gate", "stack"],
    allowed_workflows: ["governance", "delegate", "planning", "execute", "spawn"],
    allowed_classifications: ["root", "child", "grandchild", "fork"],
    naming_format: "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
  },
  agent_configs: {
    "hm-project-researcher": {
      description: "Multi-source research with evidence tracking",
    },
    "hm-code-reviewer": {
      description: "Code review and quality gate evaluation",
    },
    "hm-debugger": {
      description: "Systematic debugging with persistent state",
    },
    "hm-codebase-mapper": {
      description: "Quick context discovery and session investigation",
    },
  },
  command_agent_mappings: {},
  templates: {},
  rules: [],
}

const NAMING_STANDARDS: NamingStandardsConfig = {
  allowed_frameworks: ["hm", "hf", "gate", "stack"],
  allowed_workflows: ["governance", "delegate", "planning", "execute", "spawn"],
  allowed_classifications: ["root", "child", "grandchild", "fork"],
  naming_format: "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
}

// ---------------------------------------------------------------------------
// readGovernanceConfig — facade over readConfigs().governance
// ---------------------------------------------------------------------------

describe("readGovernanceConfig", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "gov-config-"))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("returns typed config from unified configs.json", () => {
    // Create .hivemind/configs.json with governance data
    const hivemindDir = join(tmpDir, ".hivemind")
    mkdirSync(hivemindDir, { recursive: true })
    writeFileSync(
      join(hivemindDir, "configs.json"),
      JSON.stringify({
        governance: {
          rules: [],
          naming_standards: VALID_CONFIG.naming_standards,
          agent_configs: VALID_CONFIG.agent_configs,
          command_agent_mappings: {},
          templates: {},
        },
      }, null, 2),
    )

    const config = readGovernanceConfig(tmpDir)
    expect(config).toBeDefined()
    expect(config.naming_standards).toBeDefined()
    expect(config.naming_standards!.allowed_frameworks).toContain("hm")
    expect(config.agent_configs).toBeDefined()
    expect(Object.keys(config.agent_configs!)).toContain("hm-project-researcher")
  })

  it("returns defaults when configs.json has no governance field", () => {
    const hivemindDir = join(tmpDir, ".hivemind")
    mkdirSync(hivemindDir, { recursive: true })
    writeFileSync(
      join(hivemindDir, "configs.json"),
      JSON.stringify({ mode: "expert-advisor" }, null, 2),
    )

    const config = readGovernanceConfig(tmpDir)
    expect(config).toBeDefined()
    expect(config.rules).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// resolveAgentForBrief
// ---------------------------------------------------------------------------

describe("resolveAgentForBrief", () => {
  it("matches agent by keyword", () => {
    const agent = resolveAgentForBrief("research the auth module", VALID_CONFIG)
    expect(agent).toBe("hm-project-researcher")
  })

  it("returns defaultAgent when no match found", () => {
    const agent = resolveAgentForBrief("do random thing", VALID_CONFIG)
    expect(agent).toBe(VALID_CONFIG.defaultAgent)
  })

  it("matching is case-insensitive", () => {
    const agent = resolveAgentForBrief("CODE REVIEW the auth module", VALID_CONFIG)
    expect(agent).toBe("hm-code-reviewer")
  })
})

// ---------------------------------------------------------------------------
// validateNamingTitle
// ---------------------------------------------------------------------------

describe("validateNamingTitle", () => {
  it("passes for valid naming service title", () => {
    const result = validateNamingTitle(
      "hm/governance/root/agent/data-collection@0",
      NAMING_STANDARDS,
    )
    expect(result).toBe(true)
  })

  it("fails for invalid framework", () => {
    const result = validateNamingTitle(
      "invalid/delegate/child/researcher/test@1",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  it("fails for invalid classification", () => {
    const result = validateNamingTitle(
      "hm/delegate/unknown/researcher/test@1",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  it("fails for missing @ separator", () => {
    const result = validateNamingTitle(
      "hm/delegate/child/researcher/noatseparator",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  it("fails for too few segments", () => {
    const result = validateNamingTitle("hm/delegate/root", NAMING_STANDARDS)
    expect(result).toBe(false)
  })
})
