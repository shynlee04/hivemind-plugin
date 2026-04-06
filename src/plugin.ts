import type { Plugin } from "@opencode-ai/plugin"
import * as OpenCodePlugin from "@opencode-ai/plugin"
import {
  getContinuityStoragePath,
  getSessionContinuity,
} from "./lib/continuity.js"
import {
  asString,
  buildPromptText,
  getNestedValue,
  getPromptToolCompatibility,
  isObject,
  makeToolSignature,
} from "./lib/helpers.js"

import { createHarnessLifecycleManager } from "./lib/lifecycle-manager.js"
import { getEventSessionID, getSessionID, walkParentChain } from "./lib/session-api.js"
import {
  addWarning,
  ensureSessionStats,
  getDelegationMeta,
  getSessionStats,
  reserveDescendant,
} from "./lib/state.js"
import {
  type DelegationCategory,
  type DelegationRouteResolution,
  type PermissionRule,
  type SpecialistAgent,
  MAX_DESCENDANTS_PER_ROOT,
  VALID_AGENTS,
  VALID_DELEGATION_CATEGORIES,
} from "./lib/types.js"
import { PromptEnhancePlugin } from "./plugins/prompt-enhance.js"

const MAX_DEPTH = 3
const WATCH_TIMEOUT_MS = 180000
const CIRCUIT_BREAKER_THRESHOLD = 16
const MAX_TOOL_CALLS_PER_SESSION = 400

const AGENT_DEFAULTS: Record<string, { temperature: number }> = {
  researcher: { temperature: 0.1 },
  builder: { temperature: 0.15 },
  critic: { temperature: 0.05 },
}

const AGENT_TOOLS: Record<string, { required: string[]; mustNot: string[] }> = {
  researcher: { required: ["read", "glob", "grep", "webfetch"], mustNot: ["edit", "write", "bash", "task"] },
  builder: { required: ["read", "glob", "grep", "edit", "write", "bash"], mustNot: ["task"] },
  critic: { required: ["read", "glob", "grep", "bash"], mustNot: ["edit", "write", "task"] },
}

const tool = (OpenCodePlugin as { tool?: any }).tool as any

function isValidAgent(value: string): value is SpecialistAgent {
  return VALID_AGENTS.includes(value as SpecialistAgent)
}

function normalizeCategory(value: string | undefined): DelegationCategory | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  if (!VALID_DELEGATION_CATEGORIES.includes(normalized as DelegationCategory)) {
    throw new Error(
      `[Harness] Invalid category "${value}". Allowed categories: ${VALID_DELEGATION_CATEGORIES.join(", ")}.`
    )
  }

  return normalized as DelegationCategory
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
    default:
      throw new Error(`[Harness] Unsupported agent for permission profile: ${String(agentName)}`)
  }
}

