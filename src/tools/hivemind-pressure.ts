import { tool } from "@opencode-ai/plugin/tool"

import { eventTrajectory } from "../lib/trajectory/index.js"
import {
  classifyRuntimePressure,
  detectRuntimePressure,
  inspectToolAuthorityCatalog,
} from "../lib/runtime-pressure/index.js"
import {
  parseRuntimePressureToolInput,
  RuntimePressureToolInputSchema,
  type RuntimePressureToolInput,
} from "../schema-kernel/runtime-pressure.schema.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the Hivemind runtime pressure tool.
 *
 * @param projectRoot - Trusted project root whose trajectory ledger may receive pressure evidence.
 * @returns OpenCode tool exposing classify, detect, inspect_tool_catalog, and attach_event actions.
 *
 * @example
 * ```typescript
 * const hivemindPressure = createHivemindPressureTool(process.cwd())
 * ```
 */
export function createHivemindPressureTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Classify runtime pressure, detect pure control-plane outcomes, inspect tool authority, and attach pressure evidence to trajectory only.",
    args: {
      action: s.string().describe("Action: classify, detect, inspect_tool_catalog, or attach_event"),
      score: s.number().optional().describe("Numeric pressure score clamped into tier 0-9"),
      tier: s.number().optional().describe("Direct pressure tier clamped into 0-9"),
      toolName: s.string().optional().describe("Registered tool name for detect decisions"),
      trajectoryId: s.string().optional().describe("Phase 56 trajectory ID for attach_event"),
      rootSessionId: s.string().optional().describe("Root session ID when creating a trajectory event target"),
      sessionId: s.string().optional().describe("Concrete session ID represented by the trajectory"),
      parentTrajectoryId: s.string().optional().describe("Parent trajectory ID when attaching lineage evidence"),
      eventId: s.string().optional().describe("Stable pressure event ID"),
      summary: s.string().optional().describe("Bounded pressure event summary"),
      evidenceRef: s.string().optional().describe("Single pressure evidence reference"),
      evidenceRefs: s.array(s.string()).optional().describe("Additional pressure evidence references"),
    },
    async execute(rawArgs: RuntimePressureToolInput, _context: ToolContext): Promise<string> {
      try {
        const args = parseRuntimePressureToolInput(rawArgs)
        return renderToolResult(success(`Runtime pressure ${args.action} action completed`, executeRuntimePressureToolAction(projectRoot, args)))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * Execute a validated runtime-pressure tool action.
 *
 * @param projectRoot - Trusted project root.
 * @param args - Validated runtime-pressure arguments.
 * @returns Serializable action result.
 */
export function executeRuntimePressureToolAction(projectRoot: string, args: RuntimePressureToolInput): unknown {
  switch (args.action) {
    case "classify":
      return classifyRuntimePressure(args)
    case "detect":
      return detectRuntimePressure(args)
    case "inspect_tool_catalog":
      return { tools: inspectToolAuthorityCatalog() }
    case "attach_event": {
      const decision = detectRuntimePressure(args)
      return eventTrajectory({
        projectRoot,
        trajectoryId: args.trajectoryId as string,
        rootSessionId: args.rootSessionId,
        sessionId: args.sessionId,
        parentTrajectoryId: args.parentTrajectoryId,
        eventId: args.eventId,
        eventType: "runtime-pressure",
        summary: `${args.summary as string} — tier ${decision.tier}/${decision.band}/${decision.outcome}`,
        evidenceRef: args.evidenceRef,
        evidenceRefs: args.evidenceRefs,
      })
    }
  }
}

export { RuntimePressureToolInputSchema }
