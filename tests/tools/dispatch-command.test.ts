import { describe, expect, it, vi } from "vitest"
import {
  validateAgentFormat,
  validateAgentExists,
  dispatchCommand
} from "../../src/tools/session/dispatch-command.js"
import { InvalidCommandError, AgentNotFoundError } from "../../src/shared/errors/commands.js"

describe("dispatch-command", () => {
  const mockClient = {
    app: {
      agents: vi.fn().mockResolvedValue({
        agents: [
          { id: "gsd-executor", description: "Executes plans" },
          { id: "gsd-reviewer", description: "Reviews code" },
        ],
      }),
    },
    session: {
      prompt: vi.fn().mockResolvedValue({}),
      command: vi.fn().mockResolvedValue({}),
    },
  }

  it("validates agent format correctly", () => {
    expect(validateAgentFormat("gsd-executor")).toBe(true)
    expect(validateAgentFormat("Agent-123")).toBe(false)
    expect(validateAgentFormat("gsd_executor")).toBe(false)
    expect(validateAgentFormat("1gsd")).toBe(false)
  })

  it("validates agent existence correctly", async () => {
    expect(await validateAgentExists("gsd-executor", mockClient)).toBe(true)
    expect(await validateAgentExists("fake-agent", mockClient)).toBe(false)
  })

  it("dispatches synthetic prompt with agent override via session.prompt()", async () => {
    const result = await dispatchCommand({
      client: mockClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "run gsd-stats",
    })
    expect(result.success).toBe(true)
    // Wait for deferred setTimeout(fn, 50) dispatch to fire
    await new Promise<void>((resolve) => setTimeout(resolve, 60))
    expect(mockClient.session.prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: "ses-123" },
        body: expect.objectContaining({
          agent: "gsd-executor",
          parts: [{ type: "text", text: "run gsd-stats" }],
        }),
      })
    )
  })

  it("returns failure when session.prompt throws error", async () => {
    const errorClient = {
      app: { agents: vi.fn().mockResolvedValue({ agents: [{ id: "gsd-executor" }] }) },
      session: {
        prompt: vi.fn().mockRejectedValue(new Error("Network error")),
        command: vi.fn().mockRejectedValue(new Error("Network error")),
      },
    }
    const result = await dispatchCommand({
      client: errorClient as any,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "gsd-stats body",
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe(true)
    expect(result.output).toBe("Network error")
  })

  it("returns failure when agent restore fails", async () => {
    const restoreErrorClient = {
      app: { agents: vi.fn().mockResolvedValue({ agents: [{ id: "gsd-executor" }] }) },
      session: {
        prompt: vi.fn()
          .mockResolvedValueOnce({}) // first prompt (synthetic prompt) succeeds
          .mockRejectedValueOnce(new Error("Restore failed")), // restore fails
        command: vi.fn().mockResolvedValue({}),
      },
    }
    const result = await dispatchCommand({
      client: restoreErrorClient as any,
      sessionID: "ses-123",
      agent: "gsd-executor",
      restoreAgent: "gsd-reviewer",
      promptText: "run gsd-stats",
    })
    expect(result.success).toBe(false)
    expect(result.error).toBe(true)
    expect(result.output).toContain("agent restore failed: Restore failed")
  })

  it("validateAgentExists returns false on API failure", async () => {
    const brokenClient = {
      app: {
        agents: vi.fn().mockRejectedValue(new Error("API failure")),
      },
    }
    const result = await validateAgentExists("gsd-executor", brokenClient as any)
    expect(result).toBe(false)
  })

  it("throws InvalidCommandError for invalid agent format in dispatch", async () => {
    await expect(
      dispatchCommand({
        client: mockClient,
        sessionID: "ses-123",
        agent: "Agent-123",
        promptText: "run gsd-stats",
      })
    ).rejects.toThrow(InvalidCommandError)
  })

  it("throws AgentNotFoundError for non-existent agent in dispatch", async () => {
    await expect(
      dispatchCommand({
        client: mockClient,
        sessionID: "ses-123",
        agent: "fake-agent",
        promptText: "run gsd-stats",
      })
    ).rejects.toThrow(AgentNotFoundError)
  })
})
