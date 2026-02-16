/**
 * declare_intent — Unlock session by declaring work mode and focus.
 *
 * Agent Thought: "I want to start working on something"
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 2 args, system handles state machine + file writes
 *   2. Context Inference — session ID from context, governance mode from config
 *   3. Signal-to-Noise — JSON response with entity_id for FK chaining
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — idempotent, safe to call repeatedly
 *
 * Hierarchy Redesign Changes:
 *   - Creates root node in hierarchy tree (hierarchy.json)
 *   - Instantiates per-session file from template ({stamp}.md)
 *   - Registers session in manifest (sessions/manifest.json)
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { buildSessionFilename, getEffectivePaths } from "../lib/paths.js"
import {
  createBrainState,
  generateSessionId,
  unlockSession,
  resetComplexityNudge,
} from "../schemas/brain-state.js"
import type { SessionMode } from "../schemas/brain-state.js"
import {
  initializePlanningDirectory,
  generateIndexMd,
  instantiateSession,
  registerSession,
} from "../lib/planning-fs.js"
import {
  createNode,
  createTree,
  setRoot,
  saveTree,
  toActiveMdBody,
  generateStamp,
  toBrainProjection,
} from "../lib/hierarchy-tree.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

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
    async execute(args, _context) {
      if (!args.focus?.trim()) return toErrorOutput("focus cannot be empty. Describe what you're working on.")

      const configPath = getEffectivePaths(directory).config
      if (!existsSync(configPath)) {
        return toErrorOutput(
          "HiveMind is not configured for this project.",
          "Run setup: npx hivemind-context-governance, then call declare_intent again."
        )
      }

      const config = await loadConfig(directory)
      const stateManager = createStateManager(directory)

      // Ensure planning directory exists (creates templates/, manifest, etc.)
      await initializePlanningDirectory(directory)

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config, args.mode)
      }

      // Capture old trajectory before overwriting
      const oldTrajectory = state.hierarchy.trajectory

      // Unlock session
      state = unlockSession(state)
      state.session.mode = args.mode

      // === Hierarchy Tree: Create root trajectory node ===
      const now = new Date()
      const stamp = generateStamp(now)
      const rootNode = createNode("trajectory", args.focus, "active", now)
      let tree = createTree()
      tree = setRoot(tree, rootNode)

      // Save hierarchy tree to .hivemind/hierarchy.json
      await saveTree(directory, tree)

      // Project tree into flat brain.json hierarchy (backward compat)
      const projection = toBrainProjection(tree)
      state.hierarchy = { ...state.hierarchy, ...projection }

      // Reset complexity nudge on new intent declaration
      state = resetComplexityNudge(state)

      // Save state
      await stateManager.save(state)

      // === Per-session file: Instantiate from template ===
      const sessionFileName = buildSessionFilename(now, args.mode, args.focus)
      const hierarchyBody = toActiveMdBody(tree)
      const sessionContent = instantiateSession({
        sessionId: state.session.id,
        stamp,
        mode: args.mode,
        governanceStatus: "OPEN",
        created: now.getTime(),
        trajectory: args.focus,
        linkedPlans: [],
        turns: state.metrics.turn_count,
        drift: state.metrics.drift_score,
        hierarchyBody,
      })

      // Write per-session file
      await writeFile(join(getEffectivePaths(directory).activeDir, sessionFileName), sessionContent)

      // Register in manifest
      await registerSession(directory, stamp, sessionFileName, {
        created: now.getTime(),
        mode: args.mode,
        trajectory: args.focus,
      })

      await generateIndexMd(directory)

      let message = `Session intent declared: ${args.mode} mode, focus: "${args.focus}". Status: OPEN.`
      if (oldTrajectory && oldTrajectory !== args.focus) {
        message += ` Previous trajectory replaced: "${oldTrajectory}".`
      }
      message += " Use map_context to break this into tactics and actions."
      return toSuccessOutput(message, state.session.id)
    },
  })
}
