import { describe, expect, it } from "vitest"
import { validateCommandContract } from "../../src/tools/session/validate-command.js"

describe("validateCommandContract", () => {
  it("passes for valid command definition args", () => {
    const args = {
      command: "gsd-stats",
      description: "Show statistics for phase execution",
      triggers: ["/gsd-stats"],
    }
    const result = validateCommandContract(args)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails when required command field is missing", () => {
    const args = {
      description: "Show statistics for phase execution",
      triggers: ["/gsd-stats"],
    }
    const result = validateCommandContract(args)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("command: required, must be a non-empty string")
  })

  it("fails when description is missing", () => {
    const args = {
      command: "gsd-stats",
      triggers: ["/gsd-stats"],
    }
    const result = validateCommandContract(args)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain("description: required, must be a non-empty string")
  })

  it("fails when triggers are missing or empty", () => {
    const args1 = {
      command: "gsd-stats",
      description: "Show statistics for phase execution",
    }
    const result1 = validateCommandContract(args1)
    expect(result1.valid).toBe(false)
    expect(result1.errors).toContain("triggers: required, must be a non-empty array")

    const args2 = {
      command: "gsd-stats",
      description: "Show statistics for phase execution",
      triggers: [],
    }
    const result2 = validateCommandContract(args2)
    expect(result2.valid).toBe(false)
    expect(result2.errors).toContain("triggers: required, must be a non-empty array")
  })

  it("skips validation of SDK-driven fields", () => {
    const args = {
      command: "gsd-stats",
      description: "Show statistics for phase execution",
      triggers: ["/gsd-stats"],
      agent: "invalid Agent format!",
      subtask: "not a boolean",
      model: "invalidModelID",
      tools: ["read", "write"],
    }
    const result = validateCommandContract(args)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
