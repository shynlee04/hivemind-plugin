/**
 * Tool Gate Hook — Configurable governance enforcement.
 *
 * Intercepts tool calls and applies governance based on mode:
 *   - strict: blocks writes until declare_intent called
 *   - assisted: warns but allows
 *   - permissive: silently allows, tracks for metrics
 *
 * P3: try/catch — never break tool execution
 * P5: Config cached in closure — single disk read on first call
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import {
  isSessionLocked,
  incrementTurnCount,
  shouldTriggerDriftWarning,
  addFileTouched,
  calculateDriftScore,
  setComplexityNudgeShown,
} from "../schemas/brain-state.js"
import { createStateManager } from "../lib/persistence.js"
import { checkComplexity } from "../lib/complexity.js"

/** Tools that are always allowed regardless of governance state */
const EXEMPT_TOOLS = new Set([
  "declare_intent",
  "map_context",
  "compact_session",
  "read",
  "grep",
  "glob",
  "find",
  "list",
  "search",
])

/** Write/edit tools that governance should gate */
const WRITE_TOOLS = new Set([
  "write",
  "edit",
  "create",
  "delete",
  "rename",
  "move",
  "patch",
])

function isExemptTool(toolName: string): boolean {
  // Check full name match
  if (EXEMPT_TOOLS.has(toolName)) return true
  // Check if tool name starts with an exempt prefix
  for (const exempt of EXEMPT_TOOLS) {
    if (toolName.startsWith(exempt)) return true
  }
  return false
}

function isWriteTool(toolName: string): boolean {
  for (const w of WRITE_TOOLS) {
    if (toolName.includes(w)) return true
  }
  return false
}

export interface ToolGateResult {
  allowed: boolean
  error?: string
  warning?: string
}

/**
 * Creates the tool gate hook.
 *
 * Hook factory pattern — captures config + logger + directory.
 */
export function createToolGateHook(
  log: Logger,
  directory: string,
  config: HiveMindConfig
) {
  const stateManager = createStateManager(directory)

  return async (input: {
    sessionID: string
    tool: string
  }): Promise<ToolGateResult> => {
    try {
      const { tool: toolName } = input

      // Always allow exempt tools (governance tools + read-only)
      if (isExemptTool(toolName)) {
        return { allowed: true }
      }

      // Load brain state
      let state = await stateManager.load()

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

      // Session is open — track activity
      if (state) {
        state = incrementTurnCount(state)

        // Track file touches for write tools (tool name used as proxy)
        if (isWriteTool(toolName)) {
          state = addFileTouched(state, `[via ${toolName}]`)
        }

        // Update drift score
        state.metrics.drift_score = calculateDriftScore(state)

        // Save updated state
        await stateManager.save(state)

        // Check drift warning
        if (
          shouldTriggerDriftWarning(
            state,
            config.max_turns_before_warning
          )
        ) {
          await log.warn(
            `Drift warning: ${state.metrics.turn_count} turns, score: ${state.metrics.drift_score}/100. Consider using map_context to re-focus.`
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
}
