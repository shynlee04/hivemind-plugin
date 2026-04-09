/**
 * delegate-task tool factory.
 *
 * Creates a restricted child session for researcher, builder, or critic work
 * and optionally waits for the final assistant response.
 *
 * Extracted from plugin.ts composition root to keep that file under 100 LOC.
 */
import { tool } from "@opencode-ai/plugin/tool"
import { getSessionContinuity } from "../lib/continuity.js"
import { reserveSubagentSpawn } from "../lib/concurrency.js"
import { classifyExecutionMode, type TaskCharacteristics } from "../lib/execution-mode.js"
import { resolveSpecialistRoute } from "../lib/specialist-router.js"
import {
  buildPromptText,
  getPromptToolCompatibility,
} from "../lib/helpers.js"
import type { HarnessLifecycleManager } from "../lib/lifecycle-manager.js"
import type { OpenCodeClient } from "../lib/session-api.js"
import { getSessionID, walkParentChain } from "../lib/session-api.js"
import { addWarning, getDelegationMeta, taskState } from "../lib/state.js"
import type {
  PermissionRule,
  SessionPolicyOverride,
  SpecialistAgent,
} from "../lib/types.js"
import {
  MAX_DESCENDANTS_PER_ROOT,
  VALID_AGENTS,
} from "../lib/types.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_DEPTH = 3

