/**
 * self_rate — Session health rating tool.
 *
 * Allows the agent to rate its own performance during a session.
 * Ratings are stored in brain state metrics and can trigger warnings
 * for low scores.
 *
 * Design:
 *   1. Iceberg — minimal args (score 1-10, optional reason)
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — structured output with rating feedback
 *   4. HC5 Compliance — JSON output for machine parsing
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import { addSelfRating } from "../schemas/brain-state.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export function createSelfRateTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Rate session health (1-10). Low scores trigger compact_session suggestion. " +
      "Use to track progress and detect context drift.",
    args: {
      score: tool.schema
        .number()
        .int()
        .min(1)
        .max(10)
        .describe("Rating score (1=bad, 10=excellent)"),
      reason: tool.schema
        .string()
        .optional()
        .describe("Optional reason for the rating"),
      turn_context: tool.schema
        .string()
        .optional()
        .describe("Optional context about current work"),
    },
    async execute(args, _context) {
      const stateManager = createStateManager(directory)
      const state = await stateManager.load()

      if (!state) {
        return toErrorOutput("No active session. Run declare_intent first.")
      }

      // Add rating to brain state
      const ratingData: { score: number; reason?: string; turn_context?: string } = {
        score: args.score,
      }
      if (args.reason) ratingData.reason = args.reason
      if (args.turn_context) ratingData.turn_context = args.turn_context

      const updatedState = addSelfRating(state, ratingData)
      await stateManager.save(updatedState)

      // Build response message
      const turnNum = updatedState.metrics.turn_count
      const isLowScore = args.score <= 3
      const isHighScore = args.score >= 7

      let message = `Rating recorded: ${args.score}/10 (turn ${turnNum})`
      if (args.reason) {
        message += `\nReason: ${args.reason}`
      }

      // Add feedback based on score
      let feedback = ""
      if (isLowScore) {
        feedback = `\n⚠️ Low score detected. Consider using compact_session to reset context.`
      } else if (isHighScore) {
        feedback = `\n✅ Good progress! Keep up the momentum.`
      } else {
        feedback = `\n👍 Rating noted. Continue monitoring session health.`
      }

      return toSuccessOutput(message + feedback, updatedState.session.id, {
        score: args.score,
        turn_number: turnNum,
        reason: args.reason,
        low_score_warning: isLowScore,
      })
    },
  })
}
