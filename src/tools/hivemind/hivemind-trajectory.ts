import { tool } from "@opencode-ai/plugin/tool"

import {
  attachTrajectoryEvidence,
  checkpointTrajectory,
  closeTrajectory,
  eventTrajectory,
  inspectTrajectoryLedger,
  traverseTrajectory,
} from "../../task-management/trajectory/index.js"
import { parseTrajectoryToolInput, TrajectoryToolInputSchema, type TrajectoryToolInput } from "../../schema-kernel/trajectory.schema.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the trajectory ledger tool.
 *
 * @param projectRoot - Trusted project root whose `.hivemind/state/trajectory-ledger.json` is used.
 * @returns OpenCode tool instance exposing inspect, traverse, attach, checkpoint, event, and close actions.
 *
 * @example
 * ```typescript
 * const hivemindTrajectory = createHivemindTrajectoryTool(process.cwd())
 * ```
 */
export function createHivemindTrajectoryTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Inspect and update the Hivemind trajectory ledger without mutating continuity, delegation, journal, or document evidence authorities.",
    args: {
      action: s.string().describe("Action: inspect, traverse, attach, checkpoint, event, or close"),
      trajectoryId: s.string().optional().describe("Trajectory ID to inspect, traverse, attach, checkpoint, event, or close"),
      rootSessionId: s.string().optional().describe("Root session ID for traversal or trajectory creation"),
      sessionId: s.string().optional().describe("Concrete session ID represented by the trajectory"),
      parentTrajectoryId: s.string().optional().describe("Parent trajectory ID for lineage traversal"),
      checkpointId: s.string().optional().describe("Stable checkpoint ID"),
      eventId: s.string().optional().describe("Stable event ID"),
      eventType: s.string().optional().describe("Event type for the event action"),
      summary: s.string().optional().describe("Bounded human-readable summary"),
      evidenceRef: s.string().optional().describe("Single evidence reference"),
      evidenceRefs: s.array(s.string()).optional().describe("Evidence references to journal, delegation, continuity, or doc artifacts"),
    },
    async execute(rawArgs: TrajectoryToolInput, _context: ToolContext): Promise<string> {
      try {
        const args = parseTrajectoryToolInput(rawArgs)
        const data = executeTrajectoryToolAction(projectRoot, args)
        return renderToolResult(success(`Trajectory ${args.action} action completed`, data))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * Execute a validated trajectory tool action.
 *
 * @param projectRoot - Trusted project root.
 * @param args - Validated trajectory action input.
 * @returns Serializable action result.
 */
export function executeTrajectoryToolAction(projectRoot: string, args: TrajectoryToolInput): unknown {
  switch (args.action) {
    case "inspect":
      return inspectTrajectoryLedger({ projectRoot, trajectoryId: args.trajectoryId })
    case "traverse":
      return traverseTrajectory({ projectRoot, rootSessionId: args.rootSessionId, sessionId: args.sessionId, trajectoryId: args.trajectoryId })
    case "attach":
      return attachTrajectoryEvidence({
        projectRoot,
        trajectoryId: args.trajectoryId as string,
        rootSessionId: args.rootSessionId,
        sessionId: args.sessionId,
        parentTrajectoryId: args.parentTrajectoryId,
        evidenceRef: args.evidenceRef,
        evidenceRefs: args.evidenceRefs,
      })
    case "checkpoint":
      return checkpointTrajectory({
        projectRoot,
        trajectoryId: args.trajectoryId as string,
        rootSessionId: args.rootSessionId,
        sessionId: args.sessionId,
        parentTrajectoryId: args.parentTrajectoryId,
        checkpointId: args.checkpointId,
        summary: args.summary as string,
        evidenceRef: args.evidenceRef,
        evidenceRefs: args.evidenceRefs,
      })
    case "event":
      return eventTrajectory({
        projectRoot,
        trajectoryId: args.trajectoryId as string,
        rootSessionId: args.rootSessionId,
        sessionId: args.sessionId,
        parentTrajectoryId: args.parentTrajectoryId,
        eventId: args.eventId,
        eventType: args.eventType as string,
        summary: args.summary as string,
        evidenceRef: args.evidenceRef,
        evidenceRefs: args.evidenceRefs,
      })
    case "close":
      return closeTrajectory({ projectRoot, trajectoryId: args.trajectoryId as string, summary: args.summary })
  }
}

export { TrajectoryToolInputSchema }
