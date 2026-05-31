import { describe, expect, it, vi, afterEach } from "vitest"
import {
  validateAgentFormat,
  validateAgentExists,
  dispatchCommand
} from "../../src/tools/session/dispatch-command.js"
import { InvalidCommandError, AgentNotFoundError } from "../../src/shared/errors/commands.js"

describe("dispatch-command", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

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

  it("validateAgentExists returns false when API call throws", async () => {
    const failClient = {
      app: { agents: vi.fn().mockRejectedValue(new Error("API unreachable")) },
    }
    const result = await validateAgentExists("gsd-executor", failClient)
    expect(result).toBe(false)
  })

  it("dispatches synthetic prompt with agent override via session.prompt()", async () => {
    vi.useFakeTimers()
    mockClient.session.prompt.mockClear()
    const result = await dispatchCommand({
      client: mockClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "run gsd-stats",
    })
    expect(result.success).toBe(true)
    await vi.advanceTimersByTimeAsync(50)
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

  it("resolves with { success: true } after successful SDK call via deferred promise", async () => {
    vi.useFakeTimers()
    const successClient = {
      app: { agents: vi.fn().mockResolvedValue({ agents: [{ id: "gsd-executor" }] }) },
      session: {
        prompt: vi.fn().mockResolvedValue({}),
        command: vi.fn().mockResolvedValue({}),
      },
    }
    const result = await dispatchCommand({
      client: successClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "test",
    })
    expect(result.success).toBe(true)
    await vi.advanceTimersByTimeAsync(50)
    expect(successClient.session.prompt).toHaveBeenCalled()
  })

  it("resolves with { success: true } and logs SDK error via deferred promise", async () => {
    vi.useFakeTimers()
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const errorClient = {
      app: { agents: vi.fn().mockResolvedValue({ agents: [{ id: "gsd-executor" }] }) },
      session: {
        prompt: vi.fn().mockRejectedValue(new Error("Network error")),
        command: vi.fn().mockRejectedValue(new Error("Network error")),
      },
    }
    const result = await dispatchCommand({
      client: errorClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "test",
    })
    expect(result.success).toBe(true)
    await vi.advanceTimersByTimeAsync(50)
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Network error"))
    consoleErrorSpy.mockRestore()
  })

  it("resolves with { success: true } and logs failure when agent restore fails", async () => {
    vi.useFakeTimers()
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    let callCount = 0
    const partialFailClient = {
      app: { agents: vi.fn().mockResolvedValue({ agents: [{ id: "gsd-executor" }] }) },
      session: {
        prompt: vi.fn().mockImplementation(() => {
          callCount++
          if (callCount === 1) return Promise.resolve({}) // First prompt succeeds
          return Promise.reject(new Error("Restore failed")) // Restore fails
        }),
        command: vi.fn().mockResolvedValue({}),
      },
    }
    const result = await dispatchCommand({
      client: partialFailClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      restoreAgent: "original-agent",
      promptText: "test",
    })
    expect(result.success).toBe(true)
    await vi.advanceTimersByTimeAsync(50)
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Agent restore failed"))
    consoleErrorSpy.mockRestore()
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

  it("requires vi.advanceTimersByTime to resolve — confirms 50ms deadlock prevention is preserved", async () => {
    vi.useFakeTimers()
    const successClient = {
      app: { agents: vi.fn().mockResolvedValue({ agents: [{ id: "gsd-executor" }] }) },
      session: {
        prompt: vi.fn().mockResolvedValue({}),
        command: vi.fn().mockResolvedValue({}),
      },
    }
    const promise = dispatchCommand({
      client: successClient,
      sessionID: "ses-123",
      agent: "gsd-executor",
      promptText: "test",
    })
    // Without advancing timers, the promise should NOT be settled yet
    // Use Promise.race to verify it's still pending
    const pending = Symbol("pending")
    const raceResult = await Promise.race([
      promise.then(() => "resolved"),
      Promise.resolve(pending),
    ])
    expect(raceResult).toBe(pending)

    // Now advance timers — it should resolve
    await vi.advanceTimersByTimeAsync(50)
    const result = await promise
    expect(result.success).toBe(true)
  })
})
