/**
 * Tool Gate Hook — Configurable governance enforcement.
 *
 * Intercepts tool calls and applies governance based on mode:
 *   - strict: blocks writes until declare_intent called
 *   - assisted: warns but allows
 *   - permissive: silently allows, tracks for metrics
 *
 * NOTE: In OpenCode v1.1+, tool.execute.before cannot block execution.
 * This hook provides governance through warnings and tracking only.
 *
 * P3: try/catch — never break tool execution
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import {
  isSessionLocked,
  shouldTriggerDriftWarning,
  addFileTouched,
  calculateDriftScore,
  setComplexityNudgeShown,
} from "../schemas/brain-state.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { checkComplexity } from "../lib/complexity.js"
import { detectFrameworkContext } from "../lib/framework-context.js"

/** Tools that are always allowed regardless of governance state */
const EXEMPT_TOOLS = new Set([
  // HiveMind tools (always allowed)
  "declare_intent", "map_context", "compact_session", "self_rate",
  "scan_hierarchy", "save_anchor", "think_back", "check_drift",
  "save_mem", "list_shelves", "recall_mems",
  "hierarchy_prune", "hierarchy_migrate", "export_cycle",
  // OpenCode innate read-only tools
  "read", "grep", "glob",
  // OpenCode innate utility tools (can't block these meaningfully)
  "bash", "webfetch", "task", "skill", "todowrite", "google_search",
])

/** Write/edit tools that governance should gate */
const WRITE_TOOLS = new Set([
  "write", "edit",
])

const CONFLICT_SAFE_TOOLS = new Set([
  "read", "grep", "glob",
  "declare_intent", "map_context", "compact_session", "self_rate",
  "scan_hierarchy", "save_anchor", "think_back", "check_drift",
  "save_mem", "list_shelves", "recall_mems",
  "hierarchy_prune", "hierarchy_migrate", "export_cycle",
])

function isExemptTool(toolName: string): boolean {
  return EXEMPT_TOOLS.has(toolName)
}

function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName)
}

function getFrameworkConflictLevel(config: HiveMindConfig): "warn-only" | "limited-mode" | "simulated-pause" {
  if (config.governance_mode === "permissive") {
    return "warn-only"
  }

  if (config.governance_mode === "strict" && (config.automation_level === "full" || config.automation_level === "retard")) {
    return "simulated-pause"
  }

  return "limited-mode"
}

function buildSimulatedBlockMessage(guidance: string, level: "limited-mode" | "simulated-pause", toolName: string): string {
  const modeLabel = level === "simulated-pause" ? "SIMULATED PAUSE" : "LIMITED MODE"
  return `${guidance} ${modeLabel}: execution is flagged as simulated block (no hard-deny). rollback guidance: if ${toolName} changed files, revert those edits after selecting framework metadata and rerun.`
}

export interface ToolGateResult {
  allowed: boolean
  error?: string
  warning?: string
}

/**
 * Creates the tool gate hook for OpenCode integration.
 *
 * Hook factory pattern — captures config + logger + directory.
 * Returns an OpenCode-compatible hook with correct signature.
 */
