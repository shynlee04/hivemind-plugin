/**
 * declare_intent — Unlock session by declaring work mode and focus.
 *
 * Agent Thought: "I want to start working on something"
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 2 args, system handles state machine + file writes
 *   2. Context Inference — session ID from context, governance mode from config
 *   3. Signal-to-Noise — 1-line output
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — idempotent, safe to call repeatedly
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  createBrainState,
  generateSessionId,
  unlockSession,
  resetComplexityNudge,
} from "../schemas/brain-state.js"
import type { SessionMode } from "../schemas/brain-state.js"
import {
  writeActiveMd,
  readActiveMd,
  initializePlanningDirectory,
} from "../lib/planning-fs.js"

const VALID_MODES: SessionMode[] = ["plan_driven", "quick_fix", "exploration"]

export function createDeclareIntentTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Unlock the session by declaring your work mode and focus. " +
      "Call this before doing any work to set your intent.",
    args: {
      mode: tool.schema
        .enum(VALID_MODES)
        .describe("How are you approaching this work? plan_driven | quick_fix | exploration"),
      focus: tool.schema
        .string()
        .describe("What are you working on? (1 sentence)"),
      reason: tool.schema
        .string()
        .optional()
        .describe("Why this mode? (optional context)"),
    },
    async execute(args) {
      const config = await loadConfig(directory)
      const stateManager = createStateManager(directory)

      // Ensure planning directory exists
      await initializePlanningDirectory(directory)

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config, args.mode)
      }

      // Unlock session
      state = unlockSession(state)
      state.session.mode = args.mode
      state.hierarchy.trajectory = args.focus

      // Reset complexity nudge on new intent declaration
      state = resetComplexityNudge(state)

      // Save state
      await stateManager.save(state)

      // Update active.md with session info
      const activeMd = await readActiveMd(directory)
      activeMd.frontmatter = {
        session_id: state.session.id,
        mode: args.mode,
        governance_status: "OPEN",
        start_time: state.session.start_time,
        last_updated: Date.now(),
      }
      activeMd.body = [
        "# Active Session",
        "",
        "## Current Focus",
        `**Mode**: ${args.mode}`,
        `**Focus**: ${args.focus}`,
        args.reason ? `**Reason**: ${args.reason}` : "",
        "",
        "## Completed",
        "<!-- Items marked [x] get archived -->",
        "",
        "## Notes",
        "<!-- Scratchpad - anything goes -->",
      ]
        .filter(Boolean)
        .join("\n")

      await writeActiveMd(directory, activeMd)

      return `Session: "${args.focus}". Mode: ${args.mode}. Status: OPEN.`
    },
  })
}