const AGENT_TOOLS: Record<string, { required: string[]; mustNot: string[] }> = {
  researcher: {
    required: ["read", "glob", "grep", "webfetch"],
    mustNot: ["edit", "write", "bash", "task"],
  },
  builder: { required: ["read", "glob", "grep", "edit", "write", "bash"], mustNot: ["task"] },
  critic: { required: ["read", "glob", "grep", "bash"], mustNot: ["edit", "write", "task"] },
  general: { required: ["read", "glob", "grep"], mustNot: ["task"] },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isValidAgent(value: string): value is SpecialistAgent {
  return VALID_AGENTS.includes(value as SpecialistAgent)
}

function getPermissionRulesForAgent(agentName: SpecialistAgent): PermissionRule[] {
  const commonDelegateDeny: PermissionRule = {
    permission: "delegate-task",
    pattern: "*",
    action: "deny",
  }

  switch (agentName) {
    case "researcher":
      return [
        { permission: "edit", pattern: "*", action: "deny" },
        { permission: "write", pattern: "*", action: "deny" },
        { permission: "bash", pattern: "*", action: "deny" },
        { permission: "task", pattern: "*", action: "deny" },
        commonDelegateDeny,
      ]
    case "builder":
      return [
        { permission: "task", pattern: "*", action: "deny" },
        commonDelegateDeny,
      ]
    case "critic":
      return [
        { permission: "bash", pattern: "*", action: "allow" },
        { permission: "read", pattern: "*", action: "allow" },
        { permission: "grep", pattern: "*", action: "allow" },
        { permission: "glob", pattern: "*", action: "allow" },
        { permission: "edit", pattern: "*", action: "deny" },
        { permission: "write", pattern: "*", action: "deny" },
        { permission: "task", pattern: "*", action: "deny" },
        commonDelegateDeny,
      ]
    case "general":
      return [
        { permission: "read", pattern: "*", action: "allow" },
        { permission: "glob", pattern: "*", action: "allow" },
        { permission: "grep", pattern: "*", action: "allow" },
        { permission: "edit", pattern: "*", action: "deny" },
        { permission: "write", pattern: "*", action: "deny" },
        { permission: "bash", pattern: "*", action: "deny" },
        { permission: "task", pattern: "*", action: "deny" },
        commonDelegateDeny,
      ]
    default:
      throw new Error(`[Harness] Unsupported agent for permission profile: ${String(agentName)}`)
  }
}

function buildTaskCharacteristics(args: DelegateTaskArgs, agent: SpecialistAgent): TaskCharacteristics {
  const description = args.description.toLowerCase()
  const prompt = args.prompt.toLowerCase()
  const category = args.category?.toLowerCase() ?? ""
  const isResearch = agent === "researcher" || category === "research" || category === "deep"
  const isReview = agent === "critic" || category === "review"
  const isHeadless = isResearch || (!isReview && args.run_in_background)
  const isInteractive = !isResearch
  const isParallel = args.run_in_background || /parallel|concurrent|independent|background/.test(`${description} ${prompt}`)

  return {
    isParallel,
    isInteractive,
    isResearch,
    isHeadless,
    runInBackground: args.run_in_background,
  }
}

function detectTmuxAvailability(): boolean {
  return Boolean(process.env.TMUX || process.env.TMUX_PANE || process.env.TERM_PROGRAM === "tmux")
}

function cloneRuntimePolicyOverride(
  override: SessionPolicyOverride | undefined,
): SessionPolicyOverride | undefined {
  if (!override) {
    return undefined
  }

  return {
    concurrency: override.concurrency
      ? {
          globalLimit: override.concurrency.globalLimit,
          perKey: override.concurrency.perKey
            ? Object.fromEntries(
                Object.entries(override.concurrency.perKey).map(([key, value]) => [key, { ...value }]),
              )
            : undefined,
        }
      : undefined,
    budget: override.budget ? { ...override.budget } : undefined,
  }
}

function resolveTrustedParentRuntimePolicyOverride(
  parentSessionID: string,
): SessionPolicyOverride | undefined {
  const inMemoryOverride = getDelegationMeta(parentSessionID)?.runtimePolicyOverride
  if (inMemoryOverride) {
    return cloneRuntimePolicyOverride(inMemoryOverride)
  }

  const continuityOverride = getSessionContinuity(parentSessionID)?.metadata.delegation.runtimePolicyOverride
  return cloneRuntimePolicyOverride(continuityOverride)
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

const s = tool.schema

type DelegateTaskArgs = {
  description: string
  prompt: string
  agent?: string
  category?: string
  run_in_background: boolean
  session_id?: string
  scope?: string
  constraints?: string[]
  model?: string
}

/**
 * Creates the `delegate-task` tool definition.
 *
 * @param lifecycleManager - Lifecycle manager instance from the plugin scope
 * @param client - OpenCode client for session API calls
 */
export function createDelegateTaskTool(
  lifecycleManager: HarnessLifecycleManager,
  client: OpenCodeClient,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Create a restricted child session for researcher, builder, critic, or general work. When run_in_background=true, returns immediately with task metadata — continue with other productive work. You will receive a system_reminder notification when the background task completes.",
    args: {
      description: s.string().describe("Short task description"),
      prompt: s.string().describe("Full task prompt for the delegated agent"),
      agent: s
        .string()
        .optional()
        .describe(
          "Optional explicit specialist agent (researcher, builder, critic, general); overrides the category default when both are provided",
        ),
      category: s
        .string()
        .optional()
        .describe(
          "Optional routing category that can resolve agent, model, temperature, and guidance",
        ),
      run_in_background: s
        .boolean()
        .describe("When true, returns immediately — continue with other work. You'll be notified via system_reminder when complete."),
      session_id: s.string().optional().describe("Optional parent session override"),
      scope: s.string().optional().describe("Optional explicit task scope"),
      constraints: s
        .array(s.string())
        .optional()
        .describe("Optional constraint list passed into the child prompt"),
      model: s
        .string()
        .optional()
        .describe("Optional explicit model to request and use as the concurrency key"),
    },
    async execute(args: DelegateTaskArgs, context: { sessionID?: string }): Promise<string> {
      const requestedAgent = args.agent?.trim().toLowerCase()
      if (requestedAgent && !isValidAgent(requestedAgent)) {
        throw new Error(
          `[Harness] Invalid target agent "${args.agent}". Allowed agents: ${VALID_AGENTS.join(", ")}.`,
        )
      }
      const requestedSpecialistAgent = requestedAgent as SpecialistAgent | undefined

      const route = resolveSpecialistRoute({
        description: args.description,
        prompt: args.prompt,
        category: args.category,
        agent: requestedSpecialistAgent,
        model: args.model,
      })
      const agent = route.effectiveAgent

      const parentSessionID = args.session_id?.trim() || context.sessionID
      if (!parentSessionID) {
        throw new Error("[Harness] Missing parent session ID for delegation.")
      }

      if (route.warnings.length > 0) {
        for (const warning of route.warnings) {
          addWarning(parentSessionID, warning)
        }
      }

      const chain = await walkParentChain(client, parentSessionID)
      const currentDepth = Math.max(0, chain.length - 1)
      const childDepth = currentDepth + 1
      if (childDepth > MAX_DEPTH) {
        throw new Error(
          `[Harness] Delegation depth ${childDepth} exceeds max depth ${MAX_DEPTH}.`,
        )
      }

      const rootSession = chain[chain.length - 1]
      const rootID = getSessionID(rootSession)
      if (!rootID) {
        throw new Error("[Harness] Unable to resolve root session for delegation.")
      }

      const spawnReservation = reserveSubagentSpawn(
        parentSessionID,
        rootID,
        taskState,
        MAX_DESCENDANTS_PER_ROOT,
      )

      const agentTools = AGENT_TOOLS[agent] ?? { required: [], mustNot: [] }
      const permission = getPermissionRulesForAgent(agent)
      const toolCompatibility = getPromptToolCompatibility(permission)
      const compatibleTools = toolCompatibility ? Object.keys(toolCompatibility).sort() : []
      const execution = classifyExecutionMode(buildTaskCharacteristics(args, agent), {
        hasTmux: detectTmuxAvailability(),
        projectRoot: process.cwd(),
      })
      const runtimePolicyOverride = resolveTrustedParentRuntimePolicyOverride(parentSessionID)

      return await lifecycleManager.launchDelegatedSession({
        parentSessionID,
        rootID,
        childDepth,
        description: args.description,
        scope: args.scope,
        constraints: args.constraints,
        runInBackground: args.run_in_background,
        agent,
        route,
        permissionRules: permission,
        compatibleTools,
        toolCompatibility,
        promptText: buildPromptText({
          description: args.description,
          prompt: args.prompt,
          category: route.category,
          scope: args.scope,
          constraints: args.constraints,
          guidanceText: route.guidanceText,
          agent,
          requiredTools: agentTools.required,
          mustNotDo: agentTools.mustNot,
        }),
        execution,
        runtimePolicyOverride,
        spawnReservation,
      })
    },
  })
}
