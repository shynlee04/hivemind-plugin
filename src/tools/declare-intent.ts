/**
 * Backward-compatible declare_intent tool wrapper.
 *
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-session.ts.
 *
 * @deprecated Use createHivemindSessionTool with action: "start" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { startSession } from "../lib/session-engine.js"
import type { SessionMode } from "../schemas/brain-state.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import { loadTrajectory, saveTrajectory } from "../lib/graph-io.js"
import {
  createNode,
  createTree,
  generateStamp,
  saveTree,
  setRoot,
  toActiveMdBody,
} from "../lib/hierarchy-tree.js"
import { createStateManager } from "../lib/persistence.js"
import { readManifest, writeManifest, instantiateSession } from "../lib/planning-fs.js"
import { getEffectivePaths } from "../lib/paths.js"
import { writeFile, mkdir } from "fs/promises"
import { dirname, join } from "path"

/**
 * @deprecated Use createHivemindSessionTool with action: "start" instead.
 * Creates a backward-compatible declare_intent tool.
 * Maps to hivemind_session action: "start".
 */
export function createDeclareIntentTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Declare session intent. Use hivemind_session action: start instead.",
    args: {
      mode: tool.schema
        .enum(["plan_driven", "quick_fix", "exploration"])
        .optional()
        .describe("Session mode"),
      focus: tool.schema
        .string()
        .optional()
        .describe("Primary focus/goals"),
    },
    async execute(args, _context) {
      const result = await startSession(directory, {
        mode: args.mode as SessionMode | undefined,
        focus: args.focus,
      })

      // Handle "session already active" - still create/update hierarchy tree
      // This is expected behavior when initProject creates an initial brain state
      if (!result.success && result.error === "session already active") {
        const sessionId = result.data.activeSession as string
        const focus = args.focus || (result.data.focus as string) || ""

        // Create/update hierarchy tree even when session exists
        const now = new Date()
        const stamp = generateStamp(now)
        const rootNode = createNode("trajectory", focus, "active", now)
        let tree = createTree()
        tree = setRoot(tree, rootNode)
        await saveTree(directory, tree)

        // Update brain state hierarchy
        const stateManager = createStateManager(directory)
        const state = await stateManager.load()
        if (state) {
          state.hierarchy.trajectory = focus
          state.hierarchy.tactic = ""
          state.hierarchy.action = ""
          await stateManager.save(state)
        }

        // Ensure session is registered in manifest and create session file
        const manifest = await readManifest(directory)
        const existingEntry = manifest.sessions.find(s => s.stamp === stamp)
        if (!existingEntry) {
          const sessionFileName = `${stamp}.md`
          
          // Create the session file
          const hierarchyBody = toActiveMdBody(tree)
          const sessionContent = instantiateSession({
            sessionId,
            stamp,
            mode: args.mode || "plan_driven",
            governanceStatus: "OPEN",
            created: now.getTime(),
            trajectory: focus,
            hierarchyBody,
          })
          
          const effective = getEffectivePaths(directory)
          const sessionFilePath = join(effective.activeDir, sessionFileName)
          await mkdir(dirname(sessionFilePath), { recursive: true })
          await writeFile(sessionFilePath, sessionContent)
          
          // Update manifest
          manifest.sessions.push({
            stamp,
            file: sessionFileName,
            status: "active",
            created: now.getTime(),
            mode: args.mode,
            trajectory: focus,
            linked_plans: [],
          })
          manifest.active_stamp = stamp
          await writeManifest(directory, manifest)
        }

        // Sync trajectory to graph (use proper UUID format)
        let trajectory = await loadTrajectory(directory)
        const nowIso = now.toISOString()
        // Use proper UUID for trajectory/session IDs
        const trajectoryId = crypto.randomUUID()
        const graphSessionId = crypto.randomUUID()
        if (!trajectory || !trajectory.trajectory) {
          trajectory = {
            version: "1.0.0",
            trajectory: {
              id: trajectoryId,
              session_id: graphSessionId,
              active_plan_id: null,
              active_phase_id: null,
              active_task_ids: [],
              intent: focus,
              created_at: nowIso,
              updated_at: nowIso,
            },
          }
        } else {
          trajectory.trajectory.intent = focus
          trajectory.trajectory.updated_at = nowIso
        }
        await saveTrajectory(directory, trajectory)

        return toSuccessOutput(
          "Session intent declared (existing session)",
          sessionId,
          {
            ...result.data,
            focus,
            existingSession: true,
          }
        )
      }

      if (!result.success) {
        return toErrorOutput(result.error || "Failed to start session")
      }

      // Sync trajectory to graph (same as hivemind-session.ts)
      if (result.data.sessionId) {
        let trajectory = await loadTrajectory(directory)
        const now = new Date().toISOString()

        if (!trajectory || !trajectory.trajectory) {
          trajectory = {
            version: "1.0.0",
            trajectory: {
              id: result.data.sessionId as string,
              session_id: result.data.sessionId as string,
              active_plan_id: null,
              active_phase_id: null,
              active_task_ids: [],
              intent: args.focus || "",
              created_at: now,
              updated_at: now,
            },
          }
        } else {
          trajectory.trajectory.intent = args.focus || ""
          trajectory.trajectory.active_plan_id = null
          trajectory.trajectory.active_phase_id = null
          trajectory.trajectory.active_task_ids = []
          trajectory.trajectory.updated_at = now
        }

        await saveTrajectory(directory, trajectory)
      }

      return toSuccessOutput(
        "Session started (declare_intent)",
        result.data.sessionId as string | undefined,
        result.data
      )
    },
  })
}