/**
 * Onboarding Logic for Session Lifecycle.
 *
 * Extracted from session-lifecycle.ts to keep the hook focused on
 * prompt compilation rather than onboarding state detection.
 */

import { readdir } from "fs/promises"
import { archiveSession, readActiveMd, resetActiveMd, updateIndexMd } from "./planning-fs.js"
import { createTree, saveTree } from "./hierarchy-tree.js"
import { createBrainState, generateSessionId, type BrainState } from "../schemas/brain-state.js"
import type { HiveMindConfig } from "../schemas/config.js"
import type { Logger } from "./logging.js"
import { queueStateMutation } from "./state-mutation-queue.js"

/**
 * Detect if the project is brownfield (has existing files) or greenfield (new project).
 */
export async function detectBrownfield(directory: string): Promise<boolean> {
  try {
    const files = await readdir(directory)
    const visibleFiles = files.filter(
      f => !f.startsWith(".") && f !== "hivemind" && f !== "node_modules" && f !== "bun.lockb" && f !== "package-lock.json"
    )
    return visibleFiles.length > 0
  } catch {
    return false
  }
}

/**
 * Generate the read-first block for clean state sessions.
 * Teaches the agent to scan before writing on new projects.
 */
export function generateReadFirstBlock(isBrownfield: boolean, _language: "en" | "vi"): string {
  const lines: string[] = []
  lines.push("<read-first>")

  if (isBrownfield) {
    lines.push("## EXPERT PROTOCOL: BROWNFIELD DETECTED")
    lines.push("")
    lines.push("I detect existing code in this directory. Based on SOT:")
    lines.push("1. **SCAN**: Run `scan_hierarchy({ action: \"analyze\" })` immediately to map the codebase.")
    lines.push("2. **INTEGRATE**: Identify where HiveMind fits (e.g., `docs/plans/`).")
    lines.push("3. **ADOPT**: Do not overwrite without reading. Use `read_file` to explore.")
    lines.push("4. **REALIGN**: If user flow is messy/no-command, route to `/hivefiver init` then `/hivefiver audit`.")
  } else {
    lines.push("## STATE: NEW PROJECT / GREENFIELD")
    lines.push("")
    lines.push("This is a clean state. Before ANY work:")
    lines.push("1. **SCAN**: Confirm environment.")
    lines.push("2. **PLAN**: Check `docs/plans/` or create one.")
    lines.push("3. **DECIDE**: Call `declare_intent({ mode, focus })`.")
    lines.push("4. **BOOTSTRAP**: Route to `/hivefiver init` when user does not provide a command.")
  }

  lines.push("")
  lines.push("Do NOT start writing code until you understand the structure.")
  lines.push("</read-first>")

  return lines.join("\n")
}

/**
 * Check if the session is in a clean state (new project, no hierarchy).
 */
export function isCleanSession(
  turnCount: number,
  hierarchy: { trajectory: string; tactic: string; action: string }
): boolean {
  return turnCount === 0 && !hierarchy.trajectory && !hierarchy.tactic && !hierarchy.action
}

/**
 * Handle stale session archival.
 * Returns { state, errorMessage } where errorMessage is set if archival failed.
 */
export async function handleStaleSession(
  state: BrainState,
  directory: string,
  log: Logger,
  config: HiveMindConfig
): Promise<{ state: BrainState; errorMessage?: string }> {
  try {
    const activeMd = await readActiveMd(directory)
    const archiveContent = [
      `# Auto-Archived (Stale): ${state.session.id}`,
      `**Reason**: Session idle > ${config.stale_session_days} days`,
      `**Mode**: ${state.session.mode}`,
      `**Last Activity**: ${new Date(state.session.last_activity).toISOString()}`,
      `**Archived**: ${new Date().toISOString()}`,
      `**Turns**: ${state.metrics.turn_count}`,
      "## Session Content",
      activeMd.body,
    ].filter(Boolean).join("\n")

    await archiveSession(directory, state.session.id, archiveContent)
    await updateIndexMd(directory, `[auto-archived: stale] ${state.session.id}`)
    await resetActiveMd(directory)

    const newState = createBrainState(generateSessionId(), config)
    queueStateMutation({
      type: "UPDATE_STATE",
      payload: newState,
      source: "session-lifecycle-hook:stale-auto-archive",
    })
    await saveTree(directory, createTree())

    await log.info(`Auto-archived stale session ${state.session.id}`)
    return { state: newState }
  } catch (archiveError) {
    await log.error(`Failed to auto-archive stale session: ${archiveError}`)
    return {
      state,
      errorMessage: `[HIVEMIND][AUTO-ARCHIVE FAILED] Stale session archival failed; session remains active. Reason: ${archiveError}`
    }
  }
}
