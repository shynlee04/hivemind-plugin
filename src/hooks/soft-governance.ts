/**
 * Soft Governance Hook — Counter/Detection Engine.
 *
 * Fires after EVERY tool call (tool.execute.after).
 * Responsibilities:
 *   - Increment turn count + track tool health
 *   - Classify tool type (read/write/query/governance)
 *   - Track consecutive failures + section repetition
 *   - Scan tool output for stuck/confused keywords
 *   - Detect governance violations (write in LOCKED)
 *   - Chain break, drift, and long session detection
 *   - Write ALL counters to brain.json.metrics
 *
 * This hook does NOT transform prompts — it stores signals for
 * session-lifecycle.ts (system.transform) to compile on next turn.
 *
 * P3: try/catch — never break tool execution
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { addViolationCount, incrementTurnCount, setLastCommitSuggestionTurn, addCycleLogEntry } from "../schemas/brain-state.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { shouldSuggestCommit } from "../lib/commit-advisor.js"
import { detectLongSession } from "../lib/long-session.js"
import {
  classifyTool,
  incrementToolType,
  trackToolResult,
  scanForKeywords,
  addKeywordFlags,
  createDetectionState,
  type DetectionState,
} from "../lib/detection.js"

/**
 * Creates the soft governance hook for tool execution tracking.
 *
 * This is the COUNTER engine. It fires after every tool call and writes
 * detection state to brain.json.metrics. The session-lifecycle hook then
 * reads these counters and compiles signals into prompt warnings.
 */
export function createSoftGovernanceHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory)

  return async (
    input: {
      tool: string
      sessionID: string
      callID: string
    },
    _output: {
      title: string
      output: string
      metadata: any
    }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      const state = await stateManager.load()
      if (!state) {
        await log.warn("Soft governance: no brain state found")
        return
      }

      // Increment turn count for every tool call
      let newState = incrementTurnCount(state)

      // Check for drift (high turns without context update)
      const driftWarning = newState.metrics.turn_count >= config.max_turns_before_warning &&
                           newState.metrics.drift_score < 50

      // === Detection Engine: Tool Classification ===
      const toolCategory = classifyTool(input.tool)

      // Get or initialize detection state from brain.json.metrics
      let detection: DetectionState = {
        consecutive_failures: newState.metrics.consecutive_failures ?? 0,
        consecutive_same_section: newState.metrics.consecutive_same_section ?? 0,
        last_section_content: newState.metrics.last_section_content ?? "",
        tool_type_counts: newState.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
        keyword_flags: newState.metrics.keyword_flags ?? [],
      }

      // Increment tool type counter
      detection = {
        ...detection,
        tool_type_counts: incrementToolType(detection.tool_type_counts, toolCategory),
      }

      // Track tool result (success inferred — hook fires means no exception)
      detection = trackToolResult(detection, true)

      // Scan tool output for stuck/confused keywords
      const outputText = _output.output ?? ""
      const newKeywords = scanForKeywords(outputText, detection.keyword_flags)
      if (newKeywords.length > 0) {
        detection = addKeywordFlags(detection, newKeywords)
        await log.debug(`Detection: keyword flags detected: ${newKeywords.join(", ")}`)
      }

      // === Write detection state back into brain.json.metrics ===
      newState = {
        ...newState,
        metrics: {
          ...newState.metrics,
          consecutive_failures: detection.consecutive_failures,
          consecutive_same_section: detection.consecutive_same_section,
          last_section_content: detection.last_section_content,
          tool_type_counts: detection.tool_type_counts,
          keyword_flags: detection.keyword_flags,
        },
      }

      // === Governance Violations ===
      const isIgnoredTool = shouldTrackAsViolation(input.tool, state.session.governance_mode)

      if (isIgnoredTool && state.session.governance_status === "LOCKED") {
        // Agent is trying to use tools when session is LOCKED
        newState = addViolationCount(newState)
        await log.warn(
          `Governance violation: tool '${input.tool}' used in LOCKED session. Violation count: ${newState.metrics.violation_count}`
        )
      }

      // Track tool call health (success rate)
      newState = trackToolHealth(newState, true)

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
      }

      // Long session detection
      const longSession = detectLongSession(newState, config.auto_compact_on_turns);
      if (longSession.isLong) {
        await log.warn(longSession.suggestion);
      }

      // === Cycle Intelligence: Auto-capture Task tool returns ===
      if (input.tool === "task") {
        const taskOutput = _output.output ?? "";
        newState = addCycleLogEntry(newState, input.tool, taskOutput);
        if (newState.pending_failure_ack) {
          await log.warn(
            `Cycle intelligence: subagent reported failure signals. pending_failure_ack set. Agent must call export_cycle or map_context(blocked) to acknowledge.`
          );
        }
        await log.debug(`Cycle intelligence: auto-captured Task return (${taskOutput.length} chars, failure=${newState.pending_failure_ack})`);
      }

      // Single save at the end
      await stateManager.save(newState)

      // Log drift warnings if detected
      if (driftWarning) {
        await log.warn(
          `Drift detected: ${newState.metrics.turn_count} turns without context update. Use map_context to re-focus.`
        )
      }

      await log.debug(
        `Soft governance: tracked ${input.tool} (${toolCategory}), turns=${newState.metrics.turn_count}, violations=${newState.metrics.violation_count}`
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
  if (governanceMode === "strict") {
    return toolName === "write" || toolName === "edit"
  }
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