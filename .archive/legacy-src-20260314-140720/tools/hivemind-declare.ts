import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import type { BrainState } from "../schemas/brain-state.js"

export type AgentRole = "MAIN" | "SUB"
export type AgentMode = "coordinator" | "executor" | "researcher"
export type ContextLevel = 1 | 2 | 3 | 4

export interface AgentDeclaration {
  role: {
    type: AgentRole
    agentName: string
    hierarchy: string
    projectContext: "project" | "meta-framework"
  }
  mode: {
    coordinator: boolean
    executor: boolean
    researcher: boolean
  }
  context: {
    turnsInSession: number
    qualityLevel: ContextLevel
    sotsValidated: string[]
    gapsIdentified: string[]
    compactTriggered: boolean
  }
  confidence: {
    instructionsClear: boolean
    lineageValid: boolean
    sotsConnected: boolean
    readyToProceed: boolean
  }
  intent: {
    focus: string
    classification: "project-related" | "not-project-related"
    orientation: "execution" | "discovery-research"
  }
}

export function createHivemindDeclareTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Agent declaration for context awareness. " +
      "Declares role, mode, context state, and confidence before action. " +
      "Use at turn start to establish session clarity.",
    args: {
      agent_name: tool.schema.string().describe("Current agent name (e.g., 'hiveminder', 'hivemaker')"),
      agent_role: tool.schema.enum(["MAIN", "SUB"]).describe("MAIN for orchestrators, SUB for executors"),
      hierarchy_chain: tool.schema.string().optional().describe("Lineage chain (e.g., 'hiveminder > hiveplanner > hivemaker')"),
      project_context: tool.schema.enum(["project", "meta-framework"]).optional().describe("Working on project or meta-framework"),
      active_modes: tool.schema.array(tool.schema.enum(["coordinator", "executor", "researcher"])).optional().describe("Active behavioral modes"),
      focus: tool.schema.string().describe("Current focus/intent (1-2 sentences)"),
      classification: tool.schema.enum(["project-related", "not-project-related"]).optional().describe("Is this project work?"),
      orientation: tool.schema.enum(["execution", "discovery-research"]).optional().describe("Execution or research oriented?"),
      sots_validated: tool.schema.array(tool.schema.string()).optional().describe("SOT files validated this turn"),
      gaps_identified: tool.schema.array(tool.schema.string()).optional().describe("Context gaps found"),
      instructions_clear: tool.schema.boolean().optional().describe("Are instructions clear?"),
      lineage_valid: tool.schema.boolean().optional().describe("Is lineage/chain intact?"),
      sots_connected: tool.schema.boolean().optional().describe("Are SOTs cross-connected?"),
      ready_to_proceed: tool.schema.boolean().optional().describe("Ready to execute?"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory)
      const state = await stateManager.load()

      if (!state) {
        return toErrorOutput("No active session. Call declare_intent first.")
      }

      const turnCount = state.metrics.turn_count
      const qualityLevel = calculateContextLevel(turnCount)

      const declaration: AgentDeclaration = {
        role: {
          type: args.agent_role,
          agentName: args.agent_name,
          hierarchy: args.hierarchy_chain || args.agent_name,
          projectContext: args.project_context || "project",
        },
        mode: {
          coordinator: args.active_modes?.includes("coordinator") ?? false,
          executor: args.active_modes?.includes("executor") ?? false,
          researcher: args.active_modes?.includes("researcher") ?? false,
        },
        context: {
          turnsInSession: turnCount,
          qualityLevel,
          sotsValidated: args.sots_validated || [],
          gapsIdentified: args.gaps_identified || [],
          compactTriggered: state.memory_governance?.pending_purge ?? false,
        },
        confidence: {
          instructionsClear: args.instructions_clear ?? true,
          lineageValid: args.lineage_valid ?? true,
          sotsConnected: args.sots_connected ?? true,
          readyToProceed: args.ready_to_proceed ?? true,
        },
        intent: {
          focus: args.focus,
          classification: args.classification || "project-related",
          orientation: args.orientation || "execution",
        },
      }

      const output = renderDeclaration(declaration, state)
      const shouldHalt = shouldHaltExecution(declaration)
      const updatedState: BrainState = {
        ...state,
        session: {
          ...state.session,
          role: args.agent_name.trim().toLowerCase(),
          kind: args.agent_role === "MAIN" ? "main" : "sub",
          lineage_scope: args.project_context || "project",
          role_source: "declare",
          last_activity: Date.now(),
        },
      }
      await stateManager.save(updatedState)

      return toSuccessOutput(
        shouldHalt 
          ? "DECLARATION RECORDED — HALT REQUIRED" 
          : "DECLARATION RECORDED",
        updatedState.session.id,
        {
          declaration,
          output,
          persistedRole: updatedState.session.role,
          persistedKind: updatedState.session.kind,
          persistedLineageScope: updatedState.session.lineage_scope,
          roleSource: updatedState.session.role_source,
          shouldHalt,
          haltReason: shouldHalt ? getHaltReason(declaration) : null,
        }
      )
    },
  })
}

