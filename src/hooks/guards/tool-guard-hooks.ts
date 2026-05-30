/**
 * Tool guard hook factory.
 *
 * Produces the `tool.execute.before` and `tool.execute.after` hooks that
 * enforce the session circuit breaker and tool budget, track per-session
 * stats, and inject harness metadata into tool outputs.
 *
 * Stripped in 14-01: governance-engine removed. Governance evaluation is no-op.
 */
import {
  getSessionContinuity,
  getContinuityStoragePath,
} from "../../task-management/continuity/index.js"
import { asString, getNestedValue, isObject, makeToolSignature } from "../../shared/helpers.js"
import { DEFAULT_RUNTIME_POLICY, getRuntimePolicyForSession } from "../../shared/runtime-policy.js"
import type { RuntimePolicy } from "../../shared/types.js"
import type { HarnessLifecycleManager } from "../../task-management/lifecycle/index.js"
import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import type { TaskStateManager } from "../../shared/state.js"
import { getDelegationMeta } from "../../shared/state.js"
import { classifyHookEffect } from "../composition/cqrs-boundary.js"

// ---------------------------------------------------------------------------
// Dependency shape
// ---------------------------------------------------------------------------

export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HarnessLifecycleManager
  runtimePolicy?: RuntimePolicy
  hivemindConfig?: HivemindConfigs
}

// ---------------------------------------------------------------------------
// Hook return shape
// ---------------------------------------------------------------------------

type BeforeInput = Record<string, unknown>
type BeforeOutput = Record<string, unknown>
type AfterInput = Record<string, unknown>
type AfterOutput = { metadata?: unknown; [key: string]: unknown }

export interface ToolGuardHooks {
  "tool.execute.before": (input: BeforeInput, output: BeforeOutput) => Promise<void>
  "tool.execute.after": (input: AfterInput, output: AfterOutput) => Promise<void>
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates the tool guard hooks using the provided dependency bundle.
 */
export function createToolGuardHooks(deps: ToolGuardDependencies): ToolGuardHooks {
  const { stateManager, lifecycleManager } = deps
  const workspacePolicy = deps.runtimePolicy ?? DEFAULT_RUNTIME_POLICY

  /**
   * Resolve the effective runtime policy for a given session.
   */
  function resolvePolicy(sessionID: string): RuntimePolicy {
    const delegation = getDelegationMeta(sessionID)
    return getRuntimePolicyForSession(workspacePolicy, delegation?.runtimePolicyOverride)
  }

  return {
    "tool.execute.before": async (input: BeforeInput, output: BeforeOutput): Promise<void> => {
      classifyHookEffect("tool.execute.before")
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      const toolName = asString(getNestedValue(input, ["tool"]))
      const rawArgs = getNestedValue(output, ["args"])

      if (!sessionID || !toolName) {
        return
      }

      // Resolve per-session policy from trusted delegation metadata
      const policy = resolvePolicy(sessionID)
      const maxToolCalls = policy.budget.maxToolCallsPerSession
      const circuitBreakerThreshold = policy.budget.repeatedSignatureThreshold

      const stats = stateManager.ensureStats(sessionID)
      stats.total += 1
      stats.byTool[toolName] = (stats.byTool[toolName] ?? 0) + 1

      if (stats.total > maxToolCalls) {
        stateManager.addWarning(sessionID, `Exceeded ${maxToolCalls} tool calls`)
        throw new Error(
          `[Harness] Session ${sessionID} exceeded the tool call budget (${maxToolCalls}).`,
        )
      }

      const signature = makeToolSignature(toolName, rawArgs)
      if (stats.loop.signature === signature) {
        stats.loop.count += 1
      } else {
        stats.loop.signature = signature
        stats.loop.count = 1
      }

      if (stats.loop.count >= circuitBreakerThreshold) {
        stateManager.addWarning(
          sessionID,
          `Circuit breaker tripped on repeated ${toolName} calls (${stats.loop.count}x)`,
        )
        throw new Error(
          `[Harness] Circuit breaker tripped for session ${sessionID} on repeated ${toolName} calls.`,
        )
      }

      // BOOT-09: Document Language Tool Guard (Layer 2 — D-11)
      // Pre-execution language reminder for Write/Edit/apply_patch at document_paths.
      // Per D-12: this is NOT content validation — it's a pre-execution instruction reminder.
      const depsHivemindConfig = deps.hivemindConfig as HivemindConfigs | undefined
      if (depsHivemindConfig?.documents_and_artifacts_language && depsHivemindConfig.document_paths) {
        const docLang = depsHivemindConfig.documents_and_artifacts_language
        const docPaths = depsHivemindConfig.document_paths
        const args = getNestedValue(output, ["args"]) as Record<string, unknown> | undefined
        let filePath: string | undefined

        if (toolName === "write" || toolName === "edit") {
          filePath = asString(getNestedValue(args, ["filePath"]))
        } else if (toolName === "apply_patch") {
          // apply_patch has no filePath field — inject generic reminder for MVP
          // Per RESEARCH.md Pitfall 3 + Open Question 1: skip path-specific detection
          const argsObj = args as Record<string, unknown> | undefined
          const patchText = argsObj?.patchText
          if (typeof patchText === "string") {
            argsObj!["_languageReminder"] =
              `REMINDER: All .md files in this patch MUST be written in ${docLang}.`
          }
        }

        if (filePath) {
          const isUnderDocPath = docPaths.some((p: string) => filePath!.includes(p))
          if (isUnderDocPath && filePath.endsWith(".md")) {
            // Prepend language instruction to content/newString
            const reminder =
              `[LANGUAGE: Write this file in ${docLang} per Language Governance.]`
            if (
              toolName === "write" &&
              typeof (args as Record<string, unknown>)?.content === "string"
            ) {
              ;(args as Record<string, unknown>).content =
                `${reminder}\n${(args as Record<string, unknown>).content}`
            } else if (
              toolName === "edit" &&
              typeof (args as Record<string, unknown>)?.newString === "string"
            ) {
              ;(args as Record<string, unknown>).newString =
                `${reminder}\n${(args as Record<string, unknown>).newString}`
            }
          }
        }
      }

      lifecycleManager?.noteObservedActivity(sessionID, "tool.execute.before")
    },

    "tool.execute.after": async (input: AfterInput, output: AfterOutput): Promise<void> => {
      classifyHookEffect("tool.execute.after")
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      if (!sessionID) {
        return
      }

      lifecycleManager?.noteObservedActivity(sessionID, "tool.execute.after")

      const stats = stateManager.getStats(sessionID)
      const delegation = getDelegationMeta(sessionID)
      const continuity = getSessionContinuity(sessionID)
      const lifecycle = lifecycleManager?.getLifecycleSnapshot(sessionID)

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
          specialistModel: delegation?.model,
          concurrencyKey: delegation?.queueKey,
          continuityStatus: continuity?.metadata.status,
          lifecycle,
          routing: continuity?.metadata.route,
          governance: { warnings: [], escalations: [], blocks: [] },
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
  }
}
