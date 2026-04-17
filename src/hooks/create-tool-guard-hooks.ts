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
} from "../lib/continuity.js"
import { asString, getNestedValue, isObject, makeToolSignature } from "../lib/helpers.js"
import { DEFAULT_RUNTIME_POLICY, getRuntimePolicyForSession } from "../lib/runtime-policy.js"
import type { RuntimePolicy } from "../lib/types.js"
import type { HarnessLifecycleManager } from "../lib/lifecycle-manager.js"
import type { TaskStateManager } from "../lib/state.js"
import { getDelegationMeta } from "../lib/state.js"

// ---------------------------------------------------------------------------
// Dependency shape
// ---------------------------------------------------------------------------

export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HarnessLifecycleManager
  runtimePolicy?: RuntimePolicy
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

      lifecycleManager?.noteObservedActivity(sessionID, "tool.execute.before")
    },

    "tool.execute.after": async (input: AfterInput, output: AfterOutput): Promise<void> => {
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
          specialistCategory: delegation?.category,
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
