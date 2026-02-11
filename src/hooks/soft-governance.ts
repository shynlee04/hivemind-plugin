/**
 * Soft Governance Hook — Track compliance and provide guidance.
 *
 * Handles:
 *   - Tool execution tracking (tool.execute.after)
 *   - Violation detection (ignoring governance)
 *   - Drift monitoring
 *   - Notification preparation
 *
 * P3: try/catch — never break tool execution
 * P5: State management via stateManager
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { createStateManager } from "../lib/persistence.js"
import { addViolationCount, incrementTurnCount, setLastCommitSuggestionTurn } from "../schemas/brain-state.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { shouldSuggestCommit } from "../lib/commit-advisor.js"

/**
 * Creates the soft governance hook for tool execution tracking.
 *
 * Tracks tool calls and detects governance violations:
 *   - High turn count without context updates (drift)
 *   - Repeated violations of governance mode
 *   - Ignoring session status warnings
 */
export function createSoftGovernanceHook(
  log: Logger,
  directory: string,
  config: HiveMindConfig
) {
  const stateManager = createStateManager(directory)
  const MAX_TURNS_BEFORE_WARNING = 5

  return async (
    input: {
      tool: string
      sessionID: string
      callID: string
      args?: Record<string, any>
    },
    _output: {
      title: string
      output: string
      metadata: any
    }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      const state = await stateManager.load()
      if (!state) {
        await log.warn("Soft governance: no brain state found")
        return
      }

      // Increment turn count for every tool call
      let newState = incrementTurnCount(state)

      // Check for drift (high turns without context update)
      const driftWarning = newState.metrics.turn_count >= MAX_TURNS_BEFORE_WARNING &&
                           newState.metrics.drift_score < 50

      // Detect violations based on governance mode
      // In strict mode, certain patterns indicate violations
      const isIgnoredTool = shouldTrackAsViolation(input.tool, state.session.governance_mode)

      if (isIgnoredTool && state.session.governance_status === "LOCKED") {
        // Agent is trying to use tools when session is LOCKED
        newState = addViolationCount(newState)
        await log.warn(
          `Governance violation: tool '${input.tool}' used in LOCKED session. Violation count: ${newState.metrics.violation_count}`
        )
      }

      // Track tool call (success inferred - hook called means no exception)
      newState = trackToolHealth(newState, true)

      // Save updated state
      await stateManager.save(newState)

      // Chain break logging
      const chainBreaks = detectChainBreaks(newState);
      if (chainBreaks.length > 0) {
        await log.warn(
          `Chain breaks: ${chainBreaks.map(b => b.message).join("; ")}`
        );
      }

      // Track commit suggestion timing
      const commitSuggestion = shouldSuggestCommit(newState, config.commit_suggestion_threshold);
      if (commitSuggestion) {
        newState = setLastCommitSuggestionTurn(newState, newState.metrics.turn_count);
        await stateManager.save(newState);
      }

      // Log drift warnings if detected
      if (driftWarning) {
        await log.warn(
          `Drift detected: ${newState.metrics.turn_count} turns without context update. Use map_context to re-focus.`
        )
      }

      await log.debug(
        `Soft governance: tracked ${input.tool}, turns=${newState.metrics.turn_count}, violations=${newState.metrics.violation_count}`
      )
    } catch (error) {
      // P3: Never break tool execution
      await log.error(`Soft governance hook error: ${error}`)
    }
  }
}

/**
 * Determines if a tool usage should be tracked as a governance violation.
 *
 * Certain tools indicate the agent is ignoring governance:
 *   - write/edit tools when session is LOCKED (should use declare_intent first)
 *   - Repeated tool calls without any map_context updates
 */
function shouldTrackAsViolation(toolName: string, governanceMode: string): boolean {
  // In strict mode, writing/editing without declaring intent is a violation
  if (governanceMode === "strict") {
    const writeEditTools = ["write", "edit", "replace"]
    return writeEditTools.some(t => toolName.toLowerCase().includes(t))
  }

  // In assisted/permissive mode, no hard violations
  return false
}

/**
 * Track tool health metrics (success rate).
 */
function trackToolHealth(state: any, success: boolean): any {
  const total = state.metrics.total_tool_calls + 1
  const successful = success
    ? state.metrics.successful_tool_calls + 1
    : state.metrics.successful_tool_calls
  const healthScore = total > 0 ? Math.round((successful / total) * 100) : 100

  return {
    ...state,
    metrics: {
      ...state.metrics,
      total_tool_calls: total,
      successful_tool_calls: successful,
      auto_health_score: healthScore,
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  }
}