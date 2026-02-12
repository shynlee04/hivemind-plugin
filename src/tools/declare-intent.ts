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
 *
 * Hierarchy Redesign Changes:
 *   - Creates root node in hierarchy tree (hierarchy.json)
 *   - Instantiates per-session file from template ({stamp}.md)
 *   - Registers session in manifest (sessions/manifest.json)
 *   - Still updates legacy active.md for backward compat
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { existsSync } from "fs"
import { writeFile } from "fs/promises"
import { join } from "path"
import { stringify } from "yaml"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  createBrainState,
  generateSessionId,
  unlockSession,
  resetComplexityNudge,
} from "../schemas/brain-state.js"
import type { SessionMode } from "../schemas/brain-state.js"
import {
  initializePlanningDirectory,
  instantiateSession,
  registerSession,
  getPlanningPaths,
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
      if (!args.focus?.trim()) return "ERROR: focus cannot be empty. Describe what you're working on."

      const configPath = join(directory, ".hivemind", "config.json")
      if (!existsSync(configPath)) {
        return [
          "ERROR: HiveMind is not configured for this project.",
          "Run setup first:",
          "  npx hivemind-context-governance",
          "Then call declare_intent again.",
        ].join("\n")
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
      const sessionFileName = `${stamp}.md`
      const hierarchyBody = toActiveMdBody(tree)
      const sessionContent = instantiateSession({
        sessionId: state.session.id,
        stamp,
        mode: args.mode,
        governanceStatus: "OPEN",
        created: now.getTime(),
        hierarchyBody,
      })

      // Write per-session file
      const paths = getPlanningPaths(directory)
      await writeFile(join(paths.sessionsDir, sessionFileName), sessionContent)

      // Register in manifest
      await registerSession(directory, stamp, sessionFileName)

      // === Legacy active.md: Update for backward compat ===
      const legacyFrontmatter = {
        session_id: state.session.id,
        stamp,
        mode: args.mode,
        governance_status: "OPEN",
        start_time: state.session.start_time,
        last_updated: Date.now(),
        date: state.session.date,
        meta_key: state.session.meta_key,
        role: state.session.role,
        by_ai: state.session.by_ai,
      }
      const legacyBody = [
        "# Active Session",
        "",
        "## Current Focus",
        `**Mode**: ${args.mode}`,
        `**Focus**: ${args.focus}`,
        args.reason ? `**Reason**: ${args.reason}` : "",
        "",
        "## Plan",
        `- [ ] ${args.focus}`,
        "",
        "## Completed",
        "<!-- Items marked [x] get archived -->",
        "",
        "## Notes",
        "<!-- Scratchpad - anything goes -->",
      ]
        .filter(Boolean)
        .join("\n")

      const legacyContent = `---\n${stringify(legacyFrontmatter)}---\n\n${legacyBody}`
      await writeFile(paths.activePath, legacyContent)

      let response = `Session: "${args.focus}". Mode: ${args.mode}. Status: OPEN. Stamp: ${stamp}.`
      if (oldTrajectory && oldTrajectory !== args.focus) {
        response += `\n⚠ Previous trajectory replaced: "${oldTrajectory}"`
      }
      response += `\n→ Use map_context to break this into tactics and actions.`
      return response
    },
  })
}
