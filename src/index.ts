/**
 * HiveMind Context Governance — OpenCode Plugin Entry Point
 *
 * Context-aware governance layer that prevents drift and manages
 * session state across lifecycles. 3 tools, 3 hooks, configurable modes.
 *
 * CRITICAL: NO console.log anywhere — breaks TUI rendering.
 */

import type { Plugin } from "@opencode-ai/plugin"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { createLogger } from "./lib/logging.js"
import { loadConfig } from "./lib/persistence.js"
import {
  createToolGateHook,
  createSessionLifecycleHook,
  createCompactionHook,
} from "./hooks/index.js"
import {
  createDeclareIntentTool,
  createMapContextTool,
  createCompactSessionTool,
  createSelfRateTool,
} from "./tools/index.js"
import { createStateManager } from "./lib/persistence.js"
import { trackToolCall, addSentimentSignals } from "./schemas/brain-state.js"
import { detectSentiment } from "./lib/sentiment.js"
import { checkRefreshTrigger } from "./lib/context-refresh.js"

/**
 * Plugin factory — hook factory pattern with captured state.
 *
 * GUARD: If .opencode/planning/ doesn't exist, the plugin was not initialized.
 * Return empty hooks to avoid zombie directory creation.
 * The user must run `hivemind init` first.
 */
const hivemind: Plugin = async ({ directory }) => {
  // Init guard: skip if not initialized
  const planningDir = join(directory, ".opencode", "planning")
  if (!existsSync(planningDir)) {
    return {}
  }

  const log = await createLogger(
    join(directory, ".opencode", "planning", "logs"),
    "hivemind-core"
  )

  await log.info(`HiveMind loaded for ${directory}`)

  // Load config
  const config = await loadConfig(directory)

  // Create hook instances
  const toolGateHook = createToolGateHook(log, directory, config)
  const sessionLifecycleHook = createSessionLifecycleHook(
    log,
    directory,
    config
  )
  const compactionHook = createCompactionHook(log, directory)

  // Create tool instances with directory bound via closure
  const declare_intent = createDeclareIntentTool(directory)
  const map_context = createMapContextTool(directory)
  const compact_session = createCompactSessionTool(directory)
  const self_rate = createSelfRateTool(directory)

  return {
    /**
     * Session lifecycle events.
     */
    event: async ({ event }) => {
      try {
        await log.info(`event: ${event.type}`)
      } catch {
        // P3: Never crash on event handling
      }
    },

    /**
     * Tool gate — configurable governance enforcement.
     * Logs warnings/errors based on governance mode.
     * Uses soft enforcement — log, don't hard-block.
     */
    "tool.execute.before": async (input) => {
      const result = await toolGateHook({
        sessionID: input.sessionID,
        tool: input.tool,
      })

      if (!result.allowed) {
        await log.warn(
          `GOVERNANCE BLOCK: ${result.error ?? "Operation blocked."} (tool: ${input.tool})`
        )
      }

      if (result.warning) {
        await log.warn(result.warning)
      }
    },

    /**
     * Tool execution tracking — auto-rating on completion.
     * Tracks successful tool calls for auto-health calculation.
     */
    "tool.execute.after": async (_input) => {
      try {
        const stateManager = createStateManager(directory)
        let state = await stateManager.load()
        
        if (state) {
          // Track successful tool call
          state = trackToolCall(state, true)
          await stateManager.save(state)
          
          // Log health score periodically (every 10 calls)
          if (state.metrics.total_tool_calls % 10 === 0) {
            await log.info(
              `[AutoHealth] Score: ${state.metrics.auto_health_score}/100 (${state.metrics.successful_tool_calls}/${state.metrics.total_tool_calls} successful)`
            )
          }
        }
      } catch {
        // P3: Never crash on tracking
      }
    },

    /**
     * System prompt — injects hierarchy + governance status.
     * Budget: ≤250 tokens. ADD, not REPLACE.
     * Also performs sentiment detection on user messages.
     */
    "experimental.chat.system.transform": async (
      input: { sessionID: string; message?: string },
      output: { system: string[] }
    ) => {
      await sessionLifecycleHook(input, output)
      
      // Sentiment detection on user message
      try {
        if (input.message) {
          const stateManager = createStateManager(directory)
          let state = await stateManager.load()
          
          if (state) {
            const signals = detectSentiment(
              input.message,
              state.metrics.turn_count,
              "user"
            )
            
            if (signals.length > 0) {
              state = addSentimentSignals(state, signals)
              await stateManager.save(state)
              
              await log.info(
                `[Sentiment] Detected ${signals.length} signals: ${signals.map((s) => s.type).join(", ")}`
              )
              
              // Check if refresh trigger threshold reached
              const refreshCheck = checkRefreshTrigger(state)
              if (refreshCheck.shouldRefresh) {
                await log.warn(refreshCheck.message)
              }
            }
          }
        }
      } catch {
        // P3: Never crash on sentiment detection
      }
    },

    /**
     * Compaction — preserves hierarchy context across LLM compaction.
     * Budget: ≤500 tokens.
     */
    "experimental.session.compacting": async (
      input: { sessionID: string },
      output: { context: string[] }
    ) => {
      await compactionHook(input, output)
    },

    /**
     * 4 lifecycle tools:
     *   declare_intent — unlock session, set mode/focus
     *   map_context — update hierarchy level
     *   compact_session — archive + reset
     *   self_rate — agent self-assessment
     */
    tool: {
      declare_intent,
      map_context,
      compact_session,
      self_rate,
    },
  }
}

export default hivemind
