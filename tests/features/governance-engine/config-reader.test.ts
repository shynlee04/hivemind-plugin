/**
 * Unit tests for governance config reader.
 *
 * Tests config loading, Zod validation, agent resolution from brief,
 * and naming title validation against allowed standards.
 *
 * @module tests/features/governance-engine/config-reader
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, writeFileSync, existsSync } from "node:fs"
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
  defaultAgent: "hm-l2-scout",
  naming_standards: {
    allowed_frameworks: ["hm", "gsd"],
    allowed_workflows: ["governance", "delegate", "planning", "execute", "spawn"],
    allowed_classifications: ["root", "child", "grandchild", "fork"],
    naming_format: "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
    description: "Project-wide session naming convention.",
  },
  agents: {
    "hm-l2-researcher": {
      description: "Multi-source research with evidence tracking",
      allowedCommands: ["tavily-search", "tavily-extract"],
    },
    "hm-l2-reviewer": {
      description: "Code review and quality gate evaluation",
      allowedCommands: ["code-review", "gate-check"],
    },
    "hm-l2-debugger": {
      description: "Systematic debugging with persistent state",
      allowedCommands: ["debug", "investigate", "trace"],
    },
    "hm-l2-scout": {
      description: "Quick context discovery and session investigation",
      allowedCommands: ["context", "read", "glob"],
    },
  },
  commands: {},
  templates: {},
}

const NAMING_STANDARDS: NamingStandardsConfig = {
  allowed_frameworks: ["hm", "gsd"],
  allowed_workflows: ["governance", "delegate", "planning", "execute", "spawn"],
  allowed_classifications: ["root", "child", "grandchild", "fork"],
  naming_format: "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
  description: "Project-wide session naming convention.",
}

// ---------------------------------------------------------------------------
// readGovernanceConfig — uses real temp files for fs testing
// ---------------------------------------------------------------------------

describe("readGovernanceConfig", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "gov-config-"))
  })

  afterEach(() => {
    const fs = require("node:fs")
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  /**
   * Test: returns typed config for valid JSON.
   */
  it("returns typed config for valid JSON", async () => {
    const configPath = join(tmpDir, ".hivemind", "governance")
    const fs = require("node:fs")
    fs.mkdirSync(configPath, { recursive: true })
    writeFileSync(
      join(configPath, "config.json"),
      JSON.stringify(VALID_CONFIG, null, 2),
    )

    const config = await readGovernanceConfig(tmpDir)
    expect(config).toBeDefined()
    expect(config.version).toBe("1.0.0")
    expect(config.defaultAgent).toBe("hm-l2-scout")
    expect(config.naming_standards).toBeDefined()
    expect(config.naming_standards!.allowed_frameworks).toContain("hm")
    expect(config.agents).toBeDefined()
    expect(config.commands).toBeDefined()
    expect(config.templates).toBeDefined()
  })

  /**
   * Test: throws on missing file.
   */
  it("throws on missing file", async () => {
    await expect(readGovernanceConfig(tmpDir)).rejects.toThrow(
      /not found|ENOENT/,
    )
  })
})

// ---------------------------------------------------------------------------
// resolveAgentForBrief
// ---------------------------------------------------------------------------

describe("resolveAgentForBrief", () => {
  /**
   * Test: matches agent by keyword from description.
   */
  it("matches agent by keyword", () => {
    const agent = resolveAgentForBrief("research the auth module", VALID_CONFIG)
    expect(agent).toBe("hm-l2-researcher")
  })

  /**
   * Test: returns defaultAgent when no match found.
   */
  it("returns defaultAgent when no match", () => {
    const agent = resolveAgentForBrief("do random thing", VALID_CONFIG)
    expect(agent).toBe(VALID_CONFIG.defaultAgent)
  })

  /**
   * Test: matching is case-insensitive.
   */
  it("matches case-insensitively", () => {
    const agent = resolveAgentForBrief("CODE REVIEW the auth module", VALID_CONFIG)
    expect(agent).toBe("hm-l2-reviewer")
  })
})

// ---------------------------------------------------------------------------
// validateNamingTitle
// ---------------------------------------------------------------------------

describe("validateNamingTitle", () => {
  /**
   * Test: passes for valid naming service title.
   */
  it("passes for valid naming service title", () => {
    const result = validateNamingTitle(
      "hm/governance/root/gsd-auditor/audit-phase23@0",
      NAMING_STANDARDS,
    )
    expect(result).toBe(true)
  })

  /**
   * Test: fails for invalid framework.
   */
  it("fails for invalid framework", () => {
    const result = validateNamingTitle(
      "invalid/delegate/child/researcher/test@1",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  /**
   * Test: fails for invalid workflow.
   */
  it("fails for invalid workflow", () => {
    const result = validateNamingTitle(
      "hm/unknown/child/gsd-researcher/test@1",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  /**
   * Test: fails for invalid classification.
   */
  it("fails for invalid classification", () => {
    const result = validateNamingTitle(
      "hm/delegate/unknown/gsd-researcher/test@1",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  /**
   * Test: fails for missing @ separator.
   */
  it("fails for missing @ separator", () => {
    const result = validateNamingTitle(
      "hm/delegate/child/gsd-researcher/noatseparator",
      NAMING_STANDARDS,
    )
    expect(result).toBe(false)
  })

  /**
   * Test: fails for too few segments.
   */
  it("fails for too few segments", () => {
    const result = validateNamingTitle("hm/delegate/root", NAMING_STANDARDS)
    expect(result).toBe(false)
  })
})
