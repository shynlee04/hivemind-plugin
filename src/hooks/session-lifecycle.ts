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
import {
  archiveSession,
  initializePlanningDirectory,
  readActiveMd,
  resetActiveMd,
  updateIndexMd,
} from "../lib/planning-fs.js"
import { isSessionStale } from "../lib/staleness.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { loadAnchors, formatAnchorsForPrompt } from "../lib/anchors.js"
import { loadMems, formatMemsForPrompt } from "../lib/mems.js"
import { shouldSuggestCommit } from "../lib/commit-advisor.js"
import { getToolActivation } from "../lib/tool-activation.js"
import { detectLongSession } from "../lib/long-session.js"

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
    input: { sessionID?: string; model?: any },
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

      // Time-to-Stale: auto-archive if session idle > configured days
      if (state && isSessionStale(state, config.stale_session_days)) {
        try {
          const activeMd = await readActiveMd(directory);
          const archiveContent = [
            `# Auto-Archived (Stale): ${state.session.id}`,
            "",
            `**Reason**: Session idle > ${config.stale_session_days} days`,
            `**Mode**: ${state.session.mode}`,
            `**Last Activity**: ${new Date(state.session.last_activity).toISOString()}`,
            `**Archived**: ${new Date().toISOString()}`,
            `**Turns**: ${state.metrics.turn_count}`,
            "",
            "## Session Content",
            activeMd.body,
          ].filter(Boolean).join("\n");

          const staleSessionId = state.session.id;
          await archiveSession(directory, staleSessionId, archiveContent);
          await updateIndexMd(directory, `[auto-archived: stale] ${staleSessionId}`);
          await resetActiveMd(directory);

          // Create fresh session
          const newId = generateSessionId();
          state = createBrainState(newId, config);
          await stateManager.save(state);

          await log.info(`Auto-archived stale session ${staleSessionId}`);
        } catch (archiveError) {
          await log.error(`Failed to auto-archive stale session: ${archiveError}`);
        }
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

      // Chain Break Detection
      const chainBreaks = detectChainBreaks(state);
      if (chainBreaks.length > 0) {
        lines.push("⚠ Chain breaks detected:");
        for (const brk of chainBreaks) {
          lines.push(`  - ${brk.message}`);
        }
      }

      // Inject immutable anchors
      const anchorsState = await loadAnchors(directory);
      const anchorsPrompt = formatAnchorsForPrompt(anchorsState);
      if (anchorsPrompt) {
        lines.push(anchorsPrompt);
      }

      // Mems Brain count
      const memsState = await loadMems(directory)
      const memsPrompt = formatMemsForPrompt(memsState)
      if (memsPrompt) {
        lines.push(memsPrompt)
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

      // Commit suggestion
      const commitSuggestion = shouldSuggestCommit(state, config.commit_suggestion_threshold);
      if (commitSuggestion) {
        lines.push(`💡 ${commitSuggestion.reason}`);
      }

      // Long session detection
      const longSession = detectLongSession(state, config.auto_compact_on_turns);
      if (longSession.isLong) {
        lines.push(`⏰ ${longSession.suggestion}`);
      }

      // Drift warning
      if (state.metrics.drift_score < 50) {
        lines.push(
          "⚠ High drift detected. Use map_context to re-focus."
        )
      }

      // Tool activation hint
      const toolHint = getToolActivation(state);
      if (toolHint) {
        lines.push(`🔧 Suggested: ${toolHint.tool} — ${toolHint.reason}`);
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
