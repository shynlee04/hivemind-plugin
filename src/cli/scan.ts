import { createScanHierarchyTool } from "../tools/scan-hierarchy.js"

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
  const action = options.action ?? "analyze"
  const tool = createScanHierarchyTool(directory)

  // CLI execution path is outside OpenCode runtime, so there is no real ToolContext.
  // The scan tool implementation does not rely on context fields.
  const executeTool = tool.execute as (
    args: Record<string, unknown>,
    context: unknown
  ) => Promise<string>

  const output = await executeTool({
    action,
    json: options.json ?? false,
    include_drift: options.includeDrift ?? false,
  }, null)

  return output
}
