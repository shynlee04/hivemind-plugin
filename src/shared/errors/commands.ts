import { HarnessError } from "./harness-error.js"

export class CommandNotFoundError extends HarnessError {
  readonly name = "CommandNotFoundError" as const
  constructor(message?: string) {
    super("C8", "errors", message ?? "Command not found", "COMMAND_NOT_FOUND")
  }
}

export class AgentNotFoundError extends HarnessError {
  readonly name = "AgentNotFoundError" as const
  constructor(message?: string) {
    super("C8", "errors", message ?? "Agent not found", "AGENT_NOT_FOUND")
  }
}

export class DelegationTimeoutError extends HarnessError {
  readonly name = "DelegationTimeoutError" as const
  constructor(message?: string) {
    super("C8", "errors", message ?? "Delegation timeout", "DELEGATION_TIMEOUT")
  }
}

export class InvalidCommandError extends HarnessError {
  readonly name = "InvalidCommandError" as const
  constructor(message?: string) {
    super("C8", "errors", message ?? "Invalid command", "INVALID_COMMAND")
  }
}

export class DelegationContextError extends HarnessError {
  readonly name = "DelegationContextError" as const
  constructor(message?: string) {
    super("C8", "errors", message ?? "Delegation context error", "DELEGATION_CONTEXT_ERROR")
  }
}
