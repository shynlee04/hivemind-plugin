/**
 * Session Lifecycle Hook — Initialize/load brain state on session events.
 *
 * Handles:
 *   - Session start: load existing state or create fresh
 *   - System prompt injection: current hierarchy + governance status
 *
 * P3: try/catch — never break session lifecycle
 * P5: Config cached in closure
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { generateAgentBehaviorPrompt } from "../schemas/config.js"
import { createStateManager } from "../lib/persistence.js"
import {
  createBrainState,
  generateSessionId,
} from "../schemas/brain-state.js"
import { initializePlanningDirectory } from "../lib/planning-fs.js"

/**
 * Creates the session lifecycle hook (system prompt transform).
 *
 * Injects current session context into the system prompt:
 *   - Hierarchy state (trajectory/tactic/action)
 *   - Governance status (LOCKED/OPEN)
 *   - Session metrics (drift score, turn count)
 *
 * Budget: ≤250 tokens (~1000 chars). ADD, not REPLACE.
 */
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  config: HiveMindConfig
) {
  const stateManager = createStateManager(directory)
  const BUDGET_CHARS = 1000

  return async (
    input: { sessionID?: string },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        // First session — initialize
        await initializePlanningDirectory(directory)
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config)
        await stateManager.save(state)
      }

      const lines: string[] = []
      lines.push("<hivemind-governance>")

      // Session status
      lines.push(
        `Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`
      )

      // Hierarchy context
      if (state.hierarchy.trajectory) {
        lines.push(`Trajectory: ${state.hierarchy.trajectory}`)
      }
      if (state.hierarchy.tactic) {
        lines.push(`Tactic: ${state.hierarchy.tactic}`)
      }
      if (state.hierarchy.action) {
        lines.push(`Action: ${state.hierarchy.action}`)
      }

      // No hierarchy = prompt to declare intent
      if (
        !state.hierarchy.trajectory &&
        !state.hierarchy.tactic &&
        !state.hierarchy.action
      ) {
        if (config.governance_mode === "strict") {
          lines.push(
            "No intent declared. Use declare_intent to unlock the session before writing."
          )
        } else {
          lines.push(
            "Tip: Use declare_intent to set your work focus for better tracking."
          )
        }
      }

      // Metrics summary
      lines.push(
        `Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`
      )

      // Drift warning
      if (state.metrics.drift_score < 50) {
        lines.push(
          "⚠ High drift detected. Use map_context to re-focus."
        )
      }

      lines.push("</hivemind-governance>")

      // Inject mandatory agent behavior configuration
      const agentConfigPrompt = generateAgentBehaviorPrompt(config.agent_behavior)
      lines.push("")
      lines.push(agentConfigPrompt)

      // Budget enforcement
      let injection = lines.join("\n")
      if (injection.length > BUDGET_CHARS) {
        injection =
          injection.slice(0, BUDGET_CHARS - 30) +
          "\n</agent-configuration>"
        await log.warn(
          `System injection truncated: ${lines.join("\n").length} → ${injection.length} chars`
        )
      }

      output.system.push(injection)

      await log.debug(
        `Session lifecycle: injected ${injection.length} chars`
      )
    } catch (error) {
      // P3: Never break session lifecycle
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}
