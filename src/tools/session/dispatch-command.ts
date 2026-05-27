import { getAppAgents } from "../../shared/app-api.js"
import { InvalidCommandError, AgentNotFoundError } from "../../shared/errors/commands.js"

const DEFERRED_SUBTASK_DISPATCH_DELAY_MS = 50

/**
 * Validates agent name format: lowercase alphanumeric + hyphens.
 */
export function validateAgentFormat(agent: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(agent)
}

/**
 * Validates agent existence in OpenCode agent registry.
 */
export async function validateAgentExists(agent: string, client: any): Promise<boolean> {
  if (!client || typeof client.app?.agents !== "function") {
    return true // Fallback if SDK app agent discovery is missing or mock
  }
  try {
    const appAgents = await getAppAgents(client)
    const agentNames = appAgents.map((a: any) =>
      typeof a === "string" ? a : (a && typeof a.id === "string" ? a.id : (a && typeof a.name === "string" ? a.name : ""))
    )
    return agentNames.includes(agent)
  } catch (err) {
    return true // Fallback if API fails
  }
}

/**
 * Dispatches slash command prompt after a 50ms delay.
 * Performs format and existence validation for optional agent override.
 */
export async function dispatchCommand(context: {
  client: any
  sessionID: string
  agent?: string
  promptText: string
  subtask?: boolean
  description?: string
  commandSource?: string
  directory?: string
}): Promise<{ success: boolean; output?: string; error?: boolean }> {
  const { client, sessionID, agent, promptText, subtask, description, commandSource, directory } = context

  if (agent) {
    if (!validateAgentFormat(agent)) {
      throw new InvalidCommandError(`Invalid agent name format: ${agent}`)
    }
    const exists = await validateAgentExists(agent, client)
    if (!exists) {
      throw new AgentNotFoundError(`Agent not found: ${agent}`)
    }
  }

  // Build the prompt request parts depending on whether it's subtask or text
  const parts: any[] = []
  if (subtask) {
    parts.push({
      type: "subtask",
      agent,
      description: description || "",
      prompt: promptText,
      parentSessionID: sessionID,
      commandSource: commandSource || "user",
    })
  } else {
    parts.push({
      type: "text",
      text: promptText,
    })
  }

  const request: any = {
    path: { id: sessionID },
    body: {
      parts,
    },
    query: { directory },
  }

  if (agent && !subtask) {
    request.body.agent = agent
  } else if (subtask) {
    request.body.agent = agent
  }

  // Deferred dispatch
  setTimeout(() => {
    client.session.prompt(request).catch((caughtError: unknown) => {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
      console.error(`[Harness] Deferred slash command prompt dispatch failed: ${message}`)
    })
  }, DEFERRED_SUBTASK_DISPATCH_DELAY_MS)

  return { success: true }
}
