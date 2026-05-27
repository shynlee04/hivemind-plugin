import { getAppAgents } from "../../shared/app-api.js"
import { InvalidCommandError, AgentNotFoundError } from "../../shared/errors/commands.js"
import type { OpenCodeClient } from "../../shared/session-api.js"

/**
 * Validates agent name format: lowercase alphanumeric + hyphens.
 */
export function validateAgentFormat(agent: string): boolean {
  return /^[a-z][a-z0-9-]*$/.test(agent)
}

/**
 * Validates agent existence in OpenCode agent registry.
 */
export async function validateAgentExists(agent: string, client: OpenCodeClient): Promise<boolean> {
  if (!client || typeof client.app?.agents !== "function") {
    return true // Fallback if SDK app agent discovery is missing or mock
  }
  try {
    const appAgents = await getAppAgents(client)
    const agentNames = appAgents.map((a) => {
      if (typeof a === "string") return a
      const record = a as { id?: string; name?: string }
      return record.id ?? record.name ?? ""
    })
    return agentNames.includes(agent)
  } catch {
    return true // Fallback if API fails
  }
}

/**
 * Dispatches slash command prompt immediately.
 * Performs format and existence validation for optional agent override.
 * Returns { success: true } on completion, or { success: false, error: true, output } on failure.
 */
export async function dispatchCommand(context: {
  client: OpenCodeClient
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
  const parts: Array<Record<string, unknown>> = []
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

  const body: { parts: Array<Record<string, unknown>>; agent?: string } = { parts }
  if (agent) {
    body.agent = agent
  }

  try {
    await client.session.prompt({
      path: { id: sessionID },
      body: body as Parameters<OpenCodeClient["session"]["prompt"]>[0]["body"],
      ...(directory ? { query: { directory } } : {}),
    })
    return { success: true }
  } catch (caughtError: unknown) {
    const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
    console.error(`[Harness] Slash command prompt dispatch failed: ${message}`)
    return { success: false, error: true, output: message }
  }
}
