/**
 * map_context — Update focus in the 3-level hierarchy.
 *
 * Agent Thought: "I need to update what I'm focused on"
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 2 args, system handles hierarchy state + file sync
 *   2. Context Inference — reads current hierarchy from brain state
 *   3. Signal-to-Noise — 1-line output with visual beacon
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — can update different levels independently
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import {
  resetTurnCount,
  updateHierarchy,
} from "../schemas/brain-state.js"
import type { HierarchyLevel, ContextStatus } from "../schemas/hierarchy.js"
import {
  readActiveMd,
  writeActiveMd,
  updateIndexMd,
} from "../lib/planning-fs.js"

const VALID_LEVELS: HierarchyLevel[] = ["trajectory", "tactic", "action"]
const VALID_STATUSES: ContextStatus[] = ["pending", "active", "complete", "blocked"]

export function createMapContextTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Update your current focus in the 3-level hierarchy. " +
      "Call this when changing what you're working on.",
    args: {
      level: tool.schema
        .enum(VALID_LEVELS)
        .describe("Which level to update: trajectory | tactic | action"),
      content: tool.schema
        .string()
        .describe("The new focus (1-2 sentences)"),
      status: tool.schema
        .enum(VALID_STATUSES)
        .optional()
        .describe("Status of this context item (default: active)"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory)
      const status = args.status ?? "active"

      // Load brain state
      let state = await stateManager.load()
      if (!state) {
        return "ERROR: No active session. Call declare_intent first."
      }

      // Update hierarchy
      state = updateHierarchy(state, { [args.level]: args.content })

      // Reset turn count on context update (re-engagement signal)
      state = resetTurnCount(state)

      // Save state
      await stateManager.save(state)

      // Sync to planning files
      if (args.level === "trajectory") {
        // Update index.md for trajectory-level changes
        await updateIndexMd(directory, `[${status.toUpperCase()}] ${args.content}`)
      } else {
        // Update active.md for tactic/action level changes
        const activeMd = await readActiveMd(directory)
        const levelLabel = args.level === "tactic" ? "Tactic" : "Action"
        const focusLine = `**${levelLabel}**: ${args.content} [${status.toUpperCase()}]`

        // Append to current focus section
        if (activeMd.body.includes("## Current Focus")) {
          const parts = activeMd.body.split("## Current Focus")
          const afterFocus = parts[1] || ""
          const nextSection = afterFocus.indexOf("\n## ")
          const focusContent =
            nextSection > -1 ? afterFocus.substring(0, nextSection) : afterFocus
          const rest =
            nextSection > -1 ? afterFocus.substring(nextSection) : ""

          activeMd.body =
            parts[0] +
            "## Current Focus" +
            focusContent.trimEnd() +
            "\n" +
            focusLine +
            "\n" +
            rest
        } else {
          activeMd.body += `\n## Current Focus\n${focusLine}\n`
        }

        activeMd.frontmatter.last_updated = Date.now()
        await writeActiveMd(directory, activeMd)
      }

      return `[${args.level}] "${args.content}" → ${status}`
    },
  })
}
