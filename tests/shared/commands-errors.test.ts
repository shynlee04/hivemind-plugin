import { describe, it, expect } from "vitest"
import {
  CommandNotFoundError,
  AgentNotFoundError,
  DelegationTimeoutError,
  InvalidCommandError,
  DelegationContextError,
} from "../../src/shared/errors/commands.js"

describe("Command typed error classes", () => {
  it("CommandNotFoundError should extend Error with correct name and message", () => {
    const error = new CommandNotFoundError("Custom msg")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("CommandNotFoundError")
    expect(error.message).toBe("Custom msg")

    const defaultError = new CommandNotFoundError()
    expect(defaultError.message).toBe("Command not found")
  })

  it("AgentNotFoundError should extend Error with correct name and message", () => {
    const error = new AgentNotFoundError("Custom msg")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("AgentNotFoundError")
    expect(error.message).toBe("Custom msg")

    const defaultError = new AgentNotFoundError()
    expect(defaultError.message).toBe("Agent not found")
  })

  it("DelegationTimeoutError should extend Error with correct name and message", () => {
    const error = new DelegationTimeoutError("Custom msg")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("DelegationTimeoutError")
    expect(error.message).toBe("Custom msg")

    const defaultError = new DelegationTimeoutError()
    expect(defaultError.message).toBe("Delegation timeout")
  })

  it("InvalidCommandError should extend Error with correct name and message", () => {
    const error = new InvalidCommandError("Custom msg")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("InvalidCommandError")
    expect(error.message).toBe("Custom msg")

    const defaultError = new InvalidCommandError()
    expect(defaultError.message).toBe("Invalid command")
  })

  it("DelegationContextError should extend Error with correct name and message", () => {
    const error = new DelegationContextError("Custom msg")
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("DelegationContextError")
    expect(error.message).toBe("Custom msg")

    const defaultError = new DelegationContextError()
    expect(defaultError.message).toBe("Delegation context error")
  })
})
