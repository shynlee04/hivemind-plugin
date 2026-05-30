export class CommandNotFoundError extends Error {
  readonly name = "CommandNotFoundError" as const
  constructor(message?: string) {
    super(message ?? "Command not found")
  }
}

export class AgentNotFoundError extends Error {
  readonly name = "AgentNotFoundError" as const
  constructor(message?: string) {
    super(message ?? "Agent not found")
  }
}

export class DelegationTimeoutError extends Error {
  readonly name = "DelegationTimeoutError" as const
  constructor(message?: string) {
    super(message ?? "Delegation timeout")
  }
}

export class InvalidCommandError extends Error {
  readonly name = "InvalidCommandError" as const
  constructor(message?: string) {
    super(message ?? "Invalid command")
  }
}

export class DelegationContextError extends Error {
  readonly name = "DelegationContextError" as const
  constructor(message?: string) {
    super(message ?? "Delegation context error")
  }
}
