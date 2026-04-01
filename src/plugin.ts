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
  isToolRestrictedForAgent,
  makeToolSignature,
} from "./lib/helpers.js"
import {
  isDelegationCategory,
  listDelegationCategories,
  resolveDelegationRoute,
} from "./lib/routing.js"
import { createHarnessLifecycleManager } from "./lib/lifecycle-manager.js"
import { getEffectivePromptState } from "./lib/runtime.js"
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
  type PermissionRule,
  type SpecialistAgent,
  MAX_DESCENDANTS_PER_ROOT,
  VALID_AGENTS,
} from "./lib/types.js"

const MAX_DEPTH = 3
const POLL_INTERVAL_MS = 750
const POLL_TIMEOUT_MS = 180000
const CIRCUIT_BREAKER_THRESHOLD = 16
const MAX_TOOL_CALLS_PER_SESSION = 400
const tool = (OpenCodePlugin as { tool?: any }).tool as any

function isValidAgent(value: string): value is SpecialistAgent {
  return VALID_AGENTS.includes(value as SpecialistAgent)
}

function normalizeCategory(value: string | undefined): DelegationCategory | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  if (!isDelegationCategory(normalized)) {
    throw new Error(
      `[Harness] Invalid category "${value}". Allowed categories: ${listDelegationCategories()
        .map((entry) => entry.category)
        .join(", ")}.`
    )
  }

  return normalized
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
    pollIntervalMs: POLL_INTERVAL_MS,
    pollTimeoutMs: POLL_TIMEOUT_MS,
  })
  lifecycleManager.hydrateFromContinuity()

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

      // Per-delegation tool restriction enforcement (PERM-007)
      const delegation = getDelegationMeta(sessionID)
      if (delegation && isToolRestrictedForAgent(toolName, delegation.agent)) {
        addWarning(
          sessionID,
          `Tool "${toolName}" denied for agent "${delegation.agent}"`
        )
        throw new Error(
          `[Harness] Tool "${toolName}" is restricted for agent "${delegation.agent}".`
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
      const effectivePrompt = getEffectivePromptState({ sessionID })
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
          effectivePrompt,
          routeWarnings: effectivePrompt?.warnings ?? [],
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
    },

    "experimental.session.compacting": async (input, output) => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      if (!sessionID) {
        return
      }

      const stats = getSessionStats(sessionID)
      const delegation = getDelegationMeta(sessionID)
      const continuity = getSessionContinuity(sessionID)
      const effectivePrompt = getEffectivePromptState({ sessionID })
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

      if (effectivePrompt) {
        contextLines.push(`- effective_agent: ${effectivePrompt.agent}`)
        if (effectivePrompt.category) {
          contextLines.push(`- effective_category: ${effectivePrompt.category}`)
        }
        if (effectivePrompt.requestedCategory && effectivePrompt.requestedCategory !== effectivePrompt.category) {
          contextLines.push(`- requested_category: ${effectivePrompt.requestedCategory}`)
        }
        if (effectivePrompt.model) {
          contextLines.push(`- effective_model: ${effectivePrompt.model}`)
        }
        if (effectivePrompt.temperature !== undefined) {
          contextLines.push(`- effective_temperature: ${effectivePrompt.temperature}`)
        }
        contextLines.push(`- agent_source: ${effectivePrompt.agentSource}`)
        contextLines.push(`- model_source: ${effectivePrompt.modelSource}`)
        contextLines.push(`- temperature_source: ${effectivePrompt.temperatureSource}`)
        if (effectivePrompt.continuityStatus) {
          contextLines.push(`- continuity_status: ${effectivePrompt.continuityStatus}`)
        }
        if (lifecycle?.phase) {
          contextLines.push(`- lifecycle_phase: ${lifecycle.phase}`)
        }
        if (lifecycle?.runMode) {
          contextLines.push(`- lifecycle_run_mode: ${lifecycle.runMode}`)
        }
        if (effectivePrompt.warnings.length) {
          contextLines.push(`- route_warnings: ${effectivePrompt.warnings.join(" | ")}`)
        }
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
                effective_prompt: effectivePrompt,
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
    },

    "chat.params": async (input, output) => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      const agent = asString(getNestedValue(input, ["agent"]))?.toLowerCase()
      const effectivePrompt = getEffectivePromptState({ sessionID, agent })
      const promptOutput = output as Record<string, unknown>

      if (effectivePrompt?.model && promptOutput.model === undefined) {
        promptOutput.model = effectivePrompt.model
      }

      if (effectivePrompt?.temperature !== undefined) {
        output.temperature = effectivePrompt.temperature
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
          const route = resolveDelegationRoute({
            agent: requestedSpecialistAgent,
            model: args.model,
            category,
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
              `[Harness] Delegation depth ${childDepth} exceeds max depth ${MAX_DEPTH}.`
            )
          }

          const rootSession = chain[chain.length - 1]
          const rootID = getSessionID(rootSession)
          if (!rootID) {
            throw new Error("[Harness] Unable to resolve root session for delegation.")
          }

          reserveDescendant(rootID, MAX_DESCENDANTS_PER_ROOT)

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
            }),
          })
        },
      }),
    },
  }
}

export default HarnessControlPlane
