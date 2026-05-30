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
    return false // API unreachable — do not allow dispatch with unvalidated agent
  }
}

/**
 * Dispatches slash command prompt immediately.
 * Performs format and existence validation for optional agent override.
 * Returns { success: boolean, output?, error? } on completion.
 */
export async function dispatchCommand(context: {
  client: OpenCodeClient
  sessionID: string
  agent?: string
  restoreAgent?: string
  promptText: string
  subtask?: boolean
  description?: string
  commandSource?: string
  directory?: string
}): Promise<{ success: boolean; output?: string; error?: boolean }> {
  const { client, sessionID, agent, restoreAgent, promptText, subtask, description, commandSource, directory } = context

  if (agent) {
    if (!validateAgentFormat(agent)) {
      throw new InvalidCommandError(`Invalid agent name format: ${agent}`)
    }
    const exists = await validateAgentExists(agent, client)
    if (!exists) {
      throw new AgentNotFoundError(`Agent not found: ${agent}`)
    }
  }

  // Deferred dispatch: schedule on next macrotask (setTimeout) so the tool
  // returns before session.prompt() fires on the same session — prevents
  // reentrant deadlock. The tool's execute() handler must return before the
  // session can process new input.
  return new Promise<{ success: boolean; output?: string; error?: boolean }>((resolve) => {
    setTimeout(async () => {
      try {
        if (subtask) {
          // Subtask: session.prompt() with subtask part + agent
          const parts = [{
            type: "subtask",
            agent,
            description: description || "",
            prompt: promptText,
            parentSessionID: sessionID,
            commandSource: commandSource || "user",
          }]
          const body: Record<string, unknown> = { parts }
          if (agent) body.agent = agent
          await client.session.prompt({
            path: { id: sessionID },
            body: body as Parameters<OpenCodeClient["session"]["prompt"]>[0]["body"],
            ...(directory ? { query: { directory } } : {}),
          })
        } else {
          // Synthetic prompt: session.prompt() with text part + agent override
          const parts = [{ type: "text", text: promptText }]
          const body: Record<string, unknown> = { parts }
          if (agent) body.agent = agent
          await client.session.prompt({
            path: { id: sessionID },
            body: body as Parameters<OpenCodeClient["session"]["prompt"]>[0]["body"],
            ...(directory ? { query: { directory } } : {}),
          })

          // After the target agent finishes processing, restore the original agent
          if (restoreAgent && restoreAgent !== agent) {
            try {
              await client.session.prompt({
                path: { id: sessionID },
                body: {
                  parts: [{ type: "text", text: "Continue." }],
                  agent: restoreAgent,
                } as Parameters<OpenCodeClient["session"]["prompt"]>[0]["body"],
                ...(directory ? { query: { directory } } : {}),
              })
            } catch (restoreError) {
              const msg = restoreError instanceof Error ? restoreError.message : String(restoreError)
              resolve({ success: false, output: `Dispatch succeeded but agent restore failed: ${msg}`, error: true })
              return
            }
          }
        }
        resolve({ success: true })
      } catch (caughtError: unknown) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        console.error(`[Harness] Slash command dispatch failed: ${message}`)
        resolve({ success: false, output: message, error: true })
      }
    }, 50)
  })
}
