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

  it("dispatches synthetic prompt successfully", async () => {
    vi.useFakeTimers()
    const result = await dispatchCommand({
      client: mockClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "run gsd-stats",
    })
    expect(result.success).toBe(true)

    vi.advanceTimersByTime(50)
    expect(mockClient.session.prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: "ses-123" },
        body: expect.objectContaining({
          agent: "gsd-executor",
          parts: [{ type: "text", text: "run gsd-stats" }],
        }),
      })
    )
    vi.useRealTimers()
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
