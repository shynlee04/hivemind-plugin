/**
 * Tool guard hook factory.
 *
 * Produces the `tool.execute.before` and `tool.execute.after` hooks that
 * enforce the session circuit breaker and tool budget, track per-session
 * stats, and inject harness metadata into tool outputs.
 *
 * All state access goes through the provided TaskStateManager instance so
 * tests can inject a fresh, isolated manager without touching the singleton.
 * The optional lifecycleManager is used to note observed tool activity when
 * present; tests omit it so they have no dependency on the lifecycle manager.
 */
import {
  getSessionContinuity,
  getContinuityStoragePath,
  getSessionRecoveryState,
} from "../lib/continuity.js"
import { evaluateGovernance, type GovernanceEvaluationResult } from "../lib/governance-engine.js"
import { asString, getNestedValue, isObject, makeToolSignature } from "../lib/helpers.js"
import { DEFAULT_RUNTIME_POLICY } from "../lib/runtime-policy.js"
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
 *
 * @param deps - Dependency bundle containing the state manager
 * @returns Object with `tool.execute.before` and `tool.execute.after` handlers
 */
export function createToolGuardHooks(deps: ToolGuardDependencies): ToolGuardHooks {
  const { stateManager, lifecycleManager } = deps
  const policy = deps.runtimePolicy ?? DEFAULT_RUNTIME_POLICY
  const maxToolCalls = policy.budget.maxToolCallsPerSession
  const circuitBreakerThreshold = policy.budget.repeatedSignatureThreshold
  const recentGovernance = new Map<string, GovernanceEvaluationResult>()

  return {
    "tool.execute.before": async (input: BeforeInput, output: BeforeOutput): Promise<void> => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      const toolName = asString(getNestedValue(input, ["tool"]))
      const args = getNestedValue(output, ["args"])

      if (!sessionID || !toolName) {
        return
      }

      const governance = evaluateGovernance({
        scope: "tool.execute.before",
        sessionID,
        toolName,
        args,
      })
      recentGovernance.set(sessionID, governance)

      for (const warning of governance.warnings) {
        stateManager.addWarning(sessionID, warning.message)
      }

      for (const escalation of governance.escalations) {
        stateManager.addWarning(sessionID, `Governance escalation: ${escalation.message}`)
      }

      if (governance.blocks.length > 0) {
        throw new Error(`[Harness] ${governance.blocks[0]?.message ?? "Tool execution blocked by governance."}`)
      }

      const stats = stateManager.ensureStats(sessionID)
      stats.total += 1
      stats.byTool[toolName] = (stats.byTool[toolName] ?? 0) + 1

      if (stats.total > maxToolCalls) {
        stateManager.addWarning(sessionID, `Exceeded ${maxToolCalls} tool calls`)
        throw new Error(
          `[Harness] Session ${sessionID} exceeded the tool call budget (${maxToolCalls}).`,
        )
      }

      const signature = makeToolSignature(toolName, args)
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
      const recovery = getSessionRecoveryState(sessionID)
      const lifecycle = lifecycleManager?.getLifecycleSnapshot(sessionID)
      const governance = recentGovernance.get(sessionID)
      recentGovernance.delete(sessionID)

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
          recovery,
          routing: continuity?.metadata.route,
          governance: governance ?? { warnings: [], escalations: [], blocks: [] },
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
