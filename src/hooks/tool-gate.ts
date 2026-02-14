import { type Logger } from "../lib/logging.js"
import { type HiveMindConfig } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { detectFrameworkContext } from "../lib/framework-context.js"
import { addFileTouched, isSessionLocked, calculateDriftScore, shouldTriggerDriftWarning, setComplexityNudgeShown } from "../schemas/brain-state.js"
import { checkComplexity } from "../lib/complexity.js";
import { checkAndRecordToast } from "../lib/toast-throttle.js";
import { treeExists } from "../lib/hierarchy-tree.js"

// Tools exempt from governance checks (read-only or meta-tools)
const EXEMPT_TOOLS = new Set([
  "read", "glob", "grep", "ls", "cat", "find",
  "declare_intent", "map_context", "check_drift", "list_shelves", "recall_mems",
  "hivemind_inspect", "hivemind_scan", "hivemind_status", "hivemind_compact",
  "scan_hierarchy", "think_back", "self_rate", "save_mem", "save_anchor"
])

const WRITE_TOOLS = new Set([
  "write", "edit", "bash", "create_file", "delete_file", "move_file", "task",
  "replace_in_file", "append_to_file", "create_directory"
])

// Tools safe to run even during framework conflict (mostly analysis/governance)
const CONFLICT_SAFE_TOOLS = new Set([
  "read", "glob", "grep", "ls", "cat", "find",
  "hivemind_scan", "hivemind_status", "hivemind_inspect",
  "scan_hierarchy", "check_drift", "list_shelves",
  "hierarchy_manage", "export_cycle",
])

function isExemptTool(toolName: string): boolean {
  return EXEMPT_TOOLS.has(toolName)
}

function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName)
}

/**
 * Build advisory message for framework conflict.
 * Replaces pseudo-blocking language with clear guidance.
 */
function buildFrameworkAdvisory(guidance: string, toolName: string): string {
  return `Governance advisory: ${guidance} Tool '${toolName}' proceeding. Consider resolving framework selection for cleaner tracking.`
}

export interface ToolGateResult {
  allowed: boolean  // Always true - advisory only
  warning?: string
  signal?: {
    type: "governance" | "drift" | "framework" | "complexity"
    severity: "info" | "warning" | "advisory"
    message: string
  }
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

        if (!hasSelectionMetadata) {
          const acceptedOverrideOnly = (selection?.acceptance_note?.trim().length ?? 0) > 0
          const guidanceSuffix = acceptedOverrideOnly
            ? " Override note recorded; framework selection metadata is still recommended."
            : ""
          const guidance = `Framework conflict: both .planning and .spec-kit detected. Consolidate first, then choose framework via locked menu metadata (active_phase or active_spec_path).${guidanceSuffix}`

          // Advisory only - no blocking (HC1 compliance)
          if (!CONFLICT_SAFE_TOOLS.has(toolName)) {
            return {
              allowed: true,
              warning: buildFrameworkAdvisory(guidance, toolName),
              signal: {
                type: "framework",
                severity: "advisory",
                message: guidance,
              },
            }
          }
        }
      }

      // No state = no session initialized yet - Advisory only
      if (!state) {
        const hasTree = treeExists(directory)
        const msg = hasTree
          ? "No session initialized. Use declare_intent to start a tracked session."
          : "Project not scanned. Run hivemind-scan first to build context backbone."

        switch (config.governance_mode) {
          case "strict":
          case "assisted":
            // HC1 COMPLIANCE: Always allow, just advise
            return {
              allowed: true,
              warning: msg,
              signal: {
                type: "governance",
                severity: "advisory",
                message: msg,
              },
            }
          case "permissive":
            return { allowed: true }
        }
      }

      // Session is locked — governance gate - Advisory only
      if (state && isSessionLocked(state)) {
        switch (config.governance_mode) {
          case "strict":
            if (isWriteTool(toolName)) {
              // HC1 COMPLIANCE: Always allow, just advise
              return {
                allowed: true,
                warning: "Session locked. Consider using declare_intent to unlock for better tracking.",
                signal: {
                  type: "governance",
                  severity: "advisory",
                  message: "Write tool used while session locked. Declare intent for proper tracking.",
                },
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
                warning: "Session locked. Declare your intent for better tracking.",
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

        // Check drift warning - Advisory only
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
              signal: {
                type: "drift",
                severity: "warning",
                message: `High drift score. Consider map_context to realign with intent.`,
              },
            }
          }
        }

        // Check complexity and show nudge (once per session)
        const complexityCheck = checkComplexity(state)
        if (complexityCheck.isComplex && !state.complexity_nudge_shown) {
          // Throttle complexity toasts to avoid noise
          if (checkAndRecordToast("complexity", "nudge")) {
            await log.warn(
              `[Advisory] ${complexityCheck.message}`
            )
          }

          // Mark nudge as shown
          state = setComplexityNudgeShown(state)
          await stateManager.save(state)

          return {
            allowed: true,
            signal: {
              type: "complexity",
              severity: "info",
              message: complexityCheck.message,
            },
          }
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

    // Log warnings (we never block execution - HC1 compliance)
    if (result.warning) {
      await log.warn(result.warning)
    }
    if (result.signal) {
      await log.debug(`Tool gate signal: ${result.signal.type} - ${result.signal.message}`)
    }
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
