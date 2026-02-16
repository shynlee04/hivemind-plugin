import { createHivemindInspectTool } from "../tools/hivemind-inspect.js"

export type ScanAction = "status" | "analyze" | "recommend" | "orchestrate"

export interface ScanCommandOptions {
  action?: ScanAction
  json?: boolean
  includeDrift?: boolean
}

export async function runScanCommand(
  directory: string,
  options: ScanCommandOptions = {}
): Promise<string> {
  // Map legacy actions to canonical hivemind_inspect actions
  const actionMap: Record<ScanAction, "scan" | "deep" | "drift"> = {
    status: "scan",
    analyze: "deep",
    recommend: "scan",
    orchestrate: "scan",
  }

  const action = actionMap[options.action ?? "analyze"]
  const tool = createHivemindInspectTool(directory)

  // CLI execution path is outside OpenCode runtime, so there is no real ToolContext.
  // The inspect tool implementation does not rely on context fields.
  const executeTool = tool.execute as (
    args: Record<string, unknown>,
    context: unknown
  ) => Promise<string>

  const output = await executeTool({
    action,
    json: options.json ?? false,
  }, null)

  return output
}