export function createToolGateHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory)

  // Internal hook logic with original signature for direct testing
  const internalHook = async (input: {
    sessionID: string
    tool: string
  }): Promise<ToolGateResult> => {
    try {
      const { tool: toolName } = input

      // Always allow exempt tools (governance tools + read-only)
      if (isExemptTool(toolName)) {
        return { allowed: true }
      }

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      // Load brain state
      let state = await stateManager.load()

      // Framework conflict gate (GOV-06/GOV-07)
      const frameworkContext = await detectFrameworkContext(directory)
      if (frameworkContext.mode === "both") {
        const selection = state?.framework_selection
        const selectedFramework = selection?.choice === "gsd" || selection?.choice === "spec-kit"
        const hasGsdSelection = selection?.choice === "gsd" && selection.active_phase.trim().length > 0
        const hasSpecSelection = selection?.choice === "spec-kit" && selection.active_spec_path.trim().length > 0
        const hasSelectionMetadata = selectedFramework && (hasGsdSelection || hasSpecSelection)
        const conflictLevel = getFrameworkConflictLevel(config)

        if (!hasSelectionMetadata) {
          const acceptedOverrideOnly = (selection?.acceptance_note?.trim().length ?? 0) > 0
          const guidanceSuffix = acceptedOverrideOnly
            ? " Override note recorded; framework selection metadata is still required."
            : ""
          const guidance = `Framework conflict: both .planning and .spec-kit detected. Consolidate first, then choose framework via locked menu metadata (active_phase or active_spec_path).${guidanceSuffix}`

          if (conflictLevel === "warn-only") {
            return {
              allowed: true,
              warning: guidance,
            }
          }

          if (!CONFLICT_SAFE_TOOLS.has(toolName)) {
            if (conflictLevel === "limited-mode" || conflictLevel === "simulated-pause") {
              const simulatedMessage = buildSimulatedBlockMessage(guidance, conflictLevel, toolName)
              return {
                allowed: true,
                warning: simulatedMessage,
              }
            }
          }
        }
      }

      // No state = no session initialized yet
      if (!state) {
        switch (config.governance_mode) {
          case "strict":
            return {
              allowed: false,
              error:
                "SESSION NOT INITIALIZED. Use 'declare_intent' to start a session.",
            }
          case "assisted":
            await log.warn(
              `Tool "${toolName}" called without session. Consider using declare_intent.`
            )
            return {
              allowed: true,
              warning: "No session initialized. Consider calling declare_intent.",
            }
          case "permissive":
            return { allowed: true }
        }
      }

      // Session is locked — governance gate
      if (state && isSessionLocked(state)) {
        switch (config.governance_mode) {
          case "strict":
            if (isWriteTool(toolName)) {
              return {
                allowed: false,
                error:
                  "SESSION LOCKED. Use 'declare_intent' to unlock before writing.",
              }
            }
            return { allowed: true }
          case "assisted":
            if (isWriteTool(toolName)) {
              await log.warn(
                `Write tool "${toolName}" used while session locked.`
              )
              return {
                allowed: true,
                warning:
                  "Session locked. Declare your intent for better tracking.",
              }
            }
            return { allowed: true }
          case "permissive":
            return { allowed: true }
        }
      }

      // Session is open — track activity (turn count incremented in tool.execute.after only)
      if (state) {
        let needsSave = false
        const projectedTurnCount = state.metrics.turn_count + 1

        // Track file touches for write tools (tool name used as proxy)
        if (isWriteTool(toolName)) {
          state = addFileTouched(state, `[via ${toolName}]`)
          needsSave = true
        }

        // Update drift score using projected turn count (matches post-tool state)
        const projectedForDrift = {
          ...state,
          metrics: {
            ...state.metrics,
            turn_count: projectedTurnCount,
          },
        }
        const projectedDriftScore = calculateDriftScore(projectedForDrift)
        if (state.metrics.drift_score !== projectedDriftScore) {
          state = {
            ...state,
            metrics: {
              ...state.metrics,
              drift_score: projectedDriftScore,
            },
          }
          needsSave = true
        }

        const driftCheckState = {
          ...state,
          metrics: {
            ...state.metrics,
            turn_count: projectedTurnCount,
          },
        }

        // Save updated state only if something changed
        if (needsSave) {
          await stateManager.save(state)
        }

        // Check drift warning
        if (
          shouldTriggerDriftWarning(
            driftCheckState,
            config.max_turns_before_warning
          )
        ) {
          await log.warn(
            `Drift warning: ${driftCheckState.metrics.turn_count} turns, score: ${driftCheckState.metrics.drift_score}/100. Consider using map_context to re-focus.`
          )

          if (config.governance_mode !== "permissive") {
            return {
              allowed: true,
              warning: `Drift detected (${state.metrics.drift_score}/100). Use map_context to re-focus.`,
            }
          }
        }

        // Check complexity and show nudge (once per session)
        const complexityCheck = checkComplexity(state)
        if (complexityCheck.isComplex && !state.complexity_nudge_shown) {
          await log.warn(
            `[Nudge] ${complexityCheck.message}`
          )
          
          // Mark nudge as shown
          state = setComplexityNudgeShown(state)
          await stateManager.save(state)
        }
      }

      return { allowed: true }
    } catch (error) {
      // P3: Never break tool execution
      await log.error(`Tool gate error: ${error}`)
      return { allowed: true }
    }
  }

  // OpenCode-compatible hook with proper signature
  // tool.execute.before receives: { tool: string, sessionID: string, callID: string }
  // and receives output: { args: any } to modify
  const outerHook = async (
    input: {
      tool: string
      sessionID: string
      callID: string
    },
    _output: {
      args: any
    }
  ): Promise<void> => {
    // Call internal hook for governance logic
    const result = await internalHook({
      sessionID: input.sessionID,
      tool: input.tool
    })

    // Log warnings/errors (we cannot block execution in OpenCode v1.1+)
    if (!result.allowed) {
      await log.error(result.error || "Tool not allowed by governance")
    } else if (result.warning) {
      await log.warn(result.warning)
    }
    // Note: We cannot block execution, only warn and track
  }

  // Expose internal hook for testing
  ;(outerHook as any).internal = internalHook

  return outerHook
}

/**
 * Creates the tool gate hook and returns its internal logic for direct testing.
 * Equivalent to createToolGateHook(log, directory, config).internal
 *
 * @deprecated Use createToolGateHook(log, directory, config).internal instead.
 */
export function createToolGateHookInternal(
  log: Logger,
  directory: string,
  config: HiveMindConfig
): (input: {
  sessionID: string
  tool: string
}) => Promise<ToolGateResult> {
  const hook = createToolGateHook(log, directory, config) as any
  return hook.internal
}
