import { describe, expect, it } from "vitest"

import { TOOL_AUTHORITY_MATRIX, getToolAuthority, inspectToolAuthorityCatalog } from "../../../src/features/runtime-pressure/authority-matrix.js"
import { detectRuntimePressure } from "../../../src/features/runtime-pressure/control-plane.js"

/**
 * Canonical list of all 24 tools registered by HivemindControlPlane in plugin.ts.
 *
 * Source: src/plugin.ts — registerDelegationTools (3), registerSessionTools (7),
 * registerHivemindTools (8), registerConfigTools (6).
 */
const ALL_PLUGIN_TOOLS = [
  // Delegation domain (3)
  "delegate-task",
  "delegation-status",
  "run-background-command",
  // Session domain (7)
  "execute-slash-command",
  "session-patch",
  "session-journal-export",
  "session-tracker",
  "session-hierarchy",
  "session-context",
  "create-governance-session",
  // Hivemind domain (8)
  "hivemind-doc",
  "hivemind-trajectory",
  "hivemind-pressure",
  "hivemind-sdk-supervisor",
  "hivemind-command-engine",
  "hivemind-session-view",
  "hivemind-agent-work-create",
  "hivemind-agent-work-export",
  // Config domain (6)
  "configure-primitive",
  "validate-restart",
  "bootstrap-init",
  "bootstrap-recover",
  "prompt-skim",
  "prompt-analyze",
] as const

describe("authority matrix coverage", () => {
  it("matrix has exactly 24 entries", () => {
    expect(TOOL_AUTHORITY_MATRIX).toHaveLength(24)
  })

  it("every plugin tool has a matrix entry", () => {
    for (const toolName of ALL_PLUGIN_TOOLS) {
      const authority = getToolAuthority(toolName)
      expect(authority, `tool "${toolName}" missing from authority matrix`).toBeDefined()
    }
  })

  it("every matrix entry has a non-empty reason", () => {
    for (const entry of TOOL_AUTHORITY_MATRIX) {
      expect(entry.reason, `tool "${entry.name}" has empty reason`).toBeTruthy()
    }
  })

  it("every matrix entry has valid pressureBehavior for all 4 bands", () => {
    const validOutcomes = ["allow", "advise", "require_approval", "defer", "block"]
    for (const entry of TOOL_AUTHORITY_MATRIX) {
      expect(validOutcomes).toContain(entry.pressureBehavior.steady)
      expect(validOutcomes).toContain(entry.pressureBehavior.advisory)
      expect(validOutcomes).toContain(entry.pressureBehavior.gated)
      expect(validOutcomes).toContain(entry.pressureBehavior.blocking)
    }
  })

  it("detectRuntimePressure returns tool-specific decision for every registered tool", () => {
    for (const toolName of ALL_PLUGIN_TOOLS) {
      const decision = detectRuntimePressure({ toolName, tier: 5 })
      expect(decision.tool, `tool "${toolName}" not resolved by detectRuntimePressure`).toBeDefined()
      expect(decision.tool!.name).toBe(toolName)
    }
  })

  it("unknown tool falls back to unknownToolFallback (no tool field)", () => {
    const decision = detectRuntimePressure({ toolName: "nonexistent-tool", tier: 5 })
    expect(decision.tool).toBeUndefined()
    expect(decision.outcome).toBe("require_approval")
  })

  describe("REQ-25.3-02: execute-slash-command", () => {
    it("is registered with execute authority and mutatesState=true", () => {
      const authority = getToolAuthority("execute-slash-command")
      expect(authority).toBeDefined()
      expect(authority!.authority).toBe("execute")
      expect(authority!.mutatesState).toBe(true)
      expect(authority!.canExecute).toBe(true)
    })
  })

  describe("REQ-25.3-03: session-tracker", () => {
    it("is registered with read authority and mutatesState=false", () => {
      const authority = getToolAuthority("session-tracker")
      expect(authority).toBeDefined()
      expect(authority!.authority).toBe("read")
      expect(authority!.mutatesState).toBe(false)
      expect(authority!.canExecute).toBe(false)
    })
  })

  describe("REQ-25.3-04: all 8 previously-missing tools", () => {
    const previouslyMissing = [
      "execute-slash-command",
      "session-tracker",
      "session-hierarchy",
      "session-context",
      "create-governance-session",
      "bootstrap-init",
      "bootstrap-recover",
      "hivemind-session-view",
    ]

    it.each(previouslyMissing)("%s returns tool-specific decision (not fallback)", (toolName) => {
      const decision = detectRuntimePressure({ toolName, tier: 5 })
      expect(decision.tool, `${toolName} should not fall back`).toBeDefined()
      expect(decision.tool!.name).toBe(toolName)
    })
  })

  describe("inspectToolAuthorityCatalog", () => {
    it("returns a copy (not the original array)", () => {
      const catalog = inspectToolAuthorityCatalog()
      expect(catalog).toHaveLength(24)
      // Mutating the copy should not affect the original
      catalog.pop()
      expect(TOOL_AUTHORITY_MATRIX).toHaveLength(24)
    })
  })
})
