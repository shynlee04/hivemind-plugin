import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { afterEach, describe, expect, it, vi } from "vitest"

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-governance-test-"))
  return join(tempDir, "session-continuity.json")
}

async function loadGovernanceModule(filePath: string) {
  process.env.OPENCODE_HARNESS_CONTINUITY_FILE = filePath
  vi.resetModules()
  return import("../../src/lib/governance-engine.js")
}

afterEach(() => {
  const continuityFile = process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  if (continuityFile) {
    rmSync(dirname(continuityFile), { recursive: true, force: true })
  }

  delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
  vi.resetModules()
})

describe("governance-engine", () => {
  it("loads persisted rules with stable ids, scopes, conditions, and actions", async () => {
    const continuityFile = makeTempContinuityFile()
    const governance = await loadGovernanceModule(continuityFile)

    governance.mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "warn-read",
        scope: "tool.execute.before",
        condition: { toolNames: ["read"] },
        action: {
          type: "warn",
          message: "Read usage is being watched.",
        },
      },
    })

    const reloaded = await loadGovernanceModule(continuityFile)
    const rules = reloaded.loadGovernanceRules()

    expect(rules).toHaveLength(1)
    expect(rules[0]).toMatchObject({
      id: "warn-read",
      scope: "tool.execute.before",
      condition: { toolNames: ["read"] },
      action: { type: "warn", message: "Read usage is being watched." },
    })
  })

  it("appends timestamped durable audit history for violations", async () => {
    const continuityFile = makeTempContinuityFile()
    const governance = await loadGovernanceModule(continuityFile)

    governance.mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "escalate-bash",
        scope: "tool.execute.before",
        condition: { toolNames: ["bash"] },
        action: {
          type: "escalate",
          message: "Bash usage requires escalation.",
          escalation: { channel: "parent", severity: "high" },
        },
      },
    })

    const result = governance.evaluateGovernance({
      scope: "tool.execute.before",
      sessionID: "sid-1",
      toolName: "bash",
      args: { command: "pwd" },
    })

    expect(result.escalations).toHaveLength(1)

    const reloaded = await loadGovernanceModule(continuityFile)
    const violations = reloaded.listGovernanceViolations()

    expect(violations).toHaveLength(1)
    expect(violations[0]).toMatchObject({
      ruleID: "escalate-bash",
      sessionID: "sid-1",
      toolName: "bash",
      actionType: "escalate",
    })
    expect(violations[0]?.createdAt).toEqual(expect.any(Number))
  })

  it("applies add, update, and remove mutations without restart", async () => {
    const continuityFile = makeTempContinuityFile()
    const governance = await loadGovernanceModule(continuityFile)

    governance.mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "dynamic-rule",
        scope: "tool.execute.before",
        condition: { toolNames: ["grep"] },
        action: { type: "warn", message: "Initial warning" },
      },
    })

    expect(
      governance.evaluateGovernance({
        scope: "tool.execute.before",
        sessionID: "sid-2",
        toolName: "grep",
      }).warnings,
    ).toHaveLength(1)

    governance.mutateGovernanceRule({
      type: "upsert",
      source: "test-suite",
      rule: {
        id: "dynamic-rule",
        scope: "tool.execute.before",
        condition: { toolNames: ["grep"] },
        action: { type: "block", message: "Grep is blocked now" },
      },
    })

    expect(
      governance.evaluateGovernance({
        scope: "tool.execute.before",
        sessionID: "sid-2",
        toolName: "grep",
      }).blocks,
    ).toHaveLength(1)

    governance.mutateGovernanceRule({
      type: "remove",
      source: "test-suite",
      ruleID: "dynamic-rule",
    })

    const finalResult = governance.evaluateGovernance({
      scope: "tool.execute.before",
      sessionID: "sid-2",
      toolName: "grep",
    })

    expect(finalResult.warnings).toHaveLength(0)
    expect(finalResult.blocks).toHaveLength(0)
  })

  it("rejects malformed rule mutations before persisting them", async () => {
    const continuityFile = makeTempContinuityFile()
    const governance = await loadGovernanceModule(continuityFile)

    expect(() =>
      governance.mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "bad-rule",
          scope: "tool.execute.before",
          condition: {},
          action: { type: "escalate", message: "Missing escalation metadata" },
        },
      }),
    ).toThrow(/\[Harness\]/)

    expect(governance.loadGovernanceRules()).toHaveLength(0)
  })
})
