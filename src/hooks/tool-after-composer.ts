import { asString, getNestedValue } from "../lib/helpers.js"

export type ToolAfterProjectionFact =
  | {
      kind: "tool-execute-after"
      event: {
        type: "tool.execute.after"
        properties: {
          sessionID: string
          tool: string
          status: "completed"
          resultSummary: string
        }
      }
      source: "plugin.tool.execute.after"
    }
  | { kind: "ignored" }

type ToolAfterInput = { tool: string; args?: Record<string, unknown> }
type ToolAfterOutput = { metadata?: unknown; [key: string]: unknown }

/**
 * Resolves the session identifier that can anchor tool-after response shaping.
 *
 * @param args - Tool arguments from the OpenCode hook input.
 * @returns The first supported session identifier field, when present.
 */
export function resolveToolHookSessionId(args: Record<string, unknown> | undefined): string | undefined {
  return (
    asString(getNestedValue(args, ["sessionID"])) ??
    asString(getNestedValue(args, ["sessionId"])) ??
    asString(getNestedValue(args, ["rootSessionID"])) ??
    asString(getNestedValue(args, ["rootSessionId"]))
  )
}

/**
 * Creates the composed tool-after hook for response shaping and projection facts.
 *
 * @param deps - Response-shaping dependencies only; no durable writers are accepted.
 * @returns A hook that injects guard metadata and returns projection facts.
 */
export function createToolExecuteAfterHook(deps: {
  toolGuardAfterHook: (input: ToolAfterInput & { sessionID?: string }, output: ToolAfterOutput) => Promise<void>
  summarizeOutput: (output: unknown) => string
}): (input: ToolAfterInput, output?: ToolAfterOutput | string) => Promise<ToolAfterProjectionFact> {
  return async (input, output) => {
    const sessionID = resolveToolHookSessionId(input.args)
    if (sessionID && output && typeof output === "object") {
      await deps.toolGuardAfterHook({ ...input, sessionID }, output)
    }

    if (!sessionID) {
      return { kind: "ignored" }
    }

    return {
      kind: "tool-execute-after",
      source: "plugin.tool.execute.after",
      event: {
        type: "tool.execute.after",
        properties: {
          sessionID,
          tool: input.tool,
          status: "completed",
          resultSummary: deps.summarizeOutput(output),
        },
      },
    }
  }
}
