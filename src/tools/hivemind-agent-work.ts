import { tool } from "@opencode-ai/plugin/tool"

import { createAgentWorkContract, exportAgentWorkContract } from "../lib/agent-work-contracts/index.js"
import {
  AgentWorkCreateToolInputSchema,
  AgentWorkExportToolInputSchema,
  parseAgentWorkCreateToolInput,
  parseAgentWorkExportToolInput,
  type AgentWorkCreateToolInput,
  type AgentWorkExportToolInput,
} from "../schema-kernel/agent-work-contract.schema.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the `hivemind-agent-work-create` OpenCode tool.
 *
 * @param projectRoot - Trusted project root where the contract store is written.
 * @returns Tool that creates pressure-aware durable work contracts.
 *
 * @example
 * ```typescript
 * const createTool = createHivemindAgentWorkCreateTool(process.cwd())
 * ```
 */
export function createHivemindAgentWorkCreateTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Create a durable, pressure-aware agent work contract without dispatching sessions or mutating delegation records.",
    args: {
      id: s.string().optional().describe("Optional stable contract ID"),
      ownerAgent: s.string().describe("Agent that owns the work contract"),
      ownerSessionId: s.string().optional().describe("Session ID that owns the work contract"),
      ownerParentSessionId: s.string().optional().describe("Parent session ID for handoff lineage"),
      taskBoundary: s.string().describe("Bounded task scope"),
      allowedSurfaces: s.array(s.string()).optional().describe("Files, folders, or surfaces the agent may touch"),
      dependencies: s.array(s.string()).optional().describe("Required upstream phase, artifact, or task dependencies"),
      nonGoals: s.array(s.string()).optional().describe("Explicit work outside this contract"),
      requiredProof: s.array(s.string()).optional().describe("Proof expected before completion"),
      minimumEvidenceLevel: s.string().describe("Minimum evidence hierarchy level"),
      verificationCommands: s.array(s.string()).optional().describe("Commands expected for verification evidence"),
      blockedStateRules: s.array(s.string()).optional().describe("Rules for reporting blocked states"),
      briefing: s.string().optional().describe("Bounded compaction briefing"),
      summary: s.string().optional().describe("Bounded compaction summary"),
      anchors: s.array(s.string()).optional().describe("Compact anchors to preserve across compaction"),
      reinjectionPayload: s.string().optional().describe("Bounded payload for resumed agent reinjection"),
      sourceRefs: s.array(s.string()).optional().describe("Source references for the contract"),
      trajectoryId: s.string().optional().describe("Optional trajectory ID to receive contract evidence"),
      pressureScore: s.number().optional().describe("Runtime pressure score for Phase 57 decisioning"),
      pressureTier: s.number().optional().describe("Runtime pressure tier for Phase 57 decisioning"),
      pressureApproved: s.boolean().optional().describe("Explicit approval for gated-pressure writes"),
    },
    async execute(rawArgs: AgentWorkCreateToolInput, _context: ToolContext): Promise<string> {
      try {
        const args = parseAgentWorkCreateToolInput(rawArgs)
        const data = executeAgentWorkCreateToolAction(projectRoot, args)
        if (data.status === "pressure-blocked") {
          return renderToolResult(error("Agent work contract create blocked by runtime pressure", data))
        }
        return renderToolResult(success("Agent work contract created", data))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * Create the `hivemind-agent-work-export` OpenCode tool.
 *
 * @param projectRoot - Trusted project root containing the contract store.
 * @returns Tool that exports contract handoff payloads.
 */
export function createHivemindAgentWorkExportTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Export an agent work contract as bounded JSON or Markdown handoff payload without mutating contract, delegation, or continuity state.",
    args: {
      contractId: s.string().describe("Agent work contract ID to export"),
      format: s.string().optional().describe("Export format: json or markdown"),
    },
    async execute(rawArgs: AgentWorkExportToolInput, _context: ToolContext): Promise<string> {
      try {
        const args = parseAgentWorkExportToolInput(rawArgs)
        return renderToolResult(success("Agent work contract exported", executeAgentWorkExportToolAction(projectRoot, args)))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * Execute the create-tool action using validated input.
 *
 * @param projectRoot - Trusted project root.
 * @param args - Validated create-tool arguments.
 * @returns Create operation result.
 */
export function executeAgentWorkCreateToolAction(projectRoot: string, args: AgentWorkCreateToolInput): ReturnType<typeof createAgentWorkContract> {
  return createAgentWorkContract({
    projectRoot,
    id: args.id,
    owner: {
      agent: args.ownerAgent,
      sessionId: args.ownerSessionId,
      parentSessionId: args.ownerParentSessionId,
    },
    scope: {
      taskBoundary: args.taskBoundary,
      allowedSurfaces: args.allowedSurfaces,
      dependencies: args.dependencies,
      nonGoals: args.nonGoals,
    },
    evidence: {
      requiredProof: args.requiredProof,
      minimumEvidenceLevel: args.minimumEvidenceLevel,
      verificationCommands: args.verificationCommands,
      blockedStateRules: args.blockedStateRules,
    },
    compaction: {
      briefing: args.briefing,
      summary: args.summary,
      anchors: args.anchors,
      reinjectionPayload: args.reinjectionPayload,
      sourceRefs: args.sourceRefs,
    },
    trajectoryId: args.trajectoryId,
    pressureScore: args.pressureScore,
    pressureTier: args.pressureTier,
    pressureApproved: args.pressureApproved,
  })
}

/**
 * Execute the export-tool action using validated input.
 *
 * @param projectRoot - Trusted project root.
 * @param args - Validated export-tool arguments.
 * @returns Export operation result.
 */
export function executeAgentWorkExportToolAction(projectRoot: string, args: AgentWorkExportToolInput): ReturnType<typeof exportAgentWorkContract> {
  return exportAgentWorkContract({ projectRoot, contractId: args.contractId, format: args.format })
}

export { AgentWorkCreateToolInputSchema, AgentWorkExportToolInputSchema }
