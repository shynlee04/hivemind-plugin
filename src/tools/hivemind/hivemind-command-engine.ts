import { tool } from "@opencode-ai/plugin/tool"

import { executeCommandEngineAction } from "../../routing/command-engine/index.js"
import {
  CommandEngineToolInputSchema,
  type CommandEngineToolInput,
} from "../../schema-kernel/command-engine.schema.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the command-engine tool (CQRS read-side).
 *
 * Provides discovery, contract analysis, context rendering, transforms,
 * route previews, and command listing for OpenCode slash commands.
 * This is the read-side companion to `execute-slash-command` (write-side).
 *
 * @param projectRoot - Trusted project root used for command discovery.
 * @returns OpenCode tool exposing discovery, contracts, context rendering, transforms, route previews, and command listing.
 *
 * @see src/tools/session/execute-slash-command.ts — write-side companion (deterministic SDK dispatch)
 */
export function createHivemindCommandEngineTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Discover command bundles, analyze contracts, render bounded context, transform messages narrowly, " +
      "preview routes without execution, and list available commands. " +
      "This is the read-side of command management — use `execute-slash-command` to actually dispatch a command.",
    args: {
      action: s.string().describe("Action: discover, analyze_contract, render_context, transform_messages, route_preview, or list_commands"),
      commandName: s.string().optional().describe("Command name for command-specific actions"),
      arguments: s.string().optional().describe("Command arguments used only for preview/message transform"),
      context: s.any().optional().describe("Serializable bounded context payload"),
      messages: s.array(s.object({ role: s.string(), content: s.string() })).optional().describe("Messages for narrow command transform"),
      maxCharacters: s.number().optional().describe("Maximum rendered context characters"),
      score: s.number().optional().describe("Runtime pressure score"),
      tier: s.number().optional().describe("Runtime pressure tier"),
    },
    async execute(rawArgs: CommandEngineToolInput, _context: ToolContext): Promise<string> {
      try {
        const result = await executeCommandEngineToolAction(projectRoot, rawArgs)
        return renderToolResult(success("Command engine action completed", result))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * Execute a validated command-engine tool action.
 *
 * @param projectRoot - Trusted project root.
 * @param rawArgs - Untrusted tool input.
 * @returns Command-engine action result.
 */
export async function executeCommandEngineToolAction(projectRoot: string, rawArgs: unknown): ReturnType<typeof executeCommandEngineAction> {
  const args = CommandEngineToolInputSchema.parse(rawArgs)
  return executeCommandEngineAction(projectRoot, args)
}

export { CommandEngineToolInputSchema }
