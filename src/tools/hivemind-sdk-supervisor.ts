import { tool } from "@opencode-ai/plugin/tool"

import { executeSdkSupervisorAction } from "../lib/sdk-supervisor/index.js"
import {
  SdkSupervisorToolInputSchema,
  type SdkSupervisorToolInput,
} from "../schema-kernel/sdk-supervisor.schema.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the SDK supervisor tool.
 *
 * @returns OpenCode tool exposing health, heartbeat, diagnostics, and readiness actions.
 */
export function createHivemindSdkSupervisorTool(): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Inspect SDK wrapper health, heartbeat, bounded diagnostics, and readiness without replacing SDK wrappers.",
    args: {
      action: s.string().describe("Action: health, heartbeat, diagnostics, or readiness"),
      sessionId: s.string().optional().describe("Optional session ID for heartbeat"),
      maxDiagnostics: s.number().optional().describe("Maximum diagnostics to return"),
      score: s.number().optional().describe("Runtime pressure score"),
      tier: s.number().optional().describe("Runtime pressure tier"),
    },
    async execute(rawArgs: SdkSupervisorToolInput, _context: ToolContext): Promise<string> {
      try {
        const result = await executeSdkSupervisorToolAction(rawArgs)
        return renderToolResult(success("SDK supervisor action completed", result))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * Execute a validated SDK supervisor tool action.
 *
 * @param rawArgs - Untrusted tool input.
 * @returns SDK supervisor action result.
 */
export async function executeSdkSupervisorToolAction(rawArgs: unknown): ReturnType<typeof executeSdkSupervisorAction> {
  const args = SdkSupervisorToolInputSchema.parse(rawArgs)
  return executeSdkSupervisorAction(args)
}

export { SdkSupervisorToolInputSchema }
