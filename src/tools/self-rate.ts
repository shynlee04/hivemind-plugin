/**
 * self_rate — Agent self-assessment tool for drift detection.
 *
 * Agent Thought: "How well am I doing? Let me rate my performance."
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 1-3 args, system handles storage
 *   2. Context Inference — turn number from state
 *   3. Signal-to-Noise — 1-line output
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — safe to call multiple times
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import { addSelfRating } from "../schemas/brain-state.js"
import { createLogger } from "../lib/logging.js"
import { join } from "node:path"

export function createSelfRateTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Rate your own performance on the current task. " +
      "Call this periodically to help detect drift and track progress.",
    args: {
      score: tool.schema
        .number()
        .min(1)
        .max(10)
        .describe("Your self-assessment score from 1-10 (10 = excellent)"),
      reason: tool.schema
        .string()
        .optional()
        .describe("Why you gave this score (optional)"),
      turn_context: tool.schema
        .string()
        .optional()
        .describe("What you're working on right now (optional)"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory)
      const log = await createLogger(
        join(directory, ".opencode", "planning", "logs"),
        "self-rate"
      )

      // Load current state
      let state = await stateManager.load()
      if (!state) {
        return "ERROR: No active session. Call declare_intent first."
      }

      // Add the rating
      state = addSelfRating(state, {
        score: args.score,
        reason: args.reason,
        turn_context: args.turn_context,
      })

      // Save state
      await stateManager.save(state)

      // Log to TUI
      const turnNumber = state.metrics.turn_count
      const logMessage = `[SelfRate] Turn ${turnNumber}: ${args.score}/10`
      await log.info(logMessage)

      // Build response
      let response = `Rating recorded: ${args.score}/10 at turn ${turnNumber}`
      if (args.reason) {
        response += ` — "${args.reason}"`
      }

      // Provide feedback based on score
      if (args.score <= 3) {
        response += "\n⚠️ Low score detected. Consider using compact_session to reset context."
      } else if (args.score <= 7) {
        response += "\n💡 Score suggests some drift. Consider map_context to refocus."
      } else {
        response += "\n✅ Good progress!"
      }

      return response
    },
  })
}
