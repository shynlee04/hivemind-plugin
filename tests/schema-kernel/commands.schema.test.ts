import { describe, it, expect } from "vitest"
import { ExecuteSlashCommandSchema } from "../../src/schema-kernel/commands.schema.js"

describe("ExecuteSlashCommandSchema", () => {
  it("should validate a valid input with all fields", () => {
    const input = {
      command: "gsd-stats",
      arguments: "some arguments",
      agent: "gsd-executor",
      model: "anthropic/claude-3-5-sonnet",
      subtask: true,
      commandSource: "agent",
      trackExecution: false,
      parentSessionID: "parent-session-123",
    }
    const result = ExecuteSlashCommandSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })

  it("should reject command name with uppercase or special chars", () => {
    const inputs = [
      { command: "Gsd-stats" },
      { command: "gsd_stats" },
      { command: "gsd-stats!" },
      { command: "1gsd-stats" },
      { command: "" },
    ]
    for (const input of inputs) {
      const result = ExecuteSlashCommandSchema.safeParse(input)
      expect(result.success).toBe(false)
    }
  })

  it("should reject arguments longer than 10000 characters", () => {
    const longArgs = "a".repeat(10001)
    const result = ExecuteSlashCommandSchema.safeParse({
      command: "gsd-stats",
      arguments: longArgs,
    })
    expect(result.success).toBe(false)
  })

  it("should accept optional fields", () => {
    const input = {
      command: "gsd-stats",
    }
    const result = ExecuteSlashCommandSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it("should validate model format when provided", () => {
    const validModels = [
      "anthropic/claude-3-5-sonnet",
      "openai/gpt-4o",
      "google/gemini-1.5-pro",
    ]
    const invalidModels = [
      "claude-3-5-sonnet",
      "anthropic/",
      "/gpt-4o",
      "anthropic/claude/3-5-sonnet",
    ]

    for (const model of validModels) {
      const result = ExecuteSlashCommandSchema.safeParse({
        command: "gsd-stats",
        model,
      })
      expect(result.success).toBe(true)
    }

    for (const model of invalidModels) {
      const result = ExecuteSlashCommandSchema.safeParse({
        command: "gsd-stats",
        model,
      })
      expect(result.success).toBe(false)
    }
  })

  it("should validate agent name format when provided", () => {
    const validAgents = ["gsd-executor", "hm-l1-coordinator"]
    const invalidAgents = ["Gsd-executor", "gsd_executor", "gsd-executor!"]

    for (const agent of validAgents) {
      const result = ExecuteSlashCommandSchema.safeParse({
        command: "gsd-stats",
        agent,
      })
      expect(result.success).toBe(true)
    }

    for (const agent of invalidAgents) {
      const result = ExecuteSlashCommandSchema.safeParse({
        command: "gsd-stats",
        agent,
      })
      expect(result.success).toBe(false)
    }
  })

  it("should apply defaults", () => {
    const result = ExecuteSlashCommandSchema.safeParse({
      command: "gsd-stats",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.arguments).toBe("")
      expect(result.data.subtask).toBe(false)
      expect(result.data.commandSource).toBe("user")
      expect(result.data.trackExecution).toBe(true)
    }
  })
})