export const HarnessControlPlane: Plugin = async ({ client }) => {
  const lifecycleManager = createHarnessLifecycleManager({
    client,
    pollTimeoutMs: WATCH_TIMEOUT_MS,
  })
  lifecycleManager.hydrateFromContinuity()

  // Compose prompt-enhance plugin for session state initialization
  const promptEnhancePlugin = await PromptEnhancePlugin({} as any)

  return {
    "tool.execute.before": async (input, output) => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      const toolName = asString(getNestedValue(input, ["tool"]))
      const args = getNestedValue(output, ["args"])

      if (!sessionID || !toolName) {
        return
      }

      const stats = ensureSessionStats(sessionID)
      stats.total += 1
      stats.byTool[toolName] = (stats.byTool[toolName] ?? 0) + 1

      if (stats.total > MAX_TOOL_CALLS_PER_SESSION) {
        addWarning(sessionID, `Exceeded ${MAX_TOOL_CALLS_PER_SESSION} tool calls`)
        throw new Error(
          `[Harness] Session ${sessionID} exceeded the tool call budget (${MAX_TOOL_CALLS_PER_SESSION}).`
        )
      }

      const signature = makeToolSignature(toolName, args)
      if (stats.loop.signature === signature) {
        stats.loop.count += 1
      } else {
        stats.loop.signature = signature
        stats.loop.count = 1
      }

      if (stats.loop.count >= CIRCUIT_BREAKER_THRESHOLD) {
        addWarning(
          sessionID,
          `Circuit breaker tripped on repeated ${toolName} calls (${stats.loop.count}x)`
        )
        throw new Error(
          `[Harness] Circuit breaker tripped for session ${sessionID} on repeated ${toolName} calls.`
        )
      }

      lifecycleManager.noteObservedActivity(sessionID, "tool.execute.before")
    },

    "tool.execute.after": async (input, output) => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      if (!sessionID) {
        return
      }

      lifecycleManager.noteObservedActivity(sessionID, "tool.execute.after")

      const stats = getSessionStats(sessionID)
      const delegation = getDelegationMeta(sessionID)
      const continuity = getSessionContinuity(sessionID)
      const lifecycle = lifecycleManager.getLifecycleSnapshot(sessionID)

      output.metadata = {
        ...(isObject(output.metadata) ? output.metadata : {}),
        _harness: {
          totalToolCalls: stats?.total ?? 0,
          recentWarnings: stats?.warnings ?? [],
          repeatedSignatureCount: stats?.loop.count ?? 0,
          rootSessionID: delegation?.rootID,
          delegationDepth: delegation?.depth,
          rootBudgetUsed: delegation?.budgetUsed,
          specialistAgent: delegation?.agent,
          specialistCategory: delegation?.category,
          specialistModel: delegation?.model,
          concurrencyKey: delegation?.queueKey,
          continuityStatus: continuity?.metadata.status,
          lifecycle,
          routing: continuity?.metadata.route,
          continuityStorage: getContinuityStoragePath(),
          continuity: continuity
            ? {
                promptParams: continuity.promptParams,
                toolProfile: continuity.toolProfile,
                metadata: continuity.metadata,
              }
            : undefined,
        },
      }
    },

    event: async ({ event }) => {
      const eventType = asString(getNestedValue(event, ["type"]))
      const sessionID = getEventSessionID(event)

      if (!eventType || !sessionID) {
        return
      }

      lifecycleManager.handleEvent({ event, eventType, sessionID })

      // Forward to prompt-enhance plugin for session state initialization
      if (promptEnhancePlugin.event) {
        await promptEnhancePlugin.event({ event })
      }
    },

    "experimental.session.compacting": async (input, output) => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      if (!sessionID) {
        return
      }

      const stats = getSessionStats(sessionID)
      const delegation = getDelegationMeta(sessionID)
      const continuity = getSessionContinuity(sessionID)
      const lifecycle = lifecycleManager.getLifecycleSnapshot(sessionID)
      const contextLines = [
        "Harness state snapshot:",
        `- session: ${sessionID}`,
        `- tool_calls: ${stats?.total ?? 0}`,
        `- repeated_signature_count: ${stats?.loop.count ?? 0}`,
      ]

      if (delegation) {
        contextLines.push(`- root_session: ${delegation.rootID}`)
        contextLines.push(`- delegation_depth: ${delegation.depth}`)
        contextLines.push(`- root_budget_used: ${delegation.budgetUsed}`)
        contextLines.push(`- specialist_agent: ${delegation.agent}`)
        if (delegation.category) {
          contextLines.push(`- specialist_category: ${delegation.category}`)
        }
        if (delegation.model) {
          contextLines.push(`- specialist_model: ${delegation.model}`)
        }
        contextLines.push(`- concurrency_key: ${delegation.queueKey}`)
      }

      if (lifecycle?.phase) {
        contextLines.push(`- lifecycle_phase: ${lifecycle.phase}`)
      }
      if (lifecycle?.runMode) {
        contextLines.push(`- lifecycle_run_mode: ${lifecycle.runMode}`)
      }

      if (lifecycle?.queue) {
        contextLines.push(`- lifecycle_queue: ${lifecycle.queue.active}/${lifecycle.queue.limit}`)
        contextLines.push(`- lifecycle_queue_pending: ${lifecycle.queue.pending}`)
      }

      if (lifecycle?.observation) {
        contextLines.push(`- lifecycle_signal: ${lifecycle.observation.source}`)
        if (lifecycle.observation.statusType) {
          contextLines.push(`- lifecycle_status_signal: ${lifecycle.observation.statusType}`)
        }
        if (lifecycle.observation.sessionStatusType) {
          contextLines.push(`- lifecycle_session_signal: ${lifecycle.observation.sessionStatusType}`)
        }
      }

      if (lifecycle?.cleanup?.reason) {
        contextLines.push(`- lifecycle_cleanup: ${lifecycle.cleanup.reason}`)
      }

      if (stats?.warnings.length) {
        contextLines.push(`- warnings: ${stats.warnings.join(" | ")}`)
      }

      output.context = Array.isArray(output.context) ? output.context : []
      output.context.push(contextLines.join("\n"))

      if (continuity) {
        output.context.push(
          [
            "Harness continuity snapshot:",
            JSON.stringify(
              {
                session_id: continuity.sessionID,
                prompt_params: continuity.promptParams,
                tool_profile: continuity.toolProfile,
                metadata: continuity.metadata,
                lifecycle,
                storage: {
                  mode: "durable-file",
                  path: getContinuityStoragePath(),
                },
              },
              null,
              2
            ),
          ].join("\n")
        )
      }

      // Forward to prompt-enhance plugin for compaction metadata
      if (promptEnhancePlugin["experimental.session.compacting"]) {
        await promptEnhancePlugin["experimental.session.compacting"](input, output)
      }
    },

    "shell.env": async (_input, output) => {
      output.env = {
        ...(isObject(output.env) ? output.env : {}),
        CI: "true",
        GIT_TERMINAL_PROMPT: "0",
        NO_COLOR: "1",
        TERM: "dumb",
      }
    },

    tool: {
      "delegate-task": tool({
        description:
          "Create a restricted child session for researcher, builder, or critic work and optionally wait for the final assistant response.",
        args: {
          description: tool.schema.string().describe("Short task description"),
          prompt: tool.schema.string().describe("Full task prompt for the delegated agent"),
          agent: tool.schema
            .string()
            .optional()
            .describe("Optional explicit specialist agent; overrides the category default when both are provided"),
          category: tool.schema
            .string()
            .optional()
            .describe("Optional routing category that can resolve agent, model, temperature, and guidance"),
          run_in_background: tool.schema
            .boolean()
            .describe("Run asynchronously and return task metadata immediately"),
          session_id: tool.schema
            .string()
            .optional()
            .describe("Optional parent session override"),
          scope: tool.schema
            .string()
            .optional()
            .describe("Optional explicit task scope"),
          constraints: tool.schema
            .array(tool.schema.string())
            .optional()
            .describe("Optional constraint list passed into the child prompt"),
          model: tool.schema
            .string()
            .optional()
            .describe("Optional explicit model to request and use as the concurrency key"),
        },
        async execute(
          args: {
            description: string
            prompt: string
            agent?: string
            category?: string
            run_in_background: boolean
            session_id?: string
            scope?: string
            constraints?: string[]
            model?: string
          },
          context: { sessionID?: string }
        ) {
          const requestedAgent = args.agent?.trim().toLowerCase()
          if (requestedAgent && !isValidAgent(requestedAgent)) {
            throw new Error(`[Harness] Invalid target agent "${args.agent}". Allowed agents: ${VALID_AGENTS.join(", ")}.`)
          }
          const requestedSpecialistAgent = requestedAgent as SpecialistAgent | undefined

          const category = normalizeCategory(args.category)
          const agent = requestedSpecialistAgent ?? "builder"
          const agentDefaults = AGENT_DEFAULTS[agent] ?? { temperature: 0.15 }

          const route: DelegationRouteResolution = {
            requestedCategory: category,
            category,
            requestedAgent: requestedSpecialistAgent,
            effectiveAgent: agent,
            requestedModel: args.model,
            effectiveModel: args.model,
            temperature: agentDefaults.temperature,
            guidanceText: undefined,
            modelSource: args.model ? "explicit" : "none",
            agentSource: requestedSpecialistAgent ? "explicit" : "category",
            temperatureSource: "agent",
            warnings: [],
          }

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
              `[Harness] Delegation depth ${childDepth} exceeds max depth ${MAX_DEPTH}.`
            )
          }

          const rootSession = chain[chain.length - 1]
          const rootID = getSessionID(rootSession)
          if (!rootID) {
            throw new Error("[Harness] Unable to resolve root session for delegation.")
          }

          reserveDescendant(rootID, MAX_DESCENDANTS_PER_ROOT)

          const agentTools = AGENT_TOOLS[agent] ?? { required: [], mustNot: [] }

          const permission = getPermissionRulesForAgent(agent)
          const toolCompatibility = getPromptToolCompatibility(permission)
          const compatibleTools = toolCompatibility ? Object.keys(toolCompatibility).sort() : []
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
          })
        },
      }),
    },
  }
}

export default HarnessControlPlane
