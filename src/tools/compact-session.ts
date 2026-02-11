/**
 * compact_session — Archive completed work and reset for next session.
 *
 * Agent Thought: "I'm done, archive this session"
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 0-1 args, system handles archive + reset + index update
 *   2. Context Inference — reads active session from brain state
 *   3. Signal-to-Noise — 1-line summary output
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — single call, atomic archival
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  createBrainState,
  generateSessionId,
  lockSession,
} from "../schemas/brain-state.js"
import {
  readActiveMd,
  archiveSession,
  updateIndexMd,
  resetActiveMd,
  listArchives,
  getExportDir,
} from "../lib/planning-fs.js"
import { generateExportData, generateJsonExport, generateMarkdownExport } from "../lib/session-export.js"
import { loadMems, saveMems, addMem } from "../lib/mems.js"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

export function createCompactSessionTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Archive completed work and reset for next session. " +
      "Call this when you're done with your current work.",
    args: {
      summary: tool.schema
        .string()
        .optional()
        .describe("Optional 1-line summary of what was accomplished"),
    },
    async execute(args) {
      const stateManager = createStateManager(directory)
      const config = await loadConfig(directory)

      // Load brain state
      const state = await stateManager.load()
      if (!state) {
        return "ERROR: No active session to compact."
      }

      // Read current active.md content for archival
      const activeMd = await readActiveMd(directory)
      const archiveContent = [
        `# Archived Session: ${state.session.id}`,
        "",
        `**Mode**: ${state.session.mode}`,
        `**Started**: ${new Date(state.session.start_time).toISOString()}`,
        `**Archived**: ${new Date().toISOString()}`,
        `**Turns**: ${state.metrics.turn_count}`,
        `**Drift Score**: ${state.metrics.drift_score}/100`,
        `**Files Touched**: ${state.metrics.files_touched.length}`,
        `**Context Updates**: ${state.metrics.context_updates}`,
        "",
        "## Hierarchy at Archive",
        state.hierarchy.trajectory ? `- **Trajectory**: ${state.hierarchy.trajectory}` : "",
        state.hierarchy.tactic ? `- **Tactic**: ${state.hierarchy.tactic}` : "",
        state.hierarchy.action ? `- **Action**: ${state.hierarchy.action}` : "",
        "",
        "## Session Content",
        activeMd.body,
      ]
        .filter(Boolean)
        .join("\n")

      // Archive the session
      await archiveSession(directory, state.session.id, archiveContent)

      // Update index.md with summary
      const summaryLine =
        args.summary ||
        `Session ${state.session.id}: ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`
      await updateIndexMd(directory, summaryLine)

      // Generate auto-export
      try {
        const exportData = generateExportData(state, summaryLine)
        const exportDir = getExportDir(directory)
        await mkdir(exportDir, { recursive: true })

        const timestamp = new Date().toISOString().split("T")[0]
        const baseName = `session_${timestamp}_${state.session.id}`

        await writeFile(
          join(exportDir, `${baseName}.json`),
          generateJsonExport(exportData)
        )

        await writeFile(
          join(exportDir, `${baseName}.md`),
          generateMarkdownExport(exportData, activeMd.body)
        )
      } catch {
        // Export failure is non-fatal
      }

      // Auto-save session summary as a "context" mem
      try {
        let memsState = await loadMems(directory)
        const autoContent = [
          `Session ${state.session.id}:`,
          args.summary || `${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`,
          state.hierarchy.trajectory ? `Trajectory: ${state.hierarchy.trajectory}` : "",
          state.hierarchy.tactic ? `Tactic: ${state.hierarchy.tactic}` : "",
        ].filter(Boolean).join(" | ")

        memsState = addMem(
          memsState,
          "context",
          autoContent,
          ["auto-compact", "session-summary"],
          state.session.id
        )
        await saveMems(directory, memsState)
      } catch {
        // Auto-mem failure is non-fatal
      }

      // Reset active.md to template
      await resetActiveMd(directory)

      // Create fresh brain state (new session, locked)
      const newSessionId = generateSessionId()
      const newState = createBrainState(newSessionId, config)
      await stateManager.save(lockSession(newState))

      // Count archives for output
      const archives = await listArchives(directory)

      return `Archived. ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files saved. ${archives.length} total archives. Session reset.`
    },
  })
}