function calculateContextLevel(turnCount: number): ContextLevel {
  if (turnCount >= 5) return 4
  if (turnCount === 4) return 3
  if (turnCount >= 2) return 2
  return 1
}

function shouldHaltExecution(declaration: AgentDeclaration): boolean {
  // Level 4 always halts
  if (declaration.context.qualityLevel === 4) return true
  
  // Level 3 halts for MAIN agents
  if (declaration.context.qualityLevel === 3 && declaration.role.type === "MAIN") return true
  
  // Any confidence failure halts
  const confidenceOk = 
    declaration.confidence.instructionsClear &&
    declaration.confidence.lineageValid &&
    declaration.confidence.readyToProceed
  
  return !confidenceOk
}

function getHaltReason(declaration: AgentDeclaration): string {
  if (declaration.context.qualityLevel === 4) {
    return "Context level 4: Mandatory stop for session handoff"
  }
  if (declaration.context.qualityLevel === 3 && declaration.role.type === "MAIN") {
    return "Context level 3: MAIN agent must seek explicit confirmation"
  }
  if (!declaration.confidence.instructionsClear) {
    return "Instructions unclear: Collect context before proceeding"
  }
  if (!declaration.confidence.lineageValid) {
    return "Lineage broken: Verify hierarchy chain"
  }
  if (!declaration.confidence.readyToProceed) {
    return "Not ready: Resolve gaps before execution"
  }
  return "Unknown halt condition"
}

function renderDeclaration(declaration: AgentDeclaration, state: BrainState): string {
  const levelEmoji = ["", "⚠️", "⚠️⚠️", "⚠️⚠️⚠️", "🛑"][declaration.context.qualityLevel]
  const levelLabel = ["", "MILD", "URGENT", "CRITICAL", "EMERGENCY"][declaration.context.qualityLevel]
  
  const modes = []
  if (declaration.mode.coordinator) modes.push("COORDINATOR")
  if (declaration.mode.executor) modes.push("EXECUTOR")
  if (declaration.mode.researcher) modes.push("RESEARCHER")
  
  const confidence = [
    declaration.confidence.instructionsClear ? "✓" : "✗",
    declaration.confidence.lineageValid ? "✓" : "✗",
    declaration.confidence.sotsConnected ? "✓" : "✗",
    declaration.confidence.readyToProceed ? "✓" : "✗",
  ]
  
  const lines = [
    `# AGENT DECLARATION`,
    ``,
    `**Role**: ${declaration.role.type} — ${declaration.role.agentName}`,
    `**Hierarchy**: ${declaration.role.hierarchy}`,
    `**Mode**: ${modes.join(" + ") || "NONE"}`,
    `**Context Level**: ${declaration.context.qualityLevel}/4 ${levelEmoji} ${levelLabel}`,
    ``,
    `**Confidence Check**:`,
    `- [${confidence[0]}] Instructions clear`,
    `- [${confidence[1]}] Lineage valid`,
    `- [${confidence[2]}] SOTs connected`,
    `- [${confidence[3]}] Ready to proceed`,
    ``,
    `**Intent**:`,
    `- Focus: ${declaration.intent.focus}`,
    `- Classification: ${declaration.intent.classification}`,
    `- Orientation: ${declaration.intent.orientation}`,
    ``,
    `**State**:`,
    `- Turns: ${declaration.context.turnsInSession}`,
    `- SOTs Validated: ${declaration.context.sotsValidated.length}`,
    `- Gaps: ${declaration.context.gapsIdentified.length || "None identified"}`,
    `- Compact Pending: ${declaration.context.compactTriggered ? "YES" : "No"}`,
  ]
  
  if (shouldHaltExecution(declaration)) {
    lines.push("")
    lines.push("---")
    lines.push(`**HALT REQUIRED**: ${getHaltReason(declaration)}`)
    
    if (declaration.context.qualityLevel === 4) {
      lines.push("")
      lines.push("**HANDOFF PROMPT** (copy to new session):")
      lines.push("```")
      lines.push(`Project: ${declaration.role.projectContext}`)
      lines.push(`Last Focus: ${declaration.intent.focus}`)
      lines.push(`Session ID: ${state.session.id}`)
      lines.push(`Why Stopped: Context level ${declaration.context.qualityLevel} at turn ${declaration.context.turnsInSession}`)
      lines.push(`Gaps: ${declaration.context.gapsIdentified.join(", ") || "None listed"}`)
      lines.push("```")
    }
  }
  
  return lines.join("\n")
}
