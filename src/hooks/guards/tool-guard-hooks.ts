/**
 * Tool guard hook factory.
 *
 * Produces the `tool.execute.before` and `tool.execute.after` hooks that
 * enforce the session circuit breaker and tool budget, track per-session
 * stats, and inject harness metadata into tool outputs.
 *
 * Governance evaluation wired via evaluateGovernance() on tool.execute.before.
 */
import {
  getSessionContinuity,
  getContinuityStoragePath,
} from "../../task-management/continuity/index.js"
import { enrichContinuityWithTracker } from "../../task-management/continuity/continuity-reader.js"
import { asString, getNestedValue, isObject, makeToolSignature } from "../../shared/helpers.js"
import { DEFAULT_RUNTIME_POLICY, getRuntimePolicyForSession } from "../../shared/runtime-policy.js"
import type { RuntimePolicy } from "../../shared/types.js"
import type { HivemindLifecycleManager } from "../../task-management/lifecycle/index.js"
import type { HivemindConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import type { TaskStateManager } from "../../shared/state.js"
import { getDelegationMeta } from "../../shared/state.js"
import { classifyHookEffect } from "../composition/cqrs-boundary.js"
import { evaluateGovernance } from "../../features/governance-engine/index.js"
import { getToolIntelligenceEngine, renderGuidance } from "../../features/tool-intelligence/index.js"

// ---------------------------------------------------------------------------
// Dependency shape
// ---------------------------------------------------------------------------

export interface ToolGuardDependencies {
  stateManager: TaskStateManager
  lifecycleManager?: HivemindLifecycleManager
  runtimePolicy?: RuntimePolicy
  hivemindConfig?: HivemindConfigs
  /** Project root directory for session-tracker file resolution. */
  projectRoot?: string
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
  const lastGovResult = new Map<string, { warnings: string[]; escalations: any[]; blocks: string[] }>()

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
          `[Hivemind] Session ${sessionID} exceeded the tool call budget (${maxToolCalls}).`,
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
          `[Hivemind] Circuit breaker tripped for session ${sessionID} on repeated ${toolName} calls.`,
        )
      }

      // Tool Intelligence Engine (P44-04): Hivemind-owned runtime decisions.
      // Evaluates tool calls using session hierarchy, agent role, and tool args.
      // Runs AFTER budget/circuit-breaker, BEFORE governance rules.
      const delegation = getDelegationMeta(sessionID)
      const agentName = delegation?.agent ?? "unknown"
      const tiEngine = getToolIntelligenceEngine()
      const recentToolNames = Object.entries(stats.byTool)
        .flatMap(([tool, count]) => Array(count).fill(tool))
        .slice(-10)
      const tiEvent = {
        sessionID,
        agentName,
        toolName,
        args: (isObject(rawArgs) ? rawArgs : {}) as Record<string, unknown>,
        callID: `${sessionID}-${toolName}-${stats.total}`,
        delegationDepth: delegation?.depth ?? 0,
        isChildSession: (delegation?.depth ?? 0) > 0,
        recentToolSequence: recentToolNames,
      }
      const tiDecision = tiEngine.evaluateToolCall(tiEvent)

      if (tiDecision.kind === "block" || tiDecision.kind === "needs_jit_grant") {
        const guidanceText = tiDecision.guidance
          ? renderGuidance(tiDecision.guidance)
          : tiDecision.reason
        stateManager.addWarning(
          sessionID,
          `Tool intelligence ${tiDecision.kind}: ${tiDecision.reason}`,
        )
        throw new Error(
          `[Hivemind] Tool intelligence ${tiDecision.kind}: ${tiDecision.reason}\n${guidanceText}`,
        )
      }

      if (tiDecision.kind === "warn" && tiDecision.guidance) {
        stateManager.addWarning(sessionID, `Tool intelligence warn: ${tiDecision.reason}`)
      }

      // Governance rules check
      const depsHivemindConfig = deps.hivemindConfig as HivemindConfigs | undefined
      if (depsHivemindConfig?.governance?.rules) {
        const govResult = evaluateGovernance(toolName, sessionID, depsHivemindConfig.governance.rules)
        lastGovResult.set(sessionID, {
          warnings: govResult.warnings,
          escalations: govResult.escalations,
          blocks: govResult.blocks,
        })

        if (govResult.blocked) {
          stateManager.addWarning(sessionID, `Tool call blocked by governance: ${govResult.blocks.join("; ")}`)
          throw new Error(`[Hivemind] Tool execution blocked by governance: ${govResult.blocks.join("; ")}`)
        }

        for (const warn of govResult.warnings) {
          stateManager.addWarning(sessionID, warn)
        }
      }

      // BOOT-09: Document Language Tool Guard (Layer 2 — D-11)
      // Pre-execution language reminder for Write/Edit/apply_patch at document_paths.
      // Per D-12: this is NOT content validation — it's a pre-execution instruction reminder.
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
      const rawContinuity = getSessionContinuity(sessionID)
      const continuity = rawContinuity
        ? await enrichContinuityWithTracker(rawContinuity, deps.projectRoot)
        : undefined
      const lifecycle = lifecycleManager?.getLifecycleSnapshot(sessionID)
      const gov = lastGovResult.get(sessionID) ?? { warnings: [], escalations: [], blocks: [] }
      lastGovResult.delete(sessionID)

      // Re-evaluate tool intelligence decision for metadata (non-blocking, for observability)
      const delegationAfter = getDelegationMeta(sessionID)
      const agentNameAfter = delegationAfter?.agent ?? "unknown"
      const tiEngineAfter = getToolIntelligenceEngine()
      const recentToolNamesAfter = Object.entries(stats?.byTool ?? {})
        .flatMap(([tool, count]) => Array(count).fill(tool))
        .slice(-10)
      const tiDecisionAfter = tiEngineAfter.evaluateToolCall({
        sessionID,
        agentName: agentNameAfter,
        toolName: asString(getNestedValue(input, ["tool"])) ?? "unknown",
        args: {},
        callID: `${sessionID}-after`,
        delegationDepth: delegationAfter?.depth ?? 0,
        isChildSession: (delegationAfter?.depth ?? 0) > 0,
        recentToolSequence: recentToolNamesAfter,
      })

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
          governance: gov,
          toolIntelligence: {
            kind: tiDecisionAfter.kind,
            reason: tiDecisionAfter.reason,
            toolCategory: tiDecisionAfter.toolCategory,
            fromCapabilityBaseline: tiDecisionAfter.fromCapabilityBaseline,
            timestamp: tiDecisionAfter.timestamp,
          },
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
