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
import { type ExecutionModeResult, type TaskCharacteristics } from "../lib/execution-mode.js"
import { DEFAULT_RUNTIME_POLICY, getRuntimePolicyForSession } from "../lib/runtime-policy.js"
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
  RuntimePolicy,
  SessionPolicyOverride,
  SpecialistAgent,
} from "../lib/types.js"
import {
  MAX_DESCENDANTS_PER_ROOT,
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
  const category = args.category?.toLowerCase() ?? ""
  const isResearch = agent === "researcher" || category === "research" || category === "deep"
  const isReview = agent === "critic" || category === "review"
  const isHeadless = isResearch || (!isReview && args.async_dispatch)
  const isInteractive = !isResearch

  return {
    isParallel: false,
    isInteractive,
    isResearch,
    isHeadless,
    runInBackground: args.async_dispatch,
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
    trustedRuntime: override.trustedRuntime ? { ...override.trustedRuntime } : undefined,
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

function buildDelegateExecutionContract(
  args: DelegateTaskArgs,
  agent: SpecialistAgent,
): ExecutionModeResult {
  const characteristics = buildTaskCharacteristics(args, agent)
  const capabilityEvidence = {
    hasTmux: detectTmuxAvailability(),
    projectRoot: process.cwd(),
  }
  return {
    family: "built-in",
    submode: "builtin-subsession",
    rationale: args.async_dispatch
      ? "delegate-task async dispatch is locked to the single built-in child-session lane (builtin-subsession)."
      : "delegate-task sync dispatch stays on the single built-in child-session lane (builtin-subsession).",
    characteristics,
    capabilityEvidence,
  }
}

function assertAsyncBuiltinDispatchTrusted(
  workspacePolicy: RuntimePolicy,
  runtimePolicyOverride: SessionPolicyOverride | undefined,
): void {
  const resolvedPolicy = getRuntimePolicyForSession(workspacePolicy, runtimePolicyOverride)

  if (resolvedPolicy.trustedRuntime.builtinAsyncBackgroundChildSessions) {
    return
  }

  throw new Error(
    "[Harness] Builtin async disabled because runtime durability cannot be proven. Use sync dispatch, a durable server/attach flow, or an explicit trusted runtime policy.",
  )
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
  async_dispatch: boolean
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
  workspacePolicy: RuntimePolicy = DEFAULT_RUNTIME_POLICY,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Create a restricted child session for researcher, builder, critic, or general work, including async child session flows when the effective trusted runtime policy proves the host is durable. Invalid or alias agent requests safely degrade to general with visible fallback warnings. This is separate from the background tool for OS child processes.",
    args: {
      description: s.string().describe("Short task description"),
      prompt: s.string().describe("Full task prompt for the delegated agent"),
      agent: s
        .string()
        .optional()
        .describe(
          "Optional explicit specialist agent (researcher, builder, critic, general). Alias or invalid values degrade to general with fallback warnings.",
        ),
      category: s
        .string()
        .optional()
        .describe(
          "Optional routing category that can resolve agent, model, temperature, and guidance",
        ),
      async_dispatch: s
        .boolean()
        .describe("When true, request async delegated child-session work. The tool returns immediately only when the effective trusted runtime policy allows builtin async child sessions, and you will then be notified via system_reminder when that child session completes."),
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
      const route = resolveSpecialistRoute({
        description: args.description,
        prompt: args.prompt,
        category: args.category,
        agent: args.agent,
        model: args.model,
      })
      const agent = route.effectiveAgent

      const rawSessionOverride = args.session_id
      const sessionOverride = rawSessionOverride?.trim()
      if (rawSessionOverride !== undefined && (!sessionOverride || !sessionOverride.startsWith("ses"))) {
        throw new Error(
          "[Harness] Invalid session_id override. Expected an OpenCode session ID starting with 'ses'.",
        )
      }

      const parentSessionID = sessionOverride || context.sessionID
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
      const execution = buildDelegateExecutionContract(args, agent)
      const runtimePolicyOverride = resolveTrustedParentRuntimePolicyOverride(parentSessionID)

      if (args.async_dispatch && execution.submode === "builtin-subsession") {
        assertAsyncBuiltinDispatchTrusted(workspacePolicy, runtimePolicyOverride)
      }

      return await lifecycleManager.launchDelegatedSession({
        parentSessionID,
        rootID,
        childDepth,
        description: args.description,
        scope: args.scope,
        constraints: args.constraints,
        runInBackground: args.async_dispatch,
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
